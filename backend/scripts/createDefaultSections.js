const mongoose = require("mongoose");
const WebsiteContentSection = require("../models/WebsiteContentSection");
require("dotenv").config({ path: "../.env" });

// Default sections for each page
const defaultPageSections = {
    home: [
        {
            sectionKey: "heroTitle",
            sectionTitle: "Hero Title",
            contentHtml: "Welcome to Our Website",
            layout: "hero",
            order: 1,
            isActive: true,
            isVisible: true
        },
        {
            sectionKey: "heroSubtitle",
            sectionTitle: "Hero Subtitle",
            contentHtml: "We create amazing digital experiences",
            layout: "hero",
            order: 2,
            isActive: true,
            isVisible: true
        },
        {
            sectionKey: "aboutSection",
            sectionTitle: "About Section",
            contentHtml: "<p>Learn more about our company and mission.</p>",
            layout: "default",
            order: 3,
            isActive: true,
            isVisible: true
        },
        {
            sectionKey: "servicesSection",
            sectionTitle: "Services Section",
            contentHtml: "<p>Discover our range of professional services.</p>",
            layout: "features",
            order: 4,
            isActive: true,
            isVisible: true
        }
    ],
    about: [
        {
            sectionKey: "pageTitle",
            sectionTitle: "Page Title",
            contentHtml: "About Us",
            layout: "default",
            order: 1,
            isActive: true,
            isVisible: true
        },
        {
            sectionKey: "companyHistory",
            sectionTitle: "Company History",
            contentHtml: "<p>Our company was founded with a vision to...</p>",
            layout: "default",
            order: 2,
            isActive: true,
            isVisible: true
        },
        {
            sectionKey: "mission",
            sectionTitle: "Mission Statement",
            contentHtml: "<p>Our mission is to provide exceptional...</p>",
            layout: "default",
            order: 3,
            isActive: true,
            isVisible: true
        }
    ],
    books: [
        {
            sectionKey: "pageTitle",
            sectionTitle: "Page Title",
            contentHtml: "Our Books",
            layout: "default",
            order: 1,
            isActive: true,
            isVisible: true
        },
        {
            sectionKey: "booksIntro",
            sectionTitle: "Books Introduction",
            contentHtml: "<p>Explore our collection of books...</p>",
            layout: "default",
            order: 2,
            isActive: true,
            isVisible: true
        },
        {
            sectionKey: "featuredBooks",
            sectionTitle: "Featured Books",
            contentHtml: "<p>Check out our most popular titles...</p>",
            layout: "gallery",
            order: 3,
            isActive: true,
            isVisible: true
        }
    ],
    ebooks: [
        {
            sectionKey: "pageTitle",
            sectionTitle: "Page Title",
            contentHtml: "Digital Books",
            layout: "default",
            order: 1,
            isActive: true,
            isVisible: true
        },
        {
            sectionKey: "ebooksIntro",
            sectionTitle: "E-books Introduction",
            contentHtml: "<p>Download our digital collection...</p>",
            layout: "default",
            order: 2,
            isActive: true,
            isVisible: true
        }
    ],
    projects: [
        {
            sectionKey: "pageTitle",
            sectionTitle: "Page Title",
            contentHtml: "Our Projects",
            layout: "default",
            order: 1,
            isActive: true,
            isVisible: true
        },
        {
            sectionKey: "projectsIntro",
            sectionTitle: "Projects Introduction",
            contentHtml: "<p>Discover our latest projects and initiatives...</p>",
            layout: "default",
            order: 2,
            isActive: true,
            isVisible: true
        }
    ],
    contact: [
        {
            sectionKey: "pageTitle",
            sectionTitle: "Page Title",
            contentHtml: "Contact Us",
            layout: "default",
            order: 1,
            isActive: true,
            isVisible: true
        },
        {
            sectionKey: "contactInfo",
            sectionTitle: "Contact Information",
            contentHtml: "<p>Get in touch with us...</p>",
            layout: "contact",
            order: 2,
            isActive: true,
            isVisible: true
        }
    ]
};

async function createDefaultSections() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/tls-projects");
        console.log("Connected to MongoDB");

        // Clear existing sections
        await WebsiteContentSection.deleteMany({});
        console.log("Cleared existing sections");

        let totalCreated = 0;

        // Create sections for each page
        for (const [pageName, sections] of Object.entries(defaultPageSections)) {
            console.log(`\nCreating sections for ${pageName} page...`);
            
            for (const sectionData of sections) {
                const section = new WebsiteContentSection({
                    pageName,
                    sectionId: `${pageName}_${sectionData.sectionKey}`,
                    ...sectionData,
                    metadata: {
                        createdBy: "system",
                        lastModified: new Date()
                    },
                    seo: {
                        metaTitle: sectionData.sectionTitle,
                        metaDescription: sectionData.contentHtml.replace(/<[^>]*>/g, "").substring(0, 160)
                    },
                    styling: {
                        cssClasses: [],
                        customStyles: {}
                    }
                });

                await section.save();
                console.log(`  ✓ Created: ${sectionData.sectionKey}`);
                totalCreated++;
            }
        }

        console.log(`\n🎉 Successfully created ${totalCreated} default sections!`);
        
        // Verify the creation
        const verifyCount = await WebsiteContentSection.countDocuments();
        console.log(`\nVerification: ${verifyCount} sections now exist in database`);
        
        // Show sample data
        const sampleSections = await WebsiteContentSection.find().limit(3);
        console.log("\nSample sections:");
        sampleSections.forEach(section => {
            console.log(`  - ${section.pageName}/${section.sectionKey}: "${section.sectionTitle}"`);
        });

    } catch (error) {
        console.error("Error creating default sections:", error);
    } finally {
        await mongoose.connection.close();
        console.log("\nDatabase connection closed");
    }
}

createDefaultSections();