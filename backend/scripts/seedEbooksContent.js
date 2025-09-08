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

const seedEbooksContent = async () => {
    try {
        await connectDB();
        console.log("Starting ebooks page content seeding...");

        // Use a default ObjectId for createdBy field
        const defaultUserId = new mongoose.Types.ObjectId();
        console.log("Using default user ID for seeding:", defaultUserId);

        // Clear existing ebooks content
        await WebsiteContent.deleteMany({ page: "ebooks" });
        console.log("Cleared existing ebooks content");

        // Default SEO keywords for all sections
        const defaultSeoKeywords = {
            en: ["Tamil ebooks", "Digital books", "Online reading", "Tamil PDF books", "Free ebooks"],
            ta: ["தமிழ் மின்புத்தகங்கள்", "டிஜிட்டல் புத்தகங்கள்", "ஆன்லைன் வாசிப்பு", "தமிழ் PDF புத்தகங்கள்", "இலவச மின்புத்தகங்கள்"]
        };

        // Ebooks Page Content
        const ebooksContent = [
            // Hero Section
            {
                page: "ebooks",
                section: "heroTitle",
                sectionKey: "ebooks-hero-title",
                sectionType: "hero",
                position: 1,
                title: {
                    en: "Tamil Digital Library",
                    ta: "தமிழ் டிஜிட்டல் நூலகம்"
                },
                content: {
                    en: "Access thousands of Tamil ebooks anytime, anywhere",
                    ta: "எப்போது வேண்டுமானாலும், எங்கு வேண்டுமானாலும் ஆயிரக்கணக்கான தமிழ் மின்புத்தகங்களை அணுகுங்கள்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Features Section
            {
                page: "ebooks",
                section: "featuresTitle",
                sectionKey: "ebooks-features-title",
                sectionType: "text",
                position: 2,
                title: {
                    en: "Digital Reading Features",
                    ta: "டிஜிட்டல் வாசிப்பு அம்சங்கள்"
                },
                content: {
                    en: "Enhanced reading experience with modern digital features",
                    ta: "நவீன டிஜிட்டல் அம்சங்களுடன் மேம்படுத்தப்பட்ட வாசிப்பு அனுபவம்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Instant Access Feature
            {
                page: "ebooks",
                section: "instantAccess",
                sectionKey: "ebooks-instant-access",
                sectionType: "feature",
                position: 3,
                title: {
                    en: "Instant Access",
                    ta: "உடனடி அணுகல்"
                },
                content: {
                    en: "Download and start reading immediately after purchase",
                    ta: "வாங்கிய உடனே பதிவிறக்கம் செய்து வாசிக்கத் தொடங்குங்கள்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Search Feature
            {
                page: "ebooks",
                section: "searchFeature",
                sectionKey: "ebooks-search-feature",
                sectionType: "feature",
                position: 4,
                title: {
                    en: "Advanced Search",
                    ta: "மேம்பட்ட தேடல்"
                },
                content: {
                    en: "Find books by author, genre, or keywords instantly",
                    ta: "ஆசிரியர், வகை அல்லது முக்கிய வார்த்தைகள் மூலம் உடனடியாக புத்தகங்களைக் கண்டறியுங்கள்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Offline Reading Feature
            {
                page: "ebooks",
                section: "offlineReading",
                sectionKey: "ebooks-offline-reading",
                sectionType: "feature",
                position: 5,
                title: {
                    en: "Offline Reading",
                    ta: "ஆஃப்லைன் வாசிப்பு"
                },
                content: {
                    en: "Download books and read without internet connection",
                    ta: "புத்தகங்களைப் பதிவிறக்கம் செய்து இணைய இணைப்பு இல்லாமல் படியுங்கள்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Popular Categories
            {
                page: "ebooks",
                section: "popularCategories",
                sectionKey: "ebooks-popular-categories",
                sectionType: "text",
                position: 6,
                title: {
                    en: "Popular Categories",
                    ta: "பிரபலமான வகைகள்"
                },
                content: {
                    en: "Explore our most downloaded ebook categories",
                    ta: "எங்கள் அதிகம் பதிவிறக்கம் செய்யப்பட்ட மின்புத்தக வகைகளை ஆராயுங்கள்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            }
        ];

        // Insert ebooks content
        const insertedEbooks = await WebsiteContent.insertMany(ebooksContent);
        console.log(`✅ Inserted ${insertedEbooks.length} ebooks page content sections`);

        console.log("\n=== EBOOKS CONTENT SEEDING COMPLETED ===");
        console.log(`Total ebooks sections created: ${insertedEbooks.length}`);
        
        process.exit(0);
    } catch (error) {
        console.error("Error seeding ebooks content:", error);
        process.exit(1);
    }
};

// Run the seeder
if (require.main === module) {
    seedEbooksContent();
}

module.exports = seedEbooksContent;