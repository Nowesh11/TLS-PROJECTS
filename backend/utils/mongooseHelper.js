/**
 * Mongoose Helper Utility
 * This utility provides access to the real mongoose instance only.
 * Mock database functionality has been removed.
 */

let mongooseInstance = null;

const getMongoose = () => {
  // Return cached instance if available
  if (mongooseInstance) {
    return mongooseInstance;
  }
  
  // Always use real mongoose
  const mongoose = require("mongoose");
  console.log("[MONGOOSE HELPER] Using real MongoDB connection");
  mongooseInstance = mongoose;
  return mongooseInstance;
};

module.exports = getMongoose;