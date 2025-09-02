const mongoose = require("mongoose");
const { seedDatabase } = require("./seedData");

// Load environment variables
require("dotenv").config({ path: "./config/.env" });

async function runSeeding() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connected to MongoDB");

        // Run seeding
        await seedDatabase();

        // Close connection
        await mongoose.connection.close();
        console.log("Database connection closed");
        process.exit(0);
    } catch (error) {
        console.error("Error running seed script:", error);
        process.exit(1);
    }
}

runSeeding();