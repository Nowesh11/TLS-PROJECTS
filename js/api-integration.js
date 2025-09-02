/**
 * API Integration for Tamil Language Society Website
 * Handles dynamic content loading from backend database
 */

// Use window object to avoid conflicts with other script declarations
window.TLS_API_BASE_URL = window.TLS_API_BASE_URL || "http://localhost:8080";

// Global variables for cached data
let cachedBooks = [];
let cachedEbooks = [];
let cachedProjects = [];
let cachedWebsiteContent = {};

/**
 * Get authentication token from localStorage
 */
function getAuthToken() {
    return localStorage.getItem("authToken") || localStorage.getItem("token");
}

/**
 * Generic API call function with comprehensive error handling and authentication
 */
if (typeof window.apiCall !== "function") {
    window.apiCall = async function(endpoint, options = {}) {
        const maxRetries = 5; // Increased retries
        const retryDelay = 1000; // 1 second base delay
        const timeout = 15000; // 15 second timeout
        
        // Prevent infinite retry loops for authentication
        const maxAuthRetries = 2;
        const authRetryCount = options._authRetryCount || 0;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Get auth token if available
                const token = getAuthToken();
                
                const defaultHeaders = {
                    "Content-Type": "application/json"
                };
                
                // Add authorization header if token exists
                if (token) {
                    defaultHeaders["Authorization"] = `Bearer ${token}`;
                }
                
                console.log(`🔄 API Call attempt ${attempt}/${maxRetries}: ${endpoint}`);
                
                // Create AbortController for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                
                const response = await fetch(`${window.TLS_API_BASE_URL}${endpoint}`, {
                    headers: {
                        ...defaultHeaders,
                        ...options.headers
                    },
                    credentials: "include",
                    signal: controller.signal,
                    ...options
                });

                clearTimeout(timeoutId);

                // Handle specific HTTP status codes
                if (!response.ok) {
                    // Handle 401 Unauthorized - Token expired or invalid
                    if (response.status === 401 && authRetryCount < maxAuthRetries) {
                        console.log("🔐 401 Unauthorized detected - attempting token refresh...");
                        
                        let tokenRefreshed = false;
                        
                        // Try to refresh token using TokenManager
                        if (window.tokenManager) {
                            try {
                                const newToken = await window.tokenManager.attemptTokenRefresh();
                                tokenRefreshed = !!newToken;
                            } catch (refreshError) {
                                console.error("Token refresh failed:", refreshError);
                            }
                        }
                        
                        if (tokenRefreshed) {
                            console.log("✅ Token refreshed successfully, retrying API call...");
                            // Retry with refreshed token
                            const retryOptions = {
                                ...options,
                                _authRetryCount: authRetryCount + 1
                            };
                            return await window.apiCall(endpoint, retryOptions);
                        } else {
                            console.log("❌ Token refresh failed, redirecting to login...");
                            if (typeof window.location !== "undefined") {
                                window.location.href = "login.html";
                            }
                            throw new Error("Authentication required - please log in again");
                        }
                    }
                    
                    // Handle 429 Rate Limiting
                    if (response.status === 429) {
                        const retryAfter = response.headers.get("Retry-After");
                        const delay = retryAfter ? parseInt(retryAfter) * 1000 : retryDelay * Math.pow(2, attempt);
                        
                        console.log(`⏱️ Rate limited (429) - waiting ${delay}ms before retry...`);
                        
                        if (attempt < maxRetries) {
                            await new Promise(resolve => setTimeout(resolve, delay));
                            continue;
                        }
                    }
                    
                    // Try to extract error message from response
                    let errorMessage = `API call failed: ${response.status} ${response.statusText}`;
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorData.error || errorMessage;
                    } catch (e) {
                        // Ignore JSON parsing errors for error responses
                    }
                    
                    throw new Error(errorMessage);
                }

                // Check if response is JSON
                const contentType = response.headers.get("content-type");
                let data;
                
                if (contentType && contentType.includes("application/json")) {
                    data = await response.json();
                } else {
                    // Handle non-JSON responses (like file uploads)
                    const text = await response.text();
                    try {
                        data = JSON.parse(text);
                    } catch (e) {
                        // If it's not JSON, return a success response
                        data = { success: true, message: "Operation completed successfully" };
                    }
                }
                
                console.log(`✅ API Call successful: ${endpoint}`);
                return data;
            } catch (error) {
                console.error(`❌ API Error for ${endpoint} (attempt ${attempt}/${maxRetries}):`, error);
                
                // Check for specific error types
                const errorMessage = error.message || error.toString() || "Unknown error";
                const errorName = error.name || "";
                
                const isNetworkError = errorMessage.includes("Failed to fetch") || 
                                     errorMessage.includes("ERR_ABORTED") ||
                                     errorName === "AbortError" ||
                                     errorMessage.includes("NetworkError") ||
                                     errorMessage.includes("ERR_NETWORK") ||
                                     errorMessage.includes("ERR_INTERNET_DISCONNECTED");
                
                const isTimeoutError = errorName === "AbortError" || errorMessage.includes("timeout");
                const isServerError = errorMessage.includes("500") || errorMessage.includes("502") || 
                                    errorMessage.includes("503") || errorMessage.includes("504");
                
                // If this is the last attempt, handle the error appropriately
                if (attempt === maxRetries) {
                    if (isNetworkError) {
                        console.warn(`🌐 Network connectivity issue detected for ${endpoint}`);
                        // Show user-friendly network error notification
                        if (typeof window.showNetworkErrorNotification === "function") {
                            window.showNetworkErrorNotification();
                        } else {
                            console.warn("Network error: Please check your internet connection and try again.");
                        }
                    } else if (isTimeoutError) {
                        console.warn(`⏰ Request timeout for ${endpoint}`);
                    } else if (isServerError) {
                        console.warn(`🔧 Server error for ${endpoint} - please try again later`);
                    }
                    throw error;
                }
                
                // Calculate retry delay with exponential backoff
                let delay = retryDelay;
                
                if (isNetworkError || isTimeoutError) {
                    // Longer delays for network/timeout errors
                    delay = retryDelay * 2 * Math.pow(2, attempt - 1);
                } else if (isServerError) {
                    // Medium delays for server errors
                    delay = retryDelay * 1.5 * Math.pow(2, attempt - 1);
                } else {
                    // Standard exponential backoff for other errors
                    delay = retryDelay * Math.pow(2, attempt - 1);
                }
                
                // Cap maximum delay at 30 seconds
                delay = Math.min(delay, 30000);
                
                console.log(`⏳ Retrying in ${delay}ms... (${isNetworkError ? "Network error" : isTimeoutError ? "Timeout error" : isServerError ? "Server error" : "General error"})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    };
}

/**
 * Load books from database
 */
async function loadBooksFromAPI() {
    try {
        const response = await apiCall("/api/books");
        cachedBooks = response.data || [];
        return cachedBooks;
    } catch (error) {
        console.error("Failed to load books from API:", error);
        // Return fallback static data if API fails
        return getStaticBooks();
    }
}

/**
 * Load ebooks from database
 */
async function loadEbooksFromAPI() {
    try {
        const response = await apiCall("/api/ebooks");
        const rawEbooks = response.data || [];
        
        // Transform the ebooks to match frontend format
        cachedEbooks = rawEbooks.map(ebook => transformEbookData(ebook));
        
        console.log("Loaded ebooks from API:", cachedEbooks.length, "ebooks");
        return cachedEbooks;
    } catch (error) {
        console.error("Failed to load ebooks from API:", error);
        return getStaticEbooks();
    }
}

/**
 * Load projects from database
 */
async function loadProjectsFromAPI() {
    try {
        const response = await apiCall("/api/projects");
        const rawProjects = response.data || [];
        
        // Transform the projects to match frontend format
        cachedProjects = rawProjects.map(project => transformProjectData(project));
        
        return cachedProjects;
    } catch (error) {
        console.error("Failed to load projects from API:", error);
        return getStaticProjects();
    }
}

/**
 * Load website content from database
 */
async function loadWebsiteContentFromAPI(page = null) {
    try {
        // Use the sections endpoint for section-based content
        const endpoint = page ? `/api/website-content/sections/${page}` : "/api/website-content/sections/home";
        const response = await apiCall(endpoint);
        const content = response.data || [];
        
        if (page) {
            cachedWebsiteContent[page] = content;
        } else {
            cachedWebsiteContent = content;
        }
        
        console.log(`Loaded website content${page ? ` for page: ${page}` : ""}, ${Array.isArray(content) ? content.length : Object.keys(content).length} items`);
        return page ? content : cachedWebsiteContent;
    } catch (error) {
        console.error("Failed to load website content from API:", error);
        return page ? [] : {};
    }
}

/**
 * Transform database book data to website format
 */
function transformBookData(dbBook) {
    // Handle cover image - use gradient if no valid image URL
    let bookImage = generateBookGradient(dbBook.category);
    if (dbBook.coverImage && dbBook.coverImage !== "/assets/default-book-cover.svg" && dbBook.coverImage.trim() !== "") {
        // If it's a full URL, use it; if it's a relative path, make it absolute
        if (dbBook.coverImage.startsWith("http")) {
            bookImage = dbBook.coverImage;
        } else if (dbBook.coverImage.startsWith("/uploads/") || dbBook.coverImage.startsWith("/assets/")) {
            bookImage = `${window.TLS_API_BASE_URL}${dbBook.coverImage}`;
        } else if (dbBook.coverImage.startsWith("uploads/")) {
            bookImage = `${window.TLS_API_BASE_URL}/${dbBook.coverImage}`;
        } else {
            // If it's just a filename, assume it's in the uploads/books directory
            bookImage = `${window.TLS_API_BASE_URL}/uploads/books/${dbBook.coverImage}`;
        }
    }

    return {
        id: dbBook._id || dbBook.id,
        title: dbBook.title,
        tamilTitle: dbBook.titleTamil || dbBook.title,
        author: dbBook.author,
        category: dbBook.category || "general",
        price: parseFloat(dbBook.price) || 0,
        originalPrice: parseFloat(dbBook.originalPrice) || parseFloat(dbBook.price) || 0,
        rating: parseFloat(dbBook.rating) || 4.5,
        reviews: parseInt(dbBook.reviewCount) || 0,
        description: dbBook.description || "",
        image: bookImage,
        inStock: dbBook.inStock !== false,
        bestseller: dbBook.bestseller || false,
        featured: dbBook.featured || false,
        isbn: dbBook.isbn || "",
        publishedDate: dbBook.publishedDate || "",
        pages: dbBook.pages || 0,
        stockQuantity: dbBook.stockQuantity || 0,
        language: dbBook.bookLanguage || dbBook.language || "Tamil"
    };
}

/**
 * Transform database ebook data to website format
 */
function transformEbookData(dbEbook) {
    // Handle cover image - use gradient if no valid image URL
    let ebookImage = generateBookGradient(dbEbook.category);
    if (dbEbook.coverImage && dbEbook.coverImage !== "/assets/default-ebook-cover.jpg" && dbEbook.coverImage.trim() !== "") {
        // If it's a full URL, use it; if it's a relative path, make it absolute
        if (dbEbook.coverImage.startsWith("http")) {
            ebookImage = dbEbook.coverImage;
        } else if (dbEbook.coverImage.startsWith("/uploads/") || dbEbook.coverImage.startsWith("/assets/")) {
            ebookImage = `${window.TLS_API_BASE_URL}${dbEbook.coverImage}`;
        } else if (dbEbook.coverImage.startsWith("uploads/")) {
            ebookImage = `${window.TLS_API_BASE_URL}/${dbEbook.coverImage}`;
        } else {
            // If it's just a filename, assume it's in the uploads/ebooks directory
            ebookImage = `${window.TLS_API_BASE_URL}/uploads/ebooks/${dbEbook.coverImage}`;
        }
    }

    return {
        id: dbEbook._id || dbEbook.id,
        title: dbEbook.title,
        tamilTitle: dbEbook.titleTamil || dbEbook.tamilTitle || dbEbook.title,
        author: dbEbook.author,
        authorTamil: dbEbook.authorTamil || dbEbook.author,
        category: dbEbook.category || "general",
        language: dbEbook.bookLanguage || dbEbook.language || "tamil",
        rating: parseFloat(dbEbook.rating) || 4.5,
        downloads: parseInt(dbEbook.downloadCount) || parseInt(dbEbook.downloads) || 0,
        description: dbEbook.description || "",
        descriptionTamil: dbEbook.descriptionTamil || dbEbook.description,
        color: generateBookGradient(dbEbook.category),
        image: ebookImage,
        fileUrl: dbEbook.fileUrl || "",
        fileSize: dbEbook.fileSize || "",
        format: dbEbook.fileFormat || dbEbook.format || "PDF",
        featured: dbEbook.featured === "true" || dbEbook.featured === true,
        isFree: dbEbook.isFree !== false,
        tags: dbEbook.tags || []
    };
}

/**
 * Transform database project data to website format
 */
function transformProjectData(dbProject) {
    const categoryColors = {
        "media-public-relations": "var(--primary-blue)",
        "sports-leadership": "var(--success-color)",
        "education-intellectual": "var(--warning-color)",
        "arts-culture": "var(--purple-color)",
        "social-welfare-voluntary": "var(--error-color)",
        "language-literature": "var(--cyan-color)"
    };

    const categoryIcons = {
        "media-public-relations": "fas fa-bullhorn",
        "sports-leadership": "fas fa-trophy",
        "education-intellectual": "fas fa-graduation-cap",
        "arts-culture": "fas fa-palette",
        "social-welfare-voluntary": "fas fa-hands-helping",
        "language-literature": "fas fa-book-open"
    };

    const statusMap = {
        "planning": { label: "Planning", color: "var(--warning-color)" },
        "active": { label: "Active", color: "var(--success-color)" },
        "completed": { label: "Completed", color: "var(--primary-blue)" },
        "on-hold": { label: "On Hold", color: "var(--error-color)" }
    };

    const progressMap = {
        "planning": Math.floor(Math.random() * 30) + 10,
        "active": Math.floor(Math.random() * 40) + 40,
        "completed": 100,
        "on-hold": Math.floor(Math.random() * 60) + 20
    };

    const category = dbProject.category || "other";
    const status = dbProject.status || "active";

    return {
        _id: dbProject._id || dbProject.id,
        id: dbProject._id || dbProject.id,
        title: dbProject.title,
        tamilTitle: dbProject.tamilTitle || dbProject.title,
        description: dbProject.description || "",
        category: category,
        status: statusMap[status] || statusMap["active"],
        progress: progressMap[status] || 25,
        color: categoryColors[category] || categoryColors["other"],
        icon: categoryIcons[category] || categoryIcons["other"],
        featured: dbProject.featured === "true" || dbProject.featured === true,
        startDate: dbProject.startDate || "",
        endDate: dbProject.endDate || "",
        participants: parseInt(dbProject.participants) || 0,
        gradient: generateProjectGradient(category),
        createdAt: dbProject.createdAt
    };
}

/**
 * Generate gradient colors for books based on category
 */
function generateBookGradient(category) {
    const gradients = {
        literature: "linear-gradient(135deg, var(--primary-blue), var(--secondary-purple))",
        education: "linear-gradient(135deg, var(--warning-color), var(--orange-color))",
        culture: "linear-gradient(135deg, var(--success-color), var(--success-dark))",
        children: "linear-gradient(135deg, var(--purple-color), var(--purple-dark))",
        religion: "linear-gradient(135deg, var(--error-color), var(--error-dark))",
        history: "linear-gradient(135deg, var(--cyan-color), var(--cyan-dark))",
        general: "linear-gradient(135deg, var(--indigo-color), var(--purple-color))"
    };
    return gradients[category] || gradients.general;
}

/**
 * Generate gradient colors for projects based on category
 */
function generateProjectGradient(category) {
    const gradients = {
        cultural: "linear-gradient(135deg, var(--warning-color), var(--orange-color))",
        educational: "linear-gradient(135deg, var(--success-color), var(--success-dark))",
        community: "linear-gradient(135deg, var(--purple-color), var(--purple-dark))",
        research: "linear-gradient(135deg, var(--cyan-color), var(--cyan-dark))",
        general: "linear-gradient(135deg, var(--primary-blue), var(--secondary-purple))"
    };
    return gradients[category] || gradients.general;
}

/**
 * Fallback static books data
 */
function getStaticBooks() {
    return [
        {
            id: "book_001",
            title: "Thirukkural with Commentary",
            tamilTitle: "திருக்குறள் உரையுடன்",
            author: "Thiruvalluvar",
            category: "literature",
            price: 45,
            originalPrice: 50,
            rating: 4.9,
            reviews: 234,
            description: "Complete Thirukkural with detailed commentary and explanations in Tamil and English.",
            image: "linear-gradient(135deg, var(--primary-blue), var(--secondary-purple))",
            inStock: true,
            bestseller: true,
            featured: true
        },
        {
            id: "book_002",
            title: "Tamil Grammar Made Easy",
            tamilTitle: "எளிய தமிழ் இலக்கணம்",
            author: "Prof. S. Vellaiyan",
            category: "education",
            price: 35,
            originalPrice: 40,
            rating: 4.7,
            reviews: 156,
            description: "Comprehensive guide to Tamil grammar for students and language enthusiasts.",
            image: "linear-gradient(135deg, var(--warning-color), var(--orange-color))",
            inStock: true,
            bestseller: false,
            featured: true
        }
    ];
}

/**
 * Fallback static ebooks data
 */
function getStaticEbooks() {
    return [
        {
            id: "ebook_001",
            title: "Digital Tamil Literature",
            tamilTitle: "டிஜிட்டல் தமிழ் இலக்கியம்",
            author: "Various Authors",
            category: "literature",
            language: "tamil",
            rating: 4.8,
            downloads: 2500,
            description: "Collection of modern Tamil literature in digital format",
            color: "var(--primary-blue)",
            featured: true
        }
    ];
}

/**
 * Fallback static projects data
 */
function getStaticProjects() {
    return [
        {
            _id: "project_001",
            title: "Tamil Language Preservation",
            titleTamil: "தமிழ் மொழி பாதுகாப்பு",
            description: "Initiative to preserve and promote Tamil language among youth through digital platforms and community engagement",
            category: "cultural",
            status: "active",
            progress: 75,
            participants: 150,
            budget: { total: 45000, spent: 33750, currency: "RM" },
            gradient: "linear-gradient(135deg, var(--warning-color), var(--orange-color))",
            icon: "fas fa-language",
            featured: true,
            details: "A comprehensive program focused on preserving Tamil language heritage through modern digital tools and community workshops."
        },
        {
            _id: "project_002",
            title: "Digital Tamil Archive",
            titleTamil: "டிஜிட்டல் தமிழ் காப்பகம்",
            description: "Creating a comprehensive digital repository of Tamil literature, manuscripts, and cultural artifacts",
            category: "technology",
            status: "in development",
            progress: 60,
            participants: 85,
            budget: { total: 75000, spent: 45000, currency: "RM" },
            gradient: "linear-gradient(135deg, var(--primary-blue), var(--primary-dark))",
            icon: "fas fa-archive",
            featured: true,
            details: "Building a state-of-the-art digital archive to preserve and make accessible thousands of Tamil literary works and historical documents."
        },
        {
            _id: "project_003",
            title: "Community Forums",
            titleTamil: "சமூக மன்றங்கள்",
            description: "Online platform for Tamil speakers worldwide to connect, share knowledge, and collaborate",
            category: "community",
            status: "active",
            progress: 90,
            participants: 320,
            budget: { total: 25000, spent: 22500, currency: "RM" },
            gradient: "linear-gradient(135deg, var(--success-color), var(--success-dark))",
            icon: "fas fa-users",
            featured: false,
            details: "A vibrant online community where Tamil speakers from around the world can connect, discuss, and share their experiences."
        },
        {
            _id: "project_004",
            title: "Tamil Poetry Collection",
            titleTamil: "தமிழ் கவிதை தொகுப்பு",
            description: "Curated collection of classical and contemporary Tamil poetry with translations and analysis",
            category: "literature",
            status: "completed",
            progress: 100,
            participants: 45,
            budget: { total: 15000, spent: 15000, currency: "RM" },
            gradient: "linear-gradient(135deg, var(--purple-color), var(--purple-dark))",
            icon: "fas fa-feather-alt",
            featured: true,
            details: "A beautifully curated collection featuring both classical Tamil poetry and contemporary works with detailed analysis and translations."
        },
        {
            _id: "project_005",
            title: "Virtual Tamil Classroom",
            titleTamil: "மெய்நிகர் தமிழ் வகுப்பறை",
            description: "Interactive online learning platform for Tamil language education and cultural studies",
            category: "education",
            status: "active",
            progress: 45,
            participants: 200,
            budget: { total: 60000, spent: 27000, currency: "RM" },
            gradient: "linear-gradient(135deg, var(--error-color), var(--error-dark))",
            icon: "fas fa-chalkboard-teacher",
            featured: false,
            details: "An innovative virtual classroom environment designed to make Tamil language learning engaging and accessible to students worldwide."
        },
        {
            _id: "project_006",
            title: "Tamil Music Heritage",
            titleTamil: "தமிழ் இசை பாரம்பரியம்",
            description: "Preserving and promoting traditional Tamil music through digital recordings and educational content",
            category: "cultural",
            status: "on hold",
            progress: 25,
            participants: 60,
            budget: { total: 35000, spent: 8750, currency: "RM" },
            gradient: "linear-gradient(135deg, var(--orange-color), var(--orange-dark))",
            icon: "fas fa-music",
            featured: false,
            details: "A project dedicated to preserving the rich heritage of Tamil music through high-quality digital recordings and educational materials."
        }
    ];
}

// Make getStaticProjects globally accessible
window.getStaticProjects = getStaticProjects;

/**
 * Show page loading indicator
 */
function showPageLoadingIndicator(message = "Loading...") {
    // Remove existing indicator
    hidePageLoadingIndicator();
    
    const indicator = document.createElement("div");
    indicator.id = "page-loading-indicator";
    indicator.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <span class="loading-text">${message}</span>
        </div>
    `;
    
    indicator.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--bg-overlay-white);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9998;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    const style = document.createElement("style");
    style.textContent = `
        #page-loading-indicator .loading-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
        }
        #page-loading-indicator .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--border-light);
         border-top: 3px solid var(--primary-blue);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        #page-loading-indicator .loading-text {
            font-size: 16px;
            color: var(--text-secondary);
            font-weight: 500;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(indicator);
}

/**
 * Hide page loading indicator
 */
function hidePageLoadingIndicator() {
    const indicator = document.getElementById("page-loading-indicator");
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Show fallback message for failed content loading
 */
function showFallbackMessage(contentType) {
    const messages = {
        books: "Unable to load books. Please check your connection and try again.",
        ebooks: "Unable to load ebooks. Please check your connection and try again.",
        projects: "Unable to load projects. Please check your connection and try again.",
        content: "Unable to load content. Please check your connection and try again."
    };
    
    const message = messages[contentType] || "Unable to load content.";
    
    const fallbackDiv = document.createElement("div");
    fallbackDiv.className = "content-fallback-message";
    fallbackDiv.innerHTML = `
        <div class="fallback-content">
            <i class="fas fa-exclamation-circle"></i>
            <h3>Content Unavailable</h3>
            <p>${message}</p>
            <button onclick="window.location.reload()" class="retry-btn">
                <i class="fas fa-redo"></i> Try Again
            </button>
        </div>
    `;
    
    fallbackDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 8px 32px var(--shadow-lg);
        text-align: center;
        z-index: 9999;
        max-width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    const style = document.createElement("style");
    style.textContent = `
        .content-fallback-message .fallback-content i {
            font-size: 48px;
            color: var(--warning-light);
            margin-bottom: 15px;
        }
        .content-fallback-message .fallback-content h3 {
            margin: 0 0 10px 0;
            color: var(--text-primary);
            font-size: 20px;
        }
        .content-fallback-message .fallback-content p {
            margin: 0 0 20px 0;
            color: var(--text-secondary);
            line-height: 1.5;
        }
        .content-fallback-message .retry-btn {
            background: var(--primary-blue);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: background-color 0.2s;
        }
        .content-fallback-message .retry-btn:hover {
            background: var(--secondary-blue);
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(fallbackDiv);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (fallbackDiv.parentNode) {
            fallbackDiv.parentNode.removeChild(fallbackDiv);
        }
    }, 10000);
}

/**
 * Initialize API integration when DOM is loaded with improved error handling
 */
document.addEventListener("DOMContentLoaded", async function() {
    console.log("🚀 Starting API integration initialization...");
    const startTime = performance.now();
    
    try {
        // Check if we're on a page that needs dynamic content
        const activePage = window.location.pathname.split("/").pop() || "index.html";
        console.log(`📄 Detected page: ${activePage}`);
        
        // Initialize with timeout protection
        const result = await initializePageWithTimeout(activePage);
        
        const endTime = performance.now();
        if (result !== null) {
            console.log(`✅ API integration completed in ${(endTime - startTime).toFixed(2)}ms`);
        } else {
            console.log(`⚠️ API integration completed with warnings in ${(endTime - startTime).toFixed(2)}ms`);
        }
        
    } catch (error) {
        console.error("❌ API integration initialization failed:", error);
        handleAPIInitializationFailure(error);
    }
});

/**
 * Initialize page with timeout protection
 */
async function initializePageWithTimeout(activePage) {
    const initializationPromise = initializePageContent(activePage);
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Page initialization timeout for ${activePage}`)), 10000);
    });
    
    try {
        return await Promise.race([initializationPromise, timeoutPromise]);
    } catch (error) {
        console.warn(`⚠️ Page initialization failed for ${activePage}:`, error.message);
        // Don't throw the error, just log it and continue
        return null;
    }
}

/**
 * Initialize page content based on active page
 */
async function initializePageContent(activePage) {
    switch (activePage) {
        case "books.html":
            await initializeBooksPage();
            break;
        case "ebooks.html":
            await initializeEbooksPage();
            break;
        case "projects.html":
            await initializeProjectsPage();
            break;
        case "index.html":
        case "":
            await initializeHomePage();
            break;
        default:
            console.log(`ℹ️ No specific initialization needed for ${activePage}`);
    }
}

/**
 * Show network error notification to user
 */
window.showNetworkErrorNotification = function() {
    // Prevent multiple notifications
    if (document.querySelector(".network-error-notification")) {
        return;
    }
    
    const notification = document.createElement("div");
    notification.className = "network-error-notification";
    notification.innerHTML = `
        <div class="error-content">
            <i class="fas fa-wifi"></i>
            <span>Network connection issue. Please check your internet and try again.</span>
            <button onclick="window.location.reload()" class="retry-btn">
                <i class="fas fa-redo"></i> Retry
            </button>
            <button onclick="this.parentElement.parentElement.remove()" class="close-btn">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--error-color);
        color: white;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px var(--shadow-md);
        z-index: 10000;
        font-size: 14px;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    // Add CSS animation
    if (!document.querySelector("#network-error-styles")) {
        const styles = document.createElement("style");
        styles.id = "network-error-styles";
        styles.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .error-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .retry-btn, .close-btn {
                background: var(--bg-overlay-light);
                border: none;
                color: white;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: background 0.2s;
            }
            .retry-btn:hover, .close-btn:hover {
                background: var(--bg-overlay-medium);
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = "slideInRight 0.3s ease-out reverse";
            setTimeout(() => notification.remove(), 300);
        }
    }, 10000);
};

/**
 * Handle API initialization failure
 */
function handleAPIInitializationFailure(error) {
    console.error("🚨 API initialization failure:", {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href
    });
    
    // Show user-friendly message
    const errorNotification = document.createElement("div");
    errorNotification.className = "api-error-notification";
    errorNotification.innerHTML = `
        <div class="error-content">
            <i class="fas fa-wifi"></i>
            <span>Some content may not load properly. Using cached data.</span>
            <button onclick="window.location.reload()" class="retry-btn">
                <i class="fas fa-redo"></i>
            </button>
        </div>
    `;
    
    errorNotification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: var(--warning-light);
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        box-shadow: 0 4px 12px var(--shadow-md);
        z-index: 9999;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 350px;
    `;
    
    document.body.appendChild(errorNotification);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (errorNotification.parentNode) {
            errorNotification.parentNode.removeChild(errorNotification);
        }
    }, 8000);
}

/**
 * Initialize books page with dynamic data and improved error handling
 */
async function initializeBooksPage() {
    console.log("📚 Initializing books page...");
    
    try {
        // Show loading indicator
        showPageLoadingIndicator("Loading books...");
        
        const books = await loadBooksFromAPI();
        const transformedBooks = books.map(transformBookData);
        
        // Replace the static storeBooks array
        window.storeBooks = transformedBooks;
        window.filteredBooks = [...transformedBooks];
        
        // Re-initialize the page with new data
        if (typeof window.initializePage === "function") {
            await window.initializePage();
        } else {
            // Fallback to individual render functions
            if (typeof window.renderFeaturedBooks === "function") {
                window.renderFeaturedBooks();
            }
            if (typeof window.renderBooks === "function") {
                window.renderBooks();
            }
        }
        
        hidePageLoadingIndicator();
        console.log(`✅ Loaded ${transformedBooks.length} books from API`);
        
    } catch (error) {
        console.error("❌ Failed to initialize books page:", error);
        hidePageLoadingIndicator();
        
        // Try to use fallback data
        if (window.storeBooks && window.storeBooks.length > 0) {
            console.log("📦 Using existing static data as fallback");
        } else {
            showFallbackMessage("books");
        }
    }
}

/**
 * Initialize ebooks page with dynamic data and improved error handling
 */
async function initializeEbooksPage() {
    console.log("📖 Initializing ebooks page...");
    
    try {
        // Show loading indicator
        showPageLoadingIndicator("Loading ebooks...");
        
        const ebooks = await loadEbooksFromAPI();
        const transformedEbooks = ebooks.map(transformEbookData);
        
        // Set global ebooks data
        window.allEbooks = transformedEbooks;
        window.currentBooks = transformedEbooks.slice(0, 6);
        window.filteredBooks = [...transformedEbooks];
        
        // Re-initialize the page with new data
        if (typeof window.initializePage === "function") {
            await window.initializePage();
        } else if (typeof window.renderBooks === "function") {
            window.renderBooks(window.currentBooks);
        }
        
        hidePageLoadingIndicator();
        console.log(`✅ Loaded ${transformedEbooks.length} ebooks from API`);
        
    } catch (error) {
        console.error("❌ Failed to initialize ebooks page:", error);
        hidePageLoadingIndicator();
        
        // Try to use fallback data
        if (window.allEbooks && window.allEbooks.length > 0) {
            console.log("📦 Using existing static data as fallback");
        } else {
            showFallbackMessage("ebooks");
        }
    }
}

/**
 * Initialize projects page with dynamic data and improved error handling
 */
async function initializeProjectsPage() {
    console.log("🚀 Initializing projects page...");
    
    try {
        // Show loading indicator
        showPageLoadingIndicator("Loading projects...");
        
        const projects = await loadProjectsFromAPI();
        // Projects are already transformed in loadProjectsFromAPI
        
        // Set global projects data
        window.allProjects = projects;
        window.filteredProjects = [...projects];
        
        // Re-initialize the page with new data
        if (typeof window.initializePage === "function") {
            await window.initializePage();
        } else if (typeof window.renderProjects === "function") {
            window.renderProjects(projects);
        }
        
        hidePageLoadingIndicator();
        console.log(`✅ Loaded ${projects.length} projects from API`);
        
    } catch (error) {
        console.error("❌ Failed to initialize projects page:", error);
        hidePageLoadingIndicator();
        
        // Try to use fallback data
        if (window.allProjects && window.allProjects.length > 0) {
            console.log("📦 Using existing static data as fallback");
        } else {
            showFallbackMessage("projects");
        }
    }
}

/**
 * Initialize home page with dynamic content and improved error handling
 */
async function initializeHomePage() {
    console.log("🏠 Initializing home page...");
    
    try {
        // Show loading indicator
        showPageLoadingIndicator("Loading content...");
        
        // Load all content in parallel for better performance with shorter timeout
        const [content, books, ebooks, projects] = await Promise.allSettled([
            Promise.race([
                loadWebsiteContentFromAPI(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Content API timeout")), 5000))
            ]),
            Promise.race([
                loadBooksFromAPI(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Books API timeout")), 5000))
            ]),
            Promise.race([
                loadEbooksFromAPI(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Ebooks API timeout")), 5000))
            ]),
            Promise.race([
                loadProjectsFromAPI(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Projects API timeout")), 5000))
            ])
        ]);
        
        // Update homepage content if available
        if (content.status === "fulfilled" && content.value && content.value.homepage) {
            try {
                updateHomepageContent(content.value.homepage);
            } catch (contentError) {
                console.warn("⚠️ Failed to update homepage content:", contentError.message);
            }
        } else {
            console.warn("⚠️ Homepage content not available, using defaults");
        }
        
        // Update statistics with fallback values
        const stats = {
            books: books.status === "fulfilled" ? books.value.length : 0,
            ebooks: ebooks.status === "fulfilled" ? ebooks.value.length : 0,
            projects: projects.status === "fulfilled" ? projects.value.length : 0
        };
        
        // Use the page's own updateStatistics function if available
        try {
            if (typeof window.updateStatistics === "function") {
                await window.updateStatistics();
            } else {
                updateStatistics(stats);
            }
        } catch (statsError) {
            console.warn("⚠️ Failed to update statistics:", statsError.message);
        }
        
        hidePageLoadingIndicator();
        console.log("✅ Home page initialized successfully", stats);
        
    } catch (error) {
        console.error("❌ Failed to initialize home page:", error);
        hidePageLoadingIndicator();
        
        // Try to use page's own updateStatistics or fallback
        try {
            if (typeof window.updateStatistics === "function") {
                await window.updateStatistics();
            } else {
                updateStatistics({ books: 0, ebooks: 0, projects: 0 });
            }
        } catch (fallbackError) {
            console.warn("⚠️ Failed to update fallback statistics:", fallbackError.message);
        }
    }
}

/**
 * Update homepage content with dynamic data
 */
function updateHomepageContent(homepageData) {
    // Update hero section
    if (homepageData.hero) {
        const heroData = homepageData.hero;
        
        if (heroData.titleEn) {
            const titleElement = document.querySelector(".hero-title .english-title");
            if (titleElement) titleElement.textContent = heroData.titleEn;
        }
        
        if (heroData.titleTa) {
            const tamilTitleElement = document.querySelector(".hero-title .tamil-title");
            if (tamilTitleElement) tamilTitleElement.textContent = heroData.titleTa;
        }
        
        if (heroData.contentEn) {
            const subtitleElement = document.querySelector(".hero-subtitle");
            if (subtitleElement) subtitleElement.textContent = heroData.contentEn;
        }
        
        if (heroData.buttonText && heroData.buttonUrl) {
            const ctaButton = document.querySelector(".cta-button");
            if (ctaButton) {
                ctaButton.textContent = heroData.buttonText;
                ctaButton.href = heroData.buttonUrl;
            }
        }
    }
    
    // Update features section
    if (homepageData.features) {
        const featuresData = homepageData.features;
        
        if (featuresData.titleEn) {
            const featuresTitle = document.querySelector(".features .section-title");
            if (featuresTitle) featuresTitle.textContent = featuresData.titleEn;
        }
        
        if (featuresData.contentEn) {
            const featuresDesc = document.querySelector(".features .section-description");
            if (featuresDesc) featuresDesc.textContent = featuresData.contentEn;
        }
    }
    
    // Update about section
    if (homepageData.about) {
        const aboutData = homepageData.about;
        
        if (aboutData.titleEn) {
            const aboutTitle = document.querySelector(".about .section-title");
            if (aboutTitle) aboutTitle.textContent = aboutData.titleEn;
        }
        
        if (aboutData.contentEn) {
            const aboutDesc = document.querySelector(".about .section-description");
            if (aboutDesc) aboutDesc.textContent = aboutData.contentEn;
        }
    }
}

/**
 * Update statistics with real data
 */
function updateStatistics(stats) {
    const statElements = document.querySelectorAll("[data-target]");
    
    statElements.forEach(element => {
        const currentTarget = parseInt(element.dataset.target);
        const label = element.nextElementSibling?.textContent?.toLowerCase();
        
        if (label?.includes("book") && !label.includes("e-book")) {
            element.dataset.target = stats.books || currentTarget;
        } else if (label?.includes("e-book") || label?.includes("ebook")) {
            element.dataset.target = stats.ebooks || currentTarget;
        } else if (label?.includes("project")) {
            element.dataset.target = stats.projects || currentTarget;
        }
    });
}

// Export functions for global use
window.TamilSocietyAPI = {
    loadBooksFromAPI,
    loadEbooksFromAPI,
    loadProjectsFromAPI,
    loadWebsiteContentFromAPI,
    transformBookData,
    transformEbookData,
    transformProjectData
};

// Also export functions directly on window for backward compatibility
window.loadBooksFromAPI = loadBooksFromAPI;
window.loadEbooksFromAPI = loadEbooksFromAPI;
window.loadProjectsFromAPI = loadProjectsFromAPI;
window.loadWebsiteContentFromAPI = loadWebsiteContentFromAPI;