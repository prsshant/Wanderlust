const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const uri = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : null;

  if (process.env.VERCEL && !uri) {
    console.warn('⚠️ MONGO_URI is not set in Vercel environment variables.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri || 'mongodb://127.0.0.1:27017/travel_booking_platform', {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.warn('Continuing with fallback mode if MongoDB is not reachable...');
  }
};

module.exports = connectDB;
