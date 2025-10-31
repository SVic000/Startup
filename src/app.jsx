import React from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { Login } from './login/login';
import { Play } from './play/play';
import { Scores } from './scores/scores';
import { Menu } from './menu/menu';
import { AuthState } from './login/authState';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';

function App() {
    const [userName, setUserName] = React.useState(localStorage.getItem('userName') || '');
    const currentAuthState = userName ? AuthState.Authenticated : AuthState.Unauthenticated;
    const [authState, setAuthState] = React.useState(currentAuthState);

  return (
    <BrowserRouter>
    <div id="nav" className="min-vh-100 d-flex flex-column">
      <header className="container-fluid">
        <nav className="navbar">
          <h1 className="navbar-brand">
            <b>CatFishGoFish</b>
          </h1>
          <menu className="navbar-nav d-flex flex-row ms-auto mb-0"> 
            <li>
              <NavLink className = "link" to="">
                Login
              </NavLink>
            </li>
            {authState === AuthState.Authenticated && (
            <li>
              <NavLink className = "link" to="menu">
                Menu
              </NavLink>
            </li>
            )}
            {authState === AuthState.Authenticated && (
            <li>
                <NavLink className = "link" to="scores">
                  Scores
                </NavLink>
            </li>
            )}
          </menu>
        </nav>
      </header>

      <Routes>
        <Route path='/' element={<Login 
            userName={userName}
            authState={authState}
            onAuthChange={(userName, authState)=> {
              setAuthState(authState);
              setUserName(userName);
            }}/>} exact />
        <Route path='/menu' element={<Menu />} />
        <Route path='/play' element={<Play />} />
        <Route path='/scores' element={<Scores />} />
        <Route path='*' element={<NotFound />} />
      </Routes>

      <footer>
        <div className="container-fluid">
          <span className="text-reset">Author Name</span>
          <a className="text-reset" href="https://github.com/SVic000/Startup/">
            Github!
          </a>
        </div>
      </footer>
    </div>
  </BrowserRouter>
  );
  
function NotFound() {
  return <main className="container-fluid text-center">404: Return to sender. Address unknown.</main>;
}
}

export default App;