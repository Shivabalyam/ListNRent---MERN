import React, { useState } from 'react';
import { BACKEND_URL } from '../config';

const ReviewForm = ({ listingId, onReviewAdded }) => {
  const [rating, setRating] = useState(1);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/listings/${listingId}/reviews`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ review: { rating, comment } }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add review');
      setRating(1);
      setComment('');
      if (onReviewAdded) onReviewAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="needs-validation mb-3" noValidate>
      <h3>Leave a review</h3>
      <div className="mb-3 mt-3">
        <label htmlFor="rating" className="form-label">Rating</label>
        <select id="rating" className="form-select" value={rating} onChange={e => setRating(Number(e.target.value))} required>
          {[1,2,3,4,5].map(val => <option key={val} value={val}>{val} star{val > 1 ? 's' : ''}</option>)}
        </select>
      </div>
      <div className="mb-3 mt-3">
        <label htmlFor="review" className="form-label">Review</label>
        <textarea name="review" id="review" className="form-control" placeholder="Enter your review here" required value={comment} onChange={e => setComment(e.target.value)} />
        <div className="invalid-feedback">Please enter a review.</div>
        <div className="valid-feedback">Review looks Good!</div>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <button type="submit" className="btn btn-dark" disabled={loading}>{loading ? 'Submitting...' : 'Submit Review'}</button>
    </form>
  );
};

export default ReviewForm; 