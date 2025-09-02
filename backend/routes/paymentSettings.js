const express = require("express");
const router = express.Router();
const {
    getPaymentGateways,
    getPaymentGateway,
    createPaymentGateway,
    updatePaymentGateway,
    deletePaymentGateway,
    activateGateway,
    deactivateGateway,
    testGateway,
    getPublicPaymentSettings,
    getGatewayByType
} = require("../controllers/paymentSettings");

const { protect, authorize } = require("../middleware/auth");

// Public routes
router.get("/public", getPublicPaymentSettings);

// Protected routes (admin only)
router.use(protect);
router.use(authorize("admin"));

router.route("/")
    .get(getPaymentGateways)
    .post(createPaymentGateway);

router.route("/:id")
    .get(getPaymentGateway)
    .put(updatePaymentGateway)
    .delete(deletePaymentGateway);

router.put("/:id/activate", activateGateway);
router.put("/:id/deactivate", deactivateGateway);
router.post("/:id/test", testGateway);
router.get("/gateway/:gateway", getGatewayByType);

module.exports = router;