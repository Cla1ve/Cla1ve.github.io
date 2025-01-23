class CyberParticleSystem {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.particles = [];
        this.connections = [];
        this.viewportBounds = {};
        this.lastFrameTime = 0;
        this.frameInterval = 1000 / 60;
        
        // Настройка canvas
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.pointerEvents = 'none';
        document.body.prepend(this.canvas);
        
        this.resizeCanvas();
        this.bindEvents();
        this.init();
    }

    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.ctx.scale(dpr, dpr);

        // Расширенные границы для проверки видимости
        this.viewportBounds = {
            left: -50,
            right: this.canvas.width + 50,
            top: -50,
            bottom: this.canvas.height + 50
        };
    }

    bindEvents() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.resizeCanvas();
                this.particles = [];
                this.init();
            }, 250);
        });
    }

    init() {
        const particleCount = window.innerWidth < 768 ? 30 : 60;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(this.createParticle());
        }
        this.animate();
    }

    createParticle() {
        const currentTheme = getComputedStyle(document.documentElement);
        const primary = currentTheme.getPropertyValue('--primary').trim();
        const secondary = currentTheme.getPropertyValue('--secondary').trim();
        const accent = currentTheme.getPropertyValue('--accent').trim();
        
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: Math.random() * 2 + 1,
            color: [primary, secondary, accent][Math.floor(Math.random() * 3)],
            baseColor: [primary, secondary, accent][Math.floor(Math.random() * 3)],
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            pulseSpeed: Math.random() * 0.02 + 0.01,
            glowSize: Math.random() * 15 + 10,
            connectDistance: Math.random() * 150 + 100,
            opacity: Math.random() * 0.5 + 0.5,
            isVisible: true
        };
    }

    updateParticleColors(theme) {
        const colors = [theme.primary, theme.secondary, theme.accent];
        this.particles.forEach(particle => {
            particle.color = colors[Math.floor(Math.random() * colors.length)];
            particle.baseColor = particle.color;
        });
    }

    isParticleVisible(particle) {
        return particle.x >= this.viewportBounds.left &&
               particle.x <= this.viewportBounds.right &&
               particle.y >= this.viewportBounds.top &&
               particle.y <= this.viewportBounds.bottom;
    }

    drawGlow(x, y, color, size) {
        if (!this.glowGradient) {
            this.glowGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size);
            this.glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            this.glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.fillStyle = this.glowGradient;
        this.ctx.fillRect(-size, -size, size * 2, size * 2);
        this.ctx.restore();
    }

    drawConnection(p1, p2, distance) {
        const opacity = 1 - (distance / p1.connectDistance);
        this.ctx.strokeStyle = `${p1.color.replace('rgb', 'rgba').replace(')', `, ${opacity * 0.2})`)}`;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
    }

    drawParticle(particle) {
        if (!particle.isVisible) return;

        const pulse = Math.sin(Date.now() * particle.pulseSpeed) * 0.5 + 0.5;
        const size = particle.size * (1 + pulse * 0.3);
        
        this.drawGlow(particle.x, particle.y, particle.color, particle.glowSize);

        this.ctx.beginPath();
        this.ctx.fillStyle = particle.color;
        this.ctx.shadowColor = particle.color;
        this.ctx.shadowBlur = 15;
        this.ctx.globalAlpha = particle.opacity * (0.7 + pulse * 0.3);
        
        // Оптимизированное рисование шестиугольника
        const angleStep = Math.PI / 3;
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = i * angleStep;
            const x = particle.x + size * Math.cos(angle);
            const y = particle.y + size * Math.sin(angle);
            i === 0 ? this.ctx.moveTo(x, y) : this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }

    update() {
        this.particles.forEach(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;

            // Отражение от краев
            if (particle.x < 0 || particle.x > this.canvas.width) particle.speedX *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.speedY *= -1;

            // Обновление видимости
            particle.isVisible = this.isParticleVisible(particle);
        });
    }

    findConnections() {
        this.connections = [];
        const visibleParticles = this.particles.filter(p => p.isVisible);
        
        for (let i = 0; i < visibleParticles.length; i++) {
            const p1 = visibleParticles[i];
            for (let j = i + 1; j < visibleParticles.length; j++) {
                const p2 = visibleParticles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < p1.connectDistance) {
                    this.connections.push({ p1, p2, distance });
                }
            }
        }
    }

    animate(currentTime) {
        requestAnimationFrame(time => this.animate(time));

        // Ограничение FPS
        if (currentTime - this.lastFrameTime < this.frameInterval) return;
        this.lastFrameTime = currentTime;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.update();
        this.findConnections();

        // Пакетный рендеринг
        this.ctx.save();
        this.connections.forEach(conn => this.drawConnection(conn.p1, conn.p2, conn.distance));
        this.ctx.restore();

        this.ctx.save();
        this.particles.forEach(particle => {
            if (particle.isVisible) {
                this.drawParticle(particle);
            }
        });
        this.ctx.restore();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.particleSystem = new CyberParticleSystem();
});