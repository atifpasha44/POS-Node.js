import React, { useState } from 'react';
import hotelLogo from '../hotel-abc-logo.png';

const APP_VERSION = '1.2.39.0';

export default function PosLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tin, setTin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, tin })
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error - could not reach the server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex',
      background: '#f2f2f2', fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: '#fff',
        borderRight: '1px solid #ddd'
      }}>
        <img src={hotelLogo} alt="Property logo" style={{ maxWidth: '260px', marginBottom: '18px' }} />
        <div style={{ color: '#1976d2', fontWeight: 'bold', fontSize: '0.95rem' }}>
          Version Number : {APP_VERSION}
        </div>
        <div style={{ color: '#1976d2', fontSize: '0.85rem', marginTop: '4px' }}>
          Your annual software subscription will expire on 2026-12-31
        </div>
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '54px', height: '54px', borderRadius: '50%', background: '#e53935',
            color: '#fff', fontSize: '1.8rem', fontWeight: 'bold', marginRight: '14px'
          }}>i</span>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#e53935' }}>ithots</div>
            <div style={{ fontSize: '1rem', color: '#666', letterSpacing: '2px' }}>touch POS</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ width: '320px' }}>
          <label style={{ fontWeight: 'bold', color: '#333' }}>User ID</label>
          <input
            type="text" value={email} onChange={e => setEmail(e.target.value)} required
            style={{ width: '100%', height: '40px', margin: '6px 0 16px 0', padding: '0 10px', border: '1.5px solid #bbb', borderRadius: '6px', fontSize: '1rem' }}
          />

          <label style={{ fontWeight: 'bold', color: '#333' }}>Password</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)} required
            style={{ width: '100%', height: '40px', margin: '6px 0 16px 0', padding: '0 10px', border: '1.5px solid #bbb', borderRadius: '6px', fontSize: '1rem' }}
          />

          <div style={{ textAlign: 'center', color: '#888', margin: '4px 0' }}>Or</div>

          <label style={{ fontWeight: 'bold', color: '#333' }}>Tin Number</label>
          <input
            type="text" value={tin} onChange={e => setTin(e.target.value)} placeholder="Swipe / enter TIN"
            style={{ width: '100%', height: '40px', margin: '6px 0 20px 0', padding: '0 10px', border: '1.5px solid #bbb', borderRadius: '6px', fontSize: '1rem' }}
          />

          {error && <div style={{ color: '#e53935', marginBottom: '12px', fontWeight: 'bold' }}>{error}</div>}

          <button type="submit" disabled={submitting} style={{
            width: '100%', height: '46px', background: '#1976d2', color: '#fff', border: 'none',
            borderRadius: '6px', fontSize: '1.1rem', fontWeight: 'bold', cursor: submitting ? 'default' : 'pointer',
            opacity: submitting ? 0.7 : 1
          }}>
            {submitting ? 'Logging in...' : 'LOGIN'}
          </button>
        </form>
      </div>
    </div>
  );
}
