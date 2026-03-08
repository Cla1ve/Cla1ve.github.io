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

    if (!(node instanceof Element) || typeof node.animate !== "function") {
      return;
    }

    if (reduceMotionQuery.matches) {
      node.style.opacity = "1";
      node.style.visibility = "visible";
      node.style.transform = "none";
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
        fill: "forwards"
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

    const mobile = !isDesktopQuery.matches;

    gsap.to(".hero-halo-a", {
      y: mobile ? -6 : -12,
      scale: mobile ? 1.03 : 1.06,
      duration: 8.4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.to(".hero-halo-b", {
      y: mobile ? 8 : 14,
      scale: mobile ? 1.02 : 1.05,
      duration: 9.6,
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

    if (!mobile) {
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
      yPercent: -8,
      rotateX: 1,
      z: -15,
      ease: "none",
      scrollTrigger: {
        trigger: "#home",
        start: "top top",
        end: "bottom top",
        scrub: 1.2
      }
    });

    gsap.to(".portrait-stack", {
      yPercent: -12,
      scale: 0.97,
      rotateY: 2,
      ease: "none",
      scrollTrigger: {
        trigger: "#home",
        start: "top top",
        end: "bottom top",
        scrub: 1.4
      }
    });

    gsap.to(".hero-stage", {
      yPercent: -6,
      scale: 1.02,
      rotateX: 1.5,
      ease: "none",
      scrollTrigger: {
        trigger: "#home",
        start: "top top",
        end: "bottom top",
        scrub: 1.3
      }
    });

    gsap.to(".hero-stage-orbit-a", {
      rotate: 18,
      scale: 1.04,
      ease: "none",
      scrollTrigger: {
        trigger: "#home",
        start: "top top",
        end: "bottom top",
        scrub: 1
      }
    });

    gsap.to(".hero-stage-orbit-b", {
      rotate: -22,
      scale: 0.96,
      ease: "none",
      scrollTrigger: {
        trigger: "#home",
        start: "top top",
        end: "bottom top",
        scrub: 1
      }
    });

    window.addEventListener("load", () => {
      ScrollTrigger.refresh();
    });
    setTimeout(() => ScrollTrigger.refresh(), 100);
  }

  function setupSectionReveals() {
    if (reduceMotionQuery.matches || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      setupRevealFallback();
      return;
    }

    const desktop = isDesktopQuery.matches;

    revealItems.forEach((item) => {
      const config = getRevealMotion(item);
      const rotX = desktop ? -3 : -1.5;
      const tz = desktop ? -40 : -20;

      gsap.fromTo(item,
        {
          autoAlpha: 0,
          y: config.distance,
          rotateX: rotX,
          z: tz,
          scale: config.scale,
          filter: config.blur > 0 ? `blur(${config.blur}px)` : "blur(0px)"
        },
        {
          autoAlpha: 1,
          y: 0,
          rotateX: 0,
          z: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: config.duration / 1000,
          ease: "power3.out",
          clearProps: "filter,rotateX,z",
          scrollTrigger: {
            trigger: item,
            start: "top 86%",
            once: true
          }
        }
      );
    });
  }

  function setupTilt() {
    if (!supportsHoverQuery.matches || reduceMotionQuery.matches || typeof gsap === "undefined") {
      return;
    }

    const tiltCards = Array.from(document.querySelectorAll("[data-tilt-card]"));
    tiltCards.forEach((card) => {
      const rotateXTo = gsap.quickTo(card, "rotateX", {
        duration: 0.5,
        ease: "elastic.out(1, 0.6)"
      });
      const rotateYTo = gsap.quickTo(card, "rotateY", {
        duration: 0.5,
        ease: "elastic.out(1, 0.6)"
      });
      const xTo = gsap.quickTo(card, "x", {
        duration: 0.5,
        ease: "elastic.out(1, 0.6)"
      });
      const yTo = gsap.quickTo(card, "y", {
        duration: 0.5,
        ease: "elastic.out(1, 0.6)"
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
        duration: 0.36,
        ease: "elastic.out(1, 0.5)"
      });
      const yTo = gsap.quickTo(target, "y", {
        duration: 0.36,
        ease: "elastic.out(1, 0.5)"
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

  function clearInitialHiddenStates() {
    document.documentElement.classList.add("loaded");
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
      },
      onComplete: clearInitialHiddenStates
    });

    const desktop = isDesktopQuery.matches;

    introTimeline
      .fromTo(".nav-shell",
        { autoAlpha: 0, y: -18 },
        { autoAlpha: 1, y: 0, duration: 0.72 },
        0
      )
      .fromTo(".hero-stage",
        { autoAlpha: 0, y: 30, scale: 0.97, rotateX: desktop ? -2 : 0, z: desktop ? -30 : 0, filter: "blur(14px)" },
        { autoAlpha: 1, y: 0, scale: 1, rotateX: 0, z: 0, filter: "blur(0px)", duration: 1.25, clearProps: "filter,rotateX,z" },
        0.06
      )
      .fromTo(".portrait-card",
        { autoAlpha: 0, y: desktop ? 36 : 26, scale: 0.985, rotateY: desktop ? -8 : -3, rotateX: desktop ? 4 : 1, z: desktop ? -60 : -20, filter: "blur(10px)" },
        { autoAlpha: 1, y: 0, scale: 1, rotateY: 0, rotateX: 0, z: 0, filter: "blur(0px)", duration: 1.1, clearProps: "filter,rotateY,rotateX,z" },
        0.16
      )
      .fromTo(".hero-stage-orbit",
        { autoAlpha: 0, scale: 0.9 },
        { autoAlpha: 1, scale: 1, stagger: 0.1, duration: 1.05 },
        0.24
      )
      .fromTo(".hero-chip",
        { autoAlpha: 0, y: 14, z: -20, x: (_, target) => target.classList.contains("hero-chip-game") ? 14 : -14 },
        { autoAlpha: 1, y: 0, z: 0, x: 0, stagger: 0.08, duration: 0.78, ease: "back.out(1.4)", clearProps: "z" },
        0.32
      )
      .fromTo(".hero-copy-panel",
        { autoAlpha: 0, y: 32, scale: 0.98, rotateY: desktop ? 2 : 0, z: desktop ? -30 : 0, filter: "blur(10px)" },
        { autoAlpha: 1, y: 0, scale: 1, rotateY: 0, z: 0, filter: "blur(0px)", duration: 1, clearProps: "filter,rotateY,z" },
        0.14
      )
      .fromTo(".hero-title",
        { autoAlpha: 0, y: 38, filter: "blur(8px)" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 1, clearProps: "filter" },
        0.32
      )
      .fromTo(".hero-lead",
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.76 },
        0.48
      )
      .fromTo(".hero-actions .btn",
        { autoAlpha: 0, y: 16, scale: 0.99 },
        { autoAlpha: 1, y: 0, scale: 1, stagger: 0.09, duration: 0.68, ease: "back.out(1.6)", clearProps: "transform" },
        0.58
      );

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
    clearInitialHiddenStates();
  }
});