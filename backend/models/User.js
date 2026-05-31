const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['customer', 'owner', 'admin'],
    required: true
  },
  balance: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  },
  joinedDate: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('User', UserSchema);
