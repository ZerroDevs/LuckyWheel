/**
 * Main Application
 * Main initialization, tab switching, global state, keyboard shortcuts, and URL hash routing
 */

class App {
    constructor() {
        this.currentMode = 'wheel';
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
    }

    /**
     * Initialize wheel and dice engines
     */
    initializeEngines() {
        // Initialize wheel
        wheelEngine = initWheel();
        
        // Initialize dice
        diceEngine = initDice();
        
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
        const wheelSection = document.getElementById('wheelSection');
        const diceSection = document.getElementById('diceSection');

        if (wheelTab && diceTab && wheelSection && diceSection) {
            wheelTab.addEventListener('click', () => {
                this.switchMode('wheel');
                soundEffects.playClick();
            });

            diceTab.addEventListener('click', () => {
                this.switchMode('dice');
                soundEffects.playClick();
            });
        }
    }

    /**
     * Switch between wheel and dice modes
     */
    switchMode(mode) {
        this.currentMode = mode;

        const wheelTab = document.getElementById('wheelTab');
        const diceTab = document.getElementById('diceTab');
        const wheelSection = document.getElementById('wheelSection');
        const diceSection = document.getElementById('diceSection');

        if (mode === 'wheel') {
            wheelTab.classList.add('active');
            diceTab.classList.remove('active');
            wheelSection.classList.add('active');
            diceSection.classList.remove('active');
            
            // Redraw wheel when switching to wheel mode
            if (wheelEngine) {
                wheelEngine.draw();
            }
        } else {
            diceTab.classList.add('active');
            wheelTab.classList.remove('active');
            diceSection.classList.add('active');
            wheelSection.classList.remove('active');
            
            // Re-render dice when switching to dice mode
            if (diceEngine) {
                diceEngine.renderDice();
            }
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Space to spin/roll
            if (e.code === 'Space') {
                const activeSection = this.currentMode === 'wheel' ? 'wheelSection' : 'diceSection';
                const section = document.getElementById(activeSection);
                if (section && section.classList.contains('active')) {
                    e.preventDefault();
                    if (this.currentMode === 'wheel' && wheelEngine && !wheelEngine.isSpinning) {
                        wheelEngine.spin();
                    } else if (this.currentMode === 'dice' && diceEngine && !diceEngine.isRolling) {
                        diceEngine.roll();
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
                    entriesManager.loadState(sharedState);
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
