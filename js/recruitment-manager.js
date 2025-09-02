/**
 * Recruitment Management System
 * Handles recruitment forms for crews, participants, and volunteers
 * Integrates with the dynamic form builder
 */

class RecruitmentManager {
    constructor() {
        this.recruitmentTypes = {
            crews: "Crews",
            participants: "Participants", 
            volunteers: "Volunteers"
        };
        this.bureaus = [
            "Technical Bureau",
            "Creative Bureau", 
            "Marketing Bureau",
            "Operations Bureau",
            "Finance Bureau",
            "Human Resources Bureau",
            "Research Bureau"
        ];
        this.forms = new Map();
        this.applications = new Map();
        this.init();
    }

    init() {
        this.loadExistingForms();
        this.loadExistingApplications();
    }

    // Form Management
    createRecruitmentForm(entityType, entityId, recruitmentType, formData) {
        const formId = `${entityType}_${entityId}_${recruitmentType}_${Date.now()}`;
        const recruitmentForm = {
            id: formId,
            entityType: entityType, // 'project', 'activity', 'initiative'
            entityId: entityId,
            recruitmentType: recruitmentType, // 'crews', 'participants', 'volunteers'
            title: formData.title,
            description: formData.description,
            fields: formData.fields,
            settings: {
                ...formData.settings,
                isActive: true,
                maxApplications: formData.settings.maxApplications || null,
                deadline: formData.settings.deadline || null,
                bureauAssignment: recruitmentType === "crews" || recruitmentType === "volunteers",
                autoApprove: formData.settings.autoApprove || false
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.forms.set(formId, recruitmentForm);
        this.saveFormsToStorage();
        return recruitmentForm;
    }

    updateRecruitmentForm(formId, formData) {
        const form = this.forms.get(formId);
        if (form) {
            Object.assign(form, {
                ...formData,
                updatedAt: new Date().toISOString()
            });
            this.saveFormsToStorage();
            return form;
        }
        return null;
    }

    deleteRecruitmentForm(formId) {
        const deleted = this.forms.delete(formId);
        if (deleted) {
            this.saveFormsToStorage();
            // Also delete related applications
            this.deleteApplicationsByForm(formId);
        }
        return deleted;
    }

    getRecruitmentForm(formId) {
        return this.forms.get(formId);
    }

    getRecruitmentFormsByEntity(entityType, entityId) {
        return Array.from(this.forms.values())
            .filter(form => form.entityType === entityType && form.entityId === entityId);
    }

    getRecruitmentFormsByType(recruitmentType) {
        return Array.from(this.forms.values())
            .filter(form => form.recruitmentType === recruitmentType);
    }

    // Application Management
    submitApplication(formId, applicationData) {
        const form = this.forms.get(formId);
        if (!form || !form.settings.isActive) {
            throw new Error("Form is not available for submissions");
        }

        // Check deadline
        if (form.settings.deadline && new Date() > new Date(form.settings.deadline)) {
            throw new Error("Application deadline has passed");
        }

        // Check max applications
        if (form.settings.maxApplications) {
            const currentApplications = this.getApplicationsByForm(formId).length;
            if (currentApplications >= form.settings.maxApplications) {
                throw new Error("Maximum number of applications reached");
            }
        }

        const applicationId = `app_${formId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const application = {
            id: applicationId,
            formId: formId,
            entityType: form.entityType,
            entityId: form.entityId,
            recruitmentType: form.recruitmentType,
            applicantData: applicationData,
            status: form.settings.autoApprove ? "approved" : "pending",
            assignedBureau: null,
            submittedAt: new Date().toISOString(),
            reviewedAt: null,
            reviewedBy: null,
            notes: ""
        };

        this.applications.set(applicationId, application);
        this.saveApplicationsToStorage();
        return application;
    }

    updateApplicationStatus(applicationId, status, reviewerId = null, notes = "") {
        const application = this.applications.get(applicationId);
        if (application) {
            application.status = status;
            application.reviewedAt = new Date().toISOString();
            application.reviewedBy = reviewerId;
            application.notes = notes;
            this.saveApplicationsToStorage();
            return application;
        }
        return null;
    }

    assignBureau(applicationId, bureau) {
        const application = this.applications.get(applicationId);
        if (application) {
            application.assignedBureau = bureau;
            this.saveApplicationsToStorage();
            return application;
        }
        return null;
    }

    getApplication(applicationId) {
        return this.applications.get(applicationId);
    }

    getApplicationsByForm(formId) {
        return Array.from(this.applications.values())
            .filter(app => app.formId === formId);
    }

    getApplicationsByEntity(entityType, entityId) {
        return Array.from(this.applications.values())
            .filter(app => app.entityType === entityType && app.entityId === entityId);
    }

    getApplicationsByType(recruitmentType) {
        return Array.from(this.applications.values())
            .filter(app => app.recruitmentType === recruitmentType);
    }

    getApplicationsByBureau(bureau) {
        return Array.from(this.applications.values())
            .filter(app => app.assignedBureau === bureau);
    }

    getApplicationsByStatus(status) {
        return Array.from(this.applications.values())
            .filter(app => app.status === status);
    }

    deleteApplicationsByForm(formId) {
        const applicationsToDelete = Array.from(this.applications.keys())
            .filter(appId => this.applications.get(appId).formId === formId);
        
        applicationsToDelete.forEach(appId => {
            this.applications.delete(appId);
        });
        
        if (applicationsToDelete.length > 0) {
            this.saveApplicationsToStorage();
        }
    }

    // Statistics and Analytics
    getRecruitmentStats() {
        const stats = {
            totalForms: this.forms.size,
            activeForms: Array.from(this.forms.values()).filter(f => f.settings.isActive).length,
            totalApplications: this.applications.size,
            applicationsByStatus: {
                pending: 0,
                approved: 0,
                rejected: 0
            },
            applicationsByType: {
                crews: 0,
                participants: 0,
                volunteers: 0
            },
            applicationsByBureau: {}
        };

        // Initialize bureau stats
        this.bureaus.forEach(bureau => {
            stats.applicationsByBureau[bureau] = 0;
        });

        // Calculate stats
        Array.from(this.applications.values()).forEach(app => {
            stats.applicationsByStatus[app.status]++;
            stats.applicationsByType[app.recruitmentType]++;
            if (app.assignedBureau) {
                stats.applicationsByBureau[app.assignedBureau]++;
            }
        });

        return stats;
    }

    getEntityRecruitmentStats(entityType, entityId) {
        const entityApplications = this.getApplicationsByEntity(entityType, entityId);
        const entityForms = this.getRecruitmentFormsByEntity(entityType, entityId);

        const stats = {
            totalForms: entityForms.length,
            activeForms: entityForms.filter(f => f.settings.isActive).length,
            totalApplications: entityApplications.length,
            applicationsByStatus: {
                pending: 0,
                approved: 0,
                rejected: 0
            },
            applicationsByType: {
                crews: 0,
                participants: 0,
                volunteers: 0
            }
        };

        entityApplications.forEach(app => {
            stats.applicationsByStatus[app.status]++;
            stats.applicationsByType[app.recruitmentType]++;
        });

        return stats;
    }

    // Storage Management
    saveFormsToStorage() {
        const formsArray = Array.from(this.forms.entries());
        localStorage.setItem("recruitmentForms", JSON.stringify(formsArray));
    }

    saveApplicationsToStorage() {
        const applicationsArray = Array.from(this.applications.entries());
        localStorage.setItem("recruitmentApplications", JSON.stringify(applicationsArray));
    }

    loadExistingForms() {
        try {
            const stored = localStorage.getItem("recruitmentForms");
            if (stored) {
                const formsArray = JSON.parse(stored);
                this.forms = new Map(formsArray);
            }
        } catch (error) {
            console.error("Error loading recruitment forms:", error);
        }
    }

    loadExistingApplications() {
        try {
            const stored = localStorage.getItem("recruitmentApplications");
            if (stored) {
                const applicationsArray = JSON.parse(stored);
                this.applications = new Map(applicationsArray);
            }
        } catch (error) {
            console.error("Error loading recruitment applications:", error);
        }
    }

    // Export/Import functionality
    exportData() {
        return {
            forms: Array.from(this.forms.entries()),
            applications: Array.from(this.applications.entries()),
            exportedAt: new Date().toISOString()
        };
    }

    importData(data) {
        try {
            if (data.forms) {
                this.forms = new Map(data.forms);
                this.saveFormsToStorage();
            }
            if (data.applications) {
                this.applications = new Map(data.applications);
                this.saveApplicationsToStorage();
            }
            return true;
        } catch (error) {
            console.error("Error importing recruitment data:", error);
            return false;
        }
    }

    // Form Builder Integration
    openFormBuilder(entityType, entityId, recruitmentType, existingFormId = null) {
        const modal = document.createElement("div");
        modal.className = "modal fade show";
        modal.style.display = "block";
        modal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            ${existingFormId ? "Edit" : "Create"} ${this.recruitmentTypes[recruitmentType]} Recruitment Form
                        </h5>
                        <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
                    </div>
                    <div class="modal-body">
                        <div id="recruitment-form-builder"></div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="recruitmentManager.saveRecruitmentForm('${entityType}', '${entityId}', '${recruitmentType}', '${existingFormId}', this)">Save Form</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Initialize form builder in the modal
        const formBuilder = new FormBuilder("recruitment-form-builder");
        
        // Load existing form data if editing
        if (existingFormId) {
            const existingForm = this.getRecruitmentForm(existingFormId);
            if (existingForm) {
                formBuilder.load({
                    title: existingForm.title,
                    description: existingForm.description,
                    fields: existingForm.fields,
                    settings: existingForm.settings
                });
            }
        } else {
            // Set default title for new forms
            formBuilder.formData.title = `${this.recruitmentTypes[recruitmentType]} Application Form`;
            formBuilder.formData.description = `Apply to join as ${recruitmentType.slice(0, -1)} for this ${entityType}.`;
        }
        
        // Store reference for saving
        modal.formBuilder = formBuilder;
    }

    saveRecruitmentForm(entityType, entityId, recruitmentType, existingFormId, buttonElement) {
        const modal = buttonElement.closest(".modal");
        const formBuilder = modal.formBuilder;
        
        if (!formBuilder) {
            alert("Form builder not found");
            return;
        }
        
        // Get form data from builder
        const formData = {
            title: formBuilder.formData.title,
            description: formBuilder.formData.description,
            fields: formBuilder.formData.fields,
            settings: formBuilder.formData.settings
        };
        
        try {
            if (existingFormId) {
                this.updateRecruitmentForm(existingFormId, formData);
                showNotification("Recruitment form updated successfully", "success");
            } else {
                this.createRecruitmentForm(entityType, entityId, recruitmentType, formData);
                showNotification("Recruitment form created successfully", "success");
            }
            
            modal.remove();
            
            // Refresh the recruitment forms display if it exists
            if (typeof refreshRecruitmentForms === "function") {
                refreshRecruitmentForms();
            }
        } catch (error) {
            console.error("Error saving recruitment form:", error);
            showNotification("Error saving recruitment form", "error");
        }
    }

    // Public Form Display
    renderPublicForm(formId, containerId) {
        const form = this.getRecruitmentForm(formId);
        const container = document.getElementById(containerId);
        
        if (!form || !container) {
            console.error("Form or container not found");
            return;
        }
        
        if (!form.settings.isActive) {
            container.innerHTML = "<div class=\"alert alert-warning\">This recruitment form is no longer accepting applications.</div>";
            return;
        }
        
        // Check deadline
        if (form.settings.deadline && new Date() > new Date(form.settings.deadline)) {
            container.innerHTML = "<div class=\"alert alert-warning\">The application deadline has passed.</div>";
            return;
        }
        
        // Check max applications
        if (form.settings.maxApplications) {
            const currentApplications = this.getApplicationsByForm(formId).length;
            if (currentApplications >= form.settings.maxApplications) {
                container.innerHTML = "<div class=\"alert alert-warning\">Maximum number of applications reached.</div>";
                return;
            }
        }
        
        container.innerHTML = `
            <div class="recruitment-form">
                <div class="form-header">
                    <h2>${form.title}</h2>
                    ${form.description ? `<p class="form-description">${form.description}</p>` : ""}
                    ${form.settings.deadline ? `<div class="deadline-notice">Application deadline: ${new Date(form.settings.deadline).toLocaleDateString()}</div>` : ""}
                </div>
                <form id="recruitment-form-${formId}" class="recruitment-application-form">
                    ${form.fields.map(field => this.renderPublicField(field)).join("")}
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Submit Application</button>
                    </div>
                </form>
            </div>
        `;
        
        // Add form submission handler
        const formElement = document.getElementById(`recruitment-form-${formId}`);
        formElement.addEventListener("submit", (e) => {
            e.preventDefault();
            this.handlePublicFormSubmission(formId, formElement);
        });
    }

    renderPublicField(field) {
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
                fieldHTML += `<input type="${field.type}" name="field-${field.id}" class="form-control" placeholder="${field.placeholder || "Your answer"}" ${field.required ? "required" : ""}>`;
                break;
            
            case "textarea":
                fieldHTML += `<textarea name="field-${field.id}" class="form-control" placeholder="${field.placeholder || "Your answer"}" ${field.required ? "required" : ""}></textarea>`;
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
                            Other: <input type="text" name="field-${field.id}-other" class="other-input" placeholder="Please specify">
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
                            Other: <input type="text" name="field-${field.id}-other" class="other-input" placeholder="Please specify">
                        </label>
                    `;
                }
                fieldHTML += "</div>";
                break;
            
            case "select":
                fieldHTML += `<select name="field-${field.id}" class="form-control" ${field.required ? "required" : ""}>`;
                fieldHTML += "<option value=\"\">Choose</option>";
                field.options.forEach(option => {
                    fieldHTML += `<option value="${option}">${option}</option>`;
                });
                fieldHTML += "</select>";
                break;
            
            case "file":
                fieldHTML += `<input type="file" name="field-${field.id}" class="form-control" ${field.allowedTypes ? `accept="${field.allowedTypes}"` : ""} ${field.required ? "required" : ""}>`;
                break;
            
            case "date":
                fieldHTML += `<input type="date" name="field-${field.id}" class="form-control" ${field.required ? "required" : ""}>`;
                break;
            
            case "time":
                fieldHTML += `<input type="time" name="field-${field.id}" class="form-control" ${field.required ? "required" : ""}>`;
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

    handlePublicFormSubmission(formId, formElement) {
        const formData = new FormData(formElement);
        const applicationData = {};
        
        // Process form data
        for (let [key, value] of formData.entries()) {
            if (key.includes("[]")) {
                // Handle checkbox arrays
                const cleanKey = key.replace("[]", "");
                if (!applicationData[cleanKey]) {
                    applicationData[cleanKey] = [];
                }
                applicationData[cleanKey].push(value);
            } else {
                applicationData[key] = value;
            }
        }
        
        try {
            const application = this.submitApplication(formId, applicationData);
            
            // Show success message
            formElement.innerHTML = `
                <div class="alert alert-success">
                    <h4>Application Submitted Successfully!</h4>
                    <p>Thank you for your application. We will review it and get back to you soon.</p>
                    <p><strong>Application ID:</strong> ${application.id}</p>
                </div>
            `;
            
            // Notify admin if needed
            if (typeof showNotification === "function") {
                showNotification("New recruitment application received", "info");
            }
        } catch (error) {
            // Show error message
            const errorDiv = document.createElement("div");
            errorDiv.className = "alert alert-danger";
            errorDiv.textContent = error.message;
            formElement.insertBefore(errorDiv, formElement.firstChild);
        }
    }
    
    // Update field options based on type
    updateFieldOptions(typeSelect) {
        const fieldDiv = typeSelect.closest(".form-field-builder");
        const fieldId = fieldDiv.dataset.fieldId;
        const optionsContainer = document.getElementById(`fieldOptions_${fieldId}`);
        const fieldType = typeSelect.value;
        
        let optionsHTML = "";
        
        if (["radio", "checkbox", "select"].includes(fieldType)) {
            optionsHTML = `
                <div class="form-group">
                    <label class="form-label">Options</label>
                    <div class="options-list" id="optionsList_${fieldId}">
                        <div class="option-item" style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <input type="text" class="form-control" placeholder="Option 1" value="Option 1">
                            <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.option-item').remove()">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="recruitmentManager.addOption('${fieldId}')">
                        <i class="fas fa-plus"></i> Add Option
                    </button>
                    <div class="form-group" style="margin-top: 1rem;">
                        <label class="checkbox-label">
                            <input type="checkbox" class="allow-other">
                            Allow "Other" option
                        </label>
                    </div>
                </div>
            `;
        } else if (fieldType === "rating") {
            optionsHTML = `
                <div class="row">
                    <div class="col-md-4">
                        <div class="form-group">
                            <label class="form-label">Scale (1 to)</label>
                            <input type="number" class="rating-scale form-control" min="2" max="10" value="5">
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-group">
                            <label class="form-label">Low Label</label>
                            <input type="text" class="rating-low form-control" placeholder="Poor" value="Poor">
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-group">
                            <label class="form-label">High Label</label>
                            <input type="text" class="rating-high form-control" placeholder="Excellent" value="Excellent">
                        </div>
                    </div>
                </div>
            `;
        } else if (fieldType === "file") {
            optionsHTML = `
                <div class="form-group">
                    <label class="form-label">Allowed File Types</label>
                    <input type="text" class="allowed-types form-control" placeholder=".pdf,.doc,.docx" value=".pdf,.doc,.docx">
                    <small class="form-text text-muted">Comma-separated file extensions</small>
                </div>
            `;
        }
        
        optionsContainer.innerHTML = optionsHTML;
    }
    
    // Add option to radio/checkbox/select fields
    addOption(fieldId) {
        const optionsList = document.getElementById(`optionsList_${fieldId}`);
        if (!optionsList) return;
        
        const optionCount = optionsList.children.length + 1;
        const optionDiv = document.createElement("div");
        optionDiv.className = "option-item";
        optionDiv.style.cssText = "display: flex; gap: 0.5rem; margin-bottom: 0.5rem;";
        optionDiv.innerHTML = `
            <input type="text" class="form-control" placeholder="Option ${optionCount}" value="Option ${optionCount}">
            <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.option-item').remove()">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        optionsList.appendChild(optionDiv);
    }
    
    // Populate existing field data when editing
    populateExistingFieldData(fieldDiv, existingField) {
        // Set basic field data
        const titleInput = fieldDiv.querySelector(".field-title");
        const descInput = fieldDiv.querySelector(".field-description");
        const requiredInput = fieldDiv.querySelector(".field-required");
        
        if (titleInput) titleInput.value = existingField.title || "";
        if (descInput) descInput.value = existingField.description || "";
        if (requiredInput) requiredInput.checked = existingField.required || false;
        
        // Set field-specific options
        if (existingField.options && ["radio", "checkbox", "select"].includes(existingField.type)) {
            const fieldId = fieldDiv.dataset.fieldId;
            const optionsList = document.getElementById(`optionsList_${fieldId}`);
            if (optionsList) {
                optionsList.innerHTML = "";
                existingField.options.forEach((option, index) => {
                    const optionDiv = document.createElement("div");
                    optionDiv.className = "option-item";
                    optionDiv.style.cssText = "display: flex; gap: 0.5rem; margin-bottom: 0.5rem;";
                    optionDiv.innerHTML = `
                        <input type="text" class="form-control" value="${option}">
                        <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.option-item').remove()">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                    optionsList.appendChild(optionDiv);
                });
            }
            
            const allowOtherInput = fieldDiv.querySelector(".allow-other");
            if (allowOtherInput) allowOtherInput.checked = existingField.allowOther || false;
        }
        
        if (existingField.type === "rating") {
            const scaleInput = fieldDiv.querySelector(".rating-scale");
            const lowInput = fieldDiv.querySelector(".rating-low");
            const highInput = fieldDiv.querySelector(".rating-high");
            
            if (scaleInput) scaleInput.value = existingField.ratingScale || 5;
            if (lowInput) lowInput.value = existingField.ratingLabels?.low || "Poor";
            if (highInput) highInput.value = existingField.ratingLabels?.high || "Excellent";
        }
        
        if (existingField.type === "file") {
            const allowedTypesInput = fieldDiv.querySelector(".allowed-types");
            if (allowedTypesInput) allowedTypesInput.value = existingField.allowedTypes || ".pdf,.doc,.docx";
        }
    }
    
    // Save enhanced form
    saveEnhancedForm(entityType, entityId, existingFormId) {
        try {
            const formTitle = document.getElementById("formTitle").value.trim();
            const formDescription = document.getElementById("formDescription").value.trim();
            const recruitmentType = document.getElementById("recruitmentType").value;
            const formStatus = document.getElementById("formStatus").value;
            const formDeadline = document.getElementById("formDeadline").value;
            const maxApplications = document.getElementById("maxApplications").value;
            const autoApprove = document.getElementById("autoApprove").checked;
            
            if (!formTitle) {
                alert("Please enter a form title");
                return;
            }
            
            // Collect form fields
            const fields = [];
            const fieldBuilders = document.querySelectorAll(".form-field-builder");
            
            fieldBuilders.forEach(fieldDiv => {
                const fieldId = fieldDiv.dataset.fieldId;
                const fieldType = fieldDiv.querySelector(".field-type").value;
                const fieldTitle = fieldDiv.querySelector(".field-title").value.trim();
                const fieldDescription = fieldDiv.querySelector(".field-description").value.trim();
                const fieldRequired = fieldDiv.querySelector(".field-required").checked;
                
                if (!fieldTitle) return; // Skip fields without titles
                
                const field = {
                    id: fieldId,
                    type: fieldType,
                    title: fieldTitle,
                    description: fieldDescription,
                    required: fieldRequired
                };
                
                // Add field-specific options
                if (["radio", "checkbox", "select"].includes(fieldType)) {
                    const optionInputs = fieldDiv.querySelectorAll(`#optionsList_${fieldId} input`);
                    field.options = Array.from(optionInputs).map(input => input.value.trim()).filter(val => val);
                    
                    const allowOtherInput = fieldDiv.querySelector(".allow-other");
                    if (allowOtherInput) field.allowOther = allowOtherInput.checked;
                }
                
                if (fieldType === "rating") {
                    const scaleInput = fieldDiv.querySelector(".rating-scale");
                    const lowInput = fieldDiv.querySelector(".rating-low");
                    const highInput = fieldDiv.querySelector(".rating-high");
                    
                    field.ratingScale = parseInt(scaleInput?.value) || 5;
                    field.ratingLabels = {
                        low: lowInput?.value || "Poor",
                        high: highInput?.value || "Excellent"
                    };
                }
                
                if (fieldType === "file") {
                    const allowedTypesInput = fieldDiv.querySelector(".allowed-types");
                    field.allowedTypes = allowedTypesInput?.value || ".pdf,.doc,.docx";
                }
                
                fields.push(field);
            });
            
            if (fields.length === 0) {
                alert("Please add at least one form field");
                return;
            }
            
            const formData = {
                title: formTitle,
                description: formDescription,
                fields: fields,
                settings: {
                    isActive: formStatus === "active",
                    deadline: formDeadline || null,
                    maxApplications: maxApplications ? parseInt(maxApplications) : null,
                    autoApprove: autoApprove
                }
            };
            
            // Save or update form
            if (existingFormId) {
                this.updateRecruitmentForm(existingFormId, formData);
                if (typeof showNotification === "function") {
                    showNotification("Recruitment form updated successfully", "success");
                }
            } else {
                this.createRecruitmentForm(entityType, entityId, recruitmentType, formData);
                if (typeof showNotification === "function") {
                    showNotification("Recruitment form created successfully", "success");
                }
            }
            
            // Close modal
            const modal = document.querySelector(".modal");
            if (modal) modal.remove();
            
            // Refresh displays
            if (typeof loadRecruitmentStats === "function") {
                loadRecruitmentStats();
            }
            
        } catch (error) {
            console.error("Error saving enhanced form:", error);
            if (typeof showNotification === "function") {
                showNotification("Error saving form", "error");
            }
        }
    }
    
    // Get entity icon
    getEntityIcon(entityType) {
        const icons = {
            "projects": "project-diagram",
            "activities": "calendar-alt",
            "initiatives": "lightbulb"
        };
        return icons[entityType] || "circle";
    }
    
    // Analytics Data Methods
    getAnalyticsData(roleType) {
        try {
            const applications = Array.from(this.applications.values())
                .filter(app => {
                    const form = this.forms.get(app.formId);
                    return form && form.recruitmentType === roleType;
                });
            
            const forms = Array.from(this.forms.values())
                .filter(form => form.recruitmentType === roleType);
            
            // Calculate analytics
            const totalResponses = applications.length;
            const activeForms = forms.filter(form => form.settings.isActive).length;
            const responsesByForm = new Map();
            const responsesByDate = new Map();
            
            applications.forEach(app => {
                // Group by form
                const formId = app.formId;
                if (!responsesByForm.has(formId)) {
                    responsesByForm.set(formId, []);
                }
                responsesByForm.get(formId).push(app);
                
                // Group by date
                const date = new Date(app.submittedAt).toDateString();
                if (!responsesByDate.has(date)) {
                    responsesByDate.set(date, 0);
                }
                responsesByDate.set(date, responsesByDate.get(date) + 1);
            });
            
            // Calculate average response time (placeholder)
            const averageResponseTime = applications.length > 0 ? "2.5 days" : "N/A";
            
            return {
                totalResponses,
                activeForms,
                averageResponseTime,
                responsesByForm: Object.fromEntries(responsesByForm),
                responsesByDate: Object.fromEntries(responsesByDate),
                applications: applications,
                forms: forms
            };
            
        } catch (error) {
            console.error("Error getting analytics data:", error);
            return {
                totalResponses: 0,
                activeForms: 0,
                averageResponseTime: "N/A",
                responsesByForm: {},
                responsesByDate: {},
                applications: [],
                forms: []
            };
        }
    }

    // Forms Management Table Methods
    displayFormsTable() {
        const tableBody = document.getElementById("formsTableBody");
        if (!tableBody) return;

        const forms = Array.from(this.forms.values());
        
        if (forms.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <p>No recruitment forms found</p>
                    </td>
                </tr>
            `;
            return;
        }

        // Apply filters
        const searchTerm = document.getElementById("formsSearch")?.value.toLowerCase() || "";
        const categoryFilter = document.getElementById("categoryFilter")?.value || "";
        const statusFilter = document.getElementById("statusFilter")?.value || "";
        const roleFilter = document.getElementById("roleFilter")?.value || "";

        const filteredForms = forms.filter(form => {
            const matchesSearch = form.title.toLowerCase().includes(searchTerm) || 
                                form.description.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || form.entityType === categoryFilter;
            const matchesStatus = !statusFilter || this.getFormStatus(form) === statusFilter;
            const matchesRole = !roleFilter || form.recruitmentType === roleFilter;
            
            return matchesSearch && matchesCategory && matchesStatus && matchesRole;
        });

        tableBody.innerHTML = filteredForms.map(form => {
            const responses = this.getApplicationsByForm(form.id).length;
            const status = this.getFormStatus(form);
            const statusColor = this.getStatusColor(status);
            const createdDate = new Date(form.createdAt).toLocaleDateString();
            
            return `
                <tr style="border-bottom: 1px solid var(--border-secondary);">
                    <td style="padding: 1rem; color: var(--text-primary);">
                        <span class="category-badge" style="background: ${this.getCategoryColor(form.entityType)}20; color: ${this.getCategoryColor(form.entityType)}; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 600; text-transform: capitalize;">
                            ${form.entityType}
                        </span>
                    </td>
                    <td style="padding: 1rem; color: var(--text-primary); font-weight: 500;">${form.title}</td>
                    <td style="padding: 1rem; color: var(--text-secondary); font-size: 0.875rem;">${form.settings.bureau || "N/A"}</td>
                    <td style="padding: 1rem;">
                        <span class="status-badge" style="background: ${statusColor}20; color: ${statusColor}; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 600; text-transform: capitalize;">
                            ${status}
                        </span>
                    </td>
                    <td style="padding: 1rem; color: var(--text-secondary); font-size: 0.875rem; text-transform: capitalize;">${form.recruitmentType}</td>
                    <td style="padding: 1rem; color: var(--text-primary); font-weight: 500;">${responses}</td>
                    <td style="padding: 1rem; color: var(--text-secondary); font-size: 0.875rem;">${createdDate}</td>
                    <td style="padding: 1rem;">
                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick="viewFormDetails('${form.id}')" class="btn-icon" style="background: var(--primary-color)20; color: var(--primary-color); border: none; padding: 0.5rem; border-radius: 0.375rem; cursor: pointer; transition: all 0.2s;" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="editForm('${form.id}')" class="btn-icon" style="background: var(--warning-color)20; color: var(--warning-color); border: none; padding: 0.5rem; border-radius: 0.375rem; cursor: pointer; transition: all 0.2s;" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteForm('${form.id}')" class="btn-icon" style="background: var(--danger-color)20; color: var(--danger-color); border: none; padding: 0.5rem; border-radius: 0.375rem; cursor: pointer; transition: all 0.2s;" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    getFormStatus(form) {
        if (!form.settings.isActive) return "inactive";
        if (form.settings.deadline && new Date(form.settings.deadline) < new Date()) return "expired";
        return "active";
    }

    getStatusColor(status) {
        switch (status) {
            case "active": return "#10b981";
            case "inactive": return "#6b7280";
            case "expired": return "#ef4444";
            default: return "#6b7280";
        }
    }

    getCategoryColor(category) {
        switch (category) {
            case "project": return "#3b82f6";
            case "activity": return "#10b981";
            case "initiative": return "#8b5cf6";
            default: return "#6b7280";
        }
    }

    // Modern UI Methods for Entity Display
    displayEntityGrid(entityType) {
        const container = document.querySelector(`#${entityType}-content .entity-grid`);
        if (!container) return;

        // Mock data for demonstration - in real app, this would come from API
        const entities = this.getMockEntities(entityType);
        
        if (entities.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">
                        <i class="fas fa-${this.getEntityIcon(entityType)}"></i>
                    </div>
                    <h3>No ${entityType} found</h3>
                    <p>Create your first ${entityType.slice(0, -1)} to get started with recruitment.</p>
                    <button class="btn btn-primary" onclick="createNew${entityType.charAt(0).toUpperCase() + entityType.slice(1, -1)}()">
                        <i class="fas fa-plus"></i> Create ${entityType.charAt(0).toUpperCase() + entityType.slice(1, -1)}
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = entities.map(entity => `
            <div class="entity-card" data-entity-id="${entity.id}">
                <div class="entity-card-header">
                    <h3 class="entity-card-title">${entity.title}</h3>
                    <span class="entity-card-type">${entity.type || entityType.slice(0, -1)}</span>
                </div>
                <p class="entity-card-description">${entity.description}</p>
                <div class="entity-card-meta">
                    <div class="meta-item">
                        <i class="fas fa-users"></i>
                        <span>${entity.participants || 0} participants</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${entity.startDate ? new Date(entity.startDate).toLocaleDateString() : "TBD"}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-clipboard-list"></i>
                        <span>${this.getRecruitmentFormsByEntity(entityType.slice(0, -1), entity.id).length} forms</span>
                    </div>
                </div>
                <div class="entity-card-actions">
                    <button class="btn btn-sm btn-secondary" onclick="viewEntity('${entity.id}', '${entityType}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="createRecruitmentForm('${entityType.slice(0, -1)}', '${entity.id}')">
                        <i class="fas fa-user-plus"></i> Recruit
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editEntity('${entity.id}', '${entityType}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </div>
        `).join("");

        // Add entrance animations
        this.animateCards(container.querySelectorAll(".entity-card"));
    }

    getMockEntities(entityType) {
        // Mock data - replace with actual API calls
        const mockData = {
            projects: [
                {
                    id: "proj_1",
                    title: "Digital Innovation Summit 2024",
                    description: "A comprehensive summit focusing on emerging technologies and digital transformation strategies.",
                    type: "Conference",
                    participants: 150,
                    startDate: "2024-06-15"
                },
                {
                    id: "proj_2",
                    title: "Community Outreach Program",
                    description: "Engaging with local communities to promote education and technology awareness.",
                    type: "Outreach",
                    participants: 75,
                    startDate: "2024-05-20"
                },
                {
                    id: "proj_3",
                    title: "Research & Development Initiative",
                    description: "Collaborative research project focusing on sustainable technology solutions.",
                    type: "Research",
                    participants: 25,
                    startDate: "2024-07-01"
                }
            ],
            activities: [
                {
                    id: "act_1",
                    title: "Tech Workshop Series",
                    description: "Weekly workshops covering various programming languages and frameworks.",
                    type: "Workshop",
                    participants: 40,
                    startDate: "2024-04-10"
                },
                {
                    id: "act_2",
                    title: "Networking Mixer",
                    description: "Monthly networking events for professionals in the tech industry.",
                    type: "Networking",
                    participants: 80,
                    startDate: "2024-04-25"
                }
            ],
            initiatives: [
                {
                    id: "init_1",
                    title: "Green Tech Initiative",
                    description: "Promoting environmentally sustainable technology practices and solutions.",
                    type: "Sustainability",
                    participants: 30,
                    startDate: "2024-05-01"
                },
                {
                    id: "init_2",
                    title: "Youth Mentorship Program",
                    description: "Connecting experienced professionals with young aspiring technologists.",
                    type: "Mentorship",
                    participants: 60,
                    startDate: "2024-06-01"
                }
            ]
        };
        return mockData[entityType] || [];
    }



    updateRecruitmentStats() {
        const stats = {
            totalForms: this.forms.size,
            activeForms: Array.from(this.forms.values()).filter(f => f.settings.isActive).length,
            totalApplications: this.applications.size,
            pendingApplications: Array.from(this.applications.values()).filter(a => a.status === "pending").length
        };

        // Update stat cards
        this.updateStatCard("total-forms", stats.totalForms, "Total Forms");
        this.updateStatCard("active-forms", stats.activeForms, "Active Forms");
        this.updateStatCard("total-applications", stats.totalApplications, "Applications");
        this.updateStatCard("pending-applications", stats.pendingApplications, "Pending Review");
    }

    updateStatCard(id, value, label) {
        const card = document.querySelector(`[data-stat="${id}"]`);
        if (card) {
            const numberEl = card.querySelector(".stat-number");
            const labelEl = card.querySelector(".stat-label");
            if (numberEl) {
                this.animateNumber(numberEl, parseInt(numberEl.textContent) || 0, value);
            }
            if (labelEl) labelEl.textContent = label;
        }
    }

    animateNumber(element, from, to) {
        const duration = 1000;
        const start = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(from + (to - from) * this.easeOutCubic(progress));
            element.textContent = current;
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    animateCards(cards) {
        cards.forEach((card, index) => {
            card.style.opacity = "0";
            card.style.transform = "translateY(20px)";
            setTimeout(() => {
                card.style.transition = "opacity 0.6s ease, transform 0.6s ease";
                card.style.opacity = "1";
                card.style.transform = "translateY(0)";
            }, index * 100);
        });
    }

    // Enhanced search and filtering
    setupAdvancedFilters() {
        const searchInput = document.getElementById("formsSearch");
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener("input", (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.applyFilters();
                }, 300);
            });
        }

        // Add filter change listeners
        ["categoryFilter", "statusFilter", "roleFilter"].forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener("change", () => this.applyFilters());
            }
        });
    }

    applyFilters() {
        this.displayFormsTable();
        // Add visual feedback
        const tableContainer = document.querySelector(".data-table-container");
        if (tableContainer) {
            tableContainer.style.opacity = "0.7";
            setTimeout(() => {
                tableContainer.style.opacity = "1";
            }, 200);
        }
    }
}

// Global functions for forms management table
function refreshFormsTable() {
    if (window.recruitmentManager) {
        window.recruitmentManager.displayFormsTable();
    }
}

function viewFormDetails(formId) {
    if (window.recruitmentManager) {
        const form = window.recruitmentManager.forms.get(formId);
        if (form) {
            // Get form status and other details
            const status = window.recruitmentManager.getFormStatus(form);
            const responses = window.recruitmentManager.getApplicationsByForm(formId).length;
            
            // Navigate to response.html with all necessary parameters
            const responseUrl = `response.html?formId=${formId}&name=${encodeURIComponent(form.title)}&category=${form.entityType}&bureau=${encodeURIComponent(form.settings.bureau || 'Unknown')}&role=${form.recruitmentType}&status=${status}&responses=${responses}`;
            window.open(responseUrl, "_blank");
        }
    }
}

function editForm(formId) {
    if (window.recruitmentManager) {
        const form = window.recruitmentManager.forms.get(formId);
        if (form) {
            // Open form builder in edit mode
            console.log("Editing form:", form);
            
            // Use the existing form builder infrastructure
            if (window.recruitmentManager.openFormBuilder) {
                // Pass the form data for editing
                window.recruitmentManager.openFormBuilder(form.entityType, form.entityId, form);
            } else if (window.formBuilder) {
                // Fallback to direct form builder usage
                window.formBuilder.editForm(form);
            } else {
                // Create a simple edit modal if form builder is not available
                showFormEditModal(form);
            }
        }
    }
}

// Simple form edit modal as fallback
function showFormEditModal(form) {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    modalContent.style.cssText = `
        background: var(--card-bg, white);
        padding: 2rem;
        border-radius: 1rem;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;
    
    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2 style="margin: 0; color: var(--text-primary, #333);">Edit Form: ${form.title}</h2>
            <button class="close-btn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary, #666);">&times;</button>
        </div>
        
        <form id="editFormForm">
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-primary, #333);">Form Title:</label>
                <input type="text" id="editFormTitle" value="${form.title}" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-secondary, #ddd); border-radius: 0.5rem; font-size: 1rem;">
            </div>
            
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-primary, #333);">Description:</label>
                <textarea id="editFormDescription" rows="3" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-secondary, #ddd); border-radius: 0.5rem; font-size: 1rem; resize: vertical;">${form.description || ""}</textarea>
            </div>
            
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-primary, #333);">Status:</label>
                <select id="editFormStatus" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-secondary, #ddd); border-radius: 0.5rem; font-size: 1rem;">
                    <option value="draft" ${form.status === "draft" ? "selected" : ""}>Draft</option>
                    <option value="active" ${form.status === "active" ? "selected" : ""}>Active</option>
                    <option value="closed" ${form.status === "closed" ? "selected" : ""}>Closed</option>
                    <option value="archived" ${form.status === "archived" ? "selected" : ""}>Archived</option>
                </select>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-primary, #333);">Recruitment Type:</label>
                <select id="editFormRecruitmentType" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-secondary, #ddd); border-radius: 0.5rem; font-size: 1rem;">
                    <option value="crew" ${form.recruitmentType === "crew" ? "selected" : ""}>Crew</option>
                    <option value="volunteer" ${form.recruitmentType === "volunteer" ? "selected" : ""}>Volunteer</option>
                    <option value="participant" ${form.recruitmentType === "participant" ? "selected" : ""}>Participant</option>
                </select>
            </div>
            
            <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button type="button" class="cancel-btn" style="padding: 0.75rem 1.5rem; border: 1px solid var(--border-secondary, #ddd); background: transparent; color: var(--text-secondary, #666); border-radius: 0.5rem; cursor: pointer; font-size: 1rem;">Cancel</button>
                <button type="submit" style="padding: 0.75rem 1.5rem; background: var(--primary-color, #007bff); color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 1rem; font-weight: 600;">Save Changes</button>
            </div>
        </form>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Event listeners
    const closeBtn = modalContent.querySelector(".close-btn");
    const cancelBtn = modalContent.querySelector(".cancel-btn");
    const editFormElement = modalContent.querySelector("#editFormForm");
    
    const closeModal = () => {
        document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });
    
    editFormElement.addEventListener("submit", (e) => {
        e.preventDefault();
        
        // Update form data
        const updatedForm = {
            ...form,
            title: document.getElementById("editFormTitle").value,
            description: document.getElementById("editFormDescription").value,
            status: document.getElementById("editFormStatus").value,
            recruitmentType: document.getElementById("editFormRecruitmentType").value,
            updatedAt: new Date().toISOString()
        };
        
        // Update in the forms map
        window.recruitmentManager.forms.set(form.id, updatedForm);
        
        // Refresh the forms table
        window.recruitmentManager.displayFormsTable();
        
        // Show success message
        alert("Form updated successfully!");
        
        closeModal();
    });
}

function deleteForm(formId) {
    if (window.recruitmentManager) {
        const form = window.recruitmentManager.forms.get(formId);
        if (form) {
            // Show enhanced confirmation dialog
            showDeleteConfirmationModal(form, formId);
        }
    }
}

// Enhanced delete confirmation modal
function showDeleteConfirmationModal(form, formId) {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    modalContent.style.cssText = `
        background: var(--card-bg, white);
        padding: 2rem;
        border-radius: 1rem;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        text-align: center;
    `;
    
    const responseCount = form.responses ? form.responses.length : 0;
    const hasResponses = responseCount > 0;
    
    modalContent.innerHTML = `
        <div style="margin-bottom: 1.5rem;">
            <div style="width: 60px; height: 60px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                <i class="fas fa-exclamation-triangle" style="color: #dc2626; font-size: 1.5rem;"></i>
            </div>
            <h2 style="margin: 0 0 0.5rem 0; color: var(--text-primary, #333); font-size: 1.5rem;">Delete Form</h2>
            <p style="color: var(--text-secondary, #666); margin: 0; font-size: 1rem;">This action cannot be undone</p>
        </div>
        
        <div style="background: var(--bg-secondary, #f8f9fa); padding: 1.5rem; border-radius: 0.75rem; margin-bottom: 1.5rem; text-align: left;">
            <h3 style="margin: 0 0 1rem 0; color: var(--text-primary, #333); font-size: 1.1rem;">Form Details:</h3>
            <div style="display: grid; gap: 0.5rem; font-size: 0.9rem;">
                <div><strong>Title:</strong> ${form.title}</div>
                <div><strong>Category:</strong> ${form.entityType || "Unknown"}</div>
                <div><strong>Status:</strong> <span style="color: ${getStatusColor(form.status)};">${form.status || "Draft"}</span></div>
                <div><strong>Recruitment Type:</strong> ${form.recruitmentType || "Unknown"}</div>
                <div><strong>Responses:</strong> <span style="color: ${hasResponses ? "#dc2626" : "#10b981"};">${responseCount} response${responseCount !== 1 ? "s" : ""}</span></div>
                <div><strong>Created:</strong> ${form.createdAt ? new Date(form.createdAt).toLocaleDateString() : "Unknown"}</div>
            </div>
        </div>
        
        ${hasResponses ? `
            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem; color: #dc2626; font-weight: 600; margin-bottom: 0.5rem;">
                    <i class="fas fa-exclamation-circle"></i>
                    Warning: This form has responses
                </div>
                <p style="margin: 0; color: #991b1b; font-size: 0.9rem;">Deleting this form will permanently remove all ${responseCount} response${responseCount !== 1 ? "s" : ""} and associated data.</p>
            </div>
        ` : ""}
        
        <div style="margin-bottom: 1.5rem;">
            <label style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer; color: var(--text-secondary, #666);">
                <input type="checkbox" id="confirmDelete" style="margin: 0;">
                <span>I understand that this action cannot be undone</span>
            </label>
        </div>
        
        <div style="display: flex; gap: 1rem; justify-content: center;">
            <button type="button" class="cancel-btn" style="padding: 0.75rem 1.5rem; border: 1px solid var(--border-secondary, #ddd); background: transparent; color: var(--text-secondary, #666); border-radius: 0.5rem; cursor: pointer; font-size: 1rem;">Cancel</button>
            <button type="button" class="delete-btn" disabled style="padding: 0.75rem 1.5rem; background: #dc2626; color: white; border: none; border-radius: 0.5rem; cursor: not-allowed; font-size: 1rem; font-weight: 600; opacity: 0.5;">Delete Form</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Event listeners
    const cancelBtn = modalContent.querySelector(".cancel-btn");
    const deleteBtn = modalContent.querySelector(".delete-btn");
    const confirmCheckbox = modalContent.querySelector("#confirmDelete");
    
    const closeModal = () => {
        document.body.removeChild(modal);
    };
    
    // Enable/disable delete button based on checkbox
    confirmCheckbox.addEventListener("change", () => {
        if (confirmCheckbox.checked) {
            deleteBtn.disabled = false;
            deleteBtn.style.cursor = "pointer";
            deleteBtn.style.opacity = "1";
        } else {
            deleteBtn.disabled = true;
            deleteBtn.style.cursor = "not-allowed";
            deleteBtn.style.opacity = "0.5";
        }
    });
    
    cancelBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });
    
    deleteBtn.addEventListener("click", () => {
        if (!confirmCheckbox.checked) return;
        
        try {
            // Delete the form
            window.recruitmentManager.forms.delete(formId);
            
            // Refresh the forms table
            window.recruitmentManager.displayFormsTable();
            
            // Show success message
            showSuccessMessage(`Form "${form.title}" has been deleted successfully.`);
            
            console.log("Form deleted:", formId);
            closeModal();
        } catch (error) {
            console.error("Error deleting form:", error);
            showErrorMessage("Failed to delete form. Please try again.");
        }
    });
}

// Helper function to get status color
function getStatusColor(status) {
    switch (status) {
        case "active": return "#10b981";
        case "draft": return "#f59e0b";
        case "closed": return "#6b7280";
        case "archived": return "#9ca3af";
        default: return "#6b7280";
    }
}

// Helper functions for success/error messages
function showSuccessMessage(message) {
    const toast = createToast(message, "success");
    document.body.appendChild(toast);
    setTimeout(() => {
        if (document.body.contains(toast)) {
            document.body.removeChild(toast);
        }
    }, 3000);
}

function showErrorMessage(message) {
    const toast = createToast(message, "error");
    document.body.appendChild(toast);
    setTimeout(() => {
        if (document.body.contains(toast)) {
            document.body.removeChild(toast);
        }
    }, 4000);
}

function createToast(message, type) {
    const toast = document.createElement("div");
    toast.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${type === "success" ? "#10b981" : "#dc2626"};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 10001;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    `;
    
    toast.innerHTML = `
        <i class="fas fa-${type === "success" ? "check-circle" : "exclamation-circle"}"></i>
        ${message}
    `;
    
    // Add animation styles
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
    `;
    document.head.appendChild(style);
    
    return toast;
}

// Initialize forms table when page loads
document.addEventListener("DOMContentLoaded", function() {
    // Add event listeners for search and filters
    const formsSearch = document.getElementById("formsSearch");
    const categoryFilter = document.getElementById("categoryFilter");
    const statusFilter = document.getElementById("statusFilter");
    const roleFilter = document.getElementById("roleFilter");
    
    if (formsSearch) {
        formsSearch.addEventListener("input", refreshFormsTable);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener("change", refreshFormsTable);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener("change", refreshFormsTable);
    }
    
    if (roleFilter) {
        roleFilter.addEventListener("change", refreshFormsTable);
    }
    
    // Initial load of forms table
    setTimeout(() => {
        if (window.recruitmentManager) {
            refreshFormsTable();
        }
    }, 1000);
});

// RecruitmentManager class is available globally
// Initialization is handled by admin.js

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = RecruitmentManager;
}