const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../config/.env") });

// Import models
const Project = require("../models/Project");
const User = require("../models/User");

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/tamilsociety";
console.log("Connecting to MongoDB:", mongoUri);

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const sampleProjects = [
    {
        title: "Tamil Digital Library Initiative",
        titleTamil: "தமிழ் டிஜிட்டல் நூலக முன்முயற்சி",
        description: "Creating a comprehensive digital library of Tamil literature and educational resources accessible to everyone worldwide.",
        descriptionTamil: "உலகம் முழுவதும் உள்ள அனைவருக்கும் அணுகக்கூடிய தமிழ் இலக்கியம் மற்றும் கல்வி வளங்களின் விரிவான டிஜிட்டல் நூலகத்தை உருவாக்குதல்.",
        category: "technology",
        status: "active",
        priority: "high",
        startDate: new Date("2023-01-01"),
        endDate: new Date("2025-12-31"),
        budget: {
            total: 50000,
            spent: 30000,
            currency: "RM"
        },
        fundingGoal: 50000,
        fundingRaised: 30000,
        progress: 60,
        featured: true,
        needsVolunteers: true,
        volunteerRequirements: "Tamil language skills, digital archiving experience",
        tags: ["digital library", "technology", "literature"],
        visibility: "public"
    },
    {
        title: "Tamil Language Learning App",
        titleTamil: "தமிழ் மொழி கற்றல் செயலி",
        description: "Mobile application for learning Tamil language with interactive lessons and games for children and adults.",
        descriptionTamil: "குழந்தைகள் மற்றும் பெரியவர்களுக்கான ஊடாடும் பாடங்கள் மற்றும் விளையாட்டுகளுடன் தமிழ் மொழி கற்றுக்கொள்வதற்கான மொபைல் செயலி.",
        category: "education",
        status: "planning",
        priority: "medium",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        budget: {
            total: 25000,
            spent: 0,
            currency: "RM"
        },
        fundingGoal: 25000,
        fundingRaised: 5000,
        progress: 0,
        featured: true,
        needsVolunteers: true,
        volunteerRequirements: "Mobile app development, Tamil language expertise",
        tags: ["mobile app", "education", "language learning"],
        visibility: "public"
    },
    {
        title: "Tamil Cultural Festival Organization",
        titleTamil: "தமிழ் கலாச்சார திருவிழா அமைப்பு",
        description: "Annual cultural festival celebrating Tamil heritage, arts, music, and literature with community participation.",
        descriptionTamil: "சமூக பங்கேற்புடன் தமிழ் பாரம்பரியம், கலைகள், இசை மற்றும் இலக்கியத்தை கொண்டாடும் வருடாந்திர கலாச்சார திருவிழா.",
        category: "cultural-preservation",
        status: "active",
        priority: "high",
        startDate: new Date("2024-03-01"),
        endDate: new Date("2024-04-15"),
        budget: {
            total: 15000,
            spent: 8000,
            currency: "RM"
        },
        fundingGoal: 15000,
        fundingRaised: 12000,
        progress: 75,
        featured: true,
        needsVolunteers: true,
        volunteerRequirements: "Event management, cultural performance skills",
        tags: ["festival", "culture", "community"],
        visibility: "public"
    },
    {
        title: "Tamil Script Preservation Project",
        titleTamil: "தமிழ் எழுத்து பாதுகாப்பு திட்டம்",
        description: "Digitizing ancient Tamil manuscripts and inscriptions to preserve them for future generations.",
        descriptionTamil: "எதிர்கால சந்ததியினருக்காக பழங்கால தமிழ் கையெழுத்துப் பிரதிகள் மற்றும் கல்வெட்டுகளை டிஜிட்டல் மயமாக்கி பாதுகாத்தல்.",
        category: "cultural-preservation",
        status: "completed",
        priority: "high",
        startDate: new Date("2022-06-01"),
        endDate: new Date("2023-05-31"),
        budget: {
            total: 35000,
            spent: 35000,
            currency: "RM"
        },
        fundingGoal: 35000,
        fundingRaised: 35000,
        progress: 100,
        featured: false,
        needsVolunteers: false,
        tags: ["preservation", "manuscripts", "digitization"],
        visibility: "public"
    }
];

async function resetProjects() {
    try {
        // Get admin user to set as creator
        const adminUser = await User.findOne({ email: "admin@tamilsociety.org" });
        
        if (!adminUser) {
            console.log("Admin user not found. Please create admin user first.");
            return;
        }

        console.log("Clearing existing projects...");
        await Project.deleteMany({});
        console.log("Existing projects cleared.");

        console.log("Adding Tamil projects with proper fields...");

        // Add createdBy and projectManager fields to each project
        const projectsWithCreator = sampleProjects.map(project => ({
            ...project,
            createdBy: adminUser._id,
            projectManager: adminUser._id
        }));

        // Insert projects
        const insertedProjects = await Project.insertMany(projectsWithCreator);
        
        console.log(`Successfully added ${insertedProjects.length} Tamil projects:`);
        insertedProjects.forEach(project => {
            console.log(`- ${project.title} (${project.titleTamil}) - Status: ${project.status}`);
        });

    } catch (error) {
        console.error("Error resetting projects:", error);
    } finally {
        mongoose.connection.close();
    }
}

resetProjects();