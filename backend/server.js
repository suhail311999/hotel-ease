require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Models & Seeding
const User = require('./models/User');
const runSeeder = require('./seed');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/hotels', require('./routes/hotels'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/owner', require('./routes/owner'));

// Serve static frontend files from parent directory
app.use(express.static(path.join(__dirname, '..')));

// Catch-all route to serve index.html for frontend routing
app.get('*', (req, res) => {
  // If request is not an api call, send index.html
  if (!req.url.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
  } else {
    res.status(404).json({ success: false, message: 'API endpoint not found' });
  }
});

// Database Connection and Server Start
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hotelease';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB successfully.');
    
    // Auto-seed database if empty
    try {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('No users found in database. Starting database seeding...');
        await runSeeder();
        console.log('Database seeded successfully.');
      } else {
        console.log('Database already contains data, skipping seeder.');
      }
    } catch (seedError) {
      console.error('Error running auto-seeder:', seedError);
    }

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
