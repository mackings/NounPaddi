const mongoose = require('mongoose');

// Cache the database connection for serverless
let cachedDb = null;

const connectDB = async () => {
  // If we have a cached connection, use it
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('Using cached database connection');
    return cachedDb;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });

    cachedDb = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return cachedDb;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Don't exit process in serverless environment
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      throw error; // Throw error instead of exiting
    } else {
      process.exit(1); // Only exit in development
    }
  }
};

module.exports = connectDB;
