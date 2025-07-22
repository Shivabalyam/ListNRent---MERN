import React, { useContext, useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const Navbar = () => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  // Add state for search input
  const [search, setSearch] = useState("");

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = async () => {
    await fetch('/api/users/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    navigate('/');
  };

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/listings?location=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom sticky-top">
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center" to="/listings">
          <i className="fa-solid fa-compass" style={{ color: 'var(--primary)', fontSize: '2rem', marginRight: '0.75rem' }}></i>
          <span style={{ fontWeight: 700, fontSize: '1.5rem', letterSpacing: '0.5px', color: 'var(--primary)' }}>Wanderlust</span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
          <div className="navbar-nav">
            <Link className="nav-link" to="/listings">Explore</Link>
          </div>
          <div className="navbar-nav ms-auto">
            <form className="d-flex" role="search" onSubmit={handleSearch}>
              <input className="form-control me-2 search-inp" type="search" placeholder="Search destinations" value={search} onChange={e => setSearch(e.target.value)} />
              <button className="btn btn-search" type="submit"><i className="fa-solid fa-magnifying-glass"></i>Search</button>
            </form>
          </div>
          <div className="navbar-nav ms-auto">
            {/* Only show Add New Listing for admin users */}
            {user && user.role === 'admin' && (
              <Link className="nav-link" to="/listings/new">Add New Listing</Link>
            )}
            {!user ? (
              <>
                <Link className="nav-link" to="/signup"><b>signup</b></Link>
                <Link className="nav-link" to="/login"><b>login</b></Link>
              </>
            ) : (
              <div className="nav-item dropdown" ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  className="avatar-btn"
                  onClick={() => setDropdownOpen((open) => !open)}
                  style={{
                    background: '#eee',
                    border: 'none',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: 20,
                    cursor: 'pointer',
                    marginLeft: 10
                  }}
                  aria-label="User menu"
                >
                  {user.username ? user.username[0].toUpperCase() : '?'}
                </button>
                {dropdownOpen && (
                  <div
                    className="dropdown-menu show"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '110%',
                      minWidth: 180,
                      background: '#fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      borderRadius: 8,
                      zIndex: 1000,
                      padding: '0.5rem 0',
                    }}
                  >
                    <button className="dropdown-item" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none' }} onClick={() => { setDropdownOpen(false); navigate('/profile'); }}>View Profile</button>
                    <button className="dropdown-item" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none' }} onClick={() => { setDropdownOpen(false); navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard'); }}>Dashboard</button>
                    <button className="dropdown-item" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none' }} onClick={() => { setDropdownOpen(false); navigate('/change-password'); }}>Change Password</button>
                    <div style={{ borderTop: '1px solid #eee', margin: '0.5rem 0' }} />
                    <button className="dropdown-item text-danger" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none' }} onClick={handleLogout}>Logout</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 