const express = require('express');
const router = express.Router();
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');
const Room = require('../models/Room');

// GET /api/owner/:ownerId/stats
router.get('/:ownerId/stats', async (req, res) => {
  try {
    const { ownerId } = req.params;
    
    const ownerHotels = await Hotel.find({ ownerId }).select('id').lean();
    const ownerHotelIds = ownerHotels.map(h => h.id);
    
    // Find all bookings for these hotels
    const bookings = await Booking.find({ hotelId: { $in: ownerHotelIds } }).lean();
    
    const activeBookings = bookings.filter(b => b.status === 'Confirmed' || b.status === 'CheckedIn');
    const totalRevenue = bookings
      .filter(b => b.status !== 'Cancelled')
      .reduce((sum, b) => sum + b.totalCost, 0);
      
    // Calculate total room capacity for occupancy rate
    const rooms = await Room.find({ hotelId: { $in: ownerHotelIds } }).lean();
    const totalRoomsCount = rooms.reduce((sum, r) => sum + r.totalRooms, 0);
    
    const roomsBookedCount = activeBookings.length;
    const occupancyRate = totalRoomsCount > 0 
      ? Math.round((roomsBookedCount / totalRoomsCount) * 100) 
      : 0;
      
    // Hydrate bookings with hotel name and room type for display
    const hydratedBookings = [];
    for (let booking of bookings) {
      const hotel = await Hotel.findOne({ id: booking.hotelId }).select('name location').lean();
      const room = await Room.findOne({ id: booking.roomId }).select('type').lean();
      hydratedBookings.push({
        ...booking,
        hotelName: hotel ? hotel.name : 'Unknown Hotel',
        hotelLocation: hotel ? hotel.location : 'Unknown Location',
        roomType: room ? room.type : 'Standard Room'
      });
    }
    
    res.json({
      totalRevenue,
      activeBookings: activeBookings.length,
      occupancyRate,
      hotelsCount: ownerHotels.length,
      bookingsList: hydratedBookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
