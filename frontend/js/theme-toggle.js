/**
 * TLS Theme Toggle System
 * Handles light/dark theme switching with persistent storage
 * and smooth transitions across the entire application
 */

class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.storageKey = 'tls-theme-preference';
        this.themeToggleButton = null;
        
        this.init();
    }

    /**
     * Initialize the theme system
     */
    init() {
        // Load saved theme or detect system preference
        this.loadTheme();
        
        // Create theme toggle button
        this.createThemeToggle();
        
        // Apply theme to document
        this.applyTheme(this.currentTheme);
        
        // Listen for system theme changes
        this.listenForSystemThemeChanges();
        
        // Add keyboard shortcut (Ctrl/Cmd + Shift + T)
        this.addKeyboardShortcut();
        
        console.log(`🎨 TLS Theme System initialized with ${this.currentTheme} theme`);
    }

    /**
     * Load theme from localStorage or detect system preference
     */
    loadTheme() {
        const savedTheme = localStorage.getItem(this.storageKey);
        
        if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
            this.currentTheme = savedTheme;
        } else {
            // Detect system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.currentTheme = prefersDark ? 'dark' : 'light';
        }
    }

    /**
     * Apply theme to the document
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.className = document.body.className.replace(/theme-\w+/g, '') + ` theme-${theme}`;
        
        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(theme);
        
        // Update theme toggle button icon
        this.updateToggleIcon(theme);
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme, previousTheme: this.currentTheme }
        }));
        
        this.currentTheme = theme;
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    /**
     * Set specific theme
     */
    setTheme(theme) {
        if (!['light', 'dark'].includes(theme)) {
            console.warn(`Invalid theme: ${theme}. Using 'light' instead.`);
            theme = 'light';
        }
        
        this.applyTheme(theme);
        localStorage.setItem(this.storageKey, theme);
        
        // Add transition class for smooth theme switching
        document.body.classList.add('theme-transitioning');
        setTimeout(() => {
            document.body.classList.remove('theme-transitioning');
        }, 300);
    }

    /**
     * Create floating theme toggle button
     */
    createThemeToggle() {
        // Remove existing toggle if present
        const existingToggle = document.querySelector('.theme-toggle');
        if (existingToggle) {
            existingToggle.remove();
        }

        // Create toggle button
        this.themeToggleButton = document.createElement('button');
        this.themeToggleButton.className = 'theme-toggle';
        this.themeToggleButton.setAttribute('aria-label', 'Toggle theme');
        this.themeToggleButton.setAttribute('title', 'Toggle light/dark theme (Ctrl+Shift+T)');
        
        // Add click handler
        this.themeToggleButton.addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Add to document
        document.body.appendChild(this.themeToggleButton);
        
        // Update icon
        this.updateToggleIcon(this.currentTheme);
    }

    /**
     * Update theme toggle button icon
     */
    updateToggleIcon(theme) {
        if (!this.themeToggleButton) return;
        
        const sunIcon = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>
            </svg>
        `;
        
        const moonIcon = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clip-rule="evenodd"/>
            </svg>
        `;
        
        this.themeToggleButton.innerHTML = theme === 'light' ? moonIcon : sunIcon;
    }

    /**
     * Update meta theme-color for mobile browsers
     */
    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        const colors = {
            light: '#FFFFFF',
            dark: '#0F172A'
        };
        
        metaThemeColor.content = colors[theme];
    }

    /**
     * Listen for system theme changes
     */
    listenForSystemThemeChanges() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        mediaQuery.addEventListener('change', (e) => {
            // Only auto-switch if user hasn't manually set a preference
            if (!localStorage.getItem(this.storageKey)) {
                const newTheme = e.matches ? 'dark' : 'light';
                this.setTheme(newTheme);
            }
        });
    }

    /**
     * Add keyboard shortcut for theme toggle
     */
    addKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+T (or Cmd+Shift+T on Mac)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Check if current theme is dark
     */
    isDarkTheme() {
        return this.currentTheme === 'dark';
    }

    /**
     * Reset theme preference (will use system preference)
     */
    resetThemePreference() {
        localStorage.removeItem(this.storageKey);
        this.loadTheme();
        this.applyTheme(this.currentTheme);
    }
}

/**
 * Chart Theme Integration
 * Updates Chart.js default colors based on current theme
 */
class ChartThemeManager {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.init();
    }

    init() {
        // Listen for theme changes
        window.addEventListener('themeChanged', (e) => {
            this.updateChartDefaults(e.detail.theme);
        });
        
        // Set initial chart theme
        this.updateChartDefaults(this.themeManager.getCurrentTheme());
    }

    updateChartDefaults(theme) {
        if (typeof Chart === 'undefined') return;
        
        const colors = this.getThemeColors(theme);
        
        // Update Chart.js defaults
        Chart.defaults.color = colors.text;
        Chart.defaults.borderColor = colors.border;
        Chart.defaults.backgroundColor = colors.background;
        
        // Update grid colors
        Chart.defaults.scales.category.grid.color = colors.grid;
        Chart.defaults.scales.linear.grid.color = colors.grid;
        
        // Trigger chart updates
        this.updateExistingCharts();
    }

    getThemeColors(theme) {
        // Get colors from CSS variables instead of hardcoded values
        const root = document.documentElement;
        const getVar = (varName) => getComputedStyle(root).getPropertyValue(varName).trim();
        
        return {
            text: getVar('--text-primary') || (theme === 'dark' ? '#E2E8F0' : '#2B3B58'),
            border: getVar('--border-secondary') || (theme === 'dark' ? '#334155' : '#E2E8F0'),
            background: getVar('--chart-bg') || (theme === 'dark' ? 'rgba(255, 75, 92, 0.1)' : 'rgba(74, 144, 226, 0.1)'),
            grid: getVar('--border-light') || (theme === 'dark' ? '#1E293B' : '#F1F5F9'),
            primary: getVar('--primary-color') || (theme === 'dark' ? '#FF4B5C' : '#4A90E2'),
            secondary: getVar('--secondary-color') || (theme === 'dark' ? '#7A1515' : '#182657')
        };
    }

    updateExistingCharts() {
        // Update all existing Chart.js instances
        if (typeof Chart !== 'undefined' && Chart.instances) {
            Object.values(Chart.instances).forEach(chart => {
                if (chart && chart.update) {
                    chart.update('none'); // Update without animation
                }
            });
        }
    }
}

/**
 * Initialize theme system when DOM is ready
 */
function initializeThemeSystem() {
    const themeManager = new ThemeManager();
    const chartThemeManager = new ChartThemeManager(themeManager);
    
    // Make theme manager globally available
    window.TLSTheme = themeManager;
    window.TLSChartTheme = chartThemeManager;
    
    // Add CSS for smooth transitions
    const transitionStyles = document.createElement('style');
    transitionStyles.textContent = `
        .theme-transitioning * {
            transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease !important;
        }
        
        .theme-toggle {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1030;
            background: var(--panel-bg);
            border: 1px solid var(--border);
            border-radius: 50%;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: var(--shadow-md);
            transition: all var(--transition-fast);
        }
        
        .theme-toggle:hover {
            box-shadow: var(--shadow-lg), var(--glow);
            transform: scale(1.05);
        }
        
        .theme-toggle svg {
            width: 24px;
            height: 24px;
            color: var(--text-primary);
            transition: all var(--transition-fast);
        }
        
        @media (max-width: 768px) {
            .theme-toggle {
                top: 15px;
                right: 15px;
                width: 45px;
                height: 45px;
            }
            
            .theme-toggle svg {
                width: 20px;
                height: 20px;
            }
        }
    `;
    document.head.appendChild(transitionStyles);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeThemeSystem);
} else {
    initializeThemeSystem();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ThemeManager, ChartThemeManager };
}