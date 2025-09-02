const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Project = require("../models/Project");
const Activity = require("../models/Activity");
const Initiative = require("../models/Initiative");
const User = require("../models/User");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", "config", ".env") });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function seedProjectsData() {
    try {
        console.log("Starting to seed projects, activities, and initiatives data...");

        // Find admin user
        const adminUser = await User.findOne({ role: "admin" });
        if (!adminUser) {
            console.error("Admin user not found. Please create an admin user first.");
            process.exit(1);
        }

        // Clear existing data
        await Project.deleteMany({});
        await Activity.deleteMany({});
        await Initiative.deleteMany({});
        console.log("Cleared existing projects, activities, and initiatives data");

        // Sample Projects
        const projects = [
            {
                title: "Tamil Digital Library",
                titleTamil: "தமிழ் டிஜிட்டல் நூலகம்",
                description: "Creating a comprehensive digital library of Tamil literature and historical texts accessible to everyone worldwide.",
                descriptionTamil: "உலகம் முழுவதும் உள்ள அனைவருக்கும் அணுகக்கூடிய தமிழ் இலக்கியம் மற்றும் வரலாற்று நூல்களின் விரிவான டிஜிட்டல் நூலகத்தை உருவாக்குதல்.",
                category: "language-literature",
                status: "active",
                priority: "high",
                visibility: "public",
                featured: true,
                startDate: new Date("2024-01-01"),
                expectedEndDate: new Date("2025-12-31"),
                projectManager: adminUser._id,
                budget: {
                    total: 50000,
                    allocated: 30000,
                    spent: 15000
                },
                progress: 60,
                images: [{
                    url: "/assets/projects/digital-library.jpg",
                    alt: "Tamil Digital Library Project",
                    isPrimary: true
                }],
                needsVolunteers: true,
                volunteerRoles: ["Content Digitization", "Translation", "Quality Assurance"],
                createdBy: adminUser._id
            },
            {
                title: "Tamil Language Learning App",
                titleTamil: "தமிழ் மொழி கற்றல் செயலி",
                description: "Developing a mobile application to help people learn Tamil language with interactive lessons and cultural context.",
                descriptionTamil: "ஊடாடும் பாடங்கள் மற்றும் கலாச்சார சூழலுடன் மக்கள் தமிழ் மொழியைக் கற்க உதவும் மொபைல் செயலியை உருவாக்குதல்.",
                category: "education-intellectual",
                status: "active",
                priority: "high",
                visibility: "public",
                featured: true,
                startDate: new Date("2024-03-01"),
                expectedEndDate: new Date("2024-12-31"),
                projectManager: adminUser._id,
                budget: {
                    total: 75000,
                    allocated: 50000,
                    spent: 25000
                },
                progress: 45,
                images: [{
                    url: "/assets/projects/learning-app.jpg",
                    alt: "Tamil Learning App",
                    isPrimary: true
                }],
                needsVolunteers: true,
                volunteerRoles: ["App Development", "Content Creation", "UI/UX Design"],
                createdBy: adminUser._id
            },
            {
                title: "Cultural Heritage Documentation",
                titleTamil: "கலாச்சார பாரம்பரிய ஆவணப்படுத்தல்",
                description: "Documenting and preserving Tamil cultural practices, festivals, and traditions through multimedia content.",
                descriptionTamil: "பல்லூடக உள்ளடக்கத்தின் மூலம் தமிழ் கலாச்சார நடைமுறைகள், திருவிழாக்கள் மற்றும் பாரம்பரியங்களை ஆவணப்படுத்துதல் மற்றும் பாதுகாத்தல்.",
                category: "arts-culture",
                status: "active",
                priority: "medium",
                visibility: "public",
                featured: false,
                startDate: new Date("2024-02-01"),
                expectedEndDate: new Date("2025-06-30"),
                projectManager: adminUser._id,
                budget: {
                    total: 30000,
                    allocated: 20000,
                    spent: 8000
                },
                progress: 35,
                images: [{
                    url: "/assets/projects/cultural-heritage.jpg",
                    alt: "Cultural Heritage Documentation",
                    isPrimary: true
                }],
                needsVolunteers: true,
                volunteerRoles: ["Photography", "Videography", "Research"],
                createdBy: adminUser._id
            },
            {
                title: "Community Tamil Classes",
                titleTamil: "சமூக தமிழ் வகுப்புகள்",
                description: "Organizing Tamil language classes for children and adults in local communities worldwide.",
                descriptionTamil: "உலகம் முழுவதும் உள்ள உள்ளூர் சமூகங்களில் குழந்தைகள் மற்றும் பெரியவர்களுக்கு தமிழ் மொழி வகுப்புகளை ஏற்பாடு செய்தல்.",
                category: "social-welfare-voluntary",
                status: "active",
                priority: "high",
                visibility: "public",
                featured: true,
                startDate: new Date("2024-01-15"),
                expectedEndDate: new Date("2024-12-31"),
                projectManager: adminUser._id,
                budget: {
                    total: 25000,
                    allocated: 20000,
                    spent: 12000
                },
                progress: 70,
                images: [{
                    url: "/assets/projects/community-classes.jpg",
                    alt: "Community Tamil Classes",
                    isPrimary: true
                }],
                needsVolunteers: true,
                volunteerRoles: ["Teaching", "Curriculum Development", "Event Organization"],
                createdBy: adminUser._id
            }
        ];

        // Sample Activities
        const activities = [
            {
                title: "Tamil Poetry Workshop",
                titleTamil: "தமிழ் கவிதை பட்டறை",
                description: "Interactive workshop on classical and modern Tamil poetry techniques and appreciation.",
                descriptionTamil: "பாரம்பரிய மற்றும் நவீன தமிழ் கவிதை நுட்பங்கள் மற்றும் பாராட்டு குறித்த ஊடாடும் பட்டறை.",
                category: "education-intellectual",
                type: "offline",
                status: "upcoming",
                priority: "medium",
                visibility: "public",
                featured: true,
                startDate: new Date("2025-02-15"),
                endDate: new Date("2025-02-15"),
                duration: 4,
                location: {
                    type: "hybrid",
                    venue: "Tamil Cultural Center",
                    address: "123 Tamil Street, Cultural District",
                    city: "Chennai",
                    country: "India",
                    onlineLink: "https://meet.google.com/tamil-poetry"
                },
                capacity: 50,
                registeredCount: 23,
                fee: {
                    amount: 25,
                    currency: "USD",
                    type: "paid"
                },
                organizer: {
                    name: "Tamil Literary Society",
                    email: "events@tamilliterarysociety.org",
                    organization: "Tamil Literary Society"
                },
                images: [{
                    url: "/assets/activities/poetry-workshop.jpg",
                    alt: "Tamil Poetry Workshop",
                    isPrimary: true
                }],
                createdBy: adminUser._id
            },
            {
                title: "Tamil Film Festival",
                titleTamil: "தமிழ் திரைப்பட விழா",
                description: "Annual festival showcasing the best of Tamil cinema from around the world.",
                descriptionTamil: "உலகம் முழுவதிலும் இருந்து சிறந்த தமிழ் சினிமாவை வெளிப்படுத்தும் வருடாந்திர விழா.",
                category: "arts-culture",
                type: "offline",
                status: "ongoing",
                priority: "high",
                visibility: "public",
                featured: true,
                startDate: new Date("2025-03-01"),
                endDate: new Date("2025-03-07"),
                duration: 168,
                location: {
                    type: "physical",
                    venue: "Grand Cinema Complex",
                    address: "456 Film Avenue, Entertainment District",
                    city: "Toronto",
                    country: "Canada"
                },
                capacity: 500,
                registeredCount: 342,
                fee: {
                    amount: 0,
                    currency: "USD",
                    type: "free"
                },
                organizer: {
                    name: "Tamil Cultural Association",
                    email: "festival@tamilculture.org",
                    organization: "Tamil Cultural Association"
                },
                images: [{
                    url: "/assets/activities/film-festival.jpg",
                    alt: "Tamil Film Festival",
                    isPrimary: true
                }],
                createdBy: adminUser._id
            },
            {
                title: "Online Tamil Grammar Seminar",
                titleTamil: "ஆன்லைன் தமிழ் இலக்கண கருத்தரங்கம்",
                description: "Comprehensive seminar covering advanced Tamil grammar rules and usage.",
                descriptionTamil: "மேம்பட்ட தமிழ் இலக்கண விதிகள் மற்றும் பயன்பாட்டை உள்ளடக்கிய விரிவான கருத்தரங்கம்.",
                category: "education-intellectual",
                type: "online",
                status: "completed",
                priority: "medium",
                visibility: "public",
                featured: false,
                startDate: new Date("2024-12-10"),
                endDate: new Date("2024-12-10"),
                duration: 3,
                location: {
                    type: "online",
                    onlineLink: "https://zoom.us/tamil-grammar-seminar"
                },
                capacity: 100,
                registeredCount: 87,
                fee: {
                    amount: 15,
                    currency: "USD",
                    type: "paid"
                },
                organizer: {
                    name: "Tamil Language Institute",
                    email: "seminar@tamilinstitute.edu",
                    organization: "Tamil Language Institute"
                },
                images: [{
                    url: "/assets/activities/grammar-seminar.jpg",
                    alt: "Tamil Grammar Seminar",
                    isPrimary: true
                }],
                createdBy: adminUser._id
            }
        ];

        // Sample Initiatives
        const initiatives = [
            {
                title: "Global Tamil Education Initiative",
                titleTamil: "உலகளாவிய தமிழ் கல்வி முன்முயற்சி",
                description: "A comprehensive initiative to establish Tamil education programs in schools worldwide.",
                descriptionTamil: "உலகம் முழுவதும் உள்ள பள்ளிகளில் தமிழ் கல்வி திட்டங்களை நிறுவுவதற்கான விரிவான முன்முயற்சி.",
                category: "education-intellectual",
                scope: "international",
                status: "active",
                priority: "high",
                visibility: "public",
                featured: true,
                startDate: new Date("2024-01-01"),
                expectedEndDate: new Date("2026-12-31"),
                targetBeneficiaries: 10000,
                currentBeneficiaries: 3500,
                budget: {
                    total: 500000,
                    allocated: 300000,
                    spent: 150000
                },
                progress: 35,
                goals: [{
                    title: "Establish 100 Tamil classes globally",
                    description: "Set up Tamil language classes in 100 schools across different countries",
                    targetDate: new Date("2025-12-31"),
                    completed: false,
                    metrics: [{
                        name: "Classes established",
                        target: 100,
                        current: 35,
                        unit: "classes"
                    }]
                }],
                images: [{
                    url: "/assets/initiatives/global-education.jpg",
                    alt: "Global Tamil Education Initiative",
                    isPrimary: true
                }],
                leadOrganization: {
                    name: "Tamil Literary Society",
                    contact: {
                        name: "Admin User",
                        email: "admin@tamilliterarysociety.org",
                        phone: "+1-555-0123"
                    }
                },
                supportersNeeded: true,
                volunteerOpportunities: [{
                    role: "Education Coordinator",
                    description: "Help coordinate Tamil education programs in local schools",
                    timeCommitment: "5-10 hours per week",
                    skills: ["Education", "Tamil Language", "Project Management"],
                    active: true
                }],
                createdBy: adminUser._id
            },
            {
                title: "Tamil Literature Preservation Project",
                titleTamil: "தமிழ் இலக்கிய பாதுகாப்பு திட்டம்",
                description: "Digitizing and preserving ancient Tamil manuscripts and literary works for future generations.",
                descriptionTamil: "எதிர்கால சந்ததியினருக்காக பண்டைய தமிழ் கையெழுத்துப் பிரதிகள் மற்றும் இலக்கிய படைப்புகளை டிஜிட்டல்மயமாக்குதல் மற்றும் பாதுகாத்தல்.",
                category: "language-literature",
                scope: "international",
                status: "active",
                priority: "high",
                visibility: "public",
                featured: true,
                startDate: new Date("2023-06-01"),
                expectedEndDate: new Date("2025-12-31"),
                targetBeneficiaries: 50000,
                currentBeneficiaries: 15000,
                budget: {
                    total: 200000,
                    allocated: 150000,
                    spent: 80000
                },
                progress: 55,
                goals: [{
                    title: "Digitize 1000 manuscripts",
                    description: "Convert 1000 ancient Tamil manuscripts to digital format",
                    targetDate: new Date("2025-06-30"),
                    completed: false,
                    metrics: [{
                        name: "Manuscripts digitized",
                        target: 1000,
                        current: 550,
                        unit: "manuscripts"
                    }]
                }],
                images: [{
                    url: "/assets/initiatives/literature-preservation.jpg",
                    alt: "Tamil Literature Preservation",
                    isPrimary: true
                }],
                leadOrganization: {
                    name: "Tamil Heritage Foundation",
                    contact: {
                        name: "Heritage Coordinator",
                        email: "coordinator@tamilheritage.org",
                        phone: "+1-555-0124"
                    }
                },
                supportersNeeded: true,
                volunteerOpportunities: [{
                    role: "Digital Archivist",
                    description: "Help digitize and catalog Tamil manuscripts",
                    timeCommitment: "10-15 hours per week",
                    skills: ["Digital Archiving", "Tamil Reading", "Attention to Detail"],
                    active: true
                }],
                createdBy: adminUser._id
            },
            {
                title: "Tamil Youth Engagement Program",
                titleTamil: "தமிழ் இளைஞர் ஈடுபாட்டு திட்டம்",
                description: "Engaging young Tamil speakers worldwide through cultural activities and modern technology.",
                descriptionTamil: "கலாச்சார நடவடிக்கைகள் மற்றும் நவீன தொழில்நுட்பத்தின் மூலம் உலகம் முழுவதும் உள்ள இளம் தமிழ் பேசுபவர்களை ஈடுபடுத்துதல்.",
                category: "social-welfare-voluntary",
                scope: "international",
                status: "planning",
                priority: "high",
                visibility: "public",
                featured: false,
                startDate: new Date("2025-04-01"),
                expectedEndDate: new Date("2026-03-31"),
                targetBeneficiaries: 5000,
                currentBeneficiaries: 0,
                budget: {
                    total: 100000,
                    allocated: 0,
                    spent: 0
                },
                progress: 10,
                goals: [{
                    title: "Engage 5000 Tamil youth",
                    description: "Create programs that actively engage 5000 young Tamil speakers",
                    targetDate: new Date("2026-03-31"),
                    completed: false,
                    metrics: [{
                        name: "Youth engaged",
                        target: 5000,
                        current: 0,
                        unit: "participants"
                    }]
                }],
                leadOrganization: {
                    name: "Tamil Youth Council",
                    contact: {
                        name: "Youth Director",
                        email: "director@tamilyouth.org",
                        phone: "+1-555-0125"
                    }
                },
                images: [{
                    url: "/assets/initiatives/youth-engagement.jpg",
                    alt: "Tamil Youth Engagement Program",
                    isPrimary: true
                }],
                supportersNeeded: true,
                volunteerOpportunities: [{
                    role: "Youth Coordinator",
                    description: "Help organize and coordinate youth engagement activities",
                    timeCommitment: "8-12 hours per week",
                    skills: ["Youth Work", "Event Planning", "Social Media"],
                    active: true
                }],
                createdBy: adminUser._id
            }
        ];

        // Insert projects
        const insertedProjects = await Project.insertMany(projects);
        console.log(`Inserted ${insertedProjects.length} projects`);

        // Insert activities
        const insertedActivities = await Activity.insertMany(activities);
        console.log(`Inserted ${insertedActivities.length} activities`);

        // Insert initiatives
        const insertedInitiatives = await Initiative.insertMany(initiatives);
        console.log(`Inserted ${insertedInitiatives.length} initiatives`);

        console.log("Successfully seeded projects, activities, and initiatives data!");
        console.log("\nSummary:");
        console.log(`- Projects: ${insertedProjects.length}`);
        console.log(`- Activities: ${insertedActivities.length}`);
        console.log(`- Initiatives: ${insertedInitiatives.length}`);

    } catch (error) {
        console.error("Error seeding data:", error);
    } finally {
        mongoose.connection.close();
    }
}

// Run the seeding function
seedProjectsData();