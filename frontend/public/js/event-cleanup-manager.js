/**
 * Event Cleanup Manager
 * Manages event listener cleanup, prevents memory leaks, and removes duplicate listeners
 */

class EventCleanupManager {
    constructor() {
        this.registeredListeners = new Map();
        this.dynamicElements = new WeakSet();
        this.cleanupCallbacks = new Set();
        this.observedElements = new WeakMap();
        this.mutationObserver = null;
        this.initialized = false;
    }

    /**
     * Initialize the cleanup manager
     */
    init() {
        if (this.initialized) return;
        
        this.setupMutationObserver();
        this.setupPageUnloadCleanup();
        this.scanExistingElements();
        this.initialized = true;
        
        console.log('Event Cleanup Manager initialized');
    }

    /**
     * Setup mutation observer to track dynamic elements
     */
    setupMutationObserver() {
        this.mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                // Handle removed nodes
                mutation.removedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.cleanupRemovedElement(node);
                    }
                });
                
                // Handle added nodes
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.trackDynamicElement(node);
                    }
                });
            });
        });
        
        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Setup cleanup on page unload
     */
    setupPageUnloadCleanup() {
        const cleanup = () => this.cleanupAll();
        
        window.addEventListener('beforeunload', cleanup);
        window.addEventListener('pagehide', cleanup);
        
        // Also cleanup on navigation for SPAs
        if (window.history && window.history.pushState) {
            const originalPushState = window.history.pushState;
            window.history.pushState = function(...args) {
                cleanup();
                return originalPushState.apply(this, args);
            };
        }
    }

    /**
     * Scan existing elements for cleanup opportunities
     */
    scanExistingElements() {
        // Find elements with duplicate event listeners
        this.findDuplicateListeners();
        
        // Find elements with inline handlers that should be converted
        this.findInlineHandlers();
        
        // Track existing dynamic elements
        const dynamicSelectors = [
            '[data-dynamic]',
            '.modal',
            '.popup',
            '.dropdown-menu',
            '.toast',
            '.notification',
            '.dynamic-content'
        ];
        
        dynamicSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                this.trackDynamicElement(element);
            });
        });
    }

    /**
     * Find and report duplicate event listeners
     */
    findDuplicateListeners() {
        const potentialDuplicates = [
            'click',
            'submit',
            'change',
            'input',
            'focus',
            'blur'
        ];
        
        potentialDuplicates.forEach(eventType => {
            const elements = document.querySelectorAll(`[data-${eventType}-handler]`);
            elements.forEach(element => {
                const handlerCount = this.getEventListenerCount(element, eventType);
                if (handlerCount > 1) {
                    console.warn(`Potential duplicate ${eventType} listeners on:`, element);
                    this.removeDuplicateListeners(element, eventType);
                }
            });
        });
    }

    /**
     * Find inline event handlers
     */
    findInlineHandlers() {
        const inlineEvents = [
            'onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur',
            'onchange', 'oninput', 'onsubmit', 'onload', 'onresize'
        ];
        
        inlineEvents.forEach(eventAttr => {
            const elements = document.querySelectorAll(`[${eventAttr}]`);
            if (elements.length > 0) {
                console.log(`Found ${elements.length} elements with ${eventAttr} handlers`);
            }
        });
    }

    /**
     * Track a dynamic element for cleanup
     */
    trackDynamicElement(element) {
        if (this.dynamicElements.has(element)) return;
        
        this.dynamicElements.add(element);
        
        // Store reference for cleanup
        const elementId = this.generateElementId(element);
        this.observedElements.set(element, {
            id: elementId,
            listeners: new Set(),
            cleanupCallbacks: new Set()
        });
    }

    /**
     * Register an event listener for cleanup tracking
     */
    registerListener(element, eventType, handler, options = {}) {
        const elementData = this.observedElements.get(element);
        if (!elementData) {
            this.trackDynamicElement(element);
        }
        
        const listenerId = this.generateListenerId(element, eventType, handler);
        const listenerInfo = {
            id: listenerId,
            element,
            eventType,
            handler,
            options,
            timestamp: Date.now()
        };
        
        this.registeredListeners.set(listenerId, listenerInfo);
        
        if (elementData) {
            elementData.listeners.add(listenerId);
        }
        
        return listenerId;
    }

    /**
     * Remove a registered listener
     */
    removeListener(listenerId) {
        const listenerInfo = this.registeredListeners.get(listenerId);
        if (!listenerInfo) return false;
        
        const { element, eventType, handler, options } = listenerInfo;
        
        try {
            element.removeEventListener(eventType, handler, options);
            this.registeredListeners.delete(listenerId);
            
            const elementData = this.observedElements.get(element);
            if (elementData) {
                elementData.listeners.delete(listenerId);
            }
            
            return true;
        } catch (error) {
            console.warn('Failed to remove event listener:', error);
            return false;
        }
    }

    /**
     * Clean up removed element
     */
    cleanupRemovedElement(element) {
        const elementData = this.observedElements.get(element);
        if (!elementData) return;
        
        // Remove all listeners for this element
        elementData.listeners.forEach(listenerId => {
            this.removeListener(listenerId);
        });
        
        // Execute cleanup callbacks
        elementData.cleanupCallbacks.forEach(callback => {
            try {
                callback(element);
            } catch (error) {
                console.warn('Cleanup callback failed:', error);
            }
        });
        
        // Clean up references
        this.observedElements.delete(element);
        this.dynamicElements.delete(element);
    }

    /**
     * Remove duplicate listeners from an element
     */
    removeDuplicateListeners(element, eventType) {
        const listeners = Array.from(this.registeredListeners.values())
            .filter(info => info.element === element && info.eventType === eventType)
            .sort((a, b) => a.timestamp - b.timestamp);
        
        // Keep the first listener, remove duplicates
        for (let i = 1; i < listeners.length; i++) {
            this.removeListener(listeners[i].id);
            console.log(`Removed duplicate ${eventType} listener from:`, element);
        }
    }

    /**
     * Add cleanup callback for an element
     */
    addCleanupCallback(element, callback) {
        const elementData = this.observedElements.get(element);
        if (elementData) {
            elementData.cleanupCallbacks.add(callback);
        } else {
            this.trackDynamicElement(element);
            this.addCleanupCallback(element, callback);
        }
    }

    /**
     * Get estimated event listener count (approximation)
     */
    getEventListenerCount(element, eventType) {
        return Array.from(this.registeredListeners.values())
            .filter(info => info.element === element && info.eventType === eventType)
            .length;
    }

    /**
     * Generate unique element ID
     */
    generateElementId(element) {
        return `element_${element.tagName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate unique listener ID
     */
    generateListenerId(element, eventType, handler) {
        const elementId = element.id || element.className || element.tagName;
        const handlerStr = handler.toString().substring(0, 50);
        return `${elementId}_${eventType}_${btoa(handlerStr).substring(0, 10)}_${Date.now()}`;
    }

    /**
     * Clean up all tracked listeners and elements
     */
    cleanupAll() {
        console.log(`Cleaning up ${this.registeredListeners.size} event listeners`);
        
        // Remove all registered listeners
        this.registeredListeners.forEach((listenerInfo, listenerId) => {
            this.removeListener(listenerId);
        });
        
        // Execute global cleanup callbacks
        this.cleanupCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.warn('Global cleanup callback failed:', error);
            }
        });
        
        // Disconnect mutation observer
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
        
        // Clear all references
        this.registeredListeners.clear();
        this.cleanupCallbacks.clear();
        
        console.log('Event cleanup completed');
    }

    /**
     * Get cleanup statistics
     */
    getStats() {
        return {
            registeredListeners: this.registeredListeners.size,
            trackedElements: this.observedElements.size || 0,
            cleanupCallbacks: this.cleanupCallbacks.size
        };
    }

    /**
     * Force cleanup of specific element type
     */
    cleanupElementType(selector) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            this.cleanupRemovedElement(element);
        });
        console.log(`Cleaned up ${elements.length} elements matching: ${selector}`);
    }
}

// Create global instance
if (!window.eventCleanupManager) {
    window.eventCleanupManager = new EventCleanupManager();
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.eventCleanupManager.init();
        });
    } else {
        window.eventCleanupManager.init();
    }
}

// Export for manual use
window.EventCleanupManager = EventCleanupManager;