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

const TeamMemberSchema = new mongoose.Schema({
    name: createBilingualField(100, "name"),
    role: {
        type: String,
        required: [true, "Role is required"],
        enum: [
            "President",
            "Vice President", 
            "Secretary",
            "Treasurer",
            "Executive Committee - Media & Public Relations",
            "Executive Committee - Sports & Leadership",
            "Executive Committee - Education & Intellectual",
            "Executive Committee - Arts & Culture",
            "Executive Committee - Social Welfare & Voluntary",
            "Executive Committee - Language & Literature",
            "Auditor"
        ]
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    bio: createOptionalBilingualField(2000, "bio"),
    email: {
        type: String,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Please add a valid email"
        ],
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        maxlength: [20, "Phone number cannot be more than 20 characters"],
        trim: true
    },
    social_links: {
        linkedin: {
            type: String,
            trim: true
        },
        twitter: {
            type: String,
            trim: true
        },
        facebook: {
            type: String,
            trim: true
        },
        instagram: {
            type: String,
            trim: true
        },
        website: {
            type: String,
            trim: true
        }
    },
    order_num: {
        type: Number,
        default: 0,
        min: [0, "Order number cannot be negative"]
    },
    is_active: {
        type: Boolean,
        default: true
    },
    image_path: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Create indexes for efficient querying
TeamMemberSchema.index({ is_active: 1, order_num: 1 });
TeamMemberSchema.index({ slug: 1 });
TeamMemberSchema.index({ role: 1 });

// Pre-save middleware to generate slug from name_en
TeamMemberSchema.pre('save', function(next) {
    if (this.isModified('name_en') && this.name_en) {
        // Generate slug from English name
        this.slug = this.name_en
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .trim();
    }
    next();
});

// Static method to get role hierarchy order
TeamMemberSchema.statics.getRoleHierarchy = function() {
    return {
        "President": 1,
        "Vice President": 2,
        "Secretary": 3,
        "Treasurer": 4,
        "Executive Committee Member": 5,
        "Auditor": 6,
        "Advisor": 7,
        "Coordinator": 8,
        "Volunteer": 9,
        "Other": 10
    };
};

// Instance method to get full name based on locale
TeamMemberSchema.methods.getFullName = function(locale = 'en') {
    if (locale === 'ta' && this.name_ta) {
        return this.name_ta;
    }
    return this.name_en;
};

// Instance method to get bio based on locale
TeamMemberSchema.methods.getBio = function(locale = 'en') {
    if (locale === 'ta' && this.bio_ta) {
        return this.bio_ta;
    }
    return this.bio_en || '';
};

// Instance method to get image URL
TeamMemberSchema.methods.getImageUrl = function() {
    if (this.image_path) {
        return `/uploads/team_members/${this.image_path}`;
    }
    return '/assets/default-avatar.jpg';
};

module.exports = mongoose.model("TeamMember", TeamMemberSchema);