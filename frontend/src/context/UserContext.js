import React, { createContext, useState, useEffect } from 'react';
import { BACKEND_URL } from '../config';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/current-user`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <UserContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
}; 