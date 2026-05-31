const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const User = require('../models/User');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');

// GET /api/bookings
router.get('/', async (req, res) => {
  try {
    const { customerId, ownerId } = req.query;
    
    let bookingsQuery = {};
    
    if (customerId) {
      bookingsQuery.customerId = customerId;
    }
    
    if (ownerId) {
      // Find all hotels owned by this owner
      const ownerHotels = await Hotel.find({ ownerId }).select('id');
      const ownerHotelIds = ownerHotels.map(h => h.id);
      bookingsQuery.hotelId = { $in: ownerHotelIds };
    }
    
    const bookings = await Booking.find(bookingsQuery).lean();
    
    // Hydrate bookings with hotel and room metadata
    const hydratedBookings = [];
    for (let booking of bookings) {
      const hotel = await Hotel.findOne({ id: booking.hotelId }).select('name location imageUrl').lean();
      const room = await Room.findOne({ id: booking.roomId }).select('type').lean();
      
      hydratedBookings.push({
        ...booking,
        hotelName: hotel ? hotel.name : 'Unknown Hotel',
        hotelLocation: hotel ? hotel.location : 'Unknown Location',
        hotelImageUrl: hotel ? hotel.imageUrl : '',
        roomType: room ? room.type : 'Standard Room'
      });
    }
    
    res.json(hydratedBookings);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/bookings
router.post('/', async (req, res) => {
  try {
    const { hotelId, roomId, customerId, checkIn, checkOut, guests, totalCost } = req.body;
    
    if (!hotelId || !roomId || !customerId || !checkIn || !checkOut || !guests || totalCost === undefined) {
      return res.status(400).json({ success: false, message: 'All booking parameters are required' });
    }
    
    const user = await User.findOne({ id: customerId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    if (user.balance < totalCost) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance. Please add funds.' });
    }
    
    const room = await Room.findOne({ id: roomId });
    if (!room || room.availableRooms <= 0) {
      return res.status(400).json({ success: false, message: 'Selected room is no longer available' });
    }
    
    // Deduct user balance
    user.balance -= Number(totalCost);
    await user.save();
    
    // Decrement available room
    room.availableRooms -= 1;
    await room.save();
    
    // Create booking record
    const bookingId = 'book-' + Date.now();
    const newBooking = new Booking({
      id: bookingId,
      hotelId,
      roomId,
      customerId,
      customerName: user.name,
      checkIn,
      checkOut,
      guests: Number(guests),
      totalCost: Number(totalCost),
      status: 'Confirmed',
      paymentStatus: 'Paid',
      createdAt: new Date().toISOString().split('T')[0]
    });
    
    await newBooking.save();
    
    res.status(201).json({ success: true, booking: newBooking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/bookings/:bookingId/cancel
router.post('/:bookingId/cancel', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findOne({ id: bookingId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    if (booking.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }
    
    if (booking.status === 'CheckedOut') {
      return res.status(400).json({ success: false, message: 'Completed bookings cannot be cancelled' });
    }
    
    booking.status = 'Cancelled';
    await booking.save();
    
    // Refund customer
    const user = await User.findOne({ id: booking.customerId });
    if (user) {
      user.balance += booking.totalCost;
      await user.save();
    }
    
    // Restore room availability
    const room = await Room.findOne({ id: booking.roomId });
    if (room) {
      room.availableRooms = Math.min(room.totalRooms, room.availableRooms + 1);
      await room.save();
    }
    
    res.json({ success: true, refundAmount: booking.totalCost });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/bookings/:bookingId/status
router.put('/:bookingId/status', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }
    
    const booking = await Booking.findOneAndUpdate(
      { id: bookingId },
      { $set: { status } },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
