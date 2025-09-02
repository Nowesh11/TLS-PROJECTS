const express = require("express");
const {
  getNotifications,
  getNotification,
  markAsRead,
  bulkMarkAsRead,
  deleteNotification,
  getUnreadCount,
  createNotification
} = require("../controllers/notifications");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(protect);

// User routes
router.route("/")
  .get(getNotifications) // Get notifications for user
  .post(authorize("admin"), createNotification); // Admin only - create notification

router.get("/unread-count", getUnreadCount); // Get unread count for user
router.post("/bulk_mark_read", bulkMarkAsRead); // Bulk mark as read

router.route("/:id")
  .get(getNotification) // Get single notification
  .delete(deleteNotification); // Delete notification

router.put("/:id/mark_read", markAsRead); // Mark single notification as read

module.exports = router;