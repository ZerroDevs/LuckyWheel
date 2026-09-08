class BlackjackEngine {
    constructor() {
        this.deck = [];
        this.playerHand = [];
        this.dealerHand = [];
        this.gameState = 'idle'; // 'idle', 'playing', 'finished'
        
        // Suits and Values
        this.suits = ['♠', '♥', '♦', '♣'];
        this.values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const dealBtn = document.getElementById('bjDealBtn');
        const hitBtn = document.getElementById('bjHitBtn');
        const standBtn = document.getElementById('bjStandBtn');
        
        if (dealBtn) dealBtn.addEventListener('click', () => this.startGame());
        if (hitBtn) hitBtn.addEventListener('click', () => this.playerHit());
        if (standBtn) standBtn.addEventListener('click', () => this.playerStand());
    }
    
    buildDeck() {
        this.deck = [];
        for (let suit of this.suits) {
            for (let value of this.values) {
                this.deck.push({ suit, value });
            }
        }
        // Shuffle
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }
    
    calculateScore(hand) {
        let score = 0;
        let aces = 0;
        
        for (let card of hand) {
            if (card.value === 'A') {
                aces += 1;
                score += 11;
            } else if (['J', 'Q', 'K'].includes(card.value)) {
                score += 10;
            } else {
                score += parseInt(card.value);
            }
        }
        
        while (score > 21 && aces > 0) {
            score -= 10;
            aces -= 1;
        }
        
        return score;
    }
    
    startGame() {
        if (this.gameState === 'playing') return;
        
        if (typeof soundEffects !== 'undefined') soundEffects.playSpin();
        
        this.buildDeck();
        this.playerHand = [];
        this.dealerHand = [];
        this.gameState = 'playing';
        
        this.updateStatus("Dealing...");
        this.updateControls(); // disable hit/stand while dealing
        
        // Clear board initially
        const pContainer = document.getElementById('playerHand');
        const dContainer = document.getElementById('dealerHand');
        if (pContainer) pContainer.innerHTML = '';
        if (dContainer) dContainer.innerHTML = '';
        
        const dealSequence = [
            { hand: this.playerHand, target: 'player' },
            { hand: this.dealerHand, target: 'dealer' },
            { hand: this.playerHand, target: 'player' },
            { hand: this.dealerHand, target: 'dealer' }
        ];
        
        let step = 0;
        
        const dealNext = () => {
            if (step < dealSequence.length) {
                if (typeof soundEffects !== 'undefined') soundEffects.playTick();
                
                dealSequence[step].hand.push(this.deck.pop());
                this.renderBoard();
                
                step++;
                setTimeout(dealNext, 400); // 400ms delay between cards
            } else {
                this.updateStatus("");
                this.updateControls();
                
                // Check for immediate player blackjack
                if (this.calculateScore(this.playerHand) === 21) {
                    setTimeout(() => this.playerStand(), 500);
                }
            }
        };
        
        dealNext();
    }
    
    playerHit() {
        if (this.gameState !== 'playing') return;
        if (typeof soundEffects !== 'undefined') soundEffects.playTick();
        
        this.playerHand.push(this.deck.pop());
        this.renderBoard();
        
        if (this.calculateScore(this.playerHand) > 21) {
            this.endGame('Player Busts! Dealer Wins.');
        }
    }
    
    playerStand() {
        if (this.gameState !== 'playing') return;
        if (typeof soundEffects !== 'undefined') soundEffects.playTick();
        
        this.gameState = 'dealerTurn';
        this.updateControls();
        this.renderBoard(); // Reveal dealer card
        
        this.dealerPlay();
    }
    
    dealerPlay() {
        const dealerLogic = () => {
            if (this.calculateScore(this.dealerHand) < 17) {
                if (typeof soundEffects !== 'undefined') soundEffects.playTick();
                this.dealerHand.push(this.deck.pop());
                this.renderBoard();
                setTimeout(dealerLogic, 800);
            } else {
                this.evaluateWinner();
            }
        };
        setTimeout(dealerLogic, 800);
    }
    
    evaluateWinner() {
        const pScore = this.calculateScore(this.playerHand);
        const dScore = this.calculateScore(this.dealerHand);
        
        if (dScore > 21) {
            this.endGame('Dealer Busts! You Win!');
        } else if (pScore > dScore) {
            this.endGame('You Win!');
        } else if (dScore > pScore) {
            this.endGame('Dealer Wins!');
        } else {
            this.endGame('Push (Tie)!');
        }
    }
    
    endGame(message) {
        this.gameState = 'finished';
        this.updateStatus(message);
        this.updateControls();
        this.renderBoard();
        
        if (message.includes('Win!')) {
            if (typeof soundEffects !== 'undefined') soundEffects.playVictory();
            if (typeof confettiInstance !== 'undefined' && confettiInstance) {
                confettiInstance.celebrate();
            }
        }
    }
    
    updateStatus(msg) {
        const statusEl = document.getElementById('bjStatus');
        if (statusEl) {
            statusEl.textContent = msg;
        }
    }
    
    updateControls() {
        const dealBtn = document.getElementById('bjDealBtn');
        const hitBtn = document.getElementById('bjHitBtn');
        const standBtn = document.getElementById('bjStandBtn');
        
        // Check if we're in the middle of dealing
        const isDealing = this.gameState === 'playing' && this.playerHand.length < 2;
        
        if (dealBtn) dealBtn.style.display = (this.gameState === 'idle' || this.gameState === 'finished') ? 'block' : 'none';
        if (hitBtn) hitBtn.disabled = (this.gameState !== 'playing' || isDealing);
        if (standBtn) standBtn.disabled = (this.gameState !== 'playing' || isDealing);
    }
    
    createCardDOM(card, hidden = false, targetContainerId = null) {
        const el = document.createElement('div');
        el.className = 'bj-card dealt';
        if (card.suit === '♥' || card.suit === '♦') {
            el.classList.add('red');
        }
        
        // Calculate starting position from Shoe
        const shoe = document.getElementById('bjShoe');
        const container = document.getElementById(targetContainerId);
        
        if (shoe && container) {
            // We defer calculation slightly until the card is in DOM to get exact position
            // But we can approximate based on container vs shoe for now
            const shoeRect = shoe.getBoundingClientRect();
            const contRect = container.getBoundingClientRect();
            
            // X offset from container center to shoe center
            const startX = (shoeRect.left + shoeRect.width/2) - (contRect.left + contRect.width/2);
            // Y offset from container center to shoe center
            const startY = (shoeRect.top + shoeRect.height/2) - (contRect.top + contRect.height/2);
            
            el.style.setProperty('--startX', `${startX}px`);
            el.style.setProperty('--startY', `${startY}px`);
        }
        
        if (hidden) {
            el.classList.add('hidden');
        } else {
            el.innerHTML = `
                <div class="card-top">
                    <span class="card-value">${card.value}</span>
                    <span class="card-suit">${card.suit}</span>
                </div>
                <div class="card-center">${card.suit}</div>
                <div class="card-bottom">
                    <span class="card-value">${card.value}</span>
                    <span class="card-suit">${card.suit}</span>
                </div>
            `;
        }
        return el;
    }
    
    renderBoard() {
        const pContainer = document.getElementById('playerHand');
        const dContainer = document.getElementById('dealerHand');
        const pScoreEl = document.getElementById('playerScore');
        const dScoreEl = document.getElementById('dealerScore');
        
        if (!pContainer || !dContainer) return;
        
        pContainer.innerHTML = '';
        dContainer.innerHTML = '';
        
        // Render Player
        this.playerHand.forEach(card => {
            pContainer.appendChild(this.createCardDOM(card, false, 'playerHand'));
        });
        if (pScoreEl) {
            pScoreEl.textContent = this.playerHand.length > 0 ? this.calculateScore(this.playerHand) : '0';
        }
        
        // Render Dealer
        this.dealerHand.forEach((card, index) => {
            // Hide second card if still playing
            const hide = (index === 1 && this.gameState === 'playing');
            dContainer.appendChild(this.createCardDOM(card, hide, 'dealerHand'));
        });
        
        if (dScoreEl) {
            if (this.gameState === 'playing' && this.dealerHand.length > 0) {
                // Only show score of first card
                dScoreEl.textContent = this.calculateScore([this.dealerHand[0]]);
            } else {
                dScoreEl.textContent = this.dealerHand.length > 0 ? this.calculateScore(this.dealerHand) : '0';
            }
        }
    }
}

let blackjackEngine = null;

function initBlackjack() {
    if (!blackjackEngine) {
        blackjackEngine = new BlackjackEngine();
    }
    return blackjackEngine;
}
