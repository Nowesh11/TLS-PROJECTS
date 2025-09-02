const mongoose = require("mongoose");
const Book = require("./models/Book");
const path = require("path");
const fs = require("fs");

// Test updating a book's cover image
const testBookImageUpdate = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/tamilsociety");
        console.log("Connected to database");
        
        // Get the first book
        const book = await Book.findOne();
        if (!book) {
            console.log("No books found");
            return;
        }
        
        console.log("Found book:", book.title);
        console.log("Current coverImage:", book.coverImage);
        
        // Check if there are any actual image files in uploads/books
        const uploadsDir = path.join(__dirname, "public/uploads/books");
        const files = fs.readdirSync(uploadsDir);
        console.log("Files in uploads/books:", files);
        
        if (files.length > 0) {
            // Use the first image file found
            const imageFile = files.find(f => f.match(/\.(jpg|jpeg|png|webp|gif)$/i));
            if (imageFile) {
                const newCoverPath = `/uploads/books/${imageFile}`;
                console.log("Updating book coverImage to:", newCoverPath);
                
                // Update the book
                book.coverImage = newCoverPath;
                await book.save();
                
                console.log("Book updated successfully!");
                console.log("New coverImage:", book.coverImage);
                
                // Test the URL
                const testUrl = `http://localhost:8080${newCoverPath}`;
                console.log("Test this URL in browser:", testUrl);
            } else {
                console.log("No image files found in uploads/books");
            }
        } else {
            console.log("No files found in uploads/books directory");
        }
        
    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit();
    }
};

testBookImageUpdate();