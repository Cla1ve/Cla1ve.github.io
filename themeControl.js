document.addEventListener('DOMContentLoaded', () => {
  // Enhanced Theme definitions with more sophisticated color harmonies
  function applyTheme(themeName) {
    const themes = {
      purple: {
        primary: '#8e24aa',
        secondary: '#ab47bc',
        accent: '#e1bee7',
        bg: '#12002C',
        'card-bg': 'rgba(142, 36, 170, 0.15)',
        'nav-bg': 'rgba(18, 0, 44, 0.95)',
        'primary-rgb': '142, 36, 170',
        'secondary-rgb': '171, 71, 188',
        'accent-rgb': '225, 190, 231'
      },
      blue: {
        primary: '#1a237e',
        secondary: '#3f51b5',
        accent: '#bbdefb',
        bg: '#000A2C',
        'card-bg': 'rgba(26, 35, 126, 0.15)',
        'nav-bg': 'rgba(0, 10, 44, 0.95)',
        'primary-rgb': '26, 35, 126',
        'secondary-rgb': '63, 81, 181',
        'accent-rgb': '187, 222, 251'
      },
      green: {
        primary: '#1b5e20',
        secondary: '#4caf50',
        accent: '#c8e6c9',
        bg: '#002C00',
        'card-bg': 'rgba(27, 94, 32, 0.15)',
        'nav-bg': 'rgba(0, 44, 0, 0.95)',
        'primary-rgb': '27, 94, 32',
        'secondary-rgb': '76, 175, 80',
        'accent-rgb': '200, 230, 201'
      },
      red: {
        primary: '#b71c1c',
        secondary: '#f44336',
        accent: '#ffcdd2',
        bg: '#2C0000',
        'card-bg': 'rgba(183, 28, 28, 0.15)',
        'nav-bg': 'rgba(44, 0, 0, 0.95)',
        'primary-rgb': '183, 28, 28',
        'secondary-rgb': '244, 67, 54',
        'accent-rgb': '255, 205, 210'
      },
      gold: {
        primary: '#bf953f',
        secondary: '#b38728',
        accent: '#fcf6ba',
        bg: '#2C2000',
        'card-bg': 'rgba(191, 149, 63, 0.15)',
        'nav-bg': 'rgba(44, 32, 0, 0.95)',
        'primary-rgb': '191, 149, 63',
        'secondary-rgb': '179, 135, 40',
        'accent-rgb': '252, 246, 186'
      }
    };

    const theme = themes[themeName];
    if (!theme) return;

    const root = document.documentElement;
    Object.entries(theme).forEach(([property, value]) => {
      root.style.setProperty(`--${property}`, value);
    });

    // Comprehensive color updates
    document.body.style.setProperty('--primary', theme.primary);
    document.body.style.setProperty('--secondary', theme.secondary);
    document.body.style.setProperty('--accent', theme.accent);
    document.body.style.setProperty('--bg', theme.bg);
    
    // Update all text shadows
    const textElements = document.querySelectorAll('.gamer-name, .about h2, .projects h2');
    textElements.forEach(el => {
      el.style.textShadow = `
        0 0 10px ${theme.accent}, 
        0 0 20px ${theme.primary}
      `;
    });

    // Update skill category and star colors
    const skillStars = document.querySelectorAll('.skill-category li::before');
    skillStars.forEach(star => {
      star.style.color = theme.primary;
    });

    // Update hover and interaction effects
    const hoverElements = document.querySelectorAll(
      '.social-btn, .project-card, .skill-category, .theme-btn'
    );
    hoverElements.forEach(el => {
      el.style.setProperty('--hover-color', theme.secondary);
    });

    // Update SVG and icon colors
    const svgs = document.querySelectorAll('svg');
    svgs.forEach(svg => {
      svg.style.fill = theme.accent;
    });

    // Update scrollbar colors
    const scrollbarStyle = `
      ::-webkit-scrollbar-thumb {
        background: linear-gradient(${theme.primary}, ${theme.secondary});
      }
      ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(${theme.secondary}, ${theme.primary});
      }
    `;
    
    let styleEl = document.getElementById('dynamic-scrollbar-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'dynamic-scrollbar-style';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = scrollbarStyle;

    localStorage.setItem('preferredTheme', themeName);
    document.body.setAttribute('data-theme', themeName);

    // Ensure visibility of theme buttons
    const colorPalette = document.querySelector('.colors');
    if (colorPalette) {
      colorPalette.style.opacity = '1';
      colorPalette.style.visibility = 'visible';
    }

    // Regenerate particle colors based on theme
    if (window.particleSystem) {
      window.particleSystem.updateParticleColors(theme);
    }
  }

  // Apply saved theme immediately
  const savedTheme = localStorage.getItem('preferredTheme') || 'purple';
  applyTheme(savedTheme);

  // Initialize theme buttons
  const themeButtons = document.querySelectorAll('.theme-btn');
  themeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const theme = btn.getAttribute('data-theme');
      applyTheme(theme);
    });
  });

  // Expose theme application for potential global use
  window.applyTheme = applyTheme;

  // Audio mute toggle
  const muteBtn = document.querySelector('.mute-btn');
  const bgMusic = document.getElementById('bgMusic');

  // Set initial state based on whether music is playing or not
  if(bgMusic.paused) {
      muteBtn.classList.add('muted');
    } else {
      muteBtn.classList.remove('muted');
    }
    
    muteBtn.addEventListener('click', () => {
      if (bgMusic.paused) {
        bgMusic.play();
        muteBtn.classList.remove('muted');
      } else {
        bgMusic.pause();
        muteBtn.classList.add('muted');
      }
    });
});