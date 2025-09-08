/**
 * Bilingual Content Loader
 * Dynamically loads content from the database and populates HTML elements
 */

class ContentLoader {
    constructor() {
        this.currentLanguage = localStorage.getItem('selectedLanguage') || 'en';
        this.contentCache = {};
        this.apiBaseUrl = 'http://localhost:8080/api';
    }

    /**
     * Initialize the content loader
     */
    async init() {
        try {
            await this.loadPageContent();
            this.setupLanguageToggle();
            this.populateContent();
        } catch (error) {
            console.error('Failed to initialize content loader:', error);
        }
    }

    /**
     * Load content for the current page from the database
     */
    async loadPageContent() {
        try {
            const currentPage = this.getCurrentPage();
            const response = await fetch(`${this.apiBaseUrl}/website-content/page/${currentPage}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            this.contentCache = result.data || {};
            
            console.log('Content loaded:', this.contentCache);
        } catch (error) {
            console.error('Error loading page content:', error);
            // Fallback to empty content if API fails
            this.contentCache = {};
        }
    }

    /**
     * Get the current page name from the URL
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '') || 'index';
        return page === '' ? 'home' : page;
    }

    /**
     * Populate HTML elements with content based on data-key attributes
     */
    populateContent() {
        const elements = document.querySelectorAll('[data-key]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-key');
            const contentType = element.getAttribute('data-content-type') || 'title';
            
            if (this.contentCache[key]) {
                const content = this.contentCache[key][this.currentLanguage];
                
                if (content && content[contentType]) {
                    if (element.tagName === 'IMG') {
                        // Handle image alt text
                        if (contentType === 'alt') {
                            element.alt = content[contentType];
                        }
                    } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                        // Handle form placeholders
                        if (contentType === 'placeholder') {
                            element.placeholder = content[contentType];
                        }
                    } else {
                        // Handle text content
                        element.textContent = content[contentType];
                    }
                }
            }
        });
        
        // Handle images with bilingual alt text
        this.populateImageContent();
    }

    /**
     * Populate image content (alt text, captions)
     */
    populateImageContent() {
        const images = document.querySelectorAll('img[data-key]');
        
        images.forEach(img => {
            const key = img.getAttribute('data-key');
            
            if (this.contentCache[key] && this.contentCache[key].images) {
                const imageData = this.contentCache[key].images[0]; // Use first image
                
                if (imageData && imageData.alt) {
                    img.alt = imageData.alt[this.currentLanguage] || '';
                }
            }
        });
    }

    /**
     * Setup language toggle functionality
     */
    setupLanguageToggle() {
        const languageToggles = document.querySelectorAll('.language-toggle, [data-language], [data-lang]');
        
        languageToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const targetLang = toggle.getAttribute('data-language') || 
                                 toggle.getAttribute('data-lang') ||
                                 (this.currentLanguage === 'en' ? 'ta' : 'en');
                this.switchLanguage(targetLang);
            });
        });
        
        // Update toggle states
        this.updateToggleStates();
    }

    /**
     * Switch between languages
     */
    async switchLanguage(language) {
        if (language === this.currentLanguage) return;
        
        this.currentLanguage = language;
        localStorage.setItem('selectedLanguage', language);
        localStorage.setItem('preferred_language', language);
        
        // Clear cached content to force reload with new language
        this.contentCache = {};
        
        // Reload content from API with new language
        await this.loadPageContent();
        
        // Update content
        this.populateContent();
        
        // Update toggle states
        this.updateToggleStates();
        
        // Reload dynamic content with new language
        await this.reloadDynamicContent();
        
        // Reload website content with new language
        if (typeof loadWebsiteContentFromAPI === 'function') {
            loadWebsiteContentFromAPI();
        }
        
        // Trigger custom event for other components
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: this.currentLanguage }
        }));
    }

    /**
     * Update language toggle button states
     */
    updateToggleStates() {
        const toggles = document.querySelectorAll('[data-language]');
        
        toggles.forEach(toggle => {
            const lang = toggle.getAttribute('data-language');
            
            if (lang === this.currentLanguage) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
        });
        
        // Update body class for CSS targeting
        document.body.className = document.body.className.replace(/lang-\w+/g, '');
        document.body.classList.add(`lang-${this.currentLanguage}`);
    }

    /**
     * Refresh content from the database
     */
    async refreshContent() {
        await this.loadPageContent();
        this.populateContent();
    }

    /**
     * Reload all dynamic content with current language
     */
    async reloadDynamicContent() {
        try {
            // Reload books if loadBooksFromAPI is available
            if (typeof window.loadBooksFromAPI === 'function') {
                await window.loadBooksFromAPI();
            }
            
            // Reload projects if loadProjectsFromAPI is available
            if (typeof window.loadProjectsFromAPI === 'function') {
                await window.loadProjectsFromAPI();
            }
            
            // Reload team members if available
            if (window.teamManager && typeof window.teamManager.loadTeamMembers === 'function') {
                await window.teamManager.loadTeamMembers();
            }
            
            // Reload activities if available
            if (typeof window.loadActivities === 'function') {
                await window.loadActivities();
            }
            
            // Reload initiatives if available
            if (typeof window.loadInitiatives === 'function') {
                await window.loadInitiatives();
            }
            
            // Reload ebooks if available
            if (typeof window.loadEbooksFromAPI === 'function') {
                await window.loadEbooksFromAPI();
            }
            
            console.log('Dynamic content reloaded for language:', this.currentLanguage);
        } catch (error) {
            console.error('Error reloading dynamic content:', error);
        }
    }

    /**
     * Get current language
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Get content for a specific key
     */
    getContent(key, contentType = 'title', language = null) {
        const lang = language || this.currentLanguage;
        
        if (this.contentCache[key] && this.contentCache[key][lang]) {
            return this.contentCache[key][lang][contentType] || '';
        }
        
        return '';
    }
}

// Initialize content loader when DOM is ready
let contentLoader;

document.addEventListener('DOMContentLoaded', async () => {
    contentLoader = new ContentLoader();
    await contentLoader.init();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentLoader;
}

// Make available globally
window.ContentLoader = ContentLoader;
window.contentLoader = contentLoader;