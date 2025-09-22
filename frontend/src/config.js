export const BACKEND_URL = 
  (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost')
    ? 'http://localhost:8080' // local backend port
    : 'https://listnrentals.onrender.com'; // Render backend URL
