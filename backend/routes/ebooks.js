const express = require("express");
const {
    getEbooks,
    getEbook,
    createEbook,
    updateEbook,
    deleteEbook,
    downloadEbook,
    purchaseEbook,
    getEbookCategories,
    getEbookStats,
    getDownloadCount,
    uploadEbookCover,
    uploadEbookFile
} = require("../controllers/ebooks");
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath;
        if (file.fieldname === 'coverImage') {
            uploadPath = path.join(__dirname, '../public/uploads/ebooks/image/');
        } else if (file.fieldname === 'ebookFile') {
            uploadPath = path.join(__dirname, '../public/uploads/ebooks/file/');
        }
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}_${timestamp}${ext}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.fieldname === 'coverImage') {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Cover image must be an image file'), false);
            }
        } else if (file.fieldname === 'ebookFile') {
            if (file.mimetype === 'application/pdf') {
                cb(null, true);
            } else {
                cb(new Error('eBook file must be a PDF'), false);
            }
        } else {
            cb(new Error('Invalid field name'), false);
        }
    }
});

const { protect, authorize } = require("../middleware/auth");
const { optionalAuth, requireAuth } = require("../middleware/optionalAuth");

const router = express.Router();

// Public routes with optional authentication
router.get("/", optionalAuth, getEbooks);
router.get("/categories", getEbookCategories);
router.get("/:id", optionalAuth, getEbook);
router.get("/:id/download-count", getDownloadCount);

// Protected routes (requires authentication)
router.get("/:id/download", protect, requireAuth, downloadEbook);
router.post("/:id/purchase", protect, requireAuth, purchaseEbook);

// Admin only routes
router.use(protect);
router.use(authorize("admin"));

router.post("/", createEbook);
router.put("/:id", updateEbook);
router.delete("/:id", deleteEbook);
router.get("/admin/stats", getEbookStats);

// File upload routes
router.post("/:id/upload-cover", upload.single('coverImage'), uploadEbookCover);
router.post("/:id/upload-file", upload.single('ebookFile'), uploadEbookFile);

module.exports = router;