import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import logo from './logo.png';
import logger from './utils/simpleLogger'; // ADDED: Frontend logging

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tin, setTin] = useState('');
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();

  const [error, setError] = useState('');

  useEffect(() => {
    // ADDED: Log component mount
    logger.componentMounted('Login');
    logger.info('page', 'Login page loaded');
    
    return () => {
      logger.componentUnmounted('Login');
    };
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // ADDED: Log login attempt
    logger.userAction('login_attempt', {
      loginMethod: tin ? 'tin' : 'email_password',
      email: email || 'N/A',
      hasPassword: !!password,
      hasTin: !!tin,
      remember
    });
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, tin, remember })
      });
      const data = await res.json();
      if (data.success) {
        // ADDED: Log successful login
        logger.userAction('login_success', {
          user: data.user.user_code || data.user.user_name,
          loginMethod: tin ? 'tin' : 'email_password'
        });
        
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        // ADDED: Log login failure
        logger.userAction('login_failure', {
          reason: data.message,
          loginMethod: tin ? 'tin' : 'email_password'
        });
        
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      // ADDED: Log network error
      logger.error('auth', 'Login network error', {
        error: err.message,
        stack: err.stack
      });
      
      setError('Network error');
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="ithots-main-logo">
          <span className="ithots-main">ithots</span>
          <span className="ithots-hospitality">HOSPITALITY</span>
        </div>
        <h1>Welcome to Ithots</h1>
        <p className="login-desc">
          Ithots Provides you a Hospitality Software.<br />
          We are Introducing Ithots Generation 5<sup>th</sup><br />
          Fine Dining Restaurant Software.
        </p>
        <div className="g5-logo-card">
          <img src={logo} alt="ithots G5 Hospitality" className="g5-logo" />
        </div>
      </div>
      <div className="login-right">
        <div className="login-card">
          <h2>Login To Your Account</h2>
          <p className="login-subtext">Enter your details to login.</p>
          <form onSubmit={handleSubmit}>
            <label htmlFor="email">EMAIL ADDRESS</label>
            <div className="input-group">
              <span className="input-icon"><i className="fa fa-envelope"></i></span>
              <input type="email" id="email" placeholder="Enter Your Email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <label htmlFor="password">PASSWORD</label>
            <div className="input-group">
              <span className="input-icon"><i className="fa fa-lock"></i></span>
              <input type="password" id="password" placeholder="Enter Password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div className="tin-label">(or) TIN Number</div>
            <div className="input-group">
              <span className="input-icon"><i className="fa fa-id-card"></i></span>
              <input type="text" id="tin" placeholder="Swipe the Card" value={tin} onChange={e => setTin(e.target.value)} />
            </div>
            <div className="login-options">
              <label className="remember-me">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> Remember Me
              </label>
            </div>
            <button type="submit" className="login-btn">LOGIN</button>
            {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
          </form>
          <div className="login-links">
            <span>By clicking login, you agree to our <a href="#" className="terms-link">Terms & Conditions!</a></span>
            <br />
            <span className="contact-admin">If you don't have account please contact to admin</span>
          </div>
          <div className="login-footer">
            <span>9 2019 www.ithots.co.in. All Rights Reserved | Design by <b>Syed'Atif</b></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;


