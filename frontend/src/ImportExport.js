import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

const initialState = {
  selectedFile: null,
  replaceExisting: 'no',
  exportFormat: 'xlsx',
  selectedFields: []
};

const availableFields = [
  { id: 'outlet_code', label: 'Outlet Code', checked: false },
  { id: 'item_code', label: 'Item Code', checked: false },
  { id: 'item_name', label: 'Item Name', checked: false },
  { id: 'short_name', label: 'Short Name', checked: false },
  { id: 'alt_name', label: 'Alt Name', checked: false },
  { id: 'price_1', label: 'Price 1', checked: false },
  { id: 'price_2', label: 'Price 2', checked: false },
  { id: 'price_3', label: 'Price 3', checked: false },
  { id: 'price_4', label: 'Price 4', checked: false },
  { id: 'item_dept', label: 'Item Dept', checked: false },
  { id: 'item_cat', label: 'Item Cat', checked: false },
  { id: 'item_cost', label: 'Item Cost', checked: false },
  { id: 'tax_code', label: 'Tax Code', checked: false },
  { id: 'printer_1', label: 'Printer 1', checked: false },
  { id: 'printer_2', label: 'Printer 2', checked: false },
  { id: 'printer_3', label: 'Printer 3', checked: false },
  { id: 'print_group', label: 'Print Group', checked: false },
  { id: 'unit', label: 'Unit', checked: false },
  { id: 'modifier_group', label: 'Modifier Group', checked: false }
];

export default function ImportExport({ setParentDirty, records, setRecords }) {
  const [isDirty, setIsDirty] = useState(false);
  const [form, setForm] = useState(initialState);
  const [action, setAction] = useState('Add');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedRecordIdx, setSelectedRecordIdx] = useState(null);
  const [selectModalMessage, setSelectModalMessage] = useState('');
  const [fields, setFields] = useState(availableFields);
  const [importProgress, setImportProgress] = useState('');
  const [exportProgress, setExportProgress] = useState('');
  const fileInputRef = useRef(null);

  // Standard action handlers to match pattern
  const handleAdd = () => {
    setAction('Add');
    setSelectedRecordIdx(null);
    setForm(initialState);
    setFields(availableFields.map(f => ({ ...f, checked: false })));
  };

  const handleEdit = () => {
    setAction('Edit');
    setShowSelectModal(true);
    setSelectModalMessage('Please select a record to edit.');
  };

  const handleDelete = () => {
    setAction('Delete');
    setShowSelectModal(true);
    setSelectModalMessage('Please select a record to delete.');
  };

  const handleSearch = () => {
    setAction('Search');
    setShowSelectModal(true);
    setSelectModalMessage('Search for Import/Export records and click "View" to see full details in read-only mode.');
  };

  const handleClear = () => {
    setForm(initialState);
    setFields(availableFields.map(f => ({ ...f, checked: false })));
    setImportProgress('');
    setExportProgress('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    // Save import/export configuration
    const saveRecord = {
      ...form,
      selectedFields: fields.filter(f => f.checked).map(f => f.id),
      created_at: new Date().toISOString(),
      id: Date.now()
    };

    setRecords(prev => [...prev, saveRecord]);
    setShowSavePopup(true);
    setTimeout(() => setShowSavePopup(false), 3000);
    handleClear();
  };

  const handleExport = (format) => {
    // Standard export functionality for header buttons
    const exportData = records.map(record => ({
      'Action': record.action || 'Import/Export',
      'File Format': record.exportFormat || 'N/A',
      'Selected Fields': record.selectedFields ? record.selectedFields.join(', ') : 'N/A',
      'Replace Existing': record.replaceExisting || 'N/A',
      'Created': new Date(record.created_at).toLocaleDateString()
    }));

    if (format === 'Excel') {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'ImportExport');
      XLSX.writeFile(wb, 'ImportExport.xlsx');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['.zip', '.csv', '.xlsx'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        alert('Please select a valid file format (.zip, .csv, or .xlsx)');
        e.target.value = '';
        return;
      }

      setForm(prev => ({ ...prev, selectedFile: file }));
    }
  };

  const handleImport = async () => {
    if (!form.selectedFile) {
      alert('Please select a file to import.');
      return;
    }

    setImportProgress('Processing import...');
    
    try {
      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const importRecord = {
        action: 'Import',
        fileName: form.selectedFile.name,
        fileSize: (form.selectedFile.size / 1024).toFixed(2) + ' KB',
        replaceExisting: form.replaceExisting,
        importedAt: new Date().toISOString(),
        id: Date.now()
      };

      setRecords(prev => [...prev, importRecord]);
      setImportProgress('Import completed successfully!');
      setTimeout(() => setImportProgress(''), 3000);
      
    } catch (error) {
      setImportProgress('Import failed. Please try again.');
      setTimeout(() => setImportProgress(''), 5000);
    }
  };

  const handleDataExport = async () => {
    const selectedFields = fields.filter(f => f.checked);
    
    if (selectedFields.length === 0) {
      alert('Please select at least one field to export.');
      return;
    }

    setExportProgress('Generating export file...');

    try {
      // Simulate data export
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock data for export
      const mockData = Array.from({ length: 50 }, (_, i) => {
        const item = {};
        selectedFields.forEach(field => {
          switch (field.id) {
            case 'outlet_code':
              item[field.id] = `OUT${String(i + 1).padStart(3, '0')}`;
              break;
            case 'item_code':
              item[field.id] = `ITM${String(i + 1).padStart(4, '0')}`;
              break;
            case 'item_name':
              item[field.id] = `Item ${i + 1}`;
              break;
            case 'price_1':
            case 'price_2':
            case 'price_3':
            case 'price_4':
              item[field.id] = (Math.random() * 100 + 10).toFixed(2);
              break;
            default:
              item[field.id] = `Value ${i + 1}`;
          }
        });
        return item;
      });

      if (form.exportFormat === 'xlsx') {
        const ws = XLSX.utils.json_to_sheet(mockData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'ItemData');
        XLSX.writeFile(wb, 'ItemDataExport.xlsx');
      } else if (form.exportFormat === 'csv') {
        const ws = XLSX.utils.json_to_sheet(mockData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ItemDataExport.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      }

      setExportProgress('Export completed successfully!');
      setTimeout(() => setExportProgress(''), 3000);
      
    } catch (error) {
      setExportProgress('Export failed. Please try again.');
      setTimeout(() => setExportProgress(''), 5000);
    }
  };

  const handleFieldChange = (fieldId) => {
    setFields(prev => prev.map(field => 
      field.id === fieldId 
        ? { ...field, checked: !field.checked }
        : field
    ));
  };

  const handleSelectAll = () => {
    const allSelected = fields.every(f => f.checked);
    setFields(prev => prev.map(field => ({ ...field, checked: !allSelected })));
  };

  const handleReset = () => {
    setFields(prev => prev.map(field => ({ ...field, checked: false })));
  };

  return (
    <div className="propertycode-page" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 32px',
        height: '80px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 'bold', fontSize: '2rem', color: '#222', marginRight: '18px' }}>
            Import / Export
          </span>
          <select
            value={action}
            onChange={e => {
              const val = e.target.value;
              if (val === 'Add') {
                handleAdd();
              } else if (val === 'Edit') {
                handleEdit();
              } else if (val === 'Delete') {
                handleDelete();
              } else if (val === 'Search') {
                handleSearch();
              }
            }}
            style={{ fontWeight: 'bold', fontSize: '1rem', padding: '4px 12px', borderRadius: '6px', border: '1.5px solid #bbb', marginRight: '8px' }}
          >
            <option value="Add">Action</option>
            <option value="Add">Add</option>
            <option value="Edit">Edit</option>
            <option value="Delete">Delete</option>
            <option value="Search">Search</option>
          </select>
          <button onClick={handleAdd} title="Add" style={{ background: '#e3fcec', border: '2px solid #43a047', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#43a047', marginRight: '4px', cursor: 'pointer', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#c8e6c9'} onMouseOut={e => e.currentTarget.style.background = '#e3fcec'}><span role="img" aria-label="Add">➕</span></button>
          <button onClick={handleEdit} title="Modify/Edit" style={{ background: '#e3eafc', border: '2px solid #1976d2', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#1976d2', marginRight: '4px', cursor: 'pointer', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#bbdefb'} onMouseOut={e => e.currentTarget.style.background = '#e3eafc'}><span role="img" aria-label="Edit">✏️</span></button>
          <button onClick={handleDelete} title="Delete" style={{ background: '#ffebee', border: '2px solid #e53935', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#e53935', marginRight: '4px', cursor: 'pointer', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#ffcdd2'} onMouseOut={e => e.currentTarget.style.background = '#ffebee'}><span role="img" aria-label="Delete">🗑️</span></button>
          <button onClick={handleSearch} title="Search" style={{ background: '#fffde7', border: '2px solid #fbc02d', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#fbc02d', marginRight: '4px', cursor: 'pointer', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#fff9c4'} onMouseOut={e => e.currentTarget.style.background = '#fffde7'}><span role="img" aria-label="Search">🔍</span></button>
          <button
            type="button"
            onClick={handleClear}
            title="Clear"
            style={{ background: '#f3e5f5', border: '2px solid #8e24aa', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#8e24aa', marginRight: '4px', cursor: 'pointer', transition: '0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = '#e1bee7'}
            onMouseOut={e => e.currentTarget.style.background = '#f3e5f5'}
          >
            <span role="img" aria-label="Clear">🧹</span>
          </button>
          <button onClick={handleSave} title="Save" style={{ background: '#e3f2fd', border: '2px solid #1976d2', borderRadius: '8px', fontWeight: 'bold', color: '#1976d2', fontSize: '1.15rem', padding: '4px 18px', marginLeft: '8px', cursor: 'pointer', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#bbdefb'} onMouseOut={e => e.currentTarget.style.background = '#e3f2fd'}><span style={{ fontWeight: 'bold' }}><span role="img" aria-label="Save">💾</span> SAVE</span></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.08rem', color: '#888', marginRight: '8px', whiteSpace: 'nowrap' }}>Export Report to</span>
          <span
            title="Export to Excel"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: '#e8f5e9', boxShadow: '0 2px 8px rgba(76,175,80,0.10)', cursor: 'pointer', border: '2px solid #43a047', marginRight: '6px', transition: 'background 0.2s' }}
            onClick={() => handleExport('Excel')}
            onMouseOver={e => e.currentTarget.style.background = '#c8e6c9'}
            onMouseOut={e => e.currentTarget.style.background = '#e8f5e9'}
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#43a047"/>
              <text x="16" y="21" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#fff">X</text>
              <text x="24" y="21" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#fff">L</text>
            </svg>
          </span>
          <span
            title="Export to PDF"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: '#ffebee', boxShadow: '0 2px 8px rgba(229,57,53,0.10)', cursor: 'pointer', border: '2px solid #e53935', marginRight: '6px', transition: 'background 0.2s' }}
            onClick={() => handleExport('PDF')}
            onMouseOver={e => e.currentTarget.style.background = '#ffcdd2'}
            onMouseOut={e => e.currentTarget.style.background = '#ffebee'}
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#e53935"/>
              <text x="16" y="21" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#fff">P</text>
              <text x="24" y="21" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#fff">D</text>
              <text x="32" y="21" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#fff">F</text>
            </svg>
          </span>
        </div>
      </div>

      {/* Save Success popup */}
      {showSavePopup && (
        <div style={{
          position: 'fixed',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#d4edda',
          color: '#155724',
          padding: '20px 40px',
          borderRadius: '8px',
          border: '1px solid #c3e6cb',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000
        }}>
          Import/Export configuration saved successfully!
        </div>
      )}

      {/* Main Content */}
      <div style={{ display: 'flex', gap: '20px', padding: '20px', minHeight: 'calc(100vh - 140px)' }}>
        
        {/* Import Section */}
        <div style={{
          flex: '1',
          background: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            color: '#333', 
            fontSize: '1.5rem', 
            marginBottom: '20px',
            borderBottom: '2px solid #f0f0f0',
            paddingBottom: '10px'
          }}>
            ⚙️ Import Section
          </h2>

          {/* File Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontWeight: 'bold', 
              marginBottom: '8px',
              color: '#555'
            }}>
              Source of File:
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,.csv,.xlsx"
              onChange={handleFileSelect}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
            <p style={{ 
              fontSize: '0.9rem', 
              color: '#666', 
              marginTop: '5px',
              fontStyle: 'italic'
            }}>
              Accepts .zip, .csv, or .xlsx formats
            </p>
          </div>

          {/* Replace Option */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontWeight: 'bold', 
              marginBottom: '8px',
              color: '#555'
            }}>
              Replace Item's Name if exists:
            </label>
            <div style={{ display: 'flex', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="replaceExisting"
                  value="yes"
                  checked={form.replaceExisting === 'yes'}
                  onChange={e => setForm(prev => ({ ...prev, replaceExisting: e.target.value }))}
                  style={{ marginRight: '8px' }}
                />
                Yes
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="replaceExisting"
                  value="no"
                  checked={form.replaceExisting === 'no'}
                  onChange={e => setForm(prev => ({ ...prev, replaceExisting: e.target.value }))}
                  style={{ marginRight: '8px' }}
                />
                No
              </label>
            </div>
          </div>

          {/* Import Button */}
          <button
            onClick={handleImport}
            style={{
              background: '#28a745',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: '0.2s',
              marginBottom: '20px'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#218838'}
            onMouseOut={e => e.currentTarget.style.background = '#28a745'}
          >
            📤 Import
          </button>

          {/* Import Progress */}
          {importProgress && (
            <div style={{
              background: importProgress.includes('failed') ? '#f8d7da' : '#d4edda',
              color: importProgress.includes('failed') ? '#721c24' : '#155724',
              padding: '10px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '0.95rem'
            }}>
              {importProgress}
            </div>
          )}

          {/* Import Rules */}
          <div style={{
            background: '#f8f9fa',
            padding: '16px',
            borderRadius: '6px',
            border: '1px solid #e9ecef'
          }}>
            <h4 style={{ color: '#495057', marginBottom: '10px' }}>Import Rules:</h4>
            <ul style={{ color: '#6c757d', fontSize: '0.9rem', marginLeft: '20px' }}>
              <li>Only one zipped CSV or XLSX file can be imported at a time.</li>
              <li>CSV files must be in UTF-8 encoding.</li>
              <li>If item code or menu code is missing, that record is not updated.</li>
              <li>Duplicate item codes will be handled based on "Replace" setting above.</li>
            </ul>
          </div>
        </div>

        {/* Export Section */}
        <div style={{
          flex: '1',
          background: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            color: '#333', 
            fontSize: '1.5rem', 
            marginBottom: '20px',
            borderBottom: '2px solid #f0f0f0',
            paddingBottom: '10px'
          }}>
            📤 Export Section
          </h2>

          {/* File Format Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontWeight: 'bold', 
              marginBottom: '8px',
              color: '#555'
            }}>
              File Format:
            </label>
            <select
              value={form.exportFormat}
              onChange={e => setForm(prev => ({ ...prev, exportFormat: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            >
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
            </select>
          </div>

          {/* Available Fields */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ 
                fontWeight: 'bold',
                color: '#555'
              }}>
                Available Fields:
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleSelectAll}
                  style={{
                    background: '#007bff',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  {fields.every(f => f.checked) ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={handleReset}
                  style={{
                    background: '#6c757d',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
            
            <div style={{
              border: '2px solid #ddd',
              borderRadius: '6px',
              padding: '15px',
              maxHeight: '300px',
              overflowY: 'auto',
              background: '#fafafa'
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '10px' 
              }}>
                {fields.map(field => (
                  <label key={field.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    padding: '4px'
                  }}>
                    <input
                      type="checkbox"
                      checked={field.checked}
                      onChange={() => handleFieldChange(field.id)}
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ fontSize: '0.95rem', color: '#495057' }}>
                      {field.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <p style={{ 
              fontSize: '0.9rem', 
              color: '#666', 
              marginTop: '8px',
              textAlign: 'center'
            }}>
              Selected: {fields.filter(f => f.checked).length} of {fields.length} fields
            </p>
          </div>

          {/* Export Button */}
          <button
            onClick={handleDataExport}
            style={{
              background: '#17a2b8',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: '0.2s',
              width: '100%',
              marginBottom: '15px'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#138496'}
            onMouseOut={e => e.currentTarget.style.background = '#17a2b8'}
          >
            📥 Export Data
          </button>

          {/* Export Progress */}
          {exportProgress && (
            <div style={{
              background: exportProgress.includes('failed') ? '#f8d7da' : '#d1ecf1',
              color: exportProgress.includes('failed') ? '#721c24' : '#0c5460',
              padding: '10px',
              borderRadius: '6px',
              fontSize: '0.95rem',
              textAlign: 'center'
            }}>
              {exportProgress}
            </div>
          )}
        </div>
      </div>

      {/* Select Modal */}
      {showSelectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: '24px',
            borderRadius: '8px',
            minWidth: '400px',
            textAlign: 'center'
          }}>
            <h3>Information</h3>
            <p>{selectModalMessage}</p>
            <button
              onClick={() => setShowSelectModal(false)}
              style={{
                background: '#007bff',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}