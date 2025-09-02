const express = require("express");
const {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    getProjectBureaus,
    getProjectStats,
    uploadProjectImages,
    deleteProjectImage,
    setPrimaryImage
} = require("../controllers/projects");

const { protect, authorize } = require("../middleware/auth");
const { optionalAuth } = require("../middleware/optionalAuth");

const router = express.Router();

// Public routes with optional authentication
router.get("/", optionalAuth, getProjects);
router.get("/bureaus", getProjectBureaus);
router.get("/:id", optionalAuth, getProject);

// Protected routes (Admin only)
router.use(protect);
router.use(authorize("admin"));

router.post("/", createProject);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);
router.get("/admin/stats", getProjectStats);

// Image management
router.post("/:id/images", uploadProjectImages);
router.delete("/:id/images/:imageId", deleteProjectImage);
router.put("/:id/images/:imageId/primary", setPrimaryImage);

module.exports = router;