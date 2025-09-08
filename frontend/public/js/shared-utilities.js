/**
 * Shared Utilities for Admin Panel and Content Editor
 * Consolidates common patterns to reduce code duplication
 */

class SharedUtilities {
    constructor() {
        this.apiBaseUrl = window.TLS_API_BASE_URL || 'http://localhost:8080';
        this.requestTimeout = 15000; // 15 seconds
    }

    /**
     * Standardized API call method with error handling and authentication
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} API response
     */
    async apiCall(endpoint, options = {}) {
        const token = this.getAuthToken();
        const fullUrl = endpoint.startsWith('http') ? endpoint : `${this.apiBaseUrl}${endpoint}`;
        
        console.log(`Making API call to: ${fullUrl}`);
        
        const defaultOptions = {
            mode: 'cors',
            credentials: 'include',
            headers: {}
        };
        
        // Only set Content-Type for non-FormData requests
        if (!(options.body instanceof FormData)) {
            defaultOptions.headers['Content-Type'] = 'application/json';
        }
        
        // Add Authorization header if token exists
        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }
        
        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);
            
            finalOptions.signal = controller.signal;
            
            const response = await fetch(fullUrl, finalOptions);
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - please check your connection');
            }
            throw error;
        }
    }

    /**
     * Get authentication token from storage
     * @returns {string|null} Auth token
     */
    getAuthToken() {
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    }

    /**
     * Standardized modal management
     * @param {string} modalId - Modal element ID
     * @param {boolean} show - Whether to show or hide
     * @param {Object} options - Additional options
     */
    manageModal(modalId, show = true, options = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.warn(`Modal not found: ${modalId}`);
            return false;
        }

        if (show) {
            modal.style.display = 'flex';
            modal.classList.add('show');
            
            // Reset form if specified
            if (options.resetForm) {
                const form = modal.querySelector('form');
                if (form) {
                    form.reset();
                    // Clear any validation states
                    form.querySelectorAll('.error, .invalid').forEach(el => {
                        el.classList.remove('error', 'invalid');
                    });
                }
            }
            
            // Focus first input if specified
            if (options.focusFirst) {
                const firstInput = modal.querySelector('input, textarea, select');
                if (firstInput) {
                    setTimeout(() => firstInput.focus(), 100);
                }
            }
        } else {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
        
        return true;
    }

    /**
     * Standardized form submission handler
     * @param {Event} event - Form submit event
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Submission options
     */
    async handleFormSubmission(event, endpoint, options = {}) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const method = options.method || 'POST';
        
        try {
            // Show loading state
            if (options.loadingCallback) {
                options.loadingCallback(true);
            }
            
            // Prepare request body
            let body;
            if (options.jsonBody) {
                body = JSON.stringify(Object.fromEntries(formData));
            } else {
                body = formData;
            }
            
            const response = await this.apiCall(endpoint, {
                method,
                body
            });
            
            // Handle success
            if (options.successCallback) {
                options.successCallback(response);
            }
            
            if (options.showSuccessNotification && window.showNotification) {
                window.showNotification(options.successMessage || 'Operation completed successfully', 'success');
            }
            
            // Close modal if specified
            if (options.closeModal) {
                this.manageModal(options.closeModal, false);
            }
            
            return response;
            
        } catch (error) {
            console.error('Form submission error:', error);
            
            if (options.errorCallback) {
                options.errorCallback(error);
            }
            
            if (options.showErrorNotification && window.showNotification) {
                window.showNotification(options.errorMessage || 'Operation failed', 'error');
            }
            
            throw error;
            
        } finally {
            // Hide loading state
            if (options.loadingCallback) {
                options.loadingCallback(false);
            }
        }
    }

    /**
     * Standardized initialization pattern
     * @param {Array} initFunctions - Array of initialization functions
     * @param {Object} options - Initialization options
     */
    async initializeModules(initFunctions, options = {}) {
        const results = [];
        
        for (const initFunc of initFunctions) {
            try {
                if (typeof initFunc.check === 'function' && !initFunc.check()) {
                    console.log(`Skipping ${initFunc.name} - conditions not met`);
                    continue;
                }
                
                console.log(`Initializing ${initFunc.name}...`);
                const result = await initFunc.init();
                results.push({ name: initFunc.name, success: true, result });
                console.log(`✅ ${initFunc.name} initialized`);
                
            } catch (error) {
                console.error(`❌ Failed to initialize ${initFunc.name}:`, error);
                results.push({ name: initFunc.name, success: false, error });
                
                if (options.stopOnError) {
                    throw error;
                }
            }
        }
        
        return results;
    }

    /**
     * Standardized content transformation for admin/editor consistency
     * @param {Object} rawContent - Raw content from API
     * @param {string} page - Page identifier
     * @returns {Object} Transformed content
     */
    transformContentData(rawContent, page) {
        if (!rawContent || typeof rawContent !== 'object') {
            return {};
        }

        const transformed = {};
        
        Object.entries(rawContent).forEach(([key, value]) => {
            // Standardize content structure
            const standardized = {
                id: value._id || value.id || key,
                title: value.title || '',
                titleTamil: value.titleTamil || '',
                content: value.content || '',
                contentTamil: value.contentTamil || '',
                subtitle: value.subtitle || '',
                subtitleTamil: value.subtitleTamil || '',
                buttonText: value.buttonText || '',
                buttonTextTamil: value.buttonTextTamil || '',
                buttonUrl: value.buttonUrl || '',
                image: value.image || '',
                images: value.images || [],
                metadata: value.metadata || {},
                isActive: value.isActive !== false,
                isVisible: value.isVisible !== false,
                order: value.order || 0,
                section: value.section || key,
                page: value.page || page
            };
            
            transformed[key] = standardized;
        });
        
        return transformed;
    }

    /**
     * Debounce utility for performance optimization
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle utility for performance optimization
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Safe element getter with error handling
     * @param {string} id - Element ID
     * @returns {Element|null} DOM element or null
     */
    safeGetElement(id) {
        try {
            return document.getElementById(id);
        } catch (error) {
            console.error('Error getting element:', id, error);
            return null;
        }
    }

    /**
     * Generate user initials from name
     * @param {string} name - User name
     * @returns {string} User initials
     */
    getInitials(name) {
        if (!name) return 'U';
        return name.split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.sharedUtilities = new SharedUtilities();
    
    // Expose commonly used methods globally for backward compatibility
    if (!window.apiCall) {
        window.apiCall = window.sharedUtilities.apiCall.bind(window.sharedUtilities);
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SharedUtilities;
}