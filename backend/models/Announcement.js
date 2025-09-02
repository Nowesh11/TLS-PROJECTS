const getMongoose = require("../utils/mongooseHelper");
const mongoose = getMongoose();

const announcementSchema = new mongoose.Schema({
    title_en: {
        type: String,
        required: [true, "Please add an English title"],
        trim: true,
        maxlength: [200, "Title cannot be more than 200 characters"]
    },
    title_ta: {
        type: String,
        trim: true,
        maxlength: [200, "Title cannot be more than 200 characters"]
    },
    body_en: {
        type: String,
        required: [true, "Please add English content"],
        maxlength: [5000, "Content cannot be more than 5000 characters"]
    },
    body_ta: {
        type: String,
        maxlength: [5000, "Content cannot be more than 5000 characters"]
    },
    attachments: {
        type: [{
            filename: String,
            originalName: String,
            path: String,
            mimetype: String,
            size: Number
        }],
        default: []
    },
    target: {
        type: String,
        enum: ["public", "admin", "users", "moderators", "editors"],
        default: "public"
    },
    start_at: {
        type: Date,
        default: Date.now
    },
    end_at: {
        type: Date,
        default: null
    },
    is_active: {
        type: Boolean,
        default: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
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
    timestamps: true
});

// Update the updated_at field before saving
announcementSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

// Index for efficient queries
announcementSchema.index({ is_active: 1, created_at: -1 });
announcementSchema.index({ target: 1, is_active: 1 });
announcementSchema.index({ start_at: 1, end_at: 1 });

// Virtual for checking if announcement is currently active
announcementSchema.virtual('isCurrentlyActive').get(function() {
    const now = new Date();
    return this.is_active && 
           this.start_at <= now && 
           (!this.end_at || this.end_at >= now);
});

// Static method to get active announcements
announcementSchema.statics.getActiveAnnouncements = function(target = 'public') {
    const now = new Date();
    return this.find({
        is_active: true,
        start_at: { $lte: now },
        $or: [
            { end_at: null },
            { end_at: { $gte: now } }
        ],
        target: { $in: [target, 'public'] }
    }).populate('created_by', 'name email full_name').sort({ created_at: -1 });
};

// Static method to get announcements for admin
announcementSchema.statics.getAnnouncementsForAdmin = function(filters = {}) {
    const query = {};
    
    if (filters.is_active !== undefined) {
        query.is_active = filters.is_active;
    }
    
    if (filters.target) {
        query.target = filters.target;
    }
    
    return this.find(query)
        .populate('created_by', 'name email full_name')
        .sort({ created_at: -1 });
};

module.exports = mongoose.model("Announcement", announcementSchema);