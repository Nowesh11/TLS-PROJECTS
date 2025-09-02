/**
 * Admin Panel JavaScript
 * Handles all admin panel functionality including dashboard, content management,
 * user management, and settings
 */

// Global error handler to prevent uncaught errors
window.addEventListener('error', function(e) {
    console.error('Global error caught:', e.error);
    return true; // Prevent default browser error handling
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    e.preventDefault(); // Prevent default browser error handling
});

// Safe element access wrapper
function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.log(`Element with ID '${id}' not found`);
    }
    return element;
}

// Safe addEventListener wrapper
function safeAddEventListener(elementId, event, handler) {
    const element = safeGetElement(elementId);
    if (element) {
        element.addEventListener(event, handler);
        return true;
    }
    return false;
}

// Debug function to check all storage
function debugStorage() {
    console.log('=== STORAGE DEBUG ===');
    console.log('localStorage keys:', Object.keys(localStorage));
    console.log('sessionStorage keys:', Object.keys(sessionStorage));
    
    // Check for all possible session keys
    const possibleKeys = ['tamil_society_session', 'token', 'user'];
    possibleKeys.forEach(key => {
        const localValue = localStorage.getItem(key);
        const sessionValue = sessionStorage.getItem(key);
        if (localValue) console.log(`localStorage[${key}]:`, localValue);
        if (sessionValue) console.log(`sessionStorage[${key}]:`, sessionValue);
    });
    
    // Check cookies
    console.log('document.cookie:', document.cookie);
    console.log('=== END STORAGE DEBUG ===');
}

// Retry function for authentication
async function retryAuthentication(maxRetries = 3, delay = 1000) {
    console.log('=== ADMIN AUTHENTICATION ===');
    debugStorage(); // Debug storage state
    
    // Use TokenManager if available for better token handling
    if (window.tokenManager) {
        try {
            const refreshedToken = await window.tokenManager.refreshTokenIfNeeded();
            if (refreshedToken) {
                console.log('Token refreshed successfully via TokenManager');
                return true;
            }
        } catch (error) {
            console.log('TokenManager refresh failed:', error);
        }
    }
    
    // Check if user is already authenticated
    const existingToken = getAuthToken();
    if (existingToken) {
        console.log('Existing token found, verifying...', existingToken.substring(0, 20) + '...');
        try {
            const response = await fetch('http://localhost:8080/api/auth/verify-token', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${existingToken}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            console.log('Token verification response status:', response.status);
            if (response.ok) {
                const userData = await response.json();
                console.log('Token verification response:', userData);
                if (userData.user && userData.user.role === 'admin') {
                    console.log('Existing admin session verified');
                    return true;
                }
            } else {
                console.log('Token verification failed with status:', response.status);
                const errorText = await response.text();
                console.log('Error response:', errorText);
            }
        } catch (error) {
            console.log('Token verification failed:', error);
        }
    }
    
    // If no valid token, try to login with default admin credentials with retry logic
    console.log('No valid token found, attempting admin login...');
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Login attempt ${attempt}/${maxRetries}`);
            
            const loginResponse = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: 'admin@tamilsociety.org',
                    password: 'Admin123!'
                })
            });
            
            if (loginResponse.ok) {
                const loginData = await loginResponse.json();
                console.log('Admin login successful:', loginData);
                
                // Store the session data using TokenManager if available
                if (window.tokenManager) {
                    window.tokenManager.storeToken(loginData.token, loginData.user);
                }
                
                const sessionData = {
                    token: loginData.token,
                    user: loginData.user,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                };
                
                localStorage.setItem('tamil_society_session', JSON.stringify(sessionData));
                console.log('Admin session stored successfully');
                
                return true;
            } else {
                console.log(`Admin login failed with status: ${loginResponse.status}`);
                if (loginResponse.status === 429) {
                    console.log('Rate limited, waiting longer before retry');
                    delay = delay * 3; // Increase delay for rate limiting
                }
            }
        } catch (error) {
            console.error(`Login attempt ${attempt} failed:`, error);
            
            // Check if it's a network error
            if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
                console.log('Network error detected, will retry with backoff');
            }
        }
        
        // Wait before next attempt (exponential backoff)
        if (attempt < maxRetries) {
            const backoffDelay = delay * Math.pow(2, attempt - 1);
            console.log(`Waiting ${backoffDelay}ms before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
    }
    
    console.log('All authentication attempts failed');
    return false;
}

// Table sorting functionality
class TableSorter {
    constructor() {
        this.sortState = {}; // Track sort direction for each table
    }

    initializeSorting() {
        // Add sorting to all data tables
        const tables = document.querySelectorAll('.data-table table');
        tables.forEach(table => {
            this.addSortingToTable(table);
        });
    }

    addSortingToTable(table) {
        const headers = table.querySelectorAll('thead th');
        const tableId = table.closest('.data-table').id || table.id || 'table_' + Math.random().toString(36).substr(2, 9);
        
        headers.forEach((header, index) => {
            // Skip action columns and image columns
            if (header.textContent.toLowerCase().includes('action') || 
                header.textContent.toLowerCase().includes('image')) {
                return;
            }
            
            header.style.cursor = 'pointer';
            header.style.position = 'relative';
            header.innerHTML += ' <span class="sort-indicator" style="margin-left: 5px; color: var(--text-secondary);">↕</span>';
            
            header.addEventListener('click', () => {
                this.sortTable(table, index, tableId);
            });
        });
    }

    sortTable(table, columnIndex, tableId) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const header = table.querySelectorAll('thead th')[columnIndex];
        
        // Determine sort direction
        const currentSort = this.sortState[tableId + '_' + columnIndex] || 'none';
        let newSort;
        if (currentSort === 'none' || currentSort === 'desc') {
            newSort = 'asc';
        } else {
            newSort = 'desc';
        }
        
        // Clear all sort indicators in this table
        table.querySelectorAll('.sort-indicator').forEach(indicator => {
            indicator.textContent = '↕';
            indicator.style.color = '#666';
        });
        
        // Update sort indicator
        const indicator = header.querySelector('.sort-indicator');
        indicator.textContent = newSort === 'asc' ? '↑' : '↓';
        indicator.style.color = '#007bff';
        
        // Sort rows
        rows.sort((a, b) => {
            const aText = a.cells[columnIndex]?.textContent.trim() || '';
            const bText = b.cells[columnIndex]?.textContent.trim() || '';
            
            // Try to parse as numbers first
            const aNum = parseFloat(aText.replace(/[^\d.-]/g, ''));
            const bNum = parseFloat(bText.replace(/[^\d.-]/g, ''));
            
            let comparison = 0;
            if (!isNaN(aNum) && !isNaN(bNum)) {
                comparison = aNum - bNum;
            } else {
                // Try to parse as dates
                const aDate = new Date(aText);
                const bDate = new Date(bText);
                
                if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
                    comparison = aDate - bDate;
                } else {
                    // String comparison
                    comparison = aText.localeCompare(bText);
                }
            }
            
            return newSort === 'asc' ? comparison : -comparison;
        });
        
        // Update sort state
        this.sortState[tableId + '_' + columnIndex] = newSort;
        
        // Re-append sorted rows
        rows.forEach(row => tbody.appendChild(row));
    }
}

// Initialize table sorter
const tableSorter = new TableSorter();
// Make it globally available
window.tableSorter = tableSorter;

/**
 * Check admin access and authentication
 */
async function checkAdminAccess() {
    console.log('checkAdminAccess: Starting admin access check...');
    
    try {
        // Get session data from localStorage
        const persistentSession = localStorage.getItem('tamil_society_session');
        console.log('checkAdminAccess: Persistent session found:', persistentSession ? 'Yes' : 'No');
        
        if (!persistentSession) {
            console.log('checkAdminAccess: No session found, redirecting to login');
            window.location.href = 'login.html';
            return false;
        }
        
        let sessionData;
        try {
            sessionData = JSON.parse(persistentSession);
            console.log('checkAdminAccess: Session data parsed successfully');
        } catch (error) {
            console.error('checkAdminAccess: Error parsing session:', error);
            localStorage.removeItem('tamil_society_session');
            window.location.href = 'login.html';
            return false;
        }
        
        if (!sessionData.token) {
            console.log('checkAdminAccess: No token in session data, redirecting to login');
            localStorage.removeItem('tamil_society_session');
            window.location.href = 'login.html';
            return false;
        }
        
        // Check if session has expired
        if (sessionData.expiresAt) {
            const now = new Date();
            const expiresAt = new Date(sessionData.expiresAt);
            
            if (expiresAt.getTime() <= now.getTime()) {
                console.log('checkAdminAccess: Session expired, redirecting to login');
                localStorage.removeItem('tamil_society_session');
                window.location.href = 'login.html';
                return false;
            }
        }
        
        const user = sessionData.user;
        if (!user) {
            console.log('checkAdminAccess: No user data in session, redirecting to login');
            localStorage.removeItem('tamil_society_session');
            window.location.href = 'login.html';
            return false;
        }
        
        if (user.role !== 'admin') {
            console.log('checkAdminAccess: User is not admin, access denied');
            alert('Access denied. Admin privileges required.');
            window.location.href = 'index.html';
            return false;
        }
        
        console.log('checkAdminAccess: Admin access verified for user:', user.name);
        return true;
        
    } catch (error) {
        console.error('checkAdminAccess: Error during admin access check:', error);
        localStorage.removeItem('tamil_society_session');
        window.location.href = 'login.html';
        return false;
    }
}

/**
 * Initialize TinyMCE WYSIWYG editor
 */
async function initTinyMCE() {
    try {
        // Wait for TinyMCE to be available
        let attempts = 0;
        const maxAttempts = 10;
        
        while (typeof tinymce === 'undefined' && attempts < maxAttempts) {
            console.log(`⏳ Waiting for TinyMCE to load... (attempt ${attempts + 1}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }
        
        // Check if TinyMCE is available and properly loaded
        if (typeof tinymce === 'undefined') {
            console.warn('⚠️ TinyMCE not loaded after waiting, using basic textarea fallback');
            return;
        }
        
        if (!tinymce.init) {
            console.warn('⚠️ TinyMCE.init not available, using basic textarea fallback');
            return;
        }
        
        // Check if editors are already initialized to prevent duplicates
        const existingEditors = tinymce.editors.length;
        if (existingEditors > 0) {
            console.log('📝 TinyMCE editors already initialized (' + existingEditors + ' editors), skipping...');
            return;
        }
        
        console.log('🔧 Initializing TinyMCE with modern configuration...');
        
        if (tinymce.init) {
            await tinymce.init({
                selector: '.wysiwyg-editor',
                height: 450,
                menubar: 'file edit view insert format tools table help',
                plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons',
                    'codesample', 'directionality', 'nonbreaking', 'pagebreak'
                ],
                toolbar: [
                    'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify',
                    'bullist numlist outdent indent | link image media table | searchreplace visualblocks code fullscreen | ltr rtl | languageToggle | help'
                ],
                
                // Enhanced content styling with Tamil font support
                content_style: `
                    body { 
                        font-family: 'Noto Sans Tamil', 'Tamil Sangam MN', 'Tamil MN', Helvetica, Arial, sans-serif; 
                        font-size: 14px;
                        line-height: 1.6;
                        color: var(--text-primary);
                        max-width: none;
                        margin: 0;
                        padding: 20px;
                    }
                    .tamil-text {
                        font-family: 'Noto Sans Tamil', 'Tamil Sangam MN', 'Tamil MN', sans-serif;
                        font-size: 16px;
                        line-height: 1.8;
                    }
                    .english-text {
                        font-family: 'Poppins', Helvetica, Arial, sans-serif;
                        font-size: 14px;
                        line-height: 1.6;
                    }
                    h1, h2, h3, h4, h5, h6 {
                        font-family: 'Poppins', 'Noto Sans Tamil', sans-serif;
                        margin-top: 1.5em;
                        margin-bottom: 0.5em;
                    }
                    blockquote {
                        border-left: 4px solid #0288D1;
                        margin: 1.5em 0;
                        padding: 0.5em 1em;
                        background: #f8f9fa;
                    }
                `,
                
                // Font options including Tamil fonts
                font_family_formats: 'Arial=arial,helvetica,sans-serif; Helvetica=helvetica,arial,sans-serif; Times New Roman=times new roman,times,serif; Courier New=courier new,courier,monospace; Poppins=Poppins,sans-serif; Noto Sans Tamil=Noto Sans Tamil,Tamil Sangam MN,Tamil MN,sans-serif; Tamil Sangam MN=Tamil Sangam MN,Noto Sans Tamil,sans-serif',
                
                // Font size options
                fontsize_formats: '8pt 10pt 12pt 14pt 16pt 18pt 20pt 24pt 28pt 32pt 36pt 48pt',
                
                // Language and direction support
                language: 'en',
                directionality: 'ltr',
                
                // Image handling
                images_upload_handler: async function (blobInfo, success, failure) {
                    try {
                        const formData = new FormData();
                        formData.append('file', blobInfo.blob(), blobInfo.filename());
                        formData.append('type', 'content-image');
                        
                        const response = await apiCall('/api/media/upload', {
                            method: 'POST',
                            body: formData
                        });
                        
                        if (response.success && response.data) {
                            success(response.data.url);
                        } else {
                            failure('Image upload failed');
                        }
                    } catch (error) {
                        console.error('Image upload error:', error);
                        failure('Image upload failed: ' + error.message);
                    }
                },
                
                // Paste handling
                paste_data_images: true,
                paste_as_text: false,
                paste_webkit_styles: 'color font-size font-family',
                
                // Custom styles
                style_formats: [
                    {
                        title: 'Tamil Text',
                        selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li',
                        classes: 'tamil-text'
                    },
                    {
                        title: 'English Text',
                        selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li',
                        classes: 'english-text'
                    },
                    {
                        title: 'Highlight Box',
                        selector: 'div',
                        classes: 'highlight-box',
                        wrapper: true,
                        styles: {
                            background: '#e3f2fd',
                            border: '1px solid #0288D1',
                            padding: '15px',
                            borderRadius: '6px',
                            margin: '10px 0'
                        }
                    },
                    {
                        title: 'Button Primary',
                        selector: 'a',
                        classes: 'btn-primary',
                        styles: {
                            display: 'inline-block',
                            padding: '10px 20px',
                            background: '#0288D1',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '4px',
                            fontWeight: '600'
                        }
                    }
                ],
                
                // Accessibility
                a11y_advanced_options: true,
                
                // Auto-save functionality
                setup: function(editor) {
                    let autoSaveTimer;
                    
                    editor.on('init', function() {
                        console.log('TinyMCE editor initialized:', editor.id);
                        
                        // Add language toggle button
                        editor.ui.registry.addButton('languageToggle', {
                            text: 'த/En',
                            tooltip: 'Toggle Tamil/English input',
                            onAction: function() {
                                toggleEditorLanguage(editor);
                            }
                        });
                        
                        console.log('✅ Language toggle button registered and added to TinyMCE toolbar');
                    });
                    
                    editor.on('change keyup', function() {
                        clearTimeout(autoSaveTimer);
                        autoSaveTimer = setTimeout(() => {
                            autoSaveContent(editor);
                        }, 2000); // Auto-save after 2 seconds of inactivity
                    });
                    
                    editor.on('blur', function() {
                        autoSaveContent(editor);
                    });
                }
            });
            
            console.log('✅ Enhanced TinyMCE initialized with Tamil support and modern toolbar configuration');
        }
    } catch (error) {
        console.error('❌ TinyMCE initialization failed - using basic textarea fallback:', error.message);
        // Ensure basic functionality is available
        const textareas = document.querySelectorAll('.wysiwyg-editor');
        textareas.forEach(textarea => {
            if (textarea.style.display === 'none') {
                textarea.style.display = 'block';
            }
        });
    }
}

/**
 * Main admin panel initialization function
 * Moved here to fix execution order issues
 */
async function initAdminPanel() {
    console.log('🚀 Starting admin panel initialization...');
    
    try {
        // Initialize token manager first
        if (typeof TokenManager !== 'undefined') {
            window.tokenManager = new TokenManager();
            // Start automatic token validation
            window.tokenManager.startTokenValidation();
            console.log('✅ Token manager initialized with automatic validation');
        }
        
        // Verify admin access
        const hasAccess = await checkAdminAccess();
        if (!hasAccess) {
            console.error('❌ Admin access denied');
            return false;
        }
        
        // Initialize TinyMCE editor with runtime check
        if (typeof initTinyMCE === 'function') {
            await initTinyMCE();
            console.log('✅ TinyMCE initialized');
        } else {
            console.warn('⚠️ initTinyMCE function not available');
        }
        
        // Initialize modal handlers with runtime check
        if (typeof initModalHandlers === 'function') {
            initModalHandlers();
            console.log('✅ Modal handlers initialized');
        } else {
            console.warn('⚠️ initModalHandlers function not available');
        }
        
        // Initialize search functionality with runtime check
        if (typeof initSearchListeners === 'function') {
            initSearchListeners();
            console.log('✅ Search listeners initialized');
        } else {
            console.warn('⚠️ initSearchListeners function not available');
        }
        
        // Initialize form handlers with runtime check
        if (typeof initFormHandlers === 'function') {
            initFormHandlers();
            console.log('✅ Form handlers initialized');
        } else {
            console.warn('⚠️ initFormHandlers function not available');
        }
        
        // Initialize sidebar navigation with runtime check
        if (typeof initSidebar === 'function') {
            initSidebar();
            console.log('✅ Sidebar initialized');
        } else {
            console.warn('⚠️ initSidebar function not available');
        }
        
        // Initialize dashboard
        if (typeof initDashboard === 'function') {
            initDashboard();
            console.log('✅ Dashboard initialized');
        }
        
        // Initialize content management
        if (typeof initContentManagement === 'function') {
            initContentManagement();
            console.log('✅ Content management initialized');
        }
        
        // Initialize book management
        if (typeof initBookManagement === 'function') {
            initBookManagement();
            console.log('✅ Book management initialized');
        }
        
        // Initialize project management
        if (typeof initProjectManagement === 'function') {
            initProjectManagement();
            console.log('✅ Project management initialized');
        }
        
        // Initialize activities management
        if (typeof initActivitiesManagement === 'function') {
            initActivitiesManagement();
            console.log('✅ Activities management initialized');
        }
        
        // Initialize initiatives management
        if (typeof initInitiativesManagement === 'function') {
            initInitiativesManagement();
            console.log('✅ Initiatives management initialized');
        }
        
        // Initialize user management
        if (typeof initUserManagement === 'function') {
            initUserManagement();
            console.log('✅ User management initialized');
        }
        
        // Initialize team management
        if (typeof initTeamManagement === 'function') {
            initTeamManagement();
            console.log('✅ Team management initialized');
        }
        
        // Initialize settings management
        if (typeof initSettingsManagement === 'function') {
            initSettingsManagement();
            console.log('✅ Settings management initialized');
        }
        
        // Initialize recruitment management
        if (typeof initRecruitmentManagement === 'function') {
            initRecruitmentManagement();
            console.log('✅ Recruitment management initialized');
        }
        
        // Initialize file upload
        if (typeof initFileUpload === 'function') {
            initFileUpload();
            console.log('✅ File upload initialized');
        }
        
        // Update admin user info
        updateAdminUserInfo();
        console.log('✅ Admin user info updated');
        
        // Initialize notification system
        if (typeof initNotificationSystem === 'function') {
            initNotificationSystem();
            console.log('✅ Notification system initialized');
        }
        
        console.log('🎉 Admin panel initialization completed successfully!');
        return true;
        
    } catch (error) {
        console.error('❌ Error during admin panel initialization:', error);
        throw error;
    }
}

// Make initAdminPanel globally available
window.initAdminPanel = initAdminPanel;

// ===== ADMIN PANEL THEME SYSTEM =====
class AdminThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('admin-theme') || 'light';
        this.init();
    }

    init() {
        // Apply saved theme on page load
        this.applyTheme(this.currentTheme);
        
        // Update existing theme toggle if it exists
        this.enhanceExistingToggle();
        
        // Listen for theme toggle events
        this.bindEvents();
    }

    enhanceExistingToggle() {
        // Find existing theme toggle button
        const existingToggle = document.querySelector('[onclick="toggleTheme()"]');
        if (existingToggle) {
            // Remove old onclick handler
            existingToggle.removeAttribute('onclick');
            
            // Add new click handler
            existingToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
            
            // Update icon based on current theme
            this.updateToggleIcon();
        }
    }

    bindEvents() {
        // Listen for manual theme toggle calls
        window.toggleTheme = () => {
            this.toggleTheme();
        };
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        this.saveTheme();
        this.updateToggleIcon();
        
        // Show notification if available
        if (typeof showNotification === 'function') {
            showNotification(`Admin theme switched to ${this.currentTheme} mode`, 'success', 2000);
        }
    }

    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        this.currentTheme = theme;
    }

    saveTheme() {
        localStorage.setItem('admin-theme', this.currentTheme);
        // Also update the legacy theme storage for compatibility
        localStorage.setItem('theme', this.currentTheme);
    }

    updateToggleIcon() {
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.className = `fas fa-${this.currentTheme === 'light' ? 'moon' : 'sun'}`;
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }
}

// Initialize admin theme manager
let adminThemeManager;
if (typeof window !== 'undefined') {
    adminThemeManager = new AdminThemeManager();
    window.adminThemeManager = adminThemeManager;
}

// Main DOMContentLoaded handler with improved error handling and dynamic timeout
document.addEventListener('DOMContentLoaded', async function() {
    let initializationTimeout = 45000; // Start with 45 seconds timeout
    const startTime = Date.now();
    
    try {
        console.log('🚀 Admin panel DOMContentLoaded - starting initialization');
        debugStorage();
        
        // Check if we need to extend timeout for token refresh operations
        if (window.tokenManager && window.tokenManager.isTokenExpired()) {
            console.log('⏰ Token expired, extending initialization timeout for refresh');
            initializationTimeout = 60000; // 60 seconds for token refresh scenarios
        }
        
        // Create initialization promise with dynamic timeout
        const initializationPromise = initializeAdminWithRetries();
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Initialization timeout after ${initializationTimeout/1000} seconds`));
            }, initializationTimeout);
        });
        
        await Promise.race([initializationPromise, timeoutPromise]);
        
        // Make showSection available globally after successful initialization
        window.showSection = showSection;
        
        // Also make showSection available for test functions
        if (typeof window.testSidebar === 'function') {
            // Test functions are already set up, no need to redefine
        }
        
        const endTime = Date.now();
        console.log(`✅ Admin panel initialization completed in ${endTime - startTime}ms`);
        
    } catch (error) {
        console.error('❌ Admin panel initialization failed:', error);
        console.error('Error stack:', error.stack);
        await handleInitializationFailure(error);
    }

    // File Storage Management Functions
    if (sectionId === 'file-storage') {
        await initFileStorageManagement();
    }
});

/**
 * File Storage Management Functions
 */

// Initialize file storage management
async function initFileStorageManagement() {
    console.log('Initializing file storage management...');
    try {
        await loadFileStats();
        await loadAllFiles();
        console.log('File storage management initialized');
    } catch (error) {
        console.error('Error initializing file storage management:', error);
        showNotification('Failed to initialize file storage management', 'error');
    }
}

// Load file storage statistics
async function loadFileStats() {
    try {
        const response = await apiCall('/api/files/stats', 'GET');
        if (response.success) {
            displayFileStats(response.data);
        } else {
            console.error('Failed to load file stats:', response.message);
            showNotification('Failed to load file statistics', 'error');
        }
    } catch (error) {
        console.error('Error loading file stats:', error);
        showNotification('Error loading file statistics', 'error');
    }
}

// Display file storage statistics
function displayFileStats(stats) {
    // Update main stats
    const totalFilesEl = document.getElementById('totalFiles');
    const totalSizeEl = document.getElementById('totalSize');
    const categoriesCountEl = document.getElementById('categoriesCount');
    const linkedFilesEl = document.getElementById('linkedFiles');

    if (totalFilesEl) totalFilesEl.textContent = stats.totalFiles || 0;
    if (totalSizeEl) totalSizeEl.textContent = formatFileSize(stats.totalSize || 0);
    if (categoriesCountEl) categoriesCountEl.textContent = Object.keys(stats.categories || {}).length;
    if (linkedFilesEl) linkedFilesEl.textContent = stats.linkedFiles || 0;

    // Update category breakdown
    const categoryStatsEl = document.getElementById('categoryStats');
    if (categoryStatsEl && stats.categories) {
        categoryStatsEl.innerHTML = Object.entries(stats.categories).map(([category, data]) => `
            <div class="category-stat" style="background: var(--bg-tertiary); padding: 1rem; border-radius: 0.5rem; text-align: center;">
                <div style="font-size: 1.5rem; font-weight: bold; color: var(--accent-primary);">${data.count}</div>
                <div style="color: var(--text-secondary); margin: 0.25rem 0; text-transform: capitalize;">${category}</div>
                <div style="font-size: 0.8rem; color: var(--text-tertiary);">${formatFileSize(data.size)}</div>
            </div>
        `).join('');
    }
}

// Load all files with pagination
let currentFilesPage = 1;
let allFiles = [];
let filteredFiles = [];

async function loadAllFiles(page = 1, limit = 50) {
    try {
        const response = await apiCall(`/api/files?page=${page}&limit=${limit}`, 'GET');
        if (response.success) {
            allFiles = response.data.files || [];
            filteredFiles = [...allFiles];
            displayFiles();
            updateFileCount();
            displayPagination(response.data.pagination);
        } else {
            console.error('Failed to load files:', response.message);
            showNotification('Failed to load files', 'error');
        }
    } catch (error) {
        console.error('Error loading files:', error);
        showNotification('Error loading files', 'error');
    }
}

// Display files in table
function displayFiles() {
    const tbody = document.getElementById('filesTableBody');
    if (!tbody) return;

    if (filteredFiles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No files found</td></tr>';
        return;
    }

    tbody.innerHTML = filteredFiles.map(file => {
        const isImage = file.extension && ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(file.extension.toLowerCase());
        const fileSize = formatFileSize(file.size);
        const uploadDate = new Date(file.uploadedAt).toLocaleDateString();
        const linkedStatus = file.associatedRecord ? 
            `<span style="color: var(--success-color);"><i class="fas fa-link"></i> ${file.associatedRecord.type}</span>` :
            `<span style="color: var(--text-tertiary);"><i class="fas fa-unlink"></i> Orphaned</span>`;
        
        return `
            <tr>
                <td style="width: 60px;">
                    ${isImage ? 
                        `<img src="/uploads/${file.category}/${file.filename}" alt="${file.filename}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 0.25rem;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"><i class="fas fa-image" style="display: none; font-size: 1.5rem; color: var(--text-tertiary);"></i>` :
                        `<i class="fas fa-file-${getFileIconByExtension(file.extension)}" style="font-size: 1.5rem; color: var(--text-tertiary);"></i>`
                    }
                </td>
                <td style="word-break: break-word;">${file.filename}</td>
                <td style="text-transform: capitalize;">${file.category}</td>
                <td>${fileSize}</td>
                <td>${file.extension || 'Unknown'}</td>
                <td>${linkedStatus}</td>
                <td>${uploadDate}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-sm btn-primary" onclick="downloadFile('${file.path}', '${file.filename}')" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-sm btn-info" onclick="viewFileDetails('${file.path}')" title="View Details">
                            <i class="fas fa-info-circle"></i>
                        </button>
                        ${!file.associatedRecord ? `
                            <button class="btn btn-sm btn-danger" onclick="deleteOrphanedFile('${file.path}')" title="Delete Orphaned File">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Get file icon by extension
function getFileIconByExtension(extension) {
    if (!extension) return 'file';
    const ext = extension.toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return 'image';
    if (['.pdf'].includes(ext)) return 'pdf';
    if (['.doc', '.docx'].includes(ext)) return 'word';
    if (['.xls', '.xlsx'].includes(ext)) return 'excel';
    if (['.ppt', '.pptx'].includes(ext)) return 'powerpoint';
    if (['.zip', '.rar', '.7z'].includes(ext)) return 'archive';
    if (['.mp4', '.avi', '.mov'].includes(ext)) return 'video';
    if (['.mp3', '.wav', '.ogg'].includes(ext)) return 'audio';
    return 'file';
}

// Filter files
function filterFiles() {
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const searchQuery = document.getElementById('fileSearch')?.value.toLowerCase() || '';

    filteredFiles = allFiles.filter(file => {
        const matchesCategory = !categoryFilter || file.category === categoryFilter;
        const matchesSearch = !searchQuery || file.filename.toLowerCase().includes(searchQuery);
        return matchesCategory && matchesSearch;
    });

    displayFiles();
    updateFileCount();
}

// Update file count display
function updateFileCount() {
    const fileCountEl = document.getElementById('fileCount');
    if (fileCountEl) {
        fileCountEl.textContent = `${filteredFiles.length} of ${allFiles.length} files`;
    }
}

// Display pagination
function displayPagination(pagination) {
    const paginationEl = document.getElementById('filePagination');
    if (!paginationEl || !pagination) return;

    const { currentPage, totalPages, hasNext, hasPrev } = pagination;
    
    let paginationHTML = '';
    
    if (hasPrev) {
        paginationHTML += `<button class="btn btn-sm" onclick="loadAllFiles(${currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;
    }
    
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        const isActive = i === currentPage;
        paginationHTML += `<button class="btn btn-sm ${isActive ? 'btn-primary' : ''}" onclick="loadAllFiles(${i})">${i}</button>`;
    }
    
    if (hasNext) {
        paginationHTML += `<button class="btn btn-sm" onclick="loadAllFiles(${currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
    }
    
    paginationEl.innerHTML = paginationHTML;
}

// Download file
function downloadFile(filePath, filename) {
    const link = document.createElement('a');
    link.href = filePath.startsWith('/') ? filePath : `/uploads/${filePath}`;
    link.download = filename;
    link.click();
}

// View file details
function viewFileDetails(filePath) {
    const file = allFiles.find(f => f.path === filePath);
    if (!file) return;

    const modalContent = `
        <div class="file-details">
            <h4>File Details</h4>
            <div class="detail-grid" style="display: grid; grid-template-columns: 1fr 2fr; gap: 1rem; margin: 1rem 0;">
                <strong>Filename:</strong> <span>${file.filename}</span>
                <strong>Category:</strong> <span style="text-transform: capitalize;">${file.category}</span>
                <strong>Size:</strong> <span>${formatFileSize(file.size)}</span>
                <strong>Extension:</strong> <span>${file.extension || 'Unknown'}</span>
                <strong>Upload Date:</strong> <span>${new Date(file.uploadedAt).toLocaleString()}</span>
                <strong>Path:</strong> <span style="word-break: break-all;">${file.path}</span>
                <strong>Linked:</strong> <span>${file.associatedRecord ? 
                    `Yes (${file.associatedRecord.type}: ${file.associatedRecord.title || file.associatedRecord.name || 'Unknown'})` : 
                    'No (Orphaned)'
                }</span>
            </div>
            ${file.extension && ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(file.extension.toLowerCase()) ? 
                `<div class="file-preview" style="margin: 1rem 0; text-align: center;">
                    <img src="${file.path.startsWith('/') ? file.path : `/uploads/${file.path}`}" alt="${file.filename}" style="max-width: 100%; max-height: 300px; border-radius: 0.5rem;">
                </div>` : ''
            }
        </div>
    `;

    showModal('File Details', modalContent);
}

// Delete orphaned file
async function deleteOrphanedFile(filePath) {
    if (!confirm('Are you sure you want to delete this orphaned file? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await apiCall('/api/files/cleanup', {
            method: 'DELETE',
            body: JSON.stringify({ files: [filePath] })
        });

        if (response.success) {
            showNotification('File deleted successfully', 'success');
            await loadAllFiles(currentFilesPage);
            await loadFileStats();
        } else {
            showNotification(response.message || 'Failed to delete file', 'error');
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        showNotification('Error deleting file', 'error');
    }
}

// Export all files
async function exportAllFiles() {
    try {
        showNotification('Preparing file export...', 'info');
        
        const response = await fetch('/api/files/export', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `file_backup_${new Date().toISOString().split('T')[0]}.zip`;
            link.click();
            window.URL.revokeObjectURL(url);
            showNotification('File export completed successfully', 'success');
        } else {
            const errorData = await response.json();
            showNotification(errorData.message || 'Failed to export files', 'error');
        }
    } catch (error) {
        console.error('Error exporting files:', error);
        showNotification('Error exporting files', 'error');
    }
}

// Export files by category
async function exportFilesByCategory() {
    const category = document.getElementById('exportCategory')?.value;
    if (!category) {
        showNotification('Please select a category to export', 'warning');
        return;
    }

    try {
        showNotification(`Preparing ${category} files export...`, 'info');
        
        const response = await fetch(`/api/files/export?category=${category}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${category}_files_${new Date().toISOString().split('T')[0]}.zip`;
            link.click();
            window.URL.revokeObjectURL(url);
            showNotification(`${category} files exported successfully`, 'success');
        } else {
            const errorData = await response.json();
            showNotification(errorData.message || 'Failed to export files', 'error');
        }
    } catch (error) {
        console.error('Error exporting files:', error);
        showNotification('Error exporting files', 'error');
    }
}

// Cleanup orphaned files
async function cleanupOrphanedFiles() {
    if (!confirm('Are you sure you want to cleanup orphaned files? This will delete all files that are not linked to any database records. This action cannot be undone.')) {
        return;
    }

    try {
        showNotification('Cleaning up orphaned files...', 'info');
        
        const response = await apiCall('/api/files/cleanup', {
            method: 'DELETE',
            body: JSON.stringify({ cleanup: true })
        });

        if (response.success) {
            showNotification(`Cleanup completed. ${response.data.deletedCount} orphaned files removed.`, 'success');
            await loadAllFiles(currentFilesPage);
            await loadFileStats();
        } else {
            showNotification(response.message || 'Failed to cleanup files', 'error');
        }
    } catch (error) {
        console.error('Error cleaning up files:', error);
        showNotification('Error cleaning up files', 'error');
    }
}

// Refresh file statistics
async function refreshFileStats() {
    showNotification('Refreshing file statistics...', 'info');
    await loadFileStats();
    await loadAllFiles(currentFilesPage);
    showNotification('File statistics refreshed', 'success');
}

// Make functions globally available
window.initFileStorageManagement = initFileStorageManagement;
window.loadFileStats = loadFileStats;
window.loadAllFiles = loadAllFiles;
window.filterFiles = filterFiles;
window.downloadFile = downloadFile;
window.viewFileDetails = viewFileDetails;
window.deleteOrphanedFile = deleteOrphanedFile;
window.exportAllFiles = exportAllFiles;
window.exportFilesByCategory = exportFilesByCategory;
window.cleanupOrphanedFiles = cleanupOrphanedFiles;
window.refreshFileStats = refreshFileStats;

/**
 * Initialize admin panel with retries and fallbacks
 */
async function initializeAdminWithRetries() {
    const maxRetries = 3;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 Initialization attempt ${attempt}/${maxRetries}`);
            
            // Wait a bit for any pending redirects or session loading
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('🔐 Starting authentication...');
            
            // Pre-check token status and refresh if needed
            if (window.tokenManager) {
                try {
                    console.log('🔄 Checking token status before authentication...');
                    const tokenStatus = window.tokenManager.getTokenStatus();
                    console.log('Token status:', tokenStatus);
                    
                    if (tokenStatus.needsRefresh || tokenStatus.expired) {
                        console.log('🔄 Token needs refresh, attempting refresh...');
                        await window.tokenManager.refreshTokenIfNeeded();
                    }
                } catch (refreshError) {
                    console.log('Token refresh during initialization failed:', refreshError);
                }
            }
            
            // Try authentication with retries
            const isAuthenticated = await retryAuthentication();
            console.log('Authentication result:', isAuthenticated ? '✅ Success' : '❌ Failed');
            
            if (!isAuthenticated) {
                console.log('🔄 Authentication failed, redirecting to login');
                debugStorage();
                
                // Add delay before redirect to allow for any pending operations
                await new Promise(resolve => setTimeout(resolve, 1000));
                window.location.href = 'login.html';
                return;
            }
            
            console.log('✅ Authentication successful, initializing admin panel...');
            debugStorage();
            
            // Wait a moment to ensure session is fully established
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Initialize admin panel after successful authentication
            console.log('Authentication successful, now initializing admin panel...');
            if (typeof initAdminPanel === 'function') {
                await initAdminPanel();
            } else {
                console.error('❌ initAdminPanel function not available');
                throw new Error('initAdminPanel function not found');
            }
            
            // Set up test functions for debugging
            setupTestFunctions();
            
            console.log('🎉 Admin.js loaded successfully with bilingual CMS support');
            return; // Success, exit retry loop
            
        } catch (error) {
            lastError = error;
            console.error(`❌ Initialization attempt ${attempt} failed:`, error);
            
            if (attempt < maxRetries) {
                const delay = attempt * 2000; // Exponential backoff
                console.log(`⏳ Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError || new Error('All initialization attempts failed');
}

/**
 * Set up enhanced navigation with error handling
 */
// REMOVED: Duplicate navigation setup function - using initNavigation() instead

/**
 * Show specific admin section
 * @param {string} sectionId - The ID of the section to show
 */
async function showSection(sectionId) {
    console.log('=== NAVIGATION TEST: Showing section:', sectionId);
    
    // Clear any blocking overlays first
    const loadingOverlay = document.querySelector('.loading');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('show');
        loadingOverlay.style.display = 'none';
    }
    
    // Clear sidebar overlay
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    if (sidebarOverlay) {
        sidebarOverlay.classList.remove('active');
        sidebarOverlay.style.pointerEvents = 'none';
    }
    
    // Clear any modal overlays
    const modalOverlays = document.querySelectorAll('.modal, .modal-overlay');
    modalOverlays.forEach(overlay => {
        overlay.classList.remove('show', 'active');
        overlay.style.display = 'none';
    });
    
    // Add visual feedback in the page title
    document.title = `Admin Panel - ${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}`;
    
    // Hide all sections
    const sections = document.querySelectorAll('.admin-section');
    console.log('=== NAVIGATION TEST: Found', sections.length, 'sections to hide');
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none'; // Force hide
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block'; // Force show
        targetSection.style.border = '3px solid #4CAF50'; // Visual debug
        targetSection.style.minHeight = '400px'; // Ensure visibility
        console.log('=== NAVIGATION TEST: Section activated successfully:', sectionId);
        
        // Add temporary visual feedback
        const header = targetSection.querySelector('h2, h3, .section-title');
        if (header) {
            header.style.backgroundColor = '#4CAF50';
            header.style.color = 'white';
            header.style.padding = '10px';
            header.style.borderRadius = '5px';
            setTimeout(() => {
                header.style.backgroundColor = '';
                header.style.color = '';
                header.style.padding = '';
                header.style.borderRadius = '';
                targetSection.style.border = ''; // Remove debug border
            }, 3000);
        }
    } else {
        console.error('=== NAVIGATION TEST: Section not found:', sectionId);
    }
    
    // Update navigation active state
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    console.log('=== NAVIGATION TEST: Found', navItems.length, 'navigation items');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === sectionId) {
            item.classList.add('active');
            console.log('=== NAVIGATION TEST: Navigation item activated:', item.textContent.trim());
        }
    });
    
    // Load section-specific data
    await loadSectionData(sectionId);
}

/**
 * Set up test functions for debugging
 */
function setupTestFunctions() {
    console.log('🧪 Setting up test functions...');
    
    window.testModal = function() {
        console.log('🧪 Testing modal...');
        try {
            openModal('book');
        } catch (error) {
            console.error('❌ Modal test failed:', error);
        }
    };
    
    window.testSidebar = async function() {
        console.log('🧪 Testing sidebar navigation...');
        try {
            await showSection('books');
        } catch (error) {
            console.error('❌ Sidebar test failed:', error);
        }
    };
    
    window.testAddBook = function() {
        console.log('🧪 Testing add book...');
        try {
            openModal('book');
        } catch (error) {
            console.error('❌ Add book test failed:', error);
        }
    };
    
    // Global debugging function
    window.debugAdminPanel = function() {
        console.log('=== ADMIN PANEL DEBUG REPORT ===');
        
        const sections = document.querySelectorAll('.admin-section');
        const navItems = document.querySelectorAll('.nav-item[data-section]');
        
        console.log('Total sections found:', sections.length);
        console.log('Total navigation items found:', navItems.length);
        
        console.log('\nSection visibility status:');
        sections.forEach((section, index) => {
            const computedStyle = getComputedStyle(section);
            console.log(`${index + 1}. ${section.id}:`, {
                display: computedStyle.display,
                visibility: computedStyle.visibility,
                opacity: computedStyle.opacity,
                hasActiveClass: section.classList.contains('active'),
                classes: section.className
            });
        });
        
        console.log('\nNavigation items:');
        navItems.forEach((item, index) => {
            console.log(`${index + 1}. ${item.textContent.trim()} -> ${item.getAttribute('data-section')}`);
        });
        
        return { sections: sections.length, navItems: navItems.length };
    };
    
    // Auto-run debug on load
    setTimeout(() => {
        window.debugAdminPanel();
    }, 2000);
    
    console.log('✅ Test functions setup complete');
}

/**
 * Handle initialization failure with graceful fallbacks
 */
async function handleInitializationFailure(error) {
    console.error('🚨 Handling initialization failure:', error);
    
    try {
        // Show user-friendly error message
        if (typeof showNotification === 'function') {
            showNotification('Admin panel failed to initialize. Some features may be limited.', 'error');
        }
        
        // Try to set up basic functionality
        await setupBasicAdminFunctionality();
        
        // Show recovery options to user
        showRecoveryOptions();
        
    } catch (fallbackError) {
        console.error('❌ Fallback initialization also failed:', fallbackError);
        showCriticalError();
        // As last resort, redirect to login
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 5000);
    }
}

/**
 * Set up basic admin functionality when full initialization fails
 */
async function setupBasicAdminFunctionality() {
    console.log('🔧 Setting up basic admin functionality...');
    
    try {
        // Initialize basic navigation
        const navItems = document.querySelectorAll('.nav-item[data-section]');
        navItems.forEach(item => {
            const section = item.getAttribute('data-section');
            item.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Basic navigation clicked:', section);
                // Basic section switching without full functionality
                document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
                const targetSection = document.getElementById(section);
                if (targetSection) {
                    targetSection.style.display = 'block';
                }
            });
        });
        
        // Initialize basic sidebar functionality
        if (typeof initSidebar === 'function') {
            initSidebar();
        } else {
            console.warn('initSidebar function not available, skipping sidebar initialization');
        }
        
        // Show dashboard by default
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            dashboard.style.display = 'block';
        }
        
        console.log('✅ Basic admin functionality set up');
        
    } catch (error) {
        console.error('❌ Failed to set up basic functionality:', error);
        throw error;
    }
}

/**
 * Show recovery options to the user
 */
function showRecoveryOptions() {
    const recoveryHtml = `
        <div id="recovery-banner" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #fef3c7;
            border-bottom: 2px solid #f59e0b;
            padding: 1rem;
            z-index: 9999;
            text-align: center;
        ">
            <p style="margin: 0; color: #92400e; font-weight: 600;">
                ⚠️ Admin panel is running in limited mode. 
                <button onclick="location.reload()" style="
                    background: #f59e0b;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    margin-left: 1rem;
                ">Refresh Page</button>
            </p>
        </div>
    `;
    
    document.body.insertAdjacentHTML('afterbegin', recoveryHtml);
}

/**
 * Show critical error when all fallbacks fail
 */
function showCriticalError() {
    const errorHtml = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--bg-primary, white);
            color: var(--text-primary, #374151);
            padding: 2rem;
            border-radius: 0.75rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border: 1px solid var(--border-secondary, transparent);
            z-index: 10000;
            text-align: center;
            max-width: 400px;
        ">
            <h2 style="color: #dc2626; margin-bottom: 1rem;">⚠️ Critical Error</h2>
            <p style="color: #374151; margin-bottom: 1.5rem;">
                The admin panel failed to initialize properly. Please try refreshing the page or contact support.
            </p>
            <button onclick="location.reload()" style="
                background: #2563eb;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 0.375rem;
                cursor: pointer;
                font-weight: 600;
            ">Refresh Page</button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', errorHtml);
}

// Test functions - moved outside DOMContentLoaded
window.testAddEbook = function() {
    console.log('Testing add ebook...');
    openModal('ebook');
};

window.testAddProject = function() {
    console.log('Testing add project...');
    openModal('project');
};

// Add admin access test function
window.testAdminAccess = function() {
    console.log('=== TESTING ADMIN ACCESS ===');
    debugStorage();
    const token = getAuthToken();
    console.log('Token found:', token ? 'Yes' : 'No');
    if (token) {
        console.log('Token preview:', token.substring(0, 20) + '...');
    }
    const authResult = checkAuthStatus();
    console.log('Auth status result:', authResult);
    const adminResult = checkAdminAccess();
    console.log('Admin access result:', adminResult);
    console.log('=== END ADMIN ACCESS TEST ===');
    return { token: !!token, authResult, adminResult };
};

/**
 * Get authentication token from session data
 */
// Cache for auth token to reduce redundant calls
let _cachedAuthToken = null;
let _tokenCacheTime = 0;

function getAuthToken() {
    // Use TokenManager if available, otherwise fallback to old method
    if (typeof window.TokenManager !== 'undefined' && window.tokenManager) {
        return window.tokenManager.getToken();
    }
    
    // Fallback to old method for backward compatibility
    // Return cached token if available and not expired (5 min cache)
    if (_cachedAuthToken && _tokenCacheTime && (Date.now() - _tokenCacheTime < 300000)) {
        return _cachedAuthToken;
    }
    
    // Check localStorage for permanent session
    const persistentSession = localStorage.getItem('tamil_society_session');
    
    if (persistentSession) {
        try {
            const sessionData = JSON.parse(persistentSession);
            const token = sessionData.token;
            
            // Cache the token
            if (token) {
                _cachedAuthToken = token;
                _tokenCacheTime = Date.now();
            }
            
            return token;
        } catch (error) {
            console.error('getAuthToken: Error parsing persistent session:', error);
        }
    }
    
    return null;
}

/**
 * Show loading indicator
 */
function showLoading() {
    const loadingElement = document.getElementById('loadingIndicator');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    const loadingElement = document.getElementById('loadingIndicator');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

/**
 * Update admin user info in the sidebar
 */
function updateAdminUserInfo() {
    console.log('updateAdminUserInfo: Starting user info update...');
    
    // Get session data from localStorage
    const persistentSession = localStorage.getItem('tamil_society_session');
    
    if (!persistentSession) {
        console.log('updateAdminUserInfo: No session data found');
        return;
    }
    
    let sessionData;
    try {
        sessionData = JSON.parse(persistentSession);
    } catch (error) {
        console.error('updateAdminUserInfo: Error parsing session:', error);
        return;
    }
    
    if (!sessionData || !sessionData.user) {
        console.log('updateAdminUserInfo: No user data found in session');
        return;
    }
    
    const user = sessionData.user;
    console.log('updateAdminUserInfo: User data:', user);
    
    // Update admin name
    const adminNameElement = document.getElementById('adminName');
    if (adminNameElement) {
        adminNameElement.textContent = user.name || user.email || 'Admin User';
        console.log('updateAdminUserInfo: Updated admin name');
    }
    
    // Update admin avatar
    const adminAvatarElement = document.getElementById('adminAvatar');
    if (adminAvatarElement) {
        const firstLetter = (user.name || user.email || 'A').charAt(0).toUpperCase();
        adminAvatarElement.textContent = firstLetter;
        console.log('updateAdminUserInfo: Updated admin avatar');
    }
    
    console.log('updateAdminUserInfo: User info update completed');
}

/**
 * Make API calls with authentication
 * Uses centralized apiCall from api-integration.js for better error handling and token management
 */
if (typeof window.apiCall !== 'function') {
    // Fallback implementation if centralized version is not available
    console.warn('Centralized apiCall not found, using fallback implementation');
    
    window.apiCall = async function(endpoint, options = {}) {
        const token = getAuthToken();
    
        // Ensure endpoint starts with http or add base URL
        const baseUrl = window.TLS_API_BASE_URL || 'http://localhost:8080';
        const fullUrl = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
    
        console.log(`Making API call to: ${fullUrl}`);
        console.log(`Token available: ${token ? 'Yes' : 'No'}`);
        
        const defaultOptions = {
            mode: 'cors',
            credentials: 'include',
            headers: {}
        };
        
        // Only set Content-Type for non-FormData requests
        if (!(options.body instanceof FormData)) {
            defaultOptions.headers['Content-Type'] = 'application/json';
        }
        
        // Add Authorization header only if token exists
        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }
        
        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(fullUrl, finalOptions);
            
            if (!response.ok) {
                // Handle 401 Unauthorized
                if (response.status === 401) {
                    console.log('Unauthorized access detected - attempting token refresh');
                    
                    // Try TokenManager first, then fallback to retryAuthentication
                    let refreshed = false;
                    if (window.tokenManager) {
                        try {
                            refreshed = await window.tokenManager.attemptTokenRefresh();
                        } catch (error) {
                            console.log('TokenManager refresh failed:', error);
                        }
                    }
                    
                    if (!refreshed) {
                        refreshed = await retryAuthentication();
                    }
                    
                    if (refreshed) {
                        console.log('Token refreshed, retrying API call...');
                        return await window.apiCall(endpoint, options);
                    } else {
                        console.log('Token refresh failed, redirecting to login');
                        window.location.href = 'login.html';
                        return { success: false, error: 'Authentication required' };
                    }
                }
                
                // Handle other errors
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    // Ignore JSON parsing errors
                }
                
                throw new Error(errorMessage);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            
            // Handle network errors
            if (error.name === 'TypeError' || error.name === 'AbortError' || error.message.includes('Failed to fetch')) {
                console.log('Network error detected');
                showNotification('Network error. Please check your connection and try again.', 'error');
                return { success: false, error: 'Network error', data: [] };
            }
            
            // Show error notification to user
            showNotification(error.message || 'An error occurred while processing your request.', 'error');
            throw error;
        }
    };
}

/**
 * Load books data and populate the books table
 */
async function loadBooksData() {
    try {
        showLoading();
        const response = await apiCall('/api/books');
        const books = response.data || response;
        
        const tableBody = document.getElementById('booksTableBody');
        if (tableBody) {
            if (books.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-tertiary);">No books found</td></tr>';
            } else {
                tableBody.innerHTML = books.map(book => {
                    // Calculate stock status
                    const stockQuantity = book.stockQuantity || book.stock || 0;
                    const stockDisplay = stockQuantity > 0 ? stockQuantity : '<span style="color: #e74c3c; font-weight: bold;">Out of Stock</span>';
                    
                    // Determine status based on stock and other factors
                    let status = book.status || 'available';
                    if (stockQuantity <= 0) {
                        status = 'out-of-stock';
                    }
                    
                    return `
                        <tr>
                            <td style="padding: 1rem;">${book.title || 'N/A'}</td>
                            <td style="padding: 1rem;">${book.titleTamil || 'N/A'}</td>
                            <td style="padding: 1rem;">${book.author || 'N/A'}</td>
                            <td style="padding: 1rem;">${book.category || 'N/A'}</td>
                            <td style="padding: 1rem;">RM${book.price || '0'}</td>
                            <td style="padding: 1rem;">${stockDisplay}</td>
                            <td style="padding: 1rem;">
                                <span class="status-badge status-${status}">${status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            </td>
                            <td style="padding: 1rem;">
                                <button class="btn btn-sm btn-secondary" onclick="editBook('${book._id}')">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteBook('${book._id}')">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }
        hideLoading();
    } catch (error) {
        console.error('Error loading books:', error);
        hideLoading();
        // Show error message in table
        const tableBody = document.getElementById('booksTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--error-color);">Error loading books. Please try again.</td></tr>';
        }
    }
}

/**
 * Sort books table by column
 * @param {number} columnIndex - The column index to sort by
 */
function sortBooksTable(columnIndex) {
    const table = document.getElementById('books-table');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const headers = table.querySelectorAll('thead th');
    const currentHeader = headers[columnIndex];
    
    // Get current sort direction
    const currentSort = currentHeader.getAttribute('data-sort') || 'none';
    let newSort;
    if (currentSort === 'none' || currentSort === 'desc') {
        newSort = 'asc';
    } else {
        newSort = 'desc';
    }
    
    // Clear all sort indicators
    headers.forEach(header => {
        const icon = header.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-sort';
            icon.style.opacity = '0.5';
        }
        header.removeAttribute('data-sort');
    });
    
    // Update current header
    currentHeader.setAttribute('data-sort', newSort);
    const icon = currentHeader.querySelector('i');
    if (icon) {
        icon.className = newSort === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
        icon.style.opacity = '1';
    }
    
    // Sort rows
    rows.sort((a, b) => {
        let aText = '';
        let bText = '';
        
        if (columnIndex === 0) { // Title (EN)
            aText = a.cells[0]?.textContent.trim() || '';
            bText = b.cells[0]?.textContent.trim() || '';
        } else if (columnIndex === 1) { // Title (TA)
            aText = a.cells[1]?.textContent.trim() || '';
            bText = b.cells[1]?.textContent.trim() || '';
        } else if (columnIndex === 2) { // Author
            aText = a.cells[2]?.textContent.trim() || '';
            bText = b.cells[2]?.textContent.trim() || '';
        } else if (columnIndex === 3) { // Category
            aText = a.cells[3]?.textContent.trim() || '';
            bText = b.cells[3]?.textContent.trim() || '';
        } else if (columnIndex === 4) { // Price
            const aPrice = a.cells[4]?.textContent.replace(/[^\d.-]/g, '') || '0';
            const bPrice = b.cells[4]?.textContent.replace(/[^\d.-]/g, '') || '0';
            return newSort === 'asc' ? parseFloat(aPrice) - parseFloat(bPrice) : parseFloat(bPrice) - parseFloat(aPrice);
        } else if (columnIndex === 5) { // Stock
            const aStock = a.cells[5]?.textContent.replace(/[^\d.-]/g, '') || '0';
            const bStock = b.cells[5]?.textContent.replace(/[^\d.-]/g, '') || '0';
            return newSort === 'asc' ? parseFloat(aStock) - parseFloat(bStock) : parseFloat(bStock) - parseFloat(aStock);
        } else if (columnIndex === 6) { // Status
            aText = a.cells[6]?.textContent.trim() || '';
            bText = b.cells[6]?.textContent.trim() || '';
        }
        
        // Text comparison
        const comparison = aText.localeCompare(bText);
        return newSort === 'asc' ? comparison : -comparison;
    });
    
    // Re-append sorted rows
    rows.forEach(row => tbody.appendChild(row));
}

/**
 * Load projects data and populate the projects table
 */
async function loadProjectsData() {
    try {
        showLoading();
        const response = await apiCall('/api/projects');
        const projects = response.data || response;
        
        const tableBody = document.getElementById('projects-tbody');
        if (tableBody) {
            if (projects.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-tertiary);">No projects found</td></tr>';
            } else {
                tableBody.innerHTML = projects.map(project => `
                    <tr>
                        <td style="padding: 1rem;">${project.title || 'N/A'}</td>
                        <td style="padding: 1rem;">${project.titleTamil || 'N/A'}</td>
                        <td style="padding: 1rem;">${project.description || 'N/A'}</td>
                        <td style="padding: 1rem;">
                            <span class="status-badge status-${project.status || 'active'}">${project.status || 'active'}</span>
                        </td>
                        <td style="padding: 1rem;">${project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</td>
                        <td style="padding: 1rem;">${project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</td>
                        <td style="padding: 1rem;">${project.teamSize || 'N/A'}</td>
                        <td style="padding: 1rem;">
                            <button class="btn btn-sm btn-secondary" onclick="editProject('${project._id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteProject('${project._id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }
        hideLoading();
    } catch (error) {
        console.error('Error loading projects:', error);
        hideLoading();
    }
}

/**
 * Load messages data and populate the messages table
 */
// Contact messages functionality removed
// async function loadMessagesData() { ... }

/**
 * Load dashboard data and update statistics
 */
async function loadDashboardData() {
    try {
        showLoading();
        
        // Load dashboard statistics
        const [booksResponse, ebooksResponse, projectsResponse, usersResponse, teamsResponse, chatsResponse, announcementsResponse, activitiesResponse, initiativesResponse] = await Promise.allSettled([
            cachedApiCall('/api/books'),
            cachedApiCall('/api/ebooks'),
            cachedApiCall('/api/projects'),
            cachedApiCall('/api/users'),
            cachedApiCall('/api/teams'),
            cachedApiCall('/api/chats'),
            cachedApiCall('/api/announcements'),
            cachedApiCall('/api/activities'),
            cachedApiCall('/api/initiatives')
        ]);
        
        // Update book count
        const totalBooksElement = document.getElementById('totalBooks');
        if (totalBooksElement && booksResponse.status === 'fulfilled') {
            const response = booksResponse.value;
            const books = (response && response.data) ? response.data : (Array.isArray(response) ? response : []);
            totalBooksElement.textContent = Array.isArray(books) ? books.length : 0;
        }
        
        // Update ebook count
        const totalEbooksElement = document.getElementById('totalEbooks');
        if (totalEbooksElement && ebooksResponse.status === 'fulfilled') {
            const response = ebooksResponse.value;
            const ebooks = (response && response.data) ? response.data : (Array.isArray(response) ? response : []);
            totalEbooksElement.textContent = Array.isArray(ebooks) ? ebooks.length : 0;
        }
        
        // Update project count
        const totalProjectsElement = document.getElementById('totalProjects');
        if (totalProjectsElement && projectsResponse.status === 'fulfilled') {
            const response = projectsResponse.value;
            const projects = (response && response.data) ? response.data : (Array.isArray(response) ? response : []);
            totalProjectsElement.textContent = Array.isArray(projects) ? projects.length : 0;
        }
        
        // Contact messages count removed - feature no longer available
        
        // Update users count
        const totalUsersElement = document.getElementById('totalUsers');
        if (totalUsersElement && usersResponse.status === 'fulfilled') {
            const response = usersResponse.value;
            const users = (response && response.data) ? response.data : (Array.isArray(response) ? response : []);
            totalUsersElement.textContent = Array.isArray(users) ? users.length : 0;
        }
        
        // Participants count removed - no longer needed
        
        // Update teams count
        const totalTeamsElement = document.getElementById('totalTeams');
        if (totalTeamsElement && teamsResponse.status === 'fulfilled') {
            const response = teamsResponse.value;
            const teams = (response && response.data) ? response.data : (Array.isArray(response) ? response : []);
            totalTeamsElement.textContent = Array.isArray(teams) ? teams.length : 0;
        }
        
        // Update chats count
        const totalChatsCountElement = document.getElementById('totalChatsCount');
        if (totalChatsCountElement && chatsResponse.status === 'fulfilled') {
            const response = chatsResponse.value;
            const chats = (response && response.data) ? response.data : (Array.isArray(response) ? response : []);
            totalChatsCountElement.textContent = Array.isArray(chats) ? chats.length : 0;
        }
        
        // Update announcements count
        const totalAnnouncementsElement = document.getElementById('totalAnnouncements');
        if (totalAnnouncementsElement && announcementsResponse.status === 'fulfilled') {
            const response = announcementsResponse.value;
            const announcements = (response && response.data) ? response.data : (Array.isArray(response) ? response : []);
            totalAnnouncementsElement.textContent = Array.isArray(announcements) ? announcements.length : 0;
        }
        
        // Update activities count
        const totalActivitiesElement = document.getElementById('totalActivities');
        if (totalActivitiesElement && activitiesResponse.status === 'fulfilled') {
            const response = activitiesResponse.value;
            const activities = (response && response.data) ? response.data : (Array.isArray(response) ? response : []);
            totalActivitiesElement.textContent = Array.isArray(activities) ? activities.length : 0;
        }
        
        // Update initiatives count
        const totalInitiativesElement = document.getElementById('totalInitiatives');
        if (totalInitiativesElement && initiativesResponse.status === 'fulfilled') {
            const response = initiativesResponse.value;
            const initiatives = (response && response.data) ? response.data : (Array.isArray(response) ? response : []);
            totalInitiativesElement.textContent = Array.isArray(initiatives) ? initiatives.length : 0;
        }
        
        // Charts will be initialized by initDashboard() function
        // Removed duplicate call to prevent multiple chart initializations
        
        hideLoading();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        hideLoading();
    }
}

/**
 * Refresh chat data and statistics
 */
async function refreshChats() {
    try {
        showLoading();
        
        // Refresh chat statistics in dashboard
        const chatsResponse = await cachedApiCall('/api/chats');
        const totalChatsCountElement = document.getElementById('totalChatsCount');
        if (totalChatsCountElement && chatsResponse) {
            const chats = (chatsResponse && chatsResponse.data) ? chatsResponse.data : (Array.isArray(chatsResponse) ? chatsResponse : []);
            totalChatsCountElement.textContent = Array.isArray(chats) ? chats.length : 0;
        }
        
        // Refresh admin chat manager if it exists
        if (typeof window.adminChatManager !== 'undefined' && window.adminChatManager) {
            await window.adminChatManager.loadChats();
            // Contact messages functionality removed
        }
        
        showNotification('Chat data refreshed successfully', 'success');
        hideLoading();
    } catch (error) {
        console.error('Error refreshing chats:', error);
        showNotification('Error refreshing chat data', 'error');
        hideLoading();
    }
}

async function refreshBooks() {
    try {
        showLoading();
        
        // Reload books data
        await loadBooksData();
        
        // Update dashboard stats if books count element exists
        const totalBooksCountElement = document.getElementById('totalBooksCount');
        if (totalBooksCountElement) {
            const booksResponse = await apiCall('/api/books');
            const books = booksResponse.data || [];
            totalBooksCountElement.textContent = books.length;
        }
        
        showNotification('Books data refreshed successfully', 'success');
        hideLoading();
    } catch (error) {
        console.error('Error refreshing books:', error);
        showNotification('Error refreshing books data', 'error');
        hideLoading();
    }
}

async function refreshEbooks() {
    try {
        showLoading();
        
        // Reload ebooks data
        await loadEbooks();
        
        // Update dashboard stats if ebooks count element exists
        const totalEbooksCountElement = document.getElementById('totalEbooksCount');
        if (totalEbooksCountElement) {
            const ebooksResponse = await apiCall('/api/ebooks');
            const ebooks = ebooksResponse.data || [];
            totalEbooksCountElement.textContent = ebooks.length;
        }
        
        showNotification('E-books data refreshed successfully', 'success');
        hideLoading();
    } catch (error) {
        console.error('Error refreshing ebooks:', error);
        showNotification('Error refreshing e-books data', 'error');
        hideLoading();
    }
}

async function refreshProjects() {
    try {
        showLoading();
        
        // Reload projects data
        await loadProjects();
        
        // Update dashboard stats if projects count element exists
        const totalProjectsCountElement = document.getElementById('totalProjectsCount');
        if (totalProjectsCountElement) {
            const projectsResponse = await apiCall('/api/projects');
            const projects = projectsResponse.data || [];
            totalProjectsCountElement.textContent = projects.length;
        }
        
        showNotification('Projects data refreshed successfully', 'success');
        hideLoading();
    } catch (error) {
        console.error('Error refreshing projects:', error);
        showNotification('Error refreshing projects data', 'error');
        hideLoading();
    }
}

async function refreshActivities() {
    try {
        showLoading();
        
        // Reload activities data
        await loadActivities();
        
        // Update dashboard stats if activities count element exists
        const totalActivitiesCountElement = document.getElementById('totalActivitiesCount');
        if (totalActivitiesCountElement) {
            const activitiesResponse = await apiCall('/api/activities');
            const activities = activitiesResponse.data || [];
            totalActivitiesCountElement.textContent = activities.length;
        }
        
        showNotification('Activities data refreshed successfully', 'success');
        hideLoading();
    } catch (error) {
        console.error('Error refreshing activities:', error);
        showNotification('Error refreshing activities data', 'error');
        hideLoading();
    }
}

async function refreshInitiatives() {
    try {
        showLoading();
        
        // Reload initiatives data
        await loadInitiatives();
        
        // Update dashboard stats if initiatives count element exists
        const totalInitiativesCountElement = document.getElementById('totalInitiativesCount');
        if (totalInitiativesCountElement) {
            const initiativesResponse = await apiCall('/api/initiatives');
            const initiatives = initiativesResponse.data || [];
            totalInitiativesCountElement.textContent = initiatives.length;
        }
        
        showNotification('Initiatives data refreshed successfully', 'success');
        hideLoading();
    } catch (error) {
        console.error('Error refreshing initiatives:', error);
        showNotification('Error refreshing initiatives data', 'error');
        hideLoading();
    }
}

/**
 * Load users data and populate the users table
 */
async function loadUsersData() {
    try {
        showLoading();
        const response = await apiCall('/api/users');
        const users = response.data || response;
        
        const tableBody = document.getElementById('usersTableBody');
        if (tableBody) {
            if (users.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-tertiary);">No users found</td></tr>';
            } else {
                tableBody.innerHTML = users.map(user => `
                    <tr>
                        <td style="padding: 1rem;">
                            <input type="checkbox" class="user-checkbox" value="${user._id}" onchange="updateBulkOperationsVisibility()">
                        </td>
                        <td style="padding: 1rem;">${user.name || user.firstName + ' ' + user.lastName || 'N/A'}</td>
                        <td style="padding: 1rem;">${user.email}</td>
                        <td style="padding: 1rem;">${user.role || 'user'}</td>
                        <td style="padding: 1rem;">
                            <span class="status-badge status-${user.status || 'active'}">${user.status || 'active'}</span>
                        </td>
                        <td style="padding: 1rem;">${new Date(user.createdAt).toLocaleDateString()}</td>
                        <td style="padding: 1rem;">
                            <button class="btn btn-sm btn-secondary" onclick="editUser('${user._id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteUser('${user._id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }
        hideLoading();
    } catch (error) {
        console.error('Error loading users:', error);
        hideLoading();
    }
}

/**
 * Update bulk operations visibility based on selected users
 */
function updateBulkOperationsVisibility() {
    const selectedUsers = getSelectedUsers();
    const bulkOperationsDiv = document.getElementById('bulkOperationsDiv');
    const selectAllCheckbox = document.getElementById('selectAllUsers');
    
    if (bulkOperationsDiv) {
        if (selectedUsers.length > 0) {
            bulkOperationsDiv.style.display = 'block';
            document.getElementById('selectedCount').textContent = selectedUsers.length;
        } else {
            bulkOperationsDiv.style.display = 'none';
        }
    }
    
    // Update select all checkbox state
    if (selectAllCheckbox) {
        const allCheckboxes = document.querySelectorAll('.user-checkbox');
        const checkedCheckboxes = document.querySelectorAll('.user-checkbox:checked');
        
        if (checkedCheckboxes.length === 0) {
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.checked = false;
        } else if (checkedCheckboxes.length === allCheckboxes.length) {
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.checked = true;
        } else {
            selectAllCheckbox.indeterminate = true;
        }
    }
}

/**
 * Toggle all user checkboxes
 */
function toggleAllUsers() {
    const selectAllCheckbox = document.getElementById('selectAllUsers');
    const userCheckboxes = document.querySelectorAll('.user-checkbox');
    
    userCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
    
    updateBulkOperationsVisibility();
}

/**
 * Show section creator modal
 */
function showSectionCreator(selectedPage = null) {
    // Try to use contentEditor first if available
    if (typeof window.contentEditor !== 'undefined' && window.contentEditor && typeof window.contentEditor.showSectionCreator === 'function') {
        window.contentEditor.showSectionCreator(selectedPage);
        return;
    }
    
    // Fallback to direct modal handling
    const modal = document.getElementById('sectionCreatorModal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Reset form
        const form = document.getElementById('sectionCreatorForm');
        if (form) {
            form.reset();
            // Clear section type selection
            document.querySelectorAll('.section-type-card').forEach(c => c.classList.remove('selected'));
            const hiddenInput = document.getElementById('selectedSectionType');
            if (hiddenInput) {
                hiddenInput.value = '';
            }
        }
        
        // Set the selected page if provided
        const pageSelect = document.getElementById('sectionPage');
        if (pageSelect && selectedPage) {
            pageSelect.value = selectedPage;
        } else if (pageSelect && !selectedPage) {
            // Get current page from page selector
            const currentPageSelector = document.getElementById('pageSelector');
            if (currentPageSelector && currentPageSelector.value) {
                pageSelect.value = currentPageSelector.value;
            }
        }
        
        // Initialize section type card listeners
        initializeSectionTypeSelection();
        
        // Focus on section name input after a short delay to ensure modal is visible
        setTimeout(() => {
            const sectionNameInput = document.getElementById('sectionName');
            if (sectionNameInput) {
                sectionNameInput.focus();
            }
        }, 100);
    } else {
        showNotification('Section creator not available', 'error');
    }
}

/**
 * Initialize section type card selection
 */
function initializeSectionTypeSelection() {
    const typeCards = document.querySelectorAll('.section-type-card');
    const selectedTypeInput = document.getElementById('selectedSectionType');
    
    typeCards.forEach(card => {
        // Remove existing listeners to prevent duplicates
        card.replaceWith(card.cloneNode(true));
    });
    
    // Re-query after cloning and add listeners
    const newTypeCards = document.querySelectorAll('.section-type-card');
    
    newTypeCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove selection from other cards
            newTypeCards.forEach(c => c.classList.remove('selected'));
            
            // Select current card
            card.classList.add('selected');
            
            // Update hidden input
            const sectionType = card.dataset.type;
            if (selectedTypeInput && sectionType) {
                selectedTypeInput.value = sectionType;
                console.log('Section type selected:', sectionType);
            }
        });
    });
}

/**
 * Close section creator modal
 */
function closeSectionCreator() {
    // Try to use contentEditor first if available
    if (typeof window.contentEditor !== 'undefined' && window.contentEditor && typeof window.contentEditor.hideSectionCreator === 'function') {
        window.contentEditor.hideSectionCreator();
        return;
    }
    
    // Fallback to direct modal handling
    const modal = document.getElementById('sectionCreatorModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Handle section creation form submission
 */
function handleSectionCreation(event) {
    event.preventDefault();
    
    // Ensure modal is visible for validation
    const modal = document.getElementById('sectionCreatorModal');
    if (modal && modal.style.display === 'none') {
        modal.style.display = 'flex';
    }
    
    const formData = new FormData(event.target);
    const sectionType = document.getElementById('selectedSectionType')?.value;
    
    if (!sectionType) {
        showNotification('Please select a section type', 'error');
        // Switch to section type tab
        const typeTab = document.getElementById('typeTab');
        const basicTab = document.getElementById('basicTab');
        const typeTabBtn = document.querySelector('[onclick="showTab(event, \'typeTab\')"]');
        if (typeTab && basicTab && typeTabBtn) {
            basicTab.style.display = 'none';
            basicTab.classList.remove('active');
            typeTab.style.display = 'block';
            typeTab.classList.add('active');
            // Update tab buttons
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            typeTabBtn.classList.add('active');
        }
        return;
    }
    
    // Validate required fields
    const page = formData.get('page');
    const sectionName = formData.get('section');
    
    if (!page) {
        showNotification('Please select a page', 'error');
        // Focus on page select
        const pageSelect = document.getElementById('sectionPage');
        if (pageSelect) {
            pageSelect.focus();
            pageSelect.style.borderColor = 'var(--text-danger)';
            setTimeout(() => {
                pageSelect.style.borderColor = 'var(--border-secondary)';
            }, 3000);
        }
        return;
    }
    
    if (!sectionName || !sectionName.trim()) {
        showNotification('Please enter a section name', 'error');
        // Focus on section name input
        const sectionNameInput = document.getElementById('sectionName');
        if (sectionNameInput) {
            sectionNameInput.focus();
            sectionNameInput.style.borderColor = 'var(--text-danger)';
            setTimeout(() => {
                sectionNameInput.style.borderColor = 'var(--border-secondary)';
            }, 3000);
        }
        return;
    }
    
    const sectionData = {
        page: page,
        section: sectionName.trim(),
        type: sectionType,
        order: parseInt(formData.get('order')) || 1,
        isActive: formData.get('isActive') === 'true',
        isVisible: formData.get('isVisible') === 'true',
        description: formData.get('description') || '',
        content: {
            en: '',
            ta: ''
        },
        metadata: {}
    };
    
    console.log('Creating section with data:', sectionData);
    createSection(sectionData);
}

/**
 * Create a new section
 */
async function createSection(sectionData) {
    try {
        showLoading();
        
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication token not found. Please log in again.');
        }
        
        const apiEndpoint = `/api/pages/${sectionData.page}/sections`;
        console.log('Creating section with API call to:', apiEndpoint);
        console.log('Section data:', sectionData);
        
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(sectionData)
        });
        
        console.log('API Response status:', response.status);
        console.log('API Response ok:', response.ok);
        
        if (response.ok) {
            const result = await response.json();
            console.log('Section created successfully:', result);
            showNotification('Section created successfully!', 'success');
            closeSectionCreator();
            
            // Reload content table
            try {
                if (typeof loadContentData === 'function') {
                    await loadContentData();
                }
            } catch (loadError) {
                console.warn('Failed to reload content data:', loadError);
            }
            
            // Reload content if content editor is active
            try {
                if (typeof window.contentEditor !== 'undefined' && window.contentEditor && window.contentEditor.loadPageContent) {
                    window.contentEditor.loadPageContent(sectionData.page);
                }
            } catch (editorError) {
                console.warn('Failed to reload content editor:', editorError);
            }
        } else {
            let errorMessage = 'Failed to create section';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
                console.error('API Error response:', errorData);
            } catch (parseError) {
                console.error('Failed to parse error response:', parseError);
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('Error creating section:', error);
        
        let userMessage = 'Error creating section';
        if (error.message) {
            userMessage += ': ' + error.message;
        }
        
        if (typeof showNotification === 'function') {
            showNotification(userMessage, 'error');
        } else {
            alert(userMessage);
        }
    } finally {
        if (typeof hideLoading === 'function') {
            hideLoading();
        }
    }
}

/**
 * Preview website in new tab
 */
function previewWebsite() {
    // Open the main website in a new tab
    window.open('/', '_blank');
}

/**
 * Switch content page in the editor
 */
// switchContentPage function moved to content-editor.js to avoid conflicts
// This function is now handled by the content editor module

/**
 * Save page content - handles both onclick and form submit events
 */
function savePageContent(eventOrPage, pageType) {
    // Handle form submit events
    if (eventOrPage && typeof eventOrPage === 'object' && eventOrPage.preventDefault) {
        return savePageContentFromForm(eventOrPage, pageType);
    }
    
    // Handle onclick events (direct page parameter)
    const page = eventOrPage;
    if (typeof window.contentEditor !== 'undefined' && window.contentEditor.savePageContent) {
        window.contentEditor.savePageContent(page);
    } else {
        showNotification('Content editor not loaded. Please refresh the page.', 'error');
    }
}

/**
 * Reset page content
 */
function resetPageContent(page) {
    if (confirm('Are you sure you want to reset all changes for this page? This action cannot be undone.')) {
        if (typeof window.contentEditor !== 'undefined' && window.contentEditor.resetPageContent) {
            window.contentEditor.resetPageContent(page);
        } else {
            showNotification('Content editor not loaded. Please refresh the page.', 'error');
        }
    }
}

// ContentEditor initialization is now handled by content-editor.js
// The initializeContentEditor function is defined later in the file

/**
 * Load website content data and populate the content table
 */
async function loadWebsiteContentData() {
    try {
        console.log('=== loadWebsiteContentData function called ===');
        showLoading();
        
        // Get JWT token from localStorage
        let token = localStorage.getItem('token');
        
        // If no token found, try to get it from session data or cookies
        if (!token) {
            const sessionData = localStorage.getItem('tamil_society_session');
            if (sessionData) {
                try {
                    const session = JSON.parse(sessionData);
                    token = session.token;
                } catch (e) {
                    console.error('Error parsing session data:', e);
                }
            }
            
            // Try cookie as fallback
            if (!token) {
                token = getCookie('token');
            }
        }
        
        console.log('Using token:', token ? 'Token found and ready' : 'No token available');
        
        if (!token) {
            console.warn('No authentication token found - API calls may fail');
        }
        
        // Helper function to get cookie value
        function getCookie(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
            return null;
        }
        
        // Fetch ALL content from the database instead of page-by-page
        console.log('Fetching all website content from database...');
        
        let content = [];
        
        try {
            const response = await fetch(`http://localhost:8080/api/website-content`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('API Response for all content:', data);
                
                if (data.success && data.data && Array.isArray(data.data)) {
                    // Helper function to extract text from content objects
                    const extractText = (content) => {
                        if (!content) return '';
                        if (typeof content === 'string') return content;
                        if (typeof content === 'object') {
                            return content.text || content.english?.text || content.content || 
                                   JSON.stringify(content).substring(0, 100) + '...';
                        }
                        return String(content);
                    };
                    
                    const extractTamilText = (content) => {
                        if (!content) return '';
                        if (typeof content === 'string') return content;
                        if (typeof content === 'object') {
                            return content.tamil?.text || content.tamil?.content || content.text || 
                                   JSON.stringify(content).substring(0, 100) + '...';
                        }
                        return String(content);
                    };
                    
                    content = data.data.map((item, index) => {
                        return {
                            _id: item._id || `${item.page || 'unknown'}.${item.section || 'default'}.${index}`,
                            pageName: item.page || 'unknown',
                            sectionId: item.section || 'default',
                            elementId: item._id || `element_${index}`,
                            content_key: `${item.page || 'unknown'}.${item.section || 'default'}.${item._id || index}`,
                            content: extractText(item.content) || extractText(item.title) || '',
                            contentTamil: extractTamilText(item.contentTamil) || extractTamilText(item.titleTamil) || '',
                            title: extractText(item.title) || '',
                            titleTamil: extractTamilText(item.titleTamil) || '',
                            subtitle: extractText(item.subtitle) || '',
                            subtitleTamil: extractTamilText(item.subtitleTamil) || '',
                            sectionTitle: `${item.section || 'Section'} - ${extractText(item.title) || 'Content'}`,
                            contentHtml: extractText(item.content) || extractText(item.title) || '',
                            isActive: item.isActive !== false,
                            isVisible: item.isVisible !== false,
                            order: item.order || index + 1,
                            section: item.section,
                            page: item.page,
                            buttonText: item.buttonText || '',
                            buttonTextTamil: item.buttonTextTamil || '',
                            buttonUrl: item.buttonUrl || '',
                            image: item.image || '',
                            images: item.images || [],
                            metadata: item.metadata || {},
                            createdAt: item.createdAt,
                            updatedAt: item.updatedAt,
                            // Store original objects for editing
                            originalContent: item.content,
                            originalContentTamil: item.contentTamil
                        };
                    });
                    
                    console.log('Total sections loaded from database:', content.length);
                } else {
                    console.warn('No content found in database:', data);
                }
            } else {
                console.error('Failed to load all content:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error loading all content:', error);
        }
        
        const tableBody = document.getElementById('contentTableBody');
        console.log('Table body element found:', !!tableBody);
        console.log('Content array length:', content.length);
        console.log('Sample content item:', content[0]);
        
        if (tableBody) {
            if (content.length === 0) {
                console.log('No content found - showing empty message');
                tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-tertiary);">No content found</td></tr>';
            } else {
                console.log('Populating table with', content.length, 'items');
                tableBody.innerHTML = content.map(item => `
                    <tr>
                        <td style="padding: 1rem;">${item.page || item.pageName || 'N/A'}</td>
                        <td style="padding: 1rem;">${item.section || item.sectionId || 'N/A'}</td>
                        <td style="padding: 1rem;">${item.title?.en || item.title || item.sectionTitle || 'Untitled'}</td>
                        <td style="padding: 1rem;">${item.title?.ta || item.titleTamil || 'N/A'}</td>
                        <td style="padding: 1rem;">
                            <span class="status-badge ${item.isActive ? 'status-active' : 'status-inactive'}">
                                ${item.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td style="padding: 1rem;">${new Date(item.updatedAt || item.createdAt).toLocaleDateString()}</td>
                        <td style="padding: 1rem;">
                            <button class="btn btn-sm btn-secondary" onclick="editContent('${item._id}')" title="Edit Content">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-info" onclick="duplicateContent('${item._id}')" title="Duplicate Content">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="toggleContentVisibility('${item._id}', ${item.isVisible})" title="Toggle Visibility">
                                <i class="fas fa-eye${item.isVisible ? '' : '-slash'}"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteContent('${item._id}')" title="Delete Content">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }
        
        // Initialize content editor only after all sections are loaded
        if (content.length > 0) {
            initializeContentEditor(content);
        } else {
            console.warn('Content editor not initialized: No sections available');
        }
        
        // Ensure all content editors are hidden initially
        const contentEditors = document.querySelectorAll('.page-content-editor');
        contentEditors.forEach(editor => {
            editor.style.display = 'none';
            editor.classList.remove('active');
        });
        console.log('All content editors hidden initially:', contentEditors.length, 'editors found');
        
        hideLoading();
    } catch (error) {
        console.error('Error loading content:', error);
        hideLoading();
        
        // Show error message in table
        const tableBody = document.getElementById('contentTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-danger);">Error loading content. Please try again.</td></tr>';
        }
    }
}

/**
 * Initialize content editor with loaded sections
 * @param {Array} sections - Array of loaded sections
 * Note: ContentEditor initialization is now handled by content-editor.js
 */
function initializeContentEditor(sections) {
    console.log('initializeContentEditor called with sections:', sections?.length || 0);
    
    // ContentEditor is initialized by content-editor.js, just wait for it to be ready
    if (window.contentEditor && typeof window.contentEditor.loadSections === 'function') {
        console.log('ContentEditor found, loading sections...');
        window.contentEditor.loadSections(sections);
    } else {
        console.log('ContentEditor not ready yet, sections will be loaded when it initializes');
    }
}

/**
 * Alias for loadWebsiteContentData - for backward compatibility
 */
const loadContentData = loadWebsiteContentData;

/**
 * Duplicate content section
 */
async function duplicateContent(contentId) {
    try {
        showLoading();
        const response = await apiCall(`/api/website-content/duplicate`, {
            method: 'POST'
        });
        
        if (response.success) {
            showNotification('Content duplicated successfully', 'success');
            loadContentData(); // Reload the content table
        } else {
            throw new Error(response.message || 'Failed to duplicate content');
        }
    } catch (error) {
        console.error('Error duplicating content:', error);
        showNotification('Error duplicating content', 'error');
    } finally {
        hideLoading();
    }
}

function closeBulkOperationsModal() {
    document.getElementById('bulkOperationsModal').style.display = 'none';
}

function confirmBulkOperation() {
    const operation = document.getElementById('bulkOperationsModal').dataset.operation;
    const selectedUsers = getSelectedUsers();
    
    if (selectedUsers.length === 0) {
        showNotification('No users selected', 'error');
        return;
    }
    
    performBulkOperation(operation);
    closeBulkOperationsModal();
}

/**
 * Toggle content visibility
 */
async function toggleContentVisibility(contentId, currentVisibility) {
    try {
        showLoading();
        const response = await apiCall(`/api/website-content/${contentId}`, {
            method: 'PUT'
        });
        
        if (response.success) {
            const newStatus = currentVisibility ? 'hidden' : 'visible';
            showNotification(`Content ${newStatus} successfully`, 'success');
            loadContentData(); // Reload the content table
        } else {
            throw new Error(response.message || 'Failed to toggle visibility');
        }
    } catch (error) {
        console.error('Error toggling content visibility:', error);
        showNotification('Error updating content visibility', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Load settings data
 */
async function loadSettingsData() {
    try {
        showLoading();
        const response = await apiCall('/api/admin/settings');
        const settings = response.data || response;
        
        // Update settings form with current values
        if (settings) {
            const siteTitle = document.getElementById('siteTitle');
            const siteDescription = document.getElementById('siteDescription');
            const contactEmail = document.getElementById('contactEmail');
            
            if (siteTitle) siteTitle.value = settings.siteTitle || '';
            if (siteDescription) siteDescription.value = settings.siteDescription || '';
            if (contactEmail) contactEmail.value = settings.contactEmail || '';
        }
        
        hideLoading();
    } catch (error) {
        console.error('Error loading settings:', error);
        hideLoading();
    }
}





/**
 * Initialize the admin panel functionality
 */
// initAdminPanel function moved to earlier in the file to fix execution order

// Navigation is now handled by initSidebar() function

// showSection function moved to earlier position to avoid reference errors

/**
 * Initialize search event listeners
 */
function initSearchListeners() {
    // Books search
    const booksSearch = document.getElementById('booksSearch');
    if (booksSearch) {
        booksSearch.addEventListener('input', function() {
            filterBooks(this.value);
        });
    }
    
    // Books status filter
    const booksStatusFilter = document.getElementById('booksStatusFilter');
    if (booksStatusFilter) {
        booksStatusFilter.addEventListener('change', function() {
            filterBooksByStatus(this.value);
        });
    }
    
    // Ebooks search
    const ebooksSearch = document.getElementById('ebooksSearch');
    if (ebooksSearch) {
        ebooksSearch.addEventListener('input', function() {
            filterEbooks(this.value);
        });
    }
    
    // Ebooks status filter
    const ebooksStatusFilter = document.getElementById('ebooksStatusFilter');
    if (ebooksStatusFilter) {
        ebooksStatusFilter.addEventListener('change', function() {
            filterEbooksByStatus(this.value);
        });
    }
    
    // Projects search
    const projectsSearch = document.getElementById('projectsSearch');
    if (projectsSearch) {
        projectsSearch.addEventListener('input', function() {
            filterProjects(this.value);
        });
    }
    
    // Users search - fix ID to match HTML
    const usersSearch = document.getElementById('users-search');
    if (usersSearch) {
        usersSearch.addEventListener('input', function() {
            filterUsers(this.value);
        });
    }
    
    // Messages search
    const messagesSearch = document.getElementById('messagesSearch');
    if (messagesSearch) {
        messagesSearch.addEventListener('input', function() {
            filterMessages(this.value);
        });
    }
    
    // Team search
    const teamSearch = document.getElementById('teamSearch');
    if (teamSearch) {
        teamSearch.addEventListener('input', function() {
            filterTeamMembers(this.value);
        });
    }
}



/**
 * Toggle editor language between Tamil and English
 */
function toggleEditorLanguage(editor) {
    const currentContent = editor.getContent();
    const isTamilMode = editor.getElement().classList.contains('tamil-mode');
    
    if (isTamilMode) {
        // Switch to English mode
        editor.getElement().classList.remove('tamil-mode');
        editor.getElement().classList.add('english-mode');
        editor.getBody().style.fontFamily = "'Poppins', Helvetica, Arial, sans-serif";
        showNotification('Switched to English input mode', 'info');
    } else {
        // Switch to Tamil mode
        editor.getElement().classList.remove('english-mode');
        editor.getElement().classList.add('tamil-mode');
        editor.getBody().style.fontFamily = "'Noto Sans Tamil', 'Tamil Sangam MN', 'Tamil MN', sans-serif";
        showNotification('தமிழ் உள்ளீட்டு முறைக்கு மாற்றப்பட்டது', 'info');
    }
}

/**
 * Auto-save content from TinyMCE editor
 */
async function autoSaveContent(editor) {
    try {
        const content = editor.getContent();
        const editorId = editor.id;
        
        // Extract page and field information from editor ID
        const parts = editorId.split('-');
        if (parts.length >= 2) {
            const page = parts[0];
            const field = parts.slice(1).join('-');
            
            // Save to localStorage as backup
            const autoSaveKey = `autosave_${page}_${field}`;
            localStorage.setItem(autoSaveKey, JSON.stringify({
                content: content,
                timestamp: new Date().toISOString(),
                editorId: editorId
            }));
            
            console.log(`Auto-saved content for ${editorId}`);
        }
    } catch (error) {
        console.error('Auto-save failed:', error);
    }
}

/**
 * Restore auto-saved content
 */
function restoreAutoSavedContent() {
    try {
        const autoSaveKeys = Object.keys(localStorage).filter(key => key.startsWith('autosave_'));
        
        autoSaveKeys.forEach(key => {
            const autoSaveData = JSON.parse(localStorage.getItem(key));
            const editor = tinymce.get(autoSaveData.editorId);
            
            if (editor && autoSaveData.content) {
                const currentContent = editor.getContent();
                
                // Only restore if current content is empty or significantly different
                if (!currentContent.trim() || currentContent.length < autoSaveData.content.length * 0.5) {
                    editor.setContent(autoSaveData.content);
                    showNotification(`Restored auto-saved content for ${autoSaveData.editorId}`, 'info');
                }
            }
        });
    } catch (error) {
        console.error('Failed to restore auto-saved content:', error);
    }
}

/**
 * Initialize ebook management functionality
 */
function initEbookManagement() {
    // Load ebooks data
    loadEbooks();
    
    // Add event listener for add ebook button
    const addEbookBtn = document.getElementById('add-ebook-btn');
    if (addEbookBtn) {
        addEbookBtn.addEventListener('click', function() {
            showEbookModal();
        });
    } else {
        console.log('Add ebook button not found - using onclick handler instead');
    }
    
    // Add event listener for ebook search
    const ebookSearch = document.getElementById('ebooksSearch');
    if (ebookSearch) {
        ebookSearch.addEventListener('input', function() {
            filterEbooks(this.value);
        });
    } else {
        console.log('Ebook search input not found');
    }
}

// Dashboard stats loading function
async function loadDashboardStats() {
    try {
        console.log('Loading dashboard stats...');
        
        // Load basic stats
        const [booksResponse, ebooksResponse, projectsResponse, messagesResponse] = await Promise.allSettled([
            apiCall('/api/books'),
            apiCall('/api/ebooks'),
            apiCall('/api/projects'),
            apiCall('/api/messages')
        ]);
        
        // Update stats display
        const totalBooksElement = document.getElementById('totalBooks');
        if (totalBooksElement && booksResponse.status === 'fulfilled') {
            const books = booksResponse.value.data || booksResponse.value;
            totalBooksElement.textContent = Array.isArray(books) ? books.length : 0;
        }
        
        const totalEbooksElement = document.getElementById('totalEbooks');
        if (totalEbooksElement && ebooksResponse.status === 'fulfilled') {
            const ebooks = ebooksResponse.value.data || ebooksResponse.value;
            totalEbooksElement.textContent = Array.isArray(ebooks) ? ebooks.length : 0;
        }
        
        const totalProjectsElement = document.getElementById('totalProjects');
        if (totalProjectsElement && projectsResponse.status === 'fulfilled') {
            const projects = projectsResponse.value.data || projectsResponse.value;
            totalProjectsElement.textContent = Array.isArray(projects) ? projects.length : 0;
        }
        
        const totalMessagesElement = document.getElementById('totalMessages');
        if (totalMessagesElement && messagesResponse.status === 'fulfilled') {
            const messages = messagesResponse.value.data || messagesResponse.value;
            totalMessagesElement.textContent = Array.isArray(messages) ? messages.length : 0;
        }
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

/**
 * Load section-specific data
 * @param {string} sectionId - The ID of the section to load data for
 */
async function loadSectionData(sectionId) {
    console.log('=== loadSectionData called with:', sectionId);
    try {
        switch (sectionId) {
            case 'dashboard':
                console.log('Loading dashboard data...');
                await loadDashboardStats();
                if (window.globalDashboard) {
                    window.globalDashboard.refresh();
                } else {
                    // Initialize global dashboard if not already done
                    setTimeout(() => {
                        if (window.globalDashboard) {
                            window.globalDashboard.refresh();
                        }
                    }, 500);
                }
                break;
            case 'books':
                console.log('Loading books data...');
                await loadBooksData();
                break;
            case 'ebooks':
                console.log('Loading ebooks data...');
                await loadEbooksData();
                break;
            case 'projects':
                console.log('Loading projects data...');
                await loadProjectsData();
                break;
            case 'activities':
                console.log('Loading activities data...');
                await loadActivities();
                break;
            case 'initiatives':
                console.log('Loading initiatives data...');
                await loadInitiatives();
                break;
            // Contact messages section removed
            // case 'messages':
            //     console.log('Loading messages data...');
            //     await loadMessagesData();
            //     break;
            case 'users':
                console.log('Loading users data...');
                await loadUsersData();
                break;
            case 'team':
                console.log('Loading team data...');
                if (typeof loadTeamMembers === 'function') {
                    await loadTeamMembers();
                } else {
                    console.error('loadTeamMembers function not found - ensure team-management.js is loaded');
                }
                break;
            case 'website-content':
                console.log('=== Loading website-content section ===');
                await loadWebsiteContentData();
                break;
            case 'settings':
                console.log('Loading settings data...');
                await loadSettingsData();
                break;
            case 'purchased-books':
                console.log('Loading purchased books data...');
                if (typeof loadPurchasedBooksData === 'function') {
                    await loadPurchasedBooksData();
                } else {
                    console.warn('loadPurchasedBooksData function not found');
                }
                break;
            case 'payment-settings':
                console.log('Loading payment settings data...');
                await loadPaymentSettings();
                break;
            // Removed project-participants case (feature removed)
            // case 'project-participants':
            //     console.log('Loading project participants data...');
            //     if (typeof loadProjectParticipantsData === 'function') {
            //         await loadProjectParticipantsData();
            //     } else {
            //         console.warn('loadProjectParticipantsData function not found - ensure project-participants-management.js is loaded');
            //     }
            //     break;
            case 'recruitment':
                console.log('Loading recruitment data...');
                await loadRecruitmentStats();
                await loadRecruitmentFormsList();
                break;
            case 'media-management':
                console.log('Loading media management data...');
                initMediaManagement();
                break;

            default:
                console.log('No specific data loading for section:', sectionId);
        }
        console.log('=== loadSectionData completed for:', sectionId);
    } catch (error) {
        console.error('=== Error in loadSectionData for', sectionId, ':', error);
    }
}

/**
 * Load ebooks data and populate the ebooks table
 */
async function loadEbooksData() {
    try {
        showLoading();
        const response = await apiCall('/api/ebooks');
        const ebooks = response.data || response;
        
        const tableBody = document.getElementById('ebooksTableBody');
        if (tableBody) {
            if (ebooks.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-tertiary);">No ebooks found</td></tr>';
            } else {
                tableBody.innerHTML = ebooks.map(ebook => `
                    <tr>
                        <td style="padding: 1rem;">${ebook.title || 'N/A'}</td>
                        <td style="padding: 1rem;">${ebook.titleTamil || 'N/A'}</td>
                        <td style="padding: 1rem;">${ebook.author || 'N/A'}</td>
                        <td style="padding: 1rem;">${ebook.authorTamil || 'N/A'}</td>
                        <td style="padding: 1rem;">${ebook.category || 'N/A'}</td>
                        <td style="padding: 1rem;">${ebook.language || 'N/A'}</td>
                        <td style="padding: 1rem;">${ebook.downloadCount || 0}</td>
                        <td style="padding: 1rem;">
                            <span class="status-badge status-${ebook.status || 'available'}">${ebook.status || 'available'}</span>
                        </td>
                        <td style="padding: 1rem;">
                            <button class="btn btn-sm btn-secondary" onclick="editEbook('${ebook._id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteEbook('${ebook._id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }
        hideLoading();
    } catch (error) {
        console.error('Error loading ebooks:', error);
        hideLoading();
    }
}

/**
 * Load ebooks data and populate the ebooks table (legacy function)
 */
async function loadEbooks() {
    try {
        const response = await apiCall('/api/ebooks');
        const ebooks = response.data || response;
        populateEbooksTable(ebooks);
    } catch (error) {
        console.error('Error loading ebooks:', error);
        populateEbooksTable([]);
    }
}



/**
 * Populate ebooks table with data
 * @param {Array} ebooks - Array of ebook objects
 */
function populateEbooksTable(ebooks) {
    const ebooksTableBody = document.getElementById('ebooksTableBody');
    if (!ebooksTableBody) return;
    
    // Clear existing rows
    ebooksTableBody.innerHTML = '';
    
    // Add each ebook to the table
    ebooks.forEach(ebook => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>
                <div class="ebook-info">
                    <img src="${ebook.thumbnail || '/assets/ebooks/default-thumb.svg'}" alt="${ebook.title}" class="ebook-thumbnail">
                    <div>
                        <div class="ebook-title">${ebook.title}</div>
                        <div class="ebook-author">${ebook.author}</div>
                    </div>
                </div>
            </td>
            <td>${ebook.category || 'General'}</td>
            <td>${ebook.downloadCount || 0}</td>
            <td>${new Date(ebook.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="ebook-actions">
                    <button class="btn-download" data-ebook-url="${ebook.fileUrl}" title="Download">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn-edit" data-ebook-id="${ebook._id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" data-ebook-id="${ebook._id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        ebooksTableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    addEbookActionListeners();
    
    // Re-initialize table sorting after populating data
    if (window.tableSorter) {
        setTimeout(() => {
            window.tableSorter.initializeSorting();
        }, 100);
    }
}

/**
 * Add event listeners to ebook action buttons
 */
function addEbookActionListeners() {
    // Download buttons
    const downloadButtons = document.querySelectorAll('.btn-download');
    downloadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const fileUrl = this.getAttribute('data-ebook-url');
            window.open(fileUrl, '_blank');
        });
    });
    
    // Edit buttons
    const editButtons = document.querySelectorAll('.btn-edit');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const ebookId = this.getAttribute('data-ebook-id');
            editEbook(ebookId);
        });
    });
    
    // Delete buttons
    const deleteButtons = document.querySelectorAll('.btn-delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const ebookId = this.getAttribute('data-ebook-id');
            deleteEbook(ebookId);
        });
    });
}

// showEbookModal function is defined later in the file

/**
 * Edit an ebook
 * @param {string} ebookId - The ID of the ebook to edit
 */
async function editEbook(ebookId) {
    try {
        const response = await apiCall(`/api/ebooks/${ebookId}`);
        const ebook = response.data || response;
        showEbookModal(ebook);
    } catch (error) {
        console.error('Error loading ebook:', error);
        showNotification('Failed to load ebook data', 'error');
    }
}

/**
 * Delete an ebook
 * @param {string} ebookId - The ID of the ebook to delete
 */
async function deleteEbook(ebookId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this e-book?')) return;
    
    try {
        await apiCall(`/api/ebooks/${ebookId}`, {
            method: 'DELETE'
        });
        
        // Reload ebooks table
        loadEbooks();
        
        // Show success message
        showNotification('E-book deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting ebook:', error);
        showNotification('Failed to delete e-book', 'error');
    }
}

/**
 * Filter ebooks based on search query
 * @param {string} query - The search query
 */
function filterEbooks(query) {
    query = query.toLowerCase();
    
    // Get all ebook rows
    const ebookRows = document.querySelectorAll('#ebooksTableBody tr');
    
    // Show/hide rows based on search query
    ebookRows.forEach(row => {
        if (row.cells && row.cells.length > 1) {
            // Get title and author from the nested div elements in the first column
            const titleElement = row.querySelector('.ebook-title');
            const authorElement = row.querySelector('.ebook-author');
            const title = titleElement ? titleElement.textContent.toLowerCase() : '';
            const author = authorElement ? authorElement.textContent.toLowerCase() : '';
            const category = row.cells[1].textContent.toLowerCase(); // Category is in column 2
            
            if (title.includes(query) || author.includes(query) || category.includes(query)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

/**
 * Initialize project management functionality
 */
function initProjectManagement() {
    // Load projects data
    loadProjects();
    
    // Add event listener for add project button
    const addProjectBtn = document.getElementById('add-project-btn');
    if (addProjectBtn) {
        addProjectBtn.addEventListener('click', function() {
            showProjectModal();
        });
    } else {
        console.log('Add project button not found - using onclick handler instead');
    }
    
    // Add event listener for project search
    const projectSearch = document.getElementById('projectsSearch');
    if (projectSearch) {
        projectSearch.addEventListener('input', function() {
            filterProjects(this.value);
        });
    } else {
        console.log('Project search input not found');
    }
}

/**
 * Load projects data and populate the projects table
 */
async function loadProjects() {
    try {
        const response = await apiCall('/api/projects');
        const projects = response.data || [];
        populateProjectsTable(projects);
    } catch (error) {
        console.error('Error loading projects:', error);
        populateProjectsTable([]);
    }
}



/**
 * Populate projects table with data
 * @param {Array} projects - Array of project objects
 */
function populateProjectsTable(projects) {
    const projectsTableBody = document.getElementById('projectsTableBody');
    if (!projectsTableBody) return;
    
    // Clear existing rows
    projectsTableBody.innerHTML = '';
    
    if (projects.length === 0) {
        projectsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-tertiary);">No projects found</td></tr>';
        return;
    }
    
    // Add each project to the table
    projects.forEach(project => {
        const row = document.createElement('tr');
        
        const statusClass = project.status === 'active' ? 'status-active' : 
                           project.status === 'draft' ? 'status-draft' : 'status-archived';
        
        // Format bureau name
        const bureauName = project.bureau ? project.bureau.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : 'N/A';
        
        // Format created date
        const createdDate = project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A';
        
        // Get primary image or first image
        const primaryImage = project.images && project.images.length > 0 ? 
            project.images.find(img => img.isPrimary) || project.images[0] : null;
        
        row.innerHTML = `
            <td style="padding: 1rem;">
                ${primaryImage ? 
                    `<img src="/uploads/projects/${primaryImage.filename}" alt="${project.title}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 0.25rem;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"><i class="fas fa-image" style="display: none; font-size: 1.5rem; color: var(--text-tertiary);"></i>` :
                    `<i class="fas fa-image" style="font-size: 1.5rem; color: var(--text-tertiary);"></i>`
                }
            </td>
            <td style="padding: 1rem;">
                <div class="project-info">
                    <div class="project-title" style="font-weight: 600; margin-bottom: 0.25rem;">${project.title}</div>
                    <div class="project-description" style="font-size: 0.875rem; color: var(--text-secondary);">${project.description ? project.description.substring(0, 50) + '...' : 'No description'}</div>
                </div>
            </td>
            <td style="padding: 1rem;">${bureauName}</td>
            <td style="padding: 1rem;">
                <span class="status-badge status-${project.status}">${project.status}</span>
            </td>
            <td style="padding: 1rem;">${project.teamSize || 1}</td>
            <td style="padding: 1rem;">${createdDate}</td>
            <td style="padding: 1rem;">
                <button class="btn btn-sm btn-secondary" onclick="editProject('${project._id}')" title="Edit">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProject('${project._id}')" title="Delete">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        
        projectsTableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    addProjectActionListeners();
    
    // Re-initialize table sorting after populating data
    if (window.tableSorter) {
        setTimeout(() => {
            window.tableSorter.initializeSorting();
        }, 100);
    }
}

/**
 * Add event listeners to project action buttons
 */
function addProjectActionListeners() {
    // View buttons
    const viewButtons = document.querySelectorAll('.btn-view');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const projectId = this.getAttribute('data-project-id');
            viewProject(projectId);
        });
    });
    
    // Edit buttons
    const editButtons = document.querySelectorAll('.btn-edit');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const projectId = this.getAttribute('data-project-id');
            editProject(projectId);
        });
    });
    
    // Delete buttons
    const deleteButtons = document.querySelectorAll('.btn-delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const projectId = this.getAttribute('data-project-id');
            deleteProject(projectId);
        });
    });
}

/**
 * Show project modal for adding/editing
 * @param {Object} project - Project data for editing (optional)
 */
function showProjectModal(project = null) {
    const modal = document.getElementById('project-modal');
    const form = document.getElementById('project-form');
    const modalTitle = document.getElementById('project-modal-title');
    
    if (!modal || !form) return;
    
    // Reset form
    form.reset();
    
    // Clear existing images preview
    const imagePreview = document.getElementById('project-images-preview');
    if (imagePreview) {
        imagePreview.innerHTML = '';
    }
    
    if (project) {
        // Edit mode
        modalTitle.textContent = 'Edit Project';
        form.setAttribute('data-project-id', project._id);
        
        // Populate form fields
        form.querySelector('[name="title"]').value = project.title || '';
        form.querySelector('[name="description"]').value = project.description || '';
        form.querySelector('[name="bureau"]').value = project.bureau || '';
        form.querySelector('[name="status"]').value = project.status || '';
        form.querySelector('[name="teamSize"]').value = project.teamSize || '';
        form.querySelector('[name="goals"]').value = project.goals || '';
        form.querySelector('[name="achievements"]').value = project.achievements || '';
        
        // Handle checkboxes
        const featuredCheckbox = form.querySelector('[name="featured"]');
        if (featuredCheckbox) {
            featuredCheckbox.checked = project.featured || false;
        }
        
        const acceptingVolunteersCheckbox = form.querySelector('[name="acceptingVolunteers"]');
        if (acceptingVolunteersCheckbox) {
            acceptingVolunteersCheckbox.checked = project.acceptingVolunteers || false;
        }
        
        // Display existing images
        if (project.images && project.images.length > 0 && imagePreview) {
            project.images.forEach((image, index) => {
                const imageDiv = document.createElement('div');
                imageDiv.className = 'image-preview-item';
                imageDiv.innerHTML = `
                    <img src="${image.url}" alt="Project image ${index + 1}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;">
                    <button type="button" class="btn btn-sm btn-danger" onclick="removeExistingImage('${image._id}', this)">Remove</button>
                    ${image.isPrimary ? '<span class="badge badge-primary">Primary</span>' : ''}
                `;
                imagePreview.appendChild(imageDiv);
            });
        }
    } else {
        // Add mode
        modalTitle.textContent = 'Add New Project';
        form.removeAttribute('data-project-id');
    }
    
    // Show modal
    modal.classList.add('show');
    modal.style.display = 'flex';
}

/**
 * View a project
 * @param {string} projectId - The ID of the project to view
 */
async function viewProject(projectId) {
    try {
        const response = await apiCall(`/api/projects/${projectId}`);
        const project = response.data || response;
        showProjectDetailsModal(project);
    } catch (error) {
        console.error('Error loading project:', error);
        showNotification('Failed to load project data', 'error');
    }
}

/**
 * Edit a project
 * @param {string} projectId - The ID of the project to edit
 */
async function editProject(projectId) {
    try {
        const response = await apiCall(`/api/projects/${projectId}`);
        const project = response.data || response;
        showProjectModal(project);
    } catch (error) {
        console.error('Error loading project:', error);
        showNotification('Failed to load project data', 'error');
    }
}

/**
 * Delete a project
 * @param {string} projectId - The ID of the project to delete
 */
async function deleteProject(projectId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
        await apiCall(`/api/projects/${projectId}`, {
            method: 'DELETE'
        });
        
        // Reload projects table
        loadProjects();
        
        // Show success message
        showNotification('Project deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting project:', error);
        showNotification('Failed to delete project', 'error');
    }
}

/**
 * Filter projects based on search query
 * @param {string} query - The search query
 */
function filterProjects(query) {
    query = query.toLowerCase();
    
    // Get all project rows
    const projectRows = document.querySelectorAll('#projectsTableBody tr');
    
    // Show/hide rows based on search query
    projectRows.forEach(row => {
        if (row.cells && row.cells.length > 1) {
            // Get title and description from the nested div elements in the first column
            const titleElement = row.querySelector('.project-title');
            const descriptionElement = row.querySelector('.project-description');
            const title = titleElement ? titleElement.textContent.toLowerCase() : '';
            const description = descriptionElement ? descriptionElement.textContent.toLowerCase() : '';
            const status = row.cells[1].textContent.toLowerCase(); // Status is in column 2
            
            if (title.includes(query) || description.includes(query) || status.includes(query)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

// ===== ACTIVITIES MANAGEMENT =====

/**
 * Initialize activities management functionality
 */
function initActivitiesManagement() {
    // Load activities data
    loadActivities();
    
    // Add event listener for add activity button
    const addActivityBtn = document.getElementById('add-activity-btn');
    if (addActivityBtn) {
        addActivityBtn.addEventListener('click', function() {
            showActivityModal();
        });
    }
    
    // Add event listener for activity search
    const activitySearch = document.getElementById('activitiesSearch');
    if (activitySearch) {
        activitySearch.addEventListener('input', function() {
            filterActivities(this.value);
        });
    }
}

/**
 * Load activities data and populate the activities table
 */
async function loadActivities() {
    try {
        const response = await apiCall('/api/activities');
        const activities = response.data || [];
        populateActivitiesTable(activities);
    } catch (error) {
        console.error('Error loading activities:', error);
        populateActivitiesTable([]);
    }
}

/**
 * Populate activities table with data
 * @param {Array} activities - Array of activity objects
 */
function populateActivitiesTable(activities) {
    const activitiesTableBody = document.getElementById('activities-tbody');
    if (!activitiesTableBody) return;
    
    if (activities.length === 0) {
        activitiesTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-tertiary);">No activities found</td></tr>';
    } else {
        activitiesTableBody.innerHTML = activities.map(activity => `
            <tr>
                <td style="padding: 1rem;">${activity.title}</td>
                <td style="padding: 1rem;">${activity.category}</td>
                <td style="padding: 1rem;">${new Date(activity.date).toLocaleDateString()}</td>
                <td style="padding: 1rem;">${activity.location}</td>
                <td style="padding: 1rem;">${activity.registrations ? activity.registrations.length : 0}</td>
                <td style="padding: 1rem;">
                    <span class="status-badge status-${activity.status || 'active'}">${activity.status || 'active'}</span>
                </td>
                <td style="padding: 1rem;">
                    <button class="btn btn-sm btn-secondary" onclick="editActivity('${activity._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteActivity('${activity._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

/**
 * Show activity modal for adding/editing
 * @param {Object} activity - Activity data for editing (optional)
 */
function showActivityModal(activity = null) {
    const modal = document.getElementById('activity-modal');
    const form = document.getElementById('activity-form');
    const modalTitle = document.getElementById('activity-modal-title');
    
    if (!modal || !form) {
        console.error('Activity modal elements not found');
        return;
    }
    
    // Reset form
    form.reset();
    
    // Clear existing images preview
    const imagePreview = document.getElementById('activity-images-preview');
    if (imagePreview) {
        imagePreview.innerHTML = '';
    }
    
    if (activity) {
        // Edit mode
        modalTitle.textContent = 'Edit Activity';
        form.setAttribute('data-activity-id', activity._id);
        
        // Populate form fields
        form.querySelector('[name="title"]').value = activity.title || '';
        form.querySelector('[name="description"]').value = activity.description || '';
        form.querySelector('[name="bureau"]').value = activity.bureau || '';
        form.querySelector('[name="status"]').value = activity.status || '';
        form.querySelector('[name="teamSize"]').value = activity.teamSize || '';
        form.querySelector('[name="goals"]').value = activity.goals || '';
        form.querySelector('[name="achievements"]').value = activity.achievements || '';
        
        // Handle checkboxes
        const featuredCheckbox = form.querySelector('[name="featured"]');
        if (featuredCheckbox) {
            featuredCheckbox.checked = activity.featured || false;
        }
        
        const acceptingVolunteersCheckbox = form.querySelector('[name="acceptingVolunteers"]');
        if (acceptingVolunteersCheckbox) {
            acceptingVolunteersCheckbox.checked = activity.acceptingVolunteers || false;
        }
        
        // Display existing images
        if (activity.images && activity.images.length > 0 && imagePreview) {
            activity.images.forEach((image, index) => {
                const imageDiv = document.createElement('div');
                imageDiv.className = 'image-preview-item';
                imageDiv.innerHTML = `
                    <img src="${image.url}" alt="Activity image ${index + 1}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;">
                    <button type="button" class="btn btn-sm btn-danger" onclick="removeExistingActivityImage('${image._id}', this)">Remove</button>
                    ${image.isPrimary ? '<span class="badge badge-primary">Primary</span>' : ''}
                `;
                imagePreview.appendChild(imageDiv);
            });
        }
    } else {
        // Add mode
        modalTitle.textContent = 'Add New Activity';
        form.removeAttribute('data-activity-id');
    }
    
    // Show modal
    modal.classList.add('show');
    modal.style.display = 'flex';
}

/**
 * Edit an activity
 * @param {string} activityId - The ID of the activity to edit
 */
async function editActivity(activityId) {
    try {
        const response = await apiCall(`/api/activities/${activityId}`);
        const activity = response.data || response;
        showActivityModal(activity);
    } catch (error) {
        console.error('Error loading activity:', error);
        showNotification('Failed to load activity data', 'error');
    }
}

/**
 * Delete an activity
 * @param {string} activityId - The ID of the activity to delete
 */
async function deleteActivity(activityId) {
    if (!confirm('Are you sure you want to delete this activity?')) return;
    
    try {
        await apiCall(`/api/activities/${activityId}`, {
            method: 'DELETE'
        });
        
        loadActivities();
        showNotification('Activity deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting activity:', error);
        showNotification('Failed to delete activity', 'error');
    }
}

/**
 * Filter activities based on search query
 * @param {string} query - The search query
 */
function filterActivities(query) {
    query = query.toLowerCase();
    const activityRows = document.querySelectorAll('#activitiesTableBody tr');
    
    activityRows.forEach(row => {
        if (row.cells && row.cells.length > 1) {
            const title = row.cells[0].textContent.toLowerCase();
            const category = row.cells[1].textContent.toLowerCase();
            const location = row.cells[3].textContent.toLowerCase();
            
            if (title.includes(query) || category.includes(query) || location.includes(query)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

// ===== INITIATIVES MANAGEMENT =====

/**
 * Initialize initiatives management functionality
 */
function initInitiativesManagement() {
    // Load initiatives data
    loadInitiatives();
    
    // Add event listener for add initiative button
    const addInitiativeBtn = document.getElementById('add-initiative-btn');
    if (addInitiativeBtn) {
        addInitiativeBtn.addEventListener('click', function() {
            showInitiativeModal();
        });
    }
    
    // Add event listener for initiative search
    const initiativeSearch = document.getElementById('initiativesSearch');
    if (initiativeSearch) {
        initiativeSearch.addEventListener('input', function() {
            filterInitiatives(this.value);
        });
    }
}

/**
 * Load initiatives data and populate the initiatives table
 */
async function loadInitiatives() {
    try {
        const response = await apiCall('/api/initiatives');
        const initiatives = response.data || [];
        populateInitiativesTable(initiatives);
    } catch (error) {
        console.error('Error loading initiatives:', error);
        populateInitiativesTable([]);
    }
}

/**
 * Populate initiatives table with data
 * @param {Array} initiatives - Array of initiative objects
 */
function populateInitiativesTable(initiatives) {
    const initiativesTableBody = document.getElementById('initiatives-tbody');
    if (!initiativesTableBody) return;
    
    if (initiatives.length === 0) {
        initiativesTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-tertiary);">No initiatives found</td></tr>';
    } else {
        initiativesTableBody.innerHTML = initiatives.map(initiative => `
            <tr>
                <td style="padding: 1rem;">${initiative.title}</td>
                <td style="padding: 1rem;">${initiative.scope}</td>
                <td style="padding: 1rem;">${initiative.progress || 0}%</td>
                <td style="padding: 1rem;">${initiative.targetDate ? new Date(initiative.targetDate).toLocaleDateString() : 'N/A'}</td>
                <td style="padding: 1rem;">${initiative.supporters ? initiative.supporters.length : 0}</td>
                <td style="padding: 1rem;">
                    <span class="status-badge status-${initiative.status || 'active'}">${initiative.status || 'active'}</span>
                </td>
                <td style="padding: 1rem;">
                    <button class="btn btn-sm btn-secondary" onclick="editInitiative('${initiative._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteInitiative('${initiative._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

/**
 * Show initiative modal for adding/editing
 * @param {Object} initiative - Initiative data for editing (optional)
 */
function showInitiativeModal(initiative = null) {
    const modal = document.getElementById('initiative-modal');
    const form = document.getElementById('initiative-form');
    const modalTitle = document.getElementById('initiative-modal-title');
    
    if (!modal || !form) {
        console.error('Initiative modal elements not found');
        return;
    }
    
    // Reset form
    form.reset();
    
    // Clear existing images preview
    const imagePreview = document.getElementById('initiative-images-preview');
    if (imagePreview) {
        imagePreview.innerHTML = '';
    }
    
    if (initiative) {
        // Edit mode
        modalTitle.textContent = 'Edit Initiative';
        form.setAttribute('data-initiative-id', initiative._id);
        
        // Populate form fields
        form.querySelector('[name="title"]').value = initiative.title || '';
        form.querySelector('[name="description"]').value = initiative.description || '';
        form.querySelector('[name="bureau"]').value = initiative.bureau || '';
        form.querySelector('[name="status"]').value = initiative.status || '';
        form.querySelector('[name="teamSize"]').value = initiative.teamSize || '';
        form.querySelector('[name="goals"]').value = initiative.goals || '';
        form.querySelector('[name="achievements"]').value = initiative.achievements || '';
        
        // Handle checkboxes
        const featuredCheckbox = form.querySelector('[name="featured"]');
        if (featuredCheckbox) {
            featuredCheckbox.checked = initiative.featured || false;
        }
        
        const acceptingVolunteersCheckbox = form.querySelector('[name="acceptingVolunteers"]');
        if (acceptingVolunteersCheckbox) {
            acceptingVolunteersCheckbox.checked = initiative.acceptingVolunteers || false;
        }
        
        // Display existing images
        if (initiative.images && initiative.images.length > 0 && imagePreview) {
            initiative.images.forEach((image, index) => {
                const imageDiv = document.createElement('div');
                imageDiv.className = 'image-preview-item';
                imageDiv.innerHTML = `
                    <img src="${image.url}" alt="Initiative image ${index + 1}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;">
                    <button type="button" class="btn btn-sm btn-danger" onclick="removeExistingInitiativeImage('${image._id}', this)">Remove</button>
                    ${image.isPrimary ? '<span class="badge badge-primary">Primary</span>' : ''}
                `;
                imagePreview.appendChild(imageDiv);
            });
        }
    } else {
        // Add mode
        modalTitle.textContent = 'Add New Initiative';
        form.removeAttribute('data-initiative-id');
    }
    
    // Show modal
    modal.classList.add('show');
    modal.style.display = 'flex';
}

/**
 * Edit an initiative
 * @param {string} initiativeId - The ID of the initiative to edit
 */
async function editInitiative(initiativeId) {
    try {
        const response = await apiCall(`/api/initiatives/${initiativeId}`);
        const initiative = response.data || response;
        showInitiativeModal(initiative);
    } catch (error) {
        console.error('Error loading initiative:', error);
        showNotification('Failed to load initiative data', 'error');
    }
}

/**
 * Delete an initiative
 * @param {string} initiativeId - The ID of the initiative to delete
 */
async function deleteInitiative(initiativeId) {
    if (!confirm('Are you sure you want to delete this initiative?')) return;
    
    try {
        await apiCall(`/api/initiatives/${initiativeId}`, {
            method: 'DELETE'
        });
        
        loadInitiatives();
        showNotification('Initiative deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting initiative:', error);
        showNotification('Failed to delete initiative', 'error');
    }
}

/**
 * Filter initiatives based on search query
 * @param {string} query - The search query
 */
function filterInitiatives(query) {
    query = query.toLowerCase();
    const initiativeRows = document.querySelectorAll('#initiativesTableBody tr');
    
    initiativeRows.forEach(row => {
        if (row.cells && row.cells.length > 1) {
            const title = row.cells[0].textContent.toLowerCase();
            const scope = row.cells[1].textContent.toLowerCase();
            
            if (title.includes(query) || scope.includes(query)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

// ===== MODAL OPENING FUNCTIONS =====

/**
 * Open project modal for adding new project
 */
function openProjectModal() {
    showProjectModal();
}

/**
 * Open activity modal for adding new activity
 */
function openActivityModal() {
    showActivityModal();
}

/**
 * Open initiative modal for adding new initiative
 */
function openInitiativeModal() {
    showInitiativeModal();
}

/**
 * Initialize file upload functionality
 */
function initFileUpload() {
    // Initialize drag and drop for file uploads
    initDragAndDrop();
    
    // Add event listeners for file input changes
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', handleFileSelect);
    });
    
    // Add event listeners for form submissions
    initFormHandlers();
}

/**
 * Initialize drag and drop functionality
 */
function initDragAndDrop() {
    const dropZones = document.querySelectorAll('.drop-zone');
    
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });
        
        zone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
        });
        
        zone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const fileInput = this.querySelector('input[type="file"]');
                if (fileInput) {
                    fileInput.files = files;
                    handleFileSelect({ target: fileInput });
                }
            }
        });
    });
}

/**
 * Handle file selection
 * @param {Event} event - The file input change event
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const inputName = event.target.name;
    const formGroup = event.target.closest('.form-group');
    const previewContainer = formGroup ? formGroup.querySelector('.file-preview') : null;
    
    if (previewContainer) {
        // Show file preview
        if (file.type.startsWith('image/')) {
            showImagePreview(file, previewContainer);
        } else {
            showFilePreview(file, previewContainer);
        }
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
        showNotification('File size must be less than 10MB', 'error');
        event.target.value = '';
        return;
    }
    
    // Validate file type based on input name
    if (!validateFileType(file, inputName)) {
        showNotification('Invalid file type', 'error');
        event.target.value = '';
        return;
    }
}

/**
 * Show image preview
 * @param {File} file - The image file
 * @param {Element} container - The preview container
 */
function showImagePreview(file, container) {
    const reader = new FileReader();
    reader.onload = function(e) {
        container.innerHTML = `
            <div class="image-preview">
                <img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px;">
                <div class="file-info">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
            </div>
        `;
    };
    reader.readAsDataURL(file);
}

/**
 * Show file preview
 * @param {File} file - The file
 * @param {Element} container - The preview container
 */
function showFilePreview(file, container) {
    const fileIcon = getFileIcon(file.type);
    container.innerHTML = `
        <div class="file-preview">
            <i class="${fileIcon}"></i>
            <div class="file-info">
                <span class="file-name">${file.name}</span>
                <span class="file-size">${formatFileSize(file.size)}</span>
            </div>
        </div>
    `;
}

/**
 * Get file icon based on file type
 * @param {string} fileType - The file MIME type
 * @returns {string} - The CSS class for the file icon
 */
function getFileIcon(fileType) {
    if (fileType.includes('pdf')) return 'fas fa-file-pdf';
    if (fileType.includes('word')) return 'fas fa-file-word';
    if (fileType.includes('excel')) return 'fas fa-file-excel';
    if (fileType.includes('powerpoint')) return 'fas fa-file-powerpoint';
    if (fileType.includes('image')) return 'fas fa-file-image';
    if (fileType.includes('video')) return 'fas fa-file-video';
    if (fileType.includes('audio')) return 'fas fa-file-audio';
    return 'fas fa-file';
}

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate file type
 * @param {File} file - The file to validate
 * @param {string} inputName - The input field name
 * @returns {boolean} - Whether the file type is valid
 */
function validateFileType(file, inputName) {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const documentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const ebookTypes = ['application/pdf', 'application/epub+zip'];
    
    switch (inputName) {
        case 'logo':
        case 'favicon':
        case 'thumbnail':
        case 'image':
            return imageTypes.includes(file.type);
        case 'file':
        case 'document':
            return [...documentTypes, ...ebookTypes].includes(file.type);
        case 'ebookFile':
            return ebookTypes.includes(file.type);
        default:
            return true;
    }
}

/**
 * Initialize form handlers
 */
function initFormHandlers() {
    // Book form handler - using correct ID from HTML
    const bookForm = document.getElementById('bookForm');
    if (bookForm) {
        bookForm.addEventListener('submit', handleBookFormSubmit);
    } else {
        console.log('Book form not found - will be created dynamically');
    }
    
    // Ebook form handler - using correct ID from HTML
    const ebookForm = document.getElementById('ebookForm');
    if (ebookForm) {
        ebookForm.addEventListener('submit', handleEbookFormSubmit);
    } else {
        console.log('Ebook form not found - will be created dynamically');
    }
    
    // Project form handler - using correct ID from HTML
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', handleProjectFormSubmit);
    } else {
        console.log('Project form not found - will be created dynamically');
    }
    
    // Website content form handler - using correct ID from HTML
    const contentForm = document.getElementById('contentForm');
    if (contentForm) {
        contentForm.addEventListener('submit', handleContentFormSubmit);
    } else {
        console.log('Content form not found - will be created dynamically');
    }
    
    // Message reply form handler - using correct ID from HTML
    const replyForm = document.getElementById('replyForm');
    if (replyForm) {
        replyForm.addEventListener('submit', handleReplyFormSubmit);
    } else {
        console.log('Reply form not found - will be created dynamically');
    }
    
    // Settings form handler - this one exists in admin.html
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleSettingsFormSubmit);
    } else {
        console.log('Settings form not found');
    }
}

// Sidebar functionality is handled by the main initSidebar function below

// Removed duplicate function definitions - actual implementations exist later in the file

// initModalHandlers is defined later in the file

/**
 * Check authentication status
 */
function checkAuthStatus() {
    console.log('=== CHECK AUTH STATUS ===');
    
    // Try to get token from multiple sources
    let token = localStorage.getItem('token');
    let user = null;
    
    // Try to get user from localStorage first
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            user = JSON.parse(userStr);
        }
    } catch (error) {
        console.error('Error parsing user from localStorage:', error);
    }
    
    // If not found, try the auth system format
    if (!token || !user) {
        console.log('Checking session storage formats...');
        
        const persistentSession = localStorage.getItem('tamil_society_session');
        
        let sessionData = null;
        
        if (persistentSession) {
            try {
                sessionData = JSON.parse(persistentSession);
                console.log('Found persistent session data');
            } catch (error) {
                console.error('Error parsing persistent session:', error);
            }
        }
        
        if (sessionData && sessionData.token) {
            token = sessionData.token;
            user = sessionData.user;
            
            // Store in the format admin panel expects for future use
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            console.log('Synchronized session data to localStorage');
        }
    }
    
    console.log('Auth Check Results:');
    console.log('- Token exists:', !!token);
    console.log('- User exists:', !!user);
    console.log('- User role:', user ? user.role : 'undefined');
    console.log('- Is admin:', user && user.role === 'admin');
    
    if (!token) {
        console.error('No authentication token found');
        window.location.href = 'login.html?redirect=admin.html';
        return false;
    }
    
    if (!user || !user.role) {
        console.error('User data missing or incomplete');
        window.location.href = 'login.html?redirect=admin.html';
        return false;
    }
    
    if (user.role !== 'admin') {
        console.error('User is not admin');
        alert('Admin access required. Please login with an admin account.');
        window.location.href = 'login.html?redirect=admin.html';
        return false;
    }
    
    console.log('✓ Authentication successful!');
    return true;
}

/**
 * Handle book form submission
 * @param {Event} event - The form submit event
 */
async function handleBookFormSubmit(event) {
    event.preventDefault();
    
    // Check authentication first
    if (!checkAuthStatus()) {
        return;
    }
    
    const form = event.target;
    const formData = new FormData(form);
    const bookId = form.getAttribute('data-book-id');
    
    // Handle file upload first if there's a cover image
    const coverImageFile = formData.get('coverImage');
    let coverImageUrl = '';
    
    if (coverImageFile && coverImageFile.size > 0) {
        try {
            // Upload the cover image first
            const uploadFormData = new FormData();
            uploadFormData.append('file', coverImageFile);
            uploadFormData.append('type', 'book-cover');
            
            const uploadResult = await apiCall('/api/upload', {
                method: 'POST',
                body: uploadFormData
            });
            
            coverImageUrl = uploadResult.fileUrl || uploadResult.url;
        } catch (uploadError) {
            console.error('Error uploading cover image:', uploadError);
            showNotification('Failed to upload cover image', 'error');
            return;
        }
    }
    
    // Convert FormData to JSON object, excluding the file
    const bookData = {};
    for (let [key, value] of formData.entries()) {
        if (key === 'coverImage') {
            // Skip the file object, we'll use the uploaded URL
            continue;
        } else if (key === 'price' || key === 'originalPrice' || key === 'discount' || key === 'rating' || key === 'stockQuantity' || key === 'pages') {
            // Convert numeric fields to numbers
            bookData[key] = value ? parseFloat(value) : (key === 'stockQuantity' ? 0 : undefined);
        } else if (key === 'featured' || key === 'bestseller' || key === 'newRelease' || key === 'inStock') {
            // Convert checkbox values to booleans
            bookData[key] = value === 'on' || value === 'true';
        } else if (key === 'publishedDate' && value) {
            // Convert date string to Date object
            bookData[key] = new Date(value);
        } else if (value && value.trim() !== '') {
            // Only include non-empty values
            bookData[key] = value.trim();
        }
    }
    
    // Set default values for boolean fields if not present
    if (!formData.has('featured')) bookData.featured = false;
    if (!formData.has('bestseller')) bookData.bestseller = false;
    if (!formData.has('newRelease')) bookData.newRelease = false;
    if (!formData.has('inStock')) bookData.inStock = false;
    
    // Add the cover image URL if we have one
    if (coverImageUrl) {
        bookData.coverImage = coverImageUrl;
    }
    
    // Debug logging
    console.log('Submitting book data:', bookData);
    console.log('Token:', localStorage.getItem('token'));
    
    try {
        const url = bookId ? `http://localhost:8080/api/books/${bookId}` : 'http://localhost:8080/api/books';
        const method = bookId ? 'PUT' : 'POST';
        
        console.log('Making request to:', url, 'with method:', method);
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(bookData)
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        const result = await response.json();
        console.log('Response data:', result);
        
        if (response.ok) {
            // Close modal
            closeModal();
            
            // Reload books table
            loadBooksData();
            
            // Show success message
            showNotification(bookId ? 'Book updated successfully' : 'Book added successfully', 'success');
            
            // Show popup notification for new book (not for updates)
            if (!bookId && window.TamilSociety && window.TamilSociety.popupNotificationManager) {
                window.TamilSociety.popupNotificationManager.showNewBookNotification({
                    title: bookData.title,
                    author: bookData.author
                });
            }
        } else {
            console.error('Server error:', result);
            throw new Error(result.error || result.message || `Server returned ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error saving book:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        showNotification(`Failed to save book: ${error.message}`, 'error');
    }
}

/**
 * Detect file format from selected file and auto-fill the format field
 * @param {HTMLInputElement} fileInput - The file input element
 */
function detectFileFormat(fileInput) {
    const file = fileInput.files[0];
    if (file) {
        const fileName = file.name.toLowerCase();
        const formatSelect = fileInput.closest('form').querySelector('select[name="fileFormat"]');
        
        if (fileName.endsWith('.pdf')) {
            formatSelect.value = 'PDF';
        } else if (fileName.endsWith('.epub')) {
            formatSelect.value = 'EPUB';
        } else if (fileName.endsWith('.mobi')) {
            formatSelect.value = 'MOBI';
        } else if (fileName.endsWith('.txt')) {
            formatSelect.value = 'TXT';
        }
    }
}

/**
 * Handle ebook form submission
 * @param {Event} event - The form submit event
 */
async function handleEbookFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const ebookId = form.getAttribute('data-ebook-id');
    
    // First, create or update the ebook to get an ID for file uploads
    let currentEbookId = ebookId;
    
    if (!currentEbookId) {
        // Create a basic ebook first to get an ID for file uploads
        const basicEbookData = {
            title: formData.get('title') || 'Untitled',
            author: formData.get('author') || 'Unknown Author',
            category: formData.get('category') || 'General',
            description: formData.get('description') || '',
            isFree: true
        };
        
        try {
            const response = await fetch('http://localhost:8080/api/ebooks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(basicEbookData)
            });
            
            const result = await response.json();
            if (response.ok) {
                currentEbookId = result.data._id;
            } else {
                throw new Error(result.error || 'Failed to create ebook');
            }
        } catch (error) {
            console.error('Error creating ebook:', error);
            showNotification('Failed to create ebook', 'error');
            return;
        }
    }
    
    // Handle cover image upload using specific endpoint
    const coverImageFile = formData.get('coverImage');
    let coverImageUrl = '';
    
    if (coverImageFile && coverImageFile.size > 0) {
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('coverImage', coverImageFile);
            
            const uploadResult = await apiCall(`/api/ebooks/${currentEbookId}/upload-cover`, {
                method: 'POST',
                body: uploadFormData
            });
            
            coverImageUrl = uploadResult.data.coverImage;
        } catch (uploadError) {
            console.error('Error uploading cover image:', uploadError);
            showNotification('Failed to upload cover image', 'error');
            return;
        }
    }
    
    // Handle ebook file upload using specific endpoint
    const ebookFile = formData.get('ebookFile');
    let ebookFileUrl = '';
    
    if (ebookFile && ebookFile.size > 0) {
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('ebookFile', ebookFile);
            
            const uploadResult = await apiCall(`/api/ebooks/${currentEbookId}/upload-file`, {
                method: 'POST',
                body: uploadFormData
            });
            
            ebookFileUrl = uploadResult.data.fileUrl;
        } catch (uploadError) {
            console.error('Error uploading ebook file:', uploadError);
            showNotification('Failed to upload ebook file', 'error');
            return;
        }
    }
    
    // Convert FormData to JSON object, excluding the files
    const ebookData = {};
    for (let [key, value] of formData.entries()) {
        if (key === 'coverImage' || key === 'ebookFile') {
            // Skip the file objects, we'll use the uploaded URLs
            continue;
        } else if (key === 'rating' || key === 'downloads' || key === 'pages') {
            ebookData[key] = parseFloat(value) || 0;
        } else if (key === 'featured' || key === 'bestseller' || key === 'isFree') {
            ebookData[key] = value === 'on' || value === 'true';
        } else if (key === 'titleTamil' || key === 'authorTamil' || key === 'descriptionTamil') {
            // Handle Tamil fields
            ebookData[key] = value || '';
        } else if (key === 'bookLanguage') {
            ebookData[key] = value || 'Tamil';
        } else {
            ebookData[key] = value;
        }
    }
    
    // Add the uploaded file URLs if we have them
    if (coverImageUrl) {
        ebookData.coverImage = coverImageUrl;
    }
    if (ebookFileUrl) {
        ebookData.fileUrl = ebookFileUrl;
    }
    
    // Ensure all ebooks are free
    ebookData.isFree = true;
    
    try {
        const url = ebookId ? `http://localhost:8080/api/ebooks/${ebookId}` : 'http://localhost:8080/api/ebooks';
        const method = ebookId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(ebookData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Close modal
            closeModal();
            
            // Reload ebooks table
            loadEbooks();
            
            // Show success message
            showNotification(ebookId ? 'E-book updated successfully' : 'E-book added successfully', 'success');
            
            // Show popup notification for new ebook (not for updates)
            if (!ebookId && window.TamilSociety && window.TamilSociety.popupNotificationManager) {
                window.TamilSociety.popupNotificationManager.showNewEbookNotification({
                    title: ebookData.title
                });
            }
        } else {
            throw new Error(result.error || 'Failed to save e-book');
        }
    } catch (error) {
        console.error('Error saving ebook:', error);
        showNotification(`Failed to save e-book: ${error.message}`, 'error');
    }
}

/**
 * Handle project form submission
 * @param {Event} event - The form submit event
 */
async function handleProjectFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const projectId = form.getAttribute('data-project-id');
    
    // Convert FormData to JSON object
    const projectData = {};
    for (let [key, value] of formData.entries()) {
        if (key === 'participants') {
            projectData[key] = parseInt(value) || 0;
        } else if (key === 'featured' || key === 'needsVolunteers') {
            projectData[key] = value === 'on' || value === 'true';
        } else if (key === 'progress') {
            projectData[key] = parseInt(value) || 0;
        } else if (key === 'budgetTotal') {
            // Handle budget structure
            projectData.budget = {
                total: parseFloat(value) || 0,
                spent: 0,
                currency: 'RM'
            };
        } else if (key === 'titleTamil' || key === 'descriptionTamil') {
            // Handle Tamil fields - ensure they're included even if empty
            projectData[key] = value || '';
        } else if (key !== 'image') {
            // Skip file inputs, handle them separately
            projectData[key] = value;
        }
    }
    
    try {
        const url = projectId ? `http://localhost:8080/api/projects/${projectId}` : 'http://localhost:8080/api/projects';
        const method = projectId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(projectData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Close modal
            closeModal();
            
            // Reload projects table
            loadProjects();
            
            // Show success message
            showNotification(projectId ? 'Project updated successfully' : 'Project added successfully', 'success');
            
            // Show popup notification for new project (not for updates)
            if (!projectId && window.TamilSociety && window.TamilSociety.popupNotificationManager) {
                window.TamilSociety.popupNotificationManager.showNewProjectNotification({
                    title: projectData.title
                });
            }
        } else {
            throw new Error(result.error || 'Failed to save project');
        }
    } catch (error) {
        console.error('Error saving project:', error);
        showNotification(`Failed to save project: ${error.message}`, 'error');
    }
}

/**
 * Handle content form submission
 * @param {Event} event - The form submit event
 */
async function handleContentFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        await apiCall('/api/content', {
            method: 'PUT',
            body: formData
        });
        
        // Show success message
        showNotification('Website content updated successfully', 'success');
    } catch (error) {
        console.error('Error updating content:', error);
        showNotification('Failed to update content', 'error');
    }
}

/**
 * Handle reply form submission
 * @param {Event} event - The form submit event
 */
async function handleReplyFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const messageId = form.getAttribute('data-message-id');
    
    try {
        await apiCall(`/api/messages/${messageId}/reply`, {
            method: 'POST',
            body: formData
        });
        
        // Close modal
        closeModal();
        
        // Contact messages functionality removed
        // loadContactMessages();
        
        // Show success message
        showNotification('Reply sent successfully', 'success');
    } catch (error) {
        console.error('Error sending reply:', error);
        showNotification('Failed to send reply', 'error');
    }
}

/**
 * Upload file to server
 * @param {File} file - The file to upload
 * @param {string} type - The type of file (logo, image, document, etc.)
 * @returns {Promise<string>} - The uploaded file URL
 */
async function uploadFile(file, type = 'general') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    try {
        const result = await apiCall('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        return result.fileUrl;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

// Duplicate initModalHandlers function removed - using the main one later in the file

// Duplicate checkAdminAccess function removed - using the main one at line 875

/**
 * Update the admin UI with user information
 * @param {Object} user - The current admin user
 */
function updateAdminUI(user) {
    // Set admin name in the header
    const adminNameElement = document.getElementById('admin-name');
    if (adminNameElement) {
        adminNameElement.textContent = user.name || 'Admin';
    }
    
    // Set admin avatar (initials or image)
    const adminAvatarElement = document.getElementById('admin-avatar');
    if (adminAvatarElement) {
        if (user.profileImage) {
            // If user has a profile image, use it
            adminAvatarElement.innerHTML = `<img src="${user.profileImage}" alt="${user.name}" class="avatar-img">`;
        } else {
            // Otherwise, use initials
            const initials = getInitials(user.name || 'Admin User');
            adminAvatarElement.textContent = initials;
        }
    }
}

/**
 * Initialize sidebar navigation functionality
 */
function initSidebar() {
    console.log('Initializing sidebar...');
    
    // Ensure sidebar is visible (in case modal-sidebar-manager hid it)
    const sidebar = document.querySelector('.admin-sidebar') || document.getElementById('adminSidebar');
    if (sidebar) {
        sidebar.classList.remove('sidebar-hidden');
        sidebar.classList.add('sidebar-visible');
        sidebar.style.display = 'block';
        sidebar.style.visibility = 'visible';
        sidebar.style.opacity = '1';
        console.log('✅ Admin sidebar visibility ensured');
        
        // If modal-sidebar-manager exists, update its state
        if (window.modalSidebarManager && window.modalSidebarManager.sidebars) {
            const sidebarId = sidebar.id || 'adminSidebar';
            const sidebarData = window.modalSidebarManager.sidebars.get(sidebarId);
            if (sidebarData) {
                sidebarData.isVisible = true;
                console.log('✅ Updated modal-sidebar-manager state for admin sidebar');
            }
        }
    }
    
    // Get all sidebar navigation items
    const sidebarLinks = document.querySelectorAll('.nav-item[data-section]');
    console.log('Found sidebar links:', sidebarLinks.length);
    
    // Get all admin sections
    const adminSections = document.querySelectorAll('.admin-section');
    console.log('Found admin sections:', adminSections.length);
    
    if (sidebarLinks.length === 0) {
        console.error('No sidebar navigation items found! Check HTML structure.');
        return;
    }
    
    if (adminSections.length === 0) {
        console.error('No admin sections found! Check HTML structure.');
        return;
    }
    
    // Add click event listeners to sidebar links
    sidebarLinks.forEach((link, index) => {
        const sectionId = link.getAttribute('data-section');
        console.log(`Setting up link ${index}: ${sectionId}`);
        
        link.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Sidebar link clicked:', sectionId);
            
            // Get the target section id
            const targetId = this.getAttribute('data-section');
            
            // Use the centralized showSection function to ensure consistent behavior
            try {
                await showSection(targetId);
                console.log('Successfully showed section:', targetId);
            } catch (error) {
                console.error('Error showing section:', targetId, error);
            }
        });
    });
    
    // Debug: Log all sections and navigation items
    console.log('=== DEBUGGING ADMIN PANEL VISIBILITY ===');
    console.log('All admin sections found:');
    adminSections.forEach((section, index) => {
        console.log(`${index + 1}. Section ID: ${section.id}, Classes: ${section.className}, Display: ${getComputedStyle(section).display}`);
    });
    
    console.log('All navigation items found:');
    sidebarLinks.forEach((link, index) => {
        const sectionId = link.getAttribute('data-section');
        console.log(`${index + 1}. Nav item: ${link.textContent.trim()}, Section: ${sectionId}`);
    });
    
    // Set dashboard as active by default
    setTimeout(async () => {
        try {
            console.log('Setting dashboard as default active section');
            await showSection('dashboard');
        } catch (error) {
            console.error('Error showing dashboard:', error);
            // Fallback: show first available section
            if (sidebarLinks.length > 0) {
                const firstSectionId = sidebarLinks[0].getAttribute('data-section');
                console.log('Using first available section as fallback:', firstSectionId);
                try {
                    await showSection(firstSectionId);
                } catch (fallbackError) {
                    console.error('Fallback section also failed:', fallbackError);
                }
            }
        }
    }, 100);
    
    // Enhanced mobile sidebar toggle with fallback
    function setupMobileSidebarToggle(retryCount = 0) {
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.querySelector('.admin-sidebar');
        
        console.log('Mobile sidebar setup attempt ' + (retryCount + 1) + ':', {
            mobileMenuToggle: !!mobileMenuToggle,
            sidebar: !!sidebar,
            documentReady: document.readyState
        });
        
        if (mobileMenuToggle && sidebar) {
            console.log('✅ Setting up mobile menu toggle');
            mobileMenuToggle.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Mobile menu toggle clicked');
                sidebar.classList.toggle('sidebar-mobile-open');
            });
        } else if (retryCount < 5) {
            console.log('Mobile menu elements not ready, retrying in 200ms...');
            setTimeout(() => setupMobileSidebarToggle(retryCount + 1), 200);
        } else {
            console.warn('Mobile menu toggle or sidebar not found after retries, creating fallback...');
            createFallbackMobileToggle();
        }
    }
    
    function createFallbackMobileToggle() {
        const sidebar = document.querySelector('.admin-sidebar') || document.getElementById('adminSidebar');
        if (!sidebar) {
            console.warn('No sidebar found for mobile toggle fallback');
            return;
        }
        
        // Create fallback mobile toggle if it doesn't exist
        let mobileToggle = document.getElementById('mobileMenuToggle');
        if (!mobileToggle) {
            mobileToggle = document.createElement('button');
            mobileToggle.id = 'mobileMenuToggle';
            mobileToggle.className = 'mobile-menu-toggle';
            mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
            mobileToggle.style.cssText = `
                position: fixed;
                top: 1rem;
                left: 1rem;
                z-index: 9999;
                background: var(--primary-blue, #3b82f6);
                color: white;
                border: none;
                border-radius: 0.5rem;
                padding: 0.75rem;
                cursor: pointer;
                box-shadow: var(--shadow-lg, 0 10px 25px rgba(0, 0, 0, 0.15));
                display: none;
            `;
            
            // Show on mobile screens
            const mediaQuery = window.matchMedia('(max-width: 768px)');
            function handleMediaQuery(e) {
                mobileToggle.style.display = e.matches ? 'block' : 'none';
            }
            mediaQuery.addListener(handleMediaQuery);
            handleMediaQuery(mediaQuery);
            
            mobileToggle.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Fallback mobile menu toggle clicked');
                sidebar.classList.toggle('sidebar-mobile-open');
            });
            
            document.body.appendChild(mobileToggle);
            console.log('✅ Created fallback mobile menu toggle');
        }
        
        // Ensure toggle functionality works
        mobileToggle.addEventListener('click', function(e) {
            e.preventDefault();
            sidebar.classList.toggle('sidebar-mobile-open');
        });
    }
    
    setupMobileSidebarToggle();
    
    // Add logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Logout clicked');
            handleLogout();
        });
    }
    
    console.log('Sidebar initialization completed');
}

/**
 * Handle admin logout
 */
async function handleLogout() {
    try {
        console.log('Handling admin logout...');
        
        // Call logout API
        const response = await apiCall('/api/auth/logout', {
            method: 'POST'
        });
        
        if (response.success) {
            console.log('Logout successful');
        }
    } catch (error) {
        console.error('Logout API error:', error);
    } finally {
        // Clear all session data regardless of API response
        localStorage.removeItem('tamil_society_session');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Clear cookies
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        console.log('Session data cleared, redirecting to login...');
        
        // Redirect to login page
        window.location.href = 'login.html';
    }
}

/**
 * Initialize modal handlers
 */
function initModalHandlers() {
    console.log('Initializing modal handlers...');
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
    
    // Add event listeners for all modal close buttons
    const closeButtons = document.querySelectorAll('.modal-close, .btn-cancel');
    closeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal();
        });
    });
    
    console.log('Modal handlers initialized');
}

// openModal function is defined later in the file

// closeModal function is defined later in the file

/**
 * Get modal title based on type and action
 */
function getModalTitle(type, id) {
    const isEdit = id !== null;
    const action = isEdit ? 'Edit' : 'Add';
    
    switch (type) {
        case 'book':
            return `${action} Book`;
        case 'ebook':
            return `${action} E-book`;
        case 'project':
            return `${action} Project`;
        case 'activity':
            return `${action} Activity`;
        case 'initiative':
            return `${action} Initiative`;
        case 'team':
            return `${action} Team Member`;
        case 'user':
            return `${action} User`;
        case 'announcement':
            return `${action} Announcement`;
        default:
            return `${action} Item`;
    }
}

/**
 * Load modal content based on type
 */
async function loadModalContent(type, id = null) {
    const modalBody = document.querySelector('.modal-body');
    if (!modalBody) return;
    
    try {
        let content = '';
        
        switch (type) {
            case 'book':
                content = await getBookModalContent(id);
                break;
            case 'ebook':
                content = await getEbookModalContent(id);
                break;
            case 'project':
                content = await getProjectModalContent(id);
                break;
            case 'activity':
                content = await getActivityModalContent(id);
                break;
            case 'initiative':
                content = await getInitiativeModalContent(id);
                break;
            case 'team':
                content = await getTeamModalContent(id);
                break;
            case 'user':
                content = await getUserModalContent(id);
                break;
            case 'announcement':
                content = await getAnnouncementModalContent(id);
                break;
            default:
                content = '<p>Modal content not available</p>';
        }
        
        modalBody.innerHTML = content;
        
        // Initialize form handlers for the modal
        initModalFormHandlers(type, id);
        
    } catch (error) {
        console.error('Error loading modal content:', error);
        modalBody.innerHTML = '<p>Error loading content. Please try again.</p>';
    }
}

/**
 * Initialize form handlers for modal forms
 */
function initModalFormHandlers(type, id) {
    const form = document.querySelector('.modal-body form');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(form);
            const result = await saveModalData(type, id, formData);
            
            if (result.success) {
                showNotification(`${type} saved successfully!`, 'success');
                closeModal();
                
                // Refresh the relevant section
                await loadSectionData(getCurrentSection());
            } else {
                showNotification(result.message || 'Failed to save', 'error');
            }
        } catch (error) {
            console.error('Error saving modal data:', error);
            showNotification('Error saving data. Please try again.', 'error');
        }
    });
}

/**
 * Save modal data via API
 */
async function saveModalData(type, id, formData) {
    const isEdit = id !== null;
    const method = isEdit ? 'PUT' : 'POST';
    const endpoint = isEdit ? `/api/${type}s/${id}` : `/api/${type}s`;
    
    try {
        const response = await apiCall(endpoint, {
            method: method,
            body: formData
        });
        
        return { success: true, data: response };
    } catch (error) {
        console.error('API save error:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Get current active section
 */
function getCurrentSection() {
    const activeSection = document.querySelector('.admin-section.active');
    return activeSection ? activeSection.id : 'dashboard';
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    // Use the existing notification system if available
    if (window.TamilSociety && window.TamilSociety.showNotification) {
        window.TamilSociety.showNotification(message, type);
    } else {
        // Fallback to alert
        alert(message);
    }
}

/**
 * Get book modal content
 */
async function getBookModalContent(id = null) {
    let book = null;
    
    if (id) {
        try {
            book = await apiCall(`/api/books/${id}`);
        } catch (error) {
            console.error('Error fetching book:', error);
        }
    }
    
    const isEdit = !!book;
    const title = book?.title || 'New Book';
    const author = book?.author || 'Author Name';
    const price = book?.price ? `RM${book.price}` : 'RM0.00';
    
    return `
        <div class="modal-product-card">
            <div class="modal-product-image">
                <i class="fas fa-book"></i>
            </div>
            <h3 class="modal-product-title">${title}</h3>
            <p class="modal-product-author">by ${author}</p>
            <p class="modal-product-price">${price}</p>
        </div>
        
        <form id="bookForm" class="modern-form" enctype="multipart/form-data">
            <div class="modern-form-group">
                <label class="modern-form-label required">Title (English)</label>
                <input type="text" class="modern-form-input" id="title" name="title" placeholder="Enter book title" value="${book?.title || ''}" required>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Tamil Title</label>
                <input type="text" class="modern-form-input" id="titleTamil" name="titleTamil" placeholder="Enter Tamil title" value="${book?.titleTamil || ''}" style="font-family: 'Noto Sans Tamil', sans-serif;">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label required">Author (English)</label>
                <input type="text" class="modern-form-input" id="author" name="author" placeholder="Enter author name" value="${book?.author || ''}" required>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Tamil Author</label>
                <input type="text" class="modern-form-input" id="authorTamil" name="authorTamil" placeholder="Enter Tamil author name" value="${book?.authorTamil || ''}" style="font-family: 'Noto Sans Tamil', sans-serif;">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label required">Category</label>
                <select class="modern-form-select" id="category" name="category" required>
                    <option value="">Select Category</option>
                    <option value="poetry" ${book?.category === 'poetry' ? 'selected' : ''}>Poetry</option>
                    <option value="literature" ${book?.category === 'literature' ? 'selected' : ''}>Literature</option>
                    <option value="history" ${book?.category === 'history' ? 'selected' : ''}>History</option>
                    <option value="culture" ${book?.category === 'culture' ? 'selected' : ''}>Culture</option>
                    <option value="language" ${book?.category === 'language' ? 'selected' : ''}>Language</option>
                    <option value="children" ${book?.category === 'children' ? 'selected' : ''}>Children</option>
                    <option value="academic" ${book?.category === 'academic' ? 'selected' : ''}>Academic</option>
                    <option value="fiction" ${book?.category === 'fiction' ? 'selected' : ''}>Fiction</option>
                    <option value="non-fiction" ${book?.category === 'non-fiction' ? 'selected' : ''}>Non-Fiction</option>
                    <option value="biography" ${book?.category === 'biography' ? 'selected' : ''}>Biography</option>
                    <option value="education" ${book?.category === 'education' ? 'selected' : ''}>Education</option>
                    <option value="other" ${book?.category === 'other' ? 'selected' : ''}>Other</option>
                </select>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label required">Book Price (RM)</label>
                <input type="number" class="modern-form-input" id="price" name="price" placeholder="0.00" step="0.01" min="0" value="${book?.price || ''}" required>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Original Price (RM)</label>
                <input type="number" class="modern-form-input" id="originalPrice" name="originalPrice" placeholder="0.00" step="0.01" min="0" value="${book?.originalPrice || ''}">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Discount (%)</label>
                <input type="number" class="modern-form-input" id="discount" name="discount" placeholder="0" min="0" max="100" value="${book?.discount || ''}">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label required">Description (English)</label>
                <textarea class="modern-form-textarea" id="description" name="description" placeholder="Enter book description" required>${book?.description || ''}</textarea>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Tamil Description</label>
                <textarea class="modern-form-textarea" id="descriptionTamil" name="descriptionTamil" placeholder="Enter Tamil description" style="font-family: 'Noto Sans Tamil', sans-serif;">${book?.descriptionTamil || ''}</textarea>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Book Cover</label>
                <input type="file" class="modern-form-input" id="coverImage" name="coverImage" accept="image/*">
                ${book?.coverImage ? `<p class="current-file">Current: ${book.coverImage}</p>` : ''}
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">ISBN</label>
                <input type="text" class="modern-form-input" id="isbn" name="isbn" placeholder="Enter ISBN" value="${book?.isbn || ''}">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Publisher</label>
                <input type="text" class="modern-form-input" id="publisher" name="publisher" placeholder="Enter publisher name" value="${book?.publisher || ''}">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Published Date</label>
                <input type="date" class="modern-form-input" id="publishedDate" name="publishedDate" value="${book?.publishedDate ? book.publishedDate.split('T')[0] : ''}">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Pages</label>
                <input type="number" class="modern-form-input" id="pages" name="pages" placeholder="Number of pages" min="1" value="${book?.pages || ''}">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Book Language</label>
                <select class="modern-form-select" id="bookLanguage" name="bookLanguage">
                    <option value="Tamil" ${book?.bookLanguage === 'Tamil' ? 'selected' : ''}>Tamil</option>
                    <option value="English" ${book?.bookLanguage === 'English' ? 'selected' : ''}>English</option>
                    <option value="Bilingual" ${book?.bookLanguage === 'Bilingual' ? 'selected' : ''}>Bilingual</option>
                </select>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Stock Quantity</label>
                <input type="number" class="modern-form-input" id="stockQuantity" name="stockQuantity" placeholder="Available quantity" min="0" value="${book?.stockQuantity || ''}">
            </div>
            
            <div class="modern-form-group">
                <div class="modern-form-checkbox-group">
                    <label class="modern-form-checkbox">
                        <input type="checkbox" id="inStock" name="inStock" ${book?.inStock ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        In Stock
                    </label>
                    <label class="modern-form-checkbox">
                        <input type="checkbox" id="featured" name="featured" ${book?.featured ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        Featured Book
                    </label>
                    <label class="modern-form-checkbox">
                        <input type="checkbox" id="bestseller" name="bestseller" ${book?.bestseller ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        Bestseller
                    </label>
                    <label class="modern-form-checkbox">
                        <input type="checkbox" id="newRelease" name="newRelease" ${book?.newRelease ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        New Release
                    </label>
                </div>
            </div>
            
            <div class="modern-form-actions">
                <button type="button" class="modern-btn modern-btn-secondary btn-cancel">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button type="submit" class="modern-btn modern-btn-primary">
                    <i class="fas fa-save"></i> ${isEdit ? 'Update Book' : 'Save Book'}
                </button>
            </div>
        </form>
    `;
}

/**
 * Get ebook modal content
 */
async function getEbookModalContent(id = null) {
    let ebook = null;
    
    if (id) {
        try {
            ebook = await apiCall(`/api/ebooks/${id}`);
        } catch (error) {
            console.error('Error fetching ebook:', error);
        }
    }
    
    const isEdit = !!ebook;
    const title = ebook?.title || 'New E-book';
    const author = ebook?.author || 'Author Name';
    const price = 'Free'; // E-books are typically free
    
    return `
        <div class="modal-product-card">
            <div class="modal-product-image">
                <i class="fas fa-tablet-alt"></i>
            </div>
            <h3 class="modal-product-title">${title}</h3>
            <p class="modal-product-author">by ${author}</p>
            <p class="modal-product-price">${price}</p>
        </div>
        
        <form id="ebookForm" class="modern-form" enctype="multipart/form-data">
            <div class="modern-form-group">
                <label class="modern-form-label required">Title (English)</label>
                <input type="text" class="modern-form-input" id="title" name="title" placeholder="Enter e-book title" value="${ebook?.title || ''}" required>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Tamil Title</label>
                <input type="text" class="modern-form-input" id="titleTamil" name="titleTamil" placeholder="Enter Tamil title" value="${ebook?.titleTamil || ''}" style="font-family: 'Noto Sans Tamil', sans-serif;">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label required">Author (English)</label>
                <input type="text" class="modern-form-input" id="author" name="author" placeholder="Enter author name" value="${ebook?.author || ''}" required>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Tamil Author</label>
                <input type="text" class="modern-form-input" id="authorTamil" name="authorTamil" placeholder="Enter Tamil author name" value="${ebook?.authorTamil || ''}" style="font-family: 'Noto Sans Tamil', sans-serif;">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Category</label>
                <select class="modern-form-select" id="category" name="category">
                    <option value="">Select Category</option>
                    <option value="poetry" ${ebook?.category === 'poetry' ? 'selected' : ''}>Poetry</option>
                    <option value="literature" ${ebook?.category === 'literature' ? 'selected' : ''}>Literature</option>
                    <option value="history" ${ebook?.category === 'history' ? 'selected' : ''}>History</option>
                    <option value="culture" ${ebook?.category === 'culture' ? 'selected' : ''}>Culture</option>
                    <option value="language" ${ebook?.category === 'language' ? 'selected' : ''}>Language</option>
                    <option value="children" ${ebook?.category === 'children' ? 'selected' : ''}>Children</option>
                    <option value="academic" ${ebook?.category === 'academic' ? 'selected' : ''}>Academic</option>
                    <option value="fiction" ${ebook?.category === 'fiction' ? 'selected' : ''}>Fiction</option>
                    <option value="non-fiction" ${ebook?.category === 'non-fiction' ? 'selected' : ''}>Non-Fiction</option>
                    <option value="biography" ${ebook?.category === 'biography' ? 'selected' : ''}>Biography</option>
                    <option value="education" ${ebook?.category === 'education' ? 'selected' : ''}>Education</option>
                    <option value="other" ${ebook?.category === 'other' ? 'selected' : ''}>Other</option>
                </select>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Book Language</label>
                <select class="modern-form-select" id="bookLanguage" name="bookLanguage">
                    <option value="Tamil" ${ebook?.bookLanguage === 'Tamil' ? 'selected' : ''}>Tamil</option>
                    <option value="English" ${ebook?.bookLanguage === 'English' ? 'selected' : ''}>English</option>
                    <option value="Bilingual" ${ebook?.bookLanguage === 'Bilingual' ? 'selected' : ''}>Bilingual</option>
                </select>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Description (English)</label>
                <textarea class="modern-form-textarea" id="description" name="description" placeholder="Enter e-book description">${ebook?.description || ''}</textarea>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Tamil Description</label>
                <textarea class="modern-form-textarea" id="descriptionTamil" name="descriptionTamil" placeholder="Enter Tamil description" style="font-family: 'Noto Sans Tamil', sans-serif;">${ebook?.descriptionTamil || ''}</textarea>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Cover Image</label>
                <input type="file" class="modern-form-input" id="image" name="image" accept="image/*">
                ${ebook?.image ? `<p class="current-file">Current: ${ebook.image}</p>` : ''}
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">E-book File (PDF/EPUB)</label>
                <input type="file" class="modern-form-input" id="file" name="file" accept=".pdf,.epub">
                ${ebook?.file ? `<p class="current-file">Current: ${ebook.file}</p>` : ''}
            </div>
            
            <div class="modern-form-actions">
                <button type="button" class="modern-btn modern-btn-secondary btn-cancel">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button type="submit" class="modern-btn modern-btn-primary">
                    <i class="fas fa-save"></i> ${isEdit ? 'Update E-book' : 'Save E-book'}
                </button>
            </div>
        </form>
    `;
}

/**
 * Get project modal content
 */
async function getProjectModalContent(id = null) {
    let project = null;
    
    if (id) {
        try {
            project = await apiCall(`/api/projects/${id}`);
        } catch (error) {
            console.error('Error fetching project:', error);
        }
    }
    
    const isEdit = !!project;
    const title = project?.title || 'New Project';
    const category = project?.category || 'Project Category';
    const status = project?.status || 'Planning';
    
    return `
        <div class="modal-product-card">
            <div class="modal-product-image">
                <i class="fas fa-project-diagram"></i>
            </div>
            <h3 class="modal-product-title">${title}</h3>
            <p class="modal-product-author">${category}</p>
            <p class="modal-product-price">${status}</p>
        </div>
        
        <form id="projectForm" class="modern-form" enctype="multipart/form-data">
            <div class="modern-form-group">
                <label class="modern-form-label required">Title (English)</label>
                <input type="text" class="modern-form-input" id="title" name="title" placeholder="Enter project title" value="${project?.title || ''}" required>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Title (Tamil)</label>
                <input type="text" class="modern-form-input" id="titleTamil" name="titleTamil" placeholder="Enter Tamil title" value="${project?.titleTamil || ''}" 
                       style="font-family: 'Noto Sans Tamil', Arial, sans-serif; font-size: 16px;">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label required">Category</label>
                <select class="modern-form-select" id="category" name="category" required>
                    <option value="">Select Category</option>
                    <option value="media-public-relations" ${project?.category === 'media-public-relations' ? 'selected' : ''}>Media & Public Relations Bureau</option>
                    <option value="sports-leadership" ${project?.category === 'sports-leadership' ? 'selected' : ''}>Sports & Leadership Bureau</option>
                    <option value="education-intellectual" ${project?.category === 'education-intellectual' ? 'selected' : ''}>Education & Intellectual Bureau</option>
                    <option value="arts-culture" ${project?.category === 'arts-culture' ? 'selected' : ''}>Arts & Culture Bureau</option>
                    <option value="social-welfare-voluntary" ${project?.category === 'social-welfare-voluntary' ? 'selected' : ''}>Social Welfare & Voluntary Bureau</option>
                    <option value="language-literature" ${project?.category === 'language-literature' ? 'selected' : ''}>Language & Literature Bureau</option>
                </select>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Status</label>
                <select class="modern-form-select" id="status" name="status">
                    <option value="planning" ${project?.status === 'planning' ? 'selected' : ''}>Planning</option>
                    <option value="active" ${project?.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="completed" ${project?.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="on-hold" ${project?.status === 'on-hold' ? 'selected' : ''}>On Hold</option>
                    <option value="cancelled" ${project?.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Priority</label>
                <select class="modern-form-select" id="priority" name="priority">
                    <option value="low" ${project?.priority === 'low' ? 'selected' : ''}>Low</option>
                    <option value="medium" ${project?.priority === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="high" ${project?.priority === 'high' ? 'selected' : ''}>High</option>
                    <option value="urgent" ${project?.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
                </select>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label required">Description (English)</label>
                <textarea class="modern-form-textarea" id="description" name="description" placeholder="Enter project description" required>${project?.description || ''}</textarea>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Description (Tamil)</label>
                <textarea class="modern-form-textarea" id="descriptionTamil" name="descriptionTamil" placeholder="Enter Tamil description" 
                          style="font-family: 'Noto Sans Tamil', Arial, sans-serif; font-size: 16px;">${project?.descriptionTamil || ''}</textarea>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Short Description</label>
                <textarea class="modern-form-textarea" id="shortDescription" name="shortDescription" placeholder="Enter short description" maxlength="500">${project?.shortDescription || ''}</textarea>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label required">Start Date</label>
                <input type="date" class="modern-form-input" id="startDate" name="startDate" value="${project?.startDate ? new Date(project.startDate).toISOString().split('T')[0] : ''}" required>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">End Date</label>
                <input type="date" class="modern-form-input" id="endDate" name="endDate" value="${project?.endDate ? new Date(project.endDate).toISOString().split('T')[0] : ''}">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Budget Total (RM)</label>
                <input type="number" class="modern-form-input" id="budgetTotal" name="budgetTotal" placeholder="RM0.00" min="0" step="0.01" value="${project?.budget?.total || ''}">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Progress (%)</label>
                <input type="number" class="modern-form-input" id="progress" name="progress" placeholder="0" min="0" max="100" value="${project?.progress || 0}">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Location</label>
                <input type="text" class="modern-form-input" id="location" name="location" placeholder="Enter project location" value="${project?.location || ''}">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Target Audience</label>
                <textarea class="modern-form-textarea" id="targetAudience" name="targetAudience" placeholder="Enter target audience">${project?.targetAudience || ''}</textarea>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Visibility</label>
                <select class="modern-form-select" id="visibility" name="visibility">
                    <option value="public" ${project?.visibility === 'public' ? 'selected' : ''}>Public</option>
                    <option value="private" ${project?.visibility === 'private' ? 'selected' : ''}>Private</option>
                    <option value="members-only" ${project?.visibility === 'members-only' ? 'selected' : ''}>Members Only</option>
                </select>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Project Image</label>
                <input type="file" class="modern-form-input" id="image" name="image" accept="image/*">
                ${project?.image ? `<p class="current-file">Current: ${project.image}</p>` : ''}
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-checkbox">
                    <input type="checkbox" id="featured" name="featured" ${project?.featured ? 'checked' : ''}>
                    Featured Project
                </label>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-checkbox">
                    <input type="checkbox" id="needsVolunteers" name="needsVolunteers" ${project?.needsVolunteers ? 'checked' : ''}>
                    Needs Volunteers
                </label>
            </div>
            
            <div class="modern-form-actions">
                <button type="button" class="modern-btn modern-btn-secondary btn-cancel">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button type="submit" class="modern-btn modern-btn-primary">
                    <i class="fas fa-save"></i> ${isEdit ? 'Update Project' : 'Save Project'}
                </button>
            </div>
        </form>
    `;
}

/**
 * Get activity modal content
 */
async function getActivityModalContent(id = null) {
    let activity = null;
    
    if (id) {
        try {
            activity = await apiCall(`/api/activities/${id}`);
        } catch (error) {
            console.error('Error fetching activity:', error);
        }
    }
    
    const isEdit = !!activity;
    const title = activity?.title || 'New Activity';
    const category = activity?.category || 'Activity Category';
    const status = activity?.status || 'Planning';
    
    return `
        <div class="modal-product-card">
            <div class="modal-product-image">
                <i class="fas fa-calendar-alt"></i>
            </div>
            <h3 class="modal-product-title">${title}</h3>
            <p class="modal-product-author">${category}</p>
            <p class="modal-product-price">${status}</p>
        </div>
        
        <form id="activityForm" class="modern-form" enctype="multipart/form-data">
            <div class="modern-form-group">
                <label class="modern-form-label required">Title (English)</label>
                <input type="text" class="modern-form-input" id="title" name="title" placeholder="Enter activity title" value="${activity?.title || ''}" required>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Title (Tamil)</label>
                <input type="text" class="modern-form-input" id="titleTamil" name="titleTamil" placeholder="Enter Tamil title" value="${activity?.titleTamil || ''}" 
                       style="font-family: 'Noto Sans Tamil', Arial, sans-serif; font-size: 16px;">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label required">Category</label>
                <select class="modern-form-select" id="category" name="category" required>
                    <option value="">Select Category</option>
                    <option value="media-public-relations" ${activity?.category === 'media-public-relations' ? 'selected' : ''}>Media & Public Relations Bureau</option>
                    <option value="sports-leadership" ${activity?.category === 'sports-leadership' ? 'selected' : ''}>Sports & Leadership Bureau</option>
                    <option value="education-intellectual" ${activity?.category === 'education-intellectual' ? 'selected' : ''}>Education & Intellectual Bureau</option>
                    <option value="arts-culture" ${activity?.category === 'arts-culture' ? 'selected' : ''}>Arts & Culture Bureau</option>
                    <option value="social-welfare-voluntary" ${activity?.category === 'social-welfare-voluntary' ? 'selected' : ''}>Social Welfare & Voluntary Bureau</option>
                    <option value="language-literature" ${activity?.category === 'language-literature' ? 'selected' : ''}>Language & Literature Bureau</option>
                </select>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Status</label>
                <select class="modern-form-select" id="status" name="status">
                    <option value="planning" ${activity?.status === 'planning' ? 'selected' : ''}>Planning</option>
                    <option value="upcoming" ${activity?.status === 'upcoming' ? 'selected' : ''}>Upcoming</option>
                    <option value="ongoing" ${activity?.status === 'ongoing' ? 'selected' : ''}>Ongoing</option>
                    <option value="completed" ${activity?.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${activity?.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label required">Description (English)</label>
                <textarea class="modern-form-textarea" id="description" name="description" placeholder="Enter activity description" required>${activity?.description || ''}</textarea>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Description (Tamil)</label>
                <textarea class="modern-form-textarea" id="descriptionTamil" name="descriptionTamil" placeholder="Enter Tamil description" 
                          style="font-family: 'Noto Sans Tamil', Arial, sans-serif; font-size: 16px;">${activity?.descriptionTamil || ''}</textarea>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label required">Date</label>
                <input type="date" class="modern-form-input" id="date" name="date" value="${activity?.date ? new Date(activity.date).toISOString().split('T')[0] : ''}" required>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Time</label>
                <input type="time" class="modern-form-input" id="time" name="time" value="${activity?.time || ''}">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Duration (hours)</label>
                <input type="number" class="modern-form-input" id="duration" name="duration" placeholder="2" min="0.5" step="0.5" value="${activity?.duration || ''}">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Location</label>
                <input type="text" class="modern-form-input" id="location" name="location" placeholder="Enter activity location" value="${activity?.location || ''}">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Max Participants</label>
                <input type="number" class="modern-form-input" id="maxParticipants" name="maxParticipants" placeholder="50" min="1" value="${activity?.maxParticipants || ''}">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Registration Fee (RM)</label>
                <input type="number" class="modern-form-input" id="registrationFee" name="registrationFee" placeholder="RM0.00" min="0" step="0.01" value="${activity?.registrationFee || ''}">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Activity Image</label>
                <input type="file" class="modern-form-input" id="image" name="image" accept="image/*">
                ${activity?.image ? `<p class="current-file">Current: ${activity.image}</p>` : ''}
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-checkbox">
                    <input type="checkbox" id="featured" name="featured" ${activity?.featured ? 'checked' : ''}>
                    Featured Activity
                </label>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-checkbox">
                    <input type="checkbox" id="requiresRegistration" name="requiresRegistration" ${activity?.requiresRegistration ? 'checked' : ''}>
                    Requires Registration
                </label>
            </div>
            
            <div class="modern-form-actions">
                <button type="button" class="modern-btn modern-btn-secondary btn-cancel">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button type="submit" class="modern-btn modern-btn-primary">
                    <i class="fas fa-save"></i> ${isEdit ? 'Update Activity' : 'Save Activity'}
                </button>
            </div>
        </form>
    `;
}

/**
 * Get initiative modal content
 */
async function getInitiativeModalContent(id = null) {
    let initiative = null;
    
    if (id) {
        try {
            initiative = await apiCall(`/api/initiatives/${id}`);
        } catch (error) {
            console.error('Error fetching initiative:', error);
        }
    }
    
    const isEdit = !!initiative;
    const title = initiative?.title || 'New Initiative';
    const scope = initiative?.scope || 'Initiative Scope';
    const status = initiative?.status || 'Planning';
    
    return `
        <div class="modal-product-card">
            <div class="modal-product-image">
                <i class="fas fa-lightbulb"></i>
            </div>
            <h3 class="modal-product-title">${title}</h3>
            <p class="modal-product-author">${scope}</p>
            <p class="modal-product-price">${status}</p>
        </div>
        
        <form id="initiativeForm" class="modern-form" enctype="multipart/form-data">
            <div class="modern-form-group">
                <label class="modern-form-label required">Title (English)</label>
                <input type="text" class="modern-form-input" id="title" name="title" placeholder="Enter initiative title" value="${initiative?.title || ''}" required>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Title (Tamil)</label>
                <input type="text" class="modern-form-input" id="titleTamil" name="titleTamil" placeholder="Enter Tamil title" value="${initiative?.titleTamil || ''}" 
                       style="font-family: 'Noto Sans Tamil', Arial, sans-serif; font-size: 16px;">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label required">Category</label>
                <select class="modern-form-select" id="category" name="category" required>
                    <option value="">Select Category</option>
                    <option value="media-public-relations" ${initiative?.category === 'media-public-relations' ? 'selected' : ''}>Media and Public Relations</option>
                    <option value="sports-leadership" ${initiative?.category === 'sports-leadership' ? 'selected' : ''}>Sports and Leadership</option>
                    <option value="education-intellectual" ${initiative?.category === 'education-intellectual' ? 'selected' : ''}>Education and Intellectual</option>
                    <option value="arts-culture" ${initiative?.category === 'arts-culture' ? 'selected' : ''}>Arts & Culture</option>
                    <option value="social-welfare-voluntary" ${initiative?.category === 'social-welfare-voluntary' ? 'selected' : ''}>Social Welfare & Voluntary</option>
                    <option value="language-literature" ${initiative?.category === 'language-literature' ? 'selected' : ''}>Language and Literature</option>
                </select>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label required">Scope</label>
                <select class="modern-form-select" id="scope" name="scope" required>
                    <option value="">Select Scope</option>
                    <option value="local" ${initiative?.scope === 'local' ? 'selected' : ''}>Local</option>
                    <option value="regional" ${initiative?.scope === 'regional' ? 'selected' : ''}>Regional</option>
                    <option value="national" ${initiative?.scope === 'national' ? 'selected' : ''}>National</option>
                    <option value="international" ${initiative?.scope === 'international' ? 'selected' : ''}>International</option>
                    <option value="online" ${initiative?.scope === 'online' ? 'selected' : ''}>Online</option>
                </select>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Status</label>
                <select class="modern-form-select" id="status" name="status">
                    <option value="planning" ${initiative?.status === 'planning' ? 'selected' : ''}>Planning</option>
                    <option value="proposal" ${initiative?.status === 'proposal' ? 'selected' : ''}>Proposal</option>
                    <option value="approved" ${initiative?.status === 'approved' ? 'selected' : ''}>Approved</option>
                    <option value="active" ${initiative?.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="completed" ${initiative?.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="on-hold" ${initiative?.status === 'on-hold' ? 'selected' : ''}>On Hold</option>
                    <option value="cancelled" ${initiative?.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Priority</label>
                <select class="modern-form-select" id="priority" name="priority">
                    <option value="low" ${initiative?.priority === 'low' ? 'selected' : ''}>Low</option>
                    <option value="medium" ${initiative?.priority === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="high" ${initiative?.priority === 'high' ? 'selected' : ''}>High</option>
                    <option value="critical" ${initiative?.priority === 'critical' ? 'selected' : ''}>Critical</option>
                </select>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label required">Description (English)</label>
                <textarea class="modern-form-textarea" id="description" name="description" placeholder="Enter initiative description" required>${initiative?.description || ''}</textarea>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Description (Tamil)</label>
                <textarea class="modern-form-textarea" id="descriptionTamil" name="descriptionTamil" placeholder="Enter Tamil description" 
                          style="font-family: 'Noto Sans Tamil', Arial, sans-serif; font-size: 16px;">${initiative?.descriptionTamil || ''}</textarea>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Goals & Objectives</label>
                <textarea class="modern-form-textarea" id="goals" name="goals" placeholder="Enter goals and objectives">${initiative?.goals || ''}</textarea>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Expected Outcomes</label>
                <textarea class="modern-form-textarea" id="expectedOutcomes" name="expectedOutcomes" placeholder="Enter expected outcomes">${initiative?.expectedOutcomes || ''}</textarea>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Start Date</label>
                <input type="date" class="modern-form-input" id="startDate" name="startDate" value="${initiative?.startDate ? new Date(initiative.startDate).toISOString().split('T')[0] : ''}">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Target Completion Date</label>
                <input type="date" class="modern-form-input" id="targetDate" name="targetDate" value="${initiative?.targetDate ? new Date(initiative.targetDate).toISOString().split('T')[0] : ''}">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Budget Estimate (RM)</label>
                <input type="number" class="modern-form-input" id="budgetEstimate" name="budgetEstimate" placeholder="RM0.00" min="0" step="0.01" value="${initiative?.budgetEstimate || ''}">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Target Beneficiaries</label>
                <input type="text" class="modern-form-input" id="targetBeneficiaries" name="targetBeneficiaries" placeholder="Enter target beneficiaries" value="${initiative?.targetBeneficiaries || ''}">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Initiative Image</label>
                <input type="file" class="modern-form-input" id="image" name="image" accept="image/*">
                ${initiative?.image ? `<p class="current-file">Current: ${initiative.image}</p>` : ''}
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-checkbox">
                    <input type="checkbox" id="featured" name="featured" ${initiative?.featured ? 'checked' : ''}>
                    Featured Initiative
                </label>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-checkbox">
                    <input type="checkbox" id="seekingPartners" name="seekingPartners" ${initiative?.seekingPartners ? 'checked' : ''}>
                    Seeking Partners/Collaborators
                </label>
            </div>
            
            <div class="modern-form-actions">
                <button type="button" class="modern-btn modern-btn-secondary btn-cancel">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button type="submit" class="modern-btn modern-btn-primary">
                    <i class="fas fa-save"></i> ${isEdit ? 'Update Initiative' : 'Save Initiative'}
                </button>
            </div>
        </form>
    `;
}

/**
 * Get team modal content
 */
async function getTeamModalContent(id = null) {
    let member = null;
    
    if (id) {
        try {
            member = await apiCall(`/api/team/${id}`);
        } catch (error) {
            console.error('Error fetching team member:', error);
        }
    }
    
    const isEdit = !!member;
    const name = member?.name || 'New Team Member';
    const position = member?.position || 'Position';
    
    return `
        <div class="modal-product-card">
            <div class="modal-product-image">
                <i class="fas fa-user"></i>
            </div>
            <h3 class="modal-product-title">${name}</h3>
            <p class="modal-product-author">${position}</p>
            <p class="modal-product-price">Team Member</p>
        </div>
        
        <form id="teamForm" class="modern-form" enctype="multipart/form-data">
            <div class="modern-form-group">
                <label class="modern-form-label required">Name</label>
                <input type="text" class="modern-form-input" id="name" name="name" placeholder="Enter full name" value="${member?.name || ''}" required>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label required">Position</label>
                <input type="text" class="modern-form-input" id="position" name="position" placeholder="Enter position/role" value="${member?.position || ''}" required>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Bio</label>
                <textarea class="modern-form-textarea" id="bio" name="bio" placeholder="Enter bio/description" rows="4">${member?.bio || ''}</textarea>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Email</label>
                <input type="email" class="modern-form-input" id="email" name="email" placeholder="Enter email address" value="${member?.email || ''}">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Phone</label>
                <input type="tel" class="modern-form-input" id="phone" name="phone" placeholder="Enter phone number" value="${member?.phone || ''}">
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Profile Image</label>
                <input type="file" class="modern-form-input" id="image" name="image" accept="image/*">
                ${member?.image ? `<p class="current-file">Current: ${member.image}</p>` : ''}
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Display Order</label>
                <input type="number" class="modern-form-input" id="order" name="order" placeholder="0" value="${member?.order || 0}">
            </div>
            
            <div class="modern-form-actions">
                <button type="button" class="modern-btn modern-btn-secondary btn-cancel">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button type="submit" class="modern-btn modern-btn-primary">
                    <i class="fas fa-save"></i> ${isEdit ? 'Update Member' : 'Save Member'}
                </button>
            </div>
        </form>
    `;
}

/**
 * Get user modal content
 */
async function getUserModalContent(id = null) {
    let user = null;
    
    if (id) {
        try {
            user = await apiCall(`/api/users/${id}`);
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    }
    
    const isEdit = !!user;
    const name = user?.name || 'New User';
    const role = user?.role || 'User';
    const status = user?.isActive !== false ? 'Active' : 'Inactive';
    
    return `
        <div class="modal-product-card">
            <div class="modal-product-image">
                <i class="fas fa-user-circle"></i>
            </div>
            <h3 class="modal-product-title">${name}</h3>
            <p class="modal-product-author">${role}</p>
            <p class="modal-product-price">${status}</p>
        </div>
        
        <form id="userForm" class="modern-form">
            <div class="modern-form-group">
                <label class="modern-form-label required">Name</label>
                <input type="text" class="modern-form-input" id="name" name="name" placeholder="Enter full name" value="${user?.name || ''}" required>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label required">Email</label>
                <input type="email" class="modern-form-input" id="email" name="email" placeholder="Enter email address" value="${user?.email || ''}" required>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Role</label>
                <select class="modern-form-select" id="role" name="role">
                    <option value="user" ${user?.role === 'user' ? 'selected' : ''}>User</option>
                    <option value="admin" ${user?.role === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
            </div>
            
            ${!id ? `
            <div class="modern-form-group">
                <label class="modern-form-label required">Password</label>
                <input type="password" class="modern-form-input" id="password" name="password" placeholder="Enter password" required>
            </div>
            ` : ''}
            
            <div class="modern-form-group">
                <label class="modern-form-label">Status</label>
                <select class="modern-form-select" id="isActive" name="isActive">
                    <option value="true" ${user?.isActive !== false ? 'selected' : ''}>Active</option>
                    <option value="false" ${user?.isActive === false ? 'selected' : ''}>Inactive</option>
                </select>
            </div>
            
            <div class="modern-form-actions">
                <button type="button" class="modern-btn modern-btn-secondary btn-cancel">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button type="submit" class="modern-btn modern-btn-primary">
                    <i class="fas fa-save"></i> ${isEdit ? 'Update User' : 'Save User'}
                </button>
            </div>
        </form>
    `;
}

/**
 * Get announcement modal content
 */
async function getAnnouncementModalContent(id = null) {
    let announcement = null;
    
    if (id) {
        try {
            announcement = await apiCall(`/api/announcements/${id}`);
        } catch (error) {
            console.error('Error fetching announcement:', error);
        }
    }
    
    const isEdit = !!announcement;
    const title = announcement?.title || 'New Announcement';
    const type = announcement?.type || 'Info';
    const priority = announcement?.priority || 'Medium';
    const status = announcement?.isActive !== false ? 'Active' : 'Inactive';
    
    return `
        <div class="modal-product-card">
            <div class="modal-product-image">
                <i class="fas fa-bullhorn"></i>
            </div>
            <h3 class="modal-product-title">${title}</h3>
            <p class="modal-product-author">${type} - ${priority} Priority</p>
            <p class="modal-product-price">${status}</p>
        </div>
        
        <form id="announcementForm" class="modern-form">
            <div class="modern-form-group">
                <label class="modern-form-label required">Title</label>
                <input type="text" class="modern-form-input" id="title" name="title" placeholder="Enter announcement title" value="${announcement?.title || ''}" required>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label required">Content</label>
                <textarea class="modern-form-textarea" id="content" name="content" rows="6" placeholder="Enter announcement content" required>${announcement?.content || ''}</textarea>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Type</label>
                <select class="modern-form-select" id="type" name="type">
                    <option value="info" ${announcement?.type === 'info' ? 'selected' : ''}>Info</option>
                    <option value="warning" ${announcement?.type === 'warning' ? 'selected' : ''}>Warning</option>
                    <option value="success" ${announcement?.type === 'success' ? 'selected' : ''}>Success</option>
                    <option value="error" ${announcement?.type === 'error' ? 'selected' : ''}>Error</option>
                </select>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Priority</label>
                <select class="modern-form-select" id="priority" name="priority">
                    <option value="low" ${announcement?.priority === 'low' ? 'selected' : ''}>Low</option>
                    <option value="medium" ${announcement?.priority === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="high" ${announcement?.priority === 'high' ? 'selected' : ''}>High</option>
                </select>
            </div>
            
            <div class="modern-form-group">
                <label class="modern-form-label">Status</label>
                <select class="modern-form-select" id="isActive" name="isActive">
                    <option value="true" ${announcement?.isActive !== false ? 'selected' : ''}>Active</option>
                    <option value="false" ${announcement?.isActive === false ? 'selected' : ''}>Inactive</option>
                </select>
            </div>
            
            <div class="modern-form-actions">
                <button type="button" class="modern-btn modern-btn-secondary btn-cancel">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button type="submit" class="modern-btn modern-btn-primary">
                    <i class="fas fa-save"></i> ${isEdit ? 'Update Announcement' : 'Save Announcement'}
                </button>
            </div>
        </form>
    `;
}

/**
 * Initialize dashboard statistics and charts
 */
function initDashboard() {
    // Fetch dashboard data
    fetchDashboardData()
        .then(data => {
            updateDashboardStats(data.stats);
            updateRecentActivity(data.recentActivity);
            // Initialize charts with actual data - add delay to ensure Chart.js is loaded
            setTimeout(() => {
                initDashboardCharts();
            }, 500);
        })
        .catch(error => {
            console.error('Error loading dashboard data:', error);
            showNotification('Failed to load dashboard data', 'error');
        });
}

/**
 * Format time ago helper function
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted time ago string
 */
function formatTimeAgo(date) {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
        const months = Math.floor(diffInSeconds / 2592000);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    }
}

/**
 * Fetch dashboard data from the server
 * @returns {Promise} Promise that resolves with dashboard data
 */
async function fetchDashboardData() {
    try {
        const response = await apiCall('/api/admin/dashboard');
        const data = response.data;
        
        // Get activity logs from the activity API
        let activityLogs = [];
        try {
            const activityResponse = await apiCall('/api/activity?limit=10');
            if (activityResponse && activityResponse.data) {
                activityLogs = activityResponse.data.map(log => ({
                    type: log.targetType || 'general',
                    action: log.action || 'Activity',
                    item: log.description || '',
                    user: log.adminName || 'Admin',
                    time: formatTimeAgo(log.createdAt),
                    originalTime: log.createdAt
                }));
            }
        } catch (activityError) {
            console.warn('Failed to load activity logs:', activityError);
        }
        
        // Create recent activity from recent users and books if no activity logs
        const recentActivity = activityLogs.length > 0 ? activityLogs : [];
        
        // Add recent users if no activity logs
        if (recentActivity.length === 0 && data.recentUsers) {
            data.recentUsers.forEach(user => {
                recentActivity.push({
                    type: 'user',
                    action: 'New user registered',
                    user: user.name,
                    time: formatTimeAgo(user.joinedDate),
                    originalTime: user.joinedDate
                });
            });
        }
        
        // Add recent books if no activity logs
        if (recentActivity.length === 0 && data.recentBooks) {
            data.recentBooks.forEach(book => {
                recentActivity.push({
                    type: 'book',
                    action: 'Book added',
                    item: book.title,
                    user: 'Admin',
                    time: formatTimeAgo(book.addedDate),
                    originalTime: book.addedDate
                });
            });
        }
        
        // Sort by most recent and limit to 10 items
        recentActivity.sort((a, b) => new Date(b.originalTime || 0) - new Date(a.originalTime || 0));
        
        return {
            stats: {
                totalUsers: data.totalUsers || 0,
                totalBooks: data.totalBooks || 0,
                totalEbooks: data.totalEbooks || 0,
                totalProjects: data.totalProjects || 0,
                totalMessages: data.totalMessages || 0
            },
            recentActivity: recentActivity.slice(0, 10),
            chartData: {
                userGrowth: [10, 25, 40, 55, 70, 85, 100, 120, 140, 160, 180, 200] // Mock data for now
            }
        };
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Return fallback data if API fails
        return {
            stats: {
                totalUsers: 0,
                totalBooks: 0,
                totalEbooks: 0,
                totalProjects: 0,
                totalMessages: 0
            },
            recentActivity: [],
            chartData: {
                userGrowth: []
            }
        };
    }
}

/**
 * Update dashboard statistics
 * @param {Object} stats - Dashboard statistics
 */
function updateDashboardStats(stats) {
    // Update total books
    const totalBooksElement = document.getElementById('totalBooks');
    if (totalBooksElement) {
        totalBooksElement.textContent = (stats.totalBooks || 0).toLocaleString();
    }
    
    // Update total ebooks
    const totalEbooksElement = document.getElementById('totalEbooks');
    if (totalEbooksElement) {
        totalEbooksElement.textContent = (stats.totalEbooks || 0).toLocaleString();
    }
    
    // Update total projects
    const totalProjectsElement = document.getElementById('totalProjects');
    if (totalProjectsElement) {
        totalProjectsElement.textContent = (stats.totalProjects || 0).toLocaleString();
    }
    
    // Update total messages
    const totalMessagesElement = document.getElementById('totalMessages');
    if (totalMessagesElement) {
        totalMessagesElement.textContent = (stats.totalMessages || 0).toLocaleString();
    }
}

/**
 * Update recent activity list
 * @param {Array} activities - Recent activities
 */
function updateRecentActivity(activities) {
    const activityList = document.getElementById('recentActivity');
    if (!activityList) {
        console.log('Recent activity container not found');
        return;
    }
    
    // Clear existing activities
    activityList.innerHTML = '';
    
    // Check if there are any activities
    if (!activities || activities.length === 0) {
        activityList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--gray-500);">
                <i class="fas fa-clock" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>No recent activity</p>
            </div>
        `;
        return;
    }
    
    // Add each activity to the list
    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.setAttribute('data-type', activity.type);
        
        // Set icon based on activity type
        let icon = '';
        switch (activity.type) {
            case 'user':
                icon = '<i class="fas fa-user"></i>';
                break;
            case 'book':
                icon = '<i class="fas fa-book"></i>';
                break;
            case 'donation':
                icon = '<i class="fas fa-hand-holding-usd"></i>';
                break;
            case 'project':
                icon = '<i class="fas fa-project-diagram"></i>';
                break;
            case 'message':
                icon = '<i class="fas fa-envelope"></i>';
                break;
            default:
                icon = '<i class="fas fa-bell"></i>';
        }
        
        // Create activity content
        let content = `<strong>${activity.action}</strong>`;
        if (activity.item) {
            content += `: ${activity.item}`;
        }
        if (activity.amount) {
            content += `: ${activity.amount}`;
        }
        if (activity.user) {
            content += ` by ${activity.user}`;
        }
        
        // Create activity HTML
        activityItem.innerHTML = `
            <div class="activity-icon">${icon}</div>
            <div class="activity-content">
                <div class="activity-text">${content}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        `;
        
        // Add to activity list
        activityList.appendChild(activityItem);
    });
}

/**
 * Initialize dashboard charts
 * @param {Object} chartData - Data for dashboard charts
 */
// Global flag to prevent multiple chart initializations
let chartsInitialized = false;

// API response cache to prevent duplicate calls
const apiCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

// Enhanced API call with caching
async function cachedApiCall(endpoint) {
    const now = Date.now();
    const cached = apiCache.get(endpoint);
    
    // Return cached response if still valid
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        console.log(`Using cached response for ${endpoint}`);
        return cached.data;
    }
    
    // Make fresh API call
    try {
        const response = await apiCall(endpoint);
        apiCache.set(endpoint, {
            data: response,
            timestamp: now
        });
        return response;
    } catch (error) {
        console.error(`API call failed for ${endpoint}:`, error);
        // Return cached data if available, even if expired
        if (cached) {
            console.log(`Using expired cache for ${endpoint} due to error`);
            return cached.data;
        }
        throw error;
    }
}

async function initDashboardCharts() {
    console.log('Initializing dashboard charts...');
    
    // Prevent multiple initializations
    if (chartsInitialized) {
        console.log('Charts already initialized - skipping');
        return;
    }
    
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.log('Chart.js not available - skipping chart initialization');
        return;
    }
    
    chartsInitialized = true;
    
    // Get data for pie chart
    try {
        const [booksResponse, ebooksResponse, projectsResponse, messagesResponse] = await Promise.allSettled([
            cachedApiCall('/api/books'),
            cachedApiCall('/api/ebooks'),
            cachedApiCall('/api/projects'),
            cachedApiCall('/api/messages')
        ]);
        
        // Calculate counts
        const booksCount = booksResponse.status === 'fulfilled' ? 
            (Array.isArray(booksResponse.value?.data) ? booksResponse.value.data.length : 
             Array.isArray(booksResponse.value) ? booksResponse.value.length : 0) : 0;
             
        const ebooksCount = ebooksResponse.status === 'fulfilled' ? 
            (Array.isArray(ebooksResponse.value?.data) ? ebooksResponse.value.data.length : 
             Array.isArray(ebooksResponse.value) ? ebooksResponse.value.length : 0) : 0;
             
        const projectsCount = projectsResponse.status === 'fulfilled' ? 
            (Array.isArray(projectsResponse.value?.data) ? projectsResponse.value.data.length : 
             Array.isArray(projectsResponse.value) ? projectsResponse.value.length : 0) : 0;
             
        const messagesCount = messagesResponse.status === 'fulfilled' ? 
            (Array.isArray(messagesResponse.value?.data) ? messagesResponse.value.data.length : 
             Array.isArray(messagesResponse.value) ? messagesResponse.value.length : 0) : 0;
        
        // Initialize pie chart
        const pieChartElement = document.getElementById('contentPieChart');
        if (pieChartElement) {
            try {
                // Destroy existing chart if it exists
                const existingChart = Chart.getChart(pieChartElement);
                if (existingChart) {
                    existingChart.destroy();
                }
                
                const ctx = pieChartElement.getContext('2d');
                const totalCount = booksCount + ebooksCount + projectsCount + messagesCount;
                
                console.log('Chart data:', { booksCount, ebooksCount, projectsCount, messagesCount, totalCount });
                
                // If no data, show a message
                if (totalCount === 0) {
                    console.log('No data available for pie chart');
                    // You could add a "No data" message here
                    return;
                }
                
                new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: ['Books', 'E-books', 'Projects', 'Messages'],
                        datasets: [{
                            data: [booksCount, ebooksCount, projectsCount, messagesCount],
                            backgroundColor: [
                                '#3B82F6', // Blue for books
                                '#F59E0B', // Yellow for ebooks
                                '#10B981', // Green for projects
                                '#EF4444'  // Red for messages
                            ],
                            borderWidth: 2,
                            borderColor: 'var(--text-inverse)'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    padding: 20,
                                    usePointStyle: true
                                }
                            }
                        }
                    }
                });
                console.log('Pie chart initialized successfully with data:', { booksCount, ebooksCount, projectsCount, messagesCount });
            } catch (error) {
                console.error('Pie chart initialization failed:', error);
            }
        } else {
            console.log('Pie chart element not found');
        }
    } catch (error) {
        console.error('Error loading data for charts:', error);
    }
}

/**
 * Initialize content management functionality
 */
function initContentManagement() {
    console.log('Initializing content management...');
    
    // ContentEditor is initialized by content-editor.js
    // We just need to wait for it to be ready or proceed with core functionality
    if (window.contentEditor && window.contentEditor.initializationComplete) {
        console.log('ContentEditor is ready, proceeding with full content management');
        initContentManagementCore();
    } else {
        console.log('ContentEditor not ready, proceeding with core content management functionality');
        initContentManagementCore();
        
        // Set up a one-time check for ContentEditor readiness
        setTimeout(() => {
            if (window.contentEditor && window.contentEditor.initializationComplete) {
                console.log('ContentEditor became ready, enhancing content management features');
                // Enhance with ContentEditor-specific features if needed
            }
        }, 2000);
    }
}

/**
 * Core content management initialization
 */
function initContentManagementCore() {
    
    // Note: loadWebsiteContent() is now called only when 'website-content' section is loaded
    // to prevent double initialization with loadWebsiteContentData()
    
    // Initialize enhanced content search functionality
    initContentSearch();
    
    // Add event listeners for content form submissions
    const contentForms = document.querySelectorAll('.content-form');
    contentForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            saveContentChanges(this);
        });
    });
    
    // Add event listeners for logo upload
    const logoUploadBtn = document.getElementById('logo-upload-btn');
    const logoFileInput = document.getElementById('logo-file-input');
    
    if (logoUploadBtn && logoFileInput) {
        logoUploadBtn.addEventListener('click', function() {
            logoFileInput.click();
        });
        
        logoFileInput.addEventListener('change', function(e) {
            handleLogoUpload(e.target.files[0]);
        });
    } else {
        console.log('Logo upload elements not found - skipping logo upload functionality');
    }
}

/**
 * Initialize enhanced content search functionality
 */
function initContentSearch() {
    // Content search input
    const contentSearch = document.getElementById('contentSearch');
    if (contentSearch) {
        let searchTimeout;
        contentSearch.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performContentSearch();
            }, 300); // Debounce search for 300ms
        });
    }
    
    // Content page filter
    const contentPageFilter = document.getElementById('contentPageFilter');
    if (contentPageFilter) {
        contentPageFilter.addEventListener('change', function() {
            performContentSearch();
        });
    }
    
    // Content status filter
    const contentStatusFilter = document.getElementById('contentStatusFilter');
    if (contentStatusFilter) {
        contentStatusFilter.addEventListener('change', function() {
            performContentSearch();
        });
    }
    
    // Load initial content table
    loadContentTable();
}

/**
 * Perform enhanced content search with real-time filtering
 */
async function performContentSearch() {
    const searchTerm = document.getElementById('contentSearch')?.value || '';
    const pageFilter = document.getElementById('contentPageFilter')?.value || '';
    const statusFilter = document.getElementById('contentStatusFilter')?.value || '';
    
    try {
        showLoading();
        
        // Build query parameters
        const params = new URLSearchParams();
        if (searchTerm) params.append('q', searchTerm);
        if (pageFilter) params.append('page', pageFilter);
        if (statusFilter) params.append('status', statusFilter);
        params.append('limit', '100'); // Load more results for better search
        
        // Call search API
        const response = await apiCall(`/api/content/search?${params.toString()}`);
        const searchResults = response.data || response;
        
        // Update content table with search results
        updateContentTable(searchResults);
        
        hideLoading();
    } catch (error) {
        console.error('Error performing content search:', error);
        hideLoading();
        showNotification('Error searching content', 'error');
    }
}

/**
 * Load content table with all content
 */
async function loadContentTable() {
    try {
        showLoading();
        
        const response = await apiCall('/api/website-content/sections?limit=100');
        const content = response.data || response;
        
        updateContentTable(content);
        
        hideLoading();
    } catch (error) {
        console.error('Error loading content table:', error);
        hideLoading();
        
        // Fallback to empty table
        const tableBody = document.getElementById('contentTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #6b7280;">Error loading content</td></tr>';
        }
    }
}

/**
 * Update content table with provided data
 */
function updateContentTable(contentData) {
    const tableBody = document.getElementById('contentTableBody');
    if (!tableBody) return;
    
    if (!contentData || contentData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #6b7280;">No content found</td></tr>';
        return;
    }
    
    // Group content by page and section for better display
    const groupedContent = groupContentByPageSection(contentData);
    
    tableBody.innerHTML = Object.entries(groupedContent).map(([pageSection, items]) => {
        const [page, section] = pageSection.split('|');
        const firstItem = items[0];
        
        return `
            <tr class="content-row" data-page="${page}" data-section="${section}">
                <td style="padding: 1rem; font-weight: 600; color: #374151;">${formatPageName(page)}</td>
                <td style="padding: 1rem; color: #6b7280;">${formatSectionName(section)}</td>
                <td style="padding: 1rem;">
                    <div class="content-preview">
                        <div class="english-content">${truncateText(getContentTitle(items, 'en'), 50)}</div>
                        ${items.some(item => item.language === 'ta') ? 
                            `<div class="tamil-content" style="font-size: 0.9em; color: #6b7280; margin-top: 0.25rem;">${truncateText(getContentTitle(items, 'ta'), 50)}</div>` : 
                            '<div class="tamil-content" style="font-size: 0.9em; color: #ef4444;">Missing Tamil</div>'
                        }
                    </div>
                </td>
                <td style="padding: 1rem;">
                    <div class="content-preview">
                        <div class="english-content">${truncateText(getContentTitle(items, 'ta'), 50)}</div>
                    </div>
                </td>
                <td style="padding: 1rem;">
                    <span class="status-badge status-${firstItem.is_active ? 'active' : 'inactive'}">
                        ${firstItem.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td style="padding: 1rem; color: #6b7280; font-size: 0.9em;">
                    ${formatDate(firstItem.updatedAt || firstItem.updated_at)}
                </td>
                <td style="padding: 1rem;">
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="editContentSection('${page}', '${section}')" title="Edit Section">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-info" onclick="previewContentSection('${page}', '${section}')" title="Preview">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="duplicateContentSection('${page}', '${section}')" title="Duplicate">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Add hover effects and click handlers
    addContentTableInteractions();
}

/**
 * Group content by page and section
 */
function groupContentByPageSection(contentData) {
    const grouped = {};
    
    contentData.forEach(item => {
        const key = `${item.page}|${item.section}`;
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(item);
    });
    
    return grouped;
}

/**
 * Get content title for a specific language
 */
function getContentTitle(items, language) {
    const item = items.find(i => i.language === language);
    if (!item) return '';
    
    // Try to get a meaningful title from content_value
    if (item.content_value) {
        if (typeof item.content_value === 'string') {
            return item.content_value;
        } else if (typeof item.content_value === 'object') {
            return item.content_value.title || item.content_value.text || item.content_value.content || JSON.stringify(item.content_value).substring(0, 50);
        }
    }
    
    return item.content_key || 'No content';
}

/**
 * Format page name for display
 */
function formatPageName(page) {
    const pageNames = {
        'global': 'Global Elements',
        'home': 'Home Page',
        'about': 'About Page',
        'books': 'Books Page',
        'projects': 'Projects Page',
        'ebooks': 'E-books Page',
        'contact': 'Contact Page',
        'donate': 'Donate Page',
        'signup': 'Sign Up Page',
        'login': 'Login Page'
    };
    
    return pageNames[page] || page.charAt(0).toUpperCase() + page.slice(1);
}

/**
 * Format section name for display
 */
function formatSectionName(section) {
    return section.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

/**
 * Truncate text to specified length
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // Less than 1 minute
        return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
        return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) { // Less than 1 day
        return `${Math.floor(diff / 3600000)}h ago`;
    } else if (diff < 604800000) { // Less than 1 week
        return `${Math.floor(diff / 86400000)}d ago`;
    } else {
        return date.toLocaleDateString();
    }
}

/**
 * Add interactive features to content table
 */
function addContentTableInteractions() {
    const rows = document.querySelectorAll('.content-row');
    
    rows.forEach(row => {
        // Add hover effect
        row.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'var(--bg-secondary)';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
        
        // Add click to edit functionality
        row.addEventListener('click', function(e) {
            // Don't trigger if clicking on action buttons
            if (e.target.closest('.action-buttons')) return;
            
            const page = this.dataset.page;
            const section = this.dataset.section;
            editContentSection(page, section);
        });
    });
}

/**
 * Edit content section
 */
function editContentSection(page, section) {
    // Switch to content editor and load the specific page
    showSection('content');
    
    // If content editor is available, switch to the page
    if (window.contentEditor) {
        const pageSelector = document.getElementById('pageSelector');
        if (pageSelector) {
            pageSelector.value = page;
            pageSelector.dispatchEvent(new Event('change'));
            
            // Wait for page content to load, then highlight the section
            setTimeout(() => {
                highlightContentSection(section);
            }, 1500); // Give time for content to load
        }
    }
    
    showNotification(`Editing ${formatPageName(page)} - ${formatSectionName(section)}`, 'info');
}

/**
 * Highlight a specific section in the content editor
 */
function highlightContentSection(sectionKey) {
    try {
        // Find the section element by section key
        const sectionElement = document.querySelector(`[data-section-key="${sectionKey}"]`);
        if (sectionElement) {
            // Scroll to the section
            sectionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Add highlight styling
            sectionElement.style.outline = '2px solid var(--primary-blue)';
            sectionElement.style.outlineOffset = '4px';
            sectionElement.style.backgroundColor = 'var(--bg-accent-light)';
            
            // Remove highlight after 3 seconds
            setTimeout(() => {
                sectionElement.style.outline = 'none';
                sectionElement.style.outlineOffset = '0';
                sectionElement.style.backgroundColor = '';
            }, 3000);
            
            showNotification('Section highlighted for editing', 'success');
        } else {
            console.warn('Section not found:', sectionKey);
            showNotification('Section loaded - scroll to find your content', 'info');
        }
    } catch (error) {
        console.error('Error highlighting section:', error);
        showNotification('Content loaded successfully', 'success');
    }
}

/**
 * Preview content section
 */
function previewContentSection(page, section) {
    // Open preview in new tab/window
    const previewUrl = `/${page === 'home' ? '' : page}.html#${section}`;
    window.open(previewUrl, '_blank');
    
    showNotification(`Previewing ${formatPageName(page)} - ${formatSectionName(section)}`, 'info');
}

/**
 * Duplicate content section
 */
async function duplicateContentSection(page, section) {
    try {
        showLoading();
        
        // Get current content for the section
        const response = await apiCall(`/api/website-content/sections/${page}?section=${section}`);
        const sectionContent = response.data || response;
        
        if (!sectionContent || sectionContent.length === 0) {
            showNotification('No content found to duplicate', 'warning');
            hideLoading();
            return;
        }
        
        // Prompt for new section name
        const newSectionName = prompt(`Enter name for duplicated section (current: ${section}):`, `${section}-copy`);
        if (!newSectionName || newSectionName === section) {
            hideLoading();
            return;
        }
        
        // Duplicate each content item
        const duplicatePromises = sectionContent.map(item => {
            const newContentKey = item.content_key.replace(section, newSectionName);
            return apiCall('/api/content', {
                method: 'POST',
                body: JSON.stringify({
                    content_key: newContentKey,
                    content_value: item.content_value,
                    language: item.language,
                    type: item.type,
                    page: page,
                    section: newSectionName,
                    element: item.element,
                    meta_description: item.meta_description,
                    alt_text: item.alt_text
                })
            });
        });
        
        await Promise.all(duplicatePromises);
        
        // Refresh content table
        await loadContentTable();
        
        hideLoading();
        showNotification(`Section duplicated as "${newSectionName}"`, 'success');
        
    } catch (error) {
        console.error('Error duplicating content section:', error);
        hideLoading();
        showNotification('Error duplicating section', 'error');
    }
}

/**
 * Load current website content from the server using real database API
 */
async function loadWebsiteContent() {
    try {
        console.log('Loading real website content from database...');
        
        // Get auth token for API calls
        const token = getAuthToken();
        if (!token) {
            console.warn('No auth token found, loading default content');
            loadDefaultContent();
            return;
        }
        
        // Load content for different pages/sections
        const pages = ['global', 'home', 'about', 'contact', 'books', 'ebooks', 'projects'];
        const allContent = {};
        
        for (const page of pages) {
            try {
                console.log(`Loading content for page: ${page} using new sections API`);
                const response = await fetch(`http://localhost:8080/api/website-content/sections/${page}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    const sections = result.data || [];
                    console.log(`Loaded ${sections.length} sections for page: ${page}`);
                    
                    // Organize content by page and section
                    if (!allContent[page]) allContent[page] = {};
                    
                    // Handle new section-based structure
                    sections.forEach((item) => {
                        const sectionKey = item.sectionId || `section-${item._id}`;
                        
                        allContent[page][sectionKey] = {
                            ...item,
                            section: sectionKey,
                            // Map new section fields to expected format
                            title: item.sectionTitle || '',
                            title_english: item.sectionTitle || '',
                            title_tamil: item.contentTamil || '',
                            content: item.contentHtml || '',
                            content_english: item.contentHtml || '',
                            content_tamil: item.contentTamil || '',
                            description: item.metadata?.description || '',
                            description_english: item.metadata?.description || '',
                            description_tamil: item.metadata?.descriptionTamil || '',
                            isVisible: item.isVisible,
                            isActive: item.isActive,
                            order: item.order
                        };
                    });
                    
                    console.log(`Loaded ${sections.length} sections for page: ${page}`);
                } else if (response.status === 404) {
                    console.log(`No content found for page: ${page}`);
                    allContent[page] = {};
                } else {
                    console.warn(`Failed to load content for page ${page}:`, response.statusText);
                }
            } catch (pageError) {
                console.error(`Error loading content for page ${page}:`, pageError);
                allContent[page] = {};
            }
        }
        
        // Transform the data structure for compatibility with existing forms
        const transformedContent = {
            homepage: {
                title: allContent.home?.hero?.title_english || allContent.global?.site?.title_english || '',
                title_tamil: allContent.home?.hero?.title_tamil || allContent.global?.site?.title_tamil || '',
                subtitle: allContent.home?.hero?.description_english || allContent.global?.site?.description_english || '',
                subtitle_tamil: allContent.home?.hero?.description_tamil || allContent.global?.site?.description_tamil || '',
                description: allContent.home?.intro?.content_english || '',
                description_tamil: allContent.home?.intro?.content_tamil || ''
            },
            about: {
                mission: allContent.about?.mission?.content_english || '',
                mission_tamil: allContent.about?.mission?.content_tamil || '',
                vision: allContent.about?.vision?.content_english || '',
                vision_tamil: allContent.about?.vision?.content_tamil || '',
                history: allContent.about?.history?.content_english || '',
                history_tamil: allContent.about?.history?.content_tamil || ''
            },
            contact: {
                address: allContent.contact?.address?.content_english || '',
                address_tamil: allContent.contact?.address?.content_tamil || '',
                phone: allContent.contact?.phone?.content_english || '',
                email: allContent.contact?.email?.content_english || '',
                hours: allContent.contact?.hours?.content_english || '',
                hours_tamil: allContent.contact?.hours?.content_tamil || ''
            },
            global: {
                site_title: allContent.global?.site?.title_english || '',
                site_title_tamil: allContent.global?.site?.title_tamil || '',
                logo_url: allContent.global?.logo?.image_url || '',
                footer_text: allContent.global?.footer?.content_english || '',
                footer_text_tamil: allContent.global?.footer?.content_tamil || ''
            },
            logo: allContent.global?.logo?.image_url || 'assets/logo.jpeg'
        };
        
        console.log('Transformed content structure:', transformedContent);
        populateContentForms(transformedContent);
        
    } catch (error) {
        console.error('Error loading website content:', error);
        showNotification('Failed to load website content. Using default content.', 'warning');
        loadDefaultContent();
    }
}

/**
 * Populate content forms with current data including Tamil/English fields
 * @param {Object} content - The website content data
 */
function populateContentForms(content) {
    console.log('Populating content forms with real data:', content);
    
    // Homepage content with bilingual support
    if (content.homepage) {
        const homepageForm = document.getElementById('homepage-content-form');
        if (homepageForm) {
            // English fields
            const titleInput = homepageForm.querySelector('input[name="title"]');
            const subtitleInput = homepageForm.querySelector('input[name="subtitle"]');
            const descriptionTextarea = homepageForm.querySelector('textarea[name="description"]');
            
            // Tamil fields
            const titleTamilInput = homepageForm.querySelector('input[name="title_tamil"]');
            const subtitleTamilInput = homepageForm.querySelector('input[name="subtitle_tamil"]');
            const descriptionTamilTextarea = homepageForm.querySelector('textarea[name="description_tamil"]');
            
            // Populate English fields
            if (titleInput) titleInput.value = content.homepage.title || '';
            if (subtitleInput) subtitleInput.value = content.homepage.subtitle || '';
            if (descriptionTextarea) descriptionTextarea.value = content.homepage.description || '';
            
            // Populate Tamil fields
            if (titleTamilInput) titleTamilInput.value = content.homepage.title_tamil || '';
            if (subtitleTamilInput) subtitleTamilInput.value = content.homepage.subtitle_tamil || '';
            if (descriptionTamilTextarea) descriptionTamilTextarea.value = content.homepage.description_tamil || '';
            
            // Update TinyMCE editors if available
            if (typeof tinymce !== 'undefined') {
                try {
                    const editor = tinymce.get('homepage-description');
                    if (editor) {
                        editor.setContent(content.homepage.description || '');
                    }
                    
                    const editorTamil = tinymce.get('homepage-description-tamil');
                    if (editorTamil) {
                        editorTamil.setContent(content.homepage.description_tamil || '');
                    }
                } catch (error) {
                    console.log('TinyMCE editor not found for homepage fields');
                }
            }
            
            console.log('Homepage content populated successfully');
        }
    }
    
    // About Us content with bilingual support
    if (content.about) {
        const aboutForm = document.getElementById('about-content-form');
        if (aboutForm) {
            // English fields
            const missionInput = aboutForm.querySelector('textarea[name="mission"]');
            const visionInput = aboutForm.querySelector('textarea[name="vision"]');
            const historyInput = aboutForm.querySelector('textarea[name="history"]');
            
            // Tamil fields
            const missionTamilInput = aboutForm.querySelector('textarea[name="mission_tamil"]');
            const visionTamilInput = aboutForm.querySelector('textarea[name="vision_tamil"]');
            const historyTamilInput = aboutForm.querySelector('textarea[name="history_tamil"]');
            
            // Populate English fields
            if (missionInput) missionInput.value = content.about.mission || '';
            if (visionInput) visionInput.value = content.about.vision || '';
            if (historyInput) historyInput.value = content.about.history || '';
            
            // Populate Tamil fields
            if (missionTamilInput) missionTamilInput.value = content.about.mission_tamil || '';
            if (visionTamilInput) visionTamilInput.value = content.about.vision_tamil || '';
            if (historyTamilInput) historyTamilInput.value = content.about.history_tamil || '';
            
            // Update TinyMCE editors for both languages
            if (typeof tinymce !== 'undefined') {
                ['mission', 'vision', 'history'].forEach(field => {
                    try {
                        // English editor
                        const editor = tinymce.get(`about-${field}`);
                        if (editor) {
                            editor.setContent(content.about[field] || '');
                        }
                        
                        // Tamil editor
                        const editorTamil = tinymce.get(`about-${field}-tamil`);
                        if (editorTamil) {
                            editorTamil.setContent(content.about[`${field}_tamil`] || '');
                        }
                    } catch (error) {
                        console.log(`TinyMCE editor not found for about-${field}`);
                    }
                });
            }
            
            console.log('About content populated successfully');
        }
    }
    
    // Contact content with bilingual support
    if (content.contact) {
        const contactForm = document.getElementById('contact-content-form');
        if (contactForm) {
            // English fields
            const addressInput = contactForm.querySelector('textarea[name="address"]');
            const phoneInput = contactForm.querySelector('input[name="phone"]');
            const emailInput = contactForm.querySelector('input[name="email"]');
            const hoursInput = contactForm.querySelector('textarea[name="hours"]');
            
            // Tamil fields
            const addressTamilInput = contactForm.querySelector('textarea[name="address_tamil"]');
            const hoursTamilInput = contactForm.querySelector('textarea[name="hours_tamil"]');
            
            // Populate English fields
            if (addressInput) addressInput.value = content.contact.address || '';
            if (phoneInput) phoneInput.value = content.contact.phone || '';
            if (emailInput) emailInput.value = content.contact.email || '';
            if (hoursInput) hoursInput.value = content.contact.hours || '';
            
            // Populate Tamil fields
            if (addressTamilInput) addressTamilInput.value = content.contact.address_tamil || '';
            if (hoursTamilInput) hoursTamilInput.value = content.contact.hours_tamil || '';
            
            console.log('Contact content populated successfully');
        }
    }
    
    // Global content (site title, footer, etc.)
    if (content.global) {
        const globalForm = document.getElementById('global-content-form');
        if (globalForm) {
            // Site title fields
            const siteTitleInput = globalForm.querySelector('input[name="site_title"]');
            const siteTitleTamilInput = globalForm.querySelector('input[name="site_title_tamil"]');
            
            // Footer fields
            const footerTextInput = globalForm.querySelector('textarea[name="footer_text"]');
            const footerTextTamilInput = globalForm.querySelector('textarea[name="footer_text_tamil"]');
            
            // Logo URL field
            const logoUrlInput = globalForm.querySelector('input[name="logo_url"]');
            
            // Populate fields
            if (siteTitleInput) siteTitleInput.value = content.global.site_title || '';
            if (siteTitleTamilInput) siteTitleTamilInput.value = content.global.site_title_tamil || '';
            if (footerTextInput) footerTextInput.value = content.global.footer_text || '';
            if (footerTextTamilInput) footerTextTamilInput.value = content.global.footer_text_tamil || '';
            if (logoUrlInput) logoUrlInput.value = content.global.logo_url || '';
            
            console.log('Global content populated successfully');
        }
    }
    
    // Logo preview
    if (content.logo) {
        const logoPreview = document.getElementById('current-logo');
        if (logoPreview) {
            logoPreview.src = content.logo;
            logoPreview.style.display = 'block';
        }
        
        // Also update any logo URL displays
        const logoUrlDisplays = document.querySelectorAll('.logo-url-display');
        logoUrlDisplays.forEach(display => {
            display.textContent = content.logo;
        });
    }
    
    // Show success notification
    showNotification('Website content loaded successfully from database', 'success');
}

/**
 * Load default content if API is not available
 */
function loadDefaultContent() {
    const defaultContent = {
        homepage: {
            title: 'Tamil Language Society',
            subtitle: 'Preserving and promoting Tamil literature and culture',
            description: 'Welcome to the Tamil Language Society, where we celebrate the rich heritage of Tamil literature and culture.'
        },
        about: {
            mission: 'Our mission is to preserve and promote Tamil literature and culture.',
            vision: 'We envision a world where Tamil literature is accessible to everyone.',
            history: 'Founded with a passion for Tamil culture, we have been serving the community for years.'
        },
        logo: 'assets/logo.jpeg'
    };
    
    populateContentForms(defaultContent);
}

/**
 * Save content changes from a form
 * @param {HTMLFormElement} form - The form containing content changes
 */
async function saveContentChanges(form) {
    const formData = new FormData(form);
    const contentType = form.getAttribute('data-content-type') || 'global';
    
    // Get content from TinyMCE editors with bilingual support
    if (typeof tinymce !== 'undefined') {
        const editors = tinymce.editors;
        editors.forEach(editor => {
            const editorId = editor.id;
            const content = editor.getContent();
            
            // Handle both English and Tamil editors
            if (editorId.includes('-tamil')) {
                const fieldName = editorId.replace(`${contentType}-`, '').replace('-tamil', '_tamil');
                formData.set(fieldName, content);
            } else {
                const fieldName = editorId.replace(`${contentType}-`, '');
                formData.set(fieldName, content);
            }
        });
    }
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitButton.disabled = true;
    
    try {
        const token = getAuthToken();
        if (!token) {
            showNotification('Authentication required', 'error');
            return;
        }
        
        // Determine the page type from content type or form ID
        let pageType = contentType;
        const formId = form.id;
        
        if (formId.includes('homepage')) {
            pageType = 'home';
        } else if (formId.includes('about')) {
            pageType = 'about';
        } else if (formId.includes('contact')) {
            pageType = 'contact';
        } else if (formId.includes('books')) {
            pageType = 'books';
        } else if (formId.includes('ebooks')) {
            pageType = 'ebooks';
        } else if (formId.includes('projects')) {
            pageType = 'projects';
        }
        
        // Convert FormData to object with bilingual support
        const contentData = Object.fromEntries(formData);
        
        console.log(`Saving ${pageType} content with real-time updates:`, contentData);
        
        // Make API request to save content with real-time updates
        const apiEndpoint = `/api/content`;
        
        const response = await fetch(`http://localhost:8080${apiEndpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                page: pageType,
                section: 'main',
                title: contentData.title || `${pageType.charAt(0).toUpperCase() + pageType.slice(1)} Page`,
                content: JSON.stringify(contentData),
                timestamp: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Content saved successfully:', result);
        
        showNotification(`${pageType.charAt(0).toUpperCase() + pageType.slice(1)} content updated and website refreshed in real-time!`, 'success');
        
        // Trigger real-time website update
        await triggerWebsiteUpdate(pageType, contentData);
        
        // Reload content to reflect any server-side changes
        setTimeout(() => {
            loadWebsiteContent();
        }, 1000);
        
    } catch (error) {
        console.error('Error saving content:', error);
        showNotification('Failed to save content changes. Please try again.', 'error');
    } finally {
        // Reset button state
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
    }
}

/**
 * Trigger real-time website update without page refresh
 * @param {string} pageType - The type of page being updated
 * @param {Object} contentData - The updated content data
 */
async function triggerWebsiteUpdate(pageType, contentData) {
    try {
        console.log('Triggering real-time website update for:', pageType);
        
        // Send message to main website if it's open in another tab/window
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
                type: 'CONTENT_UPDATE',
                page: pageType,
                content: contentData,
                timestamp: Date.now()
            }, '*');
            console.log('Real-time update message sent to main website');
        }
        
        // Use localStorage for cross-tab communication
        const updateData = {
            type: 'CONTENT_UPDATE',
            page: pageType,
            content: contentData,
            timestamp: Date.now()
        };
        
        localStorage.setItem('websiteContentUpdate', JSON.stringify(updateData));
        
        // Trigger storage event for other tabs
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'websiteContentUpdate',
            newValue: JSON.stringify(updateData)
        }));
        
        // Remove the update flag after a short delay
        setTimeout(() => {
            localStorage.removeItem('websiteContentUpdate');
        }, 3000);
        
        // Also try to refresh any preview iframes
        const previewFrames = document.querySelectorAll('iframe[src*="localhost"]');
        previewFrames.forEach(frame => {
            try {
                frame.contentWindow.location.reload();
            } catch (e) {
                console.log('Could not refresh preview frame:', e.message);
            }
        });
        
        console.log('Real-time update triggered successfully for page:', pageType);
        
    } catch (error) {
        console.error('Error triggering real-time update:', error);
    }
}

// Test function for backend connectivity
async function testBackendConnection() {
    console.log('=== Testing Backend Connection ===');
    
    const endpoints = [
        '/api/books',
        '/api/ebooks', 
        '/api/projects',
        '/api/messages',
        '/api/users',
        '/api/announcements',
        '/api/admin/dashboard'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`Testing ${endpoint}...`);
            const response = await apiCall(endpoint);
            console.log(`${endpoint}: SUCCESS - Data received`, response);
        } catch (error) {
            console.error(`${endpoint}: FAILED`, error);
        }
    }
    
    console.log('=== Backend Connection Test Complete ===');
}

// Make test function available globally
window.testBackendConnection = testBackendConnection;

// ==================== ANNOUNCEMENTS MANAGEMENT ====================

/**
 * Enhanced modal system with fallback UI creation
 */
function createFallbackModal() {
    // Create modal elements if they don't exist
    let modal = document.getElementById('adminModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'adminModal';
        modal.className = 'modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--overlay-dark);
            backdrop-filter: blur(8px);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.cssText = `
            background: var(--glass-bg);
            border-radius: 1rem;
            padding: 0;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: var(--shadow-xl, 0 25px 50px rgba(0, 0, 0, 0.25));
        `;
        
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        modalHeader.style.cssText = `
            padding: 1.5rem;
            border-bottom: 1px solid var(--border-secondary, #e5e7eb);
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        const modalTitle = document.createElement('h3');
        modalTitle.id = 'modalTitle';
        modalTitle.textContent = 'Modal';
        modalTitle.style.cssText = `
            margin: 0;
            color: var(--text-primary, #1f2937);
            font-size: 1.5rem;
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 2rem;
            cursor: pointer;
            color: var(--text-secondary, #6b7280);
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeBtn.onclick = () => modal.style.display = 'none';
        
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        modalBody.style.cssText = `
            padding: 1.5rem;
        `;
        
        const modalFormContainer = document.createElement('div');
        modalFormContainer.id = 'modalFormContainer';
        
        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeBtn);
        modalBody.appendChild(modalFormContainer);
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        console.log('✅ Created fallback modal elements');
    }
    
    return {
        modal,
        modalTitle: document.getElementById('modalTitle'),
        modalFormContainer: document.getElementById('modalFormContainer')
    };
}

/**
 * Show announcement modal for adding/editing
 * @param {Object} announcement - Announcement data for editing (optional)
 */
function showAnnouncementModal(announcement = null) {
    console.log('showAnnouncementModal called with announcement:', announcement);
    
    function ensureModalReady(callback, retryCount = 0) {
        let modal = document.getElementById('adminModal');
        let modalTitle = document.getElementById('modalTitle');
        let modalFormContainer = document.getElementById('modalFormContainer');
        
        console.log('Modal elements check for announcement (attempt ' + (retryCount + 1) + '):', {
            modal: !!modal,
            modalTitle: !!modalTitle,
            modalFormContainer: !!modalFormContainer,
            documentReady: document.readyState
        });
        
        if (modal && modalTitle && modalFormContainer) {
            console.log('All modal elements found for announcement, proceeding...');
            callback(modal, modalTitle, modalFormContainer);
        } else if (retryCount < 10) { // Reduced retries, will create fallback sooner
            console.log('Modal elements not ready for announcement, retrying in 100ms...');
            setTimeout(() => ensureModalReady(callback, retryCount + 1), 100);
        } else {
            console.warn('Modal elements not found, creating fallback modal...');
            const fallbackElements = createFallbackModal();
            callback(fallbackElements.modal, fallbackElements.modalTitle, fallbackElements.modalFormContainer);
        }
    }
    
    ensureModalReady((modal, modalTitle, modalFormContainer) => {
    
    modalTitle.textContent = announcement ? 'Edit Announcement' : 'Create New Announcement';
    
    modalFormContainer.innerHTML = `
        <form id="announcementForm" onsubmit="handleAnnouncementFormSubmit(event)" ${announcement ? `data-announcement-id="${announcement._id}"` : ''}>
            <div class="form-group">
                <label class="form-label">Title *</label>
                <input type="text" class="form-input" name="title" value="${announcement ? announcement.title : ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Message *</label>
                <textarea class="form-textarea" name="content" rows="4" required>${announcement ? announcement.content : ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Type *</label>
                <select class="form-input" name="type" required>
                    <option value="">Select Type</option>
                    <option value="general" ${announcement && announcement.type === 'general' ? 'selected' : ''}>General</option>
                    <option value="project" ${announcement && announcement.type === 'project' ? 'selected' : ''}>New Project</option>
                    <option value="book" ${announcement && announcement.type === 'book' ? 'selected' : ''}>New Book</option>
                    <option value="urgent" ${announcement && announcement.type === 'urgent' ? 'selected' : ''}>Urgent</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Priority</label>
                <select class="form-input" name="priority">
                    <option value="low" ${announcement && announcement.priority === 'low' ? 'selected' : ''}>Low</option>
                    <option value="medium" ${announcement && announcement.priority === 'medium' ? 'selected' : 'selected'}>Medium</option>
                    <option value="high" ${announcement && announcement.priority === 'high' ? 'selected' : ''}>High</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Status</label>
                <select class="form-input" name="status">
                    <option value="draft" ${announcement && announcement.status === 'draft' ? 'selected' : ''}>Draft</option>
                    <option value="active" ${announcement && announcement.status === 'active' ? 'selected' : 'selected'}>Active</option>
                    <option value="scheduled" ${announcement && announcement.status === 'scheduled' ? 'selected' : ''}>Scheduled</option>
                    <option value="expired" ${announcement && announcement.status === 'expired' ? 'selected' : ''}>Expired</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Schedule Date (Optional)</label>
                <input type="datetime-local" class="form-input" name="scheduledDate" value="${announcement && announcement.scheduledDate ? new Date(announcement.scheduledDate).toISOString().slice(0, 16) : ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Expiry Date (Optional)</label>
                <input type="datetime-local" class="form-input" name="expiryDate" value="${announcement && announcement.expiryDate ? new Date(announcement.expiryDate).toISOString().slice(0, 16) : ''}">
            </div>
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" name="sendNotification" ${announcement && announcement.sendNotification !== false ? 'checked' : 'checked'}> Send Real-time Notification to All Users
                </label>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">${announcement ? 'Update' : 'Create'} Announcement</button>
            </div>
        </form>
    `;
    
    modal.classList.add('show');
    modal.style.display = 'flex';
    });
}

/**
 * Handle announcement form submission
 */
async function handleAnnouncementFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const announcementId = form.getAttribute('data-announcement-id');
    const isEdit = !!announcementId;
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitButton.disabled = true;
    
    try {
        // Convert FormData to JSON
        const announcementData = {};
        for (let [key, value] of formData.entries()) {
            if (key === 'sendNotification') {
                announcementData[key] = true;
            } else if (key === 'scheduledDate' || key === 'expiryDate') {
                announcementData[key] = value ? new Date(value).toISOString() : null;
            } else {
                announcementData[key] = value;
            }
        }
        
        // If sendNotification checkbox is not checked, it won't be in FormData
        if (!formData.has('sendNotification')) {
            announcementData.sendNotification = false;
        }
        
        const url = isEdit ? `/api/announcements/${announcementId}` : '/api/announcements';
        const method = isEdit ? 'PUT' : 'POST';
        
        const result = await apiCall(url, method, announcementData);
        
        if (result) {
            closeModal();
            loadAnnouncementsData();
            showNotification(isEdit ? 'Announcement updated successfully' : 'Announcement created successfully', 'success');
            
            // If it's a new announcement with notification enabled, show success message
            if (!isEdit && announcementData.sendNotification && announcementData.status === 'active') {
                setTimeout(() => {
                    showNotification('Real-time notification sent to all users', 'info');
                }, 1000);
            }
        } else {
            throw new Error(result.error || 'Failed to save announcement');
        }
    } catch (error) {
        console.error('Error saving announcement:', error);
        showNotification(error.message || 'Failed to save announcement', 'error');
    } finally {
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
    }
}

/**
 * Load announcements data and populate the table
 */
async function loadAnnouncementsData() {
    try {
        const response = await apiCall('/api/announcements');
        const announcements = response.data || response || [];
        populateAnnouncementsTable(announcements);
        updateAnnouncementsStats(announcements);
    } catch (error) {
        console.error('Error loading announcements:', error);
        populateAnnouncementsTable([]);
        updateAnnouncementsStats([]);
    }
}

/**
 * Populate announcements table with data
 */
function populateAnnouncementsTable(announcements) {
    const tableBody = document.getElementById('announcementsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    announcements.forEach(announcement => {
        const row = document.createElement('tr');
        
        const statusClass = {
            'active': 'status-active',
            'draft': 'status-draft',
            'scheduled': 'status-scheduled',
            'expired': 'status-expired'
        }[announcement.status] || 'status-draft';
        
        const typeIcon = {
            'general': 'fas fa-info-circle',
            'project': 'fas fa-project-diagram',
            'book': 'fas fa-book',
            'urgent': 'fas fa-exclamation-triangle'
        }[announcement.type] || 'fas fa-info-circle';
        
        row.innerHTML = `
            <td>
                <div style="font-weight: 600; color: var(--text-primary);">${announcement.title}</div>
            <div style="font-size: 0.875rem; color: var(--text-tertiary); margin-top: 0.25rem;">${announcement.content.substring(0, 100)}${announcement.content.length > 100 ? '...' : ''}</div>
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <i class="${typeIcon}" style="color: var(--text-tertiary);"></i>
                    <span style="text-transform: capitalize;">${announcement.type}</span>
                </div>
            </td>
            <td>
                <span class="status-badge ${statusClass}">${announcement.status}</span>
            </td>
            <td>
                <div style="font-weight: 600;">${announcement.recipientCount || 0}</div>
                <div style="font-size: 0.875rem; color: var(--text-tertiary);">users</div>
            </td>
            <td>
                <div>${new Date(announcement.createdAt).toLocaleDateString()}</div>
                <div style="font-size: 0.875rem; color: var(--text-tertiary);">${new Date(announcement.createdAt).toLocaleTimeString()}</div>
            </td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn-icon btn-edit" onclick="editAnnouncement('${announcement._id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteAnnouncement('${announcement._id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                    ${announcement.status === 'active' ? `
                        <button class="btn-icon btn-secondary" onclick="resendAnnouncement('${announcement._id}')" title="Resend Notification">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Update announcements statistics
 */
function updateAnnouncementsStats(announcements) {
    const totalElement = document.getElementById('totalAnnouncements');
    const activeElement = document.getElementById('activeAnnouncements');
    const recipientsElement = document.getElementById('totalRecipients');
    
    if (totalElement) totalElement.textContent = announcements.length;
    if (activeElement) activeElement.textContent = announcements.filter(a => a.status === 'active').length;
    if (recipientsElement) {
        const totalRecipients = announcements.reduce((sum, a) => sum + (a.recipientCount || 0), 0);
        recipientsElement.textContent = totalRecipients;
    }
}

/**
 * Edit an announcement
 */
async function editAnnouncement(announcementId) {
    try {
        const response = await apiCall(`/api/announcements/${announcementId}`);
        const announcement = response.data || response;
        showAnnouncementModal(announcement);
    } catch (error) {
        console.error('Error loading announcement:', error);
        showNotification('Failed to load announcement data', 'error');
    }
}

/**
 * Delete an announcement
 */
async function deleteAnnouncement(announcementId) {
    if (!confirm('Are you sure you want to delete this announcement?')) {
        return;
    }
    
    try {
        await apiCall(`/api/announcements/${announcementId}`, 'DELETE');
        loadAnnouncementsData();
        showNotification('Announcement deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting announcement:', error);
        showNotification(error.message || 'Failed to delete announcement', 'error');
    }
}

/**
 * Resend announcement notification
 */
async function resendAnnouncement(announcementId) {
    if (!confirm('Are you sure you want to resend this announcement to all users?')) {
        return;
    }
    
    try {
        await apiCall(`/api/announcements/${announcementId}/resend`, 'POST');
        showNotification('Announcement notification sent to all users', 'success');
    } catch (error) {
        console.error('Error resending announcement:', error);
        showNotification(error.message || 'Failed to resend announcement', 'error');
    }
}

/**
 * Initialize announcements management
 */
function initAnnouncementsManagement() {
    // Load announcements data
    loadAnnouncementsData();
    
    // Add search functionality
    const searchInput = document.getElementById('announcementsSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterAnnouncementsTable(this.value);
        });
    }
    
    // Add status filter functionality
    const statusFilter = document.getElementById('announcementsStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            filterAnnouncementsByStatus(this.value);
        });
    }
}

/**
 * Filter announcements table by search term
 */
function filterAnnouncementsTable(searchTerm) {
    const tableBody = document.getElementById('announcementsTableBody');
    if (!tableBody) return;
    
    const rows = tableBody.querySelectorAll('tr');
    const term = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
}

/**
 * Filter announcements by status
 */
function filterAnnouncementsByStatus(status) {
    const tableBody = document.getElementById('announcementsTableBody');
    if (!tableBody) return;
    
    const rows = tableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        if (!status) {
            row.style.display = '';
        } else {
            const statusBadge = row.querySelector('.status-badge');
            const rowStatus = statusBadge ? statusBadge.textContent.toLowerCase() : '';
            row.style.display = rowStatus === status ? '' : 'none';
        }
    });
}

/**
 * Initialize sidebar functionality
 */
// Duplicate initializeSidebar function removed - using initSidebar instead

/**
 * Toggle sidebar visibility for mobile menu
 */
function toggleSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    let overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar) {
        // Use the correct CSS class for mobile sidebar
        sidebar.classList.toggle('active');
        
        // Create or toggle overlay
        if (!overlay) {
            const newOverlay = document.createElement('div');
            newOverlay.className = 'sidebar-overlay';
            newOverlay.onclick = toggleSidebar;
            document.body.appendChild(newOverlay);
            overlay = newOverlay;
        }
        
        // Toggle overlay visibility
        if (sidebar.classList.contains('active')) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
            // Ensure overlay doesn't block navigation
            overlay.style.pointerEvents = 'none';
            setTimeout(() => {
                overlay.style.pointerEvents = '';
            }, 300);
        }
    }
}

/**
 * Export data to CSV
 * @param {string} type - The type of data to export (books, ebooks, projects, team, messages)
 */
async function exportToCSV(type) {
    try {
        showLoading();
        
        let data = [];
        let filename = '';
        let headers = [];
        
        switch (type) {
            case 'books':
                const booksResponse = await apiCall('/api/books');
                data = booksResponse.data || booksResponse;
                filename = 'books_export.csv';
                headers = ['Title', 'Author', 'Category', 'Price', 'Stock', 'Rating', 'Created Date'];
                break;
                
            case 'ebooks':
                const ebooksResponse = await apiCall('/api/ebooks');
                data = ebooksResponse.data || ebooksResponse;
                filename = 'ebooks_export.csv';
                headers = ['Title', 'Author', 'Category', 'Price', 'Downloads', 'Rating', 'Created Date'];
                break;
                
            case 'projects':
                const projectsResponse = await apiCall('/api/projects');
                data = projectsResponse.data || projectsResponse;
                filename = 'projects_export.csv';
                headers = ['Title', 'Category', 'Status', 'Start Date', 'End Date', 'Budget', 'Volunteers'];
                break;
                
            case 'team':
                const teamResponse = await apiCall('/api/team');
                data = teamResponse.data || teamResponse;
                filename = 'team_export.csv';
                headers = ['Name', 'Position', 'Department', 'Email', 'Phone', 'Status', 'Join Date'];
                break;
                
            case 'messages':
                const messagesResponse = await apiCall('/api/messages');
                data = messagesResponse.data || messagesResponse;
                filename = 'messages_export.csv';
                headers = ['Name', 'Email', 'Subject', 'Message', 'Date', 'Status'];
                break;
                
            case 'users':
                const usersResponse = await apiCall('/api/users');
                data = usersResponse.data || usersResponse;
                filename = 'users_export.csv';
                headers = ['Name', 'Email', 'Role', 'Status', 'Joined Date', 'Last Login'];
                break;
                
            // Removed project-participants export case (feature removed)
            // case 'project-participants':
            //     // Use the dedicated export function from project-participants-management.js
            //     if (typeof exportParticipantsCSV === 'function') {
            //         await exportParticipantsCSV();
            //         return; // Exit early as the function handles the export
            //     } else {
            //         throw new Error('Project participants export function not available');
            //     }
                
            default:
                throw new Error('Invalid export type');
        }
        
        if (!data || data.length === 0) {
            showNotification(`No ${type} data to export`, 'warning');
            return;
        }
        
        // Convert data to CSV format
        const csvContent = convertToCSV(data, headers, type);
        
        // Create and download the file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} data exported successfully`, 'success');
        
    } catch (error) {
        console.error('Error exporting data:', error);
        showNotification('Failed to export data. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Convert data array to CSV format
 * @param {Array} data - The data to convert
 * @param {Array} headers - The CSV headers
 * @param {string} type - The data type
 * @returns {string} CSV formatted string
 */
function convertToCSV(data, headers, type) {
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    data.forEach(item => {
        const row = [];
        
        switch (type) {
            case 'books':
                row.push(
                    `"${(item.title || '').replace(/"/g, '""')}"`,
                    `"${(item.author || '').replace(/"/g, '""')}"`,
                    `"${(item.category || '').replace(/"/g, '""')}"`,
                    `"${item.price || 0}"`,
                    `"${item.stock || item.stockQuantity || 0}"`,
                    `"${item.rating || 0}"`,
                    `"${new Date(item.createdAt || item.dateAdded).toLocaleDateString()}"`
                );
                break;
                
            case 'ebooks':
                row.push(
                    `"${(item.title || '').replace(/"/g, '""')}"`,
                    `"${(item.author || '').replace(/"/g, '""')}"`,
                    `"${(item.category || '').replace(/"/g, '""')}"`,
                    `"${item.price || 0}"`,
                    `"${item.downloads || 0}"`,
                    `"${item.rating || 0}"`,
                    `"${new Date(item.createdAt || item.dateAdded).toLocaleDateString()}"`
                );
                break;
                
            case 'projects':
                row.push(
                    `"${(item.title || '').replace(/"/g, '""')}"`,
                    `"${(item.category || '').replace(/"/g, '""')}"`,
                    `"${(item.status || '').replace(/"/g, '""')}"`,
                    `"${item.startDate ? new Date(item.startDate).toLocaleDateString() : ''}"`,
                    `"${item.endDate ? new Date(item.endDate).toLocaleDateString() : ''}"`,
                    `"${item.budget || 0}"`,
                    `"${item.volunteers || 0}"`
                );
                break;
                
            case 'team':
                row.push(
                    `"${(item.name || '').replace(/"/g, '""')}"`,
                    `"${(item.position || '').replace(/"/g, '""')}"`,
                    `"${(item.department || '').replace(/"/g, '""')}"`,
                    `"${(item.email || '').replace(/"/g, '""')}"`,
                    `"${(item.phone || '').replace(/"/g, '""')}"`,
                    `"${(item.status || '').replace(/"/g, '""')}"`,
                    `"${item.joinDate ? new Date(item.joinDate).toLocaleDateString() : new Date(item.createdAt).toLocaleDateString()}"`
                );
                break;
                
            case 'messages':
                row.push(
                    `"${(item.name || '').replace(/"/g, '""')}"`,
                    `"${(item.email || '').replace(/"/g, '""')}"`,
                    `"${(item.subject || '').replace(/"/g, '""')}"`,
                    `"${(item.message || '').replace(/"/g, '""')}"`,
                    `"${new Date(item.date || item.createdAt).toLocaleDateString()}"`,
                    `"${(item.status || (item.read ? 'read' : 'unread')).replace(/"/g, '""')}"`
                );
                break;
                
            case 'users':
                row.push(
                    `"${(item.name || '').replace(/"/g, '""')}"`
                    ,`"${(item.email || '').replace(/"/g, '""')}"`
                    ,`"${(item.role || 'user').replace(/"/g, '""')}"`
                    ,`"${(item.status || (item.is_active ? 'active' : 'inactive')).replace(/"/g, '""')}"`
                    ,`"${new Date(item.createdAt || item.dateJoined).toLocaleDateString()}"`
                    ,`"${item.lastLogin ? new Date(item.lastLogin).toLocaleDateString() : 'Never'}"`
                );
                break;
        }
        
        csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
}

/**
 * Handle logo upload
 * @param {File} file - The uploaded logo file
 */
async function handleLogoUpload(file) {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Please select a valid image file', 'error');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('File size must be less than 5MB', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('logo', file);
    
    try {
        const result = await apiCall('/api/admin/upload/logo', {
            method: 'POST',
            body: formData
        });
        
        // Update logo preview
        const logoPreview = document.getElementById('current-logo');
        if (logoPreview) {
            logoPreview.src = result.logoUrl;
        }
        
        showNotification('Logo updated successfully', 'success');
    } catch (error) {
        console.error('Error uploading logo:', error);
        showNotification('Failed to upload logo', 'error');
    }
}

/**
 * Initialize book management functionality
 */
function initBookManagement() {
    // Load books data
    loadBooksData();
    
    // Add event listener for add book form
    const addBookForm = document.getElementById('add-book-form');
    if (addBookForm) {
        addBookForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveBook(this);
        });
    }
    
    // Add event listener for book search
    const bookSearch = document.getElementById('booksSearch');
    if (bookSearch) {
        bookSearch.addEventListener('input', function() {
            filterBooks(this.value);
        });
    }
    
    // Add event listener for add book button
    const addBookBtn = document.getElementById('add-book-btn');
    if (addBookBtn) {
        addBookBtn.addEventListener('click', function() {
            showBookModal();
        });
    } else {
        console.log('Add book button not found - using onclick handler instead');
    }
}

/**
 * Load books data and populate the books table
 */
async function loadBooks() {
    try {
        const response = await apiCall('/api/books');
        const books = response.data || [];
        populateBooksTable(books);
    } catch (error) {
        console.error('Error loading books:', error);
        populateBooksTable([]);
    }
}



/**
 * Populate books table with data
 * @param {Array} books - Array of book objects
 */
function populateBooksTable(books) {
    const booksTableBody = document.getElementById('booksTableBody');
    if (!booksTableBody) {
        console.error('Books table body not found');
        return;
    }
    
    // Clear existing rows
    booksTableBody.innerHTML = '';
    
    // Add each book to the table
    books.forEach(book => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>
                <div class="book-info">
                    <img src="${book.image || 'assets/books/default-book.jpg'}" alt="${book.title}" class="book-thumbnail">
                    <div>
                        <div class="book-title">${book.title}</div>
                        <div class="book-author">${book.author}</div>
                    </div>
                </div>
            </td>
            <td>${book.category || 'General'}</td>
            <td>$${(book.price || 0).toFixed(2)}</td>
            <td>${book.stock || 0}</td>
            <td>${book.rating || 0} / 5</td>
            <td>
                <div class="book-actions">
                    <button class="btn-edit" data-book-id="${book._id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" data-book-id="${book._id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        booksTableBody.appendChild(row);
    });
    
    // Add event listeners to edit and delete buttons
    addBookActionListeners();
    
    // Re-initialize table sorting after populating data
    if (window.tableSorter) {
        setTimeout(() => {
            window.tableSorter.initializeSorting();
        }, 100);
    }
}

/**
 * Add event listeners to book action buttons
 */
function addBookActionListeners() {
    // Add event listeners to edit buttons
    const editButtons = document.querySelectorAll('.btn-edit');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const bookId = this.getAttribute('data-book-id');
            editBook(bookId);
        });
    });
    
    // Add event listeners to delete buttons
    const deleteButtons = document.querySelectorAll('.btn-delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const bookId = this.getAttribute('data-book-id');
            deleteBook(bookId);
        });
    });
}

/**
 * Show book modal for adding/editing
 * @param {Object} book - Book data for editing (optional)
 */
function showBookModal(book = null) {
    console.log('showBookModal called with book:', book);
    
    // Ensure DOM is ready with better error handling
    const ensureModalReady = (callback, retryCount = 0) => {
        const modal = document.getElementById('adminModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalFormContainer = document.getElementById('modalFormContainer');
        
        console.log('Modal elements check (attempt ' + (retryCount + 1) + '):', {
            modal: !!modal,
            modalTitle: !!modalTitle,
            modalFormContainer: !!modalFormContainer,
            documentReady: document.readyState
        });
        
        if (modal && modalTitle && modalFormContainer) {
            console.log('All modal elements found, proceeding...');
            callback();
        } else if (retryCount < 10) { // Reduced retries, will create fallback sooner
            console.log('Modal elements not ready, retrying in 100ms...');
            setTimeout(() => ensureModalReady(callback, retryCount + 1), 100);
        } else {
            console.warn('Modal elements not found, creating fallback modal...');
            createFallbackModal();
            callback();
        }
    };
    
    ensureModalReady(() => {
        console.log('Modal elements ready, proceeding...');
    
    const modal = document.getElementById('adminModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalFormContainer = document.getElementById('modalFormContainer');
    
    // Set modal title
    modalTitle.textContent = book ? 'Edit Book' : 'Add New Book';
    
    // Create book form HTML
    const formHTML = `
        <form id="bookForm" ${book ? `data-book-id="${book._id}"` : ''}>
            <div class="form-group">
                <label class="form-label">Title (English)</label>
                <input type="text" name="title" class="form-input" value="${book ? book.title || '' : ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Title (Tamil)</label>
                <input type="text" name="titleTamil" class="form-input" value="${book ? book.titleTamil || '' : ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Author (English)</label>
                <input type="text" name="author" class="form-input" value="${book ? book.author || '' : ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Author (Tamil)</label>
                <input type="text" name="authorTamil" class="form-input" value="${book ? book.authorTamil || '' : ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Category</label>
                <select name="category" class="form-input" required>
                    <option value="">Select Category</option>
                    <option value="literature" ${book && book.category === 'literature' ? 'selected' : ''}>Literature</option>
                    <option value="poetry" ${book && book.category === 'poetry' ? 'selected' : ''}>Poetry</option>
                    <option value="history" ${book && book.category === 'history' ? 'selected' : ''}>History</option>
                    <option value="culture" ${book && book.category === 'culture' ? 'selected' : ''}>Culture</option>
                    <option value="language" ${book && book.category === 'language' ? 'selected' : ''}>Language</option>
                    <option value="education" ${book && book.category === 'education' ? 'selected' : ''}>Education</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Price ($)</label>
                <input type="number" name="price" class="form-input" step="0.01" min="0" value="${book ? book.price || '' : ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Original Price ($)</label>
                <input type="number" name="originalPrice" class="form-input" step="0.01" min="0" value="${book ? book.originalPrice || '' : ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Stock Quantity</label>
                <input type="number" name="stockQuantity" class="form-input" min="0" value="${book ? book.stockQuantity || '' : ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Pages</label>
                <input type="number" name="pages" class="form-input" min="1" value="${book ? book.pages || '' : ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea name="description" class="form-textarea" rows="4">${book ? book.description || '' : ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Cover Image</label>
                <input type="file" name="coverImage" class="form-input" accept="image/*">
                ${book && book.coverImage ? `<div style="margin-top: 0.5rem;"><img src="${book.coverImage.startsWith('http') ? book.coverImage : book.coverImage.startsWith('/') ? 'http://localhost:8080' + book.coverImage : book.coverImage}" alt="Current cover" style="max-width: 100px; max-height: 100px; object-fit: cover; border-radius: 0.5rem;"></div>` : ''}
            </div>
            <div class="form-group">
                <label style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" name="featured" ${book && book.featured ? 'checked' : ''}>
                    Featured Book
                </label>
            </div>
            <div class="form-group">
                <label style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" name="bestseller" ${book && book.bestseller ? 'checked' : ''}>
                    Bestseller
                </label>
            </div>
            <div class="form-group">
                <label style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" name="newRelease" ${book && book.newRelease ? 'checked' : ''}>
                    New Release
                </label>
            </div>
            <div class="form-group">
                <label style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" name="inStock" ${book && book.inStock !== false ? 'checked' : ''}>
                    In Stock
                </label>
            </div>
            <div class="form-actions">
                <button type="button" onclick="closeModal()" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> ${book ? 'Update' : 'Add'} Book
                </button>
            </div>
        </form>
    `;
    
    // Set form HTML
    modalFormContainer.innerHTML = formHTML;
    
    // Add form submission handler
    const form = document.getElementById('bookForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveBook(form);
        });
    }
    
    // Show modal
    console.log('Showing modal...');
    modal.classList.add('show');
    modal.style.display = 'flex';
    console.log('Modal classes:', modal.className);
    console.log('Modal display style:', modal.style.display);
    console.log('Modal should now be visible');
    });
}

// closeModal function is defined later in the file

/**
 * Show ebook modal for adding/editing
 * @param {Object} ebook - Ebook data for editing (optional)
 */
function showEbookModal(ebook = null) {
    console.log('showEbookModal called with ebook:', ebook);
    
    // Ensure DOM is ready with better error handling
    const ensureModalReady = (callback, retryCount = 0) => {
        const modal = document.getElementById('adminModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalFormContainer = document.getElementById('modalFormContainer');
        
        console.log('Modal elements check for ebook (attempt ' + (retryCount + 1) + '):', {
            modal: !!modal,
            modalTitle: !!modalTitle,
            modalFormContainer: !!modalFormContainer,
            documentReady: document.readyState
        });
        
        if (modal && modalTitle && modalFormContainer) {
            console.log('All modal elements found for ebook, proceeding...');
            callback();
        } else if (retryCount < 10) { // Reduced retries, will create fallback sooner
            console.log('Modal elements not ready for ebook, retrying in 100ms...');
            setTimeout(() => ensureModalReady(callback, retryCount + 1), 100);
        } else {
            console.warn('Modal elements not found for ebook, creating fallback modal...');
            createFallbackModal();
            callback();
        }
    };
    
    ensureModalReady(() => {
    
    const modal = document.getElementById('adminModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalFormContainer = document.getElementById('modalFormContainer');
    
    // Set modal title
    modalTitle.textContent = ebook ? 'Edit E-book' : 'Add New E-book';
    
    // Create ebook form HTML
    const formHTML = `
        <form id="ebookForm" ${ebook ? `data-ebook-id="${ebook._id}"` : ''}>
            <div class="form-group">
                <label class="form-label">Title (English)</label>
                <input type="text" name="title" class="form-input" value="${ebook ? ebook.title || '' : ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Title (Tamil)</label>
                <input type="text" name="titleTamil" class="form-input" value="${ebook ? ebook.titleTamil || '' : ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Author (English)</label>
                <input type="text" name="author" class="form-input" value="${ebook ? ebook.author || '' : ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Author (Tamil)</label>
                <input type="text" name="authorTamil" class="form-input" value="${ebook ? ebook.authorTamil || '' : ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Category</label>
                <select name="category" class="form-input" required>
                    <option value="">Select Category</option>
                    <option value="literature" ${ebook && ebook.category === 'literature' ? 'selected' : ''}>Literature</option>
                    <option value="poetry" ${ebook && ebook.category === 'poetry' ? 'selected' : ''}>Poetry</option>
                    <option value="history" ${ebook && ebook.category === 'history' ? 'selected' : ''}>History</option>
                    <option value="culture" ${ebook && ebook.category === 'culture' ? 'selected' : ''}>Culture</option>
                    <option value="language" ${ebook && ebook.category === 'language' ? 'selected' : ''}>Language</option>
                    <option value="education" ${ebook && ebook.category === 'education' ? 'selected' : ''}>Education</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">File Size (MB)</label>
                <input type="number" name="fileSize" class="form-input" step="0.1" min="0" value="${ebook ? ebook.fileSize || '' : ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Pages</label>
                <input type="number" name="pages" class="form-input" min="1" value="${ebook ? ebook.pages || '' : ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea name="description" class="form-textarea" rows="4">${ebook ? ebook.description || '' : ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Cover Image</label>
                <input type="file" name="coverImage" class="form-input" accept="image/*">
                ${ebook && ebook.coverImage ? `<div style="margin-top: 0.5rem;"><img src="${ebook.coverImage.startsWith('http') ? ebook.coverImage : ebook.coverImage.startsWith('/') ? 'http://localhost:8080' + ebook.coverImage : ebook.coverImage}" alt="Current cover" style="max-width: 100px; max-height: 100px; object-fit: cover; border-radius: 0.5rem;"></div>` : ''}
            </div>
            <div class="form-group">
                <label class="form-label">E-book File (PDF)</label>
                <input type="file" name="ebookFile" class="form-input" accept=".pdf">
                ${ebook && ebook.downloadUrl ? `<div style="margin-top: 0.5rem; color: #059669;">Current file: ${ebook.title}.pdf</div>` : ''}
            </div>
            <div class="form-group">
                <label class="form-label">Download URL (Alternative to file upload)</label>
                <input type="url" name="downloadUrl" class="form-input" value="${ebook ? ebook.downloadUrl || '' : ''}" placeholder="https://example.com/ebook.pdf">
                <small style="color: var(--text-tertiary); font-size: 0.875rem;">Provide either a file upload or a download URL</small>
            </div>
            <div class="form-group">
                <label style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" name="featured" ${ebook && ebook.featured ? 'checked' : ''}>
                    Featured E-book
                </label>
            </div>
            <div class="form-group">
                <label style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" name="bestseller" ${ebook && ebook.bestseller ? 'checked' : ''}>
                    Bestseller
                </label>
            </div>
            <div class="form-actions">
                <button type="button" onclick="closeModal()" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> ${ebook ? 'Update' : 'Add'} E-book
                </button>
            </div>
        </form>
    `;
    
    // Set form HTML
        modalFormContainer.innerHTML = formHTML;
        
        // Add form submission handler
        const form = document.getElementById('ebookForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await saveEbook(form);
            });
        }
        
        // Show modal
        modal.classList.add('show');
        modal.style.display = 'flex';
    });
}

// Duplicate showProjectModal function removed to resolve conflicts

/**
 * Show content modal for editing website content
 * @param {Object} content - Content data for editing (optional)
 */
function showContentModal(content = null) {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => showContentModal(content));
        return;
    }
    
    const modal = document.getElementById('adminModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalFormContainer = document.getElementById('modalFormContainer');
    
    console.log('Content Modal elements check:', {
        modal: !!modal,
        modalTitle: !!modalTitle,
        modalFormContainer: !!modalFormContainer
    });
    
    if (!modal || !modal || !modalTitle || !modalFormContainer) {
        console.error('Modal elements not found', {
            modal: modal,
            modalTitle: modalTitle,
            modalFormContainer: modalFormContainer
        });
        return;
    }
    
    // Add content-display-modal class for proper dark theme styling
    modal.classList.add('content-display-modal');
    
    // Set modal title
    modalTitle.textContent = content ? 'Edit Website Content' : 'Add Website Content';
    
    // Create content form HTML
    const isEdit = !!content;
    const title = content?.title || 'New Content';
    const page = content?.page || 'Website';
    const section = content?.section || 'Section';
    const status = content?.active !== false ? 'Active' : 'Inactive';
    
    const formHTML = `
        <div class="modal-product-card">
            <div class="modal-product-image">
                <i class="fas fa-file-alt"></i>
            </div>
            <h3 class="modal-product-title">${title}</h3>
            <p class="modal-product-author">${page} - ${section}</p>
            <p class="modal-product-price">${status}</p>
        </div>
        
        <form id="contentForm" class="modern-form" ${content ? `data-content-id="${content._id}"` : ''}>
            <div class="modern-form-group">
                <label class="modern-form-label required">Page</label>
                <select name="page" class="modern-form-select" required>
                    <option value="">Select Page</option>
                    <option value="home" ${content && content.page === 'home' ? 'selected' : ''}>Home</option>
                    <option value="about" ${content && content.page === 'about' ? 'selected' : ''}>About</option>
                    <option value="contact" ${content && content.page === 'contact' ? 'selected' : ''}>Contact</option>
                    <option value="books" ${content && content.page === 'books' ? 'selected' : ''}>Books</option>
                    <option value="ebooks" ${content && content.page === 'ebooks' ? 'selected' : ''}>E-books</option>
                    <option value="projects" ${content && content.page === 'projects' ? 'selected' : ''}>Projects</option>
                </select>
            </div>
            <div class="modern-form-group">
                <label class="modern-form-label required">Section</label>
                <input type="text" name="section" class="modern-form-input" placeholder="Enter section name" value="${content ? content.section || '' : ''}" required>
            </div>
            <div class="modern-form-group">
                <label class="modern-form-label required">Title (English)</label>
                <input type="text" name="title" class="modern-form-input" placeholder="Enter title in English" value="${content ? content.title || '' : ''}" required>
            </div>
            <div class="modern-form-group">
                <label class="modern-form-label">Title (Tamil)</label>
                <input type="text" name="titleTamil" class="modern-form-input" placeholder="Enter title in Tamil" value="${content ? content.titleTamil || '' : ''}">
            </div>
            <div class="modern-form-group">
                <label class="modern-form-label">Content (English)</label>
                <textarea name="content" class="modern-form-textarea" rows="6" placeholder="Enter content in English">${content ? content.content || '' : ''}</textarea>
            </div>
            <div class="modern-form-group">
                <label class="modern-form-label">Content (Tamil)</label>
                <textarea name="contentTamil" class="modern-form-textarea" rows="6" placeholder="Enter content in Tamil">${content ? content.contentTamil || '' : ''}</textarea>
            </div>
            <div class="modern-form-group">
                <label class="modern-form-label">Order</label>
                <input type="number" name="order" class="modern-form-input" min="0" placeholder="Display order" value="${content ? content.order || 0 : 0}">
            </div>
            <div class="modern-form-group">
                <label class="modern-form-checkbox">
                    <input type="checkbox" name="active" ${content && content.active !== false ? 'checked' : ''}>
                    <span class="modern-form-checkbox-mark"></span>
                    Active
                </label>
            </div>
            <div class="modern-form-actions">
                <button type="button" onclick="closeModal()" class="modern-btn modern-btn-secondary">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button type="submit" class="modern-btn modern-btn-primary">
                    <i class="fas fa-save"></i> ${content ? 'Update' : 'Add'} Content
                </button>
            </div>
        </form>
    `;
    
    // Set form HTML
        modalFormContainer.innerHTML = formHTML;
        
        // Add form submission handler
        const form = document.getElementById('contentForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await saveContent(form);
            });
        }
        
        // Show modal
        modal.classList.add('show');
        modal.style.display = 'flex';
}

/**
 * Add a new book or update existing book
 * @param {HTMLFormElement} form - The book form
 */
async function saveBook(form) {
    const formData = new FormData(form);
    const bookId = form.getAttribute('data-book-id');
    const isEdit = !!bookId;
    
    // Convert checkbox values to proper booleans
    const booleanFields = ['featured', 'bestseller', 'newRelease', 'inStock'];
    booleanFields.forEach(field => {
        const checkbox = form.querySelector(`[name="${field}"]`);
        if (checkbox) {
            formData.set(field, checkbox.checked ? 'true' : 'false');
        }
    });
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitButton.disabled = true;
    
    try {
        const url = isEdit ? `/api/books/${bookId}` : '/api/books';
        const method = isEdit ? 'PUT' : 'POST';
        
        const result = await apiCall(url, {
            method: method,
            body: formData
        });
        
        // Close modal
        closeModal();
        
        // Reload books table
        loadBooksData();
        
        // Show success message
        showNotification(`Book ${isEdit ? 'updated' : 'added'} successfully`, 'success');
    } catch (error) {
        console.error('Error saving book:', error);
        showNotification(error.message || 'Failed to save book', 'error');
    } finally {
        // Reset button state
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
    }
}

/**
 * Edit a book
 * @param {string} bookId - The ID of the book to edit
 */
async function editBook(bookId) {
    try {
        const response = await apiCall(`/api/books/${bookId}`);
        const book = response.data || response;
        showBookModal(book);
    } catch (error) {
        console.error('Error loading book:', error);
        showNotification('Failed to load book data', 'error');
    }
}

/**
 * Delete a book
 * @param {string} bookId - The ID of the book to delete
 */
async function deleteBook(bookId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this book?')) return;
    
    try {
        await apiCall(`/api/books/${bookId}`, {
            method: 'DELETE'
        });
        
        // Reload books table
        loadBooksData();
        
        // Show success message
        showNotification('Book deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting book:', error);
        showNotification(error.message || 'Failed to delete book', 'error');
    }
}

/**
 * Filter books based on search query
 * @param {string} query - The search query
 */
function filterBooks(query) {
    query = query.toLowerCase();
    
    // Get all book rows
    const bookRows = document.querySelectorAll('#booksTableBody tr');
    
    // Show/hide rows based on search query
    bookRows.forEach(row => {
        if (row.cells && row.cells.length > 1) {
            // Get title and author from the nested div elements in the first column
            const titleElement = row.querySelector('.book-title');
            const authorElement = row.querySelector('.book-author');
            const title = titleElement ? titleElement.textContent.toLowerCase() : '';
            const author = authorElement ? authorElement.textContent.toLowerCase() : '';
            const category = row.cells[1].textContent.toLowerCase(); // Category is in column 2
            
            if (title.includes(query) || author.includes(query) || category.includes(query)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

/**
 * Initialize user management functionality
 */
function initUserManagement() {
    // Load users data
    loadUsers();
    
    // Add event listener for user search
    const userSearch = document.querySelector('#users-section input[type="text"]');
    if (userSearch) {
        userSearch.addEventListener('input', function() {
            filterUsers(this.value);
        });
    }
    
    // Add event listener for user role filter
    const roleFilter = document.querySelector('#users-section select');
    if (roleFilter) {
        roleFilter.addEventListener('change', function() {
            filterUsersByRole(this.value);
        });
    }
    
    // Add event listener for add user button
    const addUserButton = document.querySelector('#users-section .btn-primary');
    if (addUserButton) {
        addUserButton.addEventListener('click', function() {
            showAddUserModal();
        });
    }
}

/**
 * Load users data and populate the users table
 */
async function loadUsers() {
    try {
        const response = await apiCall('/api/users');
        const users = response.data || [];
        
        // Store users in window object for later use
        window.adminUsers = users;
        
        // Populate the users table
        populateUsersTable(users);
    } catch (error) {
        console.error('Error loading users:', error);
        window.adminUsers = [];
        populateUsersTable([]);
    }
}

/**
 * Populate users table with data
 * @param {Array} users - Array of user objects
 */
function populateUsersTable(users) {
    const usersTableBody = document.querySelector('#users-table tbody');
    if (!usersTableBody) return;
    
    // Clear existing rows
    usersTableBody.innerHTML = '';
    
    if (users.length === 0) {
        usersTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-tertiary);">No users found</td></tr>';
        return;
    }
    
    // Add each user to the table
    users.forEach(user => {
        const row = document.createElement('tr');
        
        const statusClass = user.status === 'active' ? 'status-active' : 'status-inactive';
        const roleClass = user.role === 'admin' ? 'role-admin' : 'role-user';
        
        row.innerHTML = `
            <td>
                <input type="checkbox" class="user-checkbox" value="${user._id}" onchange="updateBulkOperationsVisibility()">
            </td>
            <td>
                <div class="user-info">
                    <div class="user-avatar">
                        ${user.avatar ? `<img src="${user.avatar}" alt="${user.name}">` : `<div class="avatar-placeholder">${getInitials(user.name)}</div>`}
                    </div>
                    <div class="user-name">${user.name}</div>
                </div>
            </td>
            <td class="user-email">${user.email}</td>
            <td>
                <span class="user-role ${roleClass}">${user.role}</span>
            </td>
            <td>
                <span class="user-status ${statusClass}">${user.status}</span>
            </td>
            <td>${user.joinedDate ? new Date(user.joinedDate).toLocaleDateString() : 'N/A'}</td>
            <td>
                <div class="user-actions">
                    <button class="btn-edit" onclick="editUser('${user._id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteUser('${user._id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        usersTableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    addUserActionListeners();
    
    // Re-initialize table sorting after populating data
    if (window.tableSorter) {
        setTimeout(() => {
            window.tableSorter.initializeSorting();
        }, 100);
    }
}

/**
 * Add event listeners to user action buttons
 */
function addUserActionListeners() {
    // Edit buttons
    const editButtons = document.querySelectorAll('.btn-edit');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            editUser(userId);
        });
    });
    
    // Delete buttons
    const deleteButtons = document.querySelectorAll('.btn-delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            deleteUser(userId);
        });
    });
}

/**
 * Filter users based on search query
 * @param {string} query - The search query
 */
function filterUsers(query) {
    query = query.toLowerCase();
    
    // Get all user rows
    const userRows = document.querySelectorAll('#usersTableBody tr');
    
    // Show/hide rows based on search query
    userRows.forEach(row => {
        if (row.cells && row.cells.length > 1) {
            const name = row.cells[0].textContent.toLowerCase(); // Name is in column 1
            const email = row.cells[1].textContent.toLowerCase(); // Email is in column 2
            const role = row.cells[2].textContent.toLowerCase(); // Role is in column 3
            
            if (name.includes(query) || email.includes(query) || role.includes(query)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

/**
 * Filter users based on role
 * @param {string} role - The role to filter by
 */
function filterUsersByRole(role) {
    // Get all user rows
    const userRows = document.querySelectorAll('#usersTableBody tr');
    
    // Show/hide rows based on role
    userRows.forEach(row => {
        if (row.cells && row.cells.length > 2) {
            const userRole = row.cells[2].textContent.toLowerCase(); // Role is in column 3
            
            if (role === 'all' || userRole.includes(role.toLowerCase())) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

/**
 * Show modal for adding a new user
 */
function showAddUserModal() {
    const modal = document.getElementById('adminModal');
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add New User</h2>
                <span class="close" onclick="closeModal()">&times;</span>
            </div>
            <div class="modal-body">
                <form id="addUserForm" class="blue-gradient-form" onsubmit="handleAddUserSubmit(event)">
                    <div class="form-group">
                        <label class="form-label">Name *</label>
                        <input type="text" class="form-input" name="name" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email *</label>
                        <input type="email" class="form-input" name="email" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password *</label>
                        <input type="password" class="form-input" name="password" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Role</label>
                        <select class="form-input" name="role">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select class="form-input" name="status">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Add User</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
    modal.style.display = 'flex';
}

/**
 * Handle add user form submission
 */
async function handleAddUserSubmit(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const userData = Object.fromEntries(formData.entries());
        
        const response = await apiCall('/api/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (response.success !== false) {
            showNotification('User added successfully!', 'success');
            closeModal();
            loadUsersData(); // Reload users data
        } else {
            showNotification('Error adding user: ' + (response.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error adding user:', error);
        showNotification('Error adding user. Please try again.', 'error');
    }
}

/**
 * Show bulk operations modal for users
 */
function showBulkOperationsModal(operation) {
    const selectedUsers = getSelectedUsers();
    
    if (selectedUsers.length === 0) {
        showNotification('Please select users to perform bulk operations', 'warning');
        return;
    }
    
    const modal = document.getElementById('bulkOperationsModal');
    const title = document.getElementById('bulkOperationTitle');
    const message = document.getElementById('bulkOperationMessage');
    const usersList = document.getElementById('selectedUsersList');
    
    // Set operation type
    modal.dataset.operation = operation;
    
    // Update modal content based on operation
    let operationText = '';
    switch (operation) {
        case 'activate':
            operationText = 'activate';
            break;
        case 'deactivate':
            operationText = 'deactivate';
            break;
        case 'delete':
            operationText = 'delete';
            break;
    }
    
    title.textContent = `Bulk ${operationText.charAt(0).toUpperCase() + operationText.slice(1)} Users`;
    message.textContent = `Are you sure you want to ${operationText} ${selectedUsers.length} selected user(s)?`;
    
    // Populate selected users list
    usersList.innerHTML = selectedUsers.map(user => 
        `<div style="padding: 0.5rem; border-bottom: 1px solid var(--border-secondary);">
            <strong>${user.name}</strong><br>
            <small style="color: var(--text-secondary);">${user.email}</small>
        </div>`
    ).join('');
    
    modal.style.display = 'flex';
}

/**
 * Get selected users from checkboxes
 */
function getSelectedUsers() {
    const selectedUsers = [];
    const checkboxes = document.querySelectorAll('#usersTableBody input[type="checkbox"]:checked');
    
    checkboxes.forEach(checkbox => {
        const row = checkbox.closest('tr');
        if (row && row.cells) {
            selectedUsers.push({
                id: checkbox.value,
                name: row.cells[1].textContent, // Assuming name is in column 1 (after checkbox)
                email: row.cells[2].textContent // Assuming email is in column 2
            });
        }
    });
    
    return selectedUsers;
}

/**
 * Perform bulk operation on selected users
 */
async function performBulkOperation(action) {
    const selectedUsers = getSelectedUsers();
    const userIds = selectedUsers.map(user => user.id);
    
    if (userIds.length === 0) {
        showNotification('No users selected', 'warning');
        return;
    }
    
    let confirmMessage = '';
    switch (action) {
        case 'activate':
            confirmMessage = `Are you sure you want to activate ${userIds.length} users?`;
            break;
        case 'deactivate':
            confirmMessage = `Are you sure you want to deactivate ${userIds.length} users?`;
            break;
        case 'delete':
            confirmMessage = `Are you sure you want to delete ${userIds.length} users? This action cannot be undone.`;
            break;
    }
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        showLoading();
        const response = await apiCall('/api/users/bulk', {
            method: 'POST',
            body: JSON.stringify({
                action: action,
                userIds: userIds
            })
        });
        
        if (response.success !== false) {
            showNotification(response.message || `Bulk ${action} completed successfully`, 'success');
            closeModal();
            loadUsersData(); // Reload users data
        } else {
            showNotification('Error performing bulk operation: ' + (response.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error performing bulk operation:', error);
        showNotification('Error performing bulk operation. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Initialize team management functionality
 */
function initTeamManagement() {
    console.log('Team management initialized');
    
    // Initialize team search functionality
    const teamSearch = document.getElementById('team-search');
    if (teamSearch) {
        teamSearch.addEventListener('input', function() {
            filterTeamMembers(this.value);
        });
    }
    
    // Initialize team position filter
    const teamPositionFilter = document.getElementById('team-position-filter');
    if (teamPositionFilter) {
        teamPositionFilter.addEventListener('change', function() {
            filterTeamMembersByPosition(this.value);
        });
    }
    
    // Load team members data when initialized
    if (typeof loadTeamMembers === 'function') {
        loadTeamMembers();
    }
}

// filterTeamMembers function is defined later in the file

/**
 * Filter team members by position
 */
function filterTeamMembersByPosition(position) {
    const rows = document.querySelectorAll('#teamTableBody tr');
    
    rows.forEach(row => {
        if (position === '') {
            row.style.display = '';
        } else {
            const rowPosition = row.cells[2]?.textContent.toLowerCase() || '';
            row.style.display = rowPosition.includes(position) ? '' : 'none';
        }
    });
}

/**
 * Initialize settings management functionality
 */
function initSettingsManagement() {
    // Add event listeners for settings form submissions
    const settingsForms = document.querySelectorAll('.settings-card form');
    settingsForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            saveSettings(this);
        });
    });
    
    // Add event listeners for logo and favicon upload buttons
    const uploadButtons = document.querySelectorAll('.settings-card .btn-secondary');
    uploadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const type = this.textContent.includes('Logo') ? 'logo' : 'favicon';
            showFileUploadDialog(type);
        });
    });
}

/**
 * Save settings from a form
 * @param {HTMLFormElement} form - The form containing settings
 */
function saveSettings(form) {
    // Get form data
    const formData = new FormData(form);
    const settingsType = form.closest('.settings-card').querySelector('h3').textContent;
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitButton.disabled = true;
    
    // In a real application, this would be an API call
    // For now, simulate a server request
    setTimeout(() => {
        // Reset button state
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
        
        // Show success message
        showNotification(`${settingsType} updated successfully`, 'success');
    }, 1500);
}

/**
 * Show file upload dialog for logo or favicon
 * @param {string} type - The type of file to upload ('logo' or 'favicon')
 */
function showFileUploadDialog(type) {
    // In a real application, this would open a file dialog
    // For now, just show a notification
    showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} upload functionality would open a file dialog here`, 'info');
}

/**
 * Initialize contact message handling functionality
 */


// showNotification function is provided by main.js

/**
 * Get initials from a name
 * @param {string} name - The name to get initials from
 * @returns {string} The initials
 */
function getInitials(name) {
    return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// openModal function is defined later in the file

// closeModal function is defined later in the file

/**
 * Get book form HTML
 */
function getBookForm() {
    return `
        <form id="bookForm" class="blue-gradient-form" onsubmit="handleBookFormSubmit(event)">
            <div class="form-group">
                <label class="form-label">Title *</label>
                <input type="text" class="form-input" name="title" required>
            </div>
            <div class="form-group">
                <label class="form-label">Author *</label>
                <input type="text" class="form-input" name="author" required>
            </div>
            <div class="form-group">
                <label class="form-label">Category *</label>
                <select class="form-input" name="category" required>
                    <option value="">Select Category</option>
                    <option value="fiction">Fiction</option>
                    <option value="non-fiction">Non-Fiction</option>
                    <option value="poetry">Poetry</option>
                    <option value="drama">Drama</option>
                    <option value="children">Children's Books</option>
                    <option value="academic">Academic</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Price (Leave empty for free)</label>
                <input type="number" class="form-input" name="price" step="0.01" placeholder="0.00">
            </div>
            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-textarea" name="description" id="bookDescription" rows="4"></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Cover Image</label>
                <input type="file" class="form-input" name="coverImage" accept="image/*">
            </div>
            <div class="form-group">
                <label class="form-label">Status</label>
                <select class="form-input" name="status">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" name="featured"> Featured Book
                </label>
            </div>
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" name="bestseller"> Bestseller
                </label>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Book</button>
            </div>
        </form>
    `;
}

/**
 * Get ebook form HTML
 */
function getEbookForm() {
    return `
        <form id="ebookForm" class="blue-gradient-form" onsubmit="handleEbookFormSubmit(event)">
            <div class="form-group">
                <label class="form-label">Title *</label>
                <input type="text" class="form-input" name="title" required>
            </div>
            <div class="form-group">
                <label class="form-label">Author *</label>
                <input type="text" class="form-input" name="author" required>
            </div>
            <div class="form-group">
                <label class="form-label">Category *</label>
                <select class="form-input" name="category" required>
                    <option value="">Select Category</option>
                    <option value="fiction">Fiction</option>
                    <option value="non-fiction">Non-Fiction</option>
                    <option value="poetry">Poetry</option>
                    <option value="drama">Drama</option>
                    <option value="children">Children's Books</option>
                    <option value="academic">Academic</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-textarea" name="description" id="ebookDescription" rows="4"></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Cover Image</label>
                <input type="file" class="form-input" name="coverImage" accept="image/*">
            </div>
            <div class="form-group">
                <label class="form-label">E-Book File (PDF/EPUB/MOBI/TXT) *</label>
                <input type="file" class="form-input" name="ebookFile" accept=".pdf,.epub,.mobi,.txt" required onchange="detectFileFormat(this)">
            </div>
            <div class="form-group">
                <label class="form-label">File Format *</label>
                <select class="form-input" name="fileFormat" required>
                    <option value="">Select Format</option>
                    <option value="PDF">PDF</option>
                    <option value="EPUB">EPUB</option>
                    <option value="MOBI">MOBI</option>
                    <option value="TXT">TXT</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Pages</label>
                <input type="number" class="form-input" name="pages" min="1" placeholder="Number of pages">
            </div>
            <div class="form-group">
                <label class="form-label">Status</label>
                <select class="form-input" name="status">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" name="featured"> Featured E-Book
                </label>
            </div>
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" name="bestseller"> Bestseller
                </label>
            </div>
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" name="isFree"> Free E-Book
                </label>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Add E-Book</button>
            </div>
        </form>
    `;
}

/**
 * Get project form HTML
 */
function getProjectForm() {
    return `
        <form id="projectForm" class="blue-gradient-form" onsubmit="handleProjectFormSubmit(event)">
            <div class="form-group">
                <label class="form-label">Title (English) *</label>
                <input type="text" class="form-input" name="title" required>
            </div>
            <div class="form-group">
                <label class="form-label">Title (Tamil)</label>
                <input type="text" class="form-input" name="titleTamil" style="font-family: 'Noto Sans Tamil', Tamil, serif;">
            </div>
            <div class="form-group">
                <label class="form-label">Category *</label>
                <select class="form-input" name="category" required>
                    <option value="">Select Category</option>
                    <option value="education">Education</option>
                    <option value="cultural-preservation">Cultural Preservation</option>
                    <option value="language-development">Language Development</option>
                    <option value="community-outreach">Community Outreach</option>
                    <option value="research">Research</option>
                    <option value="technology">Technology</option>
                    <option value="publishing">Publishing</option>
                    <option value="events">Events</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Budget (RM)</label>
                <input type="number" class="form-input" name="budget" step="0.01" placeholder="Enter amount in RM">
            </div>
            <div class="form-group">
                <label class="form-label">Status</label>
                <select class="form-input" name="status">
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Start Date</label>
                <input type="date" class="form-input" name="startDate">
            </div>
            <div class="form-group">
                <label class="form-label">End Date</label>
                <input type="date" class="form-input" name="endDate">
            </div>
            <div class="form-group">
                <label class="form-label">Description (English)</label>
                <textarea class="form-textarea" name="description" id="projectDescription" rows="4"></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Description (Tamil)</label>
                <textarea class="form-textarea" name="descriptionTamil" id="projectDescriptionTamil" rows="4" style="font-family: 'Noto Sans Tamil', Tamil, serif;"></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Progress (%)</label>
                <input type="number" class="form-input" name="progress" min="0" max="100" value="0">
            </div>
            <div class="form-group">
                <label style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" name="featured">
                    Featured Project
                </label>
            </div>
            <div class="form-group">
                <label class="form-label">Project Image</label>
                <input type="file" class="form-input" name="projectImage" accept="image/*">
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Project</button>
            </div>
        </form>
    `;
}

/**
 * Get content form HTML
 */
function getContentForm() {
    return `
        <form id="contentForm" class="blue-gradient-form" onsubmit="handleContentFormSubmit(event)">
            <div class="form-group">
                <label class="form-label">Site Title</label>
                <input type="text" class="form-input" name="siteTitle" value="Tamil Language Society">
            </div>
            <div class="form-group">
                <label class="form-label">Site Description</label>
                <textarea class="form-textarea" name="siteDescription" rows="3">Promoting Tamil language and culture through education and community engagement</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Contact Email</label>
                <input type="email" class="form-input" name="contactEmail" value="info@tamilsociety.org">
            </div>
            <div class="form-group">
                <label class="form-label">Site Logo</label>
                <input type="file" class="form-input" name="logo" accept="image/*">
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Update Content</button>
            </div>
        </form>
    `;
}

/**
 * Edit user function
 */
async function editUser(userId) {
    try {
        const response = await apiCall(`/api/users/${userId}`);
        const user = response.data || response;
        
        // Populate edit user form with current data
        const modal = document.getElementById('adminModal');
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit User</h2>
                    <span class="close" onclick="closeModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="editUserForm" class="blue-gradient-form" onsubmit="handleEditUserSubmit(event, '${userId}')">
                        <div class="form-group">
                            <label class="form-label">Name *</label>
                            <input type="text" class="form-input" name="name" value="${user.name}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email *</label>
                            <input type="email" class="form-input" name="email" value="${user.email}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Role</label>
                            <select class="form-input" name="role">
                                <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Status</label>
                            <select class="form-input" name="status">
                                <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                                <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary">Update User</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        modal.classList.add('show');
        modal.style.display = 'flex';
    } catch (error) {
        console.error('Error loading user:', error);
        alert('Error loading user data');
    }
}

/**
 * Handle edit user form submission
 */
async function handleEditUserSubmit(event, userId) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const userData = Object.fromEntries(formData.entries());
        
        const response = await apiCall(`/api/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
        
        if (response.success !== false) {
            alert('User updated successfully!');
            closeModal();
            loadUsersData(); // Reload users data
        } else {
            alert('Error updating user: ' + (response.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating user:', error);
        alert('Error updating user');
    }
}

/**
 * Edit content function
 */
async function editContent(contentId) {
    try {
        // Switch to website content section if not already there
        const websiteContentSection = document.getElementById('website-content');
        if (websiteContentSection) {
            // Hide all sections
            document.querySelectorAll('.admin-section').forEach(section => {
                section.style.display = 'none';
            });
            
            // Show website content section
            websiteContentSection.style.display = 'block';
            
            // Update sidebar active state
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            const websiteContentNav = document.querySelector('[data-section="website-content"]');
            if (websiteContentNav) {
                websiteContentNav.classList.add('active');
            }
            
            // Initialize content editor if not already done
            if (typeof window.contentEditor === 'undefined') {
                // Content editor script is already included in HTML
                if (typeof ContentEditor !== 'undefined') {
                    window.contentEditor = new ContentEditor();
                    if (typeof window.contentEditor.init === 'function') {
                        window.contentEditor.init();
                    }
                    // After initialization, edit the specific content
                    setTimeout(() => {
                        if (window.contentEditor && window.contentEditor.editSection) {
                            window.contentEditor.editSection(contentId);
                        }
                    }, 500);
                } else {
                    console.warn('ContentEditor class not available for editing content');
                    // Provide fallback functionality
                    showNotification('Content editor is not available. Please refresh the page and try again.', 'warning');
                    return;
                }
            } else {
                // Content editor already initialized, edit the content
                if (window.contentEditor && window.contentEditor.editSection) {
                    window.contentEditor.editSection(contentId);
                }
            }
        } else {
            // Fallback to modal if website content section not found
            const response = await apiCall(`/api/content/${contentId}`);
            const content = response.data || response;
            
            const modal = document.getElementById('adminModal');
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Edit Content</h2>
                        <span class="close" onclick="closeModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="editContentForm" class="blue-gradient-form" onsubmit="handleEditContentSubmit(event, '${contentId}')">
                            <div class="form-group">
                                <label class="form-label">Page *</label>
                                <select class="form-input" name="page" required>
                                    <option value="homepage" ${content.page === 'homepage' ? 'selected' : ''}>Homepage</option>
                                    <option value="about" ${content.page === 'about' ? 'selected' : ''}>About</option>
                                    <option value="contact" ${content.page === 'contact' ? 'selected' : ''}>Contact</option>
                                    <option value="books" ${content.page === 'books' ? 'selected' : ''}>Books</option>
                                    <option value="projects" ${content.page === 'projects' ? 'selected' : ''}>Projects</option>
                                    <option value="ebooks" ${content.page === 'ebooks' ? 'selected' : ''}>E-books</option>
                                    <option value="global" ${content.page === 'global' ? 'selected' : ''}>Global</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Section *</label>
                                <input type="text" class="form-input" name="section" value="${content.section || ''}" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Title *</label>
                                <input type="text" class="form-input" name="title" value="${content.title || ''}" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Content (English)</label>
                                <textarea class="form-textarea" name="content" rows="6">${typeof content.content === 'object' ? (content.content?.english?.text || content.content?.text || content.content?.content || JSON.stringify(content.content, null, 2)) : (content.content || '')}</textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Content (Tamil)</label>
                                <textarea class="form-textarea tamil-text" name="contentTamil" rows="6" style="font-family: 'Noto Sans Tamil', sans-serif;">${typeof content.contentTamil === 'object' ? (content.contentTamil?.tamil?.text || content.contentTamil?.text || content.contentTamil?.content || JSON.stringify(content.contentTamil, null, 2)) : (content.contentTamil || '')}</textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Status</label>
                                <select class="form-input" name="isActive">
                                    <option value="true" ${content.isActive ? 'selected' : ''}>Active</option>
                                    <option value="false" ${!content.isActive ? 'selected' : ''}>Inactive</option>
                                </select>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                                <button type="submit" class="btn btn-primary">Update Content</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            modal.classList.add('show');
            modal.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error loading content:', error);
        showNotification('Error loading content data', 'error');
    }
}

// Make editContent function available globally
window.editContent = editContent;

/**
 * Handle edit content form submission
 */
async function handleEditContentSubmit(event, contentId) {
    event.preventDefault();
    
    try {
        showLoading();
        const formData = new FormData(event.target);
        const contentData = Object.fromEntries(formData.entries());
        
        // Convert isActive string to boolean
        if (contentData.isActive) {
            contentData.isActive = contentData.isActive === 'true';
        }
        
        const response = await apiCall(`/api/content/${contentId}`, {
            method: 'PUT',
            body: JSON.stringify(contentData)
        });
        
        if (response.success !== false) {
            showNotification('Content updated successfully!', 'success');
            closeModal();
            loadContentData(); // Reload content data
        } else {
            showNotification('Error updating content: ' + (response.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error updating content:', error);
        showNotification('Error updating content', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Delete user function
 */
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await apiCall(`/api/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (response.success !== false) {
            showNotification('User deleted successfully!', 'success');
            loadUsersData(); // Reload users data
        } else {
            showNotification('Error deleting user: ' + (response.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Error deleting user. Please try again.', 'error');
    }
}

/**
 * Delete content function
 */
async function deleteContent(contentId) {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
        return;
    }
    
    try {
        showLoading();
        const response = await apiCall(`/api/website-content/${contentId}`, {
            method: 'DELETE'
        });
        
        if (response.success !== false) {
            showNotification('Content deleted successfully!', 'success');
            loadContentData(); // Reload content data
        } else {
            showNotification('Error deleting content: ' + (response.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error deleting content:', error);
        showNotification('Error deleting content. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Enhanced content management - Add comprehensive content editing
 */
function showAdvancedContentEditor() {
    const modal = document.getElementById('adminModal');
    modal.innerHTML = `
        <div class="modal-content blue-gradient-form" style="max-width: 1400px; max-height: 95vh; overflow-y: auto;">
            <div class="modal-header">
                <h2><i class="fas fa-edit"></i> Advanced Website Content Editor</h2>
                <span class="close" onclick="closeModal()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="content-editor-tabs">
                    <button class="tab-btn active" onclick="showContentTab('global')">Global Elements</button>
                    <button class="tab-btn" onclick="showContentTab('homepage')">Homepage</button>
                    <button class="tab-btn" onclick="showContentTab('about')">About Us</button>
                    <button class="tab-btn" onclick="showContentTab('books')">Books</button>
                    <button class="tab-btn" onclick="showContentTab('ebooks')">E-books</button>
                    <button class="tab-btn" onclick="showContentTab('projects')">Projects</button>
                    <button class="tab-btn" onclick="showContentTab('contact')">Contact</button>
                    <button class="tab-btn" onclick="showContentTab('donate')">Donate</button>
                    <button class="tab-btn" onclick="showContentTab('login')">Login/Signup</button>
                    <button class="tab-btn" onclick="showContentTab('footer')">Footer</button>
                </div>
                
                <!-- Global Elements Tab -->
                <div id="global-tab" class="content-tab active">
                    <h3><i class="fas fa-globe"></i> Global Website Elements</h3>
                    <div class="content-section-grid">
                        <!-- Logo Section -->
                        <div class="content-section-card">
                            <h4><i class="fas fa-image"></i> Logo & Branding</h4>
                            <form class="content-form blue-gradient-form" onsubmit="saveContentSection(event, 'logo', 'main')">
                                <div class="form-group">
                                    <label class="form-label">Logo Image URL</label>
                                    <input type="text" class="form-input" name="logoImage" data-content-key="image" placeholder="/assets/logo.jpeg">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Logo Alt Text (English)</label>
                                    <input type="text" class="form-input" name="logoAlt" data-content-key="title" placeholder="Tamil Language Society">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Logo Alt Text (Tamil)</label>
                                    <input type="text" class="form-input" name="logoAltTamil" data-content-key="titleTamil" placeholder="தமிழ்ப் பேரவை" style="font-family: 'Noto Sans Tamil', sans-serif;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Logo Text (English)</label>
                                    <input type="text" class="form-input" name="logoText" data-content-key="content" placeholder="Tamil Language Society">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Logo Text (Tamil)</label>
                                    <input type="text" class="form-input" name="logoTextTamil" data-content-key="contentTamil" placeholder="தமிழ்ப் பேரவை" style="font-family: 'Noto Sans Tamil', sans-serif;">
                                </div>
                                <button type="submit" class="btn-gradient-primary">Save Logo</button>
                            </form>
                        </div>
                        
                        <!-- Navigation Section -->
                        <div class="content-section-card">
                            <h4><i class="fas fa-bars"></i> Navigation Menu</h4>
                            <form class="content-form blue-gradient-form" onsubmit="saveContentSection(event, 'navigation', 'menu')">
                                <div class="form-group">
                                    <label class="form-label">Home Link Text (English)</label>
                                    <input type="text" class="form-input" name="homeText" data-nav-item="home" placeholder="Home">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Home Link Text (Tamil)</label>
                                    <input type="text" class="form-input" name="homeTextTamil" data-nav-item="home-tamil" placeholder="முகப்பு" style="font-family: 'Noto Sans Tamil', sans-serif;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">About Link Text (English)</label>
                                    <input type="text" class="form-input" name="aboutText" data-nav-item="about" placeholder="About Us">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">About Link Text (Tamil)</label>
                                    <input type="text" class="form-input" name="aboutTextTamil" data-nav-item="about-tamil" placeholder="எங்களைப் பற்றி" style="font-family: 'Noto Sans Tamil', sans-serif;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Projects Link Text (English)</label>
                                    <input type="text" class="form-input" name="projectsText" data-nav-item="projects" placeholder="Projects">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Projects Link Text (Tamil)</label>
                                    <input type="text" class="form-input" name="projectsTextTamil" data-nav-item="projects-tamil" placeholder="திட்டங்கள்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Ebooks Link Text (English)</label>
                                    <input type="text" class="form-input" name="ebooksText" data-nav-item="ebooks" placeholder="Ebooks">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Ebooks Link Text (Tamil)</label>
                                    <input type="text" class="form-input" name="ebooksTextTamil" data-nav-item="ebooks-tamil" placeholder="மின்னூல்கள்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Book Store Link Text (English)</label>
                                    <input type="text" class="form-input" name="bookstoreText" data-nav-item="bookstore" placeholder="Book Store">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Book Store Link Text (Tamil)</label>
                                    <input type="text" class="form-input" name="bookstoreTextTamil" data-nav-item="bookstore-tamil" placeholder="புத்தக கடை" style="font-family: 'Noto Sans Tamil', sans-serif;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Contact Link Text (English)</label>
                                    <input type="text" class="form-input" name="contactText" data-nav-item="contact" placeholder="Contact Us">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Contact Link Text (Tamil)</label>
                                    <input type="text" class="form-input" name="contactTextTamil" data-nav-item="contact-tamil" placeholder="எங்களை தொடர்பு கொள்ளுங்கள்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Donate Button Text (English)</label>
                                    <input type="text" class="form-input" name="donateText" data-nav-item="donate" placeholder="Donate Now">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Donate Button Text (Tamil)</label>
                                    <input type="text" class="form-input" name="donateTextTamil" data-nav-item="donate-tamil" placeholder="இப்போது நன்கொடை" style="font-family: 'Noto Sans Tamil', sans-serif;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Login Link Text (English)</label>
                                    <input type="text" class="form-input" name="loginText" data-nav-item="login" placeholder="Login">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Login Link Text (Tamil)</label>
                                    <input type="text" class="form-input" name="loginTextTamil" data-nav-item="login-tamil" placeholder="உள்நுழைய" style="font-family: 'Noto Sans Tamil', sans-serif;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Sign Up Button Text (English)</label>
                                    <input type="text" class="form-input" name="signupText" data-nav-item="signup" placeholder="Sign Up">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Sign Up Button Text (Tamil)</label>
                                    <input type="text" class="form-input" name="signupTextTamil" data-nav-item="signup-tamil" placeholder="பதிவு செய்யுங்கள்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                                </div>
                                <button type="submit" class="btn-gradient-primary">Save Navigation</button>
                            </form>
                        </div>
                        
                        <!-- SEO & Meta Section -->
                        <div class="content-section-card">
                            <h4><i class="fas fa-search"></i> SEO & Meta Information</h4>
                            <form class="content-form blue-gradient-form" onsubmit="saveContentSection(event, 'seo', 'meta')">
                                <div class="form-group">
                                    <label class="form-label">Site Title (English)</label>
                                    <input type="text" class="form-input" name="siteTitle" data-content-key="title" placeholder="Tamil Language Society">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Site Title (Tamil)</label>
                                    <input type="text" class="form-input" name="siteTitleTamil" data-content-key="titleTamil" placeholder="தமிழ்ப் பேரவை" style="font-family: 'Noto Sans Tamil', sans-serif;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Meta Description (English)</label>
                                    <textarea class="form-textarea" name="metaDescription" data-content-key="content" rows="3" placeholder="Preserving and promoting Tamil language and culture"></textarea>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Meta Description (Tamil)</label>
                                    <textarea class="form-textarea" name="metaDescriptionTamil" data-content-key="contentTamil" rows="3" placeholder="தமிழ் மொழி மற்றும் கலாச்சாரத்தை பாதுகாத்தல் மற்றும் மேம்படுத்துதல்" style="font-family: 'Noto Sans Tamil', sans-serif;"></textarea>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Keywords (comma separated)</label>
                                    <input type="text" class="form-input" name="keywords" data-content-key="metadata" placeholder="Tamil, language, culture, literature, books">
                                </div>
                                <button type="submit" class="btn-gradient-primary">Save SEO</button>
                            </form>
                        </div>
                    </div>
                </div>
                
                <!-- Homepage Tab -->
                <div id="homepage-tab" class="content-tab">
                    <h3><i class="fas fa-home"></i> Homepage Content</h3>
                    <div class="content-section-grid">
                        <!-- Hero Section -->
                        <div class="content-section-card">
                            <h4><i class="fas fa-star"></i> Hero Section</h4>
                            <form class="content-form blue-gradient-form" onsubmit="saveContentSection(event, 'homepage', 'hero')">
                                <div class="form-group">
                                    <label class="form-label">Main Title (English)</label>
                                    <input type="text" class="form-input" name="heroTitle" data-content-key="title" placeholder="Welcome to Tamil Language Society">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Main Title (Tamil)</label>
                                    <input type="text" class="form-input" name="heroTitleTamil" data-content-key="titleTamil" placeholder="தமிழ்ப் பேரவைக்கு வரவேற்கிறோம்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Subtitle (English)</label>
                                    <textarea class="form-textarea" name="heroSubtitle" data-content-key="content" rows="3" placeholder="Preserving and promoting Tamil language and culture"></textarea>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Subtitle (Tamil)</label>
                                    <textarea class="form-textarea" name="heroSubtitleTamil" data-content-key="contentTamil" rows="3" placeholder="தமிழ் மொழி மற்றும் கலாச்சாரத்தை பாதுகாத்தல் மற்றும் மேம்படுத்துதல்" style="font-family: 'Noto Sans Tamil', sans-serif;"></textarea>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Background Image URL</label>
                                    <input type="text" class="form-input" name="heroImage" data-content-key="image" placeholder="/assets/hero-bg.jpg">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">CTA Button Text (English)</label>
                                    <input type="text" class="form-input" name="heroButtonText" data-content-key="buttonText" placeholder="Explore Our Work">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">CTA Button Text (Tamil)</label>
                                    <input type="text" class="form-input" name="heroButtonTextTamil" data-content-key="buttonTextTamil" placeholder="எங்கள் பணியை ஆராயுங்கள்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">CTA Button URL</label>
                                    <input type="text" class="form-input" name="heroButtonUrl" data-content-key="url" placeholder="/projects">
                                </div>
                                <button type="submit" class="btn-gradient-primary">Save Hero Section</button>
                            </form>
                        </div>
                        
                        <!-- Announcements Section -->
                        <div class="content-section-card">
                            <h4><i class="fas fa-bullhorn"></i> Announcements Section</h4>
                            <form class="content-form blue-gradient-form" onsubmit="saveContentSection(event, 'homepage', 'announcements')">
                                <div class="form-group">
                                    <label class="form-label">Section Title (English)</label>
                                    <input type="text" class="form-input" name="announcementTitle" data-content-key="title" placeholder="Latest Announcements">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Section Title (Tamil)</label>
                                    <input type="text" class="form-input" name="announcementTitleTamil" data-content-key="titleTamil" placeholder="சமீபத்திய அறிவிப்புகள்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Show Announcements</label>
                                    <select class="form-input" name="showAnnouncements" data-content-key="active">
                                        <option value="true">Yes</option>
                                        <option value="false">No</option>
                                    </select>
                                </div>
                                <button type="submit" class="btn-gradient-primary">Save Announcements</button>
                            </form>
                        </div>
                        
                        <!-- Features Section -->
                        <div class="content-section-card">
                            <h4><i class="fas fa-cogs"></i> Features Section</h4>
                            <form class="content-form blue-gradient-form" onsubmit="saveContentSection(event, 'homepage', 'features')">
                                <div class="form-group">
                                    <label class="form-label">Section Title (English)</label>
                                    <input type="text" class="form-input" name="featuresTitle" data-content-key="title" placeholder="Our Services">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Section Title (Tamil)</label>
                                    <input type="text" class="form-input" name="featuresTitleTamil" data-content-key="titleTamil" placeholder="எங்கள் சேவைகள்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Section Subtitle (English)</label>
                                    <textarea class="form-textarea" name="featuresSubtitle" data-content-key="content" rows="2" placeholder="Discover our comprehensive range of services"></textarea>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Section Subtitle (Tamil)</label>
                                    <textarea class="form-textarea" name="featuresSubtitleTamil" data-content-key="contentTamil" rows="2" placeholder="எங்கள் விரிவான சேவைகளை கண்டறியுங்கள்" style="font-family: 'Noto Sans Tamil', sans-serif;"></textarea>
                                </div>
                                <button type="submit" class="btn-gradient-primary">Save Features</button>
                            </form>
                        </div>
                        
                        <!-- Statistics Section -->
                        <div class="content-section-card">
                            <h4><i class="fas fa-chart-bar"></i> Statistics Section</h4>
                            <form class="content-form blue-gradient-form" onsubmit="saveContentSection(event, 'homepage', 'statistics')">
                                <div class="form-group">
                                    <label class="form-label">Section Title (English)</label>
                                    <input type="text" class="form-input" name="statsTitle" data-content-key="title" placeholder="Our Impact">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Section Title (Tamil)</label>
                                    <input type="text" class="form-input" name="statsTitleTamil" data-content-key="titleTamil" placeholder="எங்கள் தாக்கம்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Books Published Count</label>
                                    <input type="number" class="form-input" name="booksCount" data-content-key="booksCount" placeholder="500">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Books Published Label (English)</label>
                                    <input type="text" class="form-input" name="booksLabel" data-content-key="booksLabel" placeholder="Books Published">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Books Published Label (Tamil)</label>
                                    <input type="text" class="form-input" name="booksLabelTamil" data-content-key="booksLabelTamil" placeholder="வெளியிடப்பட்ட புத்தகங்கள்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Projects Completed Count</label>
                                    <input type="number" class="form-input" name="projectsCount" data-content-key="projectsCount" placeholder="50">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Projects Completed Label (English)</label>
                                    <input type="text" class="form-input" name="projectsLabel" data-content-key="projectsLabel" placeholder="Projects Completed">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Projects Completed Label (Tamil)</label>
                                    <input type="text" class="form-input" name="projectsLabelTamil" data-content-key="projectsLabelTamil" placeholder="முடிக்கப்பட்ட திட்டங்கள்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Members Count</label>
                                    <input type="number" class="form-input" name="membersCount" data-content-key="membersCount" placeholder="1000">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Members Label (English)</label>
                                    <input type="text" class="form-input" name="membersLabel" data-content-key="membersLabel" placeholder="Active Members">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Members Label (Tamil)</label>
                                    <input type="text" class="form-input" name="membersLabelTamil" data-content-key="membersLabelTamil" placeholder="செயலில் உள்ள உறுப்பினர்கள்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Years of Service Count</label>
                                    <input type="number" class="form-input" name="yearsCount" data-content-key="yearsCount" placeholder="25">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Years of Service Label (English)</label>
                                    <input type="text" class="form-input" name="yearsLabel" data-content-key="yearsLabel" placeholder="Years of Service">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Years of Service Label (Tamil)</label>
                                    <input type="text" class="form-input" name="yearsLabelTamil" data-content-key="yearsLabelTamil" placeholder="சேவை ஆண்டுகள்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                                </div>
                                <button type="submit" class="btn-gradient-primary">Save Statistics</button>
                            </form>
                        </div>
                    </div>
                </div>
                
                <div id="about-tab" class="content-tab">
                    <h3>About Us Content</h3>
                    <form id="about-form" class="blue-gradient-form" onsubmit="savePageContent(event, 'about')">
                        <div class="form-group">
                            <label class="form-label">Page Title (English)</label>
                            <input type="text" class="form-input" name="pageTitle" placeholder="About Tamil Language Society">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Page Title (Tamil)</label>
                            <input type="text" class="form-input" name="pageTitleTamil" placeholder="தமிழ் மொழி சங்கத்தைப் பற்றி" style="font-family: 'Noto Sans Tamil', sans-serif;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Mission Statement (English)</label>
                            <textarea class="form-textarea wysiwyg-editor" name="mission" rows="4" placeholder="Our mission..."></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Mission Statement (Tamil)</label>
                            <textarea class="form-textarea wysiwyg-editor" name="missionTamil" rows="4" placeholder="எங்கள் நோக்கம்..." style="font-family: 'Noto Sans Tamil', sans-serif;"></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Vision Statement (English)</label>
                            <textarea class="form-textarea wysiwyg-editor" name="vision" rows="4" placeholder="Our vision..."></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Vision Statement (Tamil)</label>
                            <textarea class="form-textarea wysiwyg-editor" name="visionTamil" rows="4" placeholder="எங்கள் தொலைநோக்கு..." style="font-family: 'Noto Sans Tamil', sans-serif;"></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">History (English)</label>
                            <textarea class="form-textarea wysiwyg-editor" name="history" rows="6" placeholder="Our history and background..."></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">History (Tamil)</label>
                            <textarea class="form-textarea wysiwyg-editor" name="historyTamil" rows="6" placeholder="எங்கள் வரலாறு மற்றும் பின்னணி..." style="font-family: 'Noto Sans Tamil', sans-serif;"></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Team Description (English)</label>
                            <textarea class="form-textarea wysiwyg-editor" name="teamDescription" rows="4" placeholder="About our team..."></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Team Description (Tamil)</label>
                            <textarea class="form-textarea wysiwyg-editor" name="teamDescriptionTamil" rows="4" placeholder="எங்கள் குழுவைப் பற்றி..." style="font-family: 'Noto Sans Tamil', sans-serif;"></textarea>
                        </div>
                        <button type="submit" class="btn-gradient-primary">Save About Content</button>
                    </form>
                </div>
                
                <div id="books-tab" class="content-tab">
                    <h3>Books Page Content</h3>
                    <form id="books-form" class="blue-gradient-form" onsubmit="savePageContent(event, 'books')">
                        <div class="form-group">
                            <label class="form-label">Page Title (English)</label>
                            <input type="text" class="form-input" name="pageTitle" placeholder="Our Books Collection">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Page Title (Tamil)</label>
                            <input type="text" class="form-input" name="pageTitleTamil" placeholder="எங்கள் புத்தக தொகுப்பு" style="font-family: 'Noto Sans Tamil', sans-serif;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Page Description (English)</label>
                            <textarea class="form-textarea wysiwyg-editor" name="description" rows="4" placeholder="Explore our collection of Tamil literature..."></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Page Description (Tamil)</label>
                            <textarea class="form-textarea wysiwyg-editor" name="descriptionTamil" rows="4" placeholder="எங்கள் தமிழ் இலக்கிய தொகுப்பை ஆராயுங்கள்..." style="font-family: 'Noto Sans Tamil', sans-serif;"></textarea>
                        </div>
                        <button type="submit" class="btn-gradient-primary">Save Books Content</button>
                    </form>
                </div>
                
                <div id="ebooks-tab" class="content-tab">
                    <h3>E-books Page Content</h3>
                    <form id="ebooks-form" class="blue-gradient-form" onsubmit="savePageContent(event, 'ebooks')">
                        <div class="form-group">
                            <label class="form-label">Page Title (English)</label>
                            <input type="text" class="form-input" name="pageTitle" placeholder="Digital Library">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Page Title (Tamil)</label>
                            <input type="text" class="form-input" name="pageTitleTamil" placeholder="டிஜிட்டல் நூலகம்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Page Description (English)</label>
                            <textarea class="form-textarea wysiwyg-editor" name="description" rows="4" placeholder="Download and read Tamil e-books..."></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Page Description (Tamil)</label>
                            <textarea class="form-textarea wysiwyg-editor" name="descriptionTamil" rows="4" placeholder="தமிழ் மின்னூல்களை பதிவிறக்கம் செய்து படியுங்கள்..." style="font-family: 'Noto Sans Tamil', sans-serif;"></textarea>
                        </div>
                        <button type="submit" class="btn-gradient-primary">Save E-books Content</button>
                    </form>
                </div>
                
                <div id="projects-tab" class="content-tab">
                    <h3>Projects Page Content</h3>
                    <form id="projects-form" class="blue-gradient-form" onsubmit="savePageContent(event, 'projects')">
                        <div class="form-group">
                            <label class="form-label">Page Title (English)</label>
                            <input type="text" class="form-input" name="pageTitle" placeholder="Our Projects">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Page Title (Tamil)</label>
                            <input type="text" class="form-input" name="pageTitleTamil" placeholder="எங்கள் திட்டங்கள்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Projects Section Title (English)</label>
                            <input type="text" class="form-input" name="projectsTitle" placeholder="Projects">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Projects Section Title (Tamil)</label>
                            <input type="text" class="form-input" name="projectsTitleTamil" placeholder="திட்டங்கள்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Activities Section Title (English)</label>
                            <input type="text" class="form-input" name="activitiesTitle" placeholder="Activities">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Activities Section Title (Tamil)</label>
                            <input type="text" class="form-input" name="activitiesTitleTamil" placeholder="செயல்பாடுகள்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Initiatives Section Title (English)</label>
                            <input type="text" class="form-input" name="initiativesTitle" placeholder="Initiatives">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Initiatives Section Title (Tamil)</label>
                            <input type="text" class="form-input" name="initiativesTitleTamil" placeholder="முன்முயற்சிகள்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                        </div>
                        <button type="submit" class="btn-gradient-primary">Save Projects Content</button>
                    </form>
                </div>
                
                <div id="team-tab" class="content-tab">
                    <h3>Team Page Content</h3>
                    <form id="team-form" class="blue-gradient-form" onsubmit="savePageContent(event, 'team')">
                        <div class="form-group">
                            <label class="form-label">Page Title (English)</label>
                            <input type="text" class="form-input" name="pageTitle" placeholder="Our Team">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Page Title (Tamil)</label>
                            <input type="text" class="form-input" name="pageTitleTamil" placeholder="எங்கள் குழு" style="font-family: 'Noto Sans Tamil', sans-serif;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Team Description (English)</label>
                            <textarea class="form-textarea wysiwyg-editor" name="description" rows="4" placeholder="Meet our dedicated team members..."></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Team Description (Tamil)</label>
                            <textarea class="form-textarea wysiwyg-editor" name="descriptionTamil" rows="4" placeholder="எங்கள் அர்ப்பணிப்புள்ள குழு உறுப்பினர்களை சந்திக்கவும்..." style="font-family: 'Noto Sans Tamil', sans-serif;"></textarea>
                        </div>
                        <button type="submit" class="btn-gradient-primary">Save Team Content</button>
                    </form>
                </div>
                
                <div id="contact-tab" class="content-tab">
                    <h3>Contact Page Content</h3>
                    <form id="contact-form" class="blue-gradient-form" onsubmit="savePageContent(event, 'contact')">
                        <div class="form-group">
                            <label class="form-label">Page Title (English)</label>
                            <input type="text" class="form-input" name="pageTitle" placeholder="Contact Us">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Page Title (Tamil)</label>
                            <input type="text" class="form-input" name="pageTitleTamil" placeholder="எங்களை தொடர்பு கொள்ளுங்கள்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Contact Description (English)</label>
                            <textarea class="form-textarea wysiwyg-editor" name="description" rows="3" placeholder="Get in touch with us..."></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Contact Description (Tamil)</label>
                            <textarea class="form-textarea wysiwyg-editor" name="descriptionTamil" rows="3" placeholder="எங்களுடன் தொடர்பில் இருங்கள்..." style="font-family: 'Noto Sans Tamil', sans-serif;"></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Office Address</label>
                            <textarea class="form-textarea" name="address" rows="3" placeholder="Physical address"></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Phone Number</label>
                            <input type="text" class="form-input" name="phone" placeholder="+1 (555) 123-4567">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email Address</label>
                            <input type="email" class="form-input" name="email" placeholder="info@tamilsociety.org">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Office Hours</label>
                            <textarea class="form-textarea" name="hours" rows="3" placeholder="Monday - Friday: 9:00 AM - 5:00 PM"></textarea>
                        </div>
                        <button type="submit" class="btn-gradient-primary">Save Contact Content</button>
                    </form>
                </div>
                
                <div id="footer-tab" class="content-tab">
                    <h3>Footer Content</h3>
                    <form id="footer-form" class="blue-gradient-form" onsubmit="saveContentSection(event, 'global', 'footer')">
                        
                        <!-- Logo Section -->
                        <div class="form-section">
                            <h4>Logo & Branding</h4>
                            <div class="form-group">
                                <label class="form-label">Logo Image URL</label>
                                <input type="text" class="form-input" name="logo" placeholder="assets/logo.jpeg">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Logo Text (English)</label>
                                <input type="text" class="form-input" name="logoText" placeholder="Tamil Language Society">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Logo Text (Tamil)</label>
                                <input type="text" class="form-input" name="logoTextTamil" placeholder="தமிழ்ப் பேரவை" style="font-family: 'Noto Sans Tamil', sans-serif;">
                            </div>
                        </div>

                        <!-- Description Section -->
                        <div class="form-section">
                            <h4>Footer Description</h4>
                            <div class="form-group">
                                <label class="form-label">Description (English)</label>
                                <textarea class="form-textarea wysiwyg-editor" name="description" rows="3" placeholder="Dedicated to preserving and promoting the rich heritage of Tamil language and culture worldwide."></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Description (Tamil)</label>
                                <textarea class="form-textarea wysiwyg-editor" name="descriptionTamil" rows="3" placeholder="உலகம் முழுவதும் தமிழ் மொழி மற்றும் கலாச்சாரத்தின் வளமான பாரம்பரியத்தைப் பாதுகாத்து மேம்படுத்துவதற்கு அர்ப்பணிக்கப்பட்டுள்ளது." style="font-family: 'Noto Sans Tamil', sans-serif;"></textarea>
                            </div>
                        </div>

                        <!-- Quick Links Section -->
                        <div class="form-section">
                            <h4>Quick Links</h4>
                            <div class="form-group">
                                <label class="form-label">Section Title (English)</label>
                                <input type="text" class="form-input" name="quickLinksTitle" placeholder="Quick Links">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Section Title (Tamil)</label>
                                <input type="text" class="form-input" name="quickLinksTitleTamil" placeholder="விரைவு இணைப்புகள்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                            </div>
                            <div class="form-group">
                                <label class="form-label">About Us Link (English)</label>
                                <input type="text" class="form-input" name="aboutLink" placeholder="About Us">
                            </div>
                            <div class="form-group">
                                <label class="form-label">About Us Link (Tamil)</label>
                                <input type="text" class="form-input" name="aboutLinkTamil" placeholder="எங்களைப் பற்றி" style="font-family: 'Noto Sans Tamil', sans-serif;">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Projects Link (English)</label>
                                <input type="text" class="form-input" name="projectsLink" placeholder="Projects">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Projects Link (Tamil)</label>
                                <input type="text" class="form-input" name="projectsLinkTamil" placeholder="திட்டங்கள்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Ebooks Link (English)</label>
                                <input type="text" class="form-input" name="ebooksLink" placeholder="Ebooks">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Ebooks Link (Tamil)</label>
                                <input type="text" class="form-input" name="ebooksLinkTamil" placeholder="மின்னூல்கள்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Bookstore Link (English)</label>
                                <input type="text" class="form-input" name="bookstoreLink" placeholder="Book Store">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Bookstore Link (Tamil)</label>
                                <input type="text" class="form-input" name="bookstoreLinkTamil" placeholder="புத்தக கடை" style="font-family: 'Noto Sans Tamil', sans-serif;">
                            </div>
                        </div>

                        <!-- Support Section -->
                        <div class="form-section">
                            <h4>Support Links</h4>
                            <div class="form-group">
                                <label class="form-label">Section Title (English)</label>
                                <input type="text" class="form-input" name="supportTitle" placeholder="Support">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Section Title (Tamil)</label>
                                <input type="text" class="form-input" name="supportTitleTamil" placeholder="ஆதரவு" style="font-family: 'Noto Sans Tamil', sans-serif;">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Contact Link (English)</label>
                                <input type="text" class="form-input" name="contactLink" placeholder="Contact Us">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Contact Link (Tamil)</label>
                                <input type="text" class="form-input" name="contactLinkTamil" placeholder="எங்களைத் தொடர்பு கொள்ளுங்கள்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Donate Link (English)</label>
                                <input type="text" class="form-input" name="donateLink" placeholder="Donate">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Donate Link (Tamil)</label>
                                <input type="text" class="form-input" name="donateLinkTamil" placeholder="நன்கொடை" style="font-family: 'Noto Sans Tamil', sans-serif;">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Notifications Link (English)</label>
                                <input type="text" class="form-input" name="notificationsLink" placeholder="Notifications">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Notifications Link (Tamil)</label>
                                <input type="text" class="form-input" name="notificationsLinkTamil" placeholder="அறிவிப்புகள்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                            </div>
                        </div>

                        <!-- Newsletter Section -->
                        <div class="form-section">
                            <h4>Newsletter</h4>
                            <div class="form-group">
                                <label class="form-label">Newsletter Title (English)</label>
                                <input type="text" class="form-input" name="newsletterTitle" placeholder="Newsletter">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Newsletter Title (Tamil)</label>
                                <input type="text" class="form-input" name="newsletterTitleTamil" placeholder="செய்திமடல்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Newsletter Description (English)</label>
                                <textarea class="form-textarea wysiwyg-editor" name="newsletterDescription" rows="2" placeholder="Stay updated with our latest news and events"></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Newsletter Description (Tamil)</label>
                                <textarea class="form-textarea wysiwyg-editor" name="newsletterDescriptionTamil" rows="2" placeholder="எங்கள் சமீபத்திய செய்திகள் மற்றும் நிகழ்வுகளுடன் புதுப்பித்த நிலையில் இருங்கள்" style="font-family: 'Noto Sans Tamil', sans-serif;"></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email Placeholder (English)</label>
                                <input type="text" class="form-input" name="emailPlaceholder" placeholder="Enter your email">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email Placeholder (Tamil)</label>
                                <input type="text" class="form-input" name="emailPlaceholderTamil" placeholder="உங்கள் மின்னஞ்சலை உள்ளிடுக" style="font-family: 'Noto Sans Tamil', sans-serif;">
                            </div>
                        </div>

                        <!-- Social Media Section -->
                        <div class="form-section">
                            <h4>Social Media Links</h4>
                            <div class="form-group">
                                <label class="form-label">Facebook URL</label>
                                <input type="url" class="form-input" name="facebookUrl" placeholder="https://facebook.com/tamillanguagesociety">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Twitter URL</label>
                                <input type="url" class="form-input" name="twitterUrl" placeholder="https://twitter.com/tamillanguagesociety">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Instagram URL</label>
                                <input type="url" class="form-input" name="instagramUrl" placeholder="https://instagram.com/tamillanguagesociety">
                            </div>
                            <div class="form-group">
                                <label class="form-label">YouTube URL</label>
                                <input type="url" class="form-input" name="youtubeUrl" placeholder="https://youtube.com/tamillanguagesociety">
                            </div>
                        </div>

                        <!-- Copyright Section -->
                        <div class="form-section">
                            <h4>Copyright</h4>
                            <div class="form-group">
                                <label class="form-label">Copyright Text (English)</label>
                                <input type="text" class="form-input" name="copyright" placeholder="© 2025 Tamil Language Society. All rights reserved.">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Copyright Text (Tamil)</label>
                                <input type="text" class="form-input" name="copyrightTamil" placeholder="© 2025 தமிழ்ப் பேரவை. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை." style="font-family: 'Noto Sans Tamil', sans-serif;">
                            </div>
                        </div>

                        <button type="submit" class="btn-gradient-primary">Save Footer Content</button>
                    </form>
                </div>
                
                <div id="navigation-tab" class="content-tab">
                    <h3>Navigation Menu</h3>
                    <form id="navigation-form" class="blue-gradient-form" onsubmit="savePageContent(event, 'navigation')">
                        <div class="form-group">
                            <label class="form-label">Site Logo Alt Text</label>
                            <input type="text" class="form-input" name="logoAlt" placeholder="Tamil Language Society Logo">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Menu Items (JSON format)</label>
                            <textarea class="form-textarea" name="menuItems" rows="12" placeholder='[
  {"name": "Home", "nameTamil": "முகப்பு", "url": "/", "active": true},
  {"name": "About", "nameTamil": "எங்களைப் பற்றி", "url": "/about", "active": true},
  {"name": "Books", "nameTamil": "புத்தகங்கள்", "url": "/books", "active": true},
  {"name": "E-books", "nameTamil": "மின்னூல்கள்", "url": "/ebooks", "active": true},
  {"name": "Projects", "nameTamil": "திட்டங்கள்", "url": "/projects", "active": true},
  {"name": "Team", "nameTamil": "குழு", "url": "/team", "active": true},
  {"name": "Contact", "nameTamil": "தொடர்பு", "url": "/contact", "active": true}
]'></textarea>
                        </div>
                        <button type="submit" class="btn-gradient-primary">Save Navigation Content</button>
                    </form>
                </div>
                
                <div id="logo-tab" class="content-tab">
                    <h3>Logo & Branding</h3>
                    <form id="logo-form" class="blue-gradient-form" onsubmit="savePageContent(event, 'logo')">
                        <div class="form-group">
                            <label class="form-label">Logo URL</label>
                            <input type="text" class="form-input" name="logoUrl" placeholder="/assets/logo.png">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Logo Alt Text</label>
                            <input type="text" class="form-input" name="logoAlt" placeholder="Tamil Language Society">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Favicon URL</label>
                            <input type="text" class="form-input" name="faviconUrl" placeholder="/assets/favicon.ico">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Site Title</label>
                            <input type="text" class="form-input" name="siteTitle" placeholder="Tamil Language Society">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Site Tagline</label>
                            <input type="text" class="form-input" name="siteTagline" placeholder="Preserving Tamil Heritage">
                        </div>
                        <button type="submit" class="btn-gradient-primary">Save Logo Content</button>
                    </form>
                </div>
                
                <div id="announcements-tab" class="content-tab">
                    <h3>Announcements Section</h3>
                    <form id="announcements-form" class="blue-gradient-form" onsubmit="savePageContent(event, 'announcements')">
                        <div class="form-group">
                            <label class="form-label">Section Title (English)</label>
                            <input type="text" class="form-input" name="sectionTitle" placeholder="Latest Announcements">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Section Title (Tamil)</label>
                            <input type="text" class="form-input" name="sectionTitleTamil" placeholder="சமீபத்திய அறிவிப்புகள்" style="font-family: 'Noto Sans Tamil', sans-serif;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Section Description (English)</label>
                            <textarea class="form-textarea" name="description" rows="3" placeholder="Stay updated with our latest news and announcements"></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Section Description (Tamil)</label>
                            <textarea class="form-textarea" name="descriptionTamil" rows="3" placeholder="எங்கள் சமீபத்திய செய்திகள் மற்றும் அறிவிப்புகளுடன் புதுப்பித்த நிலையில் இருங்கள்" style="font-family: 'Noto Sans Tamil', sans-serif;"></textarea>
                        </div>
                        <button type="submit" class="btn-gradient-primary">Save Announcements Content</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
    modal.style.display = 'flex';
    loadCurrentContent();
}

// showContentTab function is defined later in the file

/**
 * Show content tab
 */
function showContentTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.content-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all tab buttons
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked button
    const clickedBtn = document.querySelector(`[onclick="showContentTab('${tabName}')"]`);
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }
}

/**
 * Save page content from form submission
 */
async function savePageContentFromForm(event, pageType) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const contentData = Object.fromEntries(formData.entries());
        
        // Map pageType to valid enum values
        const pageMapping = {
            'homepage': 'home',
            'navigation': 'header'
        };
        
        const validPageType = pageMapping[pageType] || pageType;
        
        // For navigation, parse JSON
        if (pageType === 'navigation' && contentData.menuItems) {
            try {
                contentData.menuItems = JSON.parse(contentData.menuItems);
            } catch (e) {
                alert('Invalid JSON format for menu items');
                return;
            }
        }
        
        // Use the page-specific endpoint for saving content
        const response = await apiCall('/api/admin/content', {
            method: 'PUT',
            body: JSON.stringify({
                ...contentData,
                page: validPageType,
                section: 'main',
                title: `${pageType.charAt(0).toUpperCase() + pageType.slice(1)} Content`,
                isActive: true,
                isVisible: true,
                order: 1
            })
        });
        
        if (response.success !== false) {
            showNotification(`${pageType.charAt(0).toUpperCase() + pageType.slice(1)} content updated successfully!`, 'success');
        } else {
            showNotification('Error updating content: ' + (response.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error saving content:', error);
        showNotification('Error saving content. Please try again.', 'error');
    }
}

/**
 * Load current content into forms
 */
async function loadCurrentContent() {
    try {
        const response = await apiCall('/api/admin/content');
        const content = response.data || response;
        
        // List of all content types to load
        const contentTypes = ['homepage', 'about', 'books', 'ebooks', 'projects', 'team', 'contact', 'footer', 'navigation', 'logo', 'announcements'];
        
        contentTypes.forEach(type => {
            if (content[type]) {
                const form = document.getElementById(`${type}-form`);
                if (form) {
                    Object.keys(content[type]).forEach(key => {
                        const input = form.querySelector(`[name="${key}"]`);
                        if (input) {
                            if (key === 'menuItems' && Array.isArray(content[type][key])) {
                                input.value = JSON.stringify(content[type][key], null, 2);
                            } else {
                                input.value = content[type][key];
                            }
                        }
                    });
                }
            }
        });
    } catch (error) {
        console.error('Error loading current content:', error);
    }
}

/**
 * Logout function
 */
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear all authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('tamil_society_session');
        
        // Clear user session if authManager is available
        if (window.authManager) {
            window.authManager.handleLogout();
        }
        
        // Redirect to admin login page
        window.location.href = 'login.html';
    }
}

// ==================== CONTENT EDITOR FUNCTIONS ====================

/**
 * Update editor with new content - fixes async data handling and DOM clearing
 */
async function updateEditor(pageType, contentData) {
    try {
        // Show loading indicator
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }

        // Clear existing content containers
        const contentContainer = document.getElementById('contentContainer');
        const sectionsContainer = document.getElementById('sectionsContainer');
        const editorContainer = document.getElementById('editorContainer');
        
        if (contentContainer) contentContainer.innerHTML = '';
        if (sectionsContainer) sectionsContainer.innerHTML = '';
        if (editorContainer) editorContainer.innerHTML = '';

        // Wait for all async operations to complete
        await Promise.all([
            // Clear any existing TinyMCE editors
            new Promise((resolve) => {
                if (typeof tinymce !== 'undefined') {
                    tinymce.remove();
                    setTimeout(resolve, 100); // Allow time for cleanup
                } else {
                    resolve();
                }
            }),
            
            // Load fresh content data if not provided
            contentData ? Promise.resolve(contentData) : loadContentForPage(pageType)
        ]);

        // Re-render content sections
        if (contentData || pageType) {
            await renderContentSections(pageType, contentData);
        }

        // Reinitialize editors and form handlers
        await initializeEditors();
        
        // Hide loading indicator
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }

        console.log('Editor updated successfully for page:', pageType);
        
    } catch (error) {
        console.error('Error updating editor:', error);
        
        // Hide loading indicator on error
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        // Show error message to user
        showNotification('Error updating editor. Please try again.', 'error');
    }
}

/**
 * Render content sections in the editor
 */
async function renderContentSections(pageType, contentData) {
    const sectionsContainer = document.getElementById('sectionsContainer');
    if (!sectionsContainer || !contentData) return;

    // Clear existing sections
    sectionsContainer.innerHTML = '';

    // Render sections based on content type
    if (contentData.sections && Array.isArray(contentData.sections)) {
        contentData.sections.forEach((section, index) => {
            renderSection(section, index, sectionsContainer);
        });
    } else {
        // Handle non-sectioned content (like forms)
        renderFormContent(pageType, contentData, sectionsContainer);
    }
}

/**
 * Initialize or reinitialize editors (TinyMCE, etc.)
 */
async function initializeEditors() {
    // Use the main TinyMCE initialization function to prevent duplication
    if (typeof tinymce !== 'undefined' && typeof initTinyMCE === 'function') {
        await initTinyMCE();
    } else {
        console.warn('⚠️ TinyMCE or initTinyMCE function not available');
    }

    // Reinitialize any other form handlers or event listeners
    initFormHandlers();
}

// initFormHandlers function is defined earlier in the file

// ==================== CONTENT EDITOR FUNCTIONS ====================

/**
 * Update editor with new content - fixes async data handling and DOM clearing
 */
/**
 * Load content data for a specific page
 */
async function loadContentForPage(pageType) {
    try {
        const response = await apiCall(`/api/content/${pageType}`);
        return response.data || response;
    } catch (error) {
        console.error(`Error loading content for ${pageType}:`, error);
        return null;
    }
}

// initFormHandlers function is defined earlier in the file

// ==================== TEAM MANAGEMENT ====================

/**
 * Load team members data
 */
async function loadTeamMembers() {
    try {
        const response = await apiCall('/api/team');
        const teamMembers = response.data || response;
        
        const tbody = document.getElementById('teamTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!teamMembers || teamMembers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-tertiary);">No team members found</td></tr>';
            return;
        }
        
        teamMembers.forEach(member => {
            const row = document.createElement('tr');
            const profilePicSrc = member.profilePicture || member.photo || '/assets/default-avatar.jpg';
            // Fix image URL construction
            let displaySrc;
            if (profilePicSrc.startsWith('http')) {
                displaySrc = profilePicSrc;
            } else if (profilePicSrc.startsWith('/uploads/')) {
                displaySrc = `http://localhost:8080${profilePicSrc}`;
            } else if (profilePicSrc.startsWith('/assets/')) {
                displaySrc = profilePicSrc;
            } else {
                displaySrc = `http://localhost:8080/uploads/team/${profilePicSrc}`;
            }
            
            row.innerHTML = `
                <td style="padding: 1rem;">
                    <img src="${displaySrc}" 
                         alt="${member.name}" 
                         style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #e5e7eb;">
                </td>
                <td style="padding: 1rem;">
                    <div>
                        <div style="font-weight: 500;">${member.name}</div>
                        ${member.nameTamil ? `<div style="font-size: 0.875rem; color: var(--text-tertiary); font-family: var(--font-tamil);">${member.nameTamil}</div>` : ''}
                    </div>
                </td>
                <td style="padding: 1rem;">
                    <span class="badge badge-${member.position}">${getPositionDisplayName(member.position)}</span>
                </td>
                <td style="padding: 1rem;">${member.department || '-'}</td>
                <td style="padding: 1rem;">${member.order}</td>
                <td style="padding: 1rem;">
                    <span class="badge badge-${member.status === 'active' ? 'success' : 'secondary'}">${member.status}</span>
                </td>
                <td style="padding: 1rem;">
                    <button onclick="editTeamMember('${member._id}')" class="btn btn-sm btn-secondary" style="margin-right: 0.5rem;">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="deleteTeamMember('${member._id}')" class="btn btn-sm btn-danger">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading team members:', error);
        const tbody = document.getElementById('teamTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-danger);">Error loading team members</td></tr>';
        }
    }
}

function getPositionDisplayName(position) {
    const displayNames = {
        'president': 'President',
        'vice-president': 'Vice President',
        'treasurer': 'Treasurer',
        'secretary': 'Secretary',
        'executive': 'Executive Committee Member',
        'auditor': 'Auditor'
    };
    return displayNames[position] || position;
}

/**
 * Show team member form modal
 */
function showTeamForm(memberId = null) {
    console.log('showTeamForm called with memberId:', memberId);
    
    function ensureModalReady(callback, retryCount = 0) {
        const modal = document.getElementById('adminModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalFormContainer = document.getElementById('modalFormContainer');
        
        console.log('Modal elements check for team form (attempt ' + (retryCount + 1) + '):', {
            modal: !!modal,
            modalTitle: !!modalTitle,
            modalFormContainer: !!modalFormContainer,
            documentReady: document.readyState
        });
        
        if (modal && modalTitle && modalFormContainer) {
            console.log('All modal elements found for team form, proceeding...');
            callback(modal, modalTitle, modalFormContainer);
        } else if (retryCount < 10) { // Reduced retries, will create fallback sooner
            console.log('Modal elements not ready for team form, retrying in 100ms...');
            setTimeout(() => ensureModalReady(callback, retryCount + 1), 100);
        } else {
            console.warn('Modal elements not found for team form, creating fallback modal...');
            const fallbackElements = createFallbackModal();
            callback(fallbackElements.modal, fallbackElements.modalTitle, fallbackElements.modalFormContainer);
        }
    }
    
    ensureModalReady((modal, modalTitle, modalFormContainer) => {
    
    modalTitle.textContent = memberId ? 'Edit Team Member' : 'Add Team Member';
    
    modalFormContainer.innerHTML = `
        <form id="teamForm" class="blue-gradient-form" onsubmit="handleTeamFormSubmit(event, '${memberId || ''}')">
            <div class="form-group">
                <label class="form-label">Profile Picture</label>
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                    <img id="profileImage" src="assets/default-avatar.jpg" alt="Profile Preview" 
                         style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid var(--gray-300);">
                    <div style="flex: 1;">
                        <input type="file" class="form-input" name="profilePicture" accept="image/*" onchange="previewProfileImage(event)">
                        <small style="color: var(--gray-600); font-size: 0.875rem;">Upload a profile picture (JPG, PNG, WebP)</small>
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Name *</label>
                <input type="text" class="form-input" name="name" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Tamil Name</label>
                <input type="text" class="form-input" name="nameTamil" placeholder="தமிழ் பெயர்" style="font-family: var(--font-tamil), sans-serif;">
            </div>
            
            <div class="form-group">
                <label class="form-label">Position *</label>
                <select class="form-input" name="position" required>
                    <option value="">Select Position</option>
                    <option value="president">President</option>
                    <option value="vice-president">Vice President</option>
                    <option value="treasurer">Treasurer</option>
                    <option value="secretary">Secretary</option>
                    <option value="executive">Executive Committee Member</option>
                    <option value="auditor">Auditor</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Department</label>
                <input type="text" class="form-input" name="department" placeholder="e.g., Language Studies, Technology">
            </div>
            
            <div class="form-group">
                <label class="form-label">Bio</label>
                <textarea class="form-textarea" name="bio" rows="3" placeholder="Brief biography..."></textarea>
            </div>
            
            <div class="form-group">
                <label class="form-label">Tamil Bio</label>
                <textarea class="form-textarea" name="bioTamil" rows="3" placeholder="தமிழில் சுயவிவரம்..." style="font-family: var(--font-tamil), sans-serif;"></textarea>
            </div>
            
            <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-input" name="email" placeholder="member@example.com">
            </div>
            
            <div class="form-group">
                <label class="form-label">Phone</label>
                <input type="text" class="form-input" name="phone" placeholder="+60 12-345 6789">
            </div>
            
            <div class="form-group">
                <label class="form-label">Order (for sorting within position)</label>
                <input type="number" class="form-input" name="order" value="0" min="0">
            </div>
            
            <div class="form-group">
                <label class="form-label">Status</label>
                <select class="form-input" name="status">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>
            
            <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> ${memberId ? 'Update' : 'Create'} Member
                </button>
                <button type="button" onclick="closeModal()" class="btn btn-secondary">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>
        </form>
    `;
    
    modal.style.display = 'flex';
    
    // Load existing data if editing
    if (memberId) {
        loadTeamMemberData(memberId);
    }
    });
}

/**
 * Preview profile image when file is selected
 */
function previewProfileImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('profileImage');
    
    if (file && preview) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Load team member data for editing
 */
async function loadTeamMemberData(memberId) {
    try {
        const response = await apiCall(`/api/team/${memberId}`);
        const member = response.data || response;
        
        const form = document.getElementById('teamForm');
        if (!form) return;
        
        // Populate form fields (skip file inputs)
        Object.keys(member).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input && member[key] !== null && member[key] !== undefined) {
                // Skip file input fields as they cannot be programmatically set
                if (input.type !== 'file') {
                    input.value = member[key];
                }
            }
        });
        
        // Handle profile picture preview
        const profileImage = document.getElementById('profileImage');
        if (profileImage && (member.profilePicture || member.photo)) {
            const imageSrc = member.profilePicture || member.photo;
            // Fix image URL construction for preview
            let previewSrc;
            if (imageSrc.startsWith('http')) {
                previewSrc = imageSrc;
            } else if (imageSrc.startsWith('/uploads/')) {
                previewSrc = `http://localhost:8080${imageSrc}`;
            } else if (imageSrc.startsWith('/assets/')) {
                previewSrc = imageSrc;
            } else {
                previewSrc = `http://localhost:8080/uploads/team/${imageSrc}`;
            }
            profileImage.src = previewSrc;
            profileImage.onerror = function() {
                this.src = '/assets/default-avatar.jpg';
            };
        }
    } catch (error) {
        console.error('Error loading team member data:', error);
        showNotification('Error loading team member data', 'error');
    }
}

/**
 * Handle team form submission
 */
async function handleTeamFormSubmit(event, memberId) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        
        const url = memberId ? `/api/team/${memberId}` : '/api/team';
        const method = memberId ? 'PUT' : 'POST';
        
        const response = await apiCall(url, {
            method: method,
            body: formData
        });
        
        showNotification(`Team member ${memberId ? 'updated' : 'created'} successfully!`, 'success');
        
        // Show popup notification for new team member (not for updates)
        if (!memberId && window.TamilSociety && window.TamilSociety.popupNotificationManager) {
            const memberName = formData.get('name') || 'New Team Member';
            const memberPosition = formData.get('position') || '';
            window.TamilSociety.popupNotificationManager.showNewTeamMemberNotification({
                name: memberName,
                position: memberPosition
            });
        }
        
        closeModal();
        loadTeamMembers();
    } catch (error) {
        console.error('Error saving team member:', error);
        showNotification('Error saving team member: ' + error.message, 'error');
    }
}

/**
 * Edit team member
 */
function editTeamMember(memberId) {
    showTeamForm(memberId);
}

/**
 * Delete team member
 */
async function deleteTeamMember(memberId) {
    if (!confirm('Are you sure you want to delete this team member?')) {
        return;
    }
    
    try {
        const response = await apiCall(`/api/team/${memberId}`, {
            method: 'DELETE'
        });
        
        if (response.success !== false) {
            alert('Team member deleted successfully!');
            loadTeamMembers();
        } else {
            alert('Error deleting team member: ' + (response.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error deleting team member:', error);
        alert('Error deleting team member. Please try again.');
    }
}

/**
 * Filter team members based on search query
 * @param {string} query - The search query
 */
function filterTeamMembers(query) {
    query = query.toLowerCase();
    
    // Get all team member rows
    const teamRows = document.querySelectorAll('#teamTableBody tr');
    
    // Show/hide rows based on search query
    teamRows.forEach(row => {
        if (row.cells && row.cells.length > 1) {
            const name = row.cells[1].textContent.toLowerCase(); // Name is in column 2
            const position = row.cells[2].textContent.toLowerCase(); // Position is in column 3
            const department = row.cells[3].textContent.toLowerCase(); // Department is in column 4
            
            if (name.includes(query) || position.includes(query) || department.includes(query)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

// Update the openModal function to handle team
if (typeof window.openModal === 'undefined') {
    window.openModal = function(type) {
        if (type === 'team') {
            showTeamForm();
        }
    };
} else {
    const originalOpenModal = window.openModal;
    window.openModal = function(type) {
        if (type === 'team') {
            showTeamForm();
        } else {
            originalOpenModal(type);
        }
    };
}

// showSection will be made available globally after DOMContentLoaded

// toggleSidebar function is defined earlier in the file

// Fallback functions to prevent console errors
if (typeof window.editBook === 'undefined') {
    window.editBook = function(id) {
        console.log('editBook function called with ID:', id);
        alert('Edit book functionality not yet implemented');
    };
}

if (typeof window.deleteBook === 'undefined') {
    window.deleteBook = function(id) {
        if (confirm('Are you sure you want to delete this book?')) {
            console.log('deleteBook function called with ID:', id);
            alert('Delete book functionality not yet implemented');
        }
    };
}

if (typeof window.editProject === 'undefined') {
    window.editProject = function(id) {
        console.log('editProject function called with ID:', id);
        alert('Edit project functionality not yet implemented');
    };
}

if (typeof window.deleteProject === 'undefined') {
    window.deleteProject = function(id) {
        if (confirm('Are you sure you want to delete this project?')) {
            console.log('deleteProject function called with ID:', id);
            alert('Delete project functionality not yet implemented');
        }
    };
}

if (typeof window.viewMessage === 'undefined') {
    window.viewMessage = function(id) {
        console.log('viewMessage function called with ID:', id);
        alert('View message functionality not yet implemented');
    };
}

if (typeof window.deleteMessage === 'undefined') {
    window.deleteMessage = function(id) {
        if (confirm('Are you sure you want to delete this message?')) {
            console.log('deleteMessage function called with ID:', id);
            alert('Delete message functionality not yet implemented');
        }
    };
}

if (typeof window.editUser === 'undefined') {
    window.editUser = function(id) {
        console.log('editUser function called with ID:', id);
        alert('Edit user functionality not yet implemented');
    };
}

if (typeof window.deleteUser === 'undefined') {
    window.deleteUser = function(id) {
        if (confirm('Are you sure you want to delete this user?')) {
            console.log('deleteUser function called with ID:', id);
            alert('Delete user functionality not yet implemented');
        }
    };
}

// editContent function is already defined above - removing override

if (typeof window.deleteContent === 'undefined') {
    window.deleteContent = function(id) {
        if (confirm('Are you sure you want to delete this content?')) {
            console.log('deleteContent function called with ID:', id);
            alert('Delete content functionality not yet implemented');
        }
    };
}

if (typeof window.editEbook === 'undefined') {
    window.editEbook = function(id) {
        console.log('editEbook function called with ID:', id);
        alert('Edit ebook functionality not yet implemented');
    };
}

if (typeof window.deleteEbook === 'undefined') {
    window.deleteEbook = function(id) {
        if (confirm('Are you sure you want to delete this ebook?')) {
            console.log('deleteEbook function called with ID:', id);
            alert('Delete ebook functionality not yet implemented');
        }
    };
}

if (typeof window.closeModal === 'undefined') {
    window.closeModal = function() {
        const modal = document.getElementById('adminModal');
        if (modal) {
            modal.style.display = 'none';
        }
        console.log('closeModal function called');
    };
}

if (typeof window.logout === 'undefined') {
    window.logout = function() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear all authentication data
            localStorage.removeItem('token');
            localStorage.removeItem('tamil_society_session');
            
            // Redirect to admin login page
            window.location.href = 'login.html';
        }
    };
}

if (typeof window.showContentTab === 'undefined') {
    window.showContentTab = function(tabName) {
        console.log('showContentTab function called with tab:', tabName);
        // Hide all content tabs
        const tabs = document.querySelectorAll('.content-tab');
        tabs.forEach(tab => tab.style.display = 'none');
        
        // Show selected tab
        const selectedTab = document.getElementById(tabName + 'Tab');
        if (selectedTab) {
            selectedTab.style.display = 'block';
        }
        
        // Update tab buttons
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(btn => btn.classList.remove('active'));
        
        const activeButton = document.querySelector(`[onclick="showContentTab('${tabName}')"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    };
}

/**
 * Handle settings form submission
 * @param {Event} event - The form submit event
 */
async function handleSettingsFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const settings = {};
    
    // Convert FormData to object
    for (let [key, value] of formData.entries()) {
        settings[key] = value;
    }
    
    try {
        showLoading();
        
        const response = await apiCall('/api/admin/settings', {
            method: 'PUT',
            body: JSON.stringify(settings),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.success) {
            showNotification('Settings updated successfully', 'success');
        } else {
            throw new Error(response.message || 'Failed to update settings');
        }
    } catch (error) {
        console.error('Error updating settings:', error);
        showNotification('Failed to update settings: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Test admin panel functionality
 */
async function testAdminPanel() {
    console.log('🧪 Testing Admin Panel Functionality...');
    
    const tests = [
        {
            name: 'Authentication Check',
            test: () => {
                const token = localStorage.getItem('token');
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                return token && user.role === 'admin';
            }
        },
        {
            name: 'API Connection',
            test: async () => {
                try {
                    await apiCall('/api/books');
                    return true;
                } catch (error) {
                    console.error('API test failed:', error);
                    return false;
                }
            }
        },
        {
            name: 'Dashboard Elements',
            test: () => {
                const elements = ['dashboard', 'books', 'ebooks', 'projects', 'messages', 'users'];
                return elements.every(id => document.getElementById(id) !== null);
            }
        },
        {
            name: 'Navigation',
            test: () => {
                const navItems = document.querySelectorAll('.nav-item[data-section]');
                return navItems.length > 0;
            }
        },
        {
            name: 'Search Functionality',
            test: () => {
                const searchInputs = ['booksSearch', 'ebooksSearch', 'projectsSearch', 'messagesSearch'];
                return searchInputs.some(id => document.getElementById(id) !== null);
            }
        }
    ];
    
    const results = [];
    
    for (const test of tests) {
        try {
            const result = await test.test();
            results.push({ name: test.name, passed: result });
            console.log(`${result ? '✅' : '❌'} ${test.name}: ${result ? 'PASSED' : 'FAILED'}`);
        } catch (error) {
            results.push({ name: test.name, passed: false, error: error.message });
            console.log(`❌ ${test.name}: FAILED (${error.message})`);
        }
    }
    
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Admin panel is working correctly.');
        showNotification('Admin panel is working correctly!', 'success');
    } else {
        console.log('⚠️ Some tests failed. Check console for details.');
        showNotification(`${passedTests}/${totalTests} tests passed`, 'warning');
    }
    
    return results;
}

// Make test function available globally for manual testing
window.testAdminPanel = testAdminPanel;

// Add missing filter functions to prevent errors
if (typeof filterBooks === 'undefined') {
    function filterBooks(searchTerm) {
        console.log('Filtering books with term:', searchTerm);
        const tableBody = document.getElementById('booksTableBody');
        if (tableBody) {
            const rows = tableBody.querySelectorAll('tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
            });
        }
    }
}

if (typeof filterEbooks === 'undefined') {
    function filterEbooks(searchTerm) {
        console.log('Filtering ebooks with term:', searchTerm);
        const tableBody = document.getElementById('ebooksTableBody');
        if (tableBody) {
            const rows = tableBody.querySelectorAll('tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
            });
        }
    }
}

if (typeof filterProjects === 'undefined') {
    function filterProjects(searchTerm) {
        console.log('Filtering projects with term:', searchTerm);
        const tableBody = document.getElementById('projectsTableBody');
        if (tableBody) {
            const rows = tableBody.querySelectorAll('tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
            });
        }
    }
}

// Status filter functions
if (typeof filterBooksByStatus === 'undefined') {
    function filterBooksByStatus(status) {
        console.log('Filtering books by status:', status);
        const tableBody = document.getElementById('booksTableBody');
        if (tableBody) {
            const rows = tableBody.querySelectorAll('tr');
            rows.forEach(row => {
                if (status === '' || status === 'all') {
                    row.style.display = '';
                } else {
                    // Get the status cell (7th column - index 6)
                    const statusCell = row.cells[6];
                    if (statusCell) {
                        const rowStatus = statusCell.textContent.toLowerCase().trim();
                        const matchesStatus = 
                            (status === 'available' && (rowStatus.includes('available') || rowStatus.includes('in stock'))) ||
                            (status === 'out_of_stock' && (rowStatus.includes('out of stock') || rowStatus.includes('unavailable'))) ||
                            (status === 'discontinued' && rowStatus.includes('discontinued'));
                        row.style.display = matchesStatus ? '' : 'none';
                    }
                }
            });
        }
    }
}

if (typeof filterEbooksByStatus === 'undefined') {
    function filterEbooksByStatus(status) {
        console.log('Filtering ebooks by status:', status);
        const tableBody = document.getElementById('ebooksTableBody');
        if (tableBody) {
            const rows = tableBody.querySelectorAll('tr');
            rows.forEach(row => {
                if (status === '' || status === 'all') {
                    row.style.display = '';
                } else {
                    // Get the status cell (8th column - index 7)
                    const statusCell = row.cells[7];
                    if (statusCell) {
                        const rowStatus = statusCell.textContent.toLowerCase().trim();
                        const matchesStatus = 
                            (status === 'available' && rowStatus.includes('available')) ||
                            (status === 'coming_soon' && rowStatus.includes('coming soon')) ||
                            (status === 'discontinued' && rowStatus.includes('discontinued'));
                        row.style.display = matchesStatus ? '' : 'none';
                    }
                }
            });
        }
    }
}

if (typeof filterUsers === 'undefined') {
    function filterUsers(searchTerm) {
        console.log('Filtering users with term:', searchTerm);
        const tableBody = document.getElementById('usersTableBody');
        if (tableBody) {
            const rows = tableBody.querySelectorAll('tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
            });
        }
    }
}

if (typeof filterMessages === 'undefined') {
    function filterMessages(searchTerm) {
        console.log('Filtering messages with term:', searchTerm);
        const tableBody = document.getElementById('messagesTableBody');
        if (tableBody) {
            const rows = tableBody.querySelectorAll('tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
            });
        }
    }
}

// filterTeamMembers function is defined earlier in the file

// Make function globally accessible
window.loadDashboardStats = loadDashboardStats;

// All function definitions are properly implemented above - removed duplicates

// toggleSidebar function is defined earlier in the file

// Add missing save functions
async function saveEbook(form) {
    const formData = new FormData(form);
    const ebookId = form.getAttribute('data-ebook-id');
    const isEdit = !!ebookId;
    
    // Convert checkbox values to proper booleans
    const booleanFields = ['featured', 'bestseller', 'newRelease', 'isFree'];
    booleanFields.forEach(field => {
        const checkbox = form.querySelector(`[name="${field}"]`);
        if (checkbox) {
            formData.set(field, checkbox.checked ? 'true' : 'false');
        }
    });
    
    // Handle file format - set default if not provided
    if (!formData.get('fileFormat')) {
        formData.set('fileFormat', 'PDF');
    }
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitButton.disabled = true;
    
    try {
        let fileUrl = null;
        
        // Handle file upload first if there's an ebook file
        const fileInput = form.querySelector('[name="ebookFile"]');
        if (fileInput && fileInput.files.length > 0) {
            try {
                // Upload the ebook file first
                const uploadFormData = new FormData();
                uploadFormData.append('file', fileInput.files[0]);
                uploadFormData.append('type', 'ebook');
                
                const uploadResponse = await fetch('http://localhost:8080/api/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${getAuthToken()}`
                    },
                    body: uploadFormData
                });
                
                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    fileUrl = uploadResult.fileUrl || uploadResult.url;
                } else {
                    throw new Error('Failed to upload ebook file');
                }
            } catch (uploadError) {
                console.error('Error uploading ebook file:', uploadError);
                showNotification('Failed to upload ebook file', 'error');
                return;
            }
        } else if (!isEdit) {
            // For new ebooks without file, check if downloadUrl is provided
            const downloadUrl = formData.get('downloadUrl');
            if (!downloadUrl) {
                throw new Error('Either upload a file or provide a download URL for new ebooks');
            }
        } else {
            // For edits without new file, keep existing fileUrl
            const existingFileUrl = form.querySelector('[data-existing-file-url]');
            if (existingFileUrl) {
                fileUrl = existingFileUrl.getAttribute('data-existing-file-url');
            }
        }
        
        // Handle cover image upload if present
        let coverImageUrl = null;
        const coverImageFile = form.querySelector('[name="coverImage"]');
        if (coverImageFile && coverImageFile.files.length > 0) {
            try {
                // Upload the cover image first
                const uploadFormData = new FormData();
                uploadFormData.append('file', coverImageFile.files[0]);
                uploadFormData.append('type', 'ebook-cover');
                
                const uploadResult = await apiCall('/api/upload', {
                    method: 'POST',
                    body: uploadFormData
                });
                
                coverImageUrl = uploadResult.fileUrl || uploadResult.url;
            } catch (uploadError) {
                console.error('Error uploading cover image:', uploadError);
                showNotification('Failed to upload cover image', 'error');
                return;
            }
        }
        
        // Create JSON data for the API
        const ebookData = {};
        for (let [key, value] of formData.entries()) {
            // Skip file inputs as they're handled separately
            if (key !== 'ebookFile' && key !== 'coverImage') {
                ebookData[key] = value;
            }
        }
        
        // Set the file URL
        if (fileUrl) {
            ebookData.fileUrl = fileUrl;
        }
        
        // Set the cover image URL if uploaded
        if (coverImageUrl) {
            ebookData.coverImage = coverImageUrl;
        }
        
        const url = isEdit ? `/api/ebooks/${ebookId}` : '/api/ebooks';
        const method = isEdit ? 'PUT' : 'POST';
        
        const result = await apiCall(url, {
            method: method,
            body: JSON.stringify(ebookData)
        });
        
        closeModal();
        loadEbooksData();
        showNotification(isEdit ? 'E-book updated successfully' : 'E-book added successfully', 'success');
    } catch (error) {
        console.error('Error saving ebook:', error);
        showNotification(error.message || 'Failed to save e-book', 'error');
    } finally {
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
    }
}

async function saveProject(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const projectId = form.getAttribute('data-project-id');
    const isEdit = !!projectId;
    
    // Convert checkbox values to proper booleans
    const booleanFields = ['featured', 'acceptingVolunteers'];
    booleanFields.forEach(field => {
        const checkbox = form.querySelector(`[name="${field}"]`);
        if (checkbox) {
            formData.set(field, checkbox.checked ? 'true' : 'false');
        }
    });
    
    // Validate required fields
    const title = formData.get('title');
    const bureau = formData.get('bureau');
    const description = formData.get('description');
    
    if (!title || !bureau || !description) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitButton.disabled = true;
    
    try {
        const url = isEdit ? `/api/projects/${projectId}` : '/api/projects';
        const method = isEdit ? 'PUT' : 'POST';
        
        const result = await apiCall(url, {
            method: method,
            body: formData
        });
        
        closeModal('project');
        loadProjectsData();
        showNotification(isEdit ? 'Project updated successfully' : 'Project added successfully', 'success');
    } catch (error) {
        console.error('Error saving project:', error);
        showNotification(error.message || 'Failed to save project', 'error');
    } finally {
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
    }
}

async function saveActivity(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const activityId = form.getAttribute('data-activity-id');
    const isEdit = !!activityId;
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitButton.disabled = true;
    
    try {
        const url = isEdit ? `/api/activities/${activityId}` : '/api/activities';
        const method = isEdit ? 'PUT' : 'POST';
        
        const result = await apiCall(url, {
            method: method,
            body: formData
        });
        
        closeModal('activity');
        loadActivities();
        showNotification(isEdit ? 'Activity updated successfully' : 'Activity added successfully', 'success');
    } catch (error) {
        console.error('Error saving activity:', error);
        showNotification(error.message || 'Failed to save activity', 'error');
    } finally {
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
    }
}

async function saveInitiative(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const initiativeId = form.getAttribute('data-initiative-id');
    const isEdit = !!initiativeId;
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitButton.disabled = true;
    
    try {
        const url = isEdit ? `/api/initiatives/${initiativeId}` : '/api/initiatives';
        const method = isEdit ? 'PUT' : 'POST';
        
        const result = await apiCall(url, {
            method: method,
            body: formData
        });
        
        closeModal('initiative');
        loadInitiatives();
        showNotification(isEdit ? 'Initiative updated successfully' : 'Initiative added successfully', 'success');
    } catch (error) {
        console.error('Error saving initiative:', error);
        showNotification(error.message || 'Failed to save initiative', 'error');
    } finally {
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
    }
}

// loadJoinItems function is defined earlier in the file

// addCustomQuestion and removeCustomQuestion functions are defined earlier in the file

// saveJoinFormConfig function is defined earlier in the file

async function loadJoinItems() {
    const itemType = document.getElementById('joinItemType').value;
    const itemSelect = document.getElementById('joinItemId');
    
    // Clear existing options
    itemSelect.innerHTML = '<option value="">Loading...</option>';
    
    if (!itemType) {
        itemSelect.innerHTML = '<option value="">Select an item first</option>';
        return;
    }
    
    try {
        const endpoint = itemType === 'project' ? '/api/projects' : 
                        itemType === 'activity' ? '/api/activities' : '/api/initiatives';
        const response = await apiCall(endpoint);
        
        itemSelect.innerHTML = '<option value="">Select an item</option>';
        
        if (response.success && response.data) {
            response.data.forEach(item => {
                const option = document.createElement('option');
                option.value = item._id;
                option.textContent = item.title || item.name;
                itemSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading items:', error);
        itemSelect.innerHTML = '<option value="">Error loading items</option>';
    }
}

function addCustomQuestion() {
    const container = document.getElementById('customQuestions');
    const questionDiv = document.createElement('div');
    questionDiv.className = 'custom-question';
    questionDiv.style.cssText = 'display: flex; gap: 1rem; margin-bottom: 1rem; align-items: end;';
    
    questionDiv.innerHTML = `
        <div style="flex: 1;">
            <input type="text" name="customQuestion[]" class="form-input" placeholder="Enter custom question">
        </div>
        <div style="width: 120px;">
            <select name="questionType[]" class="form-select">
                <option value="text">Text</option>
                <option value="textarea">Long Text</option>
                <option value="select">Dropdown</option>
                <option value="radio">Radio</option>
                <option value="checkbox">Checkbox</option>
            </select>
        </div>
        <button type="button" onclick="removeCustomQuestion(this)" class="btn btn-danger" style="width: 40px; height: 40px; padding: 0;">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    container.appendChild(questionDiv);
}

function removeCustomQuestion(button) {
    button.closest('.custom-question').remove();
}

async function saveJoinFormConfig(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitButton.disabled = true;
    
    try {
        // Convert form data to JSON
        const config = {
            itemType: formData.get('itemType'),
            itemId: formData.get('itemId'),
            formTitle: formData.get('formTitle') || 'Join Our Project',
            formDescription: formData.get('formDescription') || '',
            requiredFields: {
                name: formData.has('requireName'),
                email: formData.has('requireEmail'),
                phone: formData.has('requirePhone'),
                address: formData.has('requireAddress'),
                experience: formData.has('requireExperience'),
                motivation: formData.has('requireMotivation'),
                availability: formData.has('requireAvailability'),
                resume: formData.has('requireResume')
            },
            customQuestions: [],
            successMessage: formData.get('successMessage') || 'Thank you for your interest! We will contact you soon.',
            autoApprove: formData.has('autoApprove'),
            sendNotification: formData.has('sendNotification')
        };
        
        // Process custom questions
        const questions = formData.getAll('customQuestion[]');
        const questionTypes = formData.getAll('questionType[]');
        
        for (let i = 0; i < questions.length; i++) {
            if (questions[i].trim()) {
                config.customQuestions.push({
                    question: questions[i],
                    type: questionTypes[i] || 'text'
                });
            }
        }
        
        const result = await apiCall('/api/join-forms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });
        
        closeModal('joinProjectModal');
        showNotification('Join form configuration saved successfully', 'success');
        
        // Reset form
        form.reset();
        document.getElementById('joinItemId').innerHTML = '<option value="">Select an item first</option>';
        
    } catch (error) {
        console.error('Error saving join form config:', error);
        showNotification(error.message || 'Failed to save join form configuration', 'error');
    } finally {
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
    }
}

async function saveContent(form) {
    const formData = new FormData(form);
    const contentId = form.getAttribute('data-content-id');
    const isEdit = !!contentId;
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitButton.disabled = true;
    
    try {
        // Content API only supports PUT for updates, not POST for creation
        const url = '/api/admin/content';
        const method = 'PUT';
        
        // Convert FormData to JSON for content API
        const contentData = {};
        for (let [key, value] of formData.entries()) {
            contentData[key] = value;
        }
        
        const result = await apiCall(url, {
            method: method,
            body: JSON.stringify(contentData)
        });
        
        closeModal();
        loadContentData();
        showNotification(isEdit ? 'Content updated successfully' : 'Content added successfully', 'success');
    } catch (error) {
        console.error('Error saving content:', error);
        showNotification(error.message || 'Failed to save content', 'error');
    } finally {
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
    }
}

/**
 * Load content for a specific tab
 */
async function loadContentForTab(tabName) {
    try {
        const response = await apiCall(`/api/website-content/sections/${tabName}`, {
            method: 'GET'
        });
        
        if (response.success && response.data) {
            populateContentForms(tabName, response.data);
        }
    } catch (error) {
        console.error('Error loading content:', error);
    }
}

// populateContentForms function is defined earlier in the file

/**
 * Save content section
 */
async function saveContentSection(event, page, section) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitButton.disabled = true;
    
    // Convert form data to content object
    const contentData = {
        page: page,
        section: section,
        title: formData.get('title') || '',
        titleTamil: formData.get('titleTamil') || '',
        content: formData.get('content') || '',
        contentTamil: formData.get('contentTamil') || '',
        image: formData.get('image') || '',
        url: formData.get('url') || '',
        buttonText: formData.get('buttonText') || '',
        buttonTextTamil: formData.get('buttonTextTamil') || '',
        active: formData.get('active') !== 'false',
        metadata: {}
    };
    
    // Handle special fields for different sections
    if (section === 'statistics') {
        contentData.metadata = {
            booksCount: formData.get('booksCount') || 0,
            booksLabel: formData.get('booksLabel') || '',
            booksLabelTamil: formData.get('booksLabelTamil') || '',
            projectsCount: formData.get('projectsCount') || 0,
            projectsLabel: formData.get('projectsLabel') || '',
            projectsLabelTamil: formData.get('projectsLabelTamil') || '',
            membersCount: formData.get('membersCount') || 0,
            membersLabel: formData.get('membersLabel') || '',
            membersLabelTamil: formData.get('membersLabelTamil') || '',
            yearsCount: formData.get('yearsCount') || 0,
            yearsLabel: formData.get('yearsLabel') || '',
            yearsLabelTamil: formData.get('yearsLabelTamil') || ''
        };
    }
    
    if (section === 'menu') {
        contentData.metadata = {
            navigation: {
                home: formData.get('homeText') || '',
                homeTamil: formData.get('homeTextTamil') || '',
                about: formData.get('aboutText') || '',
                aboutTamil: formData.get('aboutTextTamil') || '',
                projects: formData.get('projectsText') || '',
                projectsTamil: formData.get('projectsTextTamil') || '',
                ebooks: formData.get('ebooksText') || '',
                ebooksTamil: formData.get('ebooksTextTamil') || '',
                bookstore: formData.get('bookstoreText') || '',
                bookstoreTamil: formData.get('bookstoreTextTamil') || '',
                contact: formData.get('contactText') || '',
                contactTamil: formData.get('contactTextTamil') || '',
                donate: formData.get('donateText') || '',
                donateTamil: formData.get('donateTextTamil') || '',
                login: formData.get('loginText') || '',
                loginTamil: formData.get('loginTextTamil') || '',
                signup: formData.get('signupText') || '',
                signupTamil: formData.get('signupTextTamil') || ''
            }
        };
    }
    
    if (section === 'logo') {
        contentData.metadata = {
            logoUrl: formData.get('logoUrl') || '',
            logoAlt: formData.get('logoAlt') || '',
            logoAltTamil: formData.get('logoAltTamil') || '',
            logoText: formData.get('logoText') || '',
            logoTextTamil: formData.get('logoTextTamil') || ''
        };
    }
    
    if (section === 'seo') {
        contentData.metadata = {
            siteTitle: formData.get('siteTitle') || '',
            siteTitleTamil: formData.get('siteTitleTamil') || '',
            metaDescription: formData.get('metaDescription') || '',
            metaDescriptionTamil: formData.get('metaDescriptionTamil') || '',
            keywords: formData.get('keywords') || '',
            keywordsTamil: formData.get('keywordsTamil') || ''
        };
    }
    
    try {
        const response = await apiCall('/api/content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contentData)
        });
        
        if (response.success) {
            showNotification('Content saved successfully!', 'success');
            
            // Refresh the content on the live website
            if (window.ContentManager) {
                window.ContentManager.clearCache();
                window.ContentManager.loadContent();
            }
        } else {
            showNotification('Error saving content: ' + response.message, 'error');
        }
    } catch (error) {
        console.error('Error saving content:', error);
        showNotification('Error saving content. Please try again.', 'error');
    } finally {
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
    }
}

// Section type selection handler
document.addEventListener('click', (e) => {
    if (e.target.closest('.section-type-card')) {
        const card = e.target.closest('.section-type-card');
        
        // Remove previous selection
        document.querySelectorAll('.section-type-card').forEach(c => {
            c.classList.remove('selected');
            c.style.border = '2px solid var(--border-secondary)';
            c.style.background = 'var(--glass-bg)';
        });
        
        // Add selection to clicked card
        card.classList.add('selected');
        card.style.border = '2px solid var(--primary-blue)';
        card.style.background = 'var(--bg-accent-light)';
        
        // Update hidden input
        const selectedType = card.dataset.type;
        const hiddenInput = document.getElementById('selectedSectionType');
        if (hiddenInput) {
            hiddenInput.value = selectedType;
        }
    }
});

/**
 * Media Management Functions
 */
let mediaFiles = [];
let filteredMediaFiles = [];
let currentMediaView = 'grid';

// Initialize media management
function initMediaManagement() {
    console.log('Media management initialized');
    loadMediaFiles();
    setupMediaUploadHandlers();
}

// Load all media files
async function loadMediaFiles() {
    try {
        const response = await apiCall('/api/media-upload', 'GET');
        if (response.success) {
            mediaFiles = response.data || [];
            filteredMediaFiles = [...mediaFiles];
            displayMediaFiles();
            updateMediaCount();
        } else {
            console.error('Failed to load media files:', response.message);
            showNotification('Failed to load media files', 'error');
        }
    } catch (error) {
        console.error('Error loading media files:', error);
        showNotification('Error loading media files', 'error');
    }
}

// Display media files in current view
function displayMediaFiles() {
    if (currentMediaView === 'grid') {
        displayMediaGrid();
    } else {
        displayMediaList();
    }
}

// Display media files in grid view
function displayMediaGrid() {
    const container = document.getElementById('mediaGrid');
    if (!container) return;

    if (filteredMediaFiles.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-secondary);">No media files found</div>';
        return;
    }

    container.innerHTML = filteredMediaFiles.map(file => {
        const isImage = file.file_type === 'image';
        const fileSize = formatFileSize(file.file_size);
        const uploadDate = new Date(file.createdAt).toLocaleDateString();
        
        return `
            <div class="media-card" style="background: var(--bg-secondary); border-radius: 0.75rem; overflow: hidden; box-shadow: var(--shadow-md); transition: all 0.3s ease;">
                <div class="media-preview" style="height: 200px; background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center; position: relative;">
                    ${isImage ? 
                        `<img src="${file.file_url}" alt="${file.alt_text || file.original_filename}" style="width: 100%; height: 100%; object-fit: cover;">` :
                        `<i class="fas fa-file-${getFileIcon(file.file_type)}" style="font-size: 3rem; color: var(--text-tertiary);"></i>`
                    }
                    <div class="media-overlay" style="position: absolute; top: 0.5rem; right: 0.5rem; display: flex; gap: 0.25rem;">
                        <button class="btn btn-sm" onclick="downloadMedia('${file._id}')" style="background: rgba(0,0,0,0.7); color: white; border: none; padding: 0.25rem 0.5rem;">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-sm" onclick="deleteMedia('${file._id}')" style="background: rgba(220,38,38,0.8); color: white; border: none; padding: 0.25rem 0.5rem;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="media-info" style="padding: 1rem;">
                    <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; color: var(--text-primary); word-break: break-word;">${file.original_filename}</h4>
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--text-secondary);">
                        <span>${file.category}</span>
                        <span>${fileSize}</span>
                    </div>
                    <div style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-tertiary);">
                        ${uploadDate}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Display media files in list view
function displayMediaList() {
    const tbody = document.getElementById('mediaTableBody');
    if (!tbody) return;

    if (filteredMediaFiles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No media files found</td></tr>';
        return;
    }

    tbody.innerHTML = filteredMediaFiles.map(file => {
        const isImage = file.file_type === 'image';
        const fileSize = formatFileSize(file.file_size);
        const uploadDate = new Date(file.createdAt).toLocaleDateString();
        
        return `
            <tr>
                <td style="width: 60px;">
                    ${isImage ? 
                        `<img src="${file.file_url}" alt="${file.alt_text || file.original_filename}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 0.25rem;">` :
                        `<i class="fas fa-file-${getFileIcon(file.file_type)}" style="font-size: 1.5rem; color: var(--text-tertiary);"></i>`
                    }
                </td>
                <td style="word-break: break-word;">${file.original_filename}</td>
                <td>${file.file_type}</td>
                <td>${fileSize}</td>
                <td>${file.category}</td>
                <td>${uploadDate}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-sm btn-primary" onclick="downloadMedia('${file._id}')">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteMedia('${file._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}



// getFileIcon function is defined earlier in the file

// formatFileSize function is defined earlier in the file









/**
 * Switch between tabs in the section creator modal
 */
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'var(--bg-tertiary)';
        btn.style.color = 'var(--text-secondary)';
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    
    // Activate selected tab
    const activeBtn = document.querySelector(`.tab-btn[onclick*="${tabName}"]`);
    const activeContent = document.getElementById(`${tabName}Tab`);
    
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.style.background = 'var(--glass-bg)';
        activeBtn.style.color = 'var(--text-primary)';
    }
    
    if (activeContent) {
        activeContent.classList.add('active');
        activeContent.style.display = 'block';
    }
}

/**
 * Enhanced section type card hover effects
 */
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to section type cards
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest('.section-type-card') && !e.target.closest('.section-type-card').classList.contains('selected')) {
            const card = e.target.closest('.section-type-card');
            card.style.background = 'var(--bg-accent)';
            card.style.transform = 'translateY(-2px)';
            card.style.boxShadow = 'var(--shadow-xl)';
        }
    });
    
    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('.section-type-card') && !e.target.closest('.section-type-card').classList.contains('selected')) {
            const card = e.target.closest('.section-type-card');
            card.style.background = 'var(--glass-bg)';
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'none';
        }
    });
    
    // Add hover effects to tab buttons
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest('.tab-btn') && !e.target.closest('.tab-btn').classList.contains('active')) {
            const btn = e.target.closest('.tab-btn');
            btn.style.background = 'var(--bg-secondary)';
            btn.style.color = 'var(--text-primary)';
        }
    });
    
    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('.tab-btn') && !e.target.closest('.tab-btn').classList.contains('active')) {
            const btn = e.target.closest('.tab-btn');
            btn.style.background = 'var(--bg-tertiary)';
            btn.style.color = 'var(--text-secondary)';
        }
    });
    
    // Add hover effects to form action buttons
    document.addEventListener('mouseover', (e) => {
        if (e.target.matches('.btn.btn-secondary')) {
            e.target.style.background = 'var(--bg-accent)';
            e.target.style.transform = 'translateY(-1px)';
        }
        if (e.target.matches('.btn.btn-primary')) {
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = 'var(--shadow-primary-lg)';
        }
    });
    
    document.addEventListener('mouseout', (e) => {
        if (e.target.matches('.btn.btn-secondary')) {
            e.target.style.background = 'var(--glass-bg)';
            e.target.style.transform = 'translateY(0)';
        }
        if (e.target.matches('.btn.btn-primary')) {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'var(--shadow-primary)';
        }
    });
});

/**
 * Show content editor for the currently selected page
 */
function showContentEditorForSelectedPage() {
    const pageSelector = document.getElementById('pageSelector');
    const selectedPage = pageSelector ? pageSelector.value : 'global';
    
    // Enable content editor visibility if ContentEditor is available
    if (window.contentEditor && typeof window.contentEditor.enableContentEditor === 'function') {
        window.contentEditor.enableContentEditor();
    }
    
    // First, show the content editor for the selected page
    const currentEditor = document.getElementById(`content-editor-${selectedPage}`);
    if (currentEditor) {
        // Remove the 'active' class from all editors first
        document.querySelectorAll('.page-content-editor').forEach(editor => {
            editor.classList.remove('active');
        });
        
        // Add 'active' class to show the current editor
        currentEditor.classList.add('active');
        
        // Switch to the selected page content editor
        switchContentPage(selectedPage);
        
        // Scroll to the content editor area
        const contentEditorArea = document.querySelector('.content-editor-area');
        if (contentEditorArea) {
            contentEditorArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        showNotification(`Content editor opened for ${getPageDisplayName(selectedPage)}`, 'info');
    } else {
        showNotification(`Content editor not found for ${getPageDisplayName(selectedPage)}`, 'error');
    }
}

/**
 * Show section creator for the currently selected page
 */
function showSectionCreatorForSelectedPage() {
    const pageSelector = document.getElementById('pageSelector');
    const selectedPage = pageSelector ? pageSelector.value : 'global';
    
    console.log('showSectionCreatorForSelectedPage: Selected page:', selectedPage);
    
    // Show the section creator modal with the selected page
    showSectionCreator(selectedPage);
    
    showNotification(`Section creator opened for ${getPageDisplayName(selectedPage)}`, 'info');
}

/**
 * Refresh content for the currently selected page
 */
function refreshPageContent() {
    const pageSelector = document.getElementById('pageSelector');
    const selectedPage = pageSelector ? pageSelector.value : 'global';
    
    if (selectedPage === 'global') {
        showNotification('Please select a specific page to refresh', 'warning');
        return;
    }
    
    // Show loading notification
    showNotification(`Refreshing content for ${getPageDisplayName(selectedPage)}...`, 'info');
    
    // Call the refresh API endpoint
    fetch(`/api/content/refresh/${selectedPage}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        const sectionCount = data.sections ? data.sections.length : 0;
        showNotification(`Content refreshed for ${getPageDisplayName(selectedPage)} with ${sectionCount} sections`, 'success');
        
        // Refresh the content editor if it's currently showing this page
        if (typeof window.contentEditor !== 'undefined' && window.contentEditor.currentPage === selectedPage) {
            window.contentEditor.loadPageContent(selectedPage);
        }
    })
    .catch(error => {
        console.error('Error refreshing page content:', error);
        showNotification(`Failed to refresh content for ${getPageDisplayName(selectedPage)}: ${error.message}`, 'error');
    });
}

/**
 * Get display name for a page
 */
function getPageDisplayName(page) {
    const pageNames = {
        'global': 'Global Elements',
        'home': 'Home Page',
        'about': 'About Page',
        'books': 'Books Page',
        'projects': 'Projects Page',
        'ebooks': 'E-books Page',
        'contact': 'Contact Page',
        'donate': 'Donate Page',
        'signup': 'Sign Up Page',
        'login': 'Login Page'
    };
    return pageNames[page] || `${page.charAt(0).toUpperCase() + page.slice(1)} Page`;
}

/**
 * Update the selected page info display
 */
function updateSelectedPageInfo(page) {
    const pageInfo = document.getElementById('selectedPageInfo');
    if (pageInfo) {
        pageInfo.textContent = `${getPageDisplayName(page)} Selected`;
    }
}

// Enhanced switchContentPage function to update page info
// Use the content editor's switchContentPage function
if (typeof window.switchContentPage === 'undefined') {
    window.switchContentPage = function(page) {
        if (window.contentEditor && window.contentEditor.switchContentPage) {
            window.contentEditor.switchContentPage(page);
        }
        updateSelectedPageInfo(page);
    };
}

// Initialize admin language toggle functionality
function initializeAdminLanguageToggle() {
    const languageButtons = document.querySelectorAll('.admin-language-toggle .lang-btn');
    const currentLanguage = localStorage.getItem('admin_preferred_language') || 'english';
    
    // Set initial active state
    languageButtons.forEach(btn => {
        if (btn.dataset.lang === currentLanguage) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Add click handlers
    languageButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const selectedLang = this.dataset.lang;
            
            // Update active states
            languageButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Save preference
            localStorage.setItem('admin_preferred_language', selectedLang);
            
            // Toggle content visibility based on language
            toggleContentLanguage(selectedLang);
            
            // Show notification
            showNotification(`Switched to ${selectedLang === 'english' ? 'English' : 'Tamil'} editing mode`, 'success');
        });
    });
    
    // Initialize with current language
    toggleContentLanguage(currentLanguage);
}

// Toggle content language visibility
function toggleContentLanguage(language) {
    const englishFields = document.querySelectorAll('[data-lang="english"], .english-content');
    const tamilFields = document.querySelectorAll('[data-lang="tamil"], .tamil-content, .tamil-text');
    
    if (language === 'english') {
        englishFields.forEach(field => {
            field.style.display = 'block';
            field.style.opacity = '1';
        });
        tamilFields.forEach(field => {
            field.style.display = 'none';
            field.style.opacity = '0.5';
        });
    } else {
        englishFields.forEach(field => {
            field.style.display = 'none';
            field.style.opacity = '0.5';
        });
        tamilFields.forEach(field => {
            field.style.display = 'block';
            field.style.opacity = '1';
        });
    }
}

/**
 * Get content for a specific field from the global content store
 */
function getContentForField(fieldName) {
    if (!window.allContent) return '';
    
    // Search through all content pages for the field
    for (const page in window.allContent) {
        const pageContent = window.allContent[page];
        if (pageContent && pageContent[fieldName]) {
            return pageContent[fieldName];
        }
        
        // Check nested metadata
        if (pageContent && pageContent.metadata) {
            for (const section in pageContent.metadata) {
                const sectionData = pageContent.metadata[section];
                if (sectionData && sectionData[fieldName]) {
                    return sectionData[fieldName];
                }
            }
        }
    }
    
    return '';
}

/**
 * Test navigation functionality
 */
function testNavigation() {
    console.log('[TEST] Testing Navigation Functionality...');
    
    const sections = ['dashboard', 'books', 'ebooks', 'projects', 'users', 'website-content', 'messages', 'settings'];
    let currentIndex = 0;
    
    function testNextSection() {
        if (currentIndex >= sections.length) {
            console.log('[SUCCESS] Navigation test completed! All sections tested.');
            showNotification('Navigation test completed successfully!', 'success');
            return;
        }
        
        const sectionId = sections[currentIndex];
        console.log(`[INFO] Testing navigation to: ${sectionId}`);
        
        try {
            showSection(sectionId);
            currentIndex++;
            setTimeout(testNextSection, 1500); // Wait 1.5 seconds between tests
        } catch (error) {
            console.error(`[ERROR] Failed to navigate to ${sectionId}:`, error);
            currentIndex++;
            setTimeout(testNextSection, 1500);
        }
    }
    
    testNextSection();
}

// Missing button handler functions
// showContentEditorForSelectedPage function is defined earlier in the file

// showSectionCreatorForSelectedPage function is defined earlier in the file

// closeSectionCreator function is defined earlier in the file

// toggleSidebar function is defined elsewhere in this file

// Additional missing functions referenced in onclick attributes
// logout function is defined earlier in the file

// testBackendConnection already exists earlier in the file

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        console.log(`Opened modal: ${modalId}`);
    } else {
        console.warn(`Modal not found: ${modalId}`);
    }
}

function closeModal(modalId) {
    const modal = modalId ? document.getElementById(modalId) : document.querySelector('.modal:not([style*="display: none"])');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        
        // Clear any form data if it's a form modal
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
        
        console.log(`Closed modal: ${modalId || 'active modal'}`);
    }
}

function testAPI() {
    console.log('Testing API endpoints...');
    
    if (typeof showNotification === 'function') {
        showNotification('Testing API endpoints...', 'info');
    }
    
    const endpoints = [
        '/api/website-content/sections/home',
        '/api/website-content/sections/about',
        '/api/website-content/sections/books',
        '/api/website-content/sections/ebooks',
        '/api/website-content/sections/contact'
    ];
    
    let successCount = 0;
    let totalCount = endpoints.length;
    
    endpoints.forEach(async (endpoint, index) => {
        try {
            const response = await fetch(`http://localhost:8080${endpoint}`);
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${endpoint}: ${data.sections ? data.sections.length : 0} sections`);
                successCount++;
            } else {
                console.log(`❌ ${endpoint}: Status ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ ${endpoint}: ${error.message}`);
        }
        
        // Show final result after all tests
        if (index === totalCount - 1) {
            setTimeout(() => {
                if (typeof showNotification === 'function') {
                    showNotification(`API test completed: ${successCount}/${totalCount} endpoints working`, 
                        successCount === totalCount ? 'success' : 'warning');
                }
            }, 1000);
        }
    });
}

function testServerConnection() {
    console.log('Testing server connection...');
    testBackendConnection(); // Reuse the backend connection test
}

// testAdminPanel already exists earlier in the file

// Make functions globally available
window.updateEditor = updateEditor;
window.testNavigation = testNavigation;
window.showContentEditorForSelectedPage = showContentEditorForSelectedPage;
window.showSectionCreatorForSelectedPage = showSectionCreatorForSelectedPage;
window.closeSectionCreator = closeSectionCreator;
window.toggleSidebar = toggleSidebar;
window.logout = logout;
window.openModal = openModal;
window.closeModal = closeModal;
window.testAPI = testAPI;
window.testServerConnection = testServerConnection;
// testBackendConnection and testAdminPanel are already assigned globally earlier in the file

// Initialize language toggle when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for other initializations to complete
    setTimeout(() => {
        initializeAdminLanguageToggle();
        initializeSlideshowManagement();
    }, 500);
});

// Slideshow Management Functions
function initializeSlideshowManagement() {
    // Load slideshow settings
    loadSlideshowSettings();
    
    // Load current slides
    loadCurrentSlides();
    
    // Load page selection
    loadPageSelection();
    
    // Initialize drag and drop for slide upload
    initializeSlideDragDrop();
}

async function loadSlideshowSettings() {
    try {
        const response = await fetch('/api/slideshow/settings', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                const settings = result.data;
                document.getElementById('slideshowInterval').value = settings.interval || 5;
                document.getElementById('slideshowAutoplay').value = (settings.autoPlay !== false).toString();
                document.getElementById('slideshowControls').value = (settings.showControls !== false).toString();
                document.getElementById('slideshowIndicators').value = (settings.showIndicators !== false).toString();
                return;
            }
        }
    } catch (error) {
        console.error('Error loading slideshow settings from API:', error);
    }
    
    // Fallback to defaults if API fails
    document.getElementById('slideshowInterval').value = 5;
    document.getElementById('slideshowAutoplay').value = 'true';
    document.getElementById('slideshowControls').value = 'true';
    document.getElementById('slideshowIndicators').value = 'true';
}

async function saveSlideshowSettings() {
    try {
        const settings = {
            interval: parseInt(document.getElementById('slideshowInterval').value) || 5,
            autoPlay: document.getElementById('slideshowAutoplay').value === 'true',
            showControls: document.getElementById('slideshowControls').value === 'true',
            showIndicators: document.getElementById('slideshowIndicators').value === 'true'
        };
        
        const response = await fetch('/api/slideshow/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(settings)
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                showNotification('Slideshow settings saved successfully', 'success');
                
                // Update slideshow instances if they exist
                if (window.HeroSlideshow && window.HeroSlideshow.instances) {
                    window.HeroSlideshow.instances.forEach(instance => {
                        instance.updateSettings(settings);
                    });
                }
                return;
            }
        }
        
        throw new Error('Failed to save settings');
    } catch (error) {
        console.error('Error saving slideshow settings:', error);
        showNotification('Failed to save slideshow settings', 'error');
    }
}

async function loadCurrentSlides() {
    const container = document.getElementById('slidesContainer');
    container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-tertiary);"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i><p>Loading slides...</p></div>';
    
    try {
        const response = await fetch('/api/slides', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                displaySlides(result.data);
                return;
            }
        }
        
        throw new Error('Failed to load slides');
    } catch (error) {
        console.error('Error loading slides:', error);
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-tertiary);"><i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem; color: var(--danger-red);"></i><p>Error loading slides. Please try again.</p></div>';
    }
}

function displaySlides(slides) {
    const container = document.getElementById('slidesContainer');
    
    if (slides.length === 0) {
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-tertiary);"><i class="fas fa-images" style="font-size: 3rem; margin-bottom: 1rem;"></i><p>No slides uploaded yet. Click "Add Slide" to get started.</p></div>';
        return;
    }
    
    container.innerHTML = slides.map((slide) => `
        <div class="slide-card" data-slide-id="${slide._id}">
            <div class="slide-image-container">
                <img src="/slides/${slide.image_path}" alt="${slide.alt_text || slide.title || 'Slideshow image'}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 0.5rem;">
                <div class="slide-overlay">
                    <button class="btn btn-sm btn-danger" onclick="deleteSlide('${slide._id}')" title="Delete Slide">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="editSlide('${slide._id}')" title="Edit Slide">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
            <div class="slide-info" style="padding: 1rem;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem;">${slide.title || 'Untitled Slide'}</h4>
                <p style="margin: 0; font-size: 0.8rem; color: var(--text-tertiary);">Order: ${slide.sort_order || 0}</p>
                <p style="margin: 0.5rem 0 0 0; font-size: 0.8rem; color: var(--text-tertiary);">Added: ${new Date(slide.created_at).toLocaleDateString()}</p>
            </div>
        </div>
    `).join('');
    
    // Add CSS for slide cards if not already added
    if (!document.getElementById('slideCardStyles')) {
        const style = document.createElement('style');
        style.id = 'slideCardStyles';
        style.textContent = `
            .slide-card {
                background: var(--bg-secondary);
                border: 1px solid var(--border-secondary);
                border-radius: 0.75rem;
                overflow: hidden;
                transition: all 0.3s ease;
                position: relative;
            }
            .slide-card:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-lg);
            }
            .slide-image-container {
                position: relative;
                overflow: hidden;
            }
            .slide-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: var(--overlay-dark);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            .slide-card:hover .slide-overlay {
                opacity: 1;
            }
            .slide-info {
                background: var(--bg-secondary);
            }
        `;
        document.head.appendChild(style);
    }
}

function openSlideshowUpload() {
    const uploadSection = document.getElementById('slideUploadSection');
    uploadSection.style.display = 'block';
    uploadSection.scrollIntoView({ behavior: 'smooth' });
}

function cancelSlideUpload() {
    const uploadSection = document.getElementById('slideUploadSection');
    if (uploadSection) {
        uploadSection.style.display = 'none';
    }
    
    // Reset form with null checks
    const slideTitle = document.getElementById('slideTitle');
    const slideOrder = document.getElementById('slideOrder');
    const slideFileInput = document.getElementById('slideFileInput');
    const slideAlt = document.getElementById('slideAlt');
    
    if (slideTitle) slideTitle.value = '';
    if (slideOrder) slideOrder.value = '1';
    if (slideFileInput) slideFileInput.value = '';
    if (slideAlt) slideAlt.value = '';
    
    // Reset upload area
    const uploadArea = document.getElementById('slideUploadArea');
    if (uploadArea) {
        uploadArea.innerHTML = `
            <div class="image-upload-text">
                <i class="fas fa-cloud-upload-alt" style="font-size: 3rem; color: var(--text-tertiary); margin-bottom: 1rem;"></i>
                <p>Drag and drop an image here or click to browse</p>
                <p style="font-size: 0.8rem; color: var(--text-tertiary);">Recommended: 1920x1080px, JPG/PNG, Max 5MB</p>
            </div>
            <input type="file" id="slideFileInput" accept="image/*" style="display: none;">
        `;
        
        // Re-initialize drag and drop
        initializeSlideDragDrop();
    }
}

function initializeSlideDragDrop() {
    const uploadArea = document.getElementById('slideUploadArea');
    const fileInput = document.getElementById('slideFileInput');
    
    if (!uploadArea || !fileInput) return;
    
    // Click to browse
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleSlideFile(e.target.files[0]);
        }
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            handleSlideFile(files[0]);
        }
    });
}

function handleSlideFile(file) {
    // Validate file
    if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showNotification('File size must be less than 5MB', 'error');
        return;
    }
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        const uploadArea = document.getElementById('slideUploadArea');
        uploadArea.innerHTML = `
            <div style="text-align: center;">
                <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 300px; border-radius: 0.5rem; margin-bottom: 1rem;">
                <p style="color: var(--text-secondary); font-size: 0.9rem;">${file.name}</p>
                <p style="color: var(--text-tertiary); font-size: 0.8rem;">${(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
        `;
    };
    reader.readAsDataURL(file);
    
    // Store file for upload
    window.selectedSlideFile = file;
}

async function uploadSlide() {
    if (!window.selectedSlideFile) {
        showNotification('Please select an image file first', 'error');
        return;
    }
    
    const titleElement = document.getElementById('slideTitle');
    const orderElement = document.getElementById('slideOrder');
    const altElement = document.getElementById('slideAlt');
    
    if (!titleElement || !orderElement) {
        showNotification('Form elements not found', 'error');
        return;
    }
    
    const title = titleElement.value.trim();
    const order = parseInt(orderElement.value) || 1;
    const altText = altElement ? altElement.value.trim() : '';
    
    try {
        // Show loading
        const uploadArea = document.getElementById('slideUploadArea');
        uploadArea.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary-blue);"></i><p>Uploading slide...</p></div>';
        
        // Create form data
        const formData = new FormData();
        formData.append('image', window.selectedSlideFile);
        formData.append('title', title || 'Slideshow Image');
        formData.append('alt_text', altText || title || 'Slideshow Image');
        formData.append('sort_order', order);
        formData.append('is_active', 'true');
        
        // Upload to slides API
        const response = await fetch('/api/slides', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                // Reload slides display
                await loadCurrentSlides();
                
                // Hide upload section
                cancelSlideUpload();
                
                showNotification('Slide uploaded successfully', 'success');
                
                // Clear stored file
                delete window.selectedSlideFile;
                return;
            }
        }
        
        throw new Error('Failed to upload slide');
        
    } catch (error) {
        console.error('Error uploading slide:', error);
        showNotification('Failed to upload slide', 'error');
        
        // Reset upload area
        cancelSlideUpload();
    }
}

async function deleteSlide(slideId) {
    if (!confirm('Are you sure you want to delete this slide?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/slides/${slideId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                await loadCurrentSlides();
                showNotification('Slide deleted successfully', 'success');
                return;
            }
        }
        
        throw new Error('Failed to delete slide');
    } catch (error) {
        console.error('Error deleting slide:', error);
        showNotification('Failed to delete slide', 'error');
    }
}

async function editSlide(slideId) {
    try {
        // Get current slide data first
        const response = await fetch('/api/slideshow/images');
        if (!response.ok) throw new Error('Failed to load slide data');
        
        const result = await response.json();
        if (!result.success) throw new Error('Failed to load slide data');
        
        const slide = result.data.find(s => s.id === slideId);
        if (!slide) {
            showNotification('Slide not found', 'error');
            return;
        }
        
        const newTitle = prompt('Enter new title:', slide.title || '');
        if (newTitle === null) return; // User cancelled
        
        const newOrder = prompt('Enter new order:', slide.display_order || 1);
        if (newOrder === null) return; // User cancelled
        
        const newAlt = prompt('Enter new alt text:', slide.alt || '');
        if (newAlt === null) return; // User cancelled
        
        const updateData = {
            title: newTitle.trim() || 'Untitled Slide',
            display_order: parseInt(newOrder) || 1,
            alt: newAlt.trim() || newTitle.trim() || 'Slideshow Image'
        };
        
        const updateResponse = await fetch(`/api/slideshow/images/${slideId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(updateData)
        });
        
        if (updateResponse.ok) {
            const updateResult = await updateResponse.json();
            if (updateResult.success) {
                await loadCurrentSlides();
                showNotification('Slide updated successfully', 'success');
                return;
            }
        }
        
        throw new Error('Failed to update slide');
    } catch (error) {
        console.error('Error editing slide:', error);
        showNotification('Failed to update slide', 'error');
    }
}

function exportSlideshowSettings() {
    try {
        const settings = JSON.parse(localStorage.getItem('slideshowSettings')) || {};
        const slides = JSON.parse(localStorage.getItem('slideshowImages')) || [];
        
        const exportData = {
            settings,
            slides,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `slideshow-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        showNotification('Slideshow settings exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting slideshow settings:', error);
        showNotification('Failed to export slideshow settings', 'error');
    }
}

// Image upload functions for projects, activities, and initiatives
async function uploadProjectImage(projectId, fileInput) {
    if (!fileInput.files || !fileInput.files[0]) {
        showNotification('Please select an image file', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    
    try {
        const result = await apiCall(`/api/projects/${projectId}/upload-image`, {
            method: 'POST',
            body: formData
        });
        
        showNotification('Project image uploaded successfully', 'success');
        return result.data.imageUrl;
    } catch (error) {
        console.error('Error uploading project image:', error);
        showNotification(error.message || 'Failed to upload project image', 'error');
        throw error;
    }
}

async function uploadActivityImage(activityId, fileInput) {
    if (!fileInput.files || !fileInput.files[0]) {
        showNotification('Please select an image file', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    
    try {
        const result = await apiCall(`/api/activities/${activityId}/upload-image`, {
            method: 'POST',
            body: formData
        });
        
        showNotification('Activity image uploaded successfully', 'success');
        return result.data.imageUrl;
    } catch (error) {
        console.error('Error uploading activity image:', error);
        showNotification(error.message || 'Failed to upload activity image', 'error');
        throw error;
    }
}

async function uploadInitiativeImage(initiativeId, fileInput) {
    if (!fileInput.files || !fileInput.files[0]) {
        showNotification('Please select an image file', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    
    try {
        const result = await apiCall(`/api/initiatives/${initiativeId}/upload-image`, {
            method: 'POST',
            body: formData
        });
        
        showNotification('Initiative image uploaded successfully', 'success');
        return result.data.imageUrl;
    } catch (error) {
        console.error('Error uploading initiative image:', error);
        showNotification(error.message || 'Failed to upload initiative image', 'error');
        throw error;
    }
}

/**
 * Remove existing image from project
 * @param {string} imageId - The ID of the image to remove
 * @param {Element} buttonElement - The remove button element
 */
async function removeExistingImage(imageId, buttonElement) {
    if (!confirm('Are you sure you want to remove this image?')) {
        return;
    }
    
    try {
        const projectId = document.getElementById('project-form').getAttribute('data-project-id');
        if (!projectId) {
            showNotification('Project ID not found', 'error');
            return;
        }
        
        await apiCall(`/api/projects/${projectId}/images/${imageId}`, {
            method: 'DELETE'
        });
        
        // Remove the image preview element
        const imagePreviewItem = buttonElement.closest('.image-preview-item');
        if (imagePreviewItem) {
            imagePreviewItem.remove();
        }
        
        showNotification('Image removed successfully', 'success');
    } catch (error) {
        console.error('Error removing image:', error);
        showNotification(error.message || 'Failed to remove image', 'error');
    }
}

/**
 * Handle multiple image file selection for projects
 * @param {Event} event - The file input change event
 */
function handleProjectImageSelection(event) {
    const files = event.target.files;
    const previewContainer = document.getElementById('project-images-preview');
    
    if (!previewContainer) return;
    
    Array.from(files).forEach((file, index) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageDiv = document.createElement('div');
                imageDiv.className = 'image-preview-item new-image';
                imageDiv.innerHTML = `
                    <img src="${e.target.result}" alt="New image ${index + 1}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;">
                    <button type="button" class="btn btn-sm btn-danger" onclick="removeNewImage(this)">Remove</button>
                    <span class="badge badge-info">New</span>
                `;
                previewContainer.appendChild(imageDiv);
            };
            reader.readAsDataURL(file);
        }
    });
}

/**
 * Remove new image from preview (not yet uploaded)
 * @param {Element} buttonElement - The remove button element
 */
function removeNewImage(buttonElement) {
    const imagePreviewItem = buttonElement.closest('.image-preview-item');
    if (imagePreviewItem) {
        imagePreviewItem.remove();
    }
}

/**
 * Set primary image for project
 * @param {string} imageId - The ID of the image to set as primary
 * @param {Element} buttonElement - The set primary button element
 */
async function setPrimaryImage(imageId, buttonElement) {
    try {
        const projectId = document.getElementById('project-form').getAttribute('data-project-id');
        if (!projectId) {
            showNotification('Project ID not found', 'error');
            return;
        }
        
        await apiCall(`/api/projects/${projectId}/images/${imageId}/primary`, {
            method: 'PUT'
        });
        
        // Update UI to show new primary image
        const allPrimaryBadges = document.querySelectorAll('.badge-primary');
        allPrimaryBadges.forEach(badge => {
            if (badge.textContent === 'Primary') {
                badge.remove();
            }
        });
        
        // Add primary badge to current image
        const imagePreviewItem = buttonElement.closest('.image-preview-item');
        if (imagePreviewItem) {
            const badge = document.createElement('span');
            badge.className = 'badge badge-primary';
            badge.textContent = 'Primary';
            imagePreviewItem.appendChild(badge);
        }
        
        showNotification('Primary image updated successfully', 'success');
    } catch (error) {
        console.error('Error setting primary image:', error);
        showNotification(error.message || 'Failed to set primary image', 'error');
    }
}

/**
 * Handle activity image selection
 * @param {Event} event - The file input change event
 */
function handleActivityImageSelection(event) {
    const files = event.target.files;
    const previewContainer = document.getElementById('activity-images-preview');
    
    if (!previewContainer) return;
    
    Array.from(files).forEach((file, index) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageDiv = document.createElement('div');
                imageDiv.className = 'image-preview-item new-image';
                imageDiv.innerHTML = `
                    <img src="${e.target.result}" alt="New image ${index + 1}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;">
                    <button type="button" class="btn btn-sm btn-danger" onclick="removeActivityImage(this)">Remove</button>
                    <span class="badge badge-info">New</span>
                `;
                previewContainer.appendChild(imageDiv);
            };
            reader.readAsDataURL(file);
        }
    });
}

/**
 * Handle initiative image selection
 * @param {Event} event - The file input change event
 */
function handleInitiativeImageSelection(event) {
    const files = event.target.files;
    const previewContainer = document.getElementById('initiative-images-preview');
    
    if (!previewContainer) return;
    
    Array.from(files).forEach((file, index) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageDiv = document.createElement('div');
                imageDiv.className = 'image-preview-item new-image';
                imageDiv.innerHTML = `
                    <img src="${e.target.result}" alt="New image ${index + 1}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;">
                    <button type="button" class="btn btn-sm btn-danger" onclick="removeInitiativeImage(this)">Remove</button>
                    <span class="badge badge-info">New</span>
                `;
                previewContainer.appendChild(imageDiv);
            };
            reader.readAsDataURL(file);
        }
    });
}

/**
 * Remove activity image from preview
 * @param {Element} buttonElement - The remove button element
 */
function removeActivityImage(buttonElement) {
    const imagePreviewItem = buttonElement.closest('.image-preview-item');
    if (imagePreviewItem) {
        imagePreviewItem.remove();
    }
}

/**
 * Remove initiative image from preview
 * @param {Element} buttonElement - The remove button element
 */
function removeInitiativeImage(buttonElement) {
    const imagePreviewItem = buttonElement.closest('.image-preview-item');
    if (imagePreviewItem) {
        imagePreviewItem.remove();
    }
}

/**
 * Set primary image for activity
 * @param {string} imageId - The ID of the image to set as primary
 * @param {Element} buttonElement - The set primary button element
 */
async function setActivityPrimaryImage(imageId, buttonElement) {
    try {
        const activityId = document.getElementById('activity-form').getAttribute('data-activity-id');
        if (!activityId) {
            showNotification('Activity ID not found', 'error');
            return;
        }
        
        await apiCall(`/api/activities/${activityId}/images/${imageId}/primary`, {
            method: 'PUT'
        });
        
        // Update UI to show new primary image
        const allPrimaryBadges = document.querySelectorAll('#activity-images-preview .badge-primary');
        allPrimaryBadges.forEach(badge => {
            if (badge.textContent === 'Primary') {
                badge.remove();
            }
        });
        
        // Add primary badge to current image
        const imagePreviewItem = buttonElement.closest('.image-preview-item');
        if (imagePreviewItem) {
            const badge = document.createElement('span');
            badge.className = 'badge badge-primary';
            badge.textContent = 'Primary';
            imagePreviewItem.appendChild(badge);
        }
        
        showNotification('Primary image updated successfully', 'success');
    } catch (error) {
        console.error('Error setting primary image:', error);
        showNotification(error.message || 'Failed to set primary image', 'error');
    }
}

/**
 * Set primary image for initiative
 * @param {string} imageId - The ID of the image to set as primary
 * @param {Element} buttonElement - The set primary button element
 */
async function setInitiativePrimaryImage(imageId, buttonElement) {
    try {
        const initiativeId = document.getElementById('initiative-form').getAttribute('data-initiative-id');
        if (!initiativeId) {
            showNotification('Initiative ID not found', 'error');
            return;
        }
        
        await apiCall(`/api/initiatives/${initiativeId}/images/${imageId}/primary`, {
            method: 'PUT'
        });
        
        // Update UI to show new primary image
        const allPrimaryBadges = document.querySelectorAll('#initiative-images-preview .badge-primary');
        allPrimaryBadges.forEach(badge => {
            if (badge.textContent === 'Primary') {
                badge.remove();
            }
        });
        
        // Add primary badge to current image
        const imagePreviewItem = buttonElement.closest('.image-preview-item');
        if (imagePreviewItem) {
            const badge = document.createElement('span');
            badge.className = 'badge badge-primary';
            badge.textContent = 'Primary';
            imagePreviewItem.appendChild(badge);
        }
        
        showNotification('Primary image updated successfully', 'success');
    } catch (error) {
        console.error('Error setting primary image:', error);
        showNotification(error.message || 'Failed to set primary image', 'error');
    }
}

// Make slideshow functions globally available
// Page Selection Functions
async function savePageSelection() {
    try {
        const checkboxes = document.querySelectorAll('#pageSelectionForm input[type="checkbox"]:checked');
        const selectedPages = Array.from(checkboxes).map(cb => cb.value);
        
        if (selectedPages.length === 0) {
            showNotification('Please select at least one page', 'error');
            return;
        }
        
        const response = await fetch('/api/slideshow/page-selection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ pages: selectedPages })
        });
        
        if (response.ok) {
            showNotification('Page selection saved successfully', 'success');
        } else {
            throw new Error('Failed to save page selection');
        }
    } catch (error) {
        console.error('Error saving page selection:', error);
        showNotification('Error saving page selection', 'error');
    }
}

async function loadPageSelection() {
    try {
        const response = await fetch('/api/slideshow/page-selection', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const selectedPages = data.pages || [];
            
            // Update checkboxes
            const checkboxes = document.querySelectorAll('#pageSelectionForm input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectedPages.includes(checkbox.value);
            });
        }
    } catch (error) {
        console.error('Error loading page selection:', error);
    }
}

window.openSlideshowUpload = openSlideshowUpload;
window.cancelSlideUpload = cancelSlideUpload;
window.uploadSlide = uploadSlide;
window.deleteSlide = deleteSlide;
window.editSlide = editSlide;
window.saveSlideshowSettings = saveSlideshowSettings;
window.exportSlideshowSettings = exportSlideshowSettings;
window.savePageSelection = savePageSelection;
window.loadPageSelection = loadPageSelection;

// Make image upload functions globally available
window.uploadProjectImage = uploadProjectImage;
window.uploadActivityImage = uploadActivityImage;
window.uploadInitiativeImage = uploadInitiativeImage;

// Recruitment Management Functions
let recruitmentManager = null;

// Initialize recruitment manager
function initRecruitmentManager() {
    if (typeof RecruitmentManager !== 'undefined') {
        recruitmentManager = new RecruitmentManager();
        console.log('Recruitment Manager initialized');
    } else {
        console.error('RecruitmentManager class not found');
    }
}

// Open recruitment manager modal
function openRecruitmentManager(type, itemId = null) {
    try {
        if (!recruitmentManager) {
            initRecruitmentManager();
        }
        
        if (!recruitmentManager) {
            showNotification('Recruitment Manager not available', 'error');
            return;
        }
        
        const modal = document.getElementById('recruitment-modal');
        const container = document.getElementById('recruitment-container');
        
        if (!modal || !container) {
            showNotification('Recruitment modal not found', 'error');
            return;
        }
        
        // Clear previous content
        container.innerHTML = '';
        
        // Initialize recruitment manager for the specific type
        recruitmentManager.init(container, type, itemId);
        
        // Show modal
        modal.style.display = 'block';
        document.body.classList.add('modal-open');
        
        // Update modal title
        const modalTitle = modal.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.textContent = `Recruitment Management - ${type.charAt(0).toUpperCase() + type.slice(1)}s`;
        }
        
    } catch (error) {
        console.error('Error opening recruitment manager:', error);
        showNotification('Failed to open recruitment manager', 'error');
    }
}

// Close recruitment manager modal
function closeRecruitmentManager() {
    const modal = document.getElementById('recruitment-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
}

// Handle recruitment form submission
function handleRecruitmentFormSubmit(type, itemId, formData) {
    try {
        if (!recruitmentManager) {
            throw new Error('Recruitment Manager not initialized');
        }
        
        // Save form configuration
        recruitmentManager.saveForm(type, itemId, formData);
        
        showNotification('Recruitment form saved successfully', 'success');
        
        // Refresh the current section if needed
        const currentSection = document.querySelector('.admin-section.active');
        if (currentSection) {
            const sectionId = currentSection.id;
            if (sectionId === 'projects-section') {
                loadProjects();
            } else if (sectionId === 'activities-section') {
                loadActivities();
            } else if (sectionId === 'initiatives-section') {
                loadInitiatives();
            }
        }
        
    } catch (error) {
        console.error('Error handling recruitment form submission:', error);
        showNotification('Failed to save recruitment form', 'error');
    }
}

// Toggle global recruitment availability
function toggleGlobalRecruitment(enabled) {
    try {
        // Save the global recruitment setting
        localStorage.setItem('globalRecruitmentEnabled', enabled.toString());
        
        // Update all recruitment forms availability
        if (recruitmentManager) {
            const forms = Array.from(recruitmentManager.forms.values());
            forms.forEach(form => {
                if (!enabled) {
                    form.settings.isActive = false;
                } else {
                    // Restore previous state or set to active
                    form.settings.isActive = form.settings.previouslyActive !== false;
                }
            });
            recruitmentManager.saveFormsToStorage();
        }
        
        // Update UI elements
        const recruitmentButtons = document.querySelectorAll('[data-recruitment-button]');
        recruitmentButtons.forEach(button => {
            if (enabled) {
                button.style.display = '';
                button.removeAttribute('disabled');
            } else {
                button.style.opacity = '0.5';
                button.setAttribute('disabled', 'true');
                button.title = 'Recruitment is currently disabled';
            }
        });
        
        showNotification(enabled ? 'success' : 'info', 
            enabled ? 'Global recruitment enabled' : 'Global recruitment disabled');
        
        // Refresh recruitment stats
        if (typeof loadRecruitmentStats === 'function') {
            loadRecruitmentStats();
        }
        
    } catch (error) {
        console.error('Error toggling global recruitment:', error);
        showNotification('Failed to update recruitment settings', 'error');
    }
}

// Open recruitment form builder
function openRecruitmentFormBuilder(entityType = null, entityId = null, recruitmentType = 'volunteers') {
    try {
        if (!recruitmentManager) {
            initRecruitmentManager();
        }
        
        if (!recruitmentManager) {
            showNotification('Recruitment Manager not available', 'error');
            return;
        }
        
        // If no entity specified, show entity selection modal first
        if (!entityType || !entityId) {
            showEntitySelectionModal();
            return;
        }
        
        // Open the form builder with the specified parameters
        recruitmentManager.openFormBuilder(entityType, entityId, recruitmentType);
        
    } catch (error) {
        console.error('Error opening recruitment form builder:', error);
        showNotification('Failed to open form builder', 'error');
    }
}

// Open general form builder
function openFormBuilder() {
    try {
        // Create form builder modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'formBuilderModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1200px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3><i class="fas fa-plus-circle"></i> Create New Form</h3>
                    <button class="close-btn" onclick="closeFormBuilder()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="padding: 0;">
                    <div id="form-builder-container"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Initialize form builder
        if (window.FormBuilder) {
            const formBuilder = new window.FormBuilder('form-builder-container');
            window.currentFormBuilder = formBuilder;
            
            // Set up save callback
            formBuilder.onSave = (formData) => {
                console.log('Form saved:', formData);
                showNotification('Form saved successfully!', 'success');
                closeFormBuilder();
                // Refresh forms table if available
                if (typeof refreshFormsTable === 'function') {
                    refreshFormsTable();
                }
            };
        } else {
            showNotification('Form builder not available. Please refresh the page.', 'error');
            closeFormBuilder();
        }
        
    } catch (error) {
        console.error('Error opening form builder:', error);
        showNotification('Failed to open form builder', 'error');
    }
}

// Close form builder modal
function closeFormBuilder() {
    const modal = document.getElementById('formBuilderModal');
    if (modal) {
        modal.remove();
    }
    window.currentFormBuilder = null;
}

// Show entity selection modal for recruitment form creation
function showEntitySelectionModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade show';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Select Entity for Recruitment Form</h5>
                    <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Entity Type</label>
                        <select id="entityTypeSelect" class="form-select">
                            <option value="project">Project</option>
                            <option value="activity">Activity</option>
                            <option value="initiative">Initiative</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Recruitment Type</label>
                        <select id="recruitmentTypeSelect" class="form-select">
                            <option value="volunteers">Volunteers</option>
                            <option value="participants">Participants</option>
                            <option value="crews">Crews</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Select Entity</label>
                        <select id="entitySelect" class="form-select">
                            <option value="">Loading...</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="createRecruitmentFormFromModal(this)">Create Form</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Load entities based on type selection
    const entityTypeSelect = modal.querySelector('#entityTypeSelect');
    const entitySelect = modal.querySelector('#entitySelect');
    
    const loadEntities = async (type) => {
        try {
            entitySelect.innerHTML = '<option value="">Loading...</option>';
            
            let entities = [];
            if (type === 'project') {
                // Load projects
                const response = await fetch('/api/admin/projects', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
                });
                if (response.ok) {
                    entities = await response.json();
                }
            }
            // Add similar loading for activities and initiatives
            
            entitySelect.innerHTML = entities.length > 0 
                ? entities.map(entity => `<option value="${entity._id || entity.id}">${entity.title || entity.name}</option>`).join('')
                : '<option value="">No entities found</option>';
                
        } catch (error) {
            console.error('Error loading entities:', error);
            entitySelect.innerHTML = '<option value="">Error loading entities</option>';
        }
    };
    
    entityTypeSelect.addEventListener('change', (e) => loadEntities(e.target.value));
    loadEntities('project'); // Load projects by default
}

// Create recruitment form from entity selection modal
function createRecruitmentFormFromModal(buttonElement) {
    const modal = buttonElement.closest('.modal');
    const entityType = modal.querySelector('#entityTypeSelect').value;
    const entityId = modal.querySelector('#entitySelect').value;
    const recruitmentType = modal.querySelector('#recruitmentTypeSelect').value;
    
    if (!entityId) {
        showNotification('Please select an entity', 'error');
        return;
    }
    
    modal.remove();
    openRecruitmentFormBuilder(entityType, entityId, recruitmentType);
}

// Load recruitment statistics
function loadRecruitmentStats() {
    try {
        if (!recruitmentManager) {
            initRecruitmentManager();
        }
        
        if (!recruitmentManager) {
            console.error('Recruitment Manager not available');
            return;
        }
        
        const stats = recruitmentManager.getRecruitmentStats();
        
        // Update stat cards
        const totalFormsElement = document.getElementById('totalRecruitmentForms');
        const totalApplicationsElement = document.getElementById('totalApplications');
        const pendingApplicationsElement = document.getElementById('pendingApplications');
        const approvedApplicationsElement = document.getElementById('approvedApplications');
        
        if (totalFormsElement) totalFormsElement.textContent = stats.activeForms;
        if (totalApplicationsElement) totalApplicationsElement.textContent = stats.totalApplications;
        if (pendingApplicationsElement) pendingApplicationsElement.textContent = stats.applicationsByStatus.pending;
        if (approvedApplicationsElement) approvedApplicationsElement.textContent = stats.applicationsByStatus.approved;
        
        // Load recruitment forms list
        loadRecruitmentFormsList();
        
    } catch (error) {
        console.error('Error loading recruitment stats:', error);
    }
}

// Load recruitment forms list
function loadRecruitmentFormsList() {
    try {
        if (!recruitmentManager) {
            return;
        }
        
        const container = document.getElementById('recruitmentFormsContainer');
        if (!container) {
            return;
        }
        
        const forms = Array.from(recruitmentManager.forms.values());
        
        if (forms.length === 0) {
            container.innerHTML = `
                <div class="text-center" style="padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-clipboard-list" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No Recruitment Forms</h3>
                    <p>Create your first recruitment form to get started.</p>
                    <button class="btn btn-primary" onclick="openRecruitmentFormBuilder()">
                        <i class="fas fa-plus"></i> Create Form
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="recruitment-forms-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
                ${forms.map(form => `
                    <div class="recruitment-form-card" style="background: var(--bg-secondary); border: 1px solid var(--border-secondary); border-radius: 0.5rem; padding: 1.5rem; transition: all 0.3s ease;">
                        <div class="form-card-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                            <h4 style="margin: 0; color: var(--text-primary); font-size: 1.1rem;">${form.title}</h4>
                            <span class="badge ${form.settings.isActive ? 'badge-success' : 'badge-secondary'}" style="padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">
                                ${form.settings.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem;">${form.description || 'No description'}</p>
                        <div class="form-meta" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; font-size: 0.8rem; color: var(--text-secondary);">
                            <span><i class="fas fa-users"></i> ${form.recruitmentType}</span>
                            <span><i class="fas fa-calendar"></i> ${new Date(form.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div class="form-actions" style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-sm btn-primary" onclick="editRecruitmentForm('${form.id}')" style="flex: 1;">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm ${form.settings.isActive ? 'btn-warning' : 'btn-success'}" onclick="toggleRecruitmentForm('${form.id}')">
                                <i class="fas fa-${form.settings.isActive ? 'pause' : 'play'}"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteRecruitmentForm('${form.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading recruitment forms list:', error);
    }
}

// Edit recruitment form
function editRecruitmentForm(formId) {
    try {
        if (!recruitmentManager) {
            return;
        }
        
        const form = recruitmentManager.getRecruitmentForm(formId);
        if (!form) {
            showNotification('Form not found', 'error');
            return;
        }
        
        recruitmentManager.openFormBuilder(form.entityType, form.entityId, form.recruitmentType, formId);
        
    } catch (error) {
        console.error('Error editing recruitment form:', error);
        showNotification('Failed to edit form', 'error');
    }
}

// Toggle recruitment form active status
function toggleRecruitmentForm(formId) {
    try {
        if (!recruitmentManager) {
            return;
        }
        
        const form = recruitmentManager.getRecruitmentForm(formId);
        if (!form) {
            showNotification('Form not found', 'error');
            return;
        }
        
        form.settings.isActive = !form.settings.isActive;
        form.updatedAt = new Date().toISOString();
        
        recruitmentManager.saveFormsToStorage();
        
        showNotification(`Form ${form.settings.isActive ? 'activated' : 'deactivated'}`, 'success');
        
        // Refresh the display
        loadRecruitmentStats();
        
    } catch (error) {
        console.error('Error toggling recruitment form:', error);
        showNotification('Failed to update form', 'error');
    }
}

// Delete recruitment form
function deleteRecruitmentForm(formId) {
    if (!confirm('Are you sure you want to delete this recruitment form? This action cannot be undone.')) {
        return;
    }
    
    try {
        if (!recruitmentManager) {
            return;
        }
        
        const deleted = recruitmentManager.deleteRecruitmentForm(formId);
        if (deleted) {
            showNotification('Recruitment form deleted', 'success');
            loadRecruitmentStats();
        } else {
            showNotification('Form not found', 'error');
        }
        
    } catch (error) {
        console.error('Error deleting recruitment form:', error);
        showNotification('Failed to delete form', 'error');
    }
}

// Initialize recruitment management when section is loaded
function initRecruitmentManagement() {
    try {
        // Initialize recruitment manager
        if (!recruitmentManager) {
            initRecruitmentManager();
        }
        
        // Load initial data
        loadRecruitmentStats();
        
        // Initialize recruitment tabs
        initRecruitmentTabs();
        
        // Load default tab (projects)
        switchRecruitmentTab('projects');
        
        // Initialize forms table
        if (recruitmentManager && typeof recruitmentManager.displayFormsTable === 'function') {
            recruitmentManager.displayFormsTable();
        }
        
        // Set up global recruitment toggle state
        const globalToggle = document.getElementById('globalRecruitmentToggle');
        if (globalToggle) {
            const isEnabled = localStorage.getItem('globalRecruitmentEnabled') !== 'false';
            globalToggle.checked = isEnabled;
        }
        
        // Set up refresh and export buttons
        setupRecruitmentActions();
        
        console.log('Recruitment management initialized');
        
    } catch (error) {
        console.error('Error initializing recruitment management:', error);
    }
}

// Initialize recruitment tabs functionality
function initRecruitmentTabs() {
    try {
        const tabButtons = document.querySelectorAll('.recruitment-tab');
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabName = this.getAttribute('data-tab');
                if (tabName) {
                    switchRecruitmentTab(tabName);
                }
            });
        });
        
        console.log('Recruitment tabs initialized');
    } catch (error) {
        console.error('Error initializing recruitment tabs:', error);
    }
}

// Setup recruitment action buttons
function setupRecruitmentActions() {
    try {
        // Refresh data button
        const refreshBtn = document.querySelector('.page-actions-row .btn:first-child');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                loadRecruitmentStats();
                const activeTab = document.querySelector('.recruitment-tab.active');
                if (activeTab) {
                    const tabName = activeTab.getAttribute('data-tab');
                    loadEntitiesForTab(tabName);
                }
                if (recruitmentManager && typeof recruitmentManager.displayFormsTable === 'function') {
                    recruitmentManager.displayFormsTable();
                }
                showNotification('Recruitment data refreshed', 'success');
            });
        }
        
        // Export data button
        const exportBtn = document.querySelector('.page-actions-row .btn:last-child');
        if (exportBtn) {
            exportBtn.addEventListener('click', function() {
                exportRecruitmentData();
            });
        }
        
        console.log('Recruitment actions setup complete');
    } catch (error) {
        console.error('Error setting up recruitment actions:', error);
    }
}

// Export recruitment data
function exportRecruitmentData() {
    try {
        if (!recruitmentManager) {
            showNotification('Recruitment manager not initialized', 'error');
            return;
        }
        
        const forms = Array.from(recruitmentManager.forms.values());
        const exportData = {
            timestamp: new Date().toISOString(),
            totalForms: forms.length,
            forms: forms.map(form => ({
                id: form.id,
                title: form.title,
                entityType: form.entityType,
                recruitmentType: form.recruitmentType,
                status: form.status,
                createdAt: form.createdAt,
                responses: recruitmentManager.getApplicationsByForm(form.id).length
            }))
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recruitment-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Recruitment data exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting recruitment data:', error);
        showNotification('Failed to export recruitment data', 'error');
    }
}

// Load activities data (similar to loadProjects)
// loadActivities function is defined earlier in the file

// loadInitiatives function is defined earlier in the file

// populateActivitiesTable function is defined earlier in the file

// populateInitiativesTable function is defined earlier in the file

// Activity management functions
async function viewActivity(activityId) {
    // Implementation for viewing activity details
    console.log('View activity:', activityId);
}

// editActivity function is defined earlier in the file

// deleteActivity function is defined earlier in the file

// Initiative management functions
async function viewInitiative(initiativeId) {
    // Implementation for viewing initiative details
    console.log('View initiative:', initiativeId);
}

// editInitiative function is defined earlier in the file

// deleteInitiative function is defined earlier in the file

// Recruitment Tab Management Functions
function switchRecruitmentTab(tabName) {
    try {
        // Update tab buttons
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.classList.remove('active');
            button.style.color = 'var(--text-secondary)';
            button.style.borderBottomColor = 'transparent';
        });
        
        const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
            activeButton.style.color = 'var(--text-primary)';
            activeButton.style.borderBottomColor = 'var(--primary-color)';
        }
        
        // Update tab content
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });
        
        const activeContent = document.getElementById(`${tabName}-recruitment-tab`);
        if (activeContent) {
            activeContent.classList.add('active');
            activeContent.style.display = 'block';
        }
        
        // Load entities for the selected tab
        loadEntitiesForTab(tabName);
        
    } catch (error) {
        console.error('Error switching recruitment tab:', error);
    }
}

// Load entities (projects, activities, initiatives) for the selected tab
async function loadEntitiesForTab(entityType) {
    try {
        const gridId = `${entityType}-grid`;
        const grid = document.getElementById(gridId);
        if (!grid) return;
        
        // Show loading state
        grid.innerHTML = '<div class="loading-spinner" style="text-align: center; padding: 2rem; color: var(--text-secondary);"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
        
        // Fetch entities from API
        const response = await apiCall(`/api/admin/${entityType}`);
        if (!response.success) {
            throw new Error(response.message || `Failed to load ${entityType}`);
        }
        
        const entities = response.data || [];
        
        if (entities.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-${getEntityIcon(entityType)}" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h4>No ${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Found</h4>
                    <p>Create ${entityType} first to set up recruitment forms.</p>
                </div>
            `;
            return;
        }
        
        // Render entity cards with Create Form buttons
        grid.innerHTML = entities.map(entity => `
            <div class="entity-card" style="background: var(--bg-primary); border: 1px solid var(--border-secondary); border-radius: 0.5rem; padding: 1.5rem; transition: all 0.3s ease;">
                <div class="entity-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <h4 style="margin: 0; color: var(--text-primary); font-size: 1.1rem;">${entity.title || entity.name}</h4>
                    <i class="fas fa-${getEntityIcon(entityType)}" style="color: var(--primary-color);"></i>
                </div>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${entity.description || 'No description available'}</p>
                <div class="entity-meta" style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1rem;">
                    <span><i class="fas fa-calendar"></i> ${new Date(entity.createdAt || entity.created_at || Date.now()).toLocaleDateString()}</span>
                    <span class="entity-type-badge" style="background: var(--primary-color); color: white; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; text-transform: capitalize;">${entityType.slice(0, -1)}</span>
                </div>
                <button class="btn btn-primary create-form-btn" onclick="openEntityFormBuilder('${entityType.slice(0, -1)}', '${entity._id || entity.id}')" style="width: 100%; padding: 0.75rem; border-radius: 0.5rem; font-weight: 600;">
                    <i class="fas fa-plus"></i> Create Form
                </button>
            </div>
        `).join('');
        
    } catch (error) {
        console.error(`Error loading ${entityType}:`, error);
        const grid = document.getElementById(`${entityType}-grid`);
        if (grid) {
            grid.innerHTML = `
                <div class="error-state" style="text-align: center; padding: 2rem; color: var(--text-danger);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <h4>Error Loading ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="loadEntitiesForTab('${entityType}')">
                        <i class="fas fa-refresh"></i> Retry
                    </button>
                </div>
            `;
        }
    }
}

// Get icon for entity type
function getEntityIcon(entityType) {
    const icons = {
        'project': 'project-diagram',
        'projects': 'project-diagram',
        'activity': 'calendar-alt',
        'activities': 'calendar-alt',
        'initiative': 'lightbulb',
        'initiatives': 'lightbulb'
    };
    return icons[entityType] || 'circle';
}

// Open form builder for specific entity
function openEntityFormBuilder(entityType, entityId) {
    try {
        if (!recruitmentManager) {
            showNotification('Recruitment manager not initialized', 'error');
            return;
        }
        
        // Show form builder modal with entity context
        recruitmentManager.openFormBuilder(entityType, entityId);
        
    } catch (error) {
        console.error('Error opening entity form builder:', error);
        showNotification('Failed to open form builder', 'error');
    }
}

// Analytics Tab Management Functions
function switchAnalyticsTab(tabName) {
    try {
        // Update analytics tab buttons
        const tabButtons = document.querySelectorAll('.analytics-tab-button');
        tabButtons.forEach(button => {
            button.classList.remove('active');
            button.style.color = 'var(--text-secondary)';
            button.style.borderBottomColor = 'transparent';
        });
        
        const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
            activeButton.style.color = 'var(--text-primary)';
            activeButton.style.borderBottomColor = 'var(--primary-color)';
        }
        
        // Update analytics content
        const analyticsContents = document.querySelectorAll('.analytics-content');
        analyticsContents.forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });
        
        const activeContent = document.getElementById(`${tabName}-analytics`);
        if (activeContent) {
            activeContent.classList.add('active');
            activeContent.style.display = 'block';
        }
        
        // Load analytics data for the selected tab
        loadAnalyticsData(tabName);
        
    } catch (error) {
        console.error('Error switching analytics tab:', error);
    }
}

// Load analytics data for specific role type
async function loadAnalyticsData(roleType) {
    try {
        const contentId = `${roleType}-analytics-content`;
        const content = document.getElementById(contentId);
        if (!content) return;
        
        // Show loading state
        content.innerHTML = '<div class="loading-spinner" style="text-align: center; padding: 2rem; color: var(--text-secondary);"><i class="fas fa-spinner fa-spin"></i> Loading analytics...</div>';
        
        // Fetch analytics data from recruitment manager
        if (!recruitmentManager) {
            throw new Error('Recruitment manager not initialized');
        }
        
        const analyticsData = await recruitmentManager.getAnalyticsData(roleType);
        
        if (!analyticsData || analyticsData.length === 0) {
            content.innerHTML = `
                <div class="empty-analytics" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fas fa-chart-bar" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h4>No ${roleType.charAt(0).toUpperCase() + roleType.slice(1)} Data</h4>
                    <p>Analytics will appear here once ${roleType} start submitting forms.</p>
                </div>
            `;
            return;
        }
        
        // Render analytics charts and tables
        renderAnalyticsCharts(content, analyticsData, roleType);
        
    } catch (error) {
        console.error(`Error loading ${roleType} analytics:`, error);
        const content = document.getElementById(`${roleType}-analytics-content`);
        if (content) {
            content.innerHTML = `
                <div class="error-state" style="text-align: center; padding: 2rem; color: var(--text-danger);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <h4>Error Loading Analytics</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="loadAnalyticsData('${roleType}')">
                        <i class="fas fa-refresh"></i> Retry
                    </button>
                </div>
            `;
        }
    }
}

// Render analytics charts (Google Forms style)
function renderAnalyticsCharts(container, data, roleType) {
    try {
        // Create charts container
        container.innerHTML = `
            <div class="analytics-dashboard">
                <div class="analytics-summary" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                    <div class="summary-card" style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 0.5rem; text-align: center;">
                        <h3 style="margin: 0; color: var(--primary-color); font-size: 2rem;">${data.totalResponses || 0}</h3>
                        <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary);">Total Responses</p>
                    </div>
                    <div class="summary-card" style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 0.5rem; text-align: center;">
                        <h3 style="margin: 0; color: var(--success-color); font-size: 2rem;">${data.activeForms || 0}</h3>
                        <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary);">Active Forms</p>
                    </div>
                    <div class="summary-card" style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 0.5rem; text-align: center;">
                        <h3 style="margin: 0; color: var(--warning-color); font-size: 2rem;">${data.averageResponseTime || 'N/A'}</h3>
                        <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary);">Avg. Response Time</p>
                    </div>
                </div>
                
                <div class="charts-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem;">
                    <div class="chart-container" style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 0.5rem;">
                        <h4 style="margin: 0 0 1rem 0; color: var(--text-primary);">Response Distribution</h4>
                        <div id="${roleType}-distribution-chart" style="height: 300px;"></div>
                    </div>
                    
                    <div class="chart-container" style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 0.5rem;">
                        <h4 style="margin: 0 0 1rem 0; color: var(--text-primary);">Response Timeline</h4>
                        <div id="${roleType}-timeline-chart" style="height: 300px;"></div>
                    </div>
                </div>
                
                <div class="responses-table" style="margin-top: 2rem;">
                    <h4 style="margin: 0 0 1rem 0; color: var(--text-primary);">Recent Responses</h4>
                    <div class="data-table">
                        <div id="${roleType}-responses-table"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize charts (placeholder for now - would integrate with Chart.js or similar)
        initializeAnalyticsCharts(roleType, data);
        
    } catch (error) {
        console.error('Error rendering analytics charts:', error);
    }
}

// Initialize analytics charts (placeholder)
function initializeAnalyticsCharts(roleType, data) {
    // This would integrate with Chart.js or similar charting library
    console.log(`Initializing charts for ${roleType}:`, data);
}

// Export analytics data to CSV
function exportAnalyticsData(roleType) {
    try {
        if (!recruitmentManager) {
            showNotification('Recruitment manager not initialized', 'error');
            return;
        }
        
        // Get analytics data
        const analyticsData = recruitmentManager.getAnalyticsData(roleType);
        if (!analyticsData || analyticsData.length === 0) {
            showNotification(`No ${roleType} data to export`, 'warning');
            return;
        }
        
        // Convert to CSV format
        const csvData = convertToCSV(analyticsData, roleType);
        
        // Download CSV file
        downloadCSV(csvData, `${roleType}-analytics-${new Date().toISOString().split('T')[0]}.csv`);
        
        showNotification(`${roleType.charAt(0).toUpperCase() + roleType.slice(1)} analytics exported successfully`, 'success');
        
    } catch (error) {
        console.error('Error exporting analytics data:', error);
        showNotification('Failed to export analytics data', 'error');
    }
}

// Convert analytics data to CSV format
// convertToCSV function is defined earlier in the file

// Download CSV file
function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Make recruitment functions globally available
window.openRecruitmentManager = openRecruitmentManager;
window.closeRecruitmentManager = closeRecruitmentManager;
window.handleRecruitmentFormSubmit = handleRecruitmentFormSubmit;
window.loadActivities = loadActivities;
window.loadInitiatives = loadInitiatives;
window.viewActivity = viewActivity;
window.editActivity = editActivity;
window.deleteActivity = deleteActivity;
window.viewInitiative = viewInitiative;
window.editInitiative = editInitiative;
window.deleteInitiative = deleteInitiative;
window.switchRecruitmentTab = switchRecruitmentTab;
window.switchAnalyticsTab = switchAnalyticsTab;
window.loadEntitiesForTab = loadEntitiesForTab;
window.openEntityFormBuilder = openEntityFormBuilder;
window.exportAnalyticsData = exportAnalyticsData;

// Initialize recruitment manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize recruitment manager after a short delay to ensure all dependencies are loaded
    setTimeout(() => {
        initRecruitmentManager();
    }, 1000);
});

// toggleSidebar function is defined elsewhere in this file

// Make toggleSidebar globally available
window.toggleSidebar = toggleSidebar;

// Handle window resize to adjust sidebar behavior
window.addEventListener('resize', function() {
    const sidebar = document.querySelector('.admin-sidebar') || document.getElementById('adminSidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const main = document.querySelector('.admin-main');
    
    if (window.innerWidth >= 768) {
        // Desktop view - ensure sidebar is visible and overlay is hidden
        if (sidebar) {
            sidebar.classList.remove('active', 'open');
            sidebar.classList.remove('hidden');
        }
        if (overlay) {
            overlay.classList.remove('active');
        }
        if (main) {
            main.style.marginLeft = '320px';
            main.style.width = 'calc(100% - 320px)';
        }
        document.body.style.overflow = '';
    } else {
        // Mobile view - hide sidebar by default
        if (sidebar && !sidebar.classList.contains('active')) {
            sidebar.classList.remove('open');
        }
        if (main) {
            main.style.marginLeft = '0';
            main.style.width = '100%';
        }
    }
});

// Payment Gateway Management Functions

/**
 * Load payment gateways data
 */
async function loadPaymentSettings() {
    try {
        showLoading();
        const response = await apiCall('/api/payment-settings');
        
        // Handle the new API response structure
        const gateways = response.data?.gateways || response.data || [];
        const stats = response.data?.stats || null;
        
        displayPaymentGateways(gateways);
        
        if (stats) {
            // Use stats from API if available
            const totalElement = document.getElementById('totalGateways');
            const activeElement = document.getElementById('activeGateways');
            const testModeElement = document.getElementById('testModeGateways');
            
            if (totalElement) totalElement.textContent = stats.total;
            if (activeElement) activeElement.textContent = stats.active;
            if (testModeElement) testModeElement.textContent = stats.testMode;
        } else {
            // Fallback to calculating stats from gateways array
            updatePaymentGatewayStats(gateways);
        }
        
        hideLoading();
    } catch (error) {
        console.error('Error loading payment gateways:', error);
        showNotification('Failed to load payment gateways', 'error');
        hideLoading();
    }
}

/**
 * Display payment gateways in table
 */
function displayPaymentGateways(gateways) {
    const tableBody = document.getElementById('paymentGatewaysTableBody');
    if (!tableBody) return;
    
    if (!gateways || gateways.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">
                    <i class="fas fa-credit-card" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>No payment gateways configured yet.</p>
                    <button class="btn btn-primary" onclick="showAddPaymentGatewayModal()">
                        <i class="fas fa-plus"></i> Add Your First Gateway
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = gateways.map(gateway => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fab fa-${gateway.gateway}" style="font-size: 1.2rem;"></i>
                    <span style="font-weight: 600; text-transform: capitalize;">${gateway.gateway}</span>
                </div>
            </td>
            <td>
                <span class="badge ${gateway.mode === 'live' ? 'badge-success' : 'badge-warning'}">
                    ${gateway.mode === 'live' ? 'Live' : 'Test'}
                </span>
            </td>
            <td>
                <span class="badge ${gateway.is_active ? 'badge-success' : 'badge-secondary'}">
                    ${gateway.is_active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <code style="font-size: 0.8rem; background: #f3f4f6; padding: 0.2rem 0.4rem; border-radius: 0.25rem;">
                    ${gateway.api_key || '****'}
                </code>
            </td>
            <td>${new Date(gateway.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline" onclick="editPaymentGateway('${gateway._id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm ${gateway.is_active ? 'btn-warning' : 'btn-success'}" 
                            onclick="${gateway.is_active ? 'deactivateGateway' : 'activateGateway'}('${gateway._id}')" 
                            title="${gateway.is_active ? 'Deactivate' : 'Activate'}">
                        <i class="fas fa-${gateway.is_active ? 'pause' : 'play'}"></i>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="testGateway('${gateway._id}')" title="Test Connection">
                        <i class="fas fa-vial"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deletePaymentGateway('${gateway._id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Update payment gateway statistics
 */
function updatePaymentGatewayStats(gateways) {
    const totalGateways = gateways.length;
    const activeGateways = gateways.filter(g => g.is_active).length;
    const testModeGateways = gateways.filter(g => g.mode === 'test').length;
    
    const totalElement = document.getElementById('totalGateways');
    const activeElement = document.getElementById('activeGateways');
    const testModeElement = document.getElementById('testModeGateways');
    
    if (totalElement) totalElement.textContent = totalGateways;
    if (activeElement) activeElement.textContent = activeGateways;
    if (testModeElement) testModeElement.textContent = testModeGateways;
}

/**
 * Show add payment gateway modal
 */
function showAddPaymentGatewayModal() {
    const modal = document.getElementById('paymentGatewayModal');
    const title = document.getElementById('paymentGatewayModalTitle');
    const form = document.getElementById('paymentGatewayForm');
    
    if (title) title.textContent = 'Add Payment Gateway';
    if (form) form.reset();
    
    // Clear hidden ID field
    const idField = document.getElementById('paymentGatewayId');
    if (idField) idField.value = '';
    
    if (modal) modal.style.display = 'block';
}

/**
 * Edit payment gateway
 */
async function editPaymentGateway(gatewayId) {
    try {
        showLoading();
        const response = await apiCall(`/api/payment-settings/${gatewayId}`);
        const gateway = response.data;
        
        if (!gateway) {
            throw new Error('Gateway not found');
        }
        
        // Populate form
        const modal = document.getElementById('paymentGatewayModal');
        const title = document.getElementById('paymentGatewayModalTitle');
        
        if (title) title.textContent = 'Edit Payment Gateway';
        
        document.getElementById('paymentGatewayId').value = gateway._id;
        document.getElementById('gateway').value = gateway.gateway;
        document.getElementById('mode').value = gateway.mode;
        document.getElementById('isActive').checked = gateway.is_active;
        
        // Don't populate sensitive fields for security
        document.getElementById('apiKey').placeholder = 'Leave blank to keep current key';
        document.getElementById('secretKey').placeholder = 'Leave blank to keep current key';
        document.getElementById('webhookSecret').placeholder = 'Leave blank to keep current secret';
        
        if (gateway.configuration) {
            document.getElementById('configuration').value = JSON.stringify(gateway.configuration, null, 2);
        }
        
        if (modal) modal.style.display = 'block';
        hideLoading();
    } catch (error) {
        console.error('Error loading gateway for edit:', error);
        showNotification('Failed to load gateway details', 'error');
        hideLoading();
    }
}

/**
 * Save payment gateway
 */
async function savePaymentGateway() {
    try {
        const form = document.getElementById('paymentGatewayForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        showLoading();
        
        const gatewayId = document.getElementById('paymentGatewayId').value;
        const gateway = document.getElementById('gateway').value;
        const apiKey = document.getElementById('apiKey').value;
        const secretKey = document.getElementById('secretKey').value;
        const webhookSecret = document.getElementById('webhookSecret').value;
        const mode = document.getElementById('mode').value;
        const isActive = document.getElementById('isActive').checked;
        const configurationText = document.getElementById('configuration').value;
        
        let configuration = {};
        if (configurationText.trim()) {
            try {
                configuration = JSON.parse(configurationText);
            } catch (e) {
                throw new Error('Invalid JSON in configuration field');
            }
        }
        
        const gatewayData = {
            gateway,
            mode,
            is_active: isActive,
            configuration
        };
        
        // Only include keys if they're provided (for edit mode)
        if (apiKey) gatewayData.api_key = apiKey;
        if (secretKey) gatewayData.secret_key = secretKey;
        if (webhookSecret) gatewayData.webhook_secret = webhookSecret;
        
        const url = gatewayId ? `/api/payment-settings/${gatewayId}` : '/api/payment-settings';
        const method = gatewayId ? 'PUT' : 'POST';
        
        const response = await apiCall(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gatewayData)
        });
        
        if (response.success) {
            showNotification(`Payment gateway ${gatewayId ? 'updated' : 'created'} successfully!`, 'success');
            closeModal('paymentGatewayModal');
            loadPaymentSettings(); // Reload the list
        } else {
            throw new Error(response.message || 'Failed to save payment gateway');
        }
        
        hideLoading();
    } catch (error) {
        console.error('Error saving payment gateway:', error);
        showNotification('Failed to save payment gateway: ' + error.message, 'error');
        hideLoading();
    }
}

/**
 * Activate payment gateway
 */
async function activateGateway(gatewayId) {
    try {
        showLoading();
        const response = await apiCall(`/api/payment-settings/${gatewayId}/activate`, {
            method: 'PUT'
        });
        
        if (response.success) {
            showNotification('Payment gateway activated successfully!', 'success');
            loadPaymentSettings();
        } else {
            throw new Error(response.message || 'Failed to activate gateway');
        }
        
        hideLoading();
    } catch (error) {
        console.error('Error activating gateway:', error);
        showNotification('Failed to activate gateway: ' + error.message, 'error');
        hideLoading();
    }
}

/**
 * Deactivate payment gateway
 */
async function deactivateGateway(gatewayId) {
    try {
        showLoading();
        const response = await apiCall(`/api/payment-settings/${gatewayId}/deactivate`, {
            method: 'PUT'
        });
        
        if (response.success) {
            showNotification('Payment gateway deactivated successfully!', 'success');
            loadPaymentSettings();
        } else {
            throw new Error(response.message || 'Failed to deactivate gateway');
        }
        
        hideLoading();
    } catch (error) {
        console.error('Error deactivating gateway:', error);
        showNotification('Failed to deactivate gateway: ' + error.message, 'error');
        hideLoading();
    }
}

/**
 * Test payment gateway connection
 */
async function testGateway(gatewayId) {
    try {
        showLoading();
        const response = await apiCall(`/api/payment-settings/${gatewayId}/test`, {
            method: 'POST'
        });
        
        if (response.success) {
            showNotification('Gateway connection test successful!', 'success');
        } else {
            throw new Error(response.message || 'Gateway test failed');
        }
        
        hideLoading();
    } catch (error) {
        console.error('Error testing gateway:', error);
        showNotification('Gateway test failed: ' + error.message, 'error');
        hideLoading();
    }
}

/**
 * Delete payment gateway
 */
async function deletePaymentGateway(gatewayId) {
    if (!confirm('Are you sure you want to delete this payment gateway? This action cannot be undone.')) {
        return;
    }
    
    try {
        showLoading();
        const response = await apiCall(`/api/payment-settings/${gatewayId}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            showNotification('Payment gateway deleted successfully!', 'success');
            loadPaymentSettings();
        } else {
            throw new Error(response.message || 'Failed to delete gateway');
        }
        
        hideLoading();
    } catch (error) {
        console.error('Error deleting gateway:', error);
        showNotification('Failed to delete gateway: ' + error.message, 'error');
        hideLoading();
    }
}

/**
 * Refresh users data
 */
async function refreshUsers() {
    try {
        showLoading();
        await loadUsersData();
        showNotification('Users data refreshed successfully', 'success');
        hideLoading();
    } catch (error) {
        console.error('Error refreshing users:', error);
        showNotification('Error refreshing users data', 'error');
        hideLoading();
    }
}

/**
 * Update chat status
 */
async function updateChatStatus() {
    try {
        const chatId = document.getElementById('chatHeader').dataset.chatId;
        const newStatus = document.getElementById('chatStatusSelect').value;
        
        if (!chatId) {
            showNotification('No chat selected', 'error');
            return;
        }
        
        showLoading();
        const response = await apiCall(`/api/chats/${chatId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.success) {
            showNotification('Chat status updated successfully', 'success');
            // Refresh chat list if available
            if (typeof window.adminChatManager !== 'undefined' && window.adminChatManager) {
                await window.adminChatManager.loadChats();
            }
        } else {
            throw new Error(response.message || 'Failed to update chat status');
        }
        
        hideLoading();
    } catch (error) {
        console.error('Error updating chat status:', error);
        showNotification('Error updating chat status: ' + error.message, 'error');
        hideLoading();
    }
}

/**
 * Send message in chat
 */
async function sendMessage() {
    try {
        const chatId = document.getElementById('chatHeader').dataset.chatId;
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (!chatId) {
            showNotification('No chat selected', 'error');
            return;
        }
        
        if (!message) {
            showNotification('Please enter a message', 'error');
            return;
        }
        
        showLoading();
        const response = await apiCall(`/api/chats/${chatId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                message: message,
                sender: 'admin'
            })
        });
        
        if (response.success) {
            messageInput.value = '';
            // Refresh messages if chat manager is available
            if (typeof window.adminChatManager !== 'undefined' && window.adminChatManager) {
                await window.adminChatManager.loadMessages(chatId);
            }
        } else {
            throw new Error(response.message || 'Failed to send message');
        }
        
        hideLoading();
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Error sending message: ' + error.message, 'error');
        hideLoading();
    }
}

/**
 * Edit a user
 * @param {string} userId - The ID of the user to edit
 */
// editUser function is defined earlier in the file

/**
 * Delete a user
 * @param {string} userId - The ID of the user to delete
 */
// deleteUser function is defined earlier in the file

/**
 * View a project
 * @param {string} projectId - The ID of the project to view
 */
// viewProject function is defined earlier in the file

/**
 * Show user modal for adding/editing
 * @param {Object} user - User data for editing (optional)
 */
function showUserModal(user = null) {
    const modal = document.getElementById('userModal');
    if (!modal) {
        // Create modal if it doesn't exist
        createUserModal();
        return showUserModal(user);
    }
    
    const form = document.getElementById('userForm');
    const modalTitle = document.getElementById('userModalTitle');
    
    if (!form) return;
    
    // Reset form
    form.reset();
    
    if (user) {
        // Edit mode
        modalTitle.textContent = 'Edit User';
        form.setAttribute('data-user-id', user._id);
        
        // Populate form fields
        const nameField = form.querySelector('[name="name"]');
        const emailField = form.querySelector('[name="email"]');
        const roleField = form.querySelector('[name="role"]');
        const statusField = form.querySelector('[name="status"]');
        
        if (nameField) nameField.value = user.name || '';
        if (emailField) emailField.value = user.email || '';
        if (roleField) roleField.value = user.role || 'user';
        if (statusField) statusField.value = user.status || 'active';
    } else {
        // Add mode
        modalTitle.textContent = 'Add User';
        form.removeAttribute('data-user-id');
    }
    
    // Show modal
    modal.style.display = 'flex';
}

/**
 * Show project details modal
 * @param {Object} project - Project data to display
 */
function showProjectDetailsModal(project) {
    const modal = document.getElementById('projectDetailsModal');
    if (!modal) {
        // Create modal if it doesn't exist
        createProjectDetailsModal();
        return showProjectDetailsModal(project);
    }
    
    // Populate modal with project details
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Project Details</h2>
                <button type="button" class="close" onclick="closeModal('projectDetailsModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="project-details">
                    <h3>${project.title}</h3>
                    ${project.titleTamil ? `<h4 class="tamil-title">${project.titleTamil}</h4>` : ''}
                    <div class="project-meta">
                        <span class="status-badge status-${project.status}">${project.status}</span>
                        <span class="category-badge">${project.category}</span>
                        ${project.priority ? `<span class="priority-badge priority-${project.priority}">${project.priority}</span>` : ''}
                    </div>
                    <div class="project-description">
                        <h4>Description</h4>
                        <p>${project.description}</p>
                        ${project.descriptionTamil ? `<p class="tamil-text">${project.descriptionTamil}</p>` : ''}
                    </div>
                    ${project.startDate ? `<div class="project-dates">
                        <p><strong>Start Date:</strong> ${new Date(project.startDate).toLocaleDateString()}</p>
                        ${project.endDate ? `<p><strong>End Date:</strong> ${new Date(project.endDate).toLocaleDateString()}</p>` : ''}
                    </div>` : ''}
                    ${project.progress !== undefined ? `<div class="project-progress">
                        <p><strong>Progress:</strong> ${project.progress}%</p>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${project.progress}%"></div>
                        </div>
                    </div>` : ''}
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('projectDetailsModal')">Close</button>
                <button type="button" class="btn btn-primary" onclick="editProject('${project._id}'); closeModal('projectDetailsModal');">Edit Project</button>
            </div>
        `;
    }
    
    // Show modal
    modal.style.display = 'flex';
}

/**
 * Create user modal if it doesn't exist
 */
function createUserModal() {
    const modalHtml = `
        <div id="userModal" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="userModalTitle">Add User</h2>
                    <button type="button" class="close" onclick="closeModal('userModal')">&times;</button>
                </div>
                <form id="userForm">
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="userName">Name:</label>
                            <input type="text" id="userName" name="name" required>
                        </div>
                        <div class="form-group">
                            <label for="userEmail">Email:</label>
                            <input type="email" id="userEmail" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="userRole">Role:</label>
                            <select id="userRole" name="role">
                                <option value="user">User</option>
                                <option value="moderator">Moderator</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="userStatus">Status:</label>
                            <select id="userStatus" name="status">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('userModal')">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save User</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Add form submit handler
    const form = document.getElementById('userForm');
    if (form) {
        form.addEventListener('submit', handleUserFormSubmit);
    }
}

/**
 * Create project details modal if it doesn't exist
 */
function createProjectDetailsModal() {
    const modalHtml = `
        <div id="projectDetailsModal" class="modal" style="display: none;">
            <div class="modal-content">
                <!-- Content will be populated dynamically -->
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

/**
 * Handle user form submission
 */
async function handleUserFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const userId = form.getAttribute('data-user-id');
    
    const userData = {
        name: formData.get('name'),
        email: formData.get('email'),
        role: formData.get('role'),
        status: formData.get('status')
    };
    
    try {
        showLoading();
        
        if (userId) {
            // Update existing user
            await apiCall(`/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            showNotification('User updated successfully', 'success');
        } else {
            // Create new user
            await apiCall('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            showNotification('User created successfully', 'success');
        }
        
        // Close modal and reload data
        closeModal('userModal');
        await loadUsersData();
        
        hideLoading();
    } catch (error) {
        console.error('Error saving user:', error);
        showNotification('Failed to save user: ' + error.message, 'error');
        hideLoading();
    }
}

// closeModal function is defined earlier in the file

/**
 * Upload Global Logo Function
 * Handles logo upload functionality for the admin panel
 */
function uploadGlobalLogo() {
    try {
        // Create file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        // Handle file selection
        fileInput.addEventListener('change', async function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showNotification('Please select a valid image file', 'error');
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showNotification('File size must be less than 5MB', 'error');
                return;
            }
            
            try {
                showLoading('Uploading logo...');
                
                // Create FormData for file upload
                const formData = new FormData();
                formData.append('logo', file);
                
                // Upload to server
                const response = await fetch('/api/admin/upload-logo', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${getAuthToken()}`
                    },
                    body: formData
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    showNotification('Logo uploaded successfully', 'success');
                    
                    // Update logo preview if exists
                    const logoPreview = document.querySelector('.logo-preview img');
                    if (logoPreview && result.logoUrl) {
                        logoPreview.src = result.logoUrl + '?t=' + Date.now();
                    }
                    
                    // Refresh page to show new logo
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    throw new Error(result.message || 'Upload failed');
                }
                
            } catch (error) {
                console.error('Error uploading logo:', error);
                showNotification('Failed to upload logo: ' + error.message, 'error');
            } finally {
                hideLoading();
                // Clean up file input
                document.body.removeChild(fileInput);
            }
        });
        
        // Add to DOM and trigger click
        document.body.appendChild(fileInput);
        fileInput.click();
        
    } catch (error) {
        console.error('Error in uploadGlobalLogo:', error);
        showNotification('Failed to open file selector', 'error');
    } finally {
        hideLoading();
    }
};

// Make payment gateway functions globally available
window.loadPaymentSettings = loadPaymentSettings;
window.showAddPaymentGatewayModal = showAddPaymentGatewayModal;
window.editPaymentGateway = editPaymentGateway;
window.savePaymentGateway = savePaymentGateway;
window.activateGateway = activateGateway;
window.deactivateGateway = deactivateGateway;
window.testGateway = testGateway;
window.deletePaymentGateway = deletePaymentGateway;