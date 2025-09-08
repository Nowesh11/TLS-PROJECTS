require('dotenv').config({ path: './config/.env' });
const mongoose = require('mongoose');
const Poster = require('./models/Poster');

async function checkPosters() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tamil-language-society');
    console.log('Connected to database');
    
    const posters = await Poster.find({});
    console.log('Total posters found:', posters.length);
    
    if (posters.length > 0) {
      console.log('First poster:', JSON.stringify(posters[0], null, 2));
    }
    
    const activePosters = await Poster.find({
      is_active: true,
      start_at: { $lte: new Date() },
      end_at: { $gte: new Date() }
    });
    console.log('Active posters found:', activePosters.length);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkPosters();