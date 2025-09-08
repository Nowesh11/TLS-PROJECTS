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

const ebookSchema = new mongoose.Schema({
    title: createBilingualField(200, "title"),
    author: createBilingualField(100, "author"),
    description: createBilingualField(2000, "description"),
    category: {
        type: String,
        required: [true, "Ebook category is required"],
        enum: ["poetry", "literature", "history", "culture", "language", "children", "academic", "fiction", "non-fiction", "biography", "education", "other"]
    },

    isbn: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    publisher: {
        type: String,
        trim: true,
        maxlength: [100, "Publisher name cannot exceed 100 characters"]
    },
    publishedDate: {
        type: Date
    },
    pages: {
        type: Number,
        min: [1, "Pages must be at least 1"]
    },
    bookLanguage: {
        type: String,
        default: "Tamil",
        enum: ["Tamil", "English", "Bilingual"]
    },
    coverImage: {
        type: String,
        default: "/assets/default-ebook-cover.jpg"
    },
    previewImages: [{
        type: String
    }],
    fileUrl: {
        type: String,
        required: [true, "Ebook file URL is required"]
    },
    fileSize: {
        type: Number, // in bytes
        min: [0, "File size cannot be negative"]
    },
    fileFormat: {
        type: String,
        required: [true, "File format is required"],
        enum: ["PDF", "EPUB", "MOBI", "TXT"]
    },
    downloadCount: {
        type: Number,
        default: 0,
        min: [0, "Download count cannot be negative"]
    },
    isFree: {
        type: Boolean,
        default: true
    },
    featured: {
        type: Boolean,
        default: false
    },
    bestseller: {
        type: Boolean,
        default: false
    },
    newRelease: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        default: 0,
        min: [0, "Rating cannot be negative"],
        max: [5, "Rating cannot exceed 5"]
    },
    reviewCount: {
        type: Number,
        default: 0,
        min: [0, "Review count cannot be negative"]
    },
    tags: [{
        type: String,
        trim: true
    }],
    previewPages: {
        type: Number,
        default: 0,
        min: [0, "Preview pages cannot be negative"]
    },
    previewUrl: {
        type: String // URL to preview version of the ebook
    },
    status: {
        type: String,
        default: "active",
        enum: ["active", "inactive", "draft", "archived"]
    },
    seoTitle: {
        type: String,
        maxlength: [60, "SEO title cannot exceed 60 characters"]
    },
    seoDescription: {
        type: String,
        maxlength: [160, "SEO description cannot exceed 160 characters"]
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for formatted file size
ebookSchema.virtual("formattedFileSize").get(function() {
    if (!this.fileSize) return "Unknown";
    
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
    return Math.round(this.fileSize / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
});

// Index for search functionality with bilingual fields
ebookSchema.index({
    "title.en": "text",
    "title.ta": "text",
    "author.en": "text",
    "author.ta": "text",
    "description.en": "text",
    "description.ta": "text",
    tags: "text"
}, {
    default_language: "none"
});

// Index for category and status
ebookSchema.index({ category: 1, status: 1 });
ebookSchema.index({ featured: 1, status: 1 });
ebookSchema.index({ bestseller: 1, status: 1 });
ebookSchema.index({ newRelease: 1, status: 1 });
ebookSchema.index({ isFree: 1, status: 1 });

// Pre-save validation for bilingual content
ebookSchema.pre('save', function(next) {
    const validation = this.constructor.validateBilingualContent(this);
    if (!validation.isValid) {
        return next(new Error(`Bilingual validation failed: ${validation.errors.join(', ')}`));
    }
    next();
});

// Static method to validate bilingual content
ebookSchema.statics.validateBilingualContent = function(doc) {
    const errors = [];
    const requiredFields = ['title', 'author', 'description'];
    
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

module.exports = mongoose.model("Ebook", ebookSchema);