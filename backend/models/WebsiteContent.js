const getMongoose = require("../utils/mongooseHelper");
const mongoose = getMongoose();

// Helper function to create bilingual required fields
const createBilingualField = (maxLength, fieldName) => ({
    en: {
        type: String,
        required: [true, `English ${fieldName} is required for bilingual content`],
        trim: true,
        maxlength: [maxLength, `English ${fieldName} cannot exceed ${maxLength} characters`]
    },
    ta: {
        type: String,
        required: [true, `Tamil ${fieldName} is required for bilingual content`],
        trim: true,
        maxlength: [maxLength, `Tamil ${fieldName} cannot exceed ${maxLength} characters`]
    }
});

// Helper function for optional bilingual fields
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

const websiteContentSchema = new mongoose.Schema({
    page: {
        type: String,
        required: [true, "Page identifier is required"],
        enum: ["home", "about", "contact", "footer", "header", "hero", "services", "testimonials", "faq", "navigation", "logo", "books", "ebooks", "projects", "team", "announcements", "activities", "initiatives", "homepage", "global", "login", "signup", "admin-login", "admin"],
        index: true
    },
    section: {
        type: String,
        required: [true, "Section identifier is required"],
        trim: true,
        maxlength: [100, "Section identifier cannot exceed 100 characters"]
    },
    sectionKey: {
        type: String,
        required: [true, "Section key is required"],
        trim: true,
        maxlength: [100, "Section key cannot exceed 100 characters"]
    },
    sectionType: {
        type: String,
        enum: ["text", "image", "feature-list", "hero", "banner", "cards", "cta", "gallery", "form", "statistics", "announcements", "navigation", "footer"],
        default: "text"
    },
    layout: {
        type: String,
        enum: ["full-width", "two-column", "three-column", "grid", "flex", "custom"],
        default: "full-width"
    },
    position: {
        type: Number,
        default: 0
    },
    title: createBilingualField(200, "title"),
    content: createBilingualField(5000, "content"),
    subtitle: createOptionalBilingualField(300, "subtitle"),
    buttonText: createOptionalBilingualField(50, "button text"),
    buttonUrl: {
        type: String,
        trim: true,
        maxlength: [500, "Button URL cannot exceed 500 characters"]
    },
    image: {
        type: String,
        trim: true
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        alt: createBilingualField(200, "image alt text"),
        caption: createOptionalBilingualField(300, "image caption"),
        order: {
            type: Number,
            default: 0
        }
    }],
    videos: [{
        url: {
            type: String,
            required: true
        },
        title: createOptionalBilingualField(200, "video title"),
        description: createOptionalBilingualField(500, "video description"),
        thumbnail: String,
        duration: String,
        order: {
            type: Number,
            default: 0
        }
    }],
    stylePreset: {
        type: String,
        enum: ["default", "modern", "classic", "minimal", "bold", "elegant"],
        default: "default"
    },
    customStyles: {
        type: mongoose.Schema.Types.Mixed // For custom CSS properties
    },
    isRequired: {
        type: Boolean,
        default: false
    },
    hasTamilTranslation: {
        type: Boolean,
        default: false
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed // For flexible additional data
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isVisible: {
        type: Boolean,
        default: true
    },
    version: {
        type: Number,
        default: 1
    },
    publishedAt: {
        type: Date
    },
    scheduledAt: {
        type: Date
    },
    expiresAt: {
        type: Date
    },
    seoTitle: {
        type: String,
        maxlength: [60, "SEO title cannot exceed 60 characters"]
    },
    seoDescription: {
        type: String,
        maxlength: [160, "SEO description cannot exceed 160 characters"]
    },
    seoKeywords: {
        en: {
            type: [String],
            required: [true, "English SEO keywords are required for bilingual content"],
            validate: {
                validator: function(v) {
                    return v && v.length > 0;
                },
                message: "At least one English SEO keyword is required"
            }
        },
        ta: {
            type: [String],
            required: [true, "Tamil SEO keywords are required for bilingual content"],
            validate: {
                validator: function(v) {
                    return v && v.length > 0;
                },
                message: "At least one Tamil SEO keyword is required"
            }
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    approvedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Compound index for page, section, and sectionKey (unique combination)
websiteContentSchema.index({ page: 1, section: 1, sectionKey: 1 }, { unique: true });

// Index for search functionality
websiteContentSchema.index({
    "title.en": "text",
    "title.ta": "text",
    "content.en": "text",
    "content.ta": "text",
    "subtitle.en": "text",
    "subtitle.ta": "text"
});

// Index for active and visible content
websiteContentSchema.index({ isActive: 1, isVisible: 1 });
websiteContentSchema.index({ page: 1, order: 1 });

// Pre-save validation to ensure bilingual content completeness
websiteContentSchema.pre('save', function(next) {
    // Validate that both English and Tamil content exist for required fields
    const requiredBilingualFields = ['title', 'content'];
    
    for (const field of requiredBilingualFields) {
        if (this[field]) {
            if (!this[field].en || this[field].en.trim() === '') {
                return next(new Error(`English ${field} is required for bilingual content`));
            }
            if (!this[field].ta || this[field].ta.trim() === '') {
                return next(new Error(`Tamil ${field} is required for bilingual content`));
            }
        }
    }
    
    // Validate images have bilingual alt text
    if (this.images && this.images.length > 0) {
        for (let i = 0; i < this.images.length; i++) {
            const image = this.images[i];
            if (!image.alt || !image.alt.en || image.alt.en.trim() === '') {
                return next(new Error(`English alt text is required for image ${i + 1}`));
            }
            if (!image.alt.ta || image.alt.ta.trim() === '') {
                return next(new Error(`Tamil alt text is required for image ${i + 1}`));
            }
        }
    }
    
    // Validate SEO keywords
    if (this.seoKeywords) {
        if (!this.seoKeywords.en || this.seoKeywords.en.length === 0) {
            return next(new Error('At least one English SEO keyword is required'));
        }
        if (!this.seoKeywords.ta || this.seoKeywords.ta.length === 0) {
            return next(new Error('At least one Tamil SEO keyword is required'));
        }
    }
    
    // Set hasTamilTranslation flag
    this.hasTamilTranslation = true;
    
    next();
});

// Static method to validate bilingual content
websiteContentSchema.statics.validateBilingualContent = function(contentData) {
    const errors = [];
    
    // Check required bilingual fields
    if (!contentData.title || !contentData.title.en || !contentData.title.ta) {
        errors.push('Both English and Tamil titles are required');
    }
    
    if (!contentData.content || !contentData.content.en || !contentData.content.ta) {
        errors.push('Both English and Tamil content are required');
    }
    
    // Check SEO keywords
    if (contentData.seoKeywords) {
        if (!contentData.seoKeywords.en || contentData.seoKeywords.en.length === 0) {
            errors.push('English SEO keywords are required');
        }
        if (!contentData.seoKeywords.ta || contentData.seoKeywords.ta.length === 0) {
            errors.push('Tamil SEO keywords are required');
        }
    }
    
    return errors;
};

module.exports = mongoose.model("WebsiteContent", websiteContentSchema);