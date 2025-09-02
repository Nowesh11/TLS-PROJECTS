const mongoose = require("mongoose");
const WebsiteContent = require("../models/WebsiteContent");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/tamil_society", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function checkPageCasing() {
    try {
        console.log("\n=== CHECKING PAGE CASING ===\n");
        
        // Get all unique page values
        const allPages = await WebsiteContent.distinct("page");
        console.log("All unique page values in database:");
        allPages.sort().forEach(page => {
            console.log(`- "${page}"`);
        });
        
        // Count by page
        console.log("\nCount by page:");
        const pageCounts = await WebsiteContent.aggregate([
            { $group: { _id: "$page", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        
        pageCounts.forEach(item => {
            console.log(`- "${item._id}": ${item.count}`);
        });
        
        // Check for case variations of target pages
        const targetPages = ["projects", "books", "ebooks", "PROJECTS", "BOOKS", "EBOOKS", "Projects", "Books", "Ebooks"];
        
        console.log("\nChecking for case variations:");
        for (const page of targetPages) {
            const count = await WebsiteContent.countDocuments({ page: page });
            if (count > 0) {
                console.log(`- "${page}": ${count} items`);
            }
        }
        
    } catch (error) {
        console.error("Error:", error);
    } finally {
        mongoose.connection.close();
    }
}

checkPageCasing();