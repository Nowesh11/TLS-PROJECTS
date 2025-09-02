const mongoose = require("mongoose");
const WebsiteContent = require("../models/WebsiteContent");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/tamil_society", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function debugContentFiltering() {
    try {
        console.log("\n=== DEBUGGING CONTENT FILTERING ===\n");
        
        const now = new Date();
        console.log("Current time:", now.toISOString());
        
        // Get all projects, books, and ebooks content
        const targetPages = ["PROJECTS", "BOOKS", "EBOOKS"];
        
        for (const page of targetPages) {
            console.log(`\n--- ${page} Content ---`);
            
            const content = await WebsiteContent.find({ page: page });
            console.log(`Total ${page} content in DB:`, content.length);
            
            if (content.length > 0) {
                // Check each filtering condition
                console.log("\nFiltering Analysis:");
                
                // 1. isActive filter
                const activeContent = content.filter(item => item.isActive === true);
                console.log(`- isActive = true: ${activeContent.length}/${content.length}`);
                
                // 2. isVisible filter
                const visibleContent = content.filter(item => item.isVisible === true);
                console.log(`- isVisible = true: ${visibleContent.length}/${content.length}`);
                
                // 3. publishedAt filter
                const publishedContent = content.filter(item => 
                    item.publishedAt === null || item.publishedAt <= now
                );
                console.log(`- publishedAt <= now or null: ${publishedContent.length}/${content.length}`);
                
                // 4. expiresAt filter
                const notExpiredContent = content.filter(item => 
                    item.expiresAt === null || item.expiresAt > now
                );
                console.log(`- expiresAt > now or null: ${notExpiredContent.length}/${content.length}`);
                
                // Combined filter (what the API should return)
                const filteredContent = content.filter(item => 
                    item.isActive === true &&
                    item.isVisible === true &&
                    (item.publishedAt === null || item.publishedAt <= now) &&
                    (item.expiresAt === null || item.expiresAt > now)
                );
                console.log(`- Combined filter result: ${filteredContent.length}/${content.length}`);
                
                // Show sample item details
                if (content.length > 0) {
                    const sample = content[0];
                    console.log("\nSample item details:");
                    console.log("- _id:", sample._id);
                    console.log("- page:", sample.page);
                    console.log("- sectionKey:", sample.sectionKey);
                    console.log("- isActive:", sample.isActive);
                    console.log("- isVisible:", sample.isVisible);
                    console.log("- publishedAt:", sample.publishedAt ? sample.publishedAt.toISOString() : "null");
                    console.log("- expiresAt:", sample.expiresAt ? sample.expiresAt.toISOString() : "null");
                    console.log("- createdAt:", sample.createdAt ? sample.createdAt.toISOString() : "null");
                }
            }
        }
        
        // Now simulate the exact API query
        console.log("\n=== SIMULATING API QUERY ===\n");
        
        let query = WebsiteContent.find();
        
        // Apply the same filters as the API
        query = query.find({ isActive: true });
        query = query.find({ isVisible: true });
        query = query.find({
            $or: [
                { publishedAt: { $lte: now } },
                { publishedAt: null }
            ]
        });
        query = query.find({
            $or: [
                { expiresAt: { $gt: now } },
                { expiresAt: null }
            ]
        });
        
        const apiResult = await query;
        console.log("API simulation result:");
        console.log("Total items:", apiResult.length);
        
        const pageGroups = {};
        apiResult.forEach(item => {
            if (!pageGroups[item.page]) {
                pageGroups[item.page] = 0;
            }
            pageGroups[item.page]++;
        });
        
        console.log("\nBy page:");
        Object.keys(pageGroups).sort().forEach(page => {
            console.log(`- ${page}: ${pageGroups[page]}`);
        });
        
    } catch (error) {
        console.error("Error:", error);
    } finally {
        mongoose.connection.close();
    }
}

debugContentFiltering();