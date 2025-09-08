const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const WebsiteContent = require('../models/WebsiteContent');
const ContentKeyValue = require('../models/ContentKeyValue');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// HTML files to process
const htmlFiles = [
    'index.html',
    'about.html', 
    'contact.html',
    'projects.html',
    'books.html',
    'ebooks.html',
    'login.html',
    'signup.html',
    'forgot-password.html',
    'reset-password.html',
    'notifications.html',
    'detail.html'
];

// Real bilingual content data
const bilingualContent = {
    // Global/Common content
    'global-site-title': {
        en: 'Tamil Language Society',
        ta: 'தமிழ் மொழி சங்கம்',
        type: 'title'
    },
    'global-logo-text': {
        en: 'Tamil Language Society',
        ta: 'தமிழ் மொழி சங்கம்',
        type: 'title'
    },
    'global-footer-logo-text': {
        en: 'Tamil Language Society',
        ta: 'தமிழ் மொழி சங்கம்',
        type: 'title'
    },
    'global.navigation.logo-text': {
        en: 'Tamil Language Society',
        ta: 'தமிழ் மொழி சங்கம்',
        type: 'text'
    },
    'global.logo.text': {
        en: 'Tamil Language Society',
        ta: 'தமிழ் மொழி சங்கம்',
        type: 'text'
    },
    'footer.logo.text': {
        en: 'Tamil Language Society',
        ta: 'தமிழ் மொழி சங்கம்',
        type: 'text'
    },
    'global-language-toggle-tamil': {
        en: 'த',
        ta: 'த',
        type: 'title'
    },
    
    // Navigation menu items
    'global-menu-home': {
        en: 'Home',
        ta: 'முகப்பு',
        type: 'title'
    },
    'global-menu-about': {
        en: 'About',
        ta: 'எங்களைப் பற்றி',
        type: 'title'
    },
    'global-menu-projects': {
        en: 'Projects',
        ta: 'திட்டங்கள்',
        type: 'title'
    },
    'global-menu-ebooks': {
        en: 'E-Books',
        ta: 'மின்னூல்கள்',
        type: 'title'
    },
    'global-menu-bookstore': {
        en: 'Book Store',
        ta: 'புத்தக கடை',
        type: 'title'
    },
    'global-menu-contact': {
        en: 'Contact',
        ta: 'தொடர்பு',
        type: 'title'
    },
    'global-menu-login': {
        en: 'Login',
        ta: 'உள்நுழைவு',
        type: 'title'
    },
    'global-menu-signup': {
        en: 'Sign Up',
        ta: 'பதிவு செய்யுங்கள்',
        type: 'title'
    },
    
    // Homepage content
    'homepage-hero-title': {
        en: 'Preserving Tamil Heritage for Future Generations',
        ta: 'எதிர்கால சந்ததியினருக்காக தமிழ் பாரம்பரியத்தைப் பாதுகாத்தல்',
        type: 'title'
    },
    'homepage-hero-subtitle': {
        en: 'Join our mission to celebrate, preserve, and promote the rich Tamil language and culture through education, literature, and community engagement.',
        ta: 'கல்வி, இலக்கியம் மற்றும் சமூக ஈடுபாட்டின் மூலம் வளமான தமிழ் மொழி மற்றும் கலாச்சாரத்தைக் கொண்டாட, பாதுகாக்க மற்றும் மேம்படுத்துவதற்கான எங்கள் பணியில் சேருங்கள்.',
        type: 'content'
    },
    'homepage-hero-quote': {
        en: '"யாமறிந்த மொழிகளிலே தமிழ்மொழி போல் இனிதாவது எங்கும் காணோம்" - பாரதியார்',
        ta: '"யாமறிந்த மொழிகளிலே தமிழ்மொழி போல் இனிதாவது எங்கும் காணோம்" - பாரதியார்',
        type: 'content'
    },
    'homepage-hero-primary-button': {
        en: 'Explore Our Programs',
        ta: 'எங்கள் திட்டங்களை ஆராயுங்கள்',
        type: 'buttonText'
    },
    'homepage-hero-secondary-button': {
        en: 'Join Community',
        ta: 'சமூகத்தில் சேருங்கள்',
        type: 'buttonText'
    },
    
    // Homepage sections
    'homepage-posters-title': {
        en: 'Latest Announcements',
        ta: 'சமீபத்திய அறிவிப்புகள்',
        type: 'title'
    },
    'homepage-posters-subtitle': {
        en: 'Stay updated with our latest events and announcements',
        ta: 'எங்கள் சமீபத்திய நிகழ்வுகள் மற்றும் அறிவிப்புகளுடன் புதுப்பித்த நிலையில் இருங்கள்',
        type: 'content'
    },
    'homepage-features-title': {
        en: 'Our Services',
        ta: 'எங்கள் சேவைகள்',
        type: 'title'
    },
    
    // Features section
    'homepage-features-ebooks-title': {
        en: 'E-Books',
        ta: 'மின்னூல்கள்',
        type: 'title'
    },
    'homepage-features-ebooks-description': {
        en: 'Access thousands of Tamil books, literature, and educational resources in our comprehensive digital collection.',
        ta: 'எங்கள் விரிவான டிஜிட்டல் தொகுப்பில் ஆயிரக்கணக்கான தமிழ் புத்தகங்கள், இலக்கியம் மற்றும் கல்வி வளங்களை அணுகவும்.',
        type: 'content'
    },
    'homepage-features-ebooks-link': {
        en: 'Explore Library',
        ta: 'நூலகத்தை ஆராயுங்கள்',
        type: 'buttonText'
    },
    'homepage-features-projects-title': {
        en: 'Projects',
        ta: 'திட்டங்கள்',
        type: 'title'
    },
    'homepage-features-projects-description': {
        en: 'Join our initiatives, workshops, and events that celebrate Tamil heritage and traditions.',
        ta: 'தமிழ் பாரம்பரியம் மற்றும் மரபுகளைக் கொண்டாடும் எங்கள் முன்முயற்சிகள், பட்டறைகள் மற்றும் நிகழ்வுகளில் சேருங்கள்.',
        type: 'content'
    },
    'homepage-features-projects-link': {
        en: 'View Programs',
        ta: 'திட்டங்களைப் பார்க்கவும்',
        type: 'buttonText'
    },
    'homepage-features-bookstore-title': {
        en: 'Book Store',
        ta: 'புத்தக கடை',
        type: 'title'
    },
    'homepage-features-bookstore-description': {
        en: 'Purchase authentic Tamil literature, textbooks, and cultural materials from our curated collection.',
        ta: 'எங்கள் தேர்ந்தெடுக்கப்பட்ட தொகுப்பிலிருந்து உண்மையான தமிழ் இலக்கியம், பாடப்புத்தகங்கள் மற்றும் கலாச்சார பொருட்களை வாங்கவும்.',
        type: 'content'
    },
    'homepage-features-bookstore-link': {
        en: 'Shop Now',
        ta: 'இப்போது வாங்கவும்',
        type: 'buttonText'
    },
    'homepage-features-contact-title': {
        en: 'Contact',
        ta: 'தொடர்பு',
        type: 'title'
    },
    'homepage-features-contact-description': {
        en: 'Connect with fellow Tamil language enthusiasts and contribute to preserving our linguistic heritage.',
        ta: 'தமிழ் மொழி ஆர்வலர்களுடன் இணைந்து எங்கள் மொழியியல் பாரம்பரியத்தைப் பாதுகாப்பதில் பங்களிக்கவும்.',
        type: 'content'
    },
    'homepage-features-contact-link': {
        en: 'Get Involved',
        ta: 'ஈடுபடுங்கள்',
        type: 'buttonText'
    },
    
    // Statistics
    'homepage-statistics-books-label': {
        en: 'Digital Books',
        ta: 'டிஜிட்டல் புத்தகங்கள்',
        type: 'title'
    },
    'homepage-statistics-members-label': {
        en: 'Community Members',
        ta: 'சமூக உறுப்பினர்கள்',
        type: 'title'
    },
    'homepage-statistics-years-label': {
        en: 'Years of Service',
        ta: 'சேவை ஆண்டுகள்',
        type: 'title'
    },
    'homepage-statistics-projects-label': {
        en: 'Active Projects',
        ta: 'செயலில் உள்ள திட்டங்கள்',
        type: 'title'
    },
    
    // Footer content
    'global-footer-description': {
        en: 'Dedicated to preserving and promoting the rich heritage of Tamil language and culture worldwide.',
        ta: 'உலகளவில் தமிழ் மொழி மற்றும் கலாச்சாரத்தின் வளமான பாரம்பரியத்தைப் பாதுகாப்பதற்கும் மேம்படுத்துவதற்கும் அர்ப்பணிக்கப்பட்டுள்ளது.',
        type: 'content'
    },
    'global-footer-quicklinks-title': {
        en: 'Quick Links',
        ta: 'விரைவு இணைப்புகள்',
        type: 'title'
    },
    'global-footer-about-link': {
        en: 'About Us',
        ta: 'எங்களைப் பற்றி',
        type: 'title'
    },
    'global-footer-projects-link': {
        en: 'Projects',
        ta: 'திட்டங்கள்',
        type: 'title'
    },
    'global-footer-ebooks-link': {
        en: 'E-Books',
        ta: 'மின்னூல்கள்',
        type: 'title'
    },
    'global-footer-bookstore-link': {
        en: 'Book Store',
        ta: 'புத்தக கடை',
        type: 'title'
    },
    'global-footer-support-title': {
        en: 'Support',
        ta: 'ஆதரவு',
        type: 'title'
    },
    'global-footer-contact-link': {
        en: 'Contact Us',
        ta: 'எங்களைத் தொடர்பு கொள்ளுங்கள்',
        type: 'title'
    },
    'global-footer-notifications-link': {
        en: 'Notifications',
        ta: 'அறிவிப்புகள்',
        type: 'title'
    },
    'global-footer-newsletter-title': {
        en: 'Newsletter',
        ta: 'செய்திமடல்',
        type: 'title'
    },
    'global-footer-newsletter-description': {
        en: 'Stay updated with our latest news and events',
        ta: 'எங்கள் சமீபத்திய செய்திகள் மற்றும் நிகழ்வுகளுடன் புதுப்பித்த நிலையில் இருங்கள்',
        type: 'content'
    },
    'global-footer-email-placeholder': {
        en: 'Enter your email',
        ta: 'உங்கள் மின்னஞ்சலை உள்ளிடவும்',
        type: 'placeholder'
    },
    'global-footer-copyright': {
        en: '© 2025 Tamil Language Society. All rights reserved.',
        ta: '© 2025 தமிழ் மொழி சங்கம். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
        type: 'content'
    },
    
    // About page
    'about.meta.title': {
        en: 'About Us - Tamil Language Society',
        ta: 'எங்களைப் பற்றி - தமிழ் மொழி சங்கம்',
        type: 'text'
    },
    'about.hero.titleTamil': {
        en: 'About Us',
        ta: 'எங்களைப் பற்றி',
        type: 'text'
    },
    'about.hero.quote': {
        en: 'Rise with Tamil',
        ta: 'தமிழுடன் எழுங்கள்',
        type: 'text'
    },
    'about.history.titleTamil': {
        en: 'Our History',
        ta: 'எங்கள் வரலாறு',
        type: 'text'
    },
    'about.history.description': {
        en: 'Tamil Language Society was established in 2020 with the mission to preserve Tamil language and culture in the digital age. We have grown from a small group of enthusiasts to a global community of Tamil language advocates, educators, and cultural preservationists.',
        ta: 'தமிழ் மொழி சங்கம் 2020 இல் டிஜிட்டல் யுகத்தில் தமிழ் மொழி மற்றும் கலாச்சாரத்தைப் பாதுகாக்கும் நோக்கத்துடன் நிறுவப்பட்டது. நாங்கள் ஒரு சிறிய ஆர்வலர்கள் குழுவிலிருந்து தமிழ் மொழி வக்கீல்கள், கல்வியாளர்கள் மற்றும் கலாச்சார பாதுகாவலர்களின் உலகளாவிய சமூகமாக வளர்ந்துள்ளோம்.',
        type: 'text'
    },
    'about.values.titleTamil': {
        en: 'Our Core Values',
        ta: 'எங்கள் முக்கிய மதிப்புகள்',
        type: 'text'
    },
    'about.values.education.titleTamil': {
        en: 'Education',
        ta: 'கல்வி',
        type: 'text'
    },
    'about.values.community.titleTamil': {
        en: 'Community',
        ta: 'சமூகம்',
        type: 'text'
    },
    'about.values.preservation.titleTamil': {
        en: 'Preservation',
        ta: 'பாதுகாப்பு',
        type: 'text'
    },
    'about.values.global.titleTamil': {
        en: 'Global Reach',
        ta: 'உலகளாவிய அணுகல்',
        type: 'text'
    },
    'about.journey.title': {
        en: 'Our Journey',
        ta: 'எங்கள் பயணம்',
        type: 'text'
    },
    'about-team-title-tamil': {
        en: 'Our Team',
        ta: 'எங்கள் குழு',
        type: 'text'
    },
    'about-cta-title-tamil': {
        en: 'Join Our Mission',
        ta: 'எங்கள் பணியில் சேருங்கள்',
        type: 'text'
    },
    
    // Contact page
    'contact-hero-title': {
        en: 'Contact Us',
        ta: 'எங்களைத் தொடர்பு கொள்ளுங்கள்',
        type: 'title'
    },
    'contact.hero.quote-tamil': {
        en: 'We are here to help and connect with you',
        ta: 'நாங்கள் உங்களுக்கு உதவ மற்றும் உங்களுடன் இணைக்க இங்கே இருக்கிறோம்',
        type: 'text'
    },
    'contact-chat-title': {
        en: 'Live Chat',
        ta: 'நேரடி அரட்டை',
        type: 'title'
    },
    'contact-chat-description': {
        en: 'Chat with our support team',
        ta: 'எங்கள் ஆதரவு குழுவுடன் அரட்டையடிக்கவும்',
        type: 'content'
    },
    'contact.map.title-tamil': {
        en: 'Find Us',
        ta: 'எங்களைக் கண்டுபிடிக்கவும்',
        type: 'text'
    },
    'contact.faq.title-tamil': {
        en: 'Frequently Asked Questions',
        ta: 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
        type: 'text'
    },
    
    // Projects page
    'projects.hero.title-tamil': {
        en: 'Our Projects',
        ta: 'எங்கள் திட்டங்கள்',
        type: 'text'
    },
    'projects.hero.quote-tamil': {
        en: 'Building bridges between tradition and innovation',
        ta: 'பாரம்பரியம் மற்றும் புதுமைக்கு இடையே பாலங்களை உருவாக்குதல்',
        type: 'text'
    },
    'projects-title': {
        en: 'Projects',
        ta: 'திட்டங்கள்',
        type: 'title'
    },
    'activities-title': {
        en: 'Activities',
        ta: 'செயல்பாடுகள்',
        type: 'title'
    },
    'initiatives-title': {
        en: 'Initiatives',
        ta: 'முன்முயற்சிகள்',
        type: 'title'
    },
    'projects-stats-title': {
        en: 'Project Statistics',
        ta: 'திட்ட புள்ளிவிவரங்கள்',
        type: 'title'
    },
    'projects.cta.title-tamil': {
        en: 'Get Involved',
        ta: 'ஈடுபடுங்கள்',
        type: 'text'
    },
    
    // Books page
    'books-hero-title': {
        en: 'Tamil Book Collection',
        ta: 'தமிழ் புத்தக தொகுப்பு',
        type: 'title'
    },
    'books-hero-quote': {
        en: 'Discover the treasures of Tamil literature',
        ta: 'தமிழ் இலக்கியத்தின் பொக்கிஷங்களைக் கண்டறியுங்கள்',
        type: 'content'
    },
    'books-featured-title': {
        en: 'Featured Books',
        ta: 'சிறப்பு புத்தகங்கள்',
        type: 'title'
    },
    'books-browse-title': {
        en: 'Browse Categories',
        ta: 'வகைகளை உலாவவும்',
        type: 'title'
    },
    'books-stats-title': {
        en: 'Collection Statistics',
        ta: 'தொகுப்பு புள்ளிவிவரங்கள்',
        type: 'title'
    },
    
    // E-books page
    'ebooks.hero.titleTamil': {
        en: 'E-Book Library',
        ta: 'மின்னூல் நூலகம்',
        type: 'text'
    },
    'ebooks.hero.quote': {
        en: '"Those without knowledge of books are dull in wisdom"',
        ta: '"நூலின்றி ஞானமில்லை" - திருவள்ளுவர்',
        type: 'text'
    },
    'ebooks.featured.titleTamil': {
        en: 'Featured Books',
        ta: 'சிறப்பு நூல்கள்',
        type: 'text'
    },
    'ebooks.featured.book1.title': {
        en: 'Thirukkural',
        ta: 'திருக்குறள்',
        type: 'text'
    },
    'ebooks.featured.book1.author': {
        en: 'Thiruvalluvar',
        ta: 'திருவள்ளுவர்',
        type: 'text'
    },
    'ebooks.featured.book2.title': {
        en: 'Silappatikaram',
        ta: 'சிலப்பதிகாரம்',
        type: 'text'
    },
    'ebooks.featured.book2.author': {
        en: 'Ilango Adigal',
        ta: 'இளங்கோ அடிகள்',
        type: 'text'
    },
    'ebooks.featured.book3.title': {
        en: 'Tamil Grammar',
        ta: 'தமிழ் இலக்கணம்',
        type: 'text'
    },
    'ebooks.featured.book3.author': {
        en: 'Tolkappiyar',
        ta: 'தொல்காப்பியர்',
        type: 'text'
    },
    'ebooks.categories.titleTamil': {
        en: 'Browse by Category',
        ta: 'வகை வாரியாக உலாவவும்',
        type: 'text'
    },
    'ebooks.new.titleTamil': {
        en: 'New Books',
        ta: 'புதிய நூல்கள்',
        type: 'text'
    },
    'ebooks.stats.titleTamil': {
        en: 'Library Statistics',
        ta: 'நூலக புள்ளிவிவரங்கள்',
        type: 'text'
    },
    
    // Login page
    'login-welcome': {
        en: 'Welcome Back',
        ta: 'மீண்டும் வரவேற்கிறோம்',
        type: 'title'
    },
    
    // Forgot password page
    'forgot-password-title': {
        en: 'Reset Password',
        ta: 'கடவுச்சொல்லை மீட்டமைக்கவும்',
        type: 'title'
    },
    'forgot-password-sent-title': {
        en: 'Email Sent',
        ta: 'மின்னஞ்சல் அனுப்பப்பட்டது',
        type: 'title'
    },
    'new-password-title': {
        en: 'Create New Password',
        ta: 'புதிய கடவுச்சொல்லை உருவாக்கவும்',
        type: 'title'
    },
    'password-changed-title': {
        en: 'Password Changed',
        ta: 'கடவுச்சொல் மாற்றப்பட்டது',
        type: 'title'
    },
    
    // Notifications page
    'notifications-hero-title': {
        en: 'Notifications',
        ta: 'அறிவிப்புகள்',
        type: 'title'
    },
    'notifications-preferences-title': {
        en: 'Notification Preferences',
        ta: 'அறிவிப்பு விருப்பத்தேர்வுகள்',
        type: 'title'
    },
    
    // Detail page
    'tamil_description_title': {
        en: 'Tamil Description',
        ta: 'தமிழ் விளக்கம்',
        type: 'text'
    },
    'project_director_title': {
        en: 'Project Director',
        ta: 'திட்ட இயக்குநர்',
        type: 'text'
    }
};

// Function to extract data-key attributes from HTML files
function extractDataKeysFromHTML() {
    const viewsPath = path.join(__dirname, '../../frontend/views');
    const extractedKeys = new Set();
    
    htmlFiles.forEach(fileName => {
        const filePath = path.join(viewsPath, fileName);
        
        if (fs.existsSync(filePath)) {
            const htmlContent = fs.readFileSync(filePath, 'utf8');
            const $ = cheerio.load(htmlContent);
            
            // Find all elements with data-key attributes
            $('[data-key]').each((index, element) => {
                const dataKey = $(element).attr('data-key');
                const contentType = $(element).attr('data-content-type') || 'text';
                const textContent = $(element).text().trim();
                
                if (dataKey) {
                    extractedKeys.add({
                        key: dataKey,
                        type: contentType,
                        content: textContent,
                        file: fileName
                    });
                }
            });
            
            console.log(`✅ Processed ${fileName}`);
        } else {
            console.log(`⚠️ File not found: ${fileName}`);
        }
    });
    
    return Array.from(extractedKeys);
}

// Function to determine page from data key or file
function getPageFromKey(key, fileName) {
    // Extract page from key prefix - using valid enum values from ContentKeyValue model
    if (key.startsWith('homepage-') || fileName === 'index.html') {
        return 'homepage';
    }
    if (key.startsWith('about.') || fileName === 'about.html') {
        return 'about';
    }
    if (key.startsWith('contact') || fileName === 'contact.html') {
        return 'contact';
    }
    if (key.startsWith('projects') || fileName === 'projects.html') {
        return 'projects';
    }
    if (key.startsWith('books') || fileName === 'books.html') {
        return 'books';
    }
    if (key.startsWith('ebooks') || fileName === 'ebooks.html') {
        return 'ebooks';
    }
    if (key.startsWith('login') || fileName === 'login.html') {
        return 'login';
    }
    if (key.startsWith('signup') || fileName === 'signup.html') {
        return 'signup';
    }
    if (key.startsWith('forgot-password') || key.startsWith('new-password') || key.startsWith('password-changed') || fileName === 'forgot-password.html' || fileName === 'reset-password.html') {
        return 'login'; // Auth pages use login enum value
    }
    if (key.startsWith('notifications') || fileName === 'notifications.html') {
        return 'global'; // Notifications use global
    }
    if (fileName === 'detail.html') {
        return 'projects'; // Detail pages are part of projects
    }
    
    // Default to global for common elements
    return 'global';
}

// Function to determine element from data key
function getElementFromKey(key) {
    // Extract element type from key structure
    const parts = key.split('-');
    if (parts.length > 1) {
        return parts[parts.length - 1]; // Last part as element
    }
    
    // Handle dot notation keys
    const dotParts = key.split('.');
    if (dotParts.length > 1) {
        return dotParts[dotParts.length - 1]; // Last part as element
    }
    
    return 'content'; // Default element
}

// Function to populate database with bilingual content
async function populateDatabase() {
    try {
        console.log('🚀 Starting database population...');
        
        // Get admin user
        const adminUser = await User.findOne({ role: 'admin' }) || await User.findOne().sort({ createdAt: 1 });
        if (!adminUser) {
            throw new Error('No admin user found. Please create an admin user first.');
        }
        
        console.log(`👤 Using admin user: ${adminUser.email}`);
        
        // Extract data keys from HTML files
        const extractedKeys = extractDataKeysFromHTML();
        console.log(`📊 Found ${extractedKeys.length} data-key attributes`);
        
        let created = 0;
        let updated = 0;
        let skipped = 0;
        
        // Process each extracted key
        for (const keyData of extractedKeys) {
            const { key, type, content, file } = keyData;
            const page = getPageFromKey(key, file);
            const element = getElementFromKey(key);
            
            // Get bilingual content or use extracted content as fallback
            const bilingualData = bilingualContent[key];
            
            if (!bilingualData) {
                console.log(`⚠️ No bilingual data found for key: ${key}, skipping...`);
                skipped++;
                continue;
            }
            
            // Create ContentKeyValue entries for both languages
            for (const lang of ['en', 'ta']) {
                try {
                    const existingContent = await ContentKeyValue.findOne({
                        content_key: key,
                        language: lang
                    });
                    
                    // Map content type to valid enum values
                    let contentType = bilingualData.type || type || 'text';
                    const validTypes = ['text', 'image', 'link', 'html', 'meta'];
                    if (!validTypes.includes(contentType)) {
                        contentType = 'text'; // Default to text for invalid types
                    }
                    
                    const contentData = {
                        content_key: key,
                        language: lang,
                        content_value: bilingualData[lang] || content || '',
                        type: contentType, // Use 'type' not 'content_type'
                        page: page,
                        section: key.split('-')[0] || key.split('.')[0] || 'general',
                        element: element,
                        created_by: adminUser._id,
                        updated_by: adminUser._id,
                        is_active: true
                    };
                    
                    if (existingContent) {
                        // Update existing content
                        Object.assign(existingContent, contentData);
                        await existingContent.save();
                        updated++;
                        console.log(`🔄 Updated: ${key} (${lang})`);
                    } else {
                        // Create new content
                        await ContentKeyValue.create(contentData);
                        created++;
                        console.log(`✅ Created: ${key} (${lang})`);
                    }
                } catch (error) {
                    console.error(`❌ Error processing ${key} (${lang}):`, error.message);
                }
            }
        }
        
        console.log('\n📈 Database Population Summary:');
        console.log(`✅ Created: ${created} entries`);
        console.log(`🔄 Updated: ${updated} entries`);
        console.log(`⚠️ Skipped: ${skipped} entries`);
        console.log(`📊 Total processed: ${extractedKeys.length} keys`);
        
    } catch (error) {
        console.error('❌ Error populating database:', error);
        throw error;
    }
}

// Main execution
async function main() {
    try {
        console.log('🎯 Tamil Language Society - Data Key Extraction & Population');
        console.log('=' .repeat(60));
        
        await populateDatabase();
        
        console.log('\n🎉 Database population completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = {
    extractDataKeysFromHTML,
    populateDatabase,
    bilingualContent
};