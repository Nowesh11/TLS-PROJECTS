// Authentication functionality for Tamil Language Society
// Handles login, signup, password reset, and user session management

/**
 * Note: API call function is now centralized in api-integration.js
 * This provides comprehensive error handling, retry logic, and token management
 */

/**
 * Get auth token from storage - now uses centralized TokenManager
 */
function getAuthToken() {
    // Use centralized TokenManager if available
    if (window.tokenManager) {
        return window.tokenManager.getToken();
    }
    
    // Fallback to direct localStorage access for backward compatibility
    const persistentSession = localStorage.getItem("tamil_society_session");
    const sessionData = persistentSession ? JSON.parse(persistentSession) : null;
    
    if (sessionData && sessionData.token) {
        return sessionData.token;
    }
    
    // Also check legacy token storage
    return localStorage.getItem("authToken") || localStorage.getItem("token");
}

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = 7 * 24 * 60 * 60 * 1000; // 7 days
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
        
        this.init();
    }
    
    async init() {
        // Skip initialization on admin pages to avoid conflicts
        const authCurrentPage = window.location.pathname;
        const isAdminPage = authCurrentPage.includes("admin.html") || authCurrentPage.includes("admin");
        
        if (isAdminPage) {
            console.log("Skipping auth manager initialization on admin page");
            return;
        }
        
        await this.loadUserSession();
        this.setupEventListeners();
        this.checkSessionExpiry();
        
        console.log("Auth Manager initialized");
    }
    
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById("login-form");
        if (loginForm) {
            loginForm.addEventListener("submit", (e) => this.handleLogin(e));
        }
        
        // Signup form
        const signupForm = document.getElementById("signup-form");
        if (signupForm) {
            signupForm.addEventListener("submit", (e) => this.handleSignup(e));
        }
        
        // Forgot password form
        const forgotPasswordForm = document.getElementById("forgot-password-form");
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener("submit", (e) => this.handleForgotPassword(e));
        }
        
        // Reset password form
        const resetPasswordForm = document.getElementById("reset-password-form");
        if (resetPasswordForm) {
            resetPasswordForm.addEventListener("submit", (e) => this.handleResetPassword(e));
        }
        
        // Logout functionality
        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("logout-btn") || e.target.closest(".logout-btn")) {
                this.handleLogout();
            }
        });
    }
    
    // Login functionality
    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get("email");
        const password = formData.get("password");
        const remember = formData.get("remember");
        
        // Validate inputs
        if (!this.validateEmail(email)) {
            this.showError("Please enter a valid email address");
            return;
        }
        
        if (!password || password.length < 6) {
            this.showError("Password must be at least 6 characters long");
            return;
        }
        
        // Check login attempts
        if (this.isAccountLocked(email)) {
            this.showError("Account temporarily locked due to too many failed attempts. Please try again later.");
            return;
        }
        
        try {
            console.log("Attempting login for:", email);
            const loginResult = await this.authenticateUser(email, password);
            console.log("Login result:", loginResult);
            
            if (loginResult.success) {
                // Clear failed attempts
                this.clearLoginAttempts(email);
                
                // Create user session
                const userData = {
                    id: loginResult.user.id || this.generateUserId(),
                    email: email,
                    name: loginResult.user.name || email.split("@")[0],
                    role: loginResult.user.role || "user",
                    loginTime: new Date().toISOString(),
                    rememberMe: remember || false,
                    preferences: loginResult.user.preferences || this.getDefaultPreferences(),
                    profile: loginResult.user.profile || {}
                };
                
                console.log("Creating session with userData:", userData);
                console.log("Token received:", loginResult.token ? "Yes" : "No");
                
                this.createSession(userData, loginResult.token);
                
                // Verify session was created
                const sessionCheck = localStorage.getItem("tamil_society_session");
                console.log("Session created successfully:", sessionCheck ? "Yes" : "No");
                if (sessionCheck) {
                    const sessionData = JSON.parse(sessionCheck);
                    console.log("Session data:", sessionData);
                }
                
                this.showSuccess("Login successful");
                
                // Redirect to intended page or dashboard
                let redirectUrl = this.getRedirectUrl();
                
                // If no specific redirect URL and user is admin, redirect to admin page
                if (!redirectUrl) {
                    if (userData.role === "admin") {
                        redirectUrl = "admin.html";
                    } else {
                        redirectUrl = "index.html";
                    }
                }
                
                console.log("Redirecting to:", redirectUrl);
                
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1500);
                
            } else {
                this.recordFailedAttempt(email);
                this.showError(loginResult.message || "Invalid email or password");
            }
            
        } catch (error) {
            console.error("Login error:", error);
            this.showError("Login failed. Please try again.");
        }
    }
    
    // Signup functionality
    async handleSignup(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const firstName = formData.get("firstName");
        const lastName = formData.get("lastName");
        const email = formData.get("email");
        const phone = formData.get("phone");
        const password = formData.get("password");
        const confirmPassword = formData.get("confirmPassword");
        const interest = formData.get("interest");
        const terms = formData.get("terms");
        const newsletter = formData.get("newsletter");
        const notifications = formData.get("notifications");
        
        // Validate inputs
        const validation = this.validateSignupData({
            firstName, lastName, email, password, confirmPassword, terms
        });
        
        if (!validation.isValid) {
            this.showError(validation.message);
            return;
        }
        
        try {
            const signupResult = await this.registerUser({
                firstName,
                lastName,
                email,
                phone,
                password,
                interest,
                preferences: {
                    newsletter: !!newsletter,
                    notifications: !!notifications
                }
            });
            
            if (signupResult.success) {
                // Create user session
                const userData = {
                    id: signupResult.user.id || this.generateUserId(),
                    email: email,
                    name: `${firstName} ${lastName}`,
                    role: signupResult.user.role || "user",
                    phone: phone,
                    interest: interest,
                    signupTime: new Date().toISOString(),
                    preferences: signupResult.user.preferences || {
                        receiveNewsletter: !!newsletter,
                        receiveNotifications: !!notifications,
                        theme: "light",
                        language: "english"
                    },
                    profile: {
                        firstName,
                        lastName,
                        completedProfile: false
                    }
                };
                
                this.createSession(userData, signupResult.token);
                this.showSuccess("IN TAMIL! Account created successfully");
                
                // Send welcome notification
                if (window.notificationManager) {
                    window.notificationManager.addNotification({
                        type: "success",
                        title: "Welcome to Tamil Language Society!",
                        message: `Welcome ${firstName}! Welcome to our community dedicated to Tamil language and culture.`,
                        actions: [
                            { label: "Complete Profile", action: "completeProfile" },
                            { label: "Explore Resources", action: "exploreResources" }
                        ]
                    });
                }
                
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 2000);
                
            } else {
                this.showError(signupResult.message || "Registration failed. Please try again.");
            }
            
        } catch (error) {
            console.error("Signup error:", error);
            this.showError("Registration failed. Please try again.");
        }
    }
    
    // Forgot password functionality
    async handleForgotPassword(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get("email");
        
        if (!this.validateEmail(email)) {
            this.showError("Please enter a valid email address");
            return;
        }
        
        try {
            const result = await this.requestPasswordReset(email);
            
            if (result.success) {
                // Store reset request
                this.storePasswordResetRequest(email);
                this.showSuccess("Password reset instructions sent to your email");
                
                // Trigger step change if on forgot password page
                if (typeof showStep === "function") {
                    showStep(2);
                }
                
            } else {
                this.showError(result.message || "Failed to send reset instructions");
            }
            
        } catch (error) {
            console.error("Forgot password error:", error);
            this.showError("Failed to send reset instructions. Please try again.");
        }
    }
    
    // Reset password functionality
    async handleResetPassword(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const newPassword = formData.get("newPassword");
        const confirmPassword = formData.get("confirmNewPassword");
        const token = new URLSearchParams(window.location.search).get("token");
        
        if (!newPassword || !confirmPassword) {
            this.showError("Please fill in both password fields");
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showError("Passwords do not match");
            return;
        }
        
        if (!this.validatePassword(newPassword)) {
            this.showError("Password does not meet security requirements");
            return;
        }
        
        try {
            const result = await this.resetPassword(token, newPassword);
            
            if (result.success) {
                this.showSuccess("IN TAMIL Password reset successfully");
                
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);
                
            } else {
                this.showError(result.message || "Failed to reset password");
            }
            
        } catch (error) {
            console.error("Reset password error:", error);
            this.showError("Failed to reset password. Please try again.");
        }
    }
    
    // Logout functionality
    async handleLogout() {
        if (confirm("Are you sure you want to logout?")) {
            try {
                // Call the logout API endpoint
                await apiCall("/api/auth/logout", {
                    method: "POST"
                });
                
                // Clear local session
                this.clearSession();
                this.showSuccess("Logged out successfully");
                
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1500);
            } catch (error) {
                console.error("Logout error:", error);
                // Still clear local session even if API call fails
                this.clearSession();
                this.showSuccess("Logged out successfully");
                
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1500);
            }
        }
    }
    
    // Get auth headers for API requests
    getAuthHeaders() {
        const token = getAuthToken();
        const headers = {
            "Content-Type": "application/json"
        };
        
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        
        return headers;
    }
    
    // Authentication with backend API
    async authenticateUser(email, password) {
        try {
            const data = await apiCall("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                    // Don't use auth headers for login request
                },
                body: JSON.stringify({ email, password })
            });
            
            return {
                success: true,
                user: {
                    id: data.user.id || data.user._id,
                    name: data.user.name,
                    email: data.user.email,
                    role: data.user.role,
                    preferences: data.user.preferences,
                    profile: {
                        firstName: data.user.name.split(" ")[0],
                        lastName: data.user.name.split(" ").slice(1).join(" "),
                        completedProfile: true
                    }
                },
                token: data.token
            };
        } catch (error) {
            console.error("Authentication error:", error);
            return {
                success: false,
                message: error.message || "Connection error. Please try again later."
            };
        }
    }
    
    // User registration with backend API
    async registerUser(userData) {
        try {
            const requestData = {
                name: `${userData.firstName} ${userData.lastName}`,
                email: userData.email,
                password: userData.password,
                primaryInterest: userData.interest || "Books",
                preferences: {
                    receiveNewsletter: userData.preferences.newsletter || false,
                    receiveNotifications: userData.preferences.notifications || false,
                    theme: "light",
                    language: "english"
                }
            };
            
            const data = await apiCall("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestData)
            });
            
            return {
                success: true,
                user: {
                    id: data.user._id,
                    name: data.user.name,
                    email: data.user.email,
                    preferences: data.user.preferences,
                    profile: {
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        completedProfile: false
                    }
                },
                token: data.token
            };
        } catch (error) {
            console.error("Registration error:", error);
            return {
                success: false,
                message: error.message || "Connection error. Please try again later."
            };
        }
    }
    
    // Password reset request with backend API
    async requestPasswordReset(email) {
        try {
            const data = await apiCall("/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            });
            
            return {
                success: true,
                message: data.message || "Reset instructions sent to your email"
            };
        } catch (error) {
            console.error("Password reset request error:", error);
            return {
                success: false,
                message: error.message || "Connection error. Please try again later."
            };
        }
    }
    
    // Password reset with backend API
    async resetPassword(token, newPassword) {
        try {
            const data = await apiCall("/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ token, password: newPassword })
            });
            
            return {
                success: true,
                message: data.message || "Password updated successfully"
            };
        } catch (error) {
            console.error("Password reset error:", error);
            return {
                success: false,
                message: error.message || "Connection error. Please try again later."
            };
        }
    }
    
    // Session management
    createSession(userData, token) {
        const now = new Date();
        const sessionData = {
            user: userData,
            token: token, // Store the JWT token
            createdAt: now.toISOString(),
            expiresAt: new Date(now.getTime() + this.sessionTimeout).toISOString()
        };
        
        // Always use localStorage for permanent sessions
        localStorage.setItem("tamil_society_session", JSON.stringify(sessionData));
        this.currentUser = userData;
        
        // Set token in a cookie for API requests
        if (token) {
            document.cookie = `token=${token}; path=/; max-age=${this.sessionTimeout / 1000}; SameSite=Strict`;
        }
        
        this.updateUIForLoggedInUser();
    }
    
    async loadUserSession() {
        let sessionData = null;
        
        // Check if we're on an admin page
        const sessionCurrentPage = window.location.pathname;
        const isAdminPage = sessionCurrentPage.includes("admin.html") || sessionCurrentPage.includes("admin");
        
        // Check localStorage for permanent session
        const persistentSession = localStorage.getItem("tamil_society_session");
        if (persistentSession) {
            sessionData = JSON.parse(persistentSession);
        }
        
        if (sessionData) {
            const now = new Date();
            const expiresAt = new Date(sessionData.expiresAt);
            
            // Check if token is close to expiry (within 1 hour) and refresh if needed
            const timeUntilExpiry = expiresAt.getTime() - now.getTime();
            const oneHour = 60 * 60 * 1000;
            
            if (timeUntilExpiry > 0) {
                // Set user data first to avoid logout during verification
                this.currentUser = sessionData.user;
                if (!isAdminPage) {
                    this.updateUIForLoggedInUser();
                }
                
                // Refresh token if close to expiry and we have a refresh token
                if (timeUntilExpiry < oneHour && sessionData.refreshToken) {
                    try {
                        await this.refreshAuthToken(sessionData);
                    } catch (error) {
                        console.error("Token refresh failed:", error);
                        // If refresh fails, try to continue with current token
                    }
                }
                
                // Only verify token with server if we have a token and not on admin page
                // Skip verification for recently created sessions (within 5 minutes)
                const sessionAge = now.getTime() - new Date(sessionData.createdAt).getTime();
                const skipVerification = sessionAge < 5 * 60 * 1000; // 5 minutes
                
                if (sessionData.token && !isAdminPage && !skipVerification) {
                    try {
                        await apiCall("/api/auth/verify-token", {
                            method: "GET"
                        });
                        
                        console.log("Token verified successfully");
                    } catch (error) {
                        console.error("Error verifying token:", error);
                        // Only clear session if it's a real authentication error, not network issues
                        if (error.status === 401 || error.status === 403) {
                            console.log("Token verification failed with auth error, attempting refresh");
                            // Try to refresh token before clearing session
                            if (sessionData.refreshToken) {
                                try {
                                    await this.refreshAuthToken(sessionData);
                                    console.log("Token refreshed successfully after verification failure");
                                    return true;
                                } catch (refreshError) {
                                    console.log("Token refresh also failed, clearing session");
                                    this.clearSession();
                                    return false;
                                }
                            } else {
                                this.clearSession();
                                return false;
                            }
                        } else {
                            console.log("Token verification failed with network error, keeping session");
                            // Keep the session but log the issue
                        }
                    }
                }
                
                return true;
            } else {
                // Token expired, try to refresh if we have a refresh token
                if (sessionData.refreshToken) {
                    try {
                        await this.refreshAuthToken(sessionData);
                        console.log("Expired token refreshed successfully");
                        return true;
                    } catch (error) {
                        console.log("Token refresh failed, clearing session");
                        if (!isAdminPage) {
                            this.clearSession();
                        }
                        return false;
                    }
                } else {
                    if (!isAdminPage) {
                        console.log("Session expired, clearing session");
                        this.clearSession();
                    } else {
                        console.log("Session expired on admin page, but not clearing to avoid interference");
                    }
                }
            }
        }
        
        // No session found - this is normal for non-logged-in users
        console.log("No valid session found");
        return false;
    }
    
    async refreshAuthToken(currentSessionData) {
        try {
            const response = await apiCall('/api/auth/refresh-token', {
                method: 'POST',
                body: JSON.stringify({ refreshToken: currentSessionData.refreshToken })
            });
            
            if (response.success) {
                // Update session data with new tokens
                const updatedSessionData = {
                    ...currentSessionData,
                    token: response.token || response.accessToken,
                    refreshToken: response.refreshToken,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
                };
                
                // Update stored session
                localStorage.setItem('tamil_society_session', JSON.stringify(updatedSessionData));
                
                // Update cookie
                if (updatedSessionData.token) {
                    document.cookie = `token=${updatedSessionData.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
                }
                
                console.log('Token refreshed successfully');
                return updatedSessionData;
            } else {
                throw new Error(response.error || 'Token refresh failed');
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            throw error;
        }
    }
    
    clearSession() {
        localStorage.removeItem("tamil_society_session");
        
        // Clear the token cookie
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        
        // Clear chat session data
        this.clearChatSession();
        
        this.currentUser = null;
        this.updateUIForLoggedOutUser();
    }
    
    clearChatSession() {
        // Clear chat-related data from localStorage
        localStorage.removeItem("currentChatId");
        localStorage.removeItem("chatMessages");
        localStorage.removeItem("chatHistory");
        
        // Clear chat widget state if it exists
        if (window.chatWidget) {
            window.chatWidget.currentChatId = null;
            window.chatWidget.messages = [];
        }
        
        // Clear admin chat manager state if it exists
        if (window.adminChatManager) {
            window.adminChatManager.currentChatId = null;
            window.adminChatManager.chats = [];
        }
        
        console.log("Chat session data cleared");
    }
    
    checkSessionExpiry() {
        setInterval(async () => {
            // Skip session expiry checks on admin pages - let admin panel handle its own auth
            const expiryCurrentPage = window.location.pathname;
            const isAdminPage = expiryCurrentPage.includes("admin.html") || expiryCurrentPage.includes("admin");
            
            if (isAdminPage) {
                console.log("Skipping session expiry check on admin page");
                return;
            }
            
            if (this.currentUser) {
                const session = localStorage.getItem("tamil_society_session");
                
                if (session) {
                    const sessionData = JSON.parse(session);
                    const now = new Date();
                    const expiresAt = new Date(sessionData.expiresAt);
                    
                    // Check if session has expired locally
                    if (now >= expiresAt) {
                        this.showError("Your session has expired. Please login again.");
                        this.clearSession();
                        setTimeout(() => {
                            window.location.href = "login.html";
                        }, 2000);
                        return;
                    }
                    
                    // Verify token with server every 5 minutes
                    if (sessionData.token && now.getTime() % (5 * 60 * 1000) < 60000) {
                        try {
                            await apiCall("/api/auth/verify-token", {
                                method: "GET"
                            });
                        } catch (error) {
                            console.error("Error verifying token:", error);
                            // Token is invalid or expired on server
                            this.showError("Your session is no longer valid. Please login again.");
                            this.clearSession();
                            setTimeout(() => {
                                window.location.href = "login.html";
                            }, 2000);
                        }
                    }
                }
            }
        }, 60000); // Check every minute
    }
    
    // UI Updates
    updateUIForLoggedInUser() {
        // Update navigation - use more robust selectors
        let loginLink = document.querySelector("a[href=\"login.html\"]") || 
                       document.querySelector(".nav-menu a:last-child:not(.signup-btn)");
        
        // If we can't find by href, look for the login text
        if (!loginLink) {
            const navLinks = document.querySelectorAll(".nav-link");
            for (let link of navLinks) {
                if (link.textContent.trim() === "Login" || link.href.includes("login.html")) {
                    loginLink = link;
                    break;
                }
            }
        }
        
        const signupBtn = document.querySelector("a[href=\"signup.html\"]") || 
                         document.querySelector(".signup-btn");
        
        if (loginLink && this.currentUser) {
            loginLink.textContent = this.currentUser.name;
            loginLink.href = "#";
            loginLink.classList.add("user-name-link");
            
            // Remove existing event listeners to prevent duplicates
            const newLoginLink = loginLink.cloneNode(true);
            loginLink.parentNode.replaceChild(newLoginLink, loginLink);
            
            newLoginLink.addEventListener("click", (e) => {
                e.preventDefault();
                this.showUserMenu(e.target);
            });
        }
        
        if (signupBtn) {
            signupBtn.textContent = "Logout";
            signupBtn.classList.remove("signup-btn");
            signupBtn.classList.add("logout-btn");
            signupBtn.href = "#";
            
            // Remove existing event listeners to prevent duplicates
            const newSignupBtn = signupBtn.cloneNode(true);
            signupBtn.parentNode.replaceChild(newSignupBtn, signupBtn);
            
            newSignupBtn.addEventListener("click", (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }
        
        // Show personalized content
        this.showPersonalizedContent();
    }
    
    updateUIForLoggedOutUser() {
        // Reset navigation to default - use more robust selectors
        let loginLink = document.querySelector(".user-name-link") || 
                       document.querySelector("a[href=\"#\"]") ||
                       document.querySelector(".nav-menu a:last-child:not(.logout-btn)");
        
        // If we can't find by class, look for elements that might be the user name
        if (!loginLink) {
            const navLinks = document.querySelectorAll(".nav-link");
            for (let link of navLinks) {
                if (link.href === "#" || (!link.href.includes(".html") && link.textContent.trim() !== "Logout")) {
                    loginLink = link;
                    break;
                }
            }
        }
        
        const logoutBtn = document.querySelector(".logout-btn");
        
        if (loginLink) {
            loginLink.textContent = "Login";
            loginLink.href = "login.html";
            loginLink.classList.remove("user-name-link");
            
            // Remove existing event listeners
            const newLoginLink = loginLink.cloneNode(true);
            loginLink.parentNode.replaceChild(newLoginLink, loginLink);
        }
        
        if (logoutBtn) {
            logoutBtn.textContent = "Sign Up";
            logoutBtn.classList.remove("logout-btn");
            logoutBtn.classList.add("signup-btn");
            logoutBtn.href = "signup.html";
            
            // Remove existing event listeners
            const newLogoutBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        }
    }
    
    showUserMenu(element) {
        // Create user dropdown menu
        const existingMenu = document.querySelector(".user-dropdown");
        if (existingMenu) {
            existingMenu.remove();
            return;
        }
        
        const menu = document.createElement("div");
        menu.className = "user-dropdown";
        menu.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="user-details">
                    <div class="user-name">${this.currentUser.name}</div>
                    <div class="user-email">${this.currentUser.email}</div>
                </div>
            </div>
            <div class="user-menu-items">
                <a href="#" class="menu-item" onclick="authManager.showProfile()">
                    <i class="fas fa-user"></i> Profile
                </a>
                <a href="notifications.html" class="menu-item">
                    <i class="fas fa-bell"></i> Notifications
                </a>
                <a href="#" class="menu-item" onclick="authManager.showSettings()">
                    <i class="fas fa-cog"></i> Settings
                </a>
                <hr>
                <a href="#" class="menu-item logout-btn" onclick="authManager.handleLogout()">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </a>
            </div>
        `;
        
        // Style the menu
        menu.style.cssText = `
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            border-radius: 0.5rem;
            box-shadow: var(--shadow-xl);
            border: 1px solid var(--gray-200);
            min-width: 250px;
            z-index: 1000;
            animation: fadeInDown 0.3s ease;
        `;
        
        element.style.position = "relative";
        element.appendChild(menu);
        
        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener("click", function closeMenu(e) {
                if (!element.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener("click", closeMenu);
                }
            });
        }, 100);
    }
    
    showPersonalizedContent() {
        if (!this.currentUser) return;
        
        // Add personalized welcome messages
        const heroSubtitle = document.querySelector(".hero-subtitle");
        if (heroSubtitle && window.location.pathname.includes("index.html")) {
            heroSubtitle.innerHTML = `Welcome back ${this.currentUser.name}! Welcome back to your Tamil learning journey.`;
        }
        
        // Update notification preferences
        if (this.currentUser.preferences && window.notificationManager) {
            // Set notification preferences based on user settings
            const preferences = this.currentUser.preferences;
            if (preferences.notifications !== undefined) {
                // Apply user's notification preferences
                console.log("Applied user notification preferences");
            }
        }
    }
    
    showProfile() {
        // Implementation for profile modal/page
        window.TamilSociety.showNotification("Profile feature coming soon!");
    }
    
    showSettings() {
        // Implementation for settings modal/page
        window.TamilSociety.showNotification("Settings feature coming soon!");
    }
    
    // Validation functions
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    validatePassword(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
        const minLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);
        
        return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
    }
    
    validateSignupData({ firstName, lastName, email, password, confirmPassword, terms }) {
        if (!firstName || firstName.trim().length < 2) {
            return { isValid: false, message: "First name must be at least 2 characters long" };
        }
        
        if (!lastName || lastName.trim().length < 2) {
            return { isValid: false, message: "Last name must be at least 2 characters long" };
        }
        
        if (!this.validateEmail(email)) {
            return { isValid: false, message: "Please enter a valid email address" };
        }
        
        if (!this.validatePassword(password)) {
            return { isValid: false, message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character" };
        }
        
        if (password !== confirmPassword) {
            return { isValid: false, message: "Passwords do not match" };
        }
        
        if (!terms) {
            return { isValid: false, message: "Please accept the terms and conditions" };
        }
        
        return { isValid: true };
    }
    
    // Login attempt tracking
    getLoginAttempts(email) {
        const attempts = JSON.parse(localStorage.getItem("login_attempts") || "{}");
        return attempts[email] || { count: 0, lastAttempt: null };
    }
    
    recordFailedAttempt(email) {
        const attempts = JSON.parse(localStorage.getItem("login_attempts") || "{}");
        
        if (!attempts[email]) {
            attempts[email] = { count: 0, lastAttempt: null };
        }
        
        attempts[email].count += 1;
        attempts[email].lastAttempt = new Date().toISOString();
        
        localStorage.setItem("login_attempts", JSON.stringify(attempts));
    }
    
    clearLoginAttempts(email) {
        const attempts = JSON.parse(localStorage.getItem("login_attempts") || "{}");
        delete attempts[email];
        localStorage.setItem("login_attempts", JSON.stringify(attempts));
    }
    
    isAccountLocked(email) {
        const attempts = this.getLoginAttempts(email);
        
        if (attempts.count >= this.maxLoginAttempts) {
            const lastAttempt = new Date(attempts.lastAttempt);
            const now = new Date();
            const timeDiff = now - lastAttempt;
            
            return timeDiff < this.lockoutDuration;
        }
        
        return false;
    }
    
    // Utility functions
    getStoredUsers() {
        return JSON.parse(localStorage.getItem("tamil_society_users") || "[]");
    }
    
    generateUserId() {
        return "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    }
    
    hashPassword(password) {
        // Simple hash for demo purposes - in real app use proper hashing
        let hash = 0;
        if (password.length === 0) return hash;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }
    
    storePasswordResetRequest(email) {
        const resetData = {
            email: email,
            timestamp: new Date().toISOString(),
            token: this.generateResetToken()
        };
        
        localStorage.setItem("password_reset_request", JSON.stringify(resetData));
        return resetData.token;
    }
    
    getPasswordResetRequest() {
        const resetData = localStorage.getItem("password_reset_request");
        return resetData ? JSON.parse(resetData) : null;
    }
    
    generateResetToken() {
        return "reset_" + Date.now() + "_" + Math.random().toString(36).substr(2, 16);
    }
    
    getDefaultPreferences() {
        return {
            language: "bilingual",
            notifications: true,
            newsletter: false,
            emailUpdates: true,
            theme: "light"
        };
    }
    
    getRedirectUrl() {
        return sessionStorage.getItem("redirect_after_login");
    }
    
    setRedirectUrl(url) {
        sessionStorage.setItem("redirect_after_login", url);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Error and success handling
    showError(message) {
        if (window.TamilSociety && window.TamilSociety.showNotification) {
            window.TamilSociety.showNotification(message, "error");
        } else {
            alert("Error: " + message);
        }
    }
    
    showSuccess(message) {
        if (window.TamilSociety && window.TamilSociety.showNotification) {
            window.TamilSociety.showNotification(message, "success");
        } else {
            alert("Success: " + message);
        }
    }
    
    // Public API methods
    getCurrentUser() {
        return this.currentUser;
    }
    
    isLoggedIn() {
        return !!this.currentUser;
    }
    
    requireAuth(redirectUrl = null) {
        if (!this.isLoggedIn()) {
            if (redirectUrl) {
                this.setRedirectUrl(redirectUrl);
            }
            window.location.href = "login.html";
            return false;
        }
        return true;
    }
    
    updateUserProfile(profileData) {
        if (!this.currentUser) return false;
        
        // Update current user data
        Object.assign(this.currentUser.profile, profileData);
        
        // Update stored session
        const sessionData = JSON.parse(localStorage.getItem("tamil_society_session"));
        if (sessionData) {
            Object.assign(sessionData.user.profile, profileData);
            localStorage.setItem("tamil_society_session", JSON.stringify(sessionData));
        }
        
        // Update stored users
        const users = this.getStoredUsers();
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            Object.assign(users[userIndex].profile, profileData);
            localStorage.setItem("tamil_society_users", JSON.stringify(users));
        }
        
        return true;
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    // Skip auth manager initialization on admin pages
    const domCurrentPage = window.location.pathname;
    const isAdminPage = domCurrentPage.includes("admin.html") || domCurrentPage.includes("admin");
    
    if (isAdminPage) {
        console.log("Skipping auth manager initialization on admin page");
        return;
    }
    
    window.authManager = new AuthManager();
    
    // Expose to global scope
    window.TamilSociety = window.TamilSociety || {};
    window.TamilSociety.auth = window.authManager;
});

// Add CSS for user dropdown
const dropdownStyles = document.createElement("style");
dropdownStyles.textContent = `
    .user-dropdown {
        background: white;
        border-radius: 0.75rem;
        box-shadow: var(--shadow-xl);
        border: 1px solid var(--gray-200);
        overflow: hidden;
    }
    
    .user-info {
        padding: 1rem;
        border-bottom: 1px solid var(--gray-200);
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .user-avatar {
        font-size: 2rem;
        color: var(--primary-blue);
    }
    
    .user-name {
        font-weight: 600;
        color: var(--gray-900);
        font-size: 0.9rem;
    }
    
    .user-email {
        font-size: 0.8rem;
        color: var(--gray-500);
    }
    
    .user-menu-items {
        padding: 0.5rem 0;
    }
    
    .menu-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        color: var(--gray-700);
        text-decoration: none;
        font-size: 0.9rem;
        transition: all 0.2s ease;
    }
    
    .menu-item:hover {
        background: var(--gray-50);
        color: var(--primary-blue);
    }
    
    .menu-item i {
        width: 1rem;
        text-align: center;
    }
    
    .user-menu-items hr {
        margin: 0.5rem 0;
        border: none;
        height: 1px;
        background: var(--gray-200);
    }
`;

document.head.appendChild(dropdownStyles);

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
    module.exports = AuthManager;
}
