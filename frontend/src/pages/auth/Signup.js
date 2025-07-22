import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login: setUserContext } = useContext(UserContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('http://localhost:8080/api/users/signup', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, email, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      setUserContext(data.user); // Update user context
      navigate('/listings');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="row mt-3">
      <div className="col-8 offset-2">
        <h1>Sign Up On Wanderlust</h1>
        <form onSubmit={handleSubmit} className="needs-validation" noValidate>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">Username</label>
            <input name="username" className="form-control" placeholder="Enter username" required value={username} onChange={e => setUsername(e.target.value)} />
            <div className="invalid-feedback">Please enter a username.</div>
            <div className="valid-feedback">Username looks Good!</div>
          </div>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input type="email" name="email" placeholder="Enter email" className="form-control" required value={email} onChange={e => setEmail(e.target.value)} />
            <div className="invalid-feedback">Please enter a valid email.</div>
            <div className="valid-feedback">Email looks Good!</div>
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input type="password" name="password" placeholder="Enter password" className="form-control" required value={password} onChange={e => setPassword(e.target.value)} />
            <div className="invalid-feedback">Please enter a password.</div>
            <div className="valid-feedback">Password looks Good!</div>
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          <button className="btn btn-success">Sign Up</button>
        </form>
      </div>
    </div>
  );
};

export default Signup; 