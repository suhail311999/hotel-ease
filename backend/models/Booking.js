const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  hotelId: {
    type: String,
    required: true
  },
  roomId: {
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
  checkIn: {
    type: String,
    required: true
  },
  checkOut: {
    type: String,
    required: true
  },
  guests: {
    type: Number,
    required: true
  },
  totalCost: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'],
    default: 'Confirmed'
  },
  paymentStatus: {
    type: String,
    default: 'Paid'
  },
  createdAt: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Booking', BookingSchema);
