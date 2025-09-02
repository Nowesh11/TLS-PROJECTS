const express = require("express");
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  bulkOperations,
  toggleUserStatus
} = require("../controllers/users");
const { protect, authorize } = require("../middleware/auth");

router
  .route("/")
  .get(protect, authorize("admin"), getUsers)
  .post(protect, authorize("admin"), createUser);

router
  .route("/bulk")
  .post(protect, authorize("admin"), bulkOperations);

router
  .route("/:id")
  .get(protect, authorize("admin"), getUser)
  .put(protect, authorize("admin"), updateUser)
  .delete(protect, authorize("admin"), deleteUser);

router
  .route("/:id/toggle-status")
  .put(protect, authorize("admin"), toggleUserStatus);

module.exports = router;