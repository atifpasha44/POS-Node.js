import React, { useState } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';

function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  return user ? (
    <Dashboard user={user} setUser={setUser} />
  ) : (
    <Login setUser={setUser} />
  );
}

export default App;
