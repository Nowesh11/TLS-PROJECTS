const getMongoose = require("../utils/mongooseHelper");
const mongoose = getMongoose();

const formFieldSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["text", "email", "tel", "number", "textarea", "select", "radio", "checkbox", "date", "time", "file", "url"],
        required: true
    },
    name: {
        type: String,
        required: true
    },
    label: {
        type: String,
        required: true
    },
    placeholder: {
        type: String,
        default: ""
    },
    required: {
        type: Boolean,
        default: false
    },
    validation: {
        minLength: Number,
        maxLength: Number,
        min: Number,
        max: Number,
        pattern: String,
        customMessage: String
    },
    options: [{
        value: String,
        label: String,
        selected: {
            type: Boolean,
            default: false
        }
    }],
    conditionalLogic: {
        dependsOn: String, // field name
        condition: String, // 'equals', 'not_equals', 'contains', 'greater_than', 'less_than'
        value: mongoose.Schema.Types.Mixed,
        action: {
            type: String,
            enum: ["show", "hide", "require", "optional"],
            default: "show"
        }
    },
    order: {
        type: Number,
        default: 0
    },
    width: {
        type: String,
        enum: ["full", "half", "third", "quarter"],
        default: "full"
    },
    helpText: String,
    defaultValue: mongoose.Schema.Types.Mixed
});

const formConfigurationSchema = new mongoose.Schema({
    // Associated item information
    itemType: {
        type: String,
        enum: ["project", "activity", "initiative"],
        required: true
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "itemType" // Dynamic reference based on itemType
    },
    
    // Form configuration
    title: {
        type: String,
        required: true,
        default: "Join Form"
    },
    description: {
        type: String,
        default: ""
    },
    
    // Form types this configuration applies to
    formTypes: [{
        type: String,
        enum: ["participant", "volunteer", "crew"],
        required: true
    }],
    
    // Form fields
    fields: [formFieldSchema],
    
    // Submit button configuration
    submitButton: {
        text: {
            type: String,
            default: "Submit"
        },
        color: {
            type: String,
            default: "primary"
        }
    },
    
    // Form settings
    settings: {
        allowMultipleSubmissions: {
            type: Boolean,
            default: false
        },
        requireAuthentication: {
            type: Boolean,
            default: false
        },
        sendConfirmationEmail: {
            type: Boolean,
            default: true
        },
        autoApprove: {
            type: Boolean,
            default: false
        },
        maxSubmissions: {
            type: Number,
            default: null // null means unlimited
        },
        submissionDeadline: Date,
        thankYouMessage: {
            type: String,
            default: "Thank you for your submission! We will contact you soon."
        }
    },
    
    // Styling
    styling: {
        theme: {
            type: String,
            enum: ["default", "modern", "minimal", "colorful"],
            default: "default"
        },
        primaryColor: {
            type: String,
            default: "#007bff"
        },
        backgroundColor: {
            type: String,
            default: "#ffffff"
        }
    },
    
    // Admin information
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    
    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Analytics
    submissionCount: {
        type: Number,
        default: 0
    },
    lastSubmissionAt: Date
}, {
    timestamps: true
});

// Indexes
formConfigurationSchema.index({ itemType: 1, itemId: 1 });
formConfigurationSchema.index({ createdBy: 1 });
formConfigurationSchema.index({ isActive: 1 });

// Virtual for getting the associated item
formConfigurationSchema.virtual("item", {
    refPath: "itemType",
    localField: "itemId",
    foreignField: "_id",
    justOne: true
});

// Method to increment submission count
formConfigurationSchema.methods.incrementSubmissionCount = function() {
    this.submissionCount += 1;
    this.lastSubmissionAt = new Date();
    return this.save();
};

// Method to validate form data against configuration
formConfigurationSchema.methods.validateFormData = function(formData) {
    const errors = [];
    
    this.fields.forEach(field => {
        const value = formData[field.name];
        
        // Check required fields
        if (field.required && (!value || value.toString().trim() === "")) {
            errors.push(`${field.label} is required`);
            return;
        }
        
        // Skip validation if field is empty and not required
        if (!value || value.toString().trim() === "") {
            return;
        }
        
        // Type-specific validation
        switch (field.type) {
            case "email":
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    errors.push(`${field.label} must be a valid email address`);
                }
                break;
                
            case "tel":
                const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
                if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ""))) {
                    errors.push(`${field.label} must be a valid phone number`);
                }
                break;
                
            case "number":
                if (isNaN(value)) {
                    errors.push(`${field.label} must be a valid number`);
                } else {
                    const numValue = parseFloat(value);
                    if (field.validation?.min !== undefined && numValue < field.validation.min) {
                        errors.push(`${field.label} must be at least ${field.validation.min}`);
                    }
                    if (field.validation?.max !== undefined && numValue > field.validation.max) {
                        errors.push(`${field.label} must be at most ${field.validation.max}`);
                    }
                }
                break;
                
            case "url":
                try {
                    new URL(value);
                } catch {
                    errors.push(`${field.label} must be a valid URL`);
                }
                break;
        }
        
        // Length validation
        if (field.validation?.minLength && value.length < field.validation.minLength) {
            errors.push(`${field.label} must be at least ${field.validation.minLength} characters`);
        }
        if (field.validation?.maxLength && value.length > field.validation.maxLength) {
            errors.push(`${field.label} must be at most ${field.validation.maxLength} characters`);
        }
        
        // Pattern validation
        if (field.validation?.pattern) {
            const regex = new RegExp(field.validation.pattern);
            if (!regex.test(value)) {
                errors.push(field.validation.customMessage || `${field.label} format is invalid`);
            }
        }
    });
    
    return errors;
};

module.exports = mongoose.model("FormConfiguration", formConfigurationSchema);