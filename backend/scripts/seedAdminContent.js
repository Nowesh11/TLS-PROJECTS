const mongoose = require("mongoose");
const WebsiteContent = require("../models/WebsiteContent");
const User = require("../models/User");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/tamil-language-society", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const adminContentData = [
  {
    page: "admin-login",
    section: "header",
    sectionKey: "admin_login_header",
    sectionType: "text",
    layout: "full-width",
    position: 1,
    title: "Admin Login",
    titleTamil: "நிர்வாக உள்நுழைவு",
    content: "Access the administrative panel",
    contentTamil: "நிர்வாக பேனலை அணुகவும்",
    isActive: true,
    isVisible: true,
    order: 1
  },
  {
    page: "admin-login",
    section: "form",
    sectionKey: "admin_login_form",
    sectionType: "form",
    layout: "full-width",
    position: 2,
    title: "Login Form",
    titleTamil: "உள்நுழைவு படிவம்",
    content: "Enter your credentials to access the admin panel",
    contentTamil: "நிர்வாக பேனலை அணுக உங்கள் சான்றுகளை உள்ளிடவும்",
    isActive: true,
    isVisible: true,
    order: 2
  },
  {
    page: "admin",
    section: "dashboard",
    sectionKey: "admin_dashboard",
    sectionType: "text",
    layout: "full-width",
    position: 1,
    title: "Admin Dashboard",
    titleTamil: "நிர்வாக டாஷ்போர்டு",
    content: "Welcome to the Tamil Language Society Admin Panel",
    contentTamil: "தமிழ் மொழி சங்க நிர்வாக பேனலுக்கு வரவேற்கிறோம்",
    isActive: true,
    isVisible: true,
    order: 1
  }
];

async function seedAdminContent() {
  try {
    console.log("🌱 Seeding admin content...");
    
    // Find or create an admin user
    let adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      console.log("⚠️ No admin user found, creating default admin...");
      adminUser = await User.create({
        name: "System Admin",
        email: "admin@tamilsociety.org",
        password: "admin123",
        role: "admin",
        isActive: true
      });
    }
    console.log(`👤 Using admin user: ${adminUser.name} (${adminUser._id})`);
    
    // Add createdBy to all content items
    const contentWithCreator = adminContentData.map(item => ({
      ...item,
      createdBy: adminUser._id
    }));
    
    // Clear existing admin content
    await WebsiteContent.deleteMany({ page: { $in: ["admin-login", "admin"] } });
    console.log("🗑️ Cleared existing admin content");
    
    // Insert new admin content
    const result = await WebsiteContent.insertMany(contentWithCreator);
    console.log(`✅ Successfully seeded ${result.length} admin content items`);
    
    // Verify the data
    const adminLoginContent = await WebsiteContent.find({ page: "admin-login" });
    const adminContent = await WebsiteContent.find({ page: "admin" });
    
    console.log(`📊 Admin-login content: ${adminLoginContent.length} items`);
    console.log(`📊 Admin content: ${adminContent.length} items`);
    
    console.log("🎉 Admin content seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin content:", error);
    process.exit(1);
  }
}

seedAdminContent();