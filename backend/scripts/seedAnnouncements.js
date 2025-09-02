const mongoose = require("mongoose");
const Announcement = require("../models/Announcement");
const User = require("../models/User");
require("dotenv").config({ path: "../config/.env" });

// Sample announcements data
const sampleAnnouncements = [
    {
        title: "Welcome to Tamil Literary Society",
        content: "We are excited to announce the launch of our new digital platform! Explore our extensive collection of Tamil literature, participate in community discussions, and stay updated with our latest initiatives.",
        type: "general",
        priority: "high",
        status: "active",
        targetAudience: "all",
        showOnSite: true,
        sendEmail: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    },
    {
        title: "New Book Collection Added",
        content: "We have added over 50 new Tamil books to our digital library. Discover classic works by renowned authors and contemporary literature that reflects modern Tamil culture.",
        type: "book",
        priority: "medium",
        status: "active",
        targetAudience: "all",
        showOnSite: true,
        sendEmail: false,
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 days from now
    },
    {
        title: "Community Project: Digital Archive Initiative",
        content: "Join our community-driven project to digitize rare Tamil manuscripts and make them accessible to future generations. We are looking for volunteers with expertise in Tamil literature and digital archiving.",
        type: "project",
        priority: "high",
        status: "active",
        targetAudience: "all",
        showOnSite: true,
        sendEmail: true,
        expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) // 45 days from now
    },
    {
        title: "System Maintenance Scheduled",
        content: "Our platform will undergo scheduled maintenance on Sunday, 2:00 AM - 4:00 AM. During this time, some features may be temporarily unavailable. We apologize for any inconvenience.",
        type: "urgent",
        priority: "high",
        status: "active",
        targetAudience: "all",
        showOnSite: true,
        sendEmail: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    },
    {
        title: "Monthly Newsletter - December 2024",
        content: "Read our latest newsletter featuring book reviews, author interviews, upcoming events, and community highlights. Stay connected with the Tamil literary community worldwide.",
        type: "general",
        priority: "medium",
        status: "draft",
        targetAudience: "all",
        showOnSite: false,
        sendEmail: false,
        scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    }
];

// Seed function
const seedAnnouncements = async () => {
    try {
        console.log("Starting announcements seeding...");
        
        // Find an admin user to use as createdBy
        let adminUser = await User.findOne({ role: "admin" });
        if (!adminUser) {
            console.log("No admin user found, creating one for seeding...");
            adminUser = await User.create({
                name: "System Admin",
                email: "admin@tamilsociety.org",
                password: "admin123",
                role: "admin",
                isVerified: true
            });
        }
        
        console.log(`Using admin user: ${adminUser.email}`);
        
        // Add createdBy to all announcements
        const announcementsWithCreator = sampleAnnouncements.map(announcement => ({
            ...announcement,
            createdBy: adminUser._id
        }));
        
        // Clear existing announcements
        await Announcement.deleteMany({});
        console.log("Cleared existing announcements");
        
        // Insert sample announcements
        const createdAnnouncements = await Announcement.insertMany(announcementsWithCreator);
        console.log(`Successfully seeded ${createdAnnouncements.length} announcements`);
        
        // Display created announcements
        createdAnnouncements.forEach(announcement => {
            console.log(`- ${announcement.type.toUpperCase()}: ${announcement.title} (${announcement.status})`);
        });
        
        console.log("Announcements seeding completed successfully!");
        
    } catch (error) {
        console.error("Error seeding announcements:", error);
    } finally {
        mongoose.connection.close();
    }
};

// Connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tamil-language-society");
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("Database connection error:", error);
        process.exit(1);
    }
};

// Run the seeding
const runSeed = async () => {
    await connectDB();
    await seedAnnouncements();
};

runSeed();