const getMongoose = require("../utils/mongooseHelper");
const mongoose = getMongoose();

// Helper function to create bilingual field with validation
const createBilingualField = (maxLength, fieldName) => ({
    en: {
        type: String,
        required: [true, `English ${fieldName} is required`],
        trim: true,
        maxlength: [maxLength, `English ${fieldName} cannot exceed ${maxLength} characters`]
    },
    ta: {
        type: String,
        required: [true, `Tamil ${fieldName} is required`],
        trim: true,
        maxlength: [maxLength, `Tamil ${fieldName} cannot exceed ${maxLength} characters`]
    }
});

// Helper function for optional bilingual field
const createOptionalBilingualField = (maxLength, fieldName) => ({
    en: {
        type: String,
        trim: true,
        maxlength: [maxLength, `English ${fieldName} cannot exceed ${maxLength} characters`]
    },
    ta: {
        type: String,
        trim: true,
        maxlength: [maxLength, `Tamil ${fieldName} cannot exceed ${maxLength} characters`]
    }
});

const TeamSchema = new mongoose.Schema({
    name: createBilingualField(100, "name"),
    position: {
        type: String,
        required: [true, "Please add a position"],
        enum: ["president", "vice-president", "treasurer", "secretary", "executive", "auditor"],
        lowercase: true
    },
    department: {
        type: String,
        trim: true,
        maxlength: [100, "Department cannot be more than 100 characters"]
    },
    bio: createOptionalBilingualField(500, "bio"),
    profilePicture: {
        type: String,
        default: "/assets/default-avatar.jpg"
    },
    photo: {
        type: String,
        default: "/assets/default-avatar.jpg"
    },
    email: {
        type: String,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Please add a valid email"
        ]
    },
    phone: {
        type: String,
        maxlength: [20, "Phone number cannot be more than 20 characters"]
    },
    order: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },
    socialLinks: {
        linkedin: String,
        twitter: String,
        facebook: String
    },
    joinDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create index for position and order for efficient querying
TeamSchema.index({ position: 1, order: 1 });

// Static method to get hierarchy order
TeamSchema.statics.getHierarchyOrder = function() {
    return {
        "president": 1,
        "vice-president": 2,
        "treasurer": 3,
        "secretary": 4,
        "executive": 5,
        "auditor": 6
    };
};

// Instance method to get position display name
TeamSchema.methods.getPositionDisplayName = function() {
    const displayNames = {
        "president": "President",
        "vice-president": "Vice President",
        "treasurer": "Treasurer",
        "secretary": "Secretary",
        "executive": "Executive Committee Member",
        "auditor": "Auditor"
    };
    return displayNames[this.position] || this.position;
};

// Pre-save validation for bilingual content
TeamSchema.pre('save', function(next) {
    const validation = this.constructor.validateBilingualContent(this);
    if (!validation.isValid) {
        return next(new Error(`Bilingual validation failed: ${validation.errors.join(', ')}`));
    }
    next();
});

// Static method to validate bilingual content
TeamSchema.statics.validateBilingualContent = function(doc) {
    const errors = [];
    const requiredFields = ['name'];
    
    for (const field of requiredFields) {
        if (!doc[field] || typeof doc[field] !== 'object') {
            errors.push(`${field} must be an object with en and ta properties`);
            continue;
        }
        
        if (!doc[field].en || !doc[field].en.trim()) {
            errors.push(`English ${field} is required`);
        }
        
        if (!doc[field].ta || !doc[field].ta.trim()) {
            errors.push(`Tamil ${field} is required`);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
};

module.exports = mongoose.model("Team", TeamSchema);