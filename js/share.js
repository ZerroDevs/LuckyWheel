/**
 * Share Manager
 * URL encoder/decoder for sharing wheel states via links or QR codes
 */

class ShareManager {
    constructor() {
        this.baseUrl = window.location.origin + window.location.pathname;
        this.compressionThreshold = 2000; // Characters before using compression
    }

    /**
     * Encode wheel state to URL hash
     */
    encodeState(state) {
        try {
            const data = {
                entries: state.entries || [],
                settings: state.settings || {},
                timestamp: Date.now()
            };

            // Convert to JSON string
            const jsonString = JSON.stringify(data);

            // Check if we need compression
            if (jsonString.length > this.compressionThreshold) {
                return this.compressAndEncode(jsonString);
            } else {
                return this.simpleEncode(jsonString);
            }
        } catch (error) {
            console.error('Error encoding state:', error);
            return null;
        }
    }

    /**
     * Simple base64 encoding for smaller payloads
     */
    simpleEncode(jsonString) {
        try {
            const encoded = btoa(encodeURIComponent(jsonString));
            return `#wheel=${encoded}`;
        } catch (error) {
            console.error('Error in simple encoding:', error);
            return null;
        }
    }

    /**
     * Compressed encoding for larger payloads
     */
    compressAndEncode(jsonString) {
        try {
            // Simple compression: remove unnecessary whitespace and use shorter keys
            const compressed = jsonString
                .replace(/\s+/g, ' ')
                .replace(/"text":/g, '"t":')
                .replace(/"color":/g, '"c":')
                .replace(/"weight":/g, '"w":')
                .replace(/"image":/g, '"i":')
                .replace(/"settings":/g, '"s":')
                .replace(/"entries":/g, '"e":');

            const encoded = btoa(encodeURIComponent(compressed));
            return `#wheel=${encoded}`;
        } catch (error) {
            console.error('Error in compressed encoding:', error);
            return this.simpleEncode(jsonString);
        }
    }

    /**
     * Decode wheel state from URL hash
     */
    decodeState(hash) {
        try {
            if (!hash || !hash.startsWith('#wheel=')) {
                return null;
            }

            const encoded = hash.substring(7); // Remove '#wheel='
            const decoded = decodeURIComponent(atob(encoded));
            const state = JSON.parse(decoded);

            // Restore full keys if compressed
            if (state.e) {
                state.entries = state.e;
                delete state.e;
            }
            if (state.s) {
                state.settings = state.s;
                delete state.s;
            }

            // Restore entry keys
            if (state.entries) {
                if (Array.isArray(state.entries)) {
                    state.entries = state.entries.map(entry => {
                        if (entry.t) {
                            entry.text = entry.t;
                            delete entry.t;
                        }
                        if (entry.c) {
                            entry.color = entry.c;
                            delete entry.c;
                        }
                        if (entry.w) {
                            entry.weight = entry.w;
                            delete entry.w;
                        }
                        if (entry.i) {
                            entry.image = entry.i;
                            delete entry.i;
                        }
                        return entry;
                    });
                } else {
                    state.entries = [];
                }
            }

            return state;
        } catch (error) {
            console.error('Error decoding state:', error);
            return null;
        }
    }

    /**
     * Generate shareable URL
     */
    generateShareUrl(state) {
        const hash = this.encodeState(state);
        if (!hash) {
            return null;
        }
        return this.baseUrl + hash;
    }

    /**
     * Load state from current URL
     */
    loadStateFromUrl() {
        const hash = window.location.hash;
        if (hash) {
            return this.decodeState(hash);
        }
        return null;
    }

    /**
     * Clear URL hash
     */
    clearUrlHash() {
        if (window.location.hash) {
            history.pushState('', document.title, window.location.pathname + window.location.search);
        }
    }

    /**
     * Copy URL to clipboard
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    return true;
                } catch (error) {
                    document.body.removeChild(textArea);
                    return false;
                }
            }
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            return false;
        }
    }

    /**
     * Generate QR Code placeholder (in production, use a QR code library)
     */
    generateQRCode(url) {
        // For a production app, you would use a library like qrcode.js
        // This is a placeholder that creates a simple visual representation
        const qrContainer = document.getElementById('qrCode');
        if (!qrContainer) return;

        qrContainer.innerHTML = `
            <div class="qr-placeholder">
                <p>QR Code</p>
                <p style="font-size: 0.8rem; margin-top: 0.5rem;">${url.substring(0, 40)}...</p>
                <p style="font-size: 0.7rem; margin-top: 0.5rem; color: var(--text-muted);">
                    (QR code library integration needed)
                </p>
            </div>
        `;
    }

    /**
     * Export state to JSON file
     */
    exportToJson(state, filename = 'wheel-state.json') {
        try {
            const jsonString = JSON.stringify(state, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Error exporting to JSON:', error);
            return false;
        }
    }

    /**
     * Import state from JSON file
     */
    importFromJson(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const state = JSON.parse(event.target.result);
                    resolve(state);
                } catch (error) {
                    reject(new Error('Invalid JSON file'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * Validate shared state
     */
    validateState(state) {
        if (!state || typeof state !== 'object') {
            return false;
        }

        if (!Array.isArray(state.entries)) {
            return false;
        }

        // Validate each entry
        for (const entry of state.entries) {
            if (!entry.text || typeof entry.text !== 'string') {
                return false;
            }
            if (entry.weight && (typeof entry.weight !== 'number' || entry.weight < 0)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Generate share modal content
     */
    showShareModal(state) {
        const shareUrl = this.generateShareUrl(state);
        if (!shareUrl) {
            alert('Unable to generate share URL');
            return;
        }

        const shareModal = document.getElementById('shareModal');
        const shareUrlInput = document.getElementById('shareUrl');
        
        if (shareUrlInput) {
            shareUrlInput.value = shareUrl;
        }

        // Generate QR code
        this.generateQRCode(shareUrl);

        // Show modal
        if (shareModal) {
            shareModal.classList.add('active');
        }

        // Setup copy button
        const copyBtn = document.getElementById('copyShareBtn');
        if (copyBtn) {
            copyBtn.onclick = async () => {
                const success = await this.copyToClipboard(shareUrl);
                if (success) {
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => {
                        copyBtn.textContent = 'Copy';
                    }, 2000);
                } else {
                    alert('Failed to copy to clipboard');
                }
            };
        }
    }
}

// Initialize share manager
const shareManager = new ShareManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShareManager;
}
