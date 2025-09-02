const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "config", ".env") });

// Override the mongoose helper to return real mongoose
const originalHelper = require("./utils/mongooseHelper");
require.cache[require.resolve("./utils/mongooseHelper")] = {
  exports: () => mongoose
};

// Import models after overriding the helper
const User = require("./models/User");
const Book = require("./models/Book");
const Ebook = require("./models/Ebook");
const Project = require("./models/Project");
const WebsiteContent = require("./models/WebsiteContent");

async function seedRealDatabase() {
  try {
    // Connect to MongoDB
    mongoose.set("strictQuery", false);
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tamil-language-society", {
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log("Connected to real MongoDB for seeding");
    
    // Create admin user
    let adminUser = await User.findOne({ email: "admin@tamilsociety.org" });
    if (!adminUser) {
      adminUser = await User.create({
        name: "Admin User",
        email: "admin@tamilsociety.org",
        password: "Admin123!",
        role: "admin",
        primaryInterest: "Community",
        preferences: {
          receiveNewsletter: true,
          receiveNotifications: true,
          theme: "system",
          language: "english"
        }
      });
      console.log("Admin user created successfully!");
    } else {
      console.log("Admin user already exists");
    }

    // Clear existing data
    await Book.deleteMany({});
    await Ebook.deleteMany({});
    await Project.deleteMany({});
    await ContactMessage.deleteMany({});
    await WebsiteContent.deleteMany({});
    
    console.log("Cleared existing data");

    // Sample Books
    const books = [
      {
        title: "Tamil Poetry Collection",
        author: "Bharathiyar",
        description: "A comprehensive collection of Tamil poetry from the great poet Bharathiyar.",
        category: "literature",
        price: 299,
        createdBy: adminUser._id
      },
      {
        title: "Modern Tamil Literature",
        author: "Various Authors",
        description: "Contemporary Tamil poetry that reflects modern themes and social consciousness.",
        category: "poetry",
        price: 320,
        createdBy: adminUser._id
      },
      {
        title: "Tamil Grammar Simplified",
        author: "Prof. Meenakshi Sundaram",
        description: "A comprehensive guide to Tamil grammar made simple for learners of all levels.",
        category: "academic",
        price: 280,
        createdBy: adminUser._id
      }
    ];

    // Sample Ebooks
    const ebooks = [
      {
        title: "Digital Tamil Dictionary",
        author: "Tamil Language Institute",
        description: "Comprehensive digital dictionary with over 50,000 Tamil words and their meanings.",
        category: "other",
        price: 199,
        fileUrl: "/ebooks/digital-tamil-dictionary.pdf",
        fileFormat: "PDF",
        createdBy: adminUser._id
      },
      {
        title: "Tamil Typing Tutorial",
        author: "Computer Tamil Academy",
        description: "Learn Tamil typing with step-by-step tutorials and practice exercises.",
        category: "academic",
        price: 149,
        fileUrl: "/ebooks/tamil-typing-tutorial.pdf",
        fileFormat: "PDF",
        createdBy: adminUser._id
      }
    ];

    // Sample Projects
    const projects = [
      {
        title: "Tamil Digital Library Initiative",
        description: "Creating a comprehensive digital library of Tamil literature and educational resources.",
        category: "education-intellectual",
        status: "active",
        startDate: new Date("2023-01-01"),
        projectManager: adminUser._id,
        createdBy: adminUser._id
      },
      {
        title: "Tamil Language Learning App",
        description: "Mobile application for learning Tamil language with interactive lessons and games.",
        category: "language-literature",
        status: "planning",
        startDate: new Date("2024-01-01"),
        projectManager: adminUser._id,
        createdBy: adminUser._id
      }
    ];

    // Sample Messages
    const messages = [
      {
        name: "Rajesh Kumar",
        email: "rajesh.kumar@email.com",
        subject: "Book Donation Inquiry",
        message: "I would like to donate a collection of rare Tamil books to your society.",
        category: "donation",
        status: "new"
      },
      {
        name: "Priya Sharma",
        email: "priya.sharma@email.com",
        subject: "Volunteer Opportunity",
        message: "I am interested in volunteering for Tamil language teaching programs.",
        category: "volunteer",
        status: "in-progress"
      }
    ];

    // Sample Content
    const content = [
      {
        page: "home",
        section: "hero",
        sectionKey: "hero-welcome",
        title: "Welcome to Tamil Language Society",
        content: "Promoting Tamil language and culture through education, literature, and community engagement.",
        position: 1,
        isActive: true,
        isVisible: true,
        createdBy: adminUser._id
      },
      {
        page: "about",
        section: "mission",
        sectionKey: "about-mission",
        title: "Our Mission",
        content: "To preserve, promote, and propagate the Tamil language and its rich cultural heritage.",
        position: 1,
        isActive: true,
        isVisible: true,
        createdBy: adminUser._id
      }
    ];

    // Insert sample data
    await Book.insertMany(books);
    console.log("Books seeded successfully");

    await Ebook.insertMany(ebooks);
    console.log("Ebooks seeded successfully");

    await Project.insertMany(projects);
    console.log("Projects seeded successfully");

    await ContactMessage.insertMany(messages);
    console.log("Contact messages seeded successfully");

    await WebsiteContent.insertMany(content);
    console.log("Website content seeded successfully");

    console.log("\nDatabase seeding completed successfully!");
    console.log("Admin user: admin@tamilsociety.org");
    console.log("Admin password: Admin123!");
    
    process.exit(0);
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
}

seedRealDatabase();