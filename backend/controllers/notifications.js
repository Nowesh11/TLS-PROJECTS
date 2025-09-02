const Notification = require("../models/Notification");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Get notifications for user
// @route   GET /api/notifications?user_id=&is_read=&page=&limit=
// @access  Private
exports.getNotifications = asyncHandler(async (req, res, next) => {
  const {
    user_id,
    is_read = null,
    page = 1,
    limit = 20,
    sort = '-created_at'
  } = req.query;

  let query = {};

  // If user_id is provided, filter by user_id
  // If not provided and user is not admin, show only their notifications
  if (user_id) {
    query.user_id = user_id;
  } else if (req.user.role !== 'admin') {
    query.user_id = req.user.id;
  }

  // Filter by read status if provided
  if (is_read !== null) {
    query.is_read = is_read === 'true';
  }

  // Pagination
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  // Execute query
  const notifications = await Notification.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .populate('user_id', 'name email full_name');

  // Get total count for pagination
  const total = await Notification.countDocuments(query);

  // Get unread count for the user
  const unreadCount = await Notification.countDocuments({
    user_id: req.user.id,
    is_read: false
  });

  res.status(200).json({
    success: true,
    count: notifications.length,
    total,
    unreadCount,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: notifications
  });
});

// @desc    Get single notification
// @route   GET /api/notifications/:id
// @access  Private
exports.getNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id)
    .populate('user_id', 'name email full_name');

  if (!notification) {
    return next(new ErrorResponse("Notification not found", 404));
  }

  // Check if user can access this notification
  if (req.user.role !== 'admin' && notification.user_id.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized to access this notification", 403));
  }

  res.status(200).json({
    success: true,
    data: notification
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/mark_read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new ErrorResponse("Notification not found", 404));
  }

  // Check if user can mark this notification as read
  if (req.user.role !== 'admin' && notification.user_id.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized to mark this notification as read", 403));
  }

  // Mark as read
  notification.is_read = true;
  await notification.save();

  res.status(200).json({
    success: true,
    message: "Notification marked as read",
    data: notification
  });
});

// @desc    Bulk mark notifications as read
// @route   POST /api/notifications/bulk_mark_read
// @access  Private
exports.bulkMarkAsRead = asyncHandler(async (req, res, next) => {
  const { notification_ids, mark_all = false } = req.body;

  let query = {};

  if (mark_all) {
    // Mark all notifications for the user as read
    query = {
      user_id: req.user.id,
      is_read: false
    };
  } else if (notification_ids && notification_ids.length > 0) {
    // Mark specific notifications as read
    query = {
      _id: { $in: notification_ids },
      user_id: req.user.id, // Ensure user can only mark their own notifications
      is_read: false
    };
  } else {
    return next(new ErrorResponse("Please provide notification_ids or set mark_all to true", 400));
  }

  const result = await Notification.updateMany(query, {
    is_read: true
  });

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} notifications marked as read`,
    data: {
      modifiedCount: result.modifiedCount
    }
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new ErrorResponse("Notification not found", 404));
  }

  // Check if user can delete this notification
  if (req.user.role !== 'admin' && notification.user_id.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized to delete this notification", 403));
  }

  await Notification.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Notification deleted successfully",
    data: {}
  });
});

// @desc    Get unread count for user
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = asyncHandler(async (req, res, next) => {
  const unreadCount = await Notification.countDocuments({
    user_id: req.user.id,
    is_read: false
  });

  res.status(200).json({
    success: true,
    data: {
      unreadCount
    }
  });
});

// @desc    Create notification (Admin only)
// @route   POST /api/notifications
// @access  Private/Admin
exports.createNotification = asyncHandler(async (req, res, next) => {
  const {
    user_id,
    title,
    body,
    link,
    type = 'system',
    metadata
  } = req.body;

  const notificationData = {
    user_id,
    title,
    body,
    link,
    type,
    metadata
  };

  const notification = await Notification.create(notificationData);

  const populatedNotification = await Notification.findById(notification._id)
    .populate('user_id', 'name email full_name');

  res.status(201).json({
    success: true,
    message: "Notification created successfully",
    data: populatedNotification
  });
});