// Registration.jsx
import React, { useState } from 'react';

const SOCKET_URL = 'http://localhost:5000';

const Registration = ({ onSwitch }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    profilePicture: null,
    role: 'user'
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePicture: reader.result });
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${SOCKET_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        alert('✓ Registration successful! Redirecting to login...');
        onSwitch();
      } else {
        alert('✗ ' + (data.msg || 'Registration failed'));
      }
    } catch (err) {
      alert('✗ Server error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    screenContainer: {
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    formCard: {
      background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
      borderRadius: '16px',
      padding: '40px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      maxWidth: '450px',
      width: '100%',
      animation: 'slideUp 0.5s ease-out'
    },
    logoSection: {
      textAlign: 'center',
      marginBottom: '35px',
      paddingBottom: '25px',
      borderBottom: '2px solid #e5e7eb'
    },
    logoCircle: {
      width: '90px',
      height: '90px',
      background: 'linear-gradient(135deg, #f9c74f 0%, #f8ad9d 100%)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#1e3a0f',
      margin: '0 auto 20px',
      boxShadow: '0 10px 30px rgba(249, 199, 79, 0.3)'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1a1a2e',
      margin: '0 0 10px 0'
    },
    subtitle: {
      fontSize: '14px',
      color: '#6b7280',
      margin: '0',
      fontWeight: '500'
    },
    inputGroup: {
      marginBottom: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    label: {
      fontSize: '13px',
      fontWeight: '700',
      color: '#374151',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    input: {
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      fontSize: '14px',
      fontFamily: 'inherit',
      backgroundColor: '#f9fafb',
      color: '#374151',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    button: {
      padding: '14px 24px',
      border: 'none',
      borderRadius: '10px',
      fontSize: '15px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      width: '100%',
      textAlign: 'center',
      fontFamily: 'inherit',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
      marginBottom: '15px'
    },
    switchText: {
      textAlign: 'center',
      color: '#6b7280',
      fontSize: '14px',
      margin: '0',
      fontWeight: '500'
    },
    linkSwitch: {
      color: '#667eea',
      fontWeight: '700',
      cursor: 'pointer',
      textDecoration: 'none'
    },
    previewPic: {
      width: '100px',
      height: '100px',
      borderRadius: '10px',
      objectFit: 'cover',
      marginTop: '12px',
      border: '3px solid #667eea',
      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
    },
    fileInput: {
      cursor: 'pointer'
    }
  };

  return (
    <div style={styles.screenContainer}>
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        input:focus, select:focus {
          outline: none;
          border-color: #667eea !important;
          background-color: white !important;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1) !important;
        }
        button:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4) !important;
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
      
      <div style={styles.formCard}>
        <div style={styles.logoSection}>
          <div style={styles.logoCircle}>YPA</div>
          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.subtitle}>Join YPA Enterprise</p>
        </div>

        <div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              style={styles.input}
            >
              <option value="user">User (Password: 123)</option>
              <option value="admin">Admin (Password: 12345)</option>
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              placeholder="Your full name"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Profile Picture</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={styles.fileInput}
            />
            {preview && <img src={preview} alt="Preview" style={styles.previewPic} />}
          </div>

          <button onClick={handleSubmit} style={styles.button} disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>

          <p style={styles.switchText}>
            Already registered?{' '}
            <span onClick={onSwitch} style={styles.linkSwitch}>
              Login here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Registration;