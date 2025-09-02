const mongoose = require("mongoose");
const dotenv = require("dotenv");
const WebsiteContent = require("../models/WebsiteContent");
const User = require("../models/User");

// Load environment variables
dotenv.config({ path: "../config/.env" });

const seedContent = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/tamilsociety");
    console.log("MongoDB Connected for seeding...");

    // Create a default admin user if none exists
    let adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL || "admin@tamilsociety.org" });
    if (!adminUser) {
      adminUser = await User.create({
        name: "Admin User",
        email: process.env.ADMIN_EMAIL || "admin@tamilsociety.org",
        password: "admin123", // This will be hashed by the model
        role: "admin"
      });
      console.log("Admin user created");
    }

    // Clear existing content
    await WebsiteContent.deleteMany({});
    console.log("Existing content cleared");

    // Seed homepage content
    const homeContent = [
      // Hero Section
      {
        page: "home",
        section: "heroTitle",
        sectionKey: "home.heroTitle",
        title: "Tamil Language Society",
        titleTamil: "தமிழ்ப் பேரவை",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "heroSubtitle",
        sectionKey: "home.heroSubtitle",
        title: "Preserving Tamil Heritage for Future Generations",
        titleTamil: "எதிர்கால சந்ததியினருக்காக தமிழ் பாரம்பரியத்தைப் பாதுகாத்தல்",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "heroQuote",
        sectionKey: "home.heroQuote",
        title: "யாமறிந்த மொழிகளிலே தமிழ்மொழி போல் இனிதாவது எங்கும் காணோம்",
        titleTamil: "யாமறிந்த மொழிகளிலே தமிழ்மொழி போல் இனிதாவது எங்கும் காணோம்",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "heroButton1",
        sectionKey: "home.heroButton1",
        buttonText: "Explore Books",
        buttonTextTamil: "புத்தகங்களை ஆராயுங்கள்",
        buttonUrl: "books.html",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "heroButton2",
        sectionKey: "home.heroButton2",
        buttonText: "Join Community",
        buttonTextTamil: "சமூகத்தில் சேருங்கள்",
        buttonUrl: "signup.html",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "heroImage",
        sectionKey: "home.heroImage",
        image: "assets/logo.jpeg",
        title: "Tamil Language Society Logo",
        titleTamil: "தமிழ்ப் பேரவை சின்னம்",
        createdBy: adminUser._id
      },
      // Announcements Section
      {
        page: "home",
        section: "announcementsTitle",
        sectionKey: "home.announcementsTitle",
        title: "Latest Announcements",
        titleTamil: "சமீபத்திய அறிவிப்புகள்",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "announcementsImage",
        sectionKey: "home.announcementsImage",
        image: "assets/default-project.jpg",
        title: "Announcements",
        titleTamil: "அறிவிப்புகள்",
        createdBy: adminUser._id
      },
      // Features Section
      {
        page: "home",
        section: "featuresTitle",
        sectionKey: "home.featuresTitle",
        title: "Our Services",
        titleTamil: "எங்கள் சேவைகள்",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "feature1Image",
        sectionKey: "home.feature1Image",
        image: "assets/default-ebook.svg",
        title: "Digital Library",
        titleTamil: "டிஜிட்டல் நூலகம்",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "feature1Title",
        sectionKey: "home.feature1Title",
        title: "Digital Library",
        titleTamil: "டிஜிட்டல் நூலகம்",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "feature1Description",
        sectionKey: "home.feature1Description",
        content: "Access thousands of Tamil ebooks and digital resources",
        contentTamil: "ஆயிரக்கணக்கான தமிழ் மின்னூல்கள் மற்றும் டிஜிட்டல் வளங்களை அணுகுங்கள்",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "feature1Button",
        sectionKey: "home.feature1Button",
        buttonText: "Browse Ebooks",
        buttonTextTamil: "மின்னூல்களைப் பார்வையிடுங்கள்",
        buttonUrl: "ebooks.html",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "feature2Image",
        sectionKey: "home.feature2Image",
        image: "assets/default-book.svg",
        title: "Book Store",
        titleTamil: "புத்தக கடை",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "feature2Title",
        sectionKey: "home.feature2Title",
        title: "Book Store",
        titleTamil: "புத்தக கடை",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "feature2Description",
        sectionKey: "home.feature2Description",
        content: "Browse and purchase physical Tamil books",
        contentTamil: "தமிழ் புத்தகங்களை உலாவி வாங்குங்கள்",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "feature2Button",
        sectionKey: "home.feature2Button",
        buttonText: "Shop Books",
        buttonTextTamil: "புத்தகங்களை வாங்குங்கள்",
        buttonUrl: "books.html",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "feature3Image",
        sectionKey: "home.feature3Image",
        image: "assets/default-project.jpg",
        title: "Projects",
        titleTamil: "திட்டங்கள்",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "feature3Title",
        sectionKey: "home.feature3Title",
        title: "Cultural Projects",
        titleTamil: "கலாச்சார திட்டங்கள்",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "feature3Description",
        sectionKey: "home.feature3Description",
        content: "Participate in Tamil cultural preservation projects",
        contentTamil: "தமிழ் கலாச்சார பாதுகாப்பு திட்டங்களில் பங்கேற்கவும்",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "feature3Button",
        sectionKey: "home.feature3Button",
        buttonText: "View Projects",
        buttonTextTamil: "திட்டங்களைப் பார்க்கவும்",
        buttonUrl: "projects.html",
        createdBy: adminUser._id
      },
      // Statistics Section
      {
        page: "home",
        section: "stat1Number",
        sectionKey: "home.stat1Number",
        title: "5000+",
        titleTamil: "5000+",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "stat1Label",
        sectionKey: "home.stat1Label",
        title: "Books",
        titleTamil: "புத்தகங்கள்",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "stat2Number",
        sectionKey: "home.stat2Number",
        title: "2500+",
        titleTamil: "2500+",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "stat2Label",
        sectionKey: "home.stat2Label",
        title: "Community Members",
        titleTamil: "சமூக உறுப்பினர்கள்",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "stat3Number",
        sectionKey: "home.stat3Number",
        title: "25+",
        titleTamil: "25+",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "stat3Label",
        sectionKey: "home.stat3Label",
        title: "Years of Service",
        titleTamil: "சேவை ஆண்டுகள்",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "stat4Number",
        sectionKey: "home.stat4Number",
        title: "150+",
        titleTamil: "150+",
        createdBy: adminUser._id
      },
      {
        page: "home",
        section: "stat4Label",
        sectionKey: "home.stat4Label",
        title: "Active Projects",
        titleTamil: "செயலில் உள்ள திட்டங்கள்",
        createdBy: adminUser._id
      }
    ];

    // Seed about page content
    const aboutContent = [
      {
        page: "about",
        section: "mission",
        sectionKey: "about.mission",
        title: "Our Mission",
        content: "To preserve, promote, and celebrate Tamil literature and culture while making it accessible to people worldwide.",
        createdBy: adminUser._id
      },
      {
        page: "about",
        section: "vision",
        sectionKey: "about.vision",
        title: "Our Vision",
        content: "A world where Tamil literature thrives and continues to inspire future generations.",
        createdBy: adminUser._id
      },
      {
        page: "about",
        section: "history",
        sectionKey: "about.history",
        title: "Our History",
        content: "Founded with the vision of preserving Tamil literary heritage, our society has been serving the community for years.",
        createdBy: adminUser._id
      }
    ];

    // Seed contact page content
    const contactContent = [
      {
        page: "contact",
        section: "info",
        sectionKey: "contact.info",
        title: "Get in Touch",
        content: "We would love to hear from you. Send us a message and we will respond as soon as possible.",
        metadata: {
          address: "Tamil Language Society, Chennai, Tamil Nadu, India",
          phone: "+91 1234567890",
          email: "contact@tamilsociety.org",
          hours: "Monday - Friday: 9:00 AM - 6:00 PM"
        },
        createdBy: adminUser._id
      }
    ];

    // Seed navigation content
    const navigationContent = [
      {
        page: "navigation",
        section: "logoImage",
        sectionKey: "navigation.logoImage",
        image: "assets/logo.jpeg",
        title: "Tamil Language Society",
        titleTamil: "தமிழ்ப் பேரவை",
        createdBy: adminUser._id
      },
      {
        page: "navigation",
        section: "logoText",
        sectionKey: "navigation.logoText",
        title: "Tamil Language Society",
        titleTamil: "தமிழ்ப் பேரவை",
        createdBy: adminUser._id
      },
      {
        page: "navigation",
        section: "homeLink",
        sectionKey: "navigation.homeLink",
        title: "Home",
        titleTamil: "முகப்பு",
        buttonUrl: "index.html",
        createdBy: adminUser._id
      },
      {
        page: "navigation",
        section: "aboutLink",
        sectionKey: "navigation.aboutLink",
        title: "About Us",
        titleTamil: "எங்களைப் பற்றி",
        buttonUrl: "about.html",
        createdBy: adminUser._id
      },
      {
        page: "navigation",
        section: "projectsLink",
        sectionKey: "navigation.projectsLink",
        title: "Projects",
        titleTamil: "திட்டங்கள்",
        buttonUrl: "projects.html",
        createdBy: adminUser._id
      },
      {
        page: "navigation",
        section: "ebooksLink",
        sectionKey: "navigation.ebooksLink",
        title: "Ebooks",
        titleTamil: "மின்னூல்கள்",
        buttonUrl: "ebooks.html",
        createdBy: adminUser._id
      },
      {
        page: "navigation",
        section: "booksLink",
        sectionKey: "navigation.booksLink",
        title: "Book Store",
        titleTamil: "புத்தக கடை",
        buttonUrl: "books.html",
        createdBy: adminUser._id
      },
      {
        page: "navigation",
        section: "contactLink",
        sectionKey: "navigation.contactLink",
        title: "Contact Us",
        titleTamil: "எங்களைத் தொடர்பு கொள்ளுங்கள்",
        buttonUrl: "contact.html",
        createdBy: adminUser._id
      },

      {
        page: "navigation",
        section: "loginLink",
        sectionKey: "navigation.loginLink",
        title: "Login",
        titleTamil: "உள்நுழைய",
        buttonUrl: "login.html",
        createdBy: adminUser._id
      },
      {
        page: "navigation",
        section: "signupLink",
        sectionKey: "navigation.signupLink",
        title: "Sign Up",
        titleTamil: "பதிவு செய்யுங்கள்",
        buttonUrl: "signup.html",
        createdBy: adminUser._id
      }
    ];

    // Seed footer content
    const footerContent = [
      {
        page: "footer",
        section: "logoImage",
        sectionKey: "footer.logoImage",
        image: "assets/logo.jpeg",
        title: "Tamil Language Society",
        titleTamil: "தமிழ்ப் பேரவை",
        createdBy: adminUser._id
      },
      {
        page: "footer",
        section: "logoText",
        sectionKey: "footer.logoText",
        title: "Tamil Language Society",
        titleTamil: "தமிழ்ப் பேரவை",
        createdBy: adminUser._id
      },
      {
        page: "footer",
        section: "description",
        sectionKey: "footer.description",
        content: "Preserving and promoting Tamil literature and culture for future generations.",
        contentTamil: "எதிர்கால சந்ததியினருக்காக தமிழ் இலக்கியம் மற்றும் கலாச்சாரத்தைப் பாதுகாத்து ஊக்குவித்தல்.",
        createdBy: adminUser._id
      },
      {
        page: "footer",
        section: "quickLink1",
        sectionKey: "footer.quickLink1",
        title: "About Us",
        titleTamil: "எங்களைப் பற்றி",
        buttonUrl: "about.html",
        createdBy: adminUser._id
      },
      {
        page: "footer",
        section: "quickLink2",
        sectionKey: "footer.quickLink2",
        title: "Books",
        titleTamil: "புத்தகங்கள்",
        buttonUrl: "books.html",
        createdBy: adminUser._id
      },
      {
        page: "footer",
        section: "quickLink3",
        sectionKey: "footer.quickLink3",
        title: "E-books",
        titleTamil: "மின்னூல்கள்",
        buttonUrl: "ebooks.html",
        createdBy: adminUser._id
      },
      {
        page: "footer",
        section: "quickLink4",
        sectionKey: "footer.quickLink4",
        title: "Projects",
        titleTamil: "திட்டங்கள்",
        buttonUrl: "projects.html",
        createdBy: adminUser._id
      },
      {
        page: "footer",
        section: "supportLink1",
        sectionKey: "footer.supportLink1",
        title: "Contact",
        titleTamil: "தொடர்பு",
        buttonUrl: "contact.html",
        createdBy: adminUser._id
      },

      {
        page: "footer",
        section: "supportLink3",
        sectionKey: "footer.supportLink3",
        title: "Privacy Policy",
        titleTamil: "தனியுரிமைக் கொள்கை",
        buttonUrl: "privacy.html",
        createdBy: adminUser._id
      },
      {
        page: "footer",
        section: "supportLink4",
        sectionKey: "footer.supportLink4",
        title: "Terms of Service",
        titleTamil: "சேவை விதிமுறைகள்",
        buttonUrl: "terms.html",
        createdBy: adminUser._id
      },
      {
        page: "footer",
        section: "newsletterTitle",
        sectionKey: "footer.newsletterTitle",
        title: "Newsletter",
        titleTamil: "செய்திமடல்",
        createdBy: adminUser._id
      },
      {
        page: "footer",
        section: "newsletterDescription",
        sectionKey: "footer.newsletterDescription",
        content: "Stay updated with our latest news and events",
        contentTamil: "எங்கள் சமீபத்திய செய்திகள் மற்றும் நிகழ்வுகளுடன் புதுப்பித்த நிலையில் இருங்கள்",
        createdBy: adminUser._id
      },
      {
        page: "footer",
        section: "newsletterPlaceholder",
        sectionKey: "footer.newsletterPlaceholder",
        title: "Enter your email",
        titleTamil: "உங்கள் மின்னஞ்சலை உள்ளிடுங்கள்",
        createdBy: adminUser._id
      },
      {
        page: "footer",
        section: "newsletterButton",
        sectionKey: "footer.newsletterButton",
        buttonText: "Subscribe",
        buttonTextTamil: "குழுசேர்",
        createdBy: adminUser._id
      },
      {
        page: "footer",
        section: "socialFacebook",
        sectionKey: "footer.socialFacebook",
        title: "Facebook",
        titleTamil: "பேஸ்புக்",
        buttonUrl: "https://facebook.com/tamillanguagesociety",
        createdBy: adminUser._id
      },
      {
        page: "footer",
        section: "socialTwitter",
        sectionKey: "footer.socialTwitter",
        title: "Twitter",
        titleTamil: "ட்விட்டர்",
        buttonUrl: "https://twitter.com/tamillanguagesociety",
        createdBy: adminUser._id
      },
      {
        page: "footer",
        section: "socialInstagram",
        sectionKey: "footer.socialInstagram",
        title: "Instagram",
        titleTamil: "இன்ஸ்டாகிராம்",
        buttonUrl: "https://instagram.com/tamillanguagesociety",
        createdBy: adminUser._id
      },
      {
        page: "footer",
        section: "socialYoutube",
        sectionKey: "footer.socialYoutube",
        title: "YouTube",
        titleTamil: "யூடியூப்",
        buttonUrl: "https://youtube.com/tamillanguagesociety",
        createdBy: adminUser._id
      },
      {
        page: "footer",
        section: "copyright",
        sectionKey: "footer.copyright",
        content: "© 2024 Tamil Language Society. All rights reserved.",
        contentTamil: "© 2024 தமிழ்ப் பேரவை. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
        createdBy: adminUser._id
      }
    ];

    // Insert all content
    await WebsiteContent.insertMany([...homeContent, ...aboutContent, ...contactContent, ...navigationContent, ...footerContent]);
    console.log("Website content seeded successfully");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding content:", error);
    process.exit(1);
  }
};

seedContent();