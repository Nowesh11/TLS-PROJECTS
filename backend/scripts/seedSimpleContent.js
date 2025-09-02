const mongoose = require("mongoose");
const WebsiteContent = require("../models/WebsiteContent");
const User = require("../models/User");
require("dotenv").config({ path: "./.env" });

// Connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("Database connection error:", error);
        process.exit(1);
    }
};

// Sample website content data (will be populated with createdBy after getting admin user)
let sampleContent = [
    {
        page: "home",
        section: "main",
        sectionKey: "home-main",
        title: "Welcome to TLS Projects",
        content: "<h1>Welcome to our website</h1><p>This is our homepage content showcasing our projects and services.</p><p>We are dedicated to providing excellent solutions and services to our clients.</p>",
        order: 1,
        isActive: true,
        isVisible: true
    },
    {
        page: "about",
        section: "main",
        sectionKey: "about-main",
        title: "About Us",
        content: "<h1>About Our Company</h1><p>We are dedicated to excellence in everything we do.</p><p>Our team consists of experienced professionals who are passionate about delivering high-quality results.</p>",
        order: 1,
        isActive: true,
        isVisible: true
    },
    {
        page: "contact",
        section: "main",
        sectionKey: "contact-main",
        title: "Contact Us",
        content: "<h1>Contact Information</h1><p>Get in touch with us for any inquiries or support.</p><p>Email us at info@tlsprojects.com or call us at +1-234-567-8900</p>",
        order: 1,
        isActive: true,
        isVisible: true
    },
    {
        page: "projects",
        section: "main",
        sectionKey: "projects-main",
        title: "Our Projects",
        content: "<h1>Featured Projects</h1><p>Explore our portfolio of successful projects and innovative solutions.</p><p>We have worked on various projects across different industries and domains.</p>",
        order: 1,
        isActive: true,
        isVisible: true
    },
    {
        page: "books",
        section: "main",
        sectionKey: "books-main",
        title: "Books Collection",
        content: "<h1>Our Book Collection</h1><p>Discover our curated collection of books covering various topics and genres.</p><p>From technical guides to inspiring stories, we have something for everyone.</p>",
        order: 1,
        isActive: true,
        isVisible: true
    },
    {
        page: "ebooks",
        section: "main",
        sectionKey: "ebooks-main",
        title: "Digital Books",
        content: "<h1>E-Books Library</h1><p>Access our digital library with instant downloads and convenient reading options.</p><p>Perfect for modern readers who prefer digital formats.</p>",
        order: 1,
        isActive: true,
        isVisible: true
    }
];

// Seed function
const seedContent = async () => {
    try {
        console.log("Starting content seeding...");
        
        // Find an admin user to use as createdBy
        let adminUser = await User.findOne({ role: "admin" });
        if (!adminUser) {
            console.log("No admin user found, creating one for seeding...");
            adminUser = await User.create({
                name: "System Admin",
                email: "admin@system.local",
                password: "temp123",
                role: "admin",
                isActive: true
            });
        }
        
        console.log(`Using admin user: ${adminUser.email}`);
        
        // Add createdBy to all content items
        sampleContent = sampleContent.map(item => ({
            ...item,
            createdBy: adminUser._id,
            updatedBy: adminUser._id
        }));
        
        // Clear existing simple content
        await WebsiteContent.deleteMany({ section: "main" });
        console.log("Cleared existing main content");
        
        // Insert sample content
        const createdContent = await WebsiteContent.insertMany(sampleContent);
        console.log(`Successfully seeded ${createdContent.length} content items`);
        
        // Display created content
        createdContent.forEach(item => {
            console.log(`- ${item.page}: ${item.title}`);
        });
        
        console.log("Content seeding completed successfully!");
        
    } catch (error) {
        console.error("Error seeding content:", error);
    } finally {
        mongoose.connection.close();
    }
};

// Run the seeding
const runSeed = async () => {
    await connectDB();
    await seedContent();
};

runSeed();