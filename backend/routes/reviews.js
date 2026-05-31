const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Hotel = require('../models/Hotel');

// GET /api/reviews
router.get('/', async (req, res) => {
  try {
    const { hotelId } = req.query;
    
    let query = {};
    if (hotelId) {
      query.hotelId = hotelId;
    }
    
    const reviews = await Review.find(query).lean();
    
    const enrichedReviews = [];
    for (let review of reviews) {
      const hotel = await Hotel.findOne({ id: review.hotelId }).select('name').lean();
      enrichedReviews.push({
        ...review,
        hotelName: hotel ? hotel.name : 'Unknown Hotel'
      });
    }
    
    res.json(enrichedReviews);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/reviews
router.post('/', async (req, res) => {
  try {
    const { hotelId, customerId, customerName, rating, comment } = req.body;
    
    if (!hotelId || !customerId || rating === undefined || !comment) {
      return res.status(400).json({ success: false, message: 'Missing required review details' });
    }
    
    const hotel = await Hotel.findOne({ id: hotelId });
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }
    
    const reviewId = 'rev-' + Date.now();
    const newReview = new Review({
      id: reviewId,
      hotelId,
      customerId,
      customerName: customerName || 'Anonymous',
      rating: Number(rating),
      comment,
      date: new Date().toISOString().split('T')[0]
    });
    
    await newReview.save();
    
    // Recalculate average hotel rating
    const hotelReviews = await Review.find({ hotelId });
    const sum = hotelReviews.reduce((acc, r) => acc + r.rating, 0);
    hotel.rating = Number((sum / hotelReviews.length).toFixed(1));
    await hotel.save();
    
    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/reviews/:reviewId
router.delete('/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const review = await Review.findOne({ id: reviewId });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    const hotelId = review.hotelId;
    await Review.deleteOne({ id: reviewId });
    
    // Recalculate average hotel rating
    const hotel = await Hotel.findOne({ id: hotelId });
    if (hotel) {
      const hotelReviews = await Review.find({ hotelId });
      if (hotelReviews.length > 0) {
        const sum = hotelReviews.reduce((acc, r) => acc + r.rating, 0);
        hotel.rating = Number((sum / hotelReviews.length).toFixed(1));
      } else {
        hotel.rating = 5.0; // Reset to default
      }
      await hotel.save();
    }
    
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
