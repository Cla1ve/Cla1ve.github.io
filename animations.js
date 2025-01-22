document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    
    // Enhanced Hero Section Animation
    const heroTl = gsap.timeline({
      defaults: { duration: 1, ease: 'power3.out' }
    });
    
    heroTl
      .from('.profile-pic', {
        scale: 0.5,
        opacity: 0,
        ease: 'back.out(1.7)'
      })
      .from('.gamer-name', {
        y: 50,
        opacity: 0
      }, '-=0.5')
      .from('.gamer-title', {
        y: 30,
        opacity: 0
      }, '-=0.4')
      .from('.social-links', {
        scale: 0.5,
        opacity: 0,
        stagger: 0.2,
        ease: 'back.out(1.5)'
      }, '-=0.3');

    // Enhanced Scroll Animations
    gsap.utils.toArray('section').forEach(section => {
      gsap.from(section, {
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out'
      });
    });

    // Skill Category Hover Effects
    const skillCategories = document.querySelectorAll('.skill-category');
    skillCategories.forEach(category => {
      category.addEventListener('mouseenter', () => {
        gsap.to(category, {
          scale: 1.05,
          boxShadow: '0 15px 30px rgba(142, 36, 170, 0.3)',
          duration: 0.3
        });
      });

      category.addEventListener('mouseleave', () => {
        gsap.to(category, {
          scale: 1,
          boxShadow: 'none',
          duration: 0.3
        });
      });
    });
  }
});