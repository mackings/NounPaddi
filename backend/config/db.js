const mongoose = require('mongoose');

// Disable buffering to get immediate connection errors
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 30000); // Increase buffer timeout to 30s

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
      serverSelectionTimeoutMS: 15000, // Timeout after 15s for serverless cold starts
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Minimum 1 connection
      retryWrites: true,
      w: 'majority',
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
