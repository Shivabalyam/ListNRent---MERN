const express = require('express');
const router = express.Router({ mergeParams: true }); // Merge params to access listing ID
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Review = require('../models/review.js');
const Listing = require('../models/listing.js');
const {validateReview, isLoggedIn, isReviewAuthor} = require("../middleware.js");

const reviewController = require('../controllers/reviews.js');

// REST API routes for reviews (all return JSON)
router.post('/', isLoggedIn, validateReview, wrapAsync(reviewController.createReview));
router.delete('/:reviewId', isLoggedIn, isReviewAuthor, wrapAsync(reviewController.deleteReview));
router.put('/:reviewId', isLoggedIn, isReviewAuthor, validateReview, wrapAsync(reviewController.updateReview));

module.exports = router;