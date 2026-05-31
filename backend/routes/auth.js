const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.active) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact support.' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email address is already registered' });
    }

    const userId = role.substring(0, 4) + '-' + Date.now();
    const newUser = new User({
      id: userId,
      name,
      email: email.toLowerCase(),
      password,
      role,
      balance: role === 'customer' ? 5000 : 0,
      active: true,
      joinedDate: new Date().toISOString().split('T')[0]
    });

    await newUser.save();
    res.status(201).json({ success: true, message: 'Registration successful! You can now log in.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/auth/users/:userId/balance
router.put('/users/:userId/balance', async (req, res) => {
  try {
    const { userId } = req.params;
    const { balance } = req.body;

    if (balance === undefined || isNaN(balance)) {
      return res.status(400).json({ success: false, message: 'Valid balance amount is required' });
    }

    const user = await User.findOneAndUpdate(
      { id: userId },
      { $set: { balance: Number(balance) } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, balance: user.balance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
