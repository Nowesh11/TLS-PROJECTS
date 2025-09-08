const mongoose = require('mongoose');
const WebsiteContent = require('./models/WebsiteContent');
const User = require('./models/User');

// MongoDB connection
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/tls-projects', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const addBilingualContent = async () => {
    try {
        await connectDB();
        
        // Find or create a default admin user for createdBy field
        let adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            console.log('No admin user found, creating default admin...');
            adminUser = new User({
                name: 'Admin',
                full_name: 'System Administrator',
                username: 'admin',
                email: 'admin@tamillanguagesociety.org',
                password: 'defaultpassword123',
                role: 'admin',
                isActive: true
            });
            await adminUser.save();
        }
        
        console.log('Using admin user:', adminUser._id);
        
        // Clear existing content
        await WebsiteContent.deleteMany({});
        console.log('Cleared existing website content');
        
        const bilingualContent = [
            // Global Navigation Content
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
                isActive: true,
                isVisible: true,
                createdBy: adminUser._id
            },
            
            // About Page Content
            {
                page: 'about',
                section: 'hero',
                sectionKey: 'title',
                sectionType: 'hero',
                layout: 'full-width',
                position: 1,
                title: {
                    en: 'About Tamil Language Society',
                    ta: 'தமிழ்ப் பேரவை பற்றி'
                },
                content: {
                    en: 'About Tamil Language Society',
                    ta: 'தமிழ்ப் பேரவை பற்றி'
                },
                isActive: true,
                isVisible: true,
                createdBy: adminUser._id
            },
            {
                page: 'about',
                section: 'hero',
                sectionKey: 'quote',
                sectionType: 'text',
                layout: 'full-width',
                position: 2,
                content: {
                    en: 'Preserving the beauty and richness of Tamil language for future generations',
                    ta: 'எதிர்கால சந்ததியினருக்காக தமிழ் மொழியின் அழகையும் செழுமையையும் பாதுகாத்தல்'
                },
                isActive: true,
                isVisible: true,
                createdBy: adminUser._id
            },
            {
                page: 'about',
                section: 'history',
                sectionKey: 'title',
                sectionType: 'text',
                layout: 'full-width',
                position: 1,
                title: {
                    en: 'Our History',
                    ta: 'எங்கள் வரலாறு'
                },
                content: {
                    en: 'Our History',
                    ta: 'எங்கள் வரலாறு'
                },
                isActive: true,
                isVisible: true,
                createdBy: adminUser._id
            },
            {
                page: 'about',
                section: 'values',
                sectionKey: 'title',
                sectionType: 'text',
                layout: 'full-width',
                position: 1,
                title: {
                    en: 'Our Values',
                    ta: 'எங்கள் மதிப்புகள்'
                },
                content: {
                    en: 'Our Values',
                    ta: 'எங்கள் மதிப்புகள்'
                },
                isActive: true,
                isVisible: true,
                createdBy: adminUser._id
            },
            {
                page: 'about',
                section: 'team',
                sectionKey: 'title',
                sectionType: 'text',
                layout: 'full-width',
                position: 1,
                title: {
                    en: 'Meet Our Team',
                    ta: 'எங்கள் குழுவை சந்திக்கவும்'
                },
                content: {
                    en: 'Meet Our Team',
                    ta: 'எங்கள் குழுவை சந்திக்கவும்'
                },
                isActive: true,
                isVisible: true,
                createdBy: adminUser._id
            },
            {
                page: 'about',
                section: 'cta',
                sectionKey: 'title',
                sectionType: 'text',
                layout: 'full-width',
                position: 1,
                title: {
                    en: 'Join Our Mission',
                    ta: 'எங்கள் நோக்கத்தில் சேரவும்'
                },
                content: {
                    en: 'Join Our Mission',
                    ta: 'எங்கள் நோக்கத்தில் சேரவும்'
                },
                isActive: true,
                isVisible: true,
                createdBy: adminUser._id
            },
            
            // Ebooks Page Content
            {
                page: 'ebooks',
                section: 'hero',
                sectionKey: 'title',
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
                isActive: true,
                isVisible: true,
                createdBy: adminUser._id
            },
            {
                page: 'ebooks',
                section: 'hero',
                sectionKey: 'quote',
                sectionType: 'text',
                layout: 'full-width',
                position: 2,
                content: {
                    en: 'Those without knowledge of books are dull in wisdom',
                    ta: 'நூல் நுணுக்கம் இல்லாதவர் அறிவில் மழுங்கியவர்'
                },
                isActive: true,
                isVisible: true,
                createdBy: adminUser._id
            },
            {
                page: 'ebooks',
                section: 'featured',
                sectionKey: 'title',
                sectionType: 'text',
                layout: 'full-width',
                position: 1,
                title: {
                    en: 'Featured Books',
                    ta: 'சிறப்பு நூல்கள்'
                },
                content: {
                    en: 'Featured Books',
                    ta: 'சிறப்பு நூல்கள்'
                },
                isActive: true,
                isVisible: true,
                createdBy: adminUser._id
            },
            {
                page: 'ebooks',
                section: 'categories',
                sectionKey: 'title',
                sectionType: 'text',
                layout: 'full-width',
                position: 1,
                title: {
                    en: 'Browse by Category',
                    ta: 'பிரிவு வாரியாக பார்க்கவும்'
                },
                content: {
                    en: 'Browse by Category',
                    ta: 'பிரிவு வாரியாக பார்க்கவும்'
                },
                isActive: true,
                isVisible: true,
                createdBy: adminUser._id
            },
            {
                page: 'ebooks',
                section: 'new-books',
                sectionKey: 'title',
                sectionType: 'text',
                layout: 'full-width',
                position: 1,
                title: {
                    en: 'New Books',
                    ta: 'புதிய நூல்கள்'
                },
                content: {
                    en: 'New Books',
                    ta: 'புதிய நூல்கள்'
                },
                isActive: true,
                isVisible: true,
                createdBy: adminUser._id
            },
            {
                page: 'ebooks',
                section: 'statistics',
                sectionKey: 'title',
                sectionType: 'text',
                layout: 'full-width',
                position: 1,
                title: {
                    en: 'Library Statistics',
                    ta: 'நூலக புள்ளிவிவரங்கள்'
                },
                content: {
                    en: 'Library Statistics',
                    ta: 'நூலக புள்ளிவிவரங்கள்'
                },
                isActive: true,
                isVisible: true,
                createdBy: adminUser._id
            },
            
            // Projects Page Content
            {
                page: 'projects',
                section: 'hero',
                sectionKey: 'title-tamil',
                sectionType: 'hero',
                layout: 'full-width',
                position: 1,
                title: {
                    en: 'Our Projects',
                    ta: 'எங்கள் திட்டங்கள்'
                },
                content: {
                    en: 'Our Projects',
                    ta: 'எங்கள் திட்டங்கள்'
                },
                isActive: true,
                isVisible: true,
                createdBy: adminUser._id
            },
            {
                page: 'projects',
                section: 'hero',
                sectionKey: 'quote-tamil',
                sectionType: 'text',
                layout: 'full-width',
                position: 2,
                content: {
                    en: 'Action is life',
                    ta: 'செயலே வாழ்க்கை'
                },
                isActive: true,
                isVisible: true,
                createdBy: adminUser._id
            },
            {
                page: 'projects',
                section: 'cta',
                sectionKey: 'title-tamil',
                sectionType: 'text',
                layout: 'full-width',
                position: 1,
                title: {
                    en: 'Get Involved',
                    ta: 'பங்கேற்கவும்'
                },
                content: {
                    en: 'Get Involved',
                    ta: 'பங்கேற்கவும்'
                },
                isActive: true,
                isVisible: true,
                createdBy: adminUser._id
            },
            
            // Contact Page Content
            {
                page: 'contact',
                section: 'hero',
                sectionKey: 'quote-tamil',
                sectionType: 'text',
                layout: 'full-width',
                position: 1,
                content: {
                    en: 'Contact us - We are waiting for you',
                    ta: 'தொடர்பு கொள்ளுங்கள் - நாங்கள் உங்களுக்காக காத்திருக்கிறோம்'
                },
                isActive: true,
                isVisible: true,
                createdBy: adminUser._id
            },
            {
                page: 'contact',
                section: 'map',
                sectionKey: 'title-tamil',
                sectionType: 'text',
                layout: 'full-width',
                position: 1,
                title: {
                    en: 'Find Us',
                    ta: 'எங்களை கண்டுபிடிக்கவும்'
                },
                content: {
                    en: 'Find Us',
                    ta: 'எங்களை கண்டுபிடிக்கவும்'
                },
                isActive: true,
                isVisible: true,
                createdBy: adminUser._id
            },
            {
                page: 'contact',
                section: 'faq',
                sectionKey: 'title-tamil',
                sectionType: 'text',
                layout: 'full-width',
                position: 1,
                title: {
                    en: 'Frequently Asked Questions',
                    ta: 'அடிக்கடி கேட்கப்படும் கேள்விகள்'
                },
                content: {
                    en: 'Frequently Asked Questions',
                    ta: 'அடிக்கடி கேட்கப்படும் கேள்விகள்'
                },
                isActive: true,
                isVisible: true,
                createdBy: adminUser._id
            }
        ];
        
        // Insert all content
        const result = await WebsiteContent.insertMany(bilingualContent);
        console.log(`Successfully inserted ${result.length} bilingual content entries`);
        
        console.log('Migration completed successfully!');
        
    } catch (error) {
        console.error('Migration failed:', error);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`Validation error for ${key}:`, error.errors[key].message);
            });
        }
    } finally {
        await mongoose.disconnect();
        console.log('Database connection closed');
    }
};

// Run the migration
addBilingualContent();