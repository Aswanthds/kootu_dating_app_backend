const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// 1. GLOBAL MIDDLEWARE
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. PUBLIC ROUTES
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Dating App API',
    status: 'healthy',
    version: '1.0.0'
  });
});

// 3. API ROUTES
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/matches', require('./routes/matchRoutes'));

// 4. ERROR HANDLING
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong on our end.'
  });
});

module.exports = app;
