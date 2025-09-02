/**
 * Recruitment Timeline Management System
 * Handles Active/Inactive/Expired status with automatic button state switching
 * Supports multiple recruitment phases for different roles
 */

class RecruitmentTimeline {
    constructor() {
        this.timelines = new Map(); // entityId -> timeline data
        this.statusCheckInterval = null;
        this.init();
    }

    init() {
        this.loadTimelines();
        this.startStatusMonitoring();
        this.bindEvents();
    }

    /**
     * Create or update a recruitment timeline for an entity
     * @param {Object} timelineData - Timeline configuration
     */
    createTimeline(timelineData) {
        const timeline = {
            id: timelineData.id || this.generateTimelineId(),
            entityId: timelineData.entityId,
            entityType: timelineData.entityType, // project, activity, initiative
            entityName: timelineData.entityName,
            phases: timelineData.phases || [], // Array of recruitment phases
            settings: {
                autoActivate: timelineData.settings?.autoActivate || false,
                autoExpire: timelineData.settings?.autoExpire || false,
                notifyOnStatusChange: timelineData.settings?.notifyOnStatusChange || false,
                ...timelineData.settings
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.timelines.set(timeline.entityId, timeline);
        this.saveTimelines();
        return timeline;
    }

    /**
     * Add a recruitment phase to an entity's timeline
     * @param {string} entityId - Entity identifier
     * @param {Object} phaseData - Phase configuration
     */
    addPhase(entityId, phaseData) {
        const timeline = this.timelines.get(entityId);
        if (!timeline) {
            throw new Error("Timeline not found for entity: " + entityId);
        }

        const phase = {
            id: phaseData.id || this.generatePhaseId(),
            roleType: phaseData.roleType, // crew, volunteer, participant
            title: phaseData.title || `${phaseData.roleType.charAt(0).toUpperCase() + phaseData.roleType.slice(1)} Recruitment`,
            description: phaseData.description || "",
            startDate: phaseData.startDate,
            endDate: phaseData.endDate,
            status: this.calculatePhaseStatus(phaseData.startDate, phaseData.endDate),
            formId: phaseData.formId || null,
            maxApplications: phaseData.maxApplications || null,
            currentApplications: 0,
            settings: {
                requireApproval: phaseData.settings?.requireApproval || true,
                allowMultipleApplications: phaseData.settings?.allowMultipleApplications || false,
                sendConfirmationEmail: phaseData.settings?.sendConfirmationEmail || true,
                ...phaseData.settings
            },
            createdAt: new Date().toISOString()
        };

        timeline.phases.push(phase);
        timeline.updatedAt = new Date().toISOString();
        
        this.timelines.set(entityId, timeline);
        this.saveTimelines();
        
        return phase;
    }

    /**
     * Update an existing recruitment phase
     * @param {string} entityId - Entity identifier
     * @param {string} phaseId - Phase identifier
     * @param {Object} updates - Updates to apply
     */
    updatePhase(entityId, phaseId, updates) {
        const timeline = this.timelines.get(entityId);
        if (!timeline) {
            throw new Error("Timeline not found for entity: " + entityId);
        }

        const phaseIndex = timeline.phases.findIndex(p => p.id === phaseId);
        if (phaseIndex === -1) {
            throw new Error("Phase not found: " + phaseId);
        }

        const phase = timeline.phases[phaseIndex];
        Object.assign(phase, updates);
        
        // Recalculate status if dates changed
        if (updates.startDate || updates.endDate) {
            phase.status = this.calculatePhaseStatus(phase.startDate, phase.endDate);
        }

        timeline.updatedAt = new Date().toISOString();
        this.timelines.set(entityId, timeline);
        this.saveTimelines();
        
        return phase;
    }

    /**
     * Remove a recruitment phase
     * @param {string} entityId - Entity identifier
     * @param {string} phaseId - Phase identifier
     */
    removePhase(entityId, phaseId) {
        const timeline = this.timelines.get(entityId);
        if (!timeline) {
            throw new Error("Timeline not found for entity: " + entityId);
        }

        timeline.phases = timeline.phases.filter(p => p.id !== phaseId);
        timeline.updatedAt = new Date().toISOString();
        
        this.timelines.set(entityId, timeline);
        this.saveTimelines();
    }

    /**
     * Get current recruitment status for a specific role
     * @param {string} entityId - Entity identifier
     * @param {string} roleType - Role type (crew, volunteer, participant)
     * @returns {Object} Status information
     */
    getRecruitmentStatus(entityId, roleType) {
        const timeline = this.timelines.get(entityId);
        if (!timeline) {
            return {
                status: "inactive",
                message: "No recruitment timeline configured",
                canApply: false
            };
        }

        const currentPhase = this.getCurrentPhase(entityId, roleType);
        if (!currentPhase) {
            const nextPhase = this.getNextPhase(entityId, roleType);
            return {
                status: "inactive",
                message: nextPhase 
                    ? `Recruitment opens on ${new Date(nextPhase.startDate).toLocaleDateString()}`
                    : "No recruitment scheduled",
                canApply: false,
                nextPhase: nextPhase
            };
        }

        const now = new Date();
        const startDate = new Date(currentPhase.startDate);
        const endDate = new Date(currentPhase.endDate);

        if (now < startDate) {
            return {
                status: "inactive",
                message: `Recruitment opens on ${startDate.toLocaleDateString()}`,
                canApply: false,
                phase: currentPhase
            };
        }

        if (now > endDate) {
            return {
                status: "expired",
                message: `Recruitment closed on ${endDate.toLocaleDateString()}`,
                canApply: false,
                phase: currentPhase
            };
        }

        // Check if max applications reached
        if (currentPhase.maxApplications && currentPhase.currentApplications >= currentPhase.maxApplications) {
            return {
                status: "full",
                message: "Maximum applications reached",
                canApply: false,
                phase: currentPhase
            };
        }

        return {
            status: "active",
            message: `Applications close on ${endDate.toLocaleDateString()}`,
            canApply: true,
            phase: currentPhase
        };
    }

    /**
     * Get the current active phase for a role
     * @param {string} entityId - Entity identifier
     * @param {string} roleType - Role type
     * @returns {Object|null} Current phase or null
     */
    getCurrentPhase(entityId, roleType) {
        const timeline = this.timelines.get(entityId);
        if (!timeline) return null;

        const now = new Date();
        return timeline.phases.find(phase => 
            phase.roleType === roleType &&
            new Date(phase.startDate) <= now &&
            new Date(phase.endDate) >= now
        ) || null;
    }

    /**
     * Get the next upcoming phase for a role
     * @param {string} entityId - Entity identifier
     * @param {string} roleType - Role type
     * @returns {Object|null} Next phase or null
     */
    getNextPhase(entityId, roleType) {
        const timeline = this.timelines.get(entityId);
        if (!timeline) return null;

        const now = new Date();
        const upcomingPhases = timeline.phases
            .filter(phase => 
                phase.roleType === roleType &&
                new Date(phase.startDate) > now
            )
            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        return upcomingPhases[0] || null;
    }

    /**
     * Get all phases for an entity
     * @param {string} entityId - Entity identifier
     * @returns {Array} Array of phases
     */
    getEntityPhases(entityId) {
        const timeline = this.timelines.get(entityId);
        return timeline ? timeline.phases : [];
    }

    /**
     * Get recruitment button configuration for public pages
     * @param {string} entityId - Entity identifier
     * @param {string} roleType - Role type
     * @returns {Object} Button configuration
     */
    getRecruitmentButton(entityId, roleType) {
        const status = this.getRecruitmentStatus(entityId, roleType);
        const buttonTexts = {
            crew: "Join Project",
            volunteer: "Be a Volunteer",
            participant: "Join Us"
        };

        const baseConfig = {
            text: buttonTexts[roleType] || "Apply",
            roleType: roleType,
            entityId: entityId
        };

        switch (status.status) {
            case "active":
                return {
                    ...baseConfig,
                    enabled: true,
                    className: "recruitment-btn active",
                    tooltip: status.message,
                    formId: status.phase?.formId,
                    onclick: `openRecruitmentForm('${entityId}', '${roleType}')`
                };

            case "inactive":
                return {
                    ...baseConfig,
                    enabled: false,
                    className: "recruitment-btn inactive",
                    tooltip: status.message,
                    onclick: null
                };

            case "expired":
                return {
                    ...baseConfig,
                    enabled: false,
                    className: "recruitment-btn expired",
                    tooltip: status.message,
                    onclick: null
                };

            case "full":
                return {
                    ...baseConfig,
                    enabled: false,
                    className: "recruitment-btn full",
                    tooltip: status.message,
                    onclick: null
                };

            default:
                return {
                    ...baseConfig,
                    enabled: false,
                    className: "recruitment-btn disabled",
                    tooltip: "Recruitment not available",
                    onclick: null
                };
        }
    }

    /**
     * Calculate phase status based on dates
     * @param {string} startDate - Start date
     * @param {string} endDate - End date
     * @returns {string} Status (inactive, active, expired)
     */
    calculatePhaseStatus(startDate, endDate) {
        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (now < start) return "inactive";
        if (now > end) return "expired";
        return "active";
    }

    /**
     * Start automatic status monitoring
     */
    startStatusMonitoring() {
        // Check every minute for status changes
        this.statusCheckInterval = setInterval(() => {
            this.updateAllPhaseStatuses();
        }, 60000);

        // Also check on page focus
        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) {
                this.updateAllPhaseStatuses();
            }
        });
    }

    /**
     * Stop automatic status monitoring
     */
    stopStatusMonitoring() {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
            this.statusCheckInterval = null;
        }
    }

    /**
     * Update status for all phases
     */
    updateAllPhaseStatuses() {
        let hasChanges = false;

        for (const [entityId, timeline] of this.timelines) {
            for (const phase of timeline.phases) {
                const newStatus = this.calculatePhaseStatus(phase.startDate, phase.endDate);
                if (phase.status !== newStatus) {
                    phase.status = newStatus;
                    hasChanges = true;

                    // Trigger status change event
                    this.triggerStatusChangeEvent(entityId, phase, newStatus);
                }
            }
        }

        if (hasChanges) {
            this.saveTimelines();
            this.updateRecruitmentButtons();
        }
    }

    /**
     * Update recruitment buttons on the page
     */
    updateRecruitmentButtons() {
        const buttons = document.querySelectorAll("[data-recruitment-button]");
        buttons.forEach(button => {
            const entityId = button.dataset.entityId;
            const roleType = button.dataset.roleType;
            
            if (entityId && roleType) {
                const config = this.getRecruitmentButton(entityId, roleType);
                this.applyButtonConfig(button, config);
            }
        });
    }

    /**
     * Apply button configuration to DOM element
     * @param {HTMLElement} button - Button element
     * @param {Object} config - Button configuration
     */
    applyButtonConfig(button, config) {
        button.textContent = config.text;
        button.className = config.className;
        button.disabled = !config.enabled;
        button.title = config.tooltip;
        
        if (config.onclick) {
            button.setAttribute("onclick", config.onclick);
        } else {
            button.removeAttribute("onclick");
        }
    }

    /**
     * Trigger status change event
     * @param {string} entityId - Entity identifier
     * @param {Object} phase - Phase object
     * @param {string} newStatus - New status
     */
    triggerStatusChangeEvent(entityId, phase, newStatus) {
        const event = new CustomEvent("recruitmentStatusChange", {
            detail: {
                entityId,
                phase,
                newStatus,
                oldStatus: phase.status
            }
        });
        
        document.dispatchEvent(event);

        // Send notification if enabled
        if (phase.settings?.notifyOnStatusChange) {
            this.sendStatusChangeNotification(entityId, phase, newStatus);
        }
    }

    /**
     * Send status change notification
     * @param {string} entityId - Entity identifier
     * @param {Object} phase - Phase object
     * @param {string} newStatus - New status
     */
    sendStatusChangeNotification(entityId, phase, newStatus) {
        // This would integrate with your notification system
        console.log(`Recruitment status changed for ${phase.roleType} in ${entityId}: ${newStatus}`);
        
        // You can implement email notifications, push notifications, etc. here
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Listen for form submissions to update application counts
        document.addEventListener("recruitmentFormSubmitted", (event) => {
            const { entityId, roleType } = event.detail;
            this.incrementApplicationCount(entityId, roleType);
        });

        // Listen for application approvals/rejections
        document.addEventListener("applicationStatusChanged", (event) => {
            const { entityId, roleType, status } = event.detail;
            if (status === "approved") {
                this.incrementApplicationCount(entityId, roleType);
            }
        });
    }

    /**
     * Increment application count for a phase
     * @param {string} entityId - Entity identifier
     * @param {string} roleType - Role type
     */
    incrementApplicationCount(entityId, roleType) {
        const currentPhase = this.getCurrentPhase(entityId, roleType);
        if (currentPhase) {
            currentPhase.currentApplications++;
            this.saveTimelines();
            this.updateRecruitmentButtons();
        }
    }

    /**
     * Generate unique timeline ID
     * @returns {string} Timeline ID
     */
    generateTimelineId() {
        return "timeline_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Generate unique phase ID
     * @returns {string} Phase ID
     */
    generatePhaseId() {
        return "phase_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Save timelines to localStorage
     */
    saveTimelines() {
        const timelinesData = Array.from(this.timelines.entries());
        localStorage.setItem("recruitmentTimelines", JSON.stringify(timelinesData));
    }

    /**
     * Load timelines from localStorage
     */
    loadTimelines() {
        try {
            const stored = localStorage.getItem("recruitmentTimelines");
            if (stored) {
                const timelinesData = JSON.parse(stored);
                this.timelines = new Map(timelinesData);
            }
        } catch (error) {
            console.error("Error loading timelines:", error);
            this.timelines = new Map();
        }
    }

    /**
     * Export timeline data
     * @param {string} entityId - Optional entity ID to export specific timeline
     * @returns {Object} Timeline data
     */
    exportData(entityId = null) {
        if (entityId) {
            return this.timelines.get(entityId) || null;
        }
        return Object.fromEntries(this.timelines);
    }

    /**
     * Import timeline data
     * @param {Object} data - Timeline data to import
     */
    importData(data) {
        if (data instanceof Map) {
            this.timelines = data;
        } else if (typeof data === "object") {
            this.timelines = new Map(Object.entries(data));
        }
        this.saveTimelines();
    }

    /**
     * Clear all timeline data
     */
    clearAll() {
        this.timelines.clear();
        this.saveTimelines();
    }

    /**
     * Get statistics for all timelines
     * @returns {Object} Statistics
     */
    getStatistics() {
        const stats = {
            totalTimelines: this.timelines.size,
            totalPhases: 0,
            activePhases: 0,
            inactivePhases: 0,
            expiredPhases: 0,
            totalApplications: 0,
            byRole: {
                crew: { phases: 0, applications: 0 },
                volunteer: { phases: 0, applications: 0 },
                participant: { phases: 0, applications: 0 }
            },
            byEntity: {
                project: { timelines: 0, phases: 0 },
                activity: { timelines: 0, phases: 0 },
                initiative: { timelines: 0, phases: 0 }
            }
        };

        for (const timeline of this.timelines.values()) {
            stats.byEntity[timeline.entityType].timelines++;
            
            for (const phase of timeline.phases) {
                stats.totalPhases++;
                stats.byEntity[timeline.entityType].phases++;
                stats.byRole[phase.roleType].phases++;
                stats.totalApplications += phase.currentApplications;
                stats.byRole[phase.roleType].applications += phase.currentApplications;
                
                switch (phase.status) {
                    case "active":
                        stats.activePhases++;
                        break;
                    case "inactive":
                        stats.inactivePhases++;
                        break;
                    case "expired":
                        stats.expiredPhases++;
                        break;
                }
            }
        }

        return stats;
    }
}

// Global instance
let recruitmentTimeline;

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function() {
    recruitmentTimeline = new RecruitmentTimeline();
    window.recruitmentTimeline = recruitmentTimeline;
});

// Global helper functions for use in HTML
window.openRecruitmentForm = function(entityId, roleType) {
    const status = recruitmentTimeline.getRecruitmentStatus(entityId, roleType);
    if (status.canApply && status.phase?.formId) {
        // Open the recruitment form
        if (window.recruitmentManager) {
            window.recruitmentManager.renderPublicForm(status.phase.formId);
        } else {
            console.error("Recruitment manager not available");
        }
    }
};

window.getRecruitmentButtonConfig = function(entityId, roleType) {
    return recruitmentTimeline.getRecruitmentButton(entityId, roleType);
};

// Make class available globally
window.RecruitmentTimeline = RecruitmentTimeline;

// Export for modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = RecruitmentTimeline;
}