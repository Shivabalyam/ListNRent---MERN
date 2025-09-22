export const BACKEND_URL = (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost')
  ? 'http://localhost:8080'
  : 'https://listnrentals-adlu.onrender.com'; 