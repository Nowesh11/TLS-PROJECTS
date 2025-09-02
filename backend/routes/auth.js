const express = require("express");
const router = express.Router();
const { 
  register, 
  login, 
  logout, 
  getMe, 
  updateDetails, 
  updatePassword, 
  forgotPassword, 
  resetPassword,
  verifyToken,
  refreshToken 
} = require("../controllers/auth");

const { protect } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout); // Changed from GET to POST
router.get("/me", protect, getMe);
router.put("/updatedetails", protect, updateDetails);
router.put("/updatepassword", protect, updatePassword);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resettoken", resetPassword);
router.get("/verify-token", protect, verifyToken);
router.post("/refresh", refreshToken);



module.exports = router;