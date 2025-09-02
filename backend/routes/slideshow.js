const express = require("express");
const {
    getSlides,
    getSlideById,
    createSlide,
    updateSlide,
    deleteSlide,
    getActiveSlides,
    incrementClickCount,
    reorderSlides,
    getSlideStats
} = require("../controllers/slideController");
const { protect, authorize } = require("../middleware/auth");
const router = express.Router();

// Public routes
router.get("/active", getActiveSlides);
router.post("/:id/click", incrementClickCount);

// Admin routes
router.use(protect);
router.use(authorize("admin"));

router.get("/", getSlides);
router.get("/stats", getSlideStats);
router.post("/", createSlide);
router.get("/:id", getSlideById);
router.put("/:id", updateSlide);
router.delete("/:id", deleteSlide);
router.put("/reorder", reorderSlides);

module.exports = router;