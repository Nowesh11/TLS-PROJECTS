const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

async function checkAllCollections() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/tls-projects");
        console.log("Connected to MongoDB");

        // Get all collections in the database
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("\n=== All Collections in Database ===");
        
        if (collections.length === 0) {
            console.log("No collections found in database!");
        } else {
            for (const collection of collections) {
                const collectionName = collection.name;
                const count = await mongoose.connection.db.collection(collectionName).countDocuments();
                console.log(`${collectionName}: ${count} documents`);
                
                // Show sample data for collections with content
                if (count > 0 && count < 20) {
                    const sampleDocs = await mongoose.connection.db.collection(collectionName).find().limit(3).toArray();
                    console.log("  Sample documents:");
                    sampleDocs.forEach((doc, index) => {
                        console.log(`    ${index + 1}. ${JSON.stringify(doc, null, 2).substring(0, 200)}...`);
                    });
                }
            }
        }

        // Check if there are any website-related collections
        console.log("\n=== Looking for Website Content ===");
        const websiteCollections = collections.filter(c => 
            c.name.toLowerCase().includes("website") || 
            c.name.toLowerCase().includes("content") ||
            c.name.toLowerCase().includes("page")
        );
        
        if (websiteCollections.length > 0) {
            console.log("Found website-related collections:");
            websiteCollections.forEach(c => console.log(`  - ${c.name}`));
        } else {
            console.log("No website-related collections found.");
        }

    } catch (error) {
        console.error("Error checking collections:", error);
    } finally {
        await mongoose.connection.close();
        console.log("\nDatabase connection closed");
    }
}

checkAllCollections();