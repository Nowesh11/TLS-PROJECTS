const express = require("express");
const {
    getPurchasedBooks,
    getPurchasedBook,
    createPurchasedBook,
    updatePurchasedBook,
    deletePurchasedBook,
    updateBookStatus,
    exportPurchasedBooks,
    getPurchasedBooksStats
} = require("../controllers/purchasedBooks");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.post("/", createPurchasedBook);

// Protected routes (Admin only)
router.use(protect);
router.use(authorize("admin"));

router.get("/", getPurchasedBooks);
router.get("/stats", getPurchasedBooksStats);
router.get("/export", exportPurchasedBooks);
router.get("/:id", getPurchasedBook);
router.put("/:id", updatePurchasedBook);
router.delete("/:id", deletePurchasedBook);
router.put("/:id/status", updateBookStatus);

module.exports = router;