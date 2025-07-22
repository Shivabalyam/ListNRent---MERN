import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.js';
import Footer from './components/Footer.js';
import Listings from './pages/listings/Listings.js';
import ListingDetail from './pages/listings/ListingDetail.js';
import Login from './pages/auth/Login.js';
import Signup from './pages/auth/Signup.js';
import NewListing from './pages/listings/NewListing.js';
import EditListing from './pages/listings/EditListing.js';
import UserDashboard from './pages/dashboard/UserDashboard.js';
import AdminDashboard from './pages/dashboard/AdminDashboard.js';
import Profile from './pages/profile/Profile.js';
import ChangePassword from './pages/auth/ChangePassword.js';
import { UserProvider, UserContext } from './context/UserContext.js';

// Role-based route protection
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useContext(UserContext);
  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/listings" />;
  return children;
};

function App() {
  return (
    <UserProvider>
      <Router>
        <UserContext.Consumer>
          {({ user }) => <Navbar currUser={user} />}
        </UserContext.Consumer>
        <div className="container">
          <Routes>
            <Route path="/listings" element={<Listings />} />
            <Route path="/listings/new" element={<NewListing />} />
            <Route path="/listings/:id/edit" element={<EditListing />} />
            <Route path="/listings/:id" element={<ListingDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/listings" />} />
            <Route path="*" element={<Navigate to="/listings" />} />
          </Routes>
        </div>
        <Footer />
      </Router>
    </UserProvider>
  );
}

export default App;
