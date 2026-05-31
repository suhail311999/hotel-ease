const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  hotelId: {
    type: String,
    required: true
  },
  customerId: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true
  },
  comment: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Review', ReviewSchema);
