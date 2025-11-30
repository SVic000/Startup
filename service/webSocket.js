const { WebSocketServer } = require('ws');

function setupWebSocket(server, db) {
  const wss = new WebSocketServer({ server });
  
  // Track connections and queue
  const waitingPlayers = new Map();
  const connections = new Map();
  const gameWebSockets = new Map();
  const gameSetupStatus = new Map();

  // Helper to parse cookies
  function parseCookie(cookieString, name) {
    if (!cookieString) return null;
    const match = cookieString.match(new RegExp(`${name}=([^;]+)`));
    return match ? match[1] : null;
  }

  // Helper to generate game ID
  function generateGameID() {
    return 'game_' + Math.random().toString(36).substring(2, 9);
  }

  // Helper to send to opponent
  function sendToOpponent(gameID, senderWs, message) {
    connections.forEach((info, ws) => {
      if (info.gameID === gameID && ws !== senderWs && ws.readyState === 1) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  // ===== ONE CONNECTION HANDLER =====
  wss.on('connection', async (ws, req) => {
    console.log('Player connected');
    
    // Get user from auth cookie
    const cookies = req.headers.cookie;
    const token = parseCookie(cookies, 'token');
    let user = null;
    
    if (token) {
      user = await db.getUserByToken(token);
      console.log('User found:', user ? user.email : 'null');
    }
    
    // Store connection
    connections.set(ws, { user, gameID: null });
    
    ws.send(JSON.stringify({ type: 'connected' }));

    // ===== HANDLE MESSAGES =====
    ws.on('message', async (data) => {
      //console.log('Backend received raw message:', data.toString());
      const message = JSON.parse(data);
      // console.log('Backend parsed message:', message);
      const connInfo = connections.get(ws);
      
      switch (message.type) {
        case 'join-queue':
          console.log('Processing join-queue...');
          await handleJoinQueue(ws, connInfo);
          break;
        
        case 'leave-queue':
          waitingPlayers.forEach((value, key) => {
            if (value.ws === ws) waitingPlayers.delete(key);
          });
          break;

        case 'request-turn-change':
          // Player requests to end their turn
          await handleTurnChange(connInfo.gameID, connInfo.playerRole);
          break;
        
        case 'setup-complete':
          const gameID = connInfo.gameID;
          const role = connInfo.playerRole;

          if(!gameSetupStatus.has(gameID)) {
            gameSetupStatus.set(gameID, {player1Ready: false, player2Ready: false});
          }

          const status = gameSetupStatus.get(gameID);
          status[`${role}Ready`] = true;

          // Notify other player that they're done
          sendToOpponent(gameID, ws, {
            type: 'opponent-setup-complete',
          });

          //if both ready, start main game
          if (status.player1Ready && status.player2Ready) {
            const game = await db.getGame(gameID);
            const sockets = gameWebSockets.get(gameID);

            sockets.player1.send(JSON.stringify({
              type: 'setup-finished',
              yourTurn: game.currentTurn === 'player1'
            }));

            sockets.player2.send(JSON.stringify({
              type: 'setup-finished',
              yourTurn: game.currentTurn === 'player2'
            }));

            gameSetupStatus.delete(gameID);
          }
        break;
        
        case 'player-action':
          const game = await db.getGame(connInfo.gameID);
          const isTheirTurn = (connInfo.playerRole === game.currentTurn);

            if (message.action === 'draw') {
              sendToOpponent(connInfo.gameID, ws, {
                type: 'opponent-action',
                action: message.action,
                cardAsked: message.cardAsked,
                cardValue: message.cardValue,
                count: message.count
              });
              break;
  }
        
            if (!isTheirTurn && message.action === 'ask') {
              ws.send(JSON.stringify({ 
                type: 'error', 
                msg: 'Not your turn to ask!' 
              }));
              return;
            }

          if (!isTheirTurn && message.action !== 'give-card' && message.action !== 'go-fish-response') {
            // Only allow defensive actions
            ws.send(JSON.stringify({ 
              type: 'error', 
              msg: 'Not your turn!' 
            }));
            return;
          }

          sendToOpponent(connInfo.gameID, ws, {
            type: 'opponent-action',
            action: message.action,
            cardAsked: message.cardAsked,
            cardValue: message.cardValue,
            count: message.count
          });
          break;
          
        case 'draw-card':
          sendToOpponent(connInfo.gameID, ws, { 
            type: 'opponent-action', 
            action: 'draw' 
          });
          break;
          
        case 'ask-card':
          sendToOpponent(connInfo.gameID, ws, { 
            type: 'opponent-action', 
            action: 'ask', 
            cardAsked: message.cardValue 
          });
          break;
          
        case 'give-card':
          sendToOpponent(connInfo.gameID, ws, { 
            type: 'opponent-action', 
            action: 'give', 
            cardGiven: message.cardValue 
          });
          break;
        
        case 'i-made-pair':
          sendToOpponent(connInfo.gameID, ws, {
            type: 'made-pair'
          });
          break;
          
        case 'go-fish':
          sendToOpponent(connInfo.gameID, ws, { 
            type: 'opponent-action', 
            action: 'go-fish' 
          });
          break;
          
        case 'end-turn':
          sendToOpponent(connInfo.gameID, ws, { 
            type: 'opponent-action', 
            action: 'end-turn' 
          });
          break;
          
        case 'game-over':
          sendToOpponent(connInfo.gameID, ws, { 
            type: 'game-ended', 
            winner: message.winner 
          });
          await cleanupGame(connInfo.gameID);
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
    });

    // helper change turn function:
  async function handleTurnChange(gameID, currentPlayerRole) {
    const game = await db.getGame(gameID);
    if (!game) return;
    
    // Switch turns
    const newTurn = currentPlayerRole === 'player1' ? 'player2' : 'player1';
    await db.updateGame(gameID, { currentTurn: newTurn });
    
    // Get WebSockets from memory
    const sockets = gameWebSockets.get(gameID);
    if (!sockets) return;
    
    const player1WS = sockets.player1;
    const player2WS = sockets.player2;
    
    if (player1WS && player1WS.readyState === 1) {
      player1WS.send(JSON.stringify({
        type: 'turn-update',
        yourTurn: newTurn === 'player1'
      }));
    }
    
    if (player2WS && player2WS.readyState === 1) {
      player2WS.send(JSON.stringify({
        type: 'turn-update',
        yourTurn: newTurn === 'player2'
      }));
    }
  }
    

    // ===== DISCONNECT =====
    ws.on('close', async () => {
      console.log('Player disconnected');
      const connInfo = connections.get(ws);
      
      // Remove from queue
      waitingPlayers.forEach((value, key) => {
        if (value.ws === ws) waitingPlayers.delete(key);
      });
      
      // Notify opponent and cleanup
      if (connInfo && connInfo.gameID) {
        sendToOpponent(connInfo.gameID, ws, { type: 'opponent-disconnected' });
        await cleanupGame(connInfo.gameID);
      }
      
      connections.delete(ws);
    });

// ===== HELPER: JOIN QUEUE =====
// ===== HELPER: JOIN QUEUE =====
async function handleJoinQueue(ws, connInfo) {
  console.log('handleJoinQueue called, user:', connInfo?.user?.email);
  
  if (!connInfo.user) {
    console.log('❌ User not authenticated');
    ws.send(JSON.stringify({ type: 'error', msg: 'Not authenticated' }));
    return;
  }
  
  // Check if user has an existing game and clean it up
  if (connInfo.user.gameID) {
    console.log('User has existing gameID:', connInfo.user.gameID);
    
    try {
      const existingGame = await db.getGame(connInfo.user.gameID);
      
      if (existingGame) {
        console.log('Cleaning up existing game before joining queue');
        
        // Notify opponent if they're still connected
        sendToOpponent(connInfo.user.gameID, ws, { 
          type: 'opponent-disconnected',
          reason: 'rejoined-queue'
        });
        
        // Cleanup the game
        await cleanupGame(connInfo.user.gameID);
      } else {
        console.log('Game not found in DB, just clearing user reference');
      }
    } catch (err) {
      console.error('Error checking/cleaning existing game:', err);
    }
    
    // Clear the gameID from user and connection
    connInfo.user.gameID = null;
    await db.updateUser(connInfo.user);
    connInfo.gameID = null;
  }
  
  console.log('Sending queue-joined message');
  ws.send(JSON.stringify({ type: 'queue-joined' }));
  
  if (waitingPlayers.size > 0) {
    console.log('Match found! Checking for valid opponent...');
    const [waitingId, waitingData] = waitingPlayers.entries().next().value;
    
    // Prevent matching with yourself
    if (waitingData.user.email === connInfo.user.email) {
      console.log('Same user tried to match with themselves, staying in queue');
      const queueId = generateGameID();
      waitingPlayers.set(queueId, { ws, user: connInfo.user });
      return;
    }
    
    console.log('Valid opponent found! Pairing players...');
    waitingPlayers.delete(waitingId);
    
    const gameID = generateGameID();
    const gameDeck = [1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9];
    const starterIsPlayer1 = Math.random() < 0.5;
    
    const game = {
      gameID: gameID,
      isMultiplayer: true,
      hasStarted: true,
      currentTurn: starterIsPlayer1 ? 'player1' : 'player2',
      gamePhase: 'setup',
      deck: gameDeck,
      players: {
        player1: { email: waitingData.user.email },
        player2: { email: connInfo.user.email }    
      }
    };

    await db.addGame(game);

    gameWebSockets.set(gameID, {
      player1: waitingData.ws,
      player2: ws
    });
    
    // Link both users to this game
    waitingData.user.gameID = gameID;
    connInfo.user.gameID = gameID;
    await db.updateUser(waitingData.user);
    await db.updateUser(connInfo.user);
    
    // Update connection info
    connections.get(waitingData.ws).gameID = gameID;
    connections.get(waitingData.ws).playerRole = 'player1';
    connections.get(ws).gameID = gameID;
    connections.get(ws).playerRole = 'player2';
    
    // Notify both players
    waitingData.ws.send(JSON.stringify({
      type: 'match-found',
      opponent: { username: connInfo.user.email, cat: connInfo.user.cat || "Frank" },
      gameID: gameID
    }));
    
    ws.send(JSON.stringify({
      type: 'match-found',
      opponent: { username: waitingData.user.email, cat: waitingData.user.cat || "Frank" },
      gameID: gameID
    }));
    
    // Tell them who starts
    setTimeout(() => {
      waitingData.ws.send(JSON.stringify({ 
        type: 'game-start', 
        yourTurn: starterIsPlayer1,
        gamePhase: 'setup'
      }));
      ws.send(JSON.stringify({ 
        type: 'game-start', 
        yourTurn: !starterIsPlayer1,
        gamePhase: 'setup'
      }));
    }, 1000);
    
  } else {
    console.log('No waiting players, adding to queue');
    const queueId = generateGameID();
    waitingPlayers.set(queueId, { ws, user: connInfo.user });
  }
}

    // ===== HELPER: CLEANUP GAME =====
    async function cleanupGame(gameID) {
      if (!gameID) return;
      
      try {
        const game = await db.getGame(gameID);
        if (!game) return;
        
        // Unlink both players
        if (game.players?.player1?.email) {
          const p1 = await db.getUser(game.players.player1.email);
          if (p1) {
            p1.gameID = null;
            await db.updateUser(p1);
          }
        }
        
        if (game.players?.player2?.email) {
          const p2 = await db.getUser(game.players.player2.email);
          if (p2) {
            p2.gameID = null;
            await db.updateUser(p2);
          }
        }
        
        // Delete game
        await db.deleteGame(gameID);
        
        // Clear gameID from all connections
        connections.forEach((info) => {
          if (info.gameID === gameID) {
            info.gameID = null;
          }
        });
        
      } catch (err) {
        console.error('Error cleaning up game:', err);
      }
    }
  });
  
  return wss;
}

module.exports = { setupWebSocket };