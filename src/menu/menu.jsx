import React from 'react';
import './menu.css';
import { useNavigate } from 'react-router-dom';

export function Menu() {
  const navigate = useNavigate();

  return (
    <main className="container-fluid text-primary-emphasis bg-primary-subtle border border-primary-subtle rounded-3">
      <div className="d-flex justify-content-center flex-column align-items-center">
        <div>
          <h5 className="sticky-line text-center text-primary-emphasis">
            A random cat fact from a third party API
          </h5>
        </div>

        <div className="w-100 text-center sticky-line">
          <p className="sticky-line">Find a fishing opponent! 🪝</p>

          <button
            className="btn btn-light btn-outline-warning input-group-text rounded-5"
            style={{ fontSize: '10vw', padding: '2vw 5vw' }}
            onClick={() => navigate('/play')}
          >
            <b>Play</b>
          </button>

          <br />
          <p>See winnings</p>

          <button
            className="btn btn-light btn-outline-primary input-group-text btn-lg"
            onClick={() => navigate('/scores')}
          >
            <b>𓆝 ⋆.</b>
          </button>
        </div>
      </div>
    </main>
  );
}
