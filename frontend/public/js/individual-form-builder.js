/**
 * Individual Form Builder
 * Google Forms-style form builder for individual projects, activities, and initiatives
 */

class IndividualFormBuilder {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            allowedFieldTypes: [
                "text", "textarea", "email", "phone", "number", "date",
                "select", "radio", "checkbox", "file"
            ],
            ...options
        };
        
        this.fields = [];
        this.draggedElement = null;
        this.fieldCounter = 0;
        
        this.init();
    }
    
    init() {
        this.render();
        this.bindEvents();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="form-builder">
                <!-- Form Header -->
                <div class="form-header">
                    <div class="form-title-section">
                        <input type="text" id="formTitle" class="form-title-input" placeholder="Untitled Form" value="">
                        <textarea id="formDescription" class="form-description-input" placeholder="Form description (optional)"></textarea>
                    </div>
                </div>
                
                <!-- Field Types Palette -->
                <div class="field-palette">
                    <h4>Add Fields</h4>
                    <div class="field-types-grid">
                        ${this.renderFieldTypes()}
                    </div>
                </div>
                
                <!-- Form Builder Area -->
                <div class="form-builder-area">
                    <div class="form-fields-container" id="formFieldsContainer">
                        <div class="empty-form-message">
                            <i class="fas fa-plus-circle"></i>
                            <p>Click on a field type above to add it to your form</p>
                        </div>
                    </div>
                </div>
                
                <!-- Form Settings -->
                <div class="form-settings">
                    <h4>Form Settings</h4>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="allowMultipleSubmissions">
                                Allow multiple submissions per user
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="requireLogin" checked>
                                Require login to submit
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="emailNotifications" checked>
                                Send email notifications
                            </label>
                        </div>
                        <div class="setting-item">
                            <label for="successMessage">Success Message:</label>
                            <textarea id="successMessage" placeholder="Thank you for your submission!">Thank you for your submission!</textarea>
                        </div>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="previewFormBtn">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                    <button type="button" class="btn btn-primary" id="saveFormBtn">
                        <i class="fas fa-save"></i> Save Form
                    </button>
                </div>
            </div>
        `;
    }
    
    renderFieldTypes() {
        const fieldTypes = {
            text: { icon: "fas fa-font", label: "Text" },
            textarea: { icon: "fas fa-align-left", label: "Paragraph" },
            email: { icon: "fas fa-envelope", label: "Email" },
            phone: { icon: "fas fa-phone", label: "Phone" },
            number: { icon: "fas fa-hashtag", label: "Number" },
            date: { icon: "fas fa-calendar", label: "Date" },
            select: { icon: "fas fa-chevron-down", label: "Dropdown" },
            radio: { icon: "fas fa-dot-circle", label: "Multiple Choice" },
            checkbox: { icon: "fas fa-check-square", label: "Checkboxes" },
            file: { icon: "fas fa-paperclip", label: "File Upload" }
        };
        
        return this.options.allowedFieldTypes.map(type => {
            const field = fieldTypes[type];
            return `
                <div class="field-type-item" data-type="${type}" draggable="true">
                    <i class="${field.icon}"></i>
                    <span>${field.label}</span>
                </div>
            `;
        }).join("");
    }
    
    bindEvents() {
        // Field type click events
        this.container.querySelectorAll(".field-type-item").forEach(item => {
            item.addEventListener("click", (e) => {
                const fieldType = e.currentTarget.dataset.type;
                this.addField(fieldType);
            });
            
            // Drag and drop
            item.addEventListener("dragstart", (e) => {
                this.draggedElement = e.currentTarget;
                e.dataTransfer.effectAllowed = "copy";
            });
        });
        
        // Form fields container drop events
        const container = this.container.querySelector("#formFieldsContainer");
        container.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
        });
        
        container.addEventListener("drop", (e) => {
            e.preventDefault();
            if (this.draggedElement) {
                const fieldType = this.draggedElement.dataset.type;
                this.addField(fieldType);
                this.draggedElement = null;
            }
        });
        
        // Action buttons
        this.container.querySelector("#previewFormBtn").addEventListener("click", () => {
            this.previewForm();
        });
        
        this.container.querySelector("#saveFormBtn").addEventListener("click", () => {
            this.saveForm();
        });
    }
    
    addField(type) {
        const fieldId = `field_${++this.fieldCounter}`;
        const field = {
            id: fieldId,
            type: type,
            name: fieldId,
            label: this.getDefaultLabel(type),
            placeholder: "",
            required: false,
            options: type === "select" || type === "radio" || type === "checkbox" ? ["Option 1"] : [],
            validation: {}
        };
        
        this.fields.push(field);
        this.renderFields();
    }
    
    getDefaultLabel(type) {
        const labels = {
            text: "Text Field",
            textarea: "Paragraph Text",
            email: "Email Address",
            phone: "Phone Number",
            number: "Number",
            date: "Date",
            select: "Dropdown",
            radio: "Multiple Choice",
            checkbox: "Checkboxes",
            file: "File Upload"
        };
        return labels[type] || "Field";
    }
    
    renderFields() {
        const container = this.container.querySelector("#formFieldsContainer");
        
        if (this.fields.length === 0) {
            container.innerHTML = `
                <div class="empty-form-message">
                    <i class="fas fa-plus-circle"></i>
                    <p>Click on a field type above to add it to your form</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.fields.map((field, index) => {
            return this.renderField(field, index);
        }).join("");
        
        // Bind field events
        this.bindFieldEvents();
    }
    
    renderField(field, index) {
        return `
            <div class="form-field-editor" data-field-id="${field.id}" data-index="${index}">
                <div class="field-header">
                    <div class="field-drag-handle">
                        <i class="fas fa-grip-vertical"></i>
                    </div>
                    <div class="field-type-indicator">
                        ${this.getFieldTypeIcon(field.type)}
                    </div>
                    <div class="field-actions">
                        <button type="button" class="btn-icon" data-action="duplicate">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button type="button" class="btn-icon" data-action="delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="field-content">
                    <div class="field-settings">
                        <div class="setting-row">
                            <label>Field Label:</label>
                            <input type="text" class="field-label" value="${field.label}" placeholder="Field label">
                        </div>
                        
                        <div class="setting-row">
                            <label>Field Name:</label>
                            <input type="text" class="field-name" value="${field.name}" placeholder="field_name">
                        </div>
                        
                        ${field.type !== "file" ? `
                            <div class="setting-row">
                                <label>Placeholder:</label>
                                <input type="text" class="field-placeholder" value="${field.placeholder}" placeholder="Placeholder text">
                            </div>
                        ` : ""}
                        
                        <div class="setting-row">
                            <label>
                                <input type="checkbox" class="field-required" ${field.required ? "checked" : ""}>
                                Required field
                            </label>
                        </div>
                        
                        ${this.renderFieldSpecificSettings(field)}
                    </div>
                    
                    <div class="field-preview">
                        <label class="preview-label">
                            ${field.label} ${field.required ? "<span class=\"required\">*</span>" : ""}
                        </label>
                        ${this.renderFieldPreview(field)}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderFieldSpecificSettings(field) {
        if (field.type === "select" || field.type === "radio" || field.type === "checkbox") {
            return `
                <div class="setting-row">
                    <label>Options:</label>
                    <div class="field-options">
                        ${field.options.map((option, i) => `
                            <div class="option-item">
                                <input type="text" class="option-value" value="${option}" placeholder="Option ${i + 1}">
                                <button type="button" class="btn-icon remove-option" data-index="${i}">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join("")}
                        <button type="button" class="btn btn-sm add-option">
                            <i class="fas fa-plus"></i> Add Option
                        </button>
                    </div>
                </div>
            `;
        }
        
        if (field.type === "number") {
            return `
                <div class="setting-row">
                    <div class="setting-group">
                        <label>Min Value:</label>
                        <input type="number" class="field-min" value="${field.validation.min || ""}" placeholder="Minimum">
                    </div>
                    <div class="setting-group">
                        <label>Max Value:</label>
                        <input type="number" class="field-max" value="${field.validation.max || ""}" placeholder="Maximum">
                    </div>
                </div>
            `;
        }
        
        return "";
    }
    
    renderFieldPreview(field) {
        switch (field.type) {
            case "text":
            case "email":
            case "phone":
            case "number":
                return `<input type="${field.type}" class="form-control" placeholder="${field.placeholder}" disabled>`;
            
            case "textarea":
                return `<textarea class="form-control" placeholder="${field.placeholder}" disabled></textarea>`;
            
            case "date":
                return "<input type=\"date\" class=\"form-control\" disabled>";
            
            case "select":
                return `
                    <select class="form-control" disabled>
                        <option>Choose an option</option>
                        ${field.options.map(option => `<option>${option}</option>`).join("")}
                    </select>
                `;
            
            case "radio":
                return `
                    <div class="radio-group">
                        ${field.options.map((option, i) => `
                            <label class="radio-option">
                                <input type="radio" name="${field.name}_preview" disabled>
                                <span>${option}</span>
                            </label>
                        `).join("")}
                    </div>
                `;
            
            case "checkbox":
                return `
                    <div class="checkbox-group">
                        ${field.options.map((option, i) => `
                            <label class="checkbox-option">
                                <input type="checkbox" disabled>
                                <span>${option}</span>
                            </label>
                        `).join("")}
                    </div>
                `;
            
            case "file":
                return "<input type=\"file\" class=\"form-control\" disabled>";
            
            default:
                return "<input type=\"text\" class=\"form-control\" disabled>";
        }
    }
    
    getFieldTypeIcon(type) {
        const icons = {
            text: "fas fa-font",
            textarea: "fas fa-align-left",
            email: "fas fa-envelope",
            phone: "fas fa-phone",
            number: "fas fa-hashtag",
            date: "fas fa-calendar",
            select: "fas fa-chevron-down",
            radio: "fas fa-dot-circle",
            checkbox: "fas fa-check-square",
            file: "fas fa-paperclip"
        };
        return `<i class="${icons[type] || "fas fa-question"}"></i>`;
    }
    
    bindFieldEvents() {
        // Field setting changes
        this.container.querySelectorAll(".field-label").forEach(input => {
            input.addEventListener("input", (e) => {
                const fieldId = e.target.closest(".form-field-editor").dataset.fieldId;
                const field = this.fields.find(f => f.id === fieldId);
                if (field) {
                    field.label = e.target.value;
                    this.updateFieldPreview(fieldId);
                }
            });
        });
        
        this.container.querySelectorAll(".field-name").forEach(input => {
            input.addEventListener("input", (e) => {
                const fieldId = e.target.closest(".form-field-editor").dataset.fieldId;
                const field = this.fields.find(f => f.id === fieldId);
                if (field) {
                    field.name = e.target.value;
                }
            });
        });
        
        this.container.querySelectorAll(".field-placeholder").forEach(input => {
            input.addEventListener("input", (e) => {
                const fieldId = e.target.closest(".form-field-editor").dataset.fieldId;
                const field = this.fields.find(f => f.id === fieldId);
                if (field) {
                    field.placeholder = e.target.value;
                    this.updateFieldPreview(fieldId);
                }
            });
        });
        
        this.container.querySelectorAll(".field-required").forEach(input => {
            input.addEventListener("change", (e) => {
                const fieldId = e.target.closest(".form-field-editor").dataset.fieldId;
                const field = this.fields.find(f => f.id === fieldId);
                if (field) {
                    field.required = e.target.checked;
                    this.updateFieldPreview(fieldId);
                }
            });
        });
        
        // Field actions
        this.container.querySelectorAll("[data-action=\"duplicate\"]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const fieldId = e.target.closest(".form-field-editor").dataset.fieldId;
                this.duplicateField(fieldId);
            });
        });
        
        this.container.querySelectorAll("[data-action=\"delete\"]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const fieldId = e.target.closest(".form-field-editor").dataset.fieldId;
                this.deleteField(fieldId);
            });
        });
        
        // Option management
        this.container.querySelectorAll(".add-option").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const fieldId = e.target.closest(".form-field-editor").dataset.fieldId;
                this.addOption(fieldId);
            });
        });
        
        this.container.querySelectorAll(".remove-option").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const fieldId = e.target.closest(".form-field-editor").dataset.fieldId;
                const optionIndex = parseInt(e.target.dataset.index);
                this.removeOption(fieldId, optionIndex);
            });
        });
        
        this.container.querySelectorAll(".option-value").forEach(input => {
            input.addEventListener("input", (e) => {
                const fieldId = e.target.closest(".form-field-editor").dataset.fieldId;
                const optionIndex = Array.from(e.target.closest(".field-options").querySelectorAll(".option-value")).indexOf(e.target);
                this.updateOption(fieldId, optionIndex, e.target.value);
            });
        });
    }
    
    updateFieldPreview(fieldId) {
        const fieldEditor = this.container.querySelector(`[data-field-id="${fieldId}"]`);
        const field = this.fields.find(f => f.id === fieldId);
        
        if (fieldEditor && field) {
            const previewLabel = fieldEditor.querySelector(".preview-label");
            const previewElement = fieldEditor.querySelector(".field-preview");
            
            previewLabel.innerHTML = `${field.label} ${field.required ? "<span class=\"required\">*</span>" : ""}`;
            
            const previewInput = previewElement.querySelector("input, textarea, select");
            if (previewInput && field.placeholder) {
                previewInput.placeholder = field.placeholder;
            }
        }
    }
    
    duplicateField(fieldId) {
        const field = this.fields.find(f => f.id === fieldId);
        if (field) {
            const newField = {
                ...field,
                id: `field_${++this.fieldCounter}`,
                name: `field_${this.fieldCounter}`,
                label: field.label + " (Copy)"
            };
            this.fields.push(newField);
            this.renderFields();
        }
    }
    
    deleteField(fieldId) {
        this.fields = this.fields.filter(f => f.id !== fieldId);
        this.renderFields();
    }
    
    addOption(fieldId) {
        const field = this.fields.find(f => f.id === fieldId);
        if (field && field.options) {
            field.options.push(`Option ${field.options.length + 1}`);
            this.renderFields();
        }
    }
    
    removeOption(fieldId, optionIndex) {
        const field = this.fields.find(f => f.id === fieldId);
        if (field && field.options && field.options.length > 1) {
            field.options.splice(optionIndex, 1);
            this.renderFields();
        }
    }
    
    updateOption(fieldId, optionIndex, value) {
        const field = this.fields.find(f => f.id === fieldId);
        if (field && field.options && field.options[optionIndex] !== undefined) {
            field.options[optionIndex] = value;
            this.updateFieldPreview(fieldId);
        }
    }
    
    previewForm() {
        const formData = this.getFormData();
        
        // Create preview modal
        const modal = document.createElement("div");
        modal.className = "modal fade";
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Form Preview</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${this.renderFormPreview(formData)}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        modal.addEventListener("hidden.bs.modal", () => {
            document.body.removeChild(modal);
        });
    }
    
    renderFormPreview(formData) {
        return `
            <div class="form-preview">
                <div class="form-header">
                    <h3>${formData.title || "Untitled Form"}</h3>
                    ${formData.description ? `<p class="form-description">${formData.description}</p>` : ""}
                </div>
                
                <form class="preview-form">
                    ${formData.fields.map(field => `
                        <div class="form-group mb-3">
                            <label class="form-label">
                                ${field.label} ${field.required ? "<span class=\"text-danger\">*</span>" : ""}
                            </label>
                            ${this.renderFieldPreview(field)}
                        </div>
                    `).join("")}
                    
                    <div class="form-group">
                        <button type="submit" class="btn btn-primary" disabled>
                            Submit Form
                        </button>
                    </div>
                </form>
            </div>
        `;
    }
    
    saveForm() {
        const formData = this.getFormData();
        
        // Validate form
        if (!formData.title.trim()) {
            alert("Please enter a form title");
            return;
        }
        
        if (formData.fields.length === 0) {
            alert("Please add at least one field to the form");
            return;
        }
        
        // Validate field names are unique
        const fieldNames = formData.fields.map(f => f.name);
        const duplicateNames = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
        if (duplicateNames.length > 0) {
            alert(`Duplicate field names found: ${duplicateNames.join(", ")}. Please ensure all field names are unique.`);
            return;
        }
        
        // Trigger save event
        this.container.dispatchEvent(new CustomEvent("formSave", {
            detail: formData
        }));
    }
    
    getFormData() {
        return {
            title: this.container.querySelector("#formTitle").value,
            description: this.container.querySelector("#formDescription").value,
            fields: this.fields.map(field => ({
                type: field.type,
                name: field.name,
                label: field.label,
                placeholder: field.placeholder,
                required: field.required,
                options: field.options || [],
                validation: field.validation || {}
            })),
            settings: {
                allowMultipleSubmissions: this.container.querySelector("#allowMultipleSubmissions").checked,
                requireLogin: this.container.querySelector("#requireLogin").checked,
                emailNotifications: this.container.querySelector("#emailNotifications").checked,
                successMessage: this.container.querySelector("#successMessage").value
            }
        };
    }
    
    loadFormData(formData) {
        if (!formData) return;
        
        // Load form header
        this.container.querySelector("#formTitle").value = formData.title || "";
        this.container.querySelector("#formDescription").value = formData.description || "";
        
        // Load fields
        this.fields = formData.fields.map((field, index) => ({
            id: `field_${index + 1}`,
            ...field
        }));
        this.fieldCounter = this.fields.length;
        
        // Load settings
        if (formData.settings) {
            this.container.querySelector("#allowMultipleSubmissions").checked = formData.settings.allowMultipleSubmissions || false;
            this.container.querySelector("#requireLogin").checked = formData.settings.requireLogin !== false;
            this.container.querySelector("#emailNotifications").checked = formData.settings.emailNotifications !== false;
            this.container.querySelector("#successMessage").value = formData.settings.successMessage || "Thank you for your submission!";
        }
        
        this.renderFields();
    }
    
    clear() {
        this.fields = [];
        this.fieldCounter = 0;
        this.container.querySelector("#formTitle").value = "";
        this.container.querySelector("#formDescription").value = "";
        this.container.querySelector("#allowMultipleSubmissions").checked = false;
        this.container.querySelector("#requireLogin").checked = true;
        this.container.querySelector("#emailNotifications").checked = true;
        this.container.querySelector("#successMessage").value = "Thank you for your submission!";
        this.renderFields();
    }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = IndividualFormBuilder;
}

// Make available globally for browser usage
if (typeof window !== "undefined") {
    window.IndividualFormBuilder = IndividualFormBuilder;
}