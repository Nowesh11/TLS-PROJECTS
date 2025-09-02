const getMongoose = require("../utils/mongooseHelper");
const mongoose = getMongoose();

const contentKeyValueSchema = new mongoose.Schema({
    content_key: {
        type: String,
        required: [true, "Content key is required"],
        trim: true,
        maxlength: [200, "Content key cannot exceed 200 characters"],
        index: true
    },
    content_value: {
        type: String,
        required: [true, "Content value is required"],
        maxlength: [10000, "Content value cannot exceed 10000 characters"]
    },
    language: {
        type: String,
        required: [true, "Language is required"],
        enum: ["en", "ta"],
        default: "en",
        index: true
    },
    type: {
        type: String,
        required: [true, "Content type is required"],
        enum: ["text", "image", "link", "html", "meta"],
        default: "text",
        index: true
    },
    last_updated: {
        type: Date,
        default: Date.now
    },
    // Additional metadata for better content management
    page: {
        type: String,
        required: true,
        enum: ["homepage", "about", "ebooks", "books", "projects", "contact", "signup", "login", "global"],
        index: true
    },
    section: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, "Section cannot exceed 100 characters"],
        index: true
    },
    element: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, "Element cannot exceed 100 characters"]
    },
    // Admin management fields
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    is_active: {
        type: Boolean,
        default: true,
        index: true
    },
    // SEO and metadata
    meta_description: {
        type: String,
        maxlength: [500, "Meta description cannot exceed 500 characters"]
    },
    alt_text: {
        type: String,
        maxlength: [200, "Alt text cannot exceed 200 characters"]
    }
}, {
    timestamps: true
});

// Compound unique index for content_key and language
contentKeyValueSchema.index({ content_key: 1, language: 1 }, { unique: true });

// Index for efficient page-based queries
contentKeyValueSchema.index({ page: 1, section: 1, language: 1 });

// Text search index
contentKeyValueSchema.index({
    content_key: "text",
    content_value: "text",
    meta_description: "text"
});

// Note: Pre-save middleware removed for mock database compatibility
// Content key parsing would need to be handled manually in controllers

// Static method to build nested JSON structure
contentKeyValueSchema.statics.buildNestedStructure = async function(language = "en", page = null) {
    const query = { language, is_active: true };
    if (page) query.page = page;
    
    const content = await this.find(query).sort({ content_key: 1 });
    const result = {};
    
    content.forEach(item => {
        const keys = item.content_key.split(".");
        let current = result;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = item.content_value;
    });
    
    return result;
};

// Static method for bulk update
contentKeyValueSchema.statics.bulkUpdate = async function(updates, userId) {
    const operations = [];
    
    for (const [contentKey, languages] of Object.entries(updates)) {
        for (const [lang, value] of Object.entries(languages)) {
            if (lang === "en" || lang === "ta") {
                operations.push({
                    updateOne: {
                        filter: { content_key: contentKey, language: lang },
                        update: {
                            content_value: value,
                            updated_by: userId,
                            last_updated: new Date()
                        },
                        upsert: true
                    }
                });
            }
        }
    }
    
    if (operations.length > 0) {
        return await this.bulkWrite(operations);
    }
    
    return null;
};

module.exports = mongoose.model("ContentKeyValue", contentKeyValueSchema);