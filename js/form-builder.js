/**
 * Enhanced Dynamic Form Builder - Google Forms Style
 * Comprehensive recruitment form builder for Tamil Language Society
 * Supports Projects, Activities, and Initiatives with timeline management
 */

class FormBuilder {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.formData = {
            id: options.formId || this.generateId(),
            title: options.title || "Untitled Recruitment Form",
            description: options.description || "",
            entityType: options.entityType || "project", // project, activity, initiative
            entityId: options.entityId || null,
            entityName: options.entityName || "",
            roleType: options.roleType || "crew", // crew, volunteer, participant
            timeline: options.timeline || {
                startDate: "",
                endDate: "",
                status: "inactive", // active, inactive, expired
                autoActivate: false,
                autoExpire: false
            },
            fields: options.fields || [],
            settings: {
                allowMultipleSubmissions: false,
                requireLogin: true,
                collectEmail: true,
                showProgressBar: true,
                confirmationMessage: "Thank you for your application! We will review it and get back to you soon.",
                redirectUrl: "",
                notificationEmail: "",
                autoApproval: false,
                maxApplications: null
            },
            styling: {
                theme: "default",
                primaryColor: "#007bff",
                backgroundColor: "var(--bg-color)",
                textColor: "var(--text-color)"
            }
        };
        this.currentFieldId = 0;
        this.draggedElement = null;
        this.init();
    }

    generateId() {
        return "form_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Add drag and drop event listeners
        this.container.addEventListener("dragstart", (e) => {
            if (e.target.classList.contains("form-field")) {
                this.draggedElement = e.target;
                e.dataTransfer.effectAllowed = "move";
            }
        });

        this.container.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
        });

        this.container.addEventListener("drop", (e) => {
            e.preventDefault();
            if (this.draggedElement) {
                const dropZone = e.target.closest(".drop-zone");
                if (dropZone) {
                    const position = parseInt(dropZone.dataset.position);
                    this.moveFieldToPosition(this.draggedElement, position);
                }
                this.draggedElement = null;
            }
        });

        // Add keyboard event listeners
        this.container.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                this.hideSettings();
                this.hideTimeline();
                this.hideFieldTypes();
            }
        });
    }

    moveFieldToPosition(fieldElement, newPosition) {
        const fieldId = parseInt(fieldElement.dataset.fieldId);
        const fieldIndex = this.formData.fields.findIndex(f => f.id === fieldId);
        
        if (fieldIndex !== -1) {
            const field = this.formData.fields.splice(fieldIndex, 1)[0];
            this.formData.fields.splice(newPosition, 0, field);
            this.render();
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="form-builder enhanced-form-builder">
                <!-- Enhanced Header with Entity Info -->
                <div class="form-builder-header">
                    <div class="entity-info-section">
                        <div class="entity-badge">
                            <span class="entity-icon">${this.getEntityIcon(this.formData.entityType)}</span>
                            <div class="entity-details">
                                <span class="entity-type">${this.formData.entityType.charAt(0).toUpperCase() + this.formData.entityType.slice(1)}</span>
                                <span class="entity-name">${this.formData.entityName || "Unnamed"}</span>
                            </div>
                        </div>
                        <div class="role-badge role-${this.formData.roleType}">
                            ${this.getRoleIcon(this.formData.roleType)} ${this.formData.roleType.charAt(0).toUpperCase() + this.formData.roleType.slice(1)}
                        </div>
                    </div>
                    
                    <div class="form-title-section">
                        <input type="text" class="form-title-input enhanced-input" value="${this.formData.title}" placeholder="Form Title">
                        <textarea class="form-description-input enhanced-textarea" placeholder="Form Description (Optional)">${this.formData.description}</textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button class="btn btn-outline" onclick="formBuilder.showSettings()">
                            <i class="fas fa-cog"></i> Settings
                        </button>
                        <button class="btn btn-outline" onclick="formBuilder.showTimeline()">
                            <i class="fas fa-calendar-alt"></i> Timeline
                        </button>
                        <button class="btn btn-secondary" onclick="formBuilder.preview()">
                            <i class="fas fa-eye"></i> Preview
                        </button>
                        <button class="btn btn-primary" onclick="formBuilder.save()">
                            <i class="fas fa-save"></i> Save Form
                        </button>
                    </div>
                </div>

                <!-- Timeline Status Bar -->
                <div class="timeline-status-bar status-${this.formData.timeline.status}">
                    <div class="status-indicator">
                        <span class="status-icon">${this.getStatusIcon(this.formData.timeline.status)}</span>
                        <span class="status-text">${this.getStatusText(this.formData.timeline.status)}</span>
                    </div>
                    <div class="timeline-dates">
                        ${this.formData.timeline.startDate ? `<span class="start-date">Starts: ${new Date(this.formData.timeline.startDate).toLocaleDateString()}</span>` : ""}
                        ${this.formData.timeline.endDate ? `<span class="end-date">Ends: ${new Date(this.formData.timeline.endDate).toLocaleDateString()}</span>` : ""}
                    </div>
                </div>
                
                <!-- Enhanced Form Builder Body -->
                <div class="form-builder-body">
                    <div class="builder-layout">
                        <!-- Field Types Sidebar -->
                        <div class="field-types-sidebar" id="field-types-sidebar">
                            <div class="sidebar-header">
                                <h3><i class="fas fa-plus-circle"></i> Add Fields</h3>
                                <button class="sidebar-toggle" onclick="formBuilder.toggleSidebar()">
                                    <i class="fas fa-chevron-left"></i>
                                </button>
                            </div>
                            <div class="field-types-grid">
                                ${this.renderEnhancedFieldTypes()}
                            </div>
                        </div>

                        <!-- Main Form Area -->
                        <div class="form-fields-area">
                            <div class="form-fields" id="form-fields">
                                ${this.renderFields()}
                            </div>
                            
                            <div class="add-field-section">
                                <div class="drop-zone main-drop-zone" data-position="${this.formData.fields.length}">
                                    <div class="drop-zone-content">
                                        <i class="fas fa-plus-circle drop-icon"></i>
                                        <span class="drop-text">Drag fields here or click to add questions</span>
                                        <button class="add-field-btn" onclick="formBuilder.showFieldTypes()">
                                            <i class="fas fa-plus"></i> Add Question
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Enhanced Settings Panel -->
                <div class="settings-panel" id="settings-panel" style="display: none;">
                    <div class="panel-header">
                        <h3><i class="fas fa-cog"></i> Form Settings</h3>
                        <button class="panel-close" onclick="formBuilder.hideSettings()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="panel-content">
                        ${this.renderSettingsPanel()}
                    </div>
                </div>

                <!-- Timeline Panel -->
                <div class="timeline-panel" id="timeline-panel" style="display: none;">
                    <div class="panel-header">
                        <h3><i class="fas fa-calendar-alt"></i> Recruitment Timeline</h3>
                        <button class="panel-close" onclick="formBuilder.hideTimeline()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="panel-content">
                        ${this.renderTimelinePanel()}
                    </div>
                </div>

                <!-- Field Types Modal -->
                <div class="field-types-modal" id="field-types-modal" style="display: none;">
                    <div class="modal-overlay" onclick="formBuilder.hideFieldTypes()"></div>
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Choose Question Type</h3>
                            <button class="modal-close" onclick="formBuilder.hideFieldTypes()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="field-types-grid enhanced-grid">
                                ${this.renderEnhancedFieldTypes()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderFields() {
        if (this.formData.fields.length === 0) {
            return `
                <div class="empty-form-state">
                    <div class="empty-icon">
                        <i class="fas fa-clipboard-list"></i>
                    </div>
                    <h3>Start Building Your Form</h3>
                    <p>Add questions by dragging field types from the sidebar or clicking the add button below.</p>
                </div>
            `;
        }
        return this.formData.fields.map((field, index) => this.renderField(field, index)).join("");
    }

    renderField(field, index) {
        return `
            <div class="form-field enhanced-field" data-field-id="${field.id}" data-field-index="${index}" draggable="true">
                <div class="field-drag-handle" title="Drag to reorder">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                
                <div class="field-header">
                    <div class="field-type-indicator">
                        <span class="field-type-icon">${this.getFieldTypeIcon(field.type)}</span>
                        <span class="field-type-label">${this.getFieldTypeLabel(field.type)}</span>
                    </div>
                    
                    <div class="field-actions">
                        <button class="btn-icon" onclick="formBuilder.moveField(${index}, -1)" title="Move Up" ${index === 0 ? "disabled" : ""}>
                            <i class="fas fa-chevron-up"></i>
                        </button>
                        <button class="btn-icon" onclick="formBuilder.moveField(${index}, 1)" title="Move Down" ${index === this.formData.fields.length - 1 ? "disabled" : ""}>
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <button class="btn-icon" onclick="formBuilder.duplicateField(${field.id})" title="Duplicate">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn-icon" onclick="formBuilder.showFieldSettings(${field.id})" title="Settings">
                            <i class="fas fa-cog"></i>
                        </button>
                        <button class="btn-icon btn-danger" onclick="formBuilder.deleteField(${field.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="field-question">
                    <input type="text" class="field-title enhanced-input" value="${field.title}" placeholder="Question" onchange="formBuilder.updateField(${field.id}, 'title', this.value)">
                    <textarea class="field-description enhanced-textarea" placeholder="Description (Optional)" onchange="formBuilder.updateField(${field.id}, 'description', this.value)">${field.description || ""}</textarea>
                </div>
                
                <div class="field-content">
                    ${this.renderFieldInput(field)}
                </div>
                
                <div class="field-footer">
                    <div class="field-required-toggle">
                        <label class="toggle-switch">
                            <input type="checkbox" ${field.required ? "checked" : ""} onchange="formBuilder.updateField(${field.id}, 'required', this.checked)">
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">Required</span>
                        </label>
                    </div>
                </div>
                
                <div class="field-settings" id="field-settings-${field.id}" style="display: none;">
                    <div class="settings-content">
                        ${this.renderFieldSpecificSettings(field)}
                    </div>
                </div>
                
                <!-- Drop zone for inserting fields -->
                <div class="drop-zone field-drop-zone" data-position="${index + 1}">
                    <div class="drop-zone-line"></div>
                    <div class="drop-zone-indicator">
                        <i class="fas fa-plus"></i>
                    </div>
                </div>
            </div>
        `;
    }

    renderFieldInput(field) {
        switch (field.type) {
            case "text":
            case "email":
            case "phone":
            case "number":
                return `<input type="${field.type}" class="form-control" placeholder="${field.placeholder || "Your answer"}" disabled>`;
            
            case "textarea":
                return `<textarea class="form-control" placeholder="${field.placeholder || "Your answer"}" disabled></textarea>`;
            
            case "radio":
                return `
                    <div class="radio-options">
                        ${field.options.map((option, index) => `
                            <div class="option-item">
                                <input type="radio" name="field-${field.id}" disabled>
                                <input type="text" class="option-input" value="${option}" placeholder="Option ${index + 1}" onchange="formBuilder.updateFieldOption(${field.id}, ${index}, this.value)">
                                <button class="btn-icon remove-option" onclick="formBuilder.removeFieldOption(${field.id}, ${index})">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join("")}
                        <button class="add-option-btn" onclick="formBuilder.addFieldOption(${field.id})">
                            <i class="fas fa-plus"></i> Add option
                        </button>
                    </div>
                `;
            
            case "checkbox":
                return `
                    <div class="checkbox-options">
                        ${field.options.map((option, index) => `
                            <div class="option-item">
                                <input type="checkbox" disabled>
                                <input type="text" class="option-input" value="${option}" placeholder="Option ${index + 1}" onchange="formBuilder.updateFieldOption(${field.id}, ${index}, this.value)">
                                <button class="btn-icon remove-option" onclick="formBuilder.removeFieldOption(${field.id}, ${index})">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join("")}
                        <button class="add-option-btn" onclick="formBuilder.addFieldOption(${field.id})">
                            <i class="fas fa-plus"></i> Add option
                        </button>
                    </div>
                `;
            
            case "select":
                return `
                    <select class="form-control" disabled>
                        <option>Choose</option>
                        ${field.options.map(option => `<option>${option}</option>`).join("")}
                    </select>
                    <div class="select-options">
                        ${field.options.map((option, index) => `
                            <div class="option-item">
                                <input type="text" class="option-input" value="${option}" placeholder="Option ${index + 1}" onchange="formBuilder.updateFieldOption(${field.id}, ${index}, this.value)">
                                <button class="btn-icon remove-option" onclick="formBuilder.removeFieldOption(${field.id}, ${index})">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join("")}
                        <button class="add-option-btn" onclick="formBuilder.addFieldOption(${field.id})">
                            <i class="fas fa-plus"></i> Add option
                        </button>
                    </div>
                `;
            
            case "file":
                return "<input type=\"file\" class=\"form-control\" disabled>";
            
            case "date":
                return "<input type=\"date\" class=\"form-control\" disabled>";
            
            case "time":
                return "<input type=\"time\" class=\"form-control\" disabled>";
            
            case "rating":
                return `
                    <div class="rating-scale">
                        <span class="rating-label">${field.ratingLabels?.low || "1"}</span>
                        ${Array.from({length: field.ratingScale || 5}, (_, i) => `
                            <label class="rating-option">
                                <input type="radio" name="field-${field.id}" value="${i + 1}" disabled>
                                <span class="rating-number">${i + 1}</span>
                            </label>
                        `).join("")}
                        <span class="rating-label">${field.ratingLabels?.high || field.ratingScale || 5}</span>
                    </div>
                `;
            
            default:
                return "<input type=\"text\" class=\"form-control\" placeholder=\"Your answer\" disabled>";
        }
    }

    renderFieldSpecificSettings(field) {
        let settings = "";
        
        if (["radio", "checkbox", "select"].includes(field.type)) {
            settings += `
                <div class="setting-group">
                    <label>
                        <input type="checkbox" ${field.allowOther ? "checked" : ""} onchange="formBuilder.updateField(${field.id}, 'allowOther', this.checked)">
                        Add "Other" option
                    </label>
                </div>
            `;
        }
        
        if (field.type === "rating") {
            settings += `
                <div class="setting-group">
                    <label>Rating Scale (1 to):</label>
                    <input type="number" min="2" max="10" value="${field.ratingScale || 5}" onchange="formBuilder.updateField(${field.id}, 'ratingScale', parseInt(this.value))">
                </div>
                <div class="setting-group">
                    <label>Low label:</label>
                    <input type="text" value="${field.ratingLabels?.low || ""}" placeholder="e.g., Poor" onchange="formBuilder.updateFieldRatingLabel(${field.id}, 'low', this.value)">
                </div>
                <div class="setting-group">
                    <label>High label:</label>
                    <input type="text" value="${field.ratingLabels?.high || ""}" placeholder="e.g., Excellent" onchange="formBuilder.updateFieldRatingLabel(${field.id}, 'high', this.value)">
                </div>
            `;
        }
        
        if (["text", "textarea", "email", "phone"].includes(field.type)) {
            settings += `
                <div class="setting-group">
                    <label>Placeholder text:</label>
                    <input type="text" value="${field.placeholder || ""}" placeholder="Enter placeholder" onchange="formBuilder.updateField(${field.id}, 'placeholder', this.value)">
                </div>
            `;
        }
        
        if (field.type === "file") {
            settings += `
                <div class="setting-group">
                    <label>Allowed file types:</label>
                    <input type="text" value="${field.allowedTypes || ""}" placeholder="e.g., .pdf,.doc,.jpg" onchange="formBuilder.updateField(${field.id}, 'allowedTypes', this.value)">
                </div>
                <div class="setting-group">
                    <label>Max file size (MB):</label>
                    <input type="number" min="1" max="100" value="${field.maxFileSize || 10}" onchange="formBuilder.updateField(${field.id}, 'maxFileSize', parseInt(this.value))">
                </div>
            `;
        }
        
        return settings;
    }

    showFieldTypes() {
        const modal = document.getElementById("field-types-modal");
        if (modal) {
            modal.style.display = "block";
        }
    }

    addField(type) {
        const field = {
            id: ++this.currentFieldId,
            type: type,
            title: this.getDefaultTitle(type),
            description: "",
            required: false,
            placeholder: "",
            options: ["radio", "checkbox", "select"].includes(type) ? ["Option 1"] : [],
            ratingScale: type === "rating" ? 5 : undefined,
            ratingLabels: type === "rating" ? { low: "", high: "" } : undefined,
            allowOther: false,
            allowedTypes: type === "file" ? "" : undefined,
            maxFileSize: type === "file" ? 10 : undefined
        };
        
        this.formData.fields.push(field);
        this.render();
        this.hideFieldTypes(); // Hide the modal
    }

    getDefaultTitle(type) {
        const titles = {
            text: "Short answer question",
            textarea: "Long answer question",
            radio: "Multiple choice question",
            checkbox: "Checkbox question",
            select: "Dropdown question",
            file: "File upload",
            date: "Date",
            time: "Time",
            email: "Email address",
            phone: "Phone number",
            number: "Number",
            rating: "Rating scale"
        };
        return titles[type] || "Question";
    }

    updateField(fieldId, property, value) {
        const field = this.formData.fields.find(f => f.id === fieldId);
        if (field) {
            field[property] = value;
        } else {
            console.warn(`Field with ID ${fieldId} not found`);
        }
    }

    updateFieldOption(fieldId, optionIndex, value) {
        const field = this.formData.fields.find(f => f.id === fieldId);
        if (field && field.options && optionIndex >= 0 && optionIndex < field.options.length) {
            field.options[optionIndex] = value;
        } else {
            console.warn(`Field with ID ${fieldId} or option index ${optionIndex} not found`);
        }
    }

    updateFieldRatingLabel(fieldId, labelType, value) {
        const field = this.formData.fields.find(f => f.id === fieldId);
        if (field) {
            if (!field.ratingLabels) {
                field.ratingLabels = {};
            }
            field.ratingLabels[labelType] = value;
        } else {
            console.warn(`Field with ID ${fieldId} not found`);
        }
    }

    addFieldOption(fieldId) {
        const field = this.formData.fields.find(f => f.id === fieldId);
        if (field && field.options) {
            field.options.push(`Option ${field.options.length + 1}`);
            this.render();
        }
    }

    removeFieldOption(fieldId, optionIndex) {
        const field = this.formData.fields.find(f => f.id === fieldId);
        if (field && field.options && field.options.length > 1) {
            field.options.splice(optionIndex, 1);
            this.render();
        }
    }

    duplicateField(fieldId) {
        const field = this.formData.fields.find(f => f.id === fieldId);
        if (field) {
            const duplicatedField = {
                ...field,
                id: ++this.currentFieldId,
                title: field.title + " (Copy)"
            };
            const index = this.formData.fields.findIndex(f => f.id === fieldId);
            this.formData.fields.splice(index + 1, 0, duplicatedField);
            this.render();
        }
    }

    deleteField(fieldId) {
        if (confirm("Are you sure you want to delete this question?")) {
            this.formData.fields = this.formData.fields.filter(f => f.id !== fieldId);
            this.render();
        }
    }

    showFieldSettings(fieldId) {
        const settings = document.getElementById(`field-settings-${fieldId}`);
        settings.style.display = settings.style.display === "none" ? "block" : "none";
    }

    preview() {
        // Create preview modal
        const modal = document.createElement("div");
        modal.className = "modal fade show";
        modal.style.display = "block";
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Form Preview</h5>
                        <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
                    </div>
                    <div class="modal-body">
                        ${this.generatePreviewHTML()}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    generatePreviewHTML() {
        return `
            <div class="form-preview">
                <div class="form-header">
                    <h2>${this.formData.title}</h2>
                    ${this.formData.description ? `<p class="form-description">${this.formData.description}</p>` : ""}
                </div>
                <form class="preview-form">
                    ${this.formData.fields.map(field => this.generatePreviewField(field)).join("")}
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Submit</button>
                    </div>
                </form>
            </div>
        `;
    }

    generatePreviewField(field) {
        let fieldHTML = `
            <div class="form-group">
                <label class="form-label">
                    ${field.title}
                    ${field.required ? "<span class=\"required\">*</span>" : ""}
                </label>
                ${field.description ? `<div class="field-description">${field.description}</div>` : ""}
        `;

        switch (field.type) {
            case "text":
            case "email":
            case "phone":
            case "number":
                fieldHTML += `<input type="${field.type}" class="form-control" placeholder="${field.placeholder || "Your answer"}" ${field.required ? "required" : ""}>`;
                break;
            
            case "textarea":
                fieldHTML += `<textarea class="form-control" placeholder="${field.placeholder || "Your answer"}" ${field.required ? "required" : ""}></textarea>`;
                break;
            
            case "radio":
                fieldHTML += "<div class=\"radio-group\">";
                field.options.forEach((option, index) => {
                    fieldHTML += `
                        <label class="radio-option">
                            <input type="radio" name="field-${field.id}" value="${option}" ${field.required && index === 0 ? "required" : ""}>
                            ${option}
                        </label>
                    `;
                });
                if (field.allowOther) {
                    fieldHTML += `
                        <label class="radio-option">
                            <input type="radio" name="field-${field.id}" value="other">
                            Other: <input type="text" class="other-input" placeholder="Please specify">
                        </label>
                    `;
                }
                fieldHTML += "</div>";
                break;
            
            case "checkbox":
                fieldHTML += "<div class=\"checkbox-group\">";
                field.options.forEach(option => {
                    fieldHTML += `
                        <label class="checkbox-option">
                            <input type="checkbox" name="field-${field.id}[]" value="${option}">
                            ${option}
                        </label>
                    `;
                });
                if (field.allowOther) {
                    fieldHTML += `
                        <label class="checkbox-option">
                            <input type="checkbox" name="field-${field.id}[]" value="other">
                            Other: <input type="text" class="other-input" placeholder="Please specify">
                        </label>
                    `;
                }
                fieldHTML += "</div>";
                break;
            
            case "select":
                fieldHTML += `<select class="form-control" ${field.required ? "required" : ""}>`;
                fieldHTML += "<option value=\"\">Choose</option>";
                field.options.forEach(option => {
                    fieldHTML += `<option value="${option}">${option}</option>`;
                });
                fieldHTML += "</select>";
                break;
            
            case "file":
                fieldHTML += `<input type="file" class="form-control" ${field.allowedTypes ? `accept="${field.allowedTypes}"` : ""} ${field.required ? "required" : ""}>`;
                break;
            
            case "date":
                fieldHTML += `<input type="date" class="form-control" ${field.required ? "required" : ""}>`;
                break;
            
            case "time":
                fieldHTML += `<input type="time" class="form-control" ${field.required ? "required" : ""}>`;
                break;
            
            case "rating":
                fieldHTML += "<div class=\"rating-scale\">";
                fieldHTML += `<span class="rating-label">${field.ratingLabels?.low || "1"}</span>`;
                for (let i = 1; i <= (field.ratingScale || 5); i++) {
                    fieldHTML += `
                        <label class="rating-option">
                            <input type="radio" name="field-${field.id}" value="${i}" ${field.required && i === 1 ? "required" : ""}>
                            <span class="rating-number">${i}</span>
                        </label>
                    `;
                }
                fieldHTML += `<span class="rating-label">${field.ratingLabels?.high || field.ratingScale || 5}</span>`;
                fieldHTML += "</div>";
                break;
        }

        fieldHTML += "</div>";
        return fieldHTML;
    }

    async save() {
        try {
            this.showLoading(true);
            
            // Update form title and description from inputs
            const titleInput = document.querySelector(".form-title-input");
            const descInput = document.querySelector(".form-description-input");
            
            if (titleInput) this.formData.title = titleInput.value;
            if (descInput) this.formData.description = descInput.value;
            
            // Validate form before saving
            if (!this.validateForm()) {
                this.showLoading(false);
                return;
            }
            
            // Update timestamps
            this.formData.updatedAt = new Date().toISOString();
            if (!this.formData.createdAt) {
                this.formData.createdAt = this.formData.updatedAt;
            }
            
            // Prepare form data for API
            const formPayload = {
                title: this.formData.title || 'Untitled Form',
                description: this.formData.description || '',
                target_type: this.entityType || 'project',
                target_id: this.entityId,
                role: this.formData.role || 'volunteer',
                available_date: this.formData.settings?.availableDate || new Date(),
                deadline_date: this.formData.settings?.deadlineDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                is_active: this.formData.settings?.isActive !== false,
                fields: this.formData.fields
            };
            
            let response;
            const token = localStorage.getItem('token');
            
            if (this.formData.id && this.formData.id !== 'temp') {
                // Update existing form
                response = await fetch(`/api/forms/${this.formData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : ''
                    },
                    body: JSON.stringify(formPayload)
                });
            } else {
                // Create new form
                response = await fetch('/api/forms', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : ''
                    },
                    body: JSON.stringify(formPayload)
                });
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.formData.id = result.data._id || result.data.id;
                this.showSuccessMessage("Form saved successfully!");
                
                // Call onSave callback if provided
                if (this.onSave && typeof this.onSave === 'function') {
                    this.onSave(this.formData);
                }
                
                // Emit real-time update if socket available
                if (window.socket) {
                    window.socket.emit('form_updated', {
                        formId: this.formData.id,
                        entityType: this.entityType,
                        entityId: this.entityId,
                        action: this.formData.id ? 'updated' : 'created'
                    });
                }
            } else {
                throw new Error(result.message || 'Failed to save form');
            }
            
        } catch (error) {
            console.error("Error saving form:", error);
            this.showErrorMessage("Error saving form: " + error.message);
            
            // Fallback to localStorage for offline functionality
            try {
                localStorage.setItem("formBuilder_" + this.formData.id, JSON.stringify(this.formData));
                this.showSuccessMessage("Form saved locally (offline mode)");
            } catch (localError) {
                console.error("Failed to save locally:", localError);
                this.showErrorMessage("Failed to save form");
            }
        } finally {
            this.showLoading(false);
        }
    }
    
    validateForm() {
        if (!this.formData.title.trim()) {
            this.showErrorMessage("Please enter a form title");
            return false;
        }
        
        if (this.formData.fields.length === 0) {
            this.showErrorMessage("Please add at least one question to the form");
            return false;
        }
        
        // Validate timeline if set
        if (this.formData.timeline.startDate && this.formData.timeline.endDate) {
            const startDate = new Date(this.formData.timeline.startDate);
            const endDate = new Date(this.formData.timeline.endDate);
            
            if (startDate >= endDate) {
                this.showErrorMessage("End date must be after start date");
                return false;
            }
        }
        
        return true;
    }
    
    showSuccessMessage(message) {
        this.showNotification(message, "success");
    }
    
    showErrorMessage(message) {
        this.showNotification(message, "error");
    }
    
    showNotification(message, type = "info") {
        const notification = document.createElement("div");
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    showLoading(show) {
        const saveBtn = document.querySelector('.save-form-btn');
        if (saveBtn) {
            if (show) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            } else {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Form';
            }
        }
    }

    load(formData) {
        this.formData = formData;
        // Ensure all fields have valid IDs
        if (formData.fields && formData.fields.length > 0) {
            this.currentFieldId = Math.max(...formData.fields.map(f => f.id || 0), 0);
            // Fix any fields without IDs
            formData.fields.forEach(field => {
                if (!field.id) {
                    field.id = ++this.currentFieldId;
                }
            });
        } else {
            this.currentFieldId = 0;
        }
        this.render();
    }

    async loadFromAPI(formId) {
        try {
            this.showLoading(true);
            const token = localStorage.getItem('token');
            
            const response = await fetch(`/api/forms/${formId}`, {
                method: 'GET',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                const form = result.data;
                
                // Convert API form data to form builder format
                const formData = {
                    id: form._id || form.id,
                    title: form.title,
                    description: form.description,
                    role: form.role,
                    fields: form.fields || [],
                    settings: {
                        availableDate: form.available_date,
                        deadlineDate: form.deadline_date,
                        isActive: form.is_active
                    },
                    createdAt: form.created_at,
                    updatedAt: form.updated_at
                };
                
                this.load(formData);
                this.showSuccessMessage('Form loaded successfully!');
                return formData;
            } else {
                throw new Error(result.message || 'Failed to load form');
            }
        } catch (error) {
            console.error('Error loading form:', error);
            this.showErrorMessage('Error loading form: ' + error.message);
            return null;
        } finally {
            this.showLoading(false);
        }
    }

    async delete() {
        if (!this.formData.id || this.formData.id === 'temp') {
            this.showErrorMessage('Cannot delete unsaved form');
            return false;
        }
        
        if (!confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
            return false;
        }
        
        try {
            this.showLoading(true);
            const token = localStorage.getItem('token');
            
            const response = await fetch(`/api/forms/${this.formData.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccessMessage('Form deleted successfully!');
                
                // Emit real-time update if socket available
                if (window.socket) {
                    window.socket.emit('form_deleted', {
                        formId: this.formData.id,
                        entityType: this.entityType,
                        entityId: this.entityId
                    });
                }
                
                // Reset form builder
                this.formData = {
                    id: 'temp',
                    title: '',
                    description: '',
                    fields: [],
                    settings: {}
                };
                this.render();
                
                return true;
            } else {
                throw new Error(result.message || 'Failed to delete form');
            }
        } catch (error) {
            console.error('Error deleting form:', error);
            this.showErrorMessage('Error deleting form: ' + error.message);
            return false;
        } finally {
            this.showLoading(false);
        }
    }

    export() {
        return JSON.stringify(this.formData, null, 2);
    }

    import(jsonData) {
        try {
            const formData = JSON.parse(jsonData);
            // Validate the imported data structure
            if (!formData || typeof formData !== "object") {
                throw new Error("Invalid form data structure");
            }
            if (!formData.fields || !Array.isArray(formData.fields)) {
                formData.fields = [];
            }
            if (!formData.settings || typeof formData.settings !== "object") {
                formData.settings = {
                    allowMultipleSubmissions: false,
                    requireLogin: true,
                    collectEmail: true,
                    showProgressBar: true,
                    confirmationMessage: "Thank you for your application! We will review it and get back to you soon.",
                    redirectUrl: "",
                    notificationEmail: "",
                    autoApproval: false,
                    maxApplications: null
                };
            }
            this.load(formData);
            this.showSuccessMessage("Form imported successfully!");
        } catch (error) {
            console.error("Error importing form data:", error);
            this.showErrorMessage("Invalid form data format. Please check your JSON data.");
        }
    }

    // New helper methods for enhanced functionality
    getEntityIcon(entityType) {
        const icons = {
            project: "🚀",
            activity: "🎯",
            initiative: "💡"
        };
        return icons[entityType] || "📋";
    }
    
    getRoleIcon(roleType) {
        const icons = {
            crew: "👥",
            volunteer: "🤝",
            participant: "🙋"
        };
        return icons[roleType] || "👤";
    }
    
    getStatusIcon(status) {
        const icons = {
            active: "🟢",
            inactive: "🟡",
            expired: "🔴"
        };
        return icons[status] || "⚪";
    }
    
    getStatusText(status) {
        const texts = {
            active: "Currently Accepting Applications",
            inactive: "Applications Not Yet Open",
            expired: "Application Period Closed"
        };
        return texts[status] || "Status Unknown";
    }
    
    getFieldTypeIcon(type) {
        const icons = {
            text: "📝", textarea: "📄", radio: "🔘", checkbox: "☑️",
            select: "📋", file: "📎", date: "📅", time: "🕐",
            email: "📧", phone: "📞", number: "🔢", rating: "⭐"
        };
        return icons[type] || "❓";
    }
    
    getFieldTypeLabel(type) {
        const labels = {
            text: "Short Answer", textarea: "Paragraph", radio: "Multiple Choice",
            checkbox: "Checkboxes", select: "Dropdown", file: "File Upload",
            date: "Date", time: "Time", email: "Email", phone: "Phone",
            number: "Number", rating: "Rating Scale"
        };
        return labels[type] || "Unknown";
    }
    
    renderEnhancedFieldTypes() {
        const fieldTypes = [
            { type: "text", icon: "📝", label: "Short Answer", desc: "Single line text input" },
            { type: "textarea", icon: "📄", label: "Paragraph", desc: "Multi-line text area" },
            { type: "radio", icon: "🔘", label: "Multiple Choice", desc: "Single selection from options" },
            { type: "checkbox", icon: "☑️", label: "Checkboxes", desc: "Multiple selections allowed" },
            { type: "select", icon: "📋", label: "Dropdown", desc: "Select from dropdown menu" },
            { type: "file", icon: "📎", label: "File Upload", desc: "Upload documents or images" },
            { type: "date", icon: "📅", label: "Date", desc: "Date picker" },
            { type: "time", icon: "🕐", label: "Time", desc: "Time picker" },
            { type: "email", icon: "📧", label: "Email", desc: "Email address input" },
            { type: "phone", icon: "📞", label: "Phone", desc: "Phone number input" },
            { type: "number", icon: "🔢", label: "Number", desc: "Numeric input" },
            { type: "rating", icon: "⭐", label: "Rating Scale", desc: "Star or numeric rating" }
        ];
        
        return fieldTypes.map(fieldType => `
            <div class="field-type enhanced-field-type" 
                 draggable="true" 
                 data-field-type="${fieldType.type}"
                 onclick="formBuilder.addField('${fieldType.type}')"
                 title="${fieldType.desc}">
                <div class="field-type-icon">${fieldType.icon}</div>
                <div class="field-type-content">
                    <div class="field-type-label">${fieldType.label}</div>
                    <div class="field-type-desc">${fieldType.desc}</div>
                </div>
            </div>
        `).join("");
    }
    
    renderSettingsPanel() {
        return `
            <div class="settings-section">
                <h4>General Settings</h4>
                <div class="setting-group">
                    <label class="setting-label">
                        <input type="checkbox" ${this.formData.settings.requireLogin ? "checked" : ""} 
                               onchange="formBuilder.updateSetting('requireLogin', this.checked)">
                        <span>Require login to submit</span>
                    </label>
                </div>
                <div class="setting-group">
                    <label class="setting-label">
                        <input type="checkbox" ${this.formData.settings.allowMultipleSubmissions ? "checked" : ""} 
                               onchange="formBuilder.updateSetting('allowMultipleSubmissions', this.checked)">
                        <span>Allow multiple submissions per user</span>
                    </label>
                </div>
                <div class="setting-group">
                    <label class="setting-label">
                        <input type="checkbox" ${this.formData.settings.showProgressBar ? "checked" : ""} 
                               onchange="formBuilder.updateSetting('showProgressBar', this.checked)">
                        <span>Show progress bar</span>
                    </label>
                </div>
                <div class="setting-group">
                    <label class="setting-label">
                        <input type="checkbox" ${this.formData.settings.autoApproval ? "checked" : ""} 
                               onchange="formBuilder.updateSetting('autoApproval', this.checked)">
                        <span>Auto-approve applications</span>
                    </label>
                </div>
            </div>
            
            <div class="settings-section">
                <h4>Application Limits</h4>
                <div class="setting-group">
                    <label>Maximum Applications:</label>
                    <input type="number" min="1" value="${this.formData.settings.maxApplications || ""}" 
                           placeholder="No limit" 
                           onchange="formBuilder.updateSetting('maxApplications', this.value ? parseInt(this.value) : null)">
                </div>
            </div>
            
            <div class="settings-section">
                <h4>Notifications</h4>
                <div class="setting-group">
                    <label>Notification Email:</label>
                    <input type="email" value="${this.formData.settings.notificationEmail || ""}" 
                           placeholder="admin@example.com" 
                           onchange="formBuilder.updateSetting('notificationEmail', this.value)">
                </div>
            </div>
            
            <div class="settings-section">
                <h4>Confirmation Message</h4>
                <div class="setting-group">
                    <textarea class="confirmation-textarea" 
                              onchange="formBuilder.updateSetting('confirmationMessage', this.value)">${this.formData.settings.confirmationMessage}</textarea>
                </div>
            </div>
            
            <div class="settings-section">
                <h4>Redirect URL (Optional)</h4>
                <div class="setting-group">
                    <input type="url" value="${this.formData.settings.redirectUrl || ""}" 
                           placeholder="https://example.com/thank-you" 
                           onchange="formBuilder.updateSetting('redirectUrl', this.value)">
                </div>
            </div>
        `;
    }
    
    renderTimelinePanel() {
        return `
            <div class="timeline-section">
                <h4>Recruitment Period</h4>
                <div class="timeline-dates">
                    <div class="date-group">
                        <label>Start Date & Time:</label>
                        <input type="datetime-local" value="${this.formData.timeline.startDate}" 
                               onchange="formBuilder.updateTimeline('startDate', this.value)">
                    </div>
                    <div class="date-group">
                        <label>End Date & Time:</label>
                        <input type="datetime-local" value="${this.formData.timeline.endDate}" 
                               onchange="formBuilder.updateTimeline('endDate', this.value)">
                    </div>
                </div>
            </div>
            
            <div class="timeline-section">
                <h4>Status Control</h4>
                <div class="status-controls">
                    <div class="status-option">
                        <input type="radio" name="timeline-status" value="inactive" 
                               ${this.formData.timeline.status === "inactive" ? "checked" : ""} 
                               onchange="formBuilder.updateTimeline('status', this.value)">
                        <label>🟡 Inactive - Applications not yet open</label>
                    </div>
                    <div class="status-option">
                        <input type="radio" name="timeline-status" value="active" 
                               ${this.formData.timeline.status === "active" ? "checked" : ""} 
                               onchange="formBuilder.updateTimeline('status', this.value)">
                        <label>🟢 Active - Currently accepting applications</label>
                    </div>
                    <div class="status-option">
                        <input type="radio" name="timeline-status" value="expired" 
                               ${this.formData.timeline.status === "expired" ? "checked" : ""} 
                               onchange="formBuilder.updateTimeline('status', this.value)">
                        <label>🔴 Expired - Application period closed</label>
                    </div>
                </div>
            </div>
            
            <div class="timeline-section">
                <h4>Automation</h4>
                <div class="setting-group">
                    <label class="setting-label">
                        <input type="checkbox" ${this.formData.timeline.autoActivate ? "checked" : ""} 
                               onchange="formBuilder.updateTimeline('autoActivate', this.checked)">
                        <span>Auto-activate on start date</span>
                    </label>
                </div>
                <div class="setting-group">
                    <label class="setting-label">
                        <input type="checkbox" ${this.formData.timeline.autoExpire ? "checked" : ""} 
                               onchange="formBuilder.updateTimeline('autoExpire', this.checked)">
                        <span>Auto-expire on end date</span>
                    </label>
                </div>
            </div>
        `;
    }
    
    // New methods for enhanced functionality
    updateSetting(key, value) {
        this.formData.settings[key] = value;
    }
    
    updateTimeline(key, value) {
        this.formData.timeline[key] = value;
    }
    
    showSettings() {
        document.getElementById("settings-panel").style.display = "block";
    }
    
    hideSettings() {
        document.getElementById("settings-panel").style.display = "none";
    }
    
    showTimeline() {
        document.getElementById("timeline-panel").style.display = "block";
    }
    
    hideTimeline() {
        document.getElementById("timeline-panel").style.display = "none";
    }
    
    showFieldTypes() {
        document.getElementById("field-types-modal").style.display = "block";
    }
    
    hideFieldTypes() {
        document.getElementById("field-types-modal").style.display = "none";
    }
    
    toggleSidebar() {
        const sidebar = document.getElementById("field-types-sidebar");
        sidebar.classList.toggle("collapsed");
    }
    
    moveField(index, direction) {
        const newIndex = index + direction;
        if (newIndex >= 0 && newIndex < this.formData.fields.length) {
            const field = this.formData.fields.splice(index, 1)[0];
            this.formData.fields.splice(newIndex, 0, field);
            this.render();
        }
    }
}

// Global instance and initialization
let formBuilder;

// Initialize form builder when DOM is ready
document.addEventListener("DOMContentLoaded", function() {
    if (document.getElementById("form-builder-container")) {
        formBuilder = new FormBuilder("form-builder-container");
        window.formBuilder = formBuilder;
    }
});

// Make FormBuilder globally available
window.FormBuilder = FormBuilder;

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = FormBuilder;
}