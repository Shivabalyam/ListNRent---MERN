const Listing = require('../models/listing');
const Review = require('../models/review');

// Create a new review for a listing
module.exports.createReview = async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review({ ...req.body.review, author: req.user._id, listing: listing._id });
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    // Populate author for response
    await newReview.populate('author');
    res.status(201).json({ review: newReview });
};

// Delete a review from a listing
module.exports.deleteReview = async (req, res) => {
    let { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    res.json({ message: 'Review deleted successfully!' });
};

// Update a review
module.exports.updateReview = async (req, res) => {
    const { id, reviewId } = req.params;
    const { rating, comment } = req.body.review;
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (!review.author.equals(req.user._id)) return res.status(403).json({ error: 'Not authorized' });
    review.rating = rating;
    review.comment = comment;
    await review.save();
    res.json({ review });
};