/**
 * Ebooks API Integration
 * Fetches ebook data from admin API and displays on main website
 * Note: API_BASE_URL and apiCall function are defined in api-integration.js
 */

class EbooksAPI {
    constructor() {
        this.baseURL = 'http://localhost:8080/api';
        this.allEbooks = [];
        this.currentEbooks = [];
        this.filteredEbooks = [];
    }

    /**
     * Fetch all ebooks from the API
     */
    async fetchEbooks() {
        try {
            const result = await apiCall('/api/ebooks');
            // Extract the data array from the API response
            const ebooks = result.data || result;
            return this.transformEbookData(ebooks);
        } catch (error) {
            console.error('Error fetching ebooks:', error);
            return [];
        }
    }

    /**
     * Transform API ebook data to match the frontend format
     */
    transformEbookData(ebooks) {
        const colors = ['var(--primary-blue)', 'var(--warning-color)', 'var(--success-color)', 'var(--purple-color)', 'var(--error-color)', 'var(--cyan-color)'];
        
        return ebooks.map((ebook, index) => ({
            id: ebook._id,
            title: ebook.title,
            tamilTitle: ebook.titleTamil || ebook.tamilTitle || ebook.title,
            author: ebook.author,
            authorTamil: ebook.authorTamil || ebook.author,
            category: ebook.category,
            language: this.determineLanguage(ebook),
            rating: ebook.rating || this.generateRating(),
            downloads: ebook.downloadCount || this.generateDownloads(),
            description: ebook.description || `A wonderful ${ebook.category} ebook by ${ebook.author}`,
            descriptionTamil: ebook.descriptionTamil || ebook.description,
            color: colors[index % colors.length],
            fileUrl: ebook.fileUrl,
            downloadUrl: ebook.fileUrl, // Map fileUrl to downloadUrl for download functionality
            fileFormat: ebook.fileFormat || 'PDF',
            bookLanguage: ebook.bookLanguage || 'Tamil',
            featured: ebook.featured === 'true' || ebook.featured === true,
            image: this.processImageUrl(ebook.coverImage || ebook.image), // Process image URL
            createdAt: ebook.createdAt || new Date()
        }));
    }

    /**
     * Process image URL to ensure proper formatting
     */
    processImageUrl(imageValue) {
        if (!imageValue) return null;
        
        // If it's already a full URL, return as is
        if (imageValue.startsWith('http://') || imageValue.startsWith('https://')) {
            return imageValue;
        }
        
        // If it's a blob URL or data URL, return as is
        if (imageValue.startsWith('blob:') || imageValue.startsWith('data:')) {
            return imageValue;
        }
        
        // If it's a relative path from uploads, prepend backend URL
        if (imageValue.startsWith('/uploads/')) {
            return `${window.TLS_API_BASE_URL || 'http://localhost:8080'}${imageValue}`;
        }
        
        // If it's an uploads path without leading slash
        if (imageValue.startsWith('uploads/')) {
            return `${window.TLS_API_BASE_URL || 'http://localhost:8080'}/${imageValue}`;
        }
        
        // If it's an assets path, return as is
        if (imageValue.startsWith('assets/')) {
            return imageValue;
        }
        
        // For any other relative path, assume it's from uploads
        if (!imageValue.startsWith('/')) {
            return `${window.TLS_API_BASE_URL || 'http://localhost:8080'}/uploads/${imageValue}`;
        }
        
        return imageValue;
    }

    /**
     * Determine language based on ebook data
     */
    determineLanguage(ebook) {
        if (ebook.tamilTitle && ebook.tamilTitle !== ebook.title) {
            return 'bilingual';
        }
        // Check if title contains Tamil characters
        const tamilRegex = /[\u0B80-\u0BFF]/;
        if (tamilRegex.test(ebook.title)) {
            return 'tamil';
        }
        return 'english';
    }

    /**
     * Generate random rating for display (in real app, this would come from user reviews)
     */
    generateRating() {
        return (Math.random() * 1.5 + 3.5).toFixed(1);
    }

    /**
     * Generate random download count for display
     */
    generateDownloads() {
        return Math.floor(Math.random() * 5000) + 500;
    }

    /**
     * Display loading state
     */
    showLoading() {
        const grid = document.getElementById('books-grid');
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <div style="display: inline-block; width: 50px; height: 50px; border: 3px solid var(--border-secondary); border-top: 3px solid var(--border-accent); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p style="margin-top: 1rem; color: var(--gray-600);">Loading ebooks...</p>
                </div>
            `;
        }
    }

    /**
     * Display error message
     */
    showError(message) {
        const grid = document.getElementById('books-grid');
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--accent-red); margin-bottom: 1rem;"></i>
                    <p style="color: var(--gray-600); margin-bottom: 1rem;">${message}</p>
                    <button onclick="window.location.reload()" style="background: var(--primary-blue); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer;">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    /**
     * Render featured ebooks in the carousel
     */
    renderFeaturedEbooks(ebooks) {
        const featuredEbooks = ebooks.filter(ebook => ebook.featured).slice(0, 3);
        const carousel = document.getElementById('featured-carousel');
        
        if (carousel && featuredEbooks.length > 0) {
            carousel.innerHTML = featuredEbooks.map(ebook => `
                <div class="ebook-card featured" style="min-width: 300px; margin-right: 2rem;">
                    <div class="book-cover" style="height: 400px; ${this.getEbookImageStyle(ebook.image)}; border-radius: 1rem; position: relative; overflow: hidden; box-shadow: var(--shadow-xl);">
                        <div style="position: absolute; top: 2rem; left: 2rem; right: 2rem; text-align: center; color: white;">
                            <h3 style="font-family: 'Noto Sans Tamil', var(--font-tamil), sans-serif; font-size: 1.5rem; margin-bottom: 1rem; font-weight: 600;">${ebook.tamilTitle || ebook.title}</h3>
                            <p style="font-size: 1rem; opacity: 0.9;">${ebook.author}</p>
                            <div style="position: absolute; bottom: -200px; left: 50%; transform: translateX(-50%); font-size: 8rem; opacity: 0.1;">
                                <i class="fas fa-book-open"></i>
                            </div>
                        </div>
                    </div>
                    <div class="book-info" style="padding: 1.5rem; background: var(--bg-secondary); border-radius: 0 0 1rem 1rem; box-shadow: var(--shadow-lg); color: var(--text-primary);">
                        <h4 style="color: var(--gray-900); margin-bottom: 0.5rem;">${ebook.title}</h4>
                        <p style="color: var(--gray-600); font-size: 0.9rem; margin-bottom: 1rem;">${ebook.description}</p>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div class="rating" style="color: var(--accent-gold);">
                                ${this.generateStars(ebook.rating)}
                                <span style="margin-left: 0.5rem; color: var(--gray-600);">${ebook.rating}</span>
                            </div>
                            <button class="btn-download" data-ebook-id="${ebook.id}" style="background: ${ebook.color}; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; font-size: 0.9rem;">
                                <i class="fas fa-download"></i> Download
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    /**
     * Render ebooks in the main grid
     */
    renderEbooks(ebooks) {
        const grid = document.getElementById('books-grid');
        if (!grid) return;

        if (ebooks.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-book" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                    <p style="color: var(--gray-600);">No ebooks found matching your criteria.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = ebooks.map((ebook, index) => `
            <div class="book-card hover-lift" style="animation-delay: ${index * 0.1}s;">
                <div class="book-cover" style="height: 300px; ${this.getEbookImageStyle(ebook.image)}; border-radius: 1rem 1rem 0 0; position: relative; overflow: hidden; cursor: pointer;">
                    <div style="position: absolute; top: 1.5rem; left: 1.5rem; right: 1.5rem; text-align: center; color: white;">
                        <h4 style="font-family: 'Noto Sans Tamil', var(--font-tamil), sans-serif; font-size: 1.25rem; margin-bottom: 0.5rem; font-weight: 600;">${ebook.tamilTitle || ebook.title}</h4>
                        <h5 style="font-size: 1rem; opacity: 0.9; margin-bottom: 1rem;">${ebook.title}</h5>
                        <p style="font-size: 0.9rem; opacity: 0.8;">by ${ebook.author}</p>
                        <div style="position: absolute; bottom: -120px; left: 50%; transform: translateX(-50%); font-size: 6rem; opacity: 0.1;">
                            <i class="fas fa-book"></i>
                        </div>
                    </div>
                </div>
                <div class="book-info" style="padding: 1.5rem; background: var(--bg-secondary); border-radius: 0 0 1rem 1rem; box-shadow: var(--shadow-lg); color: var(--text-primary);">
                    <p style="color: var(--gray-600); font-size: 0.9rem; margin-bottom: 1rem; line-height: 1.5;">${ebook.description}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <div class="rating" style="color: var(--accent-gold);">
                            ${this.generateStars(ebook.rating)}
                            <span style="margin-left: 0.5rem; color: var(--gray-600); font-size: 0.9rem;">${ebook.rating}</span>
                        </div>
                        <span class="download-count" style="color: var(--gray-500); font-size: 0.8rem;">${ebook.downloads} downloads</span>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-download" data-ebook-id="${ebook.id}" style="flex: 1; background: ${ebook.color}; color: white; border: none; padding: 0.75rem; border-radius: 0.5rem; cursor: pointer; font-size: 0.9rem; transition: all 0.3s ease;">
                            <i class="fas fa-download"></i> Download
                        </button>
                        <button class="btn-rate" data-ebook-id="${ebook.id}" style="background: var(--accent-gold); color: white; border: none; padding: 0.75rem; border-radius: 0.5rem; cursor: pointer; font-size: 0.9rem; transition: all 0.3s ease;">
                            <i class="fas fa-star"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Add animation classes
        setTimeout(() => {
            document.querySelectorAll('.book-card').forEach(card => {
                card.classList.add('animate-fadeInUp');
            });
        }, 100);
    }

    /**
     * Helper function to format ebook image background
     */
    getEbookImageStyle(imageValue) {
        if (!imageValue) return 'background: linear-gradient(135deg, var(--indigo-color), var(--purple-color));';
        
        // If it's already a gradient, use as is
        if (imageValue.includes('linear-gradient') || imageValue.includes('radial-gradient')) {
            return `background: ${imageValue};`;
        }
        
        // If it's a URL or file path, use as background-image with fallback gradient
        if (this.isImagePath(imageValue)) {
            let imageUrl = this.getFullImageUrl(imageValue);
            return `background: url('${imageUrl}') center/cover no-repeat, linear-gradient(135deg, var(--indigo-color), var(--purple-color)); background-size: cover; background-position: center;`;
        }
        
        // Default gradient
        return 'background: linear-gradient(135deg, var(--indigo-color), var(--purple-color));';
    }

    /**
     * Check if a value is an image path
     */
    isImagePath(value) {
        if (!value || typeof value !== 'string') return false;
        
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];
        const lowerValue = value.toLowerCase();
        
        return (
            value.startsWith('http') ||
            value.startsWith('/') ||
            value.startsWith('assets/') ||
            value.startsWith('uploads/') ||
            value.includes('blob:') ||
            value.includes('data:image') ||
            imageExtensions.some(ext => lowerValue.includes(ext))
        );
    }

    /**
     * Get full image URL with proper backend URL
     */
    getFullImageUrl(imagePath) {
        if (!imagePath) return '';
        
        // If it's already a full URL, return as is
        if (imagePath.startsWith('http') || imagePath.startsWith('blob:') || imagePath.startsWith('data:')) {
            return imagePath;
        }
        
        // Handle default ebook cover
        if (imagePath === '/assets/default-ebook-cover.jpg' || imagePath === 'assets/default-ebook-cover.jpg') {
            return imagePath;
        }
        
        // For relative URLs from backend, prepend the backend URL
        if (imagePath.startsWith('/uploads/') || imagePath.startsWith('uploads/')) {
            return `${window.TLS_API_BASE_URL || 'http://localhost:8080'}/${imagePath.replace(/^\/+/, '')}`;
        }
        
        // For other relative paths from backend
        if (imagePath.startsWith('/')) {
            return `${window.TLS_API_BASE_URL || 'http://localhost:8080'}${imagePath}`;
        }
        
        // For assets or other paths
        return imagePath;
    }

    /**
     * Generate star rating HTML
     */
    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    /**
     * Handle ebook download
     */
    async downloadEbook(ebookId) {
        try {
            const ebook = this.allEbooks.find(e => e.id === ebookId);
            if (!ebook) {
                throw new Error('Ebook not found');
            }

            // Check if user is signed in (required for downloads)
            if (window.AuthUtils && !window.AuthUtils.isAuthenticated()) {
                if (window.AuthUtils.showAuthModal) {
                    window.AuthUtils.showAuthModal();
                }
                if (window.TamilSociety && window.TamilSociety.showNotification) {
                    window.TamilSociety.showNotification('Please sign in to download ebooks', 'warning');
                }
                return;
            }

            let downloadUrl = ebook.downloadUrl || ebook.fileUrl || ebook.file;
            
            if (!downloadUrl) {
                throw new Error('Download file not available');
            }

            // Process the download URL properly
            if (!downloadUrl.startsWith('http') && !downloadUrl.startsWith('blob:') && !downloadUrl.startsWith('data:')) {
                // For relative URLs from backend, prepend the backend URL
                if (downloadUrl.startsWith('/uploads/') || downloadUrl.startsWith('uploads/')) {
                    downloadUrl = `${window.TLS_API_BASE_URL || 'http://localhost:8080'}/${downloadUrl.replace(/^\/+/, '')}`
                } else if (!downloadUrl.startsWith('/')) {
                    downloadUrl = `${window.TLS_API_BASE_URL || 'http://localhost:8080'}/uploads/${downloadUrl}`;
                } else {
                    downloadUrl = `${window.TLS_API_BASE_URL || 'http://localhost:8080'}${downloadUrl}`;
                }
            }
            
            // Determine file extension
            const fileFormat = ebook.fileFormat || 'pdf';
            const fileName = `${ebook.title.replace(/[^a-zA-Z0-9\s]/g, '')}.${fileFormat.toLowerCase()}`;
            
            // Show download notification
            if (window.TamilSociety && window.TamilSociety.showNotification) {
                window.TamilSociety.showNotification(`புத்தகம் பதிவிறக்கம் தொடங்கியது! "${ebook.title}" download started`, 'success');
            }
            
            // Try to download using fetch first (for better error handling)
            try {
                const response = await fetch(downloadUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                
                // Create a temporary link to download the file
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.style.display = 'none';
                document.body.appendChild(link);
                
                // Trigger download
                link.click();
                
                // Clean up
                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                }, 100);
                
            } catch (fetchError) {
                console.warn('Fetch download failed, trying direct link:', fetchError);
                
                // Fallback to direct link method
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = fileName;
                link.target = '_blank';
                link.style.display = 'none';
                document.body.appendChild(link);
                
                // Trigger download
                link.click();
                
                // Clean up
                setTimeout(() => {
                    document.body.removeChild(link);
                }, 100);
            }
            
            // Update download count
            this.updateDownloadCount(ebookId);
            
            if (window.TamilSociety && window.TamilSociety.showNotification) {
                window.TamilSociety.showNotification(`புத்தகம் பதிவிறக்கம் தொடங்கியது! "${ebook.title}" download started`, 'success');
            }
        } catch (error) {
            console.error('Download error:', error);
            if (window.TamilSociety && window.TamilSociety.showNotification) {
                window.TamilSociety.showNotification(error.message || 'Download failed. Please try again later.', 'error');
            }
        }
    }

    /**
     * Update download count for an ebook
     */
    updateDownloadCount(ebookId) {
        const ebook = this.allEbooks.find(e => e.id === ebookId);
        if (ebook) {
            ebook.downloads = (ebook.downloads || 0) + 1;
            
            // Update the display
            const downloadCountElements = document.querySelectorAll(`[data-ebook-id="${ebookId}"] .download-count`);
            downloadCountElements.forEach(element => {
                element.textContent = `${ebook.downloads} downloads`;
            });
        }
    }

    /**
     * Filter ebooks based on criteria
     */
    filterEbooks(category = 'all', language = 'all', sort = 'latest', searchTerm = '') {
        let filtered = [...this.allEbooks];

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(ebook => 
                ebook.title.toLowerCase().includes(term) ||
                ebook.tamilTitle.toLowerCase().includes(term) ||
                ebook.author.toLowerCase().includes(term) ||
                ebook.description.toLowerCase().includes(term)
            );
        }

        // Apply category filter
        if (category !== 'all') {
            filtered = filtered.filter(ebook => ebook.category === category);
        }

        // Apply language filter
        if (language !== 'all') {
            filtered = filtered.filter(ebook => ebook.language === language);
        }

        // Apply sorting
        switch (sort) {
            case 'popular':
                filtered.sort((a, b) => b.downloads - a.downloads);
                break;
            case 'alphabetical':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'rating':
                filtered.sort((a, b) => b.rating - a.rating);
                break;
            default: // latest
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }

        this.filteredEbooks = filtered;
        this.renderEbooks(filtered);
    }

    /**
     * Initialize the ebooks page
     */
    async initialize() {
        this.showLoading();
        
        try {
            const ebooks = await this.fetchEbooks();
            
            if (ebooks.length === 0) {
                this.showError('No ebooks available at the moment.');
                return;
            }

            this.allEbooks = ebooks;
            this.currentEbooks = ebooks.slice(0, 12); // Show first 12 ebooks
            this.filteredEbooks = [...ebooks];

            // Render featured ebooks
            this.renderFeaturedEbooks(ebooks);
            
            // Render main ebooks grid
            this.renderEbooks(this.currentEbooks);

            // Setup event listeners
            this.setupEventListeners();

        } catch (error) {
            console.error('Error initializing ebooks:', error);
            this.showError('Failed to load ebooks. Please try again later.');
        }
    }

    /**
     * Setup event listeners for filters, search, and buttons
     */
    setupEventListeners() {
        // Filter event listeners
        const categoryFilter = document.getElementById('category-filter');
        const languageFilter = document.getElementById('language-filter');
        const sortFilter = document.getElementById('sort-filter');
        const searchInput = document.getElementById('search-input');

        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.applyFilters());
        }

        if (languageFilter) {
            languageFilter.addEventListener('change', () => this.applyFilters());
        }

        if (sortFilter) {
            sortFilter.addEventListener('change', () => this.applyFilters());
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }

        // Download and preview button listeners
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-download') || e.target.closest('.btn-download')) {
                e.preventDefault();
                const button = e.target.classList.contains('btn-download') ? e.target : e.target.closest('.btn-download');
                const ebookId = button.getAttribute('data-ebook-id');
                if (ebookId) {
                    this.downloadEbook(ebookId);
                }
            }

            if (e.target.classList.contains('btn-rate') || e.target.closest('.btn-rate')) {
                e.preventDefault();
                if (window.TamilSociety && window.TamilSociety.showNotification) {
                    window.TamilSociety.showNotification('Rating feature available on main ebooks page!');
                }
            }
        });

        // Load more button
        const loadMoreBtn = document.getElementById('load-more');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                const currentLength = this.currentEbooks.length;
                const nextBatch = this.allEbooks.slice(currentLength, currentLength + 12);
                this.currentEbooks = [...this.currentEbooks, ...nextBatch];
                this.renderEbooks(this.currentEbooks);
                
                if (this.currentEbooks.length >= this.allEbooks.length) {
                    loadMoreBtn.style.display = 'none';
                }
            });
        }
    }

    /**
     * Apply all active filters
     */
    applyFilters() {
        const category = document.getElementById('category-filter')?.value || 'all';
        const language = document.getElementById('language-filter')?.value || 'all';
        const sort = document.getElementById('sort-filter')?.value || 'latest';
        const searchTerm = document.getElementById('search-input')?.value || '';

        this.filterEbooks(category, language, sort, searchTerm);
    }
}

// Global function to load ebooks from API (for backward compatibility)
window.loadEbooksFromAPI = async function() {
    const ebooksAPI = new EbooksAPI();
    return await ebooksAPI.fetchEbooks();
};

// Initialize ebooks page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('books-grid')) {
        const ebooksAPI = new EbooksAPI();
        ebooksAPI.initialize();
    }
});