const express = require("express");
const {
    getPurchases,
    getPurchaseById,
    updatePurchase,
    markAsDelivered,
    refundPurchase,
    deletePurchase,
    getPurchaseStats
} = require("../controllers/purchaseController");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Protected routes (Admin only)
router.use(protect);
router.use(authorize("admin"));

router.get("/", getPurchases);
router.get("/stats", getPurchaseStats);
router.get("/:id", getPurchaseById);
router.put("/:id", updatePurchase);
router.put("/:id/deliver", markAsDelivered);
router.put("/:id/refund", refundPurchase);
router.delete("/:id", deletePurchase);

module.exports = router;