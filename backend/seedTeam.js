const mongoose = require('mongoose');
const Team = require('./models/Team');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil_literary_society')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sample team data
const sampleTeamMembers = [
  {
    name: {
      en: 'Dr. Rajesh Kumar',
      ta: 'டாக்டர் ராஜேஷ் குமார்'
    },
    position: 'president',
    bio: {
      en: 'President of Tamil Literary Society with 15+ years of experience in Tamil literature and cultural preservation.',
      ta: 'தமிழ் இலக்கிய சங்கத்தின் தலைவர், தமிழ் இலக்கியம் மற்றும் கலாச்சார பாதுகாப்பில் 15+ ஆண்டுகள் அனுபவம்.'
    },
    email: 'president@tamilsociety.com',
    phone: '+1-555-0101',
    order: 1,
    status: 'active',
    profilePicture: '/assets/default-avatar.jpg',
    photo: '/assets/default-avatar.jpg',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/rajeshkumar',
      twitter: 'https://twitter.com/rajeshkumar',
      facebook: 'https://facebook.com/rajeshkumar'
    }
  },
  {
    name: {
      en: 'Priya Selvam',
      ta: 'பிரியா செல்வம்'
    },
    position: 'vice-president',
    bio: {
      en: 'Vice President specializing in modern Tamil literature and poetry.',
      ta: 'நவீன தமிழ் இலக்கியம் மற்றும் கவிதையில் நிபுணத்துவம் பெற்ற துணைத் தலைவர்.'
    },
    email: 'vp@tamilsociety.com',
    phone: '+1-555-0102',
    order: 1,
    status: 'active',
    profilePicture: '/assets/default-avatar.jpg',
    photo: '/assets/default-avatar.jpg',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/priyaselvam',
      twitter: 'https://twitter.com/priyaselvam'
    }
  },
  {
    name: {
      en: 'Arjun Murugan',
      ta: 'அர்ஜுன் முருகன்'
    },
    position: 'secretary',
    bio: {
      en: 'Secretary managing organizational activities and member communications.',
      ta: 'அமைப்பு நடவடிக்கைகள் மற்றும் உறுப்பினர் தொடர்புகளை நிர்வகிக்கும் செயலாளர்.'
    },
    email: 'secretary@tamilsociety.com',
    phone: '+1-555-0103',
    order: 1,
    status: 'active',
    profilePicture: '/assets/default-avatar.jpg',
    photo: '/assets/default-avatar.jpg'
  },
  {
    name: {
      en: 'Meera Krishnan',
      ta: 'மீரா கிருஷ்ணன்'
    },
    position: 'treasurer',
    bio: {
      en: 'Treasurer overseeing financial management and budget planning.',
      ta: 'நிதி நிர்வாகம் மற்றும் பட்ஜெட் திட்டமிடலை மேற்பார்வையிடும் பொருளாளர்.'
    },
    email: 'treasurer@tamilsociety.com',
    phone: '+1-555-0104',
    order: 1,
    status: 'active',
    profilePicture: '/assets/default-avatar.jpg',
    photo: '/assets/default-avatar.jpg'
  },
  {
    name: {
      en: 'Karthik Raman',
      ta: 'கார்த்திக் ராமன்'
    },
    position: 'executive',
    bio: {
      en: 'Executive committee member focusing on cultural events and programs.',
      ta: 'கலாச்சார நிகழ்வுகள் மற்றும் திட்டங்களில் கவனம் செலுத்தும் நிர்வாகக் குழு உறுப்பினர்.'
    },
    email: 'karthik@tamilsociety.com',
    order: 1,
    status: 'active',
    profilePicture: '/assets/default-avatar.jpg',
    photo: '/assets/default-avatar.jpg'
  },
  {
    name: {
      en: 'Lakshmi Devi',
      ta: 'லக்ஷ்மி தேவி'
    },
    position: 'executive',
    bio: {
      en: 'Executive committee member specializing in educational initiatives.',
      ta: 'கல்வி முன்முயற்சிகளில் நிபுணத்துவம் பெற்ற நிர்வாகக் குழு உறுப்பினர்.'
    },
    email: 'lakshmi@tamilsociety.com',
    order: 2,
    status: 'active',
    profilePicture: '/assets/default-avatar.jpg',
    photo: '/assets/default-avatar.jpg'
  },
  {
    name: {
      en: 'Suresh Babu',
      ta: 'சுரேஷ் பாபு'
    },
    position: 'auditor',
    bio: {
      en: 'Auditor ensuring financial transparency and compliance.',
      ta: 'நிதி வெளிப்படைத்தன்மை மற்றும் இணக்கத்தை உறுதி செய்யும் தணிக்கையாளர்.'
    },
    email: 'auditor@tamilsociety.com',
    order: 1,
    status: 'active',
    profilePicture: '/assets/default-avatar.jpg',
    photo: '/assets/default-avatar.jpg'
  }
];

async function seedTeamMembers() {
  try {
    // Clear existing team members
    await Team.deleteMany({});
    console.log('Cleared existing team members');
    
    // Insert sample team members
    const result = await Team.insertMany(sampleTeamMembers);
    console.log(`Successfully seeded ${result.length} team members`);
    
    // Display the created team members
    console.log('\nCreated team members:');
    result.forEach(member => {
      console.log(`- ${member.name.en} (${member.position})`);
    });
    
  } catch (error) {
    console.error('Error seeding team members:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedTeamMembers();