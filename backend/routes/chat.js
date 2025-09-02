const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const {
    getChats,
    getChat,
    createChat,
    sendMessage,
    updateChatStatus,
    getChatStats,
    createPublicChat,
    sendMessageWithFile
} = require("../controllers/chat");

const { protect, authorize } = require("../middleware/auth");

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/chat_files');
        try {
            await fs.mkdir(uploadPath, { recursive: true });
            cb(null, uploadPath);
        } catch (error) {
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'chat-file-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow common file types
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images, documents, and archive files are allowed'));
        }
    }
});

const router = express.Router();

// Public routes (no authentication required)
router.post("/public", createPublicChat);
router.post("/public/:id/message", sendMessage);

// Protected routes (authentication required)
router.use(protect);

// Authenticated user routes
router.route("/")
    .get(getChats)
    .post(createChat);

router.get("/:id", getChat);
router.post("/:id/message", sendMessage);
router.post("/:id/message/file", upload.single('file'), sendMessageWithFile);

// Admin only routes
router.put("/:id/status", authorize("admin"), updateChatStatus);
router.get("/admin/stats", authorize("admin"), getChatStats);

module.exports = router;