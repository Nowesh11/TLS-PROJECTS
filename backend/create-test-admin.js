const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const createTestAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if test admin already exists
    const existingTestAdmin = await User.findOne({ email: "admin@tamilsociety.com" });
    
    if (existingTestAdmin) {
      console.log("Test admin user already exists");
      console.log("Email: admin@tamilsociety.com");
      console.log("Role:", existingTestAdmin.role);
      process.exit(0);
    }

    // Hash password manually since pre-save middleware is disabled
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Admin123", salt);

    // Create test admin user
    const testAdminUser = await User.create({
      name: "Test Admin User",
      email: "admin@tamilsociety.com",
      password: hashedPassword,
      role: "admin",
      primaryInterest: "Community",
      preferences: {
        receiveNewsletter: true,
        receiveNotifications: true,
        theme: "system",
        language: "english"
      }
    });

    console.log("Test admin user created successfully!");
    console.log("Email: admin@tamilsociety.com");
    console.log("Password: Admin123");
    console.log("Role:", testAdminUser.role);
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating test admin user:", error);
    process.exit(1);
  }
};

createTestAdmin();