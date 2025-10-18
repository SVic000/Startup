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
  
  const [availDeck, setAvailDeck] = useState([1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9]);
  const [playerHand, setPlayerHand] = useState([]);
  const [opponentHand, setOpponentHand] = useState([]);
  const opponentHandRef = useRef([]); // refs for mock hands
  const availDeckRef = useRef([]); // refs for mock hands

  const [playerPairs, setPlayerPair] = useState(0);
  const [opponentPairs, setOpponentPair] = useState(0);
  
  const [message, setMessage] = useState('');

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
        setMessage("They start! They'll draw 3 cards...");
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
      setMessage('Opponent drawing their 3 cards...');
      
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
            (gamephase === 'setup' && playerHand.length >= 3) || // Use playerHand.length instead of drawCount
            (gamephase === 'main' && drawCount >= 1)
          }
        >
          Draw
        </button>
      </div>

      <div className="card-toggle-wrapper">
        <div className="card-container">
          {playerHand.map((card, index) => (
            <button key={index} className={`card card-${card}`}>
              {card}
            </button>
          ))}
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