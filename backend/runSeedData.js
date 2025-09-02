const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "config", ".env") });
const { seedDatabase } = require("./scripts/seedData");

async function runSeeding() {
  try {
    // Connect to MongoDB
    mongoose.set("strictQuery", false);
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tamil-language-society", {
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log("Connected to MongoDB for seeding");
    
    // Run the seeding function
    await seedDatabase();
    
    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
}

runSeeding();