const fetch = require("node-fetch");
const FormData = require("form-data");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const testWithAdminUser = async () => {
    try {
        console.log("Connecting to database...");
        await mongoose.connect("mongodb://localhost:27017/tamilsociety");
        
        // Get models
        const User = require("./models/User");
        const Book = require("./models/Book");
        
        // Create or find admin user
        console.log("Creating/finding admin user...");
        let adminUser = await User.findOne({ email: "admin@example.com" });
        
        if (!adminUser) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("admin123", salt);
            
            adminUser = await User.create({
                name: "Admin User",
                email: "admin@example.com",
                password: hashedPassword,
                role: "admin",
                emailVerified: true
            });
            console.log("Admin user created:", adminUser.email, "Role:", adminUser.role);
        } else {
            // Update existing user to admin if needed
            if (adminUser.role !== "admin") {
                adminUser.role = "admin";
                await adminUser.save();
                console.log("Updated existing user to admin role");
            }
            console.log("Admin user found:", adminUser.email, "Role:", adminUser.role);
        }
        
        // Get a book for testing
        const book = await Book.findOne();
        if (!book) {
            console.log("No books found in database");
            return;
        }
        
        console.log(`Testing upload for book: ${book.title} ID: ${book._id}`);
        console.log(`Current coverImage: ${book.coverImage}`);
        
        // Login as admin
        console.log("Logging in as admin...");
        const loginResponse = await fetch("http://localhost:8080/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: "admin@example.com",
                password: "admin123"
            })
        });
        
        console.log("Login response status:", loginResponse.status);
        
        if (loginResponse.status !== 200) {
            const loginError = await loginResponse.text();
            console.log("Login failed:", loginError);
            return;
        }
        
        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log("Login successful! User role:", loginData.user?.role);
        
        // Create a test image (1x1 pixel PNG)
        const pngData = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", "base64");
        
        // Create form data
        const formData = new FormData();
        formData.append("coverImage", pngData, {
            filename: "test-cover.png",
            contentType: "image/png"
        });
        
        console.log("Making authenticated upload request...");
        
        // Make upload request with authentication
        const uploadResponse = await fetch(`http://localhost:8080/api/books/${book._id}/upload-cover`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                ...formData.getHeaders()
            },
            body: formData
        });
        
        console.log("Upload response status:", uploadResponse.status);
        console.log("Upload response headers:", Object.fromEntries(uploadResponse.headers));
        
        const uploadResult = await uploadResponse.text();
        console.log("Upload response body:", uploadResult);
        
        if (uploadResponse.status === 200) {
            console.log("✓ Upload successful!");
            
            // Check if book was updated in database
            const updatedBook = await Book.findById(book._id);
            console.log("Updated book coverImage:", updatedBook.coverImage);
            console.log("Updated book responsiveImages:", updatedBook.responsiveImages);
            
            // Test the image URL
            const imageUrl = `http://localhost:8080${updatedBook.coverImage}`;
            console.log("\nTest image URL:", imageUrl);
            
        } else {
            console.log("✗ Upload failed");
        }
        
    } catch (error) {
        console.error("Test failed:", error.message);
        console.error("Stack:", error.stack);
    } finally {
        mongoose.connection.close();
    }
};

testWithAdminUser();