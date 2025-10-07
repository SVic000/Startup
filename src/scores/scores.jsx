import React from 'react';
import './scores.css';

export function Scores() {
  return (
        <main className="container-fluid text-primary-emphasis bg-primary-subtle border border-primary-subtle rounded-3">
          <div>
            <div className="d-flex justify-content-center flex-column align-items-center">
            <h3> <b>YOU'VE CAUGHT</b> </h3>
            <br />
            <a className="btn btn-primary disabled placeholder col-4" style="width: 100px; height: 50px;" aria-disabled="true"></a>
            <br />
            <h3>𓆞 <b>FISH</b> 𓆝</h3>
            <p> <b>Congratulations!</b></p>
            </div>
            <div className="d-flex justify-content-center flex-column align-items-center">
            <form action="menu.html">
            <button type="submit" className="btn btn-light btn-outline-primary input-group-text"><b>Return to Menu</b></button>
            </form>
            </div>
          </div>
        </main>
  );
}