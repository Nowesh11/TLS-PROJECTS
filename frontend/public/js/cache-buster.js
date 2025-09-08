/**
 * Enhanced Cache Busting Utility
 * Provides comprehensive cache management including service worker cache clearing,
 * version management, and force refresh capabilities
 */

class CacheBuster {
    constructor() {
        this.version = this.generateVersion();
        this.storageKey = 'cacheBuster_version';
        this.init();
    }

    /**
     * Generate a version string based on current timestamp
     */
    generateVersion() {
        return Date.now().toString();
    }

    /**
     * Get stored version or create new one
     */
    getStoredVersion() {
        try {
            return localStorage.getItem(this.storageKey) || this.version;
        } catch (e) {
            return this.version;
        }
    }

    /**
     * Store version in localStorage
     */
    storeVersion(version) {
        try {
            localStorage.setItem(this.storageKey, version);
        } catch (e) {
            console.warn('Could not store cache version:', e);
        }
    }

    /**
     * Initialize cache busting for all CSS and JS files
     */
    init() {
        this.bustCSS();
        this.bustJS();
        this.storeVersion(this.version);
    }

    /**
     * Add version parameters to CSS files
     */
    bustCSS() {
        const cssLinks = document.querySelectorAll('link[rel="stylesheet"][href*="css/"]');
        cssLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.includes('?v=') && !href.includes('cdnjs.cloudflare.com')) {
                link.setAttribute('href', `${href}?v=${this.version}`);
            }
        });
    }

    /**
     * Add version parameters to JS files
     */
    bustJS() {
        const jsScripts = document.querySelectorAll('script[src*="js/"]');
        jsScripts.forEach(script => {
            const src = script.getAttribute('src');
            if (src && !src.includes('?v=') && !src.includes('cdnjs.cloudflare.com')) {
                script.setAttribute('src', `${src}?v=${this.version}`);
            }
        });
    }

    /**
     * Clear all browser caches including service worker caches
     */
    static async clearAllCaches() {
        try {
            // Clear service worker caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
                console.log('Service worker caches cleared');
            }

            // Clear localStorage cache data
            try {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.includes('cache') || key.includes('Cache')) {
                        localStorage.removeItem(key);
                    }
                });
            } catch (e) {
                console.warn('Could not clear localStorage cache data:', e);
            }

            // Clear sessionStorage cache data
            try {
                const keys = Object.keys(sessionStorage);
                keys.forEach(key => {
                    if (key.includes('cache') || key.includes('Cache')) {
                        sessionStorage.removeItem(key);
                    }
                });
            } catch (e) {
                console.warn('Could not clear sessionStorage cache data:', e);
            }

            return true;
        } catch (error) {
            console.error('Error clearing caches:', error);
            return false;
        }
    }

    /**
     * Force reload of specific file types with cache clearing
     */
    static async forceReload(fileType = 'all', clearCaches = true) {
        const version = Date.now().toString();
        
        // Clear caches if requested
        if (clearCaches) {
            await CacheBuster.clearAllCaches();
        }
        
        if (fileType === 'css' || fileType === 'all') {
            const cssLinks = document.querySelectorAll('link[rel="stylesheet"][href*="css/"]');
            cssLinks.forEach(link => {
                const href = link.getAttribute('href').split('?')[0];
                link.setAttribute('href', `${href}?v=${version}&cb=${Date.now()}`);
            });
        }
        
        if (fileType === 'js' || fileType === 'all') {
            // For JS files, we need to reload the page to apply changes
            console.log('JavaScript cache busting requires page refresh');
            if (clearCaches) {
                // Add cache-busting parameter to current URL and reload
                const url = new URL(window.location);
                url.searchParams.set('cb', Date.now());
                window.location.href = url.toString();
            }
        }
    }

    /**
     * Force refresh entire page with cache clearing
     */
    static async forceRefresh() {
        await CacheBuster.clearAllCaches();
        
        // Add cache-busting parameter to current URL
        const url = new URL(window.location);
        url.searchParams.set('cb', Date.now());
        url.searchParams.set('nocache', '1');
        
        // Force reload with no cache
        window.location.replace(url.toString());
    }

    /**
     * Update service worker and force refresh
     */
    static async updateServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    // Force update of service worker
                    await registration.update();
                    
                    // If there's a waiting service worker, activate it
                    if (registration.waiting) {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                    
                    console.log('Service worker updated');
                    return true;
                }
            } catch (error) {
                console.error('Error updating service worker:', error);
            }
        }
        return false;
    }

    /**
     * Check if cache needs to be cleared based on version comparison
     */
    checkCacheVersion() {
        const storedVersion = this.getStoredVersion();
        const currentVersion = this.version;
        
        if (storedVersion !== currentVersion) {
            console.log('Cache version mismatch, clearing caches');
            CacheBuster.clearAllCaches();
            this.storeVersion(currentVersion);
            return true;
        }
        return false;
    }

    /**
     * Get current version
     */
    getVersion() {
        return this.version;
    }

    /**
     * Set up cache management event listeners
     */
    setupEventListeners() {
        // Listen for storage events to sync cache clearing across tabs
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey && e.newValue !== e.oldValue) {
                console.log('Cache version updated in another tab');
                CacheBuster.forceReload('css', false);
            }
        });

        // Listen for service worker updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('Service worker updated, reloading page');
                window.location.reload();
            });
        }
    }
}

// Auto-initialize on DOM content loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.cacheBuster = new CacheBuster();
        window.cacheBuster.setupEventListeners();
        window.cacheBuster.checkCacheVersion();
    });
} else {
    window.cacheBuster = new CacheBuster();
    window.cacheBuster.setupEventListeners();
    window.cacheBuster.checkCacheVersion();
}

// Expose global cache management functions
window.clearAllCaches = CacheBuster.clearAllCaches;
window.forceRefresh = CacheBuster.forceRefresh;
window.updateServiceWorker = CacheBuster.updateServiceWorker;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CacheBuster;
}