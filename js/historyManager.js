/**
 * History Manager
 * History tracking, winner statistics, auto-elimination mode, export to CSV/JSON
 */

class HistoryManager {
    constructor() {
        this.history = [];
        this.eliminationMode = false;
        this.storageKey = 'luckywheel-history';
        this.init();
    }

    init() {
        this.loadHistory();
        this.setupEventListeners();
    }

    /**
     * Load history from localStorage
     */
    loadHistory() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                this.history = data.history || [];
                this.eliminationMode = data.eliminationMode || false;
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    /**
     * Save history to localStorage
     */
    saveHistory() {
        try {
            const data = {
                history: this.history,
                eliminationMode: this.eliminationMode
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving history:', error);
        }
    }

    /**
     * Add a winner to history
     */
    addWinner(winner, mode = 'wheel') {
        const record = {
            id: Date.now(),
            winner: winner,
            mode: mode,
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString()
        };

        this.history.unshift(record);
        
        // Keep only last 1000 records
        if (this.history.length > 1000) {
            this.history = this.history.slice(0, 1000);
        }

        this.saveHistory();
        this.renderHistory();
        this.renderStats();

        // Handle elimination mode
        if (this.eliminationMode) {
            this.handleElimination(winner);
        }

        return record;
    }

    /**
     * Handle elimination mode - remove winner from entries
     */
    handleElimination(winner) {
        if (entriesManager) {
            entriesManager.deleteEntry(winner.id);
        }
    }

    /**
     * Get all history records
     */
    getHistory() {
        return this.history;
    }

    /**
     * Get winner statistics
     */
    getStatistics() {
        const stats = {
            totalSpins: this.history.length,
            wheelSpins: 0,
            diceRolls: 0,
            winners: {},
            mostFrequent: null,
            lastWinner: null
        };

        this.history.forEach(record => {
            // Count by mode
            if (record.mode === 'wheel') {
                stats.wheelSpins++;
            } else {
                stats.diceRolls++;
            }

            // Count by winner
            const winnerKey = record.winner.text || record.winner;
            if (!stats.winners[winnerKey]) {
                stats.winners[winnerKey] = {
                    count: 0,
                    lastTime: record.timestamp
                };
            }
            stats.winners[winnerKey].count++;
            stats.winners[winnerKey].lastTime = record.timestamp;
        });

        // Find most frequent winner
        let maxCount = 0;
        for (const [name, data] of Object.entries(stats.winners)) {
            if (data.count > maxCount) {
                maxCount = data.count;
                stats.mostFrequent = { name, count: data.count };
            }
        }

        // Last winner
        if (this.history.length > 0) {
            stats.lastWinner = this.history[0].winner;
        }

        return stats;
    }

    /**
     * Clear all history
     */
    clearHistory() {
        this.history = [];
        this.saveHistory();
        this.renderHistory();
        this.renderStats();
    }

    /**
     * Set elimination mode
     */
    setEliminationMode(enabled) {
        this.eliminationMode = enabled;
        this.saveHistory();
    }

    /**
     * Export history to CSV
     */
    exportToCSV() {
        if (this.history.length === 0) {
            alert('No history to export');
            return;
        }

        const headers = ['Date', 'Time', 'Mode', 'Winner', 'Weight'];
        const rows = this.history.map(record => [
            record.date,
            record.time,
            record.mode,
            record.winner.text || record.winner,
            record.winner.weight || 1
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        this.downloadFile(csvContent, 'luckywheel-history.csv', 'text/csv');
    }

    /**
     * Export history to JSON
     */
    exportToJSON() {
        if (this.history.length === 0) {
            alert('No history to export');
            return;
        }

        const jsonContent = JSON.stringify(this.history, null, 2);
        this.downloadFile(jsonContent, 'luckywheel-history.json', 'application/json');
    }

    /**
     * Download file helper
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Render history list
     */
    renderHistory() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;

        historyList.innerHTML = '';

        if (this.history.length === 0) {
            historyList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 1rem;">No history yet</p>';
            return;
        }

        this.history.slice(0, 50).forEach(record => {
            const item = document.createElement('div');
            item.className = 'history-item';
            
            const winnerText = record.winner.text || record.winner;
            const modeIcon = record.mode === 'wheel' ? '🎡' : '🎲';
            
            item.innerHTML = `
                <span class="history-name">${modeIcon} ${winnerText}</span>
                <span class="history-time">${record.time}</span>
            `;
            
            historyList.appendChild(item);
        });

        if (this.history.length > 50) {
            const more = document.createElement('div');
            more.style.textAlign = 'center';
            more.style.padding = '0.5rem';
            more.style.color = 'var(--text-muted)';
            more.style.fontSize = '0.85rem';
            more.textContent = `+ ${this.history.length - 50} more entries`;
            historyList.appendChild(more);
        }
    }

    /**
     * Render statistics
     */
    renderStats() {
        const statsContainer = document.getElementById('historyStats');
        if (!statsContainer) return;

        const stats = this.getStatistics();
        
        statsContainer.innerHTML = `
            <h3>Statistics</h3>
            <div class="stat-row">
                <span class="stat-label">Total Spins:</span>
                <span class="stat-value">${stats.totalSpins}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Wheel Spins:</span>
                <span class="stat-value">${stats.wheelSpins}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Dice Rolls:</span>
                <span class="stat-value">${stats.diceRolls}</span>
            </div>
            ${stats.mostFrequent ? `
                <div class="stat-row">
                    <span class="stat-label">Most Frequent:</span>
                    <span class="stat-value">${stats.mostFrequent.name} (${stats.mostFrequent.count}x)</span>
                </div>
            ` : ''}
            ${stats.lastWinner ? `
                <div class="stat-row">
                    <span class="stat-label">Last Winner:</span>
                    <span class="stat-value">${stats.lastWinner.text || stats.lastWinner}</span>
                </div>
            ` : ''}
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // History button
        const historyBtn = document.getElementById('historyBtn');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => {
                this.openHistoryPanel();
            });
        }

        // Close history panel
        const closeHistoryBtn = document.getElementById('closeHistoryPanel');
        if (closeHistoryBtn) {
            closeHistoryBtn.addEventListener('click', () => {
                this.closeHistoryPanel();
            });
        }

        // Elimination mode checkbox
        const eliminationCheckbox = document.getElementById('eliminationMode');
        if (eliminationCheckbox) {
            eliminationCheckbox.addEventListener('change', (e) => {
                this.setEliminationMode(e.target.checked);
                soundEffects.playClick();
            });
        }

        // Export buttons
        const exportCsvBtn = document.getElementById('exportCsvBtn');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => {
                this.exportToCSV();
                soundEffects.playClick();
            });
        }

        const exportJsonBtn = document.getElementById('exportJsonBtn');
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', () => {
                this.exportToJSON();
                soundEffects.playClick();
            });
        }

        // Clear history button
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all history?')) {
                    this.clearHistory();
                    soundEffects.playSuccess();
                }
            });
        }

        // Close panel on overlay click
        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.closeHistoryPanel();
            });
        }
    }

    /**
     * Open history panel
     */
    openHistoryPanel() {
        const panel = document.getElementById('historyPanel');
        const overlay = document.getElementById('overlay');
        
        // Set checkbox state
        const eliminationCheckbox = document.getElementById('eliminationMode');
        if (eliminationCheckbox) {
            eliminationCheckbox.checked = this.eliminationMode;
        }

        this.renderHistory();
        this.renderStats();

        if (panel) panel.classList.add('active');
        if (overlay) overlay.classList.add('active');
        
        soundEffects.playClick();
    }

    /**
     * Close history panel
     */
    closeHistoryPanel() {
        const panel = document.getElementById('historyPanel');
        const overlay = document.getElementById('overlay');
        
        if (panel) panel.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
    }

    /**
     * Get state for sharing
     */
    getState() {
        return {
            history: this.history,
            eliminationMode: this.eliminationMode
        };
    }

    /**
     * Load state from sharing
     */
    loadState(state) {
        if (state.history && Array.isArray(state.history)) {
            this.history = state.history;
        }
        if (typeof state.eliminationMode === 'boolean') {
            this.eliminationMode = state.eliminationMode;
        }
        
        this.saveHistory();
        this.renderHistory();
        this.renderStats();
    }
}

// Initialize history manager
const historyManager = new HistoryManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoryManager;
}
