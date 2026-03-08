document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const themeButtons = Array.from(document.querySelectorAll(".theme-btn"));
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const soundToggle = document.querySelector(".sound-toggle");
  const toTopButton = document.querySelector(".to-top");
  const bgMusic = document.getElementById("bgMusic");
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const ageNodes = Array.from(document.querySelectorAll(".js-age"));
  const orbSyncRoot = document.querySelector("[data-orb-sync]");

  const themes = {
    violet: "#6f4cff",
    cyan: "#25b8ff",
    emerald: "#2fc67d",
    crimson: "#ff637b",
    amber: "#f5b13a"
  };

  class OrbSync {
    constructor(root, reduceMotionQuery) {
      this.root = root;
      this.canvas = root.querySelector(".sync-canvas");
      this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
      this.startButton = root.querySelector(".sync-start");
      this.retryButton = root.querySelector(".sync-retry");
      this.scoreNode = root.querySelector("[data-sync-score]");
      this.reduceMotionQuery = reduceMotionQuery;
      this.reducedMotion = reduceMotionQuery.matches;
      this.isMobile = window.innerWidth < 768;
      this.isVisible = false;
      this.pointer = { x: 0, y: 0, active: false };
      this.orbs = [];
      this.trail = [];
      this.ripples = [];
      this.burstParticles = [];
      this.score = 0;
      this.combo = 0;
      this.lastHitTime = 0;
      this.comboDecay = 750;
      this.coreLives = 3;
      this.coreDamageTime = 0;
      this.spawnNext = 0;
      this.shakeOffset = { x: 0, y: 0 };
      this.shakeDecay = 0;
      this.flashAlpha = 0;
      this.completed = false;
      this.gameOver = false;
      this.celebrationPhase = 0;
      this.active = false;
      this.lastFrameTime = 0;
      this.dpr = 1;
      this.width = 0;
      this.height = 0;
      this.palette = this.readPalette();

      if (!this.ctx || !this.canvas) return;

      this.resize();
      this.spawnIdleOrbs();
      this.setScore(0);
      this.bindEvents();
      this.setupVisibilityObserver();
      this.render();
    }

    readPalette() {
      const styles = getComputedStyle(document.body);
      return {
        accent: styles.getPropertyValue("--accent").trim() || "#8d6bff",
        accentSoft: styles.getPropertyValue("--accent-2").trim() || "#dac7ff",
        text: styles.getPropertyValue("--text").trim() || "#f6f3ff"
      };
    }

    colorWithAlpha(color, alpha) {
      if (color.startsWith("rgba")) return color.replace(/rgba\(([^)]+),[^,]+\)$/, `rgba($1, ${alpha})`);
      if (color.startsWith("rgb")) return color.replace("rgb", "rgba").replace(")", `, ${alpha})`);
      const hex = color.replace("#", "");
      const expanded = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
      const v = Number.parseInt(expanded, 16);
      return `rgba(${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}, ${alpha})`;
    }

    setupVisibilityObserver() {
      const observer = new IntersectionObserver((entries) => { this.isVisible = entries[0].isIntersecting; }, { threshold: 0.05 });
      observer.observe(this.root);
    }

    getTargetScore() {
      return 24;
    }

    getCoreRadius() {
      return Math.min(this.width, this.height) * 0.08;
    }

    resize() {
      const bounds = this.root.getBoundingClientRect();
      this.isMobile = window.innerWidth < 768;
      this.width = Math.max(1, Math.round(bounds.width));
      this.height = Math.max(1, Math.round(bounds.height));
      this.dpr = Math.min(window.devicePixelRatio || 1, this.isMobile ? 1.5 : 2);
      this.canvas.width = this.width * this.dpr;
      this.canvas.height = this.height * this.dpr;
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    spawnOrb() {
      const cx = this.width / 2;
      const cy = this.height / 2;
      const margin = Math.max(this.width, this.height);
      const angle = Math.random() * Math.PI * 2;
      const x = cx + Math.cos(angle) * margin * 0.55;
      const y = cy + Math.sin(angle) * margin * 0.55;
      const dx = cx - x;
      const dy = cy - y;
      const len = Math.hypot(dx, dy) || 1;
      const baseSpeed = (this.isMobile ? 1.5 : 1.95) + this.score * 0.03 + Math.random() * 0.4;
      const speed = this.reducedMotion ? baseSpeed * 0.6 : baseSpeed;
      const radius = 16 + Math.random() * 6;

      this.orbs.push({
        x, y,
        vx: (dx / len) * speed,
        vy: (dy / len) * speed,
        radius,
        energy: 0,
        offset: Math.random() * Math.PI * 2
      });
    }

    spawnIdleOrbs() {
      this.orbs = [];
      const count = this.isMobile ? 2 : 3;
      const cx = this.width / 2;
      const cy = this.height / 2;
      const r = Math.min(this.width, this.height) * 0.35;
      for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 * i) / count + performance.now() * 0.0002;
        this.orbs.push({
          x: cx + Math.cos(a) * r,
          y: cy + Math.sin(a) * r,
          vx: 0, vy: 0,
          radius: 14,
          energy: 0,
          offset: i * 0.5,
          idle: true
        });
      }
    }

    spawnBurst(x, y, count, bonus) {
      for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 * i) / count + Math.random() * 0.3;
        const s = 1.5 + Math.random() * 3;
        this.burstParticles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, radius: bonus ? 2.5 : 1.5, isBonus: bonus });
      }
    }

    triggerShake(i) { this.shakeDecay = i; }
    triggerFlash(a) { this.flashAlpha = Math.max(this.flashAlpha, a); }

    setScore(v) {
      this.score = v;
      if (this.scoreNode) this.scoreNode.textContent = String(v);
      if (!this.completed && !this.gameOver && v >= this.getTargetScore()) {
        this.completed = true;
        this.celebrationPhase = 1;
        this.root.classList.add("is-complete");
        this.triggerFlash(0.15);
        this.triggerShake(5);
        this.spawnBurst(this.width / 2, this.height / 2, 28, true);
        for (let i = 0; i < 5; i++) {
          this.ripples.push({ x: this.width / 2, y: this.height / 2, radius: 12 + i * 20, alpha: 0.4, speed: 4 });
        }
      }
    }

    begin() {
      this.active = true;
      this.completed = false;
      this.gameOver = false;
      this.celebrationPhase = 0;
      this.coreLives = 3;
      this.coreDamageTime = 0;
      this.combo = 0;
      this.lastHitTime = 0;
      this.spawnNext = performance.now() + (this.isMobile ? 250 : 420);
      this.pointer.active = false;
      this.orbs = [];
      this.trail = [];
      this.ripples = [];
      this.burstParticles = [];
      this.shakeDecay = 0;
      this.flashAlpha = 0;
      this.root.classList.add("is-active");
      this.root.classList.remove("is-complete", "is-gameover");
      this.setScore(0);
    }

    updatePointer(e) {
      const b = this.canvas.getBoundingClientRect();
      this.pointer.x = e.clientX - b.left;
      this.pointer.y = e.clientY - b.top;
    }

    addTrailPoint() {
      this.trail.push({ x: this.pointer.x, y: this.pointer.y, life: 1 });
      if (this.trail.length > 18) this.trail.shift();
    }

    interact(now) {
      this.orbs = this.orbs.filter((orb) => {
        const dx = this.pointer.x - orb.x;
        const dy = this.pointer.y - orb.y;
        if (Math.hypot(dx, dy) > orb.radius + 18) return true;

        if (this.comboDecay > 0 && now - this.lastHitTime < this.comboDecay) {
          this.combo = Math.min(this.combo + 1, 6);
        } else {
          this.combo = 1;
        }
        this.lastHitTime = now;

        const pts = Math.min(this.combo, 4);
        this.spawnBurst(orb.x, orb.y, this.combo >= 3 ? 12 : 8, this.combo >= 3);
        this.ripples.push({ x: orb.x, y: orb.y, radius: orb.radius, alpha: 0.5, speed: 3 });
        this.triggerShake(1.5 + this.combo * 0.5);
        this.setScore(this.score + pts);
        return false;
      });
    }

    bindEvents() {
      let to = 0;
      if (this.startButton) this.startButton.addEventListener("click", () => this.begin());
      if (this.retryButton) this.retryButton.addEventListener("click", () => this.begin());

      this.canvas.addEventListener("pointerdown", (e) => {
        this.pointer.active = true;
        this.updatePointer(e);
        this.addTrailPoint();
        if (this.canvas.setPointerCapture) this.canvas.setPointerCapture(e.pointerId);
        if (this.active && !this.gameOver) this.interact(performance.now());
      });

      this.canvas.addEventListener("pointermove", (e) => {
        this.updatePointer(e);
        if (!this.active || this.gameOver) return;
        this.pointer.active = true;
        this.addTrailPoint();
        this.interact(performance.now());
      });

      ["pointerup", "pointercancel", "pointerleave"].forEach((n) => {
        this.canvas.addEventListener(n, () => { this.pointer.active = false; });
      });

      window.addEventListener("resize", () => {
        clearTimeout(to);
        to = setTimeout(() => { this.resize(); if (!this.active) this.spawnIdleOrbs(); }, 150);
      });

      document.addEventListener("visibilitychange", () => { if (!document.hidden) this.lastFrameTime = 0; });
      document.addEventListener("cla1ve:theme-change", () => { this.palette = this.readPalette(); });
      this.reduceMotionQuery.addEventListener("change", (e) => { this.reducedMotion = e.matches; });
    }

    drawCore(timestamp) {
      const cx = this.width / 2;
      const cy = this.height / 2;
      const r = this.getCoreRadius();
      const pulse = 0.85 + 0.15 * Math.sin(timestamp * 0.002);
      const damage = this.coreDamageTime > 0 ? Math.min(1, (performance.now() - this.coreDamageTime) / 400) : 0;
      const hurt = damage < 1 ? 0.3 * (1 - damage) : 0;

      const grad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2);
      grad.addColorStop(0, this.colorWithAlpha(this.palette.accentSoft, 0.4 * pulse));
      grad.addColorStop(0.5, this.colorWithAlpha(this.palette.accent, 0.15 * pulse));
      grad.addColorStop(1, this.colorWithAlpha(this.palette.accent, 0));
      this.ctx.beginPath();
      this.ctx.fillStyle = grad;
      this.ctx.arc(cx, cy, r * 2, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.strokeStyle = this.colorWithAlpha(this.palette.accentSoft, 0.5 * pulse + hurt);
      this.ctx.lineWidth = 2;
      this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.strokeStyle = this.colorWithAlpha(this.palette.accent, 0.2 * pulse);
      this.ctx.lineWidth = 1;
      this.ctx.arc(cx, cy, r * 1.4, 0, Math.PI * 2);
      this.ctx.stroke();

      if (this.active && !this.gameOver && this.coreLives > 0) {
        const seg = (2 * Math.PI) / 3;
        for (let i = 0; i < 3; i++) {
          const start = i * seg - Math.PI / 2;
          const end = start + seg * (i < this.coreLives ? 1 : 0.3);
          this.ctx.beginPath();
          this.ctx.strokeStyle = this.colorWithAlpha(this.palette.text, i < this.coreLives ? 0.25 : 0.08);
          this.ctx.lineWidth = 3;
          this.ctx.arc(cx, cy, r * 1.15, start, end);
          this.ctx.stroke();
        }
      }
    }

    drawTrail() {
      if (this.trail.length < 2) return;
      this.ctx.beginPath();
      this.ctx.lineWidth = 2 + Math.min(this.combo, 4) * 0.3;
      this.ctx.lineCap = "round";
      this.ctx.lineJoin = "round";
      this.trail.forEach((p, i) => { i ? this.ctx.lineTo(p.x, p.y) : this.ctx.moveTo(p.x, p.y); });
      const g = this.ctx.createLinearGradient(0, 0, this.width, this.height);
      g.addColorStop(0, this.colorWithAlpha(this.palette.accentSoft, 0.2));
      g.addColorStop(1, this.colorWithAlpha(this.palette.accent, 0.5));
      this.ctx.strokeStyle = g;
      this.ctx.stroke();
      this.trail = this.trail.map((p) => ({ ...p, life: p.life - 0.07 })).filter((p) => p.life > 0);
    }

    drawRipples() {
      this.ripples = this.ripples.map((r) => ({ ...r, radius: r.radius + r.speed, alpha: r.alpha - 0.02 })).filter((r) => r.alpha > 0);
      this.ripples.forEach((r) => {
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.colorWithAlpha(this.palette.accentSoft, r.alpha);
        this.ctx.lineWidth = 1.5;
        this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        this.ctx.stroke();
      });
    }

    drawBurstParticles() {
      this.burstParticles = this.burstParticles.map((p) => ({
        ...p, x: p.x + p.vx, y: p.y + p.vy, vx: p.vx * 0.94, vy: p.vy * 0.94 + 0.03, life: p.life - 0.03
      })).filter((p) => p.life > 0);
      this.burstParticles.forEach((p) => {
        this.ctx.beginPath();
        this.ctx.fillStyle = this.colorWithAlpha(p.isBonus ? this.palette.text : this.palette.accentSoft, p.life * 0.9);
        this.ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
        this.ctx.fill();
      });
    }

    drawOrb(orb, timestamp) {
      const pulse = orb.idle ? 0.6 + 0.4 * Math.sin(timestamp * 0.001 + orb.offset) : 1;
      const r = orb.radius * pulse;
      const glowR = r * 2.2;
      const grad = this.ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, glowR);
      grad.addColorStop(0, this.colorWithAlpha(this.palette.accentSoft, orb.idle ? 0.2 : 0.35));
      grad.addColorStop(1, this.colorWithAlpha(this.palette.accent, 0));
      this.ctx.beginPath();
      this.ctx.fillStyle = grad;
      this.ctx.arc(orb.x, orb.y, glowR, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.fillStyle = this.colorWithAlpha(this.palette.accentSoft, orb.idle ? 0.4 : 0.7);
      this.ctx.arc(orb.x, orb.y, r * 0.8, 0, Math.PI * 2);
      this.ctx.fill();
    }

    updateOrbs(timestamp) {
      const cx = this.width / 2;
      const cy = this.height / 2;
      const coreR = this.getCoreRadius();
      const now = performance.now();

      if (this.completed && this.celebrationPhase > 0 && this.celebrationPhase < 1.5) {
        this.celebrationPhase += 0.01;
        return;
      }

      if (!this.active) {
        this.orbs.forEach((orb, i) => {
          const r = Math.min(this.width, this.height) * 0.3;
          const a = (Math.PI * 2 * i) / this.orbs.length + timestamp * 0.00025;
          orb.x = cx + Math.cos(a) * r;
          orb.y = cy + Math.sin(a) * r;
        });
        return;
      }

      if (this.gameOver) return;

      if (now >= this.spawnNext) {
        this.spawnOrb();
        const minInterval = this.isMobile ? 320 : 380;
        const baseInterval = this.isMobile ? 750 : 1050;
        const decay = this.isMobile ? 20 : 16;
        this.spawnNext = now + Math.max(minInterval, baseInterval - this.score * decay);
      }

      this.orbs = this.orbs.filter((orb) => {
        if (orb.idle) return true;
        orb.x += orb.vx;
        orb.y += orb.vy;
        const dist = Math.hypot(orb.x - cx, orb.y - cy);
        if (dist < coreR + orb.radius) {
          this.coreLives--;
          this.coreDamageTime = now;
          this.triggerShake(5);
          this.triggerFlash(0.2);
          this.combo = 0;
          this.spawnBurst(cx, cy, 16, false);
          if (this.coreLives <= 0) {
            this.gameOver = true;
            this.active = false;
            this.root.classList.remove("is-active");
            this.root.classList.add("is-gameover");
          }
          return false;
        }
        return dist < Math.max(this.width, this.height) * 0.8;
      });
    }

    updateShake() {
      if (this.shakeDecay > 0.1) {
        this.shakeOffset.x = (Math.random() - 0.5) * this.shakeDecay;
        this.shakeOffset.y = (Math.random() - 0.5) * this.shakeDecay;
        this.shakeDecay *= 0.88;
      } else {
        this.shakeOffset.x = 0;
        this.shakeOffset.y = 0;
      }
    }

    updateFlash() {
      if (this.flashAlpha > 0.002) this.flashAlpha *= 0.9;
      else this.flashAlpha = 0;
    }

    render(timestamp = 0) {
      window.requestAnimationFrame((t) => this.render(t));
      if (!this.isVisible || document.hidden) return;

      const fps = this.reducedMotion ? 22 : (this.isMobile ? 28 : 42);
      if (timestamp - this.lastFrameTime < 1000 / fps) return;
      this.lastFrameTime = timestamp;

      this.updateShake();
      this.updateFlash();
      this.updateOrbs(timestamp);

      this.ctx.save();
      this.ctx.translate(this.shakeOffset.x, this.shakeOffset.y);
      this.ctx.clearRect(-5, -5, this.width + 10, this.height + 10);

      this.drawCore(timestamp);
      this.drawTrail();
      this.drawRipples();
      this.drawBurstParticles();
      this.orbs.forEach((o) => this.drawOrb(o, timestamp));

      if (this.flashAlpha > 0.005) {
        this.ctx.fillStyle = this.colorWithAlpha(this.palette.text, this.flashAlpha);
        this.ctx.fillRect(0, 0, this.width, this.height);
      }
      this.ctx.restore();

      if (this.active && !this.gameOver && !this.completed) {
        const n = performance.now();
        if (n - this.lastHitTime > this.comboDecay && this.combo > 0) {
          this.combo = 0;
        }
      }
    }
  }

  function calculateAge() {
    const birthDate = new Date(2006, 9, 29);
    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const hasBirthdayPassed =
      now.getMonth() > birthDate.getMonth()
      || (now.getMonth() === birthDate.getMonth() && now.getDate() >= birthDate.getDate());

    if (!hasBirthdayPassed) {
      age -= 1;
    }

    return age;
  }

  function applyAge() {
    const age = calculateAge();
    ageNodes.forEach((node) => {
      node.textContent = String(age);
    });
  }

  function closeMenu() {
    if (!navToggle || !navMenu) {
      return;
    }

    navToggle.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navMenu.classList.remove("is-open");
    body.classList.remove("menu-open");
  }

  function openMenu() {
    if (!navToggle || !navMenu) {
      return;
    }

    navToggle.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    navMenu.classList.add("is-open");
    body.classList.add("menu-open");
  }

  function setActiveLink(id) {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function commitTheme(nextTheme) {
    body.dataset.theme = nextTheme;
    localStorage.setItem("cla1ve-theme", nextTheme);

    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", themes[nextTheme]);
    }

    themeButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.theme === nextTheme);
    });

    if (window.particleSystem && typeof window.particleSystem.updatePalette === "function") {
      window.particleSystem.updatePalette();
    }

    document.dispatchEvent(
      new CustomEvent("cla1ve:theme-change", {
        detail: { theme: nextTheme }
      })
    );
  }

  function applyTheme(themeName) {
    const nextTheme = themes[themeName] ? themeName : "violet";
    commitTheme(nextTheme);
  }

  function updateTopButton() {
    if (!toTopButton) {
      return;
    }

    const shouldShow = window.scrollY > 640;
    toTopButton.classList.toggle("is-visible", shouldShow);
  }

  function syncAudioState(isPlaying) {
    if (!soundToggle) {
      return;
    }

    soundToggle.classList.toggle("is-muted", !isPlaying);
    soundToggle.setAttribute("aria-pressed", String(isPlaying));
    const label = soundToggle.querySelector("span");
    if (label) {
      label.textContent = "Sound";
    }
  }

  async function playAudio() {
    if (!bgMusic) {
      return false;
    }

    try {
      await bgMusic.play();
      localStorage.setItem("cla1ve-audio", "on");
      syncAudioState(true);
      return true;
    } catch {
      syncAudioState(false);
      return false;
    }
  }

  function pauseAudio() {
    if (!bgMusic) {
      return;
    }

    bgMusic.pause();
    localStorage.setItem("cla1ve-audio", "off");
    syncAudioState(false);
  }

  function restoreAudioFromGesture() {
    if (localStorage.getItem("cla1ve-audio") !== "on") {
      return;
    }

    const resumePlayback = async () => {
      await playAudio();
      window.removeEventListener("pointerdown", resumePlayback);
      window.removeEventListener("keydown", resumePlayback);
    };

    window.addEventListener("pointerdown", resumePlayback, { once: true });
    window.addEventListener("keydown", resumePlayback, { once: true });
  }

  const savedTheme = localStorage.getItem("cla1ve-theme") || "violet";
  applyTheme(savedTheme);
  applyAge();

  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyTheme(button.dataset.theme);
    });
  });

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.contains("is-open");
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        closeMenu();
      });
    });

    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      const clickedInsideMenu = navMenu.contains(target);
      const clickedToggle = navToggle.contains(target);
      if (!clickedInsideMenu && !clickedToggle) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 768) {
        closeMenu();
      }
    });
  }

  if (sections.length > 0) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visibleEntry) {
          setActiveLink(visibleEntry.target.id);
        }
      },
      {
        rootMargin: "-30% 0px -45% 0px",
        threshold: [0.2, 0.45, 0.7]
      }
    );

    sections.forEach((section) => sectionObserver.observe(section));
    setActiveLink("home");
  }

  if (bgMusic) {
    bgMusic.volume = 0.28;
    syncAudioState(!bgMusic.paused);
    restoreAudioFromGesture();
  } else {
    syncAudioState(false);
  }

  if (soundToggle) {
    soundToggle.addEventListener("click", async () => {
      if (!bgMusic) {
        return;
      }

      if (bgMusic.paused) {
        const didPlay = await playAudio();
        if (!didPlay) {
          syncAudioState(false);
        }
      } else {
        pauseAudio();
      }
    });
  }

  if (toTopButton) {
    toTopButton.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: reduceMotion.matches ? "auto" : "smooth"
      });
    });
  }

  if (orbSyncRoot) {
    window.orbSync = new OrbSync(orbSyncRoot, reduceMotion);
    const startBtn = orbSyncRoot.querySelector(".sync-start");
    const retryBtn = orbSyncRoot.querySelector(".sync-retry");
    if (startBtn) {
      startBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (window.orbSync && typeof window.orbSync.begin === "function") {
          window.orbSync.begin();
        }
      });
    }
    if (retryBtn) {
      retryBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (window.orbSync && typeof window.orbSync.begin === "function") {
          window.orbSync.begin();
        }
      });
    }
  }

  updateTopButton();
  window.addEventListener("scroll", updateTopButton, { passive: true });

  window.applyTheme = applyTheme;
});