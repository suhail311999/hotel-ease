const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');
const Room = require('../models/Room');

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).select('id name email role active joinedDate').lean();
    res.json(users);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/users/:userId/toggle-status
router.post('/users/:userId/toggle-status', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ id: userId });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.active = !user.active;
    await user.save();
    
    res.json({ success: true, active: user.active });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/users/:userId/role
router.post('/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({ success: false, message: 'Role is required' });
    }
    
    const user = await User.findOneAndUpdate(
      { id: userId },
      { $set: { role } },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, message: 'User role updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/hotels/pending
router.get('/hotels/pending', async (req, res) => {
  try {
    const pendingHotels = await Hotel.find({ approved: false }).lean();
    res.json(pendingHotels);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/hotels/:hotelId/approve
router.post('/hotels/:hotelId/approve', async (req, res) => {
  try {
    const { hotelId } = req.params;
    const hotel = await Hotel.findOneAndUpdate(
      { id: hotelId },
      { $set: { approved: true } },
      { new: true }
    );
    
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }
    
    res.json({ success: true, message: 'Hotel approved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/hotels/:hotelId/reject
router.post('/hotels/:hotelId/reject', async (req, res) => {
  try {
    const { hotelId } = req.params;
    
    const hotelResult = await Hotel.deleteOne({ id: hotelId });
    if (hotelResult.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }
    
    await Room.deleteMany({ hotelId });
    
    res.json({ success: true, message: 'Hotel rejected and removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalHotels = await Hotel.countDocuments();
    const approvedHotels = await Hotel.countDocuments({ approved: true });
    const pendingHotels = await Hotel.countDocuments({ approved: false });
    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({ status: { $ne: 'Cancelled' } });
    
    const revenueResult = await Booking.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalCost' } } }
    ]);
    
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    
    res.json({
      totalUsers,
      totalHotels,
      approvedHotels,
      pendingHotels,
      totalBookings,
      confirmedBookings,
      totalRevenue
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
