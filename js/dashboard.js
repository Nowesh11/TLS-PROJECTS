// Dashboard functionality for pie chart and recent activity
class DashboardManager {
    constructor() {
        this.pieChart = null;
        this.recruitmentPieChart = null;
        this.chartData = {
            books: 0,
            ebooks: 0,
            projects: 0,
            users: 0,
            teams: 0,
            announcements: 0,
            activities: 0,
            initiatives: 0
        };
        this.recruitmentData = {
            totalForms: 0,
            totalResponses: 0,
            projectForms: 0,
            activityForms: 0,
            initiativeForms: 0
        };
        this.recentActivities = [];
    }

    async init() {
        try {
            await this.loadDashboardData();
            this.initPieChart();
            await this.loadRecruitmentData();
            this.initRecruitmentPieChart();
            await this.initializeActivityAutoClear(); // Auto-clear old activities first
            await this.loadRecentActivity();
            
            // Add resize listener for responsive charts
            window.addEventListener("resize", () => {
                this.initPieChart();
                this.initRecruitmentPieChart();
            });
        } catch (error) {
            console.error("Dashboard initialization failed:", error);
        }
    }

    async loadDashboardData() {
        try {
            // Load books data
            const booksResponse = await window.apiCall("/api/books/admin/stats");
            this.chartData.books = booksResponse.success ? (booksResponse.data.totalBooks || 0) : 0;

            // Load ebooks data
            const ebooksResponse = await window.apiCall("/api/ebooks/admin/stats");
            this.chartData.ebooks = ebooksResponse.success ? (ebooksResponse.data.totalEbooks || 0) : 0;

            // Load projects data
            const projectsResponse = await window.apiCall("/api/admin/projects");
            this.chartData.projects = projectsResponse.success ? projectsResponse.data.length : 0;

            // Load users data
            const usersResponse = await window.apiCall("/api/users");
            this.chartData.users = usersResponse.success ? usersResponse.data.length : 0;

            // Load teams data
            const teamsResponse = await window.apiCall("/api/team");
            this.chartData.teams = teamsResponse.success ? teamsResponse.data.length : 0;

            // Load announcements data
            const announcementsResponse = await window.apiCall("/api/announcements");
            this.chartData.announcements = announcementsResponse.success ? announcementsResponse.data.length : 0;

            // Load activities data
            const activitiesResponse = await window.apiCall("/api/activities");
            this.chartData.activities = activitiesResponse.success ? activitiesResponse.data.length : 0;

            // Load initiatives data
            const initiativesResponse = await window.apiCall("/api/initiatives");
            this.chartData.initiatives = initiativesResponse.success ? initiativesResponse.data.length : 0;

        } catch (error) {
            console.error("Error loading dashboard data:", error);
        }
    }

    async loadRecruitmentData() {
        try {
            // Load recruitment forms data from API
            const response = await fetch("/api/recruitment/stats", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.getAuthToken()}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.recruitmentData.totalForms = data.totalForms || 0;
                this.recruitmentData.projectForms = data.projectForms || 0;
                this.recruitmentData.activityForms = data.activityForms || 0;
                this.recruitmentData.initiativeForms = data.initiativeForms || 0;
                this.recruitmentData.totalResponses = data.totalResponses || 0;
            } else {
                // Fallback to default values if API is not available
                console.warn("Recruitment API not available, using default values");
                this.recruitmentData.totalForms = 0;
                this.recruitmentData.projectForms = 0;
                this.recruitmentData.activityForms = 0;
                this.recruitmentData.initiativeForms = 0;
                this.recruitmentData.totalResponses = 0;
            }

            // Update recruitment stats display
            this.updateRecruitmentStats();

        } catch (error) {
            console.error("Error loading recruitment data:", error);
        }
    }

    /**
     * Get authentication token for API requests
     */
    getAuthToken() {
        try {
            // Try to get token from TokenManager if available
            if (typeof window.tokenManager !== "undefined" && window.tokenManager) {
                return window.tokenManager.getToken();
            }
            
            // Fallback to localStorage
            const sessionData = localStorage.getItem("adminSession");
            if (sessionData) {
                const session = JSON.parse(sessionData);
                return session.token;
            }
            
            return null;
        } catch (error) {
            console.error("Error getting auth token:", error);
            return null;
        }
    }

    updateRecruitmentStats() {
        const totalFormsEl = document.getElementById("totalForms");
        const totalResponsesEl = document.getElementById("totalResponses");
        
        if (totalFormsEl) totalFormsEl.textContent = this.recruitmentData.totalForms;
        if (totalResponsesEl) totalResponsesEl.textContent = this.recruitmentData.totalResponses;
    }

    initPieChart() {
        const canvas = document.getElementById("overviewPieChart");
        if (!canvas) return;

        // Make canvas responsive
        const container = canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        const size = Math.min(containerRect.width - 40, containerRect.height - 40, 300);
        
        canvas.width = size;
        canvas.height = size;
        canvas.style.width = size + "px";
        canvas.style.height = size + "px";

        const ctx = canvas.getContext("2d");
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate total and percentages
        const total = this.chartData.books + this.chartData.ebooks + this.chartData.projects + this.chartData.users + this.chartData.teams + this.chartData.announcements + this.chartData.activities + this.chartData.initiatives;
        
        if (total === 0) {
            // Draw empty state
            ctx.fillStyle = "#e5e7eb";
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = "#6b7280";
            ctx.font = "16px Arial";
            ctx.textAlign = "center";
            ctx.fillText("No Data Available", centerX, centerY);
            return;
        }

        // Colors for each segment
        const colors = {
            books: "#3b82f6",        // Blue
            ebooks: "#f59e0b",       // Yellow
            projects: "#10b981",     // Green
            users: "#8b5cf6",        // Purple
            teams: "#ef4444",        // Red
            announcements: "#06b6d4", // Cyan
            activities: "#84cc16",    // Lime
            initiatives: "#f97316"   // Orange
        };

        // Store segment data for hover detection
        this.pieSegments = [];
        
        // Draw pie segments
        let currentAngle = -Math.PI / 2; // Start from top
        
        Object.keys(this.chartData).forEach(key => {
            const value = this.chartData[key];
            if (value > 0) {
                const sliceAngle = (value / total) * 2 * Math.PI;
                
                // Store segment info for hover detection
                this.pieSegments.push({
                    key: key,
                    value: value,
                    percentage: ((value / total) * 100).toFixed(1),
                    startAngle: currentAngle,
                    endAngle: currentAngle + sliceAngle,
                    color: colors[key],
                    centerX: centerX,
                    centerY: centerY,
                    radius: radius
                });
                
                // Draw slice
                ctx.fillStyle = colors[key];
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
                ctx.closePath();
                ctx.fill();
                
                // Draw slice border
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2;
                ctx.stroke();
                
                currentAngle += sliceAngle;
            }
        });

        // Add hover functionality
        this.addPieChartHover(canvas);
        
        // Update legend
        this.updateChartLegend(colors);
    }

    addPieChartHover(canvas) {
        // Create tooltip element if it doesn't exist
        let tooltip = document.getElementById("pieChartTooltip");
        if (!tooltip) {
            tooltip = document.createElement("div");
            tooltip.id = "pieChartTooltip";
            tooltip.style.cssText = `
                position: absolute;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                pointer-events: none;
                z-index: 1000;
                display: none;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            `;
            document.body.appendChild(tooltip);
        }

        // Mouse move handler
        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Convert to canvas coordinates
            const canvasX = (x / rect.width) * canvas.width;
            const canvasY = (y / rect.height) * canvas.height;
            
            // Check if mouse is over any segment
            const hoveredSegment = this.getHoveredSegment(canvasX, canvasY);
            
            if (hoveredSegment) {
                // Show tooltip
                const labels = {
                    books: "Books",
                    ebooks: "E-books",
                    projects: "Projects",
                    users: "Users",
                    teams: "Teams",
                    announcements: "Announcements",
                    activities: "Activities",
                    initiatives: "Initiatives"
                };
                
                tooltip.innerHTML = `
                    <div style="font-weight: bold; margin-bottom: 4px;">${labels[hoveredSegment.key]}</div>
                    <div>Count: ${hoveredSegment.value}</div>
                    <div>Percentage: ${hoveredSegment.percentage}%</div>
                `;
                
                tooltip.style.display = "block";
                tooltip.style.left = (e.clientX + 10) + "px";
                tooltip.style.top = (e.clientY - 10) + "px";
                
                // Change cursor to pointer
                canvas.style.cursor = "pointer";
                
                // Highlight segment
                this.highlightSegment(hoveredSegment);
            } else {
                // Hide tooltip
                tooltip.style.display = "none";
                canvas.style.cursor = "default";
                
                // Redraw chart without highlight
                this.initPieChart();
            }
        };

        // Mouse leave handler
        const handleMouseLeave = () => {
            tooltip.style.display = "none";
            canvas.style.cursor = "default";
            this.initPieChart(); // Redraw without highlight
        };

        // Remove existing listeners
        canvas.removeEventListener("mousemove", canvas._pieChartMouseMove);
        canvas.removeEventListener("mouseleave", canvas._pieChartMouseLeave);
        
        // Add new listeners
        canvas._pieChartMouseMove = handleMouseMove;
        canvas._pieChartMouseLeave = handleMouseLeave;
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseleave", handleMouseLeave);
    }

    getHoveredSegment(x, y) {
        if (!this.pieSegments) return null;
        
        for (const segment of this.pieSegments) {
            const dx = x - segment.centerX;
            const dy = y - segment.centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if point is within the circle
            if (distance <= segment.radius) {
                // Calculate angle from center
                let angle = Math.atan2(dy, dx);
                // Normalize angle to match our drawing (starting from top)
                angle = angle + Math.PI / 2;
                if (angle < 0) angle += 2 * Math.PI;
                
                // Normalize segment angles
                let startAngle = segment.startAngle + Math.PI / 2;
                let endAngle = segment.endAngle + Math.PI / 2;
                if (startAngle < 0) startAngle += 2 * Math.PI;
                if (endAngle < 0) endAngle += 2 * Math.PI;
                
                // Handle angle wrapping
                if (startAngle > endAngle) {
                    if (angle >= startAngle || angle <= endAngle) {
                        return segment;
                    }
                } else {
                    if (angle >= startAngle && angle <= endAngle) {
                        return segment;
                    }
                }
            }
        }
        
        return null;
    }

    highlightSegment(segment) {
        const canvas = document.getElementById("overviewPieChart");
        if (!canvas) return;
        
        const ctx = canvas.getContext("2d");
        
        // Redraw the highlighted segment with a slightly larger radius
        ctx.fillStyle = segment.color;
        ctx.beginPath();
        ctx.moveTo(segment.centerX, segment.centerY);
        ctx.arc(segment.centerX, segment.centerY, segment.radius + 5, segment.startAngle, segment.endAngle);
        ctx.closePath();
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    initRecruitmentPieChart() {
        const canvas = document.getElementById("recruitmentPieChart");
        if (!canvas) return;

        // Make canvas responsive
        const container = canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        const size = Math.min(containerRect.width - 40, containerRect.height - 40, 300);
        
        canvas.width = size;
        canvas.height = size;
        canvas.style.width = size + "px";
        canvas.style.height = size + "px";

        const ctx = canvas.getContext("2d");
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate total and percentages
        const total = this.recruitmentData.projectForms + this.recruitmentData.activityForms + this.recruitmentData.initiativeForms;
        
        if (total === 0) {
            // Draw empty state
            ctx.fillStyle = "#e5e7eb";
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = "#6b7280";
            ctx.font = "16px Arial";
            ctx.textAlign = "center";
            ctx.fillText("No Forms Available", centerX, centerY);
            return;
        }

        // Colors for each segment
        const colors = {
            projectForms: "#3b82f6",     // Blue
            activityForms: "#10b981",    // Green
            initiativeForms: "#8b5cf6"   // Purple
        };

        // Draw pie segments
        let currentAngle = -Math.PI / 2; // Start from top
        
        Object.keys(colors).forEach(key => {
            const value = this.recruitmentData[key];
            if (value > 0) {
                const sliceAngle = (value / total) * 2 * Math.PI;
                
                // Draw slice
                ctx.fillStyle = colors[key];
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
                ctx.closePath();
                ctx.fill();
                
                // Draw slice border
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2;
                ctx.stroke();
                
                currentAngle += sliceAngle;
            }
        });

        // Update legend
        this.updateRecruitmentChartLegend(colors);
    }

    updateChartLegend(colors) {
        const legendContainer = document.getElementById("chartLegend");
        if (!legendContainer) return;

        const labels = {
            books: "Books",
            ebooks: "E-books",
            projects: "Projects",
            users: "Users",
            teams: "Teams",
            announcements: "Announcements",
            activities: "Activities",
            initiatives: "Initiatives"
        };

        legendContainer.innerHTML = "";
        
        Object.keys(this.chartData).forEach(key => {
            const value = this.chartData[key];
            const legendItem = document.createElement("div");
            legendItem.style.cssText = "display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem;";
            
            legendItem.innerHTML = `
                <div style="width: 16px; height: 16px; background: ${colors[key]}; border-radius: 2px;"></div>
                <span style="color: var(--text-primary);">${labels[key]}: ${value}</span>
            `;
            
            legendContainer.appendChild(legendItem);
        });
    }

    updateRecruitmentChartLegend(colors) {
        const legendContainer = document.getElementById("recruitmentChartLegend");
        if (!legendContainer) return;

        const labels = {
            projectForms: "Project Forms",
            activityForms: "Activity Forms",
            initiativeForms: "Initiative Forms"
        };

        legendContainer.innerHTML = "";
        
        Object.keys(colors).forEach(key => {
            const value = this.recruitmentData[key];
            if (value > 0) {
                const legendItem = document.createElement("div");
                legendItem.style.cssText = "display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem;";
                
                legendItem.innerHTML = `
                    <div style="width: 16px; height: 16px; background: ${colors[key]}; border-radius: 2px;"></div>
                    <span style="color: var(--text-primary);">${labels[key]}: ${value}</span>
                `;
                
                legendContainer.appendChild(legendItem);
            }
        });
    }

    async loadRecentActivity() {
        const activityContainer = document.getElementById("recentActivity");
        if (!activityContainer) return;

        try {
            // Fetch real recent activities from API
            const response = await fetch('/api/admin/activities/recent?limit=10', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            const activities = result.data || [];

            // Convert time strings to Date objects
            activities.forEach(activity => {
                activity.time = new Date(activity.time);
            });

            this.renderRecentActivity(activities);
        } catch (error) {
            console.error("Error loading recent activity:", error);
            
            // Fallback to mock data if API fails
            const fallbackActivities = [
                {
                    type: "content",
                    action: "create",
                    title: "New content section created",
                    time: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
                    icon: "fas fa-file-alt",
                    color: "#10b981"
                },
                {
                    type: "page",
                    action: "edit",
                    title: "Page content updated",
                    time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
                    icon: "fas fa-edit",
                    color: "#3b82f6"
                }
            ];
            
            this.renderRecentActivity(fallbackActivities);
        }
    }

    renderRecentActivity(activities) {
        const activityContainer = document.getElementById("recentActivity");
        if (!activityContainer) return;

        if (activities.length === 0) {
            activityContainer.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                    <i class="fas fa-clock" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No recent activity</p>
                </div>
            `;
            return;
        }

        const activitiesHTML = activities.map(activity => {
            const timeAgo = this.getTimeAgo(activity.time);
            return `
                <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; border-bottom: 1px solid var(--border-secondary); transition: background-color 0.2s;" 
                     onmouseover="this.style.backgroundColor='var(--bg-secondary)'" 
                     onmouseout="this.style.backgroundColor='transparent'">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: ${activity.color}20; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <i class="${activity.icon}" style="color: ${activity.color}; font-size: 1rem;"></i>
                    </div>
                    <div style="flex: 1;">
                        <p style="margin: 0; color: var(--text-primary); font-weight: 500; font-size: 0.875rem;">${activity.title}</p>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.75rem;">${timeAgo}</p>
                    </div>
                </div>
            `;
        }).join("");

        activityContainer.innerHTML = activitiesHTML;
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return "Just now";
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? "s" : ""} ago`;
        } else if (diffInSeconds < 2592000) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? "s" : ""} ago`;
        } else {
            const months = Math.floor(diffInSeconds / 2592000);
            return `${months} month${months > 1 ? "s" : ""} ago`;
        }
    }

    async autoClearOldActivities() {
        try {
            const response = await fetch('/api/admin/activities/auto-clear', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Auto-clear result:', result);
            
            // Reload recent activities after clearing
            await this.loadRecentActivity();
            
            return result;
        } catch (error) {
            console.error('Error auto-clearing old activities:', error);
            throw error;
        }
    }

    async initializeActivityAutoClear() {
        // Auto-clear old activities on dashboard load
        try {
            await this.autoClearOldActivities();
        } catch (error) {
            console.warn('Failed to auto-clear old activities:', error);
        }
    }

    refresh() {
        this.init();
    }

    refreshRecruitmentChart() {
        this.loadRecruitmentData().then(() => {
            this.initRecruitmentPieChart();
        });
    }
}

// Initialize dashboard when DOM is loaded
if (typeof window !== "undefined") {
    window.dashboardManager = new DashboardManager();
    
    // Auto-initialize when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            window.dashboardManager.init();
        });
    } else {
        window.dashboardManager.init();
    }
}