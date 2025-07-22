const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookings');
const { isLoggedIn } = require('../middleware');

// Create a Razorpay order for booking
router.post('/orders', isLoggedIn, bookingController.createOrder);
// Verify Razorpay payment and create booking
router.post('/verify', isLoggedIn, bookingController.verifyPayment);

// Create a new booking (legacy/manual, not used with Razorpay)
// router.post('/', isLoggedIn, bookingController.createBooking);

// Get bookings for current user
router.get('/my', isLoggedIn, bookingController.getUserBookings);

// Get bookings for a specific listing (for owner/admin)
router.get('/listing/:listingId', isLoggedIn, bookingController.getListingBookings);

// Cancel a booking
router.delete('/:id', isLoggedIn, bookingController.cancelBooking);

// Check availability for a listing
router.get('/availability/:listingId', bookingController.checkAvailability);

// Get all bookings (admin only)
router.get('/', isLoggedIn, bookingController.getAllBookings);

// Razorpay webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), bookingController.razorpayWebhook);

module.exports = router; 