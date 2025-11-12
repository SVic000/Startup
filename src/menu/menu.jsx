import React from 'react';
import './menu.css';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function Menu(props) {
  const navigate = useNavigate();
  const [catFact, setCatFact] = useState("Loading...")

  React.useEffect(()=> {
    fetch('https://catfact.ninja/fact')
    .then((response) => response.json())
    .then((data) => {
      setCatFact(data.fact)})
    .catch();
  }, []);

  return (
    <main className="container-fluid">
      <div className="Main-container d-flex justify-content-center flex-column align-items-center">
        <div id="catfact" className="sticky-line text-center">
          <h6> Fun Fact!</h6>
          <h6>
           {catFact}
          </h6>
        </div>

        <div className="w-100 text-center sticky-line">
          <p>Find an opponent!</p>

          <button
            id="play"
            className='btn input-group-text'
            onClick={() => navigate('/play')}
          >
            <b>Play</b>
          </button>

          <br />
          <br />
          <br />
          <p>⤹ See how many times you've won! ⤵</p>

          <button
          id='scores'
            className="btn input-group-text"
            onClick={() => navigate('/scores')}
          >
            <b>𓆝  ⋆.</b>
          </button>
        </div>
      </div>
    </main>
  );
}
