const mongoose = require("mongoose");
const Ebook = require("./models/Ebook");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "config/.env") });

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/tamilsociety";
console.log("Connecting to MongoDB:", mongoUri);

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log("Connected to database");
    
    try {
        // Check for ebooks with uploaded files
        const ebooksWithUploads = await Ebook.find({ 
            fileUrl: { $regex: /uploads/ } 
        }).select("title fileUrl coverImage");
        
        console.log("Ebooks with uploaded files:", ebooksWithUploads.length);
        console.log(JSON.stringify(ebooksWithUploads, null, 2));
        
        // Check total ebooks
        const totalEbooks = await Ebook.countDocuments();
        console.log("Total ebooks in database:", totalEbooks);
        
        // Show all fileUrl values
        const allEbooks = await Ebook.find({}).select("title fileUrl coverImage");
        console.log("\nAll ebook file URLs:");
        allEbooks.forEach(ebook => {
            console.log(`${ebook.title}: fileUrl=${ebook.fileUrl}, coverImage=${ebook.coverImage}`);
        });
        
        // Update fileUrl paths to point to ebooks directory instead of general
        console.log("\nUpdating fileUrl paths...");
        const updateResult = await Ebook.updateMany(
            { fileUrl: { $regex: /\/uploads\/general\// } },
            [{
                $set: {
                    fileUrl: {
                        $replaceOne: {
                            input: "$fileUrl",
                            find: "/uploads/general/",
                            replacement: "/uploads/ebooks/"
                        }
                    }
                }
            }]
        );
        
        console.log("Update result:", updateResult);
        
        // Show updated fileUrl values
        const updatedEbooks = await Ebook.find({}).select("title fileUrl");
        console.log("\nUpdated ebook file URLs:");
        updatedEbooks.forEach(ebook => {
            console.log(`${ebook.title}: ${ebook.fileUrl}`);
        });
        
    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit();
    }
}).catch(err => {
    console.error("Database connection error:", err);
    process.exit(1);
});