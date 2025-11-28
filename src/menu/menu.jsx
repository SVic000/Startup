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
  const [iteration, setIteration] = useState(0); // cycle through expressions
  const expressions = ["Default", "Shocked", "No", "Annoyed", "GameEnd", "Excited"]
  const [selectedCat, setSelectedCat] = useState(null); // currently selected

  // first make a call to db to check what the players cat face is! 
  // set player cat face to that

React.useEffect(() => {
  fetch('/api/cat/get', { method: 'GET', credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (data.cat) setSelectedCat(data.cat);
    })
    .catch(err => console.error(err));
}, []);



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
  
// changes cat expression
  React.useEffect(()=> {
  if (!catMenu) return; 
  const interval = setInterval(() => {
    setIteration(prev => {
      const next = (prev + 1) % expressions.length;
      setExpression(expressions[next]);
      return next;
    });
  }, 1000);
  return () => clearInterval(interval);

     },[catMenu])

  if(catMenu) {

    return (
      <main>
        <div className="text-center">
          select a cat
          <p> This cat will be how you present to other players!</p>
        </div>

      <div className="cat-container">
        {["Frank", "Darla", "Mike","Ricky"].map(cat => (
          <div
            key={cat}
            className={`cat-card ${selectedCat === cat ? "selected" : ""}`}
            onClick={() => setSelectedCat(cat)}
          >
            <img
              className={cat === "Mike" ? "mike-img" : "cat-img"}
              width="200"
              src={`/${cat}${expression}.PNG`}
              alt={`${cat} ${expression} expression`}
            />
            <button className={`cat-name ${selectedCat === cat ? "selected" : ""}`}><b>{cat}</b></button>
          </div>
        ))}
      </div>

        <button
          id="apply"
          onClick={() => {
            if (!selectedCat) return;
            fetch('/api/cat/update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ cat: selectedCat }),
            })
            .then(res => res.json())
            .then(data => {
              console.log("Cat updated to:", data.cat);
              alert(`Your cat is now ${data.cat}!`);
            })
            .catch(err => console.error(err));
          }}
        >
          <b>Apply</b>
        </button>
        <button id="leave-cat" onClick={changeMenu}>
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
          <button id = "cat-menu" onClick={changeMenu}>
            Cat Menu
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
