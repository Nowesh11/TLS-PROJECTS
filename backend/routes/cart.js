const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    checkoutCart
} = require("../controllers/cart");

const { protect } = require("../middleware/auth");
const { optionalAuth } = require("../middleware/optionalAuth");

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed"), false);
        }
    }
});

// Apply optional auth middleware to all cart routes
router.use(optionalAuth);

// Cart routes
router.route("/")
    .get(getCart)
    .delete(clearCart);

router.post("/add", addToCart);
router.put("/update", updateCartItem);
router.delete("/remove", removeFromCart);
router.post("/checkout", upload.single("paymentProof"), checkoutCart);

module.exports = router;