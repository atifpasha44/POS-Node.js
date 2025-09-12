import React, { useState } from 'react';
import './ProfileModal.css'; // Reuse modal styles
import logo from './logo.png';
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
  const [showProfile, setShowProfile] = useState(false);
  // Remove dashboardData and dashboard cards from main dashboard
  // Only show company info in the modal when button is clicked
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [companyInfoLoading, setCompanyInfoLoading] = useState(false);
  const [companyInfoError, setCompanyInfoError] = useState('');
  const handleCompanyInfo = async () => {
    setShowCompanyInfo(true);
    setCompanyInfoLoading(true);
    setCompanyInfoError('');
    try {
      const res = await fetch('http://localhost:5000/api/company-info');
      const data = await res.json();
      if (data.success) {
        setCompanyInfo(data.companyInfo);
      } else {
        setCompanyInfoError(data.message || 'Failed to load company info.');
      }
    } catch (err) {
      setCompanyInfoError('Failed to load company info.');
    }
    setCompanyInfoLoading(false);
  };

  const handleCompanyInfoClose = () => {
    setShowCompanyInfo(false);
    setCompanyInfo(null);
    setCompanyInfoError('');
  };
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [expanded, setExpanded] = useState({});
  const [showUserSetup, setShowUserSetup] = useState(false);
  const [showUserGroups, setShowUserGroups] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

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

  const handleEditPassword = () => {
    setEditingPassword(true);
    setNewPassword('');
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleSavePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    try {
      // Call backend API to update password
      const res = await fetch('http://localhost:5000/api/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email, password: newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setPasswordSuccess('Password updated. Please log in again.');
        setTimeout(() => handleLogout(), 1500);
      } else {
        setPasswordError(data.message || 'Failed to update password.');
      }
    } catch (err) {
      setPasswordError('Failed to update password.');
    }
  };

  if (showProfile) {
    return (
      <div className="dashboard-container">
        <div className="main-content" style={{ width: '100%' }}>
          <div>
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
              {/* Edit Password Section */}
              {editingPassword ? (
                <div style={{ marginTop: '18px' }}>
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc', width: '100%', marginBottom: '8px' }}
                  />
                  <button onClick={handleSavePassword} style={{ padding: '8px 18px', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', background: '#1976d2', color: '#fff', marginRight: '10px' }}>Save Password</button>
                  <button onClick={() => setEditingPassword(false)} style={{ padding: '8px 18px', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', background: '#888', color: '#fff' }}>Cancel</button>
                  {passwordError && <div style={{ color: '#e53935', marginTop: '8px' }}>{passwordError}</div>}
                  {passwordSuccess && <div style={{ color: 'green', marginTop: '8px' }}>{passwordSuccess}</div>}
                </div>
              ) : (
                <button onClick={handleEditPassword} style={{ padding: '8px 18px', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', background: '#1976d2', color: '#fff', marginTop: '18px', marginRight: '10px' }}>Edit Password</button>
              )}
              {/* Logout Button */}
              <button onClick={handleLogout} style={{ padding: '8px 18px', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', background: '#e53935', color: '#fff', marginTop: '18px', marginLeft: '10px' }}>Logout</button>
              <button onClick={handleProfileClose} style={{ padding: '8px 18px', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', background: '#888', color: '#fff', marginTop: '20px', marginLeft: '10px' }}>Back to Dashboard</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showCompanyInfo && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ minWidth: 600 }}>
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <img src={logo} alt="Company Logo" style={{ width: 120, marginBottom: 10 }} />
              <div style={{ fontWeight: 'bold', color: '#1976d2', fontSize: '1.1em', marginBottom: 4 }}>
                ithots POS Version : {companyInfo?.pos_version || '-'}
              </div>
              <div style={{ color: '#333', fontSize: '1em', marginBottom: 10 }}>
                Annual Software Subscription will expire on {companyInfo?.subscription_expiry || '-'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 30, justifyContent: 'center', marginBottom: 10 }}>
              {/* Legal Info Table */}
              <table style={{ borderCollapse: 'collapse', minWidth: 260 }}>
                <thead>
                  <tr><th colSpan={2} style={{ background: '#e3eefd', color: '#1976d2', textAlign: 'left', padding: 6, fontWeight: 'bold', border: '1px solid #bcd' }}>Legal Info</th></tr>
                </thead>
                <tbody>
                  <tr><td style={{ border: '1px solid #bcd', padding: 6 }}>Licensed Name</td><td style={{ border: '1px solid #bcd', padding: 6 }}>{companyInfo?.licensed_name || '-'}</td></tr>
                  <tr><td style={{ border: '1px solid #bcd', padding: 6 }}>Legal Owner</td><td style={{ border: '1px solid #bcd', padding: 6 }}>{companyInfo?.legal_owner || '-'}</td></tr>
                  <tr><td style={{ border: '1px solid #bcd', padding: 6 }}>Address</td><td style={{ border: '1px solid #bcd', padding: 6 }}>{companyInfo?.address || '-'}</td></tr>
                  <tr><td style={{ border: '1px solid #bcd', padding: 6 }}>City</td><td style={{ border: '1px solid #bcd', padding: 6 }}>{companyInfo?.city || '-'}</td></tr>
                  <tr><td style={{ border: '1px solid #bcd', padding: 6 }}>Subscription Start Date</td><td style={{ border: '1px solid #bcd', padding: 6 }}>{companyInfo?.subscription_start || '-'}</td></tr>
                  <tr><td style={{ border: '1px solid #bcd', padding: 6 }}>Subscription End Date</td><td style={{ border: '1px solid #bcd', padding: 6 }}>{companyInfo?.subscription_end || '-'}</td></tr>
                </tbody>
              </table>
              {/* System Info Table */}
              <table style={{ borderCollapse: 'collapse', minWidth: 220 }}>
                <thead>
                  <tr><th colSpan={2} style={{ background: '#e3eefd', color: '#1976d2', textAlign: 'left', padding: 6, fontWeight: 'bold', border: '1px solid #bcd' }}>System Info</th></tr>
                </thead>
                <tbody>
                  <tr><td style={{ border: '1px solid #bcd', padding: 6 }}>Property code</td><td style={{ border: '1px solid #bcd', padding: 6 }}>{companyInfo?.property_code || '-'}</td></tr>
                  <tr><td style={{ border: '1px solid #bcd', padding: 6 }}>Database Name</td><td style={{ border: '1px solid #bcd', padding: 6 }}>{companyInfo?.db_name || '-'}</td></tr>
                  <tr><td style={{ border: '1px solid #bcd', padding: 6 }}>No Of Outlets</td><td style={{ border: '1px solid #bcd', padding: 6 }}>{companyInfo?.no_of_outlets || '-'}</td></tr>
                </tbody>
              </table>
            </div>
            {companyInfoLoading ? (
              <div>Loading...</div>
            ) : companyInfoError ? (
              <div style={{ color: '#e53935' }}>{companyInfoError}</div>
            ) : null}
            <div className="modal-actions">
              <button className="close-btn" onClick={handleCompanyInfoClose}>Close</button>
            </div>
          </div>
        </div>
      )}
      <div className="dashboard-container">
        <div className="sidebar sidebar-gradient">
          <img src={logo} alt="POS Logo" className="sidebar-logo-img" />
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
          <header className="dashboard-header dashboard-header-gradient">
            <h1>Welcome to ithots POS</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <button onClick={handleCompanyInfo} style={{ padding: '8px 18px', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', background: '#2193b0', color: '#fff', marginRight: '10px' }}>Company Info</button>
              <div className="profile" onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
                <div className="profile-img" />
                <span className="profile-name">{currentUser.name}</span>
              </div>
            </div>
          </header>
          {/* Info cards removed. Dashboard is now empty until Company Info is clicked. */}
          <div className="powered-by">Software powered by <a href="https://www.ithots.co.in" target="_blank" rel="noopener noreferrer">www.ithots.co.in</a></div>
          {showUserSetup && <UserSetup onClose={() => setShowUserSetup(false)} />}
          {showUserGroups && <UserGroups onClose={() => setShowUserGroups(false)} />}
          {showUserManagement && <UserManagement onClose={() => setShowUserManagement(false)} />}
        </div>
      </div>
    </>
  );
}

export default Dashboard;