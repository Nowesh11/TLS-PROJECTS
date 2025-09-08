const mongoose = require('mongoose');
const WebsiteContent = require('./models/WebsiteContent');
const Book = require('./models/Book');
const Ebook = require('./models/Ebook');
const Project = require('./models/Project');
const Initiative = require('./models/Initiative');
const Activity = require('./models/Activity');
const TeamMember = require('./models/TeamMember');
const Poster = require('./models/Poster');
const User = require('./models/User');
const fs = require('fs');
const path = require('path');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tls_website', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Create sample images function
const createSampleImage = async (directory, filename, content = 'Sample Image') => {
    const uploadsDir = path.join(__dirname, 'uploads', directory);
    const filePath = path.join(uploadsDir, filename);
    
    // Create a simple SVG as placeholder
    const svgContent = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" font-family="Arial" font-size="16" fill="#333" text-anchor="middle" dy=".3em">${content}</text>
    </svg>`;
    
    try {
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        fs.writeFileSync(filePath, svgContent);
        return `/uploads/${directory}/${filename}`;
    } catch (error) {
        console.error(`Error creating image ${filename}:`, error);
        return null;
    }
};

// Website Content Data
const websiteContentData = [
    // Global Elements
    {
        page: 'global',
        section: 'navigation',
        sectionKey: 'global-site-title',
        sectionType: 'text',
        layout: 'full-width',
        position: 1,
        title: {
            en: 'Tamil Language Society',
            ta: 'தமிழ் மொழி சங்கம்'
        },
        content: {
            en: 'Preserving and promoting Tamil language and culture',
            ta: 'தமிழ் மொழி மற்றும் பண்பாட்டை பாதுகாத்து மேம்படுத்துதல்'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['tamil', 'language', 'society', 'culture'],
            ta: ['தமிழ்', 'மொழி', 'சங்கம்', 'பண்பாடு']
        }
    },
    {
        page: 'global',
        section: 'navigation',
        sectionKey: 'global-menu-home',
        sectionType: 'navigation',
        layout: 'full-width',
        position: 1,
        title: {
            en: 'Home',
            ta: 'முகப்பு'
        },
        content: {
            en: 'Home',
            ta: 'முகப்பு'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['navigation', 'menu'],
            ta: ['வழிசெலுத்தல்', 'மெனு']
        }
    },
    {
        page: 'global',
        section: 'navigation',
        sectionKey: 'global-menu-about',
        sectionType: 'navigation',
        layout: 'full-width',
        position: 2,
        title: {
            en: 'About',
            ta: 'எங்களைப் பற்றி'
        },
        content: {
            en: 'Learn about our mission and vision',
            ta: 'எங்கள் நோக்கம் மற்றும் தொலைநோக்கைப் பற்றி அறியுங்கள்'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['about', 'mission', 'vision'],
            ta: ['பற்றி', 'நோக்கம்', 'தொலைநோக்கு']
        }
    },
    {
        page: 'global',
        section: 'navigation',
        sectionKey: 'global-menu-projects',
        sectionType: 'navigation',
        layout: 'full-width',
        position: 3,
        title: {
            en: 'Projects',
            ta: 'திட்டங்கள்'
        },
        content: {
            en: 'Explore our Tamil language projects',
            ta: 'எங்கள் தமிழ் மொழி திட்டங்களை ஆராயுங்கள்'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['projects', 'tamil', 'initiatives'],
            ta: ['திட்டங்கள்', 'தமிழ்', 'முயற்சிகள்']
        }
    },
    {
        page: 'global',
        section: 'navigation',
        sectionKey: 'global-menu-ebooks',
        sectionType: 'navigation',
        layout: 'full-width',
        position: 4,
        title: {
            en: 'Ebooks',
            ta: 'மின்னூல்கள்'
        },
        content: {
            en: 'Browse our digital Tamil book collection',
            ta: 'எங்கள் டிஜிட்டல் தமிழ் புத்தக தொகுப்பை உலாவுங்கள்'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['ebooks', 'digital', 'books', 'tamil'],
            ta: ['மின்னூல்கள்', 'டிஜிட்டல்', 'புத்தகங்கள்', 'தமிழ்']
        }
    },
    {
        page: 'global',
        section: 'navigation',
        sectionKey: 'global-menu-bookstore',
        sectionType: 'navigation',
        layout: 'full-width',
        position: 5,
        title: {
            en: 'Book Store',
            ta: 'புத்தக கடை'
        },
        content: {
            en: 'Shop for Tamil books and literature',
            ta: 'தமிழ் புத்தகங்கள் மற்றும் இலக்கியங்களை வாங்குங்கள்'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['bookstore', 'books', 'shop', 'tamil'],
            ta: ['புத்தக கடை', 'புத்தகங்கள்', 'கடை', 'தமிழ்']
        }
    },
    {
        page: 'global',
        section: 'navigation',
        sectionKey: 'global-menu-contact',
        sectionType: 'navigation',
        layout: 'full-width',
        position: 6,
        title: {
            en: 'Contact',
            ta: 'தொடர்பு'
        },
        content: {
            en: 'Get in touch with us',
            ta: 'எங்களுடன் தொடர்பு கொள்ளுங்கள்'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['contact', 'reach', 'connect'],
            ta: ['தொடர்பு', 'அணுகல்', 'இணைப்பு']
        }
    },
    {
        page: 'global',
        section: 'navigation',
        sectionKey: 'global-menu-login',
        sectionType: 'navigation',
        layout: 'full-width',
        position: 7,
        title: {
            en: 'Login',
            ta: 'உள்நுழைவு'
        },
        content: {
            en: 'Sign in to your account',
            ta: 'உங்கள் கணக்கில் உள்நுழையுங்கள்'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['login', 'signin', 'account'],
            ta: ['உள்நுழைவு', 'கணக்கு', 'அணுகல்']
        }
    },
    {
        page: 'global',
        section: 'navigation',
        sectionKey: 'global-menu-signup',
        sectionType: 'navigation',
        layout: 'full-width',
        position: 8,
        title: {
            en: 'Sign Up',
            ta: 'பதிவு செய்யுங்கள்'
        },
        content: {
            en: 'Create a new account',
            ta: 'புதிய கணக்கை உருவாக்குங்கள்'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['signup', 'register', 'account'],
            ta: ['பதிவு', 'கணக்கு', 'உருவாக்கம்']
        }
    },
    // Homepage Content
    {
        page: 'home',
        section: 'hero',
        sectionKey: 'homepage-hero-title',
        sectionType: 'hero',
        layout: 'full-width',
        position: 1,
        title: {
            en: 'Preserving Tamil Heritage for Future Generations',
            ta: 'எதிர்கால சந்ததியினருக்காக தமிழ் பாரம்பரியத்தை பாதுகாத்தல்'
        },
        content: {
            en: 'Preserving Tamil Heritage for Future Generations',
            ta: 'எதிர்கால சந்ததியினருக்காக தமிழ் பாரம்பரியத்தை பாதுகாத்தல்'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['tamil', 'heritage', 'culture', 'preservation'],
            ta: ['தமிழ்', 'பாரம்பரியம்', 'பண்பாடு', 'பாதுகாப்பு']
        }
    },
    {
        page: 'home',
        section: 'hero',
        sectionKey: 'homepage-hero-subtitle',
        sectionType: 'hero',
        layout: 'full-width',
        position: 2,
        title: {
            en: 'Our Mission',
            ta: 'எங்கள் நோக்கம்'
        },
        content: {
            en: 'Join our mission to celebrate, preserve, and promote the rich Tamil language and culture through education, literature, and community engagement.',
            ta: 'கல்வி, இலக்கியம் மற்றும் சமூக ஈடுபாட்டின் மூலம் வளமான தமிழ் மொழி மற்றும் பண்பாட்டை கொண்டாட, பாதுகாக்க மற்றும் மேம்படுத்த எங்கள் நோக்கத்தில் சேருங்கள்.'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['mission', 'culture', 'education', 'community'],
            ta: ['நோக்கம்', 'பண்பாடு', 'கல்வி', 'சமூகம்']
        }
    },
    {
        page: 'home',
        section: 'hero',
        sectionKey: 'homepage-hero-quote',
        sectionType: 'hero',
        layout: 'full-width',
        position: 3,
        title: {
            en: 'Tamil Identity Quote',
            ta: 'தமிழ் அடையாள மேற்கோள்'
        },
        content: {
            en: '"Tamil is not just a language, it\'s our identity"',
            ta: '"தமிழ் வெறும் மொழி அல்ல, அது நமது அடையாளம்"'
        },
        isRequired: false,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['quote', 'identity', 'language', 'tamil'],
            ta: ['மேற்கோள்', 'அடையாளம்', 'மொழி', 'தமிழ்']
        }
    },
    {
        page: 'home',
        section: 'hero',
        sectionKey: 'homepage-hero-primary-button',
        sectionType: 'cta',
        layout: 'full-width',
        position: 4,
        title: {
            en: 'Learn About Us',
            ta: 'எங்களைப் பற்றி அறியுங்கள்'
        },
        content: {
            en: 'Discover our mission and vision',
            ta: 'எங்கள் நோக்கம் மற்றும் தொலைநோக்கைக் கண்டறியுங்கள்'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['learn', 'about', 'mission'],
            ta: ['அறிய', 'பற்றி', 'நோக்கம்']
        }
    },
    {
        page: 'home',
        section: 'hero',
        sectionKey: 'homepage-hero-secondary-button',
        sectionType: 'cta',
        layout: 'full-width',
        position: 5,
        title: {
            en: 'View Projects',
            ta: 'திட்டங்களைப் பார்க்கவும்'
        },
        content: {
            en: 'Explore our Tamil language projects',
            ta: 'எங்கள் தமிழ் மொழி திட்டங்களை ஆராயுங்கள்'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['projects', 'view', 'explore'],
            ta: ['திட்டங்கள்', 'பார்க்க', 'ஆராய']
        }
    },
    // Features Section
    {
        page: 'home',
        section: 'features',
        sectionKey: 'homepage-features-title',
        sectionType: 'text',
        layout: 'three-column',
        position: 1,
        title: {
            en: 'Our Core Services',
            ta: 'எங்கள் முக்கிய சேவைகள்'
        },
        content: {
            en: 'Discover the various ways we serve the Tamil community',
            ta: 'தமிழ் சமூகத்திற்கு நாங்கள் சேவை செய்யும் பல்வேறு வழிகளைக் கண்டறியுங்கள்'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['services', 'community', 'tamil'],
            ta: ['சேவைகள்', 'சமூகம்', 'தமிழ்']
        }
    },
    {
        page: 'home',
        section: 'features',
        sectionKey: 'homepage-features-ebooks-title',
        sectionType: 'feature-list',
        layout: 'three-column',
        position: 2,
        title: {
            en: 'Digital Library',
            ta: 'டிஜிட்டல் நூலகம்'
        },
        content: {
            en: 'Access thousands of Tamil books, literature, and educational resources in our comprehensive digital collection.',
            ta: 'எங்கள் விரிவான டிஜிட்டல் தொகுப்பில் ஆயிரக்கணக்கான தமிழ் புத்தகங்கள், இலக்கியம் மற்றும் கல்வி வளங்களை அணுகவும்.'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['digital', 'library', 'books'],
            ta: ['டிஜிட்டல்', 'நூலகம்', 'புத்தகங்கள்']
        }
    },
    {
        page: 'home',
        section: 'features',
        sectionKey: 'homepage-features-projects-title',
        sectionType: 'feature-list',
        layout: 'three-column',
        position: 3,
        title: {
            en: 'Cultural Programs',
            ta: 'பண்பாட்டு நிகழ்ச்சிகள்'
        },
        content: {
            en: 'Join our initiatives, workshops, and events that celebrate Tamil heritage and traditions.',
            ta: 'தமிழ் பாரம்பரியம் மற்றும் பாரம்பரியங்களை கொண்டாடும் எங்கள் முன்முயற்சிகள், பட்டறைகள் மற்றும் நிகழ்வுகளில் சேருங்கள்.'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['cultural', 'programs', 'events'],
            ta: ['பண்பாட்டு', 'நிகழ்ச்சிகள்', 'நிகழ்வுகள்']
        }
    },
    {
        page: 'home',
        section: 'features',
        sectionKey: 'homepage-features-bookstore-title',
        sectionType: 'feature-list',
        layout: 'three-column',
        position: 4,
        title: {
            en: 'Book Store',
            ta: 'புத்தக கடை'
        },
        content: {
            en: 'Purchase authentic Tamil literature, textbooks, and cultural materials from our curated collection.',
            ta: 'எங்கள் தேர்ந்தெடுக்கப்பட்ட தொகுப்பிலிருந்து உண்மையான தமிழ் இலக்கியம், பாடப்புத்தகங்கள் மற்றும் பண்பாட்டு பொருட்களை வாங்கவும்.'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['bookstore', 'literature', 'books'],
            ta: ['புத்தக கடை', 'இலக்கியம்', 'புத்தகங்கள்']
        }
    },
    {
        page: 'home',
        section: 'features',
        sectionKey: 'homepage-features-contact-title',
        sectionType: 'feature-list',
        layout: 'three-column',
        position: 5,
        title: {
            en: 'Community',
            ta: 'சமூகம்'
        },
        content: {
            en: 'Connect with fellow Tamil language enthusiasts and contribute to preserving our linguistic heritage.',
            ta: 'தமிழ் மொழி ஆர்வலர்களுடன் இணைந்து எங்கள் மொழியியல் பாரம்பரியத்தை பாதுகாக்க பங்களிக்கவும்.'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['community', 'tamil', 'heritage'],
            ta: ['சமூகம்', 'தமிழ்', 'பாரம்பரியம்']
        }
    },
    // Statistics Section
    {
        page: 'home',
        section: 'statistics',
        sectionKey: 'homepage-statistics-books-label',
        sectionType: 'statistics',
        layout: 'grid',
        position: 1,
        title: {
            en: 'Digital Books',
            ta: 'டிஜிட்டல் புத்தகங்கள்'
        },
        content: {
            en: '5000+ digital books available',
            ta: '5000+ டிஜிட்டல் புத்தகங்கள் கிடைக்கின்றன'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['statistics', 'books', 'digital'],
            ta: ['புள்ளிவிவரங்கள்', 'புத்தகங்கள்', 'டிஜிட்டல்']
        }
    },
    {
        page: 'home',
        section: 'statistics',
        sectionKey: 'homepage-statistics-members-label',
        sectionType: 'statistics',
        layout: 'grid',
        position: 2,
        title: {
            en: 'Community Members',
            ta: 'சமூக உறுப்பினர்கள்'
        },
        content: {
            en: '10,000+ active community members',
            ta: '10,000+ செயலில் உள்ள சமூக உறுப்பினர்கள்'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['statistics', 'members', 'community'],
            ta: ['புள்ளிவிவரங்கள்', 'உறுப்பினர்கள்', 'சமூகம்']
        }
    },
    {
        page: 'home',
        section: 'statistics',
        sectionKey: 'homepage-statistics-years-label',
        sectionType: 'statistics',
        layout: 'grid',
        position: 3,
        title: {
            en: 'Years of Service',
            ta: 'சேவை ஆண்டுகள்'
        },
        content: {
            en: '25+ years of dedicated service',
            ta: '25+ ஆண்டுகள் அர்ப்பணிப்பு சேவை'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['statistics', 'years', 'service'],
            ta: ['புள்ளிவிவரங்கள்', 'ஆண்டுகள்', 'சேவை']
        }
    },
    {
        page: 'home',
        section: 'statistics',
        sectionKey: 'homepage-statistics-projects-label',
        sectionType: 'statistics',
        layout: 'grid',
        position: 4,
        title: {
            en: 'Active Projects',
            ta: 'செயலில் உள்ள திட்டங்கள்'
        },
        content: {
            en: '50+ ongoing cultural projects',
            ta: '50+ நடைபெறும் பண்பாட்டு திட்டங்கள்'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['statistics', 'projects', 'active'],
            ta: ['புள்ளிவிவரங்கள்', 'திட்டங்கள்', 'செயலில்']
        }
    },
    // Footer Content
    {
        page: 'global',
        section: 'footer',
        sectionKey: 'global-footer-logo-text',
        sectionType: 'text',
        layout: 'full-width',
        position: 1,
        title: {
            en: 'Tamil Language Society',
            ta: 'தமிழ் மொழி சங்கம்'
        },
        content: {
            en: 'Tamil Language Society - Preserving Heritage',
            ta: 'தமிழ் மொழி சங்கம் - பாரம்பரியத்தை பாதுகாத்தல்'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['footer', 'logo', 'tamil'],
            ta: ['அடிக்குறிப்பு', 'லோகோ', 'தமிழ்']
        }
    },
    {
        page: 'global',
        section: 'footer',
        sectionKey: 'global-footer-description',
        sectionType: 'text',
        layout: 'full-width',
        position: 2,
        title: {
            en: 'About Us',
            ta: 'எங்களைப் பற்றி'
        },
        content: {
            en: 'Dedicated to preserving and promoting the rich heritage of Tamil language and culture worldwide.',
            ta: 'உலகளவில் தமிழ் மொழி மற்றும் பண்பாட்டின் வளமான பாரம்பரியத்தை பாதுகாத்து மேம்படுத்துவதற்கு அர்ப்பணிக்கப்பட்டுள்ளது.'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['footer', 'description', 'heritage'],
            ta: ['அடிக்குறிப்பு', 'விளக்கம்', 'பாரம்பரியம்']
        }
    },
    {
        page: 'global',
        section: 'footer',
        sectionKey: 'global-footer-copyright',
        sectionType: 'footer',
        layout: 'full-width',
        position: 10,
        title: {
            en: 'Copyright Notice',
            ta: 'பதிப்புரிமை அறிவிப்பு'
        },
        content: {
            en: '© 2025 Tamil Language Society. All rights reserved.',
            ta: '© 2025 தமிழ் மொழி சங்கம். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.'
        },
        isRequired: true,
        isActive: true,
        isVisible: true,
        version: 1,
        seoKeywords: {
            en: ['footer', 'copyright', 'rights'],
            ta: ['அடிக்குறிப்பு', 'பதிப்புரிமை', 'உரிமைகள்']
        }
    }
];

// Sample Books Data
const booksData = [
    {
        title: {
            en: 'Tamil Grammar Fundamentals',
            ta: 'தமிழ் இலக்கண அடிப்படைகள்'
        },
        description: {
            en: 'A comprehensive guide to Tamil grammar for beginners and intermediate learners.',
            ta: 'தொடக்க மற்றும் இடைநிலை கற்பவர்களுக்கான தமிழ் இலக்கணத்திற்கான விரிவான வழிகாட்டி.'
        },
        author: {
            en: 'Dr. Kamala Subramaniam',
            ta: 'டாக்டர் கமலா சுப்ரமணியம்'
        },
        price: 25.99,
        category: 'education',
        isbn: '978-0-123456-78-9',
        pages: 320,
        language: 'Tamil',
        publisher: 'Tamil Academic Press',
        publishedDate: new Date('2023-01-15'),
        inStock: true,
        stockQuantity: 50,
        rating: 4.5,
        tags: ['grammar', 'education', 'tamil', 'language'],
        isActive: true
    },
    {
        title: {
            en: 'Classical Tamil Poetry Collection',
            ta: 'செம்மொழி தமிழ் கவிதை தொகுப்பு'
        },
        description: {
            en: 'A beautiful collection of classical Tamil poems with modern translations and commentary.',
            ta: 'நவீன மொழிபெயர்ப்புகள் மற்றும் விளக்கங்களுடன் கூடிய செம்மொழி தமிழ் கவிதைகளின் அழகான தொகுப்பு.'
        },
        author: {
            en: 'Prof. Meera Rajendran',
            ta: 'பேராசிரியர் மீரா ராஜேந்திரன்'
        },
        price: 35.50,
        category: 'literature',
        isbn: '978-0-987654-32-1',
        pages: 450,
        language: 'Tamil',
        publisher: 'Heritage Publications',
        publishedDate: new Date('2023-03-20'),
        inStock: true,
        stockQuantity: 30,
        rating: 4.8,
        tags: ['poetry', 'literature', 'classical', 'tamil'],
        isActive: true
    },
    {
        title: {
            en: 'Modern Tamil Short Stories',
            ta: 'நவீன தமிழ் சிறுகதைகள்'
        },
        description: {
            en: 'Contemporary Tamil short stories reflecting modern life and social issues.',
            ta: 'நவீன வாழ்க்கை மற்றும் சமூக பிரச்சினைகளை பிரதிபலிக்கும் சமகால தமிழ் சிறுகதைகள்.'
        },
        author: {
            en: 'Anitha Krishnan',
            ta: 'அனிதா கிருஷ்ணன்'
        },
        price: 22.75,
        category: 'fiction',
        isbn: '978-0-456789-12-3',
        pages: 280,
        language: 'Tamil',
        publisher: 'Modern Tamil Books',
        publishedDate: new Date('2023-06-10'),
        inStock: true,
        stockQuantity: 40,
        rating: 4.3,
        tags: ['fiction', 'short-stories', 'modern', 'tamil'],
        isActive: true
    }
];

// Sample Ebooks Data
const ebooksData = [
    {
        title: {
            en: 'Digital Tamil Learning',
            ta: 'டிஜிட்டல் தமிழ் கற்றல்'
        },
        description: {
            en: 'Interactive digital guide for learning Tamil language online.',
            ta: 'ஆன்லைனில் தமிழ் மொழி கற்றுக்கொள்வதற்கான ஊடாடும் டிஜிட்டல் வழிகாட்டி.'
        },
        author: {
            en: 'Tamil Learning Institute',
            ta: 'தமிழ் கற்றல் நிறுவனம்'
        },
        category: 'education',
        fileSize: 15200000,
        fileFormat: 'PDF',
        fileUrl: '/assets/ebooks/digital-tamil-learning.pdf',
        pages: 200,
        bookLanguage: 'Tamil',
        publishedDate: new Date('2023-02-28'),
        downloadCount: 1250,
        rating: 4.6,
        tags: ['education', 'digital', 'learning', 'tamil'],
        isActive: true,
        isFree: true
    },
    {
        title: {
            en: 'Tamil Culture and Traditions',
            ta: 'தமிழ் பண்பாடு மற்றும் பாரம்பரியங்கள்'
        },
        description: {
            en: 'Comprehensive guide to Tamil cultural practices and traditions.',
            ta: 'தமிழ் பண்பாட்டு நடைமுறைகள் மற்றும் பாரம்பரியங்களுக்கான விரிவான வழிகாட்டி.'
        },
        author: {
            en: 'Cultural Heritage Foundation',
            ta: 'பண்பாட்டு பாரம்பரிய அறக்கட்டளை'
        },
        category: 'culture',
        fileSize: 22800000,
        fileFormat: 'PDF',
        fileUrl: '/assets/ebooks/tamil-culture-traditions.pdf',
        pages: 350,
        bookLanguage: 'Tamil',
        publishedDate: new Date('2023-04-15'),
        downloadCount: 890,
        rating: 4.7,
        tags: ['culture', 'traditions', 'heritage', 'tamil'],
        isActive: true,
        isFree: false,
        price: 12.99
    }
];

// Sample Projects Data
const projectsData = [
    {
        title: {
            en: 'Tamil Language Preservation Initiative',
            ta: 'தமிழ் மொழி பாதுகாப்பு முன்முயற்சி'
        },
        slug: 'tamil-language-preservation-initiative',
        description: {
            en: 'A comprehensive project aimed at documenting and preserving Tamil dialects and linguistic variations.',
            ta: 'தமிழ் பேச்சுவழக்குகள் மற்றும் மொழியியல் மாறுபாடுகளை ஆவணப்படுத்தி பாதுகாப்பதை நோக்கமாகக் கொண்ட ஒரு விரிவான திட்டம்.'
        },
        goals: {
            en: 'Document regional dialects, create digital archives, and develop educational resources.',
            ta: 'பிராந்திய பேச்சுவழக்குகளை ஆவணப்படுத்துதல், டிஜிட்டல் காப்பகங்களை உருவாக்குதல் மற்றும் கல்வி வளங்களை உருவாக்குதல்.'
        },
        director: {
            en: 'Dr. Priya Selvam',
            ta: 'டாக்டர் பிரியா செல்வம்'
        },
        director_name: 'Dr. Priya Selvam',
        director_email: 'priya.selvam@tamilsociety.org',
        director_phone: '+1-555-0201',
        status: 'active',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2025-12-31'),
        budget: 150000,
        bureau: 'language-literature',
        participants: 25,
        isActive: true
    },
    {
        title: {
            en: 'Youth Tamil Learning Program',
            ta: 'இளைஞர் தமிழ் கற்றல் திட்டம்'
        },
        slug: 'youth-tamil-learning-program',
        description: {
            en: 'Educational program designed to engage young people in Tamil language learning through modern teaching methods.',
            ta: 'நவீன கற்பித்தல் முறைகள் மூலம் இளைஞர்களை தமிழ் மொழி கற்றலில் ஈடுபடுத்த வடிவமைக்கப்பட்ட கல்வித் திட்டம்.'
        },
        goals: {
            en: 'Increase Tamil literacy among youth, develop interactive learning materials, and establish community learning centers.',
            ta: 'இளைஞர்களிடையே தமிழ் எழுத்தறிவை அதிகரித்தல், ஊடாடும் கற்றல் பொருட்களை உருவாக்குதல் மற்றும் சமூக கற்றல் மையங்களை நிறுவுதல்.'
        },
        director: {
            en: 'Prof. Ravi Kumar',
            ta: 'பேராசிரியர் ரவி குமார்'
        },
        director_name: 'Prof. Ravi Kumar',
        director_email: 'ravi.kumar@tamilsociety.org',
        director_phone: '+1-555-0202',
        status: 'active',
        startDate: new Date('2023-06-01'),
        endDate: new Date('2024-05-31'),
        budget: 75000,
        bureau: 'education-intellectual',
        participants: 150,
        isActive: true
    }
];

// Sample Team Members Data
const teamMembersData = [
    {
        name: {
            en: 'Dr. Lakshmi Krishnan',
            ta: 'டாக்டர் லக்ஷ்மி கிருஷ்ணன்'
        },
        slug: 'dr-lakshmi-krishnan',
        bio: {
            en: 'Director and founder of Tamil Language Society with over 20 years of experience in Tamil linguistics and cultural preservation.',
            ta: 'தமிழ் மொழியியல் மற்றும் பண்பாட்டு பாதுகாப்பில் 20 ஆண்டுகளுக்கும் மேலான அனுபவம் கொண்ட தமிழ் மொழி சங்கத்தின் இயக்குநர் மற்றும் நிறுவனர்.'
        },
        role: 'President',
        email: 'lakshmi@tamilsociety.org',
        phone: '+1-555-0101',
        isActive: true,
        order_num: 1
    },
    {
        name: {
            en: 'Prof. Murugan Selvam',
            ta: 'பேராசிரியர் முருகன் செல்வம்'
        },
        slug: 'prof-murugan-selvam',
        bio: {
            en: 'Senior researcher specializing in classical Tamil literature and ancient manuscripts.',
            ta: 'செம்மொழி தமிழ் இலக்கியம் மற்றும் பண்டைய கையெழுத்துப் பிரதிகளில் நிபுணத்துவம் பெற்ற மூத்த ஆராய்ச்சியாளர்.'
        },
        role: 'Executive Committee - Language & Literature',
        email: 'murugan@tamilsociety.org',
        phone: '+1-555-0102',
        isActive: true,
        order_num: 2
    },
    {
        name: {
            en: 'Ms. Kavitha Raman',
            ta: 'திருமதி கவிதா ராமன்'
        },
        slug: 'ms-kavitha-raman',
        bio: {
            en: 'Education coordinator responsible for developing Tamil learning curricula and community outreach programs.',
            ta: 'தமிழ் கற்றல் பாடத்திட்டங்கள் மற்றும் சமூக அணுகல் திட்டங்களை உருவாக்குவதற்கு பொறுப்பான கல்வி ஒருங்கிணைப்பாளர்.'
        },
        role: 'Executive Committee - Education & Intellectual',
        email: 'kavitha@tamilsociety.org',
        phone: '+1-555-0103',
        isActive: true,
        order_num: 3
    },
    {
        name: {
            en: 'Mr. Rajesh Kumar',
            ta: 'திரு ராஜேஷ் குமார்'
        },
        slug: 'mr-rajesh-kumar',
        bio: {
            en: 'Vice President with expertise in organizational management and strategic planning for Tamil cultural initiatives.',
            ta: 'தமிழ் கலாச்சார முன்முயற்சிகளுக்கான நிறுவன மேலாண்மை மற்றும் மூலோபாய திட்டமிடலில் நிபுணத்துவம் கொண்ட துணைத் தலைவர்.'
        },
        role: 'Vice President',
        email: 'rajesh@tamilsociety.org',
        phone: '+1-555-0104',
        isActive: true,
        order_num: 4
    },
    {
        name: {
            en: 'Ms. Priya Nair',
            ta: 'திருமதி பிரியா நாயர்'
        },
        slug: 'ms-priya-nair',
        bio: {
            en: 'Secretary responsible for maintaining organizational records and coordinating meetings.',
            ta: 'நிறுவன பதிவுகளை பராமரிப்பதற்கும் கூட்டங்களை ஒருங்கிணைப்பதற்கும் பொறுப்பான செயலாளர்.'
        },
        role: 'Secretary',
        email: 'priya@tamilsociety.org',
        phone: '+1-555-0105',
        isActive: true,
        order_num: 5
    },
    {
        name: {
            en: 'Mr. Suresh Babu',
            ta: 'திரு சுரேஷ் பாபு'
        },
        slug: 'mr-suresh-babu',
        bio: {
            en: 'Treasurer managing financial operations and budget planning for all society activities.',
            ta: 'அனைத்து சங்க நடவடிக்கைகளுக்கான நிதி நடவடிக்கைகள் மற்றும் பட்ஜெட் திட்டமிடலை நிர்வகிக்கும் பொருளாளர்.'
        },
        role: 'Treasurer',
        email: 'suresh@tamilsociety.org',
        phone: '+1-555-0106',
        isActive: true,
        order_num: 6
    },
    {
        name: {
            en: 'Ms. Meera Sundaram',
            ta: 'திருமதி மீரா சுந்தரம்'
        },
        slug: 'ms-meera-sundaram',
        bio: {
            en: 'Executive Committee member specializing in media relations and public outreach programs.',
            ta: 'ஊடக தொடர்புகள் மற்றும் பொது அணுகல் திட்டங்களில் நிபுணத்துவம் பெற்ற நிர்வாகக் குழு உறுப்பினர்.'
        },
        role: 'Executive Committee - Media & Public Relations',
        email: 'meera@tamilsociety.org',
        phone: '+1-555-0107',
        isActive: true,
        order_num: 7
    },
    {
        name: {
            en: 'Mr. Arjun Patel',
            ta: 'திரு அர்ஜுன் பட்டேல்'
        },
        slug: 'mr-arjun-patel',
        bio: {
            en: 'Executive Committee member leading sports and leadership development programs.',
            ta: 'விளையாட்டு மற்றும் தலைமைத்துவ மேம்பாட்டு திட்டங்களை வழிநடத்தும் நிர்வாகக் குழு உறுப்பினர்.'
        },
        role: 'Executive Committee - Sports & Leadership',
        email: 'arjun@tamilsociety.org',
        phone: '+1-555-0108',
        isActive: true,
        order_num: 8
    },
    {
        name: {
            en: 'Ms. Divya Krishnan',
            ta: 'திருமதி திவ்யா கிருஷ்ணன்'
        },
        slug: 'ms-divya-krishnan',
        bio: {
            en: 'Executive Committee member overseeing arts and cultural preservation initiatives.',
            ta: 'கலை மற்றும் கலாச்சார பாதுகாப்பு முன்முயற்சிகளை மேற்பார்வையிடும் நிர்வாகக் குழு உறுப்பினர்.'
        },
        role: 'Executive Committee - Arts & Culture',
        email: 'divya@tamilsociety.org',
        phone: '+1-555-0109',
        isActive: true,
        order_num: 9
    },
    {
        name: {
            en: 'Mr. Karthik Raman',
            ta: 'திரு கார்த்திக் ராமன்'
        },
        slug: 'mr-karthik-raman',
        bio: {
            en: 'Executive Committee member coordinating social welfare and voluntary service programs.',
            ta: 'சமூக நலன் மற்றும் தன்னார்வ சேவை திட்டங்களை ஒருங்கிணைக்கும் நிர்வாகக் குழு உறுப்பினர்.'
        },
        role: 'Executive Committee - Social Welfare & Voluntary',
        email: 'karthik@tamilsociety.org',
        phone: '+1-555-0110',
        isActive: true,
        order_num: 10
    },
    {
        name: {
            en: 'Ms. Anitha Venkat',
            ta: 'திருமதி அனிதா வெங்கட்'
        },
        slug: 'ms-anitha-venkat',
        bio: {
            en: 'Auditor responsible for financial oversight and compliance monitoring.',
            ta: 'நிதி மேற்பார்வை மற்றும் இணக்க கண்காணிப்புக்கு பொறுப்பான தணிக்கையாளர்.'
        },
        role: 'Auditor',
        email: 'anitha@tamilsociety.org',
        phone: '+1-555-0111',
        isActive: true,
        order_num: 11
    },
    {
        name: {
            en: 'Mr. Vijay Sharma',
            ta: 'திரு விஜய் ஷர்மா'
        },
        slug: 'mr-vijay-sharma',
        bio: {
            en: 'Auditor specializing in internal audit and risk management.',
            ta: 'உள் தணிக்கை மற்றும் இடர் மேலாண்மையில் நிபுணத்துவம் பெற்ற தணிக்கையாளர்.'
        },
        role: 'Auditor',
        email: 'vijay@tamilsociety.org',
        phone: '+1-555-0112',
        isActive: true,
        order_num: 12
    },
    {
        name: {
            en: 'Ms. Sangeetha Iyer',
            ta: 'திருமதி சங்கீதா ஐயர்'
        },
        slug: 'ms-sangeetha-iyer',
        bio: {
            en: 'Auditor ensuring transparency and accountability in organizational operations.',
            ta: 'நிறுவன நடவடிக்கைகளில் வெளிப்படைத்தன்மை மற்றும் பொறுப்புக்கூறலை உறுதி செய்யும் தணிக்கையாளர்.'
        },
        role: 'Auditor',
        email: 'sangeetha@tamilsociety.org',
        phone: '+1-555-0113',
        isActive: true,
        order_num: 13
    }
];

// Sample Posters Data
const postersData = [
    {
        title: {
            en: 'Tamil New Year Celebration 2025',
            ta: 'தமிழ் புத்தாண்டு கொண்டாட்டம் 2025'
        },
        description: {
            en: 'Join us for a grand celebration of Tamil New Year with cultural performances, traditional food, and community activities.',
            ta: 'பண்பாட்டு நிகழ்ச்சிகள், பாரம்பரிய உணவு மற்றும் சமூக நடவடிக்கைகளுடன் தமிழ் புத்தாண்டின் பிரமாண்ட கொண்டாட்டத்தில் எங்களுடன் சேருங்கள்.'
        },
        image_path: '/uploads/posters/tamil-new-year-2025.jpg',
        buttonText: {
            en: 'Register Now',
            ta: 'இப்போது பதிவு செய்யுங்கள்'
        },
        link_url: '/events/tamil-new-year-2025',
        priority: 1,
        is_active: true,
        start_at: new Date('2025-03-01'),
        end_at: new Date('2025-04-30'),
        created_by: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011')
    },
    {
        title: {
            en: 'Tamil Literature Workshop',
            ta: 'தமிழ் இலக்கிய பட்டறை'
        },
        description: {
            en: 'Learn about classical and modern Tamil literature in this comprehensive workshop led by renowned scholars.',
            ta: 'புகழ்பெற்ற அறிஞர்களால் நடத்தப்படும் இந்த விரிவான பட்டறையில் செம்மொழி மற்றும் நவீன தமிழ் இலக்கியத்தைப் பற்றி அறியுங்கள்.'
        },
        image_path: '/uploads/posters/tamil-literature-workshop.jpg',
        buttonText: {
            en: 'Learn More',
            ta: 'மேலும் அறியுங்கள்'
        },
        link_url: '/workshops/tamil-literature',
        priority: 2,
        is_active: true,
        start_at: new Date('2025-01-15'),
        end_at: new Date('2025-03-15'),
        created_by: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011')
    }
];

// Sample Activities Data
const activitiesData = [
    {
        title: {
            en: 'Weekly Tamil Conversation Circle',
            ta: 'வாராந்திர தமிழ் உரையாடல் வட்டம்'
        },
        slug: 'weekly-tamil-conversation-circle',
        description: {
            en: 'Practice Tamil conversation skills in a friendly, supportive environment with native speakers and learners.',
            ta: 'தாய்மொழி பேசுபவர்கள் மற்றும் கற்பவர்களுடன் நட்பு, ஆதரவான சூழலில் தமிழ் உரையாடல் திறன்களை பயிற்சி செய்யுங்கள்.'
        },
        bureau: 'education-intellectual',
        director: {
            en: 'Education Director',
            ta: 'கல்வி இயக்குநர்'
        },
        director_name: 'Dr. Priya Sharma',
        director_email: 'priya.sharma@tamilsociety.org',
        director_phone: '+1-555-0123',
        status: 'active',
        goals: {
            en: 'Improve Tamil conversation skills and build community connections',
            ta: 'தமிழ் உரையாடல் திறன்களை மேம்படுத்துதல் மற்றும் சமூக தொடர்புகளை உருவாக்குதல்'
        },
        progress: 75,
        start_date: new Date('2025-01-20'),
        end_date: new Date('2025-12-31'),
        location: {
            en: 'Community Hall',
            ta: 'சமூக மண்டபம்'
        },
        is_active: true
    },
    {
        title: {
            en: 'Tamil Cooking Workshop',
            ta: 'தமிழ் சமையல் பட்டறை'
        },
        slug: 'tamil-cooking-workshop',
        description: {
            en: 'Learn to prepare traditional Tamil dishes while practicing Tamil vocabulary related to cooking and food.',
            ta: 'சமையல் மற்றும் உணவு தொடர்பான தமிழ் சொற்களை பயிற்சி செய்யும் போது பாரம்பரிய தமிழ் உணவுகளை தயாரிக்க கற்றுக்கொள்ளுங்கள்.'
        },
        bureau: 'arts-culture',
        director: {
            en: 'Cultural Director',
            ta: 'பண்பாட்டு இயக்குநர்'
        },
        director_name: 'Ms. Meera Krishnan',
        director_email: 'meera.krishnan@tamilsociety.org',
        director_phone: '+1-555-0124',
        status: 'active',
        goals: {
            en: 'Preserve Tamil culinary traditions and enhance cultural knowledge',
            ta: 'தமிழ் சமையல் பாரம்பரியங்களை பாதுகாத்தல் மற்றும் பண்பாட்டு அறிவை மேம்படுத்துதல்'
        },
        progress: 90,
        start_date: new Date('2025-02-10'),
        end_date: new Date('2025-02-10'),
        location: {
            en: 'Community Kitchen',
            ta: 'சமூக சமையலறை'
        },
        is_active: true
    }
];

// Sample Initiatives Data
const initiativesData = [
    {
        title: {
            en: 'Tamil Digital Archive Project',
            ta: 'தமிழ் டிஜிட்டல் காப்பக திட்டம்'
        },
        slug: 'tamil-digital-archive-project',
        description: {
            en: 'Creating a comprehensive digital archive of Tamil manuscripts, books, and cultural artifacts for future generations.',
            ta: 'எதிர்கால சந்ததியினருக்காக தமிழ் கையெழுத்துப் பிரதிகள், புத்தகங்கள் மற்றும் பண்பாட்டு கலைப்பொருட்களின் விரிவான டிஜிட்டல் காப்பகத்தை உருவாக்குதல்.'
        },
        bureau: 'education-intellectual',
        director: {
            en: 'Archive Director',
            ta: 'காப்பக இயக்குநர்'
        },
        director_name: 'Prof. Rajesh Kumar',
        director_email: 'rajesh.kumar@tamilsociety.org',
        director_phone: '+1-555-0125',
        goals: {
            en: 'Digitize 10,000 manuscripts and documents, create searchable database, and provide free public access.',
            ta: '10,000 கையெழுத்துப் பிரதிகள் மற்றும் ஆவணங்களை டிஜிட்டல் மயமாக்குதல், தேடக்கூடிய தரவுத்தளத்தை உருவாக்குதல் மற்றும் இலவச பொது அணுகலை வழங்குதல்.'
        },
        status: 'active',
        start_date: new Date('2023-01-01'),
        end_date: new Date('2026-12-31'),
        budget: 500000,
        progress: 35,
        is_active: true
    }
];

// Main seeding function
const seedDatabase = async () => {
    try {
        console.log('🌱 Starting comprehensive database seeding...');
        
        // Clear existing data
        console.log('🗑️ Clearing existing data...');
        await Promise.all([
            WebsiteContent.deleteMany({}),
            Book.deleteMany({}),
            Ebook.deleteMany({}),
            Project.deleteMany({}),
            Initiative.deleteMany({}),
            Activity.deleteMany({}),
            TeamMember.deleteMany({}),
            Poster.deleteMany({}),
            User.deleteMany({})
        ]);
        
        // Create admin user if not exists
        let adminUser = await User.findOne({ email: 'admin@tamilsociety.org' });
        if (!adminUser) {
            adminUser = await User.create({
                full_name: 'Tamil Language Society Admin',
                name: 'Admin User',
                email: 'admin@tamilsociety.org',
                password: 'admin123',
                role: 'admin',
                isActive: true
            });
            console.log('👤 Admin user created');
        }
        
        // Seed Website Content
        console.log('📄 Seeding website content...');
        
        // Validate each entry before processing
        console.log('🔍 Validating entries before insertion...');
        for (let i = 0; i < websiteContentData.length; i++) {
            const entry = websiteContentData[i];
            if (!entry.title || !entry.title.en || !entry.title.ta) {
                console.error(`❌ Entry ${i} (${entry.sectionKey}) is missing title fields:`, {
                    hasTitle: !!entry.title,
                    hasEnTitle: !!(entry.title && entry.title.en),
                    hasTaTitle: !!(entry.title && entry.title.ta),
                    sectionKey: entry.sectionKey,
                    page: entry.page,
                    section: entry.section
                });
            }
        }
        
        const websiteContentPromises = websiteContentData.map(async (content) => {
            if (content.images && content.images.length === 0) {
                // Create sample logo image for global elements
                if (content.sectionKey.includes('logo')) {
                    const imagePath = await createSampleImage('website-content', `${content.sectionKey}.svg`, 'TLS Logo');
                    if (imagePath) {
                        content.images = [imagePath];
                    }
                }
            }
            return {
                ...content,
                createdBy: adminUser._id,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        });
        
        const websiteContents = await Promise.all(websiteContentPromises);
        await WebsiteContent.insertMany(websiteContents);
        console.log(`✅ Created ${websiteContents.length} website content entries`);
        
        // Seed Books with images
        console.log('📚 Seeding books...');
        const booksWithImages = await Promise.all(booksData.map(async (book, index) => {
            const bookId = new mongoose.Types.ObjectId();
            const imagePath = await createSampleImage('books', `${bookId}.svg`, book.title.en);
            return {
                _id: bookId,
                ...book,
                images: imagePath ? [imagePath] : [],
                createdBy: adminUser._id,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }));
        await Book.insertMany(booksWithImages);
        console.log(`✅ Created ${booksWithImages.length} books`);
        
        // Seed Ebooks with images
        console.log('📖 Seeding ebooks...');
        const ebooksWithImages = await Promise.all(ebooksData.map(async (ebook, index) => {
            const ebookId = new mongoose.Types.ObjectId();
            const imagePath = await createSampleImage('ebooks', `${ebookId}.svg`, ebook.title.en);
            return {
                _id: ebookId,
                ...ebook,
                coverImage: imagePath,
                createdBy: adminUser._id,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }));
        await Ebook.insertMany(ebooksWithImages);
        console.log(`✅ Created ${ebooksWithImages.length} ebooks`);
        
        // Seed Projects with images
        console.log('🎯 Seeding projects...');
        const projectsWithImages = await Promise.all(projectsData.map(async (project, index) => {
            const projectId = new mongoose.Types.ObjectId();
            const imagePath = await createSampleImage('projects', `${projectId}.svg`, project.title.en);
            return {
                _id: projectId,
                ...project,
                images: imagePath ? [imagePath] : [],
                createdBy: adminUser._id,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }));
        await Project.insertMany(projectsWithImages);
        console.log(`✅ Created ${projectsWithImages.length} projects`);
        
        // Seed Team Members with images
        console.log('👥 Seeding team members...');
        const teamMembersWithImages = await Promise.all(teamMembersData.map(async (member, index) => {
            const memberId = new mongoose.Types.ObjectId();
            const imagePath = await createSampleImage('teams', `${memberId}.svg`, member.name.en);
            return {
                _id: memberId,
                ...member,
                image: imagePath,
                createdBy: adminUser._id,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }));
        await TeamMember.insertMany(teamMembersWithImages);
        console.log(`✅ Created ${teamMembersWithImages.length} team members`);
        
        // Seed Posters with images
        console.log('📋 Seeding posters...');
        const postersWithImages = await Promise.all(postersData.map(async (poster, index) => {
            const posterId = new mongoose.Types.ObjectId();
            const imagePath = await createSampleImage('posters', `${posterId}.svg`, poster.title.en);
            return {
                _id: posterId,
                ...poster,
                image: imagePath,
                createdBy: adminUser._id,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }));
        await Poster.insertMany(postersWithImages);
        console.log(`✅ Created ${postersWithImages.length} posters`);
        
        // Seed Activities with images
        console.log('🎭 Seeding activities...');
        const activitiesWithImages = await Promise.all(activitiesData.map(async (activity, index) => {
            const activityId = new mongoose.Types.ObjectId();
            const imagePath = await createSampleImage('activities', `${activityId}.svg`, activity.title.en);
            return {
                _id: activityId,
                ...activity,
                images: imagePath ? [imagePath] : [],
                createdBy: adminUser._id,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }));
        await Activity.insertMany(activitiesWithImages);
        console.log(`✅ Created ${activitiesWithImages.length} activities`);
        
        // Seed Initiatives with images
        console.log('🚀 Seeding initiatives...');
        const initiativesWithImages = await Promise.all(initiativesData.map(async (initiative, index) => {
            const initiativeId = new mongoose.Types.ObjectId();
            const imagePath = await createSampleImage('initiatives', `${initiativeId}.svg`, initiative.title.en);
            return {
                _id: initiativeId,
                ...initiative,
                images: imagePath ? [imagePath] : [],
                createdBy: adminUser._id,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }));
        await Initiative.insertMany(initiativesWithImages);
        console.log(`✅ Created ${initiativesWithImages.length} initiatives`);
        
        console.log('🎉 Database seeding completed successfully!');
        console.log('📊 Summary:');
        console.log(`   - Website Content: ${websiteContents.length} entries`);
        console.log(`   - Books: ${booksWithImages.length} entries`);
        console.log(`   - Ebooks: ${ebooksWithImages.length} entries`);
        console.log(`   - Projects: ${projectsWithImages.length} entries`);
        console.log(`   - Team Members: ${teamMembersWithImages.length} entries`);
        console.log(`   - Posters: ${postersWithImages.length} entries`);
        console.log(`   - Activities: ${activitiesWithImages.length} entries`);
        console.log(`   - Initiatives: ${initiativesWithImages.length} entries`);
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
    require('dotenv').config();
    
    connectDB().then(() => {
        return seedDatabase();
    }).then(() => {
        console.log('✅ Seeding process completed');
        process.exit(0);
    }).catch((error) => {
        console.error('❌ Seeding process failed:', error);
        process.exit(1);
    });
}

module.exports = { seedDatabase, connectDB };