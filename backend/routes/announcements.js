const express = require("express");
const {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require("../controllers/announcements");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.route("/")
  .get(getAnnouncements) // Public can access with filtering
  .post(protect, authorize("admin"), createAnnouncement); // Admin only

router.route("/:id")
  .get(getAnnouncement) // Public can access active announcements
  .put(protect, authorize("admin"), updateAnnouncement) // Admin only
  .delete(protect, authorize("admin"), deleteAnnouncement); // Admin only

module.exports = router;