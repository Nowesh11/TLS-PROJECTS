const express = require("express");
const {
    getBooks,
    getBook,
    createBook,
    updateBook,
    deleteBook,
    getBookCategories,
    getBookStats,
    purchaseBook,
    rateBook,
    getBookRatings,
    getUserBookRating,
    deleteUserBookRating,
    uploadBookCover,
    uploadBookImages,
    removeCoverImage,
    removeBookImage
} = require("../controllers/books");

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const { protect, authorize } = require("../middleware/auth");
const { optionalAuth, requireAuth } = require("../middleware/optionalAuth");

const router = express.Router();

// Public routes (no authentication required)
router.get("/", getBooks);
router.get("/categories", getBookCategories);
router.get("/:id", getBook);
router.get("/:id/ratings", getBookRatings);

// Routes that require authentication for specific actions
router.post("/:id/purchase", upload.single("paymentProof"), purchaseBook);
router.post("/:id/rate", protect, requireAuth("rating books"), rateBook);
router.get("/:id/my-rating", protect, getUserBookRating);
router.delete("/:id/rating", protect, deleteUserBookRating);

// Admin only routes
router.use(protect);
router.use(authorize("admin"));

router.post("/", createBook);
router.put("/:id", updateBook);
router.delete("/:id", deleteBook);
router.post("/:id/upload-cover", upload.single("coverImage"), uploadBookCover);
router.post("/:id/upload-images", upload.array("images", 10), uploadBookImages);
router.delete("/:id/remove-cover", removeCoverImage);
router.delete("/:id/remove-image/:imageIndex", removeBookImage);
router.get("/admin/stats", getBookStats);

module.exports = router;