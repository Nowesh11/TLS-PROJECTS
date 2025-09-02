const getMongoose = require("../utils/mongooseHelper");
const mongoose = getMongoose();

const chatSchema = new mongoose.Schema({
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            required: true
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    messages: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        senderRole: {
            type: String,
            enum: ["user", "admin"],
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        messageType: {
            type: String,
            enum: ["text", "image", "file", "system"],
            default: "text"
        },
        attachments: [{
            filename: String,
            originalName: String,
            mimetype: String,
            size: Number,
            path: String
        }],
        readBy: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            readAt: {
                type: Date,
                default: Date.now
            }
        }],
        sentAt: {
            type: Date,
            default: Date.now
        },
        editedAt: {
            type: Date
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    }],
    chatType: {
        type: String,
        enum: ["direct", "support"],
        default: "support"
    },
    status: {
        type: String,
        enum: ["active", "closed", "archived"],
        default: "active"
    },
    subject: {
        type: String,
        trim: true
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "medium"
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    tags: [{
        type: String,
        trim: true
    }],
    lastActivity: {
        type: Date,
        default: Date.now
    },
    metadata: {
        userAgent: String,
        ipAddress: String,
        source: {
            type: String,
            enum: ["contact_form", "direct_chat", "website"],
            default: "direct_chat"
        }
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
chatSchema.index({ "participants.user": 1 });
chatSchema.index({ status: 1, lastActivity: -1 });
chatSchema.index({ assignedTo: 1, status: 1 });
chatSchema.index({ chatType: 1, status: 1 });
chatSchema.index({ "messages.sentAt": -1 });

// Note: Pre-save middleware removed for mock database compatibility
// Last activity update would need to be handled manually in controllers

// Method to add a message
chatSchema.methods.addMessage = function(senderId, senderRole, content, messageType = "text", attachments = []) {
    this.messages.push({
        sender: senderId,
        senderRole: senderRole,
        content: content,
        messageType: messageType,
        attachments: attachments
    });
    this.lastActivity = Date.now();
    return this.save();
};

// Method to mark messages as read
chatSchema.methods.markAsRead = function(userId) {
    this.messages.forEach(message => {
        if (!message.readBy.some(read => read.user.toString() === userId.toString())) {
            message.readBy.push({ user: userId });
        }
    });
    return this.save();
};

// Method to get unread message count for a user
chatSchema.methods.getUnreadCount = function(userId) {
    return this.messages.filter(message => 
        message.sender.toString() !== userId.toString() && 
        !message.readBy.some(read => read.user.toString() === userId.toString())
    ).length;
};

module.exports = mongoose.model("Chat", chatSchema);