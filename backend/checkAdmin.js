const mongoose = require("mongoose");
const User = require("./models/User");

async function checkAdmin() {
  try {
    await mongoose.connect("mongodb://localhost:27017/tamil-language-society");
    console.log("Connected to database");
    
    const admin = await User.findOne({ email: "admin@tamilsociety.org" });
    
    if (admin) {
      console.log("Admin user found:", {
        email: admin.email,
        role: admin.role,
        id: admin._id,
        hasPassword: !!admin.password
      });
    } else {
      console.log("No admin user found");
    }
    
    // Also check all users
    const allUsers = await User.find({});
    console.log("Total users in database:", allUsers.length);
    
    process.exit(0);
  } catch (err) {
    console.error("Database error:", err.message);
    process.exit(1);
  }
}

checkAdmin();