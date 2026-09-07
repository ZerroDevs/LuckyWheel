/**
 * Dice Engine
 * 3D/2D Multi-Dice rendering engine and rolling physics
 */

class DiceEngine {
    constructor(wrapperId) {
        this.wrapper = document.getElementById(wrapperId);
        this.entries = [];
        this.diceCount = 1;
        this.isRolling = false;
        this.use3D = true;
        this.init();
    }

    init() {
        this.setupEventListeners();
        
        // Listen for theme changes
        window.addEventListener('themeChange', () => {
            this.renderDice();
        });
    }

    setEntries(entries) {
        this.entries = entries;
        this.renderDice();
    }

    setDiceCount(count) {
        this.diceCount = Math.max(1, Math.min(4, count));
        this.renderDice();
    }

    setUse3D(use3D) {
        this.use3D = use3D;
        this.renderDice();
    }

    /**
     * Render dice
     */
    renderDice() {
        if (!this.wrapper) return;

        this.wrapper.innerHTML = '';

        if (this.entries.length === 0) {
            this.wrapper.innerHTML = '<p style="color: var(--text-muted);">Add entries to roll dice</p>';
            return;
        }

        for (let i = 0; i < this.diceCount; i++) {
            if (this.use3D) {
                this.render3DDie(i);
            } else {
                this.render2DDie(i);
            }
        }
    }

    /**
     * Render 3D die
     */
    render3DDie(index) {
        const die = document.createElement('div');
        die.className = 'die';
        die.dataset.index = index;

        // Create 6 faces
        const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
        faces.forEach((face, faceIndex) => {
            const faceElement = document.createElement('div');
            faceElement.className = `die-face ${face}`;
            
            // Map entry to face (cycle through entries)
            const entryIndex = (faceIndex + index) % this.entries.length;
            const entry = this.entries[entryIndex];
            
            if (entry.image) {
                faceElement.innerHTML = `<div class="face-content"><img src="${entry.image}" alt="${entry.text}"></div>`;
            } else {
                faceElement.innerHTML = `<div class="face-content">${entry.text}</div>`;
            }
            
            die.appendChild(faceElement);
        });

        this.wrapper.appendChild(die);
    }

    /**
     * Render 2D die
     */
    render2DDie(index) {
        const die = document.createElement('div');
        die.className = 'die-2d';
        die.dataset.index = index;

        // Show first entry
        const entryIndex = index % this.entries.length;
        const entry = this.entries[entryIndex];

        if (entry.image) {
            die.innerHTML = `<img src="${entry.image}" alt="${entry.text}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
        } else {
            die.textContent = entry.text;
        }

        this.wrapper.appendChild(die);
    }

    /**
     * Roll the dice
     */
    roll() {
        if (this.isRolling || this.entries.length === 0) return;

        this.isRolling = true;

        const dice = this.wrapper.querySelectorAll('.die, .die-2d');
        const results = [];

        dice.forEach((die, index) => {
            // Add rolling animation
            die.classList.add('rolling');

            // Play bounce sound
            setTimeout(() => {
                soundEffects.playDiceBounce();
            }, index * 100);

            // Calculate result based on weight
            const totalWeight = this.entries.reduce((sum, entry) => sum + (entry.weight || 1), 0);
            let randomValue = Math.random() * totalWeight;
            let result = this.entries[0];
            
            for (const entry of this.entries) {
                const weight = entry.weight || 1;
                if (randomValue < weight) {
                    result = entry;
                    break;
                }
                randomValue -= weight;
            }
            results.push(result);

            // Update die face after animation
            setTimeout(() => {
                die.classList.remove('rolling');
                die.classList.add('bounce');
                
                setTimeout(() => die.classList.remove('bounce'), 300);

                if (this.use3D) {
                    this.update3DDieFace(die, result);
                } else {
                    this.update2DDieFace(die, result);
                }
            }, 1000 + index * 100);
        });

        // Update roll button state
        const rollBtn = document.getElementById('rollBtn');
        if (rollBtn) {
            rollBtn.classList.add('rolling');
            rollBtn.disabled = true;
        }

        // Show results after all dice finish
        setTimeout(() => {
            this.isRolling = false;
            
            if (rollBtn) {
                rollBtn.classList.remove('rolling');
                rollBtn.disabled = false;
            }

            this.showResults(results);
        }, 1000 + this.diceCount * 100 + 500);
    }

    /**
     * Update 3D die face
     */
    update3DDieFace(die, result) {
        const faces = die.querySelectorAll('.die-face');
        faces.forEach(face => {
            if (result.image) {
                face.innerHTML = `<div class="face-content"><img src="${result.image}" alt="${result.text}"></div>`;
            } else {
                face.innerHTML = `<div class="face-content">${result.text}</div>`;
            }
        });

        // Random rotation to show different face
        const rotations = [
            'rotateX(0deg) rotateY(0deg)',
            'rotateX(0deg) rotateY(180deg)',
            'rotateX(0deg) rotateY(90deg)',
            'rotateX(0deg) rotateY(-90deg)',
            'rotateX(90deg) rotateY(0deg)',
            'rotateX(-90deg) rotateY(0deg)'
        ];
        
        const randomRotation = rotations[Math.floor(Math.random() * rotations.length)];
        die.style.transform = randomRotation;
    }

    /**
     * Update 2D die face
     */
    update2DDieFace(die, result) {
        if (result.image) {
            die.innerHTML = `<img src="${result.image}" alt="${result.text}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
        } else {
            die.textContent = result.text;
        }
    }

    /**
     * Show roll results
     */
    showResults(results) {
        if (results.length === 0) return;

        // Add all results to history
        results.forEach(result => {
            historyManager.addWinner(result, 'dice');
        });

        // Show winner modal with first result (or combine if multiple dice)
        const winner = results[0];
        const modal = document.getElementById('winnerModal');
        const winnerDisplay = document.getElementById('winnerDisplay');

        if (!winnerDisplay) return;

        let content = '';

        if (results.length > 1) {
            content += '<div style="margin-bottom: 1rem; color: var(--text-secondary);">Roll Results:</div>';
            results.forEach((result, index) => {
                if (result.image) {
                    content += `<img src="${result.image}" class="winner-image" alt="${result.text}" style="max-width: 80px; margin: 0.25rem;">`;
                }
                content += `<div class="winner-name" style="font-size: 1.2rem;">${index + 1}. ${result.text}</div>`;
            });
        } else {
            if (winner.image) {
                content += `<img src="${winner.image}" class="winner-image" alt="${winner.text}">`;
            }
            content += `<div class="winner-name">${winner.text}</div>`;
        }

        winnerDisplay.innerHTML = content;

        // Show modal
        if (modal) {
            modal.classList.add('active');
        }

        // Play victory sound
        soundEffects.playVictory();

        // Trigger confetti
        if (confettiInstance) {
            confettiInstance.celebrate();
        } else {
            const confetti = initConfetti();
            if (confetti) {
                confetti.celebrate();
            }
        }

        // Setup modal buttons
        this.setupDiceWinnerModalButtons(results);
    }

    setupDiceWinnerModalButtons(results) {
        const closeBtn = document.getElementById('closeWinnerBtn');
        const removeAndSpinBtn = document.getElementById('removeAndSpinBtn');
        const playAgainBtn = document.getElementById('playAgainBtn');

        if (closeBtn) {
            closeBtn.onclick = () => {
                this.closeWinnerModal();
            };
        }

        if (removeAndSpinBtn) {
            removeAndSpinBtn.onclick = () => {
                // Remove all rolled entries
                results.forEach(result => {
                    entriesManager.deleteEntry(result.id);
                });
                this.closeWinnerModal();
                setTimeout(() => this.roll(), 300);
            };
        }

        if (playAgainBtn) {
            playAgainBtn.onclick = () => {
                this.closeWinnerModal();
                setTimeout(() => this.roll(), 300);
            };
        }
    }

    closeWinnerModal() {
        const modal = document.getElementById('winnerModal');
        if (modal) {
            modal.classList.remove('active');
        }

        // Stop confetti
        if (confettiInstance) {
            confettiInstance.clear();
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Dice count selector
        const diceCountSelect = document.getElementById('diceCount');
        if (diceCountSelect) {
            diceCountSelect.addEventListener('change', (e) => {
                this.setDiceCount(parseInt(e.target.value));
                soundEffects.playClick();
            });
        }

        // Roll button
        const rollBtn = document.getElementById('rollBtn');
        if (rollBtn) {
            rollBtn.addEventListener('click', () => {
                this.roll();
            });
        }

        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isRolling) {
                const diceSection = document.getElementById('diceSection');
                if (diceSection && diceSection.classList.contains('active')) {
                    e.preventDefault();
                    this.roll();
                }
            }
        });
    }

    /**
     * Get current settings
     */
    getSettings() {
        return {
            diceCount: this.diceCount,
            use3D: this.use3D
        };
    }

    /**
     * Update settings
     */
    updateSettings(newSettings) {
        if (newSettings.diceCount !== undefined) {
            this.setDiceCount(newSettings.diceCount);
        }
        if (newSettings.use3D !== undefined) {
            this.setUse3D(newSettings.use3D);
        }
    }
}

// Initialize dice engine
let diceEngine = null;

function initDice() {
    const wrapper = document.getElementById('diceWrapper');
    if (wrapper && !diceEngine) {
        diceEngine = new DiceEngine('diceWrapper');
        
        // Load entries from entries manager
        if (entriesManager) {
            diceEngine.setEntries(entriesManager.getWeightedEntries());
        }
        
        // Setup dice count selector
        const diceCountSelect = document.getElementById('diceCount');
        if (diceCountSelect) {
            diceCountSelect.value = diceEngine.diceCount;
        }
    }
    return diceEngine;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiceEngine;
}
