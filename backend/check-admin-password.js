const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const checkAdminPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Find the test admin user
    const testAdmin = await User.findOne({ email: "admin@tamilsociety.com" });
    
    if (!testAdmin) {
      console.log("Test admin user not found");
      process.exit(1);
    }

    console.log("Test admin user found:");
    console.log("Email:", testAdmin.email);
    console.log("Role:", testAdmin.role);
    console.log("Password hash:", testAdmin.password);
    console.log("Password hash length:", testAdmin.password ? testAdmin.password.length : 'null');
    
    // Test password matching
    const testPassword = "Admin123";
    console.log("\nTesting password matching:");
    console.log("Test password:", testPassword);
    
    if (testAdmin.password) {
      const isMatch = await bcrypt.compare(testPassword, testAdmin.password);
      console.log("Password match result:", isMatch);
      
      // Also test the model method
      const modelMatch = await testAdmin.matchPassword(testPassword);
      console.log("Model method match result:", modelMatch);
    } else {
      console.log("No password hash found!");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error checking admin password:", error);
    process.exit(1);
  }
};

checkAdminPassword();