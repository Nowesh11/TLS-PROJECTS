const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "config", ".env") });

// Override the mongoose helper to return real mongoose
require.cache[require.resolve("./utils/mongooseHelper")] = {
  exports: () => mongoose
};

// Import models after overriding the helper
const User = require("./models/User");
const WebsiteContent = require("./models/WebsiteContent");

async function seedComprehensiveContent() {
  try {
    // Connect to MongoDB
    mongoose.set("strictQuery", false);
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tamil-language-society", {
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log("Connected to real MongoDB for comprehensive content seeding");
    
    // Get admin user
    const adminUser = await User.findOne({ email: "admin@tamilsociety.org" });
    if (!adminUser) {
      console.error("Admin user not found. Please run seedRealData.js first.");
      process.exit(1);
    }

    // Clear existing website content
    await WebsiteContent.deleteMany({});
    console.log("Cleared existing website content");

    // Comprehensive website content data
    const contentData = [
      // HOME PAGE CONTENT
      {
        page: "home",
        section: "hero",
        sectionKey: "hero-main",
        sectionType: "hero",
        layout: "full-width",
        position: 1,
        title: {
          en: "Welcome to Tamil Language Society",
          ta: "தமிழ் மொழி சங்கத்திற்கு வரவேற்கிறோம்"
        },
        content: {
          en: "Preserving, promoting, and propagating the rich heritage of Tamil language and culture through education, literature, and community engagement.",
          ta: "கல்வி, இலக்கியம் மற்றும் சமூக ஈடுபாட்டின் மூலம் தமிழ் மொழி மற்றும் பண்பாட்டின் வளமான பாரம்பரியத்தை பாதுகாத்தல், மேம்படுத்துதல் மற்றும் பரப்புதல்."
        },
        buttonText: {
          en: "Explore Our Mission",
          ta: "எங்கள் நோக்கத்தை அறியுங்கள்"
        },
        buttonUrl: "/about",
        stylePreset: "modern",
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
          en: ["tamil", "language", "society", "culture", "heritage"],
          ta: ["தமிழ்", "மொழி", "சங்கம்", "பண்பாடு", "பாரம்பரியம்"]
        },
        images: [{
          url: "/assets/logo.jpeg",
          alt: {
            en: "Tamil Heritage and Culture",
            ta: "தமிழ் பாரம்பரியம் மற்றும் பண்பாடு"
          }
        }],
        videos: [],
        createdBy: adminUser._id
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
        stylePreset: "default",
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
          en: ["services", "education", "literature", "community"],
          ta: ["சேவைகள்", "கல்வி", "இலக்கியம்", "சமூகம்"]
        },
        images: [],
        videos: [],
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "statistics",
        sectionKey: "home-stats",
        sectionType: "statistics",
        layout: "grid",
        position: 3,
        title: {
          en: "Our Impact in Numbers",
          ta: "எண்களில் எங்கள் தாக்கம்"
        },
        content: {
          en: "See how we've been making a difference in the Tamil community over the years.",
          ta: "பல ஆண்டுகளாக தமிழ் சமூகத்தில் நாங்கள் எவ்வாறு மாற்றத்தை ஏற்படுத்தி வருகிறோம் என்பதைப் பாருங்கள்."
        },
        stylePreset: "modern",
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
          en: ["impact", "statistics", "community", "achievements"],
          ta: ["தாக்கம்", "புள்ளிவிவரங்கள்", "சமூகம்", "சாதனைகள்"]
        },
        images: [],
        videos: [],
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "testimonials",
        sectionKey: "home-testimonials",
        sectionType: "cards",
        layout: "two-column",
        position: 4,
        title: {
          en: "What Our Community Says",
          ta: "எங்கள் சமூகம் என்ன சொல்கிறது"
        },
        content: {
          en: "Hear from members of our community about their experiences with Tamil Language Society.",
          ta: "தமிழ் மொழி சங்கத்துடனான அவர்களின் அனுபவங்களைப் பற்றி எங்கள் சமூக உறுப்பினர்களிடமிருந்து கேளுங்கள்."
        },
        stylePreset: "elegant",
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
          en: ["testimonials", "community", "experiences", "feedback"],
          ta: ["சான்றுகள்", "சமூகம்", "அனுபவங்கள்", "கருத்துக்கள்"]
        },
        images: [],
        videos: [],
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "cta",
        sectionKey: "home-cta",
        sectionType: "cta",
        layout: "full-width",
        position: 5,
        title: {
          en: "Join Our Community Today",
          ta: "இன்றே எங்கள் சமூகத்தில் சேருங்கள்"
        },
        content: {
          en: "Become part of a vibrant community dedicated to preserving and promoting Tamil language and culture.",
          ta: "தமிழ் மொழி மற்றும் பண்பாட்டைப் பாதுகாத்து மேம்படுத்துவதற்கு அர்ப்பணிக்கப்பட்ட ஒரு துடிப்பான சமூகத்தின் ஒரு பகுதியாக மாறுங்கள்."
        },
        buttonText: {
          en: "Sign Up Now",
          ta: "இப்போதே பதிவு செய்யுங்கள்"
        },
        buttonUrl: "/signup",
        stylePreset: "bold",
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
          en: ["join", "community", "signup", "membership"],
          ta: ["சேரு", "சமூகம்", "பதிவு", "உறுப்பினர்"]
        },
        images: [],
        videos: [],
        createdBy: adminUser._id
      },

      // ABOUT PAGE CONTENT
      {
        page: "about",
        section: "hero",
        sectionKey: "about-hero",
        sectionType: "hero",
        layout: "full-width",
        position: 1,
        title: {
          en: "About Tamil Language Society",
          ta: "தமிழ் மொழி சங்கத்தைப் பற்றி"
        },
        content: {
          en: "Learn about our mission, vision, and the passionate team working to preserve Tamil heritage.",
          ta: "தமிழ் பாரம்பரியத்தைப் பாதுகாக்க உழைக்கும் எங்கள் நோக்கம், தொலைநோக்கு மற்றும் ஆர்வமுள்ள குழுவைப் பற்றி அறியுங்கள்."
        },
        stylePreset: "classic",
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
          en: ["about", "mission", "vision", "team"],
          ta: ["பற்றி", "நோக்கம்", "தொலைநோக்கு", "குழு"]
        },
        images: [{
          url: "/assets/default-avatar.jpg",
          alt: {
            en: "Tamil Language Society Team",
            ta: "தமிழ் மொழி சங்க குழு"
          }
        }],
        videos: [],
        createdBy: adminUser._id
      },
      {
        page: "about",
        section: "mission",
        sectionKey: "about-mission",
        sectionType: "text",
        layout: "full-width",
        position: 2,
        title: {
          en: "Our Mission",
          ta: "எங்கள் நோக்கம்"
        },
        content: {
          en: "To preserve, promote, and propagate the Tamil language and its rich cultural heritage through innovative educational programs, literary initiatives, and community engagement activities.",
          ta: "புதுமையான கல்வித் திட்டங்கள், இலக்கிய முயற்சிகள் மற்றும் சமூக ஈடுபாட்டு நடவடிக்கைகளின் மூலம் தமிழ் மொழி மற்றும் அதன் வளமான பண்பாட்டு பாரம்பரியத்தை பாதுகாத்தல், மேம்படுத்துதல் மற்றும் பரப்புதல்."
        },
        stylePreset: "default",
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
          en: ["mission", "preserve", "promote", "tamil", "heritage"],
          ta: ["நோக்கம்", "பாதுகாப்பு", "மேம்பாடு", "தமிழ்", "பாரம்பரியம்"]
        },
        images: [],
        videos: [],
        createdBy: adminUser._id
      },
      {
        page: "about",
        section: "vision",
        sectionKey: "about-vision",
        sectionType: "text",
        layout: "full-width",
        position: 3,
        title: {
          en: "Our Vision",
          ta: "எங்கள் தொலைநோக்கு"
        },
        content: {
          en: "To be the leading global organization for Tamil language preservation and cultural promotion, creating a world where Tamil heritage thrives across generations.",
          ta: "தமிழ் மொழி பாதுகாப்பு மற்றும் பண்பாட்டு மேம்பாட்டிற்கான முன்னணி உலகளாவிய அமைப்பாக இருப்பது, தலைமுறைகள் முழுவதும் தமிழ் பாரம்பரியம் செழித்து வளரும் உலகத்தை உருவாக்குவது."
        },
        stylePreset: "default",
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
          en: ["vision", "global", "preservation", "generations"],
          ta: ["தொலைநோக்கு", "உலகளாவிய", "பாதுகாப்பு", "தலைமுறைகள்"]
        },
        images: [],
        videos: [],
        createdBy: adminUser._id
      },
      {
        page: "about",
        section: "values",
        sectionKey: "about-values",
        sectionType: "feature-list",
        layout: "two-column",
        position: 4,
        title: {
          en: "Our Core Values",
          ta: "எங்கள் முக்கிய மதிப்புகள்"
        },
        content: {
          en: "The fundamental principles that guide our work and define our commitment to the Tamil community.",
          ta: "எங்கள் பணியை வழிநடத்தும் மற்றும் தமிழ் சமூகத்திற்கான எங்கள் அர்ப்பணிப்பை வரையறுக்கும் அடிப்படை கொள்கைகள்."
        },
        stylePreset: "modern",
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
          en: ["values", "principles", "commitment", "community"],
          ta: ["மதிப்புகள்", "கொள்கைகள்", "அர்ப்பணிப்பு", "சமூகம்"]
        },
        images: [],
        videos: [],
        createdBy: adminUser._id
      },
      {
        page: "about",
        section: "history",
        sectionKey: "about-history",
        sectionType: "text",
        layout: "full-width",
        position: 5,
        title: {
          en: "Our History",
          ta: "எங்கள் வரலாறு"
        },
        content: {
          en: "Founded with a passion for Tamil language and culture, our society has grown from a small group of enthusiasts to a thriving global community.",
          ta: "தமிழ் மொழி மற்றும் பண்பாட்டின் மீதான ஆர்வத்துடன் நிறுவப்பட்ட எங்கள் சங்கம், ஆர்வலர்களின் சிறிய குழுவிலிருந்து செழித்து வளரும் உலகளாவிய சமூகமாக வளர்ந்துள்ளது."
        },
        stylePreset: "classic",
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
          en: ["history", "founded", "growth", "community"],
          ta: ["வரலாறு", "நிறுவப்பட்டது", "வளர்ச்சி", "சமூகம்"]
        },
        images: [{
          url: "/assets/logo.jpeg",
          alt: {
            en: "Historical Timeline of Tamil Language Society",
            ta: "தமிழ் மொழி சங்கத்தின் வரலாற்று காலவரிசை"
          }
        }],
        videos: [],
        createdBy: adminUser._id
      }
    ];

    // Add more content for other pages...
    const additionalContent = [
      // BOOKS PAGE CONTENT
      {
        page: "books",
        section: "hero",
        sectionKey: "books-hero",
        sectionType: "hero",
        layout: "full-width",
        position: 1,
        title: {
          en: "Tamil Books Collection",
          ta: "தமிழ் நூல்கள் தொகுப்பு"
        },
        content: {
          en: "Explore our extensive collection of Tamil literature, from classical works to contemporary publications.",
          ta: "பாரம்பரிய படைப்புகள் முதல் சமகால வெளியீடுகள் வரை எங்கள் விரிவான தமிழ் இலக்கிய தொகுப்பை ஆராயுங்கள்."
        },
        stylePreset: "modern",
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
          en: ["books", "literature", "collection", "tamil"],
          ta: ["நூல்கள்", "இலக்கியம்", "தொகுப்பு", "தமிழ்"]
        },
        images: [{
          url: "/assets/books/default-book.jpg",
          alt: {
            en: "Tamil Books Collection",
            ta: "தமிழ் நூல்கள் தொகுப்பு"
          }
        }],
        videos: [],
        createdBy: adminUser._id
      },
      {
        page: "books",
        section: "categories",
        sectionKey: "books-categories",
        sectionType: "cards",
        layout: "grid",
        position: 2,
        title: {
          en: "Book Categories",
          ta: "நூல் வகைகள்"
        },
        content: {
          en: "Browse books by category to find exactly what you're looking for.",
          ta: "நீங்கள் தேடுவதை சரியாகக் கண்டறிய வகை வாரியாக நூல்களை உலாவுங்கள்."
        },
        stylePreset: "default",
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
          en: ["categories", "browse", "literature", "poetry"],
          ta: ["வகைகள்", "உலாவு", "இலக்கியம்", "கவிதை"]
        },
        images: [],
        videos: [],
        createdBy: adminUser._id
      },

      // EBOOKS PAGE CONTENT
      {
        page: "ebooks",
        section: "hero",
        sectionKey: "ebooks-hero",
        sectionType: "hero",
        layout: "full-width",
        position: 1,
        title: {
          en: "Digital Tamil Library",
          ta: "டிஜிட்டல் தமிழ் நூலகம்"
        },
        content: {
          en: "Access thousands of Tamil ebooks instantly. Read anywhere, anytime on any device.",
          ta: "ஆயிரக்கணக்கான தமிழ் மின்னூல்களை உடனடியாக அணுகுங்கள். எங்கு வேண்டுமானாலும், எப்போது வேண்டுமானாலும் எந்த சாதனத்திலும் படியுங்கள்."
        },
        stylePreset: "modern",
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
          en: ["ebooks", "digital", "library", "instant"],
          ta: ["மின்னூல்கள்", "டிஜிட்டல்", "நூலகம்", "உடனடி"]
        },
        images: [{
          url: "/assets/default-ebook-cover.jpg",
          alt: {
            en: "Digital Tamil Library",
            ta: "டிஜிட்டல் தமிழ் நூலகம்"
          }
        }],
        videos: [],
        createdBy: adminUser._id
      },

      // PROJECTS PAGE CONTENT
      {
        page: "projects",
        section: "hero",
        sectionKey: "projects-hero",
        sectionType: "hero",
        layout: "full-width",
        position: 1,
        title: {
          en: "Our Projects & Initiatives",
          ta: "எங்கள் திட்டங்கள் மற்றும் முயற்சிகள்"
        },
        content: {
          en: "Discover the various projects and initiatives we undertake to promote Tamil language and culture.",
          ta: "தமிழ் மொழி மற்றும் பண்பாட்டை மேம்படுத்த நாங்கள் மேற்கொள்ளும் பல்வேறு திட்டங்கள் மற்றும் முயற்சிகளைக் கண்டறியுங்கள்."
        },
        stylePreset: "bold",
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
          en: ["projects", "initiatives", "promote", "culture"],
          ta: ["திட்டங்கள்", "முயற்சிகள்", "மேம்படுத்து", "பண்பாடு"]
        },
        images: [{
          url: "/assets/default-project.jpg",
          alt: {
            en: "Tamil Language Projects",
            ta: "தமிழ் மொழி திட்டங்கள்"
          }
        }],
        videos: [],
        createdBy: adminUser._id
      },

      // CONTACT PAGE CONTENT
      {
        page: "contact",
        section: "hero",
        sectionKey: "contact-hero",
        sectionType: "hero",
        layout: "full-width",
        position: 1,
        title: {
          en: "Get in Touch",
          ta: "தொடர்பில் இருங்கள்"
        },
        content: {
          en: "We'd love to hear from you. Reach out to us for any questions, suggestions, or collaboration opportunities.",
          ta: "உங்களிடமிருந்து கேட்க விரும்புகிறோம். ஏதேனும் கேள்விகள், பரிந்துரைகள் அல்லது ஒத்துழைப்பு வாய்ப்புகளுக்கு எங்களை தொடர்பு கொள்ளுங்கள்."
        },
        stylePreset: "elegant",
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
          en: ["contact", "touch", "questions", "collaboration"],
          ta: ["தொடர்பு", "கேள்விகள்", "ஒத்துழைப்பு"]
        },
        images: [],
        videos: [],
        createdBy: adminUser._id
      },
      {
        page: "contact",
        section: "form",
        sectionKey: "contact-form",
        sectionType: "form",
        layout: "two-column",
        position: 2,
        title: {
          en: "Send us a Message",
          ta: "எங்களுக்கு ஒரு செய்தி அனுப்புங்கள்"
        },
        content: {
          en: "Fill out the form below and we'll get back to you as soon as possible.",
          ta: "கீழே உள்ள படிவத்தை நிரப்புங்கள், நாங்கள் விரைவில் உங்களைத் தொடர்பு கொள்வோம்."
        },
        stylePreset: "default",
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
          en: ["form", "message", "contact", "response"],
          ta: ["படிவம்", "செய்தி", "தொடர்பு", "பதில்"]
        },
        images: [],
        videos: [],
        createdBy: adminUser._id
      },

      // DONATE PAGE CONTENT
      {
        page: "donate",
        section: "hero",
        sectionKey: "donate-hero",
        sectionType: "hero",
        layout: "full-width",
        position: 1,
        title: {
          en: "Support Our Mission",
          ta: "எங்கள் நோக்கத்தை ஆதரியுங்கள்"
        },
        content: {
          en: "Your generous donations help us preserve and promote Tamil language and culture for future generations.",
          ta: "உங்கள் தாராள நன்கொடைகள் எதிர்கால தலைமுறைகளுக்காக தமிழ் மொழி மற்றும் பண்பாட்டைப் பாதுகாத்து மேம்படுத்த எங்களுக்கு உதவுகின்றன."
        },
        buttonText: {
          en: "Donate Now",
          ta: "இப்போது நன்கொடை அளியுங்கள்"
        },
        buttonUrl: "#donate-form",
        stylePreset: "bold",
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
          en: ["donate", "support", "mission", "generations"],
          ta: ["நன்கொடை", "ஆதரவு", "நோக்கம்", "தலைமுறைகள்"]
        },
        images: [{
          url: "/assets/logo.jpeg",
          alt: {
            en: "Support Tamil Language Mission",
            ta: "தமிழ் மொழி நோக்கத்தை ஆதரியுங்கள்"
          }
        }],
        videos: [],
        createdBy: adminUser._id
      }
    ];

    // Combine all content
    const allContent = [...contentData, ...additionalContent];

    // Add more content to reach 140+ entries
    const globalContent = [];
    
    // Add navigation content
    const navItems = [
      { key: "nav-home", title: { en: "Home", ta: "முகப்பு" }, url: "/" },
      { key: "nav-about", title: { en: "About", ta: "பற்றி" }, url: "/about" },
      { key: "nav-books", title: { en: "Books", ta: "நூல்கள்" }, url: "/books" },
      { key: "nav-ebooks", title: { en: "E-Books", ta: "மின்னூல்கள்" }, url: "/ebooks" },
      { key: "nav-projects", title: { en: "Projects", ta: "திட்டங்கள்" }, url: "/projects" },
      { key: "nav-contact", title: { en: "Contact", ta: "தொடர்பு" }, url: "/contact" },
      { key: "nav-donate", title: { en: "Donate", ta: "நன்கொடை" }, url: "/donate" }
    ];

    navItems.forEach((item, index) => {
      globalContent.push({
        page: "navigation",
        section: `nav-item-${index + 1}`,
        sectionKey: item.key,
        sectionType: "navigation",
        layout: "flex",
        position: index + 1,
        title: item.title,
        buttonUrl: item.url,
        stylePreset: "default",
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
          en: ["navigation", "menu"],
          ta: ["வழிசெலுத்தல்", "மெனு"]
        },
        images: [],
        videos: [],
        createdBy: adminUser._id
      });
    });

    // Add footer content
    const footerSections = [
      {
        key: "footer-about",
        title: { en: "About Us", ta: "எங்களைப் பற்றி" },
        content: { en: "Tamil Language Society is dedicated to preserving and promoting Tamil heritage.", ta: "தமிழ் மொழி சங்கம் தமிழ் பாரம்பரியத்தைப் பாதுகாத்து மேம்படுத்துவதற்கு அர்ப்பணிக்கப்பட்டுள்ளது." }
      },
      {
        key: "footer-contact",
        title: { en: "Contact Info", ta: "தொடர்பு தகவல்" },
        content: { en: "Get in touch with us for any inquiries or support.", ta: "ஏதேனும் விசாரணைகள் அல்லது ஆதரவுக்கு எங்களைத் தொடர்பு கொள்ளுங்கள்." }
      },
      {
        key: "footer-links",
        title: { en: "Quick Links", ta: "விரைவு இணைப்புகள்" },
        content: { en: "Navigate to important sections of our website.", ta: "எங்கள் வலைத்தளத்தின் முக்கியமான பிரிவுகளுக்கு செல்லுங்கள்." }
      },
      {
        key: "footer-social",
        title: { en: "Follow Us", ta: "எங்களைப் பின்தொடருங்கள்" },
        content: { en: "Stay connected with us on social media.", ta: "சமூக ஊடகங்களில் எங்களுடன் இணைந்திருங்கள்." }
      }
    ];

    footerSections.forEach((section, index) => {
      globalContent.push({
        page: "footer",
        section: `footer-section-${index + 1}`,
        sectionKey: section.key,
        sectionType: "footer",
        layout: "grid",
        position: index + 1,
        title: section.title,
        content: section.content,
        stylePreset: "default",
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
          en: ["footer", "links", "contact"],
          ta: ["அடிக்குறிப்பு", "இணைப்புகள்", "தொடர்பு"]
        },
        images: [],
        videos: [],
        createdBy: adminUser._id
      });
    });

    // Add more detailed content for each page to reach 140+ entries
    const detailedContent = [];
    
    // Add FAQ content
    const faqItems = [
      {
        question: { en: "How can I become a member?", ta: "நான் எப்படி உறுப்பினராக முடியும்?" },
        answer: { en: "You can become a member by signing up on our website and choosing a membership plan.", ta: "எங்கள் வலைத்தளத்தில் பதிவு செய்து உறுப்பினர் திட்டத்தைத் தேர்ந்தெடுப்பதன் மூலம் நீங்கள் உறுப்பினராக முடியும்." }
      },
      {
        question: { en: "What services do you offer?", ta: "நீங்கள் என்ன சேவைகளை வழங்குகிறீர்கள்?" },
        answer: { en: "We offer books, ebooks, educational programs, cultural events, and community projects.", ta: "நாங்கள் புத்தகங்கள், மின்னூல்கள், கல்வித் திட்டங்கள், கலாச்சார நிகழ்வுகள் மற்றும் சமூக திட்டங்களை வழங்குகிறோம்." }
      },
      {
        question: { en: "How can I contribute to your projects?", ta: "உங்கள் திட்டங்களுக்கு நான் எப்படி பங்களிக்க முடியும்?" },
        answer: { en: "You can contribute through donations, volunteering, or participating in our programs.", ta: "நன்கொடைகள், தன்னார்வத் தொண்டு அல்லது எங்கள் திட்டங்களில் பங்கேற்பதன் மூலம் நீங்கள் பங்களிக்க முடியும்." }
      }
    ];

    faqItems.forEach((faq, index) => {
      detailedContent.push({
        page: "faq",
        section: `question-${index + 1}`,
        sectionKey: `faq-${index + 1}`,
        sectionType: "text",
        layout: "full-width",
        position: index + 1,
        title: faq.question,
        content: faq.answer,
        stylePreset: "default",
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
          en: ["faq", "questions", "answers"],
          ta: ["அடிக்கடி கேட்கப்படும் கேள்விகள்", "கேள்விகள்", "பதில்கள்"]
        },
        images: [],
        videos: [],
        createdBy: adminUser._id
      });
    });

    // Add testimonials content
    const testimonials = [
      {
        name: "Priya Sharma",
        title: { en: "Excellent Resources", ta: "சிறந்த வளங்கள்" },
        content: { en: "The Tamil Language Society has been instrumental in helping me learn Tamil literature.", ta: "தமிழ் இலக்கியம் கற்க எனக்கு உதவுவதில் தமிழ் மொழி சங்கம் முக்கிய பங்கு வகித்துள்ளது." }
      },
      {
        name: "Rajesh Kumar",
        title: { en: "Great Community", ta: "சிறந்த சமூகம்" },
        content: { en: "I love being part of this vibrant community that celebrates Tamil culture.", ta: "தமிழ் பண்பாட்டைக் கொண்டாடும் இந்த துடிப்பான சமூகத்தின் ஒரு பகுதியாக இருப்பதை நான் விரும்புகிறேன்." }
      },
      {
        name: "Meera Devi",
        title: { en: "Educational Excellence", ta: "கல்வி சிறப்பு" },
        content: { en: "The educational programs offered here are top-notch and very comprehensive.", ta: "இங்கே வழங்கப்படும் கல்வித் திட்டங்கள் உயர்தரமானவை மற்றும் மிகவும் விரிவானவை." }
      }
    ];

    testimonials.forEach((testimonial, index) => {
      detailedContent.push({
        page: "testimonials",
        section: `review-${index + 1}`,
        sectionKey: `testimonial-${index + 1}`,
        sectionType: "cards",
        layout: "grid",
        position: index + 1,
        title: testimonial.title,
        content: testimonial.content,
        subtitle: {
          en: `- ${testimonial.name}`,
          ta: `- ${testimonial.name}`
        },
        stylePreset: "elegant",
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
          en: ["testimonials", "reviews", "community"],
          ta: ["சான்றுகள்", "மதிப்புரைகள்", "சமூகம்"]
        },
        images: [],
        videos: [],
        createdBy: adminUser._id
      });
    });

    // Combine all content arrays
    const finalContent = [...allContent, ...globalContent, ...detailedContent];

    // Add more generic content to reach 140+ entries
    const additionalGenericContent = [];
    const pages = ["home", "about", "books", "ebooks", "projects", "contact", "donate", "services", "testimonials", "faq", "team", "announcements", "activities"];
    const sectionTypes = ["banner", "cta", "feature-list", "gallery", "statistics", "text", "cards", "hero", "form"];
    const layouts = ["full-width", "two-column", "three-column", "grid", "flex"];
    
    for (let i = 0; i < 120; i++) {
      const page = pages[i % pages.length];
      const sectionType = sectionTypes[i % sectionTypes.length];
      const layout = layouts[i % layouts.length];
      
      additionalGenericContent.push({
        page: page,
        section: `content-section-${i + 1}`,
        sectionKey: `${page}-content-${i + 1}`,
        sectionType: sectionType,
        layout: layout,
        position: i + 100,
        title: {
          en: `${page.charAt(0).toUpperCase() + page.slice(1)} Content ${i + 1}`,
          ta: `${page} உள்ளடக்கம் ${i + 1}`
        },
        content: {
          en: `This is comprehensive content for ${page} page section ${i + 1}. It provides detailed information about our services and offerings.`,
          ta: `இது ${page} பக்க பிரிவு ${i + 1} க்கான விரிவான உள்ளடக்கம். இது எங்கள் சேவைகள் மற்றும் வழங்கல்கள் பற்றிய விரிவான தகவல்களை வழங்குகிறது.`
        },
        subtitle: {
          en: `Subtitle for ${page} section ${i + 1}`,
          ta: `${page} பிரிவு ${i + 1} க்கான துணைத்தலைப்பு`
        },
        buttonText: {
          en: "Learn More",
          ta: "மேலும் அறிய"
        },
        buttonUrl: `/${page}#section-${i + 1}`,
        stylePreset: i % 2 === 0 ? "default" : "modern",
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
          en: [page, "content", "section", "tamil", "language"],
          ta: [page, "உள்ளடக்கம்", "பிரிவு", "தமிழ்", "மொழி"]
        },
        images: i % 3 === 0 ? [{
          url: `/assets/default-${page === "books" ? "book" : page === "ebooks" ? "ebook-cover" : "avatar"}.jpg`,
          alt: {
            en: `${page} section ${i + 1} image`,
            ta: `${page} பிரிவு ${i + 1} படம்`
          },
          caption: {
            en: `Caption for ${page} section ${i + 1}`,
            ta: `${page} பிரிவு ${i + 1} க்கான தலைப்பு`
          },
          order: 1
        }] : [],
        videos: [],
        createdBy: adminUser._id
      });
    }

    // Final content array with 140+ entries
    const completeContent = [...finalContent, ...additionalGenericContent];

    // Insert all content
    await WebsiteContent.insertMany(completeContent);
    console.log(`Successfully seeded ${completeContent.length} website content entries`);

    console.log("\nComprehensive website content seeding completed successfully!");
    console.log(`Total entries: ${completeContent.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error during comprehensive content seeding:", error);
    process.exit(1);
  }
}

seedComprehensiveContent();