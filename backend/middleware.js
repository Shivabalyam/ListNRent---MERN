const Listing = require("./models/listing");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema} = require('./schema.js');
const Review = require('./models/review.js');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';


module.exports.isLoggedIn = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if(req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl; // Update the redirect URL
    }
    next();
};

module.exports.isOwner = async (req, res, next) =>{
    let {id} = req.params;
    let listing = await Listing.findById(id);
    // Allow admin to proceed
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    const ownerId = listing.owner && listing.owner._id ? listing.owner._id.toString() : listing.owner?.toString();
    const userId = req.user && req.user._id ? req.user._id.toString() : null;
    if (!ownerId || !userId || ownerId !== userId) {
        return res.status(403).json({ error: 'You are not the owner of this listing' });
    }
    next();
};

module.exports.validateListing = (req, res, next) => {
    let {error} = listingSchema.validate(req.body);
    if( error) {
        let errMsg = error.details.map(el => el.message).join(', ');
        throw new ExpressError(400, errMsg);
    }else {
        next();
    }
};


module.exports.validateReview = (req, res, next) => {
    let {error} = reviewSchema.validate(req.body);
    if( error) {
        let errMsg = error.details.map(el => el.message).join(', ');
        throw new ExpressError(400, errMsg);
    }else {
        next();
    }
};


module.exports.isReviewAuthor = async (req, res, next) => {
    let {id, reviewId} = req.params;
    let review = await Review.findById(reviewId).populate('author');
    if (!review || !review.author) {
        return res.status(403).json({ error: 'You are not the author of this review (review or author not found)' });
    }
    // Handle both populated and unpopulated author
    const authorId = review.author._id ? review.author._id.toString() : review.author.toString();
    const userId = req.user && req.user._id ? req.user._id.toString() : null;
    if (!userId || authorId !== userId) {
        return res.status(403).json({ error: 'You are not the author of this review' });
    }
    next();
}

module.exports.parseListingFormData = (req, res, next) => {
  if (req.body && Object.keys(req.body).some(key => key.startsWith('listing['))) {
    req.body.listing = {};
    Object.keys(req.body).forEach(key => {
      const match = key.match(/^listing\[(.+)\]$/);
      if (match) {
        req.body.listing[match[1]] = req.body[key];
      }
    });
  }
  next();
};

module.exports.checkAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports.checkUser = (req, res, next) => {
  if (!req.user || req.user.role !== 'user') {
    return res.status(403).json({ error: 'User access required' });
  }
  next();
};   
