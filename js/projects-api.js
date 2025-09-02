/**
 * Projects API Integration
 * Fetches project data from admin API and displays on main website
 * Note: API_BASE_URL and apiCall function are defined in api-integration.js
 */

class ProjectsAPI {
    constructor() {
        this.baseURL = "http://localhost:8080/api";
        this.allProjects = [];
        this.filteredProjects = [];
    }

    /**
     * Fetch all projects from the API
     */
    async fetchProjects() {
        try {
            const result = await apiCall("/api/projects");
            // Extract the data array from the API response
            const projects = result.data || result || [];
            if (!Array.isArray(projects)) {
                console.error("Projects is not an array:", projects);
                return [];
            }
            return this.transformProjectData(projects);
        } catch (error) {
            console.error("Error fetching projects:", error);
            return [];
        }
    }

    /**
     * Transform API project data to match the frontend format
     */
    transformProjectData(projects) {
        const categoryColors = {
            "education": "var(--warning-color, #f59e0b)",
            "cultural-preservation": "var(--success-color, #10b981)",
            "technology": "var(--primary-color, #2563eb)",
            "language-development": "var(--purple-color, #8b5cf6)",
            "community-outreach": "var(--error-color, #ef4444)",
            "research": "var(--cyan-color, #06b6d4)",
            "publishing": "var(--orange-color, #f97316)",
            "events": "var(--green-color, #84cc16)",
            "cultural": "var(--success-color, #10b981)",
            "community": "var(--error-color, #ef4444)",
            "literature": "var(--purple-color, #8b5cf6)",
            "other": "var(--text-secondary, #6b7280)"
        };

        const categoryIcons = {
            "education": "fas fa-graduation-cap",
            "cultural-preservation": "fas fa-archive",
            "technology": "fas fa-laptop-code",
            "language-development": "fas fa-language",
            "community-outreach": "fas fa-users",
            "research": "fas fa-microscope",
            "publishing": "fas fa-book",
            "events": "fas fa-calendar-alt",
            "cultural": "fas fa-archive",
            "community": "fas fa-users",
            "literature": "fas fa-feather-alt",
            "other": "fas fa-project-diagram"
        };

        return projects.map(project => {
            // Convert budget to RM if needed
            let budget = project.budget || { total: 0, spent: 0, currency: "RM" };
            if (budget.currency && budget.currency !== "RM") {
                // Simple conversion rate (in real app, use actual exchange rates)
                const conversionRates = {
                    "USD": 4.5,
                    "EUR": 4.8,
                    "GBP": 5.2,
                    "SGD": 3.3,
                    "INR": 0.054
                };
                const rate = conversionRates[budget.currency] || 1;
                budget = {
                    total: Math.round(budget.total * rate),
                    spent: Math.round(budget.spent * rate),
                    currency: "RM"
                };
            }

            return {
                id: project._id,
                title: project.title,
                tamilTitle: project.titleTamil || project.title,
                description: project.description,
                descriptionTamil: project.descriptionTamil,
                category: project.category,
                status: this.mapStatus(project.status),
                progress: project.progress || this.generateProgress(project.status),
                budget: budget,
                color: categoryColors[project.category] || categoryColors["other"],
                icon: categoryIcons[project.category] || categoryIcons["other"],
                featured: project.featured === "true" || project.featured === true,
                startDate: project.startDate,
                endDate: project.endDate,
                createdAt: project.createdAt,
                image: project.images && project.images.length > 0 ? project.images.find(img => img.isPrimary)?.url || project.images[0]?.url : null
            };
        });
    }

    /**
     * Map project status to display format
     */
    mapStatus(status) {
        const statusMap = {
            "planning": { label: "Planning", color: "var(--warning-color)" },
            "active": { label: "Active", color: "var(--success-color)" },
            "completed": { label: "Completed", color: "var(--primary-blue)" },
            "on-hold": { label: "On Hold", color: "var(--error-color)" }
        };
        return statusMap[status] || statusMap["planning"];
    }

    /**
     * Generate progress percentage based on status
     */
    generateProgress(status) {
        const progressMap = {
            "planning": Math.floor(Math.random() * 30) + 10,
            "active": Math.floor(Math.random() * 40) + 40,
            "completed": 100,
            "on-hold": Math.floor(Math.random() * 60) + 20
        };
        return progressMap[status] || 25;
    }

    /**
     * Display loading state
     */
    showLoading() {
        const grid = document.getElementById("projects-grid");
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <div style="display: inline-block; width: 50px; height: 50px; border: 3px solid var(--border-secondary); border-top: 3px solid var(--border-accent); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p style="margin-top: 1rem; color: var(--gray-600);">Loading projects...</p>
                </div>
            `;
        }
    }

    /**
     * Display error message
     */
    showError(message) {
        const grid = document.getElementById("projects-grid");
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--accent-red); margin-bottom: 1rem;"></i>
                    <p style="color: var(--gray-600); margin-bottom: 1rem;">${message}</p>
                    <button onclick="window.location.reload()" style="background: var(--primary-blue); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer;">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    /**
     * Render projects in the grid
     */
    renderProjects(projects) {
        const grid = document.getElementById("projects-grid");
        if (!grid) return;

        if (projects.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-project-diagram" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                    <p style="color: var(--gray-600);">No projects found matching your criteria.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = projects.map((project, index) => `
            <div class="project-card" data-category="${project.category}" style="animation-delay: ${index * 0.1}s; background: var(--bg-primary); border-radius: 1rem; box-shadow: var(--shadow-md); overflow: hidden; transition: all 0.3s ease; height: fit-content;">
                <div class="project-image" style="height: 150px; ${project.image ? `background: url('${project.image}') center/cover no-repeat, linear-gradient(135deg, ${project.color}, ${project.color}dd);` : `background: linear-gradient(135deg, ${project.color}, ${project.color}dd);`} display: flex; align-items: center; justify-content: center;">
                    ${!project.image ? `<i class="${project.icon}" style="font-size: 3rem; color: white;"></i>` : ""}
                </div>
                <div class="project-content" style="padding: 1.25rem;">
                    <div class="project-category" style="background: ${project.color}20; color: ${project.color}; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.75rem; display: inline-block; margin-bottom: 0.75rem; text-transform: capitalize;">
                        ${project.category.replace("-", " ")}
                    </div>
                    <h3 style="color: var(--gray-900); margin-bottom: 0.5rem; font-size: 1.125rem; line-height: 1.3; font-weight: 600;">${project.title}</h3>
                    ${project.tamilTitle && project.tamilTitle !== project.title ? `<h4 style="color: var(--gray-700); margin-bottom: 0.75rem; font-family: 'Noto Sans Tamil', var(--font-tamil), sans-serif; font-weight: 600; line-height: 1.4; font-size: 1rem;">${project.tamilTitle}</h4>` : ""}
                    <p style="color: var(--gray-600); margin-bottom: 1rem; line-height: 1.5; font-size: 0.9rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${project.description}</p>
                    ${project.budget ? `<div style="background: var(--gray-50); padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 1rem; border-left: 4px solid ${project.color};">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-money-bill-wave" style="color: ${project.color};"></i>
                            <span style="font-size: 0.8rem; color: var(--gray-600);">Budget:</span>
                            <span style="font-weight: 600; color: var(--gray-900);">RM ${parseFloat(project.budget).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>` : ""}
                    <div class="project-meta" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <div class="project-status" style="display: flex; align-items: center; gap: 0.5rem;">
                            <div class="status-indicator" style="width: 8px; height: 8px; background: ${project.status.color}; border-radius: 50%;"></div>
                            <span style="font-size: 0.8rem; color: ${project.status.color}; font-weight: 500;">${project.status.label}</span>
                        </div>
                        <div style="font-size: 0.8rem; color: var(--gray-600);">
                            <i class="fas fa-users" style="margin-right: 0.25rem;"></i>
                            ${project.participants || Math.floor(Math.random() * 200) + 50} participants
                        </div>
                    </div>
                    <div class="project-progress" style="margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <span style="font-size: 0.8rem; color: var(--gray-600);">Progress</span>
                            <span style="font-size: 0.8rem; color: var(--primary-blue); font-weight: 600;">${project.progress}%</span>
                        </div>
                        <div style="background: var(--gray-200); height: 4px; border-radius: 2px; overflow: hidden;">
                            <div style="background: ${project.color}; height: 100%; width: ${project.progress}%; border-radius: 2px; transition: width 0.3s ease;"></div>
                        </div>
                    </div>
                    <button class="btn btn-primary project-details-btn" data-project-id="${project.id}" style="width: 100%; background: ${project.color}; color: white; border: none; padding: 0.75rem; border-radius: 0.5rem; cursor: pointer; font-weight: 500; transition: all 0.3s ease; font-size: 0.9rem;">
                        <i class="fas fa-external-link-alt"></i>
                        View Details
                    </button>
                </div>
            </div>
        `).join("");

        // Add animation classes
        setTimeout(() => {
            document.querySelectorAll(".project-card").forEach(card => {
                card.classList.add("animate-fadeInUp");
            });
        }, 100);
    }

    /**
     * Filter projects by category
     */
    filterProjects(category = "all") {
        let filtered = [...this.allProjects];

        if (category !== "all") {
            filtered = filtered.filter(project => project.category === category);
        }

        this.filteredProjects = filtered;
        this.renderProjects(filtered);
    }

    /**
     * Initialize the projects page
     */
    async initialize() {
        this.showLoading();
        
        try {
            const projects = await this.fetchProjects();
            
            if (projects.length === 0) {
                this.showError("No projects available at the moment.");
                return;
            }

            this.allProjects = projects;
            this.filteredProjects = [...projects];

            // Render projects
            this.renderProjects(projects);

            // Setup event listeners
            this.setupEventListeners();

        } catch (error) {
            console.error("Error initializing projects:", error);
            this.showError("Failed to load projects. Please try again later.");
        }
    }

    /**
     * Setup event listeners for filters and buttons
     */
    setupEventListeners() {
        // Filter buttons
        const filterButtons = document.querySelectorAll(".filter-btn");
        filterButtons.forEach(button => {
            button.addEventListener("click", (e) => {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove("active"));
                
                // Add active class to clicked button
                e.target.classList.add("active");
                
                // Filter projects
                const category = e.target.getAttribute("data-category");
                this.filterProjects(category);
            });
        });

        // Project details buttons
        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("project-details-btn") || e.target.closest(".project-details-btn")) {
                e.preventDefault();
                const button = e.target.classList.contains("project-details-btn") ? e.target : e.target.closest(".project-details-btn");
                const projectId = button.getAttribute("data-project-id");
                
                if (projectId) {
                    // Navigate to detail page
                    window.location.href = `detail.html?type=project&id=${projectId}`;
                }
            }
        });
    }

    /**
     * Show project details modal
     */
    showProjectDetails(projectId) {
        const project = this.allProjects.find(p => p.id === projectId);
        
        if (!project) {
            alert("Project not found!");
            return;
        }

        // Store project data in sessionStorage for detail.html
        sessionStorage.setItem("selectedProject", JSON.stringify(project));
        
        // Navigate to detail.html
        window.location.href = `detail.html?id=${projectId}`;
    }

    /**
     * Update filter buttons to match available categories
     */
    updateFilterButtons() {
        const filterContainer = document.querySelector(".project-filters");
        if (!filterContainer) return;

        // Get unique categories from projects
        const categories = [...new Set(this.allProjects.map(p => p.category))];
        
        // Create filter buttons
        const buttons = [
            { category: "all", label: "All Projects" },
            ...categories.map(cat => ({
                category: cat,
                label: cat.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
            }))
        ];

        filterContainer.innerHTML = buttons.map(btn => `
            <button class="filter-btn ${btn.category === "all" ? "active" : ""}" data-category="${btn.category}">
                ${btn.label}
            </button>
        `).join("");
    }
}

// This file is kept for backward compatibility but the actual API integration
// is now handled by api-integration.js