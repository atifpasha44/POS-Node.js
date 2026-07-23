import React, { useState } from 'react';
import PosLogin from './PosLogin';
import TableGrid from './TableGrid';

export default function PosApp() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('pos_user');
    return stored ? JSON.parse(stored) : null;
  });

  const handleLogin = (loggedInUser) => {
    localStorage.setItem('pos_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('pos_user');
    setUser(null);
  };

  if (!user) {
    return <PosLogin onLogin={handleLogin} />;
  }

  return <TableGrid user={user} onLogout={handleLogout} />;
}
