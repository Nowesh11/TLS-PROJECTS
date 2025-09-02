const express = require("express");
const {
    getTeamMembers,
    getTeamMember,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
    teamPhotoUpload,
    getTeamHierarchy
} = require("../controllers/team");

const Team = require("../models/Team");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

router
    .route("/")
    .get(getTeamMembers)
    .post(protect, authorize("admin"), createTeamMember);

router
    .route("/hierarchy")
    .get(getTeamHierarchy);

router
    .route("/slug/:slug")
    .get(getTeamMember);

router
    .route("/:id")
    .get(getTeamMember)
    .put(protect, authorize("admin"), updateTeamMember)
    .delete(protect, authorize("admin"), deleteTeamMember);

router
    .route("/:id/photo")
    .put(protect, authorize("admin"), teamPhotoUpload);

module.exports = router;