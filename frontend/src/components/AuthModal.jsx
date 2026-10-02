import React, { useState } from 'react';
import { X, LogIn, UserPlus, AlertCircle, Shield, User } from 'lucide-react';
import { apiRequest, setAuthToken, setStoredUser } from '../api';

export default function AuthModal({ onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('customer'); // 'customer' or 'agent'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { email, password }
        : { name, email, password, role, phone };

      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setAuthToken(res.token);
      setStoredUser(res.user);
      onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoRole) => {
    setError(null);
    setLoading(true);
    try {
      const demoEmail = demoRole === 'agent' ? 'agent@travel.com' : 'customer@gmail.com';
      const demoPassword = 'password123';

      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: demoEmail, password: demoPassword })
      });

      setAuthToken(res.token);
      setStoredUser(res.user);
      onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px' }}
      >
        <div className="modal-header">
          <h3 className="modal-title">
            {isLogin ? 'Sign In to Wanderlust' : 'Create New Account'}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem'
          }}
        >
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              background: isLogin ? 'white' : 'transparent',
              boxShadow: isLogin ? 'var(--shadow-sm)' : 'none',
              fontWeight: '700'
            }}
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              background: !isLogin ? 'white' : 'transparent',
              boxShadow: !isLogin ? 'var(--shadow-sm)' : 'none',
              fontWeight: '700'
            }}
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
          >
            Register
          </button>
        </div>

        {/* 1-Click Demo Login Shortcuts */}
        <div
          style={{
            background: 'linear-gradient(to right, #eff6ff, #f0fdf4)',
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            border: '1px solid #bfdbfe'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#1e40af', marginBottom: '0.5rem' }}>
            ⚡ 1-Click Demo Logins
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              style={{ flex: 1, fontSize: '0.8rem' }}
              onClick={() => handleQuickDemo('customer')}
              disabled={loading}
            >
              <User size={13} />
              <span>Login Customer</span>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              style={{ flex: 1, fontSize: '0.8rem', borderColor: '#b45309', color: '#b45309' }}
              onClick={() => handleQuickDemo('agent')}
              disabled={loading}
            >
              <Shield size={13} />
              <span>Login Agent</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label className="form-label">Account Role</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <label
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: `2px solid ${role === 'customer' ? 'var(--color-primary)' : 'var(--border-color)'}`,
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      background: role === 'customer' ? 'var(--color-primary-light)' : 'transparent'
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="customer"
                      checked={role === 'customer'}
                      onChange={() => setRole('customer')}
                      style={{ display: 'none' }}
                    />
                    <User size={16} />
                    <span>Customer / Traveler</span>
                  </label>
                  <label
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: `2px solid ${role === 'agent' ? 'var(--color-accent)' : 'var(--border-color)'}`,
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      background: role === 'agent' ? 'var(--color-warning-light)' : 'transparent'
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="agent"
                      checked={role === 'agent'}
                      onChange={() => setRole('agent')}
                      style={{ display: 'none' }}
                    />
                    <Shield size={16} />
                    <span>Travel Agent</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+1 555-0100"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="alex@travel.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
