const mongoose = require('mongoose');
const WebsiteContent = require('../models/WebsiteContent');
require('dotenv').config();

// Get a default user ID for createdBy field
const getDefaultUserId = () => new mongoose.Types.ObjectId();

// Comprehensive bilingual content migration
const bilingualContent = [
  // Global content
  {
    page: 'global',
    section: 'navigation',
    sectionKey: 'logo-text',
    sectionType: 'text',
    layout: 'full-width',
    position: 1,
    title: {
      en: 'Tamil Language Society',
      ta: 'தமிழ்ப் பேரவை'
    },
    content: {
      en: 'Tamil Language Society',
      ta: 'தமிழ்ப் பேரவை'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 0,
    isActive: true,
    isVisible: true,
    version: 1,
    createdBy: getDefaultUserId()
  },

  // About page content
  {
    page: 'about',
    section: 'hero',
    sectionKey: 'hero-title-tamil',
    sectionType: 'hero',
    layout: 'full-width',
    position: 1,
    title: {
      en: 'About Us',
      ta: 'எங்களைப் பற்றி'
    },
    content: {
      en: 'About Us',
      ta: 'எங்களைப் பற்றி'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 1,
    isActive: true,
    isVisible: true,
    version: 1
  },
  {
    page: 'about',
    section: 'hero',
    sectionKey: 'hero-quote',
    sectionType: 'quote',
    layout: 'centered',
    position: 2,
    title: {
      en: 'Rise with Tamil',
      ta: 'தமிழோடு உயர்வோம்'
    },
    content: {
      en: '"Rise with Tamil"',
      ta: '"தமிழோடு உயர்வோம்"'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 2,
    isActive: true,
    isVisible: true,
    version: 1
  },
  {
    page: 'about',
    section: 'history',
    sectionKey: 'history-title',
    sectionType: 'section-title',
    layout: 'centered',
    position: 1,
    title: {
      en: 'Our History',
      ta: 'எங்கள் வரலாறு'
    },
    content: {
      en: 'Our History',
      ta: 'எங்கள் வரலாறு'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 3,
    isActive: true,
    isVisible: true,
    version: 1
  },
  {
    page: 'about',
    section: 'history',
    sectionKey: 'history-description',
    sectionType: 'content',
    layout: 'full-width',
    position: 2,
    title: {
      en: 'Our Foundation',
      ta: 'எங்கள் அடித்தளம்'
    },
    content: {
      en: 'Tamil Language Society was established in 2020 with the mission to preserve Tamil language and culture in the digital age.',
      ta: 'தமிழ்ப் பேரவை 2020 ஆம் ஆண்டில் நிறுவப்பட்டு, தமிழ் மொழி மற்றும் கலாச்சாரத்தை டிஜிட்டல் யுகத்தில் பாதுகாக்கும் நோக்கத்துடன் தொடங்கியது.'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 4,
    isActive: true,
    isVisible: true,
    version: 1
  },
  {
    page: 'about',
    section: 'values',
    sectionKey: 'values-title',
    sectionType: 'section-title',
    layout: 'centered',
    position: 1,
    title: {
      en: 'Our Core Values',
      ta: 'எங்கள் அடிப்படை மதிப்புகள்'
    },
    content: {
      en: 'Our Core Values',
      ta: 'எங்கள் அடிப்படை மதிப்புகள்'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 5,
    isActive: true,
    isVisible: true,
    version: 1
  },
  {
    page: 'about',
    section: 'values',
    sectionKey: 'education-title',
    sectionType: 'value-item',
    layout: 'card',
    position: 1,
    title: {
      en: 'Education',
      ta: 'கல்வி'
    },
    content: {
      en: 'Education',
      ta: 'கல்வி'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 6,
    isActive: true,
    isVisible: true,
    version: 1
  },
  {
    page: 'about',
    section: 'values',
    sectionKey: 'community-title',
    sectionType: 'value-item',
    layout: 'card',
    position: 2,
    title: {
      en: 'Community',
      ta: 'சமூகம்'
    },
    content: {
      en: 'Community',
      ta: 'சமூகம்'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 7,
    isActive: true,
    isVisible: true,
    version: 1
  },
  {
    page: 'about',
    section: 'values',
    sectionKey: 'preservation-title',
    sectionType: 'value-item',
    layout: 'card',
    position: 3,
    title: {
      en: 'Preservation',
      ta: 'பாதுகாப்பு'
    },
    content: {
      en: 'Preservation',
      ta: 'பாதுகாப்பு'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 8,
    isActive: true,
    isVisible: true,
    version: 1
  },
  {
    page: 'about',
    section: 'values',
    sectionKey: 'global-reach-title',
    sectionType: 'value-item',
    layout: 'card',
    position: 4,
    title: {
      en: 'Global Reach',
      ta: 'உலகளாவிய அணுகல்'
    },
    content: {
      en: 'Global Reach',
      ta: 'உலகளாவிய அணுகல்'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 9,
    isActive: true,
    isVisible: true,
    version: 1
  },
  {
    page: 'about',
    section: 'journey',
    sectionKey: 'journey-title',
    sectionType: 'section-title',
    layout: 'centered',
    position: 1,
    title: {
      en: 'Our Journey',
      ta: 'எங்கள் பயணம்'
    },
    content: {
      en: 'Our Journey',
      ta: 'எங்கள் பயணம்'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 10,
    isActive: true,
    isVisible: true,
    version: 1
  },
  {
    page: 'about',
    section: 'team',
    sectionKey: 'team-title',
    sectionType: 'section-title',
    layout: 'centered',
    position: 1,
    title: {
      en: 'Our Team',
      ta: 'எங்கள் குழு'
    },
    content: {
      en: 'Our Team',
      ta: 'எங்கள் குழு'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 11,
    isActive: true,
    isVisible: true,
    version: 1
  },
  {
    page: 'about',
    section: 'cta',
    sectionKey: 'cta-title',
    sectionType: 'call-to-action',
    layout: 'centered',
    position: 1,
    title: {
      en: 'Join Our Mission',
      ta: 'எங்கள் பணியில் சேருங்கள்'
    },
    content: {
      en: 'Join Our Mission',
      ta: 'எங்கள் பணியில் சேருங்கள்'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 12,
    isActive: true,
    isVisible: true,
    version: 1
  },

  // Ebooks page content
  {
    page: 'ebooks',
    section: 'hero',
    sectionKey: 'hero-title',
    sectionType: 'hero',
    layout: 'full-width',
    position: 1,
    title: {
      en: 'E-Book Library',
      ta: 'மின்னூல் நூலகம்'
    },
    content: {
      en: 'E-Book Library',
      ta: 'மின்னூல் நூலகம்'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 1,
    isActive: true,
    isVisible: true,
    version: 1
  },
  {
    page: 'ebooks',
    section: 'hero',
    sectionKey: 'hero-quote',
    sectionType: 'quote',
    layout: 'centered',
    position: 2,
    title: {
      en: 'Wisdom Quote',
      ta: 'அறிவுரை'
    },
    content: {
      en: '"Those without knowledge of books are dull in wisdom"',
      ta: '"நூல் நுணுக்கம் இல்லாதவர் அறிவில் மழுங்கியவர்"'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 2,
    isActive: true,
    isVisible: true,
    version: 1
  },
  {
    page: 'ebooks',
    section: 'featured',
    sectionKey: 'featured-title',
    sectionType: 'section-title',
    layout: 'centered',
    position: 1,
    title: {
      en: 'Featured Books',
      ta: 'சிறப்பு நூல்கள்'
    },
    content: {
      en: 'Featured Books',
      ta: 'சிறப்பு நூல்கள்'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 3,
    isActive: true,
    isVisible: true,
    version: 1
  },
  {
    page: 'ebooks',
    section: 'featured',
    sectionKey: 'book1-title',
    sectionType: 'book-item',
    layout: 'card',
    position: 1,
    title: {
      en: 'Thirukkural',
      ta: 'திருக்குறள்'
    },
    content: {
      en: 'Thirukkural',
      ta: 'திருக்குறள்'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 4,
    isActive: true,
    isVisible: true,
    version: 1
  },
  {
    page: 'ebooks',
    section: 'featured',
    sectionKey: 'book1-author',
    sectionType: 'book-author',
    layout: 'inline',
    position: 1,
    title: {
      en: 'Thiruvalluvar',
      ta: 'திருவள்ளுவர்'
    },
    content: {
      en: 'Thiruvalluvar',
      ta: 'திருவள்ளுவர்'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 5,
    isActive: true,
    isVisible: true,
    version: 1
  },
  {
    page: 'ebooks',
    section: 'featured',
    sectionKey: 'book2-title',
    sectionType: 'book-item',
    layout: 'card',
    position: 2,
    title: {
      en: 'Silappatikaram',
      ta: 'சிலப்பதிகாரம்'
    },
    content: {
      en: 'Silappatikaram',
      ta: 'சிலப்பதிகாரம்'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 6,
    isActive: true,
    isVisible: true,
    version: 1
  },
  {
    page: 'ebooks',
    section: 'featured',
    sectionKey: 'book2-author',
    sectionType: 'book-author',
    layout: 'inline',
    position: 2,
    title: {
      en: 'Ilango Adigal',
      ta: 'இளங்கோ அடிகள்'
    },
    content: {
      en: 'Ilango Adigal',
      ta: 'இளங்கோ அடிகள்'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 7,
    isActive: true,
    isVisible: true,
    version: 1
  },
  {
    page: 'ebooks',
    section: 'featured',
    sectionKey: 'book3-title',
    sectionType: 'book-item',
    layout: 'card',
    position: 3,
    title: {
      en: 'Tamil Grammar',
      ta: 'தமிழ் இலக்கணம்'
    },
    content: {
      en: 'Tamil Grammar',
      ta: 'தமிழ் இலக்கணம்'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 8,
    isActive: true,
    isVisible: true,
    version: 1
  },
  {
    page: 'ebooks',
    section: 'featured',
    sectionKey: 'book3-author',
    sectionType: 'book-author',
    layout: 'inline',
    position: 3,
    title: {
      en: 'Tolkappiyar',
      ta: 'தொல்காப்பியர்'
    },
    content: {
      en: 'Tolkappiyar',
      ta: 'தொல்காப்பியர்'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 9,
    isActive: true,
    isVisible: true,
    version: 1
  },
  {
    page: 'ebooks',
    section: 'categories',
    sectionKey: 'categories-title',
    sectionType: 'section-title',
    layout: 'centered',
    position: 1,
    title: {
      en: 'Browse by Category',
      ta: 'பிரிவு வாரியாக பார்க்கவும்'
    },
    content: {
      en: 'Browse by Category',
      ta: 'பிரிவு வாரியாக பார்க்கவும்'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 10,
    isActive: true,
    isVisible: true,
    version: 1
  },
  {
    page: 'ebooks',
    section: 'new',
    sectionKey: 'new-title',
    sectionType: 'section-title',
    layout: 'centered',
    position: 1,
    title: {
      en: 'New Books',
      ta: 'புதிய நூல்கள்'
    },
    content: {
      en: 'New Books',
      ta: 'புதிய நூல்கள்'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 11,
    isActive: true,
    isVisible: true,
    version: 1
  },
  {
    page: 'ebooks',
    section: 'stats',
    sectionKey: 'stats-title',
    sectionType: 'section-title',
    layout: 'centered',
    position: 1,
    title: {
      en: 'Library Statistics',
      ta: 'நூலக புள்ளிவிவரங்கள்'
    },
    content: {
      en: 'Library Statistics',
      ta: 'நூலக புள்ளிவிவரங்கள்'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 12,
    isActive: true,
    isVisible: true,
    version: 1
  },

  // Footer content
  {
    page: 'global',
    section: 'footer',
    sectionKey: 'footer-logo-text',
    sectionType: 'text',
    layout: 'inline',
    position: 1,
    title: {
      en: 'Tamil Language Society',
      ta: 'தமிழ்ப் பேரவை'
    },
    content: {
      en: 'Tamil Language Society',
      ta: 'தமிழ்ப் பேரவை'
    },
    isRequired: true,
    hasTamilTranslation: true,
    order: 100,
    isActive: true,
    isVisible: true,
    version: 1
  }
];

async function runMigration() {
  try {
    console.log('Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tamilsociety', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB successfully');
    console.log('Starting bilingual content migration...');
    
    // Insert new bilingual content without clearing existing data
    const result = await WebsiteContent.insertMany(bilingualContent);
    console.log(`Successfully inserted ${result.length} bilingual content items`);
    
    console.log('Bilingual content migration completed successfully!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
    return result;
  } catch (error) {
    console.error('Migration failed:', error);
    await mongoose.connection.close();
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runMigration, bilingualContent };