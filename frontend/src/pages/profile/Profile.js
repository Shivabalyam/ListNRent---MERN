import React, { useContext } from 'react';
import { UserContext } from '../../context/UserContext';

const Profile = () => {
  const { user } = useContext(UserContext);
  if (!user) return <div className="container mt-4"><h2>User Profile</h2><p>Loading...</p></div>;
  return (
    <div className="container mt-4">
      <h2>User Profile</h2>
      <div className="card p-4" style={{ maxWidth: 400 }}>
        <p><b>Username:</b> {user.username}</p>
        <p><b>Email:</b> {user.email}</p>
        <p><b>Role:</b> {user.role}</p>
      </div>
    </div>
  );
};

export default Profile; 