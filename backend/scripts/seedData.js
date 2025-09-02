const mongoose = require("mongoose");
const Book = require("../models/Book");
const Ebook = require("../models/Ebook");
const Project = require("../models/Project");
const WebsiteContent = require("../models/WebsiteContent");
const User = require("../models/User");
const Chat = require("../models/Chat");

async function seedDatabase() {
    try {
        console.log("Starting database seeding...");

        // Create a default admin user for seeding if not exists
        let adminUser = await User.findOne({ email: "admin@tamilsociety.org" });
        if (!adminUser) {
            adminUser = await User.create({
                name: "Admin User",
                email: "admin@tamilsociety.org",
                password: "admin123",
                role: "admin",
                isVerified: true
            });
        }

        // Clear existing data
        await Book.deleteMany({});
        await Ebook.deleteMany({});
        await Project.deleteMany({});
        await WebsiteContent.deleteMany({});
        await Chat.deleteMany({});

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
                category: "technology",
                status: "active",
                startDate: new Date("2023-01-01"),
                projectManager: adminUser._id,
                createdBy: adminUser._id
            },
            {
                title: "Tamil Language Learning App",
                description: "Mobile application for learning Tamil language with interactive lessons and games.",
                category: "education",
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
                status: "read"
            }
        ];

        // Sample Content
        const content = [
            {
                page: "home",
                section: "hero",
                titleEn: "Welcome to Tamil Language Society",
                contentEn: "Promoting Tamil language and culture through education, literature, and community engagement.",
                order: 1,
                isActive: true,
                isVisible: true,
                createdBy: adminUser._id
            },
            {
                page: "about",
                section: "mission",
                titleEn: "Our Mission",
                contentEn: "To preserve, promote, and propagate the Tamil language and its rich cultural heritage.",
                order: 1,
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

        // Create some regular users for chat conversations
        const regularUsers = [];
        const userEmails = ["user1@example.com", "user2@example.com", "user3@example.com"];
        
        for (const email of userEmails) {
            let user = await User.findOne({ email });
            if (!user) {
                user = await User.create({
                    name: email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1),
                    email: email,
                    password: "user123",
                    role: "user",
                    isVerified: true
                });
            }
            regularUsers.push(user);
        }

        // Sample Chat conversations
        const chats = [
            {
                participants: [
                    { user: regularUsers[0]._id, role: "user" },
                    { user: adminUser._id, role: "admin" }
                ],
                messages: [
                    {
                        sender: regularUsers[0]._id,
                        senderRole: "user",
                        content: "Hello, I need help with accessing Tamil literature resources.",
                        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
                    },
                    {
                        sender: adminUser._id,
                        senderRole: "admin",
                        content: "Hello! I'd be happy to help you with Tamil literature resources. What specific type of content are you looking for?",
                        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000) // 30 mins later
                    },
                    {
                        sender: regularUsers[0]._id,
                        senderRole: "user",
                        content: "I'm particularly interested in classical Tamil poetry and modern literature. Do you have any recommendations?",
                        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000)
                    },
                    {
                        sender: adminUser._id,
                        senderRole: "admin",
                        content: "Absolutely! I recommend starting with our \"Tamil Poetry Collection\" by Bharathiyar and \"Modern Tamil Literature\" collection. Both are available in our books section.",
                        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000)
                    }
                ],
                subject: "Tamil Literature Resources Help",
                priority: "medium",
                status: "active",
                assignedTo: adminUser._id,
                lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
                metadata: {
                    source: "direct_chat",
                    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            },
            {
                participants: [
                    { user: regularUsers[1]._id, role: "user" },
                    { user: adminUser._id, role: "admin" }
                ],
                messages: [
                    {
                        sender: regularUsers[1]._id,
                        senderRole: "user",
                        content: "Hi, I'm having trouble with the ebook download feature. Can you help?",
                        sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
                    },
                    {
                        sender: adminUser._id,
                        senderRole: "admin",
                        content: "Hello! I'm sorry to hear you're having trouble with downloads. Can you tell me which ebook you're trying to download and what error message you're seeing?",
                        sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000)
                    },
                    {
                        sender: regularUsers[1]._id,
                        senderRole: "user",
                        content: "I purchased \"Tamil Grammar Essentials\" but the download link doesn't seem to work. It just shows a loading spinner.",
                        sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000)
                    }
                ],
                subject: "Ebook Download Issue",
                priority: "high",
                status: "active",
                assignedTo: adminUser._id,
                lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
                metadata: {
                    source: "direct_chat",
                    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
                }
            },
            {
                participants: [
                    { user: regularUsers[2]._id, role: "user" }
                ],
                messages: [
                    {
                        sender: regularUsers[2]._id,
                        senderRole: "user",
                        content: "Hello, I would like to know more about your Tamil language learning programs and courses.",
                        sentAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
                    }
                ],
                subject: "Tamil Language Learning Programs",
                priority: "medium",
                status: "active",
                lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000),
                metadata: {
                    source: "website",
                    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15"
                }
            }
        ];

        await Chat.insertMany(chats);
        console.log("Chat conversations seeded successfully");

        console.log("Database seeding completed successfully!");

    } catch (error) {
        console.error("Error seeding database:", error);
        throw error;
    }
}

module.exports = { seedDatabase };