/**
 * Seed Mock Data
 * This script initializes the mock database with sample data for development purposes
 */

const bcrypt = require("bcryptjs");

// Function to seed mock data
const seedMockData = async (mongoose) => {
  try {
    // Check if we're using the mock database
    if (!mongoose.connection || !mongoose.connection.on) {
      console.log("Not using mock database, skipping seed data");
      return;
    }

    console.log("Seeding mock database with sample data...");

    // Get models
    const User = require("../models/User");
    
    // Check if admin user exists
    const adminEmail = process.env.ADMIN_EMAIL || "nowesh03@gmail.com";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      // Create admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);

      await User.create({
        name: "Admin User",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        primaryInterest: "Other",
        preferences: {
          receiveNewsletter: true,
          receiveNotifications: true,
          theme: "light",
          language: "english"
        },
        createdAt: new Date(),
        lastLogin: new Date()
      });

      console.log(`Admin user created with email: ${adminEmail} and password: admin123`);
    } else {
      console.log("Admin user already exists");
    }

    // Create some regular users
    const regularUsers = [
      {
        name: "John Doe",
        email: "john@example.com",
        password: await bcrypt.hash("password123", await bcrypt.genSalt(10)),
        role: "user",
        primaryInterest: "Books",
        preferences: {
          receiveNewsletter: true,
          receiveNotifications: true,
          theme: "light",
          language: "english"
        },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        password: await bcrypt.hash("password123", await bcrypt.genSalt(10)),
        role: "user",
        primaryInterest: "Culture",
        preferences: {
          receiveNewsletter: false,
          receiveNotifications: true,
          theme: "dark",
          language: "english"
        },
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      }
    ];

    // Add regular users if they don't exist
    for (const userData of regularUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        await User.create(userData);
        console.log(`Created user: ${userData.name}`);
      }
    }

    // Add mock books, ebooks, and projects
    const Book = require("../models/Book");
    const Ebook = require("../models/Ebook");
    const Project = require("../models/Project");

    // Get admin user for creating content
    const adminUser = await User.findOne({ email: adminEmail });

    // Sample books
    const sampleBooks = [
      {
        title: "Thirukkural with Commentary",
        titleTamil: "திருக்குறள் உரையுடன்",
        author: "Thiruvalluvar",
        description: "Complete Thirukkural with detailed commentary and explanations in Tamil and English.",
        category: "literature",
        price: 45,
        originalPrice: 50,
        rating: 4.9,
        reviewCount: 234,
        featured: true,
        bestseller: true,
        inStock: true,
        stockQuantity: 100,
        bookLanguage: "Tamil",
        createdBy: adminUser._id
      },
      {
        title: "Tamil Grammar Made Easy",
        titleTamil: "எளிய தமிழ் இலக்கணம்",
        author: "Prof. S. Vellaiyan",
        description: "Comprehensive guide to Tamil grammar for students and language enthusiasts.",
        category: "academic",
        price: 35,
        originalPrice: 40,
        rating: 4.7,
        reviewCount: 156,
        featured: true,
        inStock: true,
        stockQuantity: 75,
        bookLanguage: "Tamil",
        createdBy: adminUser._id
      },
      {
        title: "Sangam Literature Collection",
        titleTamil: "சங்க இலக்கிய தொகுப்பு",
        author: "Various Authors",
        description: "Complete collection of Sangam period literature with modern translations.",
        category: "literature",
        price: 60,
        originalPrice: 65,
        rating: 4.8,
        reviewCount: 89,
        featured: true,
        bestseller: true,
        inStock: true,
        stockQuantity: 50,
        bookLanguage: "Tamil",
        createdBy: adminUser._id
      }
    ];

    // Add books if they don't exist
    for (const bookData of sampleBooks) {
      const existingBook = await Book.findOne({ title: bookData.title });
      if (!existingBook) {
        await Book.create(bookData);
        console.log(`Created book: ${bookData.title}`);
      }
    }

    // Sample ebooks
    const sampleEbooks = [
      {
        title: "Digital Tamil Literature",
        titleTamil: "டிஜிட்டல் தமிழ் இலக்கியம்",
        author: "Various Authors",
        description: "Collection of modern Tamil literature in digital format",
        category: "literature",
        price: 25,
        originalPrice: 30,
        rating: 4.8,
        downloadCount: 2500,
        featured: true,
        fileSize: 15728640, // 15 MB in bytes
        fileFormat: "PDF",
        fileUrl: "/uploads/ebooks/digital-tamil-literature.pdf",
        bookLanguage: "Tamil",
        createdBy: adminUser._id
      },
      {
        title: "Children's Tamil Stories",
        titleTamil: "குழந்தைகளுக்கான தமிழ் கதைகள்",
        author: "M. Lakshmi",
        description: "Engaging stories for young Tamil learners",
        category: "children",
        price: 15,
        originalPrice: 20,
        rating: 4.9,
        downloadCount: 4100,
        featured: true,
        fileSize: 8388608, // 8 MB in bytes
        fileFormat: "PDF",
        fileUrl: "/uploads/ebooks/childrens-tamil-stories.pdf",
        bookLanguage: "Tamil",
        createdBy: adminUser._id
      }
    ];

    // Add ebooks if they don't exist
    for (const ebookData of sampleEbooks) {
      const existingEbook = await Ebook.findOne({ title: ebookData.title });
      if (!existingEbook) {
        await Ebook.create(ebookData);
        console.log(`Created ebook: ${ebookData.title}`);
      }
    }

    // Sample projects
    const sampleProjects = [
      {
        title: "Tamil Language Preservation",
        titleTamil: "தமிழ் மொழி பாதுகாப்பு",
        description: "Initiative to preserve and promote Tamil language among youth",
        category: "cultural-preservation",
        status: "active",
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        projectManager: adminUser._id,
        featured: true,
        createdBy: adminUser._id
      },
      {
        title: "Digital Tamil Education",
        titleTamil: "டிஜிட்டல் தமிழ் கல்வி",
        description: "Creating digital resources for Tamil language education",
        category: "education",
        status: "active",
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        projectManager: adminUser._id,
        featured: true,
        createdBy: adminUser._id
      }
    ];

    // Add projects if they don't exist
    for (const projectData of sampleProjects) {
      const existingProject = await Project.findOne({ title: projectData.title });
      if (!existingProject) {
        await Project.create(projectData);
        console.log(`Created project: ${projectData.title}`);
      }
    }
    
    console.log("Mock data seeding completed");
  } catch (error) {
    console.error("Error seeding mock data:", error);
  }
};

module.exports = seedMockData;