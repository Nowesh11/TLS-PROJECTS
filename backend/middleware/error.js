const ErrorResponse = require("../utils/errorResponse");

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }

  // Check if this is an API request
  if (req.originalUrl && req.originalUrl.startsWith("/api/")) {
    // Always send JSON response for API requests
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Server Error"
    });
  }
  
  // Check if the request accepts HTML (for non-API requests)
  if (req.accepts("html")) {
    // Send the error.html file for HTML requests
    return res.status(error.statusCode || 500).sendFile("error.html", { root: "c:\\Users\\22004\\OneDrive\\Desktop\\TLS PROJECTS\\frontend\\views" });
  }
  
  // Send JSON response for other requests
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error"
  });
};

module.exports = errorHandler;