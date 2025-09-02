/**
 * Global Dashboard Analytics System
 * Handles global recruitment analytics and dashboard functionality
 */

class GlobalDashboard {
    constructor() {
        this.charts = {};
        this.data = {
            responses: [],
            projects: [],
            activities: [],
            initiatives: []
        };
        this.init();
    }

    init() {
        console.log("Initializing Global Dashboard...");
        this.loadGlobalData();
        this.initializeCharts();
    }

    loadGlobalData() {
        // Load all recruitment data from localStorage
        this.data.responses = JSON.parse(localStorage.getItem("recruitmentResponses") || "[]");
        this.data.projects = JSON.parse(localStorage.getItem("projects") || "[]");
        this.data.activities = JSON.parse(localStorage.getItem("activities") || "[]");
        this.data.initiatives = JSON.parse(localStorage.getItem("initiatives") || "[]");
        
        this.updateGlobalStats();
        this.updateTopPerformingItems();
    }

    updateGlobalStats() {
        const totalResponses = this.data.responses.length;
        const crewResponses = this.data.responses.filter(r => r.type === "crew").length;
        const volunteerResponses = this.data.responses.filter(r => r.type === "volunteer").length;
        const participantResponses = this.data.responses.filter(r => r.type === "participant").length;

        // Update stat cards
        this.updateElement("totalResponses", totalResponses);
        this.updateElement("totalCrewResponses", crewResponses);
        this.updateElement("totalVolunteerResponses", volunteerResponses);
        
        // Also update existing stats
        this.updateElement("totalBooks", this.data.projects.filter(p => p.type === "book").length);
        this.updateElement("totalEbooks", this.data.projects.filter(p => p.type === "ebook").length);
        this.updateElement("totalProjects", this.data.projects.length + this.data.activities.length + this.data.initiatives.length);
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value.toLocaleString();
        }
    }

    initializeCharts() {
        this.initResponseTrendsChart();
        this.initResponseDistributionChart();
        this.initResponseStatusChart();
    }

    initResponseTrendsChart() {
        const ctx = document.getElementById("globalResponseTrendsChart");
        if (!ctx) return;

        const monthlyData = this.getMonthlyResponseData();
        
        this.charts.trends = new Chart(ctx, {
            type: "line",
            data: {
                labels: monthlyData.labels,
                datasets: [
                    {
                        label: "Crew Applications",
                        data: monthlyData.crew,
                        borderColor: "var(--accent-pink, #ec4899)",
                        backgroundColor: "rgba(236, 72, 153, 0.1)",
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: "Volunteer Applications",
                        data: monthlyData.volunteer,
                        borderColor: "var(--success-color, #22c55e)",
                        backgroundColor: "rgba(34, 197, 94, 0.1)",
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: "Participant Applications",
                        data: monthlyData.participant,
                        borderColor: "var(--primary-color, #3b82f6)",
                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "top",
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue("--text-primary")
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue("--text-secondary")
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue("--border-secondary")
                        }
                    },
                    x: {
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue("--text-secondary")
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue("--border-secondary")
                        }
                    }
                }
            }
        });
    }

    initResponseDistributionChart() {
        const ctx = document.getElementById("globalResponseDistributionChart");
        if (!ctx) return;

        const distributionData = this.getResponseDistribution();
        
        this.charts.distribution = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: distributionData.labels,
                datasets: [{
                    data: distributionData.data,
                    backgroundColor: [
                        "var(--accent-pink, #ec4899)",
                        "var(--success-color, #22c55e)",
                        "var(--primary-color, #3b82f6)",
                        "var(--warning-color, #f59e0b)",
                        "var(--purple-color, #8b5cf6)"
                    ],
                    borderWidth: 2,
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue("--bg-primary")
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue("--text-primary"),
                            padding: 20
                        }
                    }
                }
            }
        });
    }

    initResponseStatusChart() {
        const ctx = document.getElementById("globalResponseStatusChart");
        if (!ctx) return;

        const statusData = this.getResponseStatusData();
        
        this.charts.status = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["Pending", "Approved", "Rejected", "Under Review"],
                datasets: [
                    {
                        label: "Crew",
                        data: statusData.crew,
                        backgroundColor: "var(--accent-pink, #ec4899)"
                    },
                    {
                        label: "Volunteer",
                        data: statusData.volunteer,
                        backgroundColor: "var(--success-color, #22c55e)"
                    },
                    {
                        label: "Participant",
                        data: statusData.participant,
                        backgroundColor: "var(--primary-color, #3b82f6)"
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "top",
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue("--text-primary")
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        stacked: true,
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue("--text-secondary")
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue("--border-secondary")
                        }
                    },
                    x: {
                        stacked: true,
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue("--text-secondary")
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue("--border-secondary")
                        }
                    }
                }
            }
        });
    }

    getMonthlyResponseData() {
        const months = [];
        const now = new Date();
        
        // Get last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                label: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
                key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
            });
        }

        const data = {
            labels: months.map(m => m.label),
            crew: new Array(6).fill(0),
            volunteer: new Array(6).fill(0),
            participant: new Array(6).fill(0)
        };

        this.data.responses.forEach(response => {
            const responseDate = new Date(response.submittedAt || response.createdAt || Date.now());
            const responseKey = `${responseDate.getFullYear()}-${String(responseDate.getMonth() + 1).padStart(2, "0")}`;
            
            const monthIndex = months.findIndex(m => m.key === responseKey);
            if (monthIndex !== -1) {
                if (response.type === "crew") data.crew[monthIndex]++;
                else if (response.type === "volunteer") data.volunteer[monthIndex]++;
                else if (response.type === "participant") data.participant[monthIndex]++;
            }
        });

        return data;
    }

    getResponseDistribution() {
        const distribution = {
            crew: this.data.responses.filter(r => r.type === "crew").length,
            volunteer: this.data.responses.filter(r => r.type === "volunteer").length,
            participant: this.data.responses.filter(r => r.type === "participant").length
        };

        return {
            labels: ["Crew Applications", "Volunteer Applications", "Participant Applications"],
            data: [distribution.crew, distribution.volunteer, distribution.participant]
        };
    }

    getResponseStatusData() {
        const statuses = ["pending", "approved", "rejected", "under_review"];
        const types = ["crew", "volunteer", "participant"];
        
        const data = {
            crew: [0, 0, 0, 0],
            volunteer: [0, 0, 0, 0],
            participant: [0, 0, 0, 0]
        };

        this.data.responses.forEach(response => {
            const statusIndex = statuses.indexOf(response.status || "pending");
            if (statusIndex !== -1 && data[response.type]) {
                data[response.type][statusIndex]++;
            }
        });

        return data;
    }

    updateTopPerformingItems() {
        const container = document.getElementById("topPerformingItems");
        if (!container) return;

        // Count responses by item
        const itemCounts = {};
        this.data.responses.forEach(response => {
            const key = `${response.entityType}-${response.entityId}`;
            if (!itemCounts[key]) {
                itemCounts[key] = {
                    title: response.entityTitle || "Unknown",
                    type: response.entityType,
                    count: 0
                };
            }
            itemCounts[key].count++;
        });

        // Sort by count and get top 5
        const topItems = Object.values(itemCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        if (topItems.length === 0) {
            container.innerHTML = "<p style=\"color: var(--text-secondary); text-align: center;\">No data available</p>";
            return;
        }

        container.innerHTML = topItems.map((item, index) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-secondary);">
                <div>
                    <div style="font-weight: 600; color: var(--text-primary);">
                        ${index + 1}. ${item.title}
                    </div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary); text-transform: capitalize;">
                        ${item.type}
                    </div>
                </div>
                <div style="font-weight: 600; color: var(--primary-blue);">
                    ${item.count} responses
                </div>
            </div>
        `).join("");
    }

    refresh() {
        console.log("Refreshing global dashboard data...");
        this.loadGlobalData();
        
        // Refresh charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === "function") {
                chart.destroy();
            }
        });
        
        this.charts = {};
        setTimeout(() => {
            this.initializeCharts();
        }, 100);
    }

    exportGlobalData() {
        const data = {
            summary: {
                totalResponses: this.data.responses.length,
                crewResponses: this.data.responses.filter(r => r.type === "crew").length,
                volunteerResponses: this.data.responses.filter(r => r.type === "volunteer").length,
                participantResponses: this.data.responses.filter(r => r.type === "participant").length,
                exportedAt: new Date().toISOString()
            },
            responses: this.data.responses,
            monthlyTrends: this.getMonthlyResponseData(),
            distribution: this.getResponseDistribution(),
            statusBreakdown: this.getResponseStatusData()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `global-dashboard-export-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification("Global dashboard data exported successfully!", "success");
    }

    showNotification(message, type = "info") {
        const notification = document.createElement("div");
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            color: white;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            background: ${type === "success" ? "var(--success-color, #10b981)" : type === "error" ? "var(--error-color, #ef4444)" : "var(--primary-color, #3b82f6)"};
        `;

        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = "slideOut 0.3s ease";
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Global functions
function refreshGlobalDashboard() {
    if (window.globalDashboard) {
        window.globalDashboard.refresh();
    }
}

function exportGlobalDashboard() {
    if (window.globalDashboard) {
        window.globalDashboard.exportGlobalData();
    }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    if (document.getElementById("dashboard")) {
        window.globalDashboard = new GlobalDashboard();
    }
});

// CSS for animations
const style = document.createElement("style");
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);