import React from 'react';
import { Link } from 'react-router-dom';

const ListingCard = ({ listing }) => (
  <Link to={`/listings/${listing._id}`} className="listing-link">
    <div className="card col listing-card">
      <img src={listing.image?.url} className="card-img-top responsive-card-img" alt="Listing" loading="lazy" />
      <div className="card-img-overlay"></div>
      <div className="card-body">
        <p className="card-text">
          <strong className="truncate-title">{listing.title}</strong><br />
          <span className="card-meta-row"><strong>Price: </strong> ₹{listing.price?.toLocaleString("en-IN")}/night</span><br />
          <span className="card-meta-row"><strong>Location: </strong> {listing.location}</span><br />
          <strong>Country: </strong> {listing.country}
          <span className="tax-info" style={{ display: 'none' }}> &nbsp; +18% GST</span>
        </p>
      </div>
    </div>
  </Link>
);

export default ListingCard; 