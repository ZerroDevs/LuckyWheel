class SlotEngine {
    constructor() {
        this.reelCount = 3;
        this.wrapper = document.getElementById('slotWrapper');
        this.entries = [];
        this.isSpinning = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.renderReels();
    }
    
    setupEventListeners() {
        const countSelector = document.getElementById('slotCount');
        if (countSelector) {
            countSelector.addEventListener('change', (e) => {
                this.setReelCount(parseInt(e.target.value));
            });
        }
        
        const pullBtn = document.getElementById('pullBtn');
        if (pullBtn) {
            pullBtn.addEventListener('click', () => {
                this.spin();
            });
        }
    }
    
    setReelCount(count) {
        if (this.isSpinning) return;
        this.reelCount = Math.max(1, Math.min(5, count));
        this.renderReels();
    }
    
    setEntries(entries) {
        this.entries = entries;
        this.renderReels(); 
    }
    
    renderReels() {
        if (!this.wrapper) return;
        this.wrapper.innerHTML = '';
        
        for (let i = 0; i < this.reelCount; i++) {
            const reel = document.createElement('div');
            reel.className = 'slot-reel';
            reel.id = `slotReel-${i}`;
            
            // Add a placeholder/first item based on entries if available
            const item = document.createElement('div');
            item.className = 'slot-item';
            
            if (this.entries && this.entries.length > 0) {
                const randomEntry = this.entries[Math.floor(Math.random() * this.entries.length)];
                this.renderEntryIntoNode(randomEntry, item);
            } else {
                item.innerHTML = '🎰';
                item.style.fontSize = '3rem';
            }
            
            reel.appendChild(item);
            this.wrapper.appendChild(reel);
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
    
    spin() {
        if (this.isSpinning || !this.entries || this.entries.length === 0) return;
        
        this.isSpinning = true;
        
        const pullBtn = document.getElementById('pullBtn');
        if (pullBtn) {
            pullBtn.classList.add('spinning');
            pullBtn.disabled = true;
        }
        
        if (soundEffects) soundEffects.playSpin();
        
        const results = [];
        let completedCount = 0;
        
        const itemHeight = 150; // must match CSS .slot-item height
        
        for (let i = 0; i < this.reelCount; i++) {
            const winner = this.getRandomEntry();
            results.push(winner);
            
            const reel = document.getElementById(`slotReel-${i}`);
            reel.innerHTML = '';
            
            const strip = document.createElement('div');
            strip.className = 'slot-strip';
            
            // Add 30 items for a long spin, winner is the last one
            const totalItems = 30 + (i * 5); // stagger duration by adding more items
            
            for (let j = 0; j < totalItems; j++) {
                const item = document.createElement('div');
                item.className = 'slot-item';
                
                // The last item is the winner
                if (j === totalItems - 1) {
                    this.renderEntryIntoNode(winner, item);
                } else {
                    const randomEntry = this.entries[Math.floor(Math.random() * this.entries.length)];
                    this.renderEntryIntoNode(randomEntry, item);
                }
                
                strip.appendChild(item);
            }
            
            reel.appendChild(strip);
            
            // Start the spin using CSS transition
            // Need a small timeout so the browser registers the initial transform: translateY(0)
            strip.style.transform = `translateY(0px)`;
            
            setTimeout(() => {
                const duration = 2.5 + (i * 0.5); // staggered duration
                strip.style.transition = `transform ${duration}s cubic-bezier(0.15, 0.85, 0.3, 1)`;
                strip.style.transform = `translateY(-${(totalItems - 1) * itemHeight}px)`;
                
                // When this reel finishes
                setTimeout(() => {
                    if (soundEffects) soundEffects.playTick();
                    
                    // Replace strip with just the winner for clean state
                    reel.innerHTML = '';
                    const winItem = document.createElement('div');
                    winItem.className = 'slot-item slot-result';
                    this.renderEntryIntoNode(winner, winItem);
                    reel.appendChild(winItem);
                    
                    completedCount++;
                    if (completedCount === this.reelCount) {
                        this.onFinish(results);
                    }
                }, duration * 1000);
            }, 50);
        }
    }
    
    renderEntryIntoNode(entry, node) {
        if (!entry) return;
        if (entry.image) {
            const img = document.createElement('img');
            img.src = entry.image;
            node.appendChild(img);
        }
        const text = document.createElement('span');
        text.textContent = entry.text;
        text.style.color = entry.color;
        node.appendChild(text);
    }
    
    onFinish(results) {
        this.isSpinning = false;
        
        const pullBtn = document.getElementById('pullBtn');
        if (pullBtn) {
            pullBtn.classList.remove('spinning');
            pullBtn.disabled = false;
        }
        
        // Check for jackpot (all same)
        const isJackpot = this.reelCount > 1 && results.every(val => val.id === results[0].id);
        
        if (isJackpot) {
            this.wrapper.classList.add('slot-jackpot');
            setTimeout(() => this.wrapper.classList.remove('slot-jackpot'), 3000);
        }
        
        // Effects
        if (soundEffects) soundEffects.playVictory();
        if (isJackpot || this.reelCount === 1) {
            if (typeof confettiInstance !== 'undefined' && confettiInstance) {
                confettiInstance.celebrate();
            }
        }
        
        // History
        if (typeof historyManager !== 'undefined' && historyManager) {
            results.forEach(w => historyManager.addWinner(w, 'slot'));
        }
        
        setTimeout(() => {
            this.showWinners(results, isJackpot);
        }, 800);
    }
    
    showWinners(winners, isJackpot) {
        const modal = document.getElementById('winnerModal');
        const winnerDisplay = document.getElementById('winnerDisplay');
        if (!winnerDisplay || !modal) return;
        
        let content = '';
        if (isJackpot) {
            content += '<h3 style="color: gold; text-shadow: 0 0 10px gold; margin-bottom: 15px;">🎰 JACKPOT! 🎰</h3>';
        }
        
        content += '<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 20px;">';
        
        winners.forEach((winner, i) => {
            content += `<div style="text-align: center; max-width: 150px;">`;
            if (this.reelCount > 1) {
                content += `<div style="font-size: 14px; opacity: 0.8; margin-bottom: 5px;">Reel ${i + 1}</div>`;
            }
            if (winner.image) {
                content += `<img src="${winner.image}" class="winner-image" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover;" alt="${winner.text}">`;
            }
            content += `<div class="winner-name" style="font-size: 18px; margin-top: 10px; color: ${winner.color};">${winner.text}</div>`;
            content += `</div>`;
        });
        
        content += '</div>';
        winnerDisplay.innerHTML = content;
        
        modal.classList.add('active');
        
        const closeBtn = document.getElementById('closeWinnerBtn');
        const playAgainBtn = document.getElementById('playAgainBtn');
        const removeAndSpinBtn = document.getElementById('removeAndSpinBtn');
        
        if (closeBtn) closeBtn.onclick = () => this.closeWinnerModal();
        if (playAgainBtn) {
            playAgainBtn.onclick = () => {
                this.closeWinnerModal();
                setTimeout(() => this.spin(), 300);
            };
        }
        if (removeAndSpinBtn) {
            removeAndSpinBtn.onclick = () => {
                if (typeof entriesManager !== 'undefined') {
                    winners.forEach(w => entriesManager.deleteEntry(w.id));
                }
                this.closeWinnerModal();
                setTimeout(() => this.spin(), 300);
            };
        }
    }
    
    closeWinnerModal() {
        const modal = document.getElementById('winnerModal');
        if (modal) modal.classList.remove('active');
        if (typeof confettiInstance !== 'undefined' && confettiInstance) confettiInstance.clear();
    }
}

let slotEngine = null;

function initSlots() {
    if (!slotEngine) {
        slotEngine = new SlotEngine();
        if (typeof entriesManager !== 'undefined' && entriesManager) {
            slotEngine.setEntries(entriesManager.getWeightedEntries());
        }
    }
    return slotEngine;
}
