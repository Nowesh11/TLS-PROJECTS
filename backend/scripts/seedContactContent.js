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

const seedContactContent = async () => {
    try {
        await connectDB();
        console.log("Starting contact page content seeding...");

        // Use a default ObjectId for createdBy field
        const defaultUserId = new mongoose.Types.ObjectId();
        console.log("Using default user ID for seeding:", defaultUserId);

        // Clear existing contact content
        await WebsiteContent.deleteMany({ page: "contact" });
        console.log("Cleared existing contact content");

        // Default SEO keywords for all sections
        const defaultSeoKeywords = {
            en: ["Contact us", "Tamil Literary Society", "Get in touch", "Support", "Help"],
            ta: ["எங்களைத் தொடர்பு கொள்ளுங்கள்", "தமிழ் இலக்கிய சங்கம்", "தொடர்பில் இருங்கள்", "ஆதரவு", "உதவி"]
        };

        // Contact Page Content
        const contactContent = [
            // Hero Section
            {
                page: "contact",
                section: "heroTitle",
                sectionKey: "contact-hero-title",
                sectionType: "hero",
                position: 1,
                title: {
                    en: "Get In Touch",
                    ta: "தொடர்பில் இருங்கள்"
                },
                content: {
                    en: "We're here to help and answer any questions you might have",
                    ta: "உங்களுக்கு இருக்கக்கூடிய எந்த கேள்விகளுக்கும் உதவுவதற்கும் பதிலளிப்பதற்கும் நாங்கள் இங்கே இருக்கிறோம்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Contact Form Section
            {
                page: "contact",
                section: "contactForm",
                sectionKey: "contact-form-title",
                sectionType: "form",
                position: 2,
                title: {
                    en: "Send Us a Message",
                    ta: "எங்களுக்கு ஒரு செய்தி அனுப்புங்கள்"
                },
                content: {
                    en: "Fill out the form below and we'll get back to you as soon as possible",
                    ta: "கீழே உள்ள படிவத்தை நிரப்புங்கள், நாங்கள் விரைவில் உங்களைத் தொடர்பு கொள்வோம்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Contact Information
            {
                page: "contact",
                section: "contactInfo",
                sectionKey: "contact-info-title",
                sectionType: "info",
                position: 3,
                title: {
                    en: "Contact Information",
                    ta: "தொடர்பு தகவல்"
                },
                content: {
                    en: "Reach out to us through any of the following channels",
                    ta: "பின்வரும் எந்த வழியிலும் எங்களைத் தொடர்பு கொள்ளுங்கள்"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Office Address
            {
                page: "contact",
                section: "officeAddress",
                sectionKey: "contact-office-address",
                sectionType: "address",
                position: 4,
                title: {
                    en: "Office Address",
                    ta: "அலுவலக முகவரி"
                },
                content: {
                    en: "Tamil Literary Society\n123 Tamil Street\nChennai, Tamil Nadu 600001\nIndia",
                    ta: "தமிழ் இலக்கிய சங்கம்\n123 தமிழ் தெரு\nசென்னை, தமிழ்நாடு 600001\nஇந்தியா"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Phone Number
            {
                page: "contact",
                section: "phoneNumber",
                sectionKey: "contact-phone-number",
                sectionType: "contact",
                position: 5,
                title: {
                    en: "Phone",
                    ta: "தொலைபேசி"
                },
                content: {
                    en: "+91 44 1234 5678",
                    ta: "+91 44 1234 5678"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Email Address
            {
                page: "contact",
                section: "emailAddress",
                sectionKey: "contact-email-address",
                sectionType: "contact",
                position: 6,
                title: {
                    en: "Email",
                    ta: "மின்னஞ்சல்"
                },
                content: {
                    en: "info@tamilliterarysociety.org",
                    ta: "info@tamilliterarysociety.org"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            },
            // Business Hours
            {
                page: "contact",
                section: "businessHours",
                sectionKey: "contact-business-hours",
                sectionType: "info",
                position: 7,
                title: {
                    en: "Business Hours",
                    ta: "வணிக நேரம்"
                },
                content: {
                    en: "Monday - Friday: 9:00 AM - 6:00 PM\nSaturday: 10:00 AM - 4:00 PM\nSunday: Closed",
                    ta: "திங்கள் - வெள்ளி: காலை 9:00 - மாலை 6:00\nசனி: காலை 10:00 - மாலை 4:00\nஞாயிறு: மூடப்பட்டுள்ளது"
                },
                seoKeywords: defaultSeoKeywords,
                createdBy: defaultUserId,
                isVisible: true,
                isActive: true
            }
        ];

        // Insert contact content
        const insertedContact = await WebsiteContent.insertMany(contactContent);
        console.log(`✅ Inserted ${insertedContact.length} contact page content sections`);

        console.log("\n=== CONTACT CONTENT SEEDING COMPLETED ===");
        console.log(`Total contact sections created: ${insertedContact.length}`);
        
        process.exit(0);
    } catch (error) {
        console.error("Error seeding contact content:", error);
        process.exit(1);
    }
};

// Run the seeder
if (require.main === module) {
    seedContactContent();
}

module.exports = seedContactContent;