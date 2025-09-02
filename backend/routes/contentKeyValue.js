const express = require("express");
const {
    getAllContent,
    getContentByKey,
    bulkUpdateContent,
    updateContentByKey,
    deleteContentByKey,
    searchContent,
    getContentStats,
    getPageContentKeys,
    duplicateContent
} = require("../controllers/contentKeyValue");
const { protect, authorize } = require("../middleware/auth");
const router = express.Router();

// Public routes
router.get("/", getAllContent);
router.get("/search", protect, authorize("admin"), searchContent);
router.get("/stats", protect, authorize("admin"), getContentStats);
router.get("/keys/:page", protect, authorize("admin"), getPageContentKeys);
router.get("/:key", getContentByKey);

// Protected routes (Admin only)
router.post("/", protect, authorize("admin"), bulkUpdateContent);
router.post("/duplicate", protect, authorize("admin"), duplicateContent);
router.put("/:key", protect, authorize("admin"), updateContentByKey);
router.delete("/:key", protect, authorize("admin"), deleteContentByKey);

module.exports = router;