const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../config/.env") });

// Import models
const User = require("../models/User");
const Project = require("../models/Project");

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/tamilsociety";
console.log("Connecting to MongoDB:", mongoUri);

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const sampleUsers = [
    {
        name: "Arjun Krishnan",
        email: "arjun.krishnan@example.com",
        password: "password123",
        role: "user",
        primaryInterest: "Books",
        preferences: {
            receiveNewsletter: true,
            receiveNotifications: true,
            language: "tamil"
        }
    },
    {
        name: "Meera Rajesh",
        email: "meera.rajesh@example.com",
        password: "password123",
        role: "user",
        primaryInterest: "Culture",
        preferences: {
            receiveNewsletter: false,
            receiveNotifications: true,
            language: "tamil"
        }
    },
    {
        name: "Suresh Kumar",
        email: "suresh.kumar@example.com",
        password: "password123",
        role: "user",
        primaryInterest: "History",
        preferences: {
            receiveNewsletter: true,
            receiveNotifications: false,
            language: "english"
        }
    }
];

const sampleMessages = [
    {
        name: "Priya Selvam",
        email: "priya.selvam@example.com",
        subject: "Book Recommendation Request",
        message: "Hi, I am looking for recommendations on modern Tamil poetry books. Could you please suggest some good titles?",
        isRead: false
    },
    {
        name: "Ravi Chandran",
        email: "ravi.chandran@example.com",
        subject: "Cultural Event Inquiry",
        message: "I would like to know about upcoming cultural events organized by the Tamil Language Society. Please provide details.",
        isRead: false
    },
    {
        name: "Lakshmi Narayan",
        email: "lakshmi.narayan@example.com",
        subject: "Membership Information",
        message: "I am interested in becoming a member of the Tamil Language Society. Could you please send me the membership details and benefits?",
        isRead: true
    },
    {
        name: "Karthik Subramanian",
        email: "karthik.subramanian@example.com",
        subject: "Book Donation",
        message: "I have a collection of rare Tamil books that I would like to donate to the society. How can I proceed with this?",
        isRead: false
    }
];

const sampleProjects = [
    {
        title: "Digital Tamil Library",
        titleTamil: "டிஜிட்டல் தமிழ் நூலகம்",
        description: "Creating a comprehensive digital library of Tamil literature accessible to everyone worldwide.",
        category: "cultural-preservation",
        status: "active",
        priority: "high",
        startDate: new Date("2023-01-01"),
        endDate: new Date("2024-12-31"),
        budget: 500000,
        featured: true,
        needsVolunteers: true,
        goals: "Digitize 10,000 Tamil books and make them freely accessible online",
        progress: 35
    },
    {
        title: "Tamil Language Learning App",
        titleTamil: "தமிழ் மொழி கற்றல் செயலி",
        description: "Developing a mobile application to help people learn Tamil language and script.",
        category: "language-development",
        status: "planning",
        priority: "medium",
        startDate: new Date("2023-06-01"),
        endDate: new Date("2024-06-30"),
        budget: 200000,
        featured: true,
        needsVolunteers: true,
        goals: "Create an interactive app with lessons, exercises, and cultural content",
        progress: 15
    }
];

async function addSampleData() {
    try {
        console.log("Adding sample data...");

        // Add sample users
        console.log("\\nAdding sample users...");
        for (const userData of sampleUsers) {
            const existingUser = await User.findOne({ email: userData.email });
            if (!existingUser) {
                const hashedPassword = await bcrypt.hash(userData.password, 12);
                const user = new User({
                    ...userData,
                    password: hashedPassword
                });
                await user.save();
                console.log(`✓ Added user: ${user.name} (${user.email})`);
            } else {
                console.log(`- User already exists: ${userData.name} (${userData.email})`);
            }
        }

        // Add sample messages
        console.log("\\nAdding sample messages...");
        for (const messageData of sampleMessages) {
            const existingMessage = await ContactMessage.findOne({ 
                email: messageData.email, 
                subject: messageData.subject 
            });
            if (!existingMessage) {
                const message = new ContactMessage(messageData);
                await message.save();
                console.log(`✓ Added message from: ${message.name} - ${message.subject}`);
            } else {
                console.log(`- Message already exists from: ${messageData.name} - ${messageData.subject}`);
            }
        }

        // Add sample projects
        console.log("\\nAdding sample projects...");
        const adminUser = await User.findOne({ email: "admin@tamilsociety.org" });
        
        if (!adminUser) {
            console.log("❌ Admin user not found. Please create an admin user first.");
            return;
        }
        
        for (const projectData of sampleProjects) {
            const existingProject = await Project.findOne({ title: projectData.title });
            if (!existingProject) {
                const project = new Project({
                    ...projectData,
                    projectManager: adminUser._id,
                    createdBy: adminUser._id
                });
                await project.save();
                console.log(`✓ Added project: ${project.title}`);
            } else {
                console.log(`- Project already exists: ${projectData.title}`);
            }
        }

        console.log("\\n✅ Sample data added successfully!");

    } catch (error) {
        console.error("Error adding sample data:", error);
    } finally {
        mongoose.connection.close();
    }
}

addSampleData();