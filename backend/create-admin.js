const mongoose = require("mongoose");
const User = require("./models/User");
const path = require("path");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@tamilsociety.com" });
    
    if (existingAdmin) {
      console.log("Admin user already exists");
      console.log("Email: admin@tamilsociety.com");
      console.log("Role:", existingAdmin.role);
      // Update password to ensure it's correct
      const salt = await bcrypt.genSalt(10);
      existingAdmin.password = await bcrypt.hash("Admin123!", salt);
      await existingAdmin.save();
      console.log("Password updated successfully!");
      process.exit(0);
    }

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Admin123!", salt);
    
    const adminUser = await User.create({
      full_name: "Admin User",
      name: "Admin User",
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

    console.log("Admin user created successfully!");
    console.log("Email: admin@tamilsociety.com");
    console.log("Password: Admin123!");
    console.log("Role:", adminUser.role);
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
};

createAdmin();