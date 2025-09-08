/**
 * DOM Element Caching Utility
 * Optimizes performance by caching frequently accessed DOM elements
 * and reducing repeated querySelector calls
 */

// Prevent duplicate class declarations
if (typeof window.DOMCache === 'undefined') {
    class DOMCache {
    constructor() {
        this.cache = new Map();
        this.observers = new Map();
        this.initialized = false;
    }

    /**
     * Initialize the DOM cache with commonly used elements
     */
    init() {
        if (this.initialized) return;
        
        // Cache common elements that are frequently accessed
        const commonSelectors = [
            // Navigation elements
            '#navbar',
            '#hamburger', 
            '#nav-menu',
            '.nav-link',
            '.hamburger',
            '.nav-menu',
            
            // Theme elements
            '#theme-icon',
            '.theme-toggle',
            '.public-theme-toggle',
            
            // Notification elements
            '#notification-dot',
            '#notification-toast',
            '.notification-icon',
            '#notification-modal',
            '#notifications-list',
            
            // Modal elements
            '.modal',
            '.modal-overlay',
            '.modal-close',
            
            // Form elements
            '#signup-form',
            '#login-form',
            '.form-group',
            '.btn-primary',
            
            // Admin elements
            '#usersTableBody',
            '#teamTableBody',
            '#formsTableBody',
            '.data-table',
            
            // Content elements
            '#charts-container',
            '#projects-grid',
            '.project-card',
            '.filter-btn'
        ];

        this.cacheElements(commonSelectors);
        this.setupMutationObserver();
        this.initialized = true;
    }

    /**
     * Cache elements by selectors
     * @param {string[]} selectors - Array of CSS selectors
     */
    cacheElements(selectors) {
        selectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    this.cache.set(selector, {
                        elements: Array.from(elements),
                        single: elements[0],
                        timestamp: Date.now()
                    });
                }
            } catch (error) {
                console.warn(`Failed to cache selector: ${selector}`, error);
            }
        });
    }

    /**
     * Get cached element(s) by selector
     * @param {string} selector - CSS selector
     * @param {boolean} single - Return single element or all elements
     * @returns {Element|Element[]|null}
     */
    get(selector, single = true) {
        const cached = this.cache.get(selector);
        
        if (cached) {
            // Check if cache is still valid (5 minutes)
            if (Date.now() - cached.timestamp < 300000) {
                return single ? cached.single : cached.elements;
            } else {
                // Cache expired, refresh
                this.refresh(selector);
                const refreshed = this.cache.get(selector);
                return refreshed ? (single ? refreshed.single : refreshed.elements) : null;
            }
        }
        
        // Not cached, query and cache
        return this.queryAndCache(selector, single);
    }

    /**
     * Query DOM and cache the result
     * @param {string} selector - CSS selector
     * @param {boolean} single - Return single element or all elements
     * @returns {Element|Element[]|null}
     */
    queryAndCache(selector, single = true) {
        try {
            const elements = document.querySelectorAll(selector);
            
            if (elements.length > 0) {
                this.cache.set(selector, {
                    elements: Array.from(elements),
                    single: elements[0],
                    timestamp: Date.now()
                });
                
                return single ? elements[0] : Array.from(elements);
            }
        } catch (error) {
            console.warn(`Failed to query selector: ${selector}`, error);
        }
        
        return null;
    }

    /**
     * Refresh cached element(s)
     * @param {string} selector - CSS selector
     */
    refresh(selector) {
        this.cache.delete(selector);
        this.queryAndCache(selector);
    }

    /**
     * Clear all cached elements
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Remove specific cached element
     * @param {string} selector - CSS selector
     */
    remove(selector) {
        this.cache.delete(selector);
    }

    /**
     * Setup mutation observer to invalidate cache when DOM changes
     */
    setupMutationObserver() {
        if (typeof MutationObserver === 'undefined') return;
        
        const observer = new MutationObserver((mutations) => {
            let shouldClearCache = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && 
                    (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
                    shouldClearCache = true;
                }
            });
            
            if (shouldClearCache) {
                // Debounce cache clearing to avoid excessive operations
                clearTimeout(this.clearTimeout);
                this.clearTimeout = setTimeout(() => {
                    this.clearDynamicCache();
                }, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        this.observer = observer;
    }

    /**
     * Clear cache for dynamic elements that might have changed
     */
    clearDynamicCache() {
        const dynamicSelectors = [
            '.modal',
            '.project-card',
            '.team-card',
            '.notification-item',
            '.form-field',
            '.table-row'
        ];
        
        dynamicSelectors.forEach(selector => {
            this.cache.delete(selector);
        });
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            initialized: this.initialized
        };
    }

    /**
     * Destroy the cache and cleanup
     */
    destroy() {
        this.clear();
        if (this.observer) {
            this.observer.disconnect();
        }
        clearTimeout(this.clearTimeout);
        this.initialized = false;
    }
}

// Create global instance
window.domCache = new DOMCache();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.domCache.init();
    });
} else {
    window.domCache.init();
}

// Utility functions for backward compatibility
window.$ = window.$ || function(selector, single = true) {
    return window.domCache.get(selector, single);
};

window.$$ = window.$$ || function(selector) {
    return window.domCache.get(selector, false);
};

    // Export for module systems
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = DOMCache;
    }

    // Make DOMCache available globally
    window.DOMCache = DOMCache;
}

console.log('DOM Cache utility loaded successfully');