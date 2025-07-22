import React from 'react';
import { Link } from 'react-router-dom';

const ListingCard = ({ listing }) => (
  <Link to={`/listings/${listing._id}`} className="listing-link">
    <div className="card col listing-card">
      <img src={listing.image?.url} className="card-img-top" alt="Listing" style={{ height: '20rem' }} loading="lazy" />
      <div className="card-img-overlay"></div>
      <div className="card-body">
        <p className="card-text">
          <strong>{listing.title}</strong><br />
          <strong>Price: </strong> ₹{listing.price?.toLocaleString("en-IN")}/night<br />
          <strong>Location: </strong> {listing.location}<br />
          <strong>Country: </strong> {listing.country}
          <span className="tax-info" style={{ display: 'none' }}> &nbsp; +18% GST</span>
        </p>
      </div>
    </div>
  </Link>
);

export default ListingCard; 