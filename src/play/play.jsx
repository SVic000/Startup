import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { draw } from './PlayFunct';
import './play.css';

export function Play() {
  const navigate = useNavigate();

  const [current_turn, setCurrentTurn] = useState(null); // player | opponent
  const [startingPlayer, setStartingPlayer] = useState(Math.floor(Math.random() * 2)); // 0 you start | 1 they start
  const [drawCount, setDrawCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false); 
  const [gamephase, setGamePhase] = useState('setup'); // setup | main
  const [selectedCards, setSelectedCards] = useState([]); // to check if the cards the playrees selecting match for pair
  const [selectedCardForAsk, setSelectedCardForAsk] = useState(null); // selected for asking a quesiton to opponent
  
  const [opponentQuestion, setOpponentQuestion] = useState(null);


  const [availDeck, setAvailDeck] = useState([1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9]);
  const [playerHand, setPlayerHand] = useState([]);
  const [opponentHand, setOpponentHand] = useState([]);
  const opponentHandRef = useRef([]); // refs for mock hands
  const availDeckRef = useRef([]); // refs for mock hands

  const [playerPairs, setPlayerPair] = useState(0); // pair tracker! we gotta know who won!
  const [opponentPairs, setOpponentPair] = useState(0);
  
  const [message, setMessage] = useState('');
  const [opponentWords, setOpponentWords] = useState('');

  // player draw function
  function handleDraw() {
    const {newDeck, newHand } = draw(availDeck, playerHand);
    setAvailDeck(newDeck);
    setPlayerHand(newHand);

    if (gamephase === 'setup') { // this is what locks the player to only being able to draw 3 cards at the start
      setDrawCount(prev => prev + 1);
    } else {
      setDrawCount(1);
    }
  };

  // player pair function (card clicked check)
  function handleCardClick(cardValue, index) {
    if (current_turn !== 'player' || gamephase !== 'main') return; // not your turn in main game!
    if (selectedCardForAsk) return; // if in middle of asking opponent for card, leave


    if (selectedCards.some(selected => selected.index === index)) return; // can't click the same card twice
    const newSelection = [...selectedCards, {value: cardValue, index}];

    if (newSelection.length ===2) { // check for pair on cards selected
      checkForPair(newSelection);
    }

    // check for valid pairs in selected cards
    function checkForPair(selection) {
      const [card1,card2] = selection;

      if (card1.value == card2.value) { // found a pair!
        setPlayerPair(prev => prev +1);
        setMessage('You caught a fish! Nice Pair');
        const newHand = playerHand.filter((_, i) => i !== card1.index && i !== card2.index);
        setPlayerHand(newHand);
        setSelectedCards([]);
      } else {
        setMessage("Not a match! Keep fishing!");
      }
    }
    setTimeout(() => setSelectedCards([], 1000)); // reset selected cards after function runs
  };

  function startAsking() { // Start asking - player selects a card to ask opponent
    if(current_turn !== 'player' || selectedCardForAsk) return; 
    setMessage('Click a card in your hand to ask them about it!');
  };

  function handleAskCardsSelection(cardValue){
    setSelectedCardForAsk(cardValue);
    setMessage(`You've asked Frank if he has any ${cardValue}!`); //
    setOpponentWords('...'); // you asked them, let it seem like they're thinking

    setTimeout(() => {
      if (opponentHand.includes(cardValue)){ // opponent has the card, they'll now be handing it over
        const matchingCard = opponentHand.filter(card => card == cardValue);
        const newOpponentHand = opponentHand.filter(card => card !== cardValue);
        const newPlayerHand = [...playerHand, ...matchingCard];

        setOpponentHand(newOpponentHand);
        setPlayerHand(newPlayerHand);
        setMessage(`Frank gave you a ${cardValue}!`);
        setOpponentWords("I didn't want that card anyway....");

        setSelectedCardForAsk(null);
      } else {
        setMessage(`Frank doesn't have any ${cardValue}s. Go Fish!`);
        setOpponentWords("Heh");
      }
    }, 1000)
  }

  // OPPONENT MOVES
  function opponentAsk() {
    if (current_turn !== "opponent") return;

    // robot ask for random card in their hand and waits for plaery
    const randomCard = opponentHand[Math.floor(Math.random() * opponentHand.length)];
    setOpponentQuestion(randomCard);
    setMessage('Frank is asking a quesiton!')
    setOpponentWords(`Do you have any ${randomCard}s?`)
  }

  // Handle player giving card to opponent
  function handleGiveCardToOpponent(cardValue) {
    if (current_turn !== 'opponent' || !opponentQuestion) return;

    if (cardValue === opponentQuestion) {
      // player has the card! move it over
      const newplayerhand = playerHand.filter(card => card != cardValue);
      const newopponenthand = [...opponentHand, cardValue];

      setPlayerHand(newplayerhand);
      setOpponentHand(newopponenthand);
      setMessage(`You gave ${cardValue} to opponent`);
      setOpponentWords(`Thanks for the ${cardValue}.`)
      setOpponentQuestion(null);

      setTimeout(() => opponentAsk(), 1000); // frank continues turn
    } else {
      setMessage("That's not the card Frank asked for!")
    }
  }

  function handleGoFISH() {
    if (current_turn !== 'opponent') return;

    setMessage("Go fish! Frank draws a card");
    setOpponentWords("Rats. I need that card.");
    opponentDraw();
    setOpponentQuestion(null);
    // Franks turn ends
    setTimeout(() => {
      setCurrentTurn('player');
      setMessage('');
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
      } else {
        setMessage("Frank starts! He's drawing 3 cards!");
        setCurrentTurn('opponent');
        
        // Opponent draws 3 cards first
        let draws = 0;
        const interval = setInterval(() => {
          opponentDraw();
          draws++;
          if (draws >= 3) {
            clearInterval(interval);
            setMessage('Your turn! Draw 3 cards.');
            setCurrentTurn('player');
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
          setStartingPlayer(null);
    };

  }, [gamephase, startingPlayer, playerHand.length, opponentHand.length]);

  // nows the time to start the actual game
  // switch between both players
  // if you have two cards that are the same and they're both clicked (probably need promise or something) then pair them!
  // up pair count for that player.
  // make a mock opponent moveset. maybe, using their array, make them ask a random card question.
  // if player has card they have to click it to give it to them. I dont know
  useEffect(() => {
    if(gamephase === 'main'){ // let the game begin
      if (current_turn === 'opponent' && !opponentQuestion) {
        setTimeout(() => opponentAsk(), 1000);
      }
    }
  },[current_turn, gamephase, opponentQuestion]);

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
        <div> <span> Player Hooks: {playerHand.length}</span> | <span>Opponent Hooks: {opponentHand.length}</span></div>
      </div>

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

      <div>
        <button
          id="draw"
          onClick={handleDraw}
          disabled={
            current_turn !== 'player' ||
            (gamephase === 'setup' && playerHand.length >= 3) ||
            (gamephase === 'main' && drawCount >= 1)
          }
        >
          Draw
        </button>
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
                ${ isSelected ? 'card-selected' : ''}
                ${ isQuestioned ? 'card-questioned' : ''}
              `}
              onClick={() => {
                if (current_turn === 'player' && gamephase === 'main') {
                  if (selectedCardForAsk !==null) {
                    // in asking card mode
                    handleAskCardsSelection(card);
                  } else { // normal turn - handle pair making
                    handleCardClick(card, index);
                  }
                } else if (current_turn === 'opponent' && opponentQuestion) {
                  handleGiveCardToOpponent(card);
                }
              }}
              disabled={
                (current_turn === 'opponent' && !opponentQuestion)
              }>
                {card}
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