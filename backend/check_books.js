const mongoose = require("mongoose");
const Book = require("./models/Book");

mongoose.connect("mongodb://localhost:27017/tamilsociety").then(async () => {
    console.log("Connected to database");
    
    // Check for books with uploaded images
    const booksWithUploads = await Book.find({ 
        coverImage: { $regex: /uploads/ } 
    }).select("title coverImage images");
    
    console.log("Books with uploaded images:", booksWithUploads.length);
    console.log(JSON.stringify(booksWithUploads, null, 2));
    
    // Check total books
    const totalBooks = await Book.countDocuments();
    console.log("Total books in database:", totalBooks);
    
    // Show all coverImage values
    const allBooks = await Book.find({}).select("title coverImage");
    console.log("\nAll book cover images:");
    allBooks.forEach(book => {
        console.log(`${book.title}: ${book.coverImage}`);
    });
    
    process.exit();
}).catch(err => {
    console.error("Database connection error:", err);
    process.exit(1);
});