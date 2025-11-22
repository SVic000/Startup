// GameService.js - Handles all game logic independent of opponent type

export class GameService {
  constructor(gameID, isMultiplayer = false) {
    this.gameID = gameID;
    this.isMultiplayer = isMultiplayer;
  }

// ---- card opperations --------
// frontend draw function that calls backend
  async draw(currentHand) {
    try {
      const response = await fetch('/api/play/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ gameID: this.gameID })
      });

      if (!response.ok) throw new Error('Failed to draw card');
      
      const data = await response.json();
      
      if (data.Card === -1) {
        return { newHand: currentHand, deckEmpty: true };
      }
      
      const newHand = [...currentHand, data.Card];
      return { newHand, deckEmpty: false };
    } catch (err) {
      console.error('Error drawing card:', err);
      return { newHand: currentHand, deckEmpty: null };
    }
  }


// frontend checkDeck function
  async checkDeck() {
    try {
      const response = await fetch(`/api/play/checkDeck?gameID=${this.gameID}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to check deck');
      
      const data = await response.json();
      return data.value === 1;
    } catch (err) {
      console.error('Error checking deck:', err);
      return false;
    }
  }

  // --------------- PAIR CHECKING ---------------
  checkForPair(hand, card1Index, card2Index) {
    const card1 = hand[card1Index];
    const card2 = hand[card2Index];
    
    if (card1.value === card2.value || card1 === card2) {
      const newHand = hand.filter((_, i) => i !== card1Index && i !== card2Index);
      return { isPair: true, newHand, pairValue: card1 };
    }
    
    return { isPair: false, newHand: hand, pairValue: null };
  }

  // if it's Frank
  checkHandForPairs(hand) {
    const cardCounts = {};
    hand.forEach(card => {
      cardCounts[card] = (cardCounts[card] || 0) + 1;
    });

    let pairsFound = 0;
    const newHand = [...hand];
    const pairedCards = [];
    
    Object.entries(cardCounts).forEach(([card, count]) => {
      const cardNum = parseInt(card);
      if (count >= 2) {
        let removed = 0;
        for (let i = newHand.length - 1; i >= 0; i--) {
          if (newHand[i] === cardNum && removed < 2) {
            newHand.splice(i, 1);
            removed++;
          }
        }
        pairsFound++;
        pairedCards.push(cardNum);
      }
    });
    
    return { pairsFound, newHand, pairedCards };
  }

  // -------------- ASKING & GIVING CARDS -------------
  
  askForCard(askingHand, receivingHand, cardValue) {
    const matchingCards = receivingHand.filter(card => card === cardValue);
    
    if (matchingCards.length > 0) {
      const newReceivingHand = receivingHand.filter(card => card !== cardValue);
      const newAskingHand = [...askingHand, ...matchingCards];
      
      return {
        success: true,
        newAskingHand,
        newReceivingHand,
        cardsTransferred: matchingCards.length
      };
    }
    
    return {
      success: false,
      newAskingHand: askingHand,
      newReceivingHand: receivingHand,
      cardsTransferred: 0
    };
  }

  // --------------- GAME STATE  --------------------
  
  checkGameEnd(playerPairs, opponentPairs, deckEmpty, playerHandSize, opponentHandSize) {
    const totalPossiblePairs = 9;
    const totalPairsMade = playerPairs + opponentPairs;
    
    // All pairs found
    if (totalPairsMade >= totalPossiblePairs) {
      return { gameOver: true, reason: 'all_pairs' };
    }
    
    // No cards left anywhere
    if (deckEmpty && playerHandSize === 0 && opponentHandSize === 0) {
      return { gameOver: true, reason: 'no_cards' };
    }
    
    return { gameOver: false, reason: null };
  }

  determineWinner(playerPairs, opponentPairs) {
    if (playerPairs > opponentPairs) return 'player';
    if (opponentPairs > playerPairs) return 'opponent';
    return 'tie';
  }

  // -------------- SCORE UPDATES ---------------
  async updatePlayerScore(pointsToAdd) {
    try {
      const scoreResponse = await fetch('/api/scores');
      const scoreData = await scoreResponse.json();
      const newScore = (scoreData.playerScore || 0) + pointsToAdd;

      await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: newScore })
      });
    } catch (error) {
      console.error('Error updating score:', error);
    }
  }

  // --------------- GAME LIFECYCLE ---------------
  
  async createGame() {
    try {
      const response = await fetch('/api/play/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isMultiplayer: this.isMultiplayer })
      });

      if (!response.ok) throw new Error('Failed to create game');
      
      const data = await response.json();
      this.gameID = data.gameID;
      return data.gameID;
    } catch (err) {
      console.error('Error creating game:', err);
      return null;
    }
  }

  async deleteGame() {
    try {
      const response = await fetch('/api/play/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ gameID: this.gameID })
      });
      
      if (!response.ok) throw new Error('Failed to delete game');
      return true;
    } catch (error) {
      console.error('Error deleting game:', error);
      return false;
    }
  }
}