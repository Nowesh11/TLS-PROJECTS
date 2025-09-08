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

const posterSchema = new mongoose.Schema({
    title: createBilingualField(200, "title"),
    description: createBilingualField(1000, "description"),
    
    // Image
    image_path: {
        type: String,
        required: [true, "Image is required"]
    },
    imageAlt: {
        type: String,
        maxlength: [200, "Image alt text cannot exceed 200 characters"]
    },
    
    // Action Button (optional)
    buttonText: createOptionalBilingualField(50, "button text"),
    link_url: {
        type: String,
        trim: true,
        maxlength: [500, "Button URL cannot exceed 500 characters"]
    },
    
    // Status
    is_active: {
        type: Boolean,
        default: true
    },
    
    // Scheduling
    start_at: {
        type: Date,
        default: Date.now
    },
    end_at: {
        type: Date
    },
    
    // Priority (higher number = higher priority)
    priority: {
        type: Number,
        default: 1,
        min: 1,
        max: 10
    },
    
    // Analytics
    viewCount: {
        type: Number,
        default: 0
    },
    clickCount: {
        type: Number,
        default: 0
    },
    
    // Admin tracking
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    
    // SEO
    seoTitle: {
        type: String,
        maxlength: [60, "SEO title cannot exceed 60 characters"]
    },
    seoDescription: {
        type: String,
        maxlength: [160, "SEO description cannot exceed 160 characters"]
    }
}, {
    timestamps: true
});

// Indexes
posterSchema.index({ is_active: 1 });
posterSchema.index({ priority: -1 });
posterSchema.index({ start_at: 1, end_at: 1 });
posterSchema.index({ createdAt: -1 });

// Virtual for checking if poster is currently active
posterSchema.virtual("isCurrentlyActive").get(function() {
    const now = new Date();
    return this.is_active && 
           (!this.start_at || this.start_at <= now) && 
           (!this.end_at || this.end_at >= now);
});

// Method to increment view count
posterSchema.methods.incrementViewCount = function() {
    this.viewCount += 1;
    return this.save();
};

// Method to increment click count
posterSchema.methods.incrementClickCount = function() {
    this.clickCount += 1;
    return this.save();
};

module.exports = mongoose.model("Poster", posterSchema);