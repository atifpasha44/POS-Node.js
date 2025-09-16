
import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import infoLogo from './info-logo-new.png';
import propertyLogo from './hotel-abc-logo.png';
import SidebarMenu from './SidebarMenu';
const menuItems = [
  {
    icon: '🏨',
    label: 'Property Management',
    submenu: [
      'Property Setup',
      'Reason Codes',
      'Unit Of Measurement',
      'Tax codes',
      'Tax Structure',
      'Credit Card Manager'
    ]
  },
  {
    icon: '🏬',
    label: 'Outlet Management',
    submenu: [
      'Outlet Setup',
      'Outlet Business Periods',
      'Table Settings',
      'Pantry Message'
    ]
  },
  {
    icon: '🍽️',
    label: 'Menu Management',
    submenu: [
      'Item Departments',
      'Item Categories',
      'Item Master',
      'Set Menu',
      'Item Sold',
      'Item Stock',
      'Update Menu Rates',
      'Import and Export'
    ]
  },
  {
    icon: '💻',
    label: 'POS System Management',
    submenu: [
      'Payment Types',
      'Discount Types',
      'Print Formats'
    ]
  },
  {
    icon: '🖨️',
    label: 'Printing Management',
    submenu: [
      'Print Devices'
    ]
  },
  {
    icon: '📊',
    label: 'Report  Management',
    submenu: [
      'Dashboard',
      'Auto Reports setting'
    ]
  },
  {
    icon: '👤',
    label: 'User Management',
    submenu: [
      'User Departments',
      'User Designations',
      'User Setup',
      'User Groups'
    ]
  },
  {
    icon: '📅',
    label: 'End Of Day'
  },
  {
    icon: '🖥️',
    label: 'POS System'
  }
];
function Dashboard({ user, setUser }) {
  const hotelName = 'ABC Hotel';
  const [showCompanyInfo, setShowCompanyInfo] = useState(true); // Show Comp Info by default
  const [companyInfo, setCompanyInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('compinfo');
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [companyError, setCompanyError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Load company info immediately on mount
    const fetchCompanyInfo = async () => {
      setLoadingCompany(true);
      setCompanyError('');
      try {
        const res = await axios.get('/api/company-info');
        if (res.data.success) {
          setCompanyInfo(res.data);
        } else {
          setCompanyError(res.data.message || 'No company info found');
        }
      } catch (err) {
        setCompanyError('Failed to load company info');
      }
      setLoadingCompany(false);
    };
    fetchCompanyInfo();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    localStorage.removeItem('user');
    if (setUser) setUser(null);
    navigate('/login');
  };

  const handleCompInfoClick = async () => {
    setActiveTab('compinfo');
    setShowCompanyInfo(true);
    setLoadingCompany(true);
    setCompanyError('');
    try {
      const res = await axios.get('/api/company-info');
      if (res.data.success) {
        setCompanyInfo(res.data);
      } else {
        setCompanyError(res.data.message || 'No company info found');
      }
    } catch (err) {
      setCompanyError('Failed to load company info');
    }
    setLoadingCompany(false);
  };

  const closeCompanyInfo = () => {
    setShowCompanyInfo(false);
    setCompanyInfo(null);
    setCompanyError('');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-topbar">
        <img src={infoLogo} alt="Info Logo" className="dashboard-logo" />
        <span className="dashboard-title">ithots G5 Restaurant Edition</span>
        <span className="dashboard-hotel">{hotelName}</span>
        <div style={{display:'flex',alignItems:'center',marginLeft:'auto'}}>
          <span className="dashboard-admin">{
            (user?.name && user.name.trim()) ? user.name.trim() :
            (user?.email && user.email.trim()) ? user.email.trim() :
            (user?.role && user.role.trim()) ? user.role.trim() :
            'Admin'
          }</span>
          <button onClick={handleLogout} className="dashboard-logout-btn">Logout</button>
        </div>
      </div>
      {/* Sub Menu Bar - styled to match screenshot */}
      <div className="dashboard-submenu-bar" style={{background:'#fff',borderBottom:'2px solid #ffa726',padding:'0 0 0 0',display:'flex',alignItems:'center',height:'56px'}}>
        <span style={{color:'#1a2dc5',fontWeight:'bold',fontSize:'1.15rem',marginLeft:'32px',letterSpacing:'0.5px',whiteSpace:'nowrap'}}>Welcome to Ithots POS</span>
        <div style={{display:'flex',gap:'8px',marginLeft:'auto',marginRight:'calc(50vw - 320px)',background:'#fff8e1',padding:'4px 0'}}>
          <button className={`dashboard-tab${activeTab==='compinfo' ? ' active' : ''}`} onClick={handleCompInfoClick} style={{background:'#ffb300',color:'#fff',fontWeight:'500',border:'none',borderRadius:'5px',padding:'5px 14px',fontSize:'0.98rem',boxShadow:'0 1px 4px rgba(0,0,0,0.03)',cursor:'pointer',transition:'all 0.2s'}}>
            Comp Info
          </button>
          <button className={`dashboard-tab${activeTab==='dashboard' ? ' active' : ''}`} onClick={()=>setActiveTab('dashboard')} style={{background:'#ffb300',color:'#fff',fontWeight:'500',border:'none',borderRadius:'5px',padding:'5px 14px',fontSize:'0.98rem',boxShadow:'0 1px 4px rgba(0,0,0,0.03)',cursor:'pointer',transition:'all 0.2s'}}>
            Dashboard
          </button>
          <button className={`dashboard-tab${activeTab==='pending' ? ' active' : ''}`} onClick={()=>setActiveTab('pending')} style={{background:'#ffb300',color:'#fff',fontWeight:'500',border:'none',borderRadius:'5px',padding:'5px 14px',fontSize:'0.98rem',boxShadow:'0 1px 4px rgba(0,0,0,0.03)',cursor:'pointer',transition:'all 0.2s'}}>
            Pending Status
          </button>
          <button className={`dashboard-tab${activeTab==='table' ? ' active' : ''}`} onClick={()=>setActiveTab('table')} style={{background:'#ffb300',color:'#fff',fontWeight:'500',border:'none',borderRadius:'5px',padding:'5px 14px',fontSize:'0.98rem',boxShadow:'0 1px 4px rgba(0,0,0,0.03)',cursor:'pointer',transition:'all 0.2s'}}>
            Table Info
          </button>
          <button className={`dashboard-tab${activeTab==='account' ? ' active' : ''}`} onClick={()=>setActiveTab('account')} style={{background:'#ffb300',color:'#fff',fontWeight:'500',border:'none',borderRadius:'5px',padding:'5px 14px',fontSize:'0.98rem',boxShadow:'0 1px 4px rgba(0,0,0,0.03)',cursor:'pointer',transition:'all 0.2s'}}>
            Account Setting
          </button>
        </div>
      </div>
      <div style={{display:'flex',height:'calc(100vh - 120px)'}}>
        {/* Sidebar vertical panel always visible */}
        <div style={{width:'300px',background:'#fff',borderRight:'2px solid #ffa726',padding:'8px 0',overflowY:'auto'}}>
          <SidebarMenu menuItems={menuItems} />
        </div>
        {/* Main content area */}
        <main className="dashboard-content" style={{flex:1}}>
          {/* Tabs are now in the sub menu bar above */}
          {activeTab === 'account' ? (
            <div className="compinfo-center-panel">
              <div className="compinfo-card" style={{maxWidth:'420px',margin:'0 auto',border:'3px solid #ff9800',padding:'0'}}>
                <div style={{background:'#ff9800',color:'#fff',fontWeight:'bold',fontSize:'1.25rem',padding:'10px 18px',borderTopLeftRadius:'28px',borderTopRightRadius:'28px'}}>Account Setting</div>
                <div style={{padding:'18px 18px 10px 18px'}}>
                  <div style={{fontWeight:'500',color:'#888',fontSize:'1.05rem',marginBottom:'8px'}}>CHANGE PASSWORD</div>
                  <hr style={{margin:'0 0 18px 0',border:'none',borderTop:'1.5px solid #eee'}} />
                  <form className="account-setting-form" style={{display:'grid',gridTemplateColumns:'1fr 1.2fr',gap:'12px 18px',alignItems:'center'}}>
                    <label style={{fontWeight:'bold',color:'#444',fontSize:'1.08rem',textAlign:'right'}}>Current password</label>
                    <input type="password" className="account-setting-input" style={{height:'36px',borderRadius:'5px',border:'1.5px solid #ddd',padding:'0 10px',fontSize:'1.05rem'}} />
                    <label style={{fontWeight:'bold',color:'#444',fontSize:'1.08rem',textAlign:'right'}}>New password</label>
                    <input type="password" className="account-setting-input" style={{height:'36px',borderRadius:'5px',border:'1.5px solid #ddd',padding:'0 10px',fontSize:'1.05rem'}} />
                    <label style={{fontWeight:'bold',color:'#444',fontSize:'1.08rem',textAlign:'right'}}>Verify password</label>
                    <input type="password" className="account-setting-input" style={{height:'36px',borderRadius:'5px',border:'1.5px solid #ddd',padding:'0 10px',fontSize:'1.05rem'}} />
                    <div></div>
                    <button type="submit" className="account-setting-btn" style={{background:'#81d4fa',color:'#fff',fontWeight:'bold',fontSize:'1.15rem',border:'none',borderRadius:'5px',height:'38px',marginTop:'8px'}}>Conform</button>
                  </form>
                </div>
              </div>
            </div>
          ) : showCompanyInfo && (
            <div className="compinfo-center-panel">
              <div className="compinfo-card">
                <div className="compinfo-logo-row">
                  <img src={propertyLogo} alt="Property Logo" className="compinfo-logo" />
                </div>
                <div className="compinfo-title">ithots POS Version : {companyInfo?.pos_version || '1.1.0'}</div>
                <div className="compinfo-expiry">Annual Software Subscription will Expire on {companyInfo?.subscription_expiry || companyInfo?.subscription_end || '2026-03-31'}</div>
                <div className="compinfo-info-row">
                  <div className="compinfo-table">
                    <div className="compinfo-table-header">Legal Info <span className="compinfo-eye">&#128065;</span></div>
                    <table>
                      <tbody>
                        <tr><td>Licensed Name</td><td>{companyInfo?.licensed_name || ''}</td></tr>
                        <tr><td>Legal Owner</td><td>{companyInfo?.legal_owner || ''}</td></tr>
                        <tr><td>Address</td><td>{companyInfo?.address || ''}</td></tr>
                        <tr><td>City</td><td>{companyInfo?.city || ''}</td></tr>
                        <tr><td>Subscription Start Date</td><td>{companyInfo?.subscription_start || ''}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="compinfo-table">
                    <div className="compinfo-table-header">System Info <span className="compinfo-eye">&#128065;</span></div>
                    <table>
                      <tbody>
                        <tr><td>Property Code</td><td>{companyInfo?.property_code || ''}</td></tr>
                        <tr><td>No Outlets</td><td>{companyInfo?.no_of_outlets || ''}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
export default Dashboard;