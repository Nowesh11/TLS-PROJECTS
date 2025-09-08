const express = require("express");
const {
    getPageContent,
    getAllContent,
    getContentById,
    createContent,
    updateContent,
    deleteContent,
    reorderContent,
    toggleVisibility,
    getPageStructure,
    bulkUpdateContent,
    updateContentRealTime,
    duplicateContent,
    getContentStats,
    searchContent,
    getContentTypes,
    getSimplePageContent,
    saveSimplePageContent,
    // New section-based functions
    getPageSections,
    createPageSection,
    updatePageSection,
    deletePageSection,
    getPageSection,
    reorderPageSections,
    refreshPageContent
} = require("../controllers/websiteContent");

const { diagnoseContent } = require("../controllers/diagnoseContent");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.get("/page/:page", getPageContent);
router.get("/structure/:page", getPageStructure);

// New section-based public routes
router.get("/sections", getPageSections);
router.get("/sections/:page", getPageSections);
router.get("/sections/:page/:sectionId", getPageSection);

// Public API for frontend dynamic content replacement
router.get("/fetch-content/:page", getPageContent);
router.get("/fetch-sections/:page", getPageSections);

// Diagnostic route (public for debugging)
router.get("/diagnose/:page", diagnoseContent);

// Simple CMS routes (public GET, protected POST/PUT)
router.get("/simple", getSimplePageContent);
router.post("/simple", protect, authorize("admin"), saveSimplePageContent);
router.put("/simple", protect, authorize("admin"), saveSimplePageContent);

// Protected routes (Admin only)
router.use(protect);
router.use(authorize("admin"));

// Content management routes
router.route("/")
    .get(getAllContent)
    .post(createContent)
    .put(updateContentRealTime);

router.route("/item/:id")
    .get(getContentById)
    .put(updateContent)
    .delete(deleteContent);

// Bulk operations
router.post("/bulk-update", bulkUpdateContent);
router.put("/reorder", reorderContent);

// Content utilities
router.get("/stats", getContentStats);
router.get("/search", searchContent);
router.get("/types", getContentTypes);

// Individual content operations
router.post("/:id/duplicate", duplicateContent);
router.put("/:id/toggle-visibility", toggleVisibility);

// New section-based protected routes
router.post("/sections/:page", createPageSection);
router.put("/sections/:page/:sectionId", updatePageSection);
router.delete("/sections/:page/:sectionId", deletePageSection);
router.put("/sections/:page/reorder", reorderPageSections);

// Manual content refresh route
router.post("/refresh/:page", refreshPageContent);

module.exports = router;