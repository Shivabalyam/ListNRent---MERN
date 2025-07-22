// Usage: node scripts/fix_review_listing_refs.js (run from backend/)
require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../models/listing');
const Review = require('../models/review');

async function main() {
  await mongoose.connect(process.env.ATLASDB_URL);
  console.log('Connected to MongoDB');

  const orphanedReviews = await Review.find({ $or: [ { listing: { $exists: false } }, { listing: null } ] });
  console.log(`Found ${orphanedReviews.length} orphaned reviews.`);

  let fixed = 0;
  for (const review of orphanedReviews) {
    // Find the listing that contains this review
    const listing = await Listing.findOne({ reviews: review._id });
    if (listing) {
      review.listing = listing._id;
      await review.save();
      console.log(`Fixed review ${review._id} -> listing ${listing._id}`);
      fixed++;
    } else {
      console.warn(`Could not find listing for review ${review._id}`);
    }
  }
  console.log(`Done. Fixed ${fixed} reviews.`);
  mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); }); 