const mongoose = require("mongoose");
const ContentKeyValue = require("../models/ContentKeyValue");
const User = require("../models/User");
require("dotenv").config();

async function addBilingualContent() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/tamil-language-society");
        console.log("Connected to MongoDB");

        // Find or create admin user
        let adminUser = await User.findOne({ email: "admin@tamilsociety.org" });
        if (!adminUser) {
            adminUser = await User.create({
                name: "Admin User",
                email: "admin@tamilsociety.org",
                password: "admin123", // This will be hashed by the model
                role: "admin",
                isVerified: true
            });
            console.log("Created admin user");
        }

        // Sample bilingual content entries - separate entries for each language
        const contentEntries = [
            // Navigation content
            { key: "global.menu.home", en: "Home", ta: "முகப்பு", page: "global", section: "navigation", element: "link" },
            { key: "global.menu.about", en: "About Us", ta: "எங்களைப் பற்றி", page: "global", section: "navigation", element: "link" },
            { key: "global.menu.projects", en: "Projects", ta: "திட்டங்கள்", page: "global", section: "navigation", element: "link" },
            { key: "global.menu.ebooks", en: "E-books", ta: "மின்னூல்கள்", page: "global", section: "navigation", element: "link" },
            { key: "global.menu.bookstore", en: "Book Store", ta: "புத்தக கடை", page: "global", section: "navigation", element: "link" },
            { key: "global.menu.contact", en: "Contact Us", ta: "தொடர்பு கொள்ளுங்கள்", page: "global", section: "navigation", element: "link" },
    
            { key: "global.menu.login", en: "Login", ta: "உள்நுழைவு", page: "global", section: "navigation", element: "link" },
            { key: "global.menu.signup", en: "Sign Up", ta: "பதிவு செய்யுங்கள்", page: "global", section: "navigation", element: "link" },
            
            // Homepage content
            { key: "homepage.hero.title", en: "Welcome to Tamil Language Society", ta: "தமிழ் மொழி சங்கத்திற்கு வரவேற்கிறோம்", page: "homepage", section: "hero", element: "heading" },
            { key: "homepage.hero.subtitle", en: "Preserving Tamil Heritage Through Education and Culture", ta: "கல்வி மற்றும் கலாச்சாரத்தின் மூலம் தமிழ் பாரம்பரியத்தைப் பாதுகாத்தல்", page: "homepage", section: "hero", element: "text" },
            { key: "homepage.features.library.title", en: "Digital Library", ta: "டிஜிட்டல் நூலகம்", page: "homepage", section: "features", element: "heading" },
            { key: "homepage.features.library.description", en: "Access thousands of Tamil books, manuscripts, and educational resources in our comprehensive digital collection.", ta: "எங்கள் விரிவான டிஜிட்டல் தொகுப்பில் ஆயிரக்கணக்கான தமிழ் புத்தகங்கள், கையெழுத்துப் பிரதிகள் மற்றும் கல்வி வளங்களை அணுகவும்.", page: "homepage", section: "features", element: "text" },
            { key: "homepage.features.projects.title", en: "Cultural Programs", ta: "கலாச்சார நிகழ்ச்சிகள்", page: "homepage", section: "features", element: "heading" },
            { key: "homepage.features.projects.description", en: "Join our initiatives, workshops, and events that celebrate Tamil heritage and traditions.", ta: "தமிழ் பாரம்பரியம் மற்றும் பாரம்பரியங்களைக் கொண்டாடும் எங்கள் முன்முயற்சிகள், பட்டறைகள் மற்றும் நிகழ்வுகளில் சேருங்கள்.", page: "homepage", section: "features", element: "text" },
            { key: "homepage.features.bookstore.title", en: "Book Store", ta: "புத்தக கடை", page: "homepage", section: "features", element: "heading" },
            { key: "homepage.features.bookstore.description", en: "Purchase authentic Tamil literature, textbooks, and cultural materials from our curated collection.", ta: "எங்கள் தேர்ந்தெடுக்கப்பட்ட தொகுப்பிலிருந்து உண்மையான தமிழ் இலக்கியம், பாடப்புத்தகங்கள் மற்றும் கலாச்சார பொருட்களை வாங்கவும்.", page: "homepage", section: "features", element: "text" },
            
            // Footer content
            { key: "global.footer.description", en: "Dedicated to preserving and promoting the rich heritage of Tamil language and culture worldwide.", ta: "உலகளவில் தமிழ் மொழி மற்றும் கலாச்சாரத்தின் வளமான பாரம்பரியத்தைப் பாதுகாத்து ஊக்குவிப்பதில் அர்ப்பணிப்பு.", page: "global", section: "footer", element: "text" },
            { key: "global.footer.quickLinksTitle", en: "Quick Links", ta: "விரைவு இணைப்புகள்", page: "global", section: "footer", element: "heading" }
        ];

        // Convert to database format
        const bilingualContent = [];
        contentEntries.forEach(entry => {
            // English entry
            bilingualContent.push({
                content_key: entry.key,
                content_value: entry.en,
                language: "en",
                type: "text",
                page: entry.page,
                section: entry.section,
                element: entry.element,
                created_by: adminUser._id,
                updated_by: adminUser._id
            });
            
            // Tamil entry
            bilingualContent.push({
                content_key: entry.key,
                content_value: entry.ta,
                language: "ta",
                type: "text",
                page: entry.page,
                section: entry.section,
                element: entry.element,
                created_by: adminUser._id,
                updated_by: adminUser._id
            });
        });

        // Clear existing content
        await ContentKeyValue.deleteMany({});
        console.log("Cleared existing content");

        // Insert new bilingual content
        await ContentKeyValue.insertMany(bilingualContent);
        console.log(`Added ${bilingualContent.length} bilingual content entries`);

        console.log("Bilingual content added successfully!");

    } catch (error) {
        console.error("Error adding bilingual content:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

// Run the script
if (require.main === module) {
    addBilingualContent();
}

module.exports = { addBilingualContent };