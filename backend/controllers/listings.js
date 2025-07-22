const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// Get all listings
module.exports.index = async (req, res) => {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let skip = (page - 1) * limit;

    // Filtering
    let filter = {};
    if (req.query.minPrice) filter.price = { ...filter.price, $gte: parseFloat(req.query.minPrice) };
    if (req.query.maxPrice) filter.price = { ...filter.price, $lte: parseFloat(req.query.maxPrice) };
    if (req.query.location) {
      filter.location = { $regex: `^${req.query.location}$`, $options: 'i' };
    }

    // Sorting
    let sort = {};
    if (req.query.sort === 'price_asc') sort.price = 1;
    if (req.query.sort === 'price_desc') sort.price = -1;

    // Aggregate for minRating and rating sort
    let minRating = req.query.minRating ? parseFloat(req.query.minRating) : null;
    let sortByRating = req.query.sort === 'rating_desc' || req.query.sort === 'rating_asc';
    let listingsQuery = Listing.find(filter).populate('owner').populate('reviews');
    if (Object.keys(sort).length && !sortByRating) listingsQuery = listingsQuery.sort(sort);
    listingsQuery = listingsQuery.skip(skip).limit(limit);
    let listings = await listingsQuery.exec();

    // Calculate average rating for each listing
    listings = listings.map(listing => {
        let avgRating = 0;
        if (listing.reviews && listing.reviews.length > 0) {
            avgRating = listing.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / listing.reviews.length;
        }
        return { ...listing.toObject(), avgRating };
    });

    // If filtering by minRating, filter in-memory
    if (minRating !== null) {
        listings = listings.filter(listing => listing.avgRating >= minRating);
    }

    // Advanced sort by rating
    if (sortByRating) {
        listings = listings.sort((a, b) => {
            if (req.query.sort === 'rating_desc') return b.avgRating - a.avgRating;
            if (req.query.sort === 'rating_asc') return a.avgRating - b.avgRating;
            return 0;
        });
    }

    const total = await Listing.countDocuments(filter);
    res.json({
        listings,
        total,
        page,
        pages: Math.ceil(total / limit)
    });
};

// Get a single listing by ID
module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: [
                { path: "author" },
                { path: "listing" }
            ]
        })
        .populate('owner');
    if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
    }
    res.json({ listing });
};

// Create a new listing
module.exports.createListing = async (req, res, next) => {
    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
    }).send();
    let url = req.file ? req.file.path : undefined;
    let filename = req.file ? req.file.filename : undefined;
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    if (url && filename) {
        newListing.image = { url, filename };
    }
    newListing.geometry = response.body.features[0].geometry;
    let savedListing = await newListing.save();
    res.status(201).json({ listing: savedListing });
};

// Update a listing
module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    const { owner, ...listingData } = req.body.listing || {};
    let updatedListing = await Listing.findById(id);

    // Check if location is being updated
    if (listingData.location && listingData.location !== updatedListing.location) {
        // Geocode new location
        let response = await geocodingClient.forwardGeocode({
            query: listingData.location,
            limit: 1,
        }).send();
        if (response.body.features.length > 0) {
            updatedListing.geometry = response.body.features[0].geometry;
            console.log('Updated geometry:', updatedListing.geometry);
        } else {
            console.log('No geocoding result for:', listingData.location);
            return res.status(400).json({ error: 'Could not geocode the new location.' });
        }
    }

    // Update other fields
    Object.assign(updatedListing, listingData);

    if (req.file) {
        let url = req.file.path;
        let filename = req.file.filename;
        updatedListing.image = { url, filename };
    }

    await updatedListing.save();
    await updatedListing.populate('owner');
    res.json({ listing: updatedListing });
};

// Delete a listing
module.exports.deleteListing = async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    res.json({ message: 'Listing deleted successfully!' });
};