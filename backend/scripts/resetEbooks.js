const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../config/.env") });

// Import models
const Ebook = require("../models/Ebook");
const User = require("../models/User");

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/tamilsociety";
console.log("Connecting to MongoDB:", mongoUri);

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const sampleEbooks = [
    {
        title: "Digital Tamil Dictionary",
        titleTamil: "டிஜிட்டல் தமிழ் அகராதி",
        author: "Tamil Language Institute",
        authorTamil: "தமிழ் மொழி நிறுவனம்",
        description: "Comprehensive digital dictionary with over 50,000 Tamil words and their meanings.",
        descriptionTamil: "50,000க்கும் மேற்பட்ட தமிழ் சொற்கள் மற்றும் அவற்றின் பொருள்களுடன் கூடிய விரிவான டிஜிட்டல் அகராதி.",
        category: "language",
        price: 199,
        originalPrice: 249,
        fileUrl: "/ebooks/digital-tamil-dictionary.pdf",
        fileFormat: "PDF",
        fileSize: 15728640, // 15 MB
        bookLanguage: "Tamil",
        featured: true,
        bestseller: true,
        rating: 4.8,
        reviewCount: 156,
        tags: ["dictionary", "language", "reference"],
        status: "active"
    },
    {
        title: "Tamil Typing Tutorial",
        titleTamil: "தமிழ் தட்டச்சு பயிற்சி",
        author: "Computer Tamil Academy",
        authorTamil: "கணினி தமிழ் அகாடமி",
        description: "Learn Tamil typing with step-by-step tutorials and practice exercises.",
        descriptionTamil: "படிப்படியான பயிற்சிகள் மற்றும் பயிற்சி வேலைகளுடன் தமிழ் தட்டச்சு கற்றுக்கொள்ளுங்கள்.",
        category: "education",
        price: 149,
        originalPrice: 199,
        fileUrl: "/ebooks/tamil-typing-tutorial.pdf",
        fileFormat: "PDF",
        fileSize: 8388608, // 8 MB
        bookLanguage: "Tamil",
        featured: true,
        newRelease: true,
        rating: 4.6,
        reviewCount: 89,
        tags: ["typing", "tutorial", "computer"],
        status: "active"
    },
    {
        title: "Tamil Folk Stories Collection",
        titleTamil: "தமிழ் நாட்டுப்புற கதைகள் தொகுப்பு",
        author: "Dr. Kamala Subramaniam",
        authorTamil: "டாக்டர் கமலா சுப்ரமணியம்",
        description: "A beautiful collection of traditional Tamil folk stories passed down through generations.",
        descriptionTamil: "தலைமுறைகளாக கடத்தப்பட்ட பாரம்பரிய தமிழ் நாட்டுப்புற கதைகளின் அழகான தொகுப்பு.",
        category: "literature",
        price: 99,
        originalPrice: 149,
        fileUrl: "/ebooks/tamil-folk-stories.pdf",
        fileFormat: "PDF",
        fileSize: 12582912, // 12 MB
        bookLanguage: "Tamil",
        featured: false,
        bestseller: true,
        rating: 4.9,
        reviewCount: 234,
        tags: ["folk stories", "tradition", "culture"],
        status: "active"
    },
    {
        title: "Modern Tamil Grammar Guide",
        titleTamil: "நவீன தமிழ் இலக்கண வழிகாட்டி",
        author: "Prof. Meenakshi Sundaram",
        authorTamil: "பேராசிரியர் மீனாக்ஷி சுந்தரம்",
        description: "A comprehensive guide to Tamil grammar made simple for learners of all levels.",
        descriptionTamil: "அனைத்து நிலைகளிலும் உள்ள கற்பவர்களுக்கு எளிமையாக்கப்பட்ட தமிழ் இலக்கணத்திற்கான விரிவான வழிகாட்டி.",
        category: "education",
        price: 179,
        originalPrice: 229,
        fileUrl: "/ebooks/modern-tamil-grammar.pdf",
        fileFormat: "PDF",
        fileSize: 10485760, // 10 MB
        bookLanguage: "Tamil",
        featured: true,
        newRelease: false,
        rating: 4.7,
        reviewCount: 123,
        tags: ["grammar", "education", "language"],
        status: "active"
    }
];

async function resetEbooks() {
    try {
        // Get admin user to set as creator
        const adminUser = await User.findOne({ email: "admin@tamilsociety.com" });
        
        if (!adminUser) {
            console.log("Admin user not found. Please create admin user first.");
            return;
        }

        console.log("Clearing existing ebooks...");
        await Ebook.deleteMany({});
        console.log("Existing ebooks cleared.");

        console.log("Adding Tamil ebooks with proper fields...");

        // Add createdBy field to each ebook
        const ebooksWithCreator = sampleEbooks.map(ebook => ({
            ...ebook,
            createdBy: adminUser._id
        }));

        // Insert ebooks
        const insertedEbooks = await Ebook.insertMany(ebooksWithCreator);
        
        console.log(`Successfully added ${insertedEbooks.length} Tamil ebooks:`);
        insertedEbooks.forEach(ebook => {
            console.log(`- ${ebook.title} (${ebook.titleTamil}) by ${ebook.author} (${ebook.authorTamil})`);
        });

    } catch (error) {
        console.error("Error resetting ebooks:", error);
    } finally {
        mongoose.connection.close();
    }
}

resetEbooks();