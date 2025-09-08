const mongoose = require("mongoose");
const WebsiteContent = require("../models/WebsiteContent");
const User = require("../models/User");
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

const seedGlobalContent = async () => {
    try {
        await connectDB();
        console.log("Starting global content seeding...");

        // Find admin user
        const adminUser = await User.findOne({ email: "nowesh03@gmail.com" });
        if (!adminUser) {
            console.error("Admin user not found");
            process.exit(1);
        }
        console.log("Using admin user:", adminUser.email);

        // Clear existing global content
        await WebsiteContent.deleteMany({ page: "global" });
        console.log("Cleared existing global content");

        // Global Navigation Content
        const globalContent = [
            // Website Metadata
            {
                page: "global",
                section: "websiteTitle",
                sectionKey: "global-website-title",
                sectionType: "text",
                position: 1,
                title: {
                    en: "Tamil Language Society",
                    ta: "தமிழ் மொழி சங்கம்"
                },
                content: {
                    en: "Preserving and promoting Tamil language and culture worldwide",
                    ta: "உலகம் முழுவதும் தமிழ் மொழி மற்றும் கலாச்சாரத்தைப் பாதுகாத்து ஊக்குவித்தல்"
                },
                createdBy: adminUser._id,
                visible: true,
                active: true
            },
            // Logo and Branding
            {
                page: "global",
                section: "logoText",
                sectionKey: "global-logo-text",
                sectionType: "text",
                position: 2,
                title: {
                    en: "Tamil Language Society",
                    ta: "தமிழ் மொழி சங்கம்"
                },
                content: {
                    en: "TLS",
                    ta: "த.மொ.ச"
                },
                image: "/frontend/public/assets/logo.png",
                createdBy: adminUser._id,
                visible: true,
                active: true
            },
            // Navigation Menu Items
            {
                page: "global",
                section: "menuHome",
                sectionKey: "global-menu-home",
                sectionType: "navigation",
                position: 3,
                title: {
                    en: "Home",
                    ta: "முகப்பு"
                },
                buttonUrl: "index.html",
                createdBy: adminUser._id,
                visible: true,
                active: true
            },
            {
                page: "global",
                section: "menuAbout",
                sectionKey: "global-menu-about",
                sectionType: "navigation",
                position: 4,
                title: {
                    en: "About",
                    ta: "எங்களைப் பற்றி"
                },
                buttonUrl: "about.html",
                createdBy: adminUser._id,
                visible: true,
                active: true
            },
            {
                page: "global",
                section: "menuProjects",
                sectionKey: "global-menu-projects",
                sectionType: "navigation",
                position: 5,
                title: {
                    en: "Projects",
                    ta: "திட்டங்கள்"
                },
                buttonUrl: "projects.html",
                createdBy: adminUser._id,
                visible: true,
                active: true
            },
            {
                page: "global",
                section: "menuEbooks",
                sectionKey: "global-menu-ebooks",
                sectionType: "navigation",
                position: 6,
                title: {
                    en: "E-Books",
                    ta: "மின்னூல்கள்"
                },
                buttonUrl: "ebooks.html",
                createdBy: adminUser._id,
                visible: true,
                active: true
            },
            {
                page: "global",
                section: "menuBookstore",
                sectionKey: "global-menu-bookstore",
                sectionType: "navigation",
                position: 7,
                title: {
                    en: "Book Store",
                    ta: "புத்தக கடை"
                },
                buttonUrl: "books.html",
                createdBy: adminUser._id,
                visible: true,
                active: true
            },
            {
                page: "global",
                section: "menuContact",
                sectionKey: "global-menu-contact",
                sectionType: "navigation",
                position: 8,
                title: {
                    en: "Contact",
                    ta: "தொடர்பு"
                },
                buttonUrl: "contact.html",
                createdBy: adminUser._id,
                visible: true,
                active: true
            },
            {
                page: "global",
                section: "menuLogin",
                sectionKey: "global-menu-login",
                sectionType: "navigation",
                position: 9,
                title: {
                    en: "Login",
                    ta: "உள்நுழைவு"
                },
                buttonUrl: "login.html",
                createdBy: adminUser._id,
                visible: true,
                active: true
            },
            {
                page: "global",
                section: "menuSignup",
                sectionKey: "global-menu-signup",
                sectionType: "navigation",
                position: 10,
                title: {
                    en: "Sign Up",
                    ta: "பதிவு செய்யுங்கள்"
                },
                buttonUrl: "signup.html",
                createdBy: adminUser._id,
                visible: true,
                active: true
            },
            // Language Toggle
            {
                page: "global",
                section: "languageToggleTamil",
                sectionKey: "global-language-toggle-tamil",
                sectionType: "navigation",
                position: 11,
                title: {
                    en: "Tamil",
                    ta: "தமிழ்"
                },
                content: {
                    en: "Switch to Tamil",
                    ta: "தமிழுக்கு மாறவும்"
                },
                createdBy: adminUser._id,
                visible: true,
                active: true
            },
            // Footer Content
            {
                page: "global",
                section: "footerLogoText",
                sectionKey: "global-footer-logo-text",
                sectionType: "footer",
                position: 12,
                title: {
                    en: "Tamil Language Society",
                    ta: "தமிழ் மொழி சங்கம்"
                },
                image: "/frontend/public/assets/logo.png",
                createdBy: adminUser._id,
                visible: true,
                active: true
            },
            {
                page: "global",
                section: "footerDescription",
                sectionKey: "global-footer-description",
                sectionType: "footer",
                position: 13,
                content: {
                    en: "Dedicated to preserving and promoting the rich heritage of Tamil language and culture worldwide.",
                    ta: "உலகம் முழுவதும் தமிழ் மொழி மற்றும் கலாச்சாரத்தின் வளமான பாரம்பரியத்தைப் பாதுகாத்து ஊக்குவிப்பதில் அர்ப்பணிப்புடன்."
                },
                createdBy: adminUser._id,
                visible: true,
                active: true
            },
            {
                page: "global",
                section: "footerQuicklinksTitle",
                sectionKey: "global-footer-quicklinks-title",
                sectionType: "footer",
                position: 14,
                title: {
                    en: "Quick Links",
                    ta: "விரைவு இணைப்புகள்"
                },
                createdBy: adminUser._id,
                visible: true,
                active: true
            },
            {
                page: "global",
                section: "footerAboutLink",
                sectionKey: "global-footer-about-link",
                sectionType: "footer",
                position: 15,
                title: {
                    en: "About Us",
                    ta: "எங்களைப் பற்றி"
                },
                buttonUrl: "about.html",
                createdBy: adminUser._id,
                visible: true,
                active: true
            },
            {
                page: "global",
                section: "footerProjectsLink",
                sectionKey: "global-footer-projects-link",
                sectionType: "footer",
                position: 16,
                title: {
                    en: "Projects",
                    ta: "திட்டங்கள்"
                },
                buttonUrl: "projects.html",
                createdBy: adminUser._id,
                visible: true,
                active: true
            },
            {
                page: "global",
                section: "footerEbooksLink",
                sectionKey: "global-footer-ebooks-link",
                sectionType: "footer",
                position: 17,
                title: {
                    en: "E-Books",
                    ta: "மின்னூல்கள்"
                },
                buttonUrl: "ebooks.html",
                createdBy: adminUser._id,
                visible: true,
                active: true
            },
            {
                page: "global",
                section: "footerBookstoreLink",
                sectionKey: "global-footer-bookstore-link",
                sectionType: "footer",
                position: 18,
                title: {
                    en: "Book Store",
                    ta: "புத்தக கடை"
                },
                buttonUrl: "books.html",
                createdBy: adminUser._id,
                visible: true,
                active: true
            },
            {
                page: "global",
                section: "footerSupportTitle",
                sectionKey: "global-footer-support-title",
                sectionType: "footer",
                position: 19,
                title: {
                    en: "Support",
                    ta: "ஆதரவு"
                },
                createdBy: adminUser._id,
                visible: true,
                active: true
            },
            {
                page: "global",
                section: "footerContactLink",
                sectionKey: "global-footer-contact-link",
                sectionType: "footer",
                position: 20,
                title: {
                    en: "Contact Us",
                    ta: "எங்களைத் தொடர்பு கொள்ளுங்கள்"
                },
                buttonUrl: "contact.html",
                createdBy: adminUser._id,
                visible: true,
                active: true
            },
            {
                page: "global",
                section: "footerNotificationsLink",
                sectionKey: "global-footer-notifications-link",
                sectionType: "footer",
                position: 21,
                title: {
                    en: "Notifications",
                    ta: "அறிவிப்புகள்"
                },
                buttonUrl: "notifications.html",
                createdBy: adminUser._id,
                visible: true,
                active: true
            },
            {
                page: "global",
                section: "footerNewsletterTitle",
                sectionKey: "global-footer-newsletter-title",
                sectionType: "footer",
                position: 22,
                title: {
                    en: "Newsletter",
                    ta: "செய்திமடல்"
                },
                createdBy: adminUser._id,
                visible: true,
                active: true
            },
            {
                page: "global",
                section: "footerNewsletterDescription",
                sectionKey: "global-footer-newsletter-description",
                sectionType: "footer",
                position: 23,
                content: {
                    en: "Stay updated with our latest news and events",
                    ta: "எங்கள் சமீபத்திய செய்திகள் மற்றும் நிகழ்வுகளுடன் புதுப்பித்த நிலையில் இருங்கள்"
                },
                createdBy: adminUser._id,
                visible: true,
                active: true
            },
            {
                page: "global",
                section: "footerEmailPlaceholder",
                sectionKey: "global-footer-email-placeholder",
                sectionType: "footer",
                position: 24,
                content: {
                    en: "Enter your email",
                    ta: "உங்கள் மின்னஞ்சலை உள்ளிடுங்கள்"
                },
                createdBy: adminUser._id,
                visible: true,
                active: true
            },
            {
                page: "global",
                section: "footerCopyright",
                sectionKey: "global-footer-copyright",
                sectionType: "footer",
                position: 25,
                content: {
                    en: "© 2025 Tamil Language Society. All rights reserved.",
                    ta: "© 2025 தமிழ் மொழி சங்கம். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை."
                },
                createdBy: adminUser._id,
                visible: true,
                active: true
            }
        ];

        // Insert global content
        const insertedGlobal = await WebsiteContent.insertMany(globalContent);
        console.log(`✅ Inserted ${insertedGlobal.length} global content sections`);

        console.log("\n=== GLOBAL CONTENT SEEDING COMPLETED ===");
        console.log(`Total global sections created: ${insertedGlobal.length}`);
        
        process.exit(0);
    } catch (error) {
        console.error("Error seeding global content:", error);
        process.exit(1);
    }
};

// Run the seeder
if (require.main === module) {
    seedGlobalContent();
}

module.exports = seedGlobalContent;