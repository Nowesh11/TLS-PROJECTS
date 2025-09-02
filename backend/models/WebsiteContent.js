const getMongoose = require("../utils/mongooseHelper");
const mongoose = getMongoose();

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
    title: {
        en: {
            type: String,
            trim: true,
            maxlength: [200, "English title cannot exceed 200 characters"]
        },
        ta: {
            type: String,
            trim: true,
            maxlength: [200, "Tamil title cannot exceed 200 characters"]
        }
    },
    content: {
        en: {
            type: String,
            maxlength: [5000, "English content cannot exceed 5000 characters"]
        },
        ta: {
            type: String,
            maxlength: [5000, "Tamil content cannot exceed 5000 characters"]
        }
    },
    subtitle: {
        en: {
            type: String,
            trim: true,
            maxlength: [300, "English subtitle cannot exceed 300 characters"]
        },
        ta: {
            type: String,
            trim: true,
            maxlength: [300, "Tamil subtitle cannot exceed 300 characters"]
        }
    },
    buttonText: {
        en: {
            type: String,
            trim: true,
            maxlength: [50, "English button text cannot exceed 50 characters"]
        },
        ta: {
            type: String,
            trim: true,
            maxlength: [50, "Tamil button text cannot exceed 50 characters"]
        }
    },
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
        alt: {
            en: {
                type: String,
                trim: true
            },
            ta: {
                type: String,
                trim: true
            }
        },
        caption: {
            en: {
                type: String,
                trim: true
            },
            ta: {
                type: String,
                trim: true
            }
        },
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
        title: {
            en: {
                type: String,
                trim: true
            },
            ta: {
                type: String,
                trim: true
            }
        },
        description: {
            en: {
                type: String,
                trim: true
            },
            ta: {
                type: String,
                trim: true
            }
        },
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
        en: [{
            type: String,
            trim: true
        }],
        ta: [{
            type: String,
            trim: true
        }]
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

// Compound index for page and section
websiteContentSchema.index({ page: 1, section: 1 }, { unique: true });

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

module.exports = mongoose.model("WebsiteContent", websiteContentSchema);