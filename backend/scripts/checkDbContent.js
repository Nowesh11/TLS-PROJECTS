const mongoose = require("mongoose");
const WebsiteContentSection = require("../models/WebsiteContentSection");

async function checkDbContent() {
    try {
        // Connect to MongoDB
        await mongoose.connect("mongodb://localhost:27017/tamilsociety", {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log("Connected to MongoDB");
        
        // Get all sections from the database
        const sections = await WebsiteContentSection.find({}, "pageName sectionTitle order isVisible isActive");
        
        console.log("\n=== DATABASE CONTENT CHECK ===");
        console.log(`Total sections found: ${sections.length}`);
        
        // Group sections by page
        const pageGroups = {};
        sections.forEach(section => {
            const pageName = section.pageName || "undefined";
            if (!pageGroups[pageName]) {
                pageGroups[pageName] = [];
            }
            pageGroups[pageName].push({
                title: section.sectionTitle,
                order: section.order,
                isVisible: section.isVisible,
                isActive: section.isActive
            });
        });
        
        // Expected pages from admin panel
        const expectedPages = ["home", "about", "books", "ebooks", "contact", "projects", "global"];
        
        console.log("\n=== SECTIONS BY PAGE ===");
        for (const page of expectedPages) {
            if (pageGroups[page]) {
                console.log(`\n${page.toUpperCase()} (${pageGroups[page].length} sections):`);
                pageGroups[page].forEach((section, index) => {
                    console.log(`  ${index + 1}. ${section.title} (order: ${section.order}, visible: ${section.isVisible}, active: ${section.isActive})`);
                });
            } else {
                console.log(`\n${page.toUpperCase()}: ❌ NO SECTIONS FOUND`);
            }
        }
        
        // Check for unexpected pages
        const unexpectedPages = Object.keys(pageGroups).filter(page => !expectedPages.includes(page));
        if (unexpectedPages.length > 0) {
            console.log("\n=== UNEXPECTED PAGES ===");
            unexpectedPages.forEach(page => {
                console.log(`${page}: ${pageGroups[page].length} sections`);
            });
        }
        
        // Summary
        const missingPages = expectedPages.filter(page => !pageGroups[page]);
        console.log("\n=== SUMMARY ===");
        console.log(`Pages with content: ${expectedPages.filter(page => pageGroups[page]).length}/${expectedPages.length}`);
        if (missingPages.length > 0) {
            console.log(`Missing pages: ${missingPages.join(", ")}`);
        } else {
            console.log("✅ All expected pages have content");
        }
        
    } catch (error) {
        console.error("Error checking database content:", error);
    } finally {
        await mongoose.connection.close();
        console.log("\nDatabase connection closed");
    }
}

checkDbContent();