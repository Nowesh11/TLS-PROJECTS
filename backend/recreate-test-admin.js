const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const recreateTestAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Delete existing test admin if exists
    const deleteResult = await User.deleteOne({ email: "admin@tamilsociety.com" });
    console.log("Deleted existing test admin:", deleteResult.deletedCount > 0 ? "Yes" : "No");

    // Hash password manually
    const plainPassword = "Admin123";
    console.log("Plain password:", plainPassword);
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    console.log("Hashed password:", hashedPassword);
    
    // Verify the hash works
    const testMatch = await bcrypt.compare(plainPassword, hashedPassword);
    console.log("Hash verification:", testMatch);

    // Create new test admin user
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

    console.log("\nTest admin user recreated successfully!");
    console.log("Email: admin@tamilsociety.com");
    console.log("Password: Admin123");
    console.log("Role:", testAdminUser.role);
    
    // Test the model method
    const modelMatch = await testAdminUser.matchPassword(plainPassword);
    console.log("Model method test:", modelMatch);
    
    process.exit(0);
  } catch (error) {
    console.error("Error recreating test admin user:", error);
    process.exit(1);
  }
};

recreateTestAdmin();