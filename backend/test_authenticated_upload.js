const fetch = require("node-fetch");
const FormData = require("form-data");
const mongoose = require("mongoose");
require("dotenv").config();

const testAuthenticatedUpload = async () => {
    try {
        console.log("Connecting to database...");
        await mongoose.connect("mongodb://localhost:27017/tamilsociety");
        
        // Get a book ID from database
        const Book = require("./models/Book");
        const book = await Book.findOne();
        
        if (!book) {
            console.log("No books found in database");
            return;
        }
        
        console.log(`Testing upload for book: ${book.title} ID: ${book._id}`);
        console.log(`Current coverImage: ${book.coverImage}`);
        
        // First, try to login as admin
        console.log("Attempting to login as admin...");
        
        const loginResponse = await fetch("http://localhost:8080/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: "admin@example.com", // Default admin email
                password: "admin123" // Default admin password
            })
        });
        
        console.log("Login response status:", loginResponse.status);
        
        if (loginResponse.status !== 200) {
            const loginError = await loginResponse.text();
            console.log("Login failed:", loginError);
            
            // Try to create admin user if login fails
            console.log("Attempting to register admin user...");
            const registerResponse = await fetch("http://localhost:8080/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: "Admin User",
                    email: "admin@example.com",
                    password: "admin123",
                    role: "admin"
                })
            });
            
            console.log("Register response status:", registerResponse.status);
            const registerResult = await registerResponse.text();
            console.log("Register result:", registerResult);
            
            if (registerResponse.status !== 201) {
                console.log("Failed to create admin user. Exiting.");
                return;
            }
            
            // Try login again
            const loginResponse2 = await fetch("http://localhost:8080/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: "admin@example.com",
                    password: "admin123"
                })
            });
            
            if (loginResponse2.status !== 200) {
                console.log("Login still failed after registration");
                return;
            }
            
            const loginData2 = await loginResponse2.json();
            var token = loginData2.token;
        } else {
            const loginData = await loginResponse.json();
            var token = loginData.token;
        }
        
        console.log("Login successful! Token received.");
        
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

testAuthenticatedUpload();