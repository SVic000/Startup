import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { draw } from './PlayFunct';
import './play.css';

export function Play() {
  //  ----- CONSTANTS AND STATES -----------
  const navigate = useNavigate();

  const [askedQuestion, setAskedQuestion] = useState(0); // 0 | 1
  const [current_turn, setCurrentTurn] = useState(null); // player | opponent
  const [startingPlayer, setStartingPlayer] = useState(Math.floor(Math.random() * 2));
  const [drawCount, setDrawCount] = useState(0); // limits players draw amounts
  const [hasStarted, setHasStarted] = useState(false); // checks presets
  const [gamephase, setGamePhase] = useState('setup'); // setup | main | end
  const [selectedCards, setSelectedCards] = useState([]); // which cards the player is seleciting
  const [selectedCardForAsk, setSelectedCardForAsk] = useState(null); // just one card selected, you can ask a question on that card
  const [frankFace, setFrankFace] = useState('Default') // Default | Declines | Shocked | Annoyed | Excited | End
  
  const [opponentQuestion, setOpponentQuestion] = useState(null); // what Franks asking player
  const [goFishContext, setGoFishContext] = useState(null); // Whether the go fish is for you or them

  const [availDeck, setAvailDeck] = useState([1,1,2,2,3,3,4,4]);
  const [playerHand, setPlayerHand] = useState([]);
  const [opponentHand, setOpponentHand] = useState([]);
  const opponentHandRef = useRef([]);
  const availDeckRef = useRef([]);

  const [playerPairs, setPlayerPair] = useState(0);
  const [opponentPairs, setOpponentPair] = useState(0);
  
  const [message, setMessage] = useState(''); // guides player
  const [opponentWords, setOpponentWords] = useState(''); // hard coded opponent words

  // ------ Player Draw Function --------
  function handleDraw() {
    const {newDeck, newHand } = draw(availDeck, playerHand);
    setAvailDeck(newDeck);
    setPlayerHand(newHand);

    if (gamephase === 'setup') {
      setDrawCount(prev => prev + 1);
    } else {
      setDrawCount(1);
    }

    if (goFishContext === 'player-ask') {
      setSelectedCardForAsk(null);
      setGoFishContext(null);
      setAskedQuestion(0);
      setCurrentTurn('opponent');
      setMessage("Frank's turn...");
    }
  }

  // Check pairs function
  function checkForPair(selection) {
    const [card1,card2] = selection;
    if (card1.value == card2.value) {
      setPlayerPair(prev => prev + 1);
      setMessage('You caught a fish! Nice Pair');
      const newHand = playerHand.filter((_, i) => i !== card1.index && i !== card2.index);
      setPlayerHand(newHand);
      setSelectedCards([]);

      setTimeout(() => {
        checkGameEndConditions();
      }, 100);
    } else {
      setMessage("Not a match! Keep fishing!");
      setTimeout(() => setSelectedCards([]), 1000);
    }
  }

  // Player pair function
  function handleCardClick(cardValue, index) {
    if (current_turn !== 'player' || gamephase !== 'main') return;
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

  function handleAskAboutSelectedCard() {
    if (selectedCards.length !== 1) return;

    const selectedCardValue = selectedCards[0].value;
    setSelectedCardForAsk(selectedCardValue);
    setMessage(`You've asked Frank if he has any ${selectedCardValue}s!`)
    setOpponentWords(' . . . ')
    setAskedQuestion(1);
    setSelectedCards([]);

    setTimeout(() => {

      if (opponentHand.includes(selectedCardValue)) {
        setFrankFace('Shocked');
        const matchincard = opponentHand.filter(card => card === selectedCardValue);
        const newOpponentHand = opponentHand.filter(card => card !== selectedCardValue);
        const newPlayerHand = [...playerHand, ...matchincard];
      
        setOpponentHand(newOpponentHand);
        setPlayerHand(newPlayerHand);
        setMessage(`Frank gave you a ${selectedCardValue}!`);
        setOpponentWords("I didn't want that card anyway....");
        setTimeout(()=> {
          setFrankFace("Annoyed");
        }, 900);
        setSelectedCardForAsk(null);
      
        setTimeout(() => {
          checkGameEndConditions();
        }, 100);
      } else {
        setMessage(`Frank doesn't have any ${selectedCardValue}s. Go Fish!`);
        setOpponentWords(`Heh. I dont have any ${selectedCardValue}s`);
        setFrankFace('Decline')
        setGoFishContext('player-ask');
      }
    }, 1000)
  }
  console.log(opponentHand)

  // ------------- OPPONENT MOVES ----------------
  function opponentAsk() {
    if (current_turn !== "opponent" || askedQuestion !== 0) return;

    if (opponentHand.length === 0) {
      return;
    }

    const randomCard = opponentHand[Math.floor(Math.random() * opponentHand.length)];
    setOpponentQuestion(randomCard);
    setMessage('Frank is asking a question!')
    setOpponentWords(`Do you have any ${randomCard}s?`)
    setFrankFace('Default')
    setAskedQuestion(1);
    setGoFishContext('opponent-ask');
  }

  function handleGiveCardToOpponent(cardValue) {
    if (current_turn !== 'opponent' || !opponentQuestion) return;

    if (cardValue === opponentQuestion) {
      const cardIndex = playerHand.indexOf(cardValue);
      setSelectedCardForAsk([{value: cardValue, index: cardIndex}])

      const newplayerhand = playerHand.filter(card => card != cardValue);
      const newopponenthand = [...opponentHand, cardValue];

      setPlayerHand(newplayerhand);
      setOpponentHand(newopponenthand);
      setMessage(`You gave ${cardValue} to opponent`);
      setOpponentWords(`Thanks for the ${cardValue}.`);
      setFrankFace('Excited');
      setOpponentQuestion(null);
      
      setTimeout(() => {
        setCurrentTurn('player');
        setSelectedCardForAsk(null);
        setSelectedCards([]);
        setAskedQuestion(0);
        setOpponentWords('');
        setFrankFace('Default');
        checkGameEndConditions();
      }, 1500)
    } else {
      setMessage("That's not the card Frank asked for!");
    }
  }

  function checkOpponentPairs() {
    const cardCounts = {};
    const hand = [...opponentHand];
    hand.forEach(card => {
      cardCounts[card] = (cardCounts[card] || 0) + 1;
    });

    let pairsFound = 0;
    const newOpponentHand = [...opponentHand];
    
    Object.entries(cardCounts).forEach(([card, count]) => {
      const cardNum = parseInt(card);
      if (count >= 2) {
        let removed = 0;
        for (let i = newOpponentHand.length - 1; i >= 0; i--) {
          if (newOpponentHand[i] === cardNum && removed < 2) {
            newOpponentHand.splice(i, 1);
            removed++;
            pairsFound++;
          }
        }
      }
    });
    
    if (pairsFound > 0) {
      setOpponentHand(newOpponentHand);
      setOpponentPair(prev => prev + (pairsFound / 2));

      setTimeout(() => {
        checkGameEndConditions();
      }, 500);
    }
  }

  function handleOpponentGoFISH() {
    setMessage("Go fish! Frank draws a card");
    setOpponentWords("Rats. I need that card.");
    setFrankFace('Annoyed')
    opponentDraw();
    setOpponentQuestion(null);
    setGoFishContext(null);
    
    setTimeout(() => {
      setCurrentTurn('player');
      setFrankFace('Default');
      setAskedQuestion(0);
      setMessage('Select a card to ask Frank!');
      setOpponentWords('');
    }, 1500);
  }

  // Update refs
  useEffect(() => {
    opponentHandRef.current = opponentHand;
  }, [opponentHand]);

  useEffect(() => {
    availDeckRef.current = availDeck;
  }, [availDeck]);

  function opponentDraw() {
    if(availDeck.length === 0) return;
    const { newDeck, newHand } = draw(availDeckRef.current, opponentHandRef.current);
    availDeckRef.current = newDeck;
    opponentHandRef.current = newHand;
    setAvailDeck(newDeck);
    setOpponentHand(newHand);
  }

  // Comprehensive end condition checker
  function checkGameEndConditions() {
    if (gamephase !== 'main') return false;
    
    const totalPossiblePairs = 9;
    const totalPairsMade = playerPairs + opponentPairs;
    
    // End game if all pairs are made
    if (totalPairsMade === totalPossiblePairs) {
      handleGameEnd();
      return true;
    }
    
    // End game if deck is empty AND both players have no cards AND no pairs can be made
    if (availDeck.length === 0 && playerHand.length === 0 && opponentHand.length === 0) {
      handleGameEnd();
      return true;
    }
    
    // End game if deck is empty and current player has no cards to play
    if (availDeck.length === 0) {
      if (current_turn === 'player' && playerHand.length === 0) {
        // But only end if opponent also can't play or it's a natural stopping point
        setTimeout(() => {
          handleGameEnd();
        }, 500);
        return true;
      } else if (current_turn === 'opponent' && opponentHand.length === 0) {
        setTimeout(() => {
          handleGameEnd();
        }, 500);
        return true;
      }
    }
    
    return false;
  }

  function handleGameEnd() {
    setGamePhase('end');
    setCurrentTurn(null);

    setTimeout(() => {
      setFrankFace('End')
      if (playerPairs > opponentPairs) {
        setMessage("You won! Greatest fisher here!");
        setOpponentWords("Oof, you were a strong opponent! Good game!");
      } else if (opponentPairs > playerPairs) {
        setMessage("Frank won! An amazing battle!");
        setOpponentWords("Heh, you were a tough foe. Good game!");
      } else {
        setMessage("It's a tie! What an intense match!");
        setOpponentWords("A tie! We're equally matched! Good game!");
      }
    }, 100);
  }

  // ------------------ USE EFFECTS FOR GAME START -----------
  useEffect(() => {
    if (!hasStarted) {
      setHasStarted(true);

      if (startingPlayer === 0) {
        setMessage('You start! Draw 3 cards.');
        setCurrentTurn('player');
        setAskedQuestion(0);
      } else {
        setMessage("Frank starts! He's drawing 3 cards!");
        setCurrentTurn('opponent');
        setAskedQuestion(0);
        
        let draws = 0;
        const interval = setInterval(() => {
          opponentDraw();
          draws++;
          if (draws >= 3) {
            clearInterval(interval);
            setMessage('Your turn! Draw 3 cards.');
            setCurrentTurn('player');
            setAskedQuestion(0);
          }
        }, 900);
      }
    }
  }, [hasStarted, startingPlayer]);

  // Check setup completion
  useEffect(() => {
    if (gamephase === 'setup' && playerHand.length === 3 && opponentHand.length < 3) {
      setCurrentTurn("opponent")
      setAskedQuestion(0);
      setMessage('Frank is Drawing 3 cards!');
      
      let draws = opponentHand.length;
      const neededDraws = 3 - opponentHand.length;
      
      const interval = setInterval(() => {
        if (draws < 3) {
          opponentDraw();
          draws++;
        }
        if (draws >= 3) {
          clearInterval(interval);
        }
      }, 900);
      
      return () => clearInterval(interval);
    }
  }, [playerHand.length, opponentHand.length, gamephase, startingPlayer]);

  // Start main game
  useEffect(() => {
    if (gamephase === 'setup' && playerHand.length === 3 && opponentHand.length === 3) {
      const firstTurnInMain = startingPlayer === 0 ? 'player' : 'opponent';
      setMessage("Both players have cards! Time to fish!");
      setGamePhase('main');
      setCurrentTurn(firstTurnInMain);
      setAskedQuestion(0);
      setStartingPlayer(null);
    };
  }, [gamephase, startingPlayer, playerHand.length, opponentHand.length]);

  // Check opponent pairs
  useEffect(() => {
    if (gamephase === 'main') {
      checkOpponentPairs();
    }
  }, [opponentHand, gamephase]);

  // Frank's turn logic
  useEffect(() => {
    if (gamephase === 'main' && current_turn === 'opponent' && askedQuestion === 0) {
      // If Frank has no cards but deck has cards, he should draw
      if (opponentHand.length === 0 && availDeck.length > 0) {
        setTimeout(() => {
          opponentDraw();
          setMessage("Frank has no cards, so he draws one");
          setTimeout(() => {
            if (opponentHandRef.current.length > 0) {
              opponentAsk();
            } else {
              setCurrentTurn('player');
              setAskedQuestion(0);
              setMessage('Your turn!');
            }
          }, 1000);
        }, 1000);
        return;
      }
      
      // If Frank has cards, he can ask
      if (opponentHand.length > 0 && !opponentQuestion) {
        setTimeout(() => opponentAsk(), 1000);
      }
      
      // If Frank has no cards and deck is empty, end his turn
      if (opponentHand.length === 0 && availDeck.length === 0) {
        setTimeout(() => {
          setCurrentTurn('player');
          setAskedQuestion(0);
          setMessage('Your turn! Frank has no cards left.');
        }, 1000);
      }
    }
  }, [current_turn, gamephase, opponentQuestion, askedQuestion, opponentHand.length, availDeck.length]);

  // Main end condition checker
  useEffect(() => {
    if (gamephase === 'main') {
      const timer = setTimeout(() => {
        checkGameEndConditions();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [playerPairs, opponentPairs, gamephase]);

  // Empty hands end condition
  useEffect(() => {
    if (gamephase === 'main' && 
        availDeck.length === 0 && 
        playerHand.length === 0 && 
        opponentHand.length === 0) {
      // Small delay to ensure all state updates are complete
      setTimeout(() => {
        handleGameEnd();
      }, 1000);
    }
  }, [availDeck.length, playerHand.length, opponentHand.length, gamephase]);

  return (
    <main className="container-fluid text-primary-emphasis bg-primary-subtle border border-primary-subtle rounded-3">
      <div className="top-menu">
        <button
          type="button"
          className="btn btn-light input-group-text"
          onClick={() => navigate('/menu')}
        >
          <b>Return to Menu</b>
        </button>
      </div>
      
      <h4 id="turn" className={current_turn === 'player' ? "message_you" : "message_them"}>
        {current_turn === 'player' ? "Your Turn" : "Opponent's Turn"}
      </h4>

      <div className="text-center my-3" id="question">
        <b>{message}</b>
      </div>

      <div className='text-center' id='frankswords'> {opponentWords} </div>

      <div className="pair-container">
        <div className="pair">
          <p className="text-center">
            Your Pairs <br />
            {Array.from({length: playerPairs}, (_, i) => (
              <span key={i}>●<br /></span>
            ))}
          </p>
        </div>

        <div className="pair picture-box">
          <img id="cat" src={`/Frank${frankFace}.PNG`} alt={`${frankFace} expression`}/>
        </div>

        <div className="pair">
          <p className="text-center">
            Opponent Pairs <br /> 
            {Array.from({length: opponentPairs}, (_, i) => (
              <span key={i}>●<br /></span>
            ))}
          </p>
        </div>
      </div>

      <div className="button-holder">
        {/* Ask Button */}
        {current_turn === 'player' && 
        gamephase === 'main' && 
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
        {(gamephase === 'setup' || (playerHand.length === 0 && askedQuestion === 0)) && current_turn === 'player' && (
          <button 
            id="draw"
            onClick={handleDraw}
            disabled={playerHand.length >= 3 && gamephase === 'setup'}
          >
            <b>Draw</b>
          </button>
        )}
        
        {/* GO FISH BUTTON */}
        {gamephase === 'main' && goFishContext === 'player-ask' && current_turn === 'player' && (
          <button 
            id="go-fish"
            onClick={handleDraw}
          >
            <b>Go Fish</b>
          </button>
        )}

        {/* Cancel Ask Button */}
        {current_turn === 'player' && selectedCardForAsk !== null && askedQuestion === 0 &&(
          <button id="cancel-ask" onClick={() => {
            setSelectedCardForAsk(null);
            setMessage("Your turn");
            setOpponentWords('');
            setGoFishContext(null);
          }}>
            Cancel Ask
          </button>
        )}
        
        {/* RESPONSE BUTTONS */}
        {current_turn === 'opponent' && goFishContext === 'opponent-ask' && opponentQuestion && (
          <div className="response-buttons">           
            <button 
              id="go-fish-opponent" 
              className="btn-warning"
              onClick={handleOpponentGoFISH}
            >
              Go Fish!
            </button>
          </div>
        )}
        
        {/* End Turn Button */}
        {(current_turn === 'player' && gamephase === 'main' && 
          ((selectedCardForAsk === null && askedQuestion !== 0) || 
           (playerHand.length === 0 && availDeck.length === 0))) && (
          <button id="end-turn" onClick={() => {
            setCurrentTurn('opponent');
            setAskedQuestion(0);
            setMessage("Frank's turn...");
            setSelectedCards([]);
          }}>
            End Turn
          </button>
        )}
      </div>

      <div className="card-toggle-wrapper">
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
                  if (current_turn === 'player' && gamephase === 'main') {
                    handleCardClick(card, index);
                  } else if (current_turn === 'opponent' && opponentQuestion) {
                    handleGiveCardToOpponent(card);
                  }
                }}
                disabled={current_turn === 'opponent' && !opponentQuestion}
              >
                {card}
                {isQuestioned && <div className="questioned-indicator">Frank wants this!</div>}
              </button>
            );
          })}
        </div>
      </div>
      
      {gamephase === 'end' && (
        <div className="text-center mt-4">
          <p>Game Over! Final Score: You {playerPairs} - Frank {opponentPairs}</p>
          <button
            type="button"
            className="btn btn-light btn-outline-primary input-group-text btn-lg"
            onClick={() => navigate('/scores')}
          >
            <b>See Fish Caught</b>
          </button>
        </div>
      )}
    </main>
  );
}