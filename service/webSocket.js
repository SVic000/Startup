const { WebSocketServer } = require('ws');

function setupWebSocket(server, db) {
  const wss = new WebSocketServer({ server });
  
  // Track connections and queue
  const waitingPlayers = new Map();  // oderlying oderlying oderlying oderlying oderlying id -> { ws, user }
  const connections = new Map();     // ws -> { user, gameID }

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

  wss.on('connection', async (ws, req) => {
    console.log('Player connected');
    
    // Get user from auth cookie
    const cookies = req.headers.cookie;
    const token = parseCookie(cookies, 'token');
    let user = null;
    
    if (token) {
      user = await db.getUserByToken(token);
    }
    
    // Store connection
    connections.set(ws, { user, gameID: null });
    
    ws.send(JSON.stringify({ type: 'connected' }));

    // ===== HANDLE MESSAGES =====
    ws.on('message', async (data) => {
      const message = JSON.parse(data);
      const connInfo = connections.get(ws);
      
      switch (message.type) {
        
        // ===== JOIN QUEUE =====
        case 'join-queue':
          await handleJoinQueue(ws, connInfo);
          break;
        
        // ===== LEAVE QUEUE =====
        case 'leave-queue':
          waitingPlayers.forEach((value, key) => {
            if (value.ws === ws) waitingPlayers.delete(key);
          });
          break;
        
        // ===== GAME ACTIONS =====
        case 'player-action':
          sendToOpponent(connInfo.gameID, ws, {
            type: 'opponent-action',
            action: message.action,
            ...message.data
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
          // Clean up game
          await cleanupGame(connInfo.gameID);
          break;
      }
    });

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
    async function handleJoinQueue(ws, connInfo) {
      if (!connInfo.user) {
        ws.send(JSON.stringify({ type: 'error', msg: 'Not authenticated' }));
        return;
      }
      
      ws.send(JSON.stringify({ type: 'queue-joined' }));
      
      if (waitingPlayers.size > 0) {
        // Someone is waiting! Create a match
        const [waitingId, waitingData] = waitingPlayers.entries().next().value;
        waitingPlayers.delete(waitingId);
        
        // Create shared game in database
        const gameID = generateGameID();
        const gameDeck = [1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9];
        const starterIsPlayer1 = Math.random() < 0.5;
        
        const game = {
          gameID: gameID,
          isMultiplayer: true,
          hasStarted: true,
          whosTurn: starterIsPlayer1 ? 0 : 1,
          gamePhase: 'setup',
          deck: gameDeck,
          players: {
            player1: { email: waitingData.user.email },
            player2: { email: connInfo.user.email }
          }
        };
        
        await db.addGame(game);
        
        // Link both users to this game
        waitingData.user.gameID = gameID;
        connInfo.user.gameID = gameID;
        await db.updateUser(waitingData.user);
        await db.updateUser(connInfo.user);
        
        // Update connection info
        connections.get(waitingData.ws).gameID = gameID;
        connections.get(ws).gameID = gameID;
        
        // Notify player 1 (waiting player)
        waitingData.ws.send(JSON.stringify({
          type: 'match-found',
          opponent: { username: connInfo.user.email },
          gameID: gameID
        }));
        
        // Notify player 2 (current player)
        ws.send(JSON.stringify({
          type: 'match-found',
          opponent: { username: waitingData.user.email },
          gameID: gameID
        }));
        
        // Tell them who starts (after short delay)
        setTimeout(() => {
          waitingData.ws.send(JSON.stringify({ 
            type: 'game-start', 
            yourTurn: starterIsPlayer1 
          }));
          ws.send(JSON.stringify({ 
            type: 'game-start', 
            yourTurn: !starterIsPlayer1 
          }));
        }, 1000);
        
      } else {
        // No one waiting, add to queue
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