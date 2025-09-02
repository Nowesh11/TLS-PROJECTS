const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const WebsiteContentSection = require("../models/WebsiteContentSection");
const { normalizePageName, loadHtmlFromFile } = require("../utils/utils");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Use shared utility functions
const normalizePage = normalizePageName;

function extractSections($) {
    // First try to find <section> elements
    let blocks = $("section");
    
    // If no sections found, use fallback div selectors
    if (!blocks.length) {
        blocks = $("div.container, div.row, div[class*=\"section\"], div[class*=\"content\"], div[class*=\"block\"], header, footer, div[data-content], .hero, .about, .features, .statistics, .announcements, .contact");
    }
    
    return blocks;
}

async function scrapeAndUpsertSections(page) {
    try {
        const normalizedPage = normalizePage(page);
        console.log(`[SEEDER-SCRAPER] Processing page: '${page}' → normalized: '${normalizedPage}'`);
        
        const html = loadHtmlFromFile(normalizedPage, __dirname);
        if (!html) return 0;
        
        const $ = cheerio.load(html);
        const blocks = extractSections($);
        
        if (!blocks.length) {
            console.log(`[SEEDER-SCRAPER] No content blocks found for ${normalizedPage}`);
            return 0;
        }

        const sections = [];
        blocks.each((i, el) => {
            const contentHtml = $.html(el)?.trim();
            if (contentHtml && contentHtml.length > 50) { // Filter out very small content
                // Try to extract a meaningful title from the content
                const $el = $(el);
                const title = $el.find("h1, h2, h3").first().text().trim() || 
                             $el.attr("data-title") || 
                             $el.attr("class") || 
                             `Section ${i + 1}`;
                
                sections.push({
                    pageName: normalizedPage, // Use normalized page name
                    sectionId: `section-${i + 1}`,
                    sectionTitle: title,
                    contentHtml,
                    order: i,
                    isActive: true,
                    isVisible: true
                });
            }
        });

        if (!sections.length) {
            console.log(`[SEEDER-SCRAPER] No valid sections extracted for ${normalizedPage}`);
            return 0;
        }

        const ops = sections.map(sec => ({
            updateOne: {
                filter: { pageName: sec.pageName, sectionId: sec.sectionId },
                update: { $set: sec },
                upsert: true
            }
        }));

        const res = await WebsiteContentSection.bulkWrite(ops);
        const upsertedCount = res.upsertedCount || res.modifiedCount || sections.length;
        console.log(`[SEEDER-SCRAPER] ${normalizedPage} → Saved ${upsertedCount} sections to database`);
        return upsertedCount;
    } catch (error) {
        console.error(`[SEEDER-SCRAPER] Error scraping ${page}:`, error.message);
        return 0;
    }
}

async function seedAllPages(isStartup = false, forceReseed = false) {
    try {
        // If called during startup, we need to connect to MongoDB
        if (isStartup) {
            await mongoose.connect(process.env.MONGO_URI);
            console.log("[SEEDER] MongoDB connected for seeding");
        }

        const pages = ["home", "about", "books", "ebooks", "contact"];
        let totalSections = 0;
        let pagesSeeded = 0;

        // Check if collection is empty or force reseed is requested
        const count = await WebsiteContentSection.countDocuments();
        
        if (count === 0 || forceReseed) {
            console.log(`[SEEDER] ${count === 0 ? "Collection is empty" : "Force reseed requested"}, seeding all pages...`);
            
            for (const page of pages) {
                const normalizedPage = normalizePage(page);
                console.log(`[SEEDER] Processing page: '${page}' → normalized: '${normalizedPage}'`);
                
                // Always delete existing sections for this page to ensure clean overwrite
                const deleteResult = await WebsiteContentSection.deleteMany({ pageName: normalizedPage });
                if (deleteResult.deletedCount > 0) {
                    console.log(`[SEEDER] Deleted ${deleteResult.deletedCount} existing sections for '${normalizedPage}'`);
                }
                
                // Scrape and upsert sections
                const sectionCount = await scrapeAndUpsertSections(normalizedPage);
                
                if (sectionCount > 0) {
                    console.log(`[SEEDER] Successfully seeded ${sectionCount} sections for '${normalizedPage}'`);
                    totalSections += sectionCount;
                    pagesSeeded++;
                } else {
                    console.log(`[SEEDER] Failed to seed any sections for '${normalizedPage}'`);
                }
            }
            
            console.log(`[SEEDER] Completed seeding ${totalSections} sections across ${pagesSeeded}/${pages.length} pages`);
        } else {
            console.log(`[SEEDER] Collection already has ${count} sections. Use forceReseed=true to overwrite.`);
        }

        // If we connected in this function, disconnect
        if (isStartup) {
            await mongoose.disconnect();
            console.log("[SEEDER] MongoDB disconnected after seeding");
        }

        return totalSections;
    } catch (error) {
        console.error("[SEEDER] Error seeding HTML content:", error);
        // If we connected in this function, disconnect
        if (isStartup) {
            await mongoose.disconnect();
            console.log("[SEEDER] MongoDB disconnected after error");
        }
        return 0;
    }
}

// Run the seeder
if (require.main === module) {
    seedAllPages();
}

module.exports = { seedAllPages, scrapeAndUpsertSections };