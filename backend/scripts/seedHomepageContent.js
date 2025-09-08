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

const seedHomepageContent = async () => {
    try {
        await connectDB();
        console.log("Starting homepage content seeding...");

        // Use a default ObjectId for createdBy field
        const defaultUserId = new mongoose.Types.ObjectId();
        console.log("Using default user ID for seeding:", defaultUserId);

        // Clear existing homepage content
        await WebsiteContent.deleteMany({ page: { $in: ["home", "homepage"] } });
        console.log("Cleared existing homepage content");

        // Default SEO keywords for all sections
        const defaultSeoKeywords = {
            en: ["Tamil Language Society", "Tamil culture", "Tamil heritage", "Tamil community"],
            ta: ["தமிழ் மொழி சங்கம்", "தமிழ் கலாச்சாரம்", "தமிழ் பாரம்பரியம்", "தமிழ் சமூகம்"]
        };

        // Homepage Content with simplified structure
        const homepageContent = [
            // Hero Section
            {
                page: "home",
                section: "heroTitle",
                sectionKey: "homepage-hero-title",
                sectionType: "hero",
                position: 1,
                title: {
                    en: "Welcome to Tamil Language Society",
                    ta: "தமிழ் மொழி சங்கத்திற்கு வரவேற்கிறோம்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            {
                page: "home",
                section: "heroSubtitle",
                sectionKey: "homepage-hero-subtitle",
                sectionType: "hero",
                position: 2,
                content: {
                    en: "Preserving and promoting the rich heritage of Tamil language and culture worldwide",
                    ta: "உலகம் முழுவதும் தமிழ் மொழி மற்றும் கலாச்சாரத்தின் வளமான பாரம்பரியத்தைப் பாதுகாத்து ஊக்குவித்தல்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Features Section
            {
                page: "home",
                section: "featuresTitle",
                sectionKey: "homepage-features-title",
                sectionType: "feature-list",
                position: 3,
                title: {
                    en: "Our Services",
                    ta: "எங்கள் சேவைகள்"
                },
                content: {
                    en: "Explore our comprehensive range of services",
                    ta: "எங்கள் விரிவான சேவைகளை ஆராயுங்கள்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            {
                page: "home",
                section: "featuresEbooks",
                sectionKey: "homepage-features-ebooks",
                sectionType: "feature-list",
                position: 4,
                title: {
                    en: "E-Books",
                    ta: "மின்னூல்கள்"
                },
                content: {
                    en: "Access thousands of Tamil books and educational resources",
                    ta: "ஆயிரக்கணக்கான தமிழ் புத்தகங்கள் மற்றும் கல்வி வளங்களை அணுகவும்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            {
                page: "home",
                section: "featuresProjects",
                sectionKey: "homepage-features-projects",
                sectionType: "feature-list",
                position: 5,
                title: {
                    en: "Projects",
                    ta: "திட்டங்கள்"
                },
                content: {
                    en: "Join our initiatives celebrating Tamil heritage",
                    ta: "தமிழ் பாரம்பரியத்தைக் கொண்டாடும் எங்கள் முன்முயற்சிகளில் சேருங்கள்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            {
                page: "home",
                section: "featuresBookstore",
                sectionKey: "homepage-features-bookstore",
                sectionType: "feature-list",
                position: 6,
                title: {
                    en: "Book Store",
                    ta: "புத்தக கடை"
                },
                content: {
                    en: "Purchase authentic Tamil literature and materials",
                    ta: "உண்மையான தமிழ் இலக்கியம் மற்றும் பொருட்களை வாங்குங்கள்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Announcements Section
            {
                page: "home",
                section: "postersTitle",
                sectionKey: "homepage-posters-title",
                sectionType: "announcements",
                position: 7,
                title: {
                    en: "Latest Announcements",
                    ta: "சமீபத்திய அறிவிப்புகள்"
                },
                content: {
                    en: "Stay updated with our latest news and events",
                    ta: "எங்கள் சமீபத்திய செய்திகள் மற்றும் நிகழ்வுகளுடன் புதுப்பித்த நிலையில் இருங்கள்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Statistics Section
            {
                page: "home",
                section: "statisticsBooks",
                sectionKey: "homepage-statistics-books",
                sectionType: "statistics",
                position: 8,
                title: {
                    en: "Digital Books",
                    ta: "டிஜிட்டல் புத்தகங்கள்"
                },
                content: {
                    en: "5000+",
                    ta: "5000+"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            {
                page: "home",
                section: "statisticsMembers",
                sectionKey: "homepage-statistics-members",
                sectionType: "statistics",
                position: 9,
                title: {
                    en: "Community Members",
                    ta: "சமூக உறுப்பினர்கள்"
                },
                content: {
                    en: "10,000+",
                    ta: "10,000+"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            {
                page: "home",
                section: "statisticsYears",
                sectionKey: "homepage-statistics-years",
                sectionType: "statistics",
                position: 10,
                title: {
                    en: "Years of Service",
                    ta: "சேவை ஆண்டுகள்"
                },
                content: {
                    en: "25+",
                    ta: "25+"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            {
                page: "home",
                section: "statisticsProjects",
                sectionKey: "homepage-statistics-projects",
                sectionType: "statistics",
                position: 11,
                title: {
                    en: "Active Projects",
                    ta: "செயலில் உள்ள திட்டங்கள்"
                },
                content: {
                    en: "50+",
                    ta: "50+"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            }
        ];

        // Insert homepage content
        const insertedHomepage = await WebsiteContent.insertMany(homepageContent);
        console.log(`✅ Inserted ${insertedHomepage.length} homepage content sections`);

        console.log("\n=== HOMEPAGE CONTENT SEEDING COMPLETED ===");
        console.log(`Total homepage sections created: ${insertedHomepage.length}`);
        
        process.exit(0);
    } catch (error) {
        console.error("Error seeding homepage content:", error);
        process.exit(1);
    }
};

// Run the seeder
if (require.main === module) {
    seedHomepageContent();
}

module.exports = seedHomepageContent;