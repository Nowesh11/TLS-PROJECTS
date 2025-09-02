/**
 * Enhanced Content Editor Management System
 * Handles dynamic content editing for all website pages with new API integration
 */

class ContentEditor {
    constructor() {
        this.apiBaseUrl = window.TLS_API_BASE_URL || "http://localhost:8080";
        this.currentPage = "home";
        this.sections = new Map();
        this.unsavedChanges = false;
        this.activityLog = [];
        this.isInitialized = false;
        this.initializationComplete = false;
        this.tamilFont = "Noto Sans Tamil, Tamil Sangam MN, Tamil MN, sans-serif";
        this.retryAttempts = new Map(); // Track retry attempts per page
        this.maxRetries = 2; // Maximum retry attempts
        this.shouldShowContentEditor = false; // Flag to control content editor visibility
        
        // Enhanced section types configuration with multi-field support
        this.sectionTypes = {
            "text": { 
                name: "Text Content", 
                icon: "fas fa-align-left", 
                fields: ["title", "content", "subtitle"],
                description: "Simple text content with title and subtitle",
                layout: ["full-width", "centered", "two-column"]
            },
            "image": { 
                name: "Image", 
                icon: "fas fa-image", 
                fields: ["title", "images", "subtitle", "caption"],
                description: "Image display with optional text",
                layout: ["full-width", "centered", "left-align", "right-align"]
            },
            "hero": { 
                name: "Hero Section", 
                icon: "fas fa-star", 
                fields: ["title", "content", "subtitle", "buttonText", "buttonUrl", "images", "backgroundImage"],
                description: "Main banner with title, subtitle, and call-to-action",
                layout: ["full-width", "centered", "split-screen"]
            },
            "banner": { 
                name: "Banner", 
                icon: "fas fa-flag", 
                fields: ["title", "content", "buttonText", "buttonUrl", "images", "backgroundColor"],
                description: "Promotional banner with action button",
                layout: ["full-width", "centered", "floating"]
            },
            "feature": { 
                name: "Feature List", 
                icon: "fas fa-list", 
                fields: ["title", "content", "subtitle", "features", "icons"],
                description: "List of features or services with icons",
                layout: ["grid-2", "grid-3", "grid-4", "vertical-list"]
            },
            "cards": { 
                name: "Cards", 
                icon: "fas fa-th", 
                fields: ["title", "content", "images", "cardItems"],
                description: "Card-based content layout",
                layout: ["grid-2", "grid-3", "grid-4", "masonry"]
            },
            "cta": { 
                name: "Call to Action", 
                icon: "fas fa-bullhorn", 
                fields: ["title", "content", "buttonText", "buttonUrl", "backgroundColor", "textColor"],
                description: "Prominent call-to-action section",
                layout: ["centered", "full-width", "boxed"]
            },
            "gallery": { 
                name: "Gallery", 
                icon: "fas fa-images", 
                fields: ["title", "images", "captions", "lightbox"],
                description: "Image gallery with lightbox support",
                layout: ["grid-2", "grid-3", "grid-4", "masonry", "carousel"]
            },
            "form": { 
                name: "Form", 
                icon: "fas fa-wpforms", 
                fields: ["title", "content", "formFields", "submitText"],
                description: "Contact or subscription form",
                layout: ["single-column", "two-column", "inline"]
            },
            "testimonials": {
                name: "Testimonials",
                icon: "fas fa-quote-left",
                fields: ["title", "testimonials", "authorImages"],
                description: "Customer testimonials and reviews",
                layout: ["carousel", "grid-2", "grid-3", "single"]
            },
            "stats": {
                name: "Statistics",
                icon: "fas fa-chart-bar",
                fields: ["title", "stats", "icons", "animations"],
                description: "Number counters and statistics",
                layout: ["grid-2", "grid-3", "grid-4", "horizontal"]
            },
            "team": {
                name: "Team Members",
                icon: "fas fa-users",
                fields: ["title", "members", "photos", "socialLinks"],
                description: "Team member profiles",
                layout: ["grid-2", "grid-3", "grid-4", "carousel"]
            },
            "pricing": {
                name: "Pricing Table",
                icon: "fas fa-dollar-sign",
                fields: ["title", "plans", "features", "buttonText"],
                description: "Pricing plans and packages",
                layout: ["grid-2", "grid-3", "comparison"]
            },
            "faq": {
                name: "FAQ Section",
                icon: "fas fa-question-circle",
                fields: ["title", "questions", "answers", "categories"],
                description: "Frequently asked questions",
                layout: ["accordion", "tabs", "grid-2"]
            },
            "contact-info": {
                name: "Contact Information",
                icon: "fas fa-address-card",
                fields: ["title", "address", "phone", "email", "hours", "map"],
                description: "Contact details and location",
                layout: ["side-by-side", "stacked", "with-map"]
            },
            "navigation": {
                name: "Navigation Menu",
                icon: "fas fa-bars",
                fields: ["logo", "menuItems", "socialLinks", "ctaButton"],
                description: "Site navigation and menu",
                layout: ["horizontal", "vertical", "mega-menu"]
            }
        };
        
        // Layout options
        this.layoutOptions = {
            "full-width": "Full Width",
            "two-column": "Two Column",
            "three-column": "Three Column",
            "centered": "Centered",
            "sidebar": "With Sidebar"
        };
        
        // Style presets
        this.stylePresets = {
            "default": "Default",
            "modern": "Modern",
            "classic": "Classic",
            "minimal": "Minimal",
            "bold": "Bold",
            "elegant": "Elegant"
        };
        
        // Constructor complete - initialization will be handled externally
        console.log("🚀 ContentEditor constructor completed");
    }

     async init() {
         console.log("📋 ContentEditor.init() called");
         const initStartTime = performance.now();
         
         try {
             // Set up basic functionality first to ensure UI responsiveness
             this.setupEventListeners();
             this.setupAutoSave();
             
             // Mark as initialized early to prevent timeout issues
             this.isInitialized = true;
             this.initializationComplete = true;
             
             // Get the currently selected page from the page selector
             const pageSelector = document.getElementById("pageSelector");
             console.log("🔍 pageSelector element found:", !!pageSelector);
             if (pageSelector) {
                 console.log("📄 pageSelector value:", pageSelector.value);
             } else {
                 console.log("ℹ️ pageSelector element not found - using default page \"home\"");
             }
             const initialPage = pageSelector ? pageSelector.value : "home";
             console.log("📄 Current page for content loading:", initialPage);
             
             // Load content asynchronously without blocking initialization
             console.log("🔄 Starting async content loading...");
             this.loadPageContent(initialPage).catch(contentError => {
                 console.warn("⚠️ Content loading failed:", contentError.message);
                 // Show empty state on error
                 this.sections.set(initialPage, []);
                 this.renderPageSections(initialPage, []);
             });
             
             // Load activity table asynchronously (non-blocking)
             this.loadActivityTable().catch(error => {
                 console.warn("⚠️ Activity table loading failed:", error.message);
             });
             this.setupActivityTableFilters();
             
             const initTime = performance.now() - initStartTime;
             console.log(`✅ ContentEditor.init() completed successfully in ${initTime.toFixed(2)}ms`);
         } catch (error) {
             const initTime = performance.now() - initStartTime;
             console.error(`❌ ContentEditor.init() failed after ${initTime.toFixed(2)}ms:`, error);
             
             // Ensure basic functionality is available even on failure
             try {
                 this.setupBasicFunctionality();
                 this.isInitialized = true;
                 this.initializationComplete = true;
                 console.log("🔧 Basic functionality setup completed after error");
             } catch (basicError) {
                 console.error("ERROR: Failed to setup basic functionality:", basicError);
                 this.initializationComplete = false;
             }
         }
     }
    
    // Fetch section data directly from API and edit
    async fetchAndEditSection(sectionKey) {
        try {
            console.log("Fetching section data from API for:", sectionKey);
            
            // Try to get current page from page selector
            const currentPage = this.getCurrentPage() || "home";
            
            // Fetch sections for current page
            const response = await fetch(`/api/website-content/sections?page=${currentPage}`);
            const data = await response.json();
            
            if (data.success && data.data) {
                // Find the section in the fetched data
                const section = data.data.find(s => 
                    s.sectionKey === sectionKey || 
                    s.section === sectionKey || 
                    s._id === sectionKey ||
                    (s.sectionKey && s.sectionKey.toLowerCase() === sectionKey.toLowerCase()) ||
                    (s.section && s.section.toLowerCase() === sectionKey.toLowerCase())
                );
                
                if (section) {
                    console.log("Section found via API:", section);
                    
                    // Update allSections cache
                    if (!this.allSections) {
                        this.allSections = [];
                    }
                    
                    // Add to cache if not already present
                    const existingIndex = this.allSections.findIndex(s => s._id === section._id);
                    if (existingIndex >= 0) {
                        this.allSections[existingIndex] = section;
                    } else {
                        this.allSections.push(section);
                    }
                    
                    // Create and show settings modal
                    const modal = this.createSettingsModal(section);
                    document.body.appendChild(modal);
                    modal.style.display = "flex";
                    
                    // Add click outside to close
                    modal.addEventListener("click", (e) => {
                        if (e.target === modal) {
                            this.closeModal(modal);
                        }
                    });
                    
                    this.showNotification("Section loaded for editing", "success");
                } else {
                    console.error("Section not found in API response:", sectionKey);
                    this.showNotification("Section not found. Please check if the section exists.", "error");
                }
            } else {
                console.error("Failed to fetch sections from API");
                this.showNotification("Failed to load section data. Please try again.", "error");
            }
        } catch (error) {
            console.error("Error fetching section data:", error);
            this.showNotification("Error loading section data. Please try again.", "error");
        }
    }
    
    // Get current page from page selector
    getCurrentPage() {
        try {
            // Try to get from page selector dropdown
            const pageSelector = document.getElementById("page-selector");
            if (pageSelector && pageSelector.value) {
                return pageSelector.value;
            }
            
            // Try to get from URL or other sources
            const urlParams = new URLSearchParams(window.location.search);
            const pageFromUrl = urlParams.get("page");
            if (pageFromUrl) {
                return pageFromUrl;
            }
            
            // Default to home
            return "home";
        } catch (error) {
            console.error("Error getting current page:", error);
            return "home";
        }
    }
               


     /**
     * Setup basic functionality when full initialization fails
     */
    setupBasicFunctionality() {
        const startTime = performance.now();
        console.log("🔧 Setting up basic ContentEditor functionality...");
        
        try {
            // Skip DOM loading check if already called during initialization
            if (document.readyState === "loading" && !this.isInitialized) {
                console.log("[BASIC SETUP] DOM still loading, deferring setup...");
                return; // Don't set up recursive listeners
            }
            
            console.log("[BASIC SETUP] Starting basic functionality setup");
            
            // Set up minimal event listeners with error handling (only if not already done)
            if (!this.isInitialized) {
                try {
                    this.setupEventListeners();
                    console.log("[BASIC SETUP] Event listeners set up successfully");
                } catch (listenerError) {
                    console.error("[BASIC SETUP] Failed to setup event listeners:", {
                        error: listenerError.message,
                        stack: listenerError.stack,
                        timestamp: new Date().toISOString()
                    });
                    // Continue with setup even if listeners fail
                }
            }
            
            // Initialize with empty sections for current page
            const pageSelector = document.getElementById("pageSelector");
            const basicSetupPage = pageSelector ? pageSelector.value : "home";
            
            console.log("[BASIC SETUP] Selected page:", basicSetupPage);
            
            // Validate page selector exists
            if (!pageSelector) {
                console.warn("[BASIC SETUP] Page selector not found, using default page: home");
            }
            
            // Initialize sections map if not exists
            if (!this.sections) {
                this.sections = new Map();
                console.log("[BASIC SETUP] Initialized sections Map");
            }
            
            // Set empty sections for selected page
            this.sections.set(basicSetupPage, []);
            console.log(`[BASIC SETUP] Set empty sections for page: ${basicSetupPage}`);
            
            // Attempt to render page sections
            try {
                this.renderPageSections(basicSetupPage, []);
                console.log("[BASIC SETUP] Page sections rendered successfully");
            } catch (renderError) {
                console.error("[BASIC SETUP] Failed to render page sections:", {
                    error: renderError.message,
                    stack: renderError.stack,
                    page: basicSetupPage,
                    timestamp: new Date().toISOString()
                });
                // Continue with setup even if rendering fails
            }
            
            // Initialize basic properties
            this.isInitialized = true;
            this.initializationComplete = true; // Allow admin panel to proceed
            this.currentPage = basicSetupPage;
            
            // Set up basic error recovery mechanisms
            this.setupErrorRecovery();
            
            const setupTime = performance.now() - startTime;
            console.log(`✅ Basic ContentEditor functionality set up successfully in ${setupTime.toFixed(2)}ms`);
            
        } catch (error) {
            const setupTime = performance.now() - startTime;
            console.error("❌ Failed to set up basic functionality:", {
                error: error.message,
                stack: error.stack,
                setupTime: `${setupTime.toFixed(2)}ms`,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            });
            
            // Mark initialization as failed but don't completely break
            this.initializationComplete = false;
            this.isInitialized = false;
            
            // Show user-friendly error message
            if (typeof this.showNotification === "function") {
                this.showNotification("Failed to initialize content editor. Some features may not work properly.", "error");
            }
            
            // Attempt minimal fallback setup
            try {
                this.sections = this.sections || new Map();
                this.currentPage = "home";
                console.log("[BASIC SETUP] Minimal fallback setup completed");
            } catch (fallbackError) {
                console.error("[BASIC SETUP] Even fallback setup failed:", fallbackError.message);
            }
        }
    }

    setupEventListeners() {
        // Section type selector
        document.addEventListener("click", (e) => {
            if (e.target.closest(".section-type-card")) {
                this.selectSectionType(e.target.closest(".section-type-card"));
            }
        });

        // Form change detection
        document.addEventListener("input", (e) => {
            if (e.target.closest(".content-editor-area") || e.target.closest(".content-editor-container")) {
                const sectionElement = e.target.closest(".section-editor");
                this.markUnsavedChanges(sectionElement);
            }
        });

        document.addEventListener("change", (e) => {
            if (e.target.closest(".content-editor-area") || e.target.closest(".content-editor-container")) {
                const sectionElement = e.target.closest(".section-editor");
                this.markUnsavedChanges(sectionElement);
            }
        });

        // Auto-save setup
        document.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.key === "s") {
                e.preventDefault();
                this.savePageContent(this.currentPage);
            }
        });

        // Prevent accidental navigation
        window.addEventListener("beforeunload", (e) => {
            if (this.unsavedChanges) {
                e.preventDefault();
                e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
            }
        });
    }

    selectSectionType(card) {
        if (!card) return;
        
        // Remove previous selection
        document.querySelectorAll(".section-type-card").forEach(c => {
            if (c && c.classList) {
                c.classList.remove("selected");
            }
        });
        
        // Add selection to clicked card
        if (card.classList) {
            card.classList.add("selected");
        }
        
        // Update hidden input
        const selectedType = card.dataset ? card.dataset.type : null;
        const hiddenInput = document.getElementById("selectedSectionType");
        if (hiddenInput && selectedType) {
            hiddenInput.value = selectedType;
        }
    }

    setupAutoSave() {
        // Initialize save queue and state tracking
        this.saveQueue = [];
        this.isSaving = false;
        this.lastSaveTime = 0;
        this.saveDebounceTimeout = null;
        this.processingQueue = false;
        
        // Process save queue periodically
        setInterval(() => {
            this.processSaveQueue();
        }, 2000); // Check queue every 2 seconds
        
        setInterval(() => {
            if (this.unsavedChanges && !this.isSaving) {
                this.autoSave();
            }
        }, 30000); // Auto-save every 30 seconds
    }

    setupErrorRecovery() {
        console.log("🛡️ Setting up error recovery mechanisms...");
        
        // Set up global error handlers
        window.addEventListener("error", (event) => {
            console.error("Global error caught:", event.error);
            this.handleGlobalError(event.error);
        });
        
        window.addEventListener("unhandledrejection", (event) => {
            console.error("Unhandled promise rejection:", event.reason);
            this.handleGlobalError(event.reason);
        });
        
        // Set up periodic health checks
        this.setupHealthChecks();
        
        console.log("✅ Error recovery mechanisms set up successfully");
    }
    
    handleGlobalError(error) {
        // Log the error for debugging
        console.error("Handling global error:", error);
        
        // Show user-friendly notification
        if (typeof this.showNotification === "function") {
            this.showNotification("An unexpected error occurred. The system is attempting to recover.", "warning");
        }
        
        // Attempt to recover from common errors
        if (error.message && error.message.includes("Authentication")) {
            this.handleAuthError();
        } else if (error.message && error.message.includes("Network")) {
            this.handleNetworkError();
        }
    }
    
    handleAuthError() {
        console.log("🔐 Handling authentication error...");
        // Clear potentially corrupted auth data
        localStorage.removeItem("authToken");
        localStorage.removeItem("userRole");
        
        // Show login prompt
        if (typeof this.showNotification === "function") {
            this.showNotification("Session expired. Please log in again.", "error");
        }
    }
    
    handleNetworkError() {
        console.log("🌐 Handling network error...");
        // Show network error message
        if (typeof this.showNotification === "function") {
            this.showNotification("Network connection issue. Please check your internet connection.", "error");
        }
    }
    
    setupHealthChecks() {
        // Periodic health check every 30 seconds
        setInterval(() => {
            this.performHealthCheck();
        }, 30000);
    }
    
    performHealthCheck() {
        try {
            // Check if essential DOM elements exist
            const pageSelector = document.getElementById("pageSelector");
            if (!pageSelector) {
                console.warn("⚠️ Health check: pageSelector element missing");
            }
            
            // Check if sections map is intact
            if (!this.sections || !(this.sections instanceof Map)) {
                console.warn("⚠️ Health check: sections map corrupted, reinitializing...");
                this.sections = new Map();
            }
            
            // Check initialization state
            if (!this.isInitialized) {
                console.warn("⚠️ Health check: ContentEditor not properly initialized");
            }
        } catch (error) {
            console.error("❌ Health check failed:", error);
        }
    }

    // Page switching functionality
    switchContentPage(page) {
        if (this.unsavedChanges) {
            if (!confirm("You have unsaved changes. Do you want to continue without saving?")) {
                return;
            }
        }

        // Update tab states
        document.querySelectorAll(".content-tab").forEach(tab => {
            if (tab && tab.classList) {
                tab.classList.remove("active");
            }
        });
        
        const activeTab = document.querySelector(`[data-page="${page}"]`);
        if (activeTab && activeTab.classList) {
            activeTab.classList.add("active");
        }

        // Update editor states - hide all editors first
        document.querySelectorAll(".page-content-editor").forEach(editor => {
            if (editor) {
                editor.style.display = "none";
                editor.classList.remove("active");
            }
        });
        
        // Only show the current editor if it should be visible
        // Check if we're in content editing mode (when showContentEditorForSelectedPage was called)
        const currentEditor = document.getElementById(`content-editor-${page}`);
        if (currentEditor && this.shouldShowContentEditor) {
            currentEditor.style.display = "block";
            currentEditor.classList.add("active");
        }

        // Update dropdown selection
        const pageSelector = document.getElementById("pageSelector");
        if (pageSelector && pageSelector.value !== page) {
            pageSelector.value = page;
        }

        // Update page info display
        updateSelectedPageInfo(page);

        this.currentPage = page;
        
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
            console.log("About to load content for page:", page);
            this.loadPageContent(page);
        }, 100);
        
        this.unsavedChanges = false;
    }

    // Enable content editor visibility
    enableContentEditor() {
        this.shouldShowContentEditor = true;
        console.log('Content editor visibility enabled');
    }

    // Disable content editor visibility
    disableContentEditor() {
        this.shouldShowContentEditor = false;
        // Hide all content editors
        document.querySelectorAll('.page-content-editor').forEach(editor => {
            editor.style.display = 'none';
            editor.classList.remove('active');
        });
        console.log('Content editor visibility disabled');
    }

    // Load content for specific page using new section-based API with performance optimizations
    async loadPageContent(page) {
        // Performance optimization: Check cache first (5 minute cache)
        if (!this.contentCache) {
            this.contentCache = new Map();
        }
        
        const cacheKey = page;
        const cached = this.contentCache.get(cacheKey);
        const cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        if (cached && (Date.now() - cached.timestamp) < cacheTimeout) {
            console.log(`[LOAD PAGE CONTENT] Using cached content for page: ${page}`);
            this.sections.set(page, cached.sections);
            this.renderPageSections(page, cached.sections);
            return;
        }
        
        // Performance optimization: Prevent concurrent loads for the same page
        if (this.loadingPages && this.loadingPages.has(page)) {
            console.log(`[LOAD PAGE CONTENT] Already loading page: ${page}, skipping duplicate request`);
            return;
        }
        
        // Initialize loading tracker
        if (!this.loadingPages) {
            this.loadingPages = new Set();
        }
        this.loadingPages.add(page);
        
        const startTime = performance.now();
        console.log(`[LOAD PAGE CONTENT] Starting load for page: ${page} at ${new Date().toISOString()}`);
        
        try {
            this.showLoading(true);
            
            // Get auth token with enhanced validation
            const token = this.getAuthToken();
            console.log(`[LOAD PAGE CONTENT] Auth token status: ${token ? "found" : "missing"}`);
            
            if (!token) {
                throw new Error("Authentication token not found. Please log in again.");
            }
            
            if (token) {
                console.log(`[LOAD PAGE CONTENT] Token preview: ${token ? token.substring(0, 20) : 'null'}...`);
            }
            
            const apiUrl = `${this.apiBaseUrl}/api/website-content/sections/${page}`;
            console.log(`[LOAD PAGE CONTENT] Making request to: ${apiUrl}`);
            
            // Enhanced fetch with timeout and retry logic
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(apiUrl, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log(`[LOAD PAGE CONTENT] Response received - Status: ${response.status}, OK: ${response.ok}`);
            console.log("[LOAD PAGE CONTENT] Response headers:", Object.fromEntries(response.headers.entries()));

            if (response.ok) {
                const result = await response.json();
                console.log(`[LOAD PAGE CONTENT] API Response for ${page}:`, {
                    success: result.success, 
                    count: result.count,
                    dataLength: result.data?.length || 0,
                    timestamp: new Date().toISOString()
                });
                
                // Handle bilingual content structure from website-content sections API
                if (result.success && result.data) {
                    const sections = result.data.map((item, index) => ({
                        _id: item._id,
                        id: item._id,
                        sectionKey: item.sectionId || item.section,
                        section: item.sectionId,
                        title: item.sectionTitle || item.title || "Untitled Section",
                        titleTamil: item.sectionTitleTamil || item.titleTamil || "",
                        content: item.contentHtml || item.content || "",
                        contentTamil: item.contentTamil || "",
                        subtitle: item.subtitle || "",
                        subtitleTamil: item.subtitleTamil || "",
                        buttonText: item.buttonText || "",
                        buttonTextTamil: item.buttonTextTamil || "",
                        buttonUrl: item.buttonUrl || "",
                        order: item.order || index + 1,
                        isActive: item.isActive !== false,
                        isVisible: item.isVisible !== false,
                        sectionType: item.sectionType || "text",
                        layout: item.layout || "default",
                        page: item.pageName || page,
                        metadata: item.metadata || {},
                        image: item.image || "",
                        images: item.images || [],
                        stylePreset: item.stylePreset || "default",
                        customStyles: item.styling || {},
                        createdBy: item.createdBy,
                        updatedBy: item.updatedBy,
                        createdAt: item.createdAt,
                        updatedAt: item.updatedAt
                    }));
                    
                    console.log(`Total sections loaded: ${sections.length}`);
                    this.sections.set(page, sections);
                    
                    // Performance optimization: Cache the loaded content
                    this.contentCache.set(page, {
                        sections: sections,
                        timestamp: Date.now()
                    });
                    
                    this.renderPageSections(page, sections);
                    
                    // Ensure content is visible after loading
                    setTimeout(() => {
                        const sectionsContainer = document.getElementById("sectionsContainer");
                        const contentArea = document.querySelector(".sections-container");
                        if (sectionsContainer) {
                            sectionsContainer.style.display = "block";
                            sectionsContainer.style.opacity = "1";
                            sectionsContainer.style.visibility = "visible";
                        }
                        if (contentArea) {
                            contentArea.style.display = "block";
                            contentArea.style.opacity = "1";
                            contentArea.style.visibility = "visible";
                        }
                    }, 100);
                } else {
                    // No content found for this page, show empty state
                    console.log("No sections found for page:", page);
                    this.sections.set(page, []);
                    this.renderPageSections(page, []);
                    
                    // Ensure content area is visible even when empty
                    setTimeout(() => {
                        const sectionsContainer = document.getElementById("sectionsContainer");
                        const contentArea = document.querySelector(".sections-container");
                        if (sectionsContainer) {
                            sectionsContainer.style.display = "block";
                            sectionsContainer.style.opacity = "1";
                            sectionsContainer.style.visibility = "visible";
                        }
                        if (contentArea) {
                            contentArea.style.display = "block";
                            contentArea.style.opacity = "1";
                            contentArea.style.visibility = "visible";
                        }
                    }, 100);
                }
            } else if (response.status === 404) {
                // No content found for this page, show empty state
                console.log(`[LOAD PAGE CONTENT] No sections found for page: ${page}`);
                this.sections.set(page, []);
                this.renderPageSections(page, []);
                this.showNotification(`No content found for ${page} page. You can create new sections.`, "info");
            } else {
                let errorDetails;
                try {
                    errorDetails = await response.json();
                } catch (parseError) {
                    errorDetails = { message: await response.text() };
                }
                
                console.error("[LOAD PAGE CONTENT] API Error Response:", {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    headers: Object.fromEntries(response.headers.entries()),
                    body: errorDetails,
                    timestamp: new Date().toISOString()
                });
                
                // Handle specific error cases
                if (response.status === 401) {
                    this.showNotification("Authentication expired. Please log in again.", "error");
                    // Optionally redirect to login
                } else if (response.status === 403) {
                    this.showNotification("Access denied. You may not have permission to view this content.", "error");
                } else if (response.status >= 500) {
                    this.showNotification("Server error occurred. Please try again later.", "error");
                } else {
                    this.showNotification(`Failed to load content: ${errorDetails.message || response.statusText}`, "error");
                }
                
                throw new Error(`Failed to load content: ${response.status} ${response.statusText} - ${errorDetails.message || "Unknown error"}`);
            }
            
            // Load activity log for this page
            await this.loadActivityLog(page);
        } catch (error) {
            const loadTime = performance.now() - startTime;
            console.error(`[LOAD PAGE CONTENT] Error loading page content for ${page}:`, {
                error: error.message,
                stack: error.stack,
                page: page,
                loadTime: `${loadTime.toFixed(2)}ms`,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            });
            
            // Handle different error types
            if (error.name === "AbortError") {
                this.showNotification("Request timed out. Please check your connection and try again.", "error");
            } else if (error.message.includes("Authentication")) {
                this.showNotification("Authentication error. Please log in again.", "error");
            } else if (error.message.includes("NetworkError") || error.message.includes("Failed to fetch")) {
                const retryCount = this.retryAttempts.get(page) || 0;
                if (retryCount < this.maxRetries) {
                    this.retryAttempts.set(page, retryCount + 1);
                    this.showNotification(`Network error. Retrying... (${retryCount + 1}/${this.maxRetries})`, "warning");
                    setTimeout(() => {
                        console.log(`[LOAD PAGE CONTENT] Retrying load for page: ${page} (attempt ${retryCount + 1})`);
                        this.loadPageContent(page);
                    }, 3000);
                    return; // Don't show empty state immediately, wait for retry
                } else {
                    this.showNotification("Network error. Maximum retries exceeded. Please refresh the page.", "error");
                    this.retryAttempts.delete(page); // Reset retry count
                }
            } else {
                this.showNotification(`Error loading page content: ${error.message}`, "error");
            }
            
            // Show empty state on error (except for network errors which retry)
            this.sections.set(page, []);
            this.renderPageSections(page, []);
        } finally {
            // Performance optimization: Clean up loading tracker
            if (this.loadingPages) {
                this.loadingPages.delete(page);
            }
            
            this.showLoading(false);
            const totalTime = performance.now() - startTime;
            console.log(`[LOAD PAGE CONTENT] Load completed for ${page} in ${totalTime.toFixed(2)}ms`);
        }
    }

    // Load activity log for a page
    async loadActivityLog(page) {
        const startTime = performance.now();
        console.log(`🔄 Starting activity log load for page ${page}...`);
        
        try {
            // Input validation
            if (page === undefined || page === null) {
                console.warn("⚠️ Page parameter is undefined/null, defaulting to 1");
                page = 1;
            }
            
            console.log(`📋 Loading activity log - Page: ${page}, Limit: 10`);
            
            // Get authentication token
            const token = this.getAuthToken();
            if (!token) {
                console.error("❌ No authentication token available for activity log");
                this.showNotification("Authentication required to load activity log", "error");
                return;
            }
            
            console.log("🔑 Authentication token retrieved for activity log");
            
            // Prepare API request with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                console.error("⏰ Activity log request timed out after 30 seconds");
            }, 30000);
            
            const apiUrl = `${this.apiBaseUrl}/api/activity?page=${page}&limit=10`;
            console.log(`🌐 Making API request to: ${apiUrl}`);
            
            const response = await fetch(apiUrl, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            console.log(`📡 Activity log API response - Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const result = await response.json();
                console.log("📊 Activity log response data:", {
                    hasData: !!result.data,
                    activitiesCount: result.data?.activities?.length || 0,
                    totalPages: result.data?.totalPages,
                    currentPage: result.data?.currentPage
                });
                
                this.activityLog = result.data?.activities || [];
                console.log(`✅ Activity log loaded successfully - ${this.activityLog.length} activities`);
                
                this.renderActivityLog();
                this.showNotification(`Activity log loaded (${this.activityLog.length} activities)`, "success");
                
            } else {
                // Handle specific HTTP status codes
                let errorMessage = "Failed to load activity log";
                
                switch (response.status) {
                    case 401:
                        errorMessage = "Authentication expired. Please log in again.";
                        console.error("🔒 Activity log load failed - Authentication expired");
                        break;
                    case 403:
                        errorMessage = "Access denied. Insufficient permissions to view activity log.";
                        console.error("🚫 Activity log load failed - Access denied");
                        break;
                    case 404:
                        errorMessage = "Activity log endpoint not found.";
                        console.error("🔍 Activity log load failed - Endpoint not found");
                        break;
                    case 500:
                        errorMessage = "Server error while loading activity log. Please try again.";
                        console.error("🔥 Activity log load failed - Server error");
                        break;
                    default:
                        console.error(`❌ Activity log load failed - HTTP ${response.status}: ${response.statusText}`);
                }
                
                // Try to get error details from response
                try {
                    const errorData = await response.json();
                    if (errorData.message) {
                        errorMessage = errorData.message;
                        console.error("📝 Server error message:", errorData.message);
                    }
                } catch (parseError) {
                    console.warn("⚠️ Could not parse error response:", parseError.message);
                }
                
                this.showNotification(errorMessage, "error");
            }
            
        } catch (error) {
            console.error("💥 Activity log load error:", {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                page: page
            });
            
            let userMessage = "Failed to load activity log";
            
            if (error.name === "AbortError") {
                userMessage = "Activity log request timed out. Please try again.";
                console.error("⏰ Activity log request was aborted due to timeout");
            } else if (error.name === "TypeError" && error.message.includes("fetch")) {
                userMessage = "Network error while loading activity log. Please check your connection.";
                console.error("🌐 Network error during activity log load");
            } else if (error.name === "SyntaxError") {
                userMessage = "Invalid response format from server.";
                console.error("📝 JSON parsing error in activity log response");
            }
            
            this.showNotification(userMessage, "error");
            
            // Set empty activity log on error
            this.activityLog = [];
            this.renderActivityLog();
            
        } finally {
            const endTime = performance.now();
            const duration = (endTime - startTime).toFixed(2);
            console.log(`⏱️ Activity log load completed in ${duration}ms`);
        }
    }

    // Get authentication token with caching
    getAuthToken() {
        // Use TokenManager if available, otherwise fallback to old method
        if (typeof window.TokenManager !== "undefined" && window.tokenManager) {
            return window.tokenManager.getToken();
        }
        
        // Return cached token if available and not expired
        if (this._cachedToken && this._tokenCacheTime && (Date.now() - this._tokenCacheTime < 300000)) { // 5 min cache
            return this._cachedToken;
        }
        
        // Try multiple sources for the token
        let token = localStorage.getItem("token");
        
        if (!token) {
            const sessionData = localStorage.getItem("tamil_society_session");
            if (sessionData) {
                try {
                    const parsed = JSON.parse(sessionData);
                    token = parsed.token;
                    // Store in the format admin panel expects for future use
                    if (token) {
                        localStorage.setItem("token", token);
                        localStorage.setItem("user", JSON.stringify(parsed.user));
                    }
                } catch (e) {
                    console.error("Error parsing session data:", e);
                }
            }
        }
        
        if (!token) {
            token = sessionStorage.getItem("token");
        }
        
        // Cache the token for 5 minutes to reduce redundant calls
        if (token) {
            this._cachedToken = token;
            this._tokenCacheTime = Date.now();
        }
        
        return token;
    }

    // Render sections for a page with enhanced error handling
    renderPageSections(page, sections) {
        // Wait for DOM to be ready
        if (document.readyState !== "complete") {
            setTimeout(() => this.renderPageSections(page, sections), 100);
            return;
        }
        
        // Performance optimization: Cache container lookups and use efficient selector
        const containerIds = [
            `${page}-sections-container`,
            `content-editor-${page}`,
            `page-content-${page}`,
            `sections-${page}`
        ];
        
        let container = null;
        for (const id of containerIds) {
            container = document.getElementById(id);
            if (container) break;
        }
        
        if (!container) {
            console.error("No suitable container found for page:", page);
            return;
        }

        // Clear existing content
        container.innerHTML = "";
        console.log("Container cleared, innerHTML length:", container.innerHTML.length);

        if (sections.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-tertiary);">
            <i class="fas fa-plus-circle" style="font-size: 3rem; margin-bottom: 1rem; color: var(--text-secondary);"></i>
            <h3 style="margin: 0 0 0.5rem 0; color: var(--text-primary);">No sections found</h3>
                    <p style="margin: 0 0 1.5rem 0;">Create your first section to get started</p>
                    <button class="btn btn-primary" onclick="contentEditor.showSectionCreator('${page}')">
                        <i class="fas fa-plus"></i> Create Section
                    </button>
                </div>
            `;
            return;
        }

        // Performance optimization: Use DocumentFragment for batch DOM operations
        const fragment = document.createDocumentFragment();
        
        // Batch create all section elements
        sections.forEach(section => {
            const sectionElement = this.createSectionEditor(section);
            fragment.appendChild(sectionElement);
        });
        
        // Single DOM operation instead of multiple appendChild calls
        container.appendChild(fragment);
        
        // Use requestAnimationFrame for non-blocking initialization
        requestAnimationFrame(() => {
            this.initializeSectionEditors(page);
        });
    }

    // Create section editor element with real database data
    createSectionEditor(section) {
        const sectionDiv = document.createElement("div");
        sectionDiv.className = "section-editor";
        sectionDiv.dataset.sectionId = section._id;
        sectionDiv.dataset.sectionKey = section.sectionKey || section.section;

        const sectionType = this.sectionTypes[section.sectionType] || this.sectionTypes["text"];
        const sectionKey = section.sectionKey || section.section || section._id;
        
        sectionDiv.innerHTML = `
            <div class="section-header">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <i class="${sectionType.icon}" style="color: var(--primary-color);"></i>
                    <div>
                        <h4 class="section-title" style="color: var(--text-primary);">${this.getDisplayTitle(section)}</h4>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.875rem;">
                            ${sectionType.name} • ${section.layout || "full-width"} • Order: ${section.order || 0}
                        </p>
                    </div>
                </div>
                <div class="section-actions">
                    <button class="btn btn-sm btn-info" onclick="contentEditor.previewSection(contentEditor.currentPage, '${sectionKey}')" title="Preview Section">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="contentEditor.duplicateSection('${sectionKey}')" title="Duplicate">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="contentEditor.editSectionSettings('${sectionKey}')" title="Settings">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="contentEditor.deleteSection('${sectionKey}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <div class="section-content">
                ${this.generateSectionFields(section)}
            </div>
            
            <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-secondary); display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text-primary);">
                        <input type="checkbox" ${section.isVisible ? "checked" : ""} 
                               onchange="contentEditor.updateSectionProperty('${section._id}', 'isVisible', this.checked)">
                        Visible
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text-primary);">
                        <input type="checkbox" ${section.isActive ? "checked" : ""} 
                               onchange="contentEditor.updateSectionProperty('${section._id}', 'isActive', this.checked)">
                        Active
                    </label>
                </div>
                <button class="btn btn-sm btn-primary" onclick="contentEditor.saveSection('${sectionKey}')">
                    <i class="fas fa-save"></i> Save
                </button>
            </div>
        `;

        return sectionDiv;
    }

    // Generate form fields based on section type
    generateSectionFields(section) {
        const sectionType = section.sectionType || "text";
        let fields = "";

        // Handle different section types
        switch (sectionType) {
            case "hero":
                fields += this.generateHeroFields(section);
                break;
            case "text":
                fields += this.generateTextFields(section);
                break;
            case "image":
                fields += this.generateImageFields(section);
                break;
            case "navigation":
                fields += this.generateNavigationFields(section);
                break;
            default:
                fields += this.generateDefaultFields(section);
                break;
        }

        return `<div class="section-fields-grid">${fields}</div>`;
    }

    generateHeroFields(section) {
        // Use the actual database field structure with proper escaping
        const titleEn = this.escapeHtml(section.title?.en || section.title || "");
        const titleTa = this.escapeHtml(section.title?.ta || section.titleTamil || "");
        const contentEn = this.escapeHtml(section.content?.en || section.content || "");
        const contentTa = this.escapeHtml(section.content?.ta || section.contentTamil || "");
        const subtitleEn = this.escapeHtml(section.subtitle?.en || section.subtitle || "");
        const subtitleTa = this.escapeHtml(section.subtitle?.ta || section.subtitleTamil || "");
        const buttonTextEn = this.escapeHtml(section.buttonText?.en || section.buttonText || "");
        const buttonTextTa = this.escapeHtml(section.buttonText?.ta || section.buttonTextTamil || "");
        const buttonUrl = this.escapeHtml(section.buttonUrl || "");
        const images = section.images || [];
        const mainImage = images.length > 0 ? images[0].url : section.image || "";

        return `
            <div class="content-field">
                <label class="field-label">
                    <i class="fas fa-heading"></i> Title (English)
                </label>
                <input type="text" class="field-input" name="title_en" value="${titleEn}" placeholder="Enter title">
            </div>
            <div class="content-field">
                <label class="field-label">
                    <i class="fas fa-heading"></i> Title (Tamil)
                </label>
                <input type="text" class="field-input tamil-text" name="title_ta" value="${titleTa}" placeholder="தலைப்பு உள்ளிடவும்">
            </div>
            <div class="content-field" style="grid-column: 1 / -1;">
                <label class="field-label">
                    <i class="fas fa-align-left"></i> Content (English)
                </label>
                <textarea class="field-input field-textarea wysiwyg-editor" name="content_en" placeholder="Enter content">${contentEn}</textarea>
            </div>
            <div class="content-field" style="grid-column: 1 / -1;">
                <label class="field-label">
                    <i class="fas fa-align-left"></i> Content (Tamil)
                </label>
                <textarea class="field-input field-textarea wysiwyg-editor tamil-text" name="content_ta" placeholder="உள்ளடக்கம் உள்ளிடவும்">${contentTa}</textarea>
            </div>
            <div class="content-field">
                <label class="field-label">
                    <i class="fas fa-align-left"></i> Subtitle (English)
                </label>
                <input type="text" class="field-input" name="subtitle_en" value="${subtitleEn}" placeholder="Enter subtitle">
            </div>
            <div class="content-field">
                <label class="field-label">
                    <i class="fas fa-align-left"></i> Subtitle (Tamil)
                </label>
                <input type="text" class="field-input tamil-text" name="subtitle_ta" value="${subtitleTa}" placeholder="துணைத்தலைப்பு உள்ளிடவும்">
            </div>
            <div class="content-field">
                <label class="field-label">
                    <i class="fas fa-mouse-pointer"></i> Button Text (English)
                </label>
                <input type="text" class="field-input" name="buttonText_en" value="${buttonTextEn}" placeholder="Enter button text">
            </div>
            <div class="content-field">
                <label class="field-label">
                    <i class="fas fa-mouse-pointer"></i> Button Text (Tamil)
                </label>
                <input type="text" class="field-input tamil-text" name="buttonText_ta" value="${buttonTextTa}" placeholder="பொத்தான் உரை உள்ளிடவும்">
            </div>
            <div class="content-field">
                <label class="field-label">
                    <i class="fas fa-link"></i> Button URL
                </label>
                <input type="url" class="field-input" name="buttonUrl" value="${buttonUrl}" placeholder="Enter button URL">
            </div>
            <div class="content-field" style="grid-column: 1 / -1;">
                <label class="field-label">
                    <i class="fas fa-image"></i> Hero Image
                </label>
                <div class="field-image">
                    <div class="image-preview" onclick="contentEditor.selectImage(this, 'hero-image')">
                        ${mainImage ? `<img src="${mainImage}" alt="Hero Image">` : "<div class=\"image-upload-text\"><i class=\"fas fa-upload\"></i><br>Click to upload image</div>"}
                    </div>
                    <input type="hidden" name="heroImage" value="${mainImage}">
                </div>
            </div>
        `;
    }

    generateTextFields(section) {
        // Use the actual database field structure with proper escaping
        const titleEn = this.escapeHtml(section.title?.en || section.title || "");
        const titleTa = this.escapeHtml(section.title?.ta || section.titleTamil || "");
        const contentEn = this.escapeHtml(section.content?.en || section.content || "");
        const contentTa = this.escapeHtml(section.content?.ta || section.contentTamil || "");

        return `
            <div class="content-field">
                <label class="field-label">
                    <i class="fas fa-heading"></i> Title (English)
                </label>
                <input type="text" class="field-input" name="title_en" value="${titleEn}" placeholder="Enter title">
            </div>
            <div class="content-field">
                <label class="field-label">
                    <i class="fas fa-heading"></i> Title (Tamil)
                </label>
                <input type="text" class="field-input tamil-text" name="title_ta" value="${titleTa}" placeholder="தலைப்பு உள்ளிடவும்">
            </div>
            <div class="content-field" style="grid-column: 1 / -1;">
                <label class="field-label">
                    <i class="fas fa-align-left"></i> Content (English)
                </label>
                <textarea class="field-input field-textarea wysiwyg-editor" name="content_en" placeholder="Enter content">${contentEn}</textarea>
            </div>
            <div class="content-field" style="grid-column: 1 / -1;">
                <label class="field-label">
                    <i class="fas fa-align-left"></i> Content (Tamil)
                </label>
                <textarea class="field-input field-textarea wysiwyg-editor tamil-text" name="content_ta" placeholder="உள்ளடக்கம் உள்ளிடவும்">${contentTa}</textarea>
            </div>
        `;
    }

    generateImageFields(section) {
        // Use the actual database field structure with proper escaping
        const titleEn = this.escapeHtml(section.title?.en || section.title || "");
        const titleTa = this.escapeHtml(section.title?.ta || section.titleTamil || "");
        const contentEn = this.escapeHtml(section.content?.en || section.content || "");
        const contentTa = this.escapeHtml(section.content?.ta || section.contentTamil || "");
        const images = section.images || [];
        const mainImage = images.length > 0 ? images[0].url : section.image || "";

        return `
            <div class="content-field">
                <label class="field-label">
                    <i class="fas fa-heading"></i> Title (English)
                </label>
                <input type="text" class="field-input" name="title_en" value="${titleEn}" placeholder="Enter title">
            </div>
            <div class="content-field">
                <label class="field-label">
                    <i class="fas fa-heading"></i> Title (Tamil)
                </label>
                <input type="text" class="field-input tamil-text" name="title_ta" value="${titleTa}" placeholder="தலைப்பு உள்ளிடவும்">
            </div>
            <div class="content-field" style="grid-column: 1 / -1;">
                <label class="field-label">
                    <i class="fas fa-align-left"></i> Description (English)
                </label>
                <textarea class="field-input field-textarea wysiwyg-editor" name="content_en" placeholder="Enter description">${contentEn}</textarea>
            </div>
            <div class="content-field" style="grid-column: 1 / -1;">
                <label class="field-label">
                    <i class="fas fa-align-left"></i> Description (Tamil)
                </label>
                <textarea class="field-input field-textarea wysiwyg-editor tamil-text" name="content_ta" placeholder="விளக்கம் உள்ளிடவும்">${contentTa}</textarea>
            </div>
            <div class="content-field" style="grid-column: 1 / -1;">
                <label class="field-label">
                    <i class="fas fa-image"></i> Image
                </label>
                <div class="field-image">
                    <div class="image-upload-container" 
                         ondrop="contentEditor.handleImageDrop(event, '${section.key}')"
                         ondragover="contentEditor.handleDragOver(event)"
                         ondragenter="contentEditor.handleDragEnter(event)"
                         ondragleave="contentEditor.handleDragLeave(event)"
                         onclick="contentEditor.selectImage(this, 'main-image')"
                         style="border: 2px dashed var(--border-secondary); padding: 20px; text-align: center; cursor: pointer; border-radius: 8px; background: var(--glass-bg); transition: all 0.3s ease; min-height: 120px; display: flex; align-items: center; justify-content: center;">
                        ${mainImage ? `<img src="${mainImage}" alt="Main Image" style="max-width: 100%; max-height: 200px; border-radius: 4px;">` : "<div class=\"image-upload-text\"><i class=\"fas fa-cloud-upload-alt\" style=\"font-size: 2em; color: var(--text-tertiary); margin-bottom: 10px;\"></i><br>Drag & drop an image here or click to browse<br><small style=\"color: var(--text-secondary);\">Supported: JPG, PNG, GIF, WebP (Max: 5MB)</small></div>"}
                    </div>
                    <input type="hidden" name="mainImage" value="${mainImage}">
                    <input type="file" id="file-input-${section.key}" accept="image/*" style="display: none;" onchange="contentEditor.handleFileSelect(event, '${section.key}')">
                </div>
            </div>
        `;
    }

    generateNavigationFields(section) {
        // Use the actual database field structure with proper escaping
        const titleEn = this.escapeHtml(section.title?.en || section.title || "");
        const titleTa = this.escapeHtml(section.title?.ta || section.titleTamil || "");
        const contentEn = this.escapeHtml(section.content?.en || section.content || "");
        const contentTa = this.escapeHtml(section.content?.ta || section.contentTamil || "");

        return `
            <div class="content-field">
                <label class="field-label">
                    <i class="fas fa-heading"></i> Navigation Title (English)
                </label>
                <input type="text" class="field-input" name="title_en" value="${titleEn}" placeholder="Enter navigation title">
            </div>
            <div class="content-field">
                <label class="field-label">
                    <i class="fas fa-heading"></i> Navigation Title (Tamil)
                </label>
                <input type="text" class="field-input tamil-text" name="title_ta" value="${titleTa}" placeholder="வழிசெலுத்தல் தலைப்பு உள்ளிடவும்">
            </div>
            <div class="content-field" style="grid-column: 1 / -1;">
                <label class="field-label">
                    <i class="fas fa-bars"></i> Menu Items (English) - Separate with |
                </label>
                <textarea class="field-input field-textarea" name="content_en" placeholder="Home|About|Books|Projects|E-books|Contact">${contentEn}</textarea>
            </div>
            <div class="content-field" style="grid-column: 1 / -1;">
                <label class="field-label">
                    <i class="fas fa-bars"></i> Menu Items (Tamil) - Separate with |
                </label>
                <textarea class="field-input field-textarea tamil-text" name="content_ta" placeholder="முகப்பு|பற்றி|புத்தகங்கள்|திட்டங்கள்|மின்-புத்தகங்கள்|தொடர்பு|நன்கொடை">${contentTa}</textarea>
            </div>
        `;
    }

    generateDefaultFields(section) {
        // Use the actual database field structure with proper escaping
        const titleEn = this.escapeHtml(section.title?.en || section.title || "");
        const titleTa = this.escapeHtml(section.title?.ta || section.titleTamil || "");
        const contentEn = this.escapeHtml(section.content?.en || section.content || "");
        const contentTa = this.escapeHtml(section.content?.ta || section.contentTamil || "");

        return `
            <div class="content-field">
                <label class="field-label">
                    <i class="fas fa-heading"></i> Title (English)
                </label>
                <input type="text" class="field-input" name="title_en" value="${titleEn}" placeholder="Enter title">
            </div>
            <div class="content-field">
                <label class="field-label">
                    <i class="fas fa-heading"></i> Title (Tamil)
                </label>
                <input type="text" class="field-input tamil-text" name="title_ta" value="${titleTa}" placeholder="தலைப்பு உள்ளிடவும்">
            </div>
            <div class="content-field" style="grid-column: 1 / -1;">
                <label class="field-label">
                    <i class="fas fa-align-left"></i> Content (English)
                </label>
                <textarea class="field-input field-textarea wysiwyg-editor" name="content_en" placeholder="Enter content">${contentEn}</textarea>
            </div>
            <div class="content-field" style="grid-column: 1 / -1;">
                <label class="field-label">
                    <i class="fas fa-align-left"></i> Content (Tamil)
                </label>
                <textarea class="field-input field-textarea wysiwyg-editor tamil-text" name="content_ta" placeholder="உள்ளடக்கம் உள்ளிடவும்">${contentTa}</textarea>
            </div>
        `;

        // Add contact fields for footer sections
        if (section.type === "footer") {
            fields += `
                <div class="content-field">
                    <label class="field-label">
                        <i class="fas fa-phone"></i> Phone
                    </label>
                    <input type="tel" class="field-input" name="phone" value="${section.metadata?.phone || ""}" placeholder="Enter phone">
                </div>
                <div class="content-field" style="grid-column: 1 / -1;">
                    <label class="field-label">
                        <i class="fas fa-map-marker-alt"></i> Address (English)
                    </label>
                    <textarea class="field-input field-textarea wysiwyg-editor" name="address" placeholder="Enter address">${section.metadata?.address || ""}</textarea>
                </div>
                <div class="content-field" style="grid-column: 1 / -1;">
                    <label class="field-label">
                        <i class="fas fa-map-marker-alt"></i> Address (Tamil)
                    </label>
                    <textarea class="field-input field-textarea wysiwyg-editor tamil-text" name="address_tamil" placeholder="முகவரி உள்ளிடவும்">${section.metadata?.address_tamil || ""}</textarea>
                </div>
            `;
        }

        if (section.type === "navigation") {
            fields += `
                <div class="content-field">
                    <label class="field-label">
                        <i class="fas fa-image"></i> Logo
                    </label>
                    <div class="field-image">
                        <div class="image-preview" onclick="contentEditor.selectImage(this, 'logo')">
                            ${section.metadata?.logo ? `<img src="${section.metadata.logo}" alt="Logo">` : "<div class=\"image-upload-text\"><i class=\"fas fa-upload\"></i><br>Click to upload logo</div>"}
                        </div>
                        <input type="hidden" name="logo" value="${section.metadata?.logo || ""}">
                    </div>
                </div>
                <div class="content-field" style="grid-column: 1 / -1;">
                    <label class="field-label">
                        <i class="fas fa-bars"></i> Navigation Items (JSON)
                    </label>
                    <textarea class="field-input field-textarea" name="navItems" placeholder='[{"text": "Home", "url": "/", "text_tamil": "முகப்பு"}]'>${JSON.stringify(section.metadata?.navItems || [], null, 2)}</textarea>
                    <small style="color: var(--text-tertiary); margin-top: 0.5rem; display: block;">Enter navigation items as JSON array</small>
                </div>
            `;
        } else {
            // Default content fields for other section types
            fields += `
                <div class="content-field" style="grid-column: 1 / -1;">
                    <label class="field-label">
                        <i class="fas fa-align-left"></i> Content (English)
                    </label>
                    <textarea class="field-input field-textarea wysiwyg-editor" name="content" placeholder="Enter content">${section.content?.english || ""}</textarea>
                </div>
                <div class="content-field" style="grid-column: 1 / -1;">
                    <label class="field-label">
                        <i class="fas fa-align-left"></i> Content (Tamil)
                    </label>
                    <textarea class="field-input field-textarea wysiwyg-editor tamil-text" name="content_tamil" placeholder="உள்ளடக்கம் உள்ளிடவும்">${section.content?.tamil?.content || ""}</textarea>
                </div>
            `;
        }

        // Common settings
        fields += `
            <div class="content-field">
                <label class="field-label">
                    <i class="fas fa-sort-numeric-up"></i> Display Order
                </label>
                <input type="number" class="field-input" name="order" value="${section.order || 1}" min="1">
            </div>
            <div class="content-field">
                <label class="field-label">
                    <i class="fas fa-toggle-on"></i> Status
                </label>
                <select class="field-input" name="isActive">
                    <option value="true" ${section.isActive ? "selected" : ""}>Active</option>
                    <option value="false" ${!section.isActive ? "selected" : ""}>Inactive</option>
                </select>
            </div>
        `;

        return fields;
    }

    // Image upload functionality
    selectImage(previewElement, fieldName) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => this.handleImageUpload(e, previewElement, fieldName);
        input.click();
    }

    async handleImageUpload(event, previewElement, fieldName) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification("Image size must be less than 5MB", "error");
            return;
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            showNotification("Please select a valid image file", "error");
            return;
        }

        try {
            if (typeof showLoading === "function") {
            showLoading();
        } else {
            this.showLoading(true);
        }
            
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", fieldName);

            const response = await fetch("/api/upload", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                const imageUrl = result.url || result.path;
                
                // Update preview
                previewElement.innerHTML = `<img src="${imageUrl}" alt="Uploaded image">`;
                
                // Update hidden input
                const hiddenInput = previewElement.parentElement.querySelector("input[type=\"hidden\"]");
                if (hiddenInput) {
                    hiddenInput.value = imageUrl;
                }

                // Mark as unsaved
                this.markUnsavedChanges();
                
                showNotification("Image uploaded successfully", "success");
            } else {
                throw new Error("Upload failed");
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            showNotification("Error uploading image", "error");
        } finally {
            if (typeof hideLoading === "function") {
            hideLoading();
        } else {
            this.showLoading(false);
        }
        }
    }

    // Logo upload functionality
    async uploadLogo() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => this.handleLogoUpload(e);
        input.click();
    }

    async handleLogoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file size (max 2MB for logos)
        if (file.size > 2 * 1024 * 1024) {
            showNotification("Logo size must be less than 2MB", "error");
            return;
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            showNotification("Please select a valid image file", "error");
            return;
        }

        try {
            if (typeof showLoading === "function") showLoading();
            
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", "logo");

            const response = await fetch("/api/upload", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                const logoUrl = result.url || result.path;
                
                // Update logo in navigation section
                await this.updateLogoInNavigation(logoUrl);
                
                showNotification("Logo uploaded successfully", "success");
            } else {
                throw new Error("Logo upload failed");
            }
        } catch (error) {
            console.error("Error uploading logo:", error);
            showNotification("Error uploading logo", "error");
        } finally {
            if (typeof hideLoading === "function") hideLoading();
        }
    }

    async updateLogoInNavigation(logoUrl) {
        try {
            // Find or create navigation section in global page
            const response = await fetch("/api/website-content/sections/global", {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            let navigationSection;
            if (response.ok) {
                const sections = await response.json();
                navigationSection = sections.find(s => s.section === "navigation");
            }

            if (!navigationSection) {
                // Create new navigation section
                navigationSection = {
                    page: "global",
                    section: "navigation",
                    type: "navigation",
                    title: "Site Navigation",
                    metadata: {
                        logo: logoUrl,
                        navItems: []
                    },
                    isActive: true,
                    order: 1
                };

                const createResponse = await fetch("/api/content/pages/global/sections", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify(navigationSection)
                });

                if (!createResponse.ok) {
                    throw new Error("Failed to create navigation section");
                }
            } else {
                // Update existing navigation section
                navigationSection.metadata = navigationSection.metadata || {};
                navigationSection.metadata.logo = logoUrl;

                const updateResponse = await fetch(`/api/website-content/sections/global/${navigationSection._id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify(navigationSection)
                });

                if (!updateResponse.ok) {
                    throw new Error("Failed to update navigation section");
                }
            }

            // Refresh the global page if it's currently active
            if (this.currentPage === "global") {
                this.loadPageContent("global");
            }
        } catch (error) {
            console.error("Error updating navigation with logo:", error);
            showNotification("Error updating navigation with logo", "error");
        }
    }

    // Section management functions
    async savePageContent(page, isAutoSave = false) {
        // Prevent concurrent saves - queue the operation if busy
        if (this.isSaving) {
            if (!isAutoSave) {
                showNotification("Save in progress, queuing your request...", "info");
                this.queueSaveOperation({ type: "page", page: page, isAutoSave: isAutoSave });
            } else {
                console.log("[AUTO-SAVE] Save in progress, skipping auto-save");
            }
            return;
        }
        
        this.isSaving = true;
        this.lastSaveTime = Date.now();
        try {
            if (typeof showLoading === "function") showLoading();
            const sections = this.collectPageSections(page);
            
            console.log(`[SAVE] Attempting to save content for page: ${page}`);
            console.log(`[SAVE] Collected ${sections.length} sections:`, sections);
            
            // For simple content, we'll save the main section content
            if (sections.length === 0) {
                showNotification("No content to save", "warning");
                return;
            }
            
            const mainSection = sections.find(s => s.section === "main") || sections[0];
            const sectionName = mainSection.section || "main";
            const contentData = {
                page: page,
                section: sectionName,
                sectionKey: mainSection.sectionKey || sectionName,
                title: mainSection.title || `${page.charAt(0).toUpperCase() + page.slice(1)} Page`,
                content: mainSection.content || "",
                sectionType: mainSection.sectionType || "text",
                isVisible: mainSection.isVisible !== undefined ? mainSection.isVisible : true,
                position: mainSection.position || 0
            };
            
            console.log("[SAVE] Payload being sent:", contentData);
            
            // Get auth token with fallback
            const token = this.getAuthToken();
            if (!token) {
                throw new Error("Authentication token not found. Please log in again.");
            }
            
            // No need to check for existing content - bulk update API handles this
            
            // Use the content API for creating/updating content
            const method = "POST";
            const url = `/api/content/pages/${page}/sections`;
            
            console.log(`[SAVE] Using ${method} method for content save`);
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(contentData)
            });
            
            console.log("[SAVE] Response status:", response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log("[SAVE] Success response:", result);
                
                if (!isAutoSave) {
                    showNotification("Page content saved successfully", "success");
                } else {
                    console.log("[AUTO-SAVE] Content auto-saved successfully");
                }
                
                this.unsavedChanges = false;
                
                // Trigger real-time content update on public website
                this.notifyPublicWebsiteUpdate(page);
                
                // Clear debounce timeout since we just saved
                if (this.saveDebounceTimeout) {
                    clearTimeout(this.saveDebounceTimeout);
                    this.saveDebounceTimeout = null;
                }
                
                // Remove unsaved changes indicator
                document.querySelectorAll(".editor-actions .btn-primary").forEach(btn => {
                    btn.classList.remove("unsaved");
                    btn.innerHTML = "<i class=\"fas fa-save\"></i> Save Changes";
                });
                // Remove unsaved indicators from all sections
                document.querySelectorAll(".save-section-btn").forEach(btn => {
                    btn.classList.remove("unsaved");
                    btn.innerHTML = "<i class=\"fas fa-save\"></i> Save";
                });
            } else {
                const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
                console.error("[SAVE] Error response:", errorData);
                throw new Error(errorData.message || `HTTP ${response.status}: Failed to save content`);
            }
        } catch (error) {
            console.error("[SAVE] Error saving page content:", error);
            if (!isAutoSave) {
                showNotification(`Error saving page content: ${error.message}`, "error");
            }
        } finally {
            this.isSaving = false; // Always reset saving state
            if (typeof hideLoading === "function") hideLoading();
        }
    }

    collectPageSections(page) {
        const container = document.getElementById(`${page}-sections-container`);
        if (!container) {
            console.warn(`Container not found for collectPageSections: ${page}-sections-container`);
            return [];
        }
        
        const sectionElements = container.querySelectorAll(".section-editor");
        const sections = [];

        sectionElements.forEach(element => {
            const sectionData = this.collectSectionData(element);
            sections.push(sectionData);
        });

        return sections;
    }

    async deleteSection(sectionId) {
        if (!confirm("Are you sure you want to delete this section?")) {
            return;
        }

        try {
            const response = await fetch(`/api/website-content/sections/${this.getCurrentPage()}/${sectionId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (response.ok) {
                const sectionElement = document.querySelector(`[data-section-id="${sectionId}"]`);
                if (sectionElement) {
                    sectionElement.remove();
                }
                showNotification("Section deleted successfully", "success");
            } else {
                throw new Error("Failed to delete section");
            }
        } catch (error) {
            console.error("Error deleting section:", error);
            showNotification("Error deleting section", "error");
        }
    }

    async saveSection(sectionElement) {
        // Prevent concurrent section saves - queue the operation if busy
        if (sectionElement.dataset.saving === "true") {
            showNotification("Section save in progress, queuing your request...", "info");
            this.queueSaveOperation({ type: "section", sectionElement: sectionElement });
            return;
        }
        
        sectionElement.dataset.saving = "true";
        
        try {
            if (typeof showLoading === "function") showLoading();
            
            const sectionId = sectionElement.dataset.sectionId;
            const sectionData = this.collectSectionData(sectionElement);
            
            console.log("[SAVE SECTION] Attempting to save section:", sectionId);
            console.log("[SAVE SECTION] Section data:", sectionData);
            
            // Get auth token with fallback
            const token = this.getAuthToken();
            if (!token) {
                throw new Error("Authentication token not found. Please log in again.");
            }
            
            const response = await fetch(`/api/website-content/sections/${this.getCurrentPage()}/${sectionId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(sectionData)
            });
            
            console.log("[SAVE SECTION] Response status:", response.status);

            if (response.ok) {
                const result = await response.json();
                console.log("[SAVE SECTION] Success response:", result);
                showNotification("Section saved successfully", "success");
                
                // Trigger real-time content update on public website
                this.notifyPublicWebsiteUpdate(this.currentPage || 'home');
                
                // Remove unsaved indicator from this section
                const saveBtn = sectionElement.querySelector(".save-section-btn");
                if (saveBtn) {
                    saveBtn.classList.remove("unsaved");
                    saveBtn.innerHTML = "<i class=\"fas fa-save\"></i> Save";
                }
                
                // Check if all sections are saved to clear page-level unsaved indicator
                const hasUnsavedSections = document.querySelector(".save-section-btn.unsaved");
                if (!hasUnsavedSections) {
                    this.unsavedChanges = false;
                    document.querySelectorAll(".editor-actions .btn-primary").forEach(btn => {
                        if (!btn.classList.contains("save-section-btn")) {
                            btn.classList.remove("unsaved");
                            btn.innerHTML = "<i class=\"fas fa-save\"></i> Save Changes";
                        }
                    });
                }
            } else {
                const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
                console.error("[SAVE SECTION] Error response:", errorData);
                throw new Error(errorData.message || `HTTP ${response.status}: Failed to save section`);
            }
        } catch (error) {
            console.error("[SAVE SECTION] Error saving section:", error);
            showNotification(`Error saving section: ${error.message}`, "error");
        } finally {
            sectionElement.dataset.saving = "false"; // Always reset section saving state
            if (typeof hideLoading === "function") hideLoading();
        }
    }

    collectSectionData(sectionElement) {
        const sectionId = sectionElement.dataset.sectionId;
        const inputs = sectionElement.querySelectorAll("input, textarea, select");
        
        // Get section info from element attributes or defaults
        const sectionType = sectionElement.dataset.sectionType || "text";
        const sectionName = sectionElement.dataset.section || "main";
        
        const sectionData = { 
            _id: sectionId,
            page: this.currentPage || "home",
            section: sectionName,
            sectionKey: sectionElement.dataset.sectionKey || sectionName,
            sectionType: sectionType
        };
        
        inputs.forEach(input => {
            if (!input.name) return;
            
            const value = input.value;
            const name = input.name;
            
            // Handle different field types
            switch (name) {
                case "title":
                case "title_en":
                    sectionData.title = value;
                    break;
                case "title_tamil":
                case "title_ta":
                    sectionData.titleTamil = value;
                    break;
                case "subtitle":
                case "subtitle_en":
                    sectionData.subtitle = value;
                    break;
                case "subtitle_tamil":
                case "subtitle_ta":
                    sectionData.subtitleTamil = value;
                    break;
                case "content":
                case "content_en":
                    sectionData.content = value;
                    break;
                case "content_tamil":
                case "content_ta":
                    sectionData.contentTamil = value;
                    break;
                case "button_text":
                case "button_text_en":
                    sectionData.buttonText = value;
                    break;
                case "button_text_tamil":
                case "button_text_ta":
                    sectionData.buttonTextTamil = value;
                    break;
                case "button_url":
                    sectionData.buttonUrl = value;
                    break;
                case "image":
                case "main_image":
                    sectionData.image = value;
                    break;
                case "background_image":
                case "logo":
                    if (!sectionData.metadata) sectionData.metadata = {};
                    sectionData.metadata[name] = value;
                    break;
                case "navItems":
                    try {
                        if (!sectionData.metadata) sectionData.metadata = {};
                        sectionData.metadata.navItems = JSON.parse(value || "[]");
                    } catch (e) {
                        if (!sectionData.metadata) sectionData.metadata = {};
                        sectionData.metadata.navItems = [];
                    }
                    break;
                case "order":
                case "position":
                    sectionData.position = parseInt(value) || 1;
                    break;
                case "isActive":
                    sectionData.isActive = value === "true";
                    break;
                case "isVisible":
                    sectionData.isVisible = value === "true";
                    break;
                case "phone":
                case "email":
                case "address":
                case "phone_tamil":
                case "email_tamil":
                case "address_tamil":
                    if (!sectionData.metadata) sectionData.metadata = {};
                    sectionData.metadata[name] = value;
                    break;
                default:
                    // Store other fields in metadata
                    if (!sectionData.metadata) sectionData.metadata = {};
                    sectionData.metadata[name] = value;
                    break;
            }
        });

        return sectionData;
    }

    getSectionIcon(type) {
        const icons = {
            "hero": "star",
            "text": "align-left",
            "image": "image",
            "navigation": "bars",
            "footer": "grip-horizontal",
            "contact": "envelope",
            "gallery": "images",
            "testimonial": "quote-left",
            "feature": "check-circle",
            "cta": "bullhorn",
            "about": "user",
            "service": "cogs"
        };
        return icons[type] || "square";
    }

    async duplicateSection(sectionId) {
        try {
            const response = await fetch(`/api/website-content/sections/${this.getCurrentPage()}/${sectionId}/duplicate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (response.ok) {
                const newSection = await response.json();
                this.loadPageContent(this.currentPage);
                showNotification("Section duplicated successfully", "success");
            } else {
                throw new Error("Failed to duplicate section");
            }
        } catch (error) {
            console.error("Error duplicating section:", error);
            showNotification("Error duplicating section", "error");
        }
    }

    moveSection(sectionId, direction) {
        const element = document.querySelector(`[data-section-id="${sectionId}"]`);
        if (!element || !element.parentNode) return;
        
        const container = element.parentNode;
        
        if (direction === "up" && element.previousElementSibling) {
            container.insertBefore(element, element.previousElementSibling);
        } else if (direction === "down" && element.nextElementSibling) {
            container.insertBefore(element.nextElementSibling, element);
        }
        
        this.markUnsavedChanges();
    }

    selectImage(element, fieldName) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.uploadImage(file, element, fieldName);
            }
        };
        input.click();
    }

    async uploadImage(file, previewElement, fieldName) {
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/upload", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                if (previewElement) {
                    previewElement.innerHTML = `<img src="${result.url}" alt="Uploaded image">`;
                    const hiddenInput = previewElement.parentNode?.querySelector(`input[name="${fieldName}"]`);
                    if (hiddenInput) {
                        hiddenInput.value = result.url;
                    }
                }
                this.markUnsavedChanges();
                showNotification("Image uploaded successfully", "success");
            } else {
                throw new Error("Failed to upload image");
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            showNotification("Error uploading image", "error");
        }
    }

    markUnsavedChanges(sectionElement = null) {
        this.unsavedChanges = true;
        
        // Debounce auto-save to prevent conflicts
        if (this.saveDebounceTimeout) {
            clearTimeout(this.saveDebounceTimeout);
        }
        this.saveDebounceTimeout = setTimeout(() => {
            if (this.unsavedChanges) {
                if (!this.isSaving) {
                    console.log("[AUTO-SAVE] Debounced auto-save triggered");
                    this.autoSave();
                } else {
                    // Queue auto-save if currently saving
                    console.log("[AUTO-SAVE] Queuing auto-save due to concurrent operation");
                    this.queueSaveOperation({ type: "page", page: this.currentPage, isAutoSave: true });
                }
            }
        }, 5000); // Auto-save 5 seconds after last change
        
        if (sectionElement) {
            // Mark specific section as having unsaved changes
            const saveBtn = sectionElement.querySelector(".save-section-btn");
            if (saveBtn && !saveBtn.classList.contains("unsaved")) {
                saveBtn.classList.add("unsaved");
                saveBtn.innerHTML = "<i class=\"fas fa-save\"></i> Save *";
            }
        }
        
        // Visual indicator for page-level unsaved changes
        document.querySelectorAll(".editor-actions .btn-primary").forEach(btn => {
            if (!btn.classList.contains("unsaved") && !btn.classList.contains("save-section-btn")) {
                btn.classList.add("unsaved");
                btn.innerHTML = "<i class=\"fas fa-save\"></i> Save Changes *";
            }
        });
    }

    async autoSave() {
        // Prevent concurrent auto-saves
        if (this.isSaving) {
            console.log("[AUTO-SAVE] Save already in progress, skipping auto-save");
            return;
        }
        
        // Check if enough time has passed since last save
        const timeSinceLastSave = Date.now() - this.lastSaveTime;
        if (timeSinceLastSave < 10000) { // Minimum 10 seconds between saves
            console.log("[AUTO-SAVE] Too soon since last save, skipping");
            return;
        }
        
        try {
            console.log("[AUTO-SAVE] Starting auto-save...");
            await this.savePageContent(this.currentPage, true); // Pass auto-save flag
            console.log("[AUTO-SAVE] Auto-saved successfully");
        } catch (error) {
            console.error("[AUTO-SAVE] Auto-save failed:", error);
            // Don't show error notification for auto-save failures
        }
    }

    async processSaveQueue() {
        if (this.processingQueue || this.saveQueue.length === 0 || this.isSaving) {
            return;
        }
        
        this.processingQueue = true;
        
        try {
            while (this.saveQueue.length > 0 && !this.isSaving) {
                const saveOperation = this.saveQueue.shift();
                console.log("[SAVE QUEUE] Processing queued save operation:", saveOperation.type);
                
                try {
                    if (saveOperation.type === "page") {
                        await this.savePageContent(saveOperation.page, saveOperation.isAutoSave);
                    } else if (saveOperation.type === "section") {
                        await this.saveSection(saveOperation.sectionElement);
                    }
                    
                    console.log("[SAVE QUEUE] Successfully processed queued operation");
                } catch (error) {
                    console.error("[SAVE QUEUE] Error processing queued operation:", error);
                    // Continue processing other items in queue
                }
                
                // Small delay between operations to prevent overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } finally {
            this.processingQueue = false;
        }
    }
    
    queueSaveOperation(operation) {
        // Prevent duplicate operations in queue
        const existingIndex = this.saveQueue.findIndex(op => 
            op.type === operation.type && 
            (op.page === operation.page || op.sectionElement === operation.sectionElement)
        );
        
        if (existingIndex !== -1) {
            // Replace existing operation with newer one
            this.saveQueue[existingIndex] = operation;
            console.log("[SAVE QUEUE] Updated existing queued operation");
        } else {
            this.saveQueue.push(operation);
            console.log("[SAVE QUEUE] Added new operation to queue, queue length:", this.saveQueue.length);
        }
    }

    /**
     * Notify public website of content updates for real-time reflection
     */
    notifyPublicWebsiteUpdate(page) {
        try {
            // Broadcast message to all open tabs/windows of the public website
            if (typeof BroadcastChannel !== 'undefined') {
                const channel = new BroadcastChannel('content-updates');
                channel.postMessage({
                    type: 'content-updated',
                    page: page,
                    timestamp: new Date().toISOString()
                });
                console.log(`[REAL-TIME] Broadcasted content update for page: ${page}`);
            }
            
            // Also store in localStorage as fallback for older browsers
            const updateEvent = {
                type: 'content-updated',
                page: page,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('latest-content-update', JSON.stringify(updateEvent));
            
            // Trigger storage event for cross-tab communication
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'latest-content-update',
                newValue: JSON.stringify(updateEvent)
            }));
            
            console.log(`[REAL-TIME] Content update notification sent for page: ${page}`);
        } catch (error) {
            console.error('[REAL-TIME] Error notifying public website:', error);
        }
    }

    resetPageContent(page) {
        if (confirm("Are you sure you want to reset all changes? This will reload the original content.")) {
            this.loadPageContent(page);
            this.unsavedChanges = false;
        }
    }

    async refreshPageContent(page) {
        try {
            console.log(`[REFRESH] Refreshing content for page: ${page}`);
            showNotification('Refreshing content...', 'info');
            
            // Show loading state
            this.showLoading(true);
            
            // Reload the page content from the server
            await this.loadPageContent(page);
            
            // Clear any unsaved changes flag
            this.unsavedChanges = false;
            
            showNotification('Content refreshed successfully', 'success');
            console.log(`[REFRESH] Content refresh completed for page: ${page}`);
        } catch (error) {
            console.error('[REFRESH] Error refreshing content:', error);
            showNotification('Error refreshing content: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showSectionCreator(page = null) {
        const modal = document.getElementById("sectionCreatorModal");
        if (modal) {
            // Use proper modal management to avoid aria-hidden issues
            modal.style.display = "flex";
            modal.setAttribute("aria-hidden", "false");
            modal.setAttribute("role", "dialog");
            modal.setAttribute("aria-modal", "true");
            
            // Reset form
            const form = modal.querySelector("form");
            if (form) {
                form.reset();
                
                // Clear section type selection
                document.querySelectorAll(".section-type-card").forEach(c => {
                    if (c && c.classList) {
                        c.classList.remove("selected");
                    }
                });
                
                // Clear selected section type input
                const selectedTypeInput = document.getElementById("selectedSectionType");
                if (selectedTypeInput) {
                    selectedTypeInput.value = "";
                }
                
                // Pre-select page if provided
                if (page) {
                    const pageSelect = document.getElementById("sectionPage");
                    if (pageSelect) {
                        pageSelect.value = page;
                    }
                }
            }
            
            // Initialize enhanced section type cards
            this.initializeSectionTypeCards();
            
            // Proper focus management - focus the first non-hidden focusable element
            setTimeout(() => {
                const firstFocusable = modal.querySelector(
                    "button:not([aria-hidden=\"true\"]), [href]:not([aria-hidden=\"true\"]), input:not([aria-hidden=\"true\"]), select:not([aria-hidden=\"true\"]), textarea:not([aria-hidden=\"true\"]), [tabindex]:not([tabindex=\"-1\"]):not([aria-hidden=\"true\"])"
                );
                if (firstFocusable) {
                    firstFocusable.focus();
                }
            }, 100);
        }
    }

    // Initialize section type cards with enhanced interactions
    initializeSectionTypeCards() {
        const typeCards = document.querySelectorAll(".section-type-card");
        const selectedTypeInput = document.getElementById("selectedSectionType");
        
        typeCards.forEach(card => {
            // Remove existing listeners to prevent duplicates
            card.replaceWith(card.cloneNode(true));
        });
        
        // Re-query after cloning
        const newTypeCards = document.querySelectorAll(".section-type-card");
        
        newTypeCards.forEach(card => {
            card.addEventListener("click", () => {
                // Remove selection from other cards
                newTypeCards.forEach(c => c.classList.remove("selected"));
                
                // Select current card
                card.classList.add("selected");
                
                // Update hidden input
                const sectionType = card.dataset.type;
                if (selectedTypeInput) {
                    selectedTypeInput.value = sectionType;
                }
                
                // Show field preview for selected type
                this.showSectionFieldPreview(sectionType);
            });
        });
    }

    // Show field preview for selected section type
    showSectionFieldPreview(sectionType) {
        const sectionConfig = this.sectionTypes[sectionType];
        if (!sectionConfig) return;
        
        // Create or update field preview
        let previewContainer = document.getElementById("sectionFieldPreview");
        if (!previewContainer) {
            previewContainer = document.createElement("div");
            previewContainer.id = "sectionFieldPreview";
            previewContainer.style.cssText = `
                margin-top: 1.5rem;
                padding: 1.5rem;
                background: var(--glass-bg);
                border: 1px solid var(--border-secondary);
                border-radius: 0.75rem;
                backdrop-filter: blur(10px);
            `;
            
            const typeTab = document.getElementById("typeTab");
            if (typeTab) {
                typeTab.appendChild(previewContainer);
            }
        }
        
        previewContainer.innerHTML = `
            <h4 style="margin: 0 0 1rem 0; color: var(--text-primary); font-size: 1.1rem; font-weight: 600;">
                <i class="${sectionConfig.icon}" style="margin-right: 0.5rem; color: var(--primary-color);"></i>
                ${sectionConfig.name} Configuration
            </h4>
            <p style="margin: 0 0 1.5rem 0; color: var(--text-secondary); font-size: 0.9rem;">
                ${sectionConfig.description}
            </p>
            
            <div class="field-preview" style="margin-bottom: 1.5rem;">
                <h5 style="margin: 0 0 0.75rem 0; color: var(--text-primary); font-size: 1rem;">Available Fields:</h5>
                <div class="field-tags" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${sectionConfig.fields.map(field => `
                        <span class="field-tag" style="
                            padding: 0.25rem 0.75rem;
                            background: var(--bg-accent);
                            color: var(--text-primary);
                            border-radius: 1rem;
                            font-size: 0.8rem;
                            font-weight: 500;
                            border: 1px solid var(--border-secondary);
                        ">
                            ${this.formatFieldName(field)}
                        </span>
                    `).join("")}
                </div>
            </div>
            
            <div class="layout-preview">
                <h5 style="margin: 0 0 0.75rem 0; color: var(--text-primary); font-size: 1rem;">Layout Options:</h5>
                <div class="layout-tags" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${sectionConfig.layout.map(layout => `
                        <span class="layout-tag" style="
                            padding: 0.25rem 0.75rem;
                            background: var(--bg-tertiary);
                            color: var(--text-secondary);
                            border-radius: 1rem;
                            font-size: 0.8rem;
                            font-weight: 500;
                            border: 1px solid var(--border-tertiary);
                        ">
                            ${this.formatLayoutName(layout)}
                        </span>
                    `).join("")}
                </div>
            </div>
        `;
    }

    // Format field names for display
    formatFieldName(field) {
        const fieldMap = {
            "title": "📝 Title",
            "content": "📄 Content",
            "subtitle": "📝 Subtitle",
            "images": "🖼️ Images",
            "buttonText": "🔘 Button Text",
            "buttonUrl": "🔗 Button URL",
            "caption": "💬 Caption",
            "backgroundImage": "🖼️ Background",
            "backgroundColor": "🎨 Background Color",
            "textColor": "🎨 Text Color",
            "features": "⭐ Features",
            "icons": "🎯 Icons",
            "cardItems": "🃏 Card Items",
            "captions": "💬 Captions",
            "lightbox": "🔍 Lightbox",
            "formFields": "📝 Form Fields",
            "submitText": "✅ Submit Text",
            "testimonials": "💬 Testimonials",
            "authorImages": "👤 Author Images",
            "stats": "📊 Statistics",
            "animations": "✨ Animations",
            "members": "👥 Members",
            "photos": "📸 Photos",
            "socialLinks": "🔗 Social Links",
            "plans": "💰 Plans",
            "questions": "❓ Questions",
            "answers": "✅ Answers",
            "categories": "📂 Categories",
            "address": "📍 Address",
            "phone": "📞 Phone",
            "email": "📧 Email",
            "hours": "🕒 Hours",
            "map": "🗺️ Map",
            "logo": "🏷️ Logo",
            "menuItems": "📋 Menu Items",
            "ctaButton": "🔘 CTA Button"
        };
        
        return fieldMap[field] || field.charAt(0).toUpperCase() + field.slice(1);
    }

    // Format layout names for display
    formatLayoutName(layout) {
        const layoutMap = {
            "full-width": "📏 Full Width",
            "centered": "🎯 Centered",
            "two-column": "📊 Two Column",
            "left-align": "⬅️ Left Align",
            "right-align": "➡️ Right Align",
            "split-screen": "🔄 Split Screen",
            "floating": "☁️ Floating",
            "grid-2": "⚏ 2 Column Grid",
            "grid-3": "⚏ 3 Column Grid",
            "grid-4": "⚏ 4 Column Grid",
            "vertical-list": "📋 Vertical List",
            "masonry": "🧱 Masonry",
            "boxed": "📦 Boxed",
            "carousel": "🎠 Carousel",
            "single-column": "📄 Single Column",
            "inline": "➡️ Inline",
            "single": "1️⃣ Single",
            "horizontal": "↔️ Horizontal",
            "comparison": "⚖️ Comparison",
            "accordion": "📁 Accordion",
            "tabs": "📑 Tabs",
            "side-by-side": "↔️ Side by Side",
            "stacked": "📚 Stacked",
            "with-map": "🗺️ With Map",
            "vertical": "↕️ Vertical",
            "mega-menu": "📋 Mega Menu"
        };
        
        return layoutMap[layout] || layout.charAt(0).toUpperCase() + layout.slice(1).replace("-", " ");
    }

    hideSectionCreator() {
        const modal = document.getElementById("sectionCreatorModal");
        if (modal) {
            modal.style.display = "none";
            modal.setAttribute("aria-hidden", "true");
            modal.removeAttribute("aria-modal");
            
            // Clean up field preview
            const previewContainer = document.getElementById("sectionFieldPreview");
            if (previewContainer) {
                previewContainer.remove();
            }
            
            // Return focus to the element that opened the modal
            const createSectionBtn = document.getElementById("createSectionBtn");
            if (createSectionBtn) {
                createSectionBtn.focus();
            }
        }
    }

    async createSection() {
        const startTime = performance.now();
        const creationId = `section_${Date.now()}`;
        console.log(`[CREATE SECTION] Starting section creation - ID: ${creationId}`);
        
        try {
            // Validate form existence
            const form = document.getElementById("sectionCreatorForm");
            if (!form) {
                throw new Error("Section creator form not found. Please refresh the page and try again.");
            }
            
            console.log(`[CREATE SECTION] Form found, extracting data for ${creationId}`);
            
            const formData = new FormData(form);
            
            // Generate unique section key with validation
            const sectionName = formData.get("sectionName") || "new_section";
            const sectionType = formData.get("sectionType") || "text";
            const timestamp = Date.now();
            const sectionKey = `${sectionName.toLowerCase().replace(/\s+/g, "_")}_${timestamp}`;
            
            // Validate required fields
            if (!sectionName.trim()) {
                throw new Error("Section name is required");
            }
            
            if (!sectionType) {
                throw new Error("Section type is required");
            }
            
            console.log("[CREATE SECTION] Section details:", {
                name: sectionName,
                type: sectionType,
                key: sectionKey,
                page: this.currentPage,
                order: formData.get("displayOrder"),
                status: formData.get("status"),
                timestamp: new Date().toISOString()
            });
            
            const sectionData = {
                page: this.currentPage,
                section: sectionKey,
                sectionKey: `${this.currentPage}-${sectionKey}`,
                sectionType: sectionType,
                layout: "full-width",
                position: parseInt(formData.get("displayOrder")) || 1,
                title: {
                    en: sectionName,
                    ta: formData.get("titleTamil") || ""
                },
                content: {
                    en: formData.get("description") || "Enter your content here...",
                    ta: formData.get("contentTamil") || ""
                },
                subtitle: {
                    en: formData.get("subtitle") || "",
                    ta: formData.get("subtitleTamil") || ""
                },
                buttonText: {
                    en: formData.get("buttonText") || "",
                    ta: formData.get("buttonTextTamil") || ""
                },
                buttonUrl: formData.get("buttonUrl") || "",
                images: [],
                videos: [],
                stylePreset: "modern",
                isRequired: false,
                hasTamilTranslation: !!(formData.get("titleTamil") || formData.get("contentTamil")),
                order: parseInt(formData.get("displayOrder")) || 1,
                isActive: (formData.get("status") || "active") === "active",
                isVisible: true,
                version: 1,
                seoKeywords: {
                    en: [],
                    ta: []
                }
            };
            
            // Get and validate auth token
            const token = this.getAuthToken();
            if (!token) {
                throw new Error("Authentication token not found. Please log in again.");
            }
            
            console.log(`[CREATE SECTION] Authentication validated, making API request for ${creationId}`);
            
            // Show creation progress
            this.showNotification(`Creating ${sectionType} section...`, "info");
            
            // Enhanced fetch with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                console.error(`[CREATE SECTION] Request timeout for ${creationId}`);
            }, 30000); // 30 second timeout
            
            const response = await fetch(`/api/website-content/sections/${this.currentPage}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(sectionData),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log(`[CREATE SECTION] API response - Status: ${response.status}, OK: ${response.ok}`);

            if (response.ok) {
                const result = await response.json();
                console.log("[CREATE SECTION] Section created successfully:", {
                    resultId: result.id || result._id,
                    sectionKey,
                    sectionName,
                    sectionType,
                    page: this.currentPage,
                    timestamp: new Date().toISOString()
                });
                
                this.showNotification(`${sectionType} section created successfully!`, "success");
                this.hideSectionCreator();
                
                // Reload the content for the current page with error handling
                if (this.currentPage) {
                    try {
                        await this.loadPageContent(this.currentPage);
                        console.log(`[CREATE SECTION] Page content reloaded for ${this.currentPage}`);
                    } catch (reloadError) {
                        console.error("[CREATE SECTION] Failed to reload page content:", {
                            error: reloadError.message,
                            page: this.currentPage,
                            creationId
                        });
                        this.showNotification("Section created but failed to refresh page. Please refresh manually.", "warning");
                    }
                }
                
                // Log activity with error handling
                try {
                    await this.logActivity("create_section", `Created new ${sectionType} section: ${sectionData.sectionTitle}`);
                    console.log(`[CREATE SECTION] Activity logged for ${creationId}`);
                } catch (logError) {
                    console.error("[CREATE SECTION] Failed to log activity:", {
                        error: logError.message,
                        creationId,
                        timestamp: new Date().toISOString()
                    });
                    // Don't show error to user for logging failures
                }
                
                return result;
            } else {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (parseError) {
                    errorData = { message: await response.text() };
                }
                
                console.error("[CREATE SECTION] Section creation failed:", {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorData,
                    sectionName,
                    sectionType,
                    page: this.currentPage,
                    timestamp: new Date().toISOString()
                });
                
                // Handle specific error cases
                if (response.status === 400) {
                    throw new Error(errorData.message || "Invalid section data. Please check your inputs.");
                } else if (response.status === 401) {
                    throw new Error("Authentication expired. Please log in again.");
                } else if (response.status === 403) {
                    throw new Error("Access denied. You may not have permission to create sections.");
                } else if (response.status === 409) {
                    throw new Error("A section with this name already exists. Please choose a different name.");
                } else if (response.status >= 500) {
                    throw new Error("Server error occurred. Please try again later.");
                } else {
                    throw new Error(errorData.message || `Failed to create section: ${response.statusText}`);
                }
            }
        } catch (error) {
            const creationTime = performance.now() - startTime;
            console.error(`[CREATE SECTION] Error creating section ${creationId}:`, {
                error: error.message,
                stack: error.stack,
                currentPage: this.currentPage,
                creationTime: `${creationTime.toFixed(2)}ms`,
                timestamp: new Date().toISOString()
            });
            
            // Handle different error types with specific user feedback
            if (error.name === "AbortError") {
                this.showNotification("Section creation timed out. Please try again.", "error");
            } else if (error.message.includes("Authentication")) {
                this.showNotification("Authentication error. Please log in again.", "error");
            } else if (error.message.includes("NetworkError") || error.message.includes("Failed to fetch")) {
                this.showNotification("Network error. Please check your connection and try again.", "error");
            } else {
                // Use the more specific showNotification if available, fallback to global function
                const errorMessage = error.message || "Error creating section. Please try again.";
                if (typeof this.showNotification === "function") {
                    this.showNotification(errorMessage, "error");
                } else if (typeof showNotification === "function") {
                    showNotification(errorMessage, "error");
                } else {
                    alert(errorMessage);
                }
            }
            
            return null;
        } finally {
            const totalTime = performance.now() - startTime;
            console.log(`[CREATE SECTION] Section creation process completed for ${creationId} in ${totalTime.toFixed(2)}ms`);
        }
    }

    selectSectionType(card) {
        if (!card) return;
        
        // Remove previous selection
        document.querySelectorAll(".section-type-card").forEach(c => {
            if (c && c.classList) {
                c.classList.remove("selected");
            }
        });
        
        // Add selection to clicked card
        if (card.classList) {
            card.classList.add("selected");
        }
        
        // Update hidden input
        const type = card.dataset ? card.dataset.type : null;
        const hiddenInput = document.getElementById("selectedSectionType");
        if (hiddenInput && type) {
            hiddenInput.value = type;
        }
    }

    // Initialize section editors for a specific page with optimized event delegation
    initializeSectionEditors(page) {
        // Performance optimization: Use more efficient container lookup
        const containerIds = [`content-editor-${page}`, `${page}-sections-container`];
        let container = null;
        
        for (const id of containerIds) {
            container = document.getElementById(id);
            if (container) break;
        }
        
        if (!container) {
            console.warn(`Container not found for page: ${page}`);
            return;
        }

        // Performance optimization: Use single event delegation with action mapping
        const actionMap = {
            "duplicate-section": (sectionKey) => this.duplicateSection(sectionKey),
            "edit-section-settings": (sectionKey) => this.editSectionSettings(sectionKey),
            "delete-section": (sectionKey) => this.deleteSection(sectionKey),
            "save-section": (sectionKey) => this.saveSection(sectionKey),
            "preview-section": (sectionKey) => this.previewSection(this.currentPage, sectionKey)
        };

        // Single optimized click handler
        container.addEventListener("click", (e) => {
            const target = e.target;
            if (!target) return;
            
            const sectionElement = target.closest(".section-editor");
            const sectionKey = sectionElement?.dataset?.sectionKey;
            if (!sectionKey) return;

            // Find matching action class and execute
            for (const [className, handler] of Object.entries(actionMap)) {
                if (target.classList.contains(className)) {
                    handler(sectionKey);
                    break;
                }
            }
        }, { passive: true });

        // Optimized change handler with property mapping
        const propertyMap = {
            "isRequired": (sectionKey, checked) => this.updateSectionProperty(sectionKey, "isRequired", checked),
            "hasTamilTranslation": (sectionKey, checked) => this.updateSectionProperty(sectionKey, "hasTamilTranslation", checked)
        };

        container.addEventListener("change", (e) => {
            const sectionKey = e.target.closest(".section-editor")?.dataset.sectionKey;
            if (!sectionKey || !e.target.name) return;

            const handler = propertyMap[e.target.name];
            if (handler) {
                handler(sectionKey, e.target.checked);
            }
        }, { passive: true });
    }

    // Duplicate a section
    async duplicateSection(sectionKey) {
        const startTime = performance.now();
        console.log(`[DUPLICATE SECTION] Starting duplication process for section: ${sectionKey}, Page: ${this.currentPage}`);
        
        try {
            // Input validation
            if (!sectionKey) {
                console.error("[DUPLICATE SECTION] No section key provided");
                this.showNotification("Section key is required for duplication", "error");
                return;
            }
            
            if (!this.currentPage) {
                console.error("[DUPLICATE SECTION] No current page set");
                this.showNotification("Current page not set", "error");
                return;
            }
            
            // Find section to duplicate
            const sections = this.sections.get(this.currentPage) || [];
            console.log(`[DUPLICATE SECTION] Found ${sections.length} sections on page ${this.currentPage}`);
            
            const section = sections.find(s => s.sectionKey === sectionKey);
            if (!section) {
                console.error(`[DUPLICATE SECTION] Section not found: ${sectionKey}`);
                this.showNotification("Section not found", "error");
                return;
            }
            
            console.log("[DUPLICATE SECTION] Found section to duplicate:", {
                key: section.sectionKey,
                title: section.title || section.sectionTitle,
                type: section.type,
                order: section.order
            });
            
            // Authentication check
            const token = this.getAuthToken();
            if (!token) {
                console.error("[DUPLICATE SECTION] No authentication token available");
                this.showNotification("Authentication required. Please log in again.", "error");
                return;
            }
            
            console.log("[DUPLICATE SECTION] Authentication token validated");
            
            // Create a copy of the section with a new unique key
            const timestamp = Date.now();
            const newSectionKey = `${section.sectionKey}_copy_${timestamp}`;
            
            const duplicatedSectionData = {
                pageName: this.currentPage,
                sectionId: newSectionKey,
                sectionTitle: `${section.title || section.sectionTitle} (Copy)`,
                contentHtml: section.content || section.contentHtml || "",
                contentTamil: section.contentTamil || "",
                order: (section.order || 1) + 1,
                isActive: section.isActive !== false,
                isVisible: section.isVisible !== false,
                layout: section.layout || "default",
                metadata: { ...section.metadata } || {},
                seo: { ...section.seo } || {},
                styling: { ...section.styling } || {}
            };
            
            console.log("[DUPLICATE SECTION] Prepared duplication data:", {
                newKey: newSectionKey,
                title: duplicatedSectionData.sectionTitle,
                page: duplicatedSectionData.pageName,
                order: duplicatedSectionData.order
            });
            
            // Make API request with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            console.log("[DUPLICATE SECTION] Sending duplication request to API...");
            const response = await fetch(`${this.apiBaseUrl}/api/content/pages/${duplicatedSectionData.pageName}/sections`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(duplicatedSectionData),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log("[DUPLICATE SECTION] API response received:", {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            if (response.ok) {
                const result = await response.json();
                console.log("[DUPLICATE SECTION] Section duplicated successfully:", result);
                
                this.showNotification("Section duplicated successfully!", "success");
                
                // Reload page content to show the new section
                console.log("[DUPLICATE SECTION] Reloading page content to display duplicated section");
                await this.loadPageContent(this.currentPage);
                
                // Log the activity
                console.log("[DUPLICATE SECTION] Logging duplication activity");
                await this.logActivity("duplicate_section", `Duplicated section: ${section.title || section.sectionTitle || "Unknown"}`);
                
            } else {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (parseError) {
                    console.warn("[DUPLICATE SECTION] Failed to parse error response as JSON");
                    errorData = { message: await response.text() };
                }
                
                console.error("[DUPLICATE SECTION] API request failed:", {
                    status: response.status,
                    statusText: response.statusText,
                    errorData: errorData
                });
                
                // Handle specific error cases
                let errorMessage = "Failed to duplicate section";
                if (response.status === 400) {
                    errorMessage = "Invalid section data provided";
                } else if (response.status === 401) {
                    errorMessage = "Authentication failed. Please log in again.";
                } else if (response.status === 403) {
                    errorMessage = "You do not have permission to duplicate sections";
                } else if (response.status === 409) {
                    errorMessage = "A section with this key already exists";
                } else if (response.status === 500) {
                    errorMessage = "Server error occurred while duplicating section";
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
                
                this.showNotification(errorMessage, "error");
                throw new Error(errorMessage);
            }
            
        } catch (error) {
            const logTime = performance.now() - startTime;
            
            if (error.name === "AbortError") {
                console.error("[DUPLICATE SECTION] Request timed out after 30 seconds");
                this.showNotification("Request timed out. Please check your connection and try again.", "error");
            } else if (error instanceof TypeError && error.message.includes("fetch")) {
                console.error("[DUPLICATE SECTION] Network error occurred:", error.message);
                this.showNotification("Network error. Please check your connection and try again.", "error");
            } else {
                console.error("[DUPLICATE SECTION] Error during duplication:", {
                    error: error.message,
                    stack: error.stack,
                    sectionKey: sectionKey,
                    page: this.currentPage,
                    processingTime: `${logTime.toFixed(2)}ms`
                });
                
                this.showNotification(error.message || "Error duplicating section. Please try again.", "error");
            }
        } finally {
            const totalTime = performance.now() - startTime;
            console.log(`[DUPLICATE SECTION] Duplication process completed for ${sectionKey} in ${totalTime.toFixed(2)}ms`);
        }
    }

    // Edit section settings
    editSectionSettings(sectionKey) {
        console.log("Edit section settings called for:", sectionKey);
        console.log("this.allSections:", this.allSections);
        console.log("this.allSections length:", this.allSections?.length);
        
        // Find section in allSections array with multiple matching strategies
        let section = null;
        
        if (this.allSections && this.allSections.length > 0) {
            // Try different matching strategies
            section = this.allSections.find(s => 
                s.sectionKey === sectionKey || 
                s.section === sectionKey || 
                s._id === sectionKey ||
                s.id === sectionKey
            );
            
            // If still not found, try case-insensitive matching
            if (!section) {
                section = this.allSections.find(s => 
                    (s.sectionKey && s.sectionKey.toLowerCase() === sectionKey.toLowerCase()) ||
                    (s.section && s.section.toLowerCase() === sectionKey.toLowerCase())
                );
            }
        }
        
        if (!section) {
            console.error("Section not found:", sectionKey);
            console.log("Available sections:", this.allSections?.map(s => ({ 
                id: s._id || s.id, 
                sectionKey: s.sectionKey, 
                section: s.section,
                page: s.page || s.pageName
            })));
            
            // Try to fetch section data directly from API
            this.fetchAndEditSection(sectionKey);
            return;
        }

        // Create and show settings modal
        console.log("Creating modal for section:", section);
        const modal = this.createSettingsModal(section);
        document.body.appendChild(modal);
        modal.style.display = "flex";
        console.log("Modal should now be visible");
        
        // Add click outside to close
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
    }

    // Close modal function
    closeModal(modal) {
        modal.style.animation = "modalFadeOut 0.3s ease-out";
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }

    // Create settings modal with ultra-modern, creative and attractive styling
    createSettingsModal(section) {
        const modal = document.createElement("div");
        modal.className = "modal content-editor-modal ultra-modern-modal";
        
        // Get current theme
        const isDarkTheme = document.body.getAttribute("data-theme") === "dark";
        
        // Ultra-modern modal styling with animated background
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${isDarkTheme 
                ? "radial-gradient(ellipse at center, rgba(109, 40, 217, 0.15) 0%, rgba(30, 30, 46, 0.9) 70%, rgba(0, 0, 0, 0.95) 100%)"
                : "radial-gradient(ellipse at center, rgba(2, 136, 209, 0.15) 0%, rgba(224, 247, 250, 0.9) 70%, rgba(255, 255, 255, 0.95) 100%)"
            };
            backdrop-filter: blur(20px) saturate(1.8);
            -webkit-backdrop-filter: blur(20px) saturate(1.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: modalFadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        
        // Creative theme-based styling with enhanced visual elements
        const modalBg = isDarkTheme 
            ? "linear-gradient(145deg, rgba(30, 30, 46, 0.98) 0%, rgba(42, 42, 79, 0.95) 25%, rgba(109, 40, 217, 0.9) 75%, rgba(157, 78, 221, 0.85) 100%)"
            : "linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(224, 247, 250, 0.95) 25%, rgba(129, 212, 250, 0.9) 75%, rgba(2, 136, 209, 0.85) 100%)";
            
        const headerBg = isDarkTheme
            ? "linear-gradient(135deg, rgba(109, 40, 217, 0.9) 0%, rgba(157, 78, 221, 0.8) 50%, rgba(30, 30, 46, 0.95) 100%)"
            : "linear-gradient(135deg, rgba(2, 136, 209, 0.9) 0%, rgba(129, 212, 250, 0.8) 50%, rgba(255, 255, 255, 0.95) 100%)";
            
        const textColor = isDarkTheme ? "var(--text-primary, #ffffff)" : "var(--text-primary, #01579B)";
        const inputBg = isDarkTheme ? "var(--bg-tertiary, rgba(42, 42, 79, 0.9))" : "var(--bg-primary, rgba(255, 255, 255, 0.9))";
        const borderColor = isDarkTheme ? "var(--border-accent, rgba(157, 78, 221, 0.5))" : "var(--border-primary, rgba(2, 136, 209, 0.5))";
        const accentColor = isDarkTheme ? "var(--accent-purple, #9D4EDD)" : "var(--primary-color, #0288D1)";
        const glowColor = isDarkTheme ? "var(--glow-purple, rgba(157, 78, 221, 0.3))" : "var(--glow-blue, rgba(2, 136, 209, 0.3))";
        
        modal.innerHTML = `
            <!-- Floating particles background -->
            <div class="particles-container" style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                overflow: hidden;
            ">
                ${Array.from({length: 15}, (_, i) => `
                    <div class="particle" style="
                        position: absolute;
                        width: ${Math.random() * 6 + 2}px;
                        height: ${Math.random() * 6 + 2}px;
                        background: ${accentColor};
                        border-radius: 50%;
                        left: ${Math.random() * 100}%;
                        top: ${Math.random() * 100}%;
                        animation: float${i % 3 + 1} ${Math.random() * 10 + 15}s infinite linear;
                        opacity: ${Math.random() * 0.6 + 0.2};
                        box-shadow: 0 0 ${Math.random() * 20 + 10}px ${glowColor};
                    "></div>
                `).join("")}
            </div>
            
            <div class="modal-content ultra-modern-modal" style="
                background: ${modalBg};
                backdrop-filter: blur(30px) saturate(1.5);
                -webkit-backdrop-filter: blur(30px) saturate(1.5);
                border: 2px solid ${borderColor};
                border-radius: 2rem;
                padding: 0;
                max-width: 700px;
                width: 95vw;
                max-height: 90vh;
                overflow: hidden;
                box-shadow: 
                    var(--shadow-2xl),
                    0 0 0 1px ${borderColor},
                    inset 0 1px 0 rgba(255, 255, 255, 0.1),
                    0 0 50px ${glowColor};
                animation: modalSlideIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
                position: relative;
                transform-style: preserve-3d;
            ">
                <!-- Animated gradient overlay -->
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 6px;
                    background: linear-gradient(90deg, 
                        ${accentColor} 0%, 
                        var(--primary-accent) 25%,
                        ${isDarkTheme ? "var(--accent-pink, #EC4899)" : "var(--accent-gold, #F59E0B)"} 50%,
                        var(--primary-accent) 75%,
                        ${accentColor} 100%);
                    border-radius: 2rem 2rem 0 0;
                    animation: gradientShift 3s ease-in-out infinite;
                "></div>
                
                <!-- Decorative corner elements -->
                <div style="
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    width: 60px;
                    height: 60px;
                    background: ${glowColor};
                    border-radius: 50%;
                    filter: blur(20px);
                    animation: pulse 2s ease-in-out infinite;
                "></div>
                <div style="
                    position: absolute;
                    bottom: 1rem;
                    left: 1rem;
                    width: 40px;
                    height: 40px;
                    background: ${isDarkTheme ? "rgba(236, 72, 153, 0.3)" : "rgba(245, 158, 11, 0.3)"};
                    border-radius: 50%;
                    filter: blur(15px);
                    animation: pulse 2.5s ease-in-out infinite reverse;
                "></div>
                
                <div class="modal-header ultra-modern-header" style="
                    background: ${headerBg};
                    padding: 2.5rem 3rem 2rem;
                    border-bottom: 1px solid ${borderColor};
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: relative;
                    overflow: hidden;
                ">
                    <!-- Header background pattern -->
                    <div style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-image: radial-gradient(circle at 20% 50%, ${glowColor} 0%, transparent 50%),
                                         radial-gradient(circle at 80% 20%, ${isDarkTheme ? "rgba(236, 72, 153, 0.1)" : "rgba(245, 158, 11, 0.1)"} 0%, transparent 50%);
                        opacity: 0.6;
                    "></div>
                    
                    <div style="position: relative; z-index: 2;">
                        <!-- Icon with animated background -->
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 1.5rem;
                            margin-bottom: 0.75rem;
                        ">
                            <div style="
                                width: 60px;
                                height: 60px;
                                background: var(--bg-accent);
                                border-radius: 1rem;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                box-shadow: 0 8px 25px ${glowColor};
                                animation: iconFloat 3s ease-in-out infinite;
                            ">
                                <i class="fas fa-cog" style="
                                    color: var(--text-inverse);
                                    font-size: 1.5rem;
                                    animation: iconSpin 8s linear infinite;
                                "></i>
                            </div>
                            <div>
                                <h3 style="
                                    margin: 0;
                                    color: ${textColor};
                                    font-size: 2rem;
                                    font-weight: 800;
                                    text-shadow: var(--text-shadow-md);
                                    letter-spacing: -0.025em;
                                    background: linear-gradient(135deg, ${textColor}, ${accentColor});
                                    -webkit-background-clip: text;
                                    -webkit-text-fill-color: transparent;
                                    background-clip: text;
                                ">Section Settings</h3>
                                <p style="
                                    margin: 0.25rem 0 0;
                                    color: ${textColor};
                                    opacity: 0.85;
                                    font-size: 1rem;
                                    font-weight: 500;
                                    letter-spacing: 0.025em;
                                ">Configure section properties and behavior</p>
                            </div>
                        </div>
                    </div>
                    
                    <button class="close ultra-modern-close-btn" onclick="this.closest('.modal').remove()" style="
                        background: var(--bg-accent-light);
                        border: 2px solid ${borderColor};
                        color: ${textColor};
                        font-size: 1.4rem;
                        cursor: pointer;
                        padding: 0;
                        border-radius: 1rem;
                        width: 55px;
                        height: 55px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                        backdrop-filter: blur(15px);
                        -webkit-backdrop-filter: blur(15px);
                        position: relative;
                        z-index: 3;
                        box-shadow: var(--shadow-md);
                    " 
                    onmouseover="
                        this.style.background='var(--bg-accent)';
                        this.style.color='var(--text-inverse)';
                        this.style.transform='scale(1.15) rotate(90deg)';
                        this.style.boxShadow='0 12px 35px ${glowColor}';
                        this.style.borderColor='${accentColor}';
                    " 
                    onmouseout="
                        this.style.background='var(--bg-accent-light)';
                        this.style.color='${textColor}';
                        this.style.transform='scale(1) rotate(0deg)';
                        this.style.boxShadow='var(--shadow-md)';
                        this.style.borderColor='${borderColor}';
                    ">&times;</button>
                </div>
                
                <div class="modal-body ultra-modern-body" style="
                    padding: 3rem;
                    max-height: 65vh;
                    overflow-y: auto;
                    scrollbar-width: thin;
                    scrollbar-color: ${accentColor} transparent;
                    position: relative;
                ">
                    <!-- Subtle background pattern -->
                    <div style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-image: 
                            radial-gradient(circle at 25% 25%, ${glowColor} 0%, transparent 50%),
                            radial-gradient(circle at 75% 75%, ${isDarkTheme ? "rgba(236, 72, 153, 0.05)" : "rgba(245, 158, 11, 0.05)"} 0%, transparent 50%);
                        opacity: 0.3;
                        pointer-events: none;
                    "></div>
                    
                    <form id="sectionSettingsForm" style="position: relative; z-index: 2;">
                        <div class="form-group ultra-modern-form-group" style="margin-bottom: 3rem; position: relative;">
                            <!-- Enhanced label with gradient text and animated elements -->
                            <label for="sectionName" style="
                                display: flex;
                                align-items: center;
                                gap: 1rem;
                                margin-bottom: 1.25rem;
                                color: ${textColor};
                                font-weight: 800;
                                font-size: 1.2rem;
                                letter-spacing: 0.05em;
                                text-transform: uppercase;
                                position: relative;
                                text-shadow: 0 2px 10px ${glowColor};
                            ">
                                <!-- Animated glow orb -->
                                <div style="
                                    width: 16px;
                                    height: 16px;
                                    background: linear-gradient(135deg, ${accentColor}, ${glowColor});
                                    border-radius: 50%;
                                    box-shadow: 
                                        0 0 20px ${glowColor},
                                        0 0 40px ${glowColor}40,
                                        0 0 60px ${glowColor}20;
                                    animation: pulse 2.5s ease-in-out infinite;
                                    position: relative;
                                ">
                                    <div style="
                                        position: absolute;
                                        top: 50%;
                                        left: 50%;
                                        transform: translate(-50%, -50%);
                                        width: 8px;
                                        height: 8px;
                                        background: var(--bg-primary);
                                        border-radius: 50%;
                                        animation: pulse 1.5s ease-in-out infinite reverse;
                                    "></div>
                                </div>
                                
                                <!-- Gradient text -->
                                <span style="
                                    background: linear-gradient(135deg, ${textColor}, ${accentColor}, ${glowColor});
                                    -webkit-background-clip: text;
                                    -webkit-text-fill-color: transparent;
                                    background-clip: text;
                                    background-size: 200% 200%;
                                    animation: gradientShift 4s ease-in-out infinite;
                                ">Section Name</span>
                                
                                <!-- Floating sparkle -->
                                <div style="
                                    position: absolute;
                                    right: -10px;
                                    top: -5px;
                                    color: ${glowColor};
                                    font-size: 0.8rem;
                                    animation: iconFloat 3s ease-in-out infinite;
                                    opacity: 0.8;
                                ">✨</div>
                            </label>
                            
                            <!-- Enhanced input container -->
                            <div style="
                                position: relative;
                                transform-style: preserve-3d;
                            ">
                                <!-- Input field with enhanced styling -->
                                <input type="text" id="sectionName" name="name" value="${section.sectionTitle || section.sectionKey || section.section || section.title?.en || section.title || ""}" required style="
                                    width: 100%;
                                    padding: 1.5rem 2rem 1.5rem 4rem;
                                    border: 3px solid transparent;
                                    border-radius: 1.25rem;
                                    background: linear-gradient(135deg, ${inputBg}, ${isDarkTheme ? "rgba(45, 45, 65, 0.9)" : "rgba(255, 255, 255, 0.95)"});
                                    backdrop-filter: blur(25px) saturate(1.8);
                                    -webkit-backdrop-filter: blur(25px) saturate(1.8);
                                    color: ${textColor};
                                    font-size: 1.2rem;
                                    font-weight: 600;
                                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                                    box-shadow: 
                                        0 10px 40px rgba(0, 0, 0, 0.12),
                                        0 4px 15px rgba(0, 0, 0, 0.08),
                                        inset 0 2px 0 rgba(255, 255, 255, 0.2),
                                        inset 0 -2px 0 rgba(0, 0, 0, 0.05);
                                    position: relative;
                                    z-index: 2;
                                    outline: none;
                                " 
                                placeholder="Enter an amazing section name..."
                                onfocus="
                                    this.style.borderColor='${accentColor}';
                                    this.style.boxShadow='
                                        0 0 0 4px ${accentColor}33,
                                        0 20px 60px rgba(0, 0, 0, 0.25),
                                        0 8px 25px rgba(0, 0, 0, 0.15),
                                        inset 0 2px 0 rgba(255, 255, 255, 0.3),
                                        inset 0 -2px 0 rgba(0, 0, 0, 0.1),
                                        0 0 30px ${glowColor}';
                                    this.style.transform='translateY(-5px) scale(1.02)';
                                    this.nextElementSibling.style.color='${accentColor}';
                                    this.nextElementSibling.style.transform='translateY(-50%) scale(1.2) rotate(10deg)';
                                    this.nextElementSibling.style.textShadow='0 0 15px ${glowColor}';
                                " 
                                onblur="
                                    this.style.borderColor='transparent';
                                    this.style.boxShadow='
                                        0 10px 40px rgba(0, 0, 0, 0.12),
                                        0 4px 15px rgba(0, 0, 0, 0.08),
                                        inset 0 2px 0 rgba(255, 255, 255, 0.2),
                                        inset 0 -2px 0 rgba(0, 0, 0, 0.05)';
                                    this.style.transform='translateY(0) scale(1)';
                                    this.nextElementSibling.style.color='${accentColor}';
                                    this.nextElementSibling.style.transform='translateY(-50%) scale(1) rotate(0deg)';
                                    this.nextElementSibling.style.textShadow='0 0 10px ${glowColor}';
                                ">
                                
                                <!-- Animated icon -->
                                <div style="
                                    position: absolute;
                                    left: 1.5rem;
                                    top: 50%;
                                    transform: translateY(-50%);
                                    color: ${accentColor};
                                    font-size: 1.4rem;
                                    pointer-events: none;
                                    z-index: 3;
                                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                                    text-shadow: 0 0 10px ${glowColor};
                                    animation: iconFloat 4s ease-in-out infinite;
                                ">🏷️</div>
                                
                                <!-- Glow effect overlay -->
                                <div style="
                                    position: absolute;
                                    top: 0;
                                    left: 0;
                                    right: 0;
                                    bottom: 0;
                                    border-radius: 1.25rem;
                                    background: linear-gradient(135deg, ${glowColor}15, ${accentColor}15);
                                    opacity: 0;
                                    transition: opacity 0.4s ease;
                                    pointer-events: none;
                                    z-index: 1;
                                " class="input-glow-overlay"></div>
                                
                                <!-- Decorative corner elements -->
                                <div style="
                                    position: absolute;
                                    top: -2px;
                                    right: -2px;
                                    width: 12px;
                                    height: 12px;
                                    background: ${accentColor};
                                    border-radius: 50%;
                                    opacity: 0.6;
                                    animation: pulse 3s ease-in-out infinite;
                                    z-index: 4;
                                "></div>
                                <div style="
                                    position: absolute;
                                    bottom: -2px;
                                    left: -2px;
                                    width: 8px;
                                    height: 8px;
                                    background: ${glowColor};
                                    border-radius: 50%;
                                    opacity: 0.4;
                                    animation: pulse 2s ease-in-out infinite reverse;
                                    z-index: 4;
                                "></div>
                            </div>
                        </div>
                        
                        <div class="form-group enhanced-form-group" style="margin-bottom: 2rem;">
                            <label for="sectionDescription" style="
                                display: block;
                                margin-bottom: 0.75rem;
                                color: ${textColor};
                                font-weight: 600;
                                font-size: 1rem;
                                letter-spacing: 0.025em;
                            ">Description</label>
                            <textarea id="sectionDescription" name="description" rows="3" style="
                                width: 100%;
                                padding: 1rem 1.25rem;
                                border: 2px solid ${borderColor};
                                border-radius: 0.75rem;
                                background: ${inputBg};
                                backdrop-filter: blur(10px);
                                -webkit-backdrop-filter: blur(10px);
                                color: ${textColor};
                                font-size: 1rem;
                                font-weight: 500;
                                resize: vertical;
                                min-height: 100px;
                                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                            " 
                            onfocus="
                                this.style.borderColor='${accentColor}';
                                this.style.boxShadow='var(--shadow-focus)';
                                this.style.transform='translateY(-2px)';
                            " 
                            onblur="
                                this.style.borderColor='${borderColor}';
                                this.style.boxShadow='var(--shadow-md)';
                                this.style.transform='translateY(0)';
                            ">${section.contentHtml || section.content?.en || section.content || ""}</textarea>
                        </div>
                        
                        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
                            <div class="form-group enhanced-form-group">
                                <label for="sectionType" style="
                                    display: block;
                                    margin-bottom: 0.75rem;
                                    color: ${textColor};
                                    font-weight: 600;
                                    font-size: 1rem;
                                    letter-spacing: 0.025em;
                                ">Section Type</label>
                                <select id="sectionType" name="type" style="
                                    width: 100%;
                                    padding: 1rem 1.25rem;
                                    border: 2px solid ${borderColor};
                                    border-radius: 0.75rem;
                                    background: ${inputBg};
                                    backdrop-filter: blur(10px);
                                    -webkit-backdrop-filter: blur(10px);
                                    color: ${textColor};
                                    font-size: 1rem;
                                    font-weight: 500;
                                    cursor: pointer;
                                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                                " 
                                onfocus="
                                    this.style.borderColor='${accentColor}';
                                    this.style.boxShadow='0 0 0 3px ${accentColor}33, 0 8px 25px rgba(0, 0, 0, 0.15)';
                                    this.style.transform='translateY(-2px)';
                                " 
                                onblur="
                                    this.style.borderColor='${borderColor}';
                                    this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.1)';
                                    this.style.transform='translateY(0)';
                                ">
                                    <option value="hero" ${(section.sectionType || section.type || section.layout) === "hero" ? "selected" : ""}>Hero</option>
                                    <option value="text" ${(section.sectionType || section.type || section.layout) === "text" ? "selected" : ""}>Text</option>
                                    <option value="image-text" ${(section.sectionType || section.type || section.layout) === "image-text" ? "selected" : ""}>Image + Text</option>
                                    <option value="gallery" ${(section.sectionType || section.type || section.layout) === "gallery" ? "selected" : ""}>Gallery</option>
                                    <option value="features" ${(section.sectionType || section.type || section.layout) === "features" ? "selected" : ""}>Features</option>
                                    <option value="testimonials" ${(section.sectionType || section.type || section.layout) === "testimonials" ? "selected" : ""}>Testimonials</option>
                                    <option value="contact" ${(section.sectionType || section.type || section.layout) === "contact" ? "selected" : ""}>Contact</option>
                                    <option value="cta" ${(section.sectionType || section.type || section.layout) === "cta" ? "selected" : ""}>Call to Action</option>
                                    <option value="default" ${(section.sectionType || section.type || section.layout) === "default" ? "selected" : ""}>Default</option>
                                </select>
                            </div>
                            
                            <div class="form-group enhanced-form-group">
                                <label for="displayOrder" style="
                                    display: block;
                                    margin-bottom: 0.75rem;
                                    color: ${textColor};
                                    font-weight: 600;
                                    font-size: 1rem;
                                    letter-spacing: 0.025em;
                                ">Display Order</label>
                                <input type="number" id="displayOrder" name="displayOrder" value="${section.position || section.order || 0}" min="0" style="
                                    width: 100%;
                                    padding: 1rem 1.25rem;
                                    border: 2px solid ${borderColor};
                                    border-radius: 0.75rem;
                                    background: ${inputBg};
                                    backdrop-filter: blur(10px);
                                    -webkit-backdrop-filter: blur(10px);
                                    color: ${textColor};
                                    font-size: 1rem;
                                    font-weight: 500;
                                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                                " 
                                onfocus="
                                    this.style.borderColor='${accentColor}';
                                    this.style.boxShadow='0 0 0 3px ${accentColor}33, 0 8px 25px rgba(0, 0, 0, 0.15)';
                                    this.style.transform='translateY(-2px)';
                                " 
                                onblur="
                                    this.style.borderColor='${borderColor}';
                                    this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.1)';
                                    this.style.transform='translateY(0)';
                                ">
                            </div>
                            
                            <div class="form-group enhanced-form-group">
                                <label for="sectionStatus" style="
                                    display: block;
                                    margin-bottom: 0.75rem;
                                    color: ${textColor};
                                    font-weight: 600;
                                    font-size: 1rem;
                                    letter-spacing: 0.025em;
                                ">Status</label>
                                <select id="sectionStatus" name="status" style="
                                    width: 100%;
                                    padding: 1rem 1.25rem;
                                    border: 2px solid ${borderColor};
                                    border-radius: 0.75rem;
                                    background: ${inputBg};
                                    backdrop-filter: blur(10px);
                                    -webkit-backdrop-filter: blur(10px);
                                    color: ${textColor};
                                    font-size: 1rem;
                                    font-weight: 500;
                                    cursor: pointer;
                                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                                " 
                                onfocus="
                                    this.style.borderColor='${accentColor}';
                                    this.style.boxShadow='0 0 0 3px ${accentColor}33, 0 8px 25px rgba(0, 0, 0, 0.15)';
                                    this.style.transform='translateY(-2px)';
                                " 
                                onblur="
                                    this.style.borderColor='${borderColor}';
                                    this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.1)';
                                    this.style.transform='translateY(0)';
                                ">
                                    <option value="active" ${section.isActive ? "selected" : ""}>Active</option>
                <option value="inactive" ${!section.isActive ? "selected" : ""}>Inactive</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="checkbox-group" style="
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 1.5rem;
                            margin-bottom: 1rem;
                            padding: 1.5rem;
                            background: ${isDarkTheme ? "rgba(42, 42, 79, 0.3)" : "rgba(224, 247, 250, 0.3)"};
                            border-radius: 1rem;
                            border: 1px solid ${borderColor};
                        ">
                            <label class="enhanced-checkbox" style="
                                display: flex;
                                align-items: center;
                                gap: 0.75rem;
                                color: ${textColor};
                                font-weight: 500;
                                cursor: pointer;
                                padding: 0.5rem;
                                border-radius: 0.5rem;
                                transition: all 0.2s ease;
                            " 
                            onmouseover="this.style.background='var(--bg-accent-light)'" 
                            onmouseout="this.style.background='transparent'">
                                <input type="checkbox" name="isVisible" ${section.isVisible ? "checked" : ""} style="
                                    width: 1.25rem;
                                    height: 1.25rem;
                                    accent-color: ${accentColor};
                                    cursor: pointer;
                                ">
                                <span>Visible Section</span>
                            </label>
                            
                            <label class="enhanced-checkbox" style="
                                display: flex;
                                align-items: center;
                                gap: 0.75rem;
                                color: ${textColor};
                                font-weight: 500;
                                cursor: pointer;
                                padding: 0.5rem;
                                border-radius: 0.5rem;
                                transition: all 0.2s ease;
                            " 
                            onmouseover="this.style.background='var(--bg-accent-light)'" 
                            onmouseout="this.style.background='transparent'">
                                <input type="checkbox" name="isActive" ${section.isActive ? "checked" : ""} style="
                                    width: 1.25rem;
                                    height: 1.25rem;
                                    accent-color: ${accentColor};
                                    cursor: pointer;
                                ">
                                <span>Active Section</span>
                            </label>
                        </div>
                    </form>
                </div>
                
                <div class="modal-footer ultra-modern-footer" style="
                    padding: 2.5rem 3rem;
                    border-top: 1px solid ${borderColor};
                    display: flex;
                    gap: 1.5rem;
                    justify-content: flex-end;
                    background: linear-gradient(135deg, ${isDarkTheme ? "rgba(30, 30, 46, 0.95)" : "rgba(224, 247, 250, 0.95)"}, ${isDarkTheme ? "rgba(42, 42, 79, 0.8)" : "rgba(255, 255, 255, 0.9)"});
                    backdrop-filter: blur(20px) saturate(1.8);
                    -webkit-backdrop-filter: blur(20px) saturate(1.8);
                    position: relative;
                    overflow: hidden;
                ">
                    <!-- Footer background pattern -->
                    <div style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-image: 
                            radial-gradient(circle at 20% 50%, ${glowColor} 0%, transparent 50%),
                            radial-gradient(circle at 80% 50%, ${isDarkTheme ? "rgba(236, 72, 153, 0.1)" : "rgba(245, 158, 11, 0.1)"} 0%, transparent 50%);
                        opacity: 0.4;
                        pointer-events: none;
                    "></div>
                    
                    <!-- Enhanced Cancel Button -->
                    <button type="button" onclick="this.closest('.modal').remove()" class="ultra-modern-cancel-btn" style="
                        padding: 1rem 2.5rem;
                        border: 2px solid ${borderColor};
                        border-radius: 1rem;
                        background: var(--bg-gradient-subtle);
                        color: ${textColor};
                        font-size: 1.1rem;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                        backdrop-filter: blur(15px);
                        -webkit-backdrop-filter: blur(15px);
                        position: relative;
                        z-index: 2;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        overflow: hidden;
                    " 
                    onmouseover="
                        this.style.background='var(--bg-accent-gradient)';
                        this.style.transform='translateY(-3px) scale(1.05)';
                        this.style.boxShadow='var(--shadow-xl)';
                        this.style.borderColor='${accentColor}';
                        this.style.color='${accentColor}';
                    " 
                    onmouseout="
                        this.style.background='var(--bg-gradient-subtle)';
                        this.style.transform='translateY(0) scale(1)';
                        this.style.boxShadow='none';
                        this.style.borderColor='${borderColor}';
                        this.style.color='${textColor}';
                    ">
                        <span style="position: relative; z-index: 2;">✕ Cancel</span>
                        <!-- Button ripple effect -->
                        <div style="
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            width: 0;
                            height: 0;
                            background: ${accentColor};
                            border-radius: 50%;
                            transform: translate(-50%, -50%);
                            transition: all 0.6s ease;
                            opacity: 0;
                            z-index: 1;
                        " class="button-ripple"></div>
                    </button>
                    
                    <!-- Enhanced Save Button -->
                    <button type="button" onclick="window.contentEditor.saveSectionSettings('${section._id}', this.closest('.modal'))" class="ultra-modern-save-btn" style="
                        padding: 1rem 3rem;
                        border: none;
                        border-radius: 1rem;
                        background: var(--bg-accent);
                        background-size: 200% 200%;
                        color: var(--text-inverse);
                        font-size: 1.1rem;
                        font-weight: 800;
                        cursor: pointer;
                        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                        backdrop-filter: blur(10px);
                        -webkit-backdrop-filter: blur(10px);
                        position: relative;
                        z-index: 2;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        overflow: hidden;
                        box-shadow: 
                            0 10px 30px rgba(0, 0, 0, 0.3),
                            0 0 20px ${glowColor};
                        animation: gradientShift 3s ease-in-out infinite;
                    " 
                    onmouseover="
                        this.style.transform='translateY(-4px) scale(1.08)';
                        this.style.boxShadow='
                            var(--shadow-xl),
                            0 0 40px ${glowColor},
                            0 0 60px ${glowColor}40';
                        this.style.backgroundPosition='100% 0';
                    " 
                    onmouseout="
                        this.style.transform='translateY(0) scale(1)';
                        this.style.boxShadow='
                            0 10px 30px rgba(0, 0, 0, 0.3),
                            0 0 20px ${glowColor}';
                        this.style.backgroundPosition='0% 0';
                    ">
                        <span style="position: relative; z-index: 2;">💾 Save Changes</span>
                        <!-- Animated shine effect -->
                        <div style="
                            position: absolute;
                            top: 0;
                            left: -100%;
                            width: 100%;
                            height: 100%;
                            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                            transition: left 0.6s ease;
                            z-index: 1;
                        " class="button-shine"></div>
                        <!-- Pulsing glow -->
                        <div style="
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            width: 120%;
                            height: 120%;
                            background: radial-gradient(circle, ${glowColor}20 0%, transparent 70%);
                            transform: translate(-50%, -50%);
                            animation: pulse 2s ease-in-out infinite;
                            z-index: 0;
                        "></div>
                    </button>
                </div>
            </div>
        `;
        
        // Add ultra-modern animations and effects
        const style = document.createElement("style");
        style.textContent = `
            @keyframes modalFadeIn {
                from { 
                    opacity: 0;
                    backdrop-filter: blur(0px);
                }
                to { 
                    opacity: 1;
                    backdrop-filter: blur(20px) saturate(1.8);
                }
            }
            
            @keyframes modalSlideIn {
                from { 
                    opacity: 0;
                    transform: translateY(-100px) scale(0.8) rotateX(15deg);
                    filter: blur(10px);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0) scale(1) rotateX(0deg);
                    filter: blur(0px);
                }
            }
            
            @keyframes gradientShift {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }
            
            @keyframes pulse {
                0%, 100% { 
                    transform: scale(1);
                    opacity: 0.8;
                }
                50% { 
                    transform: scale(1.2);
                    opacity: 1;
                }
            }
            
            @keyframes iconFloat {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                33% { transform: translateY(-8px) rotate(2deg); }
                66% { transform: translateY(4px) rotate(-1deg); }
            }
            
            @keyframes iconSpin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            @keyframes float1 {
                0%, 100% { transform: translateY(0px) translateX(0px); }
                25% { transform: translateY(-20px) translateX(10px); }
                50% { transform: translateY(-10px) translateX(-5px); }
                75% { transform: translateY(-30px) translateX(15px); }
            }
            
            @keyframes float2 {
                0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
                33% { transform: translateY(-15px) translateX(-10px) rotate(120deg); }
                66% { transform: translateY(-25px) translateX(8px) rotate(240deg); }
            }
            
            @keyframes float3 {
                0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
                50% { transform: translateY(-40px) translateX(-20px) scale(1.2); }
            }
            
            /* Button shine effect on hover */
            .ultra-modern-modal button:hover .button-shine {
                left: 100%;
            }
            
            /* Additional ripple effect for buttons */
            @keyframes ripple {
                0% {
                    transform: scale(0);
                    opacity: 1;
                }
                100% {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            
            @keyframes modalFadeOut {
                0% {
                    opacity: 1;
                    transform: scale(1);
                }
                100% {
                    opacity: 0;
                    transform: scale(0.95);
                }
            }
            
            .ultra-modern-modal::-webkit-scrollbar {
                width: 12px;
            }
            
            .ultra-modern-modal::-webkit-scrollbar-track {
                background: ${isDarkTheme ? "rgba(30, 30, 46, 0.3)" : "rgba(255, 255, 255, 0.3)"};
                border-radius: 10px;
            }
            
            .ultra-modern-modal::-webkit-scrollbar-thumb {
                background: var(--bg-accent);
                border-radius: 10px;
                border: 2px solid ${isDarkTheme ? "rgba(30, 30, 46, 0.5)" : "rgba(255, 255, 255, 0.5)"};
            }
            
            .ultra-modern-modal::-webkit-scrollbar-thumb:hover {
                background: var(--bg-accent);
                box-shadow: 0 0 10px ${glowColor};
            }
            
            .ultra-modern-form-group input:focus + .input-icon,
            .ultra-modern-form-group textarea:focus + .input-icon {
                color: ${accentColor};
                transform: translateY(-50%) scale(1.1);
            }
        `;
        document.head.appendChild(style);
        
        return modal;
    }

    // Save section settings
    async saveSectionSettings(sectionId, modal) {
        const form = modal.querySelector("#sectionSettingsForm");
        const formData = new FormData(form);
        const rawSettings = Object.fromEntries(formData.entries());
        
        // Map frontend form fields to backend API fields with multilingual support
        const settings = {
            sectionTitle: rawSettings.name || rawSettings.sectionTitle || "",
            contentHtml: rawSettings.description || rawSettings.contentHtml || "",
            order: parseInt(rawSettings.displayOrder) || parseInt(rawSettings.order) || 0,
            isVisible: formData.has("isVisible"),
            isActive: formData.has("isActive"),
            layout: rawSettings.type || rawSettings.layout || "default",
            sectionType: rawSettings.type || rawSettings.sectionType || "default"
        };

        // Handle multilingual fields
        if (rawSettings.title_en || rawSettings.title_ta) {
            settings.title = {};
            if (rawSettings.title_en) settings.title.en = rawSettings.title_en;
            if (rawSettings.title_ta) settings.title.ta = rawSettings.title_ta;
        }

        if (rawSettings.content_en || rawSettings.content_ta) {
            settings.content = {};
            if (rawSettings.content_en) settings.content.en = rawSettings.content_en;
            if (rawSettings.content_ta) settings.content.ta = rawSettings.content_ta;
        }

        if (rawSettings.subtitle_en || rawSettings.subtitle_ta) {
            settings.subtitle = {};
            if (rawSettings.subtitle_en) settings.subtitle.en = rawSettings.subtitle_en;
            if (rawSettings.subtitle_ta) settings.subtitle.ta = rawSettings.subtitle_ta;
        }

        if (rawSettings.buttonText_en || rawSettings.buttonText_ta) {
            settings.buttonText = {};
            if (rawSettings.buttonText_en) settings.buttonText.en = rawSettings.buttonText_en;
            if (rawSettings.buttonText_ta) settings.buttonText.ta = rawSettings.buttonText_ta;
        }

        // Handle other fields
        if (rawSettings.buttonUrl) settings.buttonUrl = rawSettings.buttonUrl;
        if (rawSettings.sectionType) settings.sectionType = rawSettings.sectionType;
        if (rawSettings.stylePreset) settings.stylePreset = rawSettings.stylePreset;

        // Remove empty values
        Object.keys(settings).forEach(key => {
            if (settings[key] === "" || settings[key] === null || settings[key] === undefined) {
                delete settings[key];
            }
        });

        try {
            const token = this.getAuthToken();
            const response = await fetch(`/api/website-content/sections/${this.getCurrentPage()}/${sectionId}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                const result = await response.json();
                this.showNotification("Section settings updated successfully!", "success");
                modal.remove();
                
                // Update the local section data
                const section = this.allSections.find(s => s._id === sectionId || s.id === sectionId);
                if (section) {
                    Object.assign(section, {
                        sectionTitle: settings.sectionTitle,
                        contentHtml: settings.contentHtml,
                        order: settings.order,
                        isVisible: settings.isVisible,
                        isActive: settings.isActive,
                        layout: settings.layout
                    });
                }
                
                // Reload the page content to reflect changes
                this.loadPageContent(this.currentPage);
                this.logActivity("update_section_settings", `Updated settings for section: ${settings.sectionTitle}`);
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to update section settings");
            }
        } catch (error) {
            console.error("Error updating section settings:", error);
            this.showNotification(`Error updating section settings: ${error.message}`, "error");
        }
    }

    // Delete a section using new section-based API
    async deleteSection(sectionKey) {
        const startTime = performance.now();
        const deletionId = `delete_${Date.now()}`;
        console.log(`[DELETE SECTION] Starting section deletion - ID: ${deletionId}, Key: ${sectionKey}`);
        
        try {
            // Validate section exists
            const section = this.sections.get(sectionKey);
            if (!section) {
                console.warn(`[DELETE SECTION] Section not found: ${sectionKey}`);
                this.showNotification("Section not found. It may have already been deleted.", "warning");
                return false;
            }
            
            console.log("[DELETE SECTION] Section found:", {
                key: sectionKey,
                title: section.title || section.sectionKey,
                id: section._id,
                page: this.currentPage,
                timestamp: new Date().toISOString()
            });
            
            // Confirm deletion with user
            const sectionTitle = section.title || section.sectionKey || "Untitled Section";
            if (!confirm(`Are you sure you want to delete the section "${sectionTitle}"? This action cannot be undone.`)) {
                console.log(`[DELETE SECTION] User cancelled deletion for ${sectionKey}`);
                return false;
            }
            
            // Validate authentication
            const token = this.getAuthToken();
            if (!token) {
                throw new Error("Authentication token not found. Please log in again.");
            }
            
            console.log(`[DELETE SECTION] Authentication validated, making API request for ${deletionId}`);
            
            // Show deletion progress
            this.showNotification(`Deleting section "${sectionTitle}"...`, "info");
            
            // Enhanced fetch with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                console.error(`[DELETE SECTION] Request timeout for ${deletionId}`);
            }, 30000); // 30 second timeout
            
            const response = await fetch(`${this.apiBaseUrl}/api/website-content/sections/${this.getCurrentPage()}/${section._id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log(`[DELETE SECTION] API response - Status: ${response.status}, OK: ${response.ok}`);

            if (response.ok) {
                console.log("[DELETE SECTION] Section deleted successfully:", {
                    sectionKey,
                    sectionTitle,
                    sectionId: section._id,
                    page: this.currentPage,
                    timestamp: new Date().toISOString()
                });
                
                // Remove from local cache
                this.sections.delete(sectionKey);
                
                this.showNotification(`Section "${sectionTitle}" deleted successfully!`, "success");
                
                // Reload page content with error handling
                try {
                    await this.loadPageContent(this.currentPage);
                    console.log(`[DELETE SECTION] Page content reloaded for ${this.currentPage}`);
                } catch (reloadError) {
                    console.error("[DELETE SECTION] Failed to reload page content:", {
                        error: reloadError.message,
                        page: this.currentPage,
                        deletionId
                    });
                    this.showNotification("Section deleted but failed to refresh page. Please refresh manually.", "warning");
                }
                
                // Log activity with error handling
                try {
                    await this.logActivity("delete_section", `Deleted section: ${sectionTitle}`);
                    console.log(`[DELETE SECTION] Activity logged for ${deletionId}`);
                } catch (logError) {
                    console.error("[DELETE SECTION] Failed to log activity:", {
                        error: logError.message,
                        deletionId,
                        timestamp: new Date().toISOString()
                    });
                    // Don't show error to user for logging failures
                }
                
                return true;
            } else {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (parseError) {
                    errorData = { message: await response.text() };
                }
                
                console.error("[DELETE SECTION] Section deletion failed:", {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorData,
                    sectionKey,
                    sectionTitle,
                    page: this.currentPage,
                    timestamp: new Date().toISOString()
                });
                
                // Handle specific error cases
                if (response.status === 404) {
                    this.showNotification("Section not found. It may have already been deleted.", "warning");
                    // Remove from local cache anyway
                    this.sections.delete(sectionKey);
                    await this.loadPageContent(this.currentPage);
                    return true;
                } else if (response.status === 401) {
                    throw new Error("Authentication expired. Please log in again.");
                } else if (response.status === 403) {
                    throw new Error("Access denied. You may not have permission to delete sections.");
                } else if (response.status >= 500) {
                    throw new Error("Server error occurred. Please try again later.");
                } else {
                    throw new Error(errorData.message || `Failed to delete section: ${response.statusText}`);
                }
            }
        } catch (error) {
            const deletionTime = performance.now() - startTime;
            console.error(`[DELETE SECTION] Error deleting section ${deletionId}:`, {
                error: error.message,
                stack: error.stack,
                sectionKey,
                currentPage: this.currentPage,
                deletionTime: `${deletionTime.toFixed(2)}ms`,
                timestamp: new Date().toISOString()
            });
            
            // Handle different error types with specific user feedback
            if (error.name === "AbortError") {
                this.showNotification("Section deletion timed out. Please try again.", "error");
            } else if (error.message.includes("Authentication")) {
                this.showNotification("Authentication error. Please log in again.", "error");
            } else if (error.message.includes("NetworkError") || error.message.includes("Failed to fetch")) {
                this.showNotification("Network error. Please check your connection and try again.", "error");
            } else {
                const errorMessage = error.message || "Error deleting section. Please try again.";
                this.showNotification(errorMessage, "error");
            }
            
            return false;
        } finally {
            const totalTime = performance.now() - startTime;
            console.log(`[DELETE SECTION] Section deletion process completed for ${deletionId} in ${totalTime.toFixed(2)}ms`);
        }
    }

    // Save individual section using new section-based API
    async saveSection(sectionKey) {
        const section = this.sections.get(sectionKey);
        if (!section) return;

        const sectionElement = document.querySelector(`[data-section-key="${sectionKey}"]`);
        if (!sectionElement) return;

        // Collect form data from the section
        const inputs = sectionElement.querySelectorAll("input, textarea, select");
        const updateData = {
            sectionTitle: section.title,
            contentHtml: "",
            contentTamil: "",
            order: section.order || 1,
            isActive: section.isActive !== false,
            isVisible: section.isVisible !== false,
            layout: section.layout || "default",
            metadata: section.metadata || {},
            seo: section.seo || {},
            styling: section.styling || {}
        };
        
        inputs.forEach(input => {
            if (input.type === "checkbox") {
                if (input.name === "isActive") {
                    updateData.isActive = input.checked;
                } else if (input.name === "isVisible") {
                    updateData.isVisible = input.checked;
                } else {
                    updateData[input.name] = input.checked;
                }
            } else if (input.type !== "file") {
                const value = input.value;
                const name = input.name;
                
                // Handle new section-based field structure
                if (name === "title" || name === "sectionTitle") {
                    updateData.sectionTitle = value;
                } else if (name === "content" || name === "contentHtml") {
                    updateData.contentHtml = value;
                } else if (name === "contentTamil") {
                    updateData.contentTamil = value;
                } else if (name === "order") {
                    updateData.order = parseInt(value) || 1;
                } else if (name === "layout") {
                    updateData.layout = value;
                } else {
                    // Handle metadata fields
                    updateData.metadata[name] = value;
                }
            }
        });

        try {
            const token = this.getAuthToken();
            const response = await fetch(`${this.apiBaseUrl}/api/website-content/sections/${this.getCurrentPage()}/${section._id}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                const result = await response.json();
                this.showNotification("Section saved successfully!", "success");
                this.logActivity("save_section", `Saved section: ${updateData.sectionTitle || section.sectionKey}`);
                
                // Update the section in our local map
                const updatedSection = {
                    ...section,
                    title: result.data.sectionTitle,
                    content: result.data.contentHtml,
                    contentTamil: result.data.contentTamil,
                    order: result.data.order,
                    isActive: result.data.isActive,
                    isVisible: result.data.isVisible,
                    layout: result.data.layout,
                    metadata: result.data.metadata,
                    seo: result.data.seo,
                    styling: result.data.styling
                };
                this.sections.set(sectionKey, updatedSection);
                
                // Update the live website immediately
                await this.updateLiveWebsite(this.currentPage);
                
                // Reload the page content to reflect changes
                await this.loadPageContent(this.currentPage);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to save section");
            }
        } catch (error) {
            console.error("Error saving section:", error);
            this.showNotification(`Error saving section: ${error.message}`, "error");
        }
    }

    // Update section property with real database integration
    async updateSectionProperty(sectionKey, property, value) {
        const startTime = performance.now();
        console.log(`[UPDATE SECTION PROPERTY] Starting update - Section: ${sectionKey}, Property: ${property}, Value length: ${value?.length || 0}`);
        
        const section = this.sections.get(sectionKey);
        if (!section) {
            console.error(`[UPDATE SECTION PROPERTY] Section not found: ${sectionKey}`);
            this.showNotification(`Section ${sectionKey} not found`, "error");
            return;
        }

        try {
            const token = this.getAuthToken();
            if (!token) {
                throw new Error("Authentication token not found. Please log in again.");
            }
            
            const apiUrl = `${this.apiBaseUrl}/api/website-content/sections/${this.getCurrentPage()}/${section._id}`;
            const requestBody = { [property]: value };
            
            console.log(`[UPDATE SECTION PROPERTY] Making request to: ${apiUrl}`);
            console.log("[UPDATE SECTION PROPERTY] Request body:", requestBody);
            
            const response = await fetch(apiUrl, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            });
            
            console.log(`[UPDATE SECTION PROPERTY] Response status: ${response.status}, OK: ${response.ok}`);

            if (response.ok) {
                const result = await response.json();
                console.log("[UPDATE SECTION PROPERTY] Success response:", result);
                
                // Update local section data
                const oldValue = section[property];
                section[property] = value;
                this.sections.set(sectionKey, section);
                
                console.log(`[UPDATE SECTION PROPERTY] Updated local data - Old: ${oldValue}, New: ${value}`);
                
                this.showNotification(`${property} updated successfully!`, "success");
                this.logActivity("update_section_property", `Updated ${property} for section: ${section.title || section.section}`);
                
                // Update the live website immediately
                await this.updateLiveWebsite(this.currentPage);
            } else {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (parseError) {
                    errorData = { message: await response.text() };
                }
                
                console.error("[UPDATE SECTION PROPERTY] Error response:", {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorData,
                    sectionId: section._id,
                    property: property,
                    timestamp: new Date().toISOString()
                });
                
                throw new Error(errorData.message || `Failed to update section ${property}: ${response.statusText}`);
            }
        } catch (error) {
            const updateTime = performance.now() - startTime;
            console.error(`[UPDATE SECTION PROPERTY] Error updating section ${property}:`, {
                error: error.message,
                stack: error.stack,
                sectionKey: sectionKey,
                property: property,
                sectionId: section._id,
                updateTime: `${updateTime.toFixed(2)}ms`,
                timestamp: new Date().toISOString()
            });
            
            // Handle specific error types
            if (error.message.includes("Authentication")) {
                this.showNotification("Authentication error. Please log in again.", "error");
            } else if (error.message.includes("NetworkError") || error.message.includes("Failed to fetch")) {
                this.showNotification("Network error. Please check your connection and try again.", "error");
            } else {
                this.showNotification(`Error updating ${property}: ${error.message}`, "error");
            }
        } finally {
            const totalTime = performance.now() - startTime;
            console.log(`[UPDATE SECTION PROPERTY] Update completed for ${sectionKey}.${property} in ${totalTime.toFixed(2)}ms`);
        }
    }

    // Update live website content immediately
    async updateLiveWebsite(page) {
        try {
            console.log(`🚀 Broadcasting real-time update for page: ${page}`);
            
            // Get current page content
            const pageContent = this.getPageContent(page);
            
            // Create update payload
            const updateData = {
                type: "CONTENT_UPDATE",
                page: page,
                content: pageContent,
                timestamp: Date.now()
            };
            
            // Broadcast to all open windows/tabs via localStorage
            localStorage.setItem("websiteContentUpdate", JSON.stringify(updateData));
            
            // Clear the localStorage item after a short delay to allow other tabs to read it
            setTimeout(() => {
                localStorage.removeItem("websiteContentUpdate");
            }, 1000);
            
            // Also send postMessage to any open preview windows
            if (window.opener && !window.opener.closed) {
                window.opener.postMessage(updateData, "*");
            }
            
            // Send to all child windows (previews)
            if (this.previewWindow && !this.previewWindow.closed) {
                this.previewWindow.postMessage(updateData, "*");
            }
            
            // Optional: Trigger cache refresh on the server
            const token = this.getAuthToken();
            if (token) {
                await fetch(`${this.apiBaseUrl}/api/website-content/refresh/${page}`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }).catch(err => {
                    console.log("Cache refresh endpoint not available:", err.message);
                });
            }
            
            console.log(`✅ Real-time update broadcasted for page: ${page}`);
        } catch (error) {
            console.error("❌ Error updating live website:", error);
        }
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        if (!text) return "";
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    // Log activity with enhanced error handling
    async logActivity(action, description) {
        const startTime = performance.now();
        console.log(`[LOG ACTIVITY] Logging activity - Action: ${action}, Page: ${this.currentPage}`);
        
        try {
            const token = this.getAuthToken();
            if (!token) {
                console.warn(`[LOG ACTIVITY] No auth token found, skipping activity log for: ${action}`);
                return; // Don't throw error for activity logging, just skip
            }
            
            const activityData = {
                action,
                description,
                page: this.currentPage,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent.substring(0, 100) // Truncate for storage
            };
            
            console.log("[LOG ACTIVITY] Activity data:", activityData);
            
            const response = await fetch("/api/activity", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(activityData)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log("[LOG ACTIVITY] Activity logged successfully:", result);
            } else {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (parseError) {
                    errorData = { message: await response.text() };
                }
                
                console.warn("[LOG ACTIVITY] Failed to log activity:", {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorData,
                    action: action,
                    timestamp: new Date().toISOString()
                });
                
                // Don't throw error for activity logging failures
            }
        } catch (error) {
            const logTime = performance.now() - startTime;
            console.warn("[LOG ACTIVITY] Error logging activity:", {
                error: error.message,
                action: action,
                description: description,
                page: this.currentPage,
                logTime: `${logTime.toFixed(2)}ms`,
                timestamp: new Date().toISOString()
            });
            
            // Activity logging failures should not disrupt the main flow
            // Just log the warning and continue
        } finally {
            const totalTime = performance.now() - startTime;
            console.log(`[LOG ACTIVITY] Activity logging completed for ${action} in ${totalTime.toFixed(2)}ms`);
        }
    }

    // Render activity log
    renderActivityLog(activities) {
        const container = document.getElementById("activity-log-container");
        if (!container) return;

        if (!activities || activities.length === 0) {
            container.innerHTML = "<p class=\"no-activity\">No recent activity</p>";
            return;
        }

        const activityHtml = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-${this.getActivityIcon(activity.action)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-description">${activity.description}</div>
                    <div class="activity-meta">
                        <span class="activity-page">${activity.page}</span>
                        <span class="activity-time">${this.formatTime(activity.timestamp)}</span>
                    </div>
                </div>
            </div>
        `).join("");

        container.innerHTML = activityHtml;
    }

    // Get activity icon
    getActivityIcon(action) {
        const icons = {
            "create_section": "plus",
            "update_section": "edit",
            "delete_section": "trash",
            "duplicate_section": "copy",
            "save_section": "save",
            "update_section_settings": "cog",
            "update_section_property": "toggle-on"
        };
        return icons[action] || "info";
    }

    // Load and populate activity table
    async loadActivityTable() {
        try {
            const token = this.getAuthToken();
            if (!token) {
                console.warn("No authentication token found");
                this.populateActivityTable([]);
                return;
            }

            const response = await fetch(`${this.apiBaseUrl}/api/activity`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.warn("Authentication failed for activity log");
                    this.populateActivityTable([]);
                    return;
                }
                throw new Error(`Failed to fetch activity data: ${response.status}`);
            }

            const result = await response.json();
            const activities = result.data?.activities || [];
            this.populateActivityTable(activities);
        } catch (error) {
            console.error("Error loading activity table:", error);
            this.showNotification("Failed to load activity data", "error");
        }
    }

    // Populate activity table with data
    populateActivityTable(activities) {
        const tableBody = document.getElementById("activityTableBody");
        if (!tableBody) return;

        tableBody.innerHTML = "";

        // Ensure activities is an array
        const activityList = Array.isArray(activities) ? activities : [];
        
        if (activityList.length === 0) {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td colspan="7" style="text-align: center; padding: 20px; color: var(--text-secondary);">
                    No recent activities found
                </td>
            `;
            tableBody.appendChild(row);
            return;
        }

        activityList.forEach(activity => {
            const row = document.createElement("tr");
            row.style.background = "var(--bg-secondary)";
            row.style.borderBottom = "1px solid var(--border-secondary)";
            row.style.transition = "all var(--transition-normal)";

            // Format date
            const date = new Date(activity.timestamp).toLocaleString();
            
            // Get action icon and color
            const icon = this.getActivityIcon(activity.action);
            const actionColors = {
            "create_section": "var(--success-color, #10b981)",
            "update_section": "var(--primary-color, #3b82f6)",
            "delete_section": "var(--error-color, #ef4444)",
            "duplicate_section": "var(--purple-color, #8b5cf6)",
            "save_section": "var(--warning-color, #f59e0b)",
            "update_section_settings": "var(--text-secondary, #6b7280)",
            "update_section_property": "var(--info-color, #06b6d4)"
        };
        const actionColor = actionColors[activity.action] || "var(--text-secondary, #6b7280)";

            row.innerHTML = `
                <td style="padding: 1rem; color: var(--text-primary);">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-${icon}" style="color: ${actionColor};"></i>
                        <span style="text-transform: capitalize;">${activity.action.replace("_", " ")}</span>
                    </div>
                </td>
                <td style="padding: 1rem; color: var(--text-primary);">
                    <span class="badge" style="background: var(--glass-bg); color: var(--text-primary); padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.8rem;">
                        ${activity.page}
                    </span>
                </td>
                <td style="padding: 1rem; color: var(--text-primary);">${activity.sectionId || "N/A"}</td>
                <td style="padding: 1rem; color: var(--text-secondary); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${activity.description || "No description"}
                </td>
                <td style="padding: 1rem; color: var(--text-primary);">${activity.user || "Admin"}</td>
                <td style="padding: 1rem; color: var(--text-secondary); font-size: 0.9rem;">${date}</td>
                <td style="padding: 1rem;">
                    <div style="display: flex; gap: 0.5rem;">
                        ${activity.sectionId ? `
                        <button class="btn btn-sm btn-primary" onclick="contentEditor.editActivitySection('${activity.sectionId}', '${activity.page}')" title="Edit Section" style="padding: 0.25rem 0.5rem;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="contentEditor.duplicateActivitySection('${activity.sectionId}', '${activity.page}')" title="Duplicate Section" style="padding: 0.25rem 0.5rem;">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="contentEditor.deleteActivitySection('${activity.sectionId}', '${activity.page}')" title="Delete Section" style="padding: 0.25rem 0.5rem;">
                            <i class="fas fa-trash"></i>
                        </button>
                        ` : `
                        <span style="color: var(--text-secondary); font-style: italic;">No actions available</span>
                        `}
                    </div>
                </td>
            `;

            // Add hover effect
            row.addEventListener("mouseenter", () => {
                row.style.background = "var(--glass-bg)";
                row.style.transform = "translateY(-1px)";
                row.style.boxShadow = "var(--shadow-sm)";
            });

            row.addEventListener("mouseleave", () => {
                row.style.background = "var(--bg-secondary)";
                row.style.transform = "translateY(0)";
                row.style.boxShadow = "none";
            });

            tableBody.appendChild(row);
        });
        
        // Re-initialize table sorting after populating data
        if (window.tableSorter) {
            setTimeout(() => {
                window.tableSorter.initializeSorting();
            }, 100);
        }
    }

    // Edit section - general method for editing sections
    async editSection(sectionId, page) {
        try {
            // Switch to the correct page if provided
            if (page) {
                this.switchContentPage(page);
            }
            
            // Find and highlight the section
            const sectionElement = document.querySelector(`[data-section-id="${sectionId}"]`);
            if (sectionElement) {
                sectionElement.scrollIntoView({ behavior: "smooth", block: "center" });
                sectionElement.style.outline = "2px solid var(--primary-color, #3b82f6)";
                sectionElement.style.outlineOffset = "4px";
                
                // Remove highlight after 3 seconds
                setTimeout(() => {
                    sectionElement.style.outline = "none";
                    sectionElement.style.outlineOffset = "0";
                }, 3000);
                
                this.showNotification("Section highlighted for editing", "success");
            } else {
                this.showNotification("Section not found", "error");
            }
        } catch (error) {
            console.error("Error editing section:", error);
            this.showNotification("Failed to edit section", "error");
        }
    }

    // Edit section from activity table
    async editActivitySection(sectionId, page) {
        try {
            // Switch to the correct page
            this.switchContentPage(page);
            
            // Find and highlight the section
            const sectionElement = document.querySelector(`[data-section-id="${sectionId}"]`);
            if (sectionElement) {
                sectionElement.scrollIntoView({ behavior: "smooth", block: "center" });
                sectionElement.style.outline = "2px solid var(--primary-color, #3b82f6)";
                sectionElement.style.outlineOffset = "4px";
                
                // Remove highlight after 3 seconds
                setTimeout(() => {
                    sectionElement.style.outline = "none";
                    sectionElement.style.outlineOffset = "0";
                }, 3000);
                
                this.showNotification("Section highlighted for editing", "success");
            } else {
                this.showNotification("Section not found", "error");
            }
        } catch (error) {
            console.error("Error editing section:", error);
            this.showNotification("Failed to edit section", "error");
        }
    }

    // Duplicate section from activity table
    async duplicateActivitySection(sectionId, page) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/website-content/sections/${page}/${sectionId}`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch section data");
            }

            const sectionData = await response.json();
            
            // Create duplicate with modified title
            const duplicateData = {
                ...sectionData,
                title: `${sectionData.title} (Copy)`,
                titleTamil: sectionData.titleTamil ? `${sectionData.titleTamil} (Copy)` : "",
                _id: undefined // Remove ID to create new section
            };

            const duplicateResponse = await fetch(`${this.apiBaseUrl}/api/content/pages/${page}/sections`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
                },
                body: JSON.stringify(duplicateData)
            });

            if (!duplicateResponse.ok) {
                throw new Error("Failed to duplicate section");
            }

            // Log activity
            await this.logActivity("duplicate_section", page, sectionId, `Duplicated section: ${sectionData.title}`);
            
            // Reload page content
            await this.loadPageContent(page);
            
            // Refresh activity table
            await this.loadActivityTable();
            
            this.showNotification("Section duplicated successfully", "success");
        } catch (error) {
            console.error("Error duplicating section:", error);
            this.showNotification("Failed to duplicate section", "error");
        }
    }

    // Delete section from activity table
    async deleteActivitySection(sectionId, page) {
        const startTime = performance.now();
        const deletionId = `activity_delete_${Date.now()}`;
        console.log(`[DELETE ACTIVITY SECTION] Starting section deletion from activity - ID: ${deletionId}, Section: ${sectionId}, Page: ${page}`);
        
        try {
            // Validate inputs
            if (!sectionId) {
                throw new Error("Section ID is required");
            }
            
            if (!page) {
                throw new Error("Page is required");
            }
            
            console.log("[DELETE ACTIVITY SECTION] Validated inputs:", {
                sectionId,
                page,
                timestamp: new Date().toISOString()
            });
            
            // Confirm deletion with user
            if (!confirm("Are you sure you want to delete this section? This action cannot be undone.")) {
                console.log(`[DELETE ACTIVITY SECTION] User cancelled deletion for ${sectionId}`);
                return false;
            }
            
            // Get and validate auth token
            const token = this.getAuthToken() || localStorage.getItem("adminToken");
            if (!token) {
                throw new Error("Authentication token not found. Please log in again.");
            }
            
            console.log(`[DELETE ACTIVITY SECTION] Authentication validated, making API request for ${deletionId}`);
            
            // Show deletion progress
            this.showNotification("Deleting section...", "info");
            
            // Enhanced fetch with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                console.error(`[DELETE ACTIVITY SECTION] Request timeout for ${deletionId}`);
            }, 30000); // 30 second timeout
            
            const response = await fetch(`${this.apiBaseUrl}/api/website-content/sections/${page}/${sectionId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log(`[DELETE ACTIVITY SECTION] API response - Status: ${response.status}, OK: ${response.ok}`);

            if (response.ok) {
                console.log("[DELETE ACTIVITY SECTION] Section deleted successfully:", {
                    sectionId,
                    page,
                    timestamp: new Date().toISOString()
                });
                
                this.showNotification("Section deleted successfully", "success");
                
                // Log activity with error handling
                try {
                    await this.logActivity("delete_section", `Section deleted from activity table - Page: ${page}, ID: ${sectionId}`);
                    console.log(`[DELETE ACTIVITY SECTION] Activity logged for ${deletionId}`);
                } catch (logError) {
                    console.error("[DELETE ACTIVITY SECTION] Failed to log activity:", {
                        error: logError.message,
                        deletionId,
                        timestamp: new Date().toISOString()
                    });
                    // Don't show error to user for logging failures
                }
                
                // Reload page content with error handling
                try {
                    await this.loadPageContent(page);
                    console.log(`[DELETE ACTIVITY SECTION] Page content reloaded for ${page}`);
                } catch (reloadError) {
                    console.error("[DELETE ACTIVITY SECTION] Failed to reload page content:", {
                        error: reloadError.message,
                        page,
                        deletionId
                    });
                    this.showNotification("Section deleted but failed to refresh page content. Please refresh manually.", "warning");
                }
                
                // Refresh activity table with error handling
                try {
                    await this.loadActivityTable();
                    console.log("[DELETE ACTIVITY SECTION] Activity table refreshed");
                } catch (activityError) {
                    console.error("[DELETE ACTIVITY SECTION] Failed to refresh activity table:", {
                        error: activityError.message,
                        deletionId,
                        timestamp: new Date().toISOString()
                    });
                    // Don't show error to user for activity table refresh failures
                }
                
                // Update live website with error handling
                try {
                    await this.updateLiveWebsite(page);
                    console.log(`[DELETE ACTIVITY SECTION] Live website updated for ${page}`);
                } catch (updateError) {
                    console.error("[DELETE ACTIVITY SECTION] Failed to update live website:", {
                        error: updateError.message,
                        page,
                        deletionId,
                        timestamp: new Date().toISOString()
                    });
                    // Don't show error to user for live website update failures
                }
                
                return true;
            } else {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (parseError) {
                    errorData = { message: await response.text() };
                }
                
                console.error("[DELETE ACTIVITY SECTION] Section deletion failed:", {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorData,
                    sectionId,
                    page,
                    timestamp: new Date().toISOString()
                });
                
                // Handle specific error cases
                if (response.status === 404) {
                    this.showNotification("Section not found. It may have already been deleted.", "warning");
                    // Still try to refresh the page and activity table
                    await this.loadPageContent(page).catch(() => {});
                    await this.loadActivityTable().catch(() => {});
                    return true;
                } else if (response.status === 401) {
                    throw new Error("Authentication expired. Please log in again.");
                } else if (response.status === 403) {
                    throw new Error("Access denied. You may not have permission to delete sections.");
                } else if (response.status >= 500) {
                    throw new Error("Server error occurred. Please try again later.");
                } else {
                    throw new Error(errorData.message || `Failed to delete section: ${response.statusText}`);
                }
            }
        } catch (error) {
            const deletionTime = performance.now() - startTime;
            console.error(`[DELETE ACTIVITY SECTION] Error deleting section ${deletionId}:`, {
                error: error.message,
                stack: error.stack,
                sectionId,
                page,
                deletionTime: `${deletionTime.toFixed(2)}ms`,
                timestamp: new Date().toISOString()
            });
            
            // Handle different error types with specific user feedback
            if (error.name === "AbortError") {
                this.showNotification("Section deletion timed out. Please try again.", "error");
            } else if (error.message.includes("Authentication")) {
                this.showNotification("Authentication error. Please log in again.", "error");
            } else if (error.message.includes("NetworkError") || error.message.includes("Failed to fetch")) {
                this.showNotification("Network error. Please check your connection and try again.", "error");
            } else {
                const errorMessage = error.message || "Failed to delete section. Please try again.";
                this.showNotification(errorMessage, "error");
            }
            
            return false;
        } finally {
            const totalTime = performance.now() - startTime;
            console.log(`[DELETE ACTIVITY SECTION] Section deletion process completed for ${deletionId} in ${totalTime.toFixed(2)}ms`);
        }
    }

    // Setup activity table filters and search
    setupActivityTableFilters() {
        const searchInput = document.getElementById("activitySearch");
        const typeFilter = document.getElementById("activityTypeFilter");
        const pageFilter = document.getElementById("activityPageFilter");
        const refreshBtn = document.getElementById("refreshActivityBtn");

        if (searchInput) {
            searchInput.addEventListener("input", () => this.filterActivityTable());
        }

        if (typeFilter) {
            typeFilter.addEventListener("change", () => this.filterActivityTable());
        }

        if (pageFilter) {
            pageFilter.addEventListener("change", () => this.filterActivityTable());
        }

        if (refreshBtn) {
            refreshBtn.addEventListener("click", () => this.loadActivityTable());
        }
    }

    // Filter activity table based on search and filters
    filterActivityTable() {
        const searchTerm = document.getElementById("activitySearch")?.value.toLowerCase() || "";
        const typeFilter = document.getElementById("activityTypeFilter")?.value || "";
        const pageFilter = document.getElementById("activityPageFilter")?.value || "";
        const tableBody = document.getElementById("activityTableBody");

        if (!tableBody) return;

        const rows = tableBody.querySelectorAll("tr");
        
        rows.forEach(row => {
            const cells = row.querySelectorAll("td");
            if (cells.length < 6) return;

            const action = cells[0].textContent.toLowerCase();
            const page = cells[1].textContent.toLowerCase();
            const section = cells[2].textContent.toLowerCase();
            const description = cells[3].textContent.toLowerCase();
            const user = cells[4].textContent.toLowerCase();

            const matchesSearch = !searchTerm || 
                action.includes(searchTerm) || 
                page.includes(searchTerm) || 
                section.includes(searchTerm) || 
                description.includes(searchTerm) || 
                user.includes(searchTerm);

            const matchesType = !typeFilter || action.includes(typeFilter.toLowerCase());
            const matchesPage = !pageFilter || page.includes(pageFilter.toLowerCase());

            if (matchesSearch && matchesType && matchesPage) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        });
    }

    // Format time
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // Less than 1 minute
            return "Just now";
        } else if (diff < 3600000) { // Less than 1 hour
            return `${Math.floor(diff / 60000)} minutes ago`;
        } else if (diff < 86400000) { // Less than 1 day
            return `${Math.floor(diff / 3600000)} hours ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // Show/hide loading indicator
    showLoading(show = true) {
        const loadingElement = document.getElementById("loadingIndicator");
        if (loadingElement) {
            loadingElement.style.display = show ? "flex" : "none";
        } else if (show) {
            // Create loading indicator if it doesn't exist
            const loading = document.createElement("div");
            loading.id = "loadingIndicator";
            loading.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: var(--overlay-dark);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                backdrop-filter: blur(3px);
            `;
            loading.innerHTML = `
                <div style="
                    background: var(--bg-secondary, #ffffff);
                    color: var(--text-primary, #333333);
                    padding: 2rem;
                    border-radius: 1rem;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                    text-align: center;
                    min-width: 200px;
                ">
                    <div style="
                        width: 40px;
                        height: 40px;
                        border: 4px solid var(--border-secondary);
            border-top: 4px solid var(--border-accent);
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 1rem;
                    "></div>
                    <p style="margin: 0; color: var(--text-primary); font-weight: 600;">Loading...</p>
                </div>
            `;
            document.body.appendChild(loading);
        }
    }

    // Show notification
    showNotification(message, type = "info") {
        if (typeof window.showNotification === "function") {
            window.showNotification(message, type);
        } else if (typeof showNotification === "function") {
            showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
            // Create a simple notification if no notification system exists
            this.createSimpleNotification(message, type);
        }
    }
    
    // Create simple notification fallback
    createSimpleNotification(message, type = "info") {
        const notification = document.createElement("div");
        notification.className = `simple-notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
            animation: slideInRight 0.3s ease-out;
            background: ${type === "error" ? "var(--error-color, #ef4444)" : type === "success" ? "var(--success-color, #10b981)" : type === "warning" ? "var(--warning-color, #f59e0b)" : "var(--primary-color, #3b82f6)"};
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = "slideOutRight 0.3s ease-in";
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
        
        // Add CSS animation if not exists
        if (!document.getElementById("notification-styles")) {
            const style = document.createElement("style");
            style.id = "notification-styles";
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Add navigation item functionality
    addNavigationItem(button) {
        const container = button.closest(".form-group")?.querySelector(".nav-items-container");
        if (!container) return;
        
        const index = container.children.length;
        
        const navItemHtml = `
            <div class="nav-item-editor" data-index="${index}">
                <div class="row">
                    <div class="col-md-3">
                        <input type="text" name="nav_text_${index}" class="form-control" placeholder="Text" value="">
                    </div>
                    <div class="col-md-3">
                        <input type="text" name="nav_text_tamil_${index}" class="form-control" placeholder="Tamil Text" value="">
                    </div>
                    <div class="col-md-3">
                        <input type="text" name="nav_url_${index}" class="form-control" placeholder="URL" value="">
                    </div>
                    <div class="col-md-2">
                        <select name="nav_active_${index}" class="form-control">
                            <option value="true" selected>Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>
                    <div class="col-md-1">
                        <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.nav-item-editor').remove()">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML("beforeend", navItemHtml);
        this.markUnsavedChanges();
    }

    // Icon selection functionality
    selectIcon(previewElement, fieldName) {
        const iconModal = this.createIconModal();
        document.body.appendChild(iconModal);
        
        // Handle icon selection
        iconModal.addEventListener("click", (e) => {
            if (e.target.classList.contains("icon-option")) {
                const iconClass = e.target.dataset.icon;
                previewElement.innerHTML = `<i class="${iconClass}"></i>`;
                
                // Update hidden input
                const hiddenInput = previewElement.parentElement?.querySelector("input[type=\"hidden\"]");
                if (hiddenInput) {
                    hiddenInput.value = iconClass;
                }
                
                this.markUnsavedChanges();
                document.body.removeChild(iconModal);
            } else if (e.target.classList.contains("close-modal") || e.target === iconModal) {
                document.body.removeChild(iconModal);
            }
        });
    }

    // Create icon selection modal with theme integration
    createIconModal() {
        const modal = document.createElement("div");
        modal.className = "icon-modal";
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--overlay-dark);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        
        const icons = [
            "fas fa-home", "fas fa-user", "fas fa-envelope", "fas fa-phone",
            "fas fa-book", "fas fa-star", "fas fa-heart", "fas fa-check",
            "fas fa-info", "fas fa-cog", "fas fa-search", "fas fa-download",
            "fas fa-upload", "fas fa-edit", "fas fa-trash", "fas fa-plus",
            "fas fa-minus", "fas fa-arrow-right", "fas fa-arrow-left", "fas fa-arrow-up",
            "fas fa-arrow-down", "fas fa-globe", "fas fa-map-marker-alt", "fas fa-calendar",
            "fas fa-clock", "fas fa-image", "fas fa-video", "fas fa-music",
            "fas fa-file", "fas fa-folder", "fas fa-link", "fas fa-share"
        ];
        
        const iconGrid = icons.map(icon => 
            `<div class="icon-option" data-icon="${icon}" style="
                padding: 1rem;
                border: 1px solid var(--border-secondary);
                border-radius: 0.5rem;
                cursor: pointer;
                text-align: center;
                background: var(--bg-tertiary);
                color: var(--text-primary);
                transition: all var(--transition-fast);
                aspect-ratio: 1;
                display: flex;
                align-items: center;
                justify-content: center;
            " onmouseover="this.style.background='var(--bg-accent)'; this.style.borderColor='var(--border-accent)'; this.style.color='var(--text-inverse)'; this.style.transform='scale(1.05)';" onmouseout="this.style.background='var(--bg-tertiary)'; this.style.borderColor='var(--border-secondary)'; this.style.color='var(--text-primary)'; this.style.transform='scale(1)';">
                <i class="${icon}" style="font-size: 1.25rem;"></i>
            </div>`
        ).join("");
        
        modal.innerHTML = `
            <div style="
                background: var(--glass-bg);
                backdrop-filter: blur(20px);
                border: 1px solid var(--glass-border);
                border-radius: 1rem;
                padding: 0;
                max-width: 600px;
                width: 90vw;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: var(--glass-shadow);
                animation: slideInFromTop 0.3s ease;
            ">
                <div style="
                    background: var(--website-content-header-bg);
                    padding: 1.5rem 2rem;
                    border-bottom: 1px solid var(--border-secondary);
                    border-radius: 1rem 1rem 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <h3 style="margin: 0; color: var(--text-primary); font-size: 1.5rem; font-weight: 600;">Select Icon</h3>
                    <button class="close-modal" style="
                        background: none;
                        border: none;
                        color: var(--text-primary);
                        font-size: 1.5rem;
                        cursor: pointer;
                        padding: 0.5rem;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all var(--transition-fast);
                    " onmouseover="this.style.background='var(--bg-tertiary)'" onmouseout="this.style.background='none'">×</button>
                </div>
                <div style="
                    padding: 2rem;
                    background: var(--bg-secondary);
                    border-radius: 0 0 1rem 1rem;
                ">
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
                        gap: 1rem;
                        max-height: 400px;
                        overflow-y: auto;
                    ">
                        ${iconGrid}
                    </div>
                </div>
            </div>
        `;
        
        return modal;
    }

    // Enhanced image upload with validation
    async uploadImageWithValidation(file, type = "image", sectionElement = null) {
        const startTime = performance.now();
        const fileId = `${file.name}_${Date.now()}`;
        console.log(`[UPLOAD IMAGE] Starting upload - File: ${file.name}, Type: ${type}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB, ID: ${fileId}`);
        
        try {
            // Enhanced file validation
            if (!file) {
                throw new Error("No file selected");
            }
            
            console.log("[UPLOAD IMAGE] File details:", {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: new Date(file.lastModified).toISOString(),
                uploadType: type
            });
            
            // Validate file size with detailed feedback
            const maxSize = type === "logo" ? 2 * 1024 * 1024 : 5 * 1024 * 1024; // 2MB for logos, 5MB for images
            if (file.size > maxSize) {
                const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
                const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0);
                throw new Error(`File size (${fileSizeMB}MB) exceeds the ${maxSizeMB}MB limit for ${type} uploads`);
            }
            
            // Validate file type with detailed feedback
            const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
            if (!allowedTypes.includes(file.type)) {
                throw new Error(`File type '${file.type}' is not supported. Only JPEG, PNG, GIF, WebP, and SVG images are allowed`);
            }
            
            // Get auth token with validation
            const token = this.getAuthToken();
            if (!token) {
                throw new Error("Authentication token not found. Please log in again.");
            }
            
            console.log(`[UPLOAD IMAGE] Validation passed, preparing upload for ${fileId}`);
            
            // Show upload progress notification
            this.showNotification(`Uploading ${file.name}...`, "info");

            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", type);
            formData.append("uploadId", fileId); // Add unique ID for tracking
            
            console.log("[UPLOAD IMAGE] Making upload request to /api/upload");
            
            // Enhanced fetch with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                console.error(`[UPLOAD IMAGE] Upload timeout for ${fileId}`);
            }, 60000); // 60 second timeout for uploads

            const response = await fetch("/api/upload", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log(`[UPLOAD IMAGE] Upload response - Status: ${response.status}, OK: ${response.ok}`);

            if (response.ok) {
                const result = await response.json();
                console.log(`[UPLOAD IMAGE] Upload successful for ${fileId}:`, {
                    url: result.url || result.path,
                    originalName: file.name,
                    uploadedSize: file.size,
                    timestamp: new Date().toISOString()
                });
                
                // Mark section as having unsaved changes
                if (sectionElement) {
                    this.markUnsavedChanges(sectionElement);
                    console.log(`[UPLOAD IMAGE] Marked section as unsaved for ${fileId}`);
                }
                
                this.showNotification(`${file.name} uploaded successfully!`, "success");
                return result.url || result.path;
            } else {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (parseError) {
                    errorData = { message: await response.text() };
                }
                
                console.error(`[UPLOAD IMAGE] Upload failed for ${fileId}:`, {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorData,
                    fileName: file.name,
                    fileSize: file.size,
                    timestamp: new Date().toISOString()
                });
                
                // Handle specific upload errors
                if (response.status === 413) {
                    throw new Error("File too large. Please choose a smaller image.");
                } else if (response.status === 415) {
                    throw new Error("Unsupported file type. Please use JPEG, PNG, GIF, WebP, or SVG.");
                } else if (response.status === 401) {
                    throw new Error("Authentication expired. Please log in again.");
                } else if (response.status === 403) {
                    throw new Error("Access denied. You may not have permission to upload files.");
                } else if (response.status >= 500) {
                    throw new Error("Server error occurred during upload. Please try again later.");
                } else {
                    throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
                }
            }
        } catch (error) {
            const uploadTime = performance.now() - startTime;
            console.error(`[UPLOAD IMAGE] Error uploading image ${fileId}:`, {
                error: error.message,
                stack: error.stack,
                fileName: file?.name,
                fileSize: file?.size,
                fileType: file?.type,
                uploadType: type,
                uploadTime: `${uploadTime.toFixed(2)}ms`,
                timestamp: new Date().toISOString()
            });
            
            // Handle different error types with specific user feedback
            if (error.name === "AbortError") {
                this.showNotification("Upload timed out. Please try again with a smaller file.", "error");
            } else if (error.message.includes("Authentication")) {
                this.showNotification("Authentication error. Please log in again.", "error");
            } else if (error.message.includes("NetworkError") || error.message.includes("Failed to fetch")) {
                this.showNotification("Network error during upload. Please check your connection and try again.", "error");
            } else {
                this.showNotification(error.message || "Error uploading image", "error");
            }
            
            return null;
        } finally {
            const totalTime = performance.now() - startTime;
            console.log(`[UPLOAD IMAGE] Upload process completed for ${fileId} in ${totalTime.toFixed(2)}ms`);
        }
    }

    // Drag and drop handlers for enhanced image upload
    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "copy";
    }

    handleDragEnter(event) {
        event.preventDefault();
        event.stopPropagation();
        event.target.style.borderColor = "var(--border-accent)";
        event.target.style.backgroundColor = "var(--bg-hover, #eff6ff)";
    }

    handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        event.target.style.borderColor = "var(--border-secondary)";
        event.target.style.backgroundColor = "var(--bg-secondary, #f9f9f9)";
    }

    async handleImageDrop(event, sectionKey) {
        event.preventDefault();
        event.stopPropagation();
        
        // Reset visual feedback
        event.target.style.borderColor = "var(--border-secondary)";
        event.target.style.backgroundColor = "var(--bg-secondary, #f9f9f9)";
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            await this.processImageUpload(file, sectionKey, event.target);
        }
    }

    async handleFileSelect(event, sectionKey) {
        const file = event.target.files[0];
        if (file) {
            const container = event.target.parentElement.querySelector(".image-upload-container");
            await this.processImageUpload(file, sectionKey, container);
        }
    }

    async processImageUpload(file, sectionKey, containerElement) {
        try {
            // Show loading state
            const originalContent = containerElement.innerHTML;
            containerElement.innerHTML = "<div class=\"image-upload-text\"><i class=\"fas fa-spinner fa-spin\" style=\"font-size: 2em; color: var(--text-tertiary);\"></i><br>Uploading...</div>";
            
            // Upload the image
            const imageUrl = await this.uploadImageWithValidation(file, "image", containerElement.closest(".section-editor"));
            
            if (imageUrl) {
                // Update the preview
                containerElement.innerHTML = `<img src="${imageUrl}" alt="Uploaded Image" style="max-width: 100%; max-height: 200px; border-radius: 4px;">`;
                
                // Update the hidden input
                const hiddenInput = containerElement.parentElement.querySelector("input[type=\"hidden\"]");
                if (hiddenInput) {
                    hiddenInput.value = imageUrl;
                }
                
                // Mark as changed
                this.markUnsavedChanges();
                this.showNotification("Image uploaded successfully", "success");
            } else {
                // Restore original content on failure
                containerElement.innerHTML = originalContent;
            }
        } catch (error) {
            console.error("Error processing image upload:", error);
            this.showNotification("Error uploading image", "error");
            
            // Restore original content
            const originalContent = "<div class=\"image-upload-text\"><i class=\"fas fa-cloud-upload-alt\" style=\"font-size: 2em; color: var(--text-tertiary); margin-bottom: 10px;\"></i><br>Drag & drop an image here or click to browse<br><small style=\"color: var(--text-secondary);\">Supported: JPG, PNG, GIF, WebP (Max: 5MB)</small></div>";
            containerElement.innerHTML = originalContent;
        }
    }

    // Real-time preview functionality
    enableRealTimePreview() {
        // Add event listeners for real-time preview updates
        document.addEventListener("input", (e) => {
            if (e.target.closest(".content-editor-container")) {
                this.debounce(() => {
                    this.updatePreview();
                }, 500)();
            }
        });
    }

    // Debounce utility function
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

    // Update preview with real-time changes
    updatePreview() {
        if (this.previewWindow && !this.previewWindow.closed) {
            // Send updated content to preview window
            const activePage = this.getCurrentPage();
            const pageContent = this.getPageContent(activePage);
            
            this.previewWindow.postMessage({
                type: "CONTENT_UPDATE",
                page: activePage,
                content: pageContent,
                timestamp: Date.now()
            }, "*");
            
            console.log("Preview updated for page:", activePage);
        }
    }
    
    // Get current page being edited
    getCurrentPage() {
        const activeEditor = document.querySelector(".page-content-editor:not([style*=\"display: none\"])");
        if (activeEditor) {
            const editorId = activeEditor.id;
            return editorId.replace("content-editor-", "");
        }
        return "home";
    }
    
    // Get page content for preview
    getPageContent(page) {
        const content = {};
        const pageEditor = document.getElementById(`content-editor-${page}`);
        
        if (pageEditor) {
            // Collect all form inputs and textareas
            const inputs = pageEditor.querySelectorAll("input, textarea, select");
            inputs.forEach(input => {
                if (input.name || input.id) {
                    const key = input.name || input.id;
                    content[key] = input.value;
                }
            });
            
            // Collect WYSIWYG editor content
            const wysiwygEditors = pageEditor.querySelectorAll(".wysiwyg-editor");
            wysiwygEditors.forEach(editor => {
                if (window.tinymce && window.tinymce.get(editor.id)) {
                    const key = editor.name || editor.id;
                    content[key] = window.tinymce.get(editor.id).getContent();
                }
            });
        }
        
        return content;
    }
    
    // Open live preview window
    openLivePreview() {
        const previewPage = this.getCurrentPage();
        let previewUrl = this.getPreviewUrl(previewPage);
        previewUrl += "?live_preview=true";
        
        // Close existing preview window if open
        if (this.previewWindow && !this.previewWindow.closed) {
            this.previewWindow.close();
        }
        
        // Open new preview window
        this.previewWindow = window.open(
            previewUrl, 
            "live-preview", 
            "width=1400,height=900,scrollbars=yes,resizable=yes,toolbar=no,menubar=no"
        );
    }
    
    // Preview page changes in a new window
    previewPageChanges(page) {
        try {
            console.log(`[PREVIEW] Opening preview for page: ${page}`);
            
            // Get the preview URL for the page
            let previewUrl = this.getPreviewUrl(page);
            
            // Add preview parameter to indicate this is a preview
            previewUrl += previewUrl.includes('?') ? '&preview=true' : '?preview=true';
            
            // Open preview in new tab/window
            const previewWindow = window.open(
                previewUrl,
                `preview-${page}`,
                'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=yes,menubar=yes'
            );
            
            if (previewWindow) {
                previewWindow.focus();
                showNotification(`Preview opened for ${page} page`, 'success');
            } else {
                showNotification('Please allow popups to open preview', 'warning');
            }
        } catch (error) {
            console.error('[PREVIEW] Error opening preview:', error);
            showNotification('Error opening preview: ' + error.message, 'error');
        }
        
        if (this.previewWindow) {
            // Initialize live preview mode
            this.livePreviewMode = true;
            this.updatePreviewModeUI(true);
            
            // Setup preview window communication
            this.previewWindow.addEventListener("load", () => {
                this.initializePreviewWindow();
            });
            
            // Handle window close
            const checkClosed = setInterval(() => {
                if (this.previewWindow.closed) {
                    this.livePreviewMode = false;
                    this.updatePreviewModeUI(false);
                    clearInterval(checkClosed);
                }
            }, 1000);
            
            this.showNotification("Live preview opened! Changes will update automatically.", "success");
        } else {
            this.showNotification("Please allow popups to use live preview", "warning");
        }
    }
    
    // Get preview URL for page
    getPreviewUrl(page) {
        const baseUrl = window.location.origin;
        switch(page) {
            case "global":
            case "home":
                return `${baseUrl}/index.html`;
            case "about":
                return `${baseUrl}/about.html`;
            case "contact":
                return `${baseUrl}/contact.html`;
            case "books":
                return `${baseUrl}/books.html`;
            case "ebooks":
                return `${baseUrl}/ebooks.html`;
            case "projects":
                return `${baseUrl}/projects.html`;
            case "login":
                return `${baseUrl}/login.html`;
            default:
                return `${baseUrl}/index.html`;
        }
    }
    
    // Initialize preview window with live update capabilities
    initializePreviewWindow() {
        if (!this.previewWindow || this.previewWindow.closed) return;
        
        try {
            const doc = this.previewWindow.document;
            
            // Add live preview indicator
            const indicator = doc.createElement("div");
            indicator.id = "live-preview-indicator";
            indicator.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div class="pulse-dot" style="width: 8px; height: 8px; background: var(--success-color, #10b981); border-radius: 50%; animation: pulse 2s infinite;"></div>
                    <span>Live Preview Mode</span>
                    <button onclick="window.close()" style="background: none; border: none; color: white; cursor: pointer; padding: 4px 8px; border-radius: 4px; background: rgba(255,255,255,0.2);">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, var(--success-color, #10b981), var(--success-dark, #059669));
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                z-index: 10000;
                font-family: Arial, sans-serif;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                animation: slideInRight 0.3s ease-out;
            `;
            
            // Add CSS animations
            const style = doc.createElement("style");
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .content-updating {
                    transition: all 0.3s ease;
                    opacity: 0.7;
                }
            `;
            
            doc.head.appendChild(style);
            doc.body.appendChild(indicator);
            
            // Setup message listener for content updates
            this.previewWindow.addEventListener("message", (event) => {
                if (event.data && event.data.type === "CONTENT_UPDATE") {
                    this.handlePreviewContentUpdate(event.data);
                }
            });
            
        } catch (error) {
            console.error("Error initializing preview window:", error);
        }
    }
    
    // Handle content updates in preview window
    handlePreviewContentUpdate(data) {
        if (!this.previewWindow || this.previewWindow.closed) return;
        
        try {
            const doc = this.previewWindow.document;
            const { page, content } = data;
            
            // Add updating indicator
            doc.body.classList.add("content-updating");
            
            // Update content based on page and content keys
            Object.keys(content).forEach(key => {
                const value = content[key];
                if (!value) return;
                
                // Find elements with data-content attribute matching the key
                const elements = doc.querySelectorAll(`[data-content="${key}"]`);
                elements.forEach(element => {
                    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
                        element.value = value;
                    } else {
                        element.innerHTML = value;
                    }
                });
                
                // Also try to find elements by common patterns
                this.updateElementsByPattern(doc, key, value);
            });
            
            // Remove updating indicator after a short delay
            setTimeout(() => {
                doc.body.classList.remove("content-updating");
            }, 300);
            
        } catch (error) {
            console.error("Error updating preview content:", error);
        }
    }
    
    // Update elements by common naming patterns
    updateElementsByPattern(doc, key, value) {
        // Common selectors based on key patterns
        const selectors = [
            `#${key}`,
            `.${key}`,
            `[name="${key}"]`,
            `[id*="${key}"]`,
            `[class*="${key}"]`
        ];
        
        selectors.forEach(selector => {
            try {
                const elements = doc.querySelectorAll(selector);
                elements.forEach(element => {
                    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
                        element.value = value;
                    } else {
                        element.innerHTML = value;
                    }
                });
            } catch (e) {
                // Ignore invalid selectors
            }
        });
    }
    
    // Preview specific page changes
    previewPageChanges(page) {
        const previewUrl = this.getPreviewUrl(page) + `?preview=true&page=${page}`;
        window.open(previewUrl, `preview-${page}`, "width=1200,height=800,scrollbars=yes,resizable=yes");
        this.showNotification(`Previewing ${page} page`, "info");
    }
    
    // Toggle live preview mode
    toggleLivePreviewMode() {
        if (this.livePreviewMode && this.previewWindow && !this.previewWindow.closed) {
            // Close live preview
            this.previewWindow.close();
            this.livePreviewMode = false;
            this.updatePreviewModeUI(false);
            this.showNotification("Live preview mode disabled", "info");
        } else {
            // Open live preview
            this.openLivePreview();
        }
    }
    
    // Update UI to reflect preview mode status
    updatePreviewModeUI(isActive) {
        const previewButtons = document.querySelectorAll("[onclick*=\"previewWebsite\"], [onclick*=\"toggleLivePreview\"]");
        previewButtons.forEach(button => {
            if (isActive) {
                button.style.background = "linear-gradient(135deg, var(--success-color, #10b981), var(--success-dark, #059669))";
                button.innerHTML = "<i class=\"fas fa-eye-slash\"></i> Close Live Preview";
            } else {
                button.style.background = "linear-gradient(135deg, var(--warning-color, #f59e0b), var(--warning-dark, #f97316))";
                button.innerHTML = "<i class=\"fas fa-eye\"></i> Preview Website";
            }
        });
    }

    // Preview specific section functionality
    previewSection(page, sectionKey) {
        try {
            // Get the section data
            const section = this.sections.get(sectionKey);
            if (!section) {
                // Try to find in sections array if stored differently
                const sectionsArray = Array.from(this.sections.values());
                const foundSection = sectionsArray.find(s => s.sectionKey === sectionKey || s.id === sectionKey);
                if (!foundSection) {
                    this.showNotification("Section not found", "error");
                    return;
                }
            }
            
            if (!section) {
                this.showNotification("Section not found", "error");
                return;
            }

            // Create preview URL with section highlight
            const baseUrl = window.location.origin;
            let previewUrl;
            
            // Determine the correct page URL
            switch(page) {
                case "global":
                    previewUrl = `${baseUrl}/index.html`;
                    break;
                case "home":
                    previewUrl = `${baseUrl}/index.html`;
                    break;
                case "about":
                    previewUrl = `${baseUrl}/about.html`;
                    break;
                case "contact":
                    previewUrl = `${baseUrl}/contact.html`;
                    break;
                case "books":
                    previewUrl = `${baseUrl}/books.html`;
                    break;
                case "ebooks":
                    previewUrl = `${baseUrl}/ebooks.html`;
                    break;
                case "projects":
                    previewUrl = `${baseUrl}/projects.html`;
                    break;
                case "login":
                    previewUrl = `${baseUrl}/login.html`;
                    break;
                default:
                    previewUrl = `${baseUrl}/index.html`;
            }
            
            // Add section identifier to URL for highlighting
            previewUrl += `?preview=true&section=${sectionKey}&page=${page}`;
            
            // Open preview in new window
            const previewWindow = window.open(previewUrl, "section-preview", "width=1200,height=800,scrollbars=yes,resizable=yes");
            
            if (previewWindow) {
                // Add highlighting script when window loads
                previewWindow.addEventListener("load", () => {
                    this.highlightSectionInPreview(previewWindow, sectionKey, section);
                });
                
                this.showNotification(`Previewing ${section.title?.en || sectionKey} section`, "info");
            } else {
                this.showNotification("Please allow popups to preview sections", "warning");
            }
            
        } catch (error) {
            console.error("Error previewing section:", error);
            this.showNotification("Error opening section preview", "error");
        }
    }

    // Highlight section in preview window
    highlightSectionInPreview(previewWindow, sectionKey, sectionData) {
        try {
            const doc = previewWindow.document;
            
            // Create and inject highlighting script
            const script = doc.createElement("script");
            script.textContent = `
                (function() {
                    // Add preview mode indicator
                    const indicator = document.createElement('div');
                    indicator.innerHTML = '<i class="fas fa-eye"></i> Preview Mode: Highlighting ${sectionData.title?.en || sectionKey}';
                    indicator.style.cssText = \`
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: var(--bg-accent);
                        color: white;
                        padding: 12px 20px;
                        border-radius: 8px;
                        z-index: 10000;
                        font-family: Arial, sans-serif;
                        font-size: 14px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                        animation: slideIn 0.3s ease-out;
                    \`;
                    
                    const style = document.createElement('style');
                    style.textContent = \`
                        @keyframes slideIn {
                            from { transform: translateX(100%); opacity: 0; }
                            to { transform: translateX(0); opacity: 1; }
                        }
                        .section-highlight {
                            outline: 3px solid var(--primary-color, #3b82f6) !important;
                            outline-offset: 2px !important;
                            background: rgba(59, 130, 246, 0.1) !important;
                            position: relative !important;
                        }
                        .section-highlight::before {
                            content: '\${sectionData.title?.en || sectionKey}';
                            position: absolute;
                            top: -30px;
                            left: 0;
                            background: var(--bg-accent);
                            color: white;
                            padding: 4px 8px;
                            border-radius: 4px;
                            font-size: 12px;
                            font-weight: bold;
                            z-index: 1000;
                        }
                    \`;
                    
                    document.head.appendChild(style);
                    document.body.appendChild(indicator);
                    
                    // Try to find and highlight the section
                    setTimeout(() => {
                        // Look for elements that might represent this section
                        const possibleSelectors = [
                            '[data-section="' + sectionKey + '"]',
                            '[data-section-key="' + sectionKey + '"]',
                            '#' + sectionKey,
                            '.' + sectionKey,
                            '[id*="' + sectionKey + '"]',
                            '[class*="' + sectionKey + '"]'
                        ];
                        
                        let targetElement = null;
                        for (const selector of possibleSelectors) {
                            try {
                                targetElement = document.querySelector(selector);
                                if (targetElement) break;
                            } catch (e) {
                                // Invalid selector, continue
                            }
                        }
                        
                        if (targetElement) {
                            targetElement.classList.add('section-highlight');
                            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        } else {
                            // If no specific element found, highlight based on content
                            const allElements = document.querySelectorAll('section, div, article, header, footer, nav');
                            for (const element of allElements) {
                                const text = element.textContent || '';
                                if (text.includes(sectionData.title?.en || '') || 
                                    text.includes(sectionData.content?.en || '')) {
                                    element.classList.add('section-highlight');
                                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    break;
                                }
                            }
                        }
                    }, 500);
                    
                    // Auto-remove indicator after 5 seconds
                    setTimeout(() => {
                        if (indicator.parentNode) {
                            indicator.remove();
                        }
                    }, 5000);
                })();
            `;
            
            doc.head.appendChild(script);
            
        } catch (error) {
            console.error("Error highlighting section in preview:", error);
        }
    }

    // Global content management
    async updateGlobalContent(contentType, value) {
        try {
            const response = await fetch("/api/website-content/global", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    type: contentType,
                    value: value
                })
            });

            if (response.ok) {
                this.showNotification("Global content updated successfully", "success");
                // Refresh all pages to reflect global changes
                this.loadPageContent(this.currentPage);
            } else {
                throw new Error("Failed to update global content");
            }
        } catch (error) {
            console.error("Error updating global content:", error);
            this.showNotification("Error updating global content", "error");
        }
    }

    // Load sections data from admin.js
    loadSections(sections) {
        console.log("ContentEditor.loadSections called with:", sections?.length || 0, "sections");
        
        if (!sections || !Array.isArray(sections)) {
            console.warn("Invalid sections data provided to loadSections");
            return;
        }
        
        // Store sections data
        this.allSections = sections;
        
        // Group sections by page
        const sectionsByPage = {};
        sections.forEach(section => {
            const page = section.pageName || "unknown";
            if (!sectionsByPage[page]) {
                sectionsByPage[page] = [];
            }
            sectionsByPage[page].push(section);
        });
        
        console.log("Sections grouped by page:", sectionsByPage);
        
        // Update the content editor interface
        this.updateContentInterface(sectionsByPage);
        
        // Mark as initialized
        this.isInitialized = true;
        console.log("ContentEditor sections loaded successfully");
    }
    
    // Update the content editor interface with sections
    updateContentInterface(sectionsByPage) {
        // Get the current page from the page selector or default to 'home'
        const pageSelector = document.getElementById("pageSelector");
        const interfacePage = pageSelector ? pageSelector.value : "home";
        
        // Map page names to their container IDs
        const containerMap = {
            "global": "global-sections-container",
            "home": "home-sections-container",
            "about": "about-sections-container",
            "contact": "contact-sections-container",
            "projects": "projects-sections-container",
            "books": "books-sections-container",
            "ebooks": "ebooks-sections-container",

            "signup": "signup-sections-container",
            "login": "login-sections-container"
        };
        
        const containerId = containerMap[interfacePage] || "home-sections-container";
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.warn(`Content container not found for page: ${interfacePage} (looking for: ${containerId})`);
            return;
        }
        
        // Clear existing content
        container.innerHTML = "";
        
        // Get current page or default to 'home'
        const activePage = this.currentPage || "home";
        const pageSections = sectionsByPage[activePage] || [];
        
        if (pageSections.length === 0) {
            container.innerHTML = `<div class="notice">No sections found for <b>${activePage}</b> page.</div>`;
            return;
        }
        
        // Render sections for current page
        pageSections.forEach(section => {
            const card = document.createElement("div");
            card.className = "content-card";
            card.innerHTML = `
                <div class="content-header">
                    <span class="badge">${section.sectionId || "Unknown"}</span>
                    <span class="page-badge">${section.pageName || "Unknown"}</span>
                </div>
                <div class="content-body">
                    <h4>${section.title || "Untitled Section"}</h4>
                    <p>${(section.contentHtml || section.content || "").substring(0, 200)}${(section.contentHtml || section.content || "").length > 200 ? "..." : ""}</p>
                </div>
                <div class="content-actions">
                    <button class="btn btn-sm btn-primary" onclick="contentEditor.editSection('${section._id}', '${section.pageName}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="contentEditor.deleteSection('${section._id}', '${section.pageName}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
        
        console.log(`Rendered ${pageSections.length} sections for page: ${activePage}`);
    }

    // Load content data using new sections API
    async loadContentData(page) {
        console.log(`About to load content for page: ${page}`);
        const token = this.getAuthToken();
        const url = `http://localhost:8080/api/website-content/sections/${encodeURIComponent(page)}`;

        const res = await fetch(url, {
            headers: {
                "Authorization": token ? `Bearer ${token}` : "",
                "Accept": "application/json"
            }
        });

        const json = await res.json();
        console.log("API Response:", json);

        const items = Array.isArray(json.data) ? json.data : [];
        
        // Get the current page from the page selector or use the passed page parameter
        const pageSelector = document.getElementById("pageSelector");
        const targetPage = pageSelector ? pageSelector.value : page;
        
        // Map page names to their container IDs
        const containerMap = {
            "global": "global-sections-container",
            "home": "home-sections-container",
            "about": "about-sections-container",
            "contact": "contact-sections-container",
            "projects": "projects-sections-container",
            "books": "books-sections-container",
            "ebooks": "ebooks-sections-container",

            "signup": "signup-sections-container",
            "login": "login-sections-container"
        };
        
        const containerId = containerMap[targetPage] || "home-sections-container";
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.warn(`Content container not found for page: ${targetPage} (looking for: ${containerId})`);
            return;
        }
        
        container.innerHTML = "";

        if (!items.length) {
            container.innerHTML = `<div class="notice">No sections found for <b>${page}</b>.</div>`;
            return;
        }

        items.forEach(it => {
            const card = document.createElement("div");
            card.className = "content-card";
            card.innerHTML = `
                <div class="content-header">
                    <span class="badge">${it.sectionId}</span>
                </div>
                <div class="content-body">${it.contentHtml || ""}</div>
            `;
            container.appendChild(card);
        });
    }

    /**
     * Helper method to get display title from multilingual title object
     * @param {Object} section - Section object with title property
     * @returns {string} - Display title string
     */
    getDisplayTitle(section) {
        if (!section) return "Untitled Section";
        
        // If title is already a string, return it
        if (typeof section.title === "string") {
            return section.title || section.section || "Untitled Section";
        }
        
        // If title is an object (multilingual), get the appropriate language
        if (section.title && typeof section.title === "object") {
            // Try current language first, then English, then Tamil, then any available language
            const currentLang = this.currentLanguage || "en";
            return section.title[currentLang] || 
                   section.title.en || 
                   section.title.ta || 
                   Object.values(section.title)[0] || 
                   section.section || 
                   "Untitled Section";
        }
        
        // Fallback to section key or default
        return section.section || "Untitled Section";
    }
}

// Initialize ContentEditor when script loads
// Single initialization function to avoid race conditions
async function initializeContentEditor() {
    if (window.contentEditor) {
        console.log("WARNING: ContentEditor already exists, skipping initialization");
        return;
    }
    
    console.log("Creating ContentEditor instance...");
    window.contentEditor = new ContentEditor();
    
    try {
        // Increase timeout and make initialization more robust
        const initPromise = window.contentEditor.init();
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("ContentEditor initialization timeout")), 8000);
        });
        
        await Promise.race([initPromise, timeoutPromise]);
        console.log("SUCCESS: ContentEditor initialized successfully");
        console.log("initializationComplete flag:", window.contentEditor.initializationComplete);
    } catch (error) {
        console.error("ERROR: ContentEditor initialization failed:", error);
        
        // Even if init fails, try to set up basic functionality
        try {
            if (!window.contentEditor.initializationComplete) {
                window.contentEditor.setupBasicFunctionality();
                window.contentEditor.isInitialized = true;
                window.contentEditor.initializationComplete = true;
                console.log("Basic functionality setup completed after timeout");
            }
        } catch (basicError) {
            console.error("❌ Failed to setup basic functionality:", basicError);
            // Show user notification about the issue
            if (typeof window.contentEditor.showNotification === "function") {
                window.contentEditor.showNotification("Content editor failed to initialize. Some features may be limited.", "warning");
            }
        }
    }
}

// Initialize based on DOM state
if (document.readyState === "loading") {
    console.log("DOM still loading, waiting for DOMContentLoaded...");
    document.addEventListener("DOMContentLoaded", initializeContentEditor);
} else {
    console.log("DOM ready, initializing ContentEditor immediately...");
    initializeContentEditor();
}

// Global functions for backward compatibility
window.showSectionCreator = function() {
    // Ensure contentEditor is initialized
    if (!window.contentEditor) {
        window.contentEditor = new ContentEditor();
        console.log("ContentEditor initialized in showSectionCreator");
    }
    
    if (window.contentEditor && typeof window.contentEditor.showSectionCreator === "function") {
        window.contentEditor.showSectionCreator();
    } else {
        // Fallback to direct modal handling
        const modal = document.getElementById("sectionCreatorModal");
        if (modal) {
            modal.style.display = "flex";
            // Reset form
            const form = modal.querySelector("form");
            if (form) {
                form.reset();
                // Clear section type selection
                document.querySelectorAll(".section-type-card").forEach(c => {
                    if (c && c.classList) {
                        c.classList.remove("selected");
                    }
                });
            }
        }
    }
};

window.closeSectionCreator = function() {
    // Ensure contentEditor is initialized
    if (!window.contentEditor) {
        window.contentEditor = new ContentEditor();
        console.log("ContentEditor initialized in closeSectionCreator");
    }
    
    if (window.contentEditor && typeof window.contentEditor.hideSectionCreator === "function") {
        window.contentEditor.hideSectionCreator();
    } else {
        // Fallback to direct modal handling
        const modal = document.getElementById("sectionCreatorModal");
        if (modal) {
            modal.style.display = "none";
        }
    }
};

window.handleSectionCreation = async function(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const sectionData = Object.fromEntries(formData.entries());
    
    if (!sectionData.type) {
        if (typeof showNotification === "function") {
            showNotification("Please select a section type", "error");
        } else {
            alert("Please select a section type");
        }
        return;
    }

    try {
        if (typeof showLoading === "function") {
            showLoading();
        } else {
            this.showLoading(true);
        }
        
        // Get current page from the page selector
        const selectedPage = document.getElementById("pageSelector")?.value || "global";
        
        const response = await fetch(`/api/content/pages/${selectedPage}/sections`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({
                sectionKey: `${selectedPage}_${sectionData.type}_${Date.now()}`,
                title: sectionData.title || `New ${sectionData.type} Section`,
                content: sectionData.content || "",
                sectionType: sectionData.type || "text",
                order: parseInt(sectionData.order) || 1,
                isActive: sectionData.isActive === "true" || true,
                isVisible: sectionData.isVisible === "true" || true
            })
        });

        if (response.ok) {
            const newSection = await response.json();
            window.closeSectionCreator();
            
            if (window.contentEditor && window.contentEditor.currentPage) {
                window.contentEditor.loadPageContent(window.contentEditor.currentPage);
            }
            
            if (typeof showNotification === "function") {
                showNotification("Section created successfully", "success");
            } else {
                alert("Section created successfully!");
            }
        } else {
            throw new Error("Failed to create section");
        }
    } catch (error) {
        console.error("Error creating section:", error);
        if (typeof showNotification === "function") {
            showNotification("Error creating section", "error");
        } else {
            alert("Error creating section. Please try again.");
        }
    } finally {
        if (typeof hideLoading === "function") {
            hideLoading();
        } else {
            this.showLoading(false);
        }
    }
};

// Enhanced preview functionality
window.previewWebsite = function() {
    if (window.contentEditor) {
        window.contentEditor.openLivePreview();
    } else {
        // Fallback to simple preview
        window.open("/", "_blank");
    }
};

window.previewChanges = function(page) {
    if (window.contentEditor) {
        window.contentEditor.previewPageChanges(page);
    } else {
        console.warn("Content editor not available for preview");
    }
};

window.refreshContent = function(page) {
    if (window.contentEditor) {
        window.contentEditor.refreshPageContent(page || window.contentEditor.currentPage || 'global');
    } else {
        console.warn("Content editor not available for refresh");
        // Fallback: reload the page
        location.reload();
    }
};

window.toggleLivePreview = function() {
    if (window.contentEditor) {
        window.contentEditor.toggleLivePreviewMode();
    }
};

// Global modal utility function
window.closeModal = function(modalId) {
    const modal = modalId ? document.getElementById(modalId) : document.querySelector(".modal:not([style*=\"display: none\"])");
    if (modal) {
        modal.style.display = "none";
        // Clear any form data if it's a form modal
        const form = modal.querySelector("form");
        if (form) {
            form.reset();
        }
        // Remove any temporary classes
        modal.classList.remove("show", "active");
    }
};

// Global utility functions
window.showLoading = function() {
    if (window.contentEditor && typeof window.contentEditor.showLoading === "function") {
        window.contentEditor.showLoading(true);
    } else {
        // Fallback loading indicator
        let loader = document.getElementById("global-loader");
        if (!loader) {
            loader = document.createElement("div");
            loader.id = "global-loader";
            loader.innerHTML = "<div class=\"spinner\"></div>";
            loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: var(--overlay-dark);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;
            const spinner = loader.querySelector(".spinner");
            if (spinner) {
                spinner.style.cssText = `
                    width: 40px;
                    height: 40px;
                    border: 4px solid var(--border-secondary);
            border-top: 4px solid var(--border-accent);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                `;
            }
            document.body.appendChild(loader);
            
            // Add CSS animation if not exists
            if (!document.getElementById("loader-styles")) {
                const style = document.createElement("style");
                style.id = "loader-styles";
                style.textContent = `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }
        }
        loader.style.display = "flex";
    }
};

window.hideLoading = function() {
    if (window.contentEditor && typeof window.contentEditor.showLoading === "function") {
        window.contentEditor.showLoading(false);
    } else {
        // Fallback loading indicator
        const loader = document.getElementById("global-loader");
        if (loader) {
            loader.style.display = "none";
        }
    }
};

// Update selected page info display
function updateSelectedPageInfo(page) {
        const pageInfo = document.getElementById("selectedPageInfo");
        if (pageInfo) {
            const pageNames = {
                "global": "Global Elements",
                "home": "Home Page",
                "about": "About Page",
                "books": "Books Page",
                "projects": "Projects Page",
                "ebooks": "E-books Page",
                "contact": "Contact Page",
    
                "signup": "Sign Up Page",
                "login": "Login Page"
            };
            const displayName = pageNames[page] || `${page.charAt(0).toUpperCase() + page.slice(1)} Page`;
            pageInfo.textContent = `${displayName} Selected`;
        }
    }

// Export ContentEditor class and functions for global access
window.ContentEditor = ContentEditor;
window.switchContentPage = (page) => window.contentEditor?.switchContentPage(page);
window.savePageContent = (page) => window.contentEditor?.savePageContent(page);
window.resetPageContent = (page) => window.contentEditor?.resetPageContent(page);