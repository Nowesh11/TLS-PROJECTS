const mongoose = require("mongoose");
const WebsiteContent = require("../models/WebsiteContent");
require("dotenv").config();

const addGlobalElements = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");
        
        // Define global elements to add (respecting unique page+section constraint)
        const globalElements = [
            {
                page: "global",
                section: "header-logo",
                sectionKey: "global-header-logo",
                sectionType: "image",
                title: {
                    en: "Tamil Language Society Logo",
                    ta: "தமிழ் மொழி சங்கம் சின்னம்"
                },
                content: {
                    en: "Official logo of Tamil Language Society",
                    ta: "தமிழ் மொழி சங்கத்தின் அதிகாரப்பூர்வ சின்னம்"
                },
                images: [{
                    url: "/assets/logo.jpeg",
                    alt: {
                        en: "Tamil Language Society Logo",
                        ta: "தமிழ் மொழி சங்கம் சின்னம்"
                    }
                }],
                order: 1,
                isActive: true,
                isVisible: true
            },
            {
                page: "global",
                section: "header-title",
                sectionKey: "global-header-title",
                sectionType: "text",
                title: {
                    en: "Tamil Language Society",
                    ta: "தமிழ் மொழி சங்கம்"
                },
                content: {
                    en: "Preserving and promoting Tamil language and culture",
                    ta: "தமிழ் மொழி மற்றும் பண்பாட்டைப் பாதுகாத்து மேம்படுத்துதல்"
                },
                order: 2,
                isActive: true,
                isVisible: true
            },
            {
                page: "global",
                section: "main-navigation",
                sectionKey: "global-main-nav",
                sectionType: "navigation",
                title: {
                    en: "Main Navigation",
                    ta: "முக்கிய வழிசெலுத்தல்"
                },
                content: {
                    en: "Home|About|Books|E-Books|Projects|Contact",
                    ta: "முகப்பு|எங்களைப் பற்றி|புத்தகங்கள்|மின்னூல்கள்|திட்டங்கள்|தொடர்பு"
                },
                metadata: {
                    navItems: [
                        { en: "Home", ta: "முகப்பு", url: "/" },
                        { en: "About", ta: "எங்களைப் பற்றி", url: "/about.html" },
                        { en: "Books", ta: "புத்தகங்கள்", url: "/books.html" },
                        { en: "E-Books", ta: "மின்னூல்கள்", url: "/ebooks.html" },
                        { en: "Projects", ta: "திட்டங்கள்", url: "/projects.html" },
                        { en: "Contact", ta: "தொடர்பு", url: "/contact.html" }
                    ]
                },
                order: 1,
                isActive: true,
                isVisible: true
            },
            {
                page: "global",
                section: "footer-copyright",
                sectionKey: "global-footer-copyright",
                sectionType: "text",
                title: {
                    en: "Copyright Notice",
                    ta: "பதிப்புரிமை அறிவிப்பு"
                },
                content: {
                    en: "© 2024 Tamil Language Society. All rights reserved.",
                    ta: "© 2024 தமிழ் மொழி சங்கம். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை."
                },
                order: 1,
                isActive: true,
                isVisible: true
            },
            {
                page: "global",
                section: "footer-contact",
                sectionKey: "global-footer-contact",
                sectionType: "text",
                title: {
                    en: "Contact Information",
                    ta: "தொடர்பு தகவல்"
                },
                content: {
                    en: "Email: info@tamillanguagesociety.org | Phone: +1-XXX-XXX-XXXX",
                    ta: "மின்னஞ்சல்: info@tamillanguagesociety.org | தொலைபேசி: +1-XXX-XXX-XXXX"
                },
                order: 2,
                isActive: true,
                isVisible: true
            },
            {
                page: "global",
                section: "language-selector",
                sectionKey: "global-language-selector",
                sectionType: "text",
                title: {
                    en: "Language Selector",
                    ta: "மொழி தேர்வாளர்"
                },
                content: {
                    en: "Choose your preferred language",
                    ta: "உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்"
                },
                metadata: {
                    languages: [
                        { code: "en", name: "English", nativeName: "English" },
                        { code: "ta", name: "Tamil", nativeName: "தமிழ்" }
                    ]
                },
                order: 1,
                isActive: true,
                isVisible: true
            }
        ];
        
        // Add createdBy field (using a default admin user ID)
        const adminUser = await mongoose.connection.db.collection("users").findOne({ role: "admin" });
        const adminId = adminUser ? adminUser._id : new mongoose.Types.ObjectId();
        
        for (const element of globalElements) {
            element.createdBy = adminId;
            element.updatedBy = adminId;
            
            // Check if element already exists
            const existing = await WebsiteContent.findOne({
                page: element.page,
                section: element.section,
                sectionKey: element.sectionKey
            });
            
            if (!existing) {
                await WebsiteContent.create(element);
                console.log(`✅ Added global element: ${element.sectionKey}`);
            } else {
                console.log(`⚠️ Global element already exists: ${element.sectionKey}`);
            }
        }
        
        console.log("\n🎉 Global elements setup completed!");
        
        // Show final count
        const globalCount = await WebsiteContent.countDocuments({ page: "global" });
        console.log(`📊 Total global elements in database: ${globalCount}`);
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Error adding global elements:", error);
        process.exit(1);
    }
};

addGlobalElements();