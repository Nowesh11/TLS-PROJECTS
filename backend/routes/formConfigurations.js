const express = require("express");
const {
    getFormConfigurations,
    getFormConfiguration,
    getFormConfigurationByItem,
    createFormConfiguration,
    updateFormConfiguration,
    deleteFormConfiguration,
    toggleFormConfiguration,
    duplicateFormConfiguration,
    getFormAnalytics
} = require("../controllers/formConfigurations");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.get("/item/:itemType/:itemId", getFormConfigurationByItem);

// Protected routes (Admin only)
router.use(protect);
router.use(authorize("admin"));

router.route("/")
    .get(getFormConfigurations)
    .post(createFormConfiguration);

router.route("/:id")
    .get(getFormConfiguration)
    .put(updateFormConfiguration)
    .delete(deleteFormConfiguration);

router.put("/:id/toggle", toggleFormConfiguration);
router.post("/:id/duplicate", duplicateFormConfiguration);
router.get("/:id/analytics", getFormAnalytics);

module.exports = router;