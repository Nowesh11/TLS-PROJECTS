const getMongoose = require("../utils/mongooseHelper");
const mongoose = getMongoose();

const activityLogSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    adminName: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ["create", "edit", "delete", "duplicate", "reorder", "publish", "unpublish", "view"]
    },
    targetType: {
        type: String,
        required: true,
        enum: ["content", "section", "page", "media"]
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    page: {
        type: String,
        required: true
    },
    sectionKey: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: true,
        maxlength: [500, "Description cannot exceed 500 characters"]
    },
    details: {
        type: mongoose.Schema.Types.Mixed // For storing additional action details
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
}, {
    timestamps: true
});

// Index for efficient querying
activityLogSchema.index({ page: 1, createdAt: -1 });
activityLogSchema.index({ adminId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);