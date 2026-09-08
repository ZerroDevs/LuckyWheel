/**
 * Main Application
 * Main initialization, tab switching, global state, keyboard shortcuts, and URL hash routing
 */

// Global Confirm Function
window.showConfirm = function(message, callback) {
    const modal = document.getElementById('confirmModal');
    const overlay = document.getElementById('overlay');
    const msgEl = document.getElementById('confirmMessage');
    const acceptBtn = document.getElementById('acceptConfirmBtn');
    const cancelBtn = document.getElementById('cancelConfirmBtn');
    const closeBtn = document.getElementById('closeConfirmModal');
    
    if (!modal || !msgEl || !acceptBtn || !cancelBtn) {
        if (confirm(message)) callback();
        return;
    }
    
    msgEl.textContent = message;
    
    const closeModal = () => {
        modal.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        // Clean up listeners
        acceptBtn.onclick = null;
        cancelBtn.onclick = null;
        if (closeBtn) closeBtn.onclick = null;
    };
    
    acceptBtn.onclick = () => {
        closeModal();
        callback();
    };
    
    cancelBtn.onclick = closeModal;
    if (closeBtn) closeBtn.onclick = closeModal;
    
    modal.classList.add('active');
    if (overlay) overlay.classList.add('active');
    
    if (typeof soundEffects !== 'undefined' && soundEffects) {
        soundEffects.playClick();
    }
};

class App {
    constructor() {
        this.currentMode = localStorage.getItem('luckywheel-mode') || 'wheel';
        this.settings = {
            spinDuration: 5,
            soundVolume: 50,
            enableSounds: true,
            enableConfetti: true
        };
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupTabSwitching();
        this.setupKeyboardShortcuts();
        this.setupShareButton();
        this.setupSettingsModal();
        this.loadSharedState();
        this.initializeEngines();
        
        // Ensure the correct tab is highlighted and active on load
        this.switchMode(this.currentMode);
    }

    /**
     * Initialize wheel and dice engines
     */
    initializeEngines() {
        // Initialize wheel
        wheelEngine = initWheel();
        
        // Initialize dice
        diceEngine = initDice();
        
        // Initialize slots
        slotEngine = typeof initSlots !== 'undefined' ? initSlots() : null;
        
        // Initialize mystery box
        boxEngine = typeof initMysteryBox !== 'undefined' ? initMysteryBox() : null;

        // Initialize blackjack
        blackjackEngine = typeof initBlackjack !== 'undefined' ? initBlackjack() : null;
        
        // Initialize coinflip
        coinflipEngine = typeof initCoinFlip !== 'undefined' ? initCoinFlip() : null;
        
        // Initialize confetti
        initConfetti();
        
        // Update entries in engines when entries change
        window.addEventListener('entriesUpdated', () => {
            if (wheelEngine && entriesManager) {
                wheelEngine.setEntries(entriesManager.getWeightedEntries());
            }
            if (diceEngine && entriesManager) {
                diceEngine.setEntries(entriesManager.getWeightedEntries());
            }
            if (slotEngine && entriesManager) {
                slotEngine.setEntries(entriesManager.getWeightedEntries());
            }
            if (boxEngine && entriesManager) {
                boxEngine.setEntries(entriesManager.getWeightedEntries());
            }
            if (coinflipEngine && entriesManager) {
                coinflipEngine.setEntries(entriesManager.getWeightedEntries());
            }
        });
        
        // Dispatch initial entries updated event
        window.dispatchEvent(new Event('entriesUpdated'));
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('luckywheel-settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
            this.applySettings();
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('luckywheel-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    /**
     * Apply settings to the application
     */
    applySettings() {
        // Apply sound settings
        if (soundEffects) {
            soundEffects.setVolume(this.settings.soundVolume / 100);
            soundEffects.setEnabled(this.settings.enableSounds);
        }
        
        // Apply spin duration
        if (wheelEngine) {
            wheelEngine.setSpinDuration(this.settings.spinDuration);
        }
        
        // Update UI controls
        const spinDurationInput = document.getElementById('spinDuration');
        const spinDurationValue = document.getElementById('spinDurationValue');
        if (spinDurationInput) {
            spinDurationInput.value = this.settings.spinDuration;
        }
        if (spinDurationValue) {
            spinDurationValue.textContent = this.settings.spinDuration + 's';
        }
        
        const soundVolumeInput = document.getElementById('soundVolume');
        const soundVolumeValue = document.getElementById('soundVolumeValue');
        if (soundVolumeInput) {
            soundVolumeInput.value = this.settings.soundVolume;
        }
        if (soundVolumeValue) {
            soundVolumeValue.textContent = this.settings.soundVolume + '%';
        }
        
        const enableSoundsCheckbox = document.getElementById('enableSounds');
        if (enableSoundsCheckbox) {
            enableSoundsCheckbox.checked = this.settings.enableSounds;
        }
        
        const enableConfettiCheckbox = document.getElementById('enableConfetti');
        if (enableConfettiCheckbox) {
            enableConfettiCheckbox.checked = this.settings.enableConfetti;
        }
    }

    /**
     * Setup tab switching between wheel and dice modes
     */
    setupTabSwitching() {
        const wheelTab = document.getElementById('wheelTab');
        const diceTab = document.getElementById('diceTab');
        const slotTab = document.getElementById('slotTab');
        const boxTab = document.getElementById('boxTab');
        const blackjackTab = document.getElementById('blackjackTab');
        const coinflipTab = document.getElementById('coinflipTab');

        if (wheelTab) {
            wheelTab.addEventListener('click', () => {
                this.switchMode('wheel');
                if (typeof soundEffects !== 'undefined') soundEffects.playClick();
            });
        }
        
        if (diceTab) {
            diceTab.addEventListener('click', () => {
                this.switchMode('dice');
                if (typeof soundEffects !== 'undefined') soundEffects.playClick();
            });
        }
        
        if (slotTab) {
            slotTab.addEventListener('click', () => {
                this.switchMode('slot');
                if (typeof soundEffects !== 'undefined') soundEffects.playClick();
            });
        }
        
        if (boxTab) {
            boxTab.addEventListener('click', () => {
                this.switchMode('box');
                if (typeof soundEffects !== 'undefined') soundEffects.playClick();
            });
        }
        
        if (blackjackTab) {
            blackjackTab.addEventListener('click', () => {
                this.switchMode('blackjack');
                if (typeof soundEffects !== 'undefined') soundEffects.playClick();
            });
        }
        
        if (coinflipTab) {
            coinflipTab.addEventListener('click', () => {
                this.switchMode('coinflip');
                if (typeof soundEffects !== 'undefined') soundEffects.playClick();
            });
        }
    }

    /**
     * Switch between wheel and dice modes
     */
    switchMode(mode) {
        this.currentMode = mode;
        localStorage.setItem('luckywheel-mode', mode);

        const tabs = {
            'wheel': { tab: document.getElementById('wheelTab'), section: document.getElementById('wheelSection') },
            'dice': { tab: document.getElementById('diceTab'), section: document.getElementById('diceSection') },
            'slot': { tab: document.getElementById('slotTab'), section: document.getElementById('slotSection') },
            'box': { tab: document.getElementById('boxTab'), section: document.getElementById('boxSection') },
            'blackjack': { tab: document.getElementById('blackjackTab'), section: document.getElementById('blackjackSection') },
            'coinflip': { tab: document.getElementById('coinflipTab'), section: document.getElementById('coinflipSection') }
        };

        // Reset all
        Object.values(tabs).forEach(t => {
            if (t.tab) t.tab.classList.remove('active');
            if (t.section) t.section.classList.remove('active');
        });

        // Activate current
        const current = tabs[mode];
        if (current.tab) current.tab.classList.add('active');
        if (current.section) current.section.classList.add('active');

        if (mode === 'wheel' && typeof wheelEngine !== 'undefined' && wheelEngine) {
            wheelEngine.draw();
        } else if (mode === 'dice' && typeof diceEngine !== 'undefined' && diceEngine) {
            diceEngine.renderDice();
        } else if (mode === 'slot' && typeof slotEngine !== 'undefined' && slotEngine) {
            slotEngine.renderReels();
        } else if (mode === 'box' && typeof boxEngine !== 'undefined' && boxEngine) {
            boxEngine.renderBoxes();
        } else if (mode === 'blackjack' && typeof blackjackEngine !== 'undefined' && blackjackEngine) {
            blackjackEngine.renderBoard();
        } else if (mode === 'coinflip' && typeof coinflipEngine !== 'undefined' && coinflipEngine) {
            coinflipEngine.renderCoinFaces();
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Space to spin/roll/pull
            if (e.code === 'Space') {
                const activeSection = this.currentMode + 'Section';
                const section = document.getElementById(activeSection);
                if (section && section.classList.contains('active')) {
                    e.preventDefault();
                    if (this.currentMode === 'wheel' && typeof wheelEngine !== 'undefined' && wheelEngine && !wheelEngine.isSpinning) {
                        wheelEngine.spin();
                    } else if (this.currentMode === 'dice' && typeof diceEngine !== 'undefined' && diceEngine && !diceEngine.isRolling) {
                        diceEngine.roll();
                    } else if (this.currentMode === 'slot' && typeof slotEngine !== 'undefined' && slotEngine && !slotEngine.isSpinning) {
                        slotEngine.spin();
                    }
                }
            }

            // Escape to close modals
            if (e.code === 'Escape') {
                this.closeAllModals();
            }

            // 'E' to open entries editor
            if (e.code === 'KeyE' && !e.ctrlKey && !e.metaKey) {
                const activeElement = document.activeElement;
                const isInput = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';
                if (!isInput) {
                    e.preventDefault();
                    if (entriesManager) {
                        entriesManager.openEntriesModal();
                    }
                }
            }

            // 'H' to open history
            if (e.code === 'KeyH' && !e.ctrlKey && !e.metaKey) {
                const activeElement = document.activeElement;
                const isInput = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';
                if (!isInput) {
                    e.preventDefault();
                    if (historyManager) {
                        historyManager.openHistoryPanel();
                    }
                }
            }

            // 'T' to toggle theme
            if (e.code === 'KeyT' && !e.ctrlKey && !e.metaKey) {
                const activeElement = document.activeElement;
                const isInput = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';
                if (!isInput) {
                    e.preventDefault();
                    if (themeManager) {
                        themeManager.toggleTheme();
                    }
                }
            }
        });
    }

    /**
     * Setup share button
     */
    setupShareButton() {
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                const state = {
                    entries: entriesManager ? entriesManager.getState() : null,
                    settings: this.settings
                };
                
                if (shareManager) {
                    shareManager.showShareModal(state);
                }
                
                soundEffects.playClick();
            });
        }

        // Close share modal
        const closeShareBtn = document.getElementById('closeShareModal');
        if (closeShareBtn) {
            closeShareBtn.addEventListener('click', () => {
                const modal = document.getElementById('shareModal');
                if (modal) {
                    modal.classList.remove('active');
                }
            });
        }
    }

    /**
     * Setup settings modal
     */
    setupSettingsModal() {
        // Settings button (if added later)
        // For now, settings can be accessed through the entries modal or added separately

        // Settings controls
        const spinDurationInput = document.getElementById('spinDuration');
        if (spinDurationInput) {
            spinDurationInput.addEventListener('input', (e) => {
                this.settings.spinDuration = parseInt(e.target.value);
                const spinDurationValue = document.getElementById('spinDurationValue');
                if (spinDurationValue) {
                    spinDurationValue.textContent = this.settings.spinDuration + 's';
                }
            });
        }

        const soundVolumeInput = document.getElementById('soundVolume');
        if (soundVolumeInput) {
            soundVolumeInput.addEventListener('input', (e) => {
                this.settings.soundVolume = parseInt(e.target.value);
                const soundVolumeValue = document.getElementById('soundVolumeValue');
                if (soundVolumeValue) {
                    soundVolumeValue.textContent = this.settings.soundVolume + '%';
                }
                if (soundEffects) {
                    soundEffects.setVolume(this.settings.soundVolume / 100);
                }
            });
        }

        const enableSoundsCheckbox = document.getElementById('enableSounds');
        if (enableSoundsCheckbox) {
            enableSoundsCheckbox.addEventListener('change', (e) => {
                this.settings.enableSounds = e.target.checked;
                if (soundEffects) {
                    soundEffects.setEnabled(this.settings.enableSounds);
                }
            });
        }

        const enableConfettiCheckbox = document.getElementById('enableConfetti');
        if (enableConfettiCheckbox) {
            enableConfettiCheckbox.addEventListener('change', (e) => {
                this.settings.enableConfetti = e.target.checked;
            });
        }

        const customSoundInput = document.getElementById('customSound');
        if (customSoundInput) {
            customSoundInput.addEventListener('change', async (e) => {
                if (e.target.files[0] && soundEffects) {
                    const success = await soundEffects.loadCustomAudioFile(e.target.files[0]);
                    if (success) {
                        soundEffects.playSuccess();
                    } else {
                        soundEffects.playError();
                    }
                }
            });
        }

        // Save settings button
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
                this.closeAllModals();
                soundEffects.playSuccess();
            });
        }

        // Close settings modal
        const closeSettingsBtn = document.getElementById('closeSettingsModal');
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => {
                const modal = document.getElementById('settingsModal');
                if (modal) {
                    modal.classList.remove('active');
                }
            });
        }
    }

    /**
     * Load shared state from URL hash
     */
    loadSharedState() {
        if (shareManager) {
            const sharedState = shareManager.loadStateFromUrl();
            if (sharedState && shareManager.validateState(sharedState)) {
                // Load entries
                if (sharedState.entries && entriesManager) {
                    entriesManager.loadState(sharedState.entries);
                }
                
                // Load settings
                if (sharedState.settings) {
                    this.settings = { ...this.settings, ...sharedState.settings };
                    this.applySettings();
                }
                
                // Clear URL hash after loading
                setTimeout(() => {
                    shareManager.clearUrlHash();
                }, 100);
                
                console.log('Loaded shared state from URL');
            }
        }
    }

    /**
     * Close all modals
     */
    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });

        const panels = document.querySelectorAll('.slide-panel');
        panels.forEach(panel => {
            panel.classList.remove('active');
        });

        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }

        // Stop confetti
        if (confettiInstance) {
            confettiInstance.clear();
        }
    }

    /**
     * Get current application state
     */
    getState() {
        return {
            mode: this.currentMode,
            settings: this.settings,
            entries: entriesManager ? entriesManager.getState() : null,
            history: historyManager ? historyManager.getState() : null
        };
    }

    /**
     * Reset application to default state
     */
    reset() {
        // Clear localStorage
        localStorage.removeItem('luckywheel-entries');
        localStorage.removeItem('luckywheel-history');
        localStorage.removeItem('luckywheel-settings');
        localStorage.removeItem('luckywheel-theme');
        localStorage.removeItem('luckywheel-volume');
        localStorage.removeItem('luckywheel-sounds-enabled');

        // Reload page
        location.reload();
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
