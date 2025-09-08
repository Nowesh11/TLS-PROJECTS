/**
 * Enhanced Theme Toggle System
 * Version 2.0 - Modern Gradient Themes with Animations
 * Tamil Language Society Website
 */

class EnhancedThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.themeKey = 'tls-theme-preference';
        this.cssVersion = '2.0';
        this.transitionDuration = 300;
        
        this.init();
    }

    init() {
        this.loadSavedTheme();
        this.createThemeToggle();
        this.applyTheme(this.currentTheme, false);
        this.setupEventListeners();
        this.addCacheBusting();
    }

    loadSavedTheme() {
        const saved = localStorage.getItem(this.themeKey);
        if (saved && ['light', 'dark'].includes(saved)) {
            this.currentTheme = saved;
        } else {
            // Auto-detect system preference
            this.currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
    }

    createThemeToggle() {
        // Remove existing toggle if present
        const existing = document.querySelector('.theme-toggle');
        if (existing) {
            existing.remove();
        }

        const toggle = document.createElement('button');
        toggle.className = 'theme-toggle';
        toggle.setAttribute('aria-label', 'Toggle theme');
        toggle.setAttribute('title', 'Switch between light and dark themes');
        
        this.updateToggleIcon(toggle);
        
        document.body.appendChild(toggle);
        
        toggle.addEventListener('click', () => this.toggleTheme());
    }

    updateToggleIcon(toggle) {
        const lightIcon = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 18c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6zm0-10c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z"/>
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
            </svg>
        `;
        
        const darkIcon = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"/>
            </svg>
        `;
        
        toggle.innerHTML = this.currentTheme === 'light' ? darkIcon : lightIcon;
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme, true);
    }

    applyTheme(theme, animate = true) {
        if (animate) {
            // Add transition class for smooth animation
            document.body.classList.add('theme-transitioning');
            
            // Create ripple effect from toggle button
            this.createRippleEffect();
        }

        // Apply theme
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        
        // Save preference
        localStorage.setItem(this.themeKey, theme);
        
        // Update toggle icon
        const toggle = document.querySelector('.theme-toggle');
        if (toggle) {
            this.updateToggleIcon(toggle);
        }
        
        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(theme);
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme, previousTheme: theme === 'light' ? 'dark' : 'light' }
        }));

        if (animate) {
            // Remove transition class after animation
            setTimeout(() => {
                document.body.classList.remove('theme-transitioning');
            }, this.transitionDuration);
        }
    }

    createRippleEffect() {
        const toggle = document.querySelector('.theme-toggle');
        if (!toggle) return;

        const ripple = document.createElement('div');
        ripple.className = 'theme-ripple';
        
        const rect = toggle.getBoundingClientRect();
        const size = Math.max(window.innerWidth, window.innerHeight) * 2;
        
        ripple.style.cssText = `
            position: fixed;
            top: ${rect.top + rect.height / 2}px;
            left: ${rect.left + rect.width / 2}px;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: ${this.currentTheme === 'light' ? 
                'linear-gradient(135deg, #7A1515, #FF4B5C, #FF758C, #B83280)' : 
                'linear-gradient(135deg, #182657, #4A90E2, #A1C4FD, #C2E9FB)'};
            transform: translate(-50%, -50%) scale(0);
            pointer-events: none;
            z-index: 9999;
            transition: transform ${this.transitionDuration}ms ease-out;
        `;
        
        document.body.appendChild(ripple);
        
        // Trigger animation
        requestAnimationFrame(() => {
            ripple.style.transform = 'translate(-50%, -50%) scale(1)';
        });
        
        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, this.transitionDuration);
    }

    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        metaThemeColor.content = theme === 'light' ? '#182657' : '#7A1515';
    }

    addCacheBusting() {
        // Add version parameter to CSS files to prevent caching issues
        const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
        cssLinks.forEach(link => {
            const href = link.href;
            if (href.includes('gradient-theme.css') || href.includes('style.css')) {
                const separator = href.includes('?') ? '&' : '?';
                if (!href.includes('v=')) {
                    link.href = `${href}${separator}v=${this.cssVersion}`;
                }
            }
        });
    }

    setupEventListeners() {
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(this.themeKey)) {
                this.applyTheme(e.matches ? 'dark' : 'light', true);
            }
        });

        // Keyboard shortcut (Ctrl/Cmd + Shift + T)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTheme();
            }
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Refresh theme when page becomes visible
                this.applyTheme(this.currentTheme, false);
            }
        });
    }

    // Public methods for external use
    getCurrentTheme() {
        return this.currentTheme;
    }

    setTheme(theme, animate = true) {
        if (['light', 'dark'].includes(theme)) {
            this.applyTheme(theme, animate);
        }
    }

    resetToSystemPreference() {
        localStorage.removeItem(this.themeKey);
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        this.applyTheme(systemTheme, true);
    }
}

// Enhanced Dynamic Content Manager for Theme-Aware Content
class ThemeAwareDynamicContent {
    constructor() {
        this.contentCache = new Map();
        this.currentLanguage = 'en';
        this.init();
    }

    init() {
        this.setupThemeListener();
        this.loadContent();
    }

    setupThemeListener() {
        window.addEventListener('themeChanged', (e) => {
            this.updateThemeSpecificContent(e.detail.theme);
        });
    }

    async loadContent() {
        try {
            const response = await fetch('/api/website-content');
            if (response.ok) {
                const content = await response.json();
                this.processContent(content);
            }
        } catch (error) {
            console.error('Error loading dynamic content:', error);
        }
    }

    processContent(content) {
        const elementsWithDataContent = document.querySelectorAll('[data-content]');
        
        elementsWithDataContent.forEach(element => {
            const contentKey = element.getAttribute('data-content');
            const contentItem = content.find(item => item.content_key === contentKey);
            
            if (contentItem) {
                this.updateElement(element, contentItem);
            }
        });
    }

    updateElement(element, contentItem) {
        const currentTheme = window.themeManager?.getCurrentTheme() || 'light';
        const language = this.currentLanguage;
        
        let text = contentItem.content_value;
        
        // Use bilingual content if available
        if (contentItem.bilingual_content) {
            const bilingualText = contentItem.bilingual_content[language];
            if (bilingualText) {
                text = bilingualText;
            }
        }
        
        // Apply theme-specific styling
        element.textContent = text;
        element.classList.add('fade-in');
        
        // Add theme-specific classes
        if (currentTheme === 'dark') {
            element.classList.add('dark-theme-text');
        } else {
            element.classList.remove('dark-theme-text');
        }
    }

    updateThemeSpecificContent(theme) {
        // Update any theme-specific content or styling
        const themeElements = document.querySelectorAll('[data-theme-content]');
        
        themeElements.forEach(element => {
            const themeContent = element.getAttribute(`data-${theme}-content`);
            if (themeContent) {
                element.textContent = themeContent;
            }
        });
    }

    setLanguage(language) {
        this.currentLanguage = language;
        this.loadContent(); // Reload content with new language
    }
}

// Additional CSS for theme transitions
const additionalCSS = `
.theme-transitioning {
    transition: all 0.3s ease !important;
}

.theme-transitioning * {
    transition: all 0.3s ease !important;
}

.dark-theme-text {
    text-shadow: 0 0 10px rgba(255, 117, 140, 0.3);
}

/* Enhanced button hover effects */
.btn:hover {
    transform: translateY(-3px) scale(1.02);
}

/* Enhanced card animations */
.card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
    transform: translateY(-8px) scale(1.02);
}

/* Smooth modal transitions */
.modal {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-content {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
`;

// Inject additional CSS
function injectAdditionalCSS() {
    const style = document.createElement('style');
    style.textContent = additionalCSS;
    document.head.appendChild(style);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new EnhancedThemeManager();
        window.dynamicContent = new ThemeAwareDynamicContent();
        injectAdditionalCSS();
    });
} else {
    window.themeManager = new EnhancedThemeManager();
    window.dynamicContent = new ThemeAwareDynamicContent();
    injectAdditionalCSS();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnhancedThemeManager, ThemeAwareDynamicContent };
}