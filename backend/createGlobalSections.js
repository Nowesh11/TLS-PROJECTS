const mongoose = require("mongoose");
const WebsiteContentSection = require("./models/WebsiteContentSection");
require("dotenv").config({ path: "./config/.env" });

// Connect to MongoDB with the correct database name
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/tamilsociety";
        const conn = await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database: ${conn.connection.name}`);
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
};

// Global sections data
const globalSections = [
    {
        pageName: "global",
        sectionId: "navbar",
        sectionTitle: "Navigation Bar",
        layout: "default",
        order: 1,
        contentHtml: "<nav class=\"navbar\"><div class=\"navbar-brand\">Tamil Language Society</div></nav>",
        content: {
            brand: {
                name: "Tamil Language Society",
                nameTamil: "தமிழ்ப் பேரவை",
                logo: "/assets/images/logo.png"
            },
            menuItems: [
                {
                    name: "Home",
                    nameTamil: "முகப்பு",
                    url: "/",
                    active: true
                },
                {
                    name: "About",
                    nameTamil: "எங்களைப் பற்றி",
                    url: "/about",
                    active: true
                },
                {
                    name: "Books",
                    nameTamil: "புத்தகங்கள்",
                    url: "/books",
                    active: true
                },
                {
                    name: "E-Books",
                    nameTamil: "மின்னூல்கள்",
                    url: "/ebooks",
                    active: true
                },
                {
                    name: "Projects",
                    nameTamil: "திட்டங்கள்",
                    url: "/projects",
                    active: true
                },
                {
                    name: "Contact",
                    nameTamil: "தொடர்பு",
                    url: "/contact",
                    active: true
                }
            ],
            userMenu: {
                login: "Login",
                loginTamil: "உள்நுழைவு",
                register: "Register",
                registerTamil: "பதிவு செய்யுங்கள்",
                profile: "Profile",
                profileTamil: "சுயவிவரம்",
                logout: "Logout",
                logoutTamil: "வெளியேறு"
            }
        },
        isVisible: true,
        isActive: true,
        metadata: {
            description: "Main navigation bar with brand, menu items, and user actions",
            keywords: ["navigation", "menu", "header"]
        }
    },
    {
        pageName: "global",
        sectionId: "footer",
        sectionTitle: "Footer",
        layout: "footer",
        order: 2,
        contentHtml: "<footer class=\"footer\"><div class=\"container\"><p>&copy; 2024 Tamil Language Society</p></div></footer>",
        content: {
            copyright: {
                text: "© 2024 Tamil Language Society. All rights reserved.",
                textTamil: "© 2024 தமிழ்ப் பேரவை. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை."
            },
            socialLinks: [
                {
                    platform: "Facebook",
                    url: "https://facebook.com/tamilsociety",
                    icon: "fab fa-facebook-f"
                },
                {
                    platform: "Twitter",
                    url: "https://twitter.com/tamilsociety",
                    icon: "fab fa-twitter"
                },
                {
                    platform: "Instagram",
                    url: "https://instagram.com/tamilsociety",
                    icon: "fab fa-instagram"
                },
                {
                    platform: "YouTube",
                    url: "https://youtube.com/tamilsociety",
                    icon: "fab fa-youtube"
                }
            ],
            quickLinks: [
                {
                    name: "Privacy Policy",
                    nameTamil: "தனியுரிமைக் கொள்கை",
                    url: "/privacy"
                },
                {
                    name: "Terms of Service",
                    nameTamil: "சேவை விதிமுறைகள்",
                    url: "/terms"
                },
                {
                    name: "Contact Us",
                    nameTamil: "எங்களைத் தொடர்பு கொள்ளுங்கள்",
                    url: "/contact"
                }
            ],
            contact: {
                email: "info@tamilsociety.org",
                phone: "+1-234-567-8900",
                address: "Tamil Language Society, Cultural Center, City"
            }
        },
        isVisible: true,
        isActive: true,
        metadata: {
            description: "Website footer with copyright, social links, and contact information",
            keywords: ["footer", "contact", "social", "links"]
        }
    },
    {
        pageName: "global",
        sectionId: "meta-tags",
        sectionTitle: "Meta Tags & SEO",
        layout: "default",
        order: 3,
        contentHtml: "<meta name=\"description\" content=\"Tamil Language Society - Preserving Tamil Heritage\">",
        content: {
            siteName: "Tamil Language Society",
            siteNameTamil: "தமிழ்ப் பேரவை",
            defaultTitle: "Tamil Language Society - Preserving Tamil Heritage",
            defaultTitleTamil: "தமிழ்ப் பேரவை - தமிழ் பாரம்பரியத்தைப் பாதுகாத்தல்",
            defaultDescription: "Dedicated to preserving and promoting Tamil language, literature, and culture for future generations.",
            defaultDescriptionTamil: "எதிர்கால சந்ததியினருக்காக தமிழ் மொழி, இலக்கியம் மற்றும் கலாச்சாரத்தைப் பாதுகாத்து ஊக்குவிப்பதில் அர்ப்பணிப்பு.",
            keywords: "Tamil, language, literature, culture, books, heritage, society, community",
            keywordsTamil: "தமிழ், மொழி, இலக்கியம், கலாச்சாரம், புத்தகங்கள், பாரம்பரியம், சமுதாயம், சமூகம்",
            author: "Tamil Language Society",
            robots: "index, follow",
            viewport: "width=device-width, initial-scale=1.0",
            ogImage: "/assets/images/og-image.jpg",
            favicon: "/assets/images/favicon.ico"
        },
        isVisible: true,
        isActive: true,
        metadata: {
            description: "Global meta tags and SEO configuration for the website",
            keywords: ["meta", "seo", "tags", "optimization"]
        }
    },
    {
        pageName: "global",
        sectionId: "site-config",
        sectionTitle: "Site Configuration",
        layout: "default",
        order: 4,
        contentHtml: "<div class=\"site-config\">Site configuration data</div>",
        content: {
            theme: {
                defaultTheme: "light",
                allowThemeSwitch: true,
                themes: ["light", "dark", "auto"]
            },
            language: {
                defaultLanguage: "english",
                supportedLanguages: ["english", "tamil"],
                allowLanguageSwitch: true
            },
            features: {
                userRegistration: true,
                guestCheckout: false,
                newsletter: true,
                comments: true,
                ratings: true,
                search: true
            },
            contact: {
                supportEmail: "support@tamilsociety.org",
                adminEmail: "admin@tamilsociety.org",
                phone: "+1-234-567-8900",
                businessHours: "Mon-Fri 9AM-5PM EST"
            },
            social: {
                facebook: "https://facebook.com/tamilsociety",
                twitter: "https://twitter.com/tamilsociety",
                instagram: "https://instagram.com/tamilsociety",
                youtube: "https://youtube.com/tamilsociety"
            },
            analytics: {
                googleAnalytics: "",
                facebookPixel: "",
                enableTracking: false
            }
        },
        isVisible: true,
        isActive: true,
        metadata: {
            description: "Global site configuration and settings",
            keywords: ["config", "settings", "theme", "language"]
        }
    }
];

// Main function to create global sections
const createGlobalSections = async () => {
    try {
        await connectDB();
        
        console.log("\n=== Creating Global Sections ===");
        
        // Clear existing global sections
        const deleteResult = await WebsiteContentSection.deleteMany({ pageName: "global" });
        console.log(`Cleared ${deleteResult.deletedCount} existing global sections`);
        
        // Insert new global sections
        const insertResult = await WebsiteContentSection.insertMany(globalSections);
        console.log(`Created ${insertResult.length} new global sections:`);
        
        insertResult.forEach(section => {
            console.log(`- ${section.title} (${section.sectionId})`);
        });
        
        // Verify sections were created
        const verifyCount = await WebsiteContentSection.countDocuments({ pageName: "global" });
        console.log(`\nVerification: ${verifyCount} global sections found in database`);
        
        console.log("\n✅ Global sections created successfully!");
        
    } catch (error) {
        console.error("❌ Error creating global sections:", error);
    } finally {
        await mongoose.connection.close();
        console.log("Database connection closed");
    }
};

// Run the script
if (require.main === module) {
    createGlobalSections();
}

module.exports = { createGlobalSections, globalSections };