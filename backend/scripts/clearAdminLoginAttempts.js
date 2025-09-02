const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../config/.env") });

// Import User model
const User = require("../models/User");

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/tamilsociety";
console.log("Connecting to MongoDB:", mongoUri);

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function clearAdminLoginAttempts() {
    try {
        console.log("🔍 Finding all admin users...");
        
        // Find all admin users
        const adminUsers = await User.find({ role: "admin" });
        
        if (adminUsers.length === 0) {
            console.log("❌ No admin users found");
            return;
        }
        
        console.log(`📋 Found ${adminUsers.length} admin user(s):`);
        
        for (const admin of adminUsers) {
            console.log(`\n👤 Admin: ${admin.email}`);
            console.log(`   Name: ${admin.name}`);
            console.log(`   Login attempts: ${admin.loginAttempts.count}`);
            console.log(`   Locked until: ${admin.loginAttempts.lockedUntil}`);
            console.log(`   Is locked: ${admin.isAccountLocked()}`);
            
            // Clear login attempts
            admin.loginAttempts.count = 0;
            admin.loginAttempts.lockedUntil = null;
            admin.loginAttempts.lastAttempt = null;
            
            await admin.save();
            
            console.log(`   ✅ Login attempts cleared for ${admin.email}`);
        }
        
        console.log("\n🎉 All admin accounts have been unlocked and login attempts cleared!");
        console.log("📝 Summary:");
        console.log(`   - Total admin accounts processed: ${adminUsers.length}`);
        console.log("   - All accounts are now accessible");
        
    } catch (error) {
        console.error("❌ Error clearing admin login attempts:", error.message);
    } finally {
        // Close the database connection
        await mongoose.connection.close();
        console.log("\n📤 Database connection closed");
        process.exit(0);
    }
}

// Run the clear function
clearAdminLoginAttempts();