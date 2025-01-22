class GameParticle {
  constructor(x, y, size, speed, color) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.baseSize = size;
    this.speed = speed;
    this.color = color;
    this.alpha = Math.random();
    this.direction = Math.random() * Math.PI * 2;
    this.velocity = {
      x: Math.cos(this.direction) * speed,
      y: Math.sin(this.direction) * speed
    };
    this.lastMouse = { x: x, y: y };
    this.distanceFromMouse = 1000;
  }

  update(mouse) {
    // Update position based on velocity
    this.x += this.velocity.x;
    this.y += this.velocity.y;

    // Mouse interaction
    if (mouse.x && mouse.y) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      this.distanceFromMouse = Math.sqrt(dx * dx + dy * dy);
      
      if (this.distanceFromMouse < 150) {
        const angle = Math.atan2(dy, dx);
        const force = (150 - this.distanceFromMouse) / 150;
        this.velocity.x -= Math.cos(angle) * force * 0.5;
        this.velocity.y -= Math.sin(angle) * force * 0.5;
        this.size = this.baseSize * (1 + force);
      } else {
        this.size = this.baseSize;
      }
    }

    // Add some random movement
    this.velocity.x += (Math.random() - 0.5) * 0.1;
    this.velocity.y += (Math.random() - 0.5) * 0.1;

    // Dampen velocity
    this.velocity.x *= 0.99;
    this.velocity.y *= 0.99;

    // Reset position if out of bounds
    if (this.x < 0) this.x = window.innerWidth;
    if (this.x > window.innerWidth) this.x = 0;
    if (this.y < 0) this.y = window.innerHeight;
    if (this.y > window.innerHeight) this.y = 0;

    // Update alpha
    this.alpha = Math.min(1, Math.max(0.1, this.alpha + (Math.random() - 0.5) * 0.01));
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
    ctx.fill();

    // Add glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = `rgba(${this.color}, ${this.alpha * 0.5})`;
  }

  updateColors(theme) {
    this.possibleColors = [
      theme['primary-rgb'],
      theme['secondary-rgb'] || theme['primary-rgb'],
      theme['accent-rgb']
    ];
    this.color = this.possibleColors[Math.floor(Math.random() * this.possibleColors.length)];
  }
}

class ParticleSystem {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null };
    
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '-1';
    
    document.querySelector('.game-particles').appendChild(this.canvas);
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    
    this.particleTypes = {
      normal: {
        size: { min: 1, max: 3 },
        speed: { min: 0.1, max: 0.3 },
        colors: [
          '225, 190, 231', // Light purple
          '142, 36, 170',  // Deep purple
          '171, 71, 188'   // Medium purple
        ]
      },
      burst: {
        size: { min: 2, max: 5 },
        speed: { min: 1, max: 2 },
        colors: [
          '255, 255, 255', // White
          '225, 190, 231', // Light purple
          '142, 36, 170'   // Deep purple
        ]
      }
    };
    
    this.init();
    this.addEventListeners();
    this.animate();
  }
  
  init() {
    const particleCount = Math.min(100, window.innerWidth / 20);
    const type = this.particleTypes.normal;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = new GameParticle(
        Math.random() * this.canvas.width,
        Math.random() * this.canvas.height,
        Math.random() * (type.size.max - type.size.min) + type.size.min,
        Math.random() * (type.speed.max - type.speed.min) + type.speed.min,
        type.colors[Math.floor(Math.random() * type.colors.length)]
      );
      this.particles.push(particle);
    }
    
    // Add particle burst on click
    this.canvas.addEventListener('click', (e) => {
      this.createParticleBurst(e.clientX, e.clientY);
    });

    // Expose the system globally for theme updates
    window.particleSystem = this;
  }
  
  createParticleBurst(x, y) {
    const burstCount = 20;
    const type = this.particleTypes.burst;
    
    for (let i = 0; i < burstCount; i++) {
      const particle = new GameParticle(
        x,
        y,
        Math.random() * (type.size.max - type.size.min) + type.size.min,
        Math.random() * (type.speed.max - type.speed.min) + type.speed.min,
        type.colors[Math.floor(Math.random() * type.colors.length)]
      );
      
      this.particles.push(particle);
    }
  }
  
  addEventListeners() {
    // No existing event listeners to add
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Enhanced motion blur
    this.ctx.fillStyle = 'rgba(26, 0, 44, 0.1)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.particles.forEach(particle => {
      particle.update(this.mouse);
      particle.draw(this.ctx);
    });
    
    // Add glow effect to particles
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = 'rgba(142, 36, 170, 0.5)';
    
    requestAnimationFrame(() => this.animate());
  }

  updateParticleColors(theme) {
    this.particleTypes = {
      normal: {
        size: { min: 1, max: 3 },
        speed: { min: 0.1, max: 0.3 },
        colors: [
          theme['primary-rgb'],
          theme['secondary-rgb'] || theme['primary-rgb'],
          theme['accent-rgb']
        ]
      },
      burst: {
        size: { min: 2, max: 5 },
        speed: { min: 1, max: 2 },
        colors: [
          '255, 255, 255', // White
          theme['primary-rgb'],
          theme['accent-rgb']
        ]
      }
    };

    // Update existing particles' colors
    this.particles.forEach(particle => {
      particle.updateColors(theme);
    });
  }
}

// Initialize particle system
window.addEventListener('DOMContentLoaded', () => {
  new ParticleSystem();
});