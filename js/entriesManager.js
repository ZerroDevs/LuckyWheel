/**
 * Entries Manager
 * CRUD operations for entries (Text, Images, Percentages/Weights, Custom Colors)
 */

class EntriesManager {
    constructor() {
        this.entries = [];
        this.customWeights = false;
        this.showPercentages = false;
        this.storageKey = 'luckywheel-entries';
        this.colorPresets = {
            rainbow: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe'],
            pastel: ['#ffb3ba', '#bae1ff', '#baffc9', '#ffffba', '#ffdfba', '#e0bbff', '#ff9aa2', '#c7ceea'],
            neon: ['#ff006e', '#00f5d4', '#fee440', '#9b5de5', '#00bbf9', '#f15bb5', '#00f5d4', '#fee440'],
            gold: ['#ffd700', '#ffb347', '#ff8c00', '#ffa500', '#ffcc00', '#ffe135', '#ffdf00', '#ffc125']
        };
        this.currentPreset = 'rainbow';
        this.init();
    }

    init() {
        this.loadEntries();
        this.setupEventListeners();
    }

    /**
     * Load entries from localStorage
     */
    loadEntries() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                this.entries = data.entries || this.getDefaultEntries();
                this.customWeights = data.customWeights || false;
                this.showPercentages = data.showPercentages || false;
                this.currentPreset = data.currentPreset || 'rainbow';
            } else {
                this.entries = this.getDefaultEntries();
            }
            // Render entries after loading
            this.renderEntries();
        } catch (error) {
            console.error('Error loading entries:', error);
            this.entries = this.getDefaultEntries();
            this.renderEntries();
        }
    }

    /**
     * Save entries to localStorage
     */
    saveEntries() {
        try {
            const data = {
                entries: this.entries,
                customWeights: this.customWeights,
                showPercentages: this.showPercentages,
                currentPreset: this.currentPreset
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving entries:', error);
        }
    }

    /**
     * Get default entries
     */
    getDefaultEntries() {
        return [];
    }

    /**
     * Add a new entry
     */
    addEntry(text = '', color = null, weight = 1, image = null) {
        const presetColors = this.colorPresets[this.currentPreset];
        const entryColor = color || presetColors[this.entries.length % presetColors.length];
        
        const entry = {
            id: Date.now() + Math.random(),
            text: text || `Entry ${this.entries.length + 1}`,
            color: entryColor,
            weight: weight,
            image: image
        };
        
        this.entries.push(entry);
        this.saveEntries();
        this.renderEntries();
        return entry;
    }

    /**
     * Update an existing entry
     */
    updateEntry(id, updates) {
        const index = this.entries.findIndex(e => e.id == id);
        if (index !== -1) {
            this.entries[index] = { ...this.entries[index], ...updates };
            this.saveEntries();
            this.renderEntries();
            return true;
        }
        return false;
    }

    /**
     * Delete an entry
     */
    deleteEntry(id) {
        const index = this.entries.findIndex(e => e.id == id);
        if (index !== -1) {
            this.entries.splice(index, 1);
            this.saveEntries();
            this.renderEntries();
            return true;
        }
        return false;
    }

    /**
     * Get all entries
     */
    getEntries() {
        return this.entries;
    }

    /**
     * Get weighted entries (for wheel/dice)
     */
    getWeightedEntries() {
        if (!this.customWeights) {
            return this.entries.map(entry => ({ ...entry, weight: 1 }));
        }
        return this.entries;
    }

    /**
     * Calculate total weight
     */
    getTotalWeight() {
        return this.entries.reduce((total, entry) => total + (entry.weight || 1), 0);
    }

    /**
     * Get percentage for an entry
     */
    getEntryPercentage(entry) {
        const totalWeight = this.getTotalWeight();
        if (totalWeight === 0) return 0;
        return ((entry.weight || 1) / totalWeight * 100).toFixed(1);
    }

    /**
     * Shuffle entries
     */
    shuffleEntries() {
        // Fisher-Yates shuffle for true randomization
        for (let i = this.entries.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.entries[i], this.entries[j]] = [this.entries[j], this.entries[i]];
        }
        this.saveEntries();
        this.renderEntries();
        // Force wheel to redraw with new order
        if (wheelEngine) {
            wheelEngine.setEntries(this.getWeightedEntries());
        }
    }

    /**
     * Sort entries alphabetically
     */
    sortEntries() {
        this.entries.sort((a, b) => a.text.localeCompare(b.text));
        this.saveEntries();
        this.renderEntries();
    }

    /**
     * Apply color preset
     */
    applyColorPreset(preset) {
        this.currentPreset = preset;
        const colors = this.colorPresets[preset];
        
        this.entries.forEach((entry, index) => {
            entry.color = colors[index % colors.length];
        });
        
        this.saveEntries();
        this.renderEntries();
    }

    /**
     * Bulk import entries from text
     */
    bulkImport(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const presetColors = this.colorPresets[this.currentPreset];
        
        const newEntries = lines.map((line, index) => ({
            id: Date.now() + Math.random() + index,
            text: line.trim(),
            color: presetColors[index % presetColors.length],
            weight: 1,
            image: null
        }));
        
        this.entries = newEntries;
        this.saveEntries();
        this.renderEntries();
    }

    /**
     * Clear all entries
     */
    clearEntries() {
        this.entries = [];
        this.saveEntries();
        this.renderEntries();
    }

    /**
     * Set custom weights mode
     */
    setCustomWeights(enabled) {
        this.customWeights = enabled;
        this.saveEntries();
        this.renderEntries();
    }

    /**
     * Set show percentages mode
     */
    setShowPercentages(enabled) {
        this.showPercentages = enabled;
        this.saveEntries();
        this.renderEntries();
    }

    /**
     * Render entries list in sidebar
     */
    renderEntries() {
        const entriesList = document.getElementById('entriesList');
        const entryCount = document.getElementById('entryCount');
        
        if (!entriesList) return;

        entriesList.innerHTML = '';
        entryCount.textContent = this.entries.length;

        this.entries.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'entry-item';
            
            const percentage = this.showPercentages ? `<span class="entry-weight">${this.getEntryPercentage(entry)}%</span>` : '';
            
            item.innerHTML = `
                <div class="entry-color" style="background-color: ${entry.color}"></div>
                <span class="entry-text">${entry.text}</span>
                ${percentage}
            `;
            
            entriesList.appendChild(item);
        });
    }

    /**
     * Render entries editor in modal
     */
    renderEntriesEditor() {
        const editorList = document.getElementById('entriesEditorList');
        if (!editorList) return;

        editorList.innerHTML = '';

        this.entries.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'entry-editor-item';
            item.dataset.id = entry.id;

            // Only show weight input when custom weights is enabled
            const percentage = this.customWeights ? `
                <div class="weight-input-wrapper">
                    <label>Weight:</label>
                    <input type="number" 
                           class="entry-weight-input" 
                           value="${entry.weight}" 
                           min="0" 
                           step="any"
                           data-field="weight">
                    <span class="weight-percent">(${this.getEntryPercentage(entry)}%)</span>
                </div>
            ` : '';


            item.innerHTML = `
                <input type="color" 
                       class="entry-color-picker" 
                       value="${entry.color}" 
                       data-field="color">
                <input type="text" 
                       class="entry-input" 
                       value="${entry.text}" 
                       placeholder="Entry name"
                       data-field="text">
                ${percentage}
                <div class="entry-image-upload">
                    ${entry.image ? 
                        `<img src="${entry.image}" class="entry-image-preview" alt="Preview">` : 
                        `<span>📷</span>`}
                    <input type="file" accept="image/*" data-field="image">
                </div>
                <button class="remove-entry-btn" data-action="remove">×</button>
            `;

            editorList.appendChild(item);
        });

        // Add event listeners for editor items
        this.setupEditorListeners(editorList);
    }

    /**
     * Setup editor item listeners
     */
    setupEditorListeners(editorList) {
        editorList.addEventListener('input', (e) => {
            const item = e.target.closest('.entry-editor-item');
            if (!item) return;

            const id = parseFloat(item.dataset.id);
            const field = e.target.dataset.field;
            let value = e.target.value;

            if (field === 'weight') {
                value = parseFloat(value) || 1;
                // Update percentage display for all entries when weight changes
                this.updateEntry(id, { [field]: value });
                this.updateAllPercentages(editorList);
                return;
            }

            if (field === 'image' && e.target.files[0]) {
                this.handleImageUpload(e.target.files[0], id);
                return;
            }

            this.updateEntry(id, { [field]: value });
        });

        editorList.addEventListener('click', (e) => {
            // Check if clicked on remove button or its child elements
            if (e.target.classList.contains('remove-entry-btn') || e.target.closest('.remove-entry-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const item = e.target.closest('.entry-editor-item');
                if (item) {
                    const id = item.dataset.id;
                    this.deleteEntry(id);
                    this.renderEntriesEditor();
                }
            }
        });
    }

    /**
     * Update percentage displays for all entries
     */
    updateAllPercentages(editorList) {
        const items = editorList.querySelectorAll('.entry-editor-item');
        items.forEach(item => {
            const id = item.dataset.id;
            const entry = this.entries.find(e => e.id == id);
            if (entry) {
                const percentSpan = item.querySelector('.weight-percent');
                if (percentSpan) {
                    percentSpan.textContent = `(${this.getEntryPercentage(entry)}%)`;
                }
            }
        });
    }

    /**
     * Handle image upload
     */
    handleImageUpload(file, entryId) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageDataUrl = e.target.result;
            this.updateEntry(entryId, { image: imageDataUrl });
            this.renderEntriesEditor();
        };
        reader.readAsDataURL(file);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Edit entries button
        const editBtn = document.getElementById('editEntriesBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.openEntriesModal();
            });
        }

        // Shuffle button
        const shuffleBtn = document.getElementById('shuffleBtn');
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => {
                this.shuffleEntries();
                // Dispatch event to update wheel with shuffled entries
                window.dispatchEvent(new Event('entriesUpdated'));
                soundEffects.playClick();
            });
        }

        // Sort button
        const sortBtn = document.getElementById('sortBtn');
        if (sortBtn) {
            sortBtn.addEventListener('click', () => {
                this.sortEntries();
                // Dispatch event to update wheel with sorted entries
                window.dispatchEvent(new Event('entriesUpdated'));
                soundEffects.playClick();
            });
        }

        // Modal event listeners
        this.setupModalListeners();
    }

    /**
     * Setup modal listeners
     */
    setupModalListeners() {
        const modal = document.getElementById('entriesModal');
        const closeBtn = document.getElementById('closeEntriesModal');
        const cancelBtn = document.getElementById('cancelEntriesBtn');
        const saveBtn = document.getElementById('saveEntriesBtn');
        const addBtn = document.getElementById('addEntryBtn');
        const importBtn = document.getElementById('importBulkBtn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeEntriesModal());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeEntriesModal());
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveEntries();
                this.closeEntriesModal();
                // Dispatch event to update wheel with new entries/weights
                window.dispatchEvent(new Event('entriesUpdated'));
                soundEffects.playSuccess();
            });
        }

        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.addEntry();
                this.renderEntriesEditor();
                soundEffects.playClick();
            });
        }

        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const textarea = document.getElementById('bulkImport');
                if (textarea) {
                    this.bulkImport(textarea.value);
                    this.renderEntriesEditor();
                    soundEffects.playSuccess();
                }
            });
        }

        // Editor tabs
        const tabs = document.querySelectorAll('.editor-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const tabName = tab.dataset.tab;
                document.querySelectorAll('.editor-tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(`${tabName}Tab`).classList.add('active');
            });
        });

        // Weighting options
        const customWeightsCheckbox = document.getElementById('customWeights');
        if (customWeightsCheckbox) {
            customWeightsCheckbox.addEventListener('change', (e) => {
                this.setCustomWeights(e.target.checked);
                this.renderEntriesEditor();
                // Dispatch event to update wheel with new weights
                window.dispatchEvent(new Event('entriesUpdated'));
            });
        }

        const showPercentagesCheckbox = document.getElementById('showPercentages');
        if (showPercentagesCheckbox) {
            showPercentagesCheckbox.addEventListener('change', (e) => {
                this.setShowPercentages(e.target.checked);
                this.renderEntries();
            });
        }

        // Color presets
        const presetButtons = document.querySelectorAll('.preset-btn');
        presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.preset;
                this.applyColorPreset(preset);
                this.renderEntriesEditor();
                soundEffects.playClick();
            });
        });

        // Close modal on overlay click
        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.closeEntriesModal();
            });
        }
    }

    /**
     * Open entries modal
     */
    openEntriesModal() {
        const modal = document.getElementById('entriesModal');
        const overlay = document.getElementById('overlay');
        
        // Set checkbox states
        const customWeightsCheckbox = document.getElementById('customWeights');
        const showPercentagesCheckbox = document.getElementById('showPercentages');
        
        if (customWeightsCheckbox) {
            customWeightsCheckbox.checked = this.customWeights;
        }
        
        if (showPercentagesCheckbox) {
            showPercentagesCheckbox.checked = this.showPercentages;
        }

        this.renderEntriesEditor();

        if (modal) modal.classList.add('active');
        if (overlay) overlay.classList.add('active');
        
        soundEffects.playClick();
    }

    /**
     * Close entries modal
     */
    closeEntriesModal() {
        const modal = document.getElementById('entriesModal');
        const overlay = document.getElementById('overlay');
        
        if (modal) modal.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
    }

    /**
     * Get state for sharing
     */
    getState() {
        return {
            entries: this.entries,
            customWeights: this.customWeights,
            showPercentages: this.showPercentages,
            currentPreset: this.currentPreset
        };
    }

    /**
     * Load state from sharing
     */
    loadState(state) {
        if (state.entries && Array.isArray(state.entries)) {
            this.entries = state.entries;
        }
        if (typeof state.customWeights === 'boolean') {
            this.customWeights = state.customWeights;
        }
        if (typeof state.showPercentages === 'boolean') {
            this.showPercentages = state.showPercentages;
        }
        if (state.currentPreset && this.colorPresets[state.currentPreset]) {
            this.currentPreset = state.currentPreset;
        }
        
        this.saveEntries();
        this.renderEntries();
    }
}

// Initialize entries manager
const entriesManager = new EntriesManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EntriesManager;
}
