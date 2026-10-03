const mongoose = require('mongoose');

// Disable buffering so queries fail immediately or fallback instead of freezing for 10s
mongoose.set('bufferCommands', false);

let isConnected = false;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  if (process.env.VERCEL && !process.env.MONGO_URI) {
    console.warn('⚠️ MONGO_URI is not set in Vercel environment variables.');
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/travel_booking_platform', {
      serverSelectionTimeoutMS: 4000
    });
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.warn('Continuing with fallback mode if MongoDB is not reachable...');
  }
};

module.exports = connectDB;
