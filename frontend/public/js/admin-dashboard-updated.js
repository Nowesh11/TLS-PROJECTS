/**
 * Updated Admin Dashboard with Real Backend Integration
 * Removes global dashboard components and integrates with backend APIs
 */

class AdminDashboard {
    constructor() {
        this.charts = {};
        this.apiBaseUrl = '/api';
        this.initializeEventListeners();
        this.initializeDashboard();
    }

    initializeEventListeners() {
        // Hamburger menu toggle for mobile
        const hamburger = document.querySelector('.hamburger-menu');
        const sidebar = document.querySelector('.admin-sidebar');
        if (hamburger && sidebar) {
            hamburger.addEventListener('click', () => {
                sidebar.classList.toggle('show');
            });

            // Close sidebar when clicking outside on mobile
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768 && 
                    !e.target.closest('.admin-sidebar') && 
                    !e.target.closest('.hamburger-menu')) {
                    sidebar.classList.remove('show');
                }
            });
        }

        // Single theme toggle (remove duplicates)
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Window resize handler for responsive charts
        window.addEventListener('resize', () => this.handleResize());
    }

    async initializeDashboard() {
        try {
            this.showLoading();
            
            // Fetch real data from backend APIs
            const [dashboardStats, recentActivities] = await Promise.all([
                this.fetchDashboardStats(),
                this.fetchRecentActivities()
            ]);
            
            // Update dashboard with real data
            this.updatePieChart(dashboardStats);
            this.updateRecentActivities(recentActivities);
            
            this.hideLoading();
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    async fetchDashboardStats() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/dashboard/stats`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            // Fallback to individual API calls if main endpoint fails
            return await this.fetchIndividualStats();
        }
    }

    async fetchIndividualStats() {
        try {
            const [books, ebooks, projects, users, activities] = await Promise.all([
                fetch(`${this.apiBaseUrl}/books/admin/stats`).then(r => r.json()),
                fetch(`${this.apiBaseUrl}/ebooks/admin/stats`).then(r => r.json()),
                fetch(`${this.apiBaseUrl}/admin/projects`).then(r => r.json()),
                fetch(`${this.apiBaseUrl}/users`).then(r => r.json()),
                fetch(`${this.apiBaseUrl}/activities`).then(r => r.json())
            ]);

            return {
                stats: {
                    bookCount: books.data?.totalBooks || 0,
                    ebookCount: ebooks.data?.totalEbooks || 0,
                    projectCount: projects.data?.length || 0,
                    userCount: users.data?.length || 0,
                    activityCount: activities.data?.length || 0
                }
            };
        } catch (error) {
            console.error('Error fetching individual stats:', error);
            return { stats: { bookCount: 0, ebookCount: 0, projectCount: 0, userCount: 0, activityCount: 0 } };
        }
    }

    async fetchRecentActivities() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/dashboard/recent-activities`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching recent activities:', error);
            return [];
        }
    }

    updatePieChart(data) {
        const canvas = document.getElementById('overviewPieChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const stats = data.stats || {};
        
        // Prepare chart data with real backend data
        const chartData = {
            labels: ['Books', 'E-books', 'Projects', 'Users', 'Activities'],
            datasets: [{
                data: [
                    stats.bookCount || 0,
                    stats.ebookCount || 0,
                    stats.projectCount || 0,
                    stats.userCount || 0,
                    stats.activityCount || 0
                ],
                backgroundColor: [
                    'var(--primary-blue)', // Blue for books
                    'var(--success-color)', // Green for ebooks
                    'var(--warning-color)', // Yellow for projects
                    'var(--error-color)', // Red for users
                    'var(--accent-purple)'  // Purple for activities
                ],
                borderWidth: 2,
                borderColor: 'var(--card-bg)'
            }]
        };

        // Destroy existing chart if it exists
        if (this.charts.pieChart) {
            this.charts.pieChart.destroy();
        }

        // Create new pie chart with real data
        this.charts.pieChart = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // We'll create custom legend
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });

        // Update custom legend
        this.updateChartLegend(chartData);
    }

    updateChartLegend(chartData) {
        const legendContainer = document.getElementById('chartLegend');
        if (!legendContainer) return;

        const total = chartData.datasets[0].data.reduce((a, b) => a + b, 0);
        
        legendContainer.innerHTML = chartData.labels.map((label, index) => {
            const value = chartData.datasets[0].data[index];
            const color = chartData.datasets[0].backgroundColor[index];
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            
            return `
                <div class="legend-item" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: var(--bg-secondary); border-radius: 0.5rem; border: 1px solid var(--border-primary);">
                    <div style="width: 12px; height: 12px; background: ${color}; border-radius: 50%;"></div>
                    <span style="color: var(--text-primary); font-size: 0.875rem; font-weight: 500;">
                        ${label}: ${value} (${percentage}%)
                    </span>
                </div>
            `;
        }).join('');
    }

    updateRecentActivities(activities) {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        if (!activities.length) {
            container.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No recent activities</p>
                </div>
            `;
            return;
        }

        container.innerHTML = activities.map(activity => `
            <div class="activity-item" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; border-bottom: 1px solid var(--border-primary); transition: background-color 0.2s ease;">
                <div class="activity-icon" style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary-color); display: flex; align-items: center; justify-content: center; color: white;">
                    <i class="fas ${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content" style="flex: 1;">
                    <p style="margin: 0 0 0.25rem 0; color: var(--text-primary); font-weight: 500;">
                        ${activity.description || activity.title || 'Activity'}
                    </p>
                    <small style="color: var(--text-secondary);">
                        ${this.formatTimeAgo(activity.createdAt)}
                    </small>
                </div>
            </div>
        `).join('');
    }

    getActivityIcon(type) {
        const icons = {
            user: 'fa-user',
            book: 'fa-book',
            project: 'fa-project-diagram',
            activity: 'fa-calendar-check',
            ebook: 'fa-file-pdf',
            team: 'fa-users',
            form: 'fa-wpforms',
            chat: 'fa-comments',
            announcement: 'fa-bullhorn',
            purchase: 'fa-shopping-cart',
            payment: 'fa-credit-card',
            poster: 'fa-image'
        };
        return icons[type] || 'fa-info-circle';
    }

    formatTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval !== 1 ? 's' : ''} ago`;
            }
        }
        return 'Just now';
    }

    getAuthToken() {
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
    }

    toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update charts theme
        this.updateChartsTheme(newTheme);
    }

    updateChartsTheme(theme) {
        const textColor = theme === 'dark' ? '#F9FAFB' : '#1F2937';
        
        if (this.charts.pieChart) {
            this.charts.pieChart.options.plugins.tooltip.titleColor = textColor;
            this.charts.pieChart.options.plugins.tooltip.bodyColor = textColor;
            this.charts.pieChart.update();
        }
    }

    handleResize() {
        // Show/hide hamburger menu based on screen size
        const hamburger = document.querySelector('.hamburger-menu');
        if (hamburger) {
            hamburger.style.display = window.innerWidth <= 768 ? 'block' : 'none';
        }
        
        // Resize charts
        if (this.charts.pieChart) {
            this.charts.pieChart.resize();
        }
    }

    showLoading() {
        const loadingElement = document.getElementById('chartLoading');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
    }

    hideLoading() {
        const loadingElement = document.getElementById('chartLoading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    showError(message) {
        const container = document.querySelector('.dashboard-overview');
        if (container) {
            container.innerHTML = `
                <div class="error-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--bg-primary); border-radius: 1rem; border: 1px solid var(--border-danger);">
                    <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: var(--danger-color); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-primary); font-size: 1.1rem; margin-bottom: 1.5rem;">${message}</p>
                    <button onclick="dashboard.initializeDashboard()" class="btn btn-primary">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    // Method to refresh dashboard data
    async refresh() {
        await this.initializeDashboard();
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new AdminDashboard();
});