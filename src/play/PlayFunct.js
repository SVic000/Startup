// Hold everything in logic here

const question = document.querysSelector("#question b");
const turn = document.getElementById("turn");
const draw_button = document.getElementById('draw')

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

let drawClick = 0;

export function draw_first_cards(count) {
    if(count < 3) {
        if( count === 0) {
            // your turn!
            question.textcontent("You Start! Draw 3 Cards!")
            draw_button.addeventlistener('click', () => {
                drawClick++;
                if( drawClick >= 3) {
                    draw_button.disabled = true;
                }
            })
            count++;
        }
        else {
            // they start
            question.textcontent("They Start! You'll draw 3 cards after them!")
            count++;
        }
    }
}

// maybe add here the first game conditions? like turns and whatnot
