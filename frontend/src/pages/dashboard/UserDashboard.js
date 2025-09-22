import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import { BACKEND_URL } from '../../config';
import ListingCard from '../../components/ListingCard';

const UserDashboard = () => {
  const { user, setUser } = useContext(UserContext);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [myListings, setMyListings] = useState([]);
  const [loadingMyListings, setLoadingMyListings] = useState(true);
  const [listingTotals, setListingTotals] = useState({ totalEarnings: 0, totalBookings: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReviews = async () => {
      if (!user) return;
      try {
        const res = await fetch(`${BACKEND_URL}/api/users/my-reviews`, { credentials: 'include' });
        const data = await res.json();
        if (res.ok) setReviews(data.reviews);
      } catch (err) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [user]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      try {
        const res = await fetch(`${BACKEND_URL}/api/bookings/my`, { credentials: 'include' });
        const data = await res.json();
        if (res.ok) setBookings(data.bookings);
      } catch (err) {
        // Optionally handle error
      } finally {
        setLoadingBookings(false);
      }
    };
    fetchBookings();
  }, [user]);

  useEffect(() => {
    const fetchMyListings = async () => {
      if (!user) return;
      try {
        const res = await fetch(`${BACKEND_URL}/api/users/my-listings`, { credentials: 'include' });
        const data = await res.json();
        if (res.ok) {
          setMyListings(data.listings || []);
          setListingTotals(data.totals || { totalEarnings: 0, totalBookings: 0 });
        }
      } catch (err) {
        // Optionally handle error
      } finally {
        setLoadingMyListings(false);
      }
    };
    fetchMyListings();
  }, [user]);

  const handleLogout = async () => {
    await fetch(`${BACKEND_URL}/api/users/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
    navigate('/');
  };

  const handleCancelBooking = async (bookingId, startDate) => {
    // Check if less than 24 hours remain before startDate
    const now = new Date();
    const start = new Date(startDate);
    const diffMs = start - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 24) {
      alert('You can only cancel a booking more than 24 hours before the start date.');
      return;
    }
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    const res = await fetch(`${BACKEND_URL}/api/bookings/${bookingId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await res.json();
    if (res.ok) setBookings(bookings.map(b => b._id === bookingId ? { ...b, status: 'cancelled' } : b));
    else alert(data.error || 'Failed to cancel booking.');
  };

  if (!user) return <div className="container mt-4"><h2>User Dashboard</h2><p>Loading...</p></div>;
  return (
    <div className="container mt-4">
      <h2>Welcome, {user.username}!</h2>
      <div className="card p-4 mb-3" style={{ maxWidth: 500 }}>
        <p><b>Username:</b> {user.username}</p>
        <p><b>Email:</b> {user.email}</p>
        <p><b>Number of reviews:</b> {loading ? 'Loading...' : reviews.length}</p>
      </div>
      <div className="mb-4">
        <h5>Your Reviews</h5>
        {loading ? <p>Loading reviews...</p> : (
          reviews.length === 0 ? <p>You haven't written any reviews yet.</p> :
          <div className="row">
            {reviews.map(r => (
              <div key={r._id} className="col-md-6 mb-3">
                <div className="card shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-2">
                      <span className="badge bg-primary me-2">Rating: {r.rating}</span>
                      <span className="text-muted small ms-auto">{new Date(r.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mb-1"><b>Comment:</b> {r.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mb-4">
        <h5>Your Listings</h5>
        {loadingMyListings ? <p>Loading your listings...</p> : (
          myListings.length === 0 ? (
            <div>
              <p>You haven't posted any listings yet.</p>
              <Link to="/listings/new" className="btn btn-outline-primary btn-sm">Add Your First Listing</Link>
            </div>
          ) : (
            <>
              <div className="card p-3 mb-3" style={{ maxWidth: 600 }}>
                <div className="d-flex gap-4 flex-wrap">
                  <div><b>Total Listings:</b> {myListings.length}</div>
                  <div><b>Total Bookings:</b> {listingTotals.totalBookings}</div>
                  <div><b>Total Earnings:</b> ₹{listingTotals.totalEarnings?.toLocaleString('en-IN')}</div>
                </div>
              </div>
              <div className="row row-cols-lg-3 row-cols-md-2 row-cols-sm-1 mt-2">
                {myListings.map(l => (
                  <div key={l._id} className="mb-3">
                    <ListingCard listing={l} />
                    <div className="mt-2 small text-muted">
                      <span className="me-3"><b>Avg Rating:</b> {Math.round((l.avgRating || 0) * 10) / 10}</span>
                      <span className="me-3"><b>Bookings:</b> {l.bookingsCount || 0}</span>
                      <span><b>Earnings:</b> ₹{(l.earnings || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        )}
      </div>
      <div className="mb-4">
        <h5>Your Bookings</h5>
        {loadingBookings ? <p>Loading bookings...</p> : (
          bookings.length === 0 ? <p>You have no bookings yet.</p> :
          <div className="row">
            {bookings.map(b => (
              <div key={b._id} className="col-md-6 mb-3">
                <div className="card shadow-sm h-100">
                  <div className="card-body">
                    <div className="mb-2">
                      <b>Listing:</b> {b.listing?.title || 'N/A'}
                    </div>
                    <div className="mb-2">
                      <b>Dates:</b> {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                    </div>
                    <div className="mb-2">
                      <b>Guests:</b> {b.guests}
                    </div>
                    <div className="mb-2">
                      <b>Total Price:</b> ${b.totalPrice}
                    </div>
                    <div className="mb-2">
                      <b>Status:</b> <span className={`badge ${b.status === 'paid' ? 'bg-success' : b.status === 'pending' ? 'bg-warning' : 'bg-secondary'}`}>{b.status}</span>
                    </div>
                    {b.status !== 'cancelled' && (new Date(b.startDate) - new Date() > 24 * 60 * 60 * 1000) && (
                      <button className="btn btn-outline-danger btn-sm" onClick={() => handleCancelBooking(b._id, b.startDate)}>Cancel Booking</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="d-flex gap-3">
        <Link className="btn btn-outline-primary" to="/profile">View Profile</Link>
        <Link className="btn btn-outline-secondary" to="/change-password">Change Password</Link>
        <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default UserDashboard; 