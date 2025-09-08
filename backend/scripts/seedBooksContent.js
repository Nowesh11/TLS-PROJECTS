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

const seedBooksContent = async () => {
    try {
        await connectDB();
        console.log("Starting books page content seeding...");

        // Use a default ObjectId for createdBy field
        const defaultUserId = new mongoose.Types.ObjectId();
        console.log("Using default user ID for seeding:", defaultUserId);

        // Clear existing books content
        await WebsiteContent.deleteMany({ page: "books" });
        console.log("Cleared existing books content");

        // Default SEO keywords for all sections
        const defaultSeoKeywords = {
            en: ["Tamil books", "Tamil literature", "Book store", "Tamil publications", "Buy books"],
            ta: ["தமிழ் புத்தகங்கள்", "தமிழ் இலக்கியம்", "புத்தக கடை", "தமிழ் வெளியீடுகள்", "புத்தகங்கள் வாங்க"]
        };

        // Books Page Content
        const booksContent = [
            // Hero Section
            {
                page: "books",
                section: "heroTitle",
                sectionKey: "books-hero-title",
                sectionType: "hero",
                position: 1,
                title: {
                    en: "Tamil Book Store",
                    ta: "தமிழ் புத்தக கடை"
                },
                content: {
                    en: "Discover authentic Tamil literature and educational materials",
                    ta: "உண்மையான தமிழ் இலக்கியம் மற்றும் கல்வி பொருட்களைக் கண்டறியுங்கள்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Categories Section
            {
                page: "books",
                section: "categoriesTitle",
                sectionKey: "books-categories-title",
                sectionType: "text",
                position: 2,
                title: {
                    en: "Book Categories",
                    ta: "புத்தக வகைகள்"
                },
                content: {
                    en: "Browse our extensive collection of Tamil books across various categories",
                    ta: "பல்வேறு வகைகளில் உள்ள எங்கள் விரிவான தமிழ் புத்தகத் தொகுப்பை உலாவுங்கள்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Literature Category
            {
                page: "books",
                section: "literatureCategory",
                sectionKey: "books-literature-category",
                sectionType: "cards",
                position: 3,
                title: {
                    en: "Literature",
                    ta: "இலக்கியம்"
                },
                content: {
                    en: "Classic and contemporary Tamil literature including poetry, novels, and short stories",
                    ta: "கவிதை, நாவல்கள் மற்றும் சிறுகதைகள் உட்பட பாரம்பரிய மற்றும் சமகால தமிழ் இலக்கியம்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Educational Category
            {
                page: "books",
                section: "educationalCategory",
                sectionKey: "books-educational-category",
                sectionType: "cards",
                position: 4,
                title: {
                    en: "Educational",
                    ta: "கல்வி"
                },
                content: {
                    en: "Textbooks, reference materials, and learning resources for all age groups",
                    ta: "அனைத்து வயதினருக்கும் பாடப்புத்தகங்கள், குறிப்பு பொருட்கள் மற்றும் கற்றல் வளங்கள்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Cultural Category
            {
                page: "books",
                section: "culturalCategory",
                sectionKey: "books-cultural-category",
                sectionType: "cards",
                position: 5,
                title: {
                    en: "Cultural Heritage",
                    ta: "கலாச்சார பாரம்பரியம்"
                },
                content: {
                    en: "Books on Tamil history, traditions, festivals, and cultural practices",
                    ta: "தமிழ் வரலாறு, மரபுகள், திருவிழாக்கள் மற்றும் கலாச்சார நடைமுறைகள் பற்றிய புத்தகங்கள்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Featured Books Section
            {
                page: "books",
                section: "featuredTitle",
                sectionKey: "books-featured-title",
                sectionType: "text",
                position: 6,
                title: {
                    en: "Featured Books",
                    ta: "சிறப்பு புத்தகங்கள்"
                },
                content: {
                    en: "Handpicked selection of must-read Tamil books",
                    ta: "கட்டாயம் படிக்க வேண்டிய தமிழ் புத்தகங்களின் தேர்ந்தெடுக்கப்பட்ட தொகுப்பு"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            }
        ];

        // Insert books content
        const insertedBooks = await WebsiteContent.insertMany(booksContent);
        console.log(`✅ Inserted ${insertedBooks.length} books page content sections`);

        console.log("\n=== BOOKS CONTENT SEEDING COMPLETED ===");
        console.log(`Total books sections created: ${insertedBooks.length}`);
        
        process.exit(0);
    } catch (error) {
        console.error("Error seeding books content:", error);
        process.exit(1);
    }
};

// Run the seeder
if (require.main === module) {
    seedBooksContent();
}

module.exports = seedBooksContent;