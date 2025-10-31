import React from 'react';
import { Unauthenticated } from './unauthenticated';
import { Authenticated } from './authenticated';
import { AuthState } from './authState';
import './login.css';

export function Login( {userName, authState, onAuthChange }) {
  return (
    <main className="container-fluid text-center">
          <div>
             <h1 className="responsive-heading">
          𓆝 𓆟 𓆞 <span> Welcome to <b>CatFishGoFish!</b> </span> 𓆝 𓆟 𓆞
        </h1>
            {authState === AuthState.Authenticated && (
              <Authenticated userName={userName} onLogout={() => onAuthChange(userName, AuthState.Unauthenticated)} />
            )}
            {authState === AuthState.Unauthenticated && (
              <Unauthenticated
                userName={userName}
                onLogin={(loginUserName) => {
                  onAuthChange(loginUserName, AuthState.Authenticated);
                }}
              />
            )}
          </div>
    </main>

  );
}
