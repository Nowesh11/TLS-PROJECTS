const mongoose = require("mongoose");
const WebsiteContent = require("../models/WebsiteContent");
require("dotenv").config();

const fixContentFields = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");
        
        // Check current content for projects, books, ebooks
        const targetPages = ["projects", "books", "ebooks"];
        
        for (const page of targetPages) {
            console.log(`\nChecking ${page} content...`);
            const content = await WebsiteContent.find({ page }).limit(2);
            
            if (content.length > 0) {
                console.log("Sample content fields:", {
                    sectionKey: content[0].sectionKey,
                    publishedAt: content[0].publishedAt,
                    expiresAt: content[0].expiresAt,
                    isActive: content[0].isActive,
                    isVisible: content[0].isVisible
                });
                
                // Update all content for this page to ensure proper fields
                const updateResult = await WebsiteContent.updateMany(
                    { page },
                    {
                        $set: {
                            publishedAt: new Date(),
                            isActive: true,
                            isVisible: true
                        },
                        $unset: {
                            expiresAt: 1
                        }
                    }
                );
                
                console.log(`Updated ${updateResult.modifiedCount} ${page} content entries`);
            } else {
                console.log(`No ${page} content found`);
            }
        }
        
        console.log("\nContent fields fixed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

fixContentFields();