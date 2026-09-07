/**
 * Wheel Engine
 * Canvas-based wheel drawing, High-DPI scaling, physics calculation, center hub rendering, and spin engine
 */

class WheelEngine {
    constructor(canvasOrId, index = 0) {
        this.canvas = typeof canvasOrId === 'string' ? document.getElementById(canvasOrId) : canvasOrId;
        this.wheelIndex = index;
        if (this.canvas && this.canvas.parentElement) {
            this.pointer = this.canvas.parentElement.querySelector('.wheel-pointer');
        }
        this.ctx = this.canvas.getContext('2d');
        this.entries = [];
        this.isSpinning = false;
        this.currentRotation = 0;
        this.spinVelocity = 0;
        this.spinDuration = 5000;
        this.spinStartTime = 0;
        this.lastTickAngle = 0;
        this.pointerAngle = -Math.PI / 2; // Pointer at top (270 degrees)
        this.centerHubImage = null;
        this.settings = {
            spinDuration: 5,
            easing: 'ease-out'
        };
        this.speed = 5;
        
        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.draw();
        });
        
        // Listen for theme changes
        window.addEventListener('themeChange', (e) => {
            this.draw();
        });
    }

    resizeCanvas() {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        let size = Math.min(container.offsetWidth, container.offsetHeight);
        
        // Ensure minimum size
        const minSize = 200;
        size = Math.max(size, minSize);
        
        const dpr = window.devicePixelRatio || 1;
        
        // Set display size
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';
        
        // Set actual size in memory (scaled for high DPI)
        this.canvas.width = size * dpr;
        this.canvas.height = size * dpr;
        
        // Normalize coordinate system
        this.ctx.scale(dpr, dpr);
        
        this.size = size;
        this.centerX = size / 2;
        this.centerY = size / 2;
        this.radius = (size / 2) - 15;
    }

    setEntries(entries) {
        this.entries = entries;
        this.totalWeight = this.entries.reduce((sum, entry) => sum + (entry.weight || 1), 0);
        this.draw();
    }

    setSpinDuration(seconds) {
        this.settings.spinDuration = seconds;
        this.spinDuration = seconds * 1000;
    }

    setCenterHubImage(imageUrl) {
        if (imageUrl) {
            const img = new Image();
            img.onload = () => {
                this.centerHubImage = img;
                this.draw();
            };
            img.src = imageUrl;
        } else {
            this.centerHubImage = null;
            this.draw();
        }
    }

    /**
     * Draw the wheel
     */
    draw() {
        if (!this.ctx) return;
        
        if (this.entries.length === 0) {
            this.drawEmptyState();
            return;
        }

        const ctx = this.ctx;
        const centerX = this.centerX;
        const centerY = this.centerY;
        const radius = this.radius;
        const numEntries = this.entries.length;
        
        // Show spin button when entries exist
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn) {
            spinBtn.style.display = 'block';
        }
        
        // Clear canvas
        ctx.clearRect(0, 0, this.size, this.size);
        
        const totalWeight = this.totalWeight || 1;
        
        // Get theme colors (cached if possible, but reading classList is generally fast enough if not done in hot loop, let's just keep it or cache it. Actually it's fine)
        const isDark = document.body.classList.contains('dark-theme');
        const textColor = isDark ? '#f5f5f5' : '#1a1a1a';
        const strokeColor = isDark ? '#2d2d2d' : '#ffffff';
        
        // Calculate text settings once
        const fontSize = Math.max(12, Math.min(18, Math.floor(radius / (numEntries * 0.8))));
        ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        
        let currentAngleOffset = 0;
        
        // Draw each slice
        this.entries.forEach((entry, index) => {
            const entryWeight = entry.weight || 1;
            const sliceAngle = (entryWeight / totalWeight) * 2 * Math.PI;
            
            const startAngle = this.currentRotation + currentAngleOffset;
            const endAngle = startAngle + sliceAngle;
            currentAngleOffset += sliceAngle;
            
            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            
            ctx.fillStyle = entry.color;
            ctx.fill();
            
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.fillStyle = textColor;
            
            // Add text shadow for better readability
            // Canvas shadows are very expensive to compute, so disable them while spinning
            if (!this.isSpinning) {
                ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 1;
            } else {
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
            }
            
            const text = entry.text;
            let displayText = text;
            
            // Truncate text based on available space
            const maxTextLength = Math.floor(radius / fontSize);
            if (text.length > maxTextLength) {
                displayText = text.substring(0, maxTextLength - 3) + '...';
            }
            
            ctx.fillText(displayText, radius - 25, 0);
            
            // Draw image if present
            if (entry.image) {
                try {
                    if (!this.imageCache) this.imageCache = {};
                    let img = this.imageCache[entry.image];
                    if (!img) {
                        img = new Image();
                        img.src = entry.image;
                        this.imageCache[entry.image] = img;
                        
                        // Force a redraw once the image loads if we aren't spinning
                        img.onload = () => {
                            if (!this.isSpinning) this.draw();
                        };
                    }
                    if (img.complete && img.naturalHeight !== 0) {
                        const imgSize = Math.max(30, Math.min(50, Math.floor(radius / 8)));
                        ctx.drawImage(img, radius - imgSize - 35, -imgSize / 2, imgSize, imgSize);
                    }
                } catch (e) {
                    // Image loading error, skip
                }
            }
            
            ctx.restore();
        });
        
        // Draw center hub
        this.drawCenterHub(ctx, centerX, centerY, strokeColor);
    }

    drawCenterHub(ctx, centerX, centerY, strokeColor) {
        const hubRadius = 40;
        
        // Hub background
        ctx.beginPath();
        ctx.arc(centerX, centerY, hubRadius, 0, 2 * Math.PI);
        ctx.fillStyle = strokeColor;
        ctx.fill();
        
        ctx.strokeStyle = this.getAccentColor();
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Draw hub image or text
        if (this.centerHubImage) {
            try {
                const imgSize = hubRadius * 1.5;
                ctx.drawImage(
                    this.centerHubImage,
                    centerX - imgSize / 2,
                    centerY - imgSize / 2,
                    imgSize,
                    imgSize
                );
            } catch (e) {
                // Image error, draw default
                this.drawDefaultHubContent(ctx, centerX, centerY);
            }
        } else {
            this.drawDefaultHubContent(ctx, centerX, centerY);
        }
    }

    drawDefaultHubContent(ctx, centerX, centerY) {
        ctx.fillStyle = this.getAccentColor();
        ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎰', centerX, centerY);
    }

    getAccentColor() {
        const isDark = document.body.classList.contains('dark-theme');
        return isDark ? '#818cf8' : '#6366f1';
    }

    drawEmptyState() {
        const ctx = this.ctx;
        const centerX = this.centerX;
        const centerY = this.centerY;
        
        // Clear canvas
        ctx.clearRect(0, 0, this.size, this.size);
        
        // Hide spin button when no entries
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn) {
            spinBtn.style.display = 'none';
        }
        
        // Draw message only (no wheel)
        ctx.fillStyle = this.getTextColor();
        ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const message = 'No entries yet';
        const subMessage = 'Click "Edit" to add entries';
        
        ctx.fillText(message, centerX, centerY - 15);
        ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = this.getTextColor() + '80';
        ctx.fillText(subMessage, centerX, centerY + 15);
    }

    getEmptyWheelColor() {
        const isDark = document.body.classList.contains('dark-theme');
        return isDark ? '#2d2d2d' : '#f5f5f5';
    }

    getTextColor() {
        const isDark = document.body.classList.contains('dark-theme');
        return isDark ? '#f5f5f5' : '#1a1a1a';
    }

    /**
     * Spin the wheel
     */
    spin() {
        if (this.isSpinning || this.entries.length === 0) return;
        
        this.isSpinning = true;
        this.spinStartTime = Date.now();
        
        // Calculate spin duration based on speed (1 = slow/long, 10 = fast/short)
        const baseDuration = 5000;
        const speedMultiplier = 11 - this.speed; // Invert so higher speed = shorter duration
        this.spinDuration = baseDuration / (speedMultiplier / 5);
        
        // Calculate random spin based on speed
        const minSpins = 3 + Math.floor(this.speed / 3);
        const maxSpins = 6 + Math.floor(this.speed / 2);
        const spins = minSpins + Math.random() * (maxSpins - minSpins);
        const targetRotation = this.currentRotation + (spins * 2 * Math.PI);
        
        // Random deceleration curve
        const easingFunctions = {
            'ease-out': this.easeOutCubic,
            'ease-in-out': this.easeInOutCubic,
            'bounce': this.easeOutBounce
        };
        
        const easing = easingFunctions[this.settings.easing] || this.easeOutCubic;
        
        // Animate spin
        const animate = () => {
            const elapsed = Date.now() - this.spinStartTime;
            const progress = Math.min(elapsed / this.spinDuration, 1);
            
            // Calculate current rotation
            const easedProgress = easing(progress);
            this.currentRotation = this.currentRotation + (targetRotation - this.currentRotation) * easedProgress * 0.1;
            
            // Check for tick sounds
            this.checkForTicks();
            
            // Draw wheel
            this.draw();
            
            // Continue animation or finish
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.finishSpin();
            }
        };
        
        animate();
        
        // Play spin sound
        soundEffects.playSpin();
        
        // Update button state
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn) {
            spinBtn.classList.add('spinning');
            spinBtn.disabled = true;
        }
    }

    /**
     * Check for slice boundary crossings (for tick sounds)
     */
    checkForTicks() {
        if (!this.entries || this.entries.length === 0) return;
        
        const totalWeight = this.totalWeight || 1;
        
        let pointerAngle = -Math.PI / 2 - this.currentRotation;
        pointerAngle = pointerAngle % (2 * Math.PI);
        if (pointerAngle < 0) pointerAngle += 2 * Math.PI;
        
        let currentOffset = 0;
        let currentSlice = 0;
        for (let i = 0; i < this.entries.length; i++) {
            const entryWeight = this.entries[i].weight || 1;
            const sliceAngle = (entryWeight / totalWeight) * 2 * Math.PI;
            if (pointerAngle >= currentOffset && pointerAngle < currentOffset + sliceAngle) {
                currentSlice = i;
                break;
            }
            currentOffset += sliceAngle;
        }
        
        if (currentSlice !== this.lastTickAngle) {
            this.lastTickAngle = currentSlice;
            
            // Play tick sound
            soundEffects.playTick();
            
            // Animate pointer
            if (this.pointer) {
                this.pointer.classList.add('ticking');
                setTimeout(() => this.pointer.classList.remove('ticking'), 100);
            }
        }
    }

    /**
     * Finish spin and determine winner
     */
    finishSpin() {
        this.isSpinning = false;
        
        // Calculate winning slice
        const totalWeight = this.totalWeight || 1;
        
        let pointerAngle = -Math.PI / 2 - this.currentRotation;
        pointerAngle = pointerAngle % (2 * Math.PI);
        if (pointerAngle < 0) pointerAngle += 2 * Math.PI;
        
        let currentOffset = 0;
        let winner = this.entries[0];
        for (let i = 0; i < this.entries.length; i++) {
            const entryWeight = this.entries[i].weight || 1;
            const sliceAngle = (entryWeight / totalWeight) * 2 * Math.PI;
            if (pointerAngle >= currentOffset && pointerAngle < currentOffset + sliceAngle) {
                winner = this.entries[i];
                break;
            }
            currentOffset += sliceAngle;
        }
        if (typeof this.onFinish === 'function') {
            this.onFinish(winner);
        } else {
            // Update button state
            const spinBtn = document.getElementById('spinBtn');
            if (spinBtn) {
                spinBtn.classList.remove('spinning');
                spinBtn.disabled = false;
            }
            
            // Add to history
            historyManager.addWinner(winner, 'wheel');
            
            // Trigger confetti immediately
            if (confettiInstance) {
                confettiInstance.celebrate();
            } else {
                const confetti = initConfetti();
                if (confetti) {
                    confetti.celebrate();
                }
            }
            
            // Play victory sound immediately
            soundEffects.playVictory();
            
            // Show winner modal after a short delay for better UX
            setTimeout(() => {
                this.showWinner(winner);
            }, 300);
        }
    }

    /**
     * Show winner modal
     */
    showWinner(winner) {
        const modal = document.getElementById('winnerModal');
        const winnerDisplay = document.getElementById('winnerDisplay');
        
        if (!winnerDisplay) return;
        
        let content = '';
        
        if (winner.image) {
            content += `<img src="${winner.image}" class="winner-image" alt="${winner.text}">`;
        }
        
        content += `<div class="winner-name">${winner.text}</div>`;
        
        winnerDisplay.innerHTML = content;
        
        // Show modal
        if (modal) {
            modal.classList.add('active');
        }
        
        // Setup modal buttons
        this.setupWinnerModalButtons(winner);
    }

    setupWinnerModalButtons(winner) {
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
                entriesManager.deleteEntry(winner.id);
                this.closeWinnerModal();
                setTimeout(() => this.spin(), 300);
            };
        }
        
        if (playAgainBtn) {
            playAgainBtn.onclick = () => {
                this.closeWinnerModal();
                setTimeout(() => this.spin(), 300);
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
     * Easing functions
     */
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    easeOutBounce(t) {
        const n1 = 7.5625;
        const d1 = 2.75;
        
        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    }

    /**
     * Get current settings
     */
    getSettings() {
        return this.settings;
    }

    /**
     * Update settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        if (newSettings.spinDuration) {
            this.setSpinDuration(newSettings.spinDuration);
        }
    }
}

// Initialize wheel engine
class WheelController {
    constructor() {
        this.engines = [];
        this.wheelCount = 1;
        this.wrapper = document.getElementById('wheelsWrapper');
        this.isSpinning = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.renderWheels();
    }
    
    setupEventListeners() {
        const countSelector = document.getElementById('wheelCount');
        if (countSelector) {
            countSelector.addEventListener('change', (e) => {
                this.setWheelCount(parseInt(e.target.value));
            });
        }
        
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn) {
            spinBtn.addEventListener('click', () => {
                this.spin();
            });
        }
        
        const speedInput = document.getElementById('wheelSpeed');
        const speedValue = document.getElementById('wheelSpeedValue');
        if (speedInput && speedValue) {
            speedInput.addEventListener('input', (e) => {
                const speed = parseInt(e.target.value);
                speedValue.textContent = speed;
                this.engines.forEach(engine => engine.speed = speed);
            });
        }
        
        // Note: Keyboard shortcut is handled globally in app.js
    }
    
    setWheelCount(count) {
        if (this.isSpinning) return;
        this.wheelCount = Math.max(1, Math.min(4, count));
        this.renderWheels();
    }
    
    renderWheels() {
        if (!this.wrapper) return;
        
        this.wrapper.innerHTML = '';
        this.wrapper.className = `wheels-wrapper count-${this.wheelCount}`;
        this.engines = [];
        
        for (let i = 0; i < this.wheelCount; i++) {
            const wheelContainer = document.createElement('div');
            wheelContainer.className = 'wheel-wrapper';
            
            const pointer = document.createElement('div');
            pointer.className = 'wheel-pointer';
            
            const canvas = document.createElement('canvas');
            canvas.className = 'wheel-canvas';
            
            wheelContainer.appendChild(pointer);
            wheelContainer.appendChild(canvas);
            this.wrapper.appendChild(wheelContainer);
            
            const engine = new WheelEngine(canvas, i);
            if (entriesManager) {
                engine.setEntries(entriesManager.getWeightedEntries());
            }
            this.engines.push(engine);
        }
    }
    
    setEntries(entries) {
        this.engines.forEach(engine => engine.setEntries(entries));
    }
    
    setSpinDuration(duration) {
        this.engines.forEach(engine => engine.setSpinDuration(duration));
    }
    
    spin() {
        if (this.isSpinning || this.engines.length === 0 || this.engines[0].entries.length === 0) return;
        
        this.isSpinning = true;
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn) {
            spinBtn.classList.add('spinning');
            spinBtn.disabled = true;
        }
        
        let finishedCount = 0;
        const results = [];
        
        this.engines.forEach((engine, index) => {
            engine.onFinish = (winner) => {
                finishedCount++;
                results[index] = winner;
                
                if (finishedCount === this.engines.length) {
                    this.onAllFinished(results);
                }
            };
            
            // Stagger start times slightly
            setTimeout(() => {
                engine.spin();
            }, index * 100);
        });
    }
    
    onAllFinished(winners) {
        this.isSpinning = false;
        
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn) {
            spinBtn.classList.remove('spinning');
            spinBtn.disabled = false;
        }
        
        // Add to history
        winners.forEach(winner => {
            historyManager.addWinner(winner, 'wheel');
        });
        
        if (confettiInstance) confettiInstance.celebrate();
        else {
            const confetti = initConfetti();
            if (confetti) confetti.celebrate();
        }
        soundEffects.playVictory();
        
        setTimeout(() => {
            this.showWinners(winners);
        }, 300);
    }
    
    showWinners(winners) {
        const modal = document.getElementById('winnerModal');
        const winnerDisplay = document.getElementById('winnerDisplay');
        if (!winnerDisplay || !modal) return;
        
        let content = '<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 20px;">';
        
        winners.forEach((winner, i) => {
            content += `<div style="text-align: center; max-width: 150px;">`;
            if (this.engines.length > 1) {
                content += `<div style="font-size: 14px; opacity: 0.8; margin-bottom: 5px;">Wheel ${i + 1}</div>`;
            }
            if (winner.image) {
                content += `<img src="${winner.image}" class="winner-image" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover;" alt="${winner.text}">`;
            }
            content += `<div class="winner-name" style="font-size: 18px; margin-top: 10px;">${winner.text}</div>`;
            content += `</div>`;
        });
        
        content += '</div>';
        winnerDisplay.innerHTML = content;
        
        modal.classList.add('active');
        
        const closeBtn = document.getElementById('closeWinnerBtn');
        const removeAndSpinBtn = document.getElementById('removeAndSpinBtn');
        const playAgainBtn = document.getElementById('playAgainBtn');
        
        if (closeBtn) closeBtn.onclick = () => this.closeWinnerModal();
        
        if (removeAndSpinBtn) {
            removeAndSpinBtn.onclick = () => {
                winners.forEach(w => entriesManager.deleteEntry(w.id));
                this.closeWinnerModal();
                setTimeout(() => this.spin(), 300);
            };
        }
        
        if (playAgainBtn) {
            playAgainBtn.onclick = () => {
                this.closeWinnerModal();
                setTimeout(() => this.spin(), 300);
            };
        }
    }
    
    closeWinnerModal() {
        const modal = document.getElementById('winnerModal');
        if (modal) modal.classList.remove('active');
        if (confettiInstance) confettiInstance.clear();
    }
    
    draw() {
        this.engines.forEach(engine => engine.draw());
    }
    
    get isSpinning() {
        return this._isSpinning;
    }
    
    set isSpinning(value) {
        this._isSpinning = value;
    }
}

// Initialize wheel engine
let wheelEngine = null; // now refers to WheelController

function initWheel() {
    if (!wheelEngine) {
        wheelEngine = new WheelController();
    }
    return wheelEngine;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WheelEngine;
}
