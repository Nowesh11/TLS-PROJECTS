const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../config/.env") });

// Import models
const Book = require("../models/Book");
const User = require("../models/User");

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/tamilsociety";
console.log("Connecting to MongoDB:", mongoUri);

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const sampleBooks = [
    {
        title: "Tamil Literature Classics",
        titleTamil: "தமிழ் இலக்கிய சிறப்புகள்",
        author: "Dr. Rajesh Kumar",
        authorTamil: "டாக்டர் ராஜேஷ் குமார்",
        description: "A comprehensive collection of Tamil literary classics spanning centuries of rich cultural heritage.",
        descriptionTamil: "பல நூற்றாண்டுகளின் வளமான கலாச்சார பாரம்பரியத்தை உள்ளடக்கிய தமிழ் இலக்கிய சிறப்புகளின் விரிவான தொகுப்பு.",
        category: "literature",
        price: 299,
        originalPrice: 399,
        isbn: "978-81-123-4567-8",
        publisher: "Tamil Language Society",
        publishedDate: new Date("2023-01-15"),
        pages: 450,
        bookLanguage: "Tamil",
        coverImage: "/assets/default-book-cover.svg",
        inStock: true,
        stockQuantity: 50,
        featured: true,
        bestseller: true,
        newRelease: false,
        rating: 4.8,
        reviewCount: 25,
        tags: ["classics", "literature", "tamil", "heritage"],
        status: "active"
    },
    {
        title: "Modern Tamil Poetry",
        titleTamil: "நவீன தமிழ் கவிதைகள்",
        author: "Priya Selvam",
        authorTamil: "பிரியா செல்வம்",
        description: "Contemporary Tamil poetry that reflects modern themes and emotions.",
        descriptionTamil: "நவீன கருப்பொருள்கள் மற்றும் உணர்வுகளை பிரதிபலிக்கும் சமகால தமிழ் கவிதைகள்.",
        category: "poetry",
        price: 199,
        originalPrice: 249,
        isbn: "978-81-123-4567-9",
        publisher: "Modern Tamil Press",
        publishedDate: new Date("2023-06-20"),
        pages: 280,
        bookLanguage: "Tamil",
        coverImage: "/assets/default-book-cover.svg",
        inStock: true,
        stockQuantity: 30,
        featured: true,
        bestseller: false,
        newRelease: true,
        rating: 4.5,
        reviewCount: 18,
        tags: ["poetry", "modern", "contemporary", "emotions"],
        status: "active"
    },
    {
        title: "Tamil Cultural Heritage",
        titleTamil: "தமிழ் கலாச்சார பாரம்பரியம்",
        author: "Prof. Meera Krishnan",
        authorTamil: "பேராசிரியர் மீரா கிருஷ்ணன்",
        description: "An in-depth exploration of Tamil cultural traditions, festivals, and customs.",
        descriptionTamil: "தமிழ் கலாச்சார மரபுகள், திருவிழாக்கள் மற்றும் பழக்கவழக்கங்களின் ஆழமான ஆய்வு.",
        category: "culture",
        price: 349,
        originalPrice: 449,
        isbn: "978-81-123-4568-0",
        publisher: "Cultural Studies Press",
        publishedDate: new Date("2023-03-10"),
        pages: 520,
        bookLanguage: "Tamil",
        coverImage: "/assets/default-book-cover.svg",
        inStock: true,
        stockQuantity: 25,
        featured: false,
        bestseller: true,
        newRelease: false,
        rating: 4.7,
        reviewCount: 32,
        tags: ["culture", "heritage", "traditions", "festivals"],
        status: "active"
    },
    {
        title: "Children's Tamil Stories",
        titleTamil: "குழந்தைகளுக்கான தமிழ் கதைகள்",
        author: "Lakshmi Narayan",
        authorTamil: "லக்ஷ்மி நாராயணன்",
        description: "Delightful Tamil stories for children that teach values and morals.",
        descriptionTamil: "மதிப்புகள் மற்றும் நெறிமுறைகளை கற்பிக்கும் குழந்தைகளுக்கான மகிழ்ச்சிகரமான தமிழ் கதைகள்.",
        category: "children",
        price: 149,
        originalPrice: 199,
        isbn: "978-81-123-4568-2",
        publisher: "Children's Tamil Books",
        publishedDate: new Date("2023-09-15"),
        pages: 120,
        bookLanguage: "Tamil",
        coverImage: "/assets/default-book-cover.svg",
        inStock: true,
        stockQuantity: 100,
        featured: true,
        bestseller: true,
        newRelease: true,
        rating: 4.9,
        reviewCount: 45,
        tags: ["children", "stories", "values", "morals"],
        status: "active"
    }
];

async function resetBooks() {
    try {
        // Get admin user to set as creator
        const adminUser = await User.findOne({ email: "admin@tamilsociety.org" });
        
        if (!adminUser) {
            console.log("Admin user not found. Please create admin user first.");
            return;
        }

        console.log("Clearing existing books...");
        await Book.deleteMany({});
        console.log("Existing books cleared.");

        console.log("Adding Tamil books with proper fields...");

        // Add createdBy field to each book
        const booksWithCreator = sampleBooks.map(book => ({
            ...book,
            createdBy: adminUser._id
        }));

        // Insert books
        const insertedBooks = await Book.insertMany(booksWithCreator);
        
        console.log(`Successfully added ${insertedBooks.length} Tamil books:`);
        insertedBooks.forEach(book => {
            console.log(`- ${book.title} (${book.titleTamil}) by ${book.author} (${book.authorTamil})`);
        });

    } catch (error) {
        console.error("Error resetting books:", error);
    } finally {
        mongoose.connection.close();
    }
}

resetBooks();