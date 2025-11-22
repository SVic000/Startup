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
  const [opponentManager, setOpponentManager] = useState(null);
  const [gameID, setGameID] = useState(null);
  const [opponentName, setOpponentName] = useState('Frank');
  const [socket, setSocket] = useState(null); // websocket!

  // ====== Game State =======
  const [current_turn, setCurrentTurn] = useState(null); // player | opponent
  const [askedQuestion, setAskedQuestion] = useState(0); // 0 | 1
  const [drawCount, setDrawCount] = useState(0); // limits players draw amounts
  const [availDeck, setAvailDeck] = useState(true);

  // ====== Hands & Pairs =========
  const [playerHand, setPlayerHand] = useState([]);
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
  const [opponentCatFace, setopponentCatFace] = useState('Frank') // go to db and see what people have picked!
  const [catFace, setcatFace] = useState('Default') // Default | No | Shocked | Annoyed | Excited | GameEnd

  // ========= Mode selection handlers ===========
  async function handleSelectAI() {
    setGameMode('ai');
    setGameState('setup');

    const service = new GameService(null, false);
    const newGameID = await service.createGame();

    if (newGameID) {
      setGameID(newGameID);
      setGameService(service);
      setOpponentManager(new OpponentManager('ai', service));

      const starter = Math.floor(Math.random() * 2);
      if(starter === 0 ) {
        setMessage('You start! Draw 3 cards.')
        setCurrentTurn('player');
      } else {
        setMessage("Frank starts! He's drawing 3 cards!")
        setCurrentTurn('opponent');
        startOpponentSetupDraw();
      }
    }
  }

async function handleSelectMultiplayer() {
  setGameMode('multiplayer');
  setGameState('waiting');
  setMessage('Looking for an opponent...');
  
  // Create raw WebSocket connection
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const newSocket = new WebSocket(`${protocol}://${window.location.host}`);
  setSocket(newSocket);
  
  newSocket.onopen = () => {
    console.log('Connected to server');
    newSocket.send(JSON.stringify({ type: 'join-queue' }));
  };
  
  newSocket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
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
        } else {
          setMessage("Opponent starts! They're drawing cards...");
          setCurrentTurn('opponent');
        }
        break;
        
      case 'error':
        setMessage(message.msg);
        setGameState('mode_select');
        break;
    }
  };
  
  newSocket.onerror = (error) => {
    console.error('WebSocket error:', error);
    setMessage('Connection error. Try again?');
    setGameState('mode_select');
  };
}

  function poolForMatch() {
    const interval = setInterval(async() => {
      try {
          const response = await fetch('/api/queue/check', { credentials: 'include' });
          const data = await response.json();

        if (data.matched) {
          clearInterval(interval);
          startMultiplayerGame(data.opponent,data.gameID);
        }
      } catch(err) {
        console.error('Error checking for match: ', err);
      }
    }, 2000);
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

  function startMultiplayerGame(opponent, matchGameID) {
    setGameState('setup');
    setMessage(`Matched with ${opponent.username}! Game starting...`);
    
    const service = new GameService(matchGameID, true);
    setGameID(matchGameID);
    setGameService(service);
    setOpponentManager(new OpponentManager('human', service));
    
    // Server decides who goes first
    // For now, random
    const starter = Math.floor(Math.random() * 2);
    if (starter === 0) {
      setMessage('You start! Draw 3 cards.');
      setCurrentTurn('player');
    } else {
      setMessage("Opponent starts! They're drawing cards...");
      setCurrentTurn('opponent');
    }
  }

  // ===== SETUP PHASE =====  
  function startOpponentSetupDraw() {
    let draws = 0;
    const interval = setInterval(async () => {
      if (draws < 3) {
        await opponentDraw();
        draws++;
      }
      if (draws >= 3) {
        clearInterval(interval);
        setMessage('Your turn! Draw 3 cards.');
        setCurrentTurn('player');
      }
    }, 900);
  }
  
  async function handleDraw() {
    if (!availDeck || !gameService) return;
    
    const { newHand, deckEmpty } = await gameService.draw(playerHand);
    setPlayerHand(newHand);
    setAvailDeck(deckEmpty);

    if (gameState === 'setup') {
      setDrawCount(prev => prev + 1);
    } else {
      setDrawCount(1);
    }

    if (goFishContext === 'player-ask') {
      setSelectedCardForAsk(null);
      setGoFishContext(null);
      setAskedQuestion(0);
      setCurrentTurn('opponent');
      setMessage(gameMode === 'ai' ? "Frank's turn..." : `${opponentName}'s turn...`);
    }
  }

  async function opponentDraw() {
    if (!availDeck || !gameService) return;
    
    const { newHand, deckEmpty } = await gameService.draw(opponentHandRef.current);
    opponentHandRef.current = newHand;
    setAvailDeck(deckEmpty);
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
          setMessage(gameMode === 'ai' ? "Select a card to ask Frank!" : `Select a card to ask your ${opponentName}!`);
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
    setMessage(`You've asked about ${selectedCardValue}s!`);
    
    setOpponentWords(' . . . ');
    
    setAskedQuestion(1);
    setSelectedCards([]);

    setTimeout(() => {
      const result = gameService.askForCard(playerHand, opponentHand, selectedCardValue);
      
      if (result.success) {
        setPlayerHand(result.newAskingHand);
        setOpponentHand(result.newReceivingHand);
        setMessage(`You got ${result.cardsTransferred} ${selectedCardValue}(s)!`);
        
        setcatFace('Shocked');
        setOpponentWords("I didn't want that card anyway....");
        setTimeout(() => setcatFace("Annoyed"), 900);
        
        setSelectedCardForAsk(null);
      } else {
        setMessage(`No ${selectedCardValue}s. Go Fish!`);
      
        setOpponentWords(`Heh. I don't have any ${selectedCardValue}s`);
        setcatFace('No');
        
        setTimeout(() => setGoFishContext('player-ask'), 700);
      }
    }, 1000);
  }
// =========== opponent moves! ==================
async function opponentTakeTurn() {
  if (!opponentManager || !gameService) return;

  if (opponentHand.length=== 0 && availDeck) {
    setMessage(gameMode=== 'ai' ? 'Frank draws a card...' : `${opponentName} draws a card...`);
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
  setMessage(gameMode === 'ai' ? 'Frank is asking a question!' : `${opponentName} is asking...`);
  
  const dialogue = opponentManager.getDialogue('ask', cardToAsk);
  setOpponentWords(dialogue);
  setcatFace('Default');
  
  setAskedQuestion(1);
  setTimeout(() => setGoFishContext('opponent-ask'), 1500);
}

function handleGiveCardToOpponent(cardValue) {
  if (current_turn !== 'opponent' || !opponentQuestion || !gameService) return;

  if(cardValue === opponentQuestion) {
    const result = gameService.askForCard(opponentHand, playerHand, cardValue);

    setOpponentHand(result.newAskingHand);
    setPlayerHand(result.newReceivingHand);
    setOpponentQuestion(null);
    setMessage(`You gave ${cardValue} to ${opponentName}`);

    setOpponentWords(`Thanks for the ${cardValue}`);
    setcatFace('Excited');

    setSelectedCards([]);

    setTimeout(()=> {
      setCurrentTurn('player');
      setSelectedCardForAsk(null);
      setAskedQuestion(0);
      setOpponentWords('');
      setcatFace('Default');
    }, 1500);
  }
}

function handleOpponentGoFish() {
  setMessage(`Go fish! ${opponentName} draws a card!`);

  setOpponentWords("Rats. I need that card.")
  setcatFace('Annoyed');

  opponentDraw();
  setOpponentQuestion(null);
  setGoFishContext(null);

  setTimeout(()=> {
    setCurrentTurn('player');
    setcatFace('Default');
    setAskedQuestion(0);
    setMessage('Your turn!');
    setOpponentWords('');
  }, 1200);
}
// ====== opponent pair checking =========

function checkOpponentPairs() {
  if(!gameService || gameState === 'setup') return;

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
      setOpponentWords("Oof, you were a strong opponent! Good game!");
      gameService.updatePlayerScore(0.5);
    } else if (winner === 'opponent') {
      setMessage(gameMode === 'ai' ? "Frank won! An amazing battle!" : "Opponent won! Good game!");
      setOpponentWords("Heh, you were a tough foe. Good game!");
      gameService.updatePlayerScore(0);
    } else {
      setMessage("It's a tie! What an intense match!");
      setOpponentWords("A tie! We're equally matched! Good game!");
      gameService.updatePlayerScore(0);
    }
    gameService.deleteGame();
  }
  // USE EFFECTS ==================
  /*
  useEffect(()=> {
    async function createNewGame() {
      try {
        const response = await fetch('/api/play/new', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error creating game: ', errorData.msg);
          return;
        }

        const data = await response.json();
        // console.log('New game created with ID: ', data.gameID);
        setGameID(data.gameID);
      } catch (err) {
        console.error("Error creating game: ", err);
      }
    } 
    createNewGame();
  }, [])

  // deleting gameId function for later
  async function deleteCurrentGame(gameID) {
    try {
      const response = await fetch('/api/play/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({gameID}),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("Failed to delete game:", data.msg || response.statusText);
        return false;
      }
      // console.log("Game deleted successfully: ", data);
      return true;
    } catch (error) {
      console.error("Error deleting game: ", error);
      return false;
    }
    }
    */

    // update opponent hand ref
    useEffect (() => {
      opponentHandRef.current = opponentHand;
    }, [opponentHand]);

    // check opponent pairs
    useEffect(()=> {
      if(gameState === 'main') {
        checkOpponentPairs();
      }
    }, [opponentHand, gameState]);

    // set up phase completion
    useEffect(()=> {
      if(gameState === 'setup' && playerHand.length === 3 && opponentHand.length === 3) {
        setMessage("Both players have cards! time to fish!");
        setGameState('main');
        // whoever drew first goes first!
      }
    }, [gameState, playerHand.length, opponentHand.length]);

    // Opponent's turn in main game
    useEffect(() => {
      if(gameState === 'main' && current_turn === 'opponent' && askedQuestion === 0) {
        setTimeout(() => opponentTakeTurn(), 1000)
      }
    }, [current_turn, gameState, askedQuestion, opponentHand.length])
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
        {(gameState === 'setup' || (playerHand.length === 0 && askedQuestion === 0 && gameState !== 'end')) && current_turn === 'player' && (
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
            setCurrentTurn('opponent');
            setAskedQuestion(0);
            setMessage(`${opponentName}'s turn...`);
            setSelectedCards([]);
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
          <p className = "narrator" style = {{ fontFamily: 'Trebuchet MS'}}> Game Over! Final Score: You {playerPairs} - Frank {opponentPairs}</p>
        {/* Restart button for later, will be a play again button? maybe?
        <button id="Restart" onClick={() => {
          handleRestart();
          }}>
            <b>Play Again?</b>
          </button>
          */}
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