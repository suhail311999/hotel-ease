const express = require('express');
const router = express.Router();
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const Review = require('../models/Review');

// GET /api/hotels
router.get('/', async (req, res) => {
  try {
    const { onlyApproved, ownerId, searchQuery, amenities, minRating, maxPrice } = req.query;
    
    let query = {};
    
    if (onlyApproved === 'true') {
      query.approved = true;
    }
    
    if (ownerId) {
      query.ownerId = ownerId;
    }
    
    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, 'i');
      query.$or = [
        { name: searchRegex },
        { location: searchRegex },
        { description: searchRegex }
      ];
    }
    
    if (amenities) {
      // amenities can be a comma-separated string or an array
      const amenitiesList = Array.isArray(amenities) 
        ? amenities 
        : amenities.split(',').map(a => a.trim()).filter(Boolean);
        
      if (amenitiesList.length > 0) {
        query.amenities = { $all: amenitiesList };
      }
    }
    
    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }
    
    let hotels = await Hotel.find(query).lean();
    
    // Populate min/max prices based on rooms
    const enrichedHotels = [];
    for (let hotel of hotels) {
      const rooms = await Room.find({ hotelId: hotel.id }).lean();
      const prices = rooms.map(r => r.price);
      
      const minPriceVal = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPriceVal = prices.length > 0 ? Math.max(...prices) : 0;
      
      const enrichedHotel = {
        ...hotel,
        minPrice: minPriceVal,
        maxPrice: maxPriceVal,
        rooms: rooms
      };
      
      // Filter by maxPrice: only include if minPrice of hotel is <= maxPrice query
      if (maxPrice && minPriceVal > Number(maxPrice)) {
        continue; // skip this hotel
      }
      
      enrichedHotels.push(enrichedHotel);
    }
    
    res.json(enrichedHotels);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/hotels/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const hotel = await Hotel.findOne({ id }).lean();
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }
    
    const rooms = await Room.find({ hotelId: id }).lean();
    const reviews = await Review.find({ hotelId: id }).lean();
    
    res.json({
      ...hotel,
      rooms,
      reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/hotels
router.post('/', async (req, res) => {
  try {
    const { name, location, description, basePrice, imageUrl, amenities, ownerId } = req.body;
    
    if (!name || !location || !description || !ownerId) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }
    
    const hotelId = 'hotel-' + Date.now();
    const newHotel = new Hotel({
      id: hotelId,
      name,
      location,
      description,
      rating: 5.0,
      imageUrl: imageUrl || 'images/luxury_hotel_lobby.png',
      amenities: amenities || [],
      approved: false, // requires admin approval
      ownerId
    });
    
    await newHotel.save();
    
    // Seed standard room types for this new hotel
    const price = Number(basePrice) || 150;
    const standardRooms = [
      new Room({
        id: 'room-' + Date.now() + '-1',
        hotelId: hotelId,
        type: 'Standard Room',
        price: price,
        occupancy: 2,
        amenities: ['Double Bed', 'Wifi', 'TV', 'En-suite Bath'],
        totalRooms: 10,
        availableRooms: 10
      }),
      new Room({
        id: 'room-' + Date.now() + '-2',
        hotelId: hotelId,
        type: 'Deluxe Suite',
        price: Math.round(price * 1.8),
        occupancy: 4,
        amenities: ['King Bed', 'Mini Bar', 'Living Area', 'Balcony'],
        totalRooms: 5,
        availableRooms: 5
      })
    ];
    
    await Room.insertMany(standardRooms);
    
    res.status(201).json(newHotel);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/hotels/:hotelId/rooms
router.put('/:hotelId/rooms', async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { rooms } = req.body; // array of room objects
    
    if (!Array.isArray(rooms)) {
      return res.status(400).json({ success: false, message: 'Rooms must be an array' });
    }
    
    // Remove existing rooms for hotel
    await Room.deleteMany({ hotelId });
    
    // Map and insert new ones
    const mapped = rooms.map((r, index) => new Room({
      id: `room-${hotelId}-${index}-${Date.now()}`,
      hotelId,
      type: r.type,
      price: Number(r.price),
      occupancy: Number(r.occupancy),
      amenities: r.amenities || [],
      totalRooms: Number(r.totalRooms),
      availableRooms: Number(r.totalRooms)
    }));
    
    await Room.insertMany(mapped);
    
    res.json({ success: true, message: 'Hotel rooms updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
