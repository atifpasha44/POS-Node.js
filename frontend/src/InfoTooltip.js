import React, { useState } from 'react';

const InfoTooltip = ({ tableName, mainTable, linkedTables, formName = 'Form' }) => {
  const [showModal, setShowModal] = useState(false);

  const iconStyles = {
    fontSize: '16px',
    color: '#007bff',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
    marginLeft: '8px'
  };

  const iconHoverStyles = {
    ...iconStyles,
    color: '#0056b3'
  };

  // Modal overlay styles (similar to other modals in the app)
  const modalOverlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000
  };

  // Modal content styles (matching app's modal styling)
  const modalContentStyles = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '25px',
    minWidth: '500px',
    maxWidth: '700px',
    maxHeight: '70vh',
    overflow: 'auto',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    border: '2px solid #007bff'
  };

  const headerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '2px solid #e9ecef'
  };

  const titleStyles = {
    margin: 0,
    color: '#007bff',
    fontSize: '1.5rem',
    fontWeight: 'bold'
  };

  const closeButtonStyles = {
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  };

  const contentStyles = {
    lineHeight: '1.6'
  };

  // Parse tables if using legacy tableName prop or use new mainTable/linkedTables structure
  let parsedMainTable = '';
  let parsedLinkedTables = [];

  if (mainTable && linkedTables) {
    // New structure with main and linked tables
    parsedMainTable = mainTable;
    parsedLinkedTables = Array.isArray(linkedTables) ? linkedTables : linkedTables.split(',').map(t => t.trim());
  } else if (tableName) {
    // Legacy structure - parse from tableName string
    const tableList = tableName.split(',').map(table => table.trim());
    parsedMainTable = tableList[0] || '';
    parsedLinkedTables = tableList.slice(1);
  }

  return (
    <>
      <span 
        style={showModal ? iconHoverStyles : iconStyles}
        title="Click to view database table information"
        onClick={() => setShowModal(true)}
        onMouseEnter={(e) => e.target.style.color = iconHoverStyles.color}
        onMouseLeave={(e) => e.target.style.color = iconStyles.color}
      >
        ℹ️
      </span>
      
      {showModal && (
        <div style={modalOverlayStyles} onClick={() => setShowModal(false)}>
          <div style={modalContentStyles} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={headerStyles}>
              <h3 style={titleStyles}>
                📊 Database Table Information
              </h3>
              <button 
                style={closeButtonStyles}
                onClick={() => setShowModal(false)}
                onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
              >
                ✖ Close
              </button>
            </div>

            {/* Modal Content */}
            <div style={contentStyles}>
              <div style={{
                backgroundColor: '#e3f2fd',
                border: '1px solid #bbdefb',
                borderRadius: '6px',
                padding: '15px',
                marginBottom: '25px'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#1565c0' }}>
                  🏷️ Form: <span style={{color: '#2196f3'}}>{formName}</span>
                </h4>
                <p style={{ margin: 0, color: '#1565c0', fontSize: '14px' }}>
                  This form interacts with the following database table(s) in the <strong>pos_db</strong> database:
                </p>
              </div>

              {/* Main Table Section */}
              {parsedMainTable && (
                <div style={{ marginBottom: '25px' }}>
                  <h4 style={{ 
                    margin: '0 0 15px 0', 
                    color: '#28a745',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    🗃️ Main Table:
                  </h4>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 15px',
                    backgroundColor: '#ffffff',
                    border: '2px solid #28a745',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '14px'
                  }}>
                    <span style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '50%',
                      fontSize: '12px',
                      marginRight: '12px',
                      fontWeight: 'bold',
                      minWidth: '24px',
                      textAlign: 'center'
                    }}>
                      1
                    </span>
                    <code style={{ 
                      backgroundColor: 'transparent',
                      color: '#28a745',
                      fontWeight: 'bold',
                      fontSize: '15px'
                    }}>
                      {parsedMainTable}
                    </code>
                  </div>
                </div>
              )}

              {/* Linked Tables Section */}
              {parsedLinkedTables.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ 
                    margin: '0 0 15px 0', 
                    color: '#007bff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    🔗 Linked Tables:
                  </h4>
                  
                  {parsedLinkedTables.map((table, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f1f3f4',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      marginBottom: '5px',
                      fontFamily: 'monospace',
                      fontSize: '14px'
                    }}>
                      <span style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        marginRight: '12px',
                        fontWeight: 'bold'
                      }}>
                        {index + 2}
                      </span>
                      <code style={{ 
                        backgroundColor: 'transparent',
                        color: '#d63384',
                        fontWeight: 'bold'
                      }}>
                        {table}
                      </code>
                    </div>
                  ))}
                </div>
              )}

              <div style={{
                marginTop: '20px',
                padding: '12px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#856404'
              }}>
                <strong>💡 Note:</strong> This information is displayed when Software Control is enabled under 
                <strong> Controls → Software Control</strong>. It helps developers and administrators 
                understand the database structure and relationships used by each form.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InfoTooltip;