const express = require("express");
const {
    getActivities,
    getActivity,
    createActivity,
    updateActivity,
    deleteActivity,
    getActivityBureaus,
    getActivityStats,
    uploadActivityImages,
    deleteActivityImage,
    setPrimaryImage
} = require("../controllers/activities");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.get("/", getActivities);
router.get("/bureaus", getActivityBureaus);
router.get("/:id", getActivity);

// Protected routes (Admin only)
router.use(protect);
router.use(authorize("admin"));

router.get("/stats", getActivityStats);
router.post("/", createActivity);
router.put("/:id", updateActivity);
router.delete("/:id", deleteActivity);

// Image management routes
router.post("/:id/images", uploadActivityImages);
router.delete("/images/:imageId", deleteActivityImage);
router.patch("/images/:imageId/primary", setPrimaryImage);

module.exports = router;