const mongoose = require("mongoose");
const WebsiteContent = require("../models/WebsiteContent");
require("dotenv").config({ path: "./.env" });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected:", mongoose.connection.host);
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};

const seedProjectsContent = async () => {
    try {
        await connectDB();
        console.log("Starting projects page content seeding...");

        // Use a default ObjectId for createdBy field
        const defaultUserId = new mongoose.Types.ObjectId();
        console.log("Using default user ID for seeding:", defaultUserId);

        // Clear existing projects content
        await WebsiteContent.deleteMany({ page: "projects" });
        console.log("Cleared existing projects content");

        // Default SEO keywords for all sections
        const defaultSeoKeywords = {
            en: ["Tamil projects", "Cultural initiatives", "Community projects", "Tamil heritage", "Educational programs"],
            ta: ["தமிழ் திட்டங்கள்", "கலாச்சார முன்முயற்சிகள்", "சமூக திட்டங்கள்", "தமிழ் பாரம்பரியம்", "கல்வி திட்டங்கள்"]
        };

        // Projects Page Content
        const projectsContent = [
            // Hero Section
            {
                page: "projects",
                section: "heroTitle",
                sectionKey: "projects-hero-title",
                sectionType: "hero",
                position: 1,
                title: {
                    en: "Our Projects",
                    ta: "எங்கள் திட்டங்கள்"
                },
                content: {
                    en: "Discover our initiatives to preserve and promote Tamil culture and literature",
                    ta: "தமிழ் கலாச்சாரம் மற்றும் இலக்கியத்தைப் பாதுகாக்கவும் மேம்படுத்தவும் எங்கள் முன்முயற்சிகளைக் கண்டறியுங்கள்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Current Projects Section
            {
                page: "projects",
                section: "currentProjects",
                sectionKey: "projects-current-title",
                sectionType: "text",
                position: 2,
                title: {
                    en: "Current Projects",
                    ta: "தற்போதைய திட்டங்கள்"
                },
                content: {
                    en: "Explore our ongoing initiatives and programs",
                    ta: "எங்கள் தற்போதைய முன்முயற்சிகள் மற்றும் திட்டங்களை ஆராயுங்கள்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Digital Archive Project
            {
                page: "projects",
                section: "digitalArchive",
                sectionKey: "projects-digital-archive",
                sectionType: "project",
                position: 3,
                title: {
                    en: "Digital Archive Initiative",
                    ta: "டிஜிட்டல் காப்பக முன்முயற்சி"
                },
                content: {
                    en: "Digitizing rare Tamil manuscripts and historical documents for future generations",
                    ta: "அரிய தமிழ் கையெழுத்துப் பிரதிகள் மற்றும் வரலாற்று ஆவணங்களை எதிர்கால சந்ததியினருக்காக டிஜிட்டல் மயமாக்குதல்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Education Outreach
            {
                page: "projects",
                section: "educationOutreach",
                sectionKey: "projects-education-outreach",
                sectionType: "project",
                position: 4,
                title: {
                    en: "Education Outreach Program",
                    ta: "கல்வி விரிவாக்க திட்டம்"
                },
                content: {
                    en: "Promoting Tamil language learning in schools and communities worldwide",
                    ta: "உலகம் முழுவதும் உள்ள பள்ளிகள் மற்றும் சமூகங்களில் தமிழ் மொழி கற்றலை ஊக்குவித்தல்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Cultural Events
            {
                page: "projects",
                section: "culturalEvents",
                sectionKey: "projects-cultural-events",
                sectionType: "project",
                position: 5,
                title: {
                    en: "Cultural Events & Festivals",
                    ta: "கலாச்சார நிகழ்வுகள் & திருவிழாக்கள்"
                },
                content: {
                    en: "Organizing literary festivals, poetry competitions, and cultural celebrations",
                    ta: "இலக்கிய விழாக்கள், கவிதை போட்டிகள் மற்றும் கலாச்சார கொண்டாட்டங்களை ஏற்பாடு செய்தல்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Research Initiative
            {
                page: "projects",
                section: "researchInitiative",
                sectionKey: "projects-research-initiative",
                sectionType: "project",
                position: 6,
                title: {
                    en: "Tamil Literature Research",
                    ta: "தமிழ் இலக்கிய ஆராய்ச்சி"
                },
                content: {
                    en: "Supporting scholarly research on Tamil literature, history, and linguistics",
                    ta: "தமிழ் இலக்கியம், வரலாறு மற்றும் மொழியியல் பற்றிய அறிவார்ந்த ஆராய்ச்சியை ஆதரித்தல்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Completed Projects Section
            {
                page: "projects",
                section: "completedProjects",
                sectionKey: "projects-completed-title",
                sectionType: "text",
                position: 7,
                title: {
                    en: "Completed Projects",
                    ta: "முடிக்கப்பட்ட திட்டங்கள்"
                },
                content: {
                    en: "View our successfully completed initiatives and their impact",
                    ta: "எங்கள் வெற்றிகரமாக முடிக்கப்பட்ட முன்முயற்சிகள் மற்றும் அவற்றின் தாக்கத்தைப் பார்க்கவும்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Get Involved Section
            {
                page: "projects",
                section: "getInvolved",
                sectionKey: "projects-get-involved",
                sectionType: "cta",
                position: 8,
                title: {
                    en: "Get Involved",
                    ta: "பங்கேற்றுக் கொள்ளுங்கள்"
                },
                content: {
                    en: "Join us in our mission to preserve and promote Tamil heritage. Volunteer, donate, or collaborate with us.",
                    ta: "தமிழ் பாரம்பரியத்தைப் பாதுகாக்கும் மற்றும் மேம்படுத்தும் எங்கள் நோக்கத்தில் எங்களுடன் சேருங்கள். தன்னார்வத் தொண்டு செய்யுங்கள், நன்கொடை அளியுங்கள் அல்லது எங்களுடன் ஒத்துழையுங்கள்."
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            }
        ];

        // Insert projects content
        const insertedProjects = await WebsiteContent.insertMany(projectsContent);
        console.log(`✅ Inserted ${insertedProjects.length} projects page content sections`);

        console.log("\n=== PROJECTS CONTENT SEEDING COMPLETED ===");
        console.log(`Total projects sections created: ${insertedProjects.length}`);
        
        process.exit(0);
    } catch (error) {
        console.error("Error seeding projects content:", error);
        process.exit(1);
    }
};

// Run the seeder
if (require.main === module) {
    seedProjectsContent();
}

module.exports = seedProjectsContent;