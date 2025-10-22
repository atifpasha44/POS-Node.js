import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import logger from './utils/simpleLogger'; // ADDED: Frontend logging

function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    // ADDED: Log application startup
    logger.info('app', 'POS Application Started', {
      userLoggedIn: !!user,
      currentPath: window.location.pathname
    });
    
    logger.componentMounted('App');
    
    return () => {
      logger.componentUnmounted('App');
    };
  }, []);

  useEffect(() => {
    // ADDED: Log user state changes
    if (user) {
      logger.info('auth', 'User logged in', {
        userCode: user.user_code,
        userName: user.user_name
      });
    } else {
      logger.info('auth', 'User logged out');
    }
  }, [user]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
