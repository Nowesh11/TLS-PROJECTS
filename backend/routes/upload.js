const express = require("express");
const router = express.Router();
const { uploadFile } = require("../controllers/upload");
const { protect, authorize } = require("../middleware/auth");

// Protect all upload routes
router.use(protect);
router.use(authorize("admin"));

// @route   POST /api/upload
// @desc    Upload a file
// @access  Private (Admin only)
router.post("/", uploadFile);

module.exports = router;