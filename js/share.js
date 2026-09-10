/**
 * Share Manager
 * URL encoder/decoder for sharing wheel states via links or QR codes
 */

class ShareManager {
    constructor() {
        this.baseUrl = window.location.origin + window.location.pathname;
        this.compressionThreshold = 0; // Always use compression to keep URLs short
    }

    /**
     * Encode wheel state to URL hash
     */
    async encodeState(state) {
        try {
            // Optimize entries for smaller payload
            let optimizedEntries = state.entries;
            if (state.entries && Array.isArray(state.entries.entries)) {
                optimizedEntries = { ...state.entries };
                optimizedEntries.entries = state.entries.entries.map(e => {
                    // Convert to array format: [text, color, weight, image]
                    const arr = [e.text, e.color, e.weight];
                    if (e.image) arr.push(e.image);
                    return arr;
                });
            } else if (Array.isArray(state.entries)) {
                optimizedEntries = state.entries.map(e => {
                    const arr = [e.text, e.color, e.weight];
                    if (e.image) arr.push(e.image);
                    return arr;
                });
            }

            const data = {
                entries: optimizedEntries || [],
                settings: state.settings || {},
                timestamp: Date.now()
            };

            // Convert to JSON string
            const jsonString = JSON.stringify(data);

            // Check if we need compression
            if (jsonString.length > this.compressionThreshold) {
                return await this.compressAndEncode(jsonString);
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
     * Compressed encoding for larger payloads using CompressionStream
     */
    async compressAndEncode(jsonString) {
        try {
            if (typeof CompressionStream !== 'undefined') {
                const stream = new Blob([jsonString]).stream().pipeThrough(new CompressionStream("deflate-raw"));
                const buffer = await new Response(stream).arrayBuffer();
                const bytes = new Uint8Array(buffer);
                let binary = '';
                for (let i = 0; i < bytes.length; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const encoded = btoa(binary);
                return `#cwheel=${encoded}`; // use #cwheel= to differentiate from old #wheel=
            } else {
                // fallback if CompressionStream is not available
                return this.simpleEncode(jsonString);
            }
        } catch (error) {
            console.error('Compression error:', error);
            return this.simpleEncode(jsonString);
        }
    }

    /**
     * Decode wheel state from URL hash
     */
    async decodeState(hash) {
        try {
            if (!hash) return null;
            
            let decoded;
            if (hash.startsWith('#cwheel=')) {
                // Decompress
                const encoded = hash.substring(8); // Remove '#cwheel='
                const binary = atob(encoded);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
                decoded = await new Response(stream).text();
            } else if (hash.startsWith('#wheel=')) {
                // Fallback for old uncompressed / simple encoded links
                const encoded = hash.substring(7); // Remove '#wheel='
                decoded = decodeURIComponent(atob(encoded));
            } else {
                return null;
            }

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
                const parseEntry = (entry) => {
                    // Super-compressed array format
                    if (Array.isArray(entry)) {
                        return {
                            id: Date.now() + Math.random(),
                            text: entry[0],
                            color: entry[1],
                            weight: entry[2],
                            image: entry[3] || null
                        };
                    }
                    // Object format
                    if (entry.t) { entry.text = entry.t; delete entry.t; }
                    if (entry.c) { entry.color = entry.c; delete entry.c; }
                    if (entry.w) { entry.weight = entry.w; delete entry.w; }
                    if (entry.i) { entry.image = entry.i; delete entry.i; }
                    
                    if (!entry.id) entry.id = Date.now() + Math.random();
                    if (entry.image === undefined) entry.image = null;
                    return entry;
                };

                // If it's an array (old format)
                if (Array.isArray(state.entries)) {
                    state.entries = state.entries.map(parseEntry);
                } 
                // If it's an object with an entries array (new format)
                else {
                    // Restore compressed inner array if it exists
                    if (state.entries.e) {
                        state.entries.entries = state.entries.e;
                        delete state.entries.e;
                    }
                    
                    if (state.entries.entries && Array.isArray(state.entries.entries)) {
                        state.entries.entries = state.entries.entries.map(parseEntry);
                    }
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
    async generateShareUrl(state) {
        const hash = await this.encodeState(state);
        if (!hash) {
            return null;
        }
        return this.baseUrl + hash;
    }

    /**
     * Load state from current URL
     */
    async loadStateFromUrl() {
        const hash = window.location.hash;
        if (hash) {
            return await this.decodeState(hash);
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
     * Generate QR Code
     */
    generateQRCode(url) {
        const qrContainer = document.getElementById('qrCode');
        if (!qrContainer) return;

        qrContainer.innerHTML = ''; // Clear previous QR code

        try {
            if (typeof QRCode !== 'undefined') {
                new QRCode(qrContainer, {
                    text: url,
                    width: 200,
                    height: 200,
                    colorDark : "#333333",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.L
                });
            } else {
                qrContainer.innerHTML = '<p style="color: var(--danger-color);">QR Code library failed to load.</p>';
            }
        } catch (error) {
            console.error('Error generating QR code:', error);
            qrContainer.innerHTML = '<p style="color: var(--danger-color);">Failed to generate QR Code.</p>';
        }
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

        let entriesList = state.entries;
        if (state.entries && !Array.isArray(state.entries) && Array.isArray(state.entries.entries)) {
            entriesList = state.entries.entries;
        }

        if (!Array.isArray(entriesList)) {
            return false;
        }

        // Validate each entry
        for (const entry of entriesList) {
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
    async showShareModal(state) {
        const shareUrl = await this.generateShareUrl(state);
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
