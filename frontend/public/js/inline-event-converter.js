/**
 * Inline Event Handler Converter
 * Converts inline event handlers (onclick, onmouseover, etc.) to proper event listeners
 * for better performance and memory management
 */

class InlineEventConverter {
    constructor() {
        this.convertedElements = new Set();
        this.eventHandlers = new Map();
    }

    /**
     * Convert all inline event handlers in the document to proper event listeners
     */
    convertAllInlineEvents() {
        const inlineEventAttributes = [
            'onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur',
            'onchange', 'oninput', 'onsubmit', 'onload', 'onresize',
            'onscroll', 'onkeydown', 'onkeyup', 'onkeypress'
        ];

        inlineEventAttributes.forEach(eventAttr => {
            this.convertInlineEventAttribute(eventAttr);
        });

        console.log(`Converted ${this.convertedElements.size} elements with inline event handlers`);
    }

    /**
     * Convert specific inline event attribute to proper event listeners
     */
    convertInlineEventAttribute(eventAttribute) {
        const eventType = eventAttribute.substring(2); // Remove 'on' prefix
        const selector = `[${eventAttribute}]`;
        const elements = document.querySelectorAll(selector);

        elements.forEach(element => {
            if (this.convertedElements.has(element)) return;

            const handlerCode = element.getAttribute(eventAttribute);
            if (!handlerCode) return;

            try {
                // Create a proper event handler function
                const handler = this.createEventHandler(handlerCode, element);
                
                // Add managed event listener
                if (window.eventManager) {
                    const listenerId = window.eventManager.on(
                        element, 
                        eventType, 
                        handler, 
                        {}, 
                        'inline-converted'
                    );
                    this.eventHandlers.set(`${element.tagName}_${Date.now()}`, listenerId);
                } else {
                    element.addEventListener(eventType, handler);
                }

                // Remove the inline attribute
                element.removeAttribute(eventAttribute);
                this.convertedElements.add(element);

                console.log(`Converted ${eventAttribute} on ${element.tagName}`);
            } catch (error) {
                console.warn(`Failed to convert ${eventAttribute} on ${element.tagName}:`, error);
            }
        });
    }

    /**
     * Create a proper event handler function from inline code
     */
    createEventHandler(handlerCode, element) {
        return function(event) {
            try {
                // Create a context where 'this' refers to the element
                const func = new Function('event', `
                    const element = arguments[1];
                    with(element) {
                        ${handlerCode}
                    }
                `);
                func.call(element, event, element);
            } catch (error) {
                console.error('Error executing converted event handler:', error);
            }
        };
    }

    /**
     * Convert hover effects to CSS classes for better performance
     */
    convertHoverEffectsToCSS() {
        // Add CSS for common hover effects
        const style = document.createElement('style');
        style.textContent = `
            .hover-lift {
                transition: all 0.3s ease;
            }
            .hover-lift:hover {
                transform: translateY(-5px);
                box-shadow: var(--glow-primary, 0 10px 25px rgba(0,0,0,0.15));
            }
            
            .hover-scale {
                transition: transform 0.3s ease;
            }
            .hover-scale:hover {
                transform: scale(1.05);
            }
            
            .hover-glow {
                transition: all 0.3s ease;
            }
            .hover-glow:hover {
                box-shadow: var(--glow-primary, 0 0 20px rgba(59, 130, 246, 0.5));
            }
            
            .input-focus {
                transition: all 0.3s ease;
            }
            .input-focus:focus {
                border-color: var(--accent-primary, #3b82f6);
                box-shadow: var(--glow-primary, 0 0 0 3px rgba(59, 130, 246, 0.1));
            }
            
            .btn-hover {
                transition: all 0.3s ease;
            }
            .btn-hover:hover {
                background: var(--bg-accent, #f3f4f6);
                border-color: var(--border-accent, #d1d5db);
                color: var(--text-inverse, #1f2937);
                transform: scale(1.05);
            }
        `;
        document.head.appendChild(style);

        // Apply classes to elements with common hover patterns
        this.applyHoverClasses();
    }

    /**
     * Apply CSS classes to elements with common hover patterns
     */
    applyHoverClasses() {
        // Convert common hover patterns
        const patterns = [
            {
                selector: '[onmouseover*="translateY(-5px)"]',
                className: 'hover-lift'
            },
            {
                selector: '[onmouseover*="scale(1.05)"]',
                className: 'hover-scale'
            },
            {
                selector: 'input[onfocus*="borderColor"]',
                className: 'input-focus'
            },
            {
                selector: 'button[onmouseover*="background"]',
                className: 'btn-hover'
            }
        ];

        patterns.forEach(pattern => {
            const elements = document.querySelectorAll(pattern.selector);
            elements.forEach(element => {
                element.classList.add(pattern.className);
            });
        });
    }

    /**
     * Clean up all converted event handlers
     */
    cleanup() {
        if (window.eventManager) {
            this.eventHandlers.forEach(listenerId => {
                window.eventManager.off(listenerId);
            });
        }
        this.eventHandlers.clear();
        this.convertedElements.clear();
    }

    /**
     * Initialize the converter and run conversion
     */
    static init() {
        const converter = new InlineEventConverter();
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                converter.convertHoverEffectsToCSS();
                converter.convertAllInlineEvents();
            });
        } else {
            converter.convertHoverEffectsToCSS();
            converter.convertAllInlineEvents();
        }
        
        return converter;
    }
}

// Auto-initialize if not already done
if (!window.inlineEventConverter) {
    window.inlineEventConverter = InlineEventConverter.init();
}

// Export for manual use
window.InlineEventConverter = InlineEventConverter;