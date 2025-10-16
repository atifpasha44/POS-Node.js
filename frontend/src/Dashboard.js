import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import infoLogo from './info-logo-new.png';
import propertyLogo from './hotel-abc-logo.png';
import DashboardSummaryPanel from './DashboardSummaryPanel';
import SidebarMenu from './SidebarMenu';
import { downloadDatabaseDocumentation } from './DatabaseDocumentationGenerator';
import { VERSION_INFO, VersionUtils } from './version';
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
// Database Documentation Content Component
function DatabaseDocumentationContent() {
  const documentationData = `POS SYSTEM - DATABASE INTEGRATION MAPPING
========================================
Generated: ${new Date().toLocaleDateString()}

OVERVIEW
========
This document provides comprehensive backend integration mapping for the POS system,
covering all management screens, database tables, API endpoints, and relationships.

TABLE OF CONTENTS
================
1. Property Code Management (IT_CONF_PROPERTY)
2. Outlet Setup Management (IT_CONF_OUTSET)  
3. Item Master Management (IT_CONF_ITEM_MASTER)
4. User Setup & Management (users)
5. Set Menu Configuration (IT_CONF_SET_MENU)
6. Reason Codes Management (IT_CONF_REASONS)
7. Unit of Measurement (IT_CONF_UOM)
8. Database Relationships & Dependencies
9. API Patterns & Implementation Guidelines

========================================

1. PROPERTY CODE MANAGEMENT
==========================
Component: PropertyCode.js
Backend Table: IT_CONF_PROPERTY
Primary Key: id (AUTO_INCREMENT)
Unique Fields: property_code

Table Structure:
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- applicable_from (DATE)
- property_code (VARCHAR(32), NOT NULL, UNIQUE)
- property_name (VARCHAR(128), NOT NULL)
- nick_name (VARCHAR(64))
- owner_name (VARCHAR(128))
- address_name (VARCHAR(256))
- gst_number (VARCHAR(32))
- pan_number (VARCHAR(32))
- group_name (VARCHAR(64))
- local_currency (VARCHAR(16))
- currency_format (VARCHAR(16))
- symbol (VARCHAR(8))
- decimal_places (INT, DEFAULT 2)
- date_format (VARCHAR(16))
- round_off (VARCHAR(16))
- property_logo (VARCHAR(256))

API Endpoints:
- GET /api/property-codes - Fetch all property codes
- POST /api/property-codes - Create new property code
- PUT /api/property-codes/:id - Update existing property code
- DELETE /api/property-codes/:id - Delete property code

========================================

2. OUTLET SETUP MANAGEMENT
=========================
Component: OutletSetup.js
Backend Table: IT_CONF_OUTSET
Primary Key: Composite (APPDAT, OUTCODE)

Table Structure:
- APPDAT (DECIMAL(8,0), PRIMARY KEY)
- OUTCODE (VARCHAR(3), PRIMARY KEY)
- OUTNAME (VARCHAR(30), DEFAULT '')
- SHTNAM (VARCHAR(10), DEFAULT '')
- OUTTYPE (DECIMAL(1,0), DEFAULT 1)
- BILInitial (VARCHAR(2), DEFAULT '0')
- OUTSET (DECIMAL(6,0), DEFAULT 0)
- ActiveStatus (TINYINT(1), DEFAULT 1)

API Endpoints:
- GET /api/outlets - Fetch all outlets
- POST /api/outlets - Create new outlet
- PUT /api/outlets/:outlet_code - Update outlet
- DELETE /api/outlets/:outlet_code - Delete outlet

========================================

3. ITEM MASTER MANAGEMENT
========================
Component: ItemMaster.js
Backend Table: IT_CONF_ITEM_MASTER
Primary Key: id (AUTO_INCREMENT)
Unique Fields: item_code

Table Structure:
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- select_outlets (JSON, Selected outlets array)
- applicable_from (DATE, NOT NULL)
- item_code (VARCHAR(20), NOT NULL, UNIQUE)
- inventory_code (VARCHAR(20))
- item_name (VARCHAR(50), NOT NULL)
- short_name (VARCHAR(20))
- alternate_name (VARCHAR(100))
- tax_code (VARCHAR(10))
- item_price_1 to item_price_4 (DECIMAL(10,2))
- item_printer_1 to item_printer_3 (VARCHAR(20))
- print_group (VARCHAR(50))
- item_department (VARCHAR(4), NOT NULL)
- item_category (VARCHAR(10), NOT NULL)
- cost (DECIMAL(10,2))
- unit (VARCHAR(20))
- set_menu (VARCHAR(50))
- item_modifier_group (VARCHAR(50))
- status (ENUM: Active/Inactive)
- item_logo (VARCHAR(255))

Foreign Key Relationships:
- item_department → IT_CONF_ITEM_DEPARTMENTS(department_code)
- item_category → IT_CONF_ITEM_CATEGORIES(category_code)

API Endpoints:
- GET /api/items - Fetch all items
- POST /api/items - Create new item
- PUT /api/items/:item_code - Update item
- DELETE /api/items/:item_code - Delete item

========================================

4. SET MENU CONFIGURATION
========================
Component: SetMenu.js
Backend Table: IT_CONF_SET_MENU

Key Fields:
- set_menu_code (Primary Key)
- set_menu_name
- description
- items_included (JSON array with item details)
- selling_price (calculated from item prices)
- is_active
- effective_from
- effective_to

Features:
- Item selection from Item Master
- Real-time price calculation
- Grid/popup interface for item management
- Search, sort, and filter capabilities
- Copy functionality for duplicate menus

API Endpoints:
- GET /api/set-menus - Fetch all set menus
- POST /api/set-menus - Create new set menu
- PUT /api/set-menus/:id - Update set menu
- DELETE /api/set-menus/:id - Delete set menu

========================================

5. REASON CODES MANAGEMENT
=========================
Component: ReasonCodes.js
Backend Table: IT_CONF_REASONS
Primary Key: REASON_CODE

Table Structure:
- REASON_CODE (VARCHAR(10), PRIMARY KEY)
- REASON_DESC (VARCHAR(100), DEFAULT '')
- ActiveStatus (TINYINT(1), DEFAULT 1)

Purpose: Define operational reason codes for audit and reporting
Operation Types: POS, KOT, Bill, Payment, Inventory, Reports, User Management, System, General

API Endpoints:
- GET /api/reason-codes - Fetch all reason codes
- POST /api/reason-codes - Create new reason code
- PUT /api/reason-codes/:id - Update reason code
- DELETE /api/reason-codes/:id - Delete reason code

========================================

6. UNIT OF MEASUREMENT
=====================
Component: UnitOfMeasurement.js
Backend Table: IT_CONF_UOM
Primary Key: UOM_CODE

Table Structure:
- UOM_CODE (VARCHAR(10), PRIMARY KEY)
- UOM_NAME (VARCHAR(50), DEFAULT '')
- DESCRIPTION (VARCHAR(100), DEFAULT '')
- ActiveStatus (TINYINT(1), DEFAULT 1)

Purpose: Standardize measurement units across the application
Features: Conversion factor support, display sequence for dropdown ordering

API Endpoints:
- GET /api/uom - Fetch all UOM records
- POST /api/uom - Create new UOM
- PUT /api/uom/:id - Update UOM
- DELETE /api/uom/:id - Delete UOM

========================================

7. USER SETUP & MANAGEMENT
==========================
Component: UserSetup.js
Backend Table: users
Primary Key: id (AUTO_INCREMENT)
Unique Fields: email, tin

Table Structure:
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- email (VARCHAR(255), UNIQUE)
- password (VARCHAR(255))
- tin (VARCHAR(255), UNIQUE)
- name (VARCHAR(255))
- profile_img (VARCHAR(255))
- role (VARCHAR(32), DEFAULT 'user')

Related Tables:
- user_groups - User group management
- Property relationships via property_code
- Outlet assignments (JSON or separate linking table)

API Endpoints:
- POST /api/users - Create new user (Admin only)
- GET /api/users - Fetch all users
- PUT /api/users/:id - Update user
- DELETE /api/users/:id - Delete user

========================================

8. DATABASE RELATIONSHIPS
=========================

Master-Transaction Relationships:

1. Property Code → Outlet Setup (1:N relationship)
   • One property can have multiple outlets
   • property_code links the tables

2. Item Departments → Item Categories → Item Master (1:N:N)
   • Departments contain multiple categories
   • Categories contain multiple items
   • Hierarchical structure for menu organization

3. Property Code → User Setup (1:N relationship)
   • Users belong to specific properties
   • property_code in user table

4. Outlet Setup → User Setup (N:N via outlet assignments)
   • Users can be assigned to multiple outlets
   • outlet_codes array in user setup

5. Item Master → Set Menu (N:N via items_included JSON)
   • Set menus contain multiple items
   • JSON array stores item relationships

Foreign Key Constraints:
- IT_CONF_ITEM_MASTER.item_department → IT_CONF_ITEM_DEPARTMENTS.department_code
- IT_CONF_ITEM_MASTER.item_category → IT_CONF_ITEM_CATEGORIES.category_code
- IT_CONF_ITEM_CATEGORIES.item_department_code → IT_CONF_ITEM_DEPARTMENTS.department_code

========================================

9. API PATTERNS & IMPLEMENTATION
===============================

RESTful API Pattern:
All CRUD operations follow consistent conventions:
- GET /api/{resource} - Fetch all records
- POST /api/{resource} - Create new record
- PUT /api/{resource}/:id - Update existing record
- DELETE /api/{resource}/:id - Delete record

Data Persistence Strategy:
All forms use localStorage with hash verification:
- {formName}Records - Main data storage
- {formName}RecordsBackup - Backup with timestamp
- {formName}RecordsHash - Data integrity verification

Validation Strategy:
- Client-side validation with duplicate checking
- Field-level validation with error messaging
- Data type and length constraints
- Required field validation

Export Capabilities:
- Excel export for all data tables
- PDF export with formatted layouts
- Import/Export functionality for data migration
- Backup and restore capabilities

========================================

IMPLEMENTATION NOTES
===================

Authentication & Authorization:
- Session-based authentication
- Role-based access control (Admin/User)
- Protected routes and API endpoints

Database Configuration:
- MySQL database with InnoDB engine
- UTF8MB4 character set for international support
- Proper indexing for performance optimization
- Foreign key constraints for data integrity

Development Environment:
- Node.js backend with Express framework
- React frontend with modern ES6+ features
- MySQL database server
- Development and production configurations

========================================

This documentation provides comprehensive backend integration mapping
for the complete POS system with all management screens, API endpoints,
database structures, and implementation guidelines.

Document generated: ${new Date().toLocaleString()}
========================================`;

  const downloadText = () => {
    try {
      const blob = new Blob([documentationData], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'POS_Database_Documentation_' + new Date().toISOString().slice(0, 10) + '.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert('✅ Text documentation downloaded successfully!');
    } catch (error) {
      alert('❌ Download failed: ' + error.message);
    }
  };

  const downloadJSON = () => {
    try {
      const jsonData = {
        title: "POS System - Backend Database Integration Mapping",
        generatedOn: new Date().toISOString(),
        modules: [
          { name: "Property Code Management", table: "IT_CONF_PROPERTY", component: "PropertyCode.js" },
          { name: "Outlet Setup", table: "IT_CONF_OUTSET", component: "OutletSetup.js" },
          { name: "Item Master", table: "IT_CONF_ITEM_MASTER", component: "ItemMaster.js" },
          { name: "Set Menu", table: "IT_CONF_SET_MENU", component: "SetMenu.js" },
          { name: "Reason Codes", table: "IT_CONF_REASONS", component: "ReasonCodes.js" },
          { name: "Unit of Measurement", table: "IT_CONF_UOM", component: "UnitOfMeasurement.js" },
          { name: "User Setup", table: "users", component: "UserSetup.js" }
        ],
        relationships: [
          "Property Code → Outlet Setup (1:N)",
          "Item Departments → Item Categories → Item Master (1:N:N)",
          "Property Code → User Setup (1:N)",
          "Item Master → Set Menu (N:N via JSON)"
        ]
      };
      
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'POS_Database_Documentation_' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert('✅ JSON documentation downloaded successfully!');
    } catch (error) {
      alert('❌ JSON download failed: ' + error.message);
    }
  };

  const copyToClipboard = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(documentationData).then(() => {
        alert('✅ Documentation copied to clipboard!');
      }).catch(() => {
        fallbackCopy();
      });
    } else {
      fallbackCopy();
    }
  };

  const fallbackCopy = () => {
    const textArea = document.createElement('textarea');
    textArea.value = documentationData;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      alert('✅ Documentation copied to clipboard!');
    } catch (err) {
      alert('📋 Please select the text manually and copy with Ctrl+C');
    }
    document.body.removeChild(textArea);
  };

  return (
    <div>
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h3 style={{ color: '#2c3e50', marginBottom: '10px' }}>POS System - Backend Integration Mapping</h3>
        <p style={{ color: '#7f8c8d', margin: 0 }}>Complete database documentation for all management screens</p>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={downloadText} style={{
          background: '#27ae60', color: 'white', border: 'none', padding: '10px 20px',
          borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
        }}>
          📝 Download Text
        </button>
        <button onClick={downloadJSON} style={{
          background: '#3498db', color: 'white', border: 'none', padding: '10px 20px',
          borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
        }}>
          📊 Download JSON
        </button>
        <button onClick={copyToClipboard} style={{
          background: '#e74c3c', color: 'white', border: 'none', padding: '10px 20px',
          borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
        }}>
          📋 Copy Text
        </button>
      </div>

      <div style={{
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '15px',
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        whiteSpace: 'pre-wrap',
        maxHeight: '400px',
        overflow: 'auto',
        color: '#2c3e50',
        lineHeight: '1.4'
      }}>
        {documentationData}
      </div>
      
      <div style={{ marginTop: '15px', fontSize: '13px', color: '#7f8c8d', textAlign: 'center' }}>
        📌 <strong>Alternative:</strong> Use Ctrl+P to print this documentation as PDF
      </div>
    </div>
  );
}

function Dashboard({ user, setUser }) {
  // Track dirty state from child modules
  const [childDirty, setChildDirty] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [activeMainMenu, setActiveMainMenu] = useState(null); // Track active main menu for highlight
  const hotelName = 'ABC Hotel';
  const [showCompanyInfo, setShowCompanyInfo] = useState(true); // Show Comp Info by default
  const [showVersionModal, setShowVersionModal] = useState(false);
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
  const [businessPeriodsRecords, setBusinessPeriodsRecords] = useState([]); // Persist Business Periods records
  const [pantryMessageRecords, setPantryMessageRecords] = useState([]); // Persist Pantry Message records
  const [taxCodesRecords, setTaxCodesRecords] = useState([]); // Persist Tax Codes records
  const [taxStructureRecords, setTaxStructureRecords] = useState([]); // Persist Tax Structure records
  const [creditCardRecords, setCreditCardRecords] = useState([]); // Persist Credit Card records
  const [setMenuRecords, setSetMenuRecords] = useState([]); // Persist Set Menu records
  const [itemMasterRecords, setItemMasterRecords] = useState([]); // Persist Item Master records
  const [reasonCodesRecords, setReasonCodesRecords] = useState([]); // Persist Reason Codes records
  const [uomRecords, setUomRecords] = useState([]); // Persist Unit of Measurement records
  const navigate = useNavigate();

  // Flag to track if initial data loading is complete
  const [dataLoaded, setDataLoaded] = useState(false);

  // Helper function to safely parse JSON data from localStorage with integrity checking
  const safeJsonParse = (data, fallback = [], key = null) => {
    try {
      if (!data) return fallback;
      
      const parsed = JSON.parse(data);
      
      // Verify data integrity if key is provided
      if (key) {
        const storedHash = localStorage.getItem(`${key}_hash`);
        const currentHash = btoa(data.length.toString());
        
        if (storedHash && storedHash !== currentHash) {
          console.warn(`Data integrity check failed for ${key}. Attempting recovery...`);
          
          // Try to recover from backup
          const backupData = localStorage.getItem(`${key}_backup`);
          if (backupData) {
            console.log(`Recovering ${key} from backup`);
            const backupParsed = JSON.parse(backupData);
            if (Array.isArray(backupParsed)) {
              // Update main storage with backup data
              localStorage.setItem(key, backupData);
              localStorage.setItem(`${key}_hash`, btoa(backupData.length.toString()));
              localStorage.setItem(`${key}_recovered`, new Date().toISOString());
              return backupParsed;
            }
          }
        }
      }
      
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
      console.error(`Error parsing JSON data${key ? ` for ${key}` : ''}:`, error);
      
      // Try backup recovery on parse error
      if (key) {
        const backupData = localStorage.getItem(`${key}_backup`);
        if (backupData) {
          try {
            console.log(`Parse failed for ${key}, trying backup...`);
            const backupParsed = JSON.parse(backupData);
            if (Array.isArray(backupParsed)) {
              localStorage.setItem(key, backupData);
              return backupParsed;
            }
          } catch (backupError) {
            console.error(`Backup recovery also failed for ${key}:`, backupError);
          }
        }
      }
      
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
        const savedBusinessPeriodsRecords = localStorage.getItem('businessPeriodsRecords');
        const savedPantryMessageRecords = localStorage.getItem('pantryMessageRecords');
        const savedTaxCodesRecords = localStorage.getItem('taxCodesRecords');
        const savedTaxStructureRecords = localStorage.getItem('taxStructureRecords');
        const savedCreditCardRecords = localStorage.getItem('creditCardRecords');
        const savedSetMenuRecords = localStorage.getItem('setMenuRecords');
        const savedItemMasterRecords = localStorage.getItem('itemMasterRecords');
        const savedReasonCodesRecords = localStorage.getItem('reasonCodesRecords');
        const savedUomRecords = localStorage.getItem('uomRecords');

        // Parse and set the data with safe parsing and integrity checking
        const loadedPropertyRecords = safeJsonParse(savedPropertyRecords, [], 'propertyRecords');
        const loadedItemDepartmentRecords = safeJsonParse(savedItemDepartmentRecords, [], 'itemDepartmentRecords');
        const loadedItemCategoryRecords = safeJsonParse(savedItemCategoryRecords, [], 'itemCategoryRecords');
        const loadedItemSoldRecords = safeJsonParse(savedItemSoldRecords, [], 'itemSoldRecords');
        const loadedItemStockRecords = safeJsonParse(savedItemStockRecords, [], 'itemStockRecords');
        const loadedUpdateMenuRatesRecords = safeJsonParse(savedUpdateMenuRatesRecords, [], 'updateMenuRatesRecords');
        const loadedImportExportRecords = safeJsonParse(savedImportExportRecords, [], 'importExportRecords');
        const loadedPaymentTypesRecords = safeJsonParse(savedPaymentTypesRecords, [], 'paymentTypesRecords');
        const loadedDiscountTypeRecords = safeJsonParse(savedDiscountTypeRecords, [], 'discountTypeRecords');
        const loadedPrintFormatsRecords = safeJsonParse(savedPrintFormatsRecords, [], 'printFormatsRecords');
        const loadedTableSettingsRecords = safeJsonParse(savedTableSettingsRecords, [], 'tableSettingsRecords');
        const loadedOutletRecords = safeJsonParse(savedOutletRecords, [], 'outletRecords');
        const loadedUserDepartmentsRecords = safeJsonParse(savedUserDepartmentsRecords, [], 'userDepartmentsRecords');
        const loadedUserDesignationsRecords = safeJsonParse(savedUserDesignationsRecords, [], 'userDesignationsRecords');
        const loadedUserGroupsRecords = safeJsonParse(savedUserGroupsRecords, [], 'userGroupsRecords');
        const loadedUserSetupRecords = safeJsonParse(savedUserSetupRecords, [], 'userSetupRecords');
        const loadedBusinessPeriodsRecords = safeJsonParse(savedBusinessPeriodsRecords, [], 'businessPeriodsRecords');
        const loadedPantryMessageRecords = safeJsonParse(savedPantryMessageRecords, [], 'pantryMessageRecords');
        const loadedTaxCodesRecords = safeJsonParse(savedTaxCodesRecords, [], 'taxCodesRecords');
        const loadedTaxStructureRecords = safeJsonParse(savedTaxStructureRecords, [], 'taxStructureRecords');
        const loadedCreditCardRecords = safeJsonParse(savedCreditCardRecords, [], 'creditCardRecords');
        const loadedSetMenuRecords = safeJsonParse(savedSetMenuRecords, [], 'setMenuRecords');
        const loadedItemMasterRecords = safeJsonParse(savedItemMasterRecords, [], 'itemMasterRecords');
        const loadedReasonCodesRecords = safeJsonParse(savedReasonCodesRecords, [], 'reasonCodesRecords');
        const loadedUomRecords = safeJsonParse(savedUomRecords, [], 'uomRecords');

        // Log loaded data for debugging with special attention to critical records
        console.log('========== DATA LOADING REPORT ==========');
        console.log('✅ Outlet Setup records:', loadedOutletRecords.length, 'items', loadedOutletRecords.length > 0 ? '(DATA FOUND)' : '(NO DATA)');
        console.log('✅ UserDepartments records:', loadedUserDepartmentsRecords.length, 'items');
        console.log('✅ UserDesignations records:', loadedUserDesignationsRecords.length, 'items');
        console.log('✅ UserSetup records:', loadedUserSetupRecords.length, 'items');
        console.log('✅ Business Periods records:', loadedBusinessPeriodsRecords.length, 'items');
        console.log('✅ Pantry Message records:', loadedPantryMessageRecords.length, 'items');
        console.log('✅ Tax Codes records:', loadedTaxCodesRecords.length, 'items');
        console.log('✅ Tax Structure records:', loadedTaxStructureRecords.length, 'items');
        console.log('✅ Credit Card records:', loadedCreditCardRecords.length, 'items');
        console.log('✅ Set Menu records:', loadedSetMenuRecords.length, 'items');
        console.log('✅ Item Master records:', loadedItemMasterRecords.length, 'items');
        console.log('✅ Reason Codes records:', loadedReasonCodesRecords.length, 'items');
        console.log('✅ UOM records:', loadedUomRecords.length, 'items');
        console.log('✅ Property records:', loadedPropertyRecords.length, 'items');
        console.log('✅ Table Settings records:', loadedTableSettingsRecords.length, 'items');
        console.log('==========================================');
        
        // Special logging for outlet records
        if (loadedOutletRecords.length > 0) {
          console.log('🏢 OUTLET SETUP DATA PROTECTED AND LOADED:');
          loadedOutletRecords.forEach((outlet, index) => {
            console.log(`   ${index + 1}. ${outlet.outlet_code} - ${outlet.outlet_name}`);
          });
        }

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
        setBusinessPeriodsRecords(loadedBusinessPeriodsRecords);
        setPantryMessageRecords(loadedPantryMessageRecords);
        setTaxCodesRecords(loadedTaxCodesRecords);
        setTaxStructureRecords(loadedTaxStructureRecords);
        setCreditCardRecords(loadedCreditCardRecords);
        setSetMenuRecords(loadedSetMenuRecords);
        setItemMasterRecords(loadedItemMasterRecords);
        setReasonCodesRecords(loadedReasonCodesRecords);
        setUomRecords(loadedUomRecords);

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

  // Helper function to safely save data to localStorage with backup protection
  const saveToLocalStorage = (key, data) => {
    try {
      // Create a backup of existing data before overwriting
      const existingData = localStorage.getItem(key);
      if (existingData && existingData !== 'null' && existingData !== '[]') {
        localStorage.setItem(`${key}_backup`, existingData);
        localStorage.setItem(`${key}_backup_timestamp`, new Date().toISOString());
      }
      
      // Save the new data
      localStorage.setItem(key, JSON.stringify(data));
      
      // Store data integrity hash and timestamp
      localStorage.setItem(`${key}_hash`, btoa(JSON.stringify(data).length.toString()));
      localStorage.setItem(`${key}_last_modified`, new Date().toISOString());
      
      // Keep a record of successful saves
      localStorage.setItem(`${key}_save_count`, (parseInt(localStorage.getItem(`${key}_save_count`) || '0') + 1).toString());
      
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
      
      // Try to restore from backup if save failed
      const backupData = localStorage.getItem(`${key}_backup`);
      if (backupData) {
        console.log(`Attempting to restore ${key} from backup`);
        try {
          localStorage.setItem(key, backupData);
        } catch (restoreError) {
          console.error(`Failed to restore ${key} from backup:`, restoreError);
        }
      }
      
      // Handle storage quota exceeded or other localStorage errors
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded. Consider implementing data cleanup.');
        // Attempt to clean old backups to free space
        cleanOldBackups();
      }
    }
  };

  // Function to clean old backup data to free storage space
  const cleanOldBackups = () => {
    try {
      const keysToClean = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('_backup_timestamp')) {
          const timestamp = localStorage.getItem(key);
          const backupDate = new Date(timestamp);
          const daysSinceBackup = (new Date() - backupDate) / (1000 * 60 * 60 * 24);
          
          // Remove backups older than 7 days
          if (daysSinceBackup > 7) {
            const baseKey = key.replace('_backup_timestamp', '');
            keysToClean.push(`${baseKey}_backup`);
            keysToClean.push(key);
          }
        }
      }
      
      keysToClean.forEach(key => {
        localStorage.removeItem(key);
        console.log(`Cleaned old backup: ${key}`);
      });
    } catch (error) {
      console.error('Error cleaning old backups:', error);
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
      console.log('🏢 SAVING OUTLET RECORDS:', outletRecords.length, 'records');
      if (outletRecords.length > 0) {
        console.log('   Outlet records being saved:', outletRecords.map(o => `${o.outlet_code} - ${o.outlet_name}`));
      }
      saveToLocalStorage('outletRecords', outletRecords);
      
      // Create an additional backup specifically for outlet data
      try {
        const outletBackupKey = `outletRecords_critical_backup_${Date.now()}`;
        localStorage.setItem(outletBackupKey, JSON.stringify(outletRecords));
        console.log('🔒 Critical outlet backup created:', outletBackupKey);
        
        // Keep only the 3 most recent critical backups
        const criticalBackupKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('outletRecords_critical_backup_')) {
            criticalBackupKeys.push(key);
          }
        }
        
        if (criticalBackupKeys.length > 3) {
          criticalBackupKeys.sort().slice(0, -3).forEach(oldKey => {
            localStorage.removeItem(oldKey);
            console.log('🗑️ Removed old critical backup:', oldKey);
          });
        }
      } catch (error) {
        console.error('Error creating critical outlet backup:', error);
      }
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
    if (dataLoaded) {
      saveToLocalStorage('businessPeriodsRecords', businessPeriodsRecords);
      console.log('Saving businessPeriodsRecords to localStorage:', businessPeriodsRecords);
    }
  }, [businessPeriodsRecords, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      saveToLocalStorage('pantryMessageRecords', pantryMessageRecords);
      console.log('Saving pantryMessageRecords to localStorage:', pantryMessageRecords);
    }
  }, [pantryMessageRecords, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      saveToLocalStorage('taxCodesRecords', taxCodesRecords);
      console.log('Saving taxCodesRecords to localStorage:', taxCodesRecords);
    }
  }, [taxCodesRecords, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      saveToLocalStorage('taxStructureRecords', taxStructureRecords);
      console.log('Saving taxStructureRecords to localStorage:', taxStructureRecords);
    }
  }, [taxStructureRecords, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      saveToLocalStorage('creditCardRecords', creditCardRecords);
      console.log('Saving creditCardRecords to localStorage:', creditCardRecords);
    }
  }, [creditCardRecords, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      saveToLocalStorage('setMenuRecords', setMenuRecords);
      console.log('Saving setMenuRecords to localStorage:', setMenuRecords);
    }
  }, [setMenuRecords, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      saveToLocalStorage('itemMasterRecords', itemMasterRecords);
      console.log('Saving itemMasterRecords to localStorage:', itemMasterRecords);
    }
  }, [itemMasterRecords, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      saveToLocalStorage('reasonCodesRecords', reasonCodesRecords);
      console.log('Saving reasonCodesRecords to localStorage:', reasonCodesRecords);
    }
  }, [reasonCodesRecords, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      saveToLocalStorage('uomRecords', uomRecords);
      console.log('Saving uomRecords to localStorage:', uomRecords);
    }
  }, [uomRecords, dataLoaded]);

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
      localStorage.removeItem('businessPeriodsRecords');
      localStorage.removeItem('pantryMessageRecords');
      localStorage.removeItem('taxCodesRecords');
      
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
      setBusinessPeriodsRecords([]);
      setPantryMessageRecords([]);
      setTaxCodesRecords([]);
      
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
        businessPeriodsRecords,
        pantryMessageRecords,
        taxCodesRecords,
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
            if (importedData.businessPeriodsRecords) setBusinessPeriodsRecords(importedData.businessPeriodsRecords);
            if (importedData.pantryMessageRecords) setPantryMessageRecords(importedData.pantryMessageRecords);
            if (importedData.taxCodesRecords) setTaxCodesRecords(importedData.taxCodesRecords);
            if (importedData.taxStructureRecords) setTaxStructureRecords(importedData.taxStructureRecords);
            if (importedData.creditCardRecords) setCreditCardRecords(importedData.creditCardRecords);
            if (importedData.setMenuRecords) setSetMenuRecords(importedData.setMenuRecords);
            if (importedData.itemMasterRecords) setItemMasterRecords(importedData.itemMasterRecords);
            if (importedData.reasonCodesRecords) setReasonCodesRecords(importedData.reasonCodesRecords);
            if (importedData.uomRecords) setUomRecords(importedData.uomRecords);

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
    console.log('========== CURRENT DATA STATUS ==========');
    console.log('🏢 Outlet Setup:', outletRecords.length, outletRecords);
    console.log('👥 UserDepartments:', userDepartmentsRecords.length, userDepartmentsRecords);
    console.log('🏷️ UserDesignations:', userDesignationsRecords.length, userDesignationsRecords);
    console.log('👤 UserSetup:', userSetupRecords.length, userSetupRecords);
    console.log('🔐 UserGroups:', userGroupsRecords.length, userGroupsRecords);
    console.log('🏢 Property Records:', propertyRecords.length, propertyRecords);
    console.log('🍽️ Table Settings:', tableSettingsRecords.length, tableSettingsRecords);
    console.log('========================================');
    checkStorageUsage();
  };

  // Critical data recovery function
  const recoverCriticalData = () => {
    console.log('🔧 INITIATING CRITICAL DATA RECOVERY...');
    let recoveredCount = 0;
    
    // Recovery for outlet records
    try {
      const criticalBackupKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('outletRecords_critical_backup_')) {
          criticalBackupKeys.push(key);
        }
      }
      
      if (criticalBackupKeys.length > 0) {
        // Use the most recent backup
        const latestBackup = criticalBackupKeys.sort().pop();
        const backupData = localStorage.getItem(latestBackup);
        if (backupData) {
          const recoveredOutlets = JSON.parse(backupData);
          setOutletRecords(recoveredOutlets);
          console.log('🏢 Recovered outlet records from:', latestBackup, '- Count:', recoveredOutlets.length);
          recoveredCount++;
        }
      }
      
      // Recovery for other records
      const recordTypes = [
        'propertyRecords', 'userDepartmentsRecords', 'userDesignationsRecords',
        'userSetupRecords', 'userGroupsRecords', 'tableSettingsRecords', 'businessPeriodsRecords', 'pantryMessageRecords', 'taxCodesRecords'
      ];
      
      recordTypes.forEach(recordType => {
        const backupKey = `${recordType}_backup`;
        const backupData = localStorage.getItem(backupKey);
        if (backupData) {
          try {
            const recoveredData = JSON.parse(backupData);
            if (Array.isArray(recoveredData) && recoveredData.length > 0) {
              console.log(`📦 Recovered ${recordType}:`, recoveredData.length, 'items');
              
              // Apply recovery based on record type
              switch (recordType) {
                case 'propertyRecords': setPropertyRecords(recoveredData); break;
                case 'userDepartmentsRecords': setUserDepartmentsRecords(recoveredData); break;
                case 'userDesignationsRecords': setUserDesignationsRecords(recoveredData); break;
                case 'userSetupRecords': setUserSetupRecords(recoveredData); break;
                case 'userGroupsRecords': setUserGroupsRecords(recoveredData); break;
                case 'tableSettingsRecords': setTableSettingsRecords(recoveredData); break;
                case 'businessPeriodsRecords': setBusinessPeriodsRecords(recoveredData); break;
                case 'pantryMessageRecords': setPantryMessageRecords(recoveredData); break;
                case 'taxCodesRecords': setTaxCodesRecords(recoveredData); break;
              }
              recoveredCount++;
            }
          } catch (error) {
            console.error(`Error recovering ${recordType}:`, error);
          }
        }
      });
      
      console.log(`✅ Recovery complete. Recovered ${recoveredCount} data types.`);
      if (recoveredCount > 0) {
        alert(`Successfully recovered ${recoveredCount} data types from backups!`);
      } else {
        alert('No backup data found for recovery.');
      }
      
    } catch (error) {
      console.error('Error during data recovery:', error);
      alert('Error during data recovery. Check console for details.');
    }
  };

  // Function to create manual backup
  const createManualBackup = () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupData = {
        timestamp,
        outletRecords,
        propertyRecords,
        userDepartmentsRecords,
        userDesignationsRecords,
        userSetupRecords,
        userGroupsRecords,
        tableSettingsRecords,
        businessPeriodsRecords,
        pantryMessageRecords,
        taxCodesRecords,
        taxStructureRecords,
        creditCardRecords,
        setMenuRecords,
        itemMasterRecords,
        reasonCodesRecords,
        uomRecords,
        version: '1.0'
      };
      
      const backupKey = `manual_backup_${timestamp}`;
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      console.log('📁 Manual backup created:', backupKey);
      alert(`Manual backup created successfully! Key: ${backupKey}`);
      
      return backupKey;
    } catch (error) {
      console.error('Error creating manual backup:', error);
      alert('Error creating manual backup. Check console for details.');
    }
  };

  // Make debug functions available globally for console testing
  React.useEffect(() => {
    window.posDebug = {
      // Data monitoring
      checkStorage: checkStorageUsage,
      checkData: debugCurrentData,
      
      // Data protection
      createBackup: createManualBackup,
      recoverData: recoverCriticalData,
      
      // Data management
      clearAll: clearAllStoredData,
      exportData: exportAllData,
      
      // Quick outlet check
      checkOutlets: () => {
        console.log('🏢 OUTLET SETUP STATUS:');
        console.log('Records in memory:', outletRecords.length);
        console.log('Records in localStorage:', safeJsonParse(localStorage.getItem('outletRecords'), []).length);
        console.log('Outlet data:', outletRecords);
        
        // Check for critical backups
        const criticalBackups = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('outletRecords_critical_backup_')) {
            criticalBackups.push(key);
          }
        }
        console.log('Critical backups available:', criticalBackups.length);
        return { memory: outletRecords.length, localStorage: safeJsonParse(localStorage.getItem('outletRecords'), []).length, backups: criticalBackups.length };
      }
    };
    
    // Display available debug commands
    console.log('🔧 POS Debug Tools Available:');
    console.log('  window.posDebug.checkStorage() - Check storage usage');
    console.log('  window.posDebug.checkData() - View all current data');
    console.log('  window.posDebug.checkOutlets() - Check outlet setup status');
    console.log('  window.posDebug.createBackup() - Create manual backup');
    console.log('  window.posDebug.recoverData() - Recover from backups');
    console.log('  window.posDebug.exportData() - Export all data');
    console.log('  window.posDebug.clearAll() - Clear all data (admin only)');
    
  }, [outletRecords, userDepartmentsRecords, userDesignationsRecords, userSetupRecords, userGroupsRecords]);

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
        <span className="dashboard-title">{VERSION_INFO.productName}</span>
        <span className="dashboard-hotel">{hotelName}</span>
        <div style={{display:'flex',alignItems:'center',marginLeft:'auto',gap:'16px'}}>
          <button 
            onClick={() => {
              const docContent = `POS SYSTEM - DATABASE INTEGRATION MAPPING
========================================
Generated: ${new Date().toLocaleDateString()}

COMPREHENSIVE BACKEND INTEGRATION MAPPING
==========================================

1. PROPERTY CODE MANAGEMENT (PropertyCode.js)
   Table: IT_CONF_PROPERTY
   API: /api/property-codes
   Fields: property_code (UNIQUE), property_name, gst_number, pan_number, etc.

2. OUTLET SETUP (OutletSetup.js) 
   Table: IT_CONF_OUTSET
   API: /api/outlets
   Primary Key: Composite (APPDAT, OUTCODE)

3. ITEM MASTER (ItemMaster.js)
   Table: IT_CONF_ITEM_MASTER  
   API: /api/items
   Fields: item_code (UNIQUE), item_name, item_price_1-4, tax_code, etc.

4. SET MENU (SetMenu.js)
   Table: IT_CONF_SET_MENU
   API: /api/set-menus
   Features: Item selection, price calculation

5. REASON CODES (ReasonCodes.js)
   Table: IT_CONF_REASONS
   API: /api/reason-codes
   Purpose: Operational audit codes

6. UNIT OF MEASUREMENT (UnitOfMeasurement.js)
   Table: IT_CONF_UOM
   API: /api/uom
   Purpose: Standardize measurement units

7. USER SETUP (UserSetup.js)
   Table: users
   API: /api/users
   Fields: email (UNIQUE), tin (UNIQUE), role, etc.

KEY RELATIONSHIPS:
- Property Code → Outlets (1:N)
- Item Departments → Categories → Items (1:N:N)  
- Users → Properties → Outlets
- Items → Set Menus (N:N)

API PATTERNS:
- RESTful CRUD: GET/POST/PUT/DELETE
- localStorage persistence with hash verification
- Client-side validation with duplicate checking

IMPLEMENTATION:
- Node.js/Express backend
- React frontend  
- MySQL database with InnoDB
- Session-based authentication

Generated: ${new Date().toLocaleString()}`;
              
              if (navigator.clipboard) {
                navigator.clipboard.writeText(docContent).then(() => {
                  alert('✅ DATABASE DOCUMENTATION COPIED!\n\nThe complete database documentation has been copied to your clipboard.\n\nYou can now:\n• Paste it into a Word document (Ctrl+V)\n• Save it as a text file\n• Email it or share it\n\nThis includes all table structures, API endpoints, relationships, and implementation details for the 8 management screens.');
                }).catch(() => {
                  prompt('📋 COPY THIS DOCUMENTATION:\n\nPress Ctrl+A to select all, then Ctrl+C to copy:', docContent);
                });
              } else {
                prompt('📋 COPY THIS DOCUMENTATION:\n\nPress Ctrl+A to select all, then Ctrl+C to copy:', docContent);
              }
            }}
            style={{
              background:'#4CAF50',
              color:'white',
              border:'none',
              borderRadius:'8px',
              padding:'8px 16px',
              fontSize:'0.95rem',
              fontWeight:'500',
              cursor:'pointer',
              display:'flex',
              alignItems:'center',
              gap:'6px',
              boxShadow:'0 2px 4px rgba(0,0,0,0.1)',
              transition:'background 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#45a049'}
            onMouseOut={(e) => e.target.style.background = '#4CAF50'}
            title="Copy Complete Database Documentation to Clipboard"
          >
            📄 DB Docs
          </button>
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
          <button 
            onClick={() => setShowVersionModal(true)} 
            className="dashboard-info-btn"
            title="Version Information"
            style={{
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#1976D2'}
            onMouseOut={(e) => e.target.style.background = '#2196F3'}
          >
            ℹ
          </button>
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
          ) : activeSubmenu === 'Reason Codes' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./ReasonCodes').default, {
                setParentDirty: setChildDirty,
                records: reasonCodesRecords,
                setRecords: setReasonCodesRecords
              })}
            </React.Suspense>
          ) : activeSubmenu === 'Unit Of Measurement' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./UnitOfMeasurement').default, {
                setParentDirty: setChildDirty,
                records: uomRecords,
                setRecords: setUomRecords
              })}
            </React.Suspense>
          ) : activeSubmenu === 'Tax codes' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./TaxCodes').default, {
                setParentDirty: setChildDirty,
                records: taxCodesRecords,
                setRecords: setTaxCodesRecords
              })}
            </React.Suspense>
          ) : activeSubmenu === 'Tax Structure' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./TaxStructure').default, {
                setParentDirty: setChildDirty,
                records: taxStructureRecords,
                setRecords: setTaxStructureRecords,
                taxCodesRecords: taxCodesRecords
              })}
            </React.Suspense>
          ) : activeSubmenu === 'Credit Card Manager' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./CreditCardManager').default, {
                setParentDirty: setChildDirty,
                records: creditCardRecords,
                setRecords: setCreditCardRecords
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
          ) : activeSubmenu === 'Outlet Business Periods' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./OutletBusinessPeriods').default, {
                setParentDirty: setChildDirty,
                records: businessPeriodsRecords,
                setRecords: setBusinessPeriodsRecords,
                outletRecords: outletRecords
              })}
            </React.Suspense>
          ) : activeSubmenu === 'Pantry Message' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./PantryMessage').default, {
                setParentDirty: setChildDirty,
                records: pantryMessageRecords,
                setRecords: setPantryMessageRecords
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
                setParentDirty: setChildDirty,
                records: itemMasterRecords,
                setRecords: setItemMasterRecords
              })}
            </React.Suspense>
          ) : activeSubmenu === 'Set Menu' ? (
            <React.Suspense fallback={<div>Loading...</div>}>
              {React.createElement(require('./SetMenu').default, {
                setParentDirty: setChildDirty,
                records: setMenuRecords,
                setRecords: setSetMenuRecords,
                itemMasterRecords: itemMasterRecords
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
              <div className="compinfo-card-with-scroll">
                {/* Fixed Header Section */}
                <div className="compinfo-header-section">
                  <div className="compinfo-logo-row">
                    <img src={propertyLogo} alt="Property Logo" className="compinfo-logo" />
                  </div>
                  <div className="compinfo-title">{VERSION_INFO.productName}</div>
                  <div className="compinfo-expiry">Annual Software Subscription will Expire on {companyInfo?.subscription_expiry || companyInfo?.subscription_end || '2026-03-31'}</div>
                </div>

                {/* Scrollable Content Section */}
                <div className="compinfo-scrollable-content">

                  {/* Information Tables */}
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

                  {/* Additional spacing for smooth scrolling */}
                  <div style={{ height: '20px' }}></div>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {/* Version Information Modal */}
      {showVersionModal && (
        <div 
          className="version-modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
          onClick={() => setShowVersionModal(false)}
        >
          <div 
            className="version-modal-content"
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '2px solid #e0e0e0'
            }}>
              <h2 style={{
                margin: 0,
                color: '#1976d2',
                fontSize: '24px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{
                  background: '#1976d2',
                  color: 'white',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>
                  ℹ
                </span>
                Version Information
              </h2>
              <button 
                onClick={() => setShowVersionModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '4px',
                  borderRadius: '4px'
                }}
                title="Close"
              >
                ×
              </button>
            </div>

            {/* Version Details */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                color: 'white',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                  {VERSION_INFO.productName}
                </h3>
                <p style={{ margin: '8px 0 0 0', fontSize: '16px', opacity: 0.9 }}>
                  Version {VERSION_INFO.version} - {VERSION_INFO.releaseName}
                </p>
              </div>

              {/* Version Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}>
                  <strong style={{ color: '#1976d2' }}>Current Version:</strong>
                  <div style={{ marginTop: '4px' }}>{VERSION_INFO.version}</div>
                </div>
                <div style={{
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}>
                  <strong style={{ color: '#1976d2' }}>Build Date:</strong>
                  <div style={{ marginTop: '4px' }}>{VERSION_INFO.buildDate}</div>
                </div>
                <div style={{
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}>
                  <strong style={{ color: '#1976d2' }}>Release Type:</strong>
                  <div style={{ marginTop: '4px' }}>{VERSION_INFO.releaseType}</div>
                </div>
                <div style={{
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}>
                  <strong style={{ color: '#1976d2' }}>API Version:</strong>
                  <div style={{ marginTop: '4px' }}>{VERSION_INFO.apiVersion}</div>
                </div>
              </div>

              {/* Latest Changelog */}
              {VERSION_INFO.changeLog[VERSION_INFO.version] && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: '#1976d2', marginBottom: '12px', fontSize: '18px' }}>
                    📋 What's New in This Version
                  </h4>
                  <div style={{
                    background: '#f0f7ff',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #bbdefb'
                  }}>
                    {VERSION_INFO.changeLog[VERSION_INFO.version].features && (
                      <div style={{ marginBottom: '12px' }}>
                        <strong style={{ color: '#2e7d32' }}>✨ New Features:</strong>
                        <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                          {VERSION_INFO.changeLog[VERSION_INFO.version].features.slice(0, 4).map((feature, index) => (
                            <li key={index} style={{ marginBottom: '2px' }}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {VERSION_INFO.changeLog[VERSION_INFO.version].improvements && (
                      <div style={{ marginBottom: '12px' }}>
                        <strong style={{ color: '#f57c00' }}>🚀 Improvements:</strong>
                        <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                          {VERSION_INFO.changeLog[VERSION_INFO.version].improvements.slice(0, 3).map((improvement, index) => (
                            <li key={index} style={{ marginBottom: '2px' }}>{improvement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {VERSION_INFO.changeLog[VERSION_INFO.version].bugFixes && (
                      <div>
                        <strong style={{ color: '#d32f2f' }}>🐛 Bug Fixes:</strong>
                        <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                          {VERSION_INFO.changeLog[VERSION_INFO.version].bugFixes.slice(0, 3).map((fix, index) => (
                            <li key={index} style={{ marginBottom: '2px' }}>{fix}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Copyright and License */}
              <div style={{
                background: '#fafafa',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                textAlign: 'center'
              }}>
                <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#1976d2' }}>
                  {VERSION_INFO.copyright}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Developed by {VERSION_INFO.developedBy}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                  License: {VERSION_INFO.license} | Database Version: {VERSION_INFO.databaseVersion}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid #e0e0e0'
            }}>
              <button 
                onClick={() => setShowVersionModal(false)}
                style={{
                  background: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#1565c0'}
                onMouseOut={(e) => e.target.style.background = '#1976d2'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
export default Dashboard;