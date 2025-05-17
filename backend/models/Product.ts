// backend/models/Product.ts
import mongoose from 'mongoose';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from '../constants';

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

const StatusHistoryItemSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  note: {
    type: String
  }
});

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 2000
  },
  price: {
    type: Number,
    required: true,
    min: 0.01
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    required: true,
    enum: PRODUCT_UNITS
  },
  category: {
    type: String,
    required: true,
    enum: PRODUCT_CATEGORIES
  },
  subcategory: {
    type: String
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [{
    type: String
  }],
  certificates: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['available', 'preparing', 'shipped', 'delivered', 'unavailable'],
    default: 'available'
  },
  statusHistory: [StatusHistoryItemSchema],
  location: {
    type: GeoSchema
  },
  harvestDate: {
    type: Date
  },
  trackingId: {
    type: String,
    unique: true
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  isCertified: {
    type: Boolean,
    default: false
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

// Create geospatial index on location field
ProductSchema.index({ location: '2dsphere' });

// Create text index for search
ProductSchema.index({ 
  name: 'text', 
  description: 'text', 
  category: 'text', 
  subcategory: 'text' 
});

// Pre-save middleware to update the updatedAt field
ProductSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if product is available
ProductSchema.methods.isAvailable = function() {
  return this.status === 'available' && this.quantity > 0;
};

// Method to update average rating
ProductSchema.methods.updateAverageRating = async function() {
  const Review = mongoose.model('Review');
  
  const result = await Review.aggregate([
    { $match: { product: this._id } },
    { $group: { _id: null, avgRating: { $avg: '$rating' } } }
  ]);
  
  if (result.length > 0) {
    this.averageRating = Math.round(result[0].avgRating * 10) / 10; // Round to 1 decimal
  } else {
    this.averageRating = 0;
  }
  
  return this.save();
};

export const Product = mongoose.model('Product', ProductSchema);