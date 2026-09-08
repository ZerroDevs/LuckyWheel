class MysteryBoxEngine {
    constructor() {
        this.boxCount = 3;
        this.wrapper = document.getElementById('boxWrapper');
        this.entries = [];
        this.isInteracting = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.renderBoxes();
    }
    
    setupEventListeners() {
        const countSelector = document.getElementById('boxCount');
        if (countSelector) {
            countSelector.addEventListener('change', (e) => {
                this.setBoxCount(parseInt(e.target.value));
            });
        }
        
        const resetBtn = document.getElementById('resetBoxesBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetBoxes();
                if (typeof soundEffects !== 'undefined') soundEffects.playClick();
            });
        }
    }
    
    setBoxCount(count) {
        if (this.isInteracting) return;
        this.boxCount = Math.max(1, Math.min(10, count));
        this.renderBoxes();
    }
    
    setEntries(entries) {
        this.entries = entries;
    }
    
    resetBoxes() {
        this.isInteracting = false;
        this.renderBoxes();
        const resetBtn = document.getElementById('resetBoxesBtn');
        if (resetBtn) resetBtn.disabled = false;
    }
    
    renderBoxes() {
        if (!this.wrapper) return;
        this.wrapper.innerHTML = '';
        
        for (let i = 0; i < this.boxCount; i++) {
            const container = document.createElement('div');
            container.className = 'mystery-box-container';
            container.id = `boxContainer-${i}`;
            
            const box = document.createElement('div');
            box.className = 'mystery-box shaking';
            
            box.addEventListener('click', () => this.openBox(i, container));
            
            // Rays
            const rays = document.createElement('div');
            rays.className = 'box-rays';
            
            // Revealed item container
            const revealed = document.createElement('div');
            revealed.className = 'box-revealed-container';
            
            const item = document.createElement('div');
            item.className = 'box-revealed-item';
            item.id = `boxRevealed-${i}`;
            
            revealed.appendChild(item);
            
            container.appendChild(rays);
            container.appendChild(revealed);
            container.appendChild(box);
            
            this.wrapper.appendChild(container);
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
    
    openBox(index, container) {
        if (this.isInteracting || !this.entries || this.entries.length === 0) {
            // Need entries to play
            if (!this.entries || this.entries.length === 0) {
                alert("Please add some entries first!");
            }
            return;
        }
        
        this.isInteracting = true;
        
        // Disable reset button during animation
        const resetBtn = document.getElementById('resetBoxesBtn');
        if (resetBtn) resetBtn.disabled = true;
        
        // Disable other boxes
        for (let i = 0; i < this.boxCount; i++) {
            if (i !== index) {
                const other = document.getElementById(`boxContainer-${i}`);
                if (other) {
                    other.classList.add('disabled');
                    other.querySelector('.mystery-box').classList.remove('shaking');
                }
            }
        }
        
        const box = container.querySelector('.mystery-box');
        box.classList.remove('shaking');
        box.classList.add('opening');
        
        if (typeof soundEffects !== 'undefined') soundEffects.playSpin(); // suspense sound
        
        const winner = this.getRandomEntry();
        
        // Wait for opening animation to finish before revealing
        setTimeout(() => {
            container.classList.add('opened');
            
            const itemNode = document.getElementById(`boxRevealed-${index}`);
            this.renderEntryIntoNode(winner, itemNode);
            
            if (typeof soundEffects !== 'undefined') soundEffects.playVictory();
            if (typeof confettiInstance !== 'undefined' && confettiInstance) {
                confettiInstance.celebrate();
            }
            
            if (typeof historyManager !== 'undefined' && historyManager) {
                historyManager.addWinner(winner, 'mysterybox');
            }
            
            // Re-enable reset button
            if (resetBtn) resetBtn.disabled = false;
            
        }, 1000); // 1s opening animation
    }
    
    renderEntryIntoNode(entry, node) {
        if (!entry) return;
        node.innerHTML = '';
        if (entry.image) {
            const img = document.createElement('img');
            img.src = entry.image;
            node.appendChild(img);
        }
        const text = document.createElement('span');
        text.textContent = entry.text;
        text.style.color = entry.color;
        node.appendChild(text);
        node.style.borderColor = entry.color;
    }
}

let boxEngine = null;

function initMysteryBox() {
    if (!boxEngine) {
        boxEngine = new MysteryBoxEngine();
        if (typeof entriesManager !== 'undefined' && entriesManager) {
            boxEngine.setEntries(entriesManager.getWeightedEntries());
        }
    }
    return boxEngine;
}
