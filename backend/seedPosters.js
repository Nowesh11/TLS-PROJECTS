const mongoose = require('mongoose');
const Poster = require('./models/Poster');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'config', '.env') });

const seedPosters = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tamilsociety');
    console.log('Connected to MongoDB');

    // Clear existing posters
    await Poster.deleteMany({});
    console.log('Cleared existing posters');

    // Sample poster data
    const postersData = [
      {
        title: 'Tamil Cultural Festival 2024',
        description: 'Join us for an amazing celebration of Tamil culture featuring traditional music, dance, and food.',
        imageUrl: '/uploads/posters/cultural-festival.jpg',
        status: 'active',
        clickCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Tamil Language Workshop',
        description: 'Learn Tamil language basics in our interactive workshop sessions for beginners.',
        imageUrl: '/uploads/posters/language-workshop.jpg',
        status: 'active',
        clickCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Traditional Dance Performance',
        description: 'Experience the beauty of classical Tamil dance forms performed by renowned artists.',
        imageUrl: '/uploads/posters/dance-performance.jpg',
        status: 'active',
        clickCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Tamil Literature Discussion',
        description: 'Explore the rich heritage of Tamil literature with scholars and enthusiasts.',
        imageUrl: '/uploads/posters/literature-discussion.jpg',
        status: 'active',
        clickCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Community Service Initiative',
        description: 'Join our community service projects to make a positive impact in our neighborhood.',
        imageUrl: '/uploads/posters/community-service.jpg',
        status: 'active',
        clickCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Youth Leadership Program',
        description: 'Develop leadership skills and connect with other young Tamil community members.',
        imageUrl: '/uploads/posters/youth-leadership.jpg',
        status: 'active',
        clickCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert poster data
    const createdPosters = await Poster.insertMany(postersData);
    console.log(`Created ${createdPosters.length} posters`);

    // Display created posters
    console.log('\nCreated posters:');
    createdPosters.forEach((poster, index) => {
      console.log(`${index + 1}. ${poster.title}`);
      console.log(`   Description: ${poster.description}`);
      console.log(`   Status: ${poster.status}`);
      console.log(`   ID: ${poster._id}\n`);
    });

    console.log('Poster seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding posters:', error);
    process.exit(1);
  }
};

seedPosters();