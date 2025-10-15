export const downloadDatabaseDocumentation = async () => {
  try {
    // Open the standalone HTML page for document download
    const htmlPath = '/download-database-docs.html';
    
    // Try to open in a new tab/window
    const newWindow = window.open(htmlPath, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    
    if (!newWindow) {
      // Fallback: show information modal if popup blocked
      showDocumentationInfo();
    } else {
      // Show success message
      setTimeout(() => {
        alert('📄 Documentation page opened in new window. If you don\'t see it, please check your popup blocker.');
      }, 500);
    }
    
  } catch (error) {
    console.error('Error opening documentation page:', error);
    showDocumentationInfo();
  }
};

const showDocumentationInfo = () => {
  const baseUrl = window.location.origin;
  const documentationUrl = `${baseUrl}/download-database-docs.html`;
  
  const message = `📄 Database Documentation Download

To download the complete database documentation Word document:

🌐 Open this URL in your browser:
${documentationUrl}

📋 Or manually navigate to:
frontend/download-database-docs.html

📖 The document includes:
• Complete table structures for all 8 management screens
• API endpoints and field mappings  
• Database relationships and constraints
• Integration guidelines for validation

Would you like to copy the URL to clipboard?`;
  
  if (confirm(message)) {
    // Copy URL to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(documentationUrl).then(() => {
        alert('✅ URL copied to clipboard!\n\nPaste it in your browser address bar.');
      }).catch(() => {
        promptManualCopy(documentationUrl);
      });
    } else {
      promptManualCopy(documentationUrl);
    }
  }
};

const promptManualCopy = (url) => {
  // Fallback for browsers that don't support clipboard API
  const textArea = document.createElement('textarea');
  textArea.value = url;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    alert('✅ URL copied to clipboard!\n\nPaste it in your browser address bar.');
  } catch (err) {
    alert(`📋 Please copy this URL manually:\n\n${url}`);
  } finally {
    document.body.removeChild(textArea);
  }
};

// Export database structure information for reference
export const getDatabaseInfo = () => {
  return {
    modules: [
      {
        name: 'Property Code Management',
        table: 'IT_CONF_PROPERTY',
        component: 'PropertyCode.js',
        endpoints: [
          'GET /api/property-codes',
          'POST /api/property-codes', 
          'PUT /api/property-codes/:id',
          'DELETE /api/property-codes/:id'
        ]
      },
      {
        name: 'Set Menu Options',
        table: 'IT_CONF_SET_MENU',
        component: 'SetMenu.js',
        endpoints: [
          'GET /api/set-menus',
          'POST /api/set-menus',
          'PUT /api/set-menus/:id', 
          'DELETE /api/set-menus/:id'
        ]
      },
      {
        name: 'Reason Codes', 
        table: 'IT_CONF_REASONS',
        component: 'ReasonCodes.js',
        endpoints: [
          'GET /api/reason-codes',
          'POST /api/reason-codes',
          'PUT /api/reason-codes/:id',
          'DELETE /api/reason-codes/:id'
        ]
      },
      {
        name: 'Unit of Measurement',
        table: 'IT_CONF_UOM', 
        component: 'UnitOfMeasurement.js',
        endpoints: [
          'GET /api/uom',
          'POST /api/uom',
          'PUT /api/uom/:id',
          'DELETE /api/uom/:id'
        ]
      },
      {
        name: 'Outlet Setup',
        table: 'IT_CONF_OUTSET',
        component: 'OutletSetup.js',
        endpoints: [
          'GET /api/outlets',
          'POST /api/outlets',
          'PUT /api/outlets/:outlet_code',
          'DELETE /api/outlets/:outlet_code'
        ]
      },
      {
        name: 'Item Master',
        table: 'IT_CONF_ITEM_MASTER',
        component: 'ItemMaster.js',
        endpoints: [
          'GET /api/items',
          'POST /api/items',
          'PUT /api/items/:item_code',
          'DELETE /api/items/:item_code'
        ]
      },
      {
        name: 'User Setup',
        table: 'users',
        component: 'UserSetup.js',
        endpoints: [
          'GET /api/users',
          'POST /api/users',
          'PUT /api/users/:id',
          'DELETE /api/users/:id'
        ]
      },
      {
        name: 'User Departments',
        table: 'IT_CONF_USER_DEPARTMENTS',
        component: 'UserDepartments.js',
        endpoints: [
          'GET /api/user-departments',
          'POST /api/user-departments',
          'PUT /api/user-departments/:id',
          'DELETE /api/user-departments/:id'
        ]
      }
    ],
    commonPatterns: {
      crud: 'All modules follow RESTful CRUD patterns',
      persistence: 'localStorage with hash verification',
      validation: 'Client-side validation with duplicate checking',
      export: 'Excel and PDF export capabilities'
    }
  };
};