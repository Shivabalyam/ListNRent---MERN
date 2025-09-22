const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  guests: { type: Number, required: true },
  // Pricing breakdown
  subtotal: { type: Number },
  platformFee: { type: Number },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
  paymentIntentId: { type: String }, // For Stripe integration
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema); 