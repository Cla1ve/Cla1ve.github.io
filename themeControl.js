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
      this.pointer = {
        x: 0,
        y: 0,
        active: false
      };
      this.orbs = [];
      this.trail = [];
      this.ripples = [];
      this.score = 0;
      this.completed = false;
      this.active = false;
      this.lastFrameTime = 0;
      this.dpr = 1;
      this.width = 0;
      this.height = 0;
      this.palette = this.readPalette();

      if (!this.ctx || !this.canvas) {
        return;
      }

      this.resize();
      this.createOrbs();
      this.setScore(0);
      this.bindEvents();
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

    getOrbCount() {
      if (this.width < 480) {
        return 4;
      }

      if (this.width < 900) {
        return 5;
      }

      return 6;
    }

    getTargetScore() {
      return this.getOrbCount() * 4;
    }

    resize() {
      const bounds = this.root.getBoundingClientRect();
      this.width = Math.max(1, Math.round(bounds.width));
      this.height = Math.max(1, Math.round(bounds.height));
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = this.width * this.dpr;
      this.canvas.height = this.height * this.dpr;
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    createOrbs() {
      const count = this.getOrbCount();
      const spreadX = Math.min(this.width * 0.26, 170);
      const spreadY = Math.min(this.height * 0.22, 130);
      const centerX = this.width / 2;
      const centerY = this.height / 2;

      this.orbs = Array.from({ length: count }, (_, index) => {
        const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
        const radius = Math.max(24, Math.min(this.width, this.height) * 0.048);

        return {
          baseX: centerX + Math.cos(angle) * spreadX,
          baseY: centerY + Math.sin(angle) * spreadY,
          x: centerX + Math.cos(angle) * spreadX,
          y: centerY + Math.sin(angle) * spreadY,
          radius,
          energy: 0,
          offset: Math.random() * Math.PI * 2,
          driftX: 10 + Math.random() * 12,
          driftY: 10 + Math.random() * 12,
          speed: 0.6 + Math.random() * 0.5,
          lastHit: 0
        };
      });
    }

    setScore(nextScore) {
      this.score = nextScore;
      if (this.scoreNode) {
        this.scoreNode.textContent = String(this.score);
      }

      if (!this.completed && this.score >= this.getTargetScore()) {
        this.completed = true;
        this.root.classList.add("is-complete");
        this.ripples.push({
          x: this.width / 2,
          y: this.height / 2,
          radius: 24,
          alpha: 0.55,
          speed: 4.8
        });
      }
    }

    begin() {
      this.active = true;
      this.completed = false;
      this.pointer.active = false;
      this.trail = [];
      this.ripples = [];
      this.root.classList.add("is-active");
      this.root.classList.remove("is-complete");
      this.createOrbs();
      this.setScore(0);
    }

    updatePointer(event) {
      const bounds = this.canvas.getBoundingClientRect();
      this.pointer.x = event.clientX - bounds.left;
      this.pointer.y = event.clientY - bounds.top;
    }

    addTrailPoint() {
      this.trail.push({
        x: this.pointer.x,
        y: this.pointer.y,
        life: 1
      });

      if (this.trail.length > 22) {
        this.trail.shift();
      }
    }

    interact() {
      const now = performance.now();

      this.orbs.forEach((orb) => {
        const dx = this.pointer.x - orb.x;
        const dy = this.pointer.y - orb.y;
        const distance = Math.hypot(dx, dy);
        const threshold = orb.radius + 16;

        if (distance > threshold || now - orb.lastHit < 180) {
          return;
        }

        orb.lastHit = now;
        orb.energy = 1;
        this.ripples.push({
          x: orb.x,
          y: orb.y,
          radius: orb.radius * 0.6,
          alpha: 0.5,
          speed: 3.2
        });
        this.setScore(this.score + 1);
      });
    }

    bindEvents() {
      let resizeTimeout = 0;

      if (this.startButton) {
        this.startButton.addEventListener("click", () => {
          this.begin();
        });
      }

      if (this.retryButton) {
        this.retryButton.addEventListener("click", () => {
          this.begin();
        });
      }

      this.canvas.addEventListener("pointerdown", (event) => {
        this.pointer.active = true;
        this.updatePointer(event);
        this.addTrailPoint();
        if (typeof this.canvas.setPointerCapture === "function") {
          this.canvas.setPointerCapture(event.pointerId);
        }
        if (this.active) {
          this.interact();
        }
      });

      this.canvas.addEventListener("pointermove", (event) => {
        this.updatePointer(event);
        if (!this.active) {
          return;
        }

        this.pointer.active = true;
        this.addTrailPoint();
        this.interact();
      });

      ["pointerup", "pointercancel", "pointerleave"].forEach((eventName) => {
        this.canvas.addEventListener(eventName, () => {
          this.pointer.active = false;
        });
      });

      window.addEventListener("resize", () => {
        window.clearTimeout(resizeTimeout);
        resizeTimeout = window.setTimeout(() => {
          this.resize();
          this.createOrbs();
        }, 120);
      });

      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
          this.lastFrameTime = 0;
        }
      });

      document.addEventListener("cla1ve:theme-change", () => {
        this.palette = this.readPalette();
      });

      this.reduceMotionQuery.addEventListener("change", (event) => {
        this.reducedMotion = event.matches;
      });
    }

    drawBackdrop() {
      const ringRadius = Math.min(this.width, this.height) * 0.24;
      this.ctx.beginPath();
      this.ctx.strokeStyle = this.colorWithAlpha(this.palette.accentSoft, 0.12);
      this.ctx.lineWidth = 1;
      this.ctx.arc(this.width / 2, this.height / 2, ringRadius, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.strokeStyle = this.colorWithAlpha(this.palette.accent, 0.08);
      this.ctx.lineWidth = 1;
      this.ctx.arc(this.width / 2, this.height / 2, ringRadius * 1.45, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    drawTrail() {
      if (this.trail.length < 2) {
        return;
      }

      this.ctx.beginPath();
      this.ctx.lineWidth = this.reducedMotion ? 2 : 3;
      this.ctx.lineCap = "round";
      this.ctx.lineJoin = "round";

      this.trail.forEach((point, index) => {
        if (index === 0) {
          this.ctx.moveTo(point.x, point.y);
        } else {
          this.ctx.lineTo(point.x, point.y);
        }
      });

      const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
      gradient.addColorStop(0, this.colorWithAlpha(this.palette.accentSoft, 0.18));
      gradient.addColorStop(1, this.colorWithAlpha(this.palette.accent, 0.55));
      this.ctx.strokeStyle = gradient;
      this.ctx.stroke();

      this.trail = this.trail
        .map((point) => ({
          ...point,
          life: point.life - (this.reducedMotion ? 0.08 : 0.06)
        }))
        .filter((point) => point.life > 0);
    }

    drawConnections() {
      for (let index = 0; index < this.orbs.length; index += 1) {
        const first = this.orbs[index];

        for (let next = index + 1; next < this.orbs.length; next += 1) {
          const second = this.orbs[next];
          const distance = Math.hypot(first.x - second.x, first.y - second.y);
          const maxDistance = Math.min(this.width, this.height) * 0.42;

          if (distance > maxDistance) {
            continue;
          }

          const alpha = (1 - distance / maxDistance) * 0.12 + (first.energy + second.energy) * 0.08;
          this.ctx.beginPath();
          this.ctx.strokeStyle = this.colorWithAlpha(this.palette.accent, Math.min(alpha, 0.36));
          this.ctx.lineWidth = 1.2;
          this.ctx.moveTo(first.x, first.y);
          this.ctx.lineTo(second.x, second.y);
          this.ctx.stroke();
        }
      }
    }

    drawRipples() {
      this.ripples = this.ripples
        .map((ripple) => ({
          ...ripple,
          radius: ripple.radius + ripple.speed,
          alpha: ripple.alpha - 0.018
        }))
        .filter((ripple) => ripple.alpha > 0);

      this.ripples.forEach((ripple) => {
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.colorWithAlpha(this.palette.accentSoft, ripple.alpha);
        this.ctx.lineWidth = 1.5;
        this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        this.ctx.stroke();
      });
    }

    drawOrb(orb) {
      const glowRadius = orb.radius * (2.2 + orb.energy * 0.75);
      const gradient = this.ctx.createRadialGradient(
        orb.x,
        orb.y,
        0,
        orb.x,
        orb.y,
        glowRadius
      );

      gradient.addColorStop(0, this.colorWithAlpha(this.palette.accentSoft, 0.34 + orb.energy * 0.2));
      gradient.addColorStop(1, this.colorWithAlpha(this.palette.accent, 0));

      this.ctx.beginPath();
      this.ctx.fillStyle = gradient;
      this.ctx.arc(orb.x, orb.y, glowRadius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.fillStyle = this.colorWithAlpha(this.palette.accentSoft, 0.84);
      this.ctx.arc(orb.x, orb.y, orb.radius * (0.72 + orb.energy * 0.06), 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.fillStyle = this.colorWithAlpha(this.palette.text, 0.18);
      this.ctx.arc(orb.x - orb.radius * 0.2, orb.y - orb.radius * 0.2, orb.radius * 0.18, 0, Math.PI * 2);
      this.ctx.fill();
    }

    updateOrbs(timestamp) {
      this.orbs.forEach((orb) => {
        const driftMultiplier = this.reducedMotion ? 0.45 : 1;
        orb.x = orb.baseX + Math.cos(timestamp * 0.0006 * orb.speed + orb.offset) * orb.driftX * driftMultiplier;
        orb.y = orb.baseY + Math.sin(timestamp * 0.0008 * orb.speed + orb.offset) * orb.driftY * driftMultiplier;
        orb.energy = Math.max(0, orb.energy - (this.reducedMotion ? 0.03 : 0.02));
      });
    }

    render(timestamp = 0) {
      window.requestAnimationFrame((time) => this.render(time));

      const frameInterval = this.reducedMotion ? 1000 / 22 : 1000 / 42;
      if (timestamp - this.lastFrameTime < frameInterval) {
        return;
      }

      this.lastFrameTime = timestamp;
      this.ctx.clearRect(0, 0, this.width, this.height);

      this.drawBackdrop();
      this.updateOrbs(timestamp);
      this.drawConnections();
      this.drawTrail();
      this.drawRipples();
      this.orbs.forEach((orb) => this.drawOrb(orb));
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

  function applyTheme(themeName) {
    const nextTheme = themes[themeName] ? themeName : "violet";
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
  }

  updateTopButton();
  window.addEventListener("scroll", updateTopButton, { passive: true });

  window.applyTheme = applyTheme;
});