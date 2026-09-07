/**
 * Theme Manager
 * Handles light/dark theme switching with localStorage persistence
 * and system preference detection
 */

class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.storageKey = 'luckywheel-theme';
        this.init();
    }

    init() {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem(this.storageKey);
        
        if (savedTheme) {
            this.setTheme(savedTheme, false);
        } else {
            // Auto-detect system preference
            this.detectSystemPreference();
        }

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(this.storageKey)) {
                this.setTheme(e.matches ? 'dark' : 'light', false);
            }
        });

        // Setup theme toggle button
        this.setupThemeToggle();
    }

    detectSystemPreference() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.setTheme(prefersDark ? 'dark' : 'light', false);
    }

    setTheme(theme, save = true) {
        this.currentTheme = theme;
        const body = document.body;

        // Remove all theme classes
        body.classList.remove('dark-theme', 'light-theme-forced');

        // Apply new theme
        if (theme === 'dark') {
            body.classList.add('dark-theme');
        } else {
            body.classList.add('light-theme-forced');
        }

        // Save to localStorage if requested
        if (save) {
            localStorage.setItem(this.storageKey, theme);
        }

        // Dispatch custom event for other modules to react
        this.dispatchThemeChange(theme);
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setupThemeToggle() {
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    dispatchThemeChange(theme) {
        const event = new CustomEvent('themeChange', { detail: { theme } });
        window.dispatchEvent(event);
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    isDarkTheme() {
        return this.currentTheme === 'dark';
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
