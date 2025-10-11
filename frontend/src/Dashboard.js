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
  const [activeMainMenu, setActiveMainMenu] = useState(null); // Track active main menu for highlight
  const hotelName = 'ABC Hotel';
  const [showCompanyInfo, setShowCompanyInfo] = useState(true); // Show Comp Info by default
  const [companyInfo, setCompanyInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('compinfo');
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [companyError, setCompanyError] = useState('');
  const [propertyRecords, setPropertyRecords] = useState([]); // Persist PropertyCode records
  const [itemDepartmentRecords, setItemDepartmentRecords] = useState([]); // Persist ItemDepartments records
  const [itemCategoryRecords, setItemCategoryRecords] = useState([]); // Persist ItemCategories records
  const [itemSoldRecords, setItemSoldRecords] = useState([]); // Persist ItemSold records
  const [itemStockRecords, setItemStockRecords] = useState([]); // Persist ItemStock records
  const [updateMenuRatesRecords, setUpdateMenuRatesRecords] = useState([]); // Persist UpdateMenuRates records
  const [importExportRecords, setImportExportRecords] = useState([]); // Persist ImportExport records
  const [paymentTypesRecords, setPaymentTypesRecords] = useState([]); // Persist PaymentTypes records
  const [discountTypeRecords, setDiscountTypeRecords] = useState([]); // Persist DiscountType records
  const [printFormatsRecords, setPrintFormatsRecords] = useState([]); // Persist PrintFormats records
  const [tableSettingsRecords, setTableSettingsRecords] = useState([]); // Persist TableSettings records
  const [outletRecords, setOutletRecords] = useState([]); // Persist Outlet records
  const [userDepartmentsRecords, setUserDepartmentsRecords] = useState([]); // Persist UserDepartments records
  const [userDesignationsRecords, setUserDesignationsRecords] = useState([]); // Persist UserDesignations records
  const [userGroupsRecords, setUserGroupsRecords] = useState([]); // Persist UserGroups records
  const [userSetupRecords, setUserSetupRecords] = useState([]); // Persist UserSetup records
  const navigate = useNavigate();

  // Flag to track if initial data loading is complete
  const [dataLoaded, setDataLoaded] = useState(false);

  // Helper function to safely parse JSON data from localStorage
  const safeJsonParse = (data, fallback = []) => {
    try {
      if (!data) return fallback;
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
      console.error('Error parsing JSON data:', error);
      return fallback;
    }
  };

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadPersistedData = () => {
      try {
        // Load all form records from localStorage with safe parsing
        const savedPropertyRecords = localStorage.getItem('propertyRecords');
        const savedItemDepartmentRecords = localStorage.getItem('itemDepartmentRecords');
        const savedItemCategoryRecords = localStorage.getItem('itemCategoryRecords');
        const savedItemSoldRecords = localStorage.getItem('itemSoldRecords');
        const savedItemStockRecords = localStorage.getItem('itemStockRecords');
        const savedUpdateMenuRatesRecords = localStorage.getItem('updateMenuRatesRecords');
        const savedImportExportRecords = localStorage.getItem('importExportRecords');
        const savedPaymentTypesRecords = localStorage.getItem('paymentTypesRecords');
        const savedDiscountTypeRecords = localStorage.getItem('discountTypeRecords');
        const savedPrintFormatsRecords = localStorage.getItem('printFormatsRecords');
        const savedTableSettingsRecords = localStorage.getItem('tableSettingsRecords');
        const savedOutletRecords = localStorage.getItem('outletRecords');
        const savedUserDepartmentsRecords = localStorage.getItem('userDepartmentsRecords');
        const savedUserDesignationsRecords = localStorage.getItem('userDesignationsRecords');
        const savedUserGroupsRecords = localStorage.getItem('userGroupsRecords');
        const savedUserSetupRecords = localStorage.getItem('userSetupRecords');

        // Parse and set the data with safe parsing
        const loadedPropertyRecords = safeJsonParse(savedPropertyRecords);
        const loadedItemDepartmentRecords = safeJsonParse(savedItemDepartmentRecords);
        const loadedItemCategoryRecords = safeJsonParse(savedItemCategoryRecords);
        const loadedItemSoldRecords = safeJsonParse(savedItemSoldRecords);
        const loadedItemStockRecords = safeJsonParse(savedItemStockRecords);
        const loadedUpdateMenuRatesRecords = safeJsonParse(savedUpdateMenuRatesRecords);
        const loadedImportExportRecords = safeJsonParse(savedImportExportRecords);
        const loadedPaymentTypesRecords = safeJsonParse(savedPaymentTypesRecords);
        const loadedDiscountTypeRecords = safeJsonParse(savedDiscountTypeRecords);
        const loadedPrintFormatsRecords = safeJsonParse(savedPrintFormatsRecords);
        const loadedTableSettingsRecords = safeJsonParse(savedTableSettingsRecords);
        const loadedOutletRecords = safeJsonParse(savedOutletRecords);
        const loadedUserDepartmentsRecords = safeJsonParse(savedUserDepartmentsRecords);
        const loadedUserDesignationsRecords = safeJsonParse(savedUserDesignationsRecords);
        const loadedUserGroupsRecords = safeJsonParse(savedUserGroupsRecords);
        const loadedUserSetupRecords = safeJsonParse(savedUserSetupRecords);

        // Log loaded data for debugging
        console.log('Loading saved data:');
        console.log('UserDepartments records:', loadedUserDepartmentsRecords.length, 'items');
        console.log('UserDesignations records:', loadedUserDesignationsRecords.length, 'items');
        console.log('UserSetup records:', loadedUserSetupRecords.length, 'items');

        // Set the state
        setPropertyRecords(loadedPropertyRecords);
        setItemDepartmentRecords(loadedItemDepartmentRecords);
        setItemCategoryRecords(loadedItemCategoryRecords);
        setItemSoldRecords(loadedItemSoldRecords);
        setItemStockRecords(loadedItemStockRecords);
        setUpdateMenuRatesRecords(loadedUpdateMenuRatesRecords);
        setImportExportRecords(loadedImportExportRecords);
        setPaymentTypesRecords(loadedPaymentTypesRecords);
        setDiscountTypeRecords(loadedDiscountTypeRecords);
        setPrintFormatsRecords(loadedPrintFormatsRecords);
        setTableSettingsRecords(loadedTableSettingsRecords);
        setOutletRecords(loadedOutletRecords);
        setUserDepartmentsRecords(loadedUserDepartmentsRecords);
        setUserDesignationsRecords(loadedUserDesignationsRecords);
        setUserGroupsRecords(loadedUserGroupsRecords);
        setUserSetupRecords(loadedUserSetupRecords);

        console.log('Data loaded from localStorage successfully');
        setDataLoaded(true); // Mark data as loaded
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
        setDataLoaded(true); // Set flag even on error to allow normal operation
        // If there's a critical error, we could show a notification to the user
      }
    };

    loadPersistedData();
  }, []);

  // Helper function to safely save data to localStorage
  const saveToLocalStorage = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
      // Handle storage quota exceeded or other localStorage errors
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded. Consider implementing data cleanup.');
      }
    }
  };

  // Save data to localStorage whenever records change (only after initial load)
  useEffect(() => {
    if (dataLoaded) {
      saveToLocalStorage('propertyRecords', propertyRecords);
    }
  }, [propertyRecords, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      saveToLocalStorage('itemDepartmentRecords', itemDepartmentRecords);
    }
  }, [itemDepartmentRecords, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      saveToLocalStorage('itemCategoryRecords', itemCategoryRecords);
    }
  }, [itemCategoryRecords, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      saveToLocalStorage('itemSoldRecords', itemSoldRecords);
    }
  }, [itemSoldRecords, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      saveToLocalStorage('itemStockRecords', itemStockRecords);
    }
  }, [itemStockRecords, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      saveToLocalStorage('updateMenuRatesRecords', updateMenuRatesRecords);
    }
  }, [updateMenuRatesRecords, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      saveToLocalStorage('importExportRecords', importExportRecords);
    }
  }, [importExportRecords, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      saveToLocalStorage('paymentTypesRecords', paymentTypesRecords);
    }
  }, [paymentTypesRecords, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      saveToLocalStorage('discountTypeRecords', discountTypeRecords);
    }
  }, [discountTypeRecords, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      saveToLocalStorage('printFormatsRecords', printFormatsRecords);
    }
  }, [printFormatsRecords, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      saveToLocalStorage('tableSettingsRecords', tableSettingsRecords);
    }
  }, [tableSettingsRecords, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      saveToLocalStorage('outletRecords', outletRecords);
    }
  }, [outletRecords, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      saveToLocalStorage('userDepartmentsRecords', userDepartmentsRecords);
      console.log('Saving userDepartmentsRecords to localStorage:', userDepartmentsRecords);
    }
  }, [userDepartmentsRecords, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      saveToLocalStorage('userDesignationsRecords', userDesignationsRecords);
      console.log('Saving userDesignationsRecords to localStorage:', userDesignationsRecords);
    }
  }, [userDesignationsRecords, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      saveToLocalStorage('userGroupsRecords', userGroupsRecords);
      console.log('Saving userGroupsRecords to localStorage:', userGroupsRecords);
    }
  }, [userGroupsRecords, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      saveToLocalStorage('userSetupRecords', userSetupRecords);
      console.log('Saving userSetupRecords to localStorage:', userSetupRecords);
    }
  }, [userSetupRecords, dataLoaded]);

  useEffect(() => {
    // Load default company info on mount
    const fetchCompanyInfo = () => {
      setLoadingCompany(true);
      setCompanyError('');
      // Set default company info for demo purposes
      const defaultCompanyInfo = {
        success: true,
        companyName: 'Hotel ABC',
        address: '123 Business Street',
        phone: '+1 (555) 123-4567',
        email: 'info@hotelabc.com'
      };
      setCompanyInfo(defaultCompanyInfo);
      setLoadingCompany(false);
    };
    fetchCompanyInfo();
  }, []);

  const handleLogout = () => {
    // Only remove user authentication data, keep form records
    localStorage.removeItem('user');
    if (setUser) setUser(null);
    navigate('/login');
  };

  // Optional function to clear all stored data (for admin purposes)
  const clearAllStoredData = () => {
    if (window.confirm('Are you sure you want to clear all stored data? This action cannot be undone.')) {
      localStorage.removeItem('propertyRecords');
      localStorage.removeItem('itemDepartmentRecords');
      localStorage.removeItem('itemCategoryRecords');
      localStorage.removeItem('itemSoldRecords');
      localStorage.removeItem('itemStockRecords');
      localStorage.removeItem('updateMenuRatesRecords');
      localStorage.removeItem('importExportRecords');
      localStorage.removeItem('paymentTypesRecords');
      localStorage.removeItem('discountTypeRecords');
      localStorage.removeItem('printFormatsRecords');
      localStorage.removeItem('tableSettingsRecords');
      localStorage.removeItem('outletRecords');
      localStorage.removeItem('userDepartmentsRecords');
      localStorage.removeItem('userDesignationsRecords');
      localStorage.removeItem('userGroupsRecords');
      localStorage.removeItem('userSetupRecords');
      
      // Reset all state arrays
      setPropertyRecords([]);
      setItemDepartmentRecords([]);
      setItemCategoryRecords([]);
      setItemSoldRecords([]);
      setItemStockRecords([]);
      setUpdateMenuRatesRecords([]);
      setImportExportRecords([]);
      setPaymentTypesRecords([]);
      setDiscountTypeRecords([]);
      setPrintFormatsRecords([]);
      setTableSettingsRecords([]);
      setOutletRecords([]);
      setUserDepartmentsRecords([]);
      setUserDesignationsRecords([]);
      setUserGroupsRecords([]);
      setUserSetupRecords([]);
      
      alert('All stored data has been cleared successfully.');
    }
  };

  // Export all data as JSON for backup purposes
  const exportAllData = () => {
    try {
      const allData = {
        propertyRecords,
        itemDepartmentRecords,
        itemCategoryRecords,
        itemSoldRecords,
        itemStockRecords,
        updateMenuRatesRecords,
        importExportRecords,
        paymentTypesRecords,
        discountTypeRecords,
        printFormatsRecords,
        tableSettingsRecords,
        outletRecords,
        userDepartmentsRecords,
        userDesignationsRecords,
        userGroupsRecords,
        userSetupRecords,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const dataBlob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pos-data-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  // Import data from JSON backup
  const importAllData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Validate data structure
        if (importedData.version && importedData.exportDate) {
          if (window.confirm('This will replace all existing data. Are you sure you want to continue?')) {
            // Import all data
            if (importedData.propertyRecords) setPropertyRecords(importedData.propertyRecords);
            if (importedData.itemDepartmentRecords) setItemDepartmentRecords(importedData.itemDepartmentRecords);
            if (importedData.itemCategoryRecords) setItemCategoryRecords(importedData.itemCategoryRecords);
            if (importedData.itemSoldRecords) setItemSoldRecords(importedData.itemSoldRecords);
            if (importedData.itemStockRecords) setItemStockRecords(importedData.itemStockRecords);
            if (importedData.updateMenuRatesRecords) setUpdateMenuRatesRecords(importedData.updateMenuRatesRecords);
            if (importedData.importExportRecords) setImportExportRecords(importedData.importExportRecords);
            if (importedData.paymentTypesRecords) setPaymentTypesRecords(importedData.paymentTypesRecords);
            if (importedData.discountTypeRecords) setDiscountTypeRecords(importedData.discountTypeRecords);
            if (importedData.printFormatsRecords) setPrintFormatsRecords(importedData.printFormatsRecords);
            if (importedData.tableSettingsRecords) setTableSettingsRecords(importedData.tableSettingsRecords);
            if (importedData.outletRecords) setOutletRecords(importedData.outletRecords);
            if (importedData.userDepartmentsRecords) setUserDepartmentsRecords(importedData.userDepartmentsRecords);
            if (importedData.userDesignationsRecords) setUserDesignationsRecords(importedData.userDesignationsRecords);
            if (importedData.userGroupsRecords) setUserGroupsRecords(importedData.userGroupsRecords);
            if (importedData.userSetupRecords) setUserSetupRecords(importedData.userSetupRecords);

            alert('Data imported successfully!');
          }
        } else {
          alert('Invalid file format. Please select a valid backup file.');
        }
      } catch (error) {
        console.error('Error importing data:', error);
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  // Check localStorage usage (for debugging)
  const checkStorageUsage = () => {
    let totalSize = 0;
    const details = {};
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const size = localStorage[key].length;
        totalSize += size;
        if (key.includes('Records')) {
          details[key] = {
            size: `${(size / 1024).toFixed(2)} KB`,
            records: safeJsonParse(localStorage[key]).length
          };
        }
      }
    }
    console.log(`Total localStorage usage: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log('Records details:', details);
    return { totalSize, details };
  };

  // Debugging function to check current data
  const debugCurrentData = () => {
    console.log('Current data in memory:');
    console.log('UserDepartments:', userDepartmentsRecords.length, userDepartmentsRecords);
    console.log('UserDesignations:', userDesignationsRecords.length, userDesignationsRecords);
    console.log('UserSetup:', userSetupRecords.length, userSetupRecords);
    console.log('UserGroups:', userGroupsRecords.length, userGroupsRecords);
    checkStorageUsage();
  };

  // Make debug functions available globally for console testing
  React.useEffect(() => {
    window.posDebug = {
      checkStorage: checkStorageUsage,
      checkData: debugCurrentData,
      clearAll: clearAllStoredData
    };
  }, [userDepartmentsRecords, userDesignationsRecords, userSetupRecords, userGroupsRecords]);

  const handleCompInfoClick = () => {
    setActiveTab('compinfo');
    setShowCompanyInfo(true);
    setLoadingCompany(true);
    setCompanyError('');
    // Set default company info for demo purposes
    const defaultCompanyInfo = {
      success: true,
      companyName: 'Hotel ABC',
      address: '123 Business Street',
      phone: '+1 (555) 123-4567',
      email: 'info@hotelabc.com'
    };
    setCompanyInfo(defaultCompanyInfo);
    setLoadingCompany(false);
  };

  const closeCompanyInfo = () => {
    setShowCompanyInfo(false);
    setCompanyInfo(null);
    setCompanyError('');
  };

  // Helper: If a submenu is active, do not highlight any top tab
  const isAnySubmenuActive = !!activeSubmenu;

  return (
    <div className="dashboard-container">
      <div className="dashboard-topbar">
        <img src={infoLogo} alt="Info Logo" className="dashboard-logo" />
        <span className="dashboard-title">ithots G5 Restaurant Edition</span>
        <span className="dashboard-hotel">{hotelName}</span>
        <div style={{display:'flex',alignItems:'center',marginLeft:'auto',gap:'16px'}}>
          <div className="dashboard-userinfo" style={{display:'flex',alignItems:'center',background:'#fff',borderRadius:'18px',boxShadow:'0 2px 8px rgba(0,0,0,0.10)',padding:'2px 18px 2px 8px',marginRight:'8px',minWidth:'160px'}}>
            <span style={{display:'flex',alignItems:'center',marginRight:'10px'}}>
              <span style={{display:'inline-block',width:'32px',height:'32px',borderRadius:'50%',background:'#e3e3e3',border:'2px solid #1976d2',overflow:'hidden',marginRight:'8px'}}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="16" fill="#e3e3e3"/>
                  <ellipse cx="16" cy="13" rx="7" ry="7" fill="#1976d2"/>
                  <ellipse cx="16" cy="26" rx="11" ry="7" fill="#b3d1f7"/>
                </svg>
              </span>
              <span style={{display:'flex',flexDirection:'column',alignItems:'flex-start',lineHeight:'1.1'}}>
                <span style={{fontWeight:'bold',fontSize:'1.05rem',color:'#1976d2',maxWidth:'120px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{(user?.name && user.name.trim()) ? user.name.trim() : (user?.email && user.email.trim()) ? user.email.trim() : 'User'}</span>
                <span style={{fontSize:'0.95rem',color:'#444',background:'#e3e3e3',borderRadius:'6px',padding:'0 6px',marginTop:'2px',fontWeight:'500'}}>{user?.role || 'Role'}</span>
              </span>
            </span>
          </div>
          <button onClick={handleLogout} className="dashboard-logout-btn">Logout</button>
        </div>
      </div>
      {/* Sub Menu Bar - styled to match screenshot */}
      <div className="dashboard-submenu-bar" style={{background:'#fff',borderBottom:'2px solid #ffa726',padding:'0 0 0 0',display:'flex',alignItems:'center',height:'56px',position:'relative'}}>
        <span style={{color:'#1a2dc5',fontWeight:'bold',fontSize:'1.15rem',marginLeft:'32px',letterSpacing:'0.5px',whiteSpace:'nowrap'}}>Welcome to Ithots POS</span>
        <div style={{display:'flex',justifyContent:'center',gap:'18px',margin:'12px 0 12px 0',background:'transparent',marginLeft:'220px',position:'relative'}}>
          {[
            { key: 'compinfo', label: 'Comp Info', onClick: handleCompInfoClick },
            { key: 'dashboard', label: 'Dashboard', onClick: ()=>setActiveTab('dashboard') },
            { key: 'pending', label: 'Pending Status', onClick: ()=>{ setActiveTab('pending'); setShowCompanyInfo(false); } },
            { key: 'table', label: 'Sale Info', onClick: ()=>setActiveTab('table') },
            { key: 'account', label: 'Account Setting', onClick: ()=>setActiveTab('account') }
          ].map((tab, idx) => (
            <div key={tab.key} style={{display:'flex',flexDirection:'column',alignItems:'center',position:'relative'}}>
              <button
                className={`dashboard-tab${activeTab===tab.key && !isAnySubmenuActive ? ' active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.key);
                  setActiveSubmenu(null);
                  setActiveMainMenu(null);
                  if(tab.onClick) tab.onClick();
                }}
                style={{background:'#ffb300',color:'#fff',fontWeight:'bold',border:'none',borderRadius:'10px',padding:'8px 18px',fontSize:'1rem',boxShadow:'0 2px 8px rgba(0,0,0,0.10)',cursor:'pointer',transition:'all 0.2s',minWidth:'110px',letterSpacing:'0.5px',position:'relative'}}
              >
                {tab.label}
              </button>
              {activeTab===tab.key && !isAnySubmenuActive && (
                <div style={{width:'32px',height:'8px',background:'#1976d2',borderRadius:'8px',marginTop:'-2px'}}></div>
              )}
            </div>
          ))}
        </div>
        {/* Location indicator below tabs removed as per new rule. The highlighted tab at the top is sufficient. */}
      </div>
      <div style={{display:'flex',height:'calc(100vh - 120px)'}}>
        {/* Sidebar vertical panel always visible */}
        <div style={{width:'300px',background:'#fff',borderRight:'2px solid #ffa726',padding:'8px 0',overflowY:'auto'}}>
    <SidebarMenu
      menuItems={menuItems}
      activeMainMenu={activeMainMenu}
      activeSubmenu={activeSubmenu}
      onMainMenuClick={label => {
        setActiveMainMenu(label);
        setActiveSubmenu(null);
        setActiveTab(null);
      }}
      onSubmenuClick={sub => {
        if (childDirty) {
          if (!window.confirm('You have unsaved changes. If you proceed, your data will not be saved. Continue?')) return;
        }
        setActiveSubmenu(sub);
        setActiveMainMenu(menuItems.find(item => item.submenu && item.submenu.includes(sub))?.label || null);
        setActiveTab(null);
        setChildDirty(false);
        // Do not reset or clear any child data except dirty state
      }}
    />
        </div>
        {/* Main content area */}
        <main className="dashboard-content" style={{flex:1}}>
          {activeSubmenu === 'Property Setup' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./PropertyCode').default, {
                setParentDirty: setChildDirty,
                records: propertyRecords,
                setRecords: setPropertyRecords
              })}
            </React.Suspense>
          ) : activeSubmenu === 'Outlet Setup' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./OutletSetup').default, {
                setParentDirty: setChildDirty,
                propertyCodes: propertyRecords,
                records: outletRecords,
                setRecords: setOutletRecords
              })}
            </React.Suspense>
          ) : activeSubmenu === 'Table Settings' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./TableSettings').default, {
                setParentDirty: setChildDirty,
                propertyCodes: propertyRecords,
                outletRecords: outletRecords,
                records: tableSettingsRecords,
                setRecords: setTableSettingsRecords
              })}
            </React.Suspense>
          ) : activeSubmenu === 'Item Departments' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./ItemDepartments').default, {
                setParentDirty: setChildDirty,
                records: itemDepartmentRecords,
                setRecords: setItemDepartmentRecords
              })}
            </React.Suspense>
          ) : activeSubmenu === 'Item Categories' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./ItemCategories').default, {
                setParentDirty: setChildDirty,
                records: itemCategoryRecords,
                setRecords: setItemCategoryRecords
              })}
            </React.Suspense>
          ) : activeSubmenu === 'Item Master' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./ItemMaster').default, {
                setParentDirty: setChildDirty
              })}
            </React.Suspense>
          ) : activeSubmenu === 'Item Sold' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./ItemSold').default, {
                setParentDirty: setChildDirty,
                records: itemSoldRecords,
                setRecords: setItemSoldRecords
              })}
            </React.Suspense>
          ) : activeSubmenu === 'Item Stock' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./ItemStock').default, {
                setParentDirty: setChildDirty,
                records: itemStockRecords,
                setRecords: setItemStockRecords
              })}
            </React.Suspense>
          ) : activeSubmenu === 'Update Menu Rates' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./UpdateMenuRates').default, {
                setParentDirty: setChildDirty,
                records: updateMenuRatesRecords,
                setRecords: setUpdateMenuRatesRecords
              })}
            </React.Suspense>
          ) : activeSubmenu === 'Import and Export' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./ImportExport').default, {
                setParentDirty: setChildDirty,
                records: importExportRecords,
                setRecords: setImportExportRecords
              })}
            </React.Suspense>
          ) : activeSubmenu === 'Payment Types' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./PaymentTypes').default, {
                setParentDirty: setChildDirty,
                records: paymentTypesRecords,
                setRecords: setPaymentTypesRecords
              })}
            </React.Suspense>
          ) : activeSubmenu === 'Discount Types' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./DiscountType').default, {
                setParentDirty: setChildDirty,
                records: discountTypeRecords,
                setRecords: setDiscountTypeRecords
              })}
            </React.Suspense>
          ) : activeSubmenu === 'Print Formats' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./PrintFormats').default, {
                setParentDirty: setChildDirty,
                records: printFormatsRecords,
                setRecords: setPrintFormatsRecords
              })}
            </React.Suspense>
          ) : activeSubmenu === 'User Departments' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./UserDepartments').default, {
                setParentDirty: setChildDirty,
                propertyCodes: propertyRecords,
                outletRecords: outletRecords,
                records: userDepartmentsRecords,
                setRecords: setUserDepartmentsRecords
              })}
            </React.Suspense>
          ) : activeSubmenu === 'User Designations' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./UserDesignations').default, {
                setParentDirty: setChildDirty,
                propertyCodes: propertyRecords,
                userDepartmentsRecords: userDepartmentsRecords,
                records: userDesignationsRecords,
                setRecords: setUserDesignationsRecords
              })}
            </React.Suspense>
          ) : activeSubmenu === 'User Setup' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./UserSetup').default, {
                setParentDirty: setChildDirty,
                propertyCodes: propertyRecords,
                outletRecords: outletRecords,
                userDepartmentsRecords: userDepartmentsRecords,
                userGroupsRecords: userGroupsRecords,
                records: userSetupRecords,
                setRecords: setUserSetupRecords
              })}
            </React.Suspense>
          ) : activeSubmenu === 'User Groups' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./UserGroups').default, {
                setParentDirty: setChildDirty,
                propertyCodes: propertyRecords,
                userDesignationsRecords: userDesignationsRecords,
                userSetupRecords: userSetupRecords,
                records: userGroupsRecords,
                setRecords: setUserGroupsRecords
              })}
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