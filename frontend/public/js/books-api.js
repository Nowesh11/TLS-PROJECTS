/**
 * Books API Integration
 * Fetches book data from admin API and displays on main website
 * Note: API_BASE_URL and apiCall function are defined in api-integration.js
 */

class BooksAPI {
    constructor() {
        this.apiBaseUrl = "http://localhost:8080/api";
        this.books = [];
        this.ebooks = [];
        this.projects = [];
        this.loading = false;
    }

    /**
     * Fetch all books from the API with enhanced retry logic
     */
    async fetchBooks(retryCount = 0) {
        const maxRetries = 3;
        
        try {
            this.loading = true;
            console.log(`📚 Fetching books from API... (attempt ${retryCount + 1}/${maxRetries + 1})`);
            const result = await apiCall("/api/books");
            this.books = Array.isArray(result) ? result : (result.data || result.books || []);
            
            console.log("✅ Books fetched successfully:", this.books.length);
            return this.books;
        } catch (error) {
            console.error(`❌ Error fetching books (attempt ${retryCount + 1}):`, error);
            
            // Check if this is a network-related error
            const isNetworkError = error.message.includes("Failed to fetch") || 
                                 error.message.includes("ERR_ABORTED") ||
                                 error.name === "AbortError" ||
                                 error.message.includes("NetworkError");
            
            // Retry logic for network errors
            if (isNetworkError && retryCount < maxRetries) {
                const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
                console.log(`🔄 Retrying books fetch in ${retryDelay}ms...`);
                
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return this.fetchBooks(retryCount + 1);
            }
            
            // Show user-friendly error message on final attempt
            if (isNetworkError) {
                this.showErrorMessage("Network connection issue detected. Unable to load books. Please check your internet connection and try again.");
                
                // Show network error notification if available
                if (typeof window.showNetworkErrorNotification === "function") {
                    window.showNetworkErrorNotification();
                }
            } else {
                this.showErrorMessage("Failed to load books. Please try again later.");
            }
            
            return [];
        } finally {
            this.loading = false;
        }
    }

    /**
     * Fetch all ebooks from the API with enhanced retry logic
     */
    async fetchEbooks(retryCount = 0) {
        const maxRetries = 3;
        
        try {
            this.loading = true;
            console.log(`📖 Fetching ebooks from API... (attempt ${retryCount + 1}/${maxRetries + 1})`);
            const result = await apiCall("/api/ebooks");
            this.ebooks = Array.isArray(result) ? result : (result.data || result.ebooks || []);
            
            console.log("✅ Ebooks fetched successfully:", this.ebooks.length);
            return this.ebooks;
        } catch (error) {
            console.error(`❌ Error fetching ebooks (attempt ${retryCount + 1}):`, error);
            
            // Check if this is a network-related error
            const isNetworkError = error.message.includes("Failed to fetch") || 
                                 error.message.includes("ERR_ABORTED") ||
                                 error.name === "AbortError" ||
                                 error.message.includes("NetworkError");
            
            // Retry logic for network errors
            if (isNetworkError && retryCount < maxRetries) {
                const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
                console.log(`🔄 Retrying ebooks fetch in ${retryDelay}ms...`);
                
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return this.fetchEbooks(retryCount + 1);
            }
            
            // Show user-friendly error message on final attempt
            if (isNetworkError) {
                this.showErrorMessage("Network connection issue detected. Unable to load ebooks. Please check your internet connection and try again.");
                
                // Show network error notification if available
                if (typeof window.showNetworkErrorNotification === "function") {
                    window.showNetworkErrorNotification();
                }
            } else {
                this.showErrorMessage("Failed to load ebooks. Please try again later.");
            }
            
            return [];
        } finally {
            this.loading = false;
        }
    }

    /**
     * Fetch all projects from the API with enhanced retry logic
     */
    async fetchProjects(retryCount = 0) {
        const maxRetries = 3;
        
        try {
            this.loading = true;
            console.log(`🚀 Fetching projects from API... (attempt ${retryCount + 1}/${maxRetries + 1})`);
            const result = await apiCall("/api/projects");
            this.projects = Array.isArray(result) ? result : (result.data || result.projects || []);
            
            console.log("✅ Projects fetched successfully:", this.projects.length);
            return this.projects;
        } catch (error) {
            console.error(`❌ Error fetching projects (attempt ${retryCount + 1}):`, error);
            
            // Check if this is a network-related error
            const isNetworkError = error.message.includes("Failed to fetch") || 
                                 error.message.includes("ERR_ABORTED") ||
                                 error.name === "AbortError" ||
                                 error.message.includes("NetworkError");
            
            // Retry logic for network errors
            if (isNetworkError && retryCount < maxRetries) {
                const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
                console.log(`🔄 Retrying projects fetch in ${retryDelay}ms...`);
                
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return this.fetchProjects(retryCount + 1);
            }
            
            // Show user-friendly error message on final attempt
            if (isNetworkError) {
                this.showErrorMessage("Network connection issue detected. Unable to load projects. Please check your internet connection and try again.");
                
                // Show network error notification if available
                if (typeof window.showNetworkErrorNotification === "function") {
                    window.showNetworkErrorNotification();
                }
            } else {
                this.showErrorMessage("Failed to load projects. Please try again later.");
            }
            
            return [];
        } finally {
            this.loading = false;
        }
    }

    /**
     * Transform API book data to match the expected format
     */
    transformBookData(apiBooks) {
        return apiBooks.map(book => ({
            id: book._id || book.id,
            title: book.title || "Untitled",
            tamilTitle: book.titleTamil || book.title || "No Title",
            author: book.author || "Unknown Author",
            authorTamil: book.authorTamil || book.author || "Unknown Author",
            category: book.category || "literature",
            price: parseFloat(book.price) || 0,
            originalPrice: parseFloat(book.originalPrice) || parseFloat(book.price) || 0,
            rating: parseFloat(book.rating) || 0,
            reviews: parseInt(book.reviewCount) || 0,
            description: book.description || "No description available",
            image: this.processImageUrl(book.coverImage || book.image) || this.generateGradient(book.category),
            inStock: book.inStock !== false,
            bestseller: book.bestseller === true,
            featured: book.featured === true,
            isbn: book.isbn || "",
            publisher: book.publisher || "",
            pages: parseInt(book.pages) || 0,
            language: book.language || "Tamil",
            publishedDate: book.publishedDate || new Date().toISOString()
        }));
    }

    /**
     * Rate a book
     */
    async rateBook(bookId, rating, review = "") {
        try {
            const response = await fetch(`${this.apiBaseUrl}/books/${bookId}/rate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.getAuthToken()}`
                },
                credentials: "include",
                body: JSON.stringify({ rating, review })
            });

            if (!response.ok) {
                throw new Error("Failed to submit rating");
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error rating book:", error);
            throw error;
        }
    }

    /**
     * Get book ratings
     */
    async getBookRatings(bookId, page = 1, limit = 10) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/books/${bookId}/ratings?page=${page}&limit=${limit}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch ratings");
            }

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error("Error fetching book ratings:", error);
            throw error;
        }
    }

    /**
     * Get user's rating for a book
     */
    async getUserBookRating(bookId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/books/${bookId}/my-rating`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.getAuthToken()}`
                },
                credentials: "include"
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return null; // No rating found
                }
                throw new Error("Failed to fetch user rating");
            }

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error("Error fetching user rating:", error);
            return null;
        }
    }

    /**
     * Get authentication token
     */
    getAuthToken() {
        return localStorage.getItem("token") || 
               sessionStorage.getItem("token") || 
               this.getCookie("token");
    }

    /**
     * Get cookie value
     */
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(";").shift();
        return null;
    }

    /**
     * Process image URL to handle relative paths
     */
    processImageUrl(imageUrl) {
        // Return default if no image URL provided
        if (!imageUrl || imageUrl.trim() === "") {
            return "assets/default-book-cover.svg";
        }
        
        // Handle gradient backgrounds (fallback for books without images)
        if (imageUrl.startsWith("linear-gradient")) {
            return imageUrl;
        }
        
        // If it's already a full URL, validate and return
        if (imageUrl.startsWith("http")) {
            return this.validateImageUrl(imageUrl);
        }
        
        // If it's a relative path from uploads, prepend backend URL
        if (imageUrl.startsWith("/uploads/") || imageUrl.startsWith("uploads/")) {
            const cleanPath = imageUrl.startsWith("/") ? imageUrl : "/" + imageUrl;
            return this.validateImageUrl(`${window.TLS_API_BASE_URL || "http://localhost:8080"}${cleanPath}`);
        }
        
        // If it's a relative path from public, prepend backend URL
        if (imageUrl.startsWith("/public/") || imageUrl.startsWith("public/")) {
            const cleanPath = imageUrl.replace("/public", "");
            return this.validateImageUrl(`${window.TLS_API_BASE_URL || "http://localhost:8080"}${cleanPath}`);
        }
        
        // If it's an asset path, return as is
        if (imageUrl.startsWith("assets/") || imageUrl.startsWith("/assets/")) {
            return imageUrl;
        }
        
        // Handle default book cover references
        if (imageUrl === "/assets/default-book-cover.svg" || 
            imageUrl === "assets/default-book-cover.svg" ||
            imageUrl === "/assets/images/default-book.svg" ||
            imageUrl === "assets/images/default-book.svg") {
            return "assets/default-book-cover.svg";
        }
        
        // If it's just a filename, assume it's in uploads/books/
        if (!imageUrl.includes("/")) {
            return this.validateImageUrl(`${window.TLS_API_BASE_URL || "http://localhost:8080"}/uploads/books/${imageUrl}`);
        }
        
        // Default fallback
        return "assets/default-book-cover.svg";
    }

    /**
     * Validate image URL and provide fallback
     */
    validateImageUrl(imageUrl) {
        // Create a promise to test if image loads
        const img = new Image();
        img.onerror = () => {
            console.warn(`Image failed to load: ${imageUrl}`);
            // Replace broken image with default
            const brokenImages = document.querySelectorAll(`img[src="${imageUrl}"]`);
            brokenImages.forEach(imgElement => {
                imgElement.src = "assets/default-book-cover.svg";
                imgElement.alt = "Default book cover";
            });
        };
        img.src = imageUrl;
        
        return imageUrl;
    }

    /**
     * Transform API ebook data to match the expected format
     */
    transformEbookData(apiEbooks) {
        return apiEbooks.map(ebook => ({
            id: ebook._id || ebook.id,
            title: ebook.title || "Untitled",
            tamilTitle: ebook.titleTamil || ebook.title || "No Title",
            author: ebook.author || "Unknown Author",
            authorTamil: ebook.authorTamil || ebook.author || "Unknown Author",
            category: ebook.category || "literature",
            rating: parseFloat(ebook.rating) || 4.5,
            reviews: parseInt(ebook.reviews) || 0,
            description: ebook.description || "No description available",
            image: this.processImageUrl(ebook.coverImage || ebook.image) || this.generateGradient(ebook.category),
            downloadUrl: ebook.downloadUrl || ebook.fileUrl || "",
            fileSize: parseFloat(ebook.fileSize) || 0,
            fileFormat: ebook.fileFormat || "PDF",
            pages: parseInt(ebook.pages) || 0,
            featured: ebook.featured === true,
            bestseller: ebook.bestseller === true,
            isFree: true // All ebooks are now free
        }));
    }

    /**
     * Transform API project data to match the expected format
     */
    transformProjectData(apiProjects) {
        return apiProjects.map(project => ({
            id: project._id || project.id,
            title: project.title || "Untitled Project",
            tamilTitle: project.titleTamil || project.title || "Project",
            description: project.description || "No description available",
            category: project.category || "other",
            status: project.status || "planning",
            priority: project.priority || "medium",
            startDate: project.startDate || new Date().toISOString(),
            endDate: project.endDate || null,
            budget: parseFloat(project.budget) || 0,
            image: project.image || this.generateGradient(project.category),
            featured: project.featured === true,
            needsVolunteers: project.needsVolunteers === true,
            teamMembers: project.teamMembers || [],
            goals: project.goals || "",
            progress: parseInt(project.progress) || 0
        }));
    }

    /**
     * Generate a gradient background based on category
     */
    generateGradient(category) {
        const gradients = {
            literature: "linear-gradient(135deg, var(--primary-color, #2563eb), var(--primary-dark, #1e40af))",
            poetry: "linear-gradient(135deg, var(--accent-purple, #8b5cf6), var(--accent-purple-dark, #7c3aed))",
            history: "linear-gradient(135deg, var(--accent-cyan, #06b6d4), var(--accent-cyan-dark, #0891b2))",
            culture: "linear-gradient(135deg, var(--error-color, #ef4444), var(--error-dark, #dc2626))",
            language: "linear-gradient(135deg, var(--success-color, #10b981), var(--success-dark, #059669))",
            education: "linear-gradient(135deg, var(--warning-color, #f59e0b), var(--warning-dark, #f97316))",
            children: "linear-gradient(135deg, var(--accent-pink, #ec4899), var(--accent-pink-dark, #db2777))",
            religion: "linear-gradient(135deg, var(--accent-indigo, #6366f1), var(--accent-indigo-dark, #4f46e5))",
            technology: "linear-gradient(135deg, var(--accent-teal, #14b8a6), var(--accent-teal-dark, #0d9488))",
            research: "linear-gradient(135deg, var(--accent-lime, #84cc16), var(--accent-lime-dark, #65a30d))",
            "cultural-preservation": "linear-gradient(135deg, var(--error-color, #ef4444), var(--error-dark, #dc2626))",
            "language-development": "linear-gradient(135deg, var(--success-color, #10b981), var(--success-dark, #059669))",
            "community-outreach": "linear-gradient(135deg, var(--warning-color, #f59e0b), var(--warning-dark, #f97316))",
            publishing: "linear-gradient(135deg, var(--primary-color, #2563eb), var(--primary-dark, #1e40af))",
            events: "linear-gradient(135deg, var(--accent-purple, #8b5cf6), var(--accent-purple-dark, #7c3aed))",
            other: "linear-gradient(135deg, var(--text-secondary, #6b7280), var(--text-tertiary, #4b5563))"
        };
        
        return gradients[category] || gradients.other;
    }

    /**
     * Initialize the books page with API data
     */
    async initializeBooksPage() {
        try {
            console.log("Initializing books page with API data...");
            
            // Show loading state
            this.showLoadingState();
            
            // Fetch data from API
            const [books, ebooks, projects] = await Promise.all([
                this.fetchBooks(),
                this.fetchEbooks(),
                this.fetchProjects()
            ]);
            
            // Transform data
            const transformedBooks = this.transformBookData(books);
            const transformedEbooks = this.transformEbookData(ebooks);
            const transformedProjects = this.transformProjectData(projects);
            
            // Update global variables if they exist
            if (typeof window.storeBooks !== "undefined") {
                window.storeBooks = transformedBooks;
                window.filteredBooks = [...transformedBooks];
                
                // Re-render the page
                if (typeof window.renderFeaturedBooks === "function") {
                    window.renderFeaturedBooks();
                }
                if (typeof window.renderBooks === "function") {
                    window.renderBooks();
                }
            }
            
            // Hide loading state
            this.hideLoadingState();
            
            console.log("Books page initialized with API data");
            console.log("Books:", transformedBooks.length);
            console.log("Ebooks:", transformedEbooks.length);
            console.log("Projects:", transformedProjects.length);
            
            return {
                books: transformedBooks,
                ebooks: transformedEbooks,
                projects: transformedProjects
            };
            
        } catch (error) {
            console.error("Error initializing books page:", error);
            this.hideLoadingState();
            this.showErrorMessage("Failed to load books data. Please try again later.");
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const booksGrid = document.getElementById("books-grid");
        const featuredContainer = document.querySelector(".books-showcase");
        
        const loadingHTML = `
            <div class="loading-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid var(--border-secondary); border-top: 4px solid var(--border-accent); border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="margin-top: 1rem; color: var(--text-tertiary);">Loading books...</p>
            </div>
        `;
        
        if (booksGrid) {
            booksGrid.innerHTML = loadingHTML;
        }
        if (featuredContainer) {
            featuredContainer.innerHTML = loadingHTML;
        }
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        const loadingStates = document.querySelectorAll(".loading-state");
        loadingStates.forEach(state => state.remove());
    }

    /**
     * Show error message
     */
    showErrorMessage(message) {
        const booksGrid = document.getElementById("books-grid");
        if (booksGrid) {
            booksGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <div style="color: var(--text-danger); font-size: 3rem; margin-bottom: 1rem;">
            <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">Oops! Something went wrong</h3>
        <p style="color: var(--text-tertiary);">${message}</p>
                    <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 1rem;">
                        <i class="fas fa-refresh"></i> Try Again
                    </button>
                </div>
            `;
        }
    }
}

// Create global instance
window.BooksAPI = new BooksAPI();

// Auto-initialize when DOM is loaded (only if not already handled by page)
document.addEventListener("DOMContentLoaded", function() {
    // Check if this is the books page and if it has its own initialization
    if (window.location.pathname.includes("books.html")) {
        // Let books.html handle the initialization
        console.log("Books page detected - letting page handle initialization");
        return;
    }
    
    // For other pages, auto-initialize
    setTimeout(() => {
        window.BooksAPI.initializeBooksPage();
    }, 500);
});

// Add CSS for loading animation
const loadingStyle = document.createElement("style");
loadingStyle.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(loadingStyle);