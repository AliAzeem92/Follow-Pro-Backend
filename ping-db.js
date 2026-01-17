require('dotenv').config();
const mongoose = require('mongoose');

async function pingDatabase() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    await mongoose.connection.db.admin().ping();
    console.log(`✅ Database ping successful - ${new Date().toISOString()}`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Database ping failed - ${error.message}`);
    process.exit(1);
  }
}

pingDatabase();