const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    default: null // null for admin notifications
  },
  title: {
    type: String,
    required: [true, "Please add a title"],
    trim: true,
    maxlength: [200, "Title cannot be more than 200 characters"]
  },
  body: {
    type: String,
    required: [true, "Please add notification content"],
    maxlength: [1000, "Content cannot be more than 1000 characters"]
  },
  link: {
    type: String,
    default: null
  },
  is_read: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ["system", "announcement", "chat", "user", "admin", "form", "project"],
    default: "system"
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
NotificationSchema.index({ user_id: 1, created_at: -1 });
NotificationSchema.index({ is_read: 1, created_at: -1 });
NotificationSchema.index({ type: 1, created_at: -1 });

// Static method to create notification
NotificationSchema.statics.createNotification = function(data) {
  return this.create({
    user_id: data.user_id || null,
    title: data.title,
    body: data.body,
    link: data.link || null,
    type: data.type || 'system',
    metadata: data.metadata || {}
  });
};

// Static method to get notifications for user
NotificationSchema.statics.getNotificationsForUser = function(userId, options = {}) {
  const {
    is_read = null,
    type = null,
    page = 1,
    limit = 20
  } = options;

  const query = {
    $or: [
      { user_id: userId },
      { user_id: null } // Admin notifications
    ]
  };

  if (is_read !== null) {
    query.is_read = is_read;
  }

  if (type) {
    query.type = type;
  }

  const skip = (page - 1) * limit;

  return this.find(query)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user_id', 'name email full_name');
};

// Static method to mark notifications as read
NotificationSchema.statics.markAsRead = function(notificationIds, userId = null) {
  const query = { _id: { $in: notificationIds } };
  
  if (userId) {
    query.$or = [
      { user_id: userId },
      { user_id: null }
    ];
  }

  return this.updateMany(query, { is_read: true });
};

// Static method to get unread count
NotificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    $or: [
      { user_id: userId },
      { user_id: null }
    ],
    is_read: false
  });
};

module.exports = mongoose.model("Notification", NotificationSchema);