import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';
import logo from './logo.png';

function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tin, setTin] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/login', {
        email,
        password,
        tin,
        remember,
      });
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      } else {
        setError(res.data.message || 'Login failed');
      }
    } catch (err) {
      setError('Login failed');
    }
  };

  return (
    <div className="container login-bg-gradient">
      <div className="welcome-section">
        <img src={logo} alt="POS Logo" className="login-logo-img" />
        <h1>Welcome to Ithots</h1>
        <p>Ithots provides you a Hospitality software. We are introducing ithots generation 5th fine dining restaurant software.</p>
      </div>
      <div className="login-section">
        <h2>Login To Your Account</h2>
        <form onSubmit={handleSubmit}>
          <label>EMAIL ADDRESS</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter Your Email" />
          <label>PASSWORD</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter Password" />
          <label>(or) TIN Number</label>
          <input type="text" value={tin} onChange={e => setTin(e.target.value)} placeholder="Swipe the Card" />
          <div className="remember-me">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
            <label>Remember Me</label>
          </div>
          <button type="submit" className="login-btn">LOGIN</button>
        </form>
        {error && <div className="error">{error}</div>}
        <p className="terms">By clicking login, you agree to our <a href="#">Terms & Conditions!</a></p>
        <p>If you don't have account please contact to admin</p>
      </div>
    </div>
  );
}

export default Login;


