const mongoose = require('mongoose');
const WebsiteContent = require('../models/WebsiteContent');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/tamilsociety')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Website content data matching HTML data-key attributes
const websiteContentData = [
  // Global Navigation and Site Elements
  {
    page: 'global',
    section: 'site-title',
    sectionKey: 'global-site-title',
    sectionType: 'title',
    title: {
      en: 'Tamil Language Society',
      ta: 'தமிழ் மொழி சங்கம்'
    },
    seoKeywords: {
      en: ['tamil', 'language', 'society', 'culture'],
      ta: ['தமிழ்', 'மொழி', 'சங்கம்', 'கலாச்சாரம்']
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'global',
    section: 'logo-text',
    sectionKey: 'global-logo-text',
    sectionType: 'title',
    title: {
      en: 'Tamil Language Society',
      ta: 'தமிழ் மொழி சங்கம்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'global',
    section: 'menu-home',
    sectionKey: 'global-menu-home',
    sectionType: 'title',
    title: {
      en: 'Home',
      ta: 'முகப்பு'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'global',
    section: 'menu-about',
    sectionKey: 'global-menu-about',
    sectionType: 'title',
    title: {
      en: 'About',
      ta: 'எங்களைப் பற்றி'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'global',
    section: 'menu-projects',
    sectionKey: 'global-menu-projects',
    sectionType: 'title',
    title: {
      en: 'Projects',
      ta: 'திட்டங்கள்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'global',
    section: 'menu-ebooks',
    sectionKey: 'global-menu-ebooks',
    sectionType: 'title',
    title: {
      en: 'E-books',
      ta: 'மின்னூல்கள்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'global',
    section: 'menu-bookstore',
    sectionKey: 'global-menu-bookstore',
    sectionType: 'title',
    title: {
      en: 'Book Store',
      ta: 'புத்தக கடை'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'global',
    section: 'menu-contact',
    sectionKey: 'global-menu-contact',
    sectionType: 'title',
    title: {
      en: 'Contact',
      ta: 'தொடர்பு'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'global',
    section: 'menu-login',
    sectionKey: 'global-menu-login',
    sectionType: 'title',
    title: {
      en: 'Login',
      ta: 'உள்நுழைவு'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'global',
    section: 'menu-signup',
    sectionKey: 'global-menu-signup',
    sectionType: 'title',
    title: {
      en: 'Sign Up',
      ta: 'பதிவு செய்யுங்கள்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'global',
    section: 'language-toggle-tamil',
    sectionKey: 'global-language-toggle-tamil',
    sectionType: 'title',
    title: {
      en: 'த',
      ta: 'த'
    },
    isActive: true,
    isVisible: true
  },

  // Homepage Hero Section
  {
    page: 'home',
    section: 'hero-title',
    sectionKey: 'homepage-hero-title',
    sectionType: 'title',
    title: {
      en: 'Preserving Tamil Heritage',
      ta: 'தமிழ் பாரம்பரியத்தைப் பாதுகாத்தல்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'home',
    section: 'hero-subtitle',
    sectionKey: 'homepage-hero-subtitle',
    sectionType: 'content',
    content: {
      en: 'Dedicated to promoting Tamil language, literature, and culture through education, research, and community engagement.',
      ta: 'கல்வி, ஆராய்ச்சி மற்றும் சமூக ஈடுபாட்டின் மூலம் தமிழ் மொழி, இலக்கியம் மற்றும் கலாச்சாரத்தை மேம்படுத்துவதற்கு அர்ப்பணிக்கப்பட்டுள்ளது.'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'home',
    section: 'hero-quote',
    sectionKey: 'homepage-hero-quote',
    sectionType: 'content',
    content: {
      en: '"Tamil is not just a language, it\'s our identity"',
      ta: '"தமிழ் வெறும் மொழி அல்ல, அது நமது அடையாளம்"'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'home',
    section: 'hero-primary-button',
    sectionKey: 'homepage-hero-primary-button',
    sectionType: 'buttonText',
    buttonText: {
      en: 'Learn More',
      ta: 'மேலும் அறிக'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'home',
    section: 'hero-secondary-button',
    sectionKey: 'homepage-hero-secondary-button',
    sectionType: 'buttonText',
    buttonText: {
      en: 'View Projects',
      ta: 'திட்டங்களைப் பார்க்கவும்'
    },
    isActive: true,
    isVisible: true
  },

  // Homepage Posters Section
  {
    page: 'home',
    section: 'posters-title',
    sectionKey: 'homepage-posters-title',
    sectionType: 'title',
    title: {
      en: 'Latest Announcements',
      ta: 'சமீபத்திய அறிவிப்புகள்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'home',
    section: 'posters-subtitle',
    sectionKey: 'homepage-posters-subtitle',
    sectionType: 'content',
    content: {
      en: 'Stay updated with our latest events and announcements',
      ta: 'எங்கள் சமீபத்திய நிகழ்வுகள் மற்றும் அறிவிப்புகளுடன் புதுப்பித்த நிலையில் இருங்கள்'
    },
    isActive: true,
    isVisible: true
  },

  // Homepage Features Section
  {
    page: 'home',
    section: 'features-title',
    sectionKey: 'homepage-features-title',
    sectionType: 'title',
    title: {
      en: 'Our Services',
      ta: 'எங்கள் சேவைகள்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'home',
    section: 'features-ebooks-title',
    sectionKey: 'homepage-features-ebooks-title',
    sectionType: 'title',
    title: {
      en: 'E-books',
      ta: 'மின்னூல்கள்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'home',
    section: 'features-ebooks-description',
    sectionKey: 'homepage-features-ebooks-description',
    sectionType: 'content',
    content: {
      en: 'Access thousands of Tamil books, literature, and educational resources in our comprehensive digital collection.',
      ta: 'எங்கள் விரிவான டிஜிட்டல் தொகுப்பில் ஆயிரக்கணக்கான தமிழ் புத்தகங்கள், இலக்கியம் மற்றும் கல்வி வளங்களை அணுகவும்.'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'home',
    section: 'features-ebooks-link',
    sectionKey: 'homepage-features-ebooks-link',
    sectionType: 'buttonText',
    buttonText: {
      en: 'Explore Library',
      ta: 'நூலகத்தை ஆராயுங்கள்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'home',
    section: 'features-projects-title',
    sectionKey: 'homepage-features-projects-title',
    sectionType: 'title',
    title: {
      en: 'Projects',
      ta: 'திட்டங்கள்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'home',
    section: 'features-projects-description',
    sectionKey: 'homepage-features-projects-description',
    sectionType: 'content',
    content: {
      en: 'Join our initiatives, workshops, and events that celebrate Tamil heritage and traditions.',
      ta: 'தமிழ் பாரம்பரியம் மற்றும் பாரம்பரியங்களைக் கொண்டாடும் எங்கள் முன்முயற்சிகள், பட்டறைகள் மற்றும் நிகழ்வுகளில் சேரவும்.'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'home',
    section: 'features-projects-link',
    sectionKey: 'homepage-features-projects-link',
    sectionType: 'buttonText',
    buttonText: {
      en: 'View Programs',
      ta: 'திட்டங்களைப் பார்க்கவும்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'home',
    section: 'features-bookstore-title',
    sectionKey: 'homepage-features-bookstore-title',
    sectionType: 'title',
    title: {
      en: 'Book Store',
      ta: 'புத்தக கடை'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'home',
    section: 'features-bookstore-description',
    sectionKey: 'homepage-features-bookstore-description',
    sectionType: 'content',
    content: {
      en: 'Purchase authentic Tamil literature, textbooks, and cultural materials from our curated collection.',
      ta: 'எங்கள் தேர்ந்தெடுக்கப்பட்ட தொகுப்பிலிருந்து உண்மையான தமிழ் இலக்கியம், பாடப்புத்தகங்கள் மற்றும் கலாச்சார பொருட்களை வாங்கவும்.'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'home',
    section: 'features-bookstore-link',
    sectionKey: 'homepage-features-bookstore-link',
    sectionType: 'buttonText',
    buttonText: {
      en: 'Shop Now',
      ta: 'இப்போது வாங்கவும்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'home',
    section: 'features-contact-title',
    sectionKey: 'homepage-features-contact-title',
    sectionType: 'title',
    title: {
      en: 'Contacts',
      ta: 'தொடர்புகள்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'home',
    section: 'features-contact-description',
    sectionKey: 'homepage-features-contact-description',
    sectionType: 'content',
    content: {
      en: 'Connect with fellow Tamil language enthusiasts and contribute to preserving our linguistic heritage.',
      ta: 'தமிழ் மொழி ஆர்வலர்களுடன் இணைந்து எங்கள் மொழியியல் பாரம்பரியத்தைப் பாதுகாப்பதில் பங்களிக்கவும்.'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'home',
    section: 'features-contact-link',
    sectionKey: 'homepage-features-contact-link',
    sectionType: 'buttonText',
    buttonText: {
      en: 'Get Involved',
      ta: 'ஈடுபடுங்கள்'
    },
    isActive: true,
    isVisible: true
  },

  // Homepage Statistics Section
  {
    page: 'home',
    section: 'statistics-books-label',
    sectionKey: 'homepage-statistics-books-label',
    sectionType: 'title',
    title: {
      en: 'Digital Books',
      ta: 'டிஜிட்டல் புத்தகங்கள்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'home',
    section: 'statistics-members-label',
    sectionKey: 'homepage-statistics-members-label',
    sectionType: 'title',
    title: {
      en: 'Community Members',
      ta: 'சமூக உறுப்பினர்கள்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'home',
    section: 'statistics-years-label',
    sectionKey: 'homepage-statistics-years-label',
    sectionType: 'title',
    title: {
      en: 'Years of Service',
      ta: 'சேவை ஆண்டுகள்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'home',
    section: 'statistics-projects-label',
    sectionKey: 'homepage-statistics-projects-label',
    sectionType: 'title',
    title: {
      en: 'Active Projects',
      ta: 'செயலில் உள்ள திட்டங்கள்'
    },
    isActive: true,
    isVisible: true
  },

  // Global Footer Content
  {
    page: 'global',
    section: 'footer-logo-text',
    sectionKey: 'global-footer-logo-text',
    sectionType: 'title',
    title: {
      en: 'Tamil Language Society',
      ta: 'தமிழ் மொழி சங்கம்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'global',
    section: 'footer-description',
    sectionKey: 'global-footer-description',
    sectionType: 'content',
    content: {
      en: 'Dedicated to preserving and promoting the rich heritage of Tamil language and culture worldwide.',
      ta: 'உலகளவில் தமிழ் மொழி மற்றும் கலாச்சாரத்தின் வளமான பாரம்பரியத்தைப் பாதுகாத்து மேம்படுத்துவதற்கு அர்ப்பணிக்கப்பட்டுள்ளது.'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'global',
    section: 'footer-quicklinks-title',
    sectionKey: 'global-footer-quicklinks-title',
    sectionType: 'title',
    title: {
      en: 'Quick Links',
      ta: 'விரைவு இணைப்புகள்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'global',
    section: 'footer-about-link',
    sectionKey: 'global-footer-about-link',
    sectionType: 'title',
    title: {
      en: 'About Us',
      ta: 'எங்களைப் பற்றி'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'global',
    section: 'footer-projects-link',
    sectionKey: 'global-footer-projects-link',
    sectionType: 'title',
    title: {
      en: 'Projects',
      ta: 'திட்டங்கள்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'global',
    section: 'footer-ebooks-link',
    sectionKey: 'global-footer-ebooks-link',
    sectionType: 'title',
    title: {
      en: 'E-books',
      ta: 'மின்னூல்கள்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'global',
    section: 'footer-bookstore-link',
    sectionKey: 'global-footer-bookstore-link',
    sectionType: 'title',
    title: {
      en: 'Book Store',
      ta: 'புத்தக கடை'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'global',
    section: 'footer-support-title',
    sectionKey: 'global-footer-support-title',
    sectionType: 'title',
    title: {
      en: 'Support',
      ta: 'ஆதரவு'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'global',
    section: 'footer-contact-link',
    sectionKey: 'global-footer-contact-link',
    sectionType: 'title',
    title: {
      en: 'Contact Us',
      ta: 'எங்களைத் தொடர்பு கொள்ளுங்கள்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'global',
    section: 'footer-notifications-link',
    sectionKey: 'global-footer-notifications-link',
    sectionType: 'title',
    title: {
      en: 'Notifications',
      ta: 'அறிவிப்புகள்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'global',
    section: 'footer-newsletter-title',
    sectionKey: 'global-footer-newsletter-title',
    sectionType: 'title',
    title: {
      en: 'Newsletter',
      ta: 'செய்திமடல்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'global',
    section: 'footer-newsletter-description',
    sectionKey: 'global-footer-newsletter-description',
    sectionType: 'content',
    content: {
      en: 'Stay updated with our latest news and events',
      ta: 'எங்கள் சமீபத்திய செய்திகள் மற்றும் நிகழ்வுகளுடன் புதுப்பித்த நிலையில் இருங்கள்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'global',
    section: 'footer-email-placeholder',
    sectionKey: 'global-footer-email-placeholder',
    sectionType: 'placeholder',
    placeholder: {
      en: 'Enter your email',
      ta: 'உங்கள் மின்னஞ்சலை உள்ளிடவும்'
    },
    isActive: true,
    isVisible: true
  },
  {
    page: 'global',
    section: 'footer-copyright',
    sectionKey: 'global-footer-copyright',
    sectionType: 'content',
    content: {
      en: '© 2025 Tamil Language Society. All rights reserved.',
      ta: '© 2025 தமிழ் மொழி சங்கம். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.'
    },
    isActive: true,
    isVisible: true
  }
];

async function populateContent() {
  try {
    console.log('Starting to populate website content...');
    
    for (const contentItem of websiteContentData) {
      const newContent = new WebsiteContent(contentItem);
      await newContent.save();
      console.log(`Created content: ${contentItem.sectionKey}`);
    }
    
    console.log('\n✅ Successfully populated website content!');
    console.log(`Total items created: ${websiteContentData.length}`);
    
    // Verify the content was created
    const count = await WebsiteContent.countDocuments();
    console.log(`Database now contains ${count} content items`);
    
  } catch (error) {
    console.error('Error populating content:', error);
  } finally {
    mongoose.connection.close();
  }
}

populateContent();