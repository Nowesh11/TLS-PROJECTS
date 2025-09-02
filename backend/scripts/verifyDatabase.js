const mongoose = require("mongoose");
const WebsiteContent = require("../models/WebsiteContent");
require("dotenv").config();

const verifyDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");
        console.log("Database name:", mongoose.connection.db.databaseName);
        console.log("Collection name:", WebsiteContent.collection.name);
        
        // Get all collections in the database
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("\nAll collections in database:");
        collections.forEach(col => {
            console.log(`  - ${col.name}`);
        });
        
        // Check total documents in WebsiteContent collection
        const totalDocs = await WebsiteContent.countDocuments();
        console.log(`\nTotal documents in ${WebsiteContent.collection.name}: ${totalDocs}`);
        
        // Check documents by page
        const pages = await WebsiteContent.distinct("page");
        console.log("\nPages in collection:");
        for (const page of pages) {
            const count = await WebsiteContent.countDocuments({ page });
            console.log(`  ${page}: ${count}`);
        }
        
        // Check if there are any other content-related collections
        const contentCollections = collections.filter(col => 
            col.name.toLowerCase().includes("content") || 
            col.name.toLowerCase().includes("website")
        );
        
        console.log("\nContent-related collections:");
        for (const col of contentCollections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`  ${col.name}: ${count} documents`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

verifyDatabase();