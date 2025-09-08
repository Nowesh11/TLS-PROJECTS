const mongoose = require("mongoose");
const WebsiteContentSection = require("../models/WebsiteContentSection");
require("dotenv").config();

// Default global sections for the Tamil Language Society website
const globalSections = [
    {
        pageName: "global",
        sectionId: "navbar",
        sectionTitle: "Navigation Bar",
        contentHtml: `<nav class="navbar" id="navbar">
            <div class="nav-container">
                <div class="nav-logo">
                    <img data-content="global.logo.image" src="assets/logo.png" alt="Tamil Language Society" class="logo-img">
                    <span data-content="global.logo.text" data-content-tamil="global.logo.textTamil" class="logo-text">தமிழ்ப் பேரவை</span>
                </div>
                <div class="nav-menu" id="nav-menu">
                    <a href="index.html" class="nav-link active" data-content="global.menu.home" data-content-tamil="global.menu.homeTamil">Home</a>
                    <a href="about.html" class="nav-link" data-content="global.menu.about" data-content-tamil="global.menu.aboutTamil">About Us</a>
                    <a href="projects.html" class="nav-link" data-content="global.menu.projects" data-content-tamil="global.menu.projectsTamil">Projects</a>
                    <a href="ebooks.html" class="nav-link" data-content="global.menu.ebooks" data-content-tamil="global.menu.ebooksTamil">Ebooks</a>
                    <a href="books.html" class="nav-link" data-content="global.menu.bookstore" data-content-tamil="global.menu.bookstoreTamil">Book Store</a>
                    <a href="contact.html" class="nav-link" data-content="global.menu.contact" data-content-tamil="global.menu.contactTamil">Contact Us</a>
    
                </div>
            </div>
        </nav>`,
        contentTamil: "",
        order: 1,
        isActive: true,
        isVisible: true,
        layout: "default",
        metadata: {
            sectionType: "navigation",
            editable: true,
            description: "Main navigation bar with logo and menu items"
        },
        seo: {
            title: "Navigation Bar",
            description: "Main navigation for Tamil Language Society website"
        },
        styling: {
            backgroundColor: "var(--bg-primary)",
            textColor: "var(--text-primary)"
        }
    },
    {
        pageName: "global",
        sectionId: "footer",
        sectionTitle: "Footer",
        contentHtml: `<footer class="footer" id="footer">
            <div class="footer-container">
                <div class="footer-content">
                    <div class="footer-section">
                        <h3 data-content="global.footer.aboutTitle" data-content-tamil="global.footer.aboutTitleTamil">About Tamil Language Society</h3>
                        <p data-content="global.footer.aboutText" data-content-tamil="global.footer.aboutTextTamil">Dedicated to preserving and promoting Tamil language, literature, and culture through education, research, and community engagement.</p>
                    </div>
                    <div class="footer-section">
                        <h3 data-content="global.footer.quickLinksTitle" data-content-tamil="global.footer.quickLinksTitleTamil">Quick Links</h3>
                        <ul class="footer-links">
                            <li><a href="about.html" data-content="global.footer.aboutLink" data-content-tamil="global.footer.aboutLinkTamil">About Us</a></li>
                            <li><a href="projects.html" data-content="global.footer.projectsLink" data-content-tamil="global.footer.projectsLinkTamil">Projects</a></li>
                            <li><a href="books.html" data-content="global.footer.booksLink" data-content-tamil="global.footer.booksLinkTamil">Books</a></li>
                            <li><a href="contact.html" data-content="global.footer.contactLink" data-content-tamil="global.footer.contactLinkTamil">Contact</a></li>
                        </ul>
                    </div>
                    <div class="footer-section">
                        <h3 data-content="global.footer.contactTitle" data-content-tamil="global.footer.contactTitleTamil">Contact Info</h3>
                        <p data-content="global.footer.email">info@tamilsociety.org</p>
                        <p data-content="global.footer.phone">+1 (555) 123-4567</p>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p data-content="global.footer.copyright" data-content-tamil="global.footer.copyrightTamil">&copy; 2024 Tamil Language Society. All rights reserved.</p>
                </div>
            </div>
        </footer>`,
        contentTamil: "",
        order: 2,
        isActive: true,
        isVisible: true,
        layout: "default",
        metadata: {
            sectionType: "footer",
            editable: true,
            description: "Website footer with links and contact information"
        },
        seo: {
            title: "Footer",
            description: "Footer section with contact info and links"
        },
        styling: {
            backgroundColor: "var(--bg-secondary)",
            textColor: "var(--text-secondary)"
        }
    },
    {
        pageName: "global",
        sectionId: "meta-tags",
        sectionTitle: "Meta Tags & SEO",
        contentHtml: `<meta name="description" content="Tamil Language Society - Preserving and promoting Tamil language, literature, and culture through education and community engagement.">
        <meta name="keywords" content="Tamil, language, society, culture, literature, education, community, books, ebooks, projects">
        <meta name="author" content="Tamil Language Society">
        <meta property="og:title" content="Tamil Language Society - தமிழ்ப் பேரவை">
        <meta property="og:description" content="Dedicated to preserving and promoting Tamil language, literature, and culture.">
        <meta property="og:image" content="assets/logo.png">
        <meta property="og:url" content="https://tamilsociety.org">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="Tamil Language Society">
        <meta name="twitter:description" content="Preserving Tamil language and culture through education and community.">
        <meta name="twitter:image" content="assets/logo.png">`,
        contentTamil: "",
        order: 3,
        isActive: true,
        isVisible: true,
        layout: "default",
        metadata: {
            sectionType: "meta",
            editable: true,
            description: "SEO meta tags and social media tags"
        },
        seo: {
            title: "Meta Tags",
            description: "SEO and social media meta tags for the website"
        },
        styling: {}
    },
    {
        pageName: "global",
        sectionId: "site-config",
        sectionTitle: "Site Configuration",
        contentHtml: `{
            "siteName": "Tamil Language Society",
            "siteNameTamil": "தமிழ்ப் பேரவை",
            "tagline": "Preserving Tamil Heritage",
            "taglineTamil": "தமிழ் பாரம்பரியத்தை பாதுகாத்தல்",
            "logo": "assets/logo.png",
            "favicon": "favicon.ico",
            "primaryColor": "#d32f2f",
            "secondaryColor": "#1976d2",
            "contactEmail": "info@tamilsociety.org",
            "contactPhone": "+1 (555) 123-4567",
            "socialMedia": {
                "facebook": "https://facebook.com/tamilsociety",
                "twitter": "https://twitter.com/tamilsociety",
                "instagram": "https://instagram.com/tamilsociety",
                "youtube": "https://youtube.com/tamilsociety"
            }
        }`,
        contentTamil: "",
        order: 4,
        isActive: true,
        isVisible: true,
        layout: "default",
        metadata: {
            sectionType: "config",
            editable: true,
            description: "Global site configuration and settings"
        },
        seo: {
            title: "Site Configuration",
            description: "Global website configuration settings"
        },
        styling: {}
    }
];

async function createGlobalSections() {
    try {
        console.log("🔗 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/tamil-language-society");
        console.log("✅ Connected to MongoDB");

        // Clear existing global sections
        const deleteResult = await WebsiteContentSection.deleteMany({ pageName: "global" });
        console.log(`🗑️ Cleared ${deleteResult.deletedCount} existing global sections`);

        // Create new global sections
        console.log("📝 Creating global sections...");
        const createdSections = await WebsiteContentSection.insertMany(globalSections);
        console.log(`✅ Successfully created ${createdSections.length} global sections`);

        // Verify creation
        const verifyCount = await WebsiteContentSection.countDocuments({ pageName: "global" });
        console.log(`🔍 Verification: ${verifyCount} global sections now exist in database`);

        // Display created sections
        console.log("\n📋 Created Global Sections:");
        createdSections.forEach((section, index) => {
            console.log(`${index + 1}. ${section.sectionTitle} (${section.sectionId})`);
        });

        console.log("\n🎉 Global sections creation completed successfully!");
        console.log("\n💡 Next steps:");
        console.log("1. Refresh the admin panel to see the global sections");
        console.log("2. Test editing the sections through the content editor");
        console.log("3. Verify that changes are saved to the database");

    } catch (error) {
        console.error("❌ Error creating global sections:", error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log("🔌 Database connection closed");
        process.exit(0);
    }
}

// Run the script
if (require.main === module) {
    createGlobalSections();
}

module.exports = { createGlobalSections, globalSections };