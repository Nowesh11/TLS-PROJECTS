const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

// Import all seeding functions
const seedGlobalContent = require("./seedGlobalContent");
const seedHomepageContent = require("./seedHomepageContent");
const seedAboutContent = require("./seedAboutContent");
const seedBooksContent = require("./seedBooksContent");
const seedEbooksContent = require("./seedEbooksContent");
const seedContactContent = require("./seedContactContent");
const seedProjectsContent = require("./seedProjectsContent");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected:", mongoose.connection.host);
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};

const seedAllContent = async () => {
    try {
        console.log("\n🚀 STARTING COMPLETE WEBSITE CONTENT SEEDING");
        console.log("============================================\n");

        await connectDB();

        // Track seeding progress
        const seedingTasks = [
            { name: "Global Content (Navigation, Footer, Metadata)", fn: seedGlobalContent },
            { name: "Homepage Content", fn: seedHomepageContent },
            { name: "About Page Content", fn: seedAboutContent },
            { name: "Books Page Content", fn: seedBooksContent },
            { name: "Ebooks Page Content", fn: seedEbooksContent },
            { name: "Contact Page Content", fn: seedContactContent },
            { name: "Projects Page Content", fn: seedProjectsContent }
        ];

        let completedTasks = 0;
        const totalTasks = seedingTasks.length;

        for (const task of seedingTasks) {
            try {
                console.log(`\n📝 Seeding: ${task.name}`);
                console.log("-".repeat(50));
                
                // Run the seeding function
                await new Promise((resolve, reject) => {
                    const originalExit = process.exit;
                    process.exit = (code) => {
                        process.exit = originalExit;
                        if (code === 0) {
                            resolve();
                        } else {
                            reject(new Error(`Seeding failed with exit code ${code}`));
                        }
                    };
                    
                    task.fn().catch(reject);
                });
                
                completedTasks++;
                console.log(`✅ Completed: ${task.name} (${completedTasks}/${totalTasks})`);
                
            } catch (error) {
                console.error(`❌ Failed to seed ${task.name}:`, error.message);
                // Continue with other tasks even if one fails
            }
        }

        console.log("\n" + "=".repeat(60));
        console.log(`🎉 CONTENT SEEDING SUMMARY`);
        console.log("=".repeat(60));
        console.log(`✅ Successfully completed: ${completedTasks}/${totalTasks} tasks`);
        
        if (completedTasks === totalTasks) {
            console.log(`\n🌟 ALL WEBSITE CONTENT HAS BEEN SUCCESSFULLY SEEDED!`);
            console.log(`\nYour website now has complete bilingual content for:`);
            console.log(`   • Global elements (navigation, footer, metadata)`);
            console.log(`   • Homepage sections`);
            console.log(`   • About page`);
            console.log(`   • Books catalog page`);
            console.log(`   • Ebooks library page`);
            console.log(`   • Contact information page`);
            console.log(`   • Projects showcase page`);
        } else {
            console.log(`\n⚠️  Some tasks failed. Please check the logs above.`);
        }
        
        console.log("\n" + "=".repeat(60));
        
        // Close database connection
        await mongoose.connection.close();
        console.log("\n📦 Database connection closed.");
        
        process.exit(completedTasks === totalTasks ? 0 : 1);
        
    } catch (error) {
        console.error("\n❌ Critical error during content seeding:", error);
        process.exit(1);
    }
};

// Run the master seeder
if (require.main === module) {
    seedAllContent();
}

module.exports = seedAllContent;