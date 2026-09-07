/**
 * Sound Effects Manager
 * Web Audio API synthesizer for realistic ticking, spinning, and victory sounds
 * Supports custom audio file uploads
 */

class SoundEffects {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.5;
        this.customVictorySound = null;
        this.initialized = false;
        this.init();
    }

    init() {
        // Initialize audio context on first user interaction
        document.addEventListener('click', () => this.initializeAudioContext(), { once: true });
        document.addEventListener('keydown', () => this.initializeAudioContext(), { once: true });
        
        // Load settings from localStorage
        this.loadSettings();
    }

    initializeAudioContext() {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    loadSettings() {
        const savedVolume = localStorage.getItem('luckywheel-volume');
        const savedEnabled = localStorage.getItem('luckywheel-sounds-enabled');
        
        if (savedVolume !== null) {
            this.volume = parseFloat(savedVolume);
        }
        
        if (savedEnabled !== null) {
            this.enabled = savedEnabled === 'true';
        }
    }

    saveSettings() {
        localStorage.setItem('luckywheel-volume', this.volume.toString());
        localStorage.setItem('luckywheel-sounds-enabled', this.enabled.toString());
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        this.saveSettings();
    }

    setCustomVictorySound(audioBuffer) {
        this.customVictorySound = audioBuffer;
    }

    // Create a simple tick sound for wheel pointer
    playTick() {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.05);

        gainNode.gain.setValueAtTime(0.3 * this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.05);
    }

    // Play spinning sound (continuous low-frequency hum)
    playSpin() {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filterNode = this.audioContext.createBiquadFilter();

        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(200, this.audioContext.currentTime + 0.1);

        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(500, this.audioContext.currentTime);

        gainNode.gain.setValueAtTime(0.1 * this.volume, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.05 * this.volume, this.audioContext.currentTime + 0.1);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    // Play dice bounce sound
    playDiceBounce() {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.2 * this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    // Play victory/celebration sound
    playVictory() {
        if (!this.enabled || !this.audioContext) return;

        // If custom victory sound is loaded, play it
        if (this.customVictorySound) {
            this.playCustomSound(this.customVictorySound);
            return;
        }

        // Otherwise, play synthesized victory fanfare
        this.playVictoryFanfare();
    }

    playVictoryFanfare() {
        const now = this.audioContext.currentTime;
        
        // Play a series of ascending notes
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const durations = [0.15, 0.15, 0.15, 0.3];

        notes.forEach((frequency, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, now + index * 0.2);

            gainNode.gain.setValueAtTime(0, now + index * 0.2);
            gainNode.gain.linearRampToValueAtTime(0.3 * this.volume, now + index * 0.2 + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.2 + durations[index]);

            oscillator.start(now + index * 0.2);
            oscillator.stop(now + index * 0.2 + durations[index]);
        });

        // Add a chord at the end
        setTimeout(() => {
            this.playChord([523.25, 659.25, 783.99], 0.5);
        }, 800);
    }

    playChord(frequencies, duration) {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;

        frequencies.forEach(frequency => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, now);

            gainNode.gain.setValueAtTime(0.2 * this.volume, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

            oscillator.start(now);
            oscillator.stop(now + duration);
        });
    }

    playCustomSound(audioBuffer) {
        if (!this.enabled || !this.audioContext || !audioBuffer) return;

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = audioBuffer;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);

        source.start(this.audioContext.currentTime);
    }

    // Load custom audio file
    async loadCustomAudioFile(file) {
        if (!this.audioContext) {
            this.initializeAudioContext();
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.setCustomVictorySound(audioBuffer);
            return true;
        } catch (error) {
            console.error('Error loading custom audio:', error);
            return false;
        }
    }

    // Play click sound for UI interactions
    playClick() {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + 0.05);

        gainNode.gain.setValueAtTime(0.15 * this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.05);
    }

    // Play error sound
    playError() {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(150, this.audioContext.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.2 * this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }

    // Play success sound
    playSuccess() {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(800, this.audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.2 * this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }
}

// Initialize sound effects manager
const soundEffects = new SoundEffects();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoundEffects;
}
