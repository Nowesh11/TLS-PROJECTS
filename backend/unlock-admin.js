const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const unlockAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Unlock admin@tamilsociety.com specifically
    const admin = await User.findOneAndUpdate(
      { email: 'admin@tamilsociety.com' },
      { 
        $unset: { 
          'loginAttempts.count': 1, 
          'loginAttempts.lockedUntil': 1 
        } 
      },
      { new: true }
    );
    
    if (admin) {
      console.log('✅ Admin account unlocked:', admin.email);
      console.log('Role:', admin.role);
    } else {
      console.log('❌ Admin user not found with email: admin@tamilsociety.com');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error unlocking admin:', error);
    process.exit(1);
  }
};

unlockAdmin();