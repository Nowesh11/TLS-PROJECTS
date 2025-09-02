const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Optional authentication - doesn't block if no token, but adds user if valid token exists
exports.optionalAuth = async (req, res, next) => {
  let token;

  // Check for token in headers or cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.session && req.session.token) {
    token = req.session.token;
  }

  // If no token, continue without user
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user to req object
    req.user = await User.findById(decoded.id);
    
    next();
  } catch (err) {
    // If token is invalid, continue without user
    req.user = null;
    next();
  }
};

// Require authentication for specific actions
exports.requireAuth = (action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: `Authentication required for ${action}`,
        action: action,
        requiresAuth: true
      });
    }
    next();
  };
};