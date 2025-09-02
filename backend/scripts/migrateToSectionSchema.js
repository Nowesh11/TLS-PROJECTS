const mongoose = require("mongoose");
const WebsiteContent = require("../models/WebsiteContent");
const WebsiteContentSection = require("../models/WebsiteContentSection");
require("dotenv").config({ path: "../config/.env" });

// Connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/tamilsociety", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
};

// Migration function
const migrateToSectionSchema = async () => {
    try {
        console.log("Starting migration from WebsiteContent to WebsiteContentSection...");
        
        // Get all existing website content
        const existingContent = await WebsiteContent.find({});
        console.log(`Found ${existingContent.length} existing content items`);
        
        if (existingContent.length === 0) {
            console.log("No existing content found. Creating sample data...");
            await createSampleSections();
            return;
        }
        
        const migratedSections = [];
        
        for (const content of existingContent) {
            try {
                // Create section ID from existing data
                const sectionId = content.sectionKey || 
                                content.section || 
                                `section_${content.order || 1}`;
                
                // Map invalid layouts to valid ones
                const layoutMapping = {
                    "full-width": "default",
                    "wide": "default",
                    "narrow": "default",
                    "sidebar": "default"
                };
                
                const validLayouts = ["default", "hero", "features", "gallery", "testimonials", "contact", "footer"];
                let layout = content.layout || "default";
                if (layoutMapping[layout]) {
                    layout = layoutMapping[layout];
                } else if (!validLayouts.includes(layout)) {
                    layout = "default";
                }
                
                // Prepare section data
                const sectionData = {
                    pageName: content.page,
                    sectionId: sectionId,
                    sectionTitle: content.title || content.section || "Untitled Section",
                    contentHtml: content.content || "<p>Content placeholder</p>",
                    contentTamil: content.contentTamil || "",
                    order: content.order || 0,
                    isActive: content.isActive !== undefined ? content.isActive : true,
                    isVisible: content.isVisible !== undefined ? content.isVisible : true,
                    layout: layout,
                    metadata: content.metadata || {},
                    seo: {
                        title: content.seoTitle || "",
                        description: content.seoDescription || "",
                        keywords: content.seoKeywords || []
                    },
                    styling: {
                        backgroundColor: content.backgroundColor || "",
                        textColor: content.textColor || "",
                        customCSS: content.customCSS || ""
                    },
                    createdBy: content.createdBy,
                    updatedBy: content.updatedBy
                };
                
                // Check if section already exists
                const existingSection = await WebsiteContentSection.findOne({
                    pageName: sectionData.pageName,
                    sectionId: sectionData.sectionId
                });
                
                if (existingSection) {
                    console.log(`Section ${sectionData.pageName}/${sectionData.sectionId} already exists, skipping...`);
                    continue;
                }
                
                // Create new section
                const newSection = new WebsiteContentSection(sectionData);
                await newSection.save();
                
                migratedSections.push({
                    oldId: content._id,
                    newId: newSection._id,
                    page: sectionData.pageName,
                    sectionId: sectionData.sectionId
                });
                
                console.log(`Migrated: ${sectionData.pageName}/${sectionData.sectionId}`);
                
            } catch (error) {
                console.error(`Error migrating content ${content._id}:`, error.message);
            }
        }
        
        console.log("\nMigration completed successfully!");
        console.log(`Migrated ${migratedSections.length} sections`);
        
        // Display summary
        const pageGroups = migratedSections.reduce((acc, section) => {
            if (!acc[section.page]) acc[section.page] = [];
            acc[section.page].push(section.sectionId);
            return acc;
        }, {});
        
        console.log("\nMigrated sections by page:");
        Object.entries(pageGroups).forEach(([page, sections]) => {
            console.log(`  ${page}: ${sections.join(", ")}`);
        });
        
        // Verify migration
        await verifyMigration();
        
    } catch (error) {
        console.error("Migration failed:", error);
        throw error;
    }
};

// Create sample sections if no existing data
const createSampleSections = async () => {
    const sampleSections = [
        {
            pageName: "home",
            sectionId: "hero_section",
            sectionTitle: "Hero Banner",
            contentHtml: "<h1>Welcome to Tamil Language Society</h1><p>Preserving and promoting Tamil literature and culture.</p>",
            order: 1,
            layout: "hero"
        },
        {
            pageName: "home",
            sectionId: "features_section",
            sectionTitle: "Features",
            contentHtml: "<h2>Our Services</h2><ul><li>Books Publishing</li><li>E-books</li><li>Cultural Projects</li></ul>",
            order: 2,
            layout: "features"
        },
        {
            pageName: "home",
            sectionId: "footer_section",
            sectionTitle: "Footer",
            contentHtml: "<p>© 2025 Tamil Language Society. All rights reserved.</p>",
            order: 3,
            layout: "footer"
        },
        {
            pageName: "about",
            sectionId: "about_intro",
            sectionTitle: "About Us",
            contentHtml: "<h1>About Tamil Language Society</h1><p>We are dedicated to preserving Tamil literature and culture.</p>",
            order: 1,
            layout: "default"
        },
        {
            pageName: "contact",
            sectionId: "contact_info",
            sectionTitle: "Contact Information",
            contentHtml: "<h1>Contact Us</h1><p>Get in touch with us for any inquiries.</p>",
            order: 1,
            layout: "contact"
        }
    ];
    
    for (const sectionData of sampleSections) {
        try {
            const section = new WebsiteContentSection(sectionData);
            await section.save();
            console.log(`Created sample section: ${sectionData.pageName}/${sectionData.sectionId}`);
        } catch (error) {
            console.error(`Error creating sample section ${sectionData.pageName}/${sectionData.sectionId}:`, error.message);
        }
    }
};

// Verify migration results
const verifyMigration = async () => {
    try {
        console.log("\nVerifying migration...");
        
        const totalSections = await WebsiteContentSection.countDocuments();
        console.log(`Total sections in new schema: ${totalSections}`);
        
        const pages = await WebsiteContentSection.distinct("pageName");
        console.log(`Pages with sections: ${pages.join(", ")}`);
        
        for (const page of pages) {
            const sections = await WebsiteContentSection.find({ pageName: page }).sort({ order: 1 });
            console.log(`\n${page} page sections:`);
            sections.forEach(section => {
                console.log(`  - ${section.sectionId}: "${section.sectionTitle}" (order: ${section.order})`);
            });
        }
        
        console.log("\nMigration verification completed!");
        
    } catch (error) {
        console.error("Verification failed:", error);
    }
};

// Main execution
const main = async () => {
    try {
        await connectDB();
        await migrateToSectionSchema();
        
        console.log("\n=== Migration Summary ===");
        console.log("✅ Migration completed successfully!");
        console.log("✅ New WebsiteContentSection schema is ready to use");
        console.log("✅ You can now test the new section-based API endpoints");
        console.log("\nNext steps:");
        console.log("1. Test the API: GET /api/website-content/sections?page=home");
        console.log("2. Update frontend to use new section-based endpoints");
        console.log("3. Consider backing up old WebsiteContent collection before removing it");
        
    } catch (error) {
        console.error("Migration script failed:", error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log("\nDatabase connection closed.");
    }
};

// Run the migration
if (require.main === module) {
    main();
}

module.exports = { migrateToSectionSchema, createSampleSections, verifyMigration };