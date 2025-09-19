import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import infoLogo from './info-logo-new.png';
import propertyLogo from './hotel-abc-logo.png';
import DashboardSummaryPanel from './DashboardSummaryPanel';
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
  // Track dirty state from child modules
  const [childDirty, setChildDirty] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
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
  <div style={{display:'flex',justifyContent:'center',gap:'18px',margin:'12px 0 12px 0',background:'transparent',marginLeft:'220px'}}>
          <button className={`dashboard-tab${activeTab==='compinfo' ? ' active' : ''}`} onClick={handleCompInfoClick} style={{background:'#ffb300',color:'#fff',fontWeight:'bold',border:'none',borderRadius:'10px',padding:'8px 18px',fontSize:'1rem',boxShadow:'0 2px 8px rgba(0,0,0,0.10)',cursor:'pointer',transition:'all 0.2s',minWidth:'110px',letterSpacing:'0.5px'}}>
            Comp Info
          </button>
          <button className={`dashboard-tab${activeTab==='dashboard' ? ' active' : ''}`} onClick={()=>setActiveTab('dashboard')} style={{background:'#ffb300',color:'#fff',fontWeight:'bold',border:'none',borderRadius:'10px',padding:'8px 18px',fontSize:'1rem',boxShadow:'0 2px 8px rgba(0,0,0,0.10)',cursor:'pointer',transition:'all 0.2s',minWidth:'110px',letterSpacing:'0.5px'}}>
            Dashboard
          </button>
               <button className={`dashboard-tab${activeTab==='pending' ? ' active' : ''}`} onClick={()=>{ setActiveTab('pending'); setShowCompanyInfo(false); }} style={{background:'#ffb300',color:'#fff',fontWeight:'bold',border:'none',borderRadius:'10px',padding:'8px 18px',fontSize:'1rem',boxShadow:'0 2px 8px rgba(0,0,0,0.10)',cursor:'pointer',transition:'all 0.2s',minWidth:'110px',letterSpacing:'0.5px'}}>
            Pending Status
          </button>
          <button className={`dashboard-tab${activeTab==='table' ? ' active' : ''}`} onClick={()=>setActiveTab('table')} style={{background:'#ffb300',color:'#fff',fontWeight:'bold',border:'none',borderRadius:'10px',padding:'8px 18px',fontSize:'1rem',boxShadow:'0 2px 8px rgba(0,0,0,0.10)',cursor:'pointer',transition:'all 0.2s',minWidth:'110px',letterSpacing:'0.5px'}}>
            Sale Info
          </button>
          <button className={`dashboard-tab${activeTab==='account' ? ' active' : ''}`} onClick={()=>setActiveTab('account')} style={{background:'#ffb300',color:'#fff',fontWeight:'bold',border:'none',borderRadius:'10px',padding:'8px 18px',fontSize:'1rem',boxShadow:'0 2px 8px rgba(0,0,0,0.10)',cursor:'pointer',transition:'all 0.2s',minWidth:'110px',letterSpacing:'0.5px'}}>
            Account Setting
          </button>
        </div>
      </div>
      <div style={{display:'flex',height:'calc(100vh - 120px)'}}>
        {/* Sidebar vertical panel always visible */}
        <div style={{width:'300px',background:'#fff',borderRight:'2px solid #ffa726',padding:'8px 0',overflowY:'auto'}}>
    <SidebarMenu menuItems={menuItems} onSubmenuClick={sub => {
      if (childDirty) {
        if (!window.confirm('You have unsaved changes. If you proceed, your data will not be saved. Continue?')) return;
      }
      setActiveSubmenu(sub);
      setChildDirty(false);
    }} />
        </div>
        {/* Main content area */}
        <main className="dashboard-content" style={{flex:1}}>
          {activeSubmenu === 'Property Setup' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./PropertyCode').default, { setParentDirty: setChildDirty })}
            </React.Suspense>
          ) : activeSubmenu === 'Outlet Setup' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./OutletSetup').default, { setParentDirty: setChildDirty })}
            </React.Suspense>
          ) : activeTab === 'dashboard' ? (
    <div className="dashboard-summary-panel" style={{display:'flex',flexWrap:'wrap',justifyContent:'center',gap:'32px',marginTop:'16px'}}>
      {/* Today's Collection Summary */}
      <div style={{width:'260px',background:'#fff',border:'2.5px solid #ff9800',borderRadius:'10px',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
        <div style={{background:'#ff9800',color:'#fff',fontWeight:'bold',fontSize:'1.08rem',padding:'7px 0',borderTopLeftRadius:'8px',borderTopRightRadius:'8px',textAlign:'center'}}>Today's Collection Summary</div>
        <div style={{padding:'12px 8px 0 8px',height:'140px',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
          {/* Pie chart placeholder */}
          <svg width="110" height="110" viewBox="0 0 110 110">
            <circle cx="55" cy="55" r="50" fill="#eee" />
            <path d="M55,55 L55,5 A50,50 0 0,1 105,55 Z" fill="#8bc34a" />
            <path d="M55,55 L105,55 A50,50 0 0,1 70,100 Z" fill="#ffd600" />
            <path d="M55,55 L70,100 A50,50 0 0,1 55,5 Z" fill="#f8bbd0" />
          </svg>
          <div style={{position:'absolute',fontSize:'0.95rem',color:'#444',marginLeft:'-110px',marginTop:'70px'}}>
            <div>40% Cash<br />46,200.00</div>
            <div style={{marginTop:'-40px',marginLeft:'80px'}}>28% Credit Card<br />22,000.00</div>
            <div style={{marginTop:'-10px',marginLeft:'40px'}}>32% Company<br />28,000.00</div>
          </div>
        </div>
        <div style={{background:'#b3e5fc',height:'18px',borderBottomLeftRadius:'8px',borderBottomRightRadius:'8px'}}></div>
      </div>
      {/* Meny Type Sale */}
      <div style={{width:'220px',background:'#fff',border:'2.5px solid #ff9800',borderRadius:'10px',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
        <div style={{background:'#ff9800',color:'#fff',fontWeight:'bold',fontSize:'1.08rem',padding:'7px 0',borderTopLeftRadius:'8px',borderTopRightRadius:'8px',textAlign:'center'}}>Meny Type Sale</div>
        <div style={{padding:'12px 8px 0 8px',height:'110px',display:'flex',alignItems:'flex-end',gap:'8px'}}>
          {/* Bar chart placeholder */}
          <div style={{width:'32px',height:'70px',background:'#8bc34a'}}></div>
          <div style={{width:'32px',height:'90px',background:'#3949ab'}}></div>
          <div style={{width:'32px',height:'60px',background:'#f8bbd0'}}></div>
          <div style={{width:'32px',height:'30px',background:'#ffd600'}}></div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.95rem',color:'#444',padding:'0 8px 8px 8px'}}>
          <span>Food</span><span>Liq</span><span>Soft</span><span>Tob</span>
        </div>
      </div>
      {/* Weekly Collection Summary */}
      <div style={{width:'220px',background:'#fff',border:'2.5px solid #ff9800',borderRadius:'10px',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
        <div style={{background:'#ff9800',color:'#fff',fontWeight:'bold',fontSize:'1.08rem',padding:'7px 0',borderTopLeftRadius:'8px',borderTopRightRadius:'8px',textAlign:'center'}}>Weekly Collection Summary</div>
        <div style={{padding:'12px 8px 0 8px',height:'110px',display:'flex',alignItems:'flex-end',gap:'6px'}}>
          {/* Bar chart placeholder */}
          <div style={{width:'22px',height:'70px',background:'#f8bbd0'}}></div>
          <div style={{width:'22px',height:'60px',background:'#81d4fa'}}></div>
          <div style={{width:'22px',height:'90px',background:'#7e57c2'}}></div>
          <div style={{width:'22px',height:'110px',background:'#9575cd'}}></div>
          <div style={{width:'22px',height:'80px',background:'#ffd600'}}></div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.95rem',color:'#444',padding:'0 8px 8px 8px'}}>
          <span>01/12</span><span>02/12</span><span>03/12</span><span>04/12</span><span>05/12</span>
        </div>
      </div>
      {/* Session Summary */}
      <div style={{width:'220px',background:'#fff',border:'2.5px solid #ff9800',borderRadius:'10px',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
        <div style={{background:'#ff9800',color:'#fff',fontWeight:'bold',fontSize:'1.08rem',padding:'7px 0',borderTopLeftRadius:'8px',borderTopRightRadius:'8px',textAlign:'center'}}>Session Summary</div>
        <div style={{padding:'12px 8px 0 8px',height:'110px',display:'flex',alignItems:'flex-end',gap:'8px'}}>
          {/* Bar chart placeholder */}
          <div style={{width:'38px',height:'60px',background:'#ffd600'}}></div>
          <div style={{width:'38px',height:'90px',background:'#8bc34a'}}></div>
          <div style={{width:'38px',height:'80px',background:'#fff',border:'1.5px solid #ddd'}}></div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.95rem',color:'#444',padding:'0 8px 8px 8px'}}>
          <span>BF</span><span>Lunch</span><span>Dinner</span>
        </div>
      </div>
    </div>
  ) : activeTab === 'pending' ? (
    <div className="pending-panel-wrapper" style={{display:'flex',justifyContent:'center',alignItems:'flex-start',height:'100%',gap:'24px',marginTop:'40px'}}>
      {/* Pending KOT's */}
      <div style={{width:'360px',height:'340px',background:'#fff',border:'2.5px solid #ffa726',borderRadius:'10px',boxShadow:'0 2px 8px rgba(0,0,0,0.10)',display:'flex',flexDirection:'column'}}>
        <div style={{background:'#ffa726',color:'#fff',fontWeight:'bold',fontSize:'1.08rem',padding:'8px 0 8px 12px',borderTopLeftRadius:'10px',borderTopRightRadius:'10px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span>Pending KOT's</span>
          <span style={{marginRight:'12px',fontSize:'1.15rem',color:'#fff'}}>&#x21bb;</span>
        </div>
        <div style={{background:'#1976d2',color:'#fff',fontWeight:'bold',fontSize:'0.98rem',padding:'4px 0 4px 12px',borderTop:'1.5px solid #eee'}}>All Outlets</div>
  <table style={{width:'100%',borderCollapse:'collapse',margin:'0',flex:1}}>
          <thead>
            <tr style={{background:'#e3e3e3',fontWeight:'bold',fontSize:'0.97rem'}}>
              <th style={{border:'1px solid #bbb',padding:'4px'}}>Tbl No</th>
              <th style={{border:'1px solid #bbb',padding:'4px'}}>Meal Period</th>
              <th style={{border:'1px solid #bbb',padding:'4px'}}>KOT NO</th>
              <th style={{border:'1px solid #bbb',padding:'4px'}}>Item Name</th>
              <th style={{border:'1px solid #bbb',padding:'4px'}}>Qty</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_,i)=>(
              <tr key={i} style={{background:i%2?'#f7f7f7':'#fff'}}>
                <td style={{border:'1px solid #bbb',height:'28px'}}></td>
                <td style={{border:'1px solid #bbb'}}></td>
                <td style={{border:'1px solid #bbb'}}></td>
                <td style={{border:'1px solid #bbb'}}></td>
                <td style={{border:'1px solid #bbb'}}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pending Bills */}
  <div style={{width:'360px',height:'340px',background:'#fff',border:'2.5px solid #ffa726',borderRadius:'10px',boxShadow:'0 2px 8px rgba(0,0,0,0.10)',display:'flex',flexDirection:'column'}}>
        <div style={{background:'#ffa726',color:'#fff',fontWeight:'bold',fontSize:'1.08rem',padding:'8px 0 8px 12px',borderTopLeftRadius:'10px',borderTopRightRadius:'10px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span>Pending Bills</span>
          <span style={{marginRight:'12px',fontSize:'1.15rem',color:'#fff'}}>&#x21bb;</span>
        </div>
        <div style={{background:'#1976d2',color:'#fff',fontWeight:'bold',fontSize:'0.98rem',padding:'4px 0 4px 12px',borderTop:'1.5px solid #eee'}}>All Outlets</div>
  <table style={{width:'100%',borderCollapse:'collapse',margin:'0',flex:1}}>
          <thead>
            <tr style={{background:'#e3e3e3',fontWeight:'bold',fontSize:'0.97rem'}}>
              <th style={{border:'1px solid #bbb',padding:'4px'}}>Tbl No</th>
              <th style={{border:'1px solid #bbb',padding:'4px'}}>Meal Period</th>
              <th style={{border:'1px solid #bbb',padding:'4px'}}>BIL NO</th>
              <th style={{border:'1px solid #bbb',padding:'4px'}}>BIL AMT</th>
              <th style={{border:'1px solid #bbb',padding:'4px'}}>USER</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_,i)=>(
              <tr key={i} style={{background:i%2?'#f7f7f7':'#fff'}}>
                <td style={{border:'1px solid #bbb',height:'28px'}}></td>
                <td style={{border:'1px solid #bbb'}}></td>
                <td style={{border:'1px solid #bbb'}}></td>
                <td style={{border:'1px solid #bbb'}}></td>
                <td style={{border:'1px solid #bbb'}}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Table Status */}
  <div style={{width:'360px',height:'340px',background:'#fff',border:'2.5px solid #ffa726',borderRadius:'10px',boxShadow:'0 2px 8px rgba(0,0,0,0.10)',display:'flex',flexDirection:'column'}}>
        <div style={{background:'#ffa726',color:'#fff',fontWeight:'bold',fontSize:'1.08rem',padding:'8px 0 8px 12px',borderTopLeftRadius:'10px',borderTopRightRadius:'10px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span>Table Status</span>
          <span style={{marginRight:'12px',fontSize:'1.15rem',color:'#fff'}}>&#x21bb;</span>
        </div>
  <div style={{height:'260px',padding:'12px'}}></div>
      </div>
    </div>
  ) : activeTab === 'table' ? (
    <div className="saleinfo-panel-wrapper">
    <div className="saleinfo-panel" style={{display:'flex',gap:'18px',justifyContent:'center',marginTop:'24px'}}>
      {/* Total Sales */}
      <div style={{width:'320px',background:'#fff',border:'2px solid #ff9800',borderRadius:'7px',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
        <div style={{background:'#ff9800',color:'#fff',fontWeight:'bold',fontSize:'1.08rem',padding:'7px 0 7px 12px',borderTopLeftRadius:'7px',borderTopRightRadius:'7px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span>Total Sales</span>
          <span style={{marginRight:'8px',fontSize:'1.15rem',color:'#fff'}}>&#x21bb;</span>
        </div>
        <div style={{background:'#1976d2',color:'#fff',fontWeight:'bold',fontSize:'0.98rem',padding:'4px 0 4px 12px',borderTop:'1.5px solid #eee'}}>All Outlets</div>
        <table style={{width:'100%',borderCollapse:'collapse',margin:'0'}}>
          <tbody>
            <tr style={{background:'#e3e3e3',fontWeight:'bold',fontSize:'0.97rem'}}><td style={{border:'1px solid #bbb',padding:'4px'}}>Grand Total</td><td style={{border:'1px solid #bbb',padding:'4px'}}>₹</td><td style={{border:'1px solid #bbb',padding:'4px'}}>3,254.00</td></tr>
            <tr><td style={{border:'1px solid #bbb',padding:'4px'}}>Sales Total</td><td style={{border:'1px solid #bbb',padding:'4px'}}>₹</td><td style={{border:'1px solid #bbb',padding:'4px'}}>3,385.00</td></tr>
            <tr><td style={{border:'1px solid #bbb',padding:'4px'}}>Round Total</td><td style={{border:'1px solid #bbb',padding:'4px'}}>₹</td><td style={{border:'1px solid #bbb',padding:'4px'}}>-</td></tr>
            <tr><td style={{border:'1px solid #bbb',padding:'4px'}}>CGST</td><td style={{border:'1px solid #bbb',padding:'4px'}}>₹</td><td style={{border:'1px solid #bbb',padding:'4px'}}>332.02</td></tr>
            <tr><td style={{border:'1px solid #bbb',padding:'4px'}}>SGST</td><td style={{border:'1px solid #bbb',padding:'4px'}}>₹</td><td style={{border:'1px solid #bbb',padding:'4px'}}>265.62</td></tr>
            <tr><td style={{border:'1px solid #bbb',padding:'4px'}}>Discount Total</td><td style={{border:'1px solid #bbb',padding:'4px'}}>₹</td><td style={{border:'1px solid #bbb',padding:'4px'}}>-131.00</td></tr>
            <tr><td style={{border:'1px solid #bbb',padding:'4px'}}>Void Item Total</td><td style={{border:'1px solid #bbb',padding:'4px'}}>₹</td><td style={{border:'1px solid #bbb',padding:'4px'}}>-</td></tr>
            <tr><td style={{border:'1px solid #bbb',padding:'4px'}}>Cash</td><td style={{border:'1px solid #bbb',padding:'4px'}}>₹</td><td style={{border:'1px solid #bbb',padding:'4px'}}>3,104.00</td></tr>
            <tr><td style={{border:'1px solid #bbb',padding:'4px'}}>Visa</td><td style={{border:'1px solid #bbb',padding:'4px'}}>₹</td><td style={{border:'1px solid #bbb',padding:'4px'}}>150.00</td></tr>
            <tr style={{background:'#b3e5fc',fontWeight:'bold'}}><td style={{border:'1px solid #bbb',padding:'4px'}}>Grand Total:</td><td style={{border:'1px solid #bbb',padding:'4px'}}>₹</td><td style={{border:'1px solid #bbb',padding:'4px'}}>3,254.00</td></tr>
          </tbody>
        </table>
      </div>
      {/* Total Pax */}
      <div style={{width:'320px',background:'#fff',border:'2px solid #ff9800',borderRadius:'7px',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
        <div style={{background:'#ff9800',color:'#fff',fontWeight:'bold',fontSize:'1.08rem',padding:'7px 0 7px 12px',borderTopLeftRadius:'7px',borderTopRightRadius:'7px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span>Total Pax</span>
          <span style={{marginRight:'8px',fontSize:'1.15rem',color:'#fff'}}>&#x21bb;</span>
        </div>
        <div style={{background:'#1976d2',color:'#fff',fontWeight:'bold',fontSize:'0.98rem',padding:'4px 0 4px 12px',borderTop:'1.5px solid #eee'}}>All Outlets</div>
        <table style={{width:'100%',borderCollapse:'collapse',margin:'0',marginTop:'12px'}}>
          <tbody>
            <tr><td style={{border:'1px solid #bbb',padding:'4px'}}>No. of Checks</td><td style={{border:'1px solid #bbb',padding:'4px'}}>8</td></tr>
            <tr><td style={{border:'1px solid #bbb',padding:'4px'}}>No. of Guests</td><td style={{border:'1px solid #bbb',padding:'4px'}}>24</td></tr>
            <tr><td style={{border:'1px solid #bbb',padding:'4px'}}>Sales/Check</td><td style={{border:'1px solid #bbb',padding:'4px'}}>406.75</td></tr>
            <tr><td style={{border:'1px solid #bbb',padding:'4px'}}>Sales/Guest</td><td style={{border:'1px solid #bbb',padding:'4px'}}>135.58</td></tr>
          </tbody>
        </table>
      </div>
      {/* Session Sales */}
      <div style={{width:'320px',background:'#fff',border:'2px solid #ff9800',borderRadius:'7px',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
        <div style={{background:'#ff9800',color:'#fff',fontWeight:'bold',fontSize:'1.08rem',padding:'7px 0 7px 12px',borderTopLeftRadius:'7px',borderTopRightRadius:'7px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span>Session Sales</span>
          <span style={{marginRight:'8px',fontSize:'1.15rem',color:'#fff'}}>&#x21bb;</span>
        </div>
        <div style={{background:'#1976d2',color:'#fff',fontWeight:'bold',fontSize:'0.98rem',padding:'4px 0 4px 12px',borderTop:'1.5px solid #eee'}}>All Outlets</div>
        <table style={{width:'100%',borderCollapse:'collapse',margin:'0',marginTop:'8px'}}>
          <thead>
            <tr style={{background:'#e3e3e3',fontWeight:'bold',fontSize:'0.97rem'}}>
              <th style={{border:'1px solid #bbb',padding:'4px'}}>Meal Period</th>
              <th style={{border:'1px solid #bbb',padding:'4px'}}>Cash</th>
              <th style={{border:'1px solid #bbb',padding:'4px'}}>Visa</th>
              <th style={{border:'1px solid #bbb',padding:'4px'}}>Master</th>
              <th style={{border:'1px solid #bbb',padding:'4px'}}>Amex</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(6)].map((_,i)=>(
              <tr key={i} style={{background:i%2?'#f7f7f7':'#fff'}}>
                <td style={{border:'1px solid #bbb',height:'28px'}}></td>
                <td style={{border:'1px solid #bbb'}}></td>
                <td style={{border:'1px solid #bbb'}}></td>
                <td style={{border:'1px solid #bbb'}}></td>
                <td style={{border:'1px solid #bbb'}}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  ) : activeTab === 'account' ? (
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
          ) : showCompanyInfo ? (
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
          ) : null}
        </main>
      </div>
    </div>
  );
}
export default Dashboard;