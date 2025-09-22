import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import ReviewForm from '../../components/ReviewForm';
import MapboxMap from '../../components/MapboxMap';
import { BACKEND_URL } from '../../config';
// Remove Stripe imports
// import { loadStripe } from '@stripe/stripe-js';
// import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

function loadRazorpayScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function BookingForm({ listing, user, onBookingSuccess }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guests, setGuests] = useState(1);
  const [price, setPrice] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [platformFee, setPlatformFee] = useState(0);
  const [step, setStep] = useState('form'); // 'form' | 'processing' | 'success'
  const [error, setError] = useState(null);

  useEffect(() => {
    if (startDate && endDate) {
      const nights = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
      const sub = nights > 0 ? nights * listing.price : 0;
      const fee = Math.round(sub * 0.10);
      setSubtotal(sub);
      setPlatformFee(fee);
      setPrice(sub + fee);
    } else {
      setSubtotal(0);
      setPlatformFee(0);
      setPrice(0);
    }
  }, [startDate, endDate, listing.price]);

  const handleBooking = async (e) => {
    e.preventDefault();
    setError(null);
    if (!startDate || !endDate || guests < 1) {
      setError('Please select valid dates and number of guests.');
      return;
    }
    setStep('processing');
    // 1. Load Razorpay script
    const loaded = await loadRazorpayScript('https://checkout.razorpay.com/v1/checkout.js');
    if (!loaded) {
      setError('Failed to load Razorpay.');
      setStep('form');
      return;
    }
    // 2. Create order on backend
    const res = await fetch(`${BACKEND_URL}/api/bookings/orders`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: listing._id, startDate, endDate, guests })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to create order');
      setStep('form');
      return;
    }
    // 3. Open Razorpay Checkout
    const options = {
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      name: 'Booking Payment',
      description: `Booking for ${listing.title}`,
      order_id: data.orderId,
      handler: async function (response) {
        // 4. Verify payment and create booking
        const verifyRes = await fetch(`${BACKEND_URL}/api/bookings/verify`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...response,
            listingId: listing._id,
            startDate,
            endDate,
            guests
          })
        });
        const verifyData = await verifyRes.json();
        if (verifyRes.ok) {
          setStep('success');
          if (onBookingSuccess) onBookingSuccess();
        } else {
          setError(verifyData.error || 'Payment verification failed');
          setStep('form');
        }
      },
      prefill: {
        name: user.username,
        email: user.email,
      },
      theme: { color: '#3399cc' },
      modal: {
        ondismiss: () => setStep('form')
      }
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  if (step === 'success') return <div className="alert alert-success mt-3">Booking successful! Check your dashboard for details.</div>;

  return (
    <div className="card p-3 mb-4">
      <h4>Book this listing</h4>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleBooking}>
        <div className="mb-2">
          <label>Start Date: <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-control" required /></label>
        </div>
        <div className="mb-2">
          <label>End Date: <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="form-control" required /></label>
        </div>
        <div className="mb-2">
          <label>Guests: <input type="number" min="1" value={guests} onChange={e => setGuests(Number(e.target.value))} className="form-control" required /></label>
        </div>
        <div className="mb-2">
          <div className="small text-muted">Subtotal: ₹{subtotal}</div>
          <div className="small text-muted">Platform fee (10%): ₹{platformFee}</div>
          <b>Total Price: ₹{price}</b>
        </div>
        <button className="btn btn-primary" type="submit" disabled={price <= 0 || step === 'processing'}>
          {step === 'processing' ? 'Processing...' : 'Book & Pay Now'}
        </button>
      </form>
    </div>
  );
}

const ListingDetail = () => {
  const { id } = useParams();
  const { user } = useContext(UserContext);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [editReviewId, setEditReviewId] = useState(null);
  const [editRating, setEditRating] = useState(1);
  const [editComment, setEditComment] = useState('');
  const [editError, setEditError] = useState(null);

  const fetchListing = () => {
    fetch(`${BACKEND_URL}/api/listings/${id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setListing(data.listing);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load listing');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchListing();
    // eslint-disable-next-line
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/listings/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to delete listing');
      navigate('/listings');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/listings/${id}/reviews/${reviewId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to delete review');
      fetchListing();
    } catch (err) {
      alert(err.message);
    }
  };

  // Add a new handler for admin review deletion
  const handleAdminDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review as admin?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/reviews/${reviewId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to delete review');
      fetchListing();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditReview = (review) => {
    setEditReviewId(review._id);
    setEditRating(review.rating);
    setEditComment(review.comment);
    setEditError(null);
  };

  const handleSaveEditReview = async (review) => {
    setEditError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/listings/${id}/reviews/${review._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review: { rating: editRating, comment: editComment } })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update review');
      setEditReviewId(null);
      fetchListing();
    } catch (err) {
      setEditError(err.message);
    }
  };

  // Remove isOwner and use canEditOrDelete for edit/delete logic
  const canBook = user && !(user._id === (listing?.owner?._id || listing?.owner) || user.role === 'admin');
  const isAdmin = user && user.role === 'admin';

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="alert alert-danger mt-3">{error}</p>;
  if (!listing) return <p>Listing not found.</p>;

  return (
    <div className="row mt-3">
      <div className="col-8 offset-2">
        <h1>{listing.title}</h1><br />
        <div className="card col-6 offset-3 show-card listing-card">
          <img src={listing.image?.url} className="card-img-top show-img" alt="listing" loading="lazy" />
          <div className="card-body">
            <p className="card-text">
              {listing.description}<br />
              {listing.price}<br />
              {listing.location}<br />
              {listing.country}<br />
            </p>
          </div>
        </div><br />
        {/* Booking Form: Only for authenticated users who are not the owner/admin */}
        {canBook && (
          <BookingForm listing={listing} user={user} onBookingSuccess={fetchListing} />
        )}
        {isAdmin && (
          <div className="d-flex justify-content-center btns mb-3">
            <Link to={`/listings/${listing._id}/edit`} className="btn btn-warning edit-btn me-2">Edit</Link>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        )}
        <div className="col-8 offset-2 mt-3">
          {user && <ReviewForm listingId={listing._id} onReviewAdded={fetchListing} />}
          <hr />
          {listing.reviews && listing.reviews.length > 0 && (
            <div className="row">
              <b><h5>All Reviews</h5></b><br />
              {listing.reviews.map(review => (
                <div className="card col-5 mb-3 ms-3 review-card" key={review._id}>
                  <div className="card-body">
                    <b><h5 className="card-title">@{review.author?.username}</h5></b>
                    <p className="starability-result card-text" data-rating={review.rating}></p>
                    {editReviewId === review._id ? (
                      <>
                        <div className="mb-2">
                          <label>Rating: </label>
                          <select value={editRating} onChange={e => setEditRating(Number(e.target.value))}>
                            {[1,2,3,4,5].map(val => <option key={val} value={val}>{val}</option>)}
                          </select>
                        </div>
                        <div className="mb-2">
                          <label>Comment: </label>
                          <input value={editComment} onChange={e => setEditComment(e.target.value)} className="form-control" />
                        </div>
                        {editError && <div className="text-danger">{editError}</div>}
                        {review.listing && review.listing._id ? (
                          <>
                            <button className="btn btn-success btn-sm me-2" onClick={() => handleSaveEditReview(review)}>Save</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setEditReviewId(null)}>Cancel</button>
                          </>
                        ) : (
                          <div className="text-warning">This review is missing its listing reference and cannot be edited.</div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="card-text">{review.comment}</p>
                        <p className="card-text">Reviewed on: {new Date(review.createdAt).toLocaleDateString()}</p>
                        {/* Show edit/delete for review author, but delete for admin on all reviews */}
                        {user && review.author && review.author._id && review.listing && review.listing._id && user._id === review.author._id && (
                          <>
                            <button className="btn btn-outline-primary btn-sm me-2" onClick={() => handleEditReview(review)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteReview(review._id)}>Delete</button>
                          </>
                        )}
                        {/* Admin can delete any review */}
                        {user && user.role === 'admin' && (
                          <button className="btn btn-danger btn-sm ms-2" onClick={() => handleAdminDeleteReview(review._id)}>Delete (Admin)</button>
                        )}
                        {(!review.listing || !review.listing._id) && (
                          <div className="text-warning">This review is missing its listing reference and cannot be edited or deleted.</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="col-8 offset-3 mb-3">
        <h3>Where you will be</h3>
        {listing.geometry ? (
          <MapboxMap coordinates={listing.geometry.coordinates} location={listing.location} />
        ) : (
          <div id="map" style={{ height: '400px', width: '80vh', background: '#eee' }}>
            <p>Map not available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingDetail; 