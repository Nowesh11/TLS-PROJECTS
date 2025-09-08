// Main JavaScript functionality for Tamil Language Society website

// DOM Elements (notification dot can be global as it's used in multiple functions)
const notificationDot = document.getElementById("notification-dot");

// Note: API_BASE_URL and apiCall function are defined in api-integration.js

// Notification system functions (defined early to avoid timing issues)
function showNotification(message, type = "info", duration = 5000) {
    try {
        const toast = document.getElementById("notification-toast");
        if (!toast) {
            console.warn("Notification toast element not found");
            return;
        }
        
        // Check if the toast has the expected structure
        let messageElement = toast.querySelector(".toast-message");
        if (!messageElement) {
            console.warn("Toast message element not found, creating fallback structure");
            // Create fallback structure if it doesn't exist
            toast.innerHTML = `
                <div class="toast-content">
                    <div class="toast-message"></div>
                    <button class="toast-close" onclick="closeNotification()">×</button>
                </div>
            `;
            messageElement = toast.querySelector(".toast-message");
        }
        
        if (messageElement) {
            messageElement.textContent = message;
            toast.classList.add("show");
            
            // Auto-hide after duration
            setTimeout(() => {
                if (toast && toast.classList) {
                    toast.classList.remove("show");
                }
            }, duration);
        } else {
            console.error("Could not create or find toast message element");
        }
    } catch (error) {
        console.error("Error in showNotification:", error);
    }
}

// Make showNotification globally available
window.showNotification = showNotification;

// ===== PUBLIC WEBSITE THEME SYSTEM =====
class PublicThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem("public-theme") || "light";
        this.init();
    }

    init() {
        // Apply saved theme on page load
        this.applyTheme(this.currentTheme);
        
        // Create theme toggle button if it doesn't exist
        this.createThemeToggle();
        
        // Listen for theme toggle events
        this.bindEvents();
    }

    createThemeToggle() {
        // Check if theme toggle already exists
        if (document.querySelector(".public-theme-toggle")) return;
        
        // Create theme toggle button
        const themeToggle = document.createElement("button");
        themeToggle.className = "public-theme-toggle";
        themeToggle.innerHTML = `
            <i class="fas fa-${this.currentTheme === "light" ? "moon" : "sun"}"></i>
        `;
        themeToggle.setAttribute("aria-label", "Toggle theme");
        themeToggle.title = "Toggle light/dark theme";
        
        // Add styles
        themeToggle.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: var(--public-glass-bg);
            border: 1px solid var(--public-glass-border);
            border-radius: 50%;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            box-shadow: var(--public-shadow);
        `;
        
        // Add to page
        document.body.appendChild(themeToggle);
    }

    bindEvents() {
        // Theme toggle click event
        document.addEventListener("click", (e) => {
            if (e.target.closest(".public-theme-toggle")) {
                this.toggleTheme();
            }
        });
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === "light" ? "dark" : "light";
        this.applyTheme(this.currentTheme);
        this.saveTheme();
        this.updateToggleIcon();
        
        // Show notification
        showNotification(`Switched to ${this.currentTheme} theme`, "success", 2000);
    }

    applyTheme(theme) {
        document.body.setAttribute("data-theme", theme);
        this.currentTheme = theme;
    }

    saveTheme() {
        localStorage.setItem("public-theme", this.currentTheme);
    }

    updateToggleIcon() {
        const toggle = document.querySelector(".public-theme-toggle");
        if (toggle) {
            const icon = toggle.querySelector("i");
            if (icon) {
                icon.className = `fas fa-${this.currentTheme === "light" ? "moon" : "sun"}`;
            }
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }
}

// Initialize public theme manager
const publicThemeManager = new PublicThemeManager();
window.publicThemeManager = publicThemeManager;

function closeNotification() {
    try {
        const toast = document.getElementById("notification-toast");
        if (toast) {
            toast.classList.remove("show");
        }
    } catch (error) {
        console.error("Error in closeNotification:", error);
    }
}

// Make closeNotification globally available
window.closeNotification = closeNotification;

// Initialize the application
document.addEventListener("DOMContentLoaded", function() {
    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
        initializeNavigation();
        initializeAnimations();
        initializeCounters();
        initializeScrollEffects();
        initializeNotifications();
        initializeForms();
        initializeParticles();
        initializeModalSidebarManager();
    });
    
    // Show welcome notification after page load with additional safety checks
    // Only show on non-admin pages to avoid conflicts
    const isAdminPage = window.location.pathname.includes("admin.html");
    if (!isAdminPage) {
        setTimeout(() => {
            // Use popup notification system for welcome message
            if (window.popupNotificationManager) {
                window.popupNotificationManager.showPopup({
                    type: "welcome",
                    title: "Welcome to Tamil Language Society",
                    message: "Discover our rich Tamil heritage through books, projects, and community initiatives.",
                    actions: [
                        { label: "Explore", action: "explore" },
                        { label: "Dismiss", action: "dismiss" }
                    ],
                    onAction: (action) => {
                        if (action === "explore") {
                            document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" });
                        }
                    },
                    duration: 10000
                });
            }
        }, 3000);
    }
});

// Navigation functionality
function initializeNavigation() {
    // Get navigation elements with proper error handling
    const navbar = document.getElementById("navbar");
    const hamburger = document.getElementById("hamburger");
    const navMenu = document.getElementById("nav-menu");
    
    // Check if navigation elements exist (they won't on admin page)
    if (!navbar || !hamburger || !navMenu) {
        return; // Skip navigation initialization on admin pages
    }
    
    // Mobile menu toggle with error handling
    try {
        hamburger.addEventListener("click", function() {
            hamburger.classList.toggle("active");
            navMenu.classList.toggle("active");
            document.body.style.overflow = navMenu.classList.contains("active") ? "hidden" : "";
        });
    } catch (error) {
        console.error("Failed to initialize mobile menu toggle:", error);
    }
    
    // Close mobile menu when clicking on nav links with error handling
    try {
            const navLinks = document.querySelectorAll(".nav-link");
            navLinks.forEach((link, index) => {
                link.addEventListener("click", function(e) {
                    // Check if authentication is required for certain pages
                    const href = this.getAttribute("href");
                    const authRequiredPages = ["projects.html", "books.html", "ebooks.html", "contact.html"];
                    
                    if (authRequiredPages.some(page => href.includes(page))) {
                        // Check if AuthUtils is available and user is not authenticated
                        if (typeof AuthUtils !== "undefined" && typeof AuthUtils.isAuthenticated === "function" && !AuthUtils.isAuthenticated()) {
                            e.preventDefault();
                            if (typeof AuthUtils.showAuthModal === "function") {
                                AuthUtils.showAuthModal();
                            }
                            return;
                        }
                    }
                    
                    hamburger.classList.remove("active");
                    navMenu.classList.remove("active");
                    document.body.style.overflow = "";
                });
            });
            
            // Close mobile menu when clicking outside
            document.addEventListener("click", function(e) {
                if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
                    hamburger.classList.remove("active");
                    navMenu.classList.remove("active");
                    document.body.style.overflow = "";
                }
            });
            
            // Navbar scroll effect with throttling for better performance
            let lastScrollTop = 0;
            let ticking = false;
            
            function updateNavbar() {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                
                if (scrollTop > 50) {
                    navbar.style.background = "var(--navbar-bg-scrolled, rgba(255, 255, 255, 0.98))";
                navbar.style.boxShadow = "var(--shadow-lg)";
            } else {
                navbar.style.background = "var(--navbar-bg, rgba(255, 255, 255, 0.95))";
                navbar.style.boxShadow = "none";
                }
                
                // Hide/show navbar on scroll
                if (scrollTop > lastScrollTop && scrollTop > 200) {
                    navbar.style.transform = "translateY(-100%)";
                } else {
                    navbar.style.transform = "translateY(0)";
                }
                
                lastScrollTop = scrollTop;
                ticking = false;
            }
            
            window.addEventListener("scroll", function() {
                if (!ticking) {
                    requestAnimationFrame(updateNavbar);
                    ticking = true;
                }
            });
            
            // Active nav link highlighting
            highlightActiveNavLink();
            
        } catch (error) {
            console.error("Navigation initialization failed:", error);
        }
}

function highlightActiveNavLink() {
    const mainCurrentPage = window.location.pathname.split("/").pop() || "index.html";
    const navLinks = document.querySelectorAll(".nav-link");
    
    navLinks.forEach(link => {
        link.classList.remove("active");
        const linkHref = link.getAttribute("href");
        if (linkHref === mainCurrentPage || 
            (mainCurrentPage === "" && linkHref === "index.html") ||
            (mainCurrentPage === "index.html" && linkHref === "index.html")) {
            link.classList.add("active");
        }
    });
}

// Animation initialization
function initializeAnimations() {
    // Add animation classes to elements
    const animatedElements = document.querySelectorAll(".feature-card");
    animatedElements.forEach((element, index) => {
        element.style.animationDelay = `${index * 0.1}s`;
        element.classList.add("animate-fadeInUp");
    });
    
    // Hero animations
    const heroText = document.querySelector(".hero-text");
    const heroImage = document.querySelector(".hero-image");
    
    if (heroText) {
        heroText.classList.add("animate-fadeInLeft");
    }
    
    if (heroImage) {
        heroImage.classList.add("animate-fadeInRight");
    }
    
    // Stagger animation for feature cards
    const featureCards = document.querySelectorAll(".feature-card");
    featureCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.2}s`;
    });
}

// Counter animation for statistics with async support
async function initializeCounters() {
    return new Promise((resolve) => {
        try {
    const counters = document.querySelectorAll("[data-target]");
    
    const countUp = (element, target, duration = 2000) => {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            element.textContent = Math.floor(current).toLocaleString();
            
            if (current >= target) {
                element.textContent = target.toLocaleString();
                clearInterval(timer);
            }
        }, 16);
    };
    
    // Intersection Observer for counter animation
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.dataset.target);
                countUp(entry.target, target);
                counterObserver.unobserve(entry.target);
            }
        });
    });
    
            counters.forEach(counter => {
                counterObserver.observe(counter);
            });
            
            resolve();
        } catch (error) {
            console.error("❌ Counter initialization failed:", error);
            resolve(); // Don't fail the entire initialization for counters
        }
    });
}

// Scroll effects and animations with async support
async function initializeScrollEffects() {
    return new Promise((resolve) => {
        try {
    // Smooth scrolling for anchor links
    document.querySelectorAll("a[href^=\"#\"]").forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute("href"));
            if (target) {
                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });
    });
    
    // Scroll-triggered animations
    const scrollElements = document.querySelectorAll(".scroll-animate");
    
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });
    
    scrollElements.forEach(element => {
        scrollObserver.observe(element);
    });
    
    // Parallax effect for hero section
    window.addEventListener("scroll", function() {
        const scrolled = window.pageYOffset;
        const heroBackground = document.querySelector(".hero-background");
            if (heroBackground) {
                heroBackground.style.transform = `translateY(${scrolled * 0.5}px)`;
            }
        });
        
        resolve();
        } catch (error) {
            console.error("❌ Scroll effects initialization failed:", error);
            resolve(); // Don't fail the entire initialization for scroll effects
        }
    });
}

// Notification system with async support
async function initializeNotifications() {
    return new Promise((resolve) => {
        try {
    // Check if notification dot exists
    if (!notificationDot) {
        console.log("Notification dot not found, skipping notification initialization");
        return;
    }
    
    // Show notification dot if there are unread notifications
    const unreadCount = getUnreadNotificationCount();
    if (unreadCount > 0) {
        notificationDot.classList.add("show");
    }
    
            // Check for new notifications periodically
            setInterval(checkForNewNotifications, 30000); // Check every 30 seconds
            
            resolve();
        } catch (error) {
            console.error("❌ Notification initialization failed:", error);
            resolve(); // Don't fail the entire initialization for notifications
        }
    });
}

function getUnreadNotificationCount() {
    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
    return notifications.filter(n => !n.read).length;
}

function checkForNewNotifications() {
    // Simulate checking for new notifications
    const hasNewNotification = Math.random() < 0.1; // 10% chance
    
    if (hasNewNotification) {
        const newNotification = {
            id: Date.now(),
            title: "New Tamil Learning Resource Available",
            message: "IN TAMIL",
            timestamp: new Date(),
            read: false,
            type: "info"
        };
        
        addNotification(newNotification);
        showNotification(newNotification.message);
        if (notificationDot) {
            notificationDot.classList.add("show");
        }
    }
}

function addNotification(notification) {
    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
    notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
        notifications.splice(50);
    }
    
    localStorage.setItem("notifications", JSON.stringify(notifications));
}

// showNotification and closeNotification functions are now defined at the top of the file

// Form handling with async support
async function initializeForms() {
    return new Promise((resolve) => {
        try {
    // Newsletter form
    const newsletterForm = document.querySelector(".newsletter-form");
    if (newsletterForm) {
        const input = newsletterForm.querySelector(".newsletter-input");
        const button = newsletterForm.querySelector(".newsletter-btn");
        
        if (button && input) {
            button.addEventListener("click", function(e) {
            e.preventDefault();
            const email = input.value.trim();
            
            if (email && isValidEmail(email)) {
                showNotification("Thank you for subscribing to our newsletter");
                input.value = "";
            } else {
                showNotification("Please enter a valid email address", "error");
                input.classList.add("animate-shake");
                setTimeout(() => input.classList.remove("animate-shake"), 600);
            }
        });
        
            input.addEventListener("keypress", function(e) {
                if (e.key === "Enter") {
                    button.click();
                }
            });
        }
    }
    
    // Contact form handling - removed as handleContactForm function is disabled
    // const contactForm = document.getElementById("contact-form");
    // if (contactForm) {
    //     contactForm.addEventListener("submit", handleContactForm);
    // }
    
            // Note: Login and signup forms are handled by auth.js
            // Removed duplicate handlers to avoid conflicts
            
            resolve();
        } catch (error) {
            console.error("❌ Form initialization failed:", error);
            resolve(); // Don't fail the entire initialization for forms
        }
    });
}

// Contact form handler removed - handleContactForm function disabled

// Note: Login and signup form handlers are in auth.js

// Contact form thank you message function removed

// Particle background effect with async support
async function initializeParticles() {
    return new Promise((resolve) => {
        try {
    const heroSection = document.querySelector(".hero");
    if (!heroSection) return;
    
    const particleContainer = document.createElement("div");
    particleContainer.className = "particle-background";
    heroSection.appendChild(particleContainer);
    
    function createParticle() {
        const particle = document.createElement("div");
        particle.className = "particle";
        particle.style.left = Math.random() * 100 + "%";
        particle.style.animationDuration = (Math.random() * 20 + 10) + "s";
        particle.style.animationDelay = Math.random() * 5 + "s";
        
        particleContainer.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 25000);
    }
    
    // Create initial particles
    for (let i = 0; i < 20; i++) {
        setTimeout(createParticle, i * 200);
    }
    
            // Continue creating particles
            setInterval(createParticle, 1000);
            
            resolve();
        } catch (error) {
            console.error("❌ Particle initialization failed:", error);
            resolve(); // Don't fail the entire initialization for particles
        }
    });
}

/**
 * Initialize Modal and Sidebar Manager
 */
async function initializeModalSidebarManager() {
    try {
        if (typeof window.modalSidebarManager !== "undefined") {
            await window.modalSidebarManager.initialize();
            console.log("✅ Modal and Sidebar Manager initialized successfully");
        } else {
            console.log("ℹ️ Modal and Sidebar Manager not found, skipping initialization");
        }
    } catch (error) {
        console.warn("⚠️ Failed to initialize Modal and Sidebar Manager:", error);
    }
}

// Utility functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function formatDate(date) {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}

// Use shared utilities for debounce and throttle
function debounce(func, wait) {
    if (window.sharedUtilities) {
        return window.sharedUtilities.debounce(func, wait);
    }
    // Fallback implementation
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

function throttle(func, limit) {
    if (window.sharedUtilities) {
        return window.sharedUtilities.throttle(func, limit);
    }
    // Fallback implementation
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

// Export functions for use in other files
window.TamilSociety = {
    showNotification,
    closeNotification,
    addNotification,
    getUnreadNotificationCount,
    isValidEmail,
    formatDate
};

// Performance optimization
if ("requestIdleCallback" in window) {
    requestIdleCallback(() => {
        // Initialize non-critical features
        console.log("Tamil Language Society website loaded successfully");
    });
}

// Global recruitment management functions
function refreshRecruitmentForms() {
    try {
        if (window.recruitmentManager && typeof window.recruitmentManager.displayFormsTable === "function") {
            window.recruitmentManager.displayFormsTable();
        } else if (window.refreshFormsTable && typeof window.refreshFormsTable === "function") {
            window.refreshFormsTable();
        } else {
            console.warn("Recruitment forms refresh function not available");
        }
    } catch (error) {
        console.error("Error refreshing recruitment forms:", error);
    }
}

function loadRecruitmentStats() {
    try {
        if (window.recruitmentManager && typeof window.recruitmentManager.updateRecruitmentStats === "function") {
            window.recruitmentManager.updateRecruitmentStats();
        } else if (window.dashboardManager && typeof window.dashboardManager.updateRecruitmentStats === "function") {
            window.dashboardManager.updateRecruitmentStats();
        } else {
            console.warn("Recruitment stats loading function not available");
        }
    } catch (error) {
        console.error("Error loading recruitment stats:", error);
    }
}

// Global loading functions
function showLoading(message = "Loading...") {
    try {
        let loadingOverlay = document.getElementById("loading-overlay");
        if (!loadingOverlay) {
            loadingOverlay = document.createElement("div");
            loadingOverlay.id = "loading-overlay";
            loadingOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                color: white;
                font-size: 1.2rem;
            `;
            loadingOverlay.innerHTML = `
                <div style="text-align: center;">
                    <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 0 auto 1rem;"></div>
                    <div>${message}</div>
                </div>
            `;
            document.body.appendChild(loadingOverlay);
            
            // Add CSS animation if not exists
            if (!document.getElementById("loading-styles")) {
                const style = document.createElement("style");
                style.id = "loading-styles";
                style.textContent = `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }
        }
        loadingOverlay.style.display = "flex";
    } catch (error) {
        console.error("Error showing loading:", error);
    }
}

function hideLoading() {
    try {
        const loadingOverlay = document.getElementById("loading-overlay");
        if (loadingOverlay) {
            loadingOverlay.style.display = "none";
        }
    } catch (error) {
        console.error("Error hiding loading:", error);
    }
}

// Make recruitment functions globally available
window.refreshRecruitmentForms = refreshRecruitmentForms;
window.loadRecruitmentStats = loadRecruitmentStats;
window.showLoading = showLoading;
window.hideLoading = hideLoading;

// Service Worker registration for PWA capabilities
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js")
            .then((registration) => {
                console.log("SW registered: ", registration);
            })
            .catch((registrationError) => {
                console.log("SW registration failed: ", registrationError);
            });
    });
}

// Global error handlers for uncaught promise rejections
window.addEventListener("unhandledrejection", (event) => {
    // Check if error is from browser extensions (like quillbot-content.js)
    if (event.reason && (event.reason.toString().includes("quillbot") || 
                        event.reason.toString().includes("extension") ||
                        event.reason.stack && event.reason.stack.includes("extension"))) {
        console.warn("🔌 Browser extension error caught and handled:", event.reason);
        event.preventDefault(); // Prevent the error from appearing in console
        return;
    }
    
    // Log other unhandled promise rejections for debugging
    console.error("🚨 Unhandled promise rejection:", event.reason);
    
    // Prevent default browser behavior for non-critical errors
    if (event.reason && typeof event.reason === "object" && !event.reason.critical) {
        event.preventDefault();
    }
});

// Global error handler for JavaScript errors
window.addEventListener("error", (event) => {
    // Filter out browser extension errors
    if (event.filename && (event.filename.includes("extension") || 
                          event.filename.includes("quillbot") ||
                          event.filename.includes("chrome-extension"))) {
        console.warn("🔌 Browser extension script error filtered:", event.message);
        return;
    }
    
    // Log application errors
    console.error("🚨 JavaScript error:", {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno
    });
});

// ===== REAL-TIME CONTENT UPDATE SYSTEM =====
class RealTimeContentUpdater {
    constructor() {
        this.init();
    }

    init() {
        // Listen for BroadcastChannel messages (modern browsers)
        if (typeof BroadcastChannel !== 'undefined') {
            this.channel = new BroadcastChannel('content-updates');
            this.channel.addEventListener('message', (event) => {
                this.handleContentUpdate(event.data);
            });
        }

        // Listen for localStorage changes (fallback for older browsers)
        window.addEventListener('storage', (event) => {
            if (event.key === 'latest-content-update' && event.newValue) {
                try {
                    const updateData = JSON.parse(event.newValue);
                    this.handleContentUpdate(updateData);
                } catch (error) {
                    console.error('[REAL-TIME] Error parsing update data:', error);
                }
            }
        });

        console.log('[REAL-TIME] Content update listener initialized');
    }

    async handleContentUpdate(data) {
        if (data.type === 'content-updated' && data.page) {
            console.log(`[REAL-TIME] Received content update for page: ${data.page}`);
            
            // Get current page from URL or default to 'home'
            const currentPage = this.getCurrentPage();
            
            // Only update if we're on the same page that was updated
            if (currentPage === data.page) {
                await this.refreshPageContent(data.page);
                
                // Show notification to user
                if (typeof showNotification === 'function') {
                    showNotification('Content has been updated and refreshed!', 'info', 3000);
                }
            }
        }
    }

    getCurrentPage() {
        // Extract page from URL or use default
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html' || path.includes('index')) {
            return 'home';
        } else if (path.includes('about')) {
            return 'about';
        } else if (path.includes('contact')) {
            return 'contact';
        } else if (path.includes('projects')) {
            return 'projects';
        } else if (path.includes('events')) {
            return 'events';
        } else if (path.includes('books')) {
            return 'books';
        } else if (path.includes('ebooks')) {
            return 'ebooks';
        }
        return 'home'; // Default fallback
    }

    async refreshPageContent(page) {
        try {
            // Use existing API integration to reload content
            if (typeof loadWebsiteContentFromAPI === 'function') {
                console.log(`[REAL-TIME] Refreshing content for page: ${page}`);
                await loadWebsiteContentFromAPI(page);
            } else if (typeof window.apiIntegration !== 'undefined' && window.apiIntegration.loadContent) {
                await window.apiIntegration.loadContent(page);
            } else {
                // Fallback: reload the page
                console.log('[REAL-TIME] No API integration found, reloading page');
                window.location.reload();
            }
        } catch (error) {
            console.error('[REAL-TIME] Error refreshing content:', error);
            // Fallback to page reload on error
            window.location.reload();
        }
    }

    destroy() {
        if (this.channel) {
            this.channel.close();
        }
    }
}

// Initialize real-time content updater when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Only initialize on public pages (not admin)
        if (!window.location.pathname.includes('admin')) {
            window.realTimeUpdater = new RealTimeContentUpdater();
        }
        
        // Initialize theme system
        initializeThemeSystem();
    });
} else {
    // DOM already loaded
    if (!window.location.pathname.includes('admin')) {
        window.realTimeUpdater = new RealTimeContentUpdater();
    }
    
    // Initialize theme system
    initializeThemeSystem();
}

// Theme system initialization function
function initializeThemeSystem() {
    // Load theme-system.js if not already loaded
    if (!window.themeSystem) {
        const script = document.createElement('script');
        script.src = '/public/js/theme-system.js';
        script.onload = () => {
            console.log('Theme system loaded and initialized');
        };
        script.onerror = () => {
            console.warn('Failed to load theme system');
        };
        document.head.appendChild(script);
    }
}
