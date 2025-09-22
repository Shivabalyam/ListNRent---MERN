import React, { useContext, useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const Navbar = () => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    await fetch(`${window.location.origin.includes('localhost') ? 'http://localhost:8080' : 'https://listnrentals-adlu.onrender.com'}/api/users/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    if (q) {
      navigate(`/listings?search=${encodeURIComponent(q)}`);
    } else {
      navigate('/listings');
    }
    setMobileMenuOpen(false);
  };

  // Mobile menu content
  const mobileMenu = (
    <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
      <nav className="mobile-menu" onClick={e => e.stopPropagation()}>
        <div className="mobile-menu-header">
          <Link className="navbar-brand d-flex align-items-center" to="/listings" onClick={() => setMobileMenuOpen(false)}>
            <i className="fa-solid fa-compass" style={{ color: 'var(--primary)', fontSize: '1.5rem', marginRight: '0.5rem' }}></i>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.5px', color: 'var(--primary)' }}>ListNRent</span>
          </Link>
          <button className="mobile-menu-close" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)}>&times;</button>
        </div>
        <div className="mobile-menu-links">
          <Link className="nav-link" to="/listings" onClick={() => setMobileMenuOpen(false)}>Explore</Link>
          <form className="d-flex mobile-search" role="search" onSubmit={handleSearch}>
            <input className="form-control search-inp" type="search" placeholder="Search destinations" value={search} onChange={e => setSearch(e.target.value)} />
            <button className="btn btn-search" type="submit"><i className="fa-solid fa-magnifying-glass"></i>Search</button>
          </form>
          {user && (
            <Link className="nav-link" to="/listings/new" onClick={() => setMobileMenuOpen(false)}>Add New Listing</Link>
          )}
          {!user ? (
            <div className="mobile-auth-links">
              <Link className="nav-link" to="/signup" onClick={() => setMobileMenuOpen(false)}><b>signup</b></Link>
              <Link className="nav-link" to="/login" onClick={() => setMobileMenuOpen(false)}><b>login</b></Link>
            </div>
          ) : (
            <div className="mobile-auth-links">
              <button className="nav-link" onClick={() => { setMobileMenuOpen(false); navigate('/profile'); }}>View Profile</button>
              <button className="nav-link" onClick={() => { setMobileMenuOpen(false); navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard'); }}>Dashboard</button>
              <button className="nav-link" onClick={() => { setMobileMenuOpen(false); navigate('/change-password'); }}>Change Password</button>
              <button className="nav-link text-danger" onClick={() => { setMobileMenuOpen(false); handleLogout(); }}>Logout</button>
            </div>
          )}
        </div>
      </nav>
    </div>
  );

  return (
    <nav className="navbar navbar-light bg-light border-bottom sticky-top">
      <div className="container-fluid">
        <div className="navbar-desktop-row">
          <Link className="navbar-brand d-flex align-items-center" to="/listings">
            <i className="fa-solid fa-compass" style={{ color: 'var(--primary)', fontSize: '2rem', marginRight: '0.75rem' }}></i>
            <span style={{ fontWeight: 700, fontSize: '1.5rem', letterSpacing: '0.5px', color: 'var(--primary)' }}>ListNRent</span>
          </Link>
          <form className="d-flex desktop-search-form" role="search" onSubmit={handleSearch}>
            <input className="form-control me-2 search-inp" type="search" placeholder="Search destinations" value={search} onChange={e => setSearch(e.target.value)} />
            <button className="btn btn-search" type="submit"><i className="fa-solid fa-magnifying-glass"></i>Search</button>
          </form>
          <div className="navbar-nav desktop-auth-right">
            {user && (
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