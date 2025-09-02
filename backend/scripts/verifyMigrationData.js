const mongoose = require("mongoose");
const WebsiteContentSection = require("../models/WebsiteContentSection");
const WebsiteContent = require("../models/WebsiteContent");
require("dotenv").config({ path: "../.env" });

async function verifyMigrationData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/tls-projects");
        console.log("Connected to MongoDB");

        // Check WebsiteContentSection collection
        console.log("\n=== WebsiteContentSection Collection ===");
        const sectionCount = await WebsiteContentSection.countDocuments();
        console.log(`Total sections: ${sectionCount}`);

        if (sectionCount > 0) {
            // Get unique page names
            const pageNames = await WebsiteContentSection.distinct("pageName");
            console.log(`\nUnique page names: ${pageNames.join(", ")}`);

            // Show sample data for each page
            for (const pageName of pageNames) {
                const sections = await WebsiteContentSection.find({ pageName }).limit(3);
                console.log(`\n--- ${pageName} page (showing first 3 sections) ---`);
                sections.forEach(section => {
                    console.log(`  - ${section.sectionKey}: "${section.sectionTitle}" (${section.contentHtml ? section.contentHtml.substring(0, 50) + "..." : "empty"})`);
                });
            }
        } else {
            console.log("No sections found in WebsiteContentSection collection!");
        }

        // Check old WebsiteContent collection
        console.log("\n=== Old WebsiteContent Collection ===");
        const oldContentCount = await WebsiteContent.countDocuments();
        console.log(`Total old content records: ${oldContentCount}`);

        if (oldContentCount > 0) {
            const oldContent = await WebsiteContent.find().limit(5);
            console.log("\nSample old content:");
            oldContent.forEach(content => {
                console.log(`  - Page: ${content.page}, Type: ${content.type}, Content length: ${content.content ? content.content.length : 0}`);
            });
        }

        // Test specific page queries that are failing
        console.log("\n=== Testing Specific Page Queries ===");
        const testPages = ["home", "about", "books", "ebooks", "projects"];
        
        for (const page of testPages) {
            const sections = await WebsiteContentSection.find({ pageName: page });
            console.log(`${page}: ${sections.length} sections found`);
            
            if (sections.length > 0) {
                console.log(`  Sample section keys: ${sections.slice(0, 3).map(s => s.sectionKey).join(", ")}`);
            }
        }

    } catch (error) {
        console.error("Error verifying migration data:", error);
    } finally {
        await mongoose.connection.close();
        console.log("\nDatabase connection closed");
    }
}

verifyMigrationData();