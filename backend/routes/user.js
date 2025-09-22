const express = require('express');
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const userController = require('../controllers/users.js');
const { isLoggedIn, checkAdmin, checkUser } = require('../middleware.js');
const Review = require('../models/review');
const Listing = require('../models/listing');
const Booking = require('../models/booking');

// Signup
router.post('/signup', wrapAsync(userController.signup));
// Login
router.post('/login', wrapAsync(userController.login));
// Logout
router.post('/logout', userController.logout);
// Get current user
router.get('/current-user', isLoggedIn, (req, res) => {
  const { _id, username, email, role } = req.user;
  res.json({ user: { _id, username, email, role } });
});

// Forgot password
router.post('/forgot-password', wrapAsync(userController.forgotPassword));
// Reset password
router.post('/reset-password', wrapAsync(userController.resetPassword));

// Example admin-only route
router.get('/admin/users', isLoggedIn, checkAdmin, async (req, res) => {
  // Return all users (for admin dashboard)
  const users = await require('../models/user').find({}, '-password');
  res.json({ users });
});

// Example user-only route
router.get('/profile', isLoggedIn, checkUser, async (req, res) => {
  // Return current user's profile
  const { _id, username, email, role } = req.user;
  res.json({ user: { _id, username, email, role } });
});

// Public: Get all users (for count)
router.get('/', async (req, res) => {
  const users = await require('../models/user').find({}, '-password');
  res.json({ users });
});

// Get all reviews by the current user
router.get('/my-reviews', isLoggedIn, async (req, res) => {
  const reviews = await Review.find({ author: req.user._id })
    .sort({ createdAt: -1 })
    .populate('listing');
  res.json({ reviews });
});

// Get listings owned by current user with earnings
router.get('/my-listings', isLoggedIn, async (req, res) => {
  const listings = await Listing.find({ owner: req.user._id })
    .populate('reviews')
    .lean();

  const listingIds = listings.map(l => l._id);
  // Sum earnings from paid bookings for each listing
  const bookings = await Booking.aggregate([
    { $match: { listing: { $in: listingIds }, status: 'paid' } },
    { $group: { _id: '$listing', earnings: { $sum: '$totalPrice' }, bookingsCount: { $sum: 1 } } }
  ]);
  const earningsMap = new Map(bookings.map(b => [String(b._id), { earnings: b.earnings, bookingsCount: b.bookingsCount }]));

  const result = listings.map(l => {
    const key = String(l._id);
    const stats = earningsMap.get(key) || { earnings: 0, bookingsCount: 0 };
    const avgRating = (l.reviews && l.reviews.length)
      ? l.reviews.reduce((s, r) => s + (r.rating || 0), 0) / l.reviews.length
      : 0;
    return {
      ...l,
      avgRating,
      earnings: stats.earnings,
      bookingsCount: stats.bookingsCount,
    };
  });

  const totals = result.reduce((acc, l) => {
    acc.totalEarnings += l.earnings || 0;
    acc.totalBookings += l.bookingsCount || 0;
    return acc;
  }, { totalEarnings: 0, totalBookings: 0 });

  res.json({ listings: result, totals });
});

// Admin: Get all reviews
router.get('/all-reviews', isLoggedIn, checkAdmin, async (req, res) => {
  const reviews = await Review.find({})
    .sort({ createdAt: -1 })
    .populate('author')
    .populate('listing');
  res.json({ reviews });
});

// Admin: Delete any review
router.delete('/reviews/:reviewId', isLoggedIn, checkAdmin, async (req, res) => {
  const { reviewId } = req.params;
  const Review = require('../models/review');
  const Listing = require('../models/listing');
  // Remove review from any listing's reviews array
  await Listing.updateMany({ reviews: reviewId }, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  res.json({ message: 'Review deleted by admin.' });
});

// Admin: Delete any user
router.delete('/:userId', isLoggedIn, checkAdmin, async (req, res) => {
  const { userId } = req.params;
  const User = require('../models/user');
  await User.findByIdAndDelete(userId);
  res.json({ message: 'User deleted by admin.' });
});

module.exports = router;        