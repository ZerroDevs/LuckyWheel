class CoinFlipEngine {
    constructor() {
        this.entries = [];
        this.isFlipping = false;
        this.headsEntry = null;
        this.tailsEntry = null;
        this.flipCount = 0; // keeps track so we can continuously add rotation
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const flipBtn = document.getElementById('cfFlipBtn');
        const shuffleBtn = document.getElementById('cfShuffleBtn');
        const coinWrapper = document.getElementById('coinWrapper');
        
        if (flipBtn) flipBtn.addEventListener('click', () => this.flip());
        if (shuffleBtn) shuffleBtn.addEventListener('click', () => this.assignEntries());
        if (coinWrapper) coinWrapper.addEventListener('click', () => this.flip());
    }
    
    setEntries(entries) {
        this.entries = entries;
        if (!this.headsEntry || !this.tailsEntry) {
            this.assignEntries();
        }
    }
    
    getRandomEntry() {
        if (!this.entries || this.entries.length === 0) return null;
        const totalWeight = this.entries.reduce((sum, entry) => sum + (entry.weight || 1), 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < this.entries.length; i++) {
            const weight = this.entries[i].weight || 1;
            if (random < weight) {
                return this.entries[i];
            }
            random -= weight;
        }
        return this.entries[0];
    }
    
    assignEntries() {
        if (this.isFlipping) return;
        
        if (!this.entries || this.entries.length < 2) {
            this.headsEntry = this.getRandomEntry();
            this.tailsEntry = this.getRandomEntry();
        } else {
            // Pick two different entries if possible
            this.headsEntry = this.getRandomEntry();
            let attempts = 0;
            do {
                this.tailsEntry = this.getRandomEntry();
                attempts++;
            } while (this.tailsEntry.id === this.headsEntry.id && attempts < 10);
        }
        
        this.renderCoinFaces();
        
        if (typeof soundEffects !== 'undefined') soundEffects.playClick();
    }
    
    renderCoinFaces() {
        const headsNode = document.getElementById('cfHeadsContent');
        const tailsNode = document.getElementById('cfTailsContent');
        
        if (headsNode && this.headsEntry) {
            this.renderEntryIntoNode(this.headsEntry, headsNode);
        }
        if (tailsNode && this.tailsEntry) {
            this.renderEntryIntoNode(this.tailsEntry, tailsNode);
        }
    }
    
    renderEntryIntoNode(entry, node) {
        node.innerHTML = '';
        const text = document.createElement('div');
        text.className = 'coin-entry-text';
        text.textContent = entry.text;
        node.appendChild(text);
        
        if (entry.image) {
            const img = document.createElement('img');
            img.src = entry.image;
            img.className = 'coin-entry-img';
            node.appendChild(img);
        }
    }
    
    flip() {
        if (this.isFlipping || !this.headsEntry || !this.tailsEntry) {
            if (!this.entries || this.entries.length === 0) {
                alert("Please add some entries first!");
            }
            return;
        }
        
        this.isFlipping = true;
        
        const flipBtn = document.getElementById('cfFlipBtn');
        const shuffleBtn = document.getElementById('cfShuffleBtn');
        if (flipBtn) flipBtn.disabled = true;
        if (shuffleBtn) shuffleBtn.disabled = true;
        
        if (typeof soundEffects !== 'undefined') soundEffects.playSpin();
        
        const coin = document.getElementById('coin');
        
        // Decide winner based on overall weights
        // The coin doesn't just flip 50/50, it flips according to the relative weights of the two chosen items!
        const weightH = this.headsEntry.weight || 1;
        const weightT = this.tailsEntry.weight || 1;
        const total = weightH + weightT;
        
        const isHeads = (Math.random() * total) < weightH;
        
        this.flipCount++;
        
        // Base rotation is flipCount * 5 spins (1800 deg)
        let rotation = this.flipCount * 1800;
        
        if (!isHeads) {
            // Tails needs to land on 180 deg offset
            rotation += 180;
        }
        
        coin.style.transform = `rotateY(${rotation}deg)`;
        
        setTimeout(() => {
            this.isFlipping = false;
            
            if (flipBtn) flipBtn.disabled = false;
            if (shuffleBtn) shuffleBtn.disabled = false;
            
            const winner = isHeads ? this.headsEntry : this.tailsEntry;
            
            if (typeof soundEffects !== 'undefined') soundEffects.playVictory();
            if (typeof confettiInstance !== 'undefined' && confettiInstance) {
                confettiInstance.celebrate();
            }
            if (typeof historyManager !== 'undefined' && historyManager) {
                historyManager.addWinner(winner, 'coinflip');
            }
            
        }, 3000); // matches CSS transition duration
    }
}

let coinflipEngine = null;

function initCoinFlip() {
    if (!coinflipEngine) {
        coinflipEngine = new CoinFlipEngine();
        if (typeof entriesManager !== 'undefined' && entriesManager) {
            coinflipEngine.setEntries(entriesManager.getWeightedEntries());
        }
    }
    return coinflipEngine;
}
