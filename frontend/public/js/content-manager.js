/**
 * Content Management System for Tamil Language Society Website
 * Handles dynamic content loading from database and replaces static content
 */

class ContentManager {
    constructor() {
        this.apiBaseUrl = window.TLS_API_BASE_URL || "http://localhost:8080";
        console.log('🔧 ContentManager initialized with API Base URL:', this.apiBaseUrl);
        console.log('🔧 window.TLS_API_BASE_URL:', window.TLS_API_BASE_URL);
        this.contentCache = new Map();
        this.currentPage = this.getCurrentPage();
        this.isLoading = false;
    }

    /**
     * Get current page name from URL
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split("/").pop();
        
        if (filename === "" || filename === "index.html") return "home";
        if (filename.includes(".html")) {
            return filename.replace(".html", "");
        }
        return "home";
    }

    /**
     * Initialize content management for current page with improved error handling and timeout
     */
    async initialize() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        const initializationTimeout = 30000; // 30 seconds - increased for network issues

        try {
            console.log(`🚀 Initializing content manager for page: ${this.currentPage}`);
            const startTime = performance.now();
            
            // Show loading indicator
            this.showContentLoadingIndicator("Loading page content...");
            
            // Run initialization with timeout protection
            try {
                await Promise.race([
                    this.runContentInitializationSequence(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error("Content initialization timeout")), initializationTimeout)
                    )
                ]);
            } catch (initError) {
                console.warn("⚠️ Content initialization had issues:", initError.message);
                
                // Show network error notification if it's a timeout or network issue
                if (initError.message.includes("timeout") || initError.message.includes("Failed to fetch")) {
                    this.showNetworkErrorNotification();
                }
                
                // Continue with basic functionality instead of failing completely
            }
            
            this.hideContentLoadingIndicator();
            
            const endTime = performance.now();
            console.log(`✅ Content manager initialization completed in ${(endTime - startTime).toFixed(2)}ms`);
            
        } catch (error) {
            this.hideContentLoadingIndicator();
            console.error("❌ Content manager initialization failed:", {
                error: error.message,
                stack: error.stack,
                page: this.currentPage,
                timestamp: new Date().toISOString()
            });
            
            // Show user-friendly error message
            this.showErrorNotification("Failed to load page content. Please refresh the page or contact support if the issue persists.");
            
            // Attempt graceful degradation
            this.handleInitializationFailure(error);
        } finally {
            this.isLoading = false;
        }
    }
    
    /**
     * Run the main content initialization sequence
     */
    async runContentInitializationSequence() {
        const tasks = [
            { name: "Page Content", fn: () => this.loadPageContent(this.currentPage) },
            { name: "Global Content", fn: () => this.loadGlobalContent() },
            { name: "Data Attributes", fn: () => this.applyDataAttributeContent() },
            { name: "Page Specific", fn: () => this.initializePageSpecific() }
        ];
        
        for (const task of tasks) {
            try {
                console.log(`📄 Loading ${task.name}...`);
                await task.fn();
                console.log(`✅ ${task.name} loaded successfully`);
            } catch (error) {
                console.warn(`⚠️ Failed to load ${task.name}:`, error);
                // Continue with other tasks even if one fails
                if (task.name === "Page Content") {
                    // If page content fails, try fallback
                    await this.loadFallbackContent(this.currentPage);
                }
            }
        }
    }

    /**
     * Apply content based on data attributes
     */
    async applyDataAttributeContent() {
        try {
            // Get all content from database
            const allContent = await this.getAllContent();
            
            // Find all elements with data-content attributes
            const contentElements = document.querySelectorAll("[data-content]");
            
            console.log(`🏷️ Found ${contentElements.length} elements with data-content attributes`);
            
            contentElements.forEach(element => {
                const contentKey = element.getAttribute("data-content");
                const contentTamilKey = element.getAttribute("data-content-tamil");
                const contentUrlKey = element.getAttribute("data-content-url");
                const placeholderKey = element.getAttribute("data-content-placeholder");
                const placeholderTamilKey = element.getAttribute("data-content-placeholder-tamil");
                
                // Find matching content in database
                const content = this.findContentByKey(allContent, contentKey);
                
                if (content) {
                    console.log(`✅ Found content for key: ${contentKey}`);
                    // Apply text content
                    if (element.tagName === "IMG") {
                        // Handle image elements
                        if (content.image) {
                            element.src = this.processImageUrl(content.image);
                        }
                        if (content.title || content.titleTamil) {
                            element.alt = this.getLocalizedText(content.title, content.titleTamil);
                        }
                    } else if (element.tagName === "A") {
                        // Handle link elements
                        if (content.buttonUrl || content.url) {
                            element.href = content.buttonUrl || content.url;
                        }
                        if (content.buttonText || content.buttonTextTamil || content.title || content.titleTamil) {
                            element.textContent = this.getLocalizedText(
                                content.buttonText || content.title, 
                                content.buttonTextTamil || content.titleTamil
                            );
                        }
                    } else if (element.tagName === "INPUT") {
                        // Handle input placeholders
                        if (placeholderKey && (content.placeholder || content.placeholderTamil)) {
                            element.placeholder = this.getLocalizedText(content.placeholder, content.placeholderTamil);
                        }
                    } else {
                        // Handle text elements
                        const text = this.getLocalizedText(content.title || content.content, content.titleTamil || content.contentTamil);
                        if (text) {
                            element.textContent = text;
                        }
                    }
                } else if (contentKey) {
                    console.warn(`⚠️ No content found for data-content key: ${contentKey}`);
                }
                
                // Handle URL attributes separately
                if (contentUrlKey) {
                    const urlContent = this.findContentByKey(allContent, contentUrlKey);
                    if (urlContent && (urlContent.url || urlContent.buttonUrl)) {
                        element.href = urlContent.url || urlContent.buttonUrl;
                    }
                }
            });
            
        } catch (error) {
            console.error("Error applying data attribute content:", error);
        }
    }

    /**
     * Get authentication token using TokenManager or fallback to localStorage
     */
    getAuthToken() {
        // Use TokenManager if available
        if (typeof window.TokenManager !== "undefined" && window.tokenManager) {
            return window.tokenManager.getToken();
        }
        
        // Fallback to direct localStorage access
        return localStorage.getItem("authToken") || localStorage.getItem("token");
    }

    /**
     * Get all content from database
     */
    async getAllContent() {
        try {
            // Load sections for home page as default - sections API requires a page parameter
            const response = await fetch(`${this.apiBaseUrl}/api/website-content/sections/home`, {
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include"
            });
            if (!response.ok) throw new Error("Failed to load all content");
            
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error("Error loading all content:", error);
            return [];
        }
    }

    /**
     * Find content by key (page.section format or sectionKey)
     */
    findContentByKey(allContent, key) {
        if (!key) return null;
        
        // First try to find by sectionKey directly
        let content = allContent.find(item => item.sectionKey === key);
        if (content) return content;
        
        // Then try page.section format
        const [page, section] = key.split(".");
        content = allContent.find(item => 
            item.page === page && item.section === section
        );
        if (content) return content;
        
        // Try mapping HTML data-content attributes to database keys
        const mappedKey = this.mapHtmlAttributeToDbKey(key);
        if (mappedKey && mappedKey !== key) {
            return this.findContentByKey(allContent, mappedKey);
        }
        
        return null;
    }
    
    /**
     * Map HTML data-content attribute names to database sectionKey format
     */
    mapHtmlAttributeToDbKey(htmlKey) {
        const keyMappings = {
            // Navigation mappings
            "nav-home": "navigation.homeLink",
            "nav-about": "navigation.aboutLink", 
            "nav-projects": "navigation.projectsLink",
            "nav-ebooks": "navigation.ebooksLink",
            "nav-books": "navigation.booksLink",
            "nav-contact": "navigation.contactLink",
        
            "nav-login": "navigation.loginLink",
            "nav-signup": "navigation.signupLink",
            "logo-text": "navigation.logoText",
            "logo-image": "navigation.logoImage",
            
            // Home page mappings
            "home-hero-title": "home.heroTitle",
            "home-hero-subtitle": "home.heroSubtitle",
            "home-hero-quote": "home.heroQuote",
            "home-features-title": "home.featuresTitle",
            
            // Projects page mappings
            "projects-hero-title": "projects.heroTitle",
            "projects-hero-subtitle": "projects.heroSubtitle",
            "projects-hero-quote": "projects.heroQuote",
            
            // About page mappings
            "about-hero-title": "about.heroTitle",
            "about-hero-subtitle": "about.heroSubtitle",
            "about-mission": "about.mission",
            "about-vision": "about.vision",
            "about-history": "about.history",
            
            // Books page mappings
            "books-hero-title": "books.heroTitle",
            "books-hero-subtitle": "books.heroSubtitle",
            
            // Ebooks page mappings
            "ebooks-hero-title": "ebooks.heroTitle",
            "ebooks-hero-subtitle": "ebooks.heroSubtitle",
            
            // Contact page mappings
            "contact-hero-title": "contact.heroTitle",
            "contact-hero-subtitle": "contact.heroSubtitle",
            "contact-info": "contact.info",
            
            // Footer mappings
             "footer-description": "footer.description",
             "footer-copyright": "footer.copyright",
             "footer-logo-text": "footer.logoText",
             "footer-logo-alt": "footer.logoImage",
             "footer-newsletter-title": "footer.newsletterTitle",
             "footer-newsletter-description": "footer.newsletterDescription",
             "footer-newsletter-placeholder": "footer.newsletterPlaceholder",
             "footer-about": "footer.quickLink1",
             "footer-projects": "footer.quickLink2",
             "footer-ebooks": "footer.quickLink3",
             "footer-bookstore": "footer.quickLink4",
             "footer-contact": "footer.supportLink1",
         
             "footer-notifications": "footer.supportLink3",
             "footer-quicklinks-title": "footer.quickLinksTitle",
             "footer-support-title": "footer.supportTitle",
             
             // Page titles
             "signup-page-title": "signup.pageTitle",
             "login-page-title": "login.pageTitle",
             "projects-page-title": "projects.pageTitle",
             "notifications-page-title": "notifications.pageTitle",
             "reset-password-page-title": "resetPassword.pageTitle",
             "test-books-page-title": "testBooks.pageTitle",
             
             // Signup page mappings
             "signup-welcome-title": "signup.welcomeTitle",
             "signup-welcome-description": "signup.welcomeDescription",
             "signup-feature-books": "signup.featureBooks",
             "signup-feature-community": "signup.featureCommunity",
             "signup-feature-support": "signup.featureSupport",
             "signup-form-title": "signup.formTitle",
             "signup-form-subtitle": "signup.formSubtitle",
             "signup-firstname-placeholder": "signup.firstNamePlaceholder",
             "signup-lastname-placeholder": "signup.lastNamePlaceholder",
             "signup-email-placeholder": "signup.emailPlaceholder",
             "signup-phone-placeholder": "signup.phonePlaceholder",
             "signup-password-placeholder": "signup.passwordPlaceholder",
             "signup-confirm-password-placeholder": "signup.confirmPasswordPlaceholder",
             "signup-interest-placeholder": "signup.interestPlaceholder",
             "signup-interest-learning": "signup.interestLearning",
             "signup-interest-literature": "signup.interestLiterature",
             "signup-interest-culture": "signup.interestCulture",
             "signup-interest-teaching": "signup.interestTeaching",
             "signup-interest-research": "signup.interestResearch",
             "signup-interest-community": "signup.interestCommunity",
             "signup-terms-label": "signup.termsLabel",
             "signup-terms-link": "signup.termsLink",
             "signup-privacy-link": "signup.privacyLink",
             "signup-newsletter-label": "signup.newsletterLabel",
             "signup-notifications-label": "signup.notificationsLabel",
             "signup-create-button": "signup.createButton",
             "signup-divider-text": "signup.dividerText",
             "signup-google-button": "signup.googleButton",
             "signup-facebook-button": "signup.facebookButton",
             "signup-login-prompt": "signup.loginPrompt",
             "signup-login-link": "signup.loginLink",
             
             // Notifications page mappings
             "notifications-hero-title": "notifications.heroTitle",
             "notifications-hero-title-tamil": "notifications.heroTitleTamil",
             "notifications-hero-subtitle": "notifications.heroSubtitle",
             "notifications-total-label": "notifications.totalLabel",
             "notifications-unread-label": "notifications.unreadLabel",
             "notifications-mark-all-read": "notifications.markAllRead",
             "notifications-refresh": "notifications.refresh",
             "notifications-filter-all": "notifications.filterAll",
             "notifications-filter-unread": "notifications.filterUnread",
             "notifications-filter-info": "notifications.filterInfo",
             "notifications-filter-announcements": "notifications.filterAnnouncements",
             "notifications-empty-title": "notifications.emptyTitle",
             "notifications-empty-message": "notifications.emptyMessage",
             "notifications-empty-refresh": "notifications.emptyRefresh",
             "notifications-preferences-title": "notifications.preferencesTitle",
             "notifications-preferences-title-tamil": "notifications.preferencesTitleTamil",
             
             // Projects page additional mappings
             "projects-hero-title-tamil": "projects.heroTitleTamil",
             "projects-hero-quote-tamil": "projects.heroQuoteTamil",
             "projects-filter-all": "projects.filterAll",
            "projects-filter-media": "projects.filterMedia",
            "projects-filter-sports": "projects.filterSports",
            "projects-filter-education": "projects.filterEducation",
            "projects-filter-arts": "projects.filterArts",
            "projects-filter-social": "projects.filterSocial",
            "projects-filter-language": "projects.filterLanguage",
             "projects-featured-title": "projects.featuredTitle",
             "projects-featured-title-tamil": "projects.featuredTitleTamil",
             "projects-stats-title": "projects.statsTitle",
             "projects-stats-title-tamil": "projects.statsTitleTamil",
             "projects-stats-active": "projects.statsActive",
             "projects-stats-lives": "projects.statsLives",
             "projects-stats-countries": "projects.statsCountries",
             "projects-stats-resources": "projects.statsResources",
             "projects-cta-title": "projects.ctaTitle",
             "projects-cta-title-tamil": "projects.ctaTitleTamil",
             "projects-cta-description": "projects.ctaDescription",
             "projects-cta-volunteer": "projects.ctaVolunteer",
         
             
             // Reset password page mappings
             "reset-password-title": "resetPassword.title",
             "reset-password-subtitle": "resetPassword.subtitle",
             "reset-password-new-label": "resetPassword.newLabel",
             "reset-password-confirm-label": "resetPassword.confirmLabel",
             "reset-password-requirements-title": "resetPassword.requirementsTitle",
             "reset-password-req-1": "resetPassword.requirement1",
             "reset-password-req-2": "resetPassword.requirement2",
             "reset-password-req-3": "resetPassword.requirement3",
             "reset-password-req-4": "resetPassword.requirement4",
             "reset-password-button": "resetPassword.button",
             "reset-password-remember": "resetPassword.remember",
             "reset-password-login-link": "resetPassword.loginLink",
             
             // Navigation variations
             "nav-logo-alt": "navigation.logoAlt",
             "nav-logo-text": "navigation.logoText"
        };
        
        return keyMappings[htmlKey] || htmlKey;
    }

    /**
     * Load content for specific page with enhanced retry logic
     */
    async loadPageContent(page, retryCount = 0) {
        const maxRetries = 3;
        const startTime = performance.now();
        
        try {
            console.log(`📡 Fetching content for page: ${page} (attempt ${retryCount + 1}/${maxRetries + 1})`);
            
            // Create AbortController for timeout handling
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
            
            // Use the sections endpoint for section-based content
            const response = await fetch(`${this.apiBaseUrl}/api/website-content/sections/${page}`, {
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            console.log(`📊 API Response Status: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("❌ API Error Response:", {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText,
                    url: response.url
                });
                throw new Error(`Failed to load content for page: ${page} (${response.status}: ${response.statusText})`);
            }
            
            const data = await response.json();
            const content = data.data || [];
            
            const endTime = performance.now();
            console.log(`✅ Loaded ${content.length} content items for page: ${page} in ${(endTime - startTime).toFixed(2)}ms`);
            
            // Cache content
            this.contentCache.set(page, content);
            
            // Apply content to page
            this.applyPageContent(content);
            
        } catch (error) {
            console.error(`❌ Error loading content for page ${page} (attempt ${retryCount + 1}):`, {
                error: error.message,
                stack: error.stack,
                page: page,
                apiUrl: `${this.apiBaseUrl}/api/website-content/sections/${page}`,
                timestamp: new Date().toISOString()
            });
            
            // Check if this is a network-related error
            const isNetworkError = error.message.includes("Failed to fetch") || 
                                 error.message.includes("ERR_ABORTED") ||
                                 error.name === "AbortError" ||
                                 error.message.includes("NetworkError") ||
                                 error.message.includes("timeout");
            
            // Retry logic for network errors
            if (isNetworkError && retryCount < maxRetries) {
                const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
                console.log(`🔄 Retrying page content load for ${page} in ${retryDelay}ms...`);
                
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return this.loadPageContent(page, retryCount + 1);
            }
            
            // Handle different error scenarios on final attempt
            if (isNetworkError) {
                console.warn(`🌐 Network error detected for page: ${page}. This is likely a temporary connectivity issue.`);
                
                // Show network-specific error notification
                if (typeof this.showNetworkErrorNotification === "function") {
                    this.showNetworkErrorNotification();
                } else {
                    this.showErrorNotification(`Network connection issue detected. Unable to load content for ${page}. Please check your internet connection and try refreshing the page.`);
                }
                
                // Try to load fallback content
                await this.loadFallbackContent(page);
                
            } else if (error.message.includes("404")) {
                console.warn(`📭 No content found for page: ${page}, using fallback content`);
                this.loadFallbackContent(page);
            } else {
                this.showErrorNotification(`Failed to load content for ${page}. Please check your internet connection.`);
            }
        }
    }

    /**
     * Load global content (header, footer, navigation)
     */
    async loadGlobalContent() {
        const globalPages = ["header", "footer", "navigation"];
        const loadPromises = [];
        
        for (const page of globalPages) {
            const loadPromise = this.loadSingleGlobalContent(page);
            loadPromises.push(loadPromise);
        }
        
        // Wait for all global content to load, but don't fail if some fail
        const results = await Promise.allSettled(loadPromises);
        
        const failed = results.filter(result => result.status === "rejected");
        if (failed.length > 0) {
            console.warn(`⚠️ Failed to load ${failed.length} global content sections:`, 
                failed.map(f => f.reason?.message || "Unknown error"));
        }
        
        const successful = results.filter(result => result.status === "fulfilled").length;
        console.log(`✅ Successfully loaded ${successful}/${globalPages.length} global content sections`);
    }
    
    async loadSingleGlobalContent(page) {
        try {
            console.log(`🌐 Loading global content: ${page}`);
            
            const response = await fetch(`${this.apiBaseUrl}/api/website-content/sections/${page}`, {
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include"
            });
            
            if (response.ok) {
                const data = await response.json();
                const content = data.data || [];
                console.log(`✅ Loaded ${content.length} items for global content: ${page}`);
                this.contentCache.set(page, content);
                this.applyGlobalContent(page, content);
            } else {
                const errorText = await response.text();
                throw new Error(`Failed to load ${page}: ${response.status} ${response.statusText} - ${errorText}`);
            }
        } catch (error) {
            console.error(`❌ Error loading global content for ${page}:`, {
                error: error.message,
                page: page,
                timestamp: new Date().toISOString()
            });
            throw error; // Re-throw for Promise.allSettled
        }
    }

    /**
     * Apply content to page elements
     */
    applyPageContent(content) {
        content.forEach(item => {
            this.applyContentItem(item);
        });
    }

    /**
     * Apply global content (header, footer, navigation)
     */
    applyGlobalContent(page, content) {
        content.forEach(item => {
            this.applyContentItem(item, page);
        });
    }

    /**
     * Apply individual content item to page
     */
    applyContentItem(item, globalPage = null) {
        // Handle both old flat structure and new nested structure
        const extractContent = (field) => {
            if (!field) return null;
            // If it's already a string (old format), return it
            if (typeof field === "string") return field;
            // If it's an object with language properties (new format), extract them
            if (typeof field === "object") {
                return {
                    en: field.en || field.english || null,
                    ta: field.ta || field.tamil || null
                };
            }
            return null;
        };

        const { page, section, buttonUrl, image, images } = item;
        
        // Extract content with proper structure handling
        const title = extractContent(item.title);
        const content = extractContent(item.content);
        const subtitle = extractContent(item.subtitle);
        const buttonText = extractContent(item.buttonText);
        
        // Determine selectors based on page and section
        const selectors = this.getContentSelectors(globalPage || page, section);
        
        if (selectors.length === 0) {
            console.warn(`No selectors found for page: ${globalPage || page}, section: ${section}`);
            return;
        }

        selectors.forEach(selector => {
            const element = document.querySelector(selector.element);
            if (!element) {
                console.warn(`Element not found: ${selector.element}`);
                return;
            }

            // Apply content based on type
            switch (selector.type) {
                case "text":
                    const textContent = this.getLocalizedTextFromObject(title) || this.getLocalizedTextFromObject(content);
                    if (textContent) {
                        element.textContent = textContent;
                    }
                    break;
                    
                case "html":
                    const htmlContent = this.getLocalizedTextFromObject(content) || this.getLocalizedTextFromObject(title);
                    if (htmlContent) {
                        element.innerHTML = htmlContent;
                    }
                    break;
                    
                case "subtitle":
                    const subtitleContent = this.getLocalizedTextFromObject(subtitle) || this.getLocalizedTextFromObject(content);
                    if (subtitleContent) {
                        element.textContent = subtitleContent;
                    }
                    break;
                    
                case "button":
                    const buttonContent = this.getLocalizedTextFromObject(buttonText) || this.getLocalizedTextFromObject(title);
                    if (buttonContent) {
                        element.textContent = buttonContent;
                    }
                    if (buttonUrl) {
                        element.href = buttonUrl;
                        element.onclick = () => window.location.href = buttonUrl;
                    }
                    break;
                    
                case "image":
                    let imageUrl = image;
                    // Handle images array
                    if (!imageUrl && images && images.length > 0) {
                        imageUrl = images[0].url || images[0];
                    }
                    if (imageUrl) {
                        element.src = this.processImageUrl(imageUrl);
                        element.alt = this.getLocalizedTextFromObject(title) || element.alt;
                    }
                    break;
                    
                case "background":
                    let bgImageUrl = image;
                    // Handle images array
                    if (!bgImageUrl && images && images.length > 0) {
                        bgImageUrl = images[0].url || images[0];
                    }
                    if (bgImageUrl) {
                        element.style.backgroundImage = `url(${this.processImageUrl(bgImageUrl)})`;
                    }
                    break;
            }
        });
    }

    /**
     * Get content selectors for specific page and section
     */
    getContentSelectors(page, section) {
        const selectorMap = {
            // Home page selectors
            home: {
                hero_title: [
                    { element: ".hero-title .english-title", type: "text" },
                    { element: ".hero-title .tamil-title", type: "text" }
                ],
                hero_subtitle: [
                    { element: ".hero-subtitle", type: "text" }
                ],
                hero_quote: [
                    { element: ".tamil-quote", type: "text" }
                ],
                hero_image: [
                    { element: ".hero-logo", type: "image" },
                    { element: ".hero-image img", type: "image" }
                ],
                features_title: [
                    { element: ".features .section-title .english", type: "text" },
                    { element: ".features .section-title .tamil", type: "text" }
                ],
                about_title: [
                    { element: ".about .section-title", type: "text" }
                ],
                about_content: [
                    { element: ".about .section-description", type: "html" }
                ]
            },
            
            // Header selectors
            header: {
                logo: [
                    { element: ".nav-logo .logo-img", type: "image" },
                    { element: ".footer-logo img", type: "image" }
                ],
                logo_text: [
                    { element: ".nav-logo .logo-text", type: "text" },
                    { element: ".footer-logo span", type: "text" }
                ],
                navigation: [
                    { element: ".nav-menu", type: "html" }
                ]
            },
            
            // Footer selectors
            footer: {
                description: [
                    { element: ".footer-section p[data-content*=\"description\"]", type: "text" },
                    { element: ".footer-section p:first-of-type", type: "text" }
                ],
                social_links: [
                    { element: ".social-links", type: "html" }
                ],
                quick_links: [
                    { element: ".footer-section ul", type: "html" }
                ],
                copyright: [
                    { element: ".footer-bottom p", type: "text" },
                    { element: ".footer-bottom", type: "text" }
                ]
            },
            
            // About page selectors
            about: {
                hero_title: [
                    { element: ".page-header h1", type: "text" }
                ],
                hero_subtitle: [
                    { element: ".page-header p", type: "text" }
                ],
                mission_title: [
                    { element: ".mission .section-title", type: "text" }
                ],
                mission_content: [
                    { element: ".mission .section-content", type: "html" }
                ],
                vision_title: [
                    { element: ".vision .section-title", type: "text" }
                ],
                vision_content: [
                    { element: ".vision .section-content", type: "html" }
                ]
            },
            
            // Contact page selectors - contact form references removed
            contact: {
                hero_title: [
                    { element: ".page-header h1", type: "text" }
                ],
                hero_subtitle: [
                    { element: ".page-header p", type: "text" }
                ],
                contact_info: [
                    { element: ".contact-info", type: "html" }
                ]
            },
            
            // Books page selectors
            books: {
                "hero-title": [
                    { element: ".page-header h1", type: "text" },
                    { element: ".hero-section h1", type: "text" },
                    { element: "[data-content=\"books.hero.title\"]", type: "text" }
                ],
                "hero-subtitle": [
                    { element: ".page-header p", type: "text" },
                    { element: ".hero-section p", type: "text" },
                    { element: "[data-content=\"books.hero.subtitle\"]", type: "text" }
                ],
                "categories-title": [
                    { element: "[data-content=\"books.categories.title\"]", type: "text" },
                    { element: ".categories-section .section-title", type: "text" }
                ],
                "category1-title": [
                    { element: "[data-content=\"books.category1.title\"]", type: "text" },
                    { element: ".category-1 .category-title", type: "text" }
                ],
                "category1-description": [
                    { element: "[data-content=\"books.category1.description\"]", type: "text" },
                    { element: ".category-1 .category-description", type: "text" }
                ],
                "category2-title": [
                    { element: "[data-content=\"books.category2.title\"]", type: "text" },
                    { element: ".category-2 .category-title", type: "text" }
                ],
                "category2-description": [
                    { element: "[data-content=\"books.category2.description\"]", type: "text" },
                    { element: ".category-2 .category-description", type: "text" }
                ],
                "category3-title": [
                    { element: "[data-content=\"books.category3.title\"]", type: "text" },
                    { element: ".category-3 .category-title", type: "text" }
                ],
                "category3-description": [
                    { element: "[data-content=\"books.category3.description\"]", type: "text" },
                    { element: ".category-3 .category-description", type: "text" }
                ],
                "featured-title": [
                    { element: "[data-content=\"books.featured.title\"]", type: "text" },
                    { element: ".featured-books .section-title", type: "text" }
                ],
                "shop-button": [
                    { element: "[data-content=\"books.shop.button\"]", type: "button" },
                    { element: ".shop-button", type: "button" }
                ],
                "cta-title": [
                    { element: "[data-content=\"books.cta.title\"]", type: "text" },
                    { element: ".cta-section .cta-title", type: "text" }
                ],
                "cta-description": [
                    { element: "[data-content=\"books.cta.description\"]", type: "text" },
                    { element: ".cta-section .cta-description", type: "text" }
                ]
            },
            
            // E-books page selectors
            ebooks: {
                "hero-title": [
                    { element: ".page-header h1", type: "text" },
                    { element: ".hero-section h1", type: "text" },
                    { element: "[data-content=\"ebooks.hero.title\"]", type: "text" }
                ],
                "hero-subtitle": [
                    { element: ".page-header p", type: "text" },
                    { element: ".hero-section p", type: "text" },
                    { element: "[data-content=\"ebooks.hero.subtitle\"]", type: "text" }
                ],
                "features-title": [
                    { element: "[data-content=\"ebooks.features.title\"]", type: "text" },
                    { element: ".features-section .section-title", type: "text" }
                ],
                "feature-access": [
                    { element: "[data-content=\"ebooks.features.access\"]", type: "text" },
                    { element: ".feature-access .feature-title", type: "text" }
                ],
                "feature-search": [
                    { element: "[data-content=\"ebooks.features.search\"]", type: "text" },
                    { element: ".feature-search .feature-title", type: "text" }
                ],
                "feature-download": [
                    { element: "[data-content=\"ebooks.features.download\"]", type: "text" },
                    { element: ".feature-download .feature-title", type: "text" }
                ]
            },
            
            // Projects page selectors
            projects: {
                "hero-title": [
                    { element: ".page-header h1", type: "text" },
                    { element: ".hero-section h1", type: "text" },
                    { element: "[data-content=\"projects.hero.title\"]", type: "text" }
                ],
                "hero-subtitle": [
                    { element: ".page-header p", type: "text" },
                    { element: ".hero-section p", type: "text" },
                    { element: "[data-content=\"projects.hero.subtitle\"]", type: "text" }
                ],
                "categories-title": [
                    { element: "[data-content=\"projects.categories.title\"]", type: "text" },
                    { element: ".categories-section .section-title", type: "text" }
                ],
                "education-title": [
                    { element: "[data-content=\"projects.education.title\"]", type: "text" },
                    { element: ".education-projects .section-title", type: "text" }
                ],
                "cultural-title": [
                    { element: "[data-content=\"projects.cultural.title\"]", type: "text" },
                    { element: ".cultural-projects .section-title", type: "text" }
                ],
                "research-title": [
                    { element: "[data-content=\"projects.research.title\"]", type: "text" },
                    { element: ".research-projects .section-title", type: "text" }
                ]
            },
            

        };

        const pageSelectors = selectorMap[page] || {};
        return pageSelectors[section] || [];
    }

    /**
     * Get localized text based on current language preference
     */
    getLocalizedText(english, tamil) {
        const currentLang = localStorage.getItem("preferred_language") || "en";
        
        if (currentLang === "ta" && tamil) {
            return tamil;
        }
        return english || tamil;
    }

    /**
     * Get localized text from object structure (new database format)
     */
    getLocalizedTextFromObject(textObj) {
        if (!textObj) return "";
        
        // If it's already a string, return it
        if (typeof textObj === "string") return textObj;
        
        // If it's an object with language properties
        if (typeof textObj === "object") {
            const currentLang = localStorage.getItem("preferred_language") || "en";
            
            if (currentLang === "ta" && textObj.ta) {
                return textObj.ta;
            }
            
            return textObj.en || textObj.ta || "";
        }
        
        return "";
    }

    /**
     * Initialize language toggle functionality
     */
    initializeLanguageToggle() {
        const languageToggle = document.getElementById("language-toggle");
        if (!languageToggle) return;

        const langButtons = languageToggle.querySelectorAll(".lang-btn");
        const currentLang = localStorage.getItem("preferred_language") || "en";

        // Set initial HTML lang attribute
        document.documentElement.setAttribute("lang", currentLang);

        // Set initial active state
        langButtons.forEach(btn => {
            btn.classList.toggle("active", btn.dataset.lang === currentLang);
        });

        // Add click event listeners
        langButtons.forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const selectedLang = btn.dataset.lang;
                
                // Update localStorage
                localStorage.setItem("preferred_language", selectedLang);
                
                // Update HTML lang attribute for accessibility and testing
                document.documentElement.setAttribute("lang", selectedLang);
                
                // Update active state
                langButtons.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                
                // Refresh content with new language
                this.refreshContentForLanguage();
                
                // Show notification
                if (typeof window.showNotification === "function") {
                    window.showNotification(
                        selectedLang === "ta" ? "Language changed to Tamil" : "Language changed to English",
                        "success"
                    );
                }
            });
        });
    }

    /**
     * Refresh all content for the current language
     */
    async refreshContentForLanguage() {
        try {
            // Re-apply data attribute content
            await this.applyDataAttributeContent();
            
            // Reload page-specific content if available
            if (this.currentPage) {
                await this.loadPageContent(this.currentPage);
            }
        } catch (error) {
            console.error("Error refreshing content for language:", error);
        }
    }

    /**
     * Process image URL to handle relative paths
     */
    processImageUrl(imageUrl) {
        if (!imageUrl) return "";
        
        // If it's already a full URL, return as is
        if (imageUrl.startsWith("http")) {
            return imageUrl;
        }
        
        // If it's a relative path starting with /uploads or /assets
        if (imageUrl.startsWith("/uploads") || imageUrl.startsWith("/assets")) {
            return `${this.apiBaseUrl}${imageUrl}`;
        }
        
        // If it's just a filename, assume it's in uploads
        if (!imageUrl.startsWith("/")) {
            return `${this.apiBaseUrl}/uploads/${imageUrl}`;
        }
        
        return imageUrl;
    }

    /**
     * Initialize page-specific functionality
     */
    async initializePageSpecific() {
        switch (this.currentPage) {
            case "home":
                await this.initializeHomePage();
                break;
            case "books":
                await this.initializeBooksPage();
                break;
            case "ebooks":
                await this.initializeEbooksPage();
                break;
            case "projects":
                await this.initializeProjectsPage();
                break;
            default:
                console.log(`No specific initialization for page: ${this.currentPage}`);
        }
    }

    /**
     * Initialize home page with announcements
     */
    async initializeHomePage() {
        try {
            // Load announcements/posters for homepage
            await this.loadHomePageAnnouncements();
            await this.loadActivePoster();
            
            // Update statistics with real data
            await this.updateStatistics();
            
        } catch (error) {
            console.error("Error initializing home page:", error);
        }
    }

    /**
     * Load and display homepage announcements
     */
    async loadHomePageAnnouncements() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/posters`);
            if (!response.ok) return;
            
            const data = await response.json();
            const posters = data.data || [];
            
            if (posters.length > 0) {
                this.createAnnouncementsSection(posters[0]); // Show latest poster
            }
            
        } catch (error) {
            console.error("Error loading announcements:", error);
        }
    }

    /**
     * Load active poster for homepage
     */
    async loadActivePoster() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/posters/active`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    this.displayPoster(data.data);
                }
            } else if (response.status === 404) {
                // No active poster found, hide the section
                this.hidePosterSection();
            }
        } catch (error) {
            console.error("Error loading active poster:", error);
            this.hidePosterSection();
        }
    }

    /**
     * Display poster in the announcements section
     */
    displayPoster(poster) {
        const container = document.getElementById("announcement-container");
        const img = document.getElementById("announcement-img");
        const title = document.getElementById("announcement-title");
        const description = document.getElementById("announcement-description");
        const link = document.getElementById("announcement-link");

        if (container && img && title && description && link) {
            // Set poster data
            img.src = this.processImageUrl(poster.image);
            img.alt = poster.imageAlt || poster.title;
            title.textContent = poster.title;
            description.textContent = poster.description;

            // Set up link
            if (poster.buttonUrl) {
                link.href = poster.buttonUrl;
                link.textContent = poster.buttonText || "Learn More";
                link.style.display = "inline-flex";
                
                // Track clicks
                link.addEventListener("click", () => {
                    this.trackPosterClick(poster._id);
                });
            } else {
                link.style.display = "none";
            }

            // Show the container
            container.style.display = "grid";
        }
    }

    /**
     * Hide poster section when no active poster
     */
    hidePosterSection() {
        const container = document.getElementById("announcement-container");
        if (container) {
            container.style.display = "none";
        }
    }

    /**
     * Track poster click
     */
    async trackPosterClick(posterId) {
        try {
            await fetch(`${this.apiBaseUrl}/api/posters/${posterId}/click`, {
                method: "POST"
            });
        } catch (error) {
            console.error("Error tracking poster click:", error);
        }
    }

    /**
     * Create announcements section on homepage
     */
    createAnnouncementsSection(poster) {
        // Check if announcements section already exists
        let announcementsSection = document.querySelector(".announcements-section");
        
        if (!announcementsSection) {
            // Create announcements section after hero section
            const heroSection = document.querySelector(".hero");
            if (!heroSection) return;
            
            announcementsSection = document.createElement("section");
            announcementsSection.className = "announcements-section";
            announcementsSection.innerHTML = `
                <div class="container">
                    <div class="announcement-card">
                        <div class="announcement-image">
                            <img src="${this.processImageUrl(poster.image)}" alt="${poster.title}" />
                        </div>
                        <div class="announcement-content">
                            <h3>${poster.title}</h3>
                            <p>${poster.description}</p>
                            ${poster.buttonText && poster.buttonUrl ? 
                                `<a href="${poster.buttonUrl}" class="btn btn-primary">${poster.buttonText}</a>` : 
                                ""
                            }
                        </div>
                    </div>
                </div>
            `;
            
            // Insert after hero section
            heroSection.insertAdjacentElement("afterend", announcementsSection);
        }
    }

    /**
     * Update statistics with real data
     */
    async updateStatistics() {
        try {
            // Load real statistics
            const [booksRes, ebooksRes, projectsRes] = await Promise.all([
                fetch(`${this.apiBaseUrl}/api/books`),
                fetch(`${this.apiBaseUrl}/api/ebooks`),
                fetch(`${this.apiBaseUrl}/api/projects`)
            ]);
            
            const books = booksRes.ok ? (await booksRes.json()).data || [] : [];
            const ebooks = ebooksRes.ok ? (await ebooksRes.json()).data || [] : [];
            const projects = projectsRes.ok ? (await projectsRes.json()).data || [] : [];
            
            // Update stat numbers
            this.updateStatNumber("Digital Books", ebooks.length);
            this.updateStatNumber("Books", books.length);
            this.updateStatNumber("Projects", projects.length);
            
        } catch (error) {
            console.error("Error updating statistics:", error);
        }
    }

    /**
     * Update individual stat number
     */
    updateStatNumber(label, value) {
        const statItems = document.querySelectorAll(".stat-item");
        statItems.forEach(item => {
            const labelElement = item.querySelector(".stat-label");
            if (labelElement && labelElement.textContent.includes(label)) {
                const numberElement = item.querySelector(".stat-number");
                if (numberElement) {
                    numberElement.setAttribute("data-target", value);
                    numberElement.textContent = value;
                }
            }
        });
    }

    /**
     * Initialize books page
     */
    async initializeBooksPage() {
        // Books page initialization is handled by books-api.js
        console.log("Books page content loaded");
    }

    /**
     * Initialize ebooks page
     */
    async initializeEbooksPage() {
        // Ebooks page initialization is handled by ebooks-api.js
        console.log("Ebooks page content loaded");
    }

    /**
     * Initialize projects page
     */
    async initializeProjectsPage() {
        // Projects page initialization is handled by projects-api.js
        console.log("Projects page content loaded");
    }

    /**
     * Refresh content for current page
     */
    async refreshContent() {
        this.contentCache.clear();
        await this.initialize();
    }

    /**
     * Get cached content for page
     */
    getCachedContent(page) {
        return this.contentCache.get(page) || [];
    }

    /**
     * Setup real-time content update listeners
     */
    setupRealTimeUpdates() {
        try {
            console.log("🔄 Setting up real-time content updates");
            
            // Listen for postMessage from admin panel
            window.addEventListener("message", (event) => {
                try {
                    if (event.data && event.data.type === "CONTENT_UPDATE") {
                        console.log("📨 Received real-time content update:", event.data);
                        this.handleRealTimeUpdate(event.data);
                    }
                } catch (error) {
                    console.error("❌ Error handling postMessage update:", {
                        error: error.message,
                        eventData: event.data,
                        timestamp: new Date().toISOString()
                    });
                }
            });

            // Listen for localStorage changes (cross-tab communication)
            window.addEventListener("storage", (event) => {
                if (event.key === "websiteContentUpdate" && event.newValue) {
                    try {
                        const updateData = JSON.parse(event.newValue);
                        console.log("📨 Received cross-tab content update:", updateData);
                        this.handleRealTimeUpdate(updateData);
                    } catch (error) {
                        console.error("❌ Error parsing real-time update data:", {
                            error: error.message,
                            rawData: event.newValue,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            });

            // Check for pending updates on page load
            this.checkForPendingUpdates();
            
            console.log("✅ Real-time updates setup completed");
        } catch (error) {
            console.error("❌ Failed to setup real-time updates:", {
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Check for pending updates in localStorage
     */
    checkForPendingUpdates() {
        try {
            console.log("🔍 Checking for pending content updates");
            const pendingUpdate = localStorage.getItem("websiteContentUpdate");
            
            if (pendingUpdate) {
                const updateData = JSON.parse(pendingUpdate);
                const timeDiff = Date.now() - updateData.timestamp;
                
                console.log(`📋 Found pending update from ${timeDiff}ms ago`);
                
                // Only process if update is recent (within last 5 seconds)
                if (timeDiff < 5000) {
                    console.log("⚡ Processing recent pending content update:", updateData);
                    this.handleRealTimeUpdate(updateData);
                } else {
                    console.log("⏰ Pending update too old, ignoring");
                    // Clean up old update
                    localStorage.removeItem("websiteContentUpdate");
                }
            } else {
                console.log("📭 No pending updates found");
            }
        } catch (error) {
            console.error("❌ Error checking for pending updates:", {
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            
            // Clean up corrupted data
            try {
                localStorage.removeItem("websiteContentUpdate");
                console.log("🧹 Cleaned up corrupted pending update data");
            } catch (cleanupError) {
                console.error("❌ Failed to cleanup corrupted data:", cleanupError.message);
            }
        }
    }

    /**
     * Handle real-time content updates
     * @param {Object} updateData - The update data from admin panel
     */
    async handleRealTimeUpdate(updateData) {
        const startTime = performance.now();
        try {
            const { page, content, timestamp } = updateData;
            
            console.log(`🔄 Processing real-time update for page: ${page}`);
            
            // Validate update data
            if (!page) {
                throw new Error("Invalid update data: missing page");
            }
            
            // Check if update is too old
            if (timestamp && (Date.now() - timestamp > 30000)) {
                console.warn("⏰ Update is too old, skipping:", { page, age: Date.now() - timestamp });
                return;
            }
            
            // Clear cache for the updated page
            this.contentCache.delete(page);
            console.log(`🗑️ Cleared cache for page: ${page}`);
            
            // If the update is for the current page or global content, refresh immediately
            if (page === this.currentPage || page === "global") {
                console.log(`🎯 Updating current page content: ${page}`);
                await this.refreshPageContent(page, content);
                
                // Show notification to user
                this.showUpdateNotification(page);
            } else {
                console.log(`📝 Cached update for future use: ${page}`);
            }
            
            // If it's global content, also refresh header/footer/navigation
            if (page === "global") {
                console.log("🌐 Refreshing global content sections");
                await this.loadGlobalContent();
            }
            
            const endTime = performance.now();
            console.log(`✅ Real-time update completed for page: ${page} in ${(endTime - startTime).toFixed(2)}ms`);
            
        } catch (error) {
            console.error("❌ Error handling real-time update:", {
                error: error.message,
                stack: error.stack,
                updateData: updateData,
                timestamp: new Date().toISOString()
            });
            
            // Show user-friendly error
            this.showErrorNotification("Failed to apply real-time content update. Please refresh the page.");
        }
    }

    /**
     * Refresh page content with new data
     * @param {string} page - The page to refresh
     * @param {Object} content - The new content data
     */
    async refreshPageContent(page, content) {
        const startTime = performance.now();
        try {
            console.log(`🔄 Refreshing content for page: ${page}`);
            
            // If content is provided directly, use it; otherwise fetch from API
            if (content && Object.keys(content).length > 0) {
                console.log(`📦 Using provided content (${Object.keys(content).length} items)`);
                // Transform admin panel content format to display format
                const transformedContent = this.transformAdminContent(content, page);
                this.applyTransformedContent(transformedContent);
            } else {
                console.log(`📡 Fetching fresh content from API for page: ${page}`);
                // Fetch fresh content from API
                await this.loadPageContent(page);
            }
            
            const endTime = performance.now();
            console.log(`✅ Page content refresh completed for ${page} in ${(endTime - startTime).toFixed(2)}ms`);
            
        } catch (error) {
            console.error("❌ Error refreshing page content:", {
                error: error.message,
                stack: error.stack,
                page: page,
                hasContent: !!(content && Object.keys(content).length > 0),
                timestamp: new Date().toISOString()
            });
            
            // Attempt fallback
            this.loadFallbackContent(page);
        }
    }

    /**
     * Transform admin panel content format to display format
     * @param {Object} content - Content from admin panel
     * @param {string} page - The page type
     * @returns {Object} - Transformed content
     */
    transformAdminContent(content, page) {
        const transformed = {};
        
        // Handle different content types based on page
        switch (page) {
            case "home":
            case "homepage":
                if (content.title) {
                    transformed.heroTitle = content.title;
                    transformed.heroTitleTamil = content.title_tamil;
                }
                if (content.subtitle) {
                    transformed.heroSubtitle = content.subtitle;
                    transformed.heroSubtitleTamil = content.subtitle_tamil;
                }
                if (content.description) {
                    transformed.heroDescription = content.description;
                    transformed.heroDescriptionTamil = content.description_tamil;
                }
                break;
                
            case "about":
                if (content.mission) {
                    transformed.mission = content.mission;
                    transformed.missionTamil = content.mission_tamil;
                }
                if (content.vision) {
                    transformed.vision = content.vision;
                    transformed.visionTamil = content.vision_tamil;
                }
                if (content.history) {
                    transformed.history = content.history;
                    transformed.historyTamil = content.history_tamil;
                }
                break;
                
            case "contact":
                if (content.address) {
                    transformed.address = content.address;
                    transformed.addressTamil = content.address_tamil;
                }
                if (content.phone) transformed.phone = content.phone;
                if (content.email) transformed.email = content.email;
                if (content.hours) {
                    transformed.hours = content.hours;
                    transformed.hoursTamil = content.hours_tamil;
                }
                break;
                
            case "global":
                if (content.site_title) {
                    transformed.siteTitle = content.site_title;
                    transformed.siteTitleTamil = content.site_title_tamil;
                }
                if (content.footer_text) {
                    transformed.footerText = content.footer_text;
                    transformed.footerTextTamil = content.footer_text_tamil;
                }
                if (content.logo_url) {
                    transformed.logoUrl = content.logo_url;
                }
                break;
        }
        
        return transformed;
    }

    /**
     * Apply transformed content to page elements
     * @param {Object} content - Transformed content
     */
    applyTransformedContent(content) {
        Object.keys(content).forEach(key => {
            const value = content[key];
            if (!value) return;
            
            // Find elements with data-content attribute matching the key
            const elements = document.querySelectorAll(`[data-content="${key}"]`);
            elements.forEach(element => {
                if (element.tagName === "IMG") {
                    element.src = value;
                } else {
                    element.textContent = value;
                }
            });
            
            // Also try kebab-case version
            const kebabKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
            const kebabElements = document.querySelectorAll(`[data-content="${kebabKey}"]`);
            kebabElements.forEach(element => {
                if (element.tagName === "IMG") {
                    element.src = value;
                } else {
                    element.textContent = value;
                }
            });
        });
    }

    /**
     * Show update notification to user
     * @param {string} page - The updated page
     */
    showUpdateNotification(page) {
        try {
            console.log(`📢 Showing update notification for page: ${page}`);
            
            // Create a subtle notification
            const notification = document.createElement("div");
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, var(--success-color, #10b981), var(--success-dark, #059669));
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: var(--shadow-md);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                font-weight: 500;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
            `;
            
            const pageDisplayName = page.charAt(0).toUpperCase() + page.slice(1);
            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    ${pageDisplayName} content updated!
                </div>
            `;
            
            document.body.appendChild(notification);
            
            // Animate in
            setTimeout(() => {
                notification.style.opacity = "1";
                notification.style.transform = "translateX(0)";
            }, 100);
            
            // Remove after 3 seconds
            setTimeout(() => {
                notification.style.opacity = "0";
                notification.style.transform = "translateX(100%)";
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 3000);
            
        } catch (error) {
            console.error("❌ Failed to show update notification:", {
                error: error.message,
                page: page,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Show error notification to user
     * @param {string} message - The error message to display
     */
    showErrorNotification(message) {
        try {
            console.log(`🚨 Showing error notification: ${message}`);
            
            // Create error notification
            const notification = document.createElement("div");
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, var(--error-color, #ef4444), var(--error-dark, #dc2626));
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.15));
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                font-weight: 500;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
                max-width: 400px;
            `;
            
            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    ${message}
                </div>
            `;
            
            document.body.appendChild(notification);
            
            // Animate in
            setTimeout(() => {
                notification.style.opacity = "1";
                notification.style.transform = "translateX(0)";
            }, 100);
            
            // Remove after 5 seconds (longer for errors)
            setTimeout(() => {
                notification.style.opacity = "0";
                notification.style.transform = "translateX(100%)";
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 5000);
            
        } catch (error) {
            console.error("❌ Failed to show error notification:", {
                error: error.message,
                message: message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Show network error notification with retry option
     */
    showNetworkErrorNotification() {
        try {
            console.log("🌐 Showing network error notification");
            
            // Create network error notification
            const notification = document.createElement("div");
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, var(--warning-color, #f59e0b), var(--warning-dark, #d97706));
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                box-shadow: var(--shadow-lg);
                z-index: 10001;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                font-weight: 500;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
                max-width: 450px;
                border-left: 4px solid var(--warning-color, #fbbf24);
            `;
            
            notification.innerHTML = `
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink: 0; margin-top: 2px;">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2v-2zm0-8h2v6h-2V9z"/>
                    </svg>
                    <div>
                        <div style="font-weight: 600; margin-bottom: 4px;">Network Connection Issue</div>
                        <div style="font-size: 13px; opacity: 0.9; line-height: 1.4;">
                            Unable to connect to server. Content may be limited. Please check your internet connection and refresh the page.
                        </div>
                        <button onclick="location.reload()" style="
                            background: var(--glass-bg, rgba(255,255,255,0.2));
                            border: 1px solid var(--border-light, rgba(255,255,255,0.3));
                            color: var(--text-inverse, white);
                            padding: 6px 12px;
                            border-radius: 6px;
                            font-size: 12px;
                            cursor: pointer;
                            margin-top: 8px;
                            transition: background 0.2s;
                        " onmouseover="this.style.background='var(--glass-bg, rgba(255,255,255,0.3))'" onmouseout="this.style.background='var(--glass-bg, rgba(255,255,255,0.2))'">
                            Refresh Page
                        </button>
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" style="
                        background: none;
                        border: none;
                        color: var(--text-inverse, white);
                        font-size: 18px;
                        cursor: pointer;
                        padding: 0;
                        margin-left: auto;
                        opacity: 0.7;
                        transition: opacity 0.2s;
                    " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">
                        ×
                    </button>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            // Animate in
            setTimeout(() => {
                notification.style.opacity = "1";
                notification.style.transform = "translateX(0)";
            }, 100);
            
            // Auto-remove after 15 seconds
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.style.opacity = "0";
                    notification.style.transform = "translateX(100%)";
                    setTimeout(() => {
                        if (notification.parentElement) {
                            notification.remove();
                        }
                    }, 300);
                }
            }, 15000);
            
        } catch (error) {
            console.error("Error showing network error notification:", error);
        }
    }

    /**
     * Handle initialization failure
     * @param {Error} error - The initialization error
     */
    handleInitializationFailure(error) {
        try {
            console.error("🚨 Content Manager initialization failed:", {
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            });
            
            // Show user-friendly error message
            this.showErrorNotification("Failed to load page content. Please refresh the page.");
            
            // Try to load basic fallback content
            this.loadBasicFallbackContent();
            
        } catch (handlerError) {
            console.error("❌ Error in initialization failure handler:", handlerError.message);
        }
    }

    /**
     * Load fallback content for a specific page
     * @param {string} page - The page to load fallback content for
     */
    async loadFallbackContent(page) {
        try {
            console.log(`🔄 Loading fallback content for page: ${page}`);
            
            // Define basic fallback content for different pages
            const fallbackContent = {
                home: {
                    "home.heroTitle": "Welcome to Our Website",
                    "home.heroSubtitle": "We are currently updating our content",
                    "home.heroDescription": "Please check back soon for the latest information."
                },
                about: {
                    "about.pageTitle": "About Us",
                    "about.mission": "Our mission is to serve our community.",
                    "about.vision": "Our vision is to make a positive impact."
                },
                contact: {
                    "contact.pageTitle": "Contact Us",
                    "contact.address": "Please contact us for more information.",
                    "contact.phone": "Phone information will be updated soon.",
                    "contact.email": "Email information will be updated soon."
                },
                global: {
                    "navigation.homeLink": "Home",
                    "navigation.aboutLink": "About",
                    "navigation.contactLink": "Contact",
                    "footer.description": "Website content is being updated."
                }
            };
            
            const content = fallbackContent[page] || {};
            
            if (Object.keys(content).length > 0) {
                console.log(`📦 Applying fallback content for ${page}: ${Object.keys(content).length} items`);
                this.applyTransformedContent(content);
            } else {
                console.warn(`⚠️ No fallback content available for page: ${page}`);
            }
            
        } catch (error) {
            console.error("❌ Error loading fallback content:", {
                error: error.message,
                page: page,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Load basic fallback content for initialization failures
     */
    loadBasicFallbackContent() {
        try {
            console.log("🔄 Loading basic fallback content for initialization failure");
            
            // Apply very basic content to prevent blank page
            const basicContent = {
                "navigation.homeLink": "Home",
                "navigation.aboutLink": "About", 
                "navigation.contactLink": "Contact",
                "footer.description": "Website is loading...",
                "home.heroTitle": "Welcome",
                "home.heroSubtitle": "Content is loading...",
                "about.pageTitle": "About Us",
                "contact.pageTitle": "Contact Us"
            };
            
            this.applyTransformedContent(basicContent);
            console.log("✅ Basic fallback content applied");
            
        } catch (error) {
            console.error("❌ Error loading basic fallback content:", error.message);
        }
    }
    
    /**
     * Show content loading indicator
     */
    showContentLoadingIndicator(message = "Loading content...") {
        // Remove existing indicator
        this.hideContentLoadingIndicator();
        
        const indicator = document.createElement("div");
        indicator.id = "content-loading-indicator";
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
            background: var(--overlay-light, rgba(255, 255, 255, 0.95));
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9997;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        const style = document.createElement("style");
        style.textContent = `
            #content-loading-indicator .loading-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: var(--shadow-lg, 0 8px 32px rgba(0,0,0,0.1));
            }
            #content-loading-indicator .loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid var(--gray-200, #f3f3f3);
                border-top: 3px solid var(--success-color, #28a745);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            #content-loading-indicator .loading-text {
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
     * Hide content loading indicator
     */
    hideContentLoadingIndicator() {
        const indicator = document.getElementById("content-loading-indicator");
        if (indicator) {
            indicator.remove();
        }
    }
}

// Initialize content manager when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
    window.contentManager = new ContentManager();
    await window.contentManager.initialize();
    
    // Initialize language toggle
    window.contentManager.initializeLanguageToggle();
    
    // Setup real-time updates
    window.contentManager.setupRealTimeUpdates();
});

// Export for global use
window.ContentManager = ContentManager;