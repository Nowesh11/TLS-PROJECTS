/**
 * Modal and Sidebar Manager
 * Provides robust initialization and management for modals and sidebars
 * with proper element detection, fallbacks, and error handling
 */

class ModalSidebarManager {
    constructor() {
        this.modals = new Map();
        this.sidebars = new Map();
        this.initialized = false;
        this.fallbacksCreated = false;
    }

    /**
     * Initialize modal and sidebar management with timeout protection
     */
    async initialize() {
        if (this.initialized) return;
        
        const initializationTimeout = 10000; // 10 seconds
        
        try {
            console.log("🚀 Initializing Modal and Sidebar Manager...");
            
            // Run initialization with timeout protection
            await Promise.race([
                this.runInitializationSequence(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Modal/Sidebar initialization timeout")), initializationTimeout)
                )
            ]);
            
            this.initialized = true;
            console.log("✅ Modal and Sidebar Manager initialized successfully");
            
        } catch (error) {
            console.error("❌ Modal and Sidebar Manager initialization failed:", error);
            this.createFallbackElements();
        }
    }
    
    /**
     * Run the main initialization sequence
     */
    async runInitializationSequence() {
        const tasks = [
            { name: "Modal Detection", fn: () => this.detectModals() },
            { name: "Sidebar Detection", fn: () => this.detectSidebars() },
            { name: "Event Listeners", fn: () => this.setupEventListeners() },
            { name: "Global Functions", fn: () => this.setupGlobalFunctions() }
        ];
        
        for (const task of tasks) {
            try {
                console.log(`📄 Running ${task.name}...`);
                await task.fn();
                console.log(`✅ ${task.name} completed successfully`);
            } catch (error) {
                console.warn(`⚠️ Failed to complete ${task.name}:`, error);
                // Continue with other tasks even if one fails
            }
        }
    }
    
    /**
     * Detect and register existing modals
     */
    detectModals() {
        const modalSelectors = [
            ".modal",
            ".admin-modal",
            ".notification-modal",
            ".auth-required-modal",
            ".content-editor-modal",
            "#sectionCreatorModal",
            "#adminModal",
            "#posterModal",
            "#orderDetailsModal",
            "#updateStatusModal"
        ];
        
        modalSelectors.forEach(selector => {
            const modals = document.querySelectorAll(selector);
            modals.forEach((modal, index) => {
                const modalId = modal.id || `${selector.replace(/[.#]/g, "")}-${index}`;
                this.registerModal(modalId, modal);
            });
        });
        
        console.log(`📊 Detected ${this.modals.size} modals`);
    }
    
    /**
     * Detect and register existing sidebars
     */
    detectSidebars() {
        const isAdminPage = window.location.pathname.includes("admin.html");
        
        const sidebarSelectors = [
            ".sidebar",
            "#sidebar",
            ".nav-sidebar"
        ];
        
        // Don't manage admin sidebars on admin pages
        if (!isAdminPage) {
            sidebarSelectors.push(".admin-sidebar");
        }
        
        sidebarSelectors.forEach(selector => {
            const sidebars = document.querySelectorAll(selector);
            sidebars.forEach((sidebar, index) => {
                // Skip admin sidebars on admin pages
                if (isAdminPage && (sidebar.classList.contains("admin-sidebar") || sidebar.id === "adminSidebar")) {
                    console.log("🚫 Skipping admin sidebar management on admin page");
                    return;
                }
                
                const sidebarId = sidebar.id || `${selector.replace(/[.#]/g, "")}-${index}`;
                this.registerSidebar(sidebarId, sidebar);
            });
        });
        
        console.log(`📊 Detected ${this.sidebars.size} sidebars`);
    }
    
    /**
     * Register a modal for management
     */
    registerModal(id, element) {
        if (!element) {
            console.warn(`⚠️ Modal element not found for ID: ${id}`);
            return;
        }
        
        this.modals.set(id, {
            element,
            isVisible: false,
            hasBackdrop: element.classList.contains("modal") || element.classList.contains("admin-modal"),
            closeOnBackdrop: true,
            closeOnEscape: true
        });
        
        // Add necessary attributes if missing
        if (!element.getAttribute("role")) {
            element.setAttribute("role", "dialog");
        }
        if (!element.getAttribute("aria-hidden")) {
            element.setAttribute("aria-hidden", "true");
        }
        
        console.log(`📝 Registered modal: ${id}`);
    }
    
    /**
     * Register a sidebar for management
     */
    registerSidebar(id, element) {
        if (!element) {
            console.warn(`⚠️ Sidebar element not found for ID: ${id}`);
            return;
        }
        
        this.sidebars.set(id, {
            element,
            isVisible: !element.classList.contains("sidebar-hidden"),
            toggleButton: this.findToggleButton(element),
            closeOnOutsideClick: true
        });
        
        console.log(`📝 Registered sidebar: ${id}`);
    }
    
    /**
     * Find toggle button for sidebar
     */
    findToggleButton(sidebar) {
        const possibleSelectors = [
            `[data-sidebar="${sidebar.id}"]`,
            `[onclick*="${sidebar.id}"]`,
            ".hamburger",
            ".sidebar-toggle",
            ".menu-toggle"
        ];
        
        for (const selector of possibleSelectors) {
            const button = document.querySelector(selector);
            if (button) return button;
        }
        
        return null;
    }
    
    /**
     * Setup event listeners for modals and sidebars
     */
    setupEventListeners() {
        // Global escape key handler
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                this.closeTopModal();
            }
        });
        
        // Global click handler for backdrop closes
        document.addEventListener("click", (e) => {
            this.handleGlobalClick(e);
        });
        
        // Setup individual modal listeners
        this.modals.forEach((modal, id) => {
            this.setupModalListeners(id, modal);
        });
        
        // Setup individual sidebar listeners
        this.sidebars.forEach((sidebar, id) => {
            this.setupSidebarListeners(id, sidebar);
        });
        
        console.log("📡 Event listeners setup completed");
    }
    
    /**
     * Setup listeners for a specific modal
     */
    setupModalListeners(id, modal) {
        const { element } = modal;
        
        // Find and setup close buttons
        const closeButtons = element.querySelectorAll(
            ".modal-close, .close-modal, .admin-modal-close, [data-dismiss=\"modal\"], [onclick*=\"closeModal\"]"
        );
        
        closeButtons.forEach(button => {
            button.addEventListener("click", (e) => {
                e.preventDefault();
                this.hideModal(id);
            });
        });
        
        // Setup backdrop click
        element.addEventListener("click", (e) => {
            if (e.target === element && modal.closeOnBackdrop) {
                this.hideModal(id);
            }
        });
    }
    
    /**
     * Setup listeners for a specific sidebar
     */
    setupSidebarListeners(id, sidebar) {
        const { element, toggleButton } = sidebar;
        
        if (toggleButton) {
            toggleButton.addEventListener("click", (e) => {
                e.preventDefault();
                this.toggleSidebar(id);
            });
        }
    }
    
    /**
     * Setup global functions for backward compatibility
     */
    setupGlobalFunctions() {
        // Enhanced global modal functions
        window.showModal = (modalId) => this.showModal(modalId);
        window.hideModal = (modalId) => this.hideModal(modalId);
        window.closeModal = (modalId) => this.hideModal(modalId);
        window.toggleModal = (modalId) => this.toggleModal(modalId);
        
        // Enhanced global sidebar functions
        window.showSidebar = (sidebarId) => this.showSidebar(sidebarId);
        window.hideSidebar = (sidebarId) => this.hideSidebar(sidebarId);
        
        // Only override toggleSidebar if not on admin page or if no existing function
        const isAdminPage = window.location.pathname.includes("admin.html");
        if (!isAdminPage && typeof window.toggleSidebar === "undefined") {
            window.toggleSidebar = (sidebarId) => this.toggleSidebar(sidebarId);
        }
        
        console.log("🌐 Global functions setup completed");
    }
    
    /**
     * Show a modal with enhanced error handling
     */
    showModal(modalId) {
        const modal = this.modals.get(modalId);
        if (!modal) {
            console.warn(`⚠️ Modal not found: ${modalId}`);
            this.createFallbackModal(modalId);
            return false;
        }
        
        try {
            const { element } = modal;
            
            // Hide other modals first
            this.hideAllModals();
            
            // Show the modal
            element.style.display = "flex";
            element.setAttribute("aria-hidden", "false");
            element.classList.add("show", "active");
            
            // Add animation if supported
            if (element.style.animationName !== undefined) {
                element.style.animation = "modalFadeIn 0.3s ease-out";
            }
            
            // Focus management
            const firstFocusable = element.querySelector(
                "button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])"
            );
            if (firstFocusable) {
                setTimeout(() => firstFocusable.focus(), 100);
            }
            
            modal.isVisible = true;
            console.log(`✅ Modal shown: ${modalId}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Failed to show modal ${modalId}:`, error);
            return false;
        }
    }
    
    /**
     * Hide a modal with enhanced error handling
     */
    hideModal(modalId) {
        const modal = this.modals.get(modalId);
        if (!modal) {
            console.warn(`⚠️ Modal not found: ${modalId}`);
            return false;
        }
        
        try {
            const { element } = modal;
            
            // Add exit animation if supported
            if (element.style.animationName !== undefined) {
                element.style.animation = "modalFadeOut 0.3s ease-out";
                setTimeout(() => {
                    element.style.display = "none";
                }, 300);
            } else {
                element.style.display = "none";
            }
            
            element.setAttribute("aria-hidden", "true");
            element.classList.remove("show", "active");
            
            // Clear form data if it's a form modal
            const form = element.querySelector("form");
            if (form) {
                form.reset();
            }
            
            modal.isVisible = false;
            console.log(`✅ Modal hidden: ${modalId}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Failed to hide modal ${modalId}:`, error);
            return false;
        }
    }
    
    /**
     * Toggle a modal
     */
    toggleModal(modalId) {
        const modal = this.modals.get(modalId);
        if (!modal) {
            return this.showModal(modalId);
        }
        
        return modal.isVisible ? this.hideModal(modalId) : this.showModal(modalId);
    }
    
    /**
     * Show a sidebar
     */
    showSidebar(sidebarId) {
        const sidebar = this.sidebars.get(sidebarId);
        if (!sidebar) {
            console.warn(`⚠️ Sidebar not found: ${sidebarId}`);
            return false;
        }
        
        try {
            const { element } = sidebar;
            element.classList.remove("sidebar-hidden");
            element.classList.add("sidebar-visible");
            sidebar.isVisible = true;
            console.log(`✅ Sidebar shown: ${sidebarId}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to show sidebar ${sidebarId}:`, error);
            return false;
        }
    }
    
    /**
     * Hide a sidebar
     */
    hideSidebar(sidebarId) {
        const sidebar = this.sidebars.get(sidebarId);
        if (!sidebar) {
            console.warn(`⚠️ Sidebar not found: ${sidebarId}`);
            return false;
        }
        
        try {
            const { element } = sidebar;
            element.classList.add("sidebar-hidden");
            element.classList.remove("sidebar-visible");
            sidebar.isVisible = false;
            console.log(`✅ Sidebar hidden: ${sidebarId}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to hide sidebar ${sidebarId}:`, error);
            return false;
        }
    }
    
    /**
     * Toggle a sidebar
     */
    toggleSidebar(sidebarId) {
        const sidebar = this.sidebars.get(sidebarId);
        if (!sidebar) {
            return this.showSidebar(sidebarId);
        }
        
        return sidebar.isVisible ? this.hideSidebar(sidebarId) : this.showSidebar(sidebarId);
    }
    
    /**
     * Hide all modals
     */
    hideAllModals() {
        this.modals.forEach((modal, id) => {
            if (modal.isVisible) {
                this.hideModal(id);
            }
        });
    }
    
    /**
     * Close the topmost modal
     */
    closeTopModal() {
        const visibleModals = Array.from(this.modals.entries())
            .filter(([id, modal]) => modal.isVisible)
            .sort(([, a], [, b]) => {
                const aZIndex = parseInt(getComputedStyle(a.element).zIndex) || 0;
                const bZIndex = parseInt(getComputedStyle(b.element).zIndex) || 0;
                return bZIndex - aZIndex;
            });
        
        if (visibleModals.length > 0) {
            const [topModalId] = visibleModals[0];
            this.hideModal(topModalId);
        }
    }
    
    /**
     * Handle global click events
     */
    handleGlobalClick(e) {
        // Handle sidebar outside clicks
        this.sidebars.forEach((sidebar, id) => {
            if (sidebar.isVisible && sidebar.closeOnOutsideClick) {
                if (!sidebar.element.contains(e.target) && 
                    (!sidebar.toggleButton || !sidebar.toggleButton.contains(e.target))) {
                    this.hideSidebar(id);
                }
            }
        });
    }
    
    /**
     * Create fallback elements for missing modals/sidebars
     */
    createFallbackElements() {
        if (this.fallbacksCreated) return;
        
        console.log("🔧 Creating fallback modal and sidebar elements...");
        
        this.createFallbackModal("fallback-modal");
        this.createFallbackSidebar("fallback-sidebar");
        
        this.fallbacksCreated = true;
    }
    
    /**
     * Create a fallback modal
     */
    createFallbackModal(modalId) {
        const modal = document.createElement("div");
        modal.id = modalId;
        modal.className = "modal fallback-modal";
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--overlay-dark);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            backdrop-filter: blur(8px);
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: var(--bg-primary);
                border-radius: 12px;
                padding: 2rem;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            ">
                <div class="modal-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid #eee;
                ">
                    <h3 style="margin: 0; color: var(--text-primary);">Modal</h3>
                    <button class="modal-close" style="
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        cursor: pointer;
                        color: var(--text-secondary);
                        padding: 0.5rem;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">&times;</button>
                </div>
                <div class="modal-body" style="color: var(--text-secondary);">
                    <p>This is a fallback modal. Content will be loaded here.</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.registerModal(modalId, modal);
        
        console.log(`🔧 Created fallback modal: ${modalId}`);
    }
    
    /**
     * Create a fallback sidebar
     */
    createFallbackSidebar(sidebarId) {
        const sidebar = document.createElement("div");
        sidebar.id = sidebarId;
        sidebar.className = "sidebar fallback-sidebar sidebar-hidden";
        sidebar.style.cssText = `
            position: fixed;
            top: 0;
            left: -300px;
            width: 300px;
            height: 100vh;
            background: #2c3e50;
            color: white;
            transition: left 0.3s ease;
            z-index: 9998;
            padding: 1rem;
            box-shadow: 2px 0 10px rgba(0,0,0,0.3);
        `;
        
        sidebar.innerHTML = `
            <div class="sidebar-header" style="
                padding-bottom: 1rem;
                border-bottom: 1px solid rgba(255,255,255,0.2);
                margin-bottom: 1rem;
            ">
                <h3 style="margin: 0; color: white;">Menu</h3>
            </div>
            <div class="sidebar-content">
                <p style="color: var(--text-secondary);">This is a fallback sidebar. Navigation items will be loaded here.</p>
            </div>
        `;
        
        // Add CSS for sidebar states
        const style = document.createElement("style");
        style.textContent = `
            .fallback-sidebar.sidebar-visible {
                left: 0 !important;
            }
            .fallback-sidebar.sidebar-hidden {
                left: -300px !important;
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(sidebar);
        this.registerSidebar(sidebarId, sidebar);
        
        // Create toggle button if none exists
        if (!document.querySelector(".hamburger, .sidebar-toggle, .menu-toggle")) {
            this.createFallbackToggleButton(sidebarId);
        }
        
        console.log(`🔧 Created fallback sidebar: ${sidebarId}`);
    }
    
    /**
     * Create a fallback toggle button for sidebar
     */
    createFallbackToggleButton(sidebarId) {
        const toggleButton = document.createElement("button");
        toggleButton.className = "fallback-mobile-toggle";
        toggleButton.innerHTML = "☰";
        toggleButton.style.cssText = `
            position: fixed;
            top: 1rem;
            left: 1rem;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 0.75rem;
            font-size: 1.2rem;
            cursor: pointer;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        `;
        
        toggleButton.addEventListener("click", () => {
            this.toggleSidebar(sidebarId);
        });
        
        document.body.appendChild(toggleButton);
        
        console.log(`🔧 Created fallback toggle button for sidebar: ${sidebarId}`);
    }
    
    /**
     * Get initialization status
     */
    isInitialized() {
        return this.initialized;
    }
    
    /**
     * Get registered modals count
     */
    getModalsCount() {
        return this.modals.size;
    }
    
    /**
     * Get registered sidebars count
     */
    getSidebarsCount() {
        return this.sidebars.size;
    }
}

// Create global instance
window.modalSidebarManager = new ModalSidebarManager();

// Initialize when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        window.modalSidebarManager.initialize();
    });
} else {
    window.modalSidebarManager.initialize();
}

// Export for module use
if (typeof module !== "undefined" && module.exports) {
    module.exports = ModalSidebarManager;
}