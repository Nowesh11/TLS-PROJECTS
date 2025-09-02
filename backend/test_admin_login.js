const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const testAdminLogin = async () => {
    try {
        console.log("Connecting to database...");
        await mongoose.connect("mongodb://localhost:27017/tamilsociety");
        
        const User = require("./models/User");
        
        // Find the admin user
        const adminUser = await User.findOne({ email: "admin@example.com" });
        
        if (!adminUser) {
            console.log("Admin user not found");
            return;
        }
        
        console.log("Admin user found:");
        console.log("- Email:", adminUser.email);
        console.log("- Role:", adminUser.role);
        console.log("- Password (hashed):", adminUser.password);
        console.log("- Account locked:", adminUser.isAccountLocked());
        console.log("- Login attempts:", adminUser.loginAttempts.count);
        
        // Test password matching
        const testPassword = "admin123";
        console.log("\nTesting password matching...");
        console.log("Test password:", testPassword);
        
        const isMatch = await adminUser.matchPassword(testPassword);
        console.log("Password match result:", isMatch);
        
        // Test bcrypt directly
        console.log("\nTesting bcrypt directly...");
        const directMatch = await bcrypt.compare(testPassword, adminUser.password);
        console.log("Direct bcrypt compare result:", directMatch);
        
        // Check if password is properly hashed
        console.log("\nPassword analysis:");
        console.log("Password starts with $2a$ or $2b$:", adminUser.password.startsWith("$2a$") || adminUser.password.startsWith("$2b$"));
        console.log("Password length:", adminUser.password.length);
        
    } catch (error) {
        console.error("Test failed:", error.message);
        console.error("Stack:", error.stack);
    } finally {
        mongoose.connection.close();
    }
};

testAdminLogin();