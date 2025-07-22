import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';

const BACKEND_URL = 'http://localhost:8080';

const UserDashboard = () => {
  const { user, setUser } = useContext(UserContext);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
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

  const handleLogout = async () => {
    await fetch(`${BACKEND_URL}/api/users/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
    navigate('/');
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    const res = await fetch(`${BACKEND_URL}/api/bookings/${bookingId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) setBookings(bookings.map(b => b._id === bookingId ? { ...b, status: 'cancelled' } : b));
    else alert('Failed to cancel booking.');
  };

  if (!user) return <div className="container mt-4"><h2>User Dashboard</h2><p>Loading...</p></div>;
  return (
    <div className="container mt-4">
      <h2>Welcome, {user.username}!</h2>
      <div className="card p-4 mb-3" style={{ maxWidth: 500 }}>
        <p><b>Username:</b> {user.username}</p>
        <p><b>Email:</b> {user.email}</p>
        <p><b>Role:</b> {user.role}</p>
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
                    {b.status !== 'cancelled' && (
                      <button className="btn btn-outline-danger btn-sm" onClick={() => handleCancelBooking(b._id)}>Cancel Booking</button>
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