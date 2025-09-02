const express = require("express");
const {
    getInitiatives,
    getInitiative,
    createInitiative,
    updateInitiative,
    deleteInitiative,
    getInitiativeBureaus,
    getInitiativeStats,
    uploadInitiativeImages,
    deleteInitiativeImage,
    setPrimaryImage
} = require("../controllers/initiatives");

const { protect, authorize } = require("../middleware/auth");


const router = express.Router();

// Public routes
router.get("/", getInitiatives);
router.get("/bureaus", getInitiativeBureaus);
router.get("/:id", getInitiative);

// Protected routes (Admin only)
router.use(protect);
router.use(authorize("admin"));

router.get("/stats", getInitiativeStats);
router.post("/", createInitiative);
router.put("/:id", updateInitiative);
router.delete("/:id", deleteInitiative);

// Image management routes
router.post("/:id/images", uploadInitiativeImages);
router.delete("/images/:imageId", deleteInitiativeImage);
router.patch("/images/:imageId/primary", setPrimaryImage);

module.exports = router;