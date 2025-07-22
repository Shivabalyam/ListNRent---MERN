import React from 'react';

const Footer = () => (
  <footer className="f-info">
    <div className="f-info-brand" style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>
      © {new Date().getFullYear()} Wanderlust
    </div>
    <div className="f-info-links">
      <a href="/listings">Explore</a>
    </div>
    <div className="f-info-socials">
      <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer"><i className="fab fa-twitter"></i></a>
      <a href="https://facebook.com/" target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook"></i></a>
      <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram"></i></a>
    </div>
  </footer>
);

export default Footer; 