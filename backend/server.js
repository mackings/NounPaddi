const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

const app = express();

// Connect to database (async, won't block server startup)
connectDB().catch(err => {
  console.error('Initial database connection failed:', err.message);
});

// Body parser middleware - Increase limit for large project submissions
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Enable CORS - Allow all origins for maximum compatibility
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Explicit OPTIONS handler for all routes
app.options('*', cors());


// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/faculties', require('./routes/faculty'));
app.use('/api/departments', require('./routes/department'));
app.use('/api/courses', require('./routes/course'));
app.use('/api/materials', require('./routes/material'));
app.use('/api/questions', require('./routes/question'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/it-placement', require('./routes/itPlacement'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/reminders', require('./routes/readingReminder'));
app.use('/api/plagiarism', require('./routes/plagiarism'));
app.use('/api/projects', require('./routes/projectSubmission'));

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'NounPaddi API is running',
  });
});

const PORT = process.env.PORT || 5001;

// Only start server if not in Vercel serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
}

// Export for Vercel serverless functions
module.exports = app;
