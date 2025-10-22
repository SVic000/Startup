import React from 'react';
import './menu.css';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function Menu(props) {
  const navigate = useNavigate();
  const [catFact, setCatFact] = useState("Loading...")

  React.useEffect(()=> {
    setCatFact('Wow, Cats are super cool!');
  }, []);

  return (
    <main className="container-fluid">
      <div className="Main-container d-flex justify-content-center flex-column align-items-center">
        <div>
          <h5 className="CatFact sticky-line text-center text-primary-emphasis">
           {catFact}
          </h5>
        </div>

        <div className="w-100 text-center sticky-line">
          <p>Find a fishing opponent! 🪝</p>

          <button
            id="play"
            className='btn input-group-text'
            onClick={() => navigate('/play')}
          >
            <b>Play</b>
          </button>

          <br />
          <p>See your winnings</p>

          <button
          id='scores'
            className="btn input-group-text"
            onClick={() => navigate('/scores')}
          >
            <b>𓆝 ⋆.</b>
          </button>
        </div>
      </div>
    </main>
  );
}
