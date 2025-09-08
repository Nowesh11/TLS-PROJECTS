/**
 * Individual Form Manager
 * Manages custom forms for individual projects, activities, and initiatives
 */

class IndividualFormManager {
    constructor() {
        this.currentType = null;
        this.currentItem = null;
        this.formBuilder = null;
        
        // API endpoints
        this.API_BASE = "/api";
        this.ENDPOINTS = {
            projects: `${this.API_BASE}/projects`,
            activities: `${this.API_BASE}/activities`,
            initiatives: `${this.API_BASE}/initiatives`,
            forms: `${this.API_BASE}/individual-forms`
        };
        
        this.init();
    }

    // Authentication helper
    getAuthHeaders() {
        const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
        return {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : ""
        };
    }

    init() {
        this.bindEvents();
        this.loadFormManagementInterface();
    }

    bindEvents() {
        // Event delegation for dynamic content
        document.addEventListener("click", (e) => {
            if (e.target.matches(".create-form-btn")) {
                const type = e.target.dataset.type;
                const itemId = e.target.dataset.itemId;
                const itemTitle = e.target.dataset.itemTitle;
                this.openFormEditor(type, itemId, itemTitle);
            }
            
            if (e.target.matches(".edit-form-btn")) {
                const type = e.target.dataset.type;
                const itemId = e.target.dataset.itemId;
                const itemTitle = e.target.dataset.itemTitle;
                this.editExistingForm(type, itemId, itemTitle);
            }
            
            if (e.target.matches(".preview-form-btn")) {
                const type = e.target.dataset.type;
                const itemId = e.target.dataset.itemId;
                this.previewForm(type, itemId);
            }
            
            if (e.target.matches(".delete-form-btn")) {
                const type = e.target.dataset.type;
                const itemId = e.target.dataset.itemId;
                this.deleteForm(type, itemId);
            }
        });
    }

    async loadFormManagementInterface() {
        try {
            // Load all projects, activities, and initiatives
            const [projects, activities, initiatives] = await Promise.all([
                this.fetchItems("projects"),
                this.fetchItems("activities"),
                this.fetchItems("initiatives")
            ]);

            this.renderFormManagementInterface({
                projects: projects || [],
                activities: activities || [],
                initiatives: initiatives || []
            });
        } catch (error) {
            console.error("Error loading form management interface:", error);
            this.showError("Failed to load items for form management");
        }
    }

    async fetchItems(type) {
        try {
            const response = await fetch(`${this.ENDPOINTS.forms}/${type}/forms-status`, {
                method: "GET",
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error(`Error fetching ${type}:`, error);
            return [];
        }
    }

    renderFormManagementInterface(data) {
        const container = document.getElementById("individual-forms-container");
        if (!container) {
            console.error("Individual forms container not found");
            return;
        }

        container.innerHTML = `
            <div class="individual-forms-manager">
                <div class="forms-header">
                    <h2><i class="fas fa-edit"></i> Individual Form Editor</h2>
                    <p>Create custom forms for each project, activity, and initiative</p>
                </div>
                
                <div class="forms-tabs">
                    <button class="tab-btn active" data-tab="projects">
                        <i class="fas fa-project-diagram"></i> Projects (${data.projects.length})
                    </button>
                    <button class="tab-btn" data-tab="activities">
                        <i class="fas fa-calendar-alt"></i> Activities (${data.activities.length})
                    </button>
                    <button class="tab-btn" data-tab="initiatives">
                        <i class="fas fa-lightbulb"></i> Initiatives (${data.initiatives.length})
                    </button>
                </div>
                
                <div class="forms-content">
                    <div class="tab-content active" id="projects-tab">
                        ${this.renderItemsList("projects", data.projects)}
                    </div>
                    <div class="tab-content" id="activities-tab">
                        ${this.renderItemsList("activities", data.activities)}
                    </div>
                    <div class="tab-content" id="initiatives-tab">
                        ${this.renderItemsList("initiatives", data.initiatives)}
                    </div>
                </div>
            </div>
            
            <!-- Modern Form Editor Modal -->
            <div id="form-editor-modal" class="modal-overlay" style="display: none;">
                <div class="modal-content form-editor-modal modern-form-editor">
                    <div class="modal-header modern-header">
                        <div class="header-content">
                            <div class="header-icon">
                                <i class="fas fa-wpforms"></i>
                            </div>
                            <div class="header-text">
                                <h3 id="form-editor-title">Create Custom Form</h3>
                                <p class="header-subtitle">Design a custom form with drag-and-drop simplicity</p>
                            </div>
                        </div>
                        <div class="header-actions">
                            <button class="btn btn-icon btn-preview" onclick="individualFormManager.previewForm()" title="Preview Form">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-icon btn-settings" onclick="individualFormManager.toggleFormSettings()" title="Form Settings">
                                <i class="fas fa-cog"></i>
                            </button>
                            <button class="close-btn modern-close" onclick="individualFormManager.closeFormEditor()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <div class="modal-body modern-body">
                        <div class="form-editor-workspace">
                            <div class="editor-sidebar">
                                <div class="sidebar-section">
                                    <h4><i class="fas fa-plus-circle"></i> Add Elements</h4>
                                    <div class="element-palette">
                                        <div class="element-category">
                                            <h5>Basic Fields</h5>
                                            <div class="element-grid">
                                                <button class="element-btn" data-type="text" title="Short Answer">
                                                    <i class="fas fa-font"></i>
                                                    <span>Text</span>
                                                </button>
                                                <button class="element-btn" data-type="textarea" title="Long Answer">
                                                    <i class="fas fa-align-left"></i>
                                                    <span>Paragraph</span>
                                                </button>
                                                <button class="element-btn" data-type="email" title="Email">
                                                    <i class="fas fa-envelope"></i>
                                                    <span>Email</span>
                                                </button>
                                                <button class="element-btn" data-type="phone" title="Phone">
                                                    <i class="fas fa-phone"></i>
                                                    <span>Phone</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div class="element-category">
                                            <h5>Choice Fields</h5>
                                            <div class="element-grid">
                                                <button class="element-btn" data-type="radio" title="Multiple Choice">
                                                    <i class="fas fa-dot-circle"></i>
                                                    <span>Multiple Choice</span>
                                                </button>
                                                <button class="element-btn" data-type="checkbox" title="Checkboxes">
                                                    <i class="fas fa-check-square"></i>
                                                    <span>Checkboxes</span>
                                                </button>
                                                <button class="element-btn" data-type="select" title="Dropdown">
                                                    <i class="fas fa-chevron-down"></i>
                                                    <span>Dropdown</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div class="element-category">
                                            <h5>Advanced</h5>
                                            <div class="element-grid">
                                                <button class="element-btn" data-type="date" title="Date">
                                                    <i class="fas fa-calendar"></i>
                                                    <span>Date</span>
                                                </button>
                                                <button class="element-btn" data-type="number" title="Number">
                                                    <i class="fas fa-hashtag"></i>
                                                    <span>Number</span>
                                                </button>
                                                <button class="element-btn" data-type="file" title="File Upload">
                                                    <i class="fas fa-upload"></i>
                                                    <span>File Upload</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="editor-main">
                                <div id="form-editor-container" class="form-canvas"></div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer modern-footer">
                        <div class="footer-left">
                            <button class="btn btn-text" onclick="individualFormManager.clearForm()">
                                <i class="fas fa-trash-alt"></i> Clear Form
                            </button>
                        </div>
                        <div class="footer-right">
                            <button class="btn btn-secondary" onclick="individualFormManager.closeFormEditor()">
                                Cancel
                            </button>
                            <button class="btn btn-primary modern-save" onclick="individualFormManager.saveForm()">
                                <i class="fas fa-save"></i> Save Form
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindTabEvents();
    }

    renderItemsList(type, items) {
        if (!items || items.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>No ${type} found</h3>
                    <p>Create some ${type} first to add custom forms</p>
                </div>
            `;
        }

        return `
            <div class="items-grid">
                ${items.map(item => this.renderItemCard(type, item)).join("")}
            </div>
        `;
    }

    renderItemCard(type, item) {
        const hasCustomForm = item.customForm && Object.keys(item.customForm).length > 0;
        const typeIcon = {
            "projects": "fas fa-project-diagram",
            "activities": "fas fa-calendar-alt",
            "initiatives": "fas fa-lightbulb"
        }[type];

        return `
            <div class="item-card">
                <div class="item-header">
                    <div class="item-icon">
                        <i class="${typeIcon}"></i>
                    </div>
                    <div class="item-info">
                        <h4>${item.title || item.name}</h4>
                        <p class="item-category">${item.category || "General"}</p>
                        <div class="item-status">
                            <span class="status-badge ${item.status || "active"}">
                                ${(item.status || "active").charAt(0).toUpperCase() + (item.status || "active").slice(1)}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="item-form-status">
                    ${hasCustomForm ? `
                        <div class="form-exists">
                            <i class="fas fa-check-circle text-success"></i>
                            <span>Custom form exists</span>
                        </div>
                    ` : `
                        <div class="no-form">
                            <i class="fas fa-exclamation-circle text-warning"></i>
                            <span>No custom form</span>
                        </div>
                    `}
                </div>
                
                <div class="item-actions">
                    ${hasCustomForm ? `
                        <button class="btn btn-sm btn-primary edit-form-btn" 
                                data-type="${type}" 
                                data-item-id="${item._id}" 
                                data-item-title="${item.title || item.name}">
                            <i class="fas fa-edit"></i> Edit Form
                        </button>
                        <button class="btn btn-sm btn-info preview-form-btn" 
                                data-type="${type}" 
                                data-item-id="${item._id}">
                            <i class="fas fa-eye"></i> Preview
                        </button>
                        <button class="btn btn-sm btn-danger delete-form-btn" 
                                data-type="${type}" 
                                data-item-id="${item._id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-success create-form-btn" 
                                data-type="${type}" 
                                data-item-id="${item._id}" 
                                data-item-title="${item.title || item.name}">
                            <i class="fas fa-plus"></i> Create Form
                        </button>
                    `}
                </div>
            </div>
        `;
    }

    bindTabEvents() {
        document.querySelectorAll(".tab-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll(".tab-btn").forEach(btn => {
            btn.classList.remove("active");
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");

        // Update tab content
        document.querySelectorAll(".tab-content").forEach(content => {
            content.classList.remove("active");
        });
        document.getElementById(`${tabName}-tab`).classList.add("active");
    }

    openFormEditor(type, itemId, itemTitle) {
        this.currentType = type;
        this.currentItem = { id: itemId, title: itemTitle };
        
        document.getElementById("form-editor-title").textContent = `Create Form for: ${itemTitle}`;
        document.getElementById("form-editor-modal").style.display = "flex";
        
        // Initialize form builder
        this.initializeFormBuilder();
    }

    async editExistingForm(type, itemId, itemTitle) {
        this.currentType = type;
        this.currentItem = { id: itemId, title: itemTitle };
        
        document.getElementById("form-editor-title").textContent = `Edit Form for: ${itemTitle}`;
        document.getElementById("form-editor-modal").style.display = "flex";
        
        // Load existing form data
        try {
            const formData = await this.loadExistingForm(type, itemId);
            this.initializeFormBuilder(formData);
        } catch (error) {
            console.error("Error loading existing form:", error);
            this.showError("Failed to load existing form");
            this.initializeFormBuilder();
        }
    }

    async loadExistingForm(type, itemId) {
        const response = await fetch(`${this.ENDPOINTS.forms}/${type}/${itemId}/form`, {
            method: "GET",
            headers: this.getAuthHeaders()
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                // No custom form exists yet
                return null;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result.success ? result.data : null;
    }

    initializeFormBuilder(existingData = null) {
        const container = document.getElementById("form-editor-container");
        
        // Create form builder container with info alert
        container.innerHTML = `
            <div style="background: var(--info-bg, rgba(2, 136, 209, 0.1)); border: 1px solid var(--info-border, rgba(2, 136, 209, 0.3)); border-radius: 8px; padding: 16px; margin-bottom: 20px; color: var(--text-primary);">
                <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
                Create a custom form for <strong>${this.currentItem.title}</strong>. This form will be available for users to fill out when they view this ${this.currentType}.
            </div>
            <div id="individualFormBuilder"></div>
        `;
        
        // Use the existing form builder but initialize it for individual items
        const builderContainer = container.querySelector("#individualFormBuilder");
        if (window.IndividualFormBuilder) {
            this.formBuilder = new window.IndividualFormBuilder(builderContainer, {
                existingData,
                mode: "individual",
                itemType: this.currentType,
                itemId: this.currentItem.id,
                itemTitle: this.currentItem.title
            });
            
            // Listen for form save events
            builderContainer.addEventListener("formSave", (e) => {
                this.handleFormSave(e.detail);
            });
        } else {
            console.error("IndividualFormBuilder not available");
            builderContainer.innerHTML = "<p class=\"error\">Form builder not available. Please refresh the page.</p>";
        }
    }

    async saveForm() {
        if (!this.formBuilder) {
            this.showError("Form builder not initialized");
            return;
        }

        try {
            const formData = this.formBuilder.getFormData();
            
            if (!formData || !formData.fields || formData.fields.length === 0) {
                this.showError("Please add at least one field to the form");
                return;
            }

            // Add metadata for individual forms
            const formPayload = {
                ...formData,
                itemType: this.currentType,
                itemId: this.currentItem.id,
                itemTitle: this.currentItem.title,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const response = await fetch(`${this.API_BASE}${this.ENDPOINTS.saveForm.replace(":type", this.currentType).replace(":itemId", this.currentItem.id)}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify(formPayload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.showNotification("Form saved successfully!", "success");
                this.closeFormEditor();
                this.loadItems(); // Refresh the interface
            } else {
                throw new Error(result.message || "Failed to save form");
            }
        } catch (error) {
            console.error("Error saving form:", error);
            this.showNotification(error.message || "Failed to save form", "error");
        }
    }

    async handleFormSave(formData) {
        try {
            if (!formData || !formData.fields || formData.fields.length === 0) {
                this.showError("Please add at least one field to the form");
                return;
            }

            // Add metadata for individual forms
            const formPayload = {
                ...formData,
                itemType: this.currentType,
                itemId: this.currentItem.id,
                itemTitle: this.currentItem.title,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const response = await fetch(`${this.ENDPOINTS.forms}/${this.currentType}/${this.currentItem.id}/form`, {
                method: "POST",
                headers: this.getAuthHeaders(),
                body: JSON.stringify(formPayload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.showSuccess("Form saved successfully!");
                this.closeFormEditor();
                this.loadFormManagementInterface(); // Refresh the interface
            } else {
                throw new Error(result.message || "Failed to save form");
            }
        } catch (error) {
            console.error("Error saving form:", error);
            this.showError(error.message || "Failed to save form");
        }
    }

    async previewForm(type, itemId) {
        try {
            const formData = await this.loadExistingForm(type, itemId);
            
            // Create preview modal
            const previewModal = document.createElement("div");
            previewModal.className = "modal-overlay";
            previewModal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Form Preview</h3>
                        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="form-preview-container"></div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(previewModal);
            
            // Render form preview
            this.renderFormPreview(formData, document.getElementById("form-preview-container"));
            
        } catch (error) {
            console.error("Error previewing form:", error);
            this.showError("Failed to load form preview");
        }
    }

    renderFormPreview(formData, container) {
        if (!formData || !formData.fields) {
            container.innerHTML = "<p>No form data available</p>";
            return;
        }

        const formHtml = `
            <form class="preview-form">
                <h4>${formData.title || "Custom Form"}</h4>
                ${formData.description ? `<p class="form-description">${formData.description}</p>` : ""}
                
                ${formData.fields.map(field => this.renderPreviewField(field)).join("")}
                
                <div class="form-actions">
                    <button type="button" class="btn btn-primary" disabled>
                        Submit (Preview Mode)
                    </button>
                </div>
            </form>
        `;
        
        container.innerHTML = formHtml;
    }

    renderPreviewField(field) {
        switch (field.type) {
            case "text":
                return `
                    <div class="form-group">
                        <label>${field.label} ${field.required ? "*" : ""}</label>
                        <input type="text" class="form-control" placeholder="${field.placeholder || ""}" disabled>
                    </div>
                `;
            case "textarea":
                return `
                    <div class="form-group">
                        <label>${field.label} ${field.required ? "*" : ""}</label>
                        <textarea class="form-control" placeholder="${field.placeholder || ""}" disabled></textarea>
                    </div>
                `;
            case "select":
                return `
                    <div class="form-group">
                        <label>${field.label} ${field.required ? "*" : ""}</label>
                        <select class="form-control" disabled>
                            <option>Choose an option...</option>
                            ${(field.options || []).map(opt => `<option>${opt}</option>`).join("")}
                        </select>
                    </div>
                `;
            case "radio":
                return `
                    <div class="form-group">
                        <label>${field.label} ${field.required ? "*" : ""}</label>
                        <div class="radio-group">
                            ${(field.options || []).map((opt, idx) => `
                                <label class="radio-label">
                                    <input type="radio" name="${field.name}" value="${opt}" disabled>
                                    ${opt}
                                </label>
                            `).join("")}
                        </div>
                    </div>
                `;
            case "checkbox":
                return `
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" disabled>
                            ${field.label} ${field.required ? "*" : ""}
                        </label>
                    </div>
                `;
            default:
                return `<div class="form-group"><p>Unknown field type: ${field.type}</p></div>`;
        }
    }

    async deleteForm(type, itemId) {
        if (!confirm("Are you sure you want to delete this custom form? This action cannot be undone.")) {
            return;
        }

        try {
            const response = await fetch(`${this.ENDPOINTS.forms}/${type}/${itemId}/form`, {
                method: "DELETE",
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess("Form deleted successfully!");
                this.loadFormManagementInterface(); // Refresh the interface
            } else {
                throw new Error(result.message || "Failed to delete form");
            }
        } catch (error) {
            console.error("Error deleting form:", error);
            this.showError(error.message || "Failed to delete form");
        }
    }

    closeFormEditor() {
        document.getElementById("form-editor-modal").style.display = "none";
        
        // Clear form builder
        const container = document.getElementById("form-editor-container");
        container.innerHTML = "";
        
        // Reset current context
        this.currentType = null;
        this.currentItem = null;
        this.formBuilder = null;
    }

    previewForm() {
        if (!this.formBuilder) {
            this.showError("Form builder not initialized");
            return;
        }

        const formData = this.formBuilder.getFormData();
        if (!formData || !formData.fields || formData.fields.length === 0) {
            this.showError("Please add at least one field to preview the form");
            return;
        }

        // Create preview modal
        const previewModal = document.createElement("div");
        previewModal.className = "modal-overlay";
        previewModal.innerHTML = `
            <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3><i class="fas fa-eye"></i> Form Preview</h3>
                    <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${this.renderFormPreview(formData)}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Close Preview
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(previewModal);
    }

    toggleFormSettings() {
        // Toggle form settings panel
        const settingsPanel = document.querySelector(".form-settings-panel");
        if (settingsPanel) {
            settingsPanel.style.display = settingsPanel.style.display === "none" ? "block" : "none";
        } else {
            // Create settings panel if it doesn't exist
            this.createFormSettingsPanel();
        }
    }

    createFormSettingsPanel() {
        const editorMain = document.querySelector(".editor-main");
        if (!editorMain) return;

        const settingsPanel = document.createElement("div");
        settingsPanel.className = "form-settings-panel";
        settingsPanel.innerHTML = `
            <div class="settings-header">
                <h4><i class="fas fa-cog"></i> Form Settings</h4>
                <button class="close-settings" onclick="this.parentElement.parentElement.style.display='none'">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="settings-content">
                <div class="setting-group">
                    <label>
                        <input type="checkbox" id="allowMultipleSubmissions"> Allow multiple submissions
                    </label>
                </div>
                <div class="setting-group">
                    <label>
                        <input type="checkbox" id="requireLogin" checked> Require login
                    </label>
                </div>
                <div class="setting-group">
                    <label>
                        <input type="checkbox" id="emailNotifications" checked> Email notifications
                    </label>
                </div>
                <div class="setting-group">
                    <label>Success Message:</label>
                    <textarea id="successMessage" placeholder="Thank you for your submission!">Thank you for your submission!</textarea>
                </div>
            </div>
        `;
        
        editorMain.appendChild(settingsPanel);
    }

    clearForm() {
        if (!this.formBuilder) {
            this.showError("Form builder not initialized");
            return;
        }

        if (confirm("Are you sure you want to clear the entire form? This action cannot be undone.")) {
            this.formBuilder.clear();
            this.showSuccess("Form cleared successfully");
        }
    }

    showSuccess(message) {
        // Use existing notification system
        if (window.showNotification) {
            window.showNotification(message, "success");
        } else {
            alert(message);
        }
    }

    showError(message) {
        // Use existing notification system
        if (window.showNotification) {
            window.showNotification(message, "error");
        } else {
            alert(message);
        }
    }
}

// Global function to load form manager with specific type
function loadIndividualFormManager(type) {
    if (window.individualFormManager) {
        // Load the interface first
        window.individualFormManager.loadFormManagementInterface().then(() => {
            // Switch to the specified tab after loading
            setTimeout(() => {
                const tabBtn = document.querySelector(`[data-tab="${type}"]`);
                if (tabBtn) {
                    tabBtn.click();
                }
            }, 100);
        });
    } else {
        console.error("Individual form manager not initialized");
    }
}

// Initialize when DOM is loaded
let individualFormManager;
document.addEventListener("DOMContentLoaded", () => {
    individualFormManager = new IndividualFormManager();
    window.individualFormManager = individualFormManager;
    window.loadIndividualFormManager = loadIndividualFormManager;
});