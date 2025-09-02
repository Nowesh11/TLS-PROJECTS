/**
 * Join Forms Management System
 * Handles admin interface for customizing join forms for projects, activities, and initiatives
 */

class JoinFormsManager {
    constructor() {
        this.currentFormType = null;
        this.formBuilder = null;
        this.defaultFields = {
            project: [
                { type: "text", label: "Full Name", name: "fullName", required: true },
                { type: "email", label: "Email Address", name: "email", required: true },
                { type: "tel", label: "Phone Number", name: "phone", required: true },
                { type: "textarea", label: "Why do you want to join this project?", name: "motivation", required: true },
                { type: "select", label: "Experience Level", name: "experience", required: true, options: ["Beginner", "Intermediate", "Advanced"] },
                { type: "textarea", label: "Relevant Skills/Experience", name: "skills", required: false }
            ],
            activity: [
                { type: "text", label: "Full Name", name: "fullName", required: true },
                { type: "email", label: "Email Address", name: "email", required: true },
                { type: "tel", label: "Phone Number", name: "phone", required: true },
                { type: "select", label: "Age Group", name: "ageGroup", required: true, options: ["Under 18", "18-25", "26-35", "36-50", "Over 50"] },
                { type: "textarea", label: "Any dietary restrictions or special requirements?", name: "requirements", required: false }
            ],
            initiative: [
                { type: "text", label: "Full Name", name: "fullName", required: true },
                { type: "email", label: "Email Address", name: "email", required: true },
                { type: "tel", label: "Phone Number", name: "phone", required: true },
                { type: "textarea", label: "How would you like to contribute to this initiative?", name: "contribution", required: true },
                { type: "select", label: "Availability", name: "availability", required: true, options: ["Part-time", "Full-time", "Weekends only", "Flexible"] },
                { type: "textarea", label: "Additional Comments", name: "comments", required: false }
            ]
        };
        this.init();
    }

    init() {
        console.log("Initializing Join Forms Manager...");
        this.loadSavedForms();
    }

    async loadSavedForms() {
        try {
            const response = await fetch("/api/join-forms");
            if (response.ok) {
                const savedForms = await response.json();
                this.updateFormsWithSaved(savedForms);
            }
        } catch (error) {
            console.log("No saved forms found, using defaults:", error.message);
        }
    }

    updateFormsWithSaved(savedForms) {
        Object.keys(savedForms).forEach(type => {
            if (this.defaultFields[type] && savedForms[type]) {
                this.defaultFields[type] = savedForms[type];
            }
        });
    }

    selectFormType(type) {
        console.log("Selecting form type:", type);
        this.currentFormType = type;
        
        // Update button states
        document.querySelectorAll(".join-form-type-btn").forEach(btn => {
            btn.classList.remove("btn-primary");
            btn.classList.add("btn-secondary");
        });
        
        const selectedBtn = document.querySelector(`[data-type="${type}"]`);
        if (selectedBtn) {
            selectedBtn.classList.remove("btn-secondary");
            selectedBtn.classList.add("btn-primary");
        }

        // Show form builder and forms list
        this.showFormBuilder();
        this.loadFormsList();
    }

    showFormBuilder() {
        const container = document.getElementById("joinFormBuilderContainer");
        const listContainer = document.getElementById("joinFormsListContainer");
        const title = document.getElementById("joinFormBuilderTitle");
        
        if (container && title) {
            container.style.display = "block";
            title.textContent = `Edit ${this.currentFormType.charAt(0).toUpperCase() + this.currentFormType.slice(1)} Join Form`;
            
            // Initialize form builder
            this.initFormBuilder();
        }
        
        if (listContainer) {
            listContainer.style.display = "block";
        }
    }

    initFormBuilder() {
        const builderContainer = document.getElementById("join-form-builder");
        if (!builderContainer) return;

        // Clear existing content
        builderContainer.innerHTML = "";

        // Initialize FormBuilder if available
        if (typeof FormBuilder !== "undefined") {
            this.formBuilder = new FormBuilder("join-form-builder");
            
            // Load current form fields
            const currentFields = this.defaultFields[this.currentFormType] || [];
            if (currentFields.length > 0) {
                this.formBuilder.load({ fields: currentFields });
            }
        } else {
            // Fallback: Simple form editor
            this.createSimpleFormEditor(builderContainer);
        }
    }

    createSimpleFormEditor(container) {
        const fields = this.defaultFields[this.currentFormType] || [];
        
        container.innerHTML = `
            <div class="simple-form-editor">
                <h4>Form Fields</h4>
                <div id="fieldsContainer">
                    ${fields.map((field, index) => this.createFieldEditor(field, index)).join("")}
                </div>
                <button type="button" class="btn btn-primary" onclick="joinFormsManager.addField()">
                    <i class="fas fa-plus"></i> Add Field
                </button>
            </div>
        `;
    }

    createFieldEditor(field, index) {
        const optionsHtml = field.type === "select" ? `
            <div class="form-group">
                <label>Options (one per line):</label>
                <textarea class="form-control" data-field="options" data-index="${index}">${(field.options || []).join("\n")}</textarea>
            </div>
        ` : "";

        return `
            <div class="field-editor" data-index="${index}">
                <div class="field-header">
                    <h5>Field ${index + 1}</h5>
                    <button type="button" class="btn btn-sm btn-danger" onclick="joinFormsManager.removeField(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Field Type:</label>
                        <select class="form-control" data-field="type" data-index="${index}">
                            <option value="text" ${field.type === "text" ? "selected" : ""}>Text</option>
                            <option value="email" ${field.type === "email" ? "selected" : ""}>Email</option>
                            <option value="tel" ${field.type === "tel" ? "selected" : ""}>Phone</option>
                            <option value="textarea" ${field.type === "textarea" ? "selected" : ""}>Textarea</option>
                            <option value="select" ${field.type === "select" ? "selected" : ""}>Select</option>
                            <option value="checkbox" ${field.type === "checkbox" ? "selected" : ""}>Checkbox</option>
                            <option value="radio" ${field.type === "radio" ? "selected" : ""}>Radio</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Label:</label>
                        <input type="text" class="form-control" data-field="label" data-index="${index}" value="${field.label || ""}">
                    </div>
                    <div class="form-group">
                        <label>Name:</label>
                        <input type="text" class="form-control" data-field="name" data-index="${index}" value="${field.name || ""}">
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" data-field="required" data-index="${index}" ${field.required ? "checked" : ""}>
                            Required
                        </label>
                    </div>
                </div>
                ${optionsHtml}
            </div>
        `;
    }

    addField() {
        const newField = {
            type: "text",
            label: "New Field",
            name: "newField",
            required: false
        };
        
        this.defaultFields[this.currentFormType].push(newField);
        this.initFormBuilder();
    }

    removeField(index) {
        if (confirm("Are you sure you want to remove this field?")) {
            this.defaultFields[this.currentFormType].splice(index, 1);
            this.initFormBuilder();
        }
    }

    async saveJoinForm() {
        if (!this.currentFormType) {
            alert("Please select a form type first.");
            return;
        }

        try {
            let formData;
            
            if (this.formBuilder && typeof this.formBuilder.export === "function") {
                // Use FormBuilder export if available
                formData = this.formBuilder.export();
            } else {
                // Collect data from simple editor
                formData = this.collectSimpleEditorData();
            }

            const response = await fetch("/api/join-forms", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    type: this.currentFormType,
                    fields: formData.fields || formData
                })
            });

            if (response.ok) {
                alert("Form saved successfully!");
                this.loadFormsList();
            } else {
                throw new Error("Failed to save form");
            }
        } catch (error) {
            console.error("Error saving form:", error);
            alert("Error saving form. Please try again.");
        }
    }

    collectSimpleEditorData() {
        const fields = [];
        const fieldEditors = document.querySelectorAll(".field-editor");
        
        fieldEditors.forEach((editor, index) => {
            const field = {
                type: editor.querySelector("[data-field=\"type\"]").value,
                label: editor.querySelector("[data-field=\"label\"]").value,
                name: editor.querySelector("[data-field=\"name\"]").value,
                required: editor.querySelector("[data-field=\"required\"]").checked
            };
            
            // Handle options for select/radio/checkbox fields
            const optionsTextarea = editor.querySelector("[data-field=\"options\"]");
            if (optionsTextarea) {
                field.options = optionsTextarea.value.split("\n").filter(opt => opt.trim());
            }
            
            fields.push(field);
        });
        
        return fields;
    }

    previewJoinForm() {
        if (!this.currentFormType) {
            alert("Please select a form type first.");
            return;
        }

        let formData;
        if (this.formBuilder && typeof this.formBuilder.preview === "function") {
            this.formBuilder.preview();
        } else {
            // Create simple preview
            const fields = this.collectSimpleEditorData();
            this.showSimplePreview(fields);
        }
    }

    showSimplePreview(fields) {
        const previewHtml = `
            <div class="modal" style="display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000;">
                <div class="modal-content" style="max-width: 600px; margin: 2rem auto; background: white; border-radius: 1rem; padding: 2rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                        <h3>Form Preview - ${this.currentFormType.charAt(0).toUpperCase() + this.currentFormType.slice(1)}</h3>
                        <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                    </div>
                    <form>
                        ${fields.map(field => this.generatePreviewField(field)).join("")}
                        <button type="button" class="btn btn-primary" style="margin-top: 1rem;">Submit</button>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML("beforeend", previewHtml);
    }

    generatePreviewField(field) {
        const requiredMark = field.required ? " *" : "";
        const requiredAttr = field.required ? "required" : "";
        
        switch (field.type) {
            case "textarea":
                return `
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">${field.label}${requiredMark}</label>
                        <textarea class="form-control" name="${field.name}" ${requiredAttr} style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.25rem;"></textarea>
                    </div>
                `;
            case "select":
                return `
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">${field.label}${requiredMark}</label>
                        <select class="form-control" name="${field.name}" ${requiredAttr} style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.25rem;">
                            <option value="">Select an option</option>
                            ${(field.options || []).map(opt => `<option value="${opt}">${opt}</option>`).join("")}
                        </select>
                    </div>
                `;
            default:
                return `
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">${field.label}${requiredMark}</label>
                        <input type="${field.type}" class="form-control" name="${field.name}" ${requiredAttr} style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.25rem;">
                    </div>
                `;
        }
    }

    resetJoinForm() {
        if (!this.currentFormType) {
            alert("Please select a form type first.");
            return;
        }

        if (confirm("Are you sure you want to reset this form to default settings? This will remove all custom fields.")) {
            // Reset to original defaults
            this.defaultFields[this.currentFormType] = this.getOriginalDefaults(this.currentFormType);
            this.initFormBuilder();
        }
    }

    getOriginalDefaults(type) {
        const originalDefaults = {
            project: [
                { type: "text", label: "Full Name", name: "fullName", required: true },
                { type: "email", label: "Email Address", name: "email", required: true },
                { type: "tel", label: "Phone Number", name: "phone", required: true },
                { type: "textarea", label: "Why do you want to join this project?", name: "motivation", required: true }
            ],
            activity: [
                { type: "text", label: "Full Name", name: "fullName", required: true },
                { type: "email", label: "Email Address", name: "email", required: true },
                { type: "tel", label: "Phone Number", name: "phone", required: true }
            ],
            initiative: [
                { type: "text", label: "Full Name", name: "fullName", required: true },
                { type: "email", label: "Email Address", name: "email", required: true },
                { type: "tel", label: "Phone Number", name: "phone", required: true }
            ]
        };
        
        return originalDefaults[type] || [];
    }

    async loadFormsList() {
        if (!this.currentFormType) return;
        
        const titleElement = document.getElementById("joinFormsListTitle");
        const tableBody = document.getElementById("joinFormsTableBody");
        
        if (titleElement) {
            titleElement.textContent = `Current ${this.currentFormType.charAt(0).toUpperCase() + this.currentFormType.slice(1)} Forms`;
        }
        
        if (tableBody) {
            try {
                // For now, show a placeholder since we don't have specific items
                tableBody.innerHTML = `
                    <tr>
                        <td>Default ${this.currentFormType} form</td>
                        <td>${this.defaultFields[this.currentFormType].length} fields</td>
                        <td>Recently modified</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="joinFormsManager.editForm('default')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                        </td>
                    </tr>
                `;
            } catch (error) {
                console.error("Error loading forms list:", error);
                tableBody.innerHTML = "<tr><td colspan=\"4\">Error loading forms</td></tr>";
            }
        }
    }

    editForm(formId) {
        // For now, just scroll to the form builder
        document.getElementById("joinFormBuilderContainer").scrollIntoView({ behavior: "smooth" });
    }
}

// Global functions for onclick handlers
function selectJoinFormType(type) {
    if (window.joinFormsManager) {
        window.joinFormsManager.selectFormType(type);
    }
}

function saveJoinForm() {
    if (window.joinFormsManager) {
        window.joinFormsManager.saveJoinForm();
    }
}

function previewJoinForm() {
    if (window.joinFormsManager) {
        window.joinFormsManager.previewJoinForm();
    }
}

function resetJoinForm() {
    if (window.joinFormsManager) {
        window.joinFormsManager.resetJoinForm();
    }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    if (typeof window !== "undefined") {
        window.joinFormsManager = new JoinFormsManager();
        console.log("✅ Join Forms Manager initialized");
    }
});

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
    module.exports = JoinFormsManager;
}