const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const WebsiteContent = require('../models/WebsiteContent');
const Book = require('../models/Book');
const Ebook = require('../models/Ebook');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const Initiative = require('../models/Initiative');
const TeamMember = require('../models/TeamMember');
const Poster = require('../models/Poster');
const User = require('../models/User');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tls_projects');
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Clear all collections
const clearCollections = async () => {
    try {
        await WebsiteContent.deleteMany({});
        await Book.deleteMany({});
        await Ebook.deleteMany({});
        await Project.deleteMany({});
        await Activity.deleteMany({});
        await Initiative.deleteMany({});
        await TeamMember.deleteMany({});
        await Poster.deleteMany({});
        console.log('All collections cleared successfully');
    } catch (error) {
        console.error('Error clearing collections:', error);
    }
};

// Create admin user if not exists
const createAdminUser = async () => {
    try {
        let adminUser = await User.findOne({ email: 'admin@tls.com' });
        if (!adminUser) {
            adminUser = new User({
                full_name: 'TLS Administrator',
                name: 'Admin User',
                email: 'admin@tls.com',
                password: 'admin123',
                role: 'admin',
                isActive: true
            });
            await adminUser.save();
            console.log('Admin user created');
        }
        return adminUser._id;
    } catch (error) {
        console.error('Error creating admin user:', error);
        return null;
    }
};

// Seed WebsiteContent
const seedWebsiteContent = async (adminId) => {
    const websiteContentData = [
        {
            page: "home",
            section: "hero",
            sectionKey: "hero-title",
            sectionType: "hero",
            layout: "full-width",
            position: 1,
            title: {
                en: "Tamil Literary Society",
                ta: "தமிழ் இலக்கிய சங்கம்"
            },
            content: {
                en: "Preserving and promoting Tamil literature, culture, and heritage for future generations.",
                ta: "எதிர்கால சந்ததியினருக்காக தமிழ் இலக்கியம், பண்பாடு மற்றும் பாரம்பரியத்தை பாதுகாத்து மேம்படுத்துதல்."
            },
            isActive: true,
            isVisible: true,
            version: 1,
            seoKeywords: {
                en: ["tamil", "literature", "society", "culture"],
                ta: ["தமிழ்", "இலக்கியம்", "சங்கம்", "பண்பாடு"]
            },
            createdBy: adminId
        },
        {
            page: "home",
            section: "features",
            sectionKey: "home-features",
            sectionType: "feature-list",
            layout: "three-column",
            position: 2,
            title: {
                en: "Our Core Services",
                ta: "எங்கள் முக்கிய சேவைகள்"
            },
            content: {
                en: "Discover the various ways we serve the Tamil community through education, literature, and cultural preservation.",
                ta: "கல்வி, இலக்கியம் மற்றும் பண்பாட்டு பாதுகாப்பின் மூலம் தமிழ் சமூகத்திற்கு நாங்கள் சேவை செய்யும் பல்வேறு வழிகளை கண்டறியுங்கள்."
            },
            isActive: true,
            isVisible: true,
            version: 1,
            seoKeywords: {
                en: ["services", "education", "literature", "community"],
                ta: ["சேவைகள்", "கல்வி", "இலக்கியம்", "சமூகம்"]
            },
            createdBy: adminId
        }
    ];

    try {
        await WebsiteContent.insertMany(websiteContentData);
        console.log('WebsiteContent seeded successfully');
    } catch (error) {
        console.error('Error seeding WebsiteContent:', error);
    }
};

// Seed Books
const seedBooks = async (adminId) => {
    const booksData = [
        {
            title: {
                en: "Tamil Poetry Collection",
                ta: "தமிழ் கவிதை தொகுப்பு"
            },
            author: {
                en: "Bharathiyar",
                ta: "பாரதியார்"
            },
            description: {
                en: "A comprehensive collection of Tamil poetry celebrating the beauty of Tamil language and culture.",
                ta: "தமிழ் மொழி மற்றும் பண்பாட்டின் அழகை கொண்டாடும் தமிழ் கவிதைகளின் விரிவான தொகுப்பு."
            },
            category: "poetry",
            price: 299,
            originalPrice: 399,
            discount: 25,
            isbn: "978-81-123-4567-8",
            publisher: "Tamil Literary Press",
            publishedDate: new Date('2023-01-15'),
            pages: 250,
            bookLanguage: "Tamil",
            coverImage: "/assets/books/tamil-poetry.jpg",
            inStock: true,
            stockQuantity: 50,
            featured: true,
            bestseller: true,
            newRelease: false,
            rating: 4.8,
            reviewCount: 125,
            isActive: true,
            createdBy: adminId
        }
    ];

    try {
        await Book.insertMany(booksData);
        console.log('Books seeded successfully');
    } catch (error) {
        console.error('Error seeding Books:', error);
    }
};

// Seed Ebooks
const seedEbooks = async (adminId) => {
    const ebooksData = [
        {
            title: {
                en: "Digital Tamil Literature",
                ta: "டிஜிட்டல் தமிழ் இலக்கியம்"
            },
            author: {
                en: "Modern Tamil Writers",
                ta: "நவீன தமிழ் எழுத்தாளர்கள்"
            },
            description: {
                en: "A digital collection of contemporary Tamil literature accessible to everyone.",
                ta: "அனைவருக்கும் அணுகக்கூடிய சமகால தமிழ் இலக்கியத்தின் டிஜிட்டல் தொகுப்பு."
            },
            category: "literature",
            isbn: "978-81-987-6543-2",
            publisher: "Digital Tamil Press",
            publishedDate: new Date('2023-06-01'),
            pages: 180,
            bookLanguage: "Tamil",
            coverImage: "/assets/ebooks/digital-tamil.jpg",
            fileUrl: "/assets/ebooks/digital-tamil-literature.pdf",
            fileSize: 2048000,
            fileFormat: "PDF",
            downloadCount: 1250,
            isFree: true,
            featured: true,
            bestseller: false,
            newRelease: true,
            rating: 4.6,
            reviewCount: 89,
            isActive: true,
            createdBy: adminId
        }
    ];

    try {
        await Ebook.insertMany(ebooksData);
        console.log('Ebooks seeded successfully');
    } catch (error) {
        console.error('Error seeding Ebooks:', error);
    }
};

// Seed Projects
const seedProjects = async (adminId) => {
    const projectsData = [
        {
            title: {
                en: "Tamil Language Preservation Initiative",
                ta: "தமிழ் மொழி பாதுகாப்பு முயற்சி"
            },
            slug: "tamil-language-preservation",
            bureau: "language-literature",
            description: {
                en: "A comprehensive project aimed at preserving and promoting Tamil language in the digital age.",
                ta: "டிஜிட்டல் யுகத்தில் தமிழ் மொழியை பாதுகாத்து மேம்படுத்துவதை நோக்கமாகக் கொண்ட ஒரு விரிவான திட்டம்."
            },
            director: {
                en: "Dr. Tamil Selvan",
                ta: "டாக்டர் தமிழ்செல்வன்"
            },
            director_name: "Dr. Tamil Selvan",
            director_email: "tamilselvan@tls.com",
            director_phone: "+1-234-567-8901",
            status: "active",
            primary_image_url: "/assets/projects/language-preservation.jpg",
            images_count: 5,
            goals: {
                en: "To create digital resources and tools for Tamil language learning and preservation.",
                ta: "தமிழ் மொழி கற்றல் மற்றும் பாதுகாப்பிற்கான டிஜிட்டல் வளங்கள் மற்றும் கருவிகளை உருவாக்குதல்."
            },
            progress: 75,
            createdBy: adminId
        }
    ];

    try {
        await Project.insertMany(projectsData);
        console.log('Projects seeded successfully');
    } catch (error) {
        console.error('Error seeding Projects:', error);
    }
};

// Seed Activities
const seedActivities = async (adminId) => {
    const activitiesData = [
        {
            title: {
                en: "Tamil Poetry Workshop",
                ta: "தமிழ் கவிதை பட்டறை"
            },
            slug: "tamil-poetry-workshop",
            bureau: "arts-culture",
            description: {
                en: "An interactive workshop for aspiring Tamil poets to learn and practice poetry writing.",
                ta: "தமிழ் கவிஞர்களாக விரும்புபவர்கள் கவிதை எழுதுவதை கற்றுக்கொள்ளவும் பயிற்சி செய்யவும் ஒரு ஊடாடும் பட்டறை."
            },
            director: {
                en: "Prof. Kavitha Devi",
                ta: "பேராசிரியர் கவிதா தேவி"
            },
            director_name: "Prof. Kavitha Devi",
            director_email: "kavitha@tls.com",
            director_phone: "+1-234-567-8902",
            status: "active",
            primary_image_url: "/assets/activities/poetry-workshop.jpg",
            images_count: 3,
            goals: {
                en: "To nurture new talent in Tamil poetry and provide a platform for creative expression.",
                ta: "தமிழ் கவிதையில் புதிய திறமைகளை வளர்த்து படைப்பு வெளிப்பாட்டிற்கான தளத்தை வழங்குதல்."
            },
            progress: 60,
            createdBy: adminId
        }
    ];

    try {
        await Activity.insertMany(activitiesData);
        console.log('Activities seeded successfully');
    } catch (error) {
        console.error('Error seeding Activities:', error);
    }
};

// Seed Initiatives
const seedInitiatives = async (adminId) => {
    const initiativesData = [
        {
            title: {
                en: "Tamil Education Outreach",
                ta: "தமிழ் கல்வி விரிவாக்கம்"
            },
            slug: "tamil-education-outreach",
            bureau: "education-intellectual",
            description: {
                en: "An initiative to promote Tamil education in schools and communities worldwide.",
                ta: "உலகம் முழுவதும் உள்ள பள்ளிகள் மற்றும் சமூகங்களில் தமிழ் கல்வியை மேம்படுத்துவதற்கான ஒரு முயற்சி."
            },
            director: {
                en: "Dr. Education Kumar",
                ta: "டாக்டர் எஜுகேஷன் குமார்"
            },
            director_name: "Dr. Education Kumar",
            director_email: "education@tls.com",
            director_phone: "+1-234-567-8903",
            status: "active",
            primary_image_url: "/assets/initiatives/education-outreach.jpg",
            images_count: 4,
            goals: {
                en: "To establish Tamil language programs in 100 schools by 2025.",
                ta: "2025 ஆம் ஆண்டுக்குள் 100 பள்ளிகளில் தமிழ் மொழி திட்டங்களை நிறுவுதல்."
            },
            progress: 45,
            createdBy: adminId
        }
    ];

    try {
        await Initiative.insertMany(initiativesData);
        console.log('Initiatives seeded successfully');
    } catch (error) {
        console.error('Error seeding Initiatives:', error);
    }
};

// Seed Team Members
const seedTeamMembers = async (adminId) => {
    const teamMembersData = [
        {
            name: {
                en: "Dr. Tamil Arasan",
                ta: "டாக்டர் தமிழரசன்"
            },
            role: "President",
            slug: "dr-tamil-arasan",
            bio: {
                en: "Dr. Tamil Arasan is a renowned Tamil scholar and the founding president of the Tamil Literary Society.",
                ta: "டாக்டர் தமிழரசன் ஒரு புகழ்பெற்ற தமிழ் அறிஞர் மற்றும் தமிழ் இலக்கிய சங்கத்தின் நிறுவன தலைவர்."
            },
            email: "president@tls.com",
            phone: "+1-234-567-8900",
            social_links: {
                linkedin: "https://linkedin.com/in/tamil-arasan",
                twitter: "https://twitter.com/tamil_arasan",
                facebook: "https://facebook.com/tamil.arasan"
            },
            order_num: 1,
            is_active: true,
            image_path: "/assets/team/dr-tamil-arasan.jpg"
        },
        {
            name: {
                en: "Ms. Selvi Murugan",
                ta: "செல்வி முருகன்"
            },
            role: "Secretary",
            slug: "ms-selvi-murugan",
            bio: {
                en: "Ms. Selvi Murugan is an accomplished writer and serves as the secretary of the Tamil Literary Society.",
                ta: "செல்வி முருகன் ஒரு திறமையான எழுத்தாளர் மற்றும் தமிழ் இலக்கிய சங்கத்தின் செயலாளராக பணியாற்றுகிறார்."
            },
            email: "secretary@tls.com",
            phone: "+1-234-567-8901",
            social_links: {
                linkedin: "https://linkedin.com/in/selvi-murugan",
                instagram: "https://instagram.com/selvi_murugan"
            },
            order_num: 2,
            is_active: true,
            image_path: "/assets/team/ms-selvi-murugan.jpg"
        }
    ];

    try {
        await TeamMember.insertMany(teamMembersData);
        console.log('Team Members seeded successfully');
    } catch (error) {
        console.error('Error seeding Team Members:', error);
    }
};

// Seed Posters
const seedPosters = async (adminId) => {
    const postersData = [
        {
            title: {
                en: "Tamil Literature Festival 2024",
                ta: "தமிழ் இலக்கிய விழா 2024"
            },
            description: {
                en: "Join us for the annual Tamil Literature Festival celebrating the richness of Tamil literary heritage.",
                ta: "தமிழ் இலக்கிய பாரம்பரியத்தின் செழுமையை கொண்டாடும் வருடாந்திர தமிழ் இலக்கிய விழாவில் எங்களுடன் சேருங்கள்."
            },
            image_path: "/assets/posters/literature-festival-2024.jpg",
            imageAlt: "Tamil Literature Festival 2024 Poster",
            buttonText: {
                en: "Register Now",
                ta: "இப்போது பதிவு செய்யுங்கள்"
            },
            link_url: "/events/literature-festival-2024",
            is_active: true,
            start_at: new Date(),
            end_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            priority: 8,
            viewCount: 0,
            clickCount: 0,
            created_by: adminId,
            seoTitle: "Tamil Literature Festival 2024 - Register Now",
            seoDescription: "Join the annual Tamil Literature Festival celebrating Tamil literary heritage. Register now for workshops, readings, and cultural events.",
            seoKeywords: ["tamil", "literature", "festival", "2024", "cultural", "events"]
        }
    ];

    try {
        await Poster.insertMany(postersData);
        console.log('Posters seeded successfully');
    } catch (error) {
        console.error('Error seeding Posters:', error);
    }
};

// Main function
const main = async () => {
    try {
        await connectDB();
        
        console.log('Starting database seeding process...');
        
        // Clear all collections
        await clearCollections();
        
        // Create admin user
        const adminId = await createAdminUser();
        
        if (!adminId) {
            console.error('Failed to create admin user. Exiting...');
            process.exit(1);
        }
        
        // Seed all collections
        await seedWebsiteContent(adminId);
        await seedBooks(adminId);
        await seedEbooks(adminId);
        await seedProjects(adminId);
        await seedActivities(adminId);
        await seedInitiatives(adminId);
        await seedTeamMembers(adminId);
        await seedPosters(adminId);
        
        console.log('\n✅ Database seeding completed successfully!');
        console.log('All collections have been populated with bilingual sample data.');
        
    } catch (error) {
        console.error('Error in main function:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
};

// Run the script
main();