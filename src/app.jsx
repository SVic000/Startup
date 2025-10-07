import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { Login } from './login/login';
import { Play } from './play/play';
import { Scores } from './scores/scores';
import { Menu } from './menu/menu';

export default function App() {
  return (
    <BrowserRouter>
    <div className="bg-success-subtle min-vh-100 d-flex flex-column">
      <header className="container-fluid text-success-emphasis">
        <nav className="navbar fixed-top">
          <h1 className="text-success-emphasis navbar-brand mb-0">
            <b>CatFishGoFish</b>
          </h1>
          <menu className="navbar-nav d-flex flex-row ms-auto mb-0">
            <li className="nav-item">
              <NavLink className="nav-link" to="">
                Login
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="menu">
                Menu
              </NavLink>
            </li>
            <li className="nav-item">
                <NavLink className="nav-link" to="scores">
                  Scores
                </NavLink>
            </li>
            <li className="nav-item">
                <NavLink className='nav-link' to='play'>
                  Play
                </NavLink>
            </li>
          </menu>
        </nav>
      </header>

      <Routes>
        <Route path='/' element={<Login />} exact />
        <Route path='/menu' element={<Menu />} />
        <Route path='/play' element={<Play />} />
        <Route path='/scores' element={<Scores />} />
        <Route path='*' element={<NotFound />} />
      </Routes>

      <footer className="text-succsess">
        <div className="container-fluid">
          <span className="text-reset">Author Name(s)</span>
          <a className="text-reset" href="https://github.com/webprogramming260/simon-react">
            Source
          </a>
        </div>
      </footer>
    </div>
  </BrowserRouter>
  );
function NotFound() {
  return <main className="container-fluid bg-secondary text-center">404: Return to sender. Address unknown.</main>;
}
}