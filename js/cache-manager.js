/**
 * Cache Management Utility for Admin Panel
 * Provides administrative controls for cache management
 */

class CacheManager {
    constructor() {
        this.init();
    }

    /**
     * Initialize cache manager
     */
    init() {
        this.setupUI();
        this.bindEvents();
    }

    /**
     * Set up cache management UI in admin panel
     */
    setupUI() {
        // Only add UI if we're on admin page
        if (!window.location.pathname.includes('admin')) {
            return;
        }

        const cacheControlsHTML = `
            <div class="cache-management-panel" style="
                position: fixed;
                top: 80px;
                right: 20px;
                background: var(--card-bg, #fff);
                border: 1px solid var(--border-color, #ddd);
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                z-index: 1000;
                min-width: 250px;
                display: none;
            ">
                <h4 style="margin: 0 0 15px 0; color: var(--text-color, #333);">Cache Management</h4>
                
                <div class="cache-info" style="margin-bottom: 15px; font-size: 12px; color: var(--text-secondary, #666);">
                    <div>Cache Version: <span id="cache-version">Loading...</span></div>
                    <div>Last Updated: <span id="cache-updated">Loading...</span></div>
                </div>
                
                <div class="cache-actions">
                    <button id="clear-css-cache" class="cache-btn" style="
                        width: 100%;
                        margin-bottom: 8px;
                        padding: 8px 12px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Clear CSS Cache</button>
                    
                    <button id="clear-all-cache" class="cache-btn" style="
                        width: 100%;
                        margin-bottom: 8px;
                        padding: 8px 12px;
                        background: #ffc107;
                        color: #212529;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Clear All Cache</button>
                    
                    <button id="force-refresh" class="cache-btn" style="
                        width: 100%;
                        margin-bottom: 8px;
                        padding: 8px 12px;
                        background: #dc3545;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Force Refresh</button>
                    
                    <button id="update-service-worker" class="cache-btn" style="
                        width: 100%;
                        padding: 8px 12px;
                        background: #28a745;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Update Service Worker</button>
                </div>
                
                <div class="cache-status" id="cache-status" style="
                    margin-top: 15px;
                    padding: 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    display: none;
                "></div>
            </div>
            
            <button id="cache-toggle-btn" style="
                position: fixed;
                top: 20px;
                right: 80px;
                background: var(--primary-color, #007bff);
                color: white;
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                cursor: pointer;
                z-index: 1001;
                font-size: 16px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            " title="Cache Management">⚡</button>
        `;

        // Add to body
        document.body.insertAdjacentHTML('beforeend', cacheControlsHTML);
        
        // Update cache info
        this.updateCacheInfo();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Toggle panel visibility
        const toggleBtn = document.getElementById('cache-toggle-btn');
        const panel = document.querySelector('.cache-management-panel');
        
        if (toggleBtn && panel) {
            toggleBtn.addEventListener('click', () => {
                const isVisible = panel.style.display !== 'none';
                panel.style.display = isVisible ? 'none' : 'block';
            });
        }

        // Cache action buttons
        const clearCssBtn = document.getElementById('clear-css-cache');
        const clearAllBtn = document.getElementById('clear-all-cache');
        const forceRefreshBtn = document.getElementById('force-refresh');
        const updateSwBtn = document.getElementById('update-service-worker');

        if (clearCssBtn) {
            clearCssBtn.addEventListener('click', () => this.clearCSSCache());
        }

        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllCache());
        }

        if (forceRefreshBtn) {
            forceRefreshBtn.addEventListener('click', () => this.forceRefresh());
        }

        if (updateSwBtn) {
            updateSwBtn.addEventListener('click', () => this.updateServiceWorker());
        }
    }

    /**
     * Update cache information display
     */
    updateCacheInfo() {
        const versionEl = document.getElementById('cache-version');
        const updatedEl = document.getElementById('cache-updated');
        
        if (versionEl && window.cacheBuster) {
            versionEl.textContent = window.cacheBuster.getVersion();
        }
        
        if (updatedEl) {
            const lastUpdated = localStorage.getItem('cacheBuster_version');
            if (lastUpdated) {
                const date = new Date(parseInt(lastUpdated));
                updatedEl.textContent = date.toLocaleTimeString();
            } else {
                updatedEl.textContent = 'Never';
            }
        }
    }

    /**
     * Show status message
     */
    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('cache-status');
        if (!statusEl) return;

        const colors = {
            info: '#d1ecf1',
            success: '#d4edda',
            warning: '#fff3cd',
            error: '#f8d7da'
        };

        statusEl.style.display = 'block';
        statusEl.style.backgroundColor = colors[type] || colors.info;
        statusEl.textContent = message;

        // Hide after 3 seconds
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 3000);
    }

    /**
     * Clear CSS cache only
     */
    async clearCSSCache() {
        try {
            this.showStatus('Clearing CSS cache...', 'info');
            
            if (window.cacheBuster) {
                await window.cacheBuster.constructor.forceReload('css', true);
                this.showStatus('CSS cache cleared successfully!', 'success');
                this.updateCacheInfo();
            } else {
                throw new Error('Cache buster not available');
            }
        } catch (error) {
            console.error('Error clearing CSS cache:', error);
            this.showStatus('Failed to clear CSS cache', 'error');
        }
    }

    /**
     * Clear all caches
     */
    async clearAllCache() {
        try {
            this.showStatus('Clearing all caches...', 'info');
            
            if (window.clearAllCaches) {
                await window.clearAllCaches();
                this.showStatus('All caches cleared successfully!', 'success');
                this.updateCacheInfo();
            } else {
                throw new Error('Clear all caches function not available');
            }
        } catch (error) {
            console.error('Error clearing all caches:', error);
            this.showStatus('Failed to clear all caches', 'error');
        }
    }

    /**
     * Force refresh page with cache clearing
     */
    async forceRefresh() {
        try {
            this.showStatus('Force refreshing...', 'info');
            
            if (window.forceRefresh) {
                await window.forceRefresh();
            } else {
                // Fallback method
                window.location.reload(true);
            }
        } catch (error) {
            console.error('Error force refreshing:', error);
            this.showStatus('Failed to force refresh', 'error');
        }
    }

    /**
     * Update service worker
     */
    async updateServiceWorker() {
        try {
            this.showStatus('Updating service worker...', 'info');
            
            if (window.updateServiceWorker) {
                const updated = await window.updateServiceWorker();
                if (updated) {
                    this.showStatus('Service worker updated successfully!', 'success');
                } else {
                    this.showStatus('No service worker update needed', 'info');
                }
            } else {
                throw new Error('Update service worker function not available');
            }
        } catch (error) {
            console.error('Error updating service worker:', error);
            this.showStatus('Failed to update service worker', 'error');
        }
    }
}

// Auto-initialize on DOM content loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.cacheManager = new CacheManager();
    });
} else {
    window.cacheManager = new CacheManager();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CacheManager;
}