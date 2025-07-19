// Authentication functionality for Tamil Language Society
// Handles login, signup, password reset, and user session management

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
        
        this.init();
    }
    
    init() {
        this.loadUserSession();
        this.setupEventListeners();
        this.checkSessionExpiry();
        
        console.log('Auth Manager initialized');
    }
    
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Signup form
        const signupForm = document.getElementById('signup-form');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }
        
        // Forgot password form
        const forgotPasswordForm = document.getElementById('forgot-password-form');
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', (e) => this.handleForgotPassword(e));
        }
        
        // Reset password form
        const resetPasswordForm = document.getElementById('reset-password-form');
        if (resetPasswordForm) {
            resetPasswordForm.addEventListener('submit', (e) => this.handleResetPassword(e));
        }
        
        // Logout functionality
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('logout-btn') || e.target.closest('.logout-btn')) {
                this.handleLogout();
            }
        });
    }
    
    // Login functionality
    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const remember = formData.get('remember');
        
        // Validate inputs
        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }
        
        if (!password || password.length < 6) {
            this.showError('Password must be at least 6 characters long');
            return;
        }
        
        // Check login attempts
        if (this.isAccountLocked(email)) {
            this.showError('Account temporarily locked due to too many failed attempts. Please try again later.');
            return;
        }
        
        try {
            const loginResult = await this.authenticateUser(email, password);
            
            if (loginResult.success) {
                // Clear failed attempts
                this.clearLoginAttempts(email);
                
                // Create user session
                const userData = {
                    id: loginResult.user.id || this.generateUserId(),
                    email: email,
                    name: loginResult.user.name || email.split('@')[0],
                    loginTime: new Date().toISOString(),
                    rememberMe: remember || false,
                    preferences: loginResult.user.preferences || this.getDefaultPreferences(),
                    profile: loginResult.user.profile || {}
                };
                
                this.createSession(userData);
                this.showSuccess('வணக்கம்! Login successful');
                
                // Redirect to intended page or dashboard
                const redirectUrl = this.getRedirectUrl() || 'index.html';
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1500);
                
            } else {
                this.recordFailedAttempt(email);
                this.showError(loginResult.message || 'Invalid email or password');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed. Please try again.');
        }
    }
    
    // Signup functionality
    async handleSignup(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const firstName = formData.get('firstName');
        const lastName = formData.get('lastName');
        const email = formData.get('email');
        const phone = formData.get('phone');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const interest = formData.get('interest');
        const terms = formData.get('terms');
        const newsletter = formData.get('newsletter');
        const notifications = formData.get('notifications');
        
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
                    phone: phone,
                    interest: interest,
                    signupTime: new Date().toISOString(),
                    preferences: {
                        newsletter: !!newsletter,
                        notifications: !!notifications,
                        language: 'bilingual'
                    },
                    profile: {
                        firstName,
                        lastName,
                        completedProfile: false
                    }
                };
                
                this.createSession(userData);
                this.showSuccess('கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது! Account created successfully');
                
                // Send welcome notification
                if (window.notificationManager) {
                    window.notificationManager.addNotification({
                        type: 'success',
                        title: 'Welcome to Tamil Language Society!',
                        message: `வணக்கம் ${firstName}! நமது தமிழ் மொழி சமூகத்தில் நல்வரவு. Welcome to our community dedicated to Tamil language and culture.`,
                        actions: [
                            { label: 'Complete Profile', action: 'completeProfile' },
                            { label: 'Explore Resources', action: 'exploreResources' }
                        ]
                    });
                }
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                
            } else {
                this.showError(signupResult.message || 'Registration failed. Please try again.');
            }
            
        } catch (error) {
            console.error('Signup error:', error);
            this.showError('Registration failed. Please try again.');
        }
    }
    
    // Forgot password functionality
    async handleForgotPassword(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get('email');
        
        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }
        
        try {
            const result = await this.requestPasswordReset(email);
            
            if (result.success) {
                // Store reset request
                this.storePasswordResetRequest(email);
                this.showSuccess('Password reset instructions sent to your email');
                
                // Trigger step change if on forgot password page
                if (typeof showStep === 'function') {
                    showStep(2);
                }
                
            } else {
                this.showError(result.message || 'Failed to send reset instructions');
            }
            
        } catch (error) {
            console.error('Forgot password error:', error);
            this.showError('Failed to send reset instructions. Please try again.');
        }
    }
    
    // Reset password functionality
    async handleResetPassword(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmNewPassword');
        const token = new URLSearchParams(window.location.search).get('token');
        
        if (!newPassword || !confirmPassword) {
            this.showError('Please fill in both password fields');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }
        
        if (!this.validatePassword(newPassword)) {
            this.showError('Password does not meet security requirements');
            return;
        }
        
        try {
            const result = await this.resetPassword(token, newPassword);
            
            if (result.success) {
                this.showSuccess('கடவுச்சொல் வெற்றிகரமாக மாற்றப்பட்டது! Password reset successfully');
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                
            } else {
                this.showError(result.message || 'Failed to reset password');
            }
            
        } catch (error) {
            console.error('Reset password error:', error);
            this.showError('Failed to reset password. Please try again.');
        }
    }
    
    // Logout functionality
    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            this.clearSession();
            this.showSuccess('நன்றி! Logged out successfully');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }
    }
    
    // Authentication simulation (frontend-only)
    async authenticateUser(email, password) {
        // Simulate API call delay
        await this.delay(1000);
        
        // Get stored users
        const users = this.getStoredUsers();
        const user = users.find(u => u.email === email);
        
        if (!user) {
            return {
                success: false,
                message: 'Account not found. Please sign up first.'
            };
        }
        
        // Simple password check (in real app, this would be hashed)
        if (user.password !== this.hashPassword(password)) {
            return {
                success: false,
                message: 'Invalid password'
            };
        }
        
        return {
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                preferences: user.preferences,
                profile: user.profile
            }
        };
    }
    
    // User registration simulation
    async registerUser(userData) {
        // Simulate API call delay
        await this.delay(1500);
        
        // Check if user already exists
        const users = this.getStoredUsers();
        const existingUser = users.find(u => u.email === userData.email);
        
        if (existingUser) {
            return {
                success: false,
                message: 'An account with this email already exists'
            };
        }
        
        // Create new user
        const newUser = {
            id: this.generateUserId(),
            name: `${userData.firstName} ${userData.lastName}`,
            email: userData.email,
            phone: userData.phone,
            password: this.hashPassword(userData.password),
            interest: userData.interest,
            preferences: userData.preferences,
            profile: {
                firstName: userData.firstName,
                lastName: userData.lastName,
                completedProfile: false
            },
            createdAt: new Date().toISOString()
        };
        
        // Store user
        users.push(newUser);
        localStorage.setItem('tamil_society_users', JSON.stringify(users));
        
        return {
            success: true,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                preferences: newUser.preferences,
                profile: newUser.profile
            }
        };
    }
    
    // Password reset request simulation
    async requestPasswordReset(email) {
        await this.delay(1000);
        
        const users = this.getStoredUsers();
        const user = users.find(u => u.email === email);
        
        if (!user) {
            return {
                success: false,
                message: 'No account found with this email address'
            };
        }
        
        return {
            success: true,
            message: 'Reset instructions sent'
        };
    }
    
    // Password reset simulation
    async resetPassword(token, newPassword) {
        await this.delay(1000);
        
        // In a real app, you'd validate the token
        if (!token && !this.getPasswordResetRequest()) {
            return {
                success: false,
                message: 'Invalid or expired reset token'
            };
        }
        
        return {
            success: true,
            message: 'Password updated successfully'
        };
    }
    
    // Session management
    createSession(userData) {
        const sessionData = {
            user: userData,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + this.sessionTimeout).toISOString()
        };
        
        const storageKey = userData.rememberMe ? 'tamil_society_session' : 'tamil_society_session_temp';
        const storage = userData.rememberMe ? localStorage : sessionStorage;
        
        storage.setItem(storageKey, JSON.stringify(sessionData));
        this.currentUser = userData;
        
        this.updateUIForLoggedInUser();
    }
    
    loadUserSession() {
        let sessionData = null;
        
        // Check localStorage first (remember me)
        const persistentSession = localStorage.getItem('tamil_society_session');
        if (persistentSession) {
            sessionData = JSON.parse(persistentSession);
        } else {
            // Check sessionStorage (current session)
            const tempSession = sessionStorage.getItem('tamil_society_session_temp');
            if (tempSession) {
                sessionData = JSON.parse(tempSession);
            }
        }
        
        if (sessionData) {
            const now = new Date();
            const expiresAt = new Date(sessionData.expiresAt);
            
            if (now < expiresAt) {
                this.currentUser = sessionData.user;
                this.updateUIForLoggedInUser();
                return true;
            } else {
                this.clearSession();
            }
        }
        
        return false;
    }
    
    clearSession() {
        localStorage.removeItem('tamil_society_session');
        sessionStorage.removeItem('tamil_society_session_temp');
        this.currentUser = null;
        this.updateUIForLoggedOutUser();
    }
    
    checkSessionExpiry() {
        setInterval(() => {
            if (this.currentUser) {
                const session = localStorage.getItem('tamil_society_session') || 
                               sessionStorage.getItem('tamil_society_session_temp');
                
                if (session) {
                    const sessionData = JSON.parse(session);
                    const now = new Date();
                    const expiresAt = new Date(sessionData.expiresAt);
                    
                    if (now >= expiresAt) {
                        this.showError('Your session has expired. Please login again.');
                        this.clearSession();
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 2000);
                    }
                }
            }
        }, 60000); // Check every minute
    }
    
    // UI Updates
    updateUIForLoggedInUser() {
        // Update navigation
        const loginLink = document.querySelector('a[href="login.html"]');
        const signupBtn = document.querySelector('a[href="signup.html"]');
        
        if (loginLink && this.currentUser) {
            loginLink.textContent = this.currentUser.name;
            loginLink.href = '#';
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showUserMenu(e.target);
            });
        }
        
        if (signupBtn) {
            signupBtn.textContent = 'Logout';
            signupBtn.classList.remove('signup-btn');
            signupBtn.classList.add('logout-btn');
            signupBtn.href = '#';
        }
        
        // Show personalized content
        this.showPersonalizedContent();
    }
    
    updateUIForLoggedOutUser() {
        // Reset navigation to default
        const loginLink = document.querySelector('a[href="#"]');
        const logoutBtn = document.querySelector('.logout-btn');
        
        if (loginLink) {
            loginLink.textContent = 'Login';
            loginLink.href = 'login.html';
        }
        
        if (logoutBtn) {
            logoutBtn.textContent = 'Sign Up';
            logoutBtn.classList.remove('logout-btn');
            logoutBtn.classList.add('signup-btn');
            logoutBtn.href = 'signup.html';
        }
    }
    
    showUserMenu(element) {
        // Create user dropdown menu
        const existingMenu = document.querySelector('.user-dropdown');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }
        
        const menu = document.createElement('div');
        menu.className = 'user-dropdown';
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
        
        element.style.position = 'relative';
        element.appendChild(menu);
        
        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!element.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }
    
    showPersonalizedContent() {
        if (!this.currentUser) return;
        
        // Add personalized welcome messages
        const heroSubtitle = document.querySelector('.hero-subtitle');
        if (heroSubtitle && window.location.pathname.includes('index.html')) {
            heroSubtitle.innerHTML = `வணக்கம் ${this.currentUser.name}! Welcome back to your Tamil learning journey.`;
        }
        
        // Update notification preferences
        if (this.currentUser.preferences && window.notificationManager) {
            // Set notification preferences based on user settings
            const preferences = this.currentUser.preferences;
            if (preferences.notifications !== undefined) {
                // Apply user's notification preferences
                console.log('Applied user notification preferences');
            }
        }
    }
    
    showProfile() {
        // Implementation for profile modal/page
        window.TamilSociety.showNotification('Profile feature coming soon!');
    }
    
    showSettings() {
        // Implementation for settings modal/page
        window.TamilSociety.showNotification('Settings feature coming soon!');
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
            return { isValid: false, message: 'First name must be at least 2 characters long' };
        }
        
        if (!lastName || lastName.trim().length < 2) {
            return { isValid: false, message: 'Last name must be at least 2 characters long' };
        }
        
        if (!this.validateEmail(email)) {
            return { isValid: false, message: 'Please enter a valid email address' };
        }
        
        if (!this.validatePassword(password)) {
            return { isValid: false, message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' };
        }
        
        if (password !== confirmPassword) {
            return { isValid: false, message: 'Passwords do not match' };
        }
        
        if (!terms) {
            return { isValid: false, message: 'Please accept the terms and conditions' };
        }
        
        return { isValid: true };
    }
    
    // Login attempt tracking
    getLoginAttempts(email) {
        const attempts = JSON.parse(localStorage.getItem('login_attempts') || '{}');
        return attempts[email] || { count: 0, lastAttempt: null };
    }
    
    recordFailedAttempt(email) {
        const attempts = JSON.parse(localStorage.getItem('login_attempts') || '{}');
        
        if (!attempts[email]) {
            attempts[email] = { count: 0, lastAttempt: null };
        }
        
        attempts[email].count += 1;
        attempts[email].lastAttempt = new Date().toISOString();
        
        localStorage.setItem('login_attempts', JSON.stringify(attempts));
    }
    
    clearLoginAttempts(email) {
        const attempts = JSON.parse(localStorage.getItem('login_attempts') || '{}');
        delete attempts[email];
        localStorage.setItem('login_attempts', JSON.stringify(attempts));
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
        return JSON.parse(localStorage.getItem('tamil_society_users') || '[]');
    }
    
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
        
        localStorage.setItem('password_reset_request', JSON.stringify(resetData));
        return resetData.token;
    }
    
    getPasswordResetRequest() {
        const resetData = localStorage.getItem('password_reset_request');
        return resetData ? JSON.parse(resetData) : null;
    }
    
    generateResetToken() {
        return 'reset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
    }
    
    getDefaultPreferences() {
        return {
            language: 'bilingual',
            notifications: true,
            newsletter: false,
            emailUpdates: true,
            theme: 'light'
        };
    }
    
    getRedirectUrl() {
        return sessionStorage.getItem('redirect_after_login');
    }
    
    setRedirectUrl(url) {
        sessionStorage.setItem('redirect_after_login', url);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Error and success handling
    showError(message) {
        if (window.TamilSociety && window.TamilSociety.showNotification) {
            window.TamilSociety.showNotification(message, 'error');
        } else {
            alert('Error: ' + message);
        }
    }
    
    showSuccess(message) {
        if (window.TamilSociety && window.TamilSociety.showNotification) {
            window.TamilSociety.showNotification(message, 'success');
        } else {
            alert('Success: ' + message);
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
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }
    
    updateUserProfile(profileData) {
        if (!this.currentUser) return false;
        
        // Update current user data
        Object.assign(this.currentUser.profile, profileData);
        
        // Update stored session
        const sessionStorage = localStorage.getItem('tamil_society_session') ? localStorage : sessionStorage;
        const sessionKey = localStorage.getItem('tamil_society_session') ? 'tamil_society_session' : 'tamil_society_session_temp';
        
        const sessionData = JSON.parse(sessionStorage.getItem(sessionKey));
        if (sessionData) {
            Object.assign(sessionData.user.profile, profileData);
            sessionStorage.setItem(sessionKey, JSON.stringify(sessionData));
        }
        
        // Update stored users
        const users = this.getStoredUsers();
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            Object.assign(users[userIndex].profile, profileData);
            localStorage.setItem('tamil_society_users', JSON.stringify(users));
        }
        
        return true;
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.authManager = new AuthManager();
    
    // Expose to global scope
    window.TamilSociety = window.TamilSociety || {};
    window.TamilSociety.auth = window.authManager;
});

// Add CSS for user dropdown
const dropdownStyles = document.createElement('style');
dropdownStyles.textContent = `
    .user-dropdown {
        background: white;
        border-radius: 0.75rem;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
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
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}
