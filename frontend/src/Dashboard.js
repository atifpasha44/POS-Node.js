
import React, { useState } from 'react';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import infoLogo from './info-logo.svg';
import logo from './logo.png';
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
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('compinfo');
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [companyError, setCompanyError] = useState('');
  const navigate = useNavigate();

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
      <div className="dashboard-main">
        <aside className="dashboard-sidebar">
          <div className="sidebar-welcome">Welcome to Ithots POS</div>
          <SidebarMenu menuItems={menuItems} />
          <div className="sidebar-footer">Copyright 2019, all rights reserved @ ithots.co.in</div>
        </aside>
        <main className="dashboard-content">
          <div className="dashboard-tabs">
            <button className={`dashboard-tab${activeTab==='compinfo' ? ' active' : ''}`} onClick={handleCompInfoClick}>Comp Info</button>
            <button className={`dashboard-tab${activeTab==='dashboard' ? ' active' : ''}`} onClick={()=>setActiveTab('dashboard')}>Dashboard</button>
            <button className={`dashboard-tab${activeTab==='pending' ? ' active' : ''}`} onClick={()=>setActiveTab('pending')}>Pending Status</button>
            <button className={`dashboard-tab${activeTab==='table' ? ' active' : ''}`} onClick={()=>setActiveTab('table')}>Table Info</button>
            <button className={`dashboard-tab${activeTab==='account' ? ' active' : ''}`} onClick={()=>setActiveTab('account')}>Account Setting</button>
          </div>
          <div className="dashboard-welcome-card">
            <img src={logo} alt="Hotel Logo" className="dashboard-hotel-logo" />
            <div className="dashboard-welcome-info">
              <h2>{user?.name || 'HOTEL ABC'}</h2>
              <p>Version Number : 1.2.39.0</p>
              <p>Your annual software subscription will expire on 2021-03-31</p>
            </div>
          </div>
          {showCompanyInfo && (
            <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
              <div style={{background:'#fff',padding:32,borderRadius:12,minWidth:350,boxShadow:'0 0 20px rgba(0,0,0,0.2)',maxWidth:500}}>
                <h2>Company Info</h2>
                {loadingCompany && <div>Loading...</div>}
                {companyError && <div style={{color:'red'}}>{companyError}</div>}
                {companyInfo && (
                  <div style={{marginTop:12}}>
                    <div><b>Licensed Name:</b> {companyInfo.licensed_name}</div>
                    <div><b>Legal Owner:</b> {companyInfo.legal_owner}</div>
                    <div><b>Address:</b> {companyInfo.address}</div>
                    <div><b>City:</b> {companyInfo.city}</div>
                    <div><b>Subscription Start:</b> {companyInfo.subscription_start}</div>
                    <div><b>Subscription End:</b> {companyInfo.subscription_end}</div>
                    <div><b>Property Code:</b> {companyInfo.property_code}</div>
                    <div><b>DB Name:</b> {companyInfo.db_name}</div>
                    <div><b>No. of Outlets:</b> {companyInfo.no_of_outlets}</div>
                    <div><b>TIN:</b> {companyInfo.tin}</div>
                    <div><b>GSTIN:</b> {companyInfo.gstin}</div>
                    <div><b>Phone:</b> {companyInfo.phone}</div>
                    <div><b>Email:</b> {companyInfo.email}</div>
                    <div><b>POS Version:</b> {companyInfo.pos_version}</div>
                    <div><b>Subscription Expiry:</b> {companyInfo.subscription_expiry}</div>
                  </div>
                )}
                <button onClick={closeCompanyInfo} style={{marginTop:18,padding:'8px 18px',border:'none',borderRadius:5,background:'#1976d2',color:'#fff',fontWeight:'bold',cursor:'pointer'}}>Close</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
export default Dashboard;
