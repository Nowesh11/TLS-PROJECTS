const mongoose = require("mongoose");
const Chat = require("../models/Chat");
const User = require("../models/User");
require("dotenv").config();

// Sample chat data
const sampleChats = [
    {
        participants: [
            { role: "user" },
            { role: "admin" }
        ],
        status: "active",
        priority: "medium",
        subject: "Question about Tamil language courses",
        messages: [
            {
                content: "Hello! I'm interested in learning Tamil. Do you offer beginner courses?",
                senderRole: "user",
                messageType: "text",
                sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
            },
            {
                content: "Hello! Yes, we do offer beginner Tamil courses. Our next batch starts on the 15th of next month. Would you like more information about the curriculum and schedule?",
                senderRole: "admin",
                messageType: "text",
                sentAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000) // 1.5 hours ago
            },
            {
                content: "That sounds great! Could you please send me the course details and fees?",
                senderRole: "user",
                messageType: "text",
                sentAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
            }
        ],
        lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000)
    },
    {
        participants: [
            { role: "user" },
            { role: "admin" }
        ],
        status: "active",
        priority: "high",
        subject: "Cultural event participation",
        messages: [
            {
                content: "Hi, I saw your upcoming cultural event. How can I participate as a volunteer?",
                senderRole: "user",
                messageType: "text",
                sentAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
            },
            {
                content: "Thank you for your interest! We'd love to have you as a volunteer. Please fill out our volunteer registration form and we'll get back to you with details.",
                senderRole: "admin",
                messageType: "text",
                sentAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000) // 2.5 hours ago
            },
            {
                content: "I've submitted the form. When can I expect to hear back?",
                senderRole: "user",
                messageType: "text",
                sentAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
            }
        ],
        lastActivity: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
        participants: [
            { role: "user" },
            { role: "admin" }
        ],
        status: "closed",
        priority: "low",
        subject: "Website feedback",
        messages: [
            {
                content: "I love the new website design! Very clean and easy to navigate.",
                senderRole: "user",
                messageType: "text",
                sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
            },
            {
                content: "Thank you so much for the positive feedback! We're glad you like the new design. If you have any suggestions for improvement, please let us know.",
                senderRole: "admin",
                messageType: "text",
                sentAt: new Date(Date.now() - 23 * 60 * 60 * 1000) // 23 hours ago
            },
            {
                content: "Will do! Keep up the great work.",
                senderRole: "user",
                messageType: "text",
                sentAt: new Date(Date.now() - 22 * 60 * 60 * 1000) // 22 hours ago
            }
        ],
        lastActivity: new Date(Date.now() - 22 * 60 * 60 * 1000)
    },
    {
        participants: [
            { role: "user" },
            { role: "admin" }
        ],
        status: "active",
        priority: "medium",
        subject: "Book recommendation request",
        messages: [
            {
                content: "Can you recommend some good Tamil literature books for intermediate readers?",
                senderRole: "user",
                messageType: "text",
                sentAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
            },
            {
                content: "Certainly! For intermediate readers, I'd recommend \"Ponniyin Selvan\" by Kalki, \"Sivagamiyin Sabadham\" by Kalki, and \"Parthiban Kanavu\" by Kalki. These are classics that will help improve your Tamil reading skills.",
                senderRole: "admin",
                messageType: "text",
                sentAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000) // 3.5 hours ago
            },
            {
                content: "Thank you! Are these available in your library?",
                senderRole: "user",
                messageType: "text",
                sentAt: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
            }
        ],
        lastActivity: new Date(Date.now() - 15 * 60 * 1000)
    },
    {
        participants: [
            { role: "user" },
            { role: "admin" }
        ],
        status: "active",
        priority: "urgent",
        subject: "Technical issue with registration",
        messages: [
            {
                content: "I'm having trouble completing my registration for the Tamil poetry workshop. The form keeps giving me an error.",
                senderRole: "user",
                messageType: "text",
                sentAt: new Date(Date.now() - 45 * 60 * 1000) // 45 minutes ago
            },
            {
                content: "I'm sorry to hear about the technical issue. Can you please tell me what error message you're seeing? Also, which browser are you using?",
                senderRole: "admin",
                messageType: "text",
                sentAt: new Date(Date.now() - 40 * 60 * 1000) // 40 minutes ago
            },
            {
                content: "I'm using Chrome. The error says \"Registration failed - please try again later\". I've tried multiple times.",
                senderRole: "user",
                messageType: "text",
                sentAt: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
            }
        ],
        lastActivity: new Date(Date.now() - 10 * 60 * 1000)
    }
];

// Sample contact messages
const sampleMessages = [
    {
        name: "Priya Sharma",
        email: "priya.sharma@email.com",
        subject: "Inquiry about Tamil classes",
        message: "Hello, I am interested in joining Tamil language classes for beginners. Could you please provide information about the schedule, fees, and enrollment process? I am available on weekends and would prefer evening classes if possible.",
        status: "new",
        read: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
        name: "Rajesh Kumar",
        email: "rajesh.k@email.com",
        subject: "Cultural event collaboration",
        message: "Greetings! I represent a local cultural organization and we would like to collaborate with your society for upcoming Tamil cultural events. We have experience organizing traditional music and dance performances. Please let me know if you would be interested in discussing this further.",
        status: "new",
        read: false,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
    },
    {
        name: "Meera Patel",
        email: "meera.patel@email.com",
        subject: "Book donation offer",
        message: "Dear Tamil Society, I have a collection of Tamil literature books that I would like to donate to your library. The collection includes works by various renowned authors and would be valuable for students and literature enthusiasts. How can I proceed with the donation?",
        status: "resolved",
        read: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    {
        name: "Arjun Krishnan",
        email: "arjun.krishnan@email.com",
        subject: "Website feedback",
        message: "I wanted to compliment you on the excellent website redesign. The navigation is much more intuitive now, and I love the cultural elements incorporated into the design. The resource section is particularly helpful. Great work!",
        status: "resolved",
        read: true,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
    },
    {
        name: "Lakshmi Venkat",
        email: "lakshmi.v@email.com",
        subject: "Volunteer opportunity",
        message: "Hello, I am a Tamil teacher with 10 years of experience and would like to volunteer for your educational programs. I am particularly interested in helping with children's Tamil classes and cultural workshops. Please let me know how I can contribute to your mission.",
        status: "new",
        read: false,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
    }
];

async function addSampleChatData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Find or create sample users
        let adminUser = await User.findOne({ role: "admin" });
        if (!adminUser) {
            adminUser = await User.create({
                name: "Admin User",
                email: "admin@tamilsociety.com",
                password: "password123",
                role: "admin"
            });
        }

        // Create sample regular users
        const sampleUsers = [
            { name: "Priya Sharma", email: "priya.sharma@email.com" },
            { name: "Rajesh Kumar", email: "rajesh.k@email.com" },
            { name: "Arjun Krishnan", email: "arjun.krishnan@email.com" },
            { name: "Meera Patel", email: "meera.patel@email.com" },
            { name: "Lakshmi Venkat", email: "lakshmi.v@email.com" }
        ];

        const createdUsers = [];
        for (const userData of sampleUsers) {
            let user = await User.findOne({ email: userData.email });
            if (!user) {
                user = await User.create({
                    ...userData,
                    password: "password123",
                    role: "user"
                });
            }
            createdUsers.push(user);
        }

        // Create sample chats
        for (let i = 0; i < sampleChats.length; i++) {
            const chatData = sampleChats[i];
            const user = createdUsers[i % createdUsers.length];
            
            // Update participants with actual user IDs
            chatData.participants = [
                { user: user._id, role: "user" },
                { user: adminUser._id, role: "admin" }
            ];

            // Update message senders
            chatData.messages.forEach(message => {
                message.sender = message.senderRole === "admin" ? adminUser._id : user._id;
            });

            const chat = await Chat.create(chatData);
            console.log(`Created chat: ${chat.subject}`);
        }

        // Create sample contact messages
        for (const messageData of sampleMessages) {
            const message = await ContactMessage.create(messageData);
            console.log(`Created contact message from: ${message.name}`);
        }

        console.log("\n✅ Sample chat data added successfully!");
        console.log(`📊 Created ${sampleChats.length} chats and ${sampleMessages.length} contact messages`);
        
    } catch (error) {
        console.error("❌ Error adding sample chat data:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

// Run the script
if (require.main === module) {
    addSampleChatData();
}

module.exports = addSampleChatData;