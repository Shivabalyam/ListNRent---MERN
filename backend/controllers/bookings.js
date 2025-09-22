const Booking = require('../models/booking');
const Listing = require('../models/listing');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Helper: Check for overlapping bookings
async function isBookingAvailable(listingId, startDate, endDate) {
  const overlapping = await Booking.findOne({
    listing: listingId,
    status: { $in: ['pending', 'paid'] },
    $or: [
      { startDate: { $lt: endDate }, endDate: { $gt: startDate } }
    ]
  });
  return !overlapping;
}

// Create a Razorpay order for booking
exports.createOrder = async (req, res) => {
  try {
    const { listingId, startDate, endDate, guests } = req.body;
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    const nights = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    if (nights <= 0) return res.status(400).json({ error: 'Invalid date range' });
    const available = await isBookingAvailable(listingId, startDate, endDate);
    if (!available) return res.status(409).json({ error: 'Listing is not available for the selected dates.' });
    const subtotal = listing.price * nights;
    const platformFee = Math.round(subtotal * 0.10); // 10% fee
    const totalPrice = subtotal + platformFee;
    const options = {
      amount: Math.round(totalPrice * 100), // in paise
      currency: 'INR',
      receipt: 'receipt_' + Date.now(),
      notes: { listingId, userId: req.user._id, startDate, endDate, guests, subtotal, platformFee }
    };
    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id, keyId: process.env.RAZORPAY_KEY_ID, amount: order.amount, currency: order.currency });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Verify Razorpay payment and create booking
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, listingId, startDate, endDate, guests } = req.body;
    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');
    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }
    // Check for overlapping bookings
    const available = await isBookingAvailable(listingId, startDate, endDate);
    if (!available) return res.status(409).json({ error: 'Listing is not available for the selected dates.' });
    // Create booking
    const listing = await Listing.findById(listingId);
    const nights = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const subtotal = listing.price * nights;
    const platformFee = Math.round(subtotal * 0.10);
    const totalPrice = subtotal + platformFee;
    const booking = new Booking({
      user: req.user._id,
      listing: listingId,
      startDate,
      endDate,
      guests,
      subtotal,
      platformFee,
      totalPrice,
      status: 'paid',
      paymentIntentId: razorpay_payment_id
    });
    await booking.save();
    res.status(201).json({ booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Razorpay webhook handler
exports.razorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  const body = req.body; // raw body

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Parse event
  let event;
  try {
    event = JSON.parse(body);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    const notes = payment.notes || {};
    const { listingId, userId, startDate, endDate, guests } = notes;
    if (listingId && userId && startDate && endDate && guests) {
      // Check for overlapping bookings
      const available = await isBookingAvailable(listingId, startDate, endDate);
      if (!available) return res.status(409).json({ error: 'Listing is not available for the selected dates.' });
      // Create booking if not exists
      let booking = await Booking.findOne({ paymentIntentId: payment.id });
      if (!booking) {
        const listing = await Listing.findById(listingId);
        const nights = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
        const subtotal = listing.price * nights;
        const platformFee = Math.round(subtotal * 0.10);
        const totalPrice = subtotal + platformFee;
        booking = new Booking({
          user: userId,
          listing: listingId,
          startDate,
          endDate,
          guests,
          subtotal,
          platformFee,
          totalPrice,
          status: 'paid',
          paymentIntentId: payment.id
        });
        await booking.save();
      } else {
        booking.status = 'paid';
        await booking.save();
      }
    }
  }
  res.status(200).json({ status: 'ok' });
};

// Get bookings for current user
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('listing');
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all bookings (admin only)
exports.getAllBookings = async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    const bookings = await Booking.find({})
      .populate('listing')
      .populate('user');
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get bookings for a specific listing (for owner/admin)
exports.getListingBookings = async (req, res) => {
  // TODO: Implement listing bookings retrieval
  res.json({ message: 'Listing bookings endpoint (to be implemented)' });
};

// Cancel a booking
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    // Only allow user or admin to cancel
    if (req.user.role !== 'admin' && booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }
    // Restrict user cancellation to only before 24 hours of startDate
    if (req.user.role !== 'admin') {
      const now = new Date();
      const startDate = new Date(booking.startDate);
      const diffMs = startDate - now;
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours < 24) {
        return res.status(400).json({ error: 'You can only cancel a booking more than 24 hours before the start date.' });
      }
    }
    booking.status = 'cancelled';
    await booking.save();
    res.json({ message: 'Booking cancelled', booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Check availability for a listing
exports.checkAvailability = async (req, res) => {
  // TODO: Implement availability check
  res.json({ message: 'Check availability endpoint (to be implemented)' });
}; 