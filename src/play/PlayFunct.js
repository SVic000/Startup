// Hold everything in logic here

export function draw(deck, hand) {
    if(deck.length === 0) {
        // no cards left in pile
        // perhaps just end the players turn? since draw is usually a last instance?
        return {newDeck: deck, newHand: hand};
    }
    const randomIndex = Math.floor(Math.random() * deck.length);
    const randomCard = deck[randomIndex]; // pick available random num

    const newDeck = [...deck];
    newDeck.splice(randomIndex, 1);
    const newHand = [...hand, randomCard];

    return { newDeck, newHand };
}

export async function updatePlayerScore(pointsToAdd) {
    try {
        let newScore = pointsToAdd
        await fetch('/api/scores')
        .then((response)=> response.json())
        .then((score)=> {
            console.log(score.playerScore);
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
