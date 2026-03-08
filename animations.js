document.addEventListener("DOMContentLoaded", () => {
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const supportsHoverQuery = window.matchMedia("(hover: hover)");
  const isDesktopQuery = window.matchMedia("(min-width: 768px)");
  const revealItems = Array.from(document.querySelectorAll(".reveal"));
  const heroIntroTargets = [
    { selector: ".nav-shell", delay: 0, distance: 18, scale: 0.99, blur: 4, x: 0 },
    { selector: ".hero-stage", delay: 70, distance: 26, scale: 0.975, blur: 10, x: 0 },
    { selector: ".portrait-card", delay: 180, distance: 30, scale: 0.985, blur: 8, x: 0 },
    { selector: ".hero-stage-orbit", delay: 220, distance: 0, scale: 0.94, blur: 0, x: 0, stagger: 90 },
    { selector: ".hero-chip", delay: 280, distance: 14, scale: 0.985, blur: 4, x: -12, stagger: 75 },
    { selector: ".hero-copy-panel", delay: 160, distance: 28, scale: 0.985, blur: 10, x: 0 },
    { selector: ".hero-title", delay: 260, distance: 32, scale: 1, blur: 8, x: 0 },
    { selector: ".hero-lead", delay: 340, distance: 18, scale: 1, blur: 4, x: 0 },
    { selector: ".hero-actions .btn", delay: 420, distance: 14, scale: 0.992, blur: 0, x: 0, stagger: 85 }
  ];

  function animateIn(node, options = {}) {
    const {
      delay = 0,
      duration = 880,
      distance = 24,
      scale = 0.985,
      blur = 8,
      x = 0
    } = options;

    if (!(node instanceof Element) || reduceMotionQuery.matches || typeof node.animate !== "function") {
      return;
    }

    node.animate(
      [
        {
          opacity: 0,
          transform: `translate3d(${x}px, ${distance}px, 0) scale(${scale})`,
          filter: blur > 0 ? `blur(${blur}px)` : "blur(0)"
        },
        {
          opacity: 1,
          transform: "translate3d(0, 0, 0) scale(1)",
          filter: "blur(0)"
        }
      ],
      {
        duration,
        delay,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "none"
      }
    );
  }

  function runHeroIntroFallback() {
    heroIntroTargets.forEach(({ selector, stagger = 0, x = 0, ...options }) => {
      const nodes = Array.from(document.querySelectorAll(selector));
      nodes.forEach((node, index) => {
        animateIn(node, {
          ...options,
          x: selector === ".hero-chip" && index === 1 ? Math.abs(x) : x,
          delay: options.delay + index * stagger
        });
      });
    });
  }

  function setupRevealFallback() {
    if (reduceMotionQuery.matches || revealItems.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || entry.target.dataset.revealPlayed === "true") {
            return;
          }

          entry.target.dataset.revealPlayed = "true";
          animateIn(entry.target, {
            ...getRevealMotion(entry.target)
          });
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -14% 0px",
        threshold: 0.18
      }
    );

    revealItems.forEach((item) => observer.observe(item));
  }

  function getRevealMotion(node) {
    if (node.matches(".section-heading")) {
      return {
        duration: 720,
        distance: 24,
        scale: 1,
        blur: 6
      };
    }

    if (node.matches(".project-card")) {
      return {
        duration: 920,
        distance: 34,
        scale: 0.985,
        blur: 10
      };
    }

    if (node.matches(".sync-shell")) {
      return {
        duration: 860,
        distance: 28,
        scale: 0.985,
        blur: 8
      };
    }

    if (node.matches(".capability-card")) {
      return {
        duration: 820,
        distance: 30,
        scale: 0.988,
        blur: 8
      };
    }

    return {
      duration: 780,
      distance: 26,
      scale: 0.99,
      blur: 8
    };
  }

  function setupAmbientLoops() {
    if (reduceMotionQuery.matches || typeof gsap === "undefined") {
      return;
    }

    gsap.to(".hero-halo-a", {
      x: 10,
      y: -12,
      scale: 1.06,
      duration: 8.4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.to(".hero-halo-b", {
      x: -12,
      y: 14,
      scale: 1.05,
      duration: 9.6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.to(".hero-gridlines", {
      rotate: 0.7,
      scale: 1.018,
      duration: 14,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.to(".hero-stage-orbit-a", {
      rotate: 9,
      duration: 28,
      repeat: -1,
      ease: "none"
    });

    gsap.to(".hero-stage-orbit-b", {
      rotate: -12,
      duration: 34,
      repeat: -1,
      ease: "none"
    });

    gsap.to(".hero-stage-sheen", {
      xPercent: 6,
      yPercent: -4,
      duration: 11,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.to(".portrait-card", {
      yPercent: -1.4,
      duration: 6.8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.to(".portrait-frame img", {
      scale: 1.1,
      duration: 8.6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.to(".portrait-reflection", {
      xPercent: 5,
      opacity: 0.95,
      duration: 6.4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.to(".hero-chip-about", {
      y: -4,
      x: -2,
      duration: 7.4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.to(".hero-chip-game", {
      y: 4,
      x: 2,
      duration: 8.2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.to(".hero-chip-tech", {
      y: -3,
      x: 1,
      duration: 8.8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  }

  function setupScrollParallax() {
    if (
      reduceMotionQuery.matches
      || !isDesktopQuery.matches
      || typeof gsap === "undefined"
      || typeof ScrollTrigger === "undefined"
    ) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    gsap.config({
      force3D: true,
      nullTargetWarn: false,
      trialWarn: false,
      autoSleep: 60
    });

    gsap.to(".hero-copy", {
      yPercent: -7,
      ease: "none",
      scrollTrigger: {
        trigger: "#home",
        start: "top top",
        end: "bottom top",
        scrub: 1.15
      }
    });

    gsap.to(".portrait-stack", {
      yPercent: -10,
      ease: "none",
      scrollTrigger: {
        trigger: "#home",
        start: "top top",
        end: "bottom top",
        scrub: 1.35
      }
    });

    gsap.to(".hero-stage", {
      yPercent: -5,
      scale: 1.02,
      ease: "none",
      scrollTrigger: {
        trigger: "#home",
        start: "top top",
        end: "bottom top",
        scrub: 1.25
      }
    });

    gsap.to(".hero-stage-orbit-a", {
      rotate: 16,
      ease: "none",
      scrollTrigger: {
        trigger: "#home",
        start: "top top",
        end: "bottom top",
        scrub: 1
      }
    });

    gsap.to(".hero-stage-orbit-b", {
      rotate: -19,
      ease: "none",
      scrollTrigger: {
        trigger: "#home",
        start: "top top",
        end: "bottom top",
        scrub: 1
      }
    });
  }

  function setupSectionReveals() {
    if (reduceMotionQuery.matches || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      setupRevealFallback();
      return;
    }

    revealItems.forEach((item) => {
      const config = getRevealMotion(item);
      gsap.from(item, {
        y: config.distance,
        scale: config.scale,
        autoAlpha: 0,
        filter: config.blur > 0 ? `blur(${config.blur}px)` : "blur(0px)",
        duration: config.duration / 1000,
        ease: "power3.out",
        scrollTrigger: {
          trigger: item,
          start: "top 84%",
          once: true
        }
      });
    });
  }

  function setupTilt() {
    if (!supportsHoverQuery.matches || reduceMotionQuery.matches || typeof gsap === "undefined") {
      return;
    }

    const tiltCards = Array.from(document.querySelectorAll("[data-tilt-card]"));
    tiltCards.forEach((card) => {
      const rotateXTo = gsap.quickTo(card, "rotateX", {
        duration: 0.42,
        ease: "power3.out"
      });
      const rotateYTo = gsap.quickTo(card, "rotateY", {
        duration: 0.42,
        ease: "power3.out"
      });
      const xTo = gsap.quickTo(card, "x", {
        duration: 0.42,
        ease: "power3.out"
      });
      const yTo = gsap.quickTo(card, "y", {
        duration: 0.42,
        ease: "power3.out"
      });

      const reset = () => {
        rotateXTo(0);
        rotateYTo(0);
        xTo(0);
        yTo(0);
      };

      card.addEventListener("pointermove", (event) => {
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;
        rotateXTo((0.5 - y) * 6);
        rotateYTo((x - 0.5) * 6);
        xTo((x - 0.5) * 4);
        yTo((y - 0.5) * 4);
      });

      card.addEventListener("pointerleave", reset);
    });
  }

  function setupMagneticUI() {
    if (!supportsHoverQuery.matches || reduceMotionQuery.matches || typeof gsap === "undefined") {
      return;
    }

    const targets = Array.from(document.querySelectorAll(".hero-actions .btn, .project-copy .btn, .sync-start, .sync-retry, .control-btn"));
    targets.forEach((target) => {
      const xTo = gsap.quickTo(target, "x", {
        duration: 0.28,
        ease: "power3.out"
      });
      const yTo = gsap.quickTo(target, "y", {
        duration: 0.28,
        ease: "power3.out"
      });

      target.addEventListener("pointermove", (event) => {
        const bounds = target.getBoundingClientRect();
        const relX = (event.clientX - bounds.left) / bounds.width - 0.5;
        const relY = (event.clientY - bounds.top) / bounds.height - 0.5;
        xTo(relX * 4);
        yTo(relY * 4);
      });

      target.addEventListener("pointerleave", () => {
        xTo(0);
        yTo(0);
      });
    });
  }

  function enforceHeroActionsVisibility() {
    const heroActions = document.querySelector(".hero-actions");
    const heroButtons = Array.from(document.querySelectorAll(".hero-actions .btn"));

    if (heroActions instanceof HTMLElement) {
      heroActions.style.opacity = "1";
      heroActions.style.visibility = "visible";
      heroActions.style.display = "flex";
    }

    heroButtons.forEach((button) => {
      if (!(button instanceof HTMLElement)) {
        return;
      }

      button.style.opacity = "1";
      button.style.visibility = "visible";
      button.style.display = "inline-flex";
      button.style.pointerEvents = "auto";
    });
  }

  function setupGsapMotion() {
    if (reduceMotionQuery.matches || typeof gsap === "undefined") {
      return false;
    }

    if (typeof ScrollTrigger !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }

    gsap.config({
      force3D: true,
      nullTargetWarn: false,
      trialWarn: false,
      autoSleep: 60
    });

    const introTimeline = gsap.timeline({
      defaults: {
        ease: "power3.out"
      }
    });

    introTimeline
      .from(".nav-shell", {
        y: -18,
        autoAlpha: 0,
        duration: 0.72
      }, 0)
      .from(".hero-stage", {
        y: 24,
        scale: 0.975,
        autoAlpha: 0,
        filter: "blur(14px)",
        duration: 1.18
      }, 0.08)
      .from(".portrait-card", {
        y: isDesktopQuery.matches ? 32 : 24,
        scale: 0.99,
        rotateY: isDesktopQuery.matches ? -6 : -2,
        rotateX: isDesktopQuery.matches ? 4 : 0,
        autoAlpha: 0,
        filter: "blur(10px)",
        duration: 1.02
      }, 0.18)
      .from(".hero-stage-orbit", {
        scale: 0.94,
        autoAlpha: 0,
        stagger: 0.09,
        duration: 1
      }, 0.26)
      .from(".hero-chip", {
        y: 12,
        x: (_, target) => target.classList.contains("hero-chip-game") ? 12 : -12,
        autoAlpha: 0,
        stagger: 0.07,
        duration: 0.72
      }, 0.34)
      .from(".hero-copy-panel", {
        y: 28,
        scale: 0.985,
        autoAlpha: 0,
        filter: "blur(10px)",
        duration: 0.94
      }, 0.18)
      .from(".hero-title", {
        y: 34,
        autoAlpha: 0,
        filter: "blur(8px)",
        duration: 0.96
      }, 0.34)
      .from(".hero-lead", {
        y: 16,
        autoAlpha: 0,
        duration: 0.72
      }, 0.5)
      .from(".hero-actions .btn", {
        y: 14,
        scale: 0.992,
        stagger: 0.08,
        duration: 0.62,
        clearProps: "transform"
      }, 0.6);

    setupAmbientLoops();
    setupScrollParallax();
    setupSectionReveals();
    setupTilt();
    setupMagneticUI();
    return true;
  }

  if (!setupGsapMotion()) {
    runHeroIntroFallback();
    setupRevealFallback();
  }

  enforceHeroActionsVisibility();
});