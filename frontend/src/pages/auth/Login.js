import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import { BACKEND_URL } from '../../config';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showForgot, setShowForgot] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [email, setEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const { login: setUserContext } = useContext(UserContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setUserContext(data.user); // Update user context
      if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/listings');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotMsg('');
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setForgotMsg('If this email exists, an OTP has been sent.');
      setShowReset(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setResetMsg('');
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      setResetMsg('Password reset successful! You can now log in.');
      setTimeout(() => {
        setShowForgot(false);
        setShowReset(false);
        setResetMsg('');
      }, 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="row mt-3">
      <div className="col-8 offset-2">
        <h1>Login</h1>
        {!showForgot && !showReset && (
          <>
            <form onSubmit={handleSubmit} className="needs-validation" noValidate>
              <div className="mb-3">
                <label htmlFor="username" className="form-label">Username</label>
                <input name="username" className="form-control" placeholder="Enter username" required value={username} onChange={e => setUsername(e.target.value)} />
                <div className="invalid-feedback">Please enter a username.</div>
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">Password</label>
                <input type="password" name="password" placeholder="Enter password" className="form-control" required value={password} onChange={e => setPassword(e.target.value)} />
                <div className="invalid-feedback">Please enter a password.</div>
              </div>
              {error && <div className="alert alert-danger">{error}</div>}
              <button className="btn btn-success">Login</button>
            </form>
            <div className="mt-2">
              <button type="button" onClick={() => setShowForgot(true)} style={{ background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', padding: 0, fontSize: '1rem', cursor: 'pointer' }}>Forgot Password?</button>
            </div>
          </>
        )}
        {showForgot && !showReset && (
          <>
            <form onSubmit={handleForgot}>
              <div className="mb-3">
                <label className="form-label">Enter your email address</label>
                <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              {error && <div className="alert alert-danger">{error}</div>}
              {forgotMsg && <div className="alert alert-success">{forgotMsg}</div>}
              <button className="btn btn-primary" type="submit">Send OTP</button>
              <button className="btn btn-link ms-2" type="button" onClick={() => { setShowForgot(false); setError(null); }}>Back to Login</button>
            </form>
          </>
        )}
        {showReset && (
          <>
            <form onSubmit={handleReset}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">OTP (from email)</label>
                <input type="text" className="form-control" value={otp} onChange={e => setOtp(e.target.value)} required />
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
              {resetMsg && <div className="alert alert-success">{resetMsg}</div>}
              <button className="btn btn-success" type="submit">Reset Password</button>
              <button className="btn btn-link ms-2" type="button" onClick={() => { setShowForgot(false); setShowReset(false); setError(null); }}>Back to Login</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Login; 