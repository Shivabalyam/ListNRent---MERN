import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';

const ChangePassword = () => {
  const { user } = useContext(UserContext);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    try {
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password change failed');
      setSuccess('Password changed successfully!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user) return <div className="container mt-4"><h2>Change Password</h2><p>Loading...</p></div>;
  return (
    <div className="container mt-4" style={{ maxWidth: 400 }}>
      <h2>Change Password</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Current Password</label>
          <input type="password" className="form-control" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label">New Password</label>
          <input type="password" className="form-control" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Confirm New Password</label>
          <input type="password" className="form-control" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <button className="btn btn-primary" type="submit">Change Password</button>
      </form>
    </div>
  );
};

export default ChangePassword; 