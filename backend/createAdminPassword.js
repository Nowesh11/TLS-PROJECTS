const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

async function createAdminPassword() {
  try {
    await mongoose.connect("mongodb://localhost:27017/tamil-language-society");
    console.log("Connected to database");
    
    // Delete existing admin user
    await User.deleteOne({ email: "admin@tamilsociety.org" });
    console.log("Deleted existing admin user");
    
    // Create new admin user with password
    const newAdmin = new User({
      name: "Admin",
      email: "admin@tamilsociety.org",
      password: "admin123",
      role: "admin"
    });
    
    await newAdmin.save();
    console.log("New admin user created successfully");
    
    // Verify the new admin user (include password field)
    const admin = await User.findOne({ email: "admin@tamilsociety.org" }).select("+password");
    console.log("Admin user verified:", {
      email: admin.email,
      role: admin.role,
      hasPassword: !!admin.password,
      passwordLength: admin.password ? admin.password.length : 0,
      passwordHash: admin.password ? admin.password.substring(0, 10) + "..." : "none"
    });
    
    // Test password matching
    if (admin.password) {
      const isMatch = await bcrypt.compare("admin123", admin.password);
      console.log("Password verification test:", isMatch ? "PASSED" : "FAILED");
    }
    
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    console.error("Stack:", err.stack);
    process.exit(1);
  }
}

createAdminPassword();