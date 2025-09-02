const mongoose = require("mongoose");
const Book = require("./models/Book");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const fetch = require("node-fetch");

// Test the upload endpoint
const testUploadEndpoint = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/tamilsociety");
        console.log("Connected to database");
        
        // Get a book to test with
        const book = await Book.findOne();
        if (!book) {
            console.log("No books found");
            return;
        }
        
        console.log("Testing upload for book:", book.title, "ID:", book._id);
        console.log("Current coverImage:", book.coverImage);
        
        // Create a simple test image (1x1 pixel PNG)
        const pngData = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", "base64");
        
        // Create form data
        const form = new FormData();
        form.append("coverImage", pngData, {
            filename: "test-cover.png",
            contentType: "image/png"
        });
        
        console.log("Making upload request...");
        
        // Test without authentication first to see the error
        const response = await fetch(`http://localhost:8080/api/books/${book._id}/upload-cover`, {
            method: "POST",
            body: form
        });
        
        console.log("Response status:", response.status);
        console.log("Response headers:", Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log("Response body:", responseText);
        
        // Check if it's an auth error (expected) or other error
        if (response.status === 401) {
            console.log("✓ Upload endpoint is working (authentication required as expected)");
        } else if (response.status === 404) {
            console.log("✗ Upload endpoint not found - route issue");
        } else {
            console.log("? Unexpected response status");
        }
        
    } catch (error) {
        console.error("Test failed:", error.message);
    } finally {
        process.exit();
    }
};

testUploadEndpoint();