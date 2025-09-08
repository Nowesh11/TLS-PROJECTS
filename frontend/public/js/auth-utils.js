// Authentication utility functions for Tamil Language Society website

class AuthUtils {
    constructor() {
        this._isAuthenticated = false;
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.addAuthRequiredListeners();
        this.addEventListeners();
        this.updateUIBasedOnAuth();
    }

    checkAuthStatus() {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");
        const loginTime = localStorage.getItem("loginTime");
        
        if (token && user) {
            try {
                this.currentUser = JSON.parse(user);
                
                // Check if login time exists and extend session to 30 days
                if (loginTime) {
                    const loginTimestamp = parseInt(loginTime);
                    const currentTime = Date.now();
                    const sessionDuration = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
                    
                    if (currentTime - loginTimestamp > sessionDuration) {
                        console.log("Session expired after 30 days");
                        this.logout();
                        return false;
                    }
                    
                    // Refresh login time on each check to extend session
                    localStorage.setItem("loginTime", Date.now().toString());
                } else {
                    // If no login time, set it now for existing sessions
                    localStorage.setItem("loginTime", Date.now().toString());
                }
                
                this._isAuthenticated = true;
                
                // Verify token is not expired (fallback check)
                const tokenData = this.parseJWT(token);
                if (tokenData && tokenData.exp && tokenData.exp * 1000 < Date.now()) {
                    console.log("Token expired");
                    this.logout();
                    return false;
                }
            } catch (error) {
                console.error("Error parsing user data:", error);
                this.logout();
                return false;
            }
        }
        
        return this._isAuthenticated;
    }

    parseJWT(token) {
        try {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(atob(base64).split("").map(function(c) {
                return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(""));
            return JSON.parse(jsonPayload);
        } catch (error) {
            return null;
        }
    }

    requireAuth(action = "perform this action") {
        if (!this._isAuthenticated) {
            this.showAuthModal(action);
            return false;
        }
        return true;
    }

    showAuthModal(action = "continue") {
        const modal = document.createElement("div");
        modal.className = "auth-required-modal";
        modal.innerHTML = `
            <div class="auth-modal-overlay"></div>
            <div class="auth-modal-content">
                <div class="auth-modal-header">
                    <h3><i class="fas fa-lock"></i> Authentication Required</h3>
                    <button class="auth-modal-close">&times;</button>
                </div>
                <div class="auth-modal-body">
                    <div class="auth-icon">
                        <i class="fas fa-user-shield"></i>
                    </div>
                    <h4>Sign In Required</h4>
                    <p>You need to sign in to ${action}. Join our community to access all features!</p>
                    <div class="auth-benefits">
                        <div class="benefit-item">
                            <i class="fas fa-check-circle"></i>
                            <span>Access to premium content</span>
                        </div>
                        <div class="benefit-item">
                            <i class="fas fa-check-circle"></i>
                            <span>Download e-books and resources</span>
                        </div>
                        <div class="benefit-item">
                            <i class="fas fa-check-circle"></i>
                            <span>Chat with admin support</span>
                        </div>
                        <div class="benefit-item">
                            <i class="fas fa-check-circle"></i>
                            <span>Participate in community projects</span>
                        </div>
                    </div>
                    <div class="auth-buttons">
                        <a href="login.html" class="btn btn-primary">
                            <i class="fas fa-sign-in-alt"></i> Sign In
                        </a>
                        <a href="signup.html" class="btn btn-secondary">
                            <i class="fas fa-user-plus"></i> Create Account
                        </a>
                    </div>
                    <p class="auth-note">
                        <i class="fas fa-info-circle"></i>
                        You can browse our website freely, but signing in unlocks all features.
                    </p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = "hidden";
        
        // Close modal events
        const closeModal = () => {
            document.body.removeChild(modal);
            document.body.style.overflow = "";
        };
        
        modal.querySelector(".auth-modal-close").onclick = closeModal;
        modal.querySelector(".auth-modal-overlay").onclick = closeModal;
        
        // Escape key to close
        const escapeHandler = (e) => {
            if (e.key === "Escape") {
                closeModal();
                document.removeEventListener("keydown", escapeHandler);
            }
        };
        document.addEventListener("keydown", escapeHandler);
        
        // Animate modal in
        setTimeout(() => {
            modal.classList.add("show");
        }, 10);
    }

    addAuthRequiredListeners() {
        // Add click listeners to elements that require authentication
        document.addEventListener("click", (e) => {
            const target = e.target.closest("[data-auth-required]");
            if (target) {
                e.preventDefault();
                e.stopPropagation();
                
                const action = target.dataset.authAction || "access this feature";
                if (this.requireAuth(action)) {
                    // If authenticated, proceed with the original action
                    const originalHref = target.getAttribute("href");
                    const originalOnclick = target.getAttribute("onclick");
                    
                    if (originalHref && !originalHref.startsWith("#")) {
                        window.location.href = originalHref;
                    } else if (originalOnclick) {
                        eval(originalOnclick);
                    }
                }
            }
        });
    }

    updateUIBasedOnAuth() {
        const authElements = document.querySelectorAll("[data-auth-show]");
        const noAuthElements = document.querySelectorAll("[data-no-auth-show]");
        
        authElements.forEach(element => {
            element.style.display = this._isAuthenticated ? "" : "none";
        });
        
        noAuthElements.forEach(element => {
            element.style.display = this._isAuthenticated ? "none" : "";
        });
        
        // Update user info in UI
        const userNameElements = document.querySelectorAll("[data-user-name]");
        userNameElements.forEach(element => {
            if (this.currentUser) {
                element.textContent = this.currentUser.name || this.currentUser.email;
            }
        });
    }

    isAuthenticated() {
        return this._isAuthenticated;
    }

    logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("loginTime");
        this._isAuthenticated = false;
        this.currentUser = null;
        this.updateUIBasedOnAuth();
        
        // Dispatch auth state change event
        window.dispatchEvent(new CustomEvent("authStateChanged", {
            detail: { isAuthenticated: false }
        }));
        
        // Redirect to home page, but exclude admin pages from automatic redirection
        const currentPath = window.location.pathname;
        const isAdminPage = currentPath.includes("admin") || window.location.href.includes("admin");
        
        if (!isAdminPage && currentPath !== "/" && currentPath !== "/index.html") {
            window.location.href = "index.html";
        }
    }

    addEventListeners() {
        // Add event listeners for authentication-related actions
        document.addEventListener("click", (e) => {
            // Handle logout buttons
            if (e.target.matches(".logout-btn, [data-action=\"logout\"]")) {
                e.preventDefault();
                this.logout();
            }
            
            // Handle login buttons
            if (e.target.matches(".login-btn, [data-action=\"login\"]")) {
                e.preventDefault();
                window.location.href = "login.html";
            }
            
            // Handle signup buttons
            if (e.target.matches(".signup-btn, [data-action=\"signup\"]")) {
                e.preventDefault();
                window.location.href = "signup.html";
            }
        });
        
        // Listen for auth state changes
        window.addEventListener("authStateChanged", (e) => {
            this.updateUIBasedOnAuth();
        });
    }

    addStyles() {
        const styles = `
            .auth-required-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .auth-required-modal.show {
                opacity: 1;
                visibility: visible;
            }
            
            .auth-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: var(--overlay-blur);
                backdrop-filter: blur(5px);
            }
            
            .auth-modal-content {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 16px;
                max-width: 500px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: var(--shadow-2xl);
                animation: modalSlideIn 0.3s ease;
            }
            
            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -60%);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%);
                }
            }
            
            .auth-modal-header {
                background: var(--theme-gradient);
                color: white;
                padding: 20px 25px;
                border-radius: 16px 16px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .auth-modal-header h3 {
                margin: 0;
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 18px;
            }
            
            .auth-modal-close {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 5px;
                border-radius: 50%;
                transition: background 0.2s;
                width: 35px;
                height: 35px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .auth-modal-close:hover {
                background: var(--bg-overlay, rgba(255, 255, 255, 0.2));
            }
            
            .auth-modal-body {
                padding: 30px 25px;
                text-align: center;
            }
            
            .auth-icon {
                font-size: 48px;
                color: var(--theme-primary);
                margin-bottom: 20px;
            }
            
            .auth-modal-body h4 {
                margin: 0 0 15px 0;
                color: var(--text-primary);
                font-size: 24px;
            }
            
            .auth-modal-body > p {
                color: var(--text-secondary);
                margin-bottom: 25px;
                line-height: 1.6;
                font-size: 16px;
            }
            
            .auth-benefits {
                background: var(--bg-secondary);
                border-radius: 12px;
                padding: 20px;
                margin: 25px 0;
                text-align: left;
            }
            
            .benefit-item {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
                color: var(--text-primary);
            }
            
            .benefit-item:last-child {
                margin-bottom: 0;
            }
            
            .benefit-item i {
                color: var(--success-color);
                font-size: 16px;
                width: 20px;
            }
            
            .auth-buttons {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin: 25px 0;
            }
            
            .auth-buttons .btn {
                padding: 12px 24px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                min-width: 140px;
                justify-content: center;
            }
            
            .auth-buttons .btn-primary {
                background: var(--theme-primary);
                color: white;
                border: 2px solid var(--theme-primary);
            }
            
            .auth-buttons .btn-primary:hover {
                background: var(--theme-secondary);
                border-color: var(--theme-secondary);
                transform: translateY(-1px);
                box-shadow: var(--shadow-primary, 0 4px 12px rgba(37, 99, 235, 0.3));
            }
            
            .auth-buttons .btn-secondary {
                background: transparent;
                color: var(--theme-primary);
                border: 2px solid var(--theme-primary);
            }
            
            .auth-buttons .btn-secondary:hover {
                background: var(--theme-primary);
                color: white;
                transform: translateY(-2px);
                box-shadow: var(--shadow-primary, 0 4px 12px rgba(37, 99, 235, 0.3));
            }
            
            .auth-note {
                font-size: 13px;
                color: var(--text-secondary);
                margin-top: 20px;
                padding: 15px;
                background: var(--bg-info, #e3f2fd);
                border-radius: 8px;
                border-left: 4px solid var(--info-color, #2196f3);
                display: flex;
                align-items: center;
                gap: 8px;
                text-align: left;
            }
            
            .auth-note i {
                color: var(--info-color, #2196f3);
                font-size: 14px;
            }
            
            @media (max-width: 768px) {
                .auth-modal-content {
                    width: 95%;
                    margin: 20px;
                }
                
                .auth-modal-body {
                    padding: 25px 20px;
                }
                
                .auth-buttons {
                    flex-direction: column;
                    gap: 12px;
                }
                
                .auth-buttons .btn {
                    width: 100%;
                }
                
                .auth-icon {
                    font-size: 40px;
                }
                
                .auth-modal-body h4 {
                    font-size: 20px;
                }
            }
        `;
        
        const styleSheet = document.createElement("style");
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
}

// Initialize auth utils when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    window.authUtils = new AuthUtils();
    window.authUtils.addStyles();
});

// Make AuthUtils available globally
window.AuthUtils = AuthUtils;