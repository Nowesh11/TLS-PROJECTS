const express = require("express");
const {
    getProjectParticipants,
    getProjectParticipant,
    createProjectParticipant,
    updateProjectParticipant,
    deleteProjectParticipant,
    updateParticipantStatus,
    exportProjectParticipants,
    getParticipantsByProject,
    getParticipantsStats
} = require("../controllers/projectParticipants");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.post("/", createProjectParticipant);
router.get("/project/:projectId", getParticipantsByProject);

// Protected routes (Admin only)
router.use(protect);
router.use(authorize("admin"));

router.get("/", getProjectParticipants);
router.get("/stats", getParticipantsStats);
router.get("/export", exportProjectParticipants);
router.get("/:id", getProjectParticipant);
router.put("/:id", updateProjectParticipant);
router.delete("/:id", deleteProjectParticipant);
router.put("/:id/status", updateParticipantStatus);

module.exports = router;