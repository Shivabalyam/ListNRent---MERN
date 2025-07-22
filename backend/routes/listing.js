const express = require('express');
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require('../models/listing.js');
const { isLoggedIn, isOwner, validateListing, parseListingFormData, checkAdmin } = require('../middleware.js');

const listingController = require('../controllers/listings.js');
const multer = require('multer');
const { storage } = require('../cloudConfig.js');
const upload = multer({ storage });

// REST API routes for listings
router.route('/')
    .get(wrapAsync(listingController.index)) // List all listings (GET)
    .post(isLoggedIn, checkAdmin, validateListing, upload.single('image'), wrapAsync(listingController.createListing)); // Create listing (POST)

router.route('/:id')
    .get(wrapAsync(listingController.showListing)) // Get a specific listing (GET)
    .put(isLoggedIn, checkAdmin, parseListingFormData, validateListing, upload.single('image'), wrapAsync(listingController.updateListing)) // Update listing (PUT)
    .delete(isLoggedIn, checkAdmin, wrapAsync(listingController.deleteListing)); // Delete listing (DELETE)

module.exports = router;