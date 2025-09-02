const mongoose = require("mongoose");
const User = require("./models/User");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const testLogin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Find the admin user
    const user = await User.findOne({ email: "admin@tamilsociety.org" }).select("+password");
    
    if (!user) {
      console.log("❌ Admin user not found");
      process.exit(1);
    }

    console.log("✅ Admin user found:");
    console.log("   Email:", user.email);
    console.log("   Role:", user.role);
    console.log("   Password Hash:", user.password.substring(0, 20) + "...");
    
    // Test password matching
    const testPasswords = ["Admin123!", "admin123", "admin@123"];
    
    for (const password of testPasswords) {
      const isMatch = await user.matchPassword(password);
      console.log(`   Password "${password}": ${isMatch ? "✅ MATCH" : "❌ NO MATCH"}`);
    }
    
    // Check if account is locked
    if (user.isAccountLocked && user.isAccountLocked()) {
      console.log("⚠️  Account is locked");
      console.log("   Failed attempts:", user.loginAttempts?.count || 0);
      console.log("   Locked until:", user.loginAttempts?.lockedUntil);
    } else {
      console.log("✅ Account is not locked");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

testLogin();