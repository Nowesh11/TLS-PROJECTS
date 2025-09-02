const mongoose = require("mongoose");
const WebsiteContent = require("../models/WebsiteContent");
require("dotenv").config();

const testContentDates = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");
        
        const now = new Date();
        console.log("Current time:", now);
        
        // Check projects content dates
        const projectsContent = await WebsiteContent.find({ page: "projects" }).limit(3);
        
        console.log("\nProjects content:");
        projectsContent.forEach(item => {
            console.log(`${item.sectionKey}:`);
            console.log(`  publishedAt: ${item.publishedAt}`);
            console.log(`  expiresAt: ${item.expiresAt}`);
            console.log(`  isActive: ${item.isActive}`);
            console.log(`  isVisible: ${item.isVisible}`);
            console.log(`  publishedAt <= now: ${item.publishedAt ? item.publishedAt <= now : "null"}`);
        });
        
        // Update all content to have publishedAt in the past
        const updateResult = await WebsiteContent.updateMany(
            { page: { $in: ["projects", "books", "ebooks"] } },
            {
                $set: {
                    publishedAt: new Date(Date.now() - 60000), // 1 minute ago
                    isActive: true,
                    isVisible: true
                }
            }
        );
        
        console.log(`\nUpdated ${updateResult.modifiedCount} content entries with past publishedAt`);
        
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

testContentDates();