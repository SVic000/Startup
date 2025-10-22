import React from 'react';
import { useNavigate } from 'react-router-dom';
import './scores.css';

export function Scores() {
  const navigate = useNavigate();
  const [score, setScore] = React.useState([]);

  React.useEffect(() => {
    const savedScores = JSON.parse(localStorage.getItem('goFishScores')) || {};
    setScore(savedScores);
  }, []);


  return (
    <main className="container-fluid">
      <br/>
      <div id="hold" className="d-flex justify-content-center flex-column align-items-center">
        <p className='words'><b>YOU'VE CAUGHT</b></p>
        <p className='words'>𓆞 <span id='score'><b>{score.player}</b></span> 𓆝</p>
        <p className='words'><b>FISH!</b></p>
        <p className='words'><b>Congratulations!</b></p>
      </div>

      <div>
        <button
          type="button"
          id='menu'
          className="btn btn-outline-primary input-group-text"
          onClick={() => navigate('/menu')}
        >
          <b>Return to Menu</b>
        </button>
      </div>
    </main>
  );
}
