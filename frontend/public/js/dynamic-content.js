/**
 * Dynamic Content Replacement System
 * Fetches content from the backend API and replaces HTML elements with data-content attributes
 */

class DynamicContentManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8080/api/website-content';
        this.currentPage = this.getCurrentPageName();
        this.contentCache = new Map();
        this.language = this.getLanguagePreference();
    }

    /**
     * Get the current page name from the URL or page identifier
     */
    getCurrentPageName() {
        const path = window.location.pathname;
        const fileName = path.split('/').pop();
        
        // Remove .html extension and handle special cases
        if (fileName === '' || fileName === 'index.html') {
            return 'home';
        }
        
        return fileName.replace('.html', '').toLowerCase();
    }

    /**
     * Get language preference from localStorage or default to English
     */
    getLanguagePreference() {
        const lang = localStorage.getItem('preferred_language') || 'en';
        return lang === 'ta' ? 'tamil' : 'english';
    }

    /**
     * Fetch content for a specific page
     */
    async fetchPageContent(page) {
        try {
            const cacheKey = `${page}_${this.language}`;
            
            if (this.contentCache.has(cacheKey)) {
                return this.contentCache.get(cacheKey);
            }

            const response = await fetch(`${this.apiBaseUrl}/fetch-content/${page}?language=${this.language}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.contentCache.set(cacheKey, data.data);
                return data.data;
            } else {
                throw new Error('API returned unsuccessful response');
            }
        } catch (error) {
            console.error(`Error fetching content for page ${page}:`, error);
            return [];
        }
    }

    /**
     * Fetch sections for a specific page
     */
    async fetchPageSections(page) {
        try {
            const cacheKey = `sections_${page}_${this.language}`;
            
            if (this.contentCache.has(cacheKey)) {
                return this.contentCache.get(cacheKey);
            }

            const response = await fetch(`${this.apiBaseUrl}/fetch-sections/${page}?language=${this.language}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.contentCache.set(cacheKey, data.data);
                return data.data;
            } else {
                throw new Error('API returned unsuccessful response');
            }
        } catch (error) {
            console.error(`Error fetching sections for page ${page}:`, error);
            return [];
        }
    }

    /**
     * Replace content in HTML elements based on data-content attributes
     */
    async replaceContent() {
        try {
            // Find all elements with data-content attributes
            const elementsWithDataContent = document.querySelectorAll('[data-content]');
            
            if (elementsWithDataContent.length === 0) {
                console.log('No elements with data-content attributes found');
                return;
            }

            // Fetch content for current page and global content
            const [pageContent, globalContent] = await Promise.all([
                this.fetchPageContent(this.currentPage),
                this.fetchPageContent('global')
            ]);

            // Combine all content - ensure arrays with proper null/undefined handling
            const pageArray = Array.isArray(pageContent) ? pageContent : 
                             (pageContent && typeof pageContent === 'object') ? [pageContent] : [];
            const globalArray = Array.isArray(globalContent) ? globalContent : 
                               (globalContent && typeof globalContent === 'object') ? [globalContent] : [];
            const allContent = [...pageArray, ...globalArray];

            // Process each element
            elementsWithDataContent.forEach(element => {
                const contentKey = element.getAttribute('data-content');
                this.updateElement(element, contentKey, allContent);
            });

            console.log(`Dynamic content replacement completed for ${elementsWithDataContent.length} elements`);
        } catch (error) {
            console.error('Error in content replacement:', error);
        }
    }

    /**
     * Update a single HTML element with content
     */
    updateElement(element, contentKey, allContent) {
        try {
            // Parse the content key (e.g., "global.logo.text" or "homepage.hero.title")
            const keyParts = contentKey.split('.');
            const [pageType, section, field] = keyParts;

            // Find matching content
            const matchingContent = allContent.find(content => {
                return content.section === section || 
                       content.sectionKey === contentKey ||
                       (content.page === pageType && content.section === section);
            });

            if (!matchingContent) {
                console.warn(`No content found for key: ${contentKey}`);
                return;
            }

            // Update element based on its type and the field requested
            this.applyContentToElement(element, field, matchingContent);
        } catch (error) {
            console.error(`Error updating element with key ${contentKey}:`, error);
        }
    }

    /**
     * Apply content to an HTML element based on field type
     */
    applyContentToElement(element, field, content) {
        const tagName = element.tagName.toLowerCase();

        switch (field) {
            case 'title':
                if (tagName === 'img') {
                    element.alt = content.title || '';
                } else {
                    element.textContent = content.title || '';
                }
                break;

            case 'content':
            case 'text':
                if (tagName === 'img') {
                    element.alt = content.content || '';
                } else {
                    element.innerHTML = content.content || '';
                }
                break;

            case 'subtitle':
                element.textContent = content.subtitle || '';
                break;

            case 'image':
            case 'src':
                if (tagName === 'img') {
                    element.src = content.image || '';
                } else {
                    element.style.backgroundImage = `url(${content.image || ''})`;
                }
                break;

            case 'url':
            case 'href':
                if (tagName === 'a') {
                    element.href = content.buttonUrl || '#';
                }
                break;

            case 'buttonText':
                element.textContent = content.buttonText || '';
                break;

            default:
                // Try to find the field in the content object
                if (content[field]) {
                    if (tagName === 'img' && field.includes('url')) {
                        element.src = content[field];
                    } else if (tagName === 'a' && field.includes('url')) {
                        element.href = content[field];
                    } else {
                        element.textContent = content[field];
                    }
                }
                break;
        }
    }

    /**
     * Initialize the dynamic content system
     */
    async init() {
        try {
            console.log(`Initializing dynamic content for page: ${this.currentPage}`);
            await this.replaceContent();
        } catch (error) {
            console.error('Error initializing dynamic content:', error);
        }
    }

    /**
     * Refresh content (useful after language changes)
     */
    async refresh() {
        this.language = this.getLanguagePreference();
        this.contentCache.clear();
        await this.replaceContent();
    }

    /**
     * Update language and refresh content
     */
    async setLanguage(language) {
        // Convert language format to match content-manager.js
        const langCode = language === 'tamil' ? 'ta' : 'en';
        localStorage.setItem('preferred_language', langCode);
        await this.refresh();
    }
}

// Initialize the dynamic content manager when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.dynamicContentManager = new DynamicContentManager();
    await window.dynamicContentManager.init();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DynamicContentManager;
}