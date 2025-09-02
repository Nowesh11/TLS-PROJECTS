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
const multer = require('multer');
const path = require('path');

// Configure multer for slide image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads/slides/'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

const router = express.Router();

// Public routes
router.get("/active", getActiveSlides);
router.post("/:id/click", incrementClickCount);

// Admin routes
router.use(protect);
router.use(authorize("admin"));

router.get("/", getSlides);
router.get("/stats", getSlideStats);
router.post("/", upload.fields([{ name: 'image', maxCount: 1 }, { name: 'mobile_image', maxCount: 1 }]), createSlide);
router.get("/:id", getSlideById);
router.put("/:id", upload.fields([{ name: 'image', maxCount: 1 }, { name: 'mobile_image', maxCount: 1 }]), updateSlide);
router.delete("/:id", deleteSlide);
router.put("/reorder", reorderSlides);

module.exports = router;