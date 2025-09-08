/**
 * Event Listener Management Utility
 * Prevents memory leaks, manages event listeners efficiently,
 * and provides cleanup mechanisms for dynamic content
 */

// Prevent duplicate class declarations
if (typeof window.EventManager === 'undefined') {
    class EventManager {
    constructor() {
        this.listeners = new Map();
        this.delegatedListeners = new Map();
        this.initialized = false;
    }

    /**
     * Initialize the event manager
     */
    init() {
        if (this.initialized) return;
        
        // Setup cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
        
        this.initialized = true;
    }

    /**
     * Add event listener with automatic cleanup tracking
     * @param {Element|string} target - Element or selector
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object|boolean} options - Event options
     * @param {string} namespace - Optional namespace for grouping
     * @returns {string} Listener ID for removal
     */
    on(target, event, handler, options = {}, namespace = 'default') {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        
        if (!element) {
            console.warn(`EventManager: Target element not found for selector: ${target}`);
            return null;
        }

        const listenerId = this.generateListenerId(element, event, namespace);
        
        // Check if listener already exists
        if (this.listeners.has(listenerId)) {
            console.warn(`EventManager: Listener already exists for ${listenerId}`);
            return listenerId;
        }

        // Wrap handler for cleanup tracking
        const wrappedHandler = (e) => {
            try {
                handler.call(element, e);
            } catch (error) {
                console.error(`EventManager: Error in event handler for ${event}:`, error);
            }
        };

        element.addEventListener(event, wrappedHandler, options);
        
        this.listeners.set(listenerId, {
            element,
            event,
            handler: wrappedHandler,
            originalHandler: handler,
            options,
            namespace,
            timestamp: Date.now()
        });

        return listenerId;
    }

    /**
     * Remove specific event listener
     * @param {string} listenerId - Listener ID returned by on()
     */
    off(listenerId) {
        const listener = this.listeners.get(listenerId);
        
        if (listener) {
            listener.element.removeEventListener(listener.event, listener.handler, listener.options);
            this.listeners.delete(listenerId);
            return true;
        }
        
        return false;
    }

    /**
     * Remove all listeners for a specific element
     * @param {Element|string} target - Element or selector
     */
    offElement(target) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        
        if (!element) return;

        const toRemove = [];
        
        this.listeners.forEach((listener, id) => {
            if (listener.element === element) {
                toRemove.push(id);
            }
        });
        
        toRemove.forEach(id => this.off(id));
    }

    /**
     * Remove all listeners in a namespace
     * @param {string} namespace - Namespace to clear
     */
    offNamespace(namespace) {
        const toRemove = [];
        
        this.listeners.forEach((listener, id) => {
            if (listener.namespace === namespace) {
                toRemove.push(id);
            }
        });
        
        toRemove.forEach(id => this.off(id));
    }

    /**
     * Add delegated event listener for dynamic content
     * @param {Element|string} container - Container element or selector
     * @param {string} selector - Child selector to match
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {string} namespace - Optional namespace
     * @returns {string} Delegated listener ID
     */
    delegate(container, selector, event, handler, namespace = 'default') {
        const containerElement = typeof container === 'string' ? document.querySelector(container) : container;
        
        if (!containerElement) {
            console.warn(`EventManager: Container element not found for selector: ${container}`);
            return null;
        }

        const delegatedId = this.generateDelegatedId(containerElement, selector, event, namespace);
        
        // Check if delegated listener already exists
        if (this.delegatedListeners.has(delegatedId)) {
            console.warn(`EventManager: Delegated listener already exists for ${delegatedId}`);
            return delegatedId;
        }

        const delegatedHandler = (e) => {
            const target = e.target.closest(selector);
            if (target && containerElement.contains(target)) {
                try {
                    handler.call(target, e);
                } catch (error) {
                    console.error(`EventManager: Error in delegated handler for ${event}:`, error);
                }
            }
        };

        containerElement.addEventListener(event, delegatedHandler, true);
        
        this.delegatedListeners.set(delegatedId, {
            container: containerElement,
            selector,
            event,
            handler: delegatedHandler,
            originalHandler: handler,
            namespace,
            timestamp: Date.now()
        });

        return delegatedId;
    }

    /**
     * Remove delegated event listener
     * @param {string} delegatedId - Delegated listener ID
     */
    undelegate(delegatedId) {
        const listener = this.delegatedListeners.get(delegatedId);
        
        if (listener) {
            listener.container.removeEventListener(listener.event, listener.handler, true);
            this.delegatedListeners.delete(delegatedId);
            return true;
        }
        
        return false;
    }

    /**
     * Add one-time event listener that auto-removes after execution
     * @param {Element|string} target - Element or selector
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     * @returns {string} Listener ID
     */
    once(target, event, handler, options = {}) {
        const onceHandler = (e) => {
            handler.call(this, e);
            this.off(listenerId);
        };
        
        const listenerId = this.on(target, event, onceHandler, options, 'once');
        return listenerId;
    }

    /**
     * Add throttled event listener
     * @param {Element|string} target - Element or selector
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {number} delay - Throttle delay in milliseconds
     * @param {Object} options - Event options
     * @returns {string} Listener ID
     */
    throttle(target, event, handler, delay = 100, options = {}) {
        let lastCall = 0;
        
        const throttledHandler = (e) => {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                handler.call(this, e);
            }
        };
        
        return this.on(target, event, throttledHandler, options, 'throttled');
    }

    /**
     * Add debounced event listener
     * @param {Element|string} target - Element or selector
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {number} delay - Debounce delay in milliseconds
     * @param {Object} options - Event options
     * @returns {string} Listener ID
     */
    debounce(target, event, handler, delay = 300, options = {}) {
        let timeoutId;
        
        const debouncedHandler = (e) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                handler.call(this, e);
            }, delay);
        };
        
        return this.on(target, event, debouncedHandler, options, 'debounced');
    }

    /**
     * Generate unique listener ID
     * @param {Element} element - Target element
     * @param {string} event - Event type
     * @param {string} namespace - Namespace
     * @returns {string} Unique ID
     */
    generateListenerId(element, event, namespace) {
        const elementId = element.id || element.tagName + '_' + Date.now();
        return `${namespace}_${elementId}_${event}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate unique delegated listener ID
     * @param {Element} container - Container element
     * @param {string} selector - Child selector
     * @param {string} event - Event type
     * @param {string} namespace - Namespace
     * @returns {string} Unique ID
     */
    generateDelegatedId(container, selector, event, namespace) {
        const containerId = container.id || container.tagName + '_' + Date.now();
        return `${namespace}_delegated_${containerId}_${selector}_${event}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get statistics about managed listeners
     * @returns {Object} Statistics
     */
    getStats() {
        return {
            totalListeners: this.listeners.size,
            delegatedListeners: this.delegatedListeners.size,
            namespaces: this.getNamespaces(),
            initialized: this.initialized
        };
    }

    /**
     * Get all active namespaces
     * @returns {string[]} Array of namespaces
     */
    getNamespaces() {
        const namespaces = new Set();
        
        this.listeners.forEach(listener => {
            namespaces.add(listener.namespace);
        });
        
        this.delegatedListeners.forEach(listener => {
            namespaces.add(listener.namespace);
        });
        
        return Array.from(namespaces);
    }

    /**
     * Clean up all event listeners
     */
    cleanup() {
        // Remove all regular listeners
        this.listeners.forEach((listener, id) => {
            this.off(id);
        });
        
        // Remove all delegated listeners
        this.delegatedListeners.forEach((listener, id) => {
            this.undelegate(id);
        });
        
        console.log('EventManager: All listeners cleaned up');
    }

    /**
     * Clean up old listeners (older than specified time)
     * @param {number} maxAge - Maximum age in milliseconds
     */
    cleanupOld(maxAge = 3600000) { // 1 hour default
        const now = Date.now();
        const toRemove = [];
        
        this.listeners.forEach((listener, id) => {
            if (now - listener.timestamp > maxAge) {
                toRemove.push(id);
            }
        });
        
        toRemove.forEach(id => this.off(id));
        
        console.log(`EventManager: Cleaned up ${toRemove.length} old listeners`);
    }
}

// Make EventManager available globally
window.EventManager = EventManager;

// Create global instance
window.eventManager = new EventManager();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.eventManager.init();
    });
} else {
    window.eventManager.init();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventManager;
}
}

console.log('Event Manager utility loaded successfully');