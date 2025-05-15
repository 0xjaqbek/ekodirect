// server/models/Token.js
import mongoose from 'mongoose';

const TokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['email-verification', 'password-reset', 'refresh'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '7d' // Automatically delete tokens after 7 days
  }
});

export const Token = mongoose.model('Token', TokenSchema);