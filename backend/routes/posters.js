const express = require("express");
const {
    getPosters,
    getPosterById,
    createPoster,
    updatePoster,
    deletePoster,
    getActivePosters,
    incrementClickCount,
    getPosterStats
} = require("../controllers/posterController");

const { protect, authorize } = require("../middleware/auth");
const multer = require('multer');
const path = require('path');

// Configure multer for poster image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads/posters/'));
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
router.get("/active", getActivePosters);
router.post("/:id/click", incrementClickCount);

// Protected routes (Admin only)
router.use(protect);
router.use(authorize("admin"));

router.get("/", getPosters);
router.get("/stats", getPosterStats);
router.post("/", upload.single('image'), createPoster);
router.get("/:id", getPosterById);
router.put("/:id", upload.single('image'), updatePoster);
router.delete("/:id", deletePoster);

module.exports = router;