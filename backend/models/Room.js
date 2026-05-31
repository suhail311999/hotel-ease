const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  hotelId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  occupancy: {
    type: Number,
    required: true
  },
  amenities: {
    type: [String],
    default: []
  },
  totalRooms: {
    type: Number,
    required: true
  },
  availableRooms: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('Room', RoomSchema);
