const express = require("express");
const router = express.Router();
const {
    getActivePoster,
    getAllPosters,
    getPoster,
    createPoster,
    updatePoster,
    deletePoster,
    togglePosterStatus,
    trackPosterClick,
    getPosterStats
} = require("../controllers/poster");
const { protect, admin } = require("../middleware/auth");

// Public routes
router.get("/active", getActivePoster);
router.post("/:id/click", trackPosterClick);

// Admin routes
router.use(protect);
router.use(admin);

router.route("/")
    .get(getAllPosters)
    .post(createPoster);

router.route("/stats")
    .get(getPosterStats);

router.route("/:id")
    .get(getPoster)
    .put(updatePoster)
    .delete(deletePoster);

router.put("/:id/toggle", togglePosterStatus);

module.exports = router;