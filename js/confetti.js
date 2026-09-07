/**
 * Confetti Animation
 * Lightweight canvas-based confetti effect for winner celebrations
 */

class Confetti {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;
        this.isActive = false;
        this.colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
            '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe',
            '#6c5ce7', '#00b894', '#e17055', '#fdcb6e'
        ];
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        if (!this.canvas) return;
        
        const parent = this.canvas.parentElement;
        if (parent) {
            this.canvas.width = parent.offsetWidth;
            this.canvas.height = parent.offsetHeight;
        }
    }

    createParticle(x, y) {
        const colors = this.colors;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        return {
            x: x || Math.random() * this.canvas.width,
            y: y || -10,
            size: Math.random() * 10 + 5,
            color: color,
            speedX: Math.random() * 6 - 3,
            speedY: Math.random() * 3 + 2,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 10 - 5,
            opacity: 1,
            decay: Math.random() * 0.01 + 0.005
        };
    }

    explode(x, y, count = 100) {
        for (let i = 0; i < count; i++) {
            const particle = this.createParticle(x, y);
            particle.speedX = Math.random() * 10 - 5;
            particle.speedY = Math.random() * 10 - 5;
            this.particles.push(particle);
        }
        
        if (!this.isActive) {
            this.start();
        }
    }

    burst(count = 50) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = Math.random() * 5 + 3;
            const particle = this.createParticle(centerX, centerY);
            
            particle.speedX = Math.cos(angle) * speed;
            particle.speedY = Math.sin(angle) * speed - 5;
            this.particles.push(particle);
        }
        
        if (!this.isActive) {
            this.start();
        }
    }

    rain(duration = 3000) {
        const interval = setInterval(() => {
            const x = Math.random() * this.canvas.width;
            this.particles.push(this.createParticle(x));
        }, 50);

        if (!this.isActive) {
            this.start();
        }

        setTimeout(() => {
            clearInterval(interval);
        }, duration);
    }

    start() {
        this.isActive = true;
        this.animate();
    }

    stop() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    clear() {
        this.particles = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    animate() {
        if (!this.isActive) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and draw particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];

            // Update position
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.rotation += particle.rotationSpeed;
            particle.opacity -= particle.decay;

            // Add gravity
            particle.speedY += 0.1;

            // Add air resistance
            particle.speedX *= 0.99;

            // Remove dead particles
            if (particle.opacity <= 0 || 
                particle.y > this.canvas.height + 20 ||
                particle.x < -20 || 
                particle.x > this.canvas.width + 20) {
                this.particles.splice(i, 1);
                continue;
            }

            // Draw particle
            this.drawParticle(particle);
        }

        // Stop animation if no particles
        if (this.particles.length === 0) {
            this.stop();
            return;
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawParticle(particle) {
        this.ctx.save();
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.rotation * Math.PI / 180);
        this.ctx.globalAlpha = particle.opacity;
        this.ctx.fillStyle = particle.color;

        // Draw confetti shape (rectangle with rounded corners)
        const size = particle.size;
        this.ctx.beginPath();
        this.ctx.roundRect(-size / 2, -size / 2, size, size * 0.6, 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    // Celebration preset - immediate and fast
    celebrate() {
        this.clear();
        
        // Immediate burst
        this.burst(100);
        
        // Quick follow-up bursts
        setTimeout(() => this.burst(50), 200);
        setTimeout(() => this.burst(30), 400);
    }

    // Simple celebration (faster, fewer particles)
    simpleCelebrate() {
        this.clear();
        this.burst(50);
        setTimeout(() => this.burst(30), 200);
    }

    // Continuous celebration (for longer displays)
    continuousCelebrate(duration = 5000) {
        this.clear();
        
        const burstInterval = setInterval(() => {
            this.burst(20);
        }, 500);

        const rainInterval = setInterval(() => {
            for (let i = 0; i < 5; i++) {
                const x = Math.random() * this.canvas.width;
                this.particles.push(this.createParticle(x));
            }
        }, 100);

        setTimeout(() => {
            clearInterval(burstInterval);
            clearInterval(rainInterval);
        }, duration);
    }
}

// Initialize confetti
let confettiInstance = null;

function initConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (canvas && !confettiInstance) {
        confettiInstance = new Confetti('confettiCanvas');
    }
    return confettiInstance;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Confetti;
}
