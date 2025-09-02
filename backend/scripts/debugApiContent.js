const mongoose = require("mongoose");
const WebsiteContent = require("../models/WebsiteContent");
require("dotenv").config();

const debugApiContent = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");
        
        const now = new Date();
        console.log("Current time:", now);
        
        // Check what the API query would return
        console.log("\n=== Simulating API Query ===");
        
        // This is the exact query from the API controller
        let query = WebsiteContent.find();
        
        // Default filters for public access
        query = query.find({ isActive: true });
        query = query.find({ isVisible: true });
        
        // Filter by published content
        query = query.find({
            $or: [
                { publishedAt: { $lte: now } },
                { publishedAt: null }
            ]
        });
        
        // Filter out expired content
        query = query.find({
            $or: [
                { expiresAt: { $gt: now } },
                { expiresAt: null }
            ]
        });
        
        const apiResults = await query.sort("order createdAt");
        
        console.log(`API would return ${apiResults.length} items`);
        
        // Group by page
        const pageGroups = {};
        apiResults.forEach(item => {
            if (!pageGroups[item.page]) pageGroups[item.page] = 0;
            pageGroups[item.page]++;
        });
        
        console.log("\nPage breakdown:");
        Object.entries(pageGroups).forEach(([page, count]) => {
            console.log(`  ${page}: ${count}`);
        });
        
        // Now check what's in the database for projects, books, ebooks
        console.log("\n=== Database Content Check ===");
        const targetPages = ["projects", "books", "ebooks"];
        
        for (const page of targetPages) {
            const allContent = await WebsiteContent.find({ page });
            const activeContent = await WebsiteContent.find({ page, isActive: true });
            const visibleContent = await WebsiteContent.find({ page, isActive: true, isVisible: true });
            
            console.log(`\n${page.toUpperCase()}:`);
            console.log(`  Total in DB: ${allContent.length}`);
            console.log(`  Active: ${activeContent.length}`);
            console.log(`  Active & Visible: ${visibleContent.length}`);
            
            if (visibleContent.length > 0) {
                const sample = visibleContent[0];
                console.log("  Sample item:");
                console.log(`    sectionKey: ${sample.sectionKey}`);
                console.log(`    isActive: ${sample.isActive}`);
                console.log(`    isVisible: ${sample.isVisible}`);
                console.log(`    publishedAt: ${sample.publishedAt}`);
                console.log(`    expiresAt: ${sample.expiresAt}`);
                console.log(`    publishedAt <= now: ${sample.publishedAt ? sample.publishedAt <= now : "null"}`);
                console.log(`    expiresAt > now: ${sample.expiresAt ? sample.expiresAt > now : "null"}`);
            }
        }
        
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

debugApiContent();