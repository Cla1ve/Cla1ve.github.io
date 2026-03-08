class AmbientParticleSystem {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.particles = [];
    this.pointer = {
      x: 0,
      y: 0,
      active: false
    };
    this.lastFrameTime = 0;
    this.dpr = 1;
    this.width = 0;
    this.height = 0;
    this.isVisible = true;
    this.isMobile = window.innerWidth < 768;
    this.reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.reducedMotion = this.reduceMotionQuery.matches;
    this.palette = this.readPalette();

    this.canvas.className = "cyber-particles";
    document.body.prepend(this.canvas);

    this.resize();
    this.createParticles();
    this.bindEvents();
    this.setupVisibilityObserver();
    this.animate();
  }

  readPalette() {
    const styles = getComputedStyle(document.body);
    const accent = styles.getPropertyValue("--accent").trim() || "#8d6bff";
    const accentSoft = styles.getPropertyValue("--accent-2").trim() || "#d6c2ff";
    return [accent, accentSoft, "rgba(255,255,255,0.7)"];
  }

  getParticleCount() {
    if (this.reducedMotion) {
      return this.isMobile ? 6 : 12;
    }
    return this.isMobile ? 10 : 28;
  }

  getConnectionDistance() {
    return this.isMobile ? 80 : 138;
  }

  setupVisibilityObserver() {
    const sentinel = document.createElement("div");
    sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:100vh;pointer-events:none;";
    document.body.appendChild(sentinel);

    const observer = new IntersectionObserver(
      (entries) => {
        this.isVisible = entries[0].isIntersecting;
      },
      { threshold: 0 }
    );
    observer.observe(sentinel);
  }

  resize() {
    this.isMobile = window.innerWidth < 768;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.isMobile ? 1.5 : 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  createParticle() {
    const paletteColor = this.palette[Math.floor(Math.random() * this.palette.length)];
    const speed = this.reducedMotion ? 0.08 : 0.18;
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      radius: Math.random() * 1.8 + 0.8,
      glow: Math.random() * 10 + 10,
      opacity: Math.random() * 0.45 + 0.22,
      color: paletteColor
    };
  }

  createParticles() {
    this.palette = this.readPalette();
    this.particles = Array.from({ length: this.getParticleCount() }, () => this.createParticle());
  }

  updatePalette() {
    this.palette = this.readPalette();
    this.particles.forEach((particle) => {
      particle.color = this.palette[Math.floor(Math.random() * this.palette.length)];
    });
  }

  bindEvents() {
    let resizeTimeout;

    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        this.resize();
        this.createParticles();
      }, 150);
    });

    window.addEventListener("pointermove", (event) => {
      this.pointer.x = event.clientX;
      this.pointer.y = event.clientY;
      this.pointer.active = true;
    }, { passive: true });

    window.addEventListener("pointerleave", () => {
      this.pointer.active = false;
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.lastFrameTime = 0;
      }
    });

    document.addEventListener("cla1ve:theme-change", () => {
      this.updatePalette();
    });

    this.reduceMotionQuery.addEventListener("change", (event) => {
      this.reducedMotion = event.matches;
      this.createParticles();
    });
  }

  updateParticle(particle) {
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x <= 0 || particle.x >= this.width) {
      particle.vx *= -1;
    }

    if (particle.y <= 0 || particle.y >= this.height) {
      particle.vy *= -1;
    }

    if (this.pointer.active && !this.reducedMotion) {
      const dx = particle.x - this.pointer.x;
      const dy = particle.y - this.pointer.y;
      const distance = Math.hypot(dx, dy);

      if (distance > 0 && distance < 140) {
        const force = (140 - distance) / 1400;
        particle.vx += (dx / distance) * force;
        particle.vy += (dy / distance) * force;
      }
    }

    particle.vx *= 0.996;
    particle.vy *= 0.996;
  }

  drawParticle(particle, time) {
    const pulse = 0.8 + Math.sin(time * 0.0015 + particle.x * 0.01) * 0.2;
    const radius = particle.radius * pulse;
    const glowRadius = particle.glow * pulse;
    const gradient = this.ctx.createRadialGradient(
      particle.x,
      particle.y,
      0,
      particle.x,
      particle.y,
      glowRadius
    );

    gradient.addColorStop(0, this.colorWithAlpha(particle.color, particle.opacity));
    gradient.addColorStop(1, this.colorWithAlpha(particle.color, 0));

    this.ctx.beginPath();
    this.ctx.fillStyle = gradient;
    this.ctx.arc(particle.x, particle.y, glowRadius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.fillStyle = this.colorWithAlpha(particle.color, Math.min(1, particle.opacity + 0.25));
    this.ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawConnections() {
    const maxDistance = this.getConnectionDistance();
    const len = this.particles.length;

    this.ctx.lineWidth = 1;
    for (let index = 0; index < len; index += 1) {
      const first = this.particles[index];

      for (let next = index + 1; next < len; next += 1) {
        const second = this.particles[next];
        const dx = first.x - second.x;
        const dy = first.y - second.y;

        if (Math.abs(dx) > maxDistance || Math.abs(dy) > maxDistance) {
          continue;
        }

        const distance = Math.hypot(dx, dy);

        if (distance > maxDistance) {
          continue;
        }

        const alpha = (1 - distance / maxDistance) * 0.18;
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.colorWithAlpha(first.color, alpha);
        this.ctx.moveTo(first.x, first.y);
        this.ctx.lineTo(second.x, second.y);
        this.ctx.stroke();
      }
    }
  }

  colorWithAlpha(color, alpha) {
    if (color.startsWith("rgba")) {
      return color.replace(/rgba\(([^)]+),[^,]+\)$/, `rgba($1, ${alpha})`);
    }

    if (color.startsWith("rgb")) {
      return color.replace("rgb", "rgba").replace(")", `, ${alpha})`);
    }

    const hex = color.replace("#", "");
    const expanded = hex.length === 3
      ? hex.split("").map((char) => char + char).join("")
      : hex;
    const value = Number.parseInt(expanded, 16);
    const red = (value >> 16) & 255;
    const green = (value >> 8) & 255;
    const blue = value & 255;
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  animate(timestamp = 0) {
    requestAnimationFrame((time) => this.animate(time));

    if (!this.isVisible || document.hidden) {
      return;
    }

    const targetFps = this.reducedMotion ? 18 : (this.isMobile ? 30 : 40);
    const frameInterval = 1000 / targetFps;
    if (timestamp - this.lastFrameTime < frameInterval) {
      return;
    }

    this.lastFrameTime = timestamp;
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.particles.forEach((particle) => {
      this.updateParticle(particle);
    });

    this.drawConnections();
    this.particles.forEach((particle) => this.drawParticle(particle, timestamp));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.particleSystem = new AmbientParticleSystem();
});
