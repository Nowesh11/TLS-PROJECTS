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
        card.classList.add("selected");
        
        // Store selected type
        this.selectedSectionType = card.dataset.type;
        
        // Enable create button
        const createBtn = document.getElementById("createSectionBtn");
        if (createBtn) {
            createBtn.disabled = false;
            createBtn.textContent = `Create ${this.sectionTypes[this.selectedSectionType]?.name || 'Section'}`;
        }
    }

    // Additional methods would continue here...
    // Due to character limit, showing key initialization and setup methods
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentEditor;
} else if (typeof window !== 'undefined') {
    window.ContentEditor = ContentEditor;
}