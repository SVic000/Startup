// Hold everything in logic here
// frontend checkDeck function
export async function checkDeck() {
  try {
    const response = await fetch('/api/play/checkDeck', {
      method: 'GET',
      credentials: 'include', // include auth cookie
    });

    if (!response.ok) {
      throw new Error('Failed to check deck on server.');
    }

    const data = await response.json();

    // backend sends { value: 0 } if empty, { value: 1 } if cards available
    return data.value === 1; // true if deck has cards, false if empty

  } catch (err) {
    console.error('Error checking deck:', err);
    return false; // safest fallback: treat as empty
  }
}

// frontend draw function that calls backend
export async function draw(currentHand) {
  try { // add the stuff here that calls to back end so you can change the player hand there.
    // Call backend to draw a card
    const response = await fetch('/api/play/draw', {
      method: 'GET',
      credentials: 'include', // include auth cookie for auth
    });

    if (!response.ok) {
      throw new Error('Failed to draw a card from the server.');
    }

    const data = await response.json();

    // Backend sends { Card: -1 } if deck is empty
    if (data.Card === -1) {
      // console.log('Deck is empty, no card drawn.');
      return { newHand: currentHand, deckEmpty: false };
    }

    // Add the drawn card to the hand
    const newHand = [...currentHand, data.Card];
    return { newHand, deckEmpty: true };

  } catch (err) {
    console.error('Error drawing card:', err);
    return { newHand: currentHand, deckEmpty: null };
  }
}


export async function updatePlayerScore(pointsToAdd) {
    try {
        let newScore = pointsToAdd
        await fetch('/api/scores')
        .then((response)=> response.json())
        .then((score)=> {
            newScore+= score.playerScore || 0
        })

// make the api call here to change the player score!
        await fetch('/api/score', {
            method: 'POST',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({score : newScore})
        })
    } catch(error) {
        console.error('Error updating score in Service:', error);
    }
}

// function to call backend to check gamephase

// function to call backend to know how many draws the player has?