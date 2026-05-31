const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    default: 5.0
  },
  imageUrl: {
    type: String,
    required: true
  },
  amenities: {
    type: [String],
    default: []
  },
  approved: {
    type: Boolean,
    default: false
  },
  ownerId: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Hotel', HotelSchema);
