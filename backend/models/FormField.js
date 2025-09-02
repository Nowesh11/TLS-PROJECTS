const mongoose = require('mongoose');

const FormFieldSchema = new mongoose.Schema({
    form_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'Form',
        required: true
    },
    label_en: {
        type: String,
        required: [true, 'Please add English label'],
        trim: true,
        maxlength: [200, 'Label cannot be more than 200 characters']
    },
    label_ta: {
        type: String,
        trim: true,
        maxlength: [200, 'Tamil label cannot be more than 200 characters']
    },
    field_type: {
        type: String,
        required: [true, 'Please specify field type'],
        enum: [
            'text',
            'textarea', 
            'radio',
            'checkbox',
            'select',
            'date',
            'file',
            'number',
            'email',
            'phone',
            'url'
        ]
    },
    options: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
        validate: {
            validator: function(value) {
                // Options are required for radio, checkbox, and select fields
                if (['radio', 'checkbox', 'select'].includes(this.field_type)) {
                    return value && Array.isArray(value) && value.length > 0;
                }
                return true;
            },
            message: 'Options are required for radio, checkbox, and select fields'
        }
    },
    is_required: {
        type: Boolean,
        default: false
    },
    order_num: {
        type: Number,
        required: true,
        min: 0
    },
    placeholder_en: {
        type: String,
        trim: true,
        maxlength: [200, 'Placeholder cannot be more than 200 characters']
    },
    placeholder_ta: {
        type: String,
        trim: true,
        maxlength: [200, 'Tamil placeholder cannot be more than 200 characters']
    },
    help_text_en: {
        type: String,
        trim: true,
        maxlength: [500, 'Help text cannot be more than 500 characters']
    },
    help_text_ta: {
        type: String,
        trim: true,
        maxlength: [500, 'Tamil help text cannot be more than 500 characters']
    },
    validation_rules: {
        min_length: {
            type: Number,
            min: 0
        },
        max_length: {
            type: Number,
            min: 0
        },
        min_value: {
            type: Number
        },
        max_value: {
            type: Number
        },
        pattern: {
            type: String
        },
        file_types: [{
            type: String
        }],
        max_file_size: {
            type: Number, // in bytes
            default: 5000000 // 5MB default
        }
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Update timestamp on save
FormFieldSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

// Validate options format for choice fields
FormFieldSchema.pre('save', function(next) {
    if (['radio', 'checkbox', 'select'].includes(this.field_type) && this.options) {
        // Ensure options is an array of objects with value and label
        const isValidOptions = this.options.every(option => 
            typeof option === 'object' && 
            option.value !== undefined && 
            option.label_en !== undefined
        );
        
        if (!isValidOptions) {
            next(new Error('Options must be an array of objects with value, label_en, and optionally label_ta'));
        }
    }
    next();
});

// Validate validation rules
FormFieldSchema.pre('save', function(next) {
    if (this.validation_rules) {
        // Check min/max length for text fields
        if (this.validation_rules.min_length && this.validation_rules.max_length) {
            if (this.validation_rules.min_length > this.validation_rules.max_length) {
                next(new Error('Minimum length cannot be greater than maximum length'));
            }
        }
        
        // Check min/max value for number fields
        if (this.validation_rules.min_value && this.validation_rules.max_value) {
            if (this.validation_rules.min_value > this.validation_rules.max_value) {
                next(new Error('Minimum value cannot be greater than maximum value'));
            }
        }
    }
    next();
});

// Virtual for getting label based on language
FormFieldSchema.virtual('label').get(function() {
    return {
        en: this.label_en,
        ta: this.label_ta || this.label_en
    };
});

// Virtual for getting placeholder based on language
FormFieldSchema.virtual('placeholder').get(function() {
    return {
        en: this.placeholder_en,
        ta: this.placeholder_ta || this.placeholder_en
    };
});

// Virtual for getting help text based on language
FormFieldSchema.virtual('help_text').get(function() {
    return {
        en: this.help_text_en,
        ta: this.help_text_ta || this.help_text_en
    };
});

// Index for better query performance
FormFieldSchema.index({ form_id: 1, order_num: 1 });
FormFieldSchema.index({ form_id: 1 });

module.exports = mongoose.model('FormField', FormFieldSchema);