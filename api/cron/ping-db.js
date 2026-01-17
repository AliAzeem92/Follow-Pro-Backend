const mongoose = require('mongoose');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await mongoose.connect(process.env.DATABASE_URL);
    await mongoose.connection.db.admin().ping();
    await mongoose.connection.close();
    
    res.status(200).json({ 
      success: true, 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};