const express = require("express");
const {
    getContent,
    getContentByPageSection,
    getContentItem,
    createContent,
    updateContent,
    deleteContent,
    approveContent,
    duplicateContent,
    reorderContent,
    getContentPages,
    getContentSections,
    getContentStats,
    getPages,
    getPageSections,
    createPageSection,
    updatePageSection,
    deletePageSection,
    duplicatePageSection,
    getActivityLog
} = require("../controllers/content");

const { protect, authorize } = require("../middleware/auth");
const { optionalAuth } = require("../middleware/optionalAuth");

const router = express.Router();

// Public routes with optional authentication
router.get("/", optionalAuth, getContent);
router.get("/pages", getPages);
router.get("/pages/:slug", getPageSections);
router.get("/content/pages", getContentPages);
router.get("/content/pages/:page/sections", getContentSections);
router.get("/:page/:section", getContentByPageSection);

// Activity log routes (public for basic functionality)
router.get("/activity", getActivityLog);

// Protected routes (Admin only)
router.use(protect);
router.use(authorize("admin"));

router.get("/item/:id", getContentItem);
router.post("/", createContent);
router.put("/:id", updateContent);
router.delete("/:id", deleteContent);
router.put("/:id/approve", approveContent);
router.post("/:id/duplicate", duplicateContent);
router.put("/reorder", reorderContent);
router.get("/admin/stats", getContentStats);
router.post("/page/:pageType", createContent);
router.put("/page/:pageType", updateContent);

// New enhanced content management routes
router.post("/pages/:slug/sections", createPageSection);
router.patch("/pages/:slug/sections/:sectionKey", updatePageSection);
router.delete("/pages/:slug/sections/:sectionKey", deletePageSection);
router.post("/pages/:slug/sections/:sectionKey/duplicate", duplicatePageSection);

module.exports = router;