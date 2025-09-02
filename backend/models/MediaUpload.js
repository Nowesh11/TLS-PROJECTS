const getMongoose = require("../utils/mongooseHelper");
const mongoose = getMongoose();

const mediaUploadSchema = new mongoose.Schema({
    file_url: {
        type: String,
        required: [true, "File URL is required"],
        trim: true,
        maxlength: [500, "File URL cannot exceed 500 characters"]
    },
    original_filename: {
        type: String,
        required: [true, "Original filename is required"],
        trim: true,
        maxlength: [255, "Original filename cannot exceed 255 characters"]
    },
    filename: {
        type: String,
        required: [true, "Filename is required"],
        trim: true,
        maxlength: [255, "Filename cannot exceed 255 characters"],
        unique: true
    },
    alt_text: {
        type: String,
        trim: true,
        maxlength: [200, "Alt text cannot exceed 200 characters"]
    },
    alt_text_tamil: {
        type: String,
        trim: true,
        maxlength: [200, "Tamil alt text cannot exceed 200 characters"]
    },
    file_type: {
        type: String,
        required: [true, "File type is required"],
        enum: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml", "application/pdf"],
        index: true
    },
    file_size: {
        type: Number,
        required: [true, "File size is required"],
        min: [0, "File size cannot be negative"]
    },
    category: {
        type: String,
        required: [true, "Category is required"],
        enum: ["hero", "gallery", "profile", "book", "ebook", "project", "icon", "logo", "general"],
        default: "general",
        index: true
    },
    usage_context: {
        type: String,
        enum: ["homepage", "about", "ebooks", "books", "projects", "contact", "signup", "login", "global"],
        index: true
    },
    is_private: {
        type: Boolean,
        default: false,
        index: true
    },
    is_active: {
        type: Boolean,
        default: true,
        index: true
    },
    uploaded_at: {
        type: Date,
        default: Date.now,
        index: true
    },
    uploaded_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    // Image-specific metadata
    dimensions: {
        width: {
            type: Number,
            min: [0, "Width cannot be negative"]
        },
        height: {
            type: Number,
            min: [0, "Height cannot be negative"]
        }
    },
    // SEO and accessibility
    title: {
        type: String,
        trim: true,
        maxlength: [100, "Title cannot exceed 100 characters"]
    },
    title_tamil: {
        type: String,
        trim: true,
        maxlength: [100, "Tamil title cannot exceed 100 characters"]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, "Description cannot exceed 500 characters"]
    },
    description_tamil: {
        type: String,
        trim: true,
        maxlength: [500, "Tamil description cannot exceed 500 characters"]
    },
    // Usage tracking
    usage_count: {
        type: Number,
        default: 0,
        min: [0, "Usage count cannot be negative"]
    },
    last_used: {
        type: Date
    },
    // Tags for better organization
    tags: [{
        type: String,
        trim: true,
        maxlength: [50, "Tag cannot exceed 50 characters"]
    }],
    // Additional metadata
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
mediaUploadSchema.index({ category: 1, is_active: 1 });
mediaUploadSchema.index({ usage_context: 1, is_active: 1 });
mediaUploadSchema.index({ uploaded_by: 1, uploaded_at: -1 });
mediaUploadSchema.index({ file_type: 1, category: 1 });

// Text search index
mediaUploadSchema.index({
    original_filename: "text",
    alt_text: "text",
    alt_text_tamil: "text",
    title: "text",
    title_tamil: "text",
    description: "text",
    description_tamil: "text",
    tags: "text"
});

// Virtual for full file path
mediaUploadSchema.virtual("full_path").get(function() {
    return this.file_url;
});

// Method to increment usage count
mediaUploadSchema.methods.incrementUsage = function() {
    this.usage_count += 1;
    this.last_used = new Date();
    return this.save();
};

// Static method to get media by category
mediaUploadSchema.statics.getByCategory = function(category, isActive = true) {
    return this.find({ category, is_active: isActive })
        .populate("uploaded_by", "name email")
        .sort({ uploaded_at: -1 });
};

// Static method to search media
mediaUploadSchema.statics.searchMedia = function(query, options = {}) {
    const {
        category,
        usage_context,
        file_type,
        is_private = false,
        limit = 50,
        skip = 0
    } = options;
    
    let searchQuery = {
        is_active: true,
        is_private
    };
    
    if (query) {
        searchQuery.$text = { $search: query };
    }
    
    if (category) searchQuery.category = category;
    if (usage_context) searchQuery.usage_context = usage_context;
    if (file_type) searchQuery.file_type = file_type;
    
    return this.find(searchQuery)
        .populate("uploaded_by", "name email")
        .sort({ score: { $meta: "textScore" }, uploaded_at: -1 })
        .limit(limit)
        .skip(skip);
};

// Note: Pre-remove middleware removed for mock database compatibility
// File cleanup would need to be handled manually in controllers

module.exports = mongoose.model("MediaUpload", mediaUploadSchema);