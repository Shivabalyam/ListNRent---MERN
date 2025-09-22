const express = require('express');
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require('../models/listing.js');
const { isLoggedIn, isOwner, validateListing, parseListingFormData } = require('../middleware.js');

const listingController = require('../controllers/listings.js');
const multer = require('multer');
const { storage } = require('../cloudConfig.js');
const upload = multer({ storage });

// REST API routes for listings
router.route('/')
    .get(wrapAsync(listingController.index)) // List all listings (GET)
    // Allow any logged-in user to create a listing
    .post(
        isLoggedIn,
        upload.single('image'),
        parseListingFormData,
        validateListing,
        wrapAsync(listingController.createListing)
    );

router.route('/:id')
    .get(wrapAsync(listingController.showListing)) // Get a specific listing (GET)
    // Only owner (or admin via isOwner) can update
    .put(
        isLoggedIn,
        upload.single('image'),
        parseListingFormData,
        validateListing,
        isOwner,
        wrapAsync(listingController.updateListing)
    )
    // Only owner (or admin via isOwner) can delete
    .delete(
        isLoggedIn,
        isOwner,
        wrapAsync(listingController.deleteListing)
    );

module.exports = router;