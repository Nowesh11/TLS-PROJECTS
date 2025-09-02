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

async function createCustomAdminUser() {
    try {
        const adminEmail = "nowesh03@gmail.com";
        const adminPassword = "admin123";
        
        // Check if admin user already exists
        const existingAdmin = await User.findOne({ email: adminEmail });
        
        if (existingAdmin) {
            console.log("Admin user already exists with this email:");
            console.log("Email:", existingAdmin.email);
            console.log("Role:", existingAdmin.role);
            console.log("Name:", existingAdmin.name);
            
            // Update the existing user to ensure they have admin role
            existingAdmin.role = "admin";
            await existingAdmin.save();
            console.log("Updated user role to admin");
            return;
        }

        // Create new admin user
        const adminUser = new User({
            name: "Nowesh Admin",
            email: adminEmail,
            password: adminPassword, // This will be hashed by the pre-save middleware
            role: "admin",
            primaryInterest: "Books",
            preferences: {
                receiveNewsletter: true,
                receiveNotifications: true,
                theme: "light",
                language: "english"
            }
        });

        await adminUser.save();
        console.log("Admin user created successfully!");
        console.log("Email:", adminEmail);
        console.log("Password:", adminPassword);
        console.log("Role: admin");
        
    } catch (error) {
        console.error("Error creating admin user:", error);
    } finally {
        mongoose.connection.close();
    }
}

createCustomAdminUser();