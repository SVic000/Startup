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

export function updatePlayerScore(pointsToAdd) {
    try {
        const scores = JSON.parse(localStorage.getItem('goFishScores')) || {};

        const currentPlayer = 'player';
        scores[currentPlayer] = (scores[currentPlayer] || 0) + pointsToAdd

        localStorage.setItem('goFishScores', JSON.stringify(scores));
    } catch(error) {
        console.error('Error updating score in localstorage:', error);
    }
}
