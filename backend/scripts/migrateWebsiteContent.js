const mongoose = require("mongoose");
const WebsiteContent = require("../models/WebsiteContent");
const User = require("../models/User");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/tls_website", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Default admin user ID (will be fetched from database)
let defaultAdminId = null;

// Website content data extracted from HTML files
const websiteContentData = [
  // HOME PAGE CONTENT
  {
    page: "home",
    section: "navigation",
    sectionKey: "nav_home",
    sectionType: "text",
    layout: "full-width",
    position: 1,
    title: "Home",
    titleTamil: "முகப்பு",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 1
  },
  {
    page: "home",
    section: "navigation",
    sectionKey: "nav_about",
    sectionType: "text",
    layout: "full-width",
    position: 2,
    title: "About",
    titleTamil: "எங்களைப் பற்றி",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 2
  },
  {
    page: "home",
    section: "navigation",
    sectionKey: "nav_books",
    sectionType: "text",
    layout: "full-width",
    position: 3,
    title: "Books",
    titleTamil: "புத்தகங்கள்",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 3
  },
  {
    page: "home",
    section: "navigation",
    sectionKey: "nav_ebooks",
    sectionType: "text",
    layout: "full-width",
    position: 4,
    title: "E-Books",
    titleTamil: "மின்னூல்கள்",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 4
  },
  {
    page: "home",
    section: "navigation",
    sectionKey: "nav_projects",
    sectionType: "text",
    layout: "full-width",
    position: 5,
    title: "Projects",
    titleTamil: "திட்டங்கள்",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 5
  },
  {
    page: "home",
    section: "navigation",
    sectionKey: "nav_contact",
    sectionType: "text",
    layout: "full-width",
    position: 6,
    title: "Contact",
    titleTamil: "தொடர்பு",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 6
  },
  {
    page: "home",
    section: "hero",
    sectionKey: "hero_title",
    sectionType: "text",
    layout: "full-width",
    position: 1,
    title: "Tamil Language Society",
    titleTamil: "தமிழ் இலக்கிய சங்கம்",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 1
  },
  {
    page: "home",
    section: "hero",
    sectionKey: "hero_subtitle",
    sectionType: "text",
    layout: "full-width",
    position: 2,
    title: "Preserving Tamil Literature and Culture",
    titleTamil: "தமிழ் இலக்கியம் மற்றும் கலாச்சாரத்தை பாதுகாத்தல்",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 2
  },
  {
    page: "home",
    section: "hero",
    sectionKey: "hero_quote",
    sectionType: "text",
    layout: "full-width",
    position: 3,
    title: "யாமறிந்த மொழிகளிலே தமிழ்மொழி போல் இனிதாவது எங்கும் காணோம்",
    titleTamil: "யாமறிந்த மொழிகளிலே தமிழ்மொழி போல் இனிதாவது எங்கும் காணோம்",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 3
  },
  {
    page: "home",
    section: "hero",
    sectionKey: "hero_cta_primary",
    sectionType: "cta",
    layout: "full-width",
    position: 4,
    buttonText: "Explore Books",
    buttonTextTamil: "புத்தகங்களை ஆராயுங்கள்",
    buttonUrl: "/books.html",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 4
  },
  {
    page: "home",
    section: "hero",
    sectionKey: "hero_cta_secondary",
    sectionType: "cta",
    layout: "full-width",
    position: 5,
    buttonText: "Learn More",
    buttonTextTamil: "மேலும் அறிக",
    buttonUrl: "/about.html",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 5
  },
  {
    page: "home",
    section: "hero",
    sectionKey: "hero_image",
    sectionType: "image",
    layout: "full-width",
    position: 6,
    images: [{
      url: "/assets/logo.jpeg",
      alt: "Tamil Language Society Logo",
                caption: "Tamil Language Society",
      order: 1
    }],
    isActive: true,
    isVisible: true,
    order: 6
  },
  // ANNOUNCEMENTS SECTION
  {
    page: "home",
    section: "announcements",
    sectionKey: "announcements_title",
    sectionType: "text",
    layout: "full-width",
    position: 1,
    title: "Latest Announcements",
    titleTamil: "சமீபத்திய அறிவிப்புகள்",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 1
  },
  // FEATURES SECTION
  {
    page: "home",
    section: "features",
    sectionKey: "features_title",
    sectionType: "text",
    layout: "full-width",
    position: 1,
    title: "Our Features",
    titleTamil: "எங்கள் அம்சங்கள்",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 1
  },
  {
    page: "home",
    section: "features",
    sectionKey: "feature_ebooks_title",
    sectionType: "text",
    layout: "grid",
    position: 2,
    title: "Digital Library",
    titleTamil: "டிஜிட்டல் நூலகம்",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 2
  },
  {
    page: "home",
    section: "features",
    sectionKey: "feature_ebooks_desc",
    sectionType: "text",
    layout: "grid",
    position: 3,
    title: "Access our vast collection of Tamil e-books",
    titleTamil: "எங்கள் பரந்த தமிழ் மின்னூல் தொகுப்பை அணுகவும்",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 3
  },
  {
    page: "home",
    section: "features",
    sectionKey: "feature_projects_title",
    sectionType: "text",
    layout: "grid",
    position: 4,
    title: "Cultural Projects",
    titleTamil: "கலாச்சார திட்டங்கள்",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 4
  },
  {
    page: "home",
    section: "features",
    sectionKey: "feature_projects_desc",
    sectionType: "text",
    layout: "grid",
    position: 5,
    title: "Participate in our cultural preservation initiatives",
    titleTamil: "எங்கள் கலாச்சார பாதுகாப்பு முயற்சிகளில் பங்கேற்கவும்",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 5
  },
  {
    page: "home",
    section: "features",
    sectionKey: "feature_bookstore_title",
    sectionType: "text",
    layout: "grid",
    position: 6,
    title: "Online Bookstore",
    titleTamil: "ஆன்லைன் புத்தக கடை",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 6
  },
  {
    page: "home",
    section: "features",
    sectionKey: "feature_bookstore_desc",
    sectionType: "text",
    layout: "grid",
    position: 7,
    title: "Purchase authentic Tamil literature",
    titleTamil: "உண்மையான தமிழ் இலக்கியங்களை வாங்கவும்",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 7
  },
  {
    page: "home",
    section: "features",
    sectionKey: "feature_contact_title",
    sectionType: "text",
    layout: "grid",
    position: 8,
    title: "Community Connect",
    titleTamil: "சமூக தொடர்பு",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 8
  },
  {
    page: "home",
    section: "features",
    sectionKey: "feature_contact_desc",
    sectionType: "text",
    layout: "grid",
    position: 9,
    title: "Connect with fellow Tamil literature enthusiasts",
    titleTamil: "தமிழ் இலக்கிய ஆர்வலர்களுடன் தொடர்பு கொள்ளுங்கள்",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 9
  },
  // STATISTICS SECTION
  {
    page: "home",
    section: "statistics",
    sectionKey: "stats_title",
    sectionType: "text",
    layout: "full-width",
    position: 1,
    title: "Our Impact",
    titleTamil: "எங்கள் தாக்கம்",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 1
  },
  // FOOTER CONTENT
  {
    page: "home",
    section: "footer",
    sectionKey: "footer_about_title",
    sectionType: "text",
    layout: "full-width",
    position: 1,
    title: "About TLS",
    titleTamil: "TLS பற்றி",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 1
  },
  {
    page: "home",
    section: "footer",
    sectionKey: "footer_about_desc",
    sectionType: "text",
    layout: "full-width",
    position: 2,
    title: "Dedicated to preserving and promoting Tamil literature and culture for future generations.",
    titleTamil: "எதிர்கால சந்ததியினருக்காக தமிழ் இலக்கியம் மற்றும் கலாச்சாரத்தை பாதுகாத்து ஊக்குவிப்பதில் அர்ப்பணிப்புடன்.",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 2
  },
  {
    page: "home",
    section: "footer",
    sectionKey: "footer_quick_links_title",
    sectionType: "text",
    layout: "full-width",
    position: 3,
    title: "Quick Links",
    titleTamil: "விரைவு இணைப்புகள்",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 3
  },
  {
    page: "home",
    section: "footer",
    sectionKey: "footer_contact_title",
    sectionType: "text",
    layout: "full-width",
    position: 4,
    title: "Contact Info",
    titleTamil: "தொடர்பு தகவல்",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 4
  },
  {
    page: "home",
    section: "footer",
    sectionKey: "footer_copyright",
    sectionType: "text",
    layout: "full-width",
    position: 5,
    title: "© 2024 Tamil Language Society. All rights reserved.",
    titleTamil: "© 2024 தமிழ் இலக்கிய சங்கம். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 5
  },

  // ABOUT PAGE CONTENT
  {
    page: "about",
    section: "hero",
    sectionKey: "about_hero_title",
    sectionType: "text",
    layout: "full-width",
    position: 1,
    title: "About Tamil Language Society",
    titleTamil: "தமிழ் இலக்கிய சங்கம் பற்றி",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 1
  },
  {
    page: "about",
    section: "hero",
    sectionKey: "about_hero_subtitle",
    sectionType: "text",
    layout: "full-width",
    position: 2,
    title: "Preserving the Rich Heritage of Tamil Literature",
    titleTamil: "தமிழ் இலக்கியத்தின் வளமான பாரம்பரியத்தை பாதுகாத்தல்",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 2
  },
  {
    page: "about",
    section: "history",
    sectionKey: "history_title",
    sectionType: "text",
    layout: "full-width",
    position: 1,
    title: "Our History",
    titleTamil: "எங்கள் வரலாறு",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 1
  },
  {
    page: "about",
    section: "history",
    sectionKey: "history_content",
    sectionType: "text",
    layout: "full-width",
    position: 2,
    title: "Founded with the vision of preserving and promoting Tamil literature, our society has been a beacon of cultural preservation for decades.",
    titleTamil: "தமிழ் இலக்கியத்தை பாதுகாத்து ஊக்குவிக்கும் நோக்கத்துடன் நிறுவப்பட்ட எங்கள் சங்கம் பல தசாப்தங்களாக கலாச்சார பாதுகாப்பின் கலங்கரை விளக்காக இருந்து வருகிறது.",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 2
  },
  {
    page: "about",
    section: "values",
    sectionKey: "values_title",
    sectionType: "text",
    layout: "full-width",
    position: 1,
    title: "Our Values",
    titleTamil: "எங்கள் மதிப்புகள்",
    isActive: true,
    isVisible: true,
    hasTamilTranslation: true,
    order: 1
  }
];

async function migrateContent() {
  try {
    console.log("Starting website content migration...");
    
    // Find or create a default admin user for createdBy field
    let adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      console.log("No admin user found, creating default admin...");
      adminUser = new User({
        username: "migration-admin",
        email: "admin@tls.com",
        password: "temp-password",
        role: "admin",
        isActive: true
      });
      await adminUser.save();
    }
    defaultAdminId = adminUser._id;
    console.log(`Using admin user: ${adminUser.username} (${defaultAdminId})`);
    
    // Add createdBy to all content items
    const contentWithCreator = websiteContentData.map(item => ({
      ...item,
      createdBy: defaultAdminId
    }));
    
    // Clear existing content to avoid duplicates
    await WebsiteContent.deleteMany({});
    console.log("Cleared existing website content.");
    
    // Insert new content with error handling for duplicates
    let insertedCount = 0;
    for (const item of contentWithCreator) {
      try {
        await WebsiteContent.create(item);
        insertedCount++;
      } catch (err) {
        if (err.code === 11000) {
          console.log(`Skipping duplicate: ${item.page} - ${item.section}`);
        } else {
          throw err;
        }
      }
    }
    console.log(`Successfully migrated ${insertedCount} content items.`);
    
    // Display summary
    const pageGroups = await WebsiteContent.aggregate([
      { $group: { _id: "$page", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log("\nMigration Summary:");
    pageGroups.forEach(group => {
      console.log(`- ${group._id}: ${group.count} items`);
    });
    
    console.log("\nMigration completed successfully!");
    
  } catch (error) {
    console.error("Migration failed:", error);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`- ${key}: ${error.errors[key].message}`);
      });
    }
  } finally {
    mongoose.connection.close();
  }
}

// Run migration
migrateContent();