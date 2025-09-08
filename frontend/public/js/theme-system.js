/* ===================================================== */
/* 🎨 TLS PROJECTS - THEME SYSTEM CONTROLLER */
/* Light/Dark Theme Toggle with Persistence */
/* ===================================================== */

/* Theme Toggle Button Styles */
const themeToggleStyles = `
    .theme-toggle {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border: none;
        border-radius: 50%;
        background: var(--bg-glass, rgba(255, 255, 255, 0.1));
        backdrop-filter: blur(10px);
        border: 1px solid var(--bg-overlay, rgba(255, 255, 255, 0.2));
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: 0 4px 20px var(--shadow-light, rgba(0, 0, 0, 0.1));
    }
    
    .theme-toggle:hover {
        transform: scale(1.1);
        background: var(--bg-secondary, rgba(255, 255, 255, 0.2));
        box-shadow: 0 6px 25px var(--shadow-medium, rgba(0, 0, 0, 0.15));
    }
    
    .theme-toggle .theme-icon {
        color: var(--text-primary, #333);
        transition: transform 0.3s ease, color 0.3s ease;
    }
    
    .theme-toggle:hover .theme-icon {
        transform: rotate(180deg);
    }
    
    [data-theme="dark"] .theme-toggle {
        background: var(--bg-glass, rgba(0, 0, 0, 0.3));
        border-color: var(--bg-overlay, rgba(255, 255, 255, 0.1));
    }
    
    [data-theme="dark"] .theme-toggle .theme-icon {
        color: var(--text-primary, #fff);
    }
    
    @media (max-width: 768px) {
        .theme-toggle {
            top: 10px;
            right: 10px;
            width: 40px;
            height: 40px;
        }
    }
`;

// Inject theme toggle styles
const themeStyleSheet = document.createElement('style');
themeStyleSheet.textContent = themeToggleStyles;
document.head.appendChild(themeStyleSheet);

class ThemeSystem {
    constructor() {
        this.currentTheme = 'light';
        this.themeKey = 'tls-theme-preference';
        this.init();
    }

    init() {
        // Load saved theme or default to light
        this.loadTheme();
        
        // Create theme toggle button
        this.createThemeToggle();
        
        // Apply theme to document
        this.applyTheme();
        
        // Listen for system theme changes
        this.watchSystemTheme();
    }

    loadTheme() {
        // Check localStorage first
        const savedTheme = localStorage.getItem(this.themeKey);
        
        if (savedTheme) {
            this.currentTheme = savedTheme;
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.currentTheme = prefersDark ? 'dark' : 'light';
        }
    }

    saveTheme() {
        localStorage.setItem(this.themeKey, this.currentTheme);
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        // Update toggle button icon
        this.updateToggleIcon();
        
        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: this.currentTheme }
        }));
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveTheme();
        
        // Add transition class for smooth switching
        document.body.classList.add('theme-transitioning');
        setTimeout(() => {
            document.body.classList.remove('theme-transitioning');
        }, 300);
    }

    createThemeToggle() {
        // Check if toggle already exists
        if (document.querySelector('.theme-toggle')) return;

        const toggle = document.createElement('button');
        toggle.className = 'theme-toggle';
        toggle.setAttribute('aria-label', 'Toggle theme');
        toggle.setAttribute('title', 'Switch between light and dark theme');
        
        // Add icon
        toggle.innerHTML = `
            <svg class="theme-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path class="sun-icon" d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" stroke="currentColor" stroke-width="2"/>
                <path class="sun-icon" d="M12 1V3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path class="sun-icon" d="M12 21V23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path class="sun-icon" d="M4.22 4.22L5.64 5.64" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path class="sun-icon" d="M18.36 18.36L19.78 19.78" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path class="sun-icon" d="M1 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path class="sun-icon" d="M21 12H23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path class="sun-icon" d="M4.22 19.78L5.64 18.36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path class="sun-icon" d="M18.36 5.64L19.78 4.22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path class="moon-icon" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79Z" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
        `;
        
        // Add click handler
        toggle.addEventListener('click', () => this.toggleTheme());
        
        // Add to document
        document.body.appendChild(toggle);
    }

    updateToggleIcon() {
        const toggle = document.querySelector('.theme-toggle');
        if (!toggle) return;

        const sunIcon = toggle.querySelectorAll('.sun-icon');
        const moonIcon = toggle.querySelectorAll('.moon-icon');
        
        if (this.currentTheme === 'dark') {
            sunIcon.forEach(icon => icon.style.display = 'block');
            moonIcon.forEach(icon => icon.style.display = 'none');
            toggle.setAttribute('title', 'Switch to light theme');
        } else {
            sunIcon.forEach(icon => icon.style.display = 'none');
            moonIcon.forEach(icon => icon.style.display = 'block');
            toggle.setAttribute('title', 'Switch to dark theme');
        }
    }

    watchSystemTheme() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        mediaQuery.addEventListener('change', (e) => {
            // Only auto-switch if user hasn't manually set a preference
            if (!localStorage.getItem(this.themeKey)) {
                this.currentTheme = e.matches ? 'dark' : 'light';
                this.applyTheme();
            }
        });
    }

    // Public methods for external use
    setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.currentTheme = theme;
            this.applyTheme();
            this.saveTheme();
        }
    }

    getTheme() {
        return this.currentTheme;
    }

    // Method to update dynamic styles based on theme
    updateDynamicStyles() {
        const theme = this.currentTheme;
        const root = document.documentElement;
        
        // Update any dynamic CSS variables or styles
        if (theme === 'dark') {
            root.style.setProperty('--dynamic-overlay', 'rgba(0, 0, 0, 0.8)');
        } else {
            root.style.setProperty('--dynamic-overlay', 'rgba(255, 255, 255, 0.8)');
        }
    }
}

/* ===================================================== */
/* 🎭 THEME TRANSITION STYLES */
/* ===================================================== */

// Add transition styles for smooth theme switching
const themeTransitionStyles = `
    .theme-transitioning * {
        transition: background-color 0.3s ease, 
                   color 0.3s ease, 
                   border-color 0.3s ease, 
                   box-shadow 0.3s ease !important;
    }
    
    .theme-toggle .theme-icon {
        transition: transform 0.3s ease;
    }
    
    .theme-toggle:hover .theme-icon {
        transform: rotate(180deg);
    }
`;

// Inject transition styles
const styleSheet = document.createElement('style');
styleSheet.textContent = themeTransitionStyles;
document.head.appendChild(styleSheet);

/* ===================================================== */
/* 🚀 INITIALIZE THEME SYSTEM */
/* ===================================================== */

// Initialize theme system when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeSystem = new ThemeSystem();
    });
} else {
    window.themeSystem = new ThemeSystem();
}

/* ===================================================== */
/* 🔧 UTILITY FUNCTIONS */
/* ===================================================== */

// Helper function to get current theme
window.getCurrentTheme = () => {
    return window.themeSystem ? window.themeSystem.getTheme() : 'light';
};

// Helper function to set theme programmatically
window.setTheme = (theme) => {
    if (window.themeSystem) {
        window.themeSystem.setTheme(theme);
    }
};

// Helper function to toggle theme
window.toggleTheme = () => {
    if (window.themeSystem) {
        window.themeSystem.toggleTheme();
    }
};

// Listen for theme changes to update dynamic content
window.addEventListener('themeChanged', (event) => {
    const theme = event.detail.theme;
    
    // Update any dynamic elements that need theme-specific styling
    const dynamicElements = document.querySelectorAll('[data-theme-dynamic]');
    dynamicElements.forEach(element => {
        element.setAttribute('data-current-theme', theme);
    });
    
    // Update theme system dynamic styles
    if (window.themeSystem) {
        window.themeSystem.updateDynamicStyles();
    }
    
    // Trigger custom theme update events for other scripts
    console.log(`Theme switched to: ${theme}`);
});

/* ===================================================== */
/* 📱 RESPONSIVE THEME TOGGLE POSITIONING */
/* ===================================================== */

// Adjust theme toggle position on mobile
function adjustThemeTogglePosition() {
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;
    
    if (window.innerWidth <= 768) {
        toggle.style.top = '10px';
        toggle.style.right = '10px';
        toggle.style.width = '40px';
        toggle.style.height = '40px';
    } else {
        toggle.style.top = '20px';
        toggle.style.right = '20px';
        toggle.style.width = '50px';
        toggle.style.height = '50px';
    }
}

// Adjust on load and resize
window.addEventListener('load', adjustThemeTogglePosition);
window.addEventListener('resize', adjustThemeTogglePosition);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeSystem;
}