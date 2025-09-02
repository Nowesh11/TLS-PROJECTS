const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fetch = require("node-fetch");
require("dotenv").config();

const debugLoginFlow = async () => {
    try {
        console.log("=== DEBUG LOGIN FLOW ===");
        
        // Connect to database
        console.log("1. Connecting to database...");
        await mongoose.connect("mongodb://localhost:27017/tamilsociety");
        
        const User = require("./models/User");
        
        // Check if user exists
        console.log("2. Checking if admin user exists...");
        const adminUser = await User.findOne({ email: "admin@example.com" });
        
        if (!adminUser) {
            console.log("❌ Admin user not found in database");
            return;
        }
        
        console.log("✅ Admin user found:");
        console.log("   - ID:", adminUser._id);
        console.log("   - Email:", adminUser.email);
        console.log("   - Role:", adminUser.role);
        console.log("   - Password hash length:", adminUser.password?.length || "No password");
        console.log("   - Account locked:", adminUser.isAccountLocked());
        console.log("   - Login attempts:", adminUser.loginAttempts.count);
        
        // Test password matching
        console.log("\n3. Testing password matching...");
        const testPassword = "admin123";
        const isMatch = await adminUser.matchPassword(testPassword);
        console.log("   - Password match result:", isMatch);
        
        if (!isMatch) {
            console.log("❌ Password does not match in database");
            return;
        }
        
        // Test login endpoint
        console.log("\n4. Testing login endpoint...");
        
        const loginData = {
            email: "admin@example.com",
            password: "admin123"
        };
        
        console.log("   - Sending login request...");
        
        const response = await fetch("http://localhost:8080/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(loginData)
        });
        
        console.log("   - Response status:", response.status);
        
        const responseText = await response.text();
        console.log("   - Response body:", responseText);
        
        // Check user again after login attempt
        console.log("\n5. Checking user after login attempt...");
        const userAfterLogin = await User.findOne({ email: "admin@example.com" });
        console.log("   - Login attempts after:", userAfterLogin.loginAttempts.count);
        console.log("   - Account locked after:", userAfterLogin.isAccountLocked());
        console.log("   - Last attempt:", userAfterLogin.loginAttempts.lastAttempt);
        
        if (response.status === 200) {
            console.log("\n✅ Login successful!");
            const responseData = JSON.parse(responseText);
            console.log("   - User role:", responseData.user?.role);
            console.log("   - Token received:", !!responseData.token);
        } else {
            console.log("\n❌ Login failed");
            try {
                const errorData = JSON.parse(responseText);
                console.log("   - Error message:", errorData.error);
            } catch (e) {
                console.log("   - Raw error:", responseText);
            }
        }
        
    } catch (error) {
        console.error("❌ Debug failed:", error.message);
        console.error("Stack:", error.stack);
    } finally {
        mongoose.connection.close();
    }
};

debugLoginFlow();