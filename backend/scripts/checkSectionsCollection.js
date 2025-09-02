const mongoose = require("mongoose");
require("dotenv").config();

const checkSectionsCollection = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");
        
        // Check websitecontentsections collection
        const sectionsCollection = mongoose.connection.db.collection("websitecontentsections");
        const sections = await sectionsCollection.find({}).toArray();
        
        console.log("\nWebsiteContentSections collection:");
        console.log(`Total documents: ${sections.length}`);
        
        sections.forEach((section, index) => {
            console.log(`\nSection ${index + 1}:`);
            console.log(`  _id: ${section._id}`);
            console.log(`  page: ${section.page}`);
            console.log(`  section: ${section.section}`);
            console.log(`  isActive: ${section.isActive}`);
            console.log(`  order: ${section.order}`);
        });
        
        // Also check if there are any other content documents that might be interfering
        const contentCollection = mongoose.connection.db.collection("websitecontents");
        const allContent = await contentCollection.find({}).toArray();
        
        console.log("\n=== WebsiteContents Analysis ===");
        console.log(`Total documents: ${allContent.length}`);
        
        // Group by page
        const pageGroups = {};
        allContent.forEach(item => {
            if (!pageGroups[item.page]) pageGroups[item.page] = [];
            pageGroups[item.page].push(item.sectionKey);
        });
        
        console.log("\nContent by page:");
        Object.entries(pageGroups).forEach(([page, sectionKeys]) => {
            console.log(`\n${page.toUpperCase()} (${sectionKeys.length} items):`);
            sectionKeys.slice(0, 3).forEach(key => console.log(`  - ${key}`));
            if (sectionKeys.length > 3) {
                console.log(`  ... and ${sectionKeys.length - 3} more`);
            }
        });
        
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

checkSectionsCollection();