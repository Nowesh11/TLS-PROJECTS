const mongoose = require("mongoose");
const Ebook = require("./models/Ebook");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "config/.env") });

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/tamilsociety";
console.log("Connecting to MongoDB:", mongoUri);

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log("Connected to database");
    
    try {
        // Get list of actual PDF files in uploads/ebooks directory
        const uploadsDir = path.join(__dirname, "public/uploads/ebooks");
        const files = fs.readdirSync(uploadsDir);
        const pdfFiles = files.filter(f => f.toLowerCase().endsWith(".pdf"));
        
        console.log("PDF files found in uploads/ebooks:", pdfFiles);
        
        // Get all ebooks from database
        const allEbooks = await Ebook.find({}).select("_id title fileUrl");
        console.log("\nEbooks in database:", allEbooks.length);
        
        // Update ebooks to use actual PDF files
        for (let i = 0; i < Math.min(allEbooks.length, pdfFiles.length); i++) {
            const ebook = allEbooks[i];
            const pdfFile = pdfFiles[i];
            const newFileUrl = `/uploads/ebooks/${pdfFile}`;
            
            console.log(`Updating ${ebook.title}: ${ebook.fileUrl} -> ${newFileUrl}`);
            
            await Ebook.findByIdAndUpdate(ebook._id, {
                fileUrl: newFileUrl
            });
        }
        
        // Show updated results
        const updatedEbooks = await Ebook.find({}).select("title fileUrl coverImage");
        console.log("\nUpdated ebook file URLs:");
        updatedEbooks.forEach(ebook => {
            console.log(`${ebook.title}: fileUrl=${ebook.fileUrl}, coverImage=${ebook.coverImage}`);
        });
        
        console.log("\nUpdate completed successfully!");
        
    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit();
    }
}).catch(err => {
    console.error("Database connection error:", err);
    process.exit(1);
});