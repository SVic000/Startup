import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { draw } from './PlayFunct';
import './play.css';

export function Play() {
  //  ----- CONSTANTS AND STATES -----------
  const navigate = useNavigate();

  const [askedQuestion, setAskedQuestion] = useState(0); // 0 means you haven't asked a questino in your turn, 1 means you have

  const [current_turn, setCurrentTurn] = useState(null); // player | opponent
  const [startingPlayer, setStartingPlayer] = useState(Math.floor(Math.random() * 2)); // 0 you start | 1 they start
  const [drawCount, setDrawCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false); 
  const [gamephase, setGamePhase] = useState('setup'); // setup | main
  const [selectedCards, setSelectedCards] = useState([]); // to check if the cards the playrees selecting match for pair
  const [selectedCardForAsk, setSelectedCardForAsk] = useState(null); // selected for asking a quesiton to opponent
  
  const [opponentQuestion, setOpponentQuestion] = useState(null);
  const [goFishContext, setGoFishContext] = useState(null); // 'player-ask' | 'opponent-ask'
  const [drewDueToEmptyHand, setDrewDueToEmptyHand] = useState(false); // edge case


  const [availDeck, setAvailDeck] = useState([1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9]);
  const [playerHand, setPlayerHand] = useState([]);
  const [opponentHand, setOpponentHand] = useState([]);
  const opponentHandRef = useRef([]); // refs for mock hands
  const availDeckRef = useRef([]); // refs for mock hands

  const [playerPairs, setPlayerPair] = useState(0); // pair tracker! we gotta know who won!
  const [opponentPairs, setOpponentPair] = useState(0);
  
  const [message, setMessage] = useState('');
  const [opponentWords, setOpponentWords] = useState('');

  // ---------------------------------------------------------

  // ------ Player --- Draw --------
  function handleDraw() {
    const {newDeck, newHand } = draw(availDeck, playerHand);
    setAvailDeck(newDeck);
    setPlayerHand(newHand);

    if (gamephase === 'setup') { // this is what locks the player to only being able to draw 3 cards at the start
      setDrawCount(prev => prev + 1);
    } else {
      setDrawCount(1);
    }

  if (gamephase === 'main' && playerHand.length === 0) { // they had to draw on empty
    setDrewDueToEmptyHand(true);
  }
    if (goFishContext === 'player-ask') { // draw when told GO FISH
      setSelectedCardForAsk(null);
      setGoFishContext(null);
      setAskedQuestion(0);
      setCurrentTurn('opponent');
      setAskedQuestion(0);
      setMessage("Frank's turn...");
    }
  };

  // Check pairs function
  function checkForPair(selection) {
    const [card1,card2] = selection;
    if (card1.value == card2.value) {
      setPlayerPair(prev => prev +1);
      setMessage('You caught a fish! Nice Pair');
      const newHand = playerHand.filter((_, i) => i !== card1.index && i !== card2.index);
      setPlayerHand(newHand);
      setSelectedCards([]);
    } else {
      setMessage("Not a match! Keep fishing!");
      setTimeout(() => setSelectedCards([]), 1000);
    }
  }

  // player pair function (card clicked check)
  function handleCardClick(cardValue, index) {
    if (current_turn !== 'player' || gamephase !== 'main') return; // not your turn in main game!
    if (selectedCardForAsk) return; // if in middle of asking opponent for card, leave

    const isAlreadySelected = selectedCards.some(selected => selected.index === index);
    if (isAlreadySelected) { // can't click the same card twice! clears selection
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

  function handleAskAboutSelectedCard () {
    if (selectedCards.length !== 1) return;

    const selectedCardValue = selectedCards[0].value;
    console.log('Asking opponnentsjd;flkajdsfl;');

    setSelectedCardForAsk(selectedCardValue);
    setMessage(`You've asked Frank if he has any ${selectedCardValue}s!`)
    setOpponentWords(' . . . ')
    setAskedQuestion(1);

    setSelectedCards([]);

    setTimeout(() => {
      if (opponentHand.includes(selectedCardValue)) {
        const matchincard = opponentHand.filter(card=> card === selectedCardValue);
        const newOpponentHand = opponentHand.filter(card => card !== selectedCardValue);
        const newPlayerHand = [...playerHand, ...matchincard];

        setSelectedCardForAsk(null); // player can keep clicking cards
      
        setOpponentHand(newOpponentHand);
        setPlayerHand(newPlayerHand);
        setMessage(`Frank gave you a ${selectedCardValue}!`);
        setOpponentWords("I didn't want that card anyway....");

        setSelectedCardForAsk(null);
      
      } else {
        setMessage(`Frank doesn't have any ${selectedCardValue}s. Go Fish!`);
        setOpponentWords(`Heh. I dont have any ${selectedCardValue}s`);
        setGoFishContext('player-ask'); //
      }
    }, 1000)
    setAskedQuestion(1); // at the end of your question, you've now asked!
  }

  // ------------- OPPONENT MOVES ----------------
  function opponentAsk() {
    if (current_turn !== "opponent" || askedQuestion !== 0 && opponentHand.length ===0) return;

    // robot ask for random card in their hand and waits for plaery
    if (opponentHand.length === 0) {
      opponentDraw();
      return;
    }
    const randomCard = opponentHand[Math.floor(Math.random() * opponentHand.length)];

    setOpponentQuestion(randomCard);
    setMessage('Frank is asking a quesiton!')
    setOpponentWords(`Do you have any ${randomCard}s?`)
    setAskedQuestion(1);
    setGoFishContext('opponent-ask');
  }

  // --- player handing card to Frank --
  function handleGiveCardToOpponent(cardValue) {
    if (current_turn !== 'opponent' || !opponentQuestion) return;

    if (cardValue === opponentQuestion) {
      // player has the card! move it over

      const cardIndex = playerHand.indexOf(cardValue);
      setSelectedCardForAsk([{value: cardValue, index: cardIndex}])

      const newplayerhand = playerHand.filter(card => card != cardValue);
      const newopponenthand = [...opponentHand, cardValue];

      setPlayerHand(newplayerhand);
      setOpponentHand(newopponenthand);
      setMessage(`You gave ${cardValue} to opponent`);
      setOpponentWords(`Thanks for the ${cardValue}.`)
      setOpponentQuestion(null);

      setTimeout(()=> {
        setCurrentTurn('player');
        setSelectedCardForAsk(null);
        setSelectedCards([]);
        setAskedQuestion(0);
        setOpponentWords('');
        setMessage('Select a card to ask Frank!')

      }, 1500)
  } else {
    setMessage("That's not the card Frank asked for!");
  };
}

  function checkOpponentPairs() {
  const cardCounts = {};
  opponentHand.forEach(card => {
    cardCounts[card] = (cardCounts[card] || 0) + 1;
  });
  
  Object.entries(cardCounts).forEach(([card, count]) => {
    if (count >= 2) {
      // Remove pairs from opponent hand
      const newOpponentHand = opponentHand.filter(c => c !== parseInt(card));
      setOpponentHand(newOpponentHand);
      setOpponentPair(prev => prev + 1);
    }
  });
}

  function handleOpponentGoFISH() {
    setMessage("Go fish! Frank draws a card");
    setOpponentWords("Rats. I need that card.");
    opponentDraw();
    setOpponentQuestion(null);
    setGoFishContext(null);
    // Franks turn ends
    setTimeout(() => {
      setCurrentTurn('player');
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

  function opponentDraw() { // mock draws opponent hands
    if(availDeck.length === 0) return;
    const { newDeck, newHand } = draw(availDeckRef.current, opponentHandRef.current);
    availDeckRef.current = newDeck;
    opponentHandRef.current = newHand;
    setAvailDeck(newDeck);
    setOpponentHand(newHand);
  }

  // SINGLE SOURCE OF TRUTH: Starting the game and setup phase
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
        
        // Opponent draws 3 cards first
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

  // SINGLE SOURCE OF TRUTH: Check setup completion and handle opponent drawing
  useEffect(() => {
    // If player has drawn 3 cards but opponent doesn't have 3 yet
    if (gamephase === 'setup' && playerHand.length === 3 && opponentHand.length < 3) {
      setCurrentTurn("opponent")
      setAskedQuestion(0);
      setMessage('Frank is Drawing 3 cards!');
      
      let draws = opponentHand.length; // Start from current count
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
      
      // Cleanup function to prevent memory leaks
      return () => clearInterval(interval);
    }
  }, [playerHand.length, opponentHand.length, gamephase, startingPlayer]);

  // check if both players have 3 cards and if the game is in setup, then choose who starts
  // and change the gamephase to actually start the game!
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

  // ---------------- MAIN GAME STARTS -----------
  useEffect(() => {
  if (gamephase === 'main') {
    checkOpponentPairs();
  }
  
}, [opponentHand, gamephase]);

  useEffect(() => {
    if (current_turn === 'opponent') {
      setDrewDueToEmptyHand(false);
    }
  }, [current_turn]);

  useEffect(() => {
    if(gamephase === 'main' && askedQuestion === 0){ // let the game begin
      if (current_turn === 'opponent' && !opponentQuestion && availDeck.length !== 0) { // keep Frank asking questions if he has cards and there are cards to grab
        setTimeout(() => opponentAsk(), 1000);
      }
    }
  },[current_turn, gamephase, opponentQuestion]);

  useEffect(() => {
    if(playerHand.length === 0 && opponentHand.length === 0 && availDeck.length === 0) { // end of game
      setGamePhase('end');
      setCurrentTurn(null)
      who_playing_indicator = document.getElementsByTagName("h4");
      if(playerPairs > opponentPairs) { // player wins!
        setMessage("You won! Greatest fisher here!");
        setOpponentWords("Oof, you were a strong opponent! Good game!");
        who_playing_indicator.textcontent("");
      } else {
        setMessage("Frank won! An amazing battle!");
        setOpponentWords("Heh, you were a tough foe. Good game!");
        who_playing_indicator.textcontent("");
      }
    }
  })

  // the console log debug of the century
  console.log(availDeck);
  console.log(playerHand);
  console.log(opponentHand);
  console.log(current_turn);
  console.log(playerPairs);
  console.log(opponentPairs);

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
            𖧋<br />
            𖧋<br />
            ●<br />
            ●<br />
          </p>
        </div>

        <div className="pair picture-box">
          <img id="cat" src="/underconstruction.jpeg" alt="opponent" />
        </div>

        <div className="pair">
          <p className="text-center">
            Opponent Pairs <br /> 
            <span className='pair1'>𖧋</span> <br />
            𖧋<br />
            𖧋<br />
            ●<br />
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
    !drewDueToEmptyHand && // ADD THIS LINE
    drawCount && (
      <button 
        id="ask" 
        onClick={handleAskAboutSelectedCard}
      >
        Ask About {selectedCards[0].value}
      </button>
    )}
  
  {/* DRAW BUTTON - Only show in setup phase or if the player ran out of cards to play  */}
  {(gamephase === 'setup' || (playerHand.length === 0 && askedQuestion === 0 && !drewDueToEmptyHand)) && current_turn === 'player' && (
  <button 
    id="draw"
    onClick={handleDraw}
    disabled={playerHand.length >= 3 && gamephase === 'setup'}
  >
    <b>Draw</b>
  </button>
)}
  
  {/* GO FISH BUTTON - Only show when told to Go Fish */}
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
  
  {/* RESPONSE BUTTONS - When opponent asks you */}
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
        ((selectedCardForAsk === null && askedQuestion !== 0) || drewDueToEmptyHand)) && (
        <button id="end-turn" onClick={() => {
          setCurrentTurn('opponent');
          setAskedQuestion(0);
          setDrewDueToEmptyHand(false); // Reset this state
          setMessage("Frank's turn...");
          setSelectedCards([]);
        }}>
          End Turn
        </button>
      )}
      </div>

      <div className="card-toggle-wrapper">
        <div className="card-container">
          {playerHand.map((card, index) => { // making and updating player cards
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
                  // Only handle card clicks during player's turn in main phase
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

      <div className="text-center mt-4">
        <p>Link to Scores page (will show up after game is over)</p>
        <button
          type="button"
          className="btn btn-light btn-outline-primary input-group-text btn-lg"
          onClick={() => navigate('/scores')}
        >
          <b>Fish Caught</b>
        </button>
      </div>
    </main>
  );
}