import React from 'react';
import './menu.css';

export function Menu() {
  return (
      <main className = "container-fluid text-primary-emphasis bg-primary-subtle border border-primary-subtle rounded-3">        
            <div className="d-flex justify-content-center flex-column align-items-center">
                <div>
                <h5 className = "sticky-line text-center text-primary-emphasis"> A random cat fact from a third party API </h5>
                </div>    
                <div className="w-100 text-center so
                ticky-line">
                <p className="sticky-line"> Find a fishing oponent! 🪝 </p>
                <div>
                <form action="play.html">
                    <button className="btn btn-light btn-outline-warning input-group-text rounded-5" style="font-size: 10vw; padding: 2vw 5vw;" type="submit"> <b>Play</b> </button>
                </form>
                </div>
                <br />
                <p> See winnings</p>
                <form action="scores.html">      
                    <button className="btn btn-light btn-outline-primary input-group-text btn-lg" type="submit"> <b> 𓆝 ⋆. </b> </button>
                </form>
                </div>
            </div>
        </main>
  );
}