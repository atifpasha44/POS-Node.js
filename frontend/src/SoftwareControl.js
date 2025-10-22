import React, { useState } from 'react';

const SoftwareControl = ({ softwareControlEnabled, setSoftwareControlEnabled }) => {
  const [isDirty, setIsDirty] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleToggle = () => {
    setSoftwareControlEnabled(!softwareControlEnabled);
    setIsDirty(true);
  };

  const handleSave = () => {
    try {
      // Save to localStorage using JSON format (consistent with Dashboard)
      localStorage.setItem('softwareControlEnabled', JSON.stringify(softwareControlEnabled));
      
      // Mark as clean
      setIsDirty(false);
      
      // Show success message
      setShowSuccessMessage(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
      console.log('✅ Software Control settings saved successfully:', {
        enabled: softwareControlEnabled,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error saving Software Control settings:', error);
      alert('Error saving settings. Please try again.');
    }
  };

  const handleReset = () => {
    if (isDirty) {
      setShowResetConfirm(true);
    }
  };

  const confirmReset = () => {
    try {
      // Reset to default (disabled)
      setSoftwareControlEnabled(false);
      localStorage.setItem('softwareControlEnabled', JSON.stringify(false));
      
      // Mark as clean
      setIsDirty(false);
      
      // Hide confirmation dialog
      setShowResetConfirm(false);
      
      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
      console.log('🔄 Software Control settings reset to default');
    } catch (error) {
      console.error('❌ Error resetting Software Control settings:', error);
      alert('Error resetting settings. Please try again.');
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '2px solid #007bff',
        paddingBottom: '10px'
      }}>
        <h2 style={{ margin: 0, color: '#007bff' }}>Software Control</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            style={{
              backgroundColor: isDirty ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: isDirty ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              opacity: isDirty ? 1 : 0.6
            }}
            onClick={handleSave}
            disabled={!isDirty}
            title={isDirty ? 'Save changes' : 'No changes to save'}
          >
            💾 Save
          </button>
          <button
            style={{
              backgroundColor: isDirty ? '#dc3545' : '#6c757d',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: isDirty ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              opacity: isDirty ? 1 : 0.6
            }}
            onClick={handleReset}
            disabled={!isDirty}
            title={isDirty ? 'Reset changes' : 'No changes to reset'}
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Settings Container */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '25px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid #dee2e6'
      }}>
        
        {/* Info Section */}
        <div style={{
          backgroundColor: '#e3f2fd',
          border: '1px solid #bbdefb',
          borderRadius: '4px',
          padding: '15px',
          marginBottom: '25px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#1565c0' }}>
            ℹ️ About Software Control
          </h4>
          <p style={{ margin: 0, color: '#1565c0', lineHeight: '1.5' }}>
            Enable this option to display database table information icons (ℹ️) throughout the application. 
            These icons provide transparency about which database tables are being used in each form, 
            helping developers and administrators understand the underlying data structure.
          </p>
        </div>

        {/* Toggle Control */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          border: '1px solid #e9ecef'
        }}>
          <div>
            <h4 style={{ margin: '0 0 5px 0', color: '#495057' }}>
              Show Database Table Information
            </h4>
            <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
              Display info icons (ℹ️) next to form titles showing the mapped database table names
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: 'bold',
              color: softwareControlEnabled ? '#28a745' : '#6c757d'
            }}>
              {softwareControlEnabled ? 'Enabled' : 'Disabled'}
            </span>
            
            <label style={{
              position: 'relative',
              display: 'inline-block',
              width: '60px',
              height: '34px'
            }}>
              <input
                type="checkbox"
                checked={softwareControlEnabled}
                onChange={handleToggle}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: softwareControlEnabled ? '#28a745' : '#ccc',
                transition: '.4s',
                borderRadius: '34px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '26px',
                  width: '26px',
                  left: softwareControlEnabled ? '30px' : '4px',
                  bottom: '4px',
                  backgroundColor: 'white',
                  transition: '.4s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>
        </div>

        {/* Preview Section */}
        {softwareControlEnabled && (
          <div style={{
            marginTop: '25px',
            padding: '20px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '6px'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#856404' }}>
              🔍 Preview
            </h4>
            <p style={{ margin: '0 0 15px 0', color: '#856404' }}>
              When enabled, forms will show info icons like this:
            </p>
            <div style={{
              backgroundColor: 'white',
              padding: '15px',
              borderRadius: '4px',
              border: '1px solid #dee2e6',
              display: 'flex',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, color: '#495057' }}>Item Master</h3>
              <span 
                style={{
                  fontSize: '16px',
                  color: '#007bff',
                  marginLeft: '8px',
                  cursor: 'help'
                }}
                title="Table: it_conf_item_master"
              >
                ℹ️
              </span>
              <span style={{ marginLeft: '10px', fontSize: '14px', color: '#6c757d' }}>
                (Hover over the ℹ️ icon to see table info)
              </span>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div style={{
          marginTop: '25px',
          padding: '15px',
          backgroundColor: '#f1f3f4',
          borderRadius: '4px',
          fontSize: '13px',
          color: '#5f6368'
        }}>
          <strong>Note:</strong> This feature can be moved to POS Control section in future updates. 
          Changes are automatically saved and will apply to all forms throughout the application.
        </div>
      </div>

      {/* Success Message Modal */}
      {showSuccessMessage && (
        <div style={{
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
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            minWidth: '400px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            border: '2px solid #28a745'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '15px'
            }}>
              ✅
            </div>
            <h3 style={{
              margin: '0 0 10px 0',
              color: '#28a745',
              fontSize: '1.3rem'
            }}>
              Control Updated Successfully!
            </h3>
            <p style={{
              margin: 0,
              color: '#666',
              fontSize: '14px'
            }}>
              Software Control settings have been saved and will apply immediately.
            </p>
            <button
              style={{
                marginTop: '20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              onClick={() => setShowSuccessMessage(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div style={{
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
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            minWidth: '400px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            border: '2px solid #dc3545'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '15px'
            }}>
              ⚠️
            </div>
            <h3 style={{
              margin: '0 0 10px 0',
              color: '#dc3545',
              fontSize: '1.3rem'
            }}>
              Reset Settings?
            </h3>
            <p style={{
              margin: '0 0 20px 0',
              color: '#666',
              fontSize: '14px'
            }}>
              This will discard your changes and reset Software Control to default settings.
            </p>
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center'
            }}>
              <button
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onClick={confirmReset}
              >
                Yes, Reset
              </button>
              <button
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onClick={() => setShowResetConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoftwareControl;