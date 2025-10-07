import React from 'react';
import { useNavigate } from 'react-router-dom';
import './play.css'; 

export function Play() {
  const navigate = useNavigate();

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

      <div className="question text-center my-3">
        <p>Where question shows:</p>
        <span><b>Got any threes?</b></span>
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
            <img src="/underconstruction.jpeg" alt="opponent" />
          </div>

        <div className="pair">
          <p className="text-center">
            Opponent Pairs <br />
            𖧋<br />
            𖧋<br />
            𖧋<br />
            ●<br />
          </p>
        </div>
      </div>

      <div className="card-toggle-wrapper">
        <input type="checkbox" id="toggle-cards" className="hidden-checkbox" />
        <label htmlFor="toggle-cards" className="toggle-button text-center">
          Draw (click me)
        </label>

        <div className="card-container">
          <div className="card">🂡</div>
          <div className="card">🃁</div>
          <div className="card">🃑</div>
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
