import React, { useState } from 'react';
import './Dashboard.css';
import ProfileModal from './ProfileModal';
import UserSetup from './UserSetup';
import UserGroups from './UserGroups';
import UserManagement from './UserManagement';



const sidebarModules = [
  { name: 'Property Management' },
  { name: 'Outlet Management' },
  { name: 'Menu Management' },
  { name: 'POS System Management' },
  { name: 'Printing Management' },
  {
    name: 'Report Management',
    expandable: true,
    children: [
      { name: 'End of Day' },
      { name: 'POS System' },
    ],
  },
  {
    name: 'User Management',
    expandable: true,
    children: [
      { name: 'Departments' },
      { name: 'Designation' },
      { name: 'User Setup' },
      { name: 'User Groups' },
    ],
  },
];

function Dashboard() {
  // Place all state, handlers, and logic here
  const [showProfile, setShowProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [expanded, setExpanded] = useState({});
  const [showUserSetup, setShowUserSetup] = useState(false);
  const [showUserGroups, setShowUserGroups] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);

  const handleProfileSave = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setShowProfile(false);
  };

  const handleProfileClose = () => setShowProfile(false);
  const handleProfileClick = () => setShowProfile(true);
  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.reload();
  };
  const toggleExpand = (name) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  if (showProfile) {
    return (
      <div className="dashboard-container">
        <div className="main-content" style={{ width: '100%' }}>
          <div style={{ background: '#1976d2', color: '#fff', padding: '20px', borderRadius: '10px 10px 0 0', marginBottom: '0', textAlign: 'left' }}>
            <span style={{ display: 'inline-block', width: '70px', height: '70px', borderRadius: '50%', background: '#fff', verticalAlign: 'middle', marginRight: '20px' }}></span>
            <span style={{ fontSize: '1.5em', fontWeight: 'bold', verticalAlign: 'middle' }}>{currentUser.name}</span>
          </div>
          <div style={{ background: '#fff', margin: '30px auto', padding: '30px 40px', borderRadius: '0 0 10px 10px', boxShadow: '0 0 20px rgba(0,0,0,0.1)', minWidth: '350px', maxWidth: '500px' }}>
            <h2 style={{ color: '#1976d2' }}>User Details</h2>
            <div style={{ marginBottom: '18px' }}><span style={{ fontWeight: 'bold', color: '#1976d2', display: 'inline-block', width: '140px' }}>Name:</span> <span style={{ color: '#222' }}>{currentUser.name}</span></div>
            <div style={{ marginBottom: '18px' }}><span style={{ fontWeight: 'bold', color: '#1976d2', display: 'inline-block', width: '140px' }}>Email:</span> <span style={{ color: '#222' }}>{currentUser.email}</span></div>
            <div style={{ marginBottom: '18px' }}><span style={{ fontWeight: 'bold', color: '#1976d2', display: 'inline-block', width: '140px' }}>TIN:</span> <span style={{ color: '#222' }}>{currentUser.tin}</span></div>
            <div style={{ marginBottom: '18px' }}><span style={{ fontWeight: 'bold', color: '#1976d2', display: 'inline-block', width: '140px' }}>Role:</span> <span style={{ color: '#222' }}>{currentUser.role || (currentUser.isAdmin ? 'Admin' : 'User')}</span></div>
            <button onClick={handleProfileClose} style={{ padding: '8px 18px', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', background: '#888', color: '#fff', marginTop: '20px' }}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="logo-small" />
        <h3>Modules</h3>
        <ul>
          {sidebarModules.map((mod, i) => (
            <React.Fragment key={i}>
              <li
                className={mod.expandable ? 'expandable' : ''}
                onClick={mod.expandable ? () => toggleExpand(mod.name) : undefined}
                style={{ cursor: mod.expandable ? 'pointer' : 'default', fontWeight: mod.expandable ? 'bold' : 'normal' }}
              >
                {mod.name}
                {mod.expandable && (
                  <span style={{ float: 'right' }}>{expanded[mod.name] ? '-' : '+'}</span>
                )}
              </li>
              {mod.expandable && expanded[mod.name] && (
                <ul className="sub-menu">
                  {mod.children.map((child, j) => {
                    if (mod.name === 'User Management' && child.name === 'User Setup') {
                      return [
                        <li key={j} className="sub-item" onClick={() => setShowUserSetup(true)} style={{ cursor: 'pointer' }}>{child.name}</li>,
                        <li key={j + '-manage'} className="sub-item" onClick={() => setShowUserManagement(true)} style={{ cursor: 'pointer' }}>Manage Users & Groups</li>
                      ];
                    }
                    if (mod.name === 'User Management' && child.name === 'User Groups') {
                      return <li key={j} className="sub-item" onClick={() => setShowUserGroups(true)} style={{ cursor: 'pointer' }}>{child.name}</li>;
                    }
                    return <li key={j} className="sub-item">{child.name}</li>;
                  })}
                </ul>
              )}
            </React.Fragment>
          ))}
        </ul>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
      <div className="main-content">
        <header className="dashboard-header">
          <h1>Welcome to ithots POS</h1>
          <div className="profile" onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
            <div className="profile-img" />
            <span className="profile-name">{currentUser.name}</span>
          </div>
        </header>
        <div className="info-cards">
          <div className="info-card">
            <h2>License Info</h2>
            <div className="info-table">
              <div><b>Licensed Name:</b> ABC Hotels</div>
              <div><b>Legal Owner:</b> Mr Amitabh</div>
              <div><b>Address:</b> Moghulrajpuram</div>
              <div><b>City:</b> Vijayawada - 520010</div>
              <div><b>Subscription Start Date:</b> 15-Aug-2020</div>
              <div><b>Subscription End Date:</b> 15-Aug-2021</div>
            </div>
          </div>
          <div className="info-card">
            <h2>System Info</h2>
            <div className="info-table">
              <div><b>Property code:</b> </div>
              <div><b>Database Name:</b> ithoughts</div>
              <div><b>No Of Outlets:</b> </div>
            </div>
          </div>
        </div>
        <div className="powered-by">Software powered by <a href="https://www.ithots.co.in" target="_blank" rel="noopener noreferrer">www.ithots.co.in</a></div>
        {showUserSetup && <UserSetup onClose={() => setShowUserSetup(false)} />}
        {showUserGroups && <UserGroups onClose={() => setShowUserGroups(false)} />}
        {showUserManagement && <UserManagement onClose={() => setShowUserManagement(false)} />}
      </div>
    </div>
  );
}

export default Dashboard;
