// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const GeoSchema = new mongoose.Schema({
  type: {
    type: String,
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true
  },
  address: {
    type: String,
    required: true
  }
});

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['farmer', 'consumer', 'admin'],
    default: 'consumer'
  },
  phoneNumber: {
    type: String,
    required: true
  },
  location: {
    type: GeoSchema,
    required: true
  },
  bio: {
    type: String
  },
  profileImage: {
    type: String
  },
  certificates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate'
  }],
  createdProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  localGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LocalGroup'
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLoginAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index location for geospatial queries
UserSchema.index({ location: '2dsphere' });

// Pre-save middleware to update the updatedAt field
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create model from schema
const User = mongoose.model('User', UserSchema);

module.exports = User;