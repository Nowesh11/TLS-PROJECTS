/**
 * Detail Page API Integration
 * Handles loading and displaying detailed information for Projects, Activities, and Initiatives
 */

class DetailPage {
    constructor() {
        this.baseURL = "http://localhost:8080/api";
        this.itemType = null; // 'project', 'activity', or 'initiative'
        this.itemId = null;
        this.itemData = null;
        this.joinFormConfig = null;
    }

    /**
     * Initialize the detail page
     */
    async init() {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        this.itemType = urlParams.get("type"); // project, activity, initiative
        this.itemId = urlParams.get("id");

        if (!this.itemType || !this.itemId) {
            this.showError("Invalid URL parameters");
            return;
        }

        // Load item data
        await this.loadItemData();
        
        // Initialize recruitment system
        this.initializeRecruitmentSystem();
        
        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Load item data from API
     */
    async loadItemData() {
        try {
            this.showLoading();
            
            let endpoint;
            switch (this.itemType) {
                case "project":
                    endpoint = `/api/projects/${this.itemId}`;
                    break;
                case "activity":
                    endpoint = `/api/activities/${this.itemId}`;
                    break;
                case "initiative":
                    endpoint = `/api/initiatives/${this.itemId}`;
                    break;
                default:
                    throw new Error("Invalid item type");
            }

            const response = await apiCall(endpoint);
            this.itemData = response.data || response;
            
            // Load join form configuration if available
            if (this.itemData.joinFormConfig) {
                this.joinFormConfig = this.itemData.joinFormConfig;
            }
            
            this.renderItemData();
            
        } catch (error) {
            console.error("Error loading item data:", error);
            this.showError("Failed to load item details. Please try again.");
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        document.getElementById("item-title").textContent = "Loading...";
        document.getElementById("item-description").textContent = "Loading item details...";
    }

    /**
     * Show error message
     */
    showError(message) {
        document.getElementById("item-title").textContent = "Error";
        document.getElementById("item-description").textContent = message;
        
        // Hide sections that require data
        const sections = ["image-gallery", "progress-section"];
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = "none";
        });
    }

    /**
     * Render item data on the page
     */
    renderItemData() {
        if (!this.itemData) return;

        // Update page title
        document.getElementById("page-title").textContent = `${this.itemData.title} - Tamil Language Society`;
        document.title = `${this.itemData.title} - Tamil Language Society`;

        // Update hero section
        document.getElementById("item-title").textContent = this.itemData.title;
        
        if (this.itemData.titleTamil) {
            document.getElementById("item-title-tamil").textContent = this.itemData.titleTamil;
            document.getElementById("item-title-tamil").style.display = "block";
        } else {
            document.getElementById("item-title-tamil").style.display = "none";
        }
        
        document.getElementById("item-description").textContent = this.itemData.description;

        // Update status badge
        this.updateStatusBadge();
        
        // Update category badge
        this.updateCategoryBadge();
        
        // Update images
        this.updateImageGallery();
        
        // Update content sections
        this.updateGoalsSection();
        this.updateDetailedDescription();
        this.updateAchievements();
        this.updateProjectInfo();
        this.updateProgress();
        
        // Update recruitment buttons
        this.updateRecruitmentButtons();
    }

    /**
     * Update status badge
     */
    updateStatusBadge() {
        const statusBadge = document.getElementById("status-badge");
        const status = this.itemData.status || "planning";
        
        statusBadge.textContent = status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ");
        statusBadge.className = `status-badge status-${status}`;
    }

    /**
     * Update category badge
     */
    updateCategoryBadge() {
        const categoryText = document.getElementById("category-text");
        const category = this.itemData.category || "other";
        
        categoryText.textContent = category.charAt(0).toUpperCase() + category.slice(1).replace("-", " ");
    }

    /**
     * Update image gallery
     */
    updateImageGallery() {
        const mainImg = document.getElementById("main-img");
        const thumbnailContainer = document.getElementById("thumbnail-images");
        
        const images = this.itemData.images || [];
        
        if (images.length > 0) {
            // Set main image
            const primaryImage = images.find(img => img.isPrimary) || images[0];
            mainImg.src = primaryImage.url;
            mainImg.alt = this.itemData.title;
            
            // Set thumbnails
            if (images.length > 1) {
                thumbnailContainer.innerHTML = images.slice(0, 3).map((img, index) => `
                    <div class="thumbnail" onclick="changeMainImage('${img.url}')">
                        <img src="${img.url}" alt="${this.itemData.title} - Image ${index + 1}">
                    </div>
                `).join("");
            } else {
                thumbnailContainer.style.display = "none";
                document.querySelector(".detail-image-gallery").style.gridTemplateColumns = "1fr";
            }
        } else {
            // No images available
            document.getElementById("image-gallery").style.display = "none";
        }
    }

    /**
     * Update goals section
     */
    updateGoalsSection() {
        const goalsContent = document.getElementById("goals-content");
        const currentLang = localStorage.getItem("preferred_language") || "en";
        
        if (this.itemData.goals && this.itemData.goals.length > 0) {
            goalsContent.innerHTML = `
                <ul style="list-style: none; padding: 0;">
                    ${this.itemData.goals.map(goal => `
                        <li style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; padding: 1rem; background: var(--gray-50); border-radius: 0.5rem; border-left: 4px solid var(--primary-blue);">
                            <i class="fas fa-bullseye" style="color: var(--primary-blue); margin-top: 0.25rem;"></i>
                            <span style="line-height: 1.6;">${goal}</span>
                        </li>
                    `).join("")}
                </ul>
            `;
        } else if (this.itemData.goalsTamil && this.itemData.goalsTamil.length > 0 && currentLang === "ta") {
            goalsContent.innerHTML = `
                <ul style="list-style: none; padding: 0;">
                    ${this.itemData.goalsTamil.map(goal => `
                        <li style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; padding: 1rem; background: var(--gray-50); border-radius: 0.5rem; border-left: 4px solid var(--primary-blue);">
                            <i class="fas fa-bullseye" style="color: var(--primary-blue); margin-top: 0.25rem;"></i>
                            <span style="line-height: 1.6; font-family: 'Noto Sans Tamil', sans-serif;">${goal}</span>
                        </li>
                    `).join("")}
                </ul>
            `;
        } else if (this.itemData.expectedOutcomes && this.itemData.expectedOutcomes.length > 0) {
            goalsContent.innerHTML = `
                <ul style="list-style: none; padding: 0;">
                    ${this.itemData.expectedOutcomes.map(outcome => `
                        <li style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; padding: 1rem; background: var(--gray-50); border-radius: 0.5rem; border-left: 4px solid var(--primary-blue);">
                            <i class="fas fa-target" style="color: var(--primary-blue); margin-top: 0.25rem;"></i>
                            <span style="line-height: 1.6;">${outcome}</span>
                        </li>
                    `).join("")}
                </ul>
            `;
        } else {
            goalsContent.innerHTML = `
                <p style="color: var(--gray-600); font-style: italic;">Goals and objectives will be updated soon.</p>
            `;
        }
    }

    /**
     * Update detailed description
     */
    updateDetailedDescription() {
        const detailedDesc = document.getElementById("detailed-description");
        const currentLang = localStorage.getItem("preferred_language") || "en";
        
        let content = "";
        
        // Show content based on language preference
        if (currentLang === "ta" && this.itemData.descriptionTamil) {
            content += `
                <div style="margin-bottom: 2rem; padding: 1.5rem; background: var(--accent-gold)10; border-radius: 0.5rem; border-left: 4px solid var(--accent-gold);">
                    <p style="font-family: 'Noto Sans Tamil', sans-serif; line-height: 1.8; font-size: 1.1rem; color: var(--gray-700);">${this.itemData.descriptionTamil}</p>
                </div>
            `;
            // Also show English version as secondary
            if (this.itemData.description) {
                content += `
                    <div style="margin-bottom: 2rem; padding: 1.5rem; background: var(--gray-50); border-radius: 0.5rem; border-left: 4px solid var(--primary-blue); opacity: 0.8;">
                        <h4 style="color: var(--primary-blue); margin-bottom: 1rem; font-size: 0.9rem;">English Description</h4>
                        <p style="line-height: 1.8; font-size: 1rem; color: var(--gray-600);">${this.itemData.description}</p>
                    </div>
                `;
            }
        } else {
            // English first, Tamil as secondary
            content += `<p style="line-height: 1.8; font-size: 1.1rem; color: var(--gray-700);">${this.itemData.description}</p>`;
            
            if (this.itemData.descriptionTamil) {
                content += `
                    <div style="margin-top: 2rem; padding: 1.5rem; background: var(--accent-gold)10; border-radius: 0.5rem; border-left: 4px solid var(--accent-gold);">
                        <h4 style="color: var(--accent-gold); margin-bottom: 1rem; font-family: 'Noto Sans Tamil', sans-serif;">தமிழில் விளக்கம்</h4>
                        <p style="font-family: 'Noto Sans Tamil', sans-serif; line-height: 1.8; font-size: 1.1rem; color: var(--gray-700);">${this.itemData.descriptionTamil}</p>
                    </div>
                `;
            }
        }
        
        if (this.itemData.requirements && this.itemData.requirements.length > 0) {
            content += `
                <div style="margin-top: 2rem;">
                    <h4 style="color: var(--primary-blue); margin-bottom: 1rem;">Requirements</h4>
                    <ul style="color: var(--gray-700); line-height: 1.6;">
                        ${this.itemData.requirements.map(req => `<li style="margin-bottom: 0.5rem;">${req}</li>`).join("")}
                    </ul>
                </div>
            `;
        }
        
        if (this.itemData.benefits && this.itemData.benefits.length > 0) {
            content += `
                <div style="margin-top: 2rem;">
                    <h4 style="color: var(--success-color); margin-bottom: 1rem;">Benefits</h4>
                    <ul style="color: var(--gray-700); line-height: 1.6;">
                        ${this.itemData.benefits.map(benefit => `<li style="margin-bottom: 0.5rem;">${benefit}</li>`).join("")}
                    </ul>
                </div>
            `;
        }
        
        detailedDesc.innerHTML = content;
    }

    /**
     * Update achievements section
     */
    updateAchievements() {
        const achievementsContent = document.getElementById("achievements-content");
        
        if (this.itemData.milestones && this.itemData.milestones.length > 0) {
            achievementsContent.innerHTML = this.itemData.milestones.map(milestone => `
                <div class="achievement-item">
                    <div class="achievement-icon">
                        <i class="fas fa-${milestone.completed ? "check" : "clock"}"></i>
                    </div>
                    <div>
                        <h5 style="color: var(--gray-900); margin-bottom: 0.5rem;">${milestone.title}</h5>
                        <p style="color: var(--gray-600); margin-bottom: 0.5rem; font-size: 0.9rem;">${milestone.description}</p>
                        ${milestone.targetDate ? `<p style="color: var(--gray-500); font-size: 0.8rem;"><i class="fas fa-calendar"></i> Target: ${new Date(milestone.targetDate).toLocaleDateString()}</p>` : ""}
                        ${milestone.completedDate ? `<p style="color: var(--success-color); font-size: 0.8rem;"><i class="fas fa-check-circle"></i> Completed: ${new Date(milestone.completedDate).toLocaleDateString()}</p>` : ""}
                    </div>
                </div>
            `).join("");
        } else {
            // Generate some default achievements based on project data
            const defaultAchievements = [];
            
            if (this.itemData.status === "completed") {
                defaultAchievements.push({
                    icon: "trophy",
                    title: "Project Completed Successfully",
                    description: "This project has been completed and achieved its objectives."
                });
            }
            
            if (this.itemData.progress > 50) {
                defaultAchievements.push({
                    icon: "chart-line",
                    title: "Significant Progress Made",
                    description: `Project is ${this.itemData.progress}% complete with major milestones achieved.`
                });
            }
            
            if (this.itemData.teamMembers && this.itemData.teamMembers.length > 0) {
                defaultAchievements.push({
                    icon: "users",
                    title: "Strong Team Collaboration",
                    description: `${this.itemData.teamMembers.length} dedicated team members working together.`
                });
            }
            
            if (defaultAchievements.length > 0) {
                achievementsContent.innerHTML = defaultAchievements.map(achievement => `
                    <div class="achievement-item">
                        <div class="achievement-icon">
                            <i class="fas fa-${achievement.icon}"></i>
                        </div>
                        <div>
                            <h5 style="color: var(--gray-900); margin-bottom: 0.5rem;">${achievement.title}</h5>
                            <p style="color: var(--gray-600); font-size: 0.9rem;">${achievement.description}</p>
                        </div>
                    </div>
                `).join("");
            } else {
                achievementsContent.innerHTML = `
                    <p style="color: var(--gray-600); font-style: italic;">Achievements and milestones will be updated as the project progresses.</p>
                `;
            }
        }
    }

    /**
     * Update project information sidebar
     */
    updateProjectInfo() {
        const projectInfo = document.getElementById("project-info");
        
        let infoHTML = "";
        
        // Handle different item types
        if (this.itemType === "activity") {
            infoHTML += this.getActivityInfo();
        } else if (this.itemType === "initiative") {
            infoHTML += this.getInitiativeInfo();
        } else {
            infoHTML += this.getProjectInfo();
        }
        
        projectInfo.innerHTML = infoHTML;
    }

    /**
     * Get project-specific information
     */
    getProjectInfo() {
        let infoHTML = "";
        
        if (this.itemData.startDate) {
            infoHTML += `
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem;">
                    <i class="fas fa-calendar-start" style="color: var(--primary-blue);"></i>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em;">Start Date</div>
                        <div style="font-weight: 600; color: var(--gray-900);">${new Date(this.itemData.startDate).toLocaleDateString()}</div>
                    </div>
                </div>
            `;
        }
        
        if (this.itemData.endDate) {
            infoHTML += `
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem;">
                    <i class="fas fa-calendar-check" style="color: var(--success-color);"></i>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em;">End Date</div>
                        <div style="font-weight: 600; color: var(--gray-900);">${new Date(this.itemData.endDate).toLocaleDateString()}</div>
                    </div>
                </div>
            `;
        }
        
        if (this.itemData.budget && this.itemData.budget.total) {
            infoHTML += `
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem;">
                    <i class="fas fa-money-bill-wave" style="color: var(--accent-gold);"></i>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em;">Budget</div>
                        <div style="font-weight: 600; color: var(--gray-900);">RM ${this.itemData.budget.total.toLocaleString()}</div>
                        ${this.itemData.budget.spent ? `<div style="font-size: 0.8rem; color: var(--gray-600);">Spent: RM ${this.itemData.budget.spent.toLocaleString()}</div>` : ""}
                    </div>
                </div>
            `;
        }
        
        if (this.itemData.location) {
            infoHTML += `
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem;">
                    <i class="fas fa-map-marker-alt" style="color: var(--error-color);"></i>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em;">Location</div>
                        <div style="font-weight: 600; color: var(--gray-900);">${this.itemData.location}</div>
                    </div>
                </div>
            `;
        }
        
        if (this.itemData.projectManager) {
            infoHTML += `
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem;">
                    <i class="fas fa-user-tie" style="color: var(--purple-color);"></i>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em;">Project Manager</div>
                        <div style="font-weight: 600; color: var(--gray-900);">${this.itemData.projectManager.name || "Admin"}</div>
                    </div>
                </div>
            `;
        }
        
        return infoHTML || "<p style=\"color: var(--gray-600); font-style: italic;\">Project information will be updated soon.</p>";
    }

    /**
     * Get activity-specific information
     */
    getActivityInfo() {
        let infoHTML = "";
        
        if (this.itemData.startDate) {
            infoHTML += `
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem;">
                    <i class="fas fa-calendar-start" style="color: var(--primary-blue);"></i>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em;">Start Date</div>
                        <div style="font-weight: 600; color: var(--gray-900);">${new Date(this.itemData.startDate).toLocaleDateString()}</div>
                    </div>
                </div>
            `;
        }
        
        if (this.itemData.endDate) {
            infoHTML += `
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem;">
                    <i class="fas fa-calendar-check" style="color: var(--success-color);"></i>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em;">End Date</div>
                        <div style="font-weight: 600; color: var(--gray-900);">${new Date(this.itemData.endDate).toLocaleDateString()}</div>
                    </div>
                </div>
            `;
        }
        
        if (this.itemData.type) {
            infoHTML += `
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem;">
                    <i class="fas fa-${this.itemData.type === "online" ? "laptop" : this.itemData.type === "offline" ? "map-marker-alt" : "globe"}" style="color: var(--accent-gold);"></i>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em;">Type</div>
                        <div style="font-weight: 600; color: var(--gray-900);">${this.itemData.type.charAt(0).toUpperCase() + this.itemData.type.slice(1)}</div>
                    </div>
                </div>
            `;
        }
        
        if (this.itemData.venue) {
            infoHTML += `
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem;">
                    <i class="fas fa-map-marker-alt" style="color: var(--error-color);"></i>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em;">Venue</div>
                        <div style="font-weight: 600; color: var(--gray-900);">${this.itemData.venue}</div>
                    </div>
                </div>
            `;
        }
        
        if (this.itemData.onlineLink && (this.itemData.type === "online" || this.itemData.type === "hybrid")) {
            infoHTML += `
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem;">
                    <i class="fas fa-link" style="color: var(--primary-blue);"></i>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em;">Online Link</div>
                        <div style="font-weight: 600; color: var(--gray-900);"><a href="${this.itemData.onlineLink}" target="_blank" style="color: var(--primary-blue);">Join Online</a></div>
                    </div>
                </div>
            `;
        }
        
        if (this.itemData.maxParticipants) {
            infoHTML += `
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem;">
                    <i class="fas fa-users" style="color: var(--purple-color);"></i>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em;">Participants</div>
                        <div style="font-weight: 600; color: var(--gray-900);">${this.itemData.currentParticipants || 0} / ${this.itemData.maxParticipants}</div>
                    </div>
                </div>
            `;
        }
        
        if (this.itemData.registrationFee) {
            infoHTML += `
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem;">
                    <i class="fas fa-money-bill-wave" style="color: var(--accent-gold);"></i>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em;">Registration Fee</div>
                        <div style="font-weight: 600; color: var(--gray-900);">RM ${this.itemData.registrationFee}</div>
                    </div>
                </div>
            `;
        }
        
        if (this.itemData.organizer && this.itemData.organizer.name) {
            infoHTML += `
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem;">
                    <i class="fas fa-user-tie" style="color: var(--purple-color);"></i>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em;">Organizer</div>
                        <div style="font-weight: 600; color: var(--gray-900);">${this.itemData.organizer.name}</div>
                        ${this.itemData.organizer.organization ? `<div style="font-size: 0.8rem; color: var(--gray-600);">${this.itemData.organizer.organization}</div>` : ""}
                    </div>
                </div>
            `;
        }
        
        return infoHTML || "<p style=\"color: var(--gray-600); font-style: italic;\">Activity information will be updated soon.</p>";
    }

    /**
     * Get initiative-specific information
     */
    getInitiativeInfo() {
        let infoHTML = "";
        
        if (this.itemData.startDate) {
            infoHTML += `
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem;">
                    <i class="fas fa-calendar-start" style="color: var(--primary-blue);"></i>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em;">Start Date</div>
                        <div style="font-weight: 600; color: var(--gray-900);">${new Date(this.itemData.startDate).toLocaleDateString()}</div>
                    </div>
                </div>
            `;
        }
        
        if (this.itemData.endDate) {
            infoHTML += `
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem;">
                    <i class="fas fa-calendar-check" style="color: var(--success-color);"></i>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em;">End Date</div>
                        <div style="font-weight: 600; color: var(--gray-900);">${new Date(this.itemData.endDate).toLocaleDateString()}</div>
                    </div>
                </div>
            `;
        }
        
        if (this.itemData.scope) {
            infoHTML += `
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem;">
                    <i class="fas fa-${this.getScopeIcon(this.itemData.scope)}" style="color: var(--accent-gold);"></i>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em;">Scope</div>
                        <div style="font-weight: 600; color: var(--gray-900);">${this.itemData.scope.charAt(0).toUpperCase() + this.itemData.scope.slice(1)}</div>
                    </div>
                </div>
            `;
        }
        
        if (this.itemData.budget && this.itemData.budget.total) {
            infoHTML += `
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem;">
                    <i class="fas fa-money-bill-wave" style="color: var(--accent-gold);"></i>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em;">Budget</div>
                        <div style="font-weight: 600; color: var(--gray-900);">RM ${this.itemData.budget.total.toLocaleString()}</div>
                        ${this.itemData.budget.spent ? `<div style="font-size: 0.8rem; color: var(--gray-600);">Spent: RM ${this.itemData.budget.spent.toLocaleString()}</div>` : ""}
                    </div>
                </div>
            `;
        }
        
        if (this.itemData.targetBeneficiaries) {
            infoHTML += `
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem;">
                    <i class="fas fa-users" style="color: var(--purple-color);"></i>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em;">Beneficiaries</div>
                        <div style="font-weight: 600; color: var(--gray-900);">${this.itemData.currentBeneficiaries || 0} / ${this.itemData.targetBeneficiaries}</div>
                    </div>
                </div>
            `;
        }
        
        if (this.itemData.supporters) {
            infoHTML += `
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem;">
                    <i class="fas fa-heart" style="color: var(--error-color);"></i>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em;">Supporters</div>
                        <div style="font-weight: 600; color: var(--gray-900);">${this.itemData.supporters}</div>
                    </div>
                </div>
            `;
        }
        
        if (this.itemData.priority) {
            infoHTML += `
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem;">
                    <i class="fas fa-exclamation-triangle" style="color: ${this.itemData.priority === "high" ? "var(--error-color)" : this.itemData.priority === "medium" ? "var(--accent-gold)" : "var(--success-color)"};"></i>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em;">Priority</div>
                        <div style="font-weight: 600; color: var(--gray-900);">${this.itemData.priority.charAt(0).toUpperCase() + this.itemData.priority.slice(1)}</div>
                    </div>
                </div>
            `;
        }
        
        return infoHTML || "<p style=\"color: var(--gray-600); font-style: italic;\">Initiative information will be updated soon.</p>";
    }

    /**
     * Get scope icon for initiatives
     */
    getScopeIcon(scope) {
        const icons = {
            "local": "map-marker-alt",
            "regional": "map",
            "national": "flag",
            "international": "globe",
            "global": "world"
        };
        return icons[scope] || "lightbulb";
    }

    /**
     * Update progress section
     */
    updateProgress() {
        const progressFill = document.getElementById("progress-fill");
        const progressText = document.getElementById("progress-text");
        
        const progress = this.itemData.progress || 0;
        
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${progress}%`;
        
        // Animate progress bar
        setTimeout(() => {
            progressFill.style.width = `${progress}%`;
        }, 500);
    }

    /**
     * Initialize recruitment system
     */
    initializeRecruitmentSystem() {
        // Initialize recruitment manager if available
        if (window.recruitmentManager && typeof window.recruitmentManager.init === "function") {
            window.recruitmentManager.init(this.itemType, this.itemId, this.itemData);
        } else if (window.RecruitmentManager) {
            // Fallback to creating new instance
            window.recruitmentManager = new window.RecruitmentManager();
            window.recruitmentManager.init(this.itemType, this.itemId, this.itemData);
        }
    }

    /**
     * Update recruitment buttons
     */
    updateRecruitmentButtons() {
        const roles = ["crew", "volunteer", "participant"];
        
        roles.forEach(role => {
            const button = document.getElementById(`${role}-recruitment-btn`);
            if (button) {
                // Update entity ID in button
                button.setAttribute('data-entity-id', this.itemId);
                // Remove existing onclick handler
                button.removeAttribute('onclick');
                
                this.updateRecruitmentButton(button, role);
                this.attachRecruitmentButtonListener(button, role);
            }
        });
    }

    /**
     * Update individual recruitment button
     */
    updateRecruitmentButton(button, role) {
        // Get timeline status if available
        let status = "active"; // Default to active
        let tooltip = "";
        
        if (window.recruitmentTimeline) {
            const timelineStatus = window.recruitmentTimeline.getRecruitmentStatus(
                this.itemType, this.itemId, role
            );
            status = timelineStatus.status;
            
            switch (status) {
                case "inactive":
                    tooltip = `Recruiting starts on ${new Date(timelineStatus.startDate).toLocaleDateString()}`;
                    break;
                case "expired":
                    tooltip = `Recruitment closed on ${new Date(timelineStatus.endDate).toLocaleDateString()}`;
                    break;
                case "full":
                    tooltip = "Maximum applications reached";
                    break;
            }
        }
        
        this.setRecruitmentButtonState(button, role, status, tooltip);
    }

    /**
     * Set recruitment button state
     */
    setRecruitmentButtonState(button, role, state, tooltip = "") {
        // Remove all state classes
        button.classList.remove("active", "inactive", "expired", "full", "disabled");
        
        // Add current state class
        button.classList.add(state);
        
        // Update button content
        const btnContent = button.querySelector(".btn-content");
        const btnStatus = button.querySelector(".btn-status");
        
        if (btnContent) {
            const icon = this.getRoleIcon(role);
            const text = this.getRoleButtonText(role);
            btnContent.innerHTML = `${icon} <span>${text}</span>`;
        }
        
        if (btnStatus) {
            btnStatus.textContent = this.getStatusText(state);
        }
        
        // Set tooltip for inactive/expired states
        if (tooltip) {
            button.setAttribute("title", tooltip);
        } else {
            button.removeAttribute("title");
        }
        
        // Update interaction state
        if (state === "active") {
            button.style.cursor = "pointer";
            button.disabled = false;
        } else {
            button.style.cursor = "not-allowed";
            button.disabled = true;
        }
    }

    /**
     * Attach event listener to recruitment button
     */
    attachRecruitmentButtonListener(button, role) {
        button.addEventListener("click", (e) => {
            e.preventDefault();
            
            if (button.disabled || !button.classList.contains("active")) {
                return;
            }
            
            this.openRecruitmentForm(role);
        });
    }

    /**
     * Open recruitment form for specific role
     * @param {string} role - The role type (crew, volunteer, participant)
     */
    async openRecruitmentForm(role) {
        try {
            // Fetch recruitment forms for this entity and role
            const response = await fetch(`/api/forms?target_type=${this.itemType}&target_id=${this.itemId}&role=${role}`);
            const result = await response.json();
            
            if (result.success && result.data && result.data.length > 0) {
                // Use the first active form for this role
                const form = result.data[0];
                this.displayRecruitmentForm(form, role);
            } else {
                // No forms found, show message or fallback
                this.showNoFormsMessage(role);
            }
        } catch (error) {
            console.error('Error fetching recruitment forms:', error);
            // Fallback to default form on error
            this.openDefaultRecruitmentForm(role);
        }
    }

    /**
     * Display recruitment form from API
     * @param {Object} form - The form data from API
     * @param {string} role - The role type
     */
    displayRecruitmentForm(form, role) {
        const modal = this.createRecruitmentFormModal(form, role);
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    /**
     * Show message when no forms are available
     * @param {string} role - The role type
     */
    showNoFormsMessage(role) {
        const modal = document.createElement('div');
        modal.className = 'recruitment-modal';
        modal.innerHTML = `
            <div class="recruitment-modal-content">
                <div class="recruitment-modal-header">
                    <h3><i class="${this.getRoleIcon(role)}"></i> ${this.getRoleButtonText(role)}</h3>
                    <button class="close-btn" onclick="this.closest('.recruitment-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="recruitment-modal-body">
                    <div class="no-forms-message">
                        <i class="fas fa-info-circle"></i>
                        <h4>No Active Recruitment</h4>
                        <p>There are currently no active recruitment forms for ${role} positions in this ${this.itemType}.</p>
                        <p>Please check back later or contact us directly for more information.</p>
                    </div>
                </div>
                <div class="recruitment-modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.recruitment-modal').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
    }

    /**
     * Create recruitment form modal from API data
     * @param {Object} form - The form data
     * @param {string} role - The role type
     */
    createRecruitmentFormModal(form, role) {
        const modal = document.createElement('div');
        modal.className = 'recruitment-modal';
        
        // Generate form fields HTML
        const fieldsHTML = form.fields.map(field => {
            return this.generateFormFieldHTML(field);
        }).join('');
        
        modal.innerHTML = `
            <div class="recruitment-modal-content">
                <div class="recruitment-modal-header">
                    <h3><i class="${this.getRoleIcon(role)}"></i> ${form.title}</h3>
                    <button class="close-btn" onclick="this.closest('.recruitment-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="recruitment-modal-body">
                    <form id="recruitment-form-${form._id}" class="recruitment-form">
                        <div class="form-field">
                            <label for="user_name">Full Name *</label>
                            <input type="text" id="user_name" name="user_name" required placeholder="Enter your full name">
                        </div>
                        <div class="form-field">
                            <label for="user_email">Email Address *</label>
                            <input type="email" id="user_email" name="user_email" required placeholder="Enter your email address">
                        </div>
                        <div class="form-field">
                            <label for="user_phone">Phone Number *</label>
                            <input type="tel" id="user_phone" name="user_phone" required placeholder="Enter your phone number">
                        </div>
                        ${form.description ? `<div class="form-description">${form.description}</div>` : ''}
                        ${fieldsHTML}
                    </form>
                </div>
                <div class="recruitment-modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.recruitment-modal').remove()">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-primary" onclick="detailPage.submitRecruitmentForm('${form._id}', this)">
                        <i class="fas fa-paper-plane"></i> Submit Application
                    </button>
                </div>
            </div>
        `;
        
        // Setup file upload handlers after modal is created
        setTimeout(() => {
            this.setupFileUploadHandlers(modal);
        }, 100);
        
        return modal;
    }

    /**
     * Generate HTML for form field
     * @param {Object} field - The field data
     */
    generateFormFieldHTML(field) {
        const required = field.required ? 'required' : '';
        const requiredMark = field.required ? '<span class="required">*</span>' : '';
        const ariaRequired = field.required ? 'aria-required="true"' : '';
        const describedBy = field.description ? `aria-describedby="desc-${field._id}"` : '';
        
        switch (field.type) {
            case 'text':
            case 'email':
            case 'tel':
            case 'url':
                const autocomplete = this.getAutocompleteAttribute(field.type, field.name);
                const minLength = field.minlength ? `minlength="${field.minlength}"` : '';
                const maxLength = field.maxlength ? `maxlength="${field.maxlength}"` : '';
                return `
                    <div class="form-group">
                        <label for="field-${field._id}">${field.label}${requiredMark}</label>
                        <input type="${field.type}" id="field-${field._id}" name="${field.name}" 
                               placeholder="${field.placeholder || ''}" ${required} ${ariaRequired} ${describedBy}
                               class="form-control" ${autocomplete} ${minLength} ${maxLength}>
                        ${field.description ? `<small id="desc-${field._id}" class="form-text">${field.description}</small>` : ''}
                    </div>
                `;
            
            case 'textarea':
                const textareaMinLength = field.minlength ? `minlength="${field.minlength}"` : '';
                const textareaMaxLength = field.maxlength ? `maxlength="${field.maxlength}"` : '';
                return `
                    <div class="form-group">
                        <label for="field-${field._id}">${field.label}${requiredMark}</label>
                        <textarea id="field-${field._id}" name="${field.name}" 
                                  placeholder="${field.placeholder || ''}" ${required} ${ariaRequired} ${describedBy}
                                  class="form-control" rows="4" ${textareaMinLength} ${textareaMaxLength}></textarea>
                        ${field.description ? `<small id="desc-${field._id}" class="form-text">${field.description}</small>` : ''}
                    </div>
                `;
            
            case 'select':
                const options = field.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
                return `
                    <div class="form-group">
                        <label for="field-${field._id}">${field.label}${requiredMark}</label>
                        <select id="field-${field._id}" name="${field.name}" ${required} ${ariaRequired} ${describedBy} class="form-control">
                            <option value="">Select an option...</option>
                            ${options}
                        </select>
                        ${field.description ? `<small id="desc-${field._id}" class="form-text">${field.description}</small>` : ''}
                    </div>
                `;
            
            case 'radio':
                const radioOptions = field.options.map((opt, index) => `
                    <div class="form-check">
                        <input type="radio" id="field-${field._id}-${index}" name="${field.name}" 
                               value="${opt.value}" ${required} ${ariaRequired} class="form-check-input">
                        <label for="field-${field._id}-${index}" class="form-check-label">${opt.label}</label>
                    </div>
                `).join('');
                return `
                    <div class="form-group" role="radiogroup" ${describedBy}>
                        <fieldset>
                            <legend class="form-label">${field.label}${requiredMark}</legend>
                            ${radioOptions}
                        </fieldset>
                        ${field.description ? `<small id="desc-${field._id}" class="form-text">${field.description}</small>` : ''}
                    </div>
                `;
            
            case 'checkbox':
                const checkboxOptions = field.options.map((opt, index) => `
                    <div class="form-check">
                        <input type="checkbox" id="field-${field._id}-${index}" name="${field.name}[]" 
                               value="${opt.value}" class="form-check-input">
                        <label for="field-${field._id}-${index}" class="form-check-label">${opt.label}</label>
                    </div>
                `).join('');
                return `
                    <div class="form-group" role="group" ${describedBy}>
                        <fieldset>
                            <legend class="form-label">${field.label}${requiredMark}</legend>
                            ${checkboxOptions}
                        </fieldset>
                        ${field.description ? `<small id="desc-${field._id}" class="form-text">${field.description}</small>` : ''}
                    </div>
                `;
            
            case 'file':
                const acceptTypes = field.accept || '';
                const fileTooltip = this.generateFileTooltip(acceptTypes);
                return `
                    <div class="form-group">
                        <label for="field-${field._id}">${field.label}${requiredMark}
                            ${fileTooltip ? `<span class="file-tooltip" title="${fileTooltip}"><i class="fas fa-info-circle"></i></span>` : ''}
                        </label>
                        <input type="file" id="field-${field._id}" name="${field._id}" 
                               ${required} ${ariaRequired} ${describedBy} class="form-control file-input" accept="${acceptTypes}">
                        ${field.description ? `<small id="desc-${field._id}" class="form-text">${field.description}</small>` : ''}
                        <div class="file-preview" id="preview-${field._id}" style="display: none;" aria-live="polite"></div>
                    </div>
                `;
            
            case 'date':
                return `
                    <div class="form-group">
                        <label for="field-${field._id}">${field.label}${requiredMark}</label>
                        <input type="date" id="field-${field._id}" name="${field.name}" 
                               ${required} ${ariaRequired} ${describedBy} class="form-control">
                        ${field.description ? `<small id="desc-${field._id}" class="form-text">${field.description}</small>` : ''}
                    </div>
                `;
            
            case 'number':
                return `
                    <div class="form-group">
                        <label for="field-${field._id}">${field.label}${requiredMark}</label>
                        <input type="number" id="field-${field._id}" name="${field.name}" 
                               placeholder="${field.placeholder || ''}" ${required} ${ariaRequired} ${describedBy}
                               class="form-control" min="${field.min || ''}" max="${field.max || ''}">
                        ${field.description ? `<small id="desc-${field._id}" class="form-text">${field.description}</small>` : ''}
                    </div>
                `;
            
            default:
                return `
                    <div class="form-group">
                        <label for="field-${field._id}">${field.label}${requiredMark}</label>
                        <input type="text" id="field-${field._id}" name="${field.name}" 
                               placeholder="${field.placeholder || ''}" ${required} ${ariaRequired} ${describedBy} class="form-control">
                        ${field.description ? `<small id="desc-${field._id}" class="form-text">${field.description}</small>` : ''}
                    </div>
                `;
        }
    }

    /**
     * Get autocomplete attribute for input fields
     * @param {string} type - Field type
     * @param {string} name - Field name
     * @returns {string} Autocomplete attribute
     */
    getAutocompleteAttribute(type, name) {
        const autocompleteMap = {
            'email': 'email',
            'tel': 'tel',
            'url': 'url'
        };
        
        // Check field name for common patterns
        const namePatterns = {
            'name': 'name',
            'first_name': 'given-name',
            'last_name': 'family-name',
            'phone': 'tel',
            'mobile': 'tel',
            'email': 'email',
            'website': 'url',
            'organization': 'organization',
            'company': 'organization'
        };
        
        const lowerName = name.toLowerCase();
        for (const [pattern, autocomplete] of Object.entries(namePatterns)) {
            if (lowerName.includes(pattern)) {
                return `autocomplete="${autocomplete}"`;
            }
        }
        
        return autocompleteMap[type] ? `autocomplete="${autocompleteMap[type]}"` : '';
    }

    /**
     * Generate tooltip text for file inputs
     * @param {string} acceptTypes - Accepted file types
     * @returns {string} Tooltip text
     */
    generateFileTooltip(acceptTypes) {
        if (!acceptTypes) return 'Maximum file size: 5MB';
        
        const types = acceptTypes.split(',').map(type => type.trim());
        const readableTypes = types.map(type => {
            if (type.startsWith('image/')) return 'Images';
            if (type.startsWith('application/pdf')) return 'PDF';
            if (type.startsWith('application/msword') || type.includes('wordprocessingml')) return 'Word documents';
            if (type.startsWith('text/')) return 'Text files';
            return type;
        });
        
        const uniqueTypes = [...new Set(readableTypes)];
        return `Accepted: ${uniqueTypes.join(', ')} | Max size: 5MB`;
    }

    /**
     * Validate form fields
     * @param {HTMLElement} form - The form element
     * @returns {Object} Validation result
     */
    validateForm(form) {
        const errors = [];
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            const fieldErrors = this.validateField(input);
            if (fieldErrors.length > 0) {
                errors.push({
                    field: input.name || input.id,
                    element: input,
                    messages: fieldErrors
                });
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * Validate individual field
     * @param {HTMLElement} field - The field element
     * @returns {Array} Array of error messages
     */
    validateField(field) {
        const errors = [];
        const value = field.value.trim();
        const fieldType = field.type;
        const isRequired = field.hasAttribute('required');
        
        // Required field validation
        if (isRequired && !value) {
            errors.push(`${this.getFieldLabel(field)} is required.`);
            return errors; // Don't validate further if empty and required
        }
        
        // Skip validation if field is empty and not required
        if (!value && !isRequired) {
            return errors;
        }
        
        // Email validation
        if (fieldType === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                errors.push('Please enter a valid email address.');
            }
        }
        
        // Phone validation
        if (fieldType === 'tel' || field.name.toLowerCase().includes('phone')) {
            const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/;
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                errors.push('Please enter a valid phone number.');
            }
        }
        
        // Number validation
        if (fieldType === 'number') {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
                errors.push('Please enter a valid number.');
            } else {
                const min = field.getAttribute('min');
                const max = field.getAttribute('max');
                if (min !== null && numValue < parseFloat(min)) {
                    errors.push(`Value must be at least ${min}.`);
                }
                if (max !== null && numValue > parseFloat(max)) {
                    errors.push(`Value must not exceed ${max}.`);
                }
            }
        }
        
        // File validation
        if (fieldType === 'file' && field.files.length > 0) {
            const file = field.files[0];
            const maxSize = 10 * 1024 * 1024; // 10MB
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 
                                'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                'text/plain', 'text/csv'];
            
            if (file.size > maxSize) {
                errors.push('File size must not exceed 10MB.');
            }
            
            if (!allowedTypes.includes(file.type)) {
                errors.push('File type not supported. Please upload images, PDF, Word documents, or text files.');
            }
        }
        
        // Text length validation
        if (fieldType === 'text' || fieldType === 'textarea') {
            const minLength = field.getAttribute('minlength');
            const maxLength = field.getAttribute('maxlength');
            
            if (minLength && value.length < parseInt(minLength)) {
                errors.push(`Minimum ${minLength} characters required.`);
            }
            if (maxLength && value.length > parseInt(maxLength)) {
                errors.push(`Maximum ${maxLength} characters allowed.`);
            }
        }
        
        return errors;
    }
    
    /**
     * Get field label for error messages
     * @param {HTMLElement} field - The field element
     * @returns {string} Field label
     */
    getFieldLabel(field) {
        const label = field.closest('.form-group')?.querySelector('label');
        return label ? label.textContent.replace('*', '').trim() : 'This field';
    }
    
    /**
     * Clear validation errors from form
     * @param {HTMLElement} form - The form element
     */
    clearValidationErrors(form) {
        // Remove error classes and messages
        form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        form.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
        form.querySelectorAll('.form-group.has-error').forEach(el => el.classList.remove('has-error'));
    }
    
    /**
     * Display validation errors on form
     * @param {HTMLElement} form - The form element
     * @param {Array} errors - Array of error objects
     */
    displayValidationErrors(form, errors) {
        errors.forEach(error => {
            const field = error.element;
            const formGroup = field.closest('.form-group');
            
            // Add error class to field
            field.classList.add('is-invalid');
            formGroup.classList.add('has-error');
            
            // Create error message element
            const errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback';
            errorDiv.innerHTML = error.messages.join('<br>');
            
            // Insert error message after the field
            field.parentNode.insertBefore(errorDiv, field.nextSibling);
        });
        
        // Focus on first error field
        if (errors.length > 0) {
            errors[0].element.focus();
        }
    }
    
    /**
     * Setup file upload handlers for the modal
     * @param {HTMLElement} modal - The modal element
     */
    setupFileUploadHandlers(modal) {
        const fileInputs = modal.querySelectorAll('.file-input');
        
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                const previewDiv = modal.querySelector(`#preview-${input.name}`);
                
                if (file && previewDiv) {
                    previewDiv.style.display = 'block';
                    
                    if (file.type.startsWith('image/')) {
                        // Show image preview
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            previewDiv.innerHTML = `
                                <div class="file-preview-item">
                                    <img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 150px; border-radius: 4px;">
                                    <div class="file-info">
                                        <span class="file-name">${file.name}</span>
                                        <span class="file-size">(${(file.size / 1024).toFixed(1)} KB)</span>
                                    </div>
                                    <button type="button" class="remove-file" onclick="this.closest('.form-group').querySelector('input[type=file]').value=''; this.closest('.file-preview').style.display='none';">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            `;
                        };
                        reader.readAsDataURL(file);
                    } else {
                        // Show file info for non-images
                        previewDiv.innerHTML = `
                            <div class="file-preview-item">
                                <div class="file-icon">
                                    <i class="fas fa-file"></i>
                                </div>
                                <div class="file-info">
                                    <span class="file-name">${file.name}</span>
                                    <span class="file-size">(${(file.size / 1024).toFixed(1)} KB)</span>
                                </div>
                                <button type="button" class="remove-file" onclick="this.closest('.form-group').querySelector('input[type=file]').value=''; this.closest('.file-preview').style.display='none';">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `;
                    }
                } else if (previewDiv) {
                    previewDiv.style.display = 'none';
                }
            });
        });
        
        // Setup real-time validation for all form fields
        this.setupRealTimeValidation(modal);
    }

    /**
     * Setup real-time validation for form fields
     * @param {HTMLElement} modal - The modal element containing the form
     */
    setupRealTimeValidation(modal) {
        const form = modal.querySelector('form');
        if (!form) return;
        
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            // Validate on blur (when user leaves field)
            input.addEventListener('blur', () => {
                this.validateFieldRealTime(input);
            });
            
            // Clear validation on focus (when user starts typing)
            input.addEventListener('focus', () => {
                this.clearFieldValidation(input);
            });
            
            // For certain fields, validate on input (as user types)
            if (input.type === 'email' || input.type === 'tel' || input.type === 'url') {
                input.addEventListener('input', () => {
                    // Debounce validation to avoid excessive calls
                    clearTimeout(input.validationTimeout);
                    input.validationTimeout = setTimeout(() => {
                        this.validateFieldRealTime(input);
                    }, 500);
                });
            }
        });
    }

    /**
     * Validate a single field in real-time
     * @param {HTMLElement} field - The field to validate
     */
    validateFieldRealTime(field) {
        const value = field.value.trim();
        const fieldName = field.name || field.id;
        const fieldType = field.type;
        const isRequired = field.hasAttribute('required');
        
        // Clear previous validation state
        this.clearFieldValidation(field);
        
        // Skip validation if field is empty and not required
        if (!value && !isRequired) {
            return;
        }
        
        let isValid = true;
        let errorMessage = '';
        
        // Required field validation
        if (isRequired && !value) {
            isValid = false;
            errorMessage = `${this.getFieldLabel(field)} is required`;
        }
        // Email validation
        else if (fieldType === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }
        // Phone validation
        else if (fieldType === 'tel' && value) {
            const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{7,}$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
        }
        // URL validation
        else if (fieldType === 'url' && value) {
            try {
                new URL(value);
            } catch {
                isValid = false;
                errorMessage = 'Please enter a valid URL';
            }
        }
        // Number validation
        else if (fieldType === 'number' && value) {
            const min = field.getAttribute('min');
            const max = field.getAttribute('max');
            const numValue = parseFloat(value);
            
            if (isNaN(numValue)) {
                isValid = false;
                errorMessage = 'Please enter a valid number';
            } else if (min && numValue < parseFloat(min)) {
                isValid = false;
                errorMessage = `Value must be at least ${min}`;
            } else if (max && numValue > parseFloat(max)) {
                isValid = false;
                errorMessage = `Value must be no more than ${max}`;
            }
        }
        // Text length validation
        else if ((fieldType === 'text' || fieldType === 'textarea') && value) {
            const minLength = field.getAttribute('minlength');
            const maxLength = field.getAttribute('maxlength');
            
            if (minLength && value.length < parseInt(minLength)) {
                isValid = false;
                errorMessage = `Must be at least ${minLength} characters`;
            } else if (maxLength && value.length > parseInt(maxLength)) {
                isValid = false;
                errorMessage = `Must be no more than ${maxLength} characters`;
            }
        }
        // File validation
        else if (fieldType === 'file' && field.files.length > 0) {
            const file = field.files[0];
            const maxSize = 5 * 1024 * 1024; // 5MB
            const acceptedTypes = field.getAttribute('accept');
            
            if (file.size > maxSize) {
                isValid = false;
                errorMessage = 'File size must be less than 5MB';
            } else if (acceptedTypes && !acceptedTypes.split(',').some(type => 
                file.type.match(type.trim().replace('*', '.*'))
            )) {
                isValid = false;
                errorMessage = 'File type not allowed';
            }
        }
        
        // Apply validation state
        if (!isValid) {
            this.displayFieldError(field, errorMessage);
        } else {
            field.classList.add('is-valid');
        }
    }

    /**
     * Clear validation state for a field
     * @param {HTMLElement} field - The field to clear
     */
    clearFieldValidation(field) {
        field.classList.remove('is-invalid', 'is-valid');
        const errorElement = field.parentElement.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    /**
     * Display error for a specific field
     * @param {HTMLElement} field - The field with error
     * @param {string} message - Error message
     */
    displayFieldError(field, message) {
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');
        
        // Remove existing error message
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        field.parentElement.appendChild(errorElement);
    }

    /**
     * Submit recruitment form
     * @param {string} formId - The form ID
     * @param {HTMLElement} buttonElement - The submit button
     */
    async submitRecruitmentForm(formId, buttonElement) {
        const form = document.getElementById(`recruitment-form-${formId}`);
        
        // Clear previous validation errors
        this.clearValidationErrors(form);
        
        // Validate form before submission
        const validationResult = this.validateForm(form);
        if (!validationResult.isValid) {
            this.displayValidationErrors(form, validationResult.errors);
            this.showNotification('Please fix the errors below and try again.', 'error');
            return;
        }
        
        const formData = new FormData(form);
        
        // Add metadata
        formData.append('target_type', this.itemType);
        formData.append('target_id', this.itemId);
        
        // Show loading state
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        buttonElement.disabled = true;
        
        try {
            const response = await fetch(`/api/forms/${formId}/responses`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Show success message
                this.showNotification('Application submitted successfully! We will review your application and get back to you soon.', 'success');
                // Close modal with delay for user to see success message
                setTimeout(() => {
                    form.closest('.recruitment-modal').remove();
                }, 2000);
            } else {
                // Handle server-side validation errors
                if (result.errors && Array.isArray(result.errors)) {
                    this.displayValidationErrors(form, result.errors);
                }
                throw new Error(result.message || 'Failed to submit application');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            
            // Show specific error message if available
            let errorMessage = 'Failed to submit application. Please try again.';
            if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            } else if (error.message.includes('file') || error.message.includes('upload')) {
                errorMessage = 'File upload failed. Please check file size and format.';
            }
            
            this.showNotification(errorMessage, 'error');
            
            // Restore button state
            buttonElement.innerHTML = originalText;
            buttonElement.disabled = false;
        }
    }

    /**
     * Open default recruitment form (fallback)
     * @param {string} role - The role type
     */
    openDefaultRecruitmentForm(role) {
        const modal = this.createDefaultFormModal(role);
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => {
            modal.classList.add("show");
        }, 10);
    }

    /**
     * Create default form modal
     */
    createDefaultFormModal(role) {
        const modal = document.createElement("div");
        modal.className = "recruitment-modal";
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${this.getRoleButtonText(role)} - ${this.itemData.title}</h2>
                    <button class="modal-close" onclick="this.closest('.recruitment-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p class="form-description">Apply to join as a ${role} for this ${this.itemType}.</p>
                    <form class="recruitment-form" id="recruitment-form-${role}">
                        <div class="form-field">
                            <label for="name">Full Name *</label>
                            <input type="text" id="name" name="name" required placeholder="Enter your full name">
                        </div>
                        <div class="form-field">
                            <label for="email">Email Address *</label>
                            <input type="email" id="email" name="email" required placeholder="Enter your email address">
                        </div>
                        <div class="form-field">
                            <label for="phone">Phone Number *</label>
                            <input type="tel" id="phone" name="phone" required placeholder="Enter your phone number">
                        </div>
                        <div class="form-field">
                            <label for="experience">Relevant Experience</label>
                            <textarea id="experience" name="experience" rows="4" placeholder="Tell us about your relevant experience..."></textarea>
                        </div>
                        <div class="form-field">
                            <label for="motivation">Why do you want to join? *</label>
                            <textarea id="motivation" name="motivation" rows="4" required placeholder="Share your motivation for joining..."></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="this.closest('.recruitment-modal').remove()">
                                Cancel
                            </button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-paper-plane"></i>
                                Submit Application
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Add form submission handler
        const form = modal.querySelector(".recruitment-form");
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            this.handleDefaultFormSubmission(form, role, modal);
        });
        
        return modal;
    }

    /**
     * Handle default form submission
     */
    async handleDefaultFormSubmission(form, role, modal) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Add metadata
        data.entityType = this.itemType;
        data.entityId = this.itemId;
        data.entityTitle = this.itemData.title;
        data.role = role;
        data.submissionDate = new Date().toISOString();
        
        try {
            // Show loading state
            const submitBtn = form.querySelector("button[type=\"submit\"]");
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = "<i class=\"fas fa-spinner fa-spin\"></i> Submitting...";
            submitBtn.disabled = true;
            
            // Save to local storage (in real app, this would be an API call)
            const storageKey = `responses_${this.itemType}_${this.itemId}_${role}`;
            const existingResponses = JSON.parse(localStorage.getItem(storageKey) || "[]");
            existingResponses.push(data);
            localStorage.setItem(storageKey, JSON.stringify(existingResponses));
            
            // Show success message
            this.showNotification("Application submitted successfully!", "success");
            
            // Close modal
            setTimeout(() => {
                modal.remove();
            }, 1500);
            
        } catch (error) {
            console.error("Error submitting form:", error);
            this.showNotification("Failed to submit application. Please try again.", "error");
            
            // Reset button
            const submitBtn = form.querySelector("button[type=\"submit\"]");
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    /**
     * Get role icon
     */
    getRoleIcon(role) {
        const icons = {
            crew: "<i class=\"fas fa-users\"></i>",
            volunteer: "<i class=\"fas fa-hands-helping\"></i>",
            participant: "<i class=\"fas fa-user-plus\"></i>"
        };
        return icons[role] || "<i class=\"fas fa-user\"></i>";
    }

    /**
     * Get role button text
     */
    getRoleButtonText(role) {
        const texts = {
            crew: "Join Project",
            volunteer: "Be a Volunteer",
            participant: "Join Us"
        };
        return texts[role] || "Join";
    }

    /**
     * Get status text
     */
    getStatusText(state) {
        const texts = {
            active: "Open for applications",
            inactive: "Not yet open",
            expired: "Applications closed",
            full: "Applications full",
            disabled: "Not available"
        };
        return texts[state] || "";
    }

    /**
     * Show notification
     */
    showNotification(message, type = "info") {
        const notification = document.createElement("div");
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Show with animation
        setTimeout(() => {
            notification.classList.add("show");
        }, 10);
        
        // Auto remove
        setTimeout(() => {
            notification.classList.remove("show");
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Event listeners can be added here if needed
    }
}

// Global functions for UI interactions
function changeMainImage(imageUrl) {
    const mainImg = document.getElementById("main-img");
    if (mainImg) {
        mainImg.src = imageUrl;
    }
}



// Social sharing functions
function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.getElementById("item-title").textContent);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "width=600,height=400");
}

function shareOnTwitter() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.getElementById("item-title").textContent);
    const text = encodeURIComponent(`Check out this amazing project: ${title}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank", "width=600,height=400");
}

function shareOnWhatsApp() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.getElementById("item-title").textContent);
    const text = encodeURIComponent(`Check out this amazing project: ${title} ${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
}

function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        // Show temporary success message
        const btn = event.target.closest(".share-btn");
        const originalText = btn.innerHTML;
        btn.innerHTML = "<i class=\"fas fa-check\"></i> <span>Copied!</span>";
        btn.style.background = "var(--success-color)";
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = "var(--gray-600)";
        }, 2000);
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert("Link copied to clipboard!");
    });
}