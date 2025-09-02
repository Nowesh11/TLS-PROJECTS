const mongoose = require('mongoose');
const crypto = require('crypto');

const FormResponseSchema = new mongoose.Schema({
    form_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'Form',
        required: true
    },
    reference_number: {
        type: String,
        unique: true
    },
    user_name: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    user_email: {
        type: String,
        required: [true, 'Please provide your email'],
        trim: true,
        lowercase: true,
        match: [
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Please provide a valid email address'
        ]
    },
    user_phone: {
        type: String,
        trim: true,
        match: [
            /^[\+]?[1-9][\d]{0,15}$/,
            'Please provide a valid phone number'
        ]
    },
    response_json: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        validate: {
            validator: function(value) {
                return typeof value === 'object' && value !== null;
            },
            message: 'Response data must be a valid object'
        }
    },
    uploaded_files: [{
        field_id: {
            type: mongoose.Schema.ObjectId,
            ref: 'FormField',
            required: true
        },
        original_name: {
            type: String,
            required: true
        },
        file_name: {
            type: String,
            required: true
        },
        file_path: {
            type: String,
            required: true
        },
        file_size: {
            type: Number,
            required: true
        },
        mime_type: {
            type: String,
            required: true
        },
        uploaded_at: {
            type: Date,
            default: Date.now
        }
    }],
    submitted_at: {
        type: Date,
        default: Date.now
    },
    ip_address: {
        type: String,
        required: true
    },
    user_agent: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'approved', 'rejected'],
        default: 'pending'
    },
    admin_notes: {
        type: String,
        maxlength: [1000, 'Admin notes cannot be more than 1000 characters']
    },
    reviewed_by: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    reviewed_at: {
        type: Date
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Generate unique reference number before saving
FormResponseSchema.pre('save', function(next) {
    if (!this.reference_number) {
        // Generate reference number: FORM-YYYYMMDD-XXXXXX
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomString = crypto.randomBytes(3).toString('hex').toUpperCase();
        this.reference_number = `FORM-${date}-${randomString}`;
    }
    next();
});

// Virtual to populate form details
FormResponseSchema.virtual('form', {
    ref: 'Form',
    localField: 'form_id',
    foreignField: '_id',
    justOne: true
});

// Virtual to get file URLs
FormResponseSchema.virtual('file_urls').get(function() {
    return this.uploaded_files.map(file => ({
        field_id: file.field_id,
        original_name: file.original_name,
        url: `/uploads/forms/${this.form_id}/${file.file_name}`,
        file_size: file.file_size,
        mime_type: file.mime_type,
        uploaded_at: file.uploaded_at
    }));
});

// Method to get response data with file URLs
FormResponseSchema.methods.getResponseWithFiles = function() {
    const response = { ...this.response_json };
    
    // Replace file field values with file URLs
    this.uploaded_files.forEach(file => {
        const fieldId = file.field_id.toString();
        if (response[fieldId]) {
            response[fieldId] = {
                original_name: file.original_name,
                url: `/uploads/forms/${this.form_id}/${file.file_name}`,
                file_size: file.file_size,
                mime_type: file.mime_type
            };
        }
    });
    
    return response;
};

// Method to validate response against form fields
FormResponseSchema.methods.validateResponse = async function() {
    const FormField = mongoose.model('FormField');
    const fields = await FormField.find({ form_id: this.form_id }).sort({ order_num: 1 });
    
    const errors = [];
    const response = this.response_json;
    
    for (const field of fields) {
        const fieldId = field._id.toString();
        const value = response[fieldId];
        
        // Check required fields
        if (field.is_required && (!value || (typeof value === 'string' && value.trim() === ''))) {
            errors.push(`${field.label_en} is required`);
            continue;
        }
        
        // Skip validation if field is empty and not required
        if (!value) continue;
        
        // Validate based on field type
        switch (field.field_type) {
            case 'email':
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!emailRegex.test(value)) {
                    errors.push(`${field.label_en} must be a valid email address`);
                }
                break;
                
            case 'phone':
                const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
                if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                    errors.push(`${field.label_en} must be a valid phone number`);
                }
                break;
                
            case 'url':
                try {
                    new URL(value);
                } catch {
                    errors.push(`${field.label_en} must be a valid URL`);
                }
                break;
                
            case 'number':
                if (isNaN(value)) {
                    errors.push(`${field.label_en} must be a valid number`);
                } else {
                    const numValue = parseFloat(value);
                    if (field.validation_rules?.min_value && numValue < field.validation_rules.min_value) {
                        errors.push(`${field.label_en} must be at least ${field.validation_rules.min_value}`);
                    }
                    if (field.validation_rules?.max_value && numValue > field.validation_rules.max_value) {
                        errors.push(`${field.label_en} must be at most ${field.validation_rules.max_value}`);
                    }
                }
                break;
                
            case 'text':
            case 'textarea':
                if (field.validation_rules?.min_length && value.length < field.validation_rules.min_length) {
                    errors.push(`${field.label_en} must be at least ${field.validation_rules.min_length} characters`);
                }
                if (field.validation_rules?.max_length && value.length > field.validation_rules.max_length) {
                    errors.push(`${field.label_en} must be at most ${field.validation_rules.max_length} characters`);
                }
                if (field.validation_rules?.pattern) {
                    const regex = new RegExp(field.validation_rules.pattern);
                    if (!regex.test(value)) {
                        errors.push(`${field.label_en} format is invalid`);
                    }
                }
                break;
        }
    }
    
    return errors;
};

// Index for better query performance
FormResponseSchema.index({ form_id: 1, submitted_at: -1 });
FormResponseSchema.index({ reference_number: 1 });
FormResponseSchema.index({ user_email: 1 });
FormResponseSchema.index({ status: 1 });
FormResponseSchema.index({ submitted_at: -1 });

module.exports = mongoose.model('FormResponse', FormResponseSchema);