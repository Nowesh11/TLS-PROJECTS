const mongoose = require("mongoose");
const WebsiteContent = require("../models/WebsiteContent");
require("dotenv").config();

const checkContent = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");
        
        // Check total content count
        const totalCount = await WebsiteContent.countDocuments();
        console.log("Total content count:", totalCount);
        
        // Check projects/books/ebooks content
        const targetPages = ["projects", "books", "ebooks"];
        for (const page of targetPages) {
            const count = await WebsiteContent.countDocuments({ page });
            console.log(`${page} content count:`, count);
            
            if (count > 0) {
                const samples = await WebsiteContent.find({ page }).limit(3).select("sectionKey title");
                console.log(`${page} samples:`, samples.map(s => ({ sectionKey: s.sectionKey, title: s.title })));
            }
        }
        
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

checkContent();