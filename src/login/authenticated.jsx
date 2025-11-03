import React from 'react';
import { useNavigate } from 'react-router-dom';

import Button from 'react-bootstrap/Button';

export function Authenticated(props) {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem('userName');
    props.onLogout();
  }

  return (
    <div>
      <div className='playerName'>Ready to fish <span id="name"> {props.userName}</span>?</div>
      <br/>
      <Button className="LogI-Menu" onClick={() => navigate('/menu')}>
        Menu
      </Button>
      <Button className="Create-LogO" onClick={() => logout()}>
        Logout
      </Button>
    </div>
  );
}
