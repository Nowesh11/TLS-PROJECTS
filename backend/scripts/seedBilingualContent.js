const mongoose = require("mongoose");
const WebsiteContent = require("../models/WebsiteContent");
const User = require("../models/User");
require("dotenv").config({ path: "./.env" });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected:", mongoose.connection.host);
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};

const seedBilingualContent = async () => {
    try {
        await connectDB();
        console.log("Starting bilingual content seeding...");

        // Find admin user
        const adminUser = await User.findOne({ email: "nowesh03@gmail.com" });
        if (!adminUser) {
            console.error("Admin user not found");
            process.exit(1);
        }
        console.log("Using admin user:", adminUser.email);

        // Clear existing content for pages that need comprehensive seeding
        await WebsiteContent.deleteMany({ page: { $in: ["projects", "books", "ebooks"] } });
        console.log("Cleared existing content for projects, books, ebooks pages");

        // Projects Page Content
        const projectsContent = [
            {
                page: "projects",
                section: "heroTitle",
                sectionKey: "projects.heroTitle",
                title: "Our Projects",
                titleTamil: "எங்கள் திட்டங்கள்",
                createdBy: adminUser._id
            },
            {
                page: "projects",
                section: "heroSubtitle",
                sectionKey: "projects.heroSubtitle",
                content: "Discover our innovative projects that promote Tamil language and culture",
                contentTamil: "தமிழ் மொழி மற்றும் கலாச்சாரத்தை ஊக்குவிக்கும் எங்கள் புதுமையான திட்டங்களைக் கண்டறியுங்கள்",
                createdBy: adminUser._id
            },
            {
                page: "projects",
                section: "featuredTitle",
                sectionKey: "projects.featuredTitle",
                title: "Featured Projects",
                titleTamil: "சிறப்பு திட்டங்கள்",
                createdBy: adminUser._id
            },
            {
                page: "projects",
                section: "project1Title",
                sectionKey: "projects.project1Title",
                title: "Tamil Digital Library",
                titleTamil: "தமிழ் டிஜிட்டல் நூலகம்",
                createdBy: adminUser._id
            },
            {
                page: "projects",
                section: "project1Description",
                sectionKey: "projects.project1Description",
                content: "A comprehensive digital library preserving Tamil literature and making it accessible worldwide",
                contentTamil: "தமிழ் இலக்கியத்தைப் பாதுகாத்து உலகம் முழுவதும் அணுகக்கூடியதாக மாற்றும் விரிவான டிஜிட்டல் நூலகம்",
                createdBy: adminUser._id
            },
            {
                page: "projects",
                section: "project1Button",
                sectionKey: "projects.project1Button",
                buttonText: "Learn More",
                buttonTextTamil: "மேலும் அறிய",
                buttonUrl: "#project1",
                createdBy: adminUser._id
            },
            {
                page: "projects",
                section: "project2Title",
                sectionKey: "projects.project2Title",
                title: "Tamil Language Learning Platform",
                titleTamil: "தமிழ் மொழி கற்றல் தளம்",
                createdBy: adminUser._id
            },
            {
                page: "projects",
                section: "project2Description",
                sectionKey: "projects.project2Description",
                content: "Interactive online platform for learning Tamil language with modern teaching methods",
                contentTamil: "நவீன கற்பித்தல் முறைகளுடன் தமிழ் மொழியைக் கற்றுக்கொள்வதற்கான ஊடாடும் ஆன்லைன் தளம்",
                createdBy: adminUser._id
            },
            {
                page: "projects",
                section: "project2Button",
                sectionKey: "projects.project2Button",
                buttonText: "Explore Platform",
                buttonTextTamil: "தளத்தை ஆராயுங்கள்",
                buttonUrl: "#project2",
                createdBy: adminUser._id
            },
            {
                page: "projects",
                section: "project3Title",
                sectionKey: "projects.project3Title",
                title: "Cultural Heritage Documentation",
                titleTamil: "கலாச்சார பாரம்பரிய ஆவணப்படுத்தல்",
                createdBy: adminUser._id
            },
            {
                page: "projects",
                section: "project3Description",
                sectionKey: "projects.project3Description",
                content: "Documenting and preserving Tamil cultural traditions, festivals, and customs for future generations",
                contentTamil: "எதிர்கால சந்ததியினருக்காக தமிழ் கலாச்சார மரபுகள், திருவிழாக்கள் மற்றும் பழக்கவழக்கங்களை ஆவணப்படுத்துதல் மற்றும் பாதுகாத்தல்",
                createdBy: adminUser._id
            },
            {
                page: "projects",
                section: "project3Button",
                sectionKey: "projects.project3Button",
                buttonText: "View Documentation",
                buttonTextTamil: "ஆவணங்களைப் பார்க்கவும்",
                buttonUrl: "#project3",
                createdBy: adminUser._id
            },
            {
                page: "projects",
                section: "ctaTitle",
                sectionKey: "projects.ctaTitle",
                title: "Join Our Mission",
                titleTamil: "எங்கள் நோக்கத்தில் சேருங்கள்",
                createdBy: adminUser._id
            },
            {
                page: "projects",
                section: "ctaDescription",
                sectionKey: "projects.ctaDescription",
                content: "Be part of our efforts to preserve and promote Tamil language and culture",
                contentTamil: "தமிழ் மொழி மற்றும் கலாச்சாரத்தைப் பாதுகாக்கவும் ஊக்குவிக்கவும் எங்கள் முயற்சிகளில் பங்கேற்கவும்",
                createdBy: adminUser._id
            },
            {
                page: "projects",
                section: "ctaButton",
                sectionKey: "projects.ctaButton",
                buttonText: "Get Involved",
                buttonTextTamil: "ஈடுபடுங்கள்",
                buttonUrl: "contact.html",
                createdBy: adminUser._id
            }
        ];

        // Books Page Content
        const booksContent = [
            {
                page: "books",
                section: "heroTitle",
                sectionKey: "books.heroTitle",
                title: "Tamil Book Store",
                titleTamil: "தமிழ் புத்தக கடை",
                createdBy: adminUser._id
            },
            {
                page: "books",
                section: "heroSubtitle",
                sectionKey: "books.heroSubtitle",
                content: "Discover our curated collection of Tamil literature, academic books, and cultural texts",
                contentTamil: "தமிழ் இலக்கியம், கல்வி புத்தகங்கள் மற்றும் கலாச்சார நூல்களின் எங்கள் தேர்ந்தெடுக்கப்பட்ட தொகுப்பைக் கண்டறியுங்கள்",
                createdBy: adminUser._id
            },
            {
                page: "books",
                section: "categoriesTitle",
                sectionKey: "books.categoriesTitle",
                title: "Book Categories",
                titleTamil: "புத்தக வகைகள்",
                createdBy: adminUser._id
            },
            {
                page: "books",
                section: "category1Title",
                sectionKey: "books.category1Title",
                title: "Literature",
                titleTamil: "இலக்கியம்",
                createdBy: adminUser._id
            },
            {
                page: "books",
                section: "category1Description",
                sectionKey: "books.category1Description",
                content: "Classic and contemporary Tamil literature including poetry, novels, and short stories",
                contentTamil: "கவிதை, நாவல்கள் மற்றும் சிறுகதைகள் உட்பட பாரம்பரிய மற்றும் சமகால தமிழ் இலக்கியம்",
                createdBy: adminUser._id
            },
            {
                page: "books",
                section: "category2Title",
                sectionKey: "books.category2Title",
                title: "Academic",
                titleTamil: "கல்வி",
                createdBy: adminUser._id
            },
            {
                page: "books",
                section: "category2Description",
                sectionKey: "books.category2Description",
                content: "Educational textbooks, grammar guides, and academic research publications",
                contentTamil: "கல்வி பாடப்புத்தகங்கள், இலக்கண வழிகாட்டிகள் மற்றும் கல்வி ஆராய்ச்சி வெளியீடுகள்",
                createdBy: adminUser._id
            },
            {
                page: "books",
                section: "category3Title",
                sectionKey: "books.category3Title",
                title: "Cultural",
                titleTamil: "கலாச்சாரம்",
                createdBy: adminUser._id
            },
            {
                page: "books",
                section: "category3Description",
                sectionKey: "books.category3Description",
                content: "Books on Tamil culture, traditions, history, and heritage",
                contentTamil: "தமிழ் கலாச்சாரம், மரபுகள், வரலாறு மற்றும் பாரம்பரியம் பற்றிய புத்தகங்கள்",
                createdBy: adminUser._id
            },
            {
                page: "books",
                section: "featuredTitle",
                sectionKey: "books.featuredTitle",
                title: "Featured Books",
                titleTamil: "சிறப்பு புத்தகங்கள்",
                createdBy: adminUser._id
            },
            {
                page: "books",
                section: "shopButton",
                sectionKey: "books.shopButton",
                buttonText: "Browse All Books",
                buttonTextTamil: "அனைத்து புத்தகங்களையும் உலாவுங்கள்",
                buttonUrl: "#books-catalog",
                createdBy: adminUser._id
            },
            {
                page: "books",
                section: "ctaTitle",
                sectionKey: "books.ctaTitle",
                title: "Can't Find What You're Looking For?",
                titleTamil: "நீங்கள் தேடுவது கிடைக்கவில்லையா?",
                createdBy: adminUser._id
            },
            {
                page: "books",
                section: "ctaDescription",
                sectionKey: "books.ctaDescription",
                content: "Contact us for special book requests or recommendations",
                contentTamil: "சிறப்பு புத்தக கோரிக்கைகள் அல்லது பரிந்துரைகளுக்கு எங்களைத் தொடர்பு கொள்ளுங்கள்",
                createdBy: adminUser._id
            },
            {
                page: "books",
                section: "ctaButton",
                sectionKey: "books.ctaButton",
                buttonText: "Contact Us",
                buttonTextTamil: "எங்களைத் தொடர்பு கொள்ளுங்கள்",
                buttonUrl: "contact.html",
                createdBy: adminUser._id
            }
        ];

        // Ebooks Page Content
        const ebooksContent = [
            {
                page: "ebooks",
                section: "heroTitle",
                sectionKey: "ebooks.heroTitle",
                title: "Tamil E-Books Library",
                titleTamil: "தமிழ் மின்னூல் நூலகம்",
                createdBy: adminUser._id
            },
            {
                page: "ebooks",
                section: "heroSubtitle",
                sectionKey: "ebooks.heroSubtitle",
                content: "Access thousands of Tamil e-books instantly. Read anywhere, anytime on any device",
                contentTamil: "ஆயிரக்கணக்கான தமிழ் மின்னூல்களை உடனடியாக அணுகுங்கள். எங்கு வேண்டுமானாலும், எப்போது வேண்டுமானாலும் எந்த சாதனத்திலும் படியுங்கள்",
                createdBy: adminUser._id
            },
            {
                page: "ebooks",
                section: "benefitsTitle",
                sectionKey: "ebooks.benefitsTitle",
                title: "Why Choose E-Books?",
                titleTamil: "ஏன் மின்னூல்களைத் தேர்வு செய்ய வேண்டும்?",
                createdBy: adminUser._id
            },
            {
                page: "ebooks",
                section: "benefit1Title",
                sectionKey: "ebooks.benefit1Title",
                title: "Instant Access",
                titleTamil: "உடனடி அணுகல்",
                createdBy: adminUser._id
            },
            {
                page: "ebooks",
                section: "benefit1Description",
                sectionKey: "ebooks.benefit1Description",
                content: "Download and start reading immediately after purchase",
                contentTamil: "வாங்கிய உடனே பதிவிறக்கம் செய்து படிக்கத் தொடங்குங்கள்",
                createdBy: adminUser._id
            },
            {
                page: "ebooks",
                section: "benefit2Title",
                sectionKey: "ebooks.benefit2Title",
                title: "Portable Library",
                titleTamil: "கையடக்க நூலகம்",
                createdBy: adminUser._id
            },
            {
                page: "ebooks",
                section: "benefit2Description",
                sectionKey: "ebooks.benefit2Description",
                content: "Carry thousands of books in your pocket",
                contentTamil: "உங்கள் பாக்கெட்டில் ஆயிரக்கணக்கான புத்தகங்களை எடுத்துச் செல்லுங்கள்",
                createdBy: adminUser._id
            },
            {
                page: "ebooks",
                section: "benefit3Title",
                sectionKey: "ebooks.benefit3Title",
                title: "Searchable Text",
                titleTamil: "தேடக்கூடிய உரை",
                createdBy: adminUser._id
            },
            {
                page: "ebooks",
                section: "benefit3Description",
                sectionKey: "ebooks.benefit3Description",
                content: "Find any word or phrase instantly within the book",
                contentTamil: "புத்தகத்தில் எந்த வார்த்தையையும் அல்லது சொற்றொடரையும் உடனடியாகக் கண்டறியுங்கள்",
                createdBy: adminUser._id
            },
            {
                page: "ebooks",
                section: "categoriesTitle",
                sectionKey: "ebooks.categoriesTitle",
                title: "E-Book Categories",
                titleTamil: "மின்னூல் வகைகள்",
                createdBy: adminUser._id
            },
            {
                page: "ebooks",
                section: "browseButton",
                sectionKey: "ebooks.browseButton",
                buttonText: "Browse E-Books",
                buttonTextTamil: "மின்னூல்களை உலாவுங்கள்",
                buttonUrl: "#ebooks-catalog",
                createdBy: adminUser._id
            },
            {
                page: "ebooks",
                section: "freeTitle",
                sectionKey: "ebooks.freeTitle",
                title: "Free E-Books",
                titleTamil: "இலவச மின்னூல்கள்",
                createdBy: adminUser._id
            },
            {
                page: "ebooks",
                section: "freeDescription",
                sectionKey: "ebooks.freeDescription",
                content: "Explore our collection of free Tamil e-books and start your reading journey",
                contentTamil: "எங்கள் இலவச தமிழ் மின்னூல்களின் தொகுப்பை ஆராய்ந்து உங்கள் வாசிப்பு பயணத்தைத் தொடங்குங்கள்",
                createdBy: adminUser._id
            },
            {
                page: "ebooks",
                section: "freeButton",
                sectionKey: "ebooks.freeButton",
                buttonText: "View Free Books",
                buttonTextTamil: "இலவச புத்தகங்களைப் பார்க்கவும்",
                buttonUrl: "#free-ebooks",
                createdBy: adminUser._id
            }
        ];

        // Insert all bilingual content
        const allContent = [...projectsContent, ...booksContent, ...ebooksContent];
        await WebsiteContent.insertMany(allContent);
        
        console.log(`Successfully seeded ${allContent.length} bilingual content sections:`);
        console.log(`- Projects: ${projectsContent.length} sections`);
        console.log(`- Books: ${booksContent.length} sections`);
        console.log(`- Ebooks: ${ebooksContent.length} sections`);
        
        console.log("Bilingual content seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding bilingual content:", error);
        process.exit(1);
    }
};

seedBilingualContent();