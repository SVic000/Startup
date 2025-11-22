export class OpponentManager {
    constructor(type = 'ai', gameService, socket = null) {
        this.type = type;
        this.gameService = gameService;
        this.socket = socket; // Raw WebSocket connection
        this.messageHandlers = new Map();
    }

    // ===== AI Logic =======
    aiChooseCardToAsk(opponentHand) {
        if (opponentHand.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * opponentHand.length);
        return opponentHand[randomIndex];
    }

    async aiTakeTurn(opponentHand, playerHand) {
        const cardToAsk = this.aiChooseCardToAsk(opponentHand);

        if (!cardToAsk) {
            return { action: 'no_cards', cardAsked: null };
        }

        return { action: 'ask', cardAsked: cardToAsk };
    }

    // ===== Multiplayer Logic (Raw WebSocket) =====
    waitForOpponentAction() {
        return new Promise((resolve) => {
            const handler = (event) => {
                const message = JSON.parse(event.data);
                if (message.type === 'opponent-action') {
                    this.socket.removeEventListener('message', handler);
                    resolve(message);
                }
            };
            this.socket.addEventListener('message', handler);
        });
    }

    sendActionToOpponent(action, data) {
        if (!this.socket || this.socket.readyState !== 1) return;
        
        this.socket.send(JSON.stringify({
            type: 'player-action',
            gameID: this.gameService.gameID,
            action,
            data
        }));
    }

    // ===== Unified Interface =====
    async getOpponentMove(opponentHand, playerHand) {
        if (this.type === 'ai') {
            return await this.aiTakeTurn(opponentHand, playerHand);
        } else {
            return await this.waitForOpponentAction();
        }
    }

    notifyOpponentOfAction(action, data) {
        if (this.type === 'human') {
            this.sendActionToOpponent(action, data);
        }
    }

    // ===== WebSocket Event Listeners =====
    onOpponentDisconnected(callback) {
        if (this.socket) {
            const handler = (event) => {
                const message = JSON.parse(event.data);
                if (message.type === 'opponent-disconnected') {
                    callback();
                }
            };
            this.socket.addEventListener('message', handler);
            this.messageHandlers.set('opponent-disconnected', handler);
        }
    }

    onGameStateUpdate(callback) {
        if (this.socket) {
            const handler = (event) => {
                const message = JSON.parse(event.data);
                if (message.type === 'game-state-update') {
                    callback(message);
                }
            };
            this.socket.addEventListener('message', handler);
            this.messageHandlers.set('game-state-update', handler);
        }
    }

    removeAllListeners() {
        if (this.socket) {
            this.messageHandlers.forEach((handler) => {
                this.socket.removeEventListener('message', handler);
            });
            this.messageHandlers.clear();
        }
    }

    // ===== Dialogue & Reactions (same as before) =====
    getDialogue(situation, cardValue = null) {
        const dialogues = {
            ask: [`Do you have any ${cardValue}s?`, `Got any ${cardValue}s?`, `Hand over your ${cardValue}s!`],
            got_card: ["Thanks for the card!", "That's a steal!", "Heh, nice."],
            no_card: [`Heh. I don't have any ${cardValue}s`, `Nope, no ${cardValue}s here!`, `Go fish!`],
            lost_card: ["I didn't want that card anyway...", `No! My ${cardValue}!`, "Aww man."],
            go_fish: ["Rats. I need that card.", "Darn it!", "Unfortunate for me."],
            made_pair: ["Yes! A pair!", "I feel richer!", "Fish caught!"],
            game_end_win: ["Heh, you were a tough foe. Good game!", "I win! Thanks for the game!", "Victory is mine!"],
            game_end_lose: ["Oof, you were a strong opponent! Good game!", "You got me! Well played!", "Nice win!"],
            game_end_tie: ["A tie! We're equally matched! Good game!", "What a close match!", "Impressive! We played well!"],
        };
        const options = dialogues[situation] || ['. . .'];
        return options[Math.floor(Math.random() * options.length)];
    }

    getExpression(situation) {
        const expressions = {
            default: 'Default', asking: 'Default', got_card: 'Excited',
            gave_card: 'Shocked', no_card: 'No', annoyed: 'Annoyed', game_end: 'GameEnd'
        };
        return expressions[situation] || 'Default';
    }
}