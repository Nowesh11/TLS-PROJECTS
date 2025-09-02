// Script to clear the WebsiteContentSection collection
require("dotenv").config();
const mongoose = require("mongoose");
const WebsiteContentSection = require("../models/WebsiteContentSection");

async function clearWebsiteContentSections() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[CLEAR] Connected to MongoDB");
    
    // Clear the WebsiteContentSection collection
    const result = await WebsiteContentSection.deleteMany({});
    console.log(`[CLEAR] Successfully deleted ${result.deletedCount} sections from WebsiteContentSection collection`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("[CLEAR] Disconnected from MongoDB");
    
    console.log("[CLEAR] Collection cleared successfully. Restart the server to test automatic seeding.");
    process.exit(0);
  } catch (error) {
    console.error("[CLEAR] Error clearing WebsiteContentSection collection:", error);
    process.exit(1);
  }
}

// Run the function
clearWebsiteContentSections();