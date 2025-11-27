import React, { useState, useEffect, useRef} from 'react';
import { useNavigate } from 'react-router-dom';
import { GameService } from './GameService';
import { OpponentManager } from './OpponentManager';
import './play.css';

export function Play() {
  const navigate = useNavigate();

  // ===== Game Mode Selection (frank or person?) ====== 
  const [gameMode, setGameMode] = useState(null); // null | ai | multiplayer
  const [gameState, setGameState] = useState('mode_select') // mode_select | waiting | setup | main | end

  // ======= Game Managers ======
  const [gameService, setGameService] = useState(null);
  const gameServiceRef = useRef(null);
  const [opponentManager, setOpponentManager] = useState(null);
  const [gameID, setGameID] = useState(null);
  const [opponentName, setOpponentName] = useState('Frank');
  const [socket, setSocket] = useState(null); // websocket!

  // ====== Game State =======
  const [current_turn, setCurrentTurn] = useState(null); // player | opponent
  const [firstDrawer, setFirstDrawer] = useState(null); // 'player' | 'opponent' - who drew first in setup
  const hasStartedFrankSetup = useRef(false);
  const [playerSetup, setPlayerSetup] = useState(false);
  const [opponentSetup, setOpponentSetup] = useState(false);
  const [askedQuestion, setAskedQuestion] = useState(0); // 0 | 1
  const [drawCount, setDrawCount] = useState(0); // limits players draw amounts
  const [availDeck, setAvailDeck] = useState(true);

  // ====== Hands & Pairs =========
  const [playerHand, setPlayerHand] = useState([]);
  const playerHandRef = useRef([]);
  const [opponentHand, setOpponentHand] = useState([]);
  const opponentHandRef = useRef([]);
  const [opponentPairs, setOpponentPair] = useState(0);
  const [playerPairs, setPlayerPair] = useState(0);

  // ====== UI States ========
  const [selectedCards, setSelectedCards] = useState([]); // which cards the player is selecting
  const [selectedCardForAsk, setSelectedCardForAsk] = useState(null); // just one card selected, you can ask a question on that card
  const [opponentQuestion, setOpponentQuestion] = useState(null); // what Ai/Opponent is asking player 
  const [goFishContext, setGoFishContext] = useState(null); // Whether the go fish is for you or them 
  const [message, setMessage] = useState(''); // guides player
  const [opponentWords, setOpponentWords] = useState(''); // Hard coded opponent words
  const [opponentCatFace, setOpponentCatFace] = useState('Frank') // go to db and see what people have picked!
  const [catFace, setcatFace] = useState('Default') // Default | No | Shocked | Annoyed | Excited | GameEnd

  // ========= Mode selection handlers ===========
async function handleSelectAI() {
  setGameMode('ai');
  setGameState('setup');

  hasStartedFrankSetup.current = false;

  const service = new GameService(null, false);
  gameServiceRef.current = service;
  setGameService(service);

  const newGameID = await service.createGame();

  if (!newGameID) {
    setMessage('Failed to create game. Are you logged in?');
    setGameState('mode_select');
    return;
  }

  setGameID(newGameID);
  const oppManager = new OpponentManager('ai', service);
  setOpponentManager(oppManager);

  const starter = Math.floor(Math.random() * 2);
  if (starter === 0) {
    setMessage('You start! Draw 3 cards.');
    setCurrentTurn('player');
    setFirstDrawer('player');
  } else {
    setMessage(`${opponentName} starts! He's drawing 3 cards!`);
    setCurrentTurn('opponent');
    setFirstDrawer('opponent');
    startOpponentSetupDraw(service, () => {
      setOpponentSetup(true);
    });
  }
}

async function handleSelectMultiplayer() {
  setGameMode('multiplayer');
  setGameState('waiting');
  setMessage('Looking for an opponent...');
  
  const wsUrl = 'ws://localhost:3000';
  
  const newSocket = new WebSocket(wsUrl);
  setSocket(newSocket);
  
  let hasReceivedConnected = false;
  
  newSocket.onopen = () => {
    console.log('WebSocket connected!');
    console.log('Socket readyState:', newSocket.readyState);
    // Don't send join-queue here - wait for 'connected' message from server
  };
  
  newSocket.onmessage = (event) => {
    const message = JSON.parse(event.data);
  
    if (message.type === 'connected' && !hasReceivedConnected) {
      hasReceivedConnected = true;
      newSocket.send(JSON.stringify({ type: 'join-queue' }));
      return;
    }
    
    switch (message.type) {
      case 'queue-joined':
        setMessage('In queue, waiting for opponent...');
        break;
        
      case 'match-found':
        startMultiplayerGame(message.opponent, message.gameID, newSocket);
        break;
        
      case 'game-start':
        if (message.yourTurn) {
          setMessage('You start! Draw 3 cards.');
          setCurrentTurn('player');
          setFirstDrawer('player');
        } else {
          setMessage("Opponent starts! They're drawing cards...");
          requestTurnChange();
          setFirstDrawer('opponent');
        }
        break;

      case 'opponent-action':
        handleOpponentAction(message);
        break;
        
      case 'error':
        console.error('Error from server:', message.msg);
        setMessage(message.msg);
        setGameState('mode_select');
        break;

      case 'turn-update':
        console.log('🔄 Turn update from server:', message.yourTurn);
        setCurrentTurn(message.yourTurn ? 'player' : 'opponent');
        if (message.yourTurn) {
          setMessage('Your turn!');
        } else {
          setMessage(`${opponentName}'s turn...`);
        }
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  };
  
  newSocket.onerror = (error) => {
    console.error('WebSocket error:', error);
    setMessage('Connection error. Try again?');
    setGameState('mode_select');
  };
  
  newSocket.onclose = (event) => {
    console.log('WebSocket closed:', event.code, event.reason);
  };
}
  function cancelQueue() {
  if (socket) {
    socket.send(JSON.stringify({ type: 'leave-queue' }));
    socket.close();
    setSocket(null);
  }
  setGameState('mode_select');
  setMessage('Choose your opponent!');
}

useEffect(()=> {
  console.log(opponentHand)})

  function startMultiplayerGame(opponent, matchGameID) {
    setGameState('setup');
    setMessage(`Matched with ${opponent.username}! Game starting...`);

    setOpponentCatFace(opponent.cat);
    
    const service = new GameService(matchGameID, true);
    gameServiceRef.current = service;
    setGameID(matchGameID);
    setGameService(service);
    setOpponentManager(new OpponentManager('human', service, socket));
    setOpponentName(opponent.username);
  }
  
  function requestTurnChange() {
    if (gameMode === 'multiplayer' && socket && socket.readyState === 1) {
      socket.send(JSON.stringify({
        type: 'request-turn-change'
      }));
    } else {
      // AI mode: change locally
      setCurrentTurn('opponent');
    }
  }

function handleOpponentActionDraw() {
    setOpponentHand(prev => [...prev, 'hidden']);
  
    if (gameState === 'setup' && opponentHand.length + 1 === 3 && playerHand.length === 3) {
      setTimeout(() => {
        setMessage('Both players have cards! Time to fish!');
        setGameState('main');
        setCurrentTurn(firstDrawer || 'player');
      }, 500);
    }
}
function handleOpponentActionAsk() {
      setOpponentQuestion(message.cardAsked);
      setMessage(`${opponentName} asks: Do you have any ${message.cardAsked}s?`);
      setAskedQuestion(1);
      
      // Add dialogue
      if (opponentManager) {
        setOpponentWords(opponentManager.getDialogue('ask', message.cardAsked));
      }
      setcatFace('Default');
      
      const hasCard = playerHand.includes(message.cardAsked);
      
      if (hasCard) {
        setTimeout(() => {
          setMessage(`Click your ${message.cardAsked} to give it to ${opponentName}`);
        }, 1000);
      } else {
        setTimeout(() => {
          setGoFishContext('opponent-ask');
        }, 1500);
      }
}
function handleOpponentActionGiveCard() {
      const cardReceived = message.cardValue;
      const count = message.count || 1;
      
      setPlayerHand(prev => [...prev, ...Array(count).fill(cardReceived)]);
      setOpponentHand(prev => prev.slice(count));
      
      setMessage(`${opponentName} gave you ${count} ${cardReceived}(s)!`);
      
      // Add dialogue - they're sad about losing cards
      if (opponentManager) {
        setOpponentWords(opponentManager.getDialogue('lost_card', cardReceived));
      }
      setcatFace('Annoyed');
      
      setSelectedCardForAsk(null);
      setAskedQuestion(0);
      setGoFishContext(null);
      
      setTimeout(() => {
        setMessage('Select a card to ask or make pairs!');
        setcatFace('Default');
      }, 1500);
}

function handleOpponentActionGoFishResponse() {
  setMessage(`${opponentName} says: Go Fish! Drawing a card...`);
  
  if (opponentManager) {
    setOpponentWords(opponentManager.getDialogue('no_card', selectedCardForAsk));
  }
  setcatFace('No');
  setSelectedCardForAsk(null);
  
  // Multiplayer: Draw and wait for server confirmation
  handleDraw().then(() => {
    setTimeout(() => {
      setAskedQuestion(0);
      setMessage(`${opponentName}'s turn!`);
      setcatFace('Default');
      setOpponentWords('');
      // Server will send 'turn-update' to confirm
    }, 800);
  });

}

function handleOpponentAction(message) {
  switch (message.action) {
    case 'draw':
      handleOpponentActionDraw();
      break;

    case 'ask':
      handleOpponentActionAsk();
      break;
      
    case 'give-card':
      handleOpponentActionGiveCard();
      break;
        
    case 'go-fish-response':
      handleOpponentActionGoFishResponse();
      setTimeout(()=> { setcatFace('Default')}, 2000);
      break;
    default:
      console.log('Unknown opponent action:', message.action);
  }
}

  // ===== SETUP PHASE =====  
function startOpponentSetupDraw(service, onComplete) {
  let draws = 0;
  async function drawLoop() {
    if (draws < 3) {
      await opponentDrawWithService(service);
      draws++;
      setTimeout(drawLoop, 900);
    } else {
      if (onComplete) {
        onComplete();
      }
    }
  }
  drawLoop();
}

async function opponentDrawWithService(service) {
  if (!service) return;

  const currentHand = opponentHandRef.current;
  const {newHand, deckEmpty} = await service.draw(currentHand);
  
  if (newHand) {
    opponentHandRef.current = newHand; 
    setAvailDeck(!deckEmpty);  
    setOpponentHand(newHand);
  }
}
  
async function handleDraw() {
  const service = gameServiceRef.current;
  if (!availDeck || !service) return;

  const currentHand = playerHandRef.current;
  const { newHand, deckEmpty } = await service.draw(currentHand);
  
  if (newHand) {
    playerHandRef.current = newHand;
    setPlayerHand(newHand);
    setAvailDeck(!deckEmpty);
    
    // Notify opponent in multiplayer
    if (gameMode === 'multiplayer' && socket && socket.readyState === 1) {
      console.log('📤 Notifying opponent of draw');
      socket.send(JSON.stringify({
        type: 'player-action',
        action: 'draw'
      }));
    }
  }

  if (gameState === 'setup' && playerHandRef.current.length !== 3) {
    setDrawCount(prev => prev + 1);
    
    // After 3rd draw in setup, tell opponent it's their turn NOW
    if (newHand && newHand.length === 3) {
      console.log('✅ Finished my 3 draws in setup');
      setPlayerSetup(true);
      
      if (gameMode === 'multiplayer' && socket && socket.readyState === 1) {
        // Tell opponent: YOUR TURN NOW
        socket.send(JSON.stringify({
          type: 'request-turn-change',
          newTurn: 'opponent' // From opponent's perspective
        }));
      }
    }
  } else {
    setDrawCount(1);
  }

  if (goFishContext === 'player-ask') {
    setSelectedCardForAsk(null);
    setGoFishContext(null);
    setAskedQuestion(0);
    
    if (gameMode === 'multiplayer') {
      requestTurnChange();
    } else {
      setCurrentTurn('opponent');
    }
    
    setMessage(`${opponentName}'s turn...`);
  }
}

  async function opponentDraw() {
    if (!availDeck || !gameService) return;
    
    const { newHand, deckEmpty } = await gameService.draw(opponentHandRef.current);
    opponentHandRef.current = newHand;
    setAvailDeck(!deckEmpty);
    setOpponentHand(newHand);
  }

  // ========= Player Actions ===========
  function handleCardClick(cardValue, index) {
    if (current_turn !== 'player' || gameState !== 'main') return;
    if (selectedCardForAsk) return;

    const isAlreadySelected = selectedCards.some(selected => selected.index === index);
    if (isAlreadySelected) {
      setSelectedCards(selectedCards.filter(selected => selected.index !== index))
      return;
    }
    const newSelection = [...selectedCards, {value: cardValue, index}];

    if(newSelection.length == 2) {
      setSelectedCards(newSelection);
      checkForPair(newSelection);
    } else {
      setSelectedCards(newSelection)
    }
  }

  function checkForPair(selection) {
    const [card1, card2] = selection;
    
    if (card1.value === card2.value) {
      setPlayerPair(prev => prev + 1);
      setMessage('You caught a fish! Nice Pair!');
      
      const newHand = playerHand.filter((_, i) => i !== card1.index && i !== card2.index);
      setPlayerHand(newHand);
      setSelectedCards([]);
      
      setTimeout(() => {
        if (gameState === 'main' && askedQuestion === 0) {
          setMessage(`Select a card to ask ${opponentName}!`);
        }
      }, 1500);
    } else {
      setMessage("Not a match! Keep fishing!");
      setTimeout(() => setSelectedCards([]), 1000);
    }
  }

function handleAskAboutSelectedCard() {
  if (selectedCards.length !== 1 || !gameService) return;

  const selectedCardValue = selectedCards[0].value;
  setSelectedCardForAsk(selectedCardValue);
  setAskedQuestion(1);
  setSelectedCards([]);

  // MULTIPLAYER MODE
  if (gameMode === 'multiplayer') {
    setMessage(`You asked for ${selectedCardValue}s. Waiting for response...`);
    
    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify({
        type: 'player-action',
        action: 'ask',
        cardAsked: selectedCardValue
      }));
    }
    return; // Exit early - response comes via handleOpponentAction
  }

  // ========== BOT MODE ONLY BELOW ==========
  setOpponentWords(' . . . ');
  
  setTimeout(() => {
    const result = gameService.askForCard(playerHand, opponentHand, selectedCardValue);
    
    if (result.success) {
      // Got cards from bot
      setPlayerHand(result.newAskingHand);
      setOpponentHand(result.newReceivingHand);
      setMessage(`You got ${result.cardsTransferred} ${selectedCardValue}(s)!`);
      
      setcatFace('Shocked');
      setOpponentWords(opponentManager.getDialogue('lost_card', selectedCardValue));
      setTimeout(() => setcatFace("Annoyed"), 900);
      
      setSelectedCardForAsk(null);
      
    } else {
      // Bot says "go fish"
      setMessage(`No ${selectedCardValue}s. Go Fish!`);
      setOpponentWords(opponentManager.getDialogue('no_card', selectedCardValue));
      setcatFace('No');
      
      setTimeout(() => {
        setGoFishContext('player-ask'); // Triggers draw button
      }, 700);
    }
  }, 1000);
}

// =========== opponent moves! ==================
async function opponentTakeTurn() {
  if (!opponentManager || !gameService) return;

  if (opponentHand.length=== 0 && availDeck) {
    setMessage(`${opponentName} draws a card...`);
    await opponentDraw();
    setTimeout(()=> opponentAsk(), 1000);
    return;
  }

  if (opponentHand.length===0 && !availDeck) {
    setCurrentTurn('player');
    setAskedQuestion(0);
    setMessage('Your turn!');
    return;
  }

  await opponentAsk();
}

async function opponentAsk() {
  if (!opponentManager) return;
  
  const move = await opponentManager.getOpponentMove(opponentHand, playerHand);
  
  if (move.action === 'no_cards') {
    setCurrentTurn('player');
    setMessage('Your turn!');
    return;
  }
  
  const cardToAsk = move.cardAsked;
  setOpponentQuestion(cardToAsk);
  setMessage(`${opponentName} is asking a question`);
  
  const dialogue = opponentManager.getDialogue('ask', cardToAsk);
  setOpponentWords(dialogue);
  setcatFace('Default');
  
  setAskedQuestion(1);
  setTimeout(() => setGoFishContext('opponent-ask'), 1500);
}

function handleGiveCardToOpponent(cardValue) {
  if (current_turn !== 'opponent' || !opponentQuestion || !gameService) return;

  if (cardValue === opponentQuestion) {
    const count = playerHand.filter(card => card === cardValue).length;
    const newHand = playerHand.filter(card => card !== cardValue);
    setPlayerHand(newHand);
    
    if (gameMode === 'multiplayer' && socket && socket.readyState === 1) {
      socket.send(JSON.stringify({
        type: 'player-action',
        action: 'give-card',
        cardValue: cardValue,
        count: count
      }));
    }
    
    if (gameMode === 'ai') {
      const result = gameService.askForCard(opponentHand, playerHand, cardValue);
      setOpponentHand(result.newAskingHand);
    }
    
    setOpponentQuestion(null);
    setMessage(`You gave ${count} ${cardValue}(s) to ${opponentName}`);
    
    if (opponentManager) {
      setOpponentWords(opponentManager.getDialogue('got_card', cardValue));
    }
    setcatFace('Excited');
    
    setSelectedCards([]);
    setAskedQuestion(0);

    setTimeout(() => {
      setCurrentTurn('player');
      setcatFace('Default');
      setOpponentWords('');
      setMessage('Your turn!');
    }, 1500);
  }
}

function handleOpponentGoFish() {
  setMessage(`Go fish! ${opponentName} will draw a card.`);
  
  // MULTIPLAYER: Tell opponent to go fish
  if (gameMode === 'multiplayer' && socket && socket.readyState === 1) {
    socket.send(JSON.stringify({
      type: 'player-action',
      action: 'go-fish-response',
      cardAsked: opponentQuestion
    }));
  }
  
  // Frank
  setOpponentWords(opponentManager.getDialogue('go_fish'));
  setcatFace('Annoyed');
  if(gameMode === 'ai') {
    opponentDraw();
  }
  
  setOpponentQuestion(null);
  setGoFishContext(null);
  setAskedQuestion(0);


    setTimeout(() => {
      if (gameMode === 'multiplayer') {
        setMessage(`Waiting for ${opponentName} to draw...`);
        // They'll send turn-change when ready
      } else {
        setCurrentTurn('player');
        setcatFace('Default');
        setMessage('Your turn!');
        setOpponentWords('');
      }
    }, 1200);
}
// ====== opponent pair checking =========

function checkOpponentPairs() {
  if(!gameService || gameState === 'setup') return;
  if(gameMode === 'multiplayer') return;
  if(current_turn !== 'opponent') return;

  const result = gameService.checkHandForPairs(opponentHand);

  if(result.pairsFound > 0) {
    setOpponentHand(result.newHand);
    setOpponentPair(prev => prev + result.pairsFound);
  }
}

// ========== GAME END =========
  function handleGameEnd() {
    if(gameState === 'end' || !gameService) return;

    setGameState('end');
    setCurrentTurn(null);

    setcatFace('GameEnd');

    const winner = gameService.determineWinner(playerPairs, opponentPairs);

    if (winner === 'player') {
      setMessage("You won! Greatest fisher here!");
      setOpponentWords(opponentManager.getDialogue('game_end_lose'));
      gameService.updatePlayerScore(1);
    } else if (winner === 'opponent') {
      setMessage(`${opponentName} won! An amazing battle!`);
      setOpponentWords(opponentManager.getDialogue('game_end_win'));
      gameService.updatePlayerScore(0);
    } else {
      setMessage("It's a tie! What an intense match!");
      setOpponentWords(opponentManager('game_end_tie'));
      gameService.updatePlayerScore(0);
    }
    gameService.deleteGame();
    setcatFace('GameEnd');
  }
  // USE EFFECTS ==================

    // update opponent hand ref
    useEffect (() => {
      opponentHandRef.current = opponentHand;
    }, [opponentHand]);

    // update player hand ref
    useEffect(() => {
      playerHandRef.current = playerHand;
    }, [playerHand]);

    // check opponent pairs
    useEffect(()=> {
      if(gameState === 'main') {
        checkOpponentPairs();
      }
    }, [opponentHand, gameState]);


    // set up phase completion
    // for multiplayer
    useEffect(() => {
      if (gameState !== 'setup') return;
      if (!playerSetup || !opponentSetup) return;

      const playerReady = playerHand.length === 3;
      const opponentReady = opponentHand.length === 3;
      
      // Both players have 3 cards → transition to main
      if (playerReady && opponentReady) {
        setMessage("Both players have cards! Time to fish!");
        setGameState('main');
        setCurrentTurn(firstDrawer || 'player');
        return;
      }   


    }, [gameState, firstDrawer, gameMode]);

    //setup for Frank
    useEffect(() => {
      if(gameMode !== 'ai') return;
      if(gameState !== 'setup') return;
      if (hasStartedFrankSetup.current) return; // will return since Frank drew cards
      if (!opponentSetup && opponentHand.length === 0 && current_turn === 'opponent') {
        hasStartedFrankSetup.current = true;
        setMessage(`${opponentName}'s drawing his cards...`);
        setCurrentTurn('opponent');  
        startOpponentSetupDraw(gameServiceRef.current, ()=> {
        setOpponentSetup(true);
        });
      if (!playerSetup && playerHand.length === 0 && current_turn === 'player') {
        handleDraw();
      }
      }
    }, [gameState, gameMode, playerHand.length, opponentHand.length])

    useEffect(()=> {
      if(gameState !== 'setup') return;
      if(playerSetup && opponentSetup) { // Frank and you done
        setMessage("Both players have cards! Time to fish!");
        setGameState('main');
        setCurrentTurn(firstDrawer || 'player');
      }
    }, [playerSetup, opponentSetup])
  
    // Opponent's turn in main game
    useEffect(() => {
      if(gameState === 'main' && current_turn === 'opponent' && askedQuestion === 0) {
        setTimeout(() => opponentTakeTurn(), 1000)
      }
    }, [current_turn, gameState, gameMode])

    // check if the game has ended 
    useEffect(()=> {
      if (gameState === 'main' && gameService) {
        const endCheck = gameService.checkGameEnd(
          playerPairs,
          opponentPairs,
          !availDeck,
          playerHand.length,
          opponentHand.length
        );

        if (endCheck.gameOver) {
          handleGameEnd();
        }
      }
    }, [gameState, playerPairs, opponentPairs, availDeck, playerHand.length, opponentHand.length]);

  // =========== RENDERs ========
  if (gameState === 'mode_select') {
    return (
      <main className="mode-select-container">
        <h1>Choose Your Opponent</h1>
        <div className="mode-buttons">
          <button className="mode-btn" onClick={handleSelectAI}>
            <h2>🤖 Play vs Frank (AI)</h2>
            <p>Practice against the computer</p>
          </button>
          <button className="mode-btn" onClick={handleSelectMultiplayer}>
            <h2>👥 Play vs Player</h2>
            <p>Compete against another human</p>
          </button>
        </div>
      </main>
    );
  }

  if (gameState === 'waiting') {
    return (
      <main className="waiting-container">
        <h1>Finding an opponent...</h1>
        <div className="spinner">🎣</div>
        <p>{message}</p>
        <button onClick={() => {
          setGameState('mode_select');
          setMessage('Choose your opponent!');
        }}>
          Cancel
        </button>
      </main>
    );
  }
    
  return (
    <main>
      {gameState === 'end' && ( 
      <div className="top-menu">
        <button
          id = 'menu-button'
          type="button"
          className="btn btn-light input-group-text"
          onClick={() => navigate('/menu')}
        >
          <b>Return to Menu</b>
        </button>
      </div>)}

      <div className='text-center'>
      <p id="turn" className={current_turn === 'player' ? "message_you" : "message_them"}><b>
        {current_turn === 'player' ? "YOUR TURN" : "OPPONENT'S TURN"}</b>
      </p>
      <b className="narrator">{message}</b>
      </div>

      <div className='text-center' id='frankswords'> {opponentWords} </div>

      <div className="pair-container">
        <div className="pair">
          <p className="text-center">
            Your Pairs <br />
            {Array.from({length: playerPairs}, (_, i) => (
              <span className="dots" key={i}>●</span>
            ))}
          </p>
        </div>

        <div className="pair picture-box">
          <img id="cat" width = '400' src={`/${opponentCatFace}${catFace}.PNG`} alt={`${catFace} expression`}/>
        </div>

        <div className="pair">
          <p className="text-center">
            Opponent Pairs < br/> 
            {Array.from({length: opponentPairs}, (_, i) => (
              <span className='dots' key={i}>●</span>
            ))}
          </p>
        </div>
      </div>

      <div className="button-holder">
        {/* Ask Button */}
        {current_turn === 'player' && 
        gameState === 'main' && 
        selectedCards.length === 1 &&  
        selectedCardForAsk === null &&  
        !opponentQuestion && askedQuestion === 0 && 
        playerHand.length > 0 && 
        drawCount && (
          <button 
            id="ask" 
            onClick={handleAskAboutSelectedCard}
          >
            Ask About {selectedCards[0].value}
          </button>
        )}
        {/* DRAW BUTTON */}
        {(gameState === 'setup' || 
          (playerHand.length === 0 && askedQuestion === 0 && availDeck && gameState === 'main')) && 
          current_turn === 'player' && (
          <button 
            id="draw"
            onClick={handleDraw}
            disabled={playerHand.length >= 3 && gameState === 'setup'}
          >
            <b>Draw</b>
          </button>
        )}
        
        {/* GO FISH PLAYER BUTTON */}
        {gameState === 'main' && goFishContext === 'player-ask' && current_turn === 'player' && availDeck && (
          <button 
            id="go-fish"
            onClick={handleDraw}
          >
            <b>Draw a Fish!</b>
          </button>
        )}

        {/* Cancel Ask Button */}
        {current_turn === 'player' && selectedCardForAsk !== null && askedQuestion === 0 && (
          <button id="cancel-ask" onClick={() => {
            setSelectedCardForAsk(null);
            setMessage("Your turn");
            setOpponentWords('');
            setGoFishContext(null);
          }}>
            Cancel Ask
          </button>
        )}
        
        {/* GO FISH TO OPPONENT BUTTON */}
        {current_turn === 'opponent' && goFishContext === 'opponent-ask' && catFace !== 'Excited' &&  !playerHand.includes(opponentQuestion) && (
          <div className="response-buttons">           
            <button 
              id="go-fish-opponent" 
              className="btn-warning"
              onClick={handleOpponentGoFish}
            >
              Go Fish!
            </button>
          </div>
        )}
        
        {/* End Turn Button */}
        {(current_turn === 'player' && gameState === 'main' && 
          ((selectedCardForAsk === null && askedQuestion !== 0) || 
           (playerHand.length === 0 && !availDeck))) && (
          <button id="end-turn" onClick={() => {
            requestTurnChange();
            setAskedQuestion(0);
            setMessage(`${opponentName}'s turn...`);
            setSelectedCards([]);
            setcatFace('Default');
            setOpponentWords('. . .');
          }}>
            End Turn
          </button>
        )}
      </div>

      <div>
        <div className="card-container">
          {playerHand.map((card, index) => {
            const isSelected = selectedCards.some(selected => selected.index === index);
            const isQuestioned = opponentQuestion === card;
            return (
              <button
                key={index}
                className={
                  `card 
                  card-${card} 
                  ${isSelected ? 'card-selected' : ''}
                  ${isQuestioned ? 'card-questioned' : ''}
                `}
                onClick={() => {
                  if (current_turn === 'player' && gameState === 'main') {
                    handleCardClick(card, index);
                  } else if (current_turn === 'opponent' && opponentQuestion) {
                    handleGiveCardToOpponent(card);

                  }
                }}
                disabled={current_turn === 'opponent' && !opponentQuestion}
              >
                {card}
              </button>
            );
          })}
        </div>
      </div>
      
      {gameState === 'end' && (
        <div id='end-buttons'>
          <p className = "narrator" style = {{ fontFamily: 'Trebuchet MS'}}> Game Over! Final Score: You {playerPairs} - {opponentName} {opponentPairs}</p>
          <button
            type="button"
            className="scores"
            onClick={() => navigate('/scores')}
          >
            <b>See Fish You've Caught!</b>
          </button>
        </div>
      )}
    </main>
  );
}