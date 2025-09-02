const express = require("express");
const router = express.Router();
const {
  getDashboardData,
  getContent,
  updateContent,
  getMessages,
  getSettings,
  updateSettings,
  getActivities,
  getInitiatives,
  getActivity,
  getInitiative,
  updateActivity,
  updateInitiative,
  deleteActivity,
  deleteInitiative,
  autoClearRecentActivities,
  getRecentActivities
} = require("../controllers/admin");
const { getProjects } = require("../controllers/projects");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);
router.use(authorize("admin"));

router.get("/dashboard", getDashboardData);

router.route("/content")
  .get(getContent)
  .put(updateContent);

router.get("/messages", getMessages);

router.route("/settings")
  .get(getSettings)
  .put(updateSettings);

// Activities admin routes
router.get("/activities", getActivities);
router.get("/activities/:id", getActivity);
router.put("/activities/:id", updateActivity);
router.delete("/activities/:id", deleteActivity);

// Initiatives admin routes
router.get("/initiatives", getInitiatives);
router.get("/initiatives/:id", getInitiative);
router.put("/initiatives/:id", updateInitiative);
router.delete("/initiatives/:id", deleteInitiative);

// Projects admin routes
router.get("/projects", async (req, res, next) => {
    console.log("Admin projects route hit!");
    try {
        // Admin can see all projects regardless of visibility
        const Project = require("../models/Project");
        const projects = await Project.find({}).sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects
        });
    } catch (error) {
        console.error("Error in admin projects route:", error);
        next(error);
    }
});

// Recent activities management routes
router.get("/activities/recent", getRecentActivities);
router.delete("/activities/auto-clear", autoClearRecentActivities);

module.exports = router;