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

const activitySchema = new mongoose.Schema({
    title: createBilingualField(200, "title"),
    slug: {
        type: String,
        required: [true, "Slug is required"],
        unique: true,
        trim: true,
        lowercase: true,
        maxlength: [100, "Slug cannot exceed 100 characters"]
    },
    bureau: {
        type: String,
        required: [true, "Bureau is required"],
        enum: [
            "media-public-relations",
            "sports-leadership", 
            "education-intellectual",
            "arts-culture",
            "social-welfare-voluntary",
            "language-literature"
        ]
    },
    description: createBilingualField(3000, "description"),
    director: createBilingualField(100, "director"),
    director_name: {
        type: String,
        required: [true, "Director name is required"],
        trim: true,
        maxlength: [100, "Director name cannot exceed 100 characters"]
    },
    director_email: {
        type: String,
        required: [true, "Director email is required"],
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"]
    },
    director_phone: {
        type: String,
        trim: true,
        maxlength: [20, "Director phone cannot exceed 20 characters"]
    },
    status: {
        type: String,
        required: [true, "Activity status is required"],
        enum: ["draft", "active", "archived"],
        default: "draft"
    },
    primary_image_url: {
        type: String,
        default: null
    },
    images_count: {
        type: Number,
        default: 0
    },
    goals: createBilingualField(2000, "goals"),
    progress: {
        type: Number,
        min: [0, "Progress cannot be negative"],
        max: [100, "Progress cannot exceed 100%"],
        default: 0
    }
}, {
    timestamps: true
});

// Virtuals
activitySchema.virtual("primaryImage").get(function() {
    return this.primary_image_url || "/assets/default-activity.jpg";
});

activitySchema.virtual("imagesCount").get(function() {
    return this.images_count || 0;
});

activitySchema.virtual("images", {
    ref: "ActivityImage",
    localField: "_id",
    foreignField: "activity_id"
});

// Indexes with bilingual fields
activitySchema.index({ "title.en": "text", "title.ta": "text", "description.en": "text", "description.ta": "text", director_name: "text" });
activitySchema.index({ bureau: 1 });
activitySchema.index({ status: 1 });
activitySchema.index({ slug: 1 });
activitySchema.index({ createdAt: 1 });
activitySchema.index({ updatedAt: 1 });
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // TTL index

// Pre-save middleware to generate slug and validate bilingual content
activitySchema.pre("save", function(next) {
    // Generate slug from English title
    if (this.isModified("title") || this.isNew) {
        if (this.title && this.title.en) {
            this.slug = this.title.en
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-")
                .trim("-");
        }
    }
    
    // Validate bilingual content
    const validation = this.constructor.validateBilingualContent(this);
    if (!validation.isValid) {
        return next(new Error(`Bilingual validation failed: ${validation.errors.join(', ')}`));
    }
    
    next();
});

// Static method to validate bilingual content
activitySchema.statics.validateBilingualContent = function(doc) {
    const errors = [];
    const requiredFields = ['title', 'description', 'goals', 'director'];
    
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

module.exports = mongoose.model("Activity", activitySchema);