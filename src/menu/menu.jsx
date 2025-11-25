import React from 'react';
import './menu.css';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function Menu(props) {
  const navigate = useNavigate();
  const [catFact, setCatFact] = useState("Loading...");
  const [playerCat, setPlayerCat] = useState(null); // for if the player wants to change their cat?
  const [catMenu, setCatMenu] = useState(false);
  const [expression, setExpression] = useState('Default');
  const [iteration, setIteration] = useState(0);
  const expressions = ["Default", "Shocked", "No", "Annoyed", "GameEnd", "Excited"]

  // first make a call to db to check what the players cat face is! 
  // set player cat face to that
/*
  React.useEffect(()=> {
    fetch('api/cat')
    .then((response) => response.json())
    .then((data) => {
      setPlayerCat(data.cat)
    .catch();
    })
  }, []);
  */


  // then when players click a button change the render to the cats (cycling through expressions)
  // when player clicks on cat will call db and change their cat!

  React.useEffect(()=> {
    fetch('https://catfact.ninja/fact')
    .then((response) => response.json())
    .then((data) => {
      setCatFact(data.fact)})
    .catch();
  }, []);
  

  function changeMenu() {
    if(catMenu) {
      setCatMenu(false);
    } else {
      setCatMenu(true);
    }
  };

  function changeExpression() {
    if(iteration > 6) {
      setIteration(0);
    }
    setExpression(expressions[iteration]);
    setIteration((prev) => prev + 1)
  }

      React.useEffect(()=> {
      if (!catMenu) return; 
      const interval = setInterval(() => {
        setIteration(prev => {
          const next = (prev + 1) % expressions.length;
          setExpression(expressions[next]);
          return next;
        });
      }, 1000);
  return () => clearInterval(interval); // cleanup when menu closes

     },[catMenu])

  if(catMenu) {

    return (
      <main>
        <div>
          select a cat
          <p> This cat will be how you present to other players!</p>
        </div>
        <div className = "flex-container">
          <img id="Frank" width = '200' src={`/Frank${expression}.PNG`} alt={`Frank ${expression} expression`}/>
          <img id="Darla" width = '200' src={`/Darla${expression}.PNG`} alt={`Darla ${expression} expression`}/>
          <img id="Mike" width = '200' src={`/Mike${expression}.PNG`} alt={`Mike ${expression} expression`}/>
          <img id="Ricky" width = '200' src={`/Ricky${expression}.PNG`} alt={`Ricky ${expression} expression`}/>
        </div>
        <button> apply </button>
        <button onClick={changeMenu}>
          leave the cat menu!
        </button>
      </main>
    );
  }

  return (
    <main className="container-fluid">
      <div className="Main-container d-flex justify-content-center flex-column align-items-center">
        <div id="catfact" className="sticky-line text-center">
          <h6> Fun Fact!</h6>
          <h6>
           {catFact}
          </h6>
        </div>

        <div className="w-100 text-center sticky-line">
          <p>Find an opponent!</p>

          <button
            id="play"
            className='btn input-group-text'
            onClick={() => navigate('/play')}
          >
            <b>Play</b>
          </button>

          <br />
          <p> Select your cat!</p>
          <button onClick={changeMenu}>
            cat menu
          </button>
          <p>⤹ See how many times you've won! ⤵</p>

          <button
          id='scores'
            className="btn input-group-text"
            onClick={() => navigate('/scores')}
          >
            <b>𓆝  ⋆.</b>
          </button>
        </div>
      </div>
    </main>
  );
}
