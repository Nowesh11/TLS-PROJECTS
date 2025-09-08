/**
 * Admin Dashboard JavaScript
 */

class AdminDashboard {
    constructor() {
        this.charts = {};
        this.initializeEventListeners();
        this.setupCharts();
        this.initializeDashboard();
    }

    initializeEventListeners() {
        // Hamburger menu toggle
        const hamburger = document.querySelector('.hamburger-menu');
        const sidebar = document.querySelector('.admin-sidebar');
        if (hamburger && sidebar) {
            hamburger.addEventListener('click', () => {
                sidebar.classList.toggle('show');
            });

            // Close sidebar when clicking outside
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768 && 
                    !e.target.closest('.admin-sidebar') && 
                    !e.target.closest('.hamburger-menu')) {
                    sidebar.classList.remove('show');
                }
            });
        }

        // Theme toggle
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Window resize handler
        window.addEventListener('resize', () => this.handleResize());
    }

    async initializeDashboard() {
        try {
            this.showLoading();
            const data = await this.fetchDashboardData();
            this.updateStats(data.stats);
            this.updateCharts(data.charts);
            this.updateActivities(data.activities);
            this.hideLoading();
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    async fetchDashboardData() {
        const response = await fetch('/api/admin/dashboard/stats');
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        return response.json();
    }

    updateStats(stats) {
        Object.entries(stats).forEach(([key, value]) => {
            const element = document.querySelector(`[data-stat="${key}"]`);
            if (element) {
                element.textContent = value.toLocaleString();
            }
        });
    }

    setupCharts() {
        // User Growth Chart
        this.charts.userGrowth = new Chart(
            document.getElementById('userGrowthChart')?.getContext('2d'),
            {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'New Users',
                        data: [],
                        borderColor: 'var(--primary-blue)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            }
        );

        // Activity Distribution Chart
        this.charts.activityDist = new Chart(
            document.getElementById('activityDistChart')?.getContext('2d'),
            {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            'var(--primary-blue)',
                            'var(--success-color)',
                            'var(--warning-color)',
                            'var(--error-color)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            }
        );
    }

    updateCharts(chartData) {
        if (this.charts.userGrowth && chartData.userGrowth) {
            this.charts.userGrowth.data = chartData.userGrowth;
            this.charts.userGrowth.update();
        }

        if (this.charts.activityDist && chartData.activityDistribution) {
            this.charts.activityDist.data = chartData.activityDistribution;
            this.charts.activityDist.update();
        }
    }

    updateActivities(activities) {
        const container = document.querySelector('.recent-activities');
        if (!container) return;

        if (!activities.length) {
            container.innerHTML = '<p class="text-muted">No recent activities</p>';
            return;
        }

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.description}</p>
                    <small>${this.formatTimeAgo(activity.createdAt)}</small>
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
        
        Object.values(this.charts).forEach(chart => {
            chart.options.plugins.legend.labels.color = textColor;
            chart.options.scales?.x?.ticks.color = textColor;
            chart.options.scales?.y?.ticks.color = textColor;
            chart.update();
        });
    }

    handleResize() {
        Object.values(this.charts).forEach(chart => chart.resize());
    }

    showLoading() {
        document.querySelector('.dashboard-container')?.classList.add('loading');
    }

    hideLoading() {
        document.querySelector('.dashboard-container')?.classList.remove('loading');
    }

    showError(message) {
        const container = document.querySelector('.dashboard-container');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>${message}</p>
                    <button onclick="dashboard.initializeDashboard()">Retry</button>
                </div>
            `;
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new AdminDashboard();
});