// Login.jsx
import React, { useState } from 'react';
import './Login.css';

const SOCKET_URL = 'http://localhost:5000';

const Login = ({ onSwitch }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${SOCKET_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.reload();
      } else {
        alert('✗ Invalid credentials\n\nTry:\nAdmin: admin@ypa.com / 12345\nUser: user@ypa.com / 123');
      }
    } catch (err) {
      alert('✗ Server error: Is backend running on port 5000?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-container login-bg">
      <div className="form-card login-card">
        <div className="logo-section">
          <div className="logo-circle">YPA</div>
          <h2 className="title">Login</h2>
          <p className="subtitle">Access YPA Platform</p>
        </div>

        <div>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="admin@ypa.com or user@ypa.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input"
              required
            />
          </div>

          <button onClick={handleSubmit} className="btn btn-login" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p className="switch-text">
            New to YPA?{' '}
            <span onClick={onSwitch} className="link-switch">
              Register here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;