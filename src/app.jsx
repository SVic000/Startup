import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';

export default function App() {
  return (
    <div className="body bg-success-subtle">
      <header className="container-fluid">
        <nav className="navbar fixed-top">
          <div className="navbar-brand">
            CatfishGoFish
          </div>
          <menu className="navbar-nav">
            <li className="nav-item">
              <a className="nav-link" href="index.html">
                Home
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="Menu.html">
                Menu
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="scores.html">
                Scores
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="Play.html">
                Play
              </a>
            </li>
          </menu>
        </nav>
      </header>

      <main>App components go here</main>

      <footer className="bg-dark text-white-50">
        <div className="container-fluid">
          <span className="text-reset">Author Name(s)</span>
          <a className="text-reset" href="https://github.com/webprogramming260/simon-react">
            Source
          </a>
        </div>
      </footer>
    </div>
  );
}