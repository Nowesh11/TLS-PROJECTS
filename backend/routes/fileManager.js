const express = require("express");
const router = express.Router();
const {
    getFileStats,
    getAllFiles,
    exportFiles,
    cleanupOrphanedFiles
} = require("../controllers/fileManager");
const { protect, authorize } = require("../middleware/auth");

// Protect all file management routes - Admin only
router.use(protect);
router.use(authorize("admin"));

// @route   GET /api/files/stats
// @desc    Get file storage statistics
// @access  Private (Admin only)
router.get("/stats", getFileStats);

// @route   GET /api/files/export
// @desc    Export files as ZIP archive
// @access  Private (Admin only)
router.get("/export", exportFiles);

// @route   DELETE /api/files/cleanup
// @desc    Clean up orphaned files
// @access  Private (Admin only)
router.delete("/cleanup", cleanupOrphanedFiles);

// @route   GET /api/files
// @desc    Get all files with metadata
// @access  Private (Admin only)
router.get("/", getAllFiles);

module.exports = router;