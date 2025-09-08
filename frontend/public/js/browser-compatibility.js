/**
 * Browser Compatibility Utility
 * Ensures consistent behavior across different browsers
 */

class BrowserCompatibility {
    constructor() {
        this.browserInfo = this.detectBrowser();
        this.initializeCompatibilityFixes();
    }

    /**
     * Detect current browser and version
     */
    detectBrowser() {
        const userAgent = navigator.userAgent;
        let browser = 'Unknown';
        let version = 'Unknown';
        let engine = 'Unknown';

        // Chrome
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
            browser = 'Chrome';
            const match = userAgent.match(/Chrome\/(\d+)/);
            version = match ? match[1] : 'Unknown';
            engine = 'Blink';
        }
        // Firefox
        else if (userAgent.includes('Firefox')) {
            browser = 'Firefox';
            const match = userAgent.match(/Firefox\/(\d+)/);
            version = match ? match[1] : 'Unknown';
            engine = 'Gecko';
        }
        // Safari
        else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            browser = 'Safari';
            const match = userAgent.match(/Version\/(\d+)/);
            version = match ? match[1] : 'Unknown';
            engine = 'WebKit';
        }
        // Edge
        else if (userAgent.includes('Edg')) {
            browser = 'Edge';
            const match = userAgent.match(/Edg\/(\d+)/);
            version = match ? match[1] : 'Unknown';
            engine = 'Blink';
        }
        // Internet Explorer
        else if (userAgent.includes('Trident') || userAgent.includes('MSIE')) {
            browser = 'Internet Explorer';
            const match = userAgent.match(/(?:MSIE |rv:)(\d+)/);
            version = match ? match[1] : 'Unknown';
            engine = 'Trident';
        }

        return { browser, version: parseInt(version), engine, userAgent };
    }

    /**
     * Initialize browser-specific compatibility fixes
     */
    initializeCompatibilityFixes() {
        this.addCSSCompatibility();
        this.addJavaScriptCompatibility();
        this.addEventCompatibility();
        this.addFetchCompatibility();
        this.addStorageCompatibility();
    }

    /**
     * Add CSS compatibility fixes
     */
    addCSSCompatibility() {
        const style = document.createElement('style');
        let css = '';

        // Flexbox fixes for older browsers
        css += `
            .flex-container {
                display: -webkit-box;
                display: -webkit-flex;
                display: -ms-flexbox;
                display: flex;
            }
            
            .flex-item {
                -webkit-box-flex: 1;
                -webkit-flex: 1;
                -ms-flex: 1;
                flex: 1;
            }
        `;

        // Grid fallbacks
        css += `
            .grid-container {
                display: -ms-grid;
                display: grid;
            }
        `;

        // Transform prefixes
        css += `
            .transform {
                -webkit-transform: var(--transform-value);
                -moz-transform: var(--transform-value);
                -ms-transform: var(--transform-value);
                transform: var(--transform-value);
            }
        `;

        style.textContent = css;
        document.head.appendChild(style);
    }

    /**
     * Add JavaScript compatibility polyfills
     */
    addJavaScriptCompatibility() {
        // Array.from polyfill
        if (!Array.from) {
            Array.from = function(arrayLike) {
                return Array.prototype.slice.call(arrayLike);
            };
        }

        // Object.assign polyfill
        if (!Object.assign) {
            Object.assign = function(target) {
                for (let i = 1; i < arguments.length; i++) {
                    const source = arguments[i];
                    for (const key in source) {
                        if (source.hasOwnProperty(key)) {
                            target[key] = source[key];
                        }
                    }
                }
                return target;
            };
        }

        // String.includes polyfill
        if (!String.prototype.includes) {
            String.prototype.includes = function(search, start) {
                if (typeof start !== 'number') {
                    start = 0;
                }
                return this.indexOf(search, start) !== -1;
            };
        }

        // Array.includes polyfill
        if (!Array.prototype.includes) {
            Array.prototype.includes = function(searchElement, fromIndex) {
                return this.indexOf(searchElement, fromIndex) !== -1;
            };
        }
    }

    /**
     * Add event compatibility fixes
     */
    addEventCompatibility() {
        // CustomEvent polyfill for IE
        if (typeof window.CustomEvent !== 'function') {
            function CustomEvent(event, params) {
                params = params || { bubbles: false, cancelable: false, detail: undefined };
                const evt = document.createEvent('CustomEvent');
                evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
                return evt;
            }
            CustomEvent.prototype = window.Event.prototype;
            window.CustomEvent = CustomEvent;
        }

        // addEventListener compatibility
        if (!Element.prototype.addEventListener) {
            Element.prototype.addEventListener = function(type, listener) {
                this.attachEvent('on' + type, listener);
            };
        }

        if (!Element.prototype.removeEventListener) {
            Element.prototype.removeEventListener = function(type, listener) {
                this.detachEvent('on' + type, listener);
            };
        }
    }

    /**
     * Add fetch API compatibility
     */
    addFetchCompatibility() {
        if (!window.fetch) {
            window.fetch = function(url, options = {}) {
                return new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    const method = options.method || 'GET';
                    
                    xhr.open(method, url);
                    
                    // Set headers
                    if (options.headers) {
                        Object.keys(options.headers).forEach(key => {
                            xhr.setRequestHeader(key, options.headers[key]);
                        });
                    }
                    
                    xhr.onload = function() {
                        const response = {
                            ok: xhr.status >= 200 && xhr.status < 300,
                            status: xhr.status,
                            statusText: xhr.statusText,
                            json: () => Promise.resolve(JSON.parse(xhr.responseText)),
                            text: () => Promise.resolve(xhr.responseText)
                        };
                        resolve(response);
                    };
                    
                    xhr.onerror = () => reject(new Error('Network error'));
                    xhr.send(options.body);
                });
            };
        }
    }

    /**
     * Add localStorage compatibility
     */
    addStorageCompatibility() {
        if (!window.localStorage) {
            window.localStorage = {
                _data: {},
                setItem: function(key, value) {
                    this._data[key] = String(value);
                },
                getItem: function(key) {
                    return this._data[key] || null;
                },
                removeItem: function(key) {
                    delete this._data[key];
                },
                clear: function() {
                    this._data = {};
                }
            };
        }
    }

    /**
     * Check if browser supports specific features
     */
    checkFeatureSupport() {
        const features = {
            flexbox: this.supportsFlexbox(),
            grid: this.supportsGrid(),
            customProperties: this.supportsCustomProperties(),
            fetch: typeof window.fetch === 'function',
            localStorage: typeof window.localStorage === 'object',
            webGL: this.supportsWebGL(),
            webWorkers: typeof Worker !== 'undefined',
            serviceWorkers: 'serviceWorker' in navigator,
            intersectionObserver: 'IntersectionObserver' in window,
            mutationObserver: 'MutationObserver' in window
        };

        return features;
    }

    /**
     * Check flexbox support
     */
    supportsFlexbox() {
        const element = document.createElement('div');
        element.style.display = 'flex';
        return element.style.display === 'flex';
    }

    /**
     * Check CSS Grid support
     */
    supportsGrid() {
        const element = document.createElement('div');
        element.style.display = 'grid';
        return element.style.display === 'grid';
    }

    /**
     * Check CSS custom properties support
     */
    supportsCustomProperties() {
        return window.CSS && CSS.supports && CSS.supports('color', 'var(--test)');
    }

    /**
     * Check WebGL support
     */
    supportsWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }

    /**
     * Get browser compatibility report
     */
    getCompatibilityReport() {
        const features = this.checkFeatureSupport();
        const unsupportedFeatures = Object.keys(features).filter(key => !features[key]);
        
        return {
            browser: this.browserInfo,
            features,
            unsupportedFeatures,
            isModern: unsupportedFeatures.length < 3,
            recommendations: this.getRecommendations(unsupportedFeatures)
        };
    }

    /**
     * Get recommendations for unsupported features
     */
    getRecommendations(unsupportedFeatures) {
        const recommendations = [];
        
        if (unsupportedFeatures.includes('flexbox')) {
            recommendations.push('Consider using float-based layouts as fallback');
        }
        
        if (unsupportedFeatures.includes('grid')) {
            recommendations.push('Use flexbox or float layouts instead of CSS Grid');
        }
        
        if (unsupportedFeatures.includes('fetch')) {
            recommendations.push('XMLHttpRequest polyfill has been applied');
        }
        
        if (unsupportedFeatures.includes('localStorage')) {
            recommendations.push('localStorage polyfill has been applied');
        }
        
        return recommendations;
    }

    /**
     * Apply browser-specific fixes
     */
    applyBrowserFixes() {
        const { browser, version } = this.browserInfo;
        
        // Internet Explorer fixes
        if (browser === 'Internet Explorer') {
            this.applyIEFixes(version);
        }
        
        // Safari fixes
        if (browser === 'Safari') {
            this.applySafariFixes(version);
        }
        
        // Firefox fixes
        if (browser === 'Firefox') {
            this.applyFirefoxFixes(version);
        }
    }

    /**
     * Apply Internet Explorer specific fixes
     */
    applyIEFixes(version) {
        // Add IE-specific CSS class
        document.documentElement.classList.add('ie', `ie${version}`);
        
        // Fix console.log for IE
        if (!window.console) {
            window.console = {
                log: function() {},
                error: function() {},
                warn: function() {},
                info: function() {}
            };
        }
    }

    /**
     * Apply Safari specific fixes
     */
    applySafariFixes(version) {
        document.documentElement.classList.add('safari', `safari${version}`);
        
        // Fix date input for older Safari
        if (version < 14) {
            const dateInputs = document.querySelectorAll('input[type="date"]');
            dateInputs.forEach(input => {
                input.type = 'text';
                input.placeholder = 'YYYY-MM-DD';
            });
        }
    }

    /**
     * Apply Firefox specific fixes
     */
    applyFirefoxFixes(version) {
        document.documentElement.classList.add('firefox', `firefox${version}`);
    }

    /**
     * Initialize browser compatibility on page load
     */
    static initialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                window.browserCompatibility = new BrowserCompatibility();
                window.browserCompatibility.applyBrowserFixes();
            });
        } else {
            window.browserCompatibility = new BrowserCompatibility();
            window.browserCompatibility.applyBrowserFixes();
        }
    }
}

// Auto-initialize
BrowserCompatibility.initialize();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrowserCompatibility;
}