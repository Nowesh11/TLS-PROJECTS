const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../config/.env") });

// Import User model
const User = require("../models/User");

// Connect to MongoDB with fallback URI
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/tamilsociety";
console.log("Connecting to MongoDB:", mongoUri);

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function createAdminUser() {
    try {
        // Check if admin user already exists
        const existingAdmin = await User.findOne({ email: "admin@tamilsociety.org" });
        
        if (existingAdmin) {
            console.log("Admin user already exists:");
            console.log("Email:", existingAdmin.email);
            console.log("Role:", existingAdmin.role);
            console.log("Name:", existingAdmin.name);
            return;
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash("admin123", 12);
        
        const adminUser = new User({
            name: "Admin User",
            email: "admin@tamilsociety.org",
            password: hashedPassword,
            role: "admin",
            isVerified: true
        });

        await adminUser.save();
        console.log("Admin user created successfully!");
        console.log("Email: admin@tamilsociety.org");
        console.log("Password: admin123");
        console.log("Role: admin");
        
    } catch (error) {
        console.error("Error creating admin user:", error);
    } finally {
        mongoose.connection.close();
    }
}

createAdminUser();