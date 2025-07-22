import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { UserContext } from '../../context/UserContext.js';

const BACKEND_URL = 'http://localhost:8080';

const AdminDashboard = () => {
  const { user } = useContext(UserContext);
  const [allUsers, setAllUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/users`, { withCredentials: true });
        setAllUsers(res.data.users || []);
      } catch (err) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    };
    fetchAllUsers();
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/bookings`, { withCredentials: true });
        setBookings(res.data.bookings || []);
      } catch (err) {
        // Optionally handle error
      } finally {
        setLoadingBookings(false);
      }
    };
    fetchBookings();
  }, []);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/listings?limit=1000`, { withCredentials: true });
        setListings(res.data.listings || []);
        // Aggregate reviews from all listings
        let allReviews = [];
        (res.data.listings || []).forEach(listing => {
          if (listing.reviews && Array.isArray(listing.reviews)) {
            allReviews = allReviews.concat(listing.reviews.map(r => ({ ...r, listing })));
          }
        });
        setReviews(allReviews);
      } catch (err) {
        // Optionally handle error
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchListings();
  }, []);

  if (!user) return <div className="container mt-4"><h2>Admin Dashboard</h2><p>Loading...</p></div>;

  // User analytics
  const normalUserCount = allUsers.filter(u => u.role === 'user').length;
  const adminUserCount = allUsers.filter(u => u.role === 'admin').length;

  // Booking analytics
  const totalRevenue = bookings.filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const revenueByStatus = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + (b.totalPrice || 0);
    return acc;
  }, {});
  const bookingsByStatus = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});
  // Most popular listing
  const listingBookingCounts = {};
  bookings.forEach(b => {
    if (b.listing && b.listing._id) {
      listingBookingCounts[b.listing._id] = (listingBookingCounts[b.listing._id] || 0) + 1;
    }
  });
  const mostPopularListingId = Object.keys(listingBookingCounts).reduce((a, b) => listingBookingCounts[a] > listingBookingCounts[b] ? a : b, null);
  const mostPopularListing = listings.find(l => l._id === mostPopularListingId);
  // Most active user
  const userBookingCounts = {};
  bookings.forEach(b => {
    if (b.user && b.user._id) {
      userBookingCounts[b.user._id] = (userBookingCounts[b.user._id] || 0) + 1;
    }
  });
  const mostActiveUserId = Object.keys(userBookingCounts).reduce((a, b) => userBookingCounts[a] > userBookingCounts[b] ? a : b, null);
  const mostActiveUser = allUsers.find(u => u._id === mostActiveUserId);

  // Review analytics
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(2) : 'N/A';
  // Most reviewed listing
  const listingReviewCounts = {};
  reviews.forEach(r => {
    if (r.listing && r.listing._id) {
      listingReviewCounts[r.listing._id] = (listingReviewCounts[r.listing._id] || 0) + 1;
    }
  });
  const mostReviewedListingId = Object.keys(listingReviewCounts).reduce((a, b) => listingReviewCounts[a] > listingReviewCounts[b] ? a : b, null);
  const mostReviewedListing = listings.find(l => l._id === mostReviewedListingId);

  // Recent activity
  const recentBookings = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const recentReviews = [...reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <div className="container mt-4">
      <h2>Admin Dashboard</h2>
      <div className="card p-4 mb-3" style={{ maxWidth: 400 }}>
        <p><b>Username:</b> {user.username}</p>
        <p><b>Email:</b> {user.email}</p>
        <p><b>Role:</b> {user.role}</p>
      </div>
      <div className="card p-4 mb-3" style={{ maxWidth: 400 }}>
        <h5>User Counts</h5>
        {loading ? <p>Loading user data...</p> : (
          <>
            <div className="mb-2">
              <span className="badge bg-info text-dark">Users (role=user): {normalUserCount}</span>
            </div>
            <div className="mb-2">
              <span className="badge bg-warning text-dark">Admins (role=admin): {adminUserCount}</span>
            </div>
          </>
        )}
      </div>
      <div className="card p-4 mb-3" style={{ maxWidth: 600 }}>
        <h5>Booking Analytics</h5>
        {loadingBookings ? <p>Loading bookings...</p> : (
          <>
            <div className="mb-2">
              <span className="badge bg-success">Total Bookings: {bookings.length}</span>
              <span className="badge bg-primary ms-2">Total Revenue: ₹{totalRevenue}</span>
            </div>
            <div className="mb-2">
              <span className="badge bg-secondary">Paid: {bookingsByStatus.paid || 0}</span>
              <span className="badge bg-warning ms-2">Pending: {bookingsByStatus.pending || 0}</span>
              <span className="badge bg-danger ms-2">Cancelled: {bookingsByStatus.cancelled || 0}</span>
            </div>
            <div className="mb-2">
              <span className="badge bg-info">Revenue by Status:</span>
              <span className="ms-2">Paid: ₹{revenueByStatus.paid || 0}</span>
              <span className="ms-2">Pending: ₹{revenueByStatus.pending || 0}</span>
              <span className="ms-2">Cancelled: ₹{revenueByStatus.cancelled || 0}</span>
            </div>
            <div className="mb-2">
              <span className="badge bg-info">Most Popular Listing:</span> {mostPopularListing ? mostPopularListing.title : 'N/A'}
            </div>
            <div className="mb-2">
              <span className="badge bg-info">Most Active User:</span> {mostActiveUser ? mostActiveUser.username : 'N/A'}
            </div>
          </>
        )}
      </div>
      <div className="card p-4 mb-3" style={{ maxWidth: 600 }}>
        <h5>Review Analytics</h5>
        {loadingReviews ? <p>Loading reviews...</p> : (
          <>
            <div className="mb-2">
              <span className="badge bg-primary">Total Reviews: {reviews.length}</span>
              <span className="badge bg-success ms-2">Average Rating: {avgRating}</span>
            </div>
            <div className="mb-2">
              <span className="badge bg-info">Most Reviewed Listing:</span> {mostReviewedListing ? mostReviewedListing.title : 'N/A'}
            </div>
          </>
        )}
      </div>
      <div className="card p-4 mb-3" style={{ maxWidth: 600 }}>
        <h5>Recent Bookings</h5>
        {loadingBookings ? <p>Loading bookings...</p> : (
          <ul style={{ maxHeight: 200, overflowY: 'auto' }}>
            {recentBookings.map(b => (
              <li key={b._id}>
                <b>{b.listing?.title || 'Listing'}</b> by {b.user?.username || 'User'} | {b.startDate?.slice(0,10)} to {b.endDate?.slice(0,10)} | Status: {b.status}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="card p-4 mb-3" style={{ maxWidth: 600 }}>
        <h5>Recent Reviews</h5>
        {loadingReviews ? <p>Loading reviews...</p> : (
          <ul style={{ maxHeight: 200, overflowY: 'auto' }}>
            {recentReviews.map(r => (
              <li key={r._id}>
                <b>{r.author?.username || 'User'}</b> on {r.listing?.title || 'Listing'} | Rating: {r.rating} | {r.comment?.slice(0, 40)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 