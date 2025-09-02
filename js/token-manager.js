// Token Management System for Tamil Language Society
// Handles JWT token creation, validation, and refresh

class TokenManager {
    constructor() {
        this.tokenKey = "tamil_society_session";
        this.fallbackTokenKey = "token";
        this.refreshTokenKey = "refresh_token";
        this.userKey = "user";
        this.refreshThreshold = 5 * 60 * 1000; // 5 minutes before expiry
        this.maxRetries = 3;
        
        // Cache for token validation
        this._cachedToken = null;
        this._tokenCacheTime = 0;
        this._cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        // Refresh token management
        this._refreshInProgress = false;
        this._refreshPromise = null;
        
        this.init();
    }
    
    init() {
        // Clean up any old test tokens on initialization
        this.cleanupTestTokens();
        
        // Set up periodic token validation
        this.startTokenValidation();
    }
    
    /**
     * Clean up hardcoded test tokens
     */
    cleanupTestTokens() {
        const testTokens = [
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OGI4NTdlNzU1MzEwMmIxMDczZTViOSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NTI0ODQ3MiwiZXhwIjoxNzU3ODQwNDcyfQ.EuYVf8m1YEiPVWDtYr0CYeJVqyNCNrSGhFDi3fnGLnE"
        ];
        
        const currentToken = this.getStoredToken();
        if (currentToken && testTokens.includes(currentToken)) {
            console.warn("Removing hardcoded test token");
            this.clearSession();
        }
    }
    
    /**
     * Get token from storage with caching
     */
    getToken() {
        // Return cached token if valid
        if (this._cachedToken && this._tokenCacheTime && 
            (Date.now() - this._tokenCacheTime < this._cacheTimeout)) {
            return this._cachedToken;
        }
        
        const token = this.getStoredToken();
        
        if (token && this.isValidTokenFormat(token)) {
            // Cache the token
            this._cachedToken = token;
            this._tokenCacheTime = Date.now();
            return token;
        }
        
        return null;
    }
    
    /**
     * Get token from storage without caching
     */
    getStoredToken() {
        // Try session data first
        const sessionData = localStorage.getItem(this.tokenKey);
        if (sessionData) {
            try {
                const parsed = JSON.parse(sessionData);
                if (parsed.token) {
                    return parsed.token;
                }
            } catch (e) {
                console.error("Error parsing session data:", e);
            }
        }
        
        // Try fallback token storage
        const directToken = localStorage.getItem(this.fallbackTokenKey);
        if (directToken) {
            return directToken;
        }
        
        // Try authToken as last resort
        return localStorage.getItem("authToken");
    }
    
    /**
     * Validate token format (basic JWT structure check)
     */
    isValidTokenFormat(token) {
        if (!token || typeof token !== "string") {
            return false;
        }
        
        const parts = token.split(".");
        return parts.length === 3;
    }
    
    /**
     * Parse JWT token payload
     */
    parseToken(token) {
        if (!this.isValidTokenFormat(token)) {
            return null;
        }
        
        try {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
                atob(base64).split("").map(c => 
                    "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
                ).join("")
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error("Error parsing token:", error);
            return null;
        }
    }
    
    /**
     * Check if token is expired
     */
    isTokenExpired(token) {
        const payload = this.parseToken(token);
        if (!payload || !payload.exp) {
            return true;
        }
        
        const currentTime = Math.floor(Date.now() / 1000);
        return payload.exp < currentTime;
    }
    
    /**
     * Check if token needs refresh (within threshold of expiry)
     */
    needsRefresh(token) {
        const payload = this.parseToken(token);
        if (!payload || !payload.exp) {
            return true;
        }
        
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = (payload.exp - currentTime) * 1000;
        
        return timeUntilExpiry < this.refreshThreshold;
    }
    
    /**
     * Store token and user data with optional refresh token
     */
    storeToken(token, userData, refreshToken = null) {
        if (!this.isValidTokenFormat(token)) {
            throw new Error("Invalid token format");
        }
        
        const sessionData = {
            token: token,
            refreshToken: refreshToken,
            user: userData,
            createdAt: new Date().toISOString(),
            expiresAt: this.getTokenExpiry(token)
        };
        
        // Store in primary location
        localStorage.setItem(this.tokenKey, JSON.stringify(sessionData));
        
        // Store in fallback locations for compatibility
        localStorage.setItem(this.fallbackTokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(userData));
        
        // Store refresh token separately for security
        if (refreshToken) {
            localStorage.setItem(this.refreshTokenKey, refreshToken);
        }
        
        // Update cache
        this._cachedToken = token;
        this._tokenCacheTime = Date.now();
        
        console.log("Token stored successfully", refreshToken ? "with refresh token" : "");
    }
    
    /**
     * Get token expiry date
     */
    getTokenExpiry(token) {
        const payload = this.parseToken(token);
        if (payload && payload.exp) {
            return new Date(payload.exp * 1000).toISOString();
        }
        // Default to 30 days if no expiry found
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    
    /**
     * Clear all token data
     */
    clearSession() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.fallbackTokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        localStorage.removeItem("authToken");
        localStorage.removeItem(this.userKey);
        localStorage.removeItem("loginTime");
        
        // Clear cache
        this._cachedToken = null;
        this._tokenCacheTime = 0;
        
        // Reset refresh state
        this._refreshInProgress = false;
        this._refreshPromise = null;
        
        console.log("Session cleared");
    }
    
    /**
     * Validate token with server
     */
    async validateTokenWithServer(token) {
        if (!token) {
            return false;
        }
        
        try {
            const response = await fetch(`${window.TLS_API_BASE_URL || "http://localhost:8080"}/api/auth/verify-token`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                credentials: "include"
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.success;
            }
            
            return false;
        } catch (error) {
            console.error("Token validation error:", error);
            return false;
        }
    }
    
    /**
     * Get refresh token from storage
     */
    getRefreshToken() {
        // Try session data first
        const sessionData = localStorage.getItem(this.tokenKey);
        if (sessionData) {
            try {
                const parsed = JSON.parse(sessionData);
                if (parsed.refreshToken) {
                    return parsed.refreshToken;
                }
            } catch (e) {
                console.error("Error parsing session data for refresh token:", e);
            }
        }
        
        // Try direct refresh token storage
        return localStorage.getItem(this.refreshTokenKey);
    }
    
    /**
     * Refresh token if needed with proper refresh token flow
     */
    async refreshTokenIfNeeded() {
        // Prevent concurrent refresh attempts
        if (this._refreshInProgress) {
            console.log("Refresh already in progress, waiting...");
            return await this._refreshPromise;
        }
        
        const token = this.getToken();
        
        if (!token) {
            return null;
        }
        
        if (this.isTokenExpired(token)) {
            console.log("Token expired, attempting refresh...");
            return await this.attemptTokenRefresh();
        }
        
        if (this.needsRefresh(token)) {
            console.log("Token needs refresh, validating with server");
            const isValid = await this.validateTokenWithServer(token);
            
            if (!isValid) {
                console.log("Token invalid, attempting refresh...");
                return await this.attemptTokenRefresh();
            }
        }
        
        return token;
    }
    
    /**
     * Attempt to refresh token using refresh token or admin credentials
     */
    async attemptTokenRefresh() {
        // Set refresh in progress and create promise
        this._refreshInProgress = true;
        this._refreshPromise = this._performTokenRefresh();
        
        try {
            const result = await this._refreshPromise;
            return result;
        } finally {
            this._refreshInProgress = false;
            this._refreshPromise = null;
        }
    }
    
    /**
     * Internal method to perform the actual token refresh
     */
    async _performTokenRefresh() {
        const refreshToken = this.getRefreshToken();
        
        // Try refresh token endpoint first if available
        if (refreshToken) {
            try {
                console.log("Attempting token refresh with refresh token...");
                
                const response = await fetch(`${window.TLS_API_BASE_URL || "http://localhost:8080"}/api/auth/refresh`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        refreshToken: refreshToken
                    })
                });
                
                if (response.ok) {
                    const refreshData = await response.json();
                    console.log("Token refresh successful with refresh token");
                    
                    // Store the new tokens
                    this.storeToken(
                        refreshData.accessToken || refreshData.token,
                        refreshData.user,
                        refreshData.refreshToken || refreshToken
                    );
                    
                    // Clear cache to force fresh token retrieval
                    this._cachedToken = null;
                    this._tokenCacheTime = 0;
                    
                    return refreshData.accessToken || refreshData.token;
                } else {
                    console.log("Refresh token invalid or expired, falling back to re-authentication");
                }
            } catch (error) {
                console.error("Refresh token error:", error);
            }
        }
        
        // Fallback to re-authentication with admin credentials
        try {
            console.log("Attempting token refresh with admin credentials...");
            
            const response = await fetch(`${window.TLS_API_BASE_URL || "http://localhost:8080"}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    email: "admin@tamilsociety.org",
                    password: "Admin123!"
                })
            });
            
            if (response.ok) {
                const loginData = await response.json();
                console.log("Token refresh successful via re-authentication");
                
                // Store the new session data
                this.storeToken(
                    loginData.token,
                    loginData.user,
                    loginData.refreshToken
                );
                
                // Clear cache to force fresh token retrieval
                this._cachedToken = null;
                this._tokenCacheTime = 0;
                
                return loginData.token;
            } else {
                console.log("Token refresh failed:", response.status);
                this.clearSession();
                return null;
            }
        } catch (error) {
            console.error("Token refresh error:", error);
            this.clearSession();
            return null;
        }
    }
    
    /**
     * Start periodic token validation
     */
    startTokenValidation() {
        // Check token every 5 minutes
        setInterval(async () => {
            await this.refreshTokenIfNeeded();
        }, 5 * 60 * 1000);
    }
    
    /**
     * Get user data from storage
     */
    getUserData() {
        const sessionData = localStorage.getItem(this.tokenKey);
        if (sessionData) {
            try {
                const parsed = JSON.parse(sessionData);
                return parsed.user;
            } catch (e) {
                console.error("Error parsing user data:", e);
            }
        }
        
        // Fallback to direct user storage
        const userData = localStorage.getItem(this.userKey);
        if (userData) {
            try {
                return JSON.parse(userData);
            } catch (e) {
                console.error("Error parsing fallback user data:", e);
            }
        }
        
        return null;
    }
    
    /**
     * Check if user is authenticated
     */
    async isAuthenticated() {
        const token = await this.refreshTokenIfNeeded();
        return !!token;
    }
    
    /**
     * Check if user is admin
     */
    isAdmin() {
        const userData = this.getUserData();
        return userData && (userData.role === "admin" || userData.isAdmin === true);
    }
    
    /**
     * Get comprehensive token status information
     */
    getTokenStatus() {
        const token = this.getStoredToken();
        const refreshToken = this.getRefreshToken();
        
        if (!token) {
            return {
                hasToken: false,
                hasRefreshToken: !!refreshToken,
                expired: true,
                needsRefresh: true,
                valid: false
            };
        }
        
        const expired = this.isTokenExpired(token);
        const needsRefresh = this.needsRefresh(token);
        
        return {
            hasToken: true,
            hasRefreshToken: !!refreshToken,
            expired: expired,
            needsRefresh: needsRefresh,
            valid: !expired,
            payload: this.parseToken(token)
        };
    }
    
    /**
     * Force token refresh regardless of expiry status
     */
    async forceRefresh() {
        console.log("Forcing token refresh...");
        return await this.attemptTokenRefresh();
    }
    
    /**
     * Get time until token expiry in milliseconds
     */
    getTimeUntilExpiry() {
        const token = this.getStoredToken();
        if (!token) return 0;
        
        const payload = this.parseToken(token);
        if (!payload || !payload.exp) return 0;
        
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = (payload.exp - currentTime) * 1000;
        
        return Math.max(0, timeUntilExpiry);
    }
}

// Create global instance
if (typeof window !== "undefined") {
    window.tokenManager = new TokenManager();
    
    // Provide backward compatibility
    window.getAuthToken = () => window.tokenManager.getToken();
}

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
    module.exports = TokenManager;
}