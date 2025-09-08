const mongoose = require('mongoose');
const WebsiteContent = require('../models/WebsiteContent');
const connectDB = require('../config/db');

const seedMissingHomepageContent = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Missing homepage content keys
    const missingContent = [
      {
        page: 'homepage',
        section: 'hero',
        key: 'homepage.hero.image',
        content: {
          en: {
            image: '/frontend/public/assets/logo.png',
            alt: 'Tamil Language Society Logo'
          },
          ta: {
            image: '/frontend/public/assets/logo.png',
            alt: 'தமிழ் மொழி சங்கம் சின்னம்'
          }
        }
      },
      {
        page: 'homepage',
        section: 'statistics',
        key: 'homepage.statistics.booksCount',
        content: {
          en: {
            value: '50',
            label: 'Books Published'
          },
          ta: {
            value: '50',
            label: 'வெளியிடப்பட்ட புத்தகங்கள்'
          }
        }
      },
      {
        page: 'homepage',
        section: 'statistics',
        key: 'homepage.statistics.membersCount',
        content: {
          en: {
            value: '150',
            label: 'Active Members'
          },
          ta: {
            value: '150',
            label: 'செயலில் உள்ள உறுப்பினர்கள்'
          }
        }
      },
      {
        page: 'homepage',
        section: 'statistics',
        key: 'homepage.statistics.yearsCount',
        content: {
          en: {
            value: '3',
            label: 'Years of Service'
          },
          ta: {
            value: '3',
            label: 'சேவை ஆண்டுகள்'
          }
        }
      },
      {
        page: 'homepage',
        section: 'statistics',
        key: 'homepage.statistics.projectsCount',
        content: {
          en: {
            value: '15',
            label: 'Active Projects'
          },
          ta: {
            value: '15',
            label: 'செயலில் உள்ள திட்டங்கள்'
          }
        }
      },
      {
        page: 'global',
        section: 'footer',
        key: 'global.footer.logo',
        content: {
          en: {
            image: '/frontend/public/assets/logo.png',
            alt: 'Tamil Language Society'
          },
          ta: {
            image: '/frontend/public/assets/logo.png',
            alt: 'தமிழ் மொழி சங்கம்'
          }
        }
      }
    ];

    console.log('Seeding missing homepage content...');
    
    for (const item of missingContent) {
      const existingContent = await WebsiteContent.findOne({
        page: item.page,
        section: item.section,
        key: item.key
      });

      if (!existingContent) {
        await WebsiteContent.create(item);
        console.log(`✅ Created content for key: ${item.key}`);
      } else {
        console.log(`⚠️  Content already exists for key: ${item.key}`);
      }
    }

    console.log('✅ Missing homepage content seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding missing homepage content:', error);
    process.exit(1);
  }
};

seedMissingHomepageContent();