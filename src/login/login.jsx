import React from 'react';
import './login.css';

export function Login() {
  return (
    <main className="container-fluid text-center text-primary-emphasis bg-primary-subtle border border-primary-subtle rounded-3">
      <div>
        <h1 className="responsive-heading">
          𓆝 𓆟 𓆞 Welcome to <b>CatFishGoFish!</b> 𓆝 𓆟 𓆞
        </h1>
        <br />
        <form method="get" action="/menu">
          <div className="narrow-content input-group mb-3">
            <span className="btn-light btn-outline-primary input-group-text text-primary-emphasis" type="text">
              <b>Login</b>
            </span>
            <input className="form-control" type="text" placeholder="your@email.com" />
          </div>

          <div className="narrow-content input-group mb-3">
            <span className="btn-light btn-outline-primary input-group-text text-primary-emphasis" type="password">
              <b>Password</b>
            </span>
            <input className="form-control" type="password" placeholder="password" />
          </div>

          <button type="submit" className="btn btn-light btn-outline-primary input-group-text">
            <b>Login</b>
          </button>
          {' '}
          <button type="submit" className="btn btn-light btn-outline-secondary input-group-text">
            <b>Create</b>
          </button>
        </form>
      </div>
    </main>
  );
}
