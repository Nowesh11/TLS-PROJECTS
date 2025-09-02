const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  console.log("Auth middleware called for:", req.method, req.url);
  console.log("Headers:", req.headers.authorization);
  console.log("Cookies:", req.cookies);

  // Check for token in headers or cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(" ")[1];
    console.log("Token from header:", token);
  } else if (req.cookies.token) {
    // Set token from cookie
    token = req.cookies.token;
    console.log("Token from cookie:", token);
  } else if (req.session && req.session.token) {
    // Set token from session
    token = req.session.token;
    console.log("Token from session:", token);
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Not authorized to access this route"
    });
  }

  try {
    // Verify JWT token
    console.log("Attempting to verify token:", token.substring(0, 50) + "...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token decoded successfully:", decoded);

    // Add user to req object
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      console.log("User not found for ID:", decoded.id);
      return res.status(401).json({
        success: false,
        error: "User not found"
      });
    }

    console.log("User authenticated:", req.user.email, req.user.role);
    next();
  } catch (err) {
    console.log("Token verification failed:", err.message);
    return res.status(401).json({
      success: false,
      error: "Not authorized to access this route"
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};