/**
 * CSV Export System
 * Handles CSV export functionality for responses and dashboard data
 */

class CSVExporter {
    constructor() {
        this.init();
    }

    init() {
        console.log("CSV Exporter initialized");
    }

    // Convert array of objects to CSV string
    arrayToCSV(data, headers = null) {
        if (!data || data.length === 0) {
            return "No data available";
        }

        // If headers not provided, use keys from first object
        if (!headers) {
            headers = Object.keys(data[0]);
        }

        // Create CSV header row
        let csv = headers.map(header => this.escapeCSVField(header)).join(",") + "\n";

        // Add data rows
        data.forEach(row => {
            const values = headers.map(header => {
                let value = row[header];
                
                // Handle different data types
                if (value === null || value === undefined) {
                    return "";
                }
                
                if (typeof value === "object") {
                    value = JSON.stringify(value);
                }
                
                if (Array.isArray(value)) {
                    value = value.join("; ");
                }
                
                return this.escapeCSVField(String(value));
            });
            
            csv += values.join(",") + "\n";
        });

        return csv;
    }

    // Escape CSV field (handle commas, quotes, newlines)
    escapeCSVField(field) {
        if (field.includes(",") || field.includes("\"") || field.includes("\n") || field.includes("\r")) {
            return "\"" + field.replace(/"/g, "\"\"") + "\"";
        }
        return field;
    }

    // Download CSV file
    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }

    // Export responses by type
    exportResponsesByType(type) {
        const responses = JSON.parse(localStorage.getItem("recruitmentResponses") || "[]");
        const filteredResponses = responses.filter(r => r.type === type);
        
        if (filteredResponses.length === 0) {
            this.showNotification(`No ${type} responses found to export`, "warning");
            return;
        }

        // Flatten response data for CSV
        const flattenedData = filteredResponses.map(response => {
            const flattened = {
                "Response ID": response.id,
                "Entity Type": response.entityType,
                "Entity Title": response.entityTitle,
                "Response Type": response.type,
                "Status": response.status || "pending",
                "Submitted At": new Date(response.submittedAt || response.createdAt || Date.now()).toLocaleString(),
                "Applicant Name": "",
                "Applicant Email": "",
                "Applicant Phone": ""
            };

            // Extract form responses
            if (response.responses && Array.isArray(response.responses)) {
                response.responses.forEach((resp, index) => {
                    flattened[`Question ${index + 1}`] = resp.question || "";
                    flattened[`Answer ${index + 1}`] = resp.answer || "";
                    
                    // Try to identify common fields
                    if (resp.question && resp.question.toLowerCase().includes("name")) {
                        flattened["Applicant Name"] = resp.answer || "";
                    }
                    if (resp.question && resp.question.toLowerCase().includes("email")) {
                        flattened["Applicant Email"] = resp.answer || "";
                    }
                    if (resp.question && resp.question.toLowerCase().includes("phone")) {
                        flattened["Applicant Phone"] = resp.answer || "";
                    }
                });
            }

            return flattened;
        });

        const csv = this.arrayToCSV(flattenedData);
        const filename = `${type}-responses-${new Date().toISOString().split("T")[0]}.csv`;
        
        this.downloadCSV(csv, filename);
        this.showNotification(`${type} responses exported successfully!`, "success");
    }

    // Export all responses
    exportAllResponses() {
        const responses = JSON.parse(localStorage.getItem("recruitmentResponses") || "[]");
        
        if (responses.length === 0) {
            this.showNotification("No responses found to export", "warning");
            return;
        }

        // Flatten all response data
        const flattenedData = responses.map(response => {
            const flattened = {
                "Response ID": response.id,
                "Entity Type": response.entityType,
                "Entity Title": response.entityTitle,
                "Response Type": response.type,
                "Status": response.status || "pending",
                "Submitted At": new Date(response.submittedAt || response.createdAt || Date.now()).toLocaleString()
            };

            // Extract form responses
            if (response.responses && Array.isArray(response.responses)) {
                response.responses.forEach((resp, index) => {
                    flattened[`Q${index + 1}: ${resp.question || "Question"}`] = resp.answer || "";
                });
            }

            return flattened;
        });

        const csv = this.arrayToCSV(flattenedData);
        const filename = `all-responses-${new Date().toISOString().split("T")[0]}.csv`;
        
        this.downloadCSV(csv, filename);
        this.showNotification("All responses exported successfully!", "success");
    }

    // Export global dashboard summary
    exportGlobalSummary() {
        const responses = JSON.parse(localStorage.getItem("recruitmentResponses") || "[]");
        const projects = JSON.parse(localStorage.getItem("projects") || "[]");
        const activities = JSON.parse(localStorage.getItem("activities") || "[]");
        const initiatives = JSON.parse(localStorage.getItem("initiatives") || "[]");

        // Create summary data
        const summaryData = [
            {
                "Metric": "Total Responses",
                "Count": responses.length,
                "Percentage": "100%"
            },
            {
                "Metric": "Crew Applications",
                "Count": responses.filter(r => r.type === "crew").length,
                "Percentage": responses.length > 0 ? `${((responses.filter(r => r.type === "crew").length / responses.length) * 100).toFixed(1)}%` : "0%"
            },
            {
                "Metric": "Volunteer Applications",
                "Count": responses.filter(r => r.type === "volunteer").length,
                "Percentage": responses.length > 0 ? `${((responses.filter(r => r.type === "volunteer").length / responses.length) * 100).toFixed(1)}%` : "0%"
            },
            {
                "Metric": "Participant Applications",
                "Count": responses.filter(r => r.type === "participant").length,
                "Percentage": responses.length > 0 ? `${((responses.filter(r => r.type === "participant").length / responses.length) * 100).toFixed(1)}%` : "0%"
            },
            {
                "Metric": "Total Projects",
                "Count": projects.length,
                "Percentage": "-"
            },
            {
                "Metric": "Total Activities",
                "Count": activities.length,
                "Percentage": "-"
            },
            {
                "Metric": "Total Initiatives",
                "Count": initiatives.length,
                "Percentage": "-"
            }
        ];

        // Add status breakdown
        const statuses = ["pending", "approved", "rejected", "under_review"];
        statuses.forEach(status => {
            const count = responses.filter(r => (r.status || "pending") === status).length;
            summaryData.push({
                "Metric": `${status.charAt(0).toUpperCase() + status.slice(1)} Responses`,
                "Count": count,
                "Percentage": responses.length > 0 ? `${((count / responses.length) * 100).toFixed(1)}%` : "0%"
            });
        });

        const csv = this.arrayToCSV(summaryData);
        const filename = `global-dashboard-summary-${new Date().toISOString().split("T")[0]}.csv`;
        
        this.downloadCSV(csv, filename);
        this.showNotification("Global dashboard summary exported successfully!", "success");
    }

    // Export monthly trends data
    exportMonthlyTrends() {
        const responses = JSON.parse(localStorage.getItem("recruitmentResponses") || "[]");
        
        if (responses.length === 0) {
            this.showNotification("No responses found to export trends", "warning");
            return;
        }

        // Get last 12 months
        const months = [];
        const now = new Date();
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                label: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
                key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
            });
        }

        // Count responses by month and type
        const trendsData = months.map(month => {
            const monthResponses = responses.filter(response => {
                const responseDate = new Date(response.submittedAt || response.createdAt || Date.now());
                const responseKey = `${responseDate.getFullYear()}-${String(responseDate.getMonth() + 1).padStart(2, "0")}`;
                return responseKey === month.key;
            });

            return {
                "Month": month.label,
                "Total Responses": monthResponses.length,
                "Crew Applications": monthResponses.filter(r => r.type === "crew").length,
                "Volunteer Applications": monthResponses.filter(r => r.type === "volunteer").length,
                "Participant Applications": monthResponses.filter(r => r.type === "participant").length,
                "Pending": monthResponses.filter(r => (r.status || "pending") === "pending").length,
                "Approved": monthResponses.filter(r => r.status === "approved").length,
                "Rejected": monthResponses.filter(r => r.status === "rejected").length
            };
        });

        const csv = this.arrayToCSV(trendsData);
        const filename = `monthly-trends-${new Date().toISOString().split("T")[0]}.csv`;
        
        this.downloadCSV(csv, filename);
        this.showNotification("Monthly trends data exported successfully!", "success");
    }

    // Export filtered responses based on current table filters
    exportFilteredResponses(tableId) {
        const table = document.getElementById(tableId);
        if (!table) {
            this.showNotification("Table not found", "error");
            return;
        }

        const rows = table.querySelectorAll("tbody tr:not([style*=\"display: none\"])");
        if (rows.length === 0) {
            this.showNotification("No visible data to export", "warning");
            return;
        }

        // Extract data from visible table rows
        const headers = Array.from(table.querySelectorAll("thead th")).map(th => th.textContent.trim());
        const data = Array.from(rows).map(row => {
            const cells = row.querySelectorAll("td");
            const rowData = {};
            headers.forEach((header, index) => {
                if (cells[index]) {
                    rowData[header] = cells[index].textContent.trim();
                }
            });
            return rowData;
        });

        const csv = this.arrayToCSV(data, headers);
        const filename = `filtered-${tableId}-${new Date().toISOString().split("T")[0]}.csv`;
        
        this.downloadCSV(csv, filename);
        this.showNotification("Filtered data exported successfully!", "success");
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
            background: ${type === "success" ? "var(--success-color, #10b981)" : type === "error" ? "var(--error-color, #ef4444)" : type === "warning" ? "var(--warning-color, #f59e0b)" : "var(--primary-color, #3b82f6)"};
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

// Initialize CSV Exporter
window.csvExporter = new CSVExporter();

// Global functions for CSV export
function exportAnalyticsData(type) {
    window.csvExporter.exportResponsesByType(type);
}

function exportResponsesCSV() {
    window.csvExporter.exportAllResponses();
}

function exportFilteredCSV(tableId = "responsesTable") {
    window.csvExporter.exportFilteredResponses(tableId);
}

function exportGlobalCSV() {
    window.csvExporter.exportGlobalSummary();
}

function exportMonthlyTrendsCSV() {
    window.csvExporter.exportMonthlyTrends();
}

// Add export buttons to existing functions
function exportCrewResponsesCSV() {
    window.csvExporter.exportResponsesByType("crew");
}

function exportVolunteerResponsesCSV() {
    window.csvExporter.exportResponsesByType("volunteer");
}

function exportParticipantResponsesCSV() {
    window.csvExporter.exportResponsesByType("participant");
}