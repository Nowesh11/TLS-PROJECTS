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

const seedAboutContent = async () => {
    try {
        await connectDB();
        console.log("Starting about page content seeding...");

        // Use a default ObjectId for createdBy field
        const defaultUserId = new mongoose.Types.ObjectId();
        console.log("Using default user ID for seeding:", defaultUserId);

        // Clear existing about content
        await WebsiteContent.deleteMany({ page: "about" });
        console.log("Cleared existing about content");

        // Default SEO keywords for all sections
        const defaultSeoKeywords = {
            en: ["Tamil Language Society", "About us", "Tamil heritage", "Tamil community", "Mission", "Vision"],
            ta: ["தமிழ் மொழி சங்கம்", "எங்களைப் பற்றி", "தமிழ் பாரம்பரியம்", "தமிழ் சமூகம்", "நோக்கம்", "தொலைநோக்கு"]
        };

        // About Page Content
        const aboutContent = [
            // Hero Section
            {
                page: "about",
                section: "heroTitle",
                sectionKey: "about-hero-title",
                sectionType: "hero",
                position: 1,
                title: {
                    en: "About Tamil Language Society",
                    ta: "தமிழ் மொழி சங்கத்தைப் பற்றி"
                },
                content: {
                    en: "Preserving and promoting Tamil language and culture for future generations",
                    ta: "எதிர்கால சந்ததியினருக்காக தமிழ் மொழி மற்றும் கலாச்சாரத்தைப் பாதுகாத்து ஊக்குவித்தல்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Mission Section
            {
                page: "about",
                section: "missionTitle",
                sectionKey: "about-mission-title",
                sectionType: "text",
                position: 2,
                title: {
                    en: "Our Mission",
                    ta: "எங்கள் நோக்கம்"
                },
                content: {
                    en: "To preserve, promote, and celebrate the rich heritage of Tamil language and culture through education, community engagement, and cultural initiatives.",
                    ta: "கல்வி, சமூக ஈடுபாடு மற்றும் கலாச்சார முன்முயற்சிகள் மூலம் தமிழ் மொழி மற்றும் கலாச்சாரத்தின் வளமான பாரம்பரியத்தைப் பாதுகாத்து, ஊக்குவித்து, கொண்டாடுவது."
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Vision Section
            {
                page: "about",
                section: "visionTitle",
                sectionKey: "about-vision-title",
                sectionType: "text",
                position: 3,
                title: {
                    en: "Our Vision",
                    ta: "எங்கள் தொலைநோக்கு"
                },
                content: {
                    en: "To be a global leader in Tamil language preservation and cultural promotion, creating a vibrant community where Tamil heritage thrives for generations to come.",
                    ta: "தமிழ் மொழிப் பாதுகாப்பு மற்றும் கலாச்சார மேம்பாட்டில் உலகளாவிய தலைவராக இருப்பது, வரும் தலைமுறைகளுக்கு தமிழ் பாரம்பரியம் செழித்து வளரும் ஒரு துடிப்பான சமூகத்தை உருவாக்குவது."
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // History Section
            {
                page: "about",
                section: "historyTitle",
                sectionKey: "about-history-title",
                sectionType: "text",
                position: 4,
                title: {
                    en: "Our History",
                    ta: "எங்கள் வரலாறு"
                },
                content: {
                    en: "Founded over 25 years ago, the Tamil Language Society has been at the forefront of preserving Tamil heritage. From humble beginnings, we have grown into a thriving community of over 10,000 members worldwide, united by our love for Tamil language and culture.",
                    ta: "25 ஆண்டுகளுக்கு முன்பு நிறுவப்பட்ட தமிழ் மொழி சங்கம் தமிழ் பாரம்பரியத்தைப் பாதுகாப்பதில் முன்னணியில் உள்ளது. எளிய தொடக்கத்திலிருந்து, தமிழ் மொழி மற்றும் கலாச்சாரத்தின் மீதான அன்பால் ஒன்றுபட்ட உலகம் முழுவதும் 10,000க்கும் மேற்பட்ட உறுப்பினர்களைக் கொண்ட ஒரு செழிப்பான சமூகமாக வளர்ந்துள்ளோம்."
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Values Section
            {
                page: "about",
                section: "valuesTitle",
                sectionKey: "about-values-title",
                sectionType: "text",
                position: 5,
                title: {
                    en: "Our Values",
                    ta: "எங்கள் மதிப்புகள்"
                },
                content: {
                    en: "Excellence in education, respect for tradition, innovation in approach, inclusivity in community, and dedication to preserving Tamil heritage for future generations.",
                    ta: "கல்வியில் சிறப்பு, பாரம்பரியத்திற்கான மரியாதை, அணுகுமுறையில் புதுமை, சமூகத்தில் உள்ளடக்கம், மற்றும் எதிர்கால சந்ததியினருக்காக தமிழ் பாரம்பரியத்தைப் பாதுகாப்பதில் அர்ப்பணிப்பு."
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            }
        ];

        // Insert about content
        const insertedAbout = await WebsiteContent.insertMany(aboutContent);
        console.log(`✅ Inserted ${insertedAbout.length} about page content sections`);

        console.log("\n=== ABOUT CONTENT SEEDING COMPLETED ===");
        console.log(`Total about sections created: ${insertedAbout.length}`);
        
        process.exit(0);
    } catch (error) {
        console.error("Error seeding about content:", error);
        process.exit(1);
    }
};

// Run the seeder
if (require.main === module) {
    seedAboutContent();
}

module.exports = seedAboutContent;