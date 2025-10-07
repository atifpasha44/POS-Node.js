import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const initialState = {
  property_code: '',
  format_name: '',
  format_type: '',
  paper_size: '',
  orientation: '',
  margin_top: '',
  margin_bottom: '',
  margin_left: '',
  margin_right: '',
  header_text: '',
  footer_text: '',
  font_size: '',
  inactive: false
};

// Sample data for the three report tables
const sampleKitchenTokenData = [
  { id: 1, name: 'Kitchen Token - Standard', type: 'Kitchen', status: 'Active' },
  { id: 2, name: 'Kitchen Token - Detailed', type: 'Kitchen', status: 'Active' },
  { id: 3, name: 'Bar Token - Standard', type: 'Bar', status: 'Inactive' }
];

const sampleBillFormatData = [
  { id: 1, name: 'Guest Bill - Standard', type: 'Guest', status: 'Active' },
  { id: 2, name: 'Guest Bill - Detailed', type: 'Guest', status: 'Active' },
  { id: 3, name: 'Settlement Bill', type: 'Settlement', status: 'Active' }
];

const sampleCustomizedFormatData = [
  { id: 1, name: 'Receipt - Thermal', type: 'Receipt', status: 'Active' },
  { id: 2, name: 'Invoice - A4', type: 'Invoice', status: 'Active' },
  { id: 3, name: 'Report - Summary', type: 'Report', status: 'Inactive' }
];

const PrintFormats = ({ setParentDirty, records, setRecords }) => {
  const [isDirty, setIsDirty] = useState(false);
  const [form, setForm] = useState(initialState);
  const [action, setAction] = useState('Add');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedRecordIdx, setSelectedRecordIdx] = useState(null);
  const [selectModalMessage, setSelectModalMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const formRef = useRef(null);

  // Validation function
  const validateForm = () => {
    const errors = {};
    
    if (!form.property_code.trim()) {
      errors.property_code = 'Property Code is required';
    }
    
    if (!form.format_name.trim()) {
      errors.format_name = 'Format Name is required';
    } else if (form.format_name.length > 50) {
      errors.format_name = 'Format Name must not exceed 50 characters';
    }
    
    if (!form.format_type) {
      errors.format_type = 'Format Type is required';
    }
    
    if (!form.paper_size) {
      errors.paper_size = 'Paper Size is required';
    }
    
    if (!form.orientation) {
      errors.orientation = 'Orientation is required';
    }
    
    if (form.margin_top && (isNaN(form.margin_top) || form.margin_top < 0)) {
      errors.margin_top = 'Margin Top must be a valid positive number';
    }
    
    if (form.margin_bottom && (isNaN(form.margin_bottom) || form.margin_bottom < 0)) {
      errors.margin_bottom = 'Margin Bottom must be a valid positive number';
    }
    
    if (form.margin_left && (isNaN(form.margin_left) || form.margin_left < 0)) {
      errors.margin_left = 'Margin Left must be a valid positive number';
    }
    
    if (form.margin_right && (isNaN(form.margin_right) || form.margin_right < 0)) {
      errors.margin_right = 'Margin Right must be a valid positive number';
    }
    
    if (form.font_size && (isNaN(form.font_size) || form.font_size < 6 || form.font_size > 72)) {
      errors.font_size = 'Font Size must be between 6 and 72';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = () => {
    setAction('Add');
    setSelectedRecordIdx(null);
    setForm(initialState);
    setFieldErrors({});
  };

  const handleEdit = () => {
    if (selectedRecordIdx === null) {
      setSelectModalMessage('Please select a record to edit.');
      setShowSelectModal(true);
      return;
    }
    setAction('Edit');
    setForm(records[selectedRecordIdx]);
    setFieldErrors({});
  };

  const handleDelete = () => {
    if (selectedRecordIdx === null) {
      setSelectModalMessage('Please select a record to delete.');
      setShowSelectModal(true);
      return;
    }
    setAction('Delete');
  };

  const handleSearch = () => {
    if (selectedRecordIdx === null) {
      setSelectModalMessage('Please select a record to search.');
      setShowSelectModal(true);
      return;
    }
    setAction('Search');
    setForm(records[selectedRecordIdx]);
  };

  const handleClear = () => {
    setForm(initialState);
    setSelectedRecordIdx(null);
    setAction('Add');
    setFieldErrors({});
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    setShowSavePopup(true);
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
    
    // Auto-hide popup after 2 seconds
    setTimeout(() => {
      setShowSavePopup(false);
    }, 2000);
  };

  const handleInputChange = (field, value) => {
    setForm({ ...form, [field]: value });
    setIsDirty(true);
    if (setParentDirty) setParentDirty(true);
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: '' });
    }
  };

  // Export handlers
  const handleExport = type => {
    const exportData = records && records.length > 0 ? records : [form];
    
    if (type === 'Excel') {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'PrintFormats');
      XLSX.writeFile(wb, 'PrintFormats.xlsx');
    } else if (type === 'PDF') {
      const doc = new jsPDF();
      const columns = [
        'Property Code', 'Format Name', 'Format Type', 'Paper Size', 'Orientation',
        'Margins', 'Font Size', 'Status'
      ];
      const rows = exportData.map(rec => [
        rec.property_code || '',
        rec.format_name || '',
        rec.format_type || '',
        rec.paper_size || '',
        rec.orientation || '',
        `T:${rec.margin_top || 0} B:${rec.margin_bottom || 0} L:${rec.margin_left || 0} R:${rec.margin_right || 0}`,
        rec.font_size || '',
        rec.inactive ? 'Inactive' : 'Active'
      ]);
      autoTable(doc, { head: [columns], body: rows });
      doc.save('PrintFormats.pdf');
    }
  };

  // Render table function for report sections
  const renderReportTable = (data, title) => (
    <div style={{
      flex: '1',
      minWidth: '300px',
      maxWidth: '350px',
      background: '#fff',
      border: '2px solid #ddd',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        background: '#f8f9fa',
        padding: '12px',
        borderBottom: '2px solid #ddd',
        textAlign: 'center'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '1.1rem',
          fontWeight: 'bold',
          color: '#333'
        }}>
          {title}
        </h3>
      </div>
      <div style={{ height: '200px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f1f1' }}>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.9rem', borderBottom: '1px solid #ddd' }}>Name</th>
              <th style={{ padding: '8px', textAlign: 'center', fontSize: '0.9rem', borderBottom: '1px solid #ddd' }}>Type</th>
              <th style={{ padding: '8px', textAlign: 'center', fontSize: '0.9rem', borderBottom: '1px solid #ddd' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} style={{ cursor: 'pointer' }}>
                <td style={{ padding: '8px', fontSize: '0.85rem', borderBottom: '1px solid #eee' }}>{item.name}</td>
                <td style={{ padding: '8px', textAlign: 'center', fontSize: '0.85rem', borderBottom: '1px solid #eee' }}>{item.type}</td>
                <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    background: item.status === 'Active' ? '#e8f5e8' : '#ffebee',
                    color: item.status === 'Active' ? '#2e7d32' : '#c62828'
                  }}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="propertycode-panel" style={{
      background:'#fff',
      border:'2.5px solid #222',
      borderRadius:'16px',
      boxShadow:'0 2px 12px rgba(0,0,0,0.10)',
      width:'100%',
      maxWidth:'1200px',
      margin:'32px auto',
      padding:'0 0 18px 0',
      height:'calc(100vh - 120px)',
      display:'flex',
      flexDirection:'column',
      overflowY:'auto',
      position:'relative'
    }}>
      {/* Top Control Bar - sticky */}
      <div style={{
        display:'flex',
        alignItems:'center',
        justifyContent:'space-between',
        borderBottom:'2px solid #e0e0e0',
        padding:'12px 18px 8px 18px',
        minWidth:0,
        position:'sticky',
        top:0,
        zIndex:10,
        background:'#fff',
        boxShadow:'0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',minWidth:0,flexWrap:'wrap'}}>
          <span style={{fontWeight:'bold',fontSize:'2rem',color:'#222',marginRight:'18px'}}>
            Print Formats
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
              setAction(val);
            }}
            style={{
              background:'#f8f9fa',
              border:'2px solid #dee2e6',
              borderRadius:'8px',
              padding:'6px 12px',
              fontSize:'0.9rem',
              fontWeight:'bold',
              color:'#495057',
              marginRight:'12px'
            }}
          >
            <option value="Add">Action</option>
            <option value="Add">Add</option>
            <option value="Edit">Edit</option>
            <option value="Delete">Delete</option>
            <option value="Search">Search</option>
          </select>
          <button onClick={handleAdd} title="Add" style={{background:'#e3fcec',border:'2px solid #43a047',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#43a047',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#c8e6c9'} onMouseOut={e=>e.currentTarget.style.background='#e3fcec'}><span role="img" aria-label="Add">➕</span></button>
          <button onClick={handleEdit} title="Edit" style={{background:'#e3eafc',border:'2px solid #1976d2',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#1976d2',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#bbdefb'} onMouseOut={e=>e.currentTarget.style.background='#e3eafc'}><span role="img" aria-label="Edit">✏️</span></button>
          <button onClick={handleDelete} title="Delete" style={{background:'#ffebee',border:'2px solid #e53935',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#e53935',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#ffcdd2'} onMouseOut={e=>e.currentTarget.style.background='#ffebee'}><span role="img" aria-label="Delete">🗑️</span></button>
          <button onClick={handleSearch} title="Search" style={{background:'#fffde7',border:'2px solid #fbc02d',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#fbc02d',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#fff9c4'} onMouseOut={e=>e.currentTarget.style.background='#fffde7'}><span role="img" aria-label="Search">🔍</span></button>
          <button onClick={handleClear} title="Clear" style={{background:'#f3e5f5',border:'2px solid #8e24aa',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#8e24aa',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#e1bee7'} onMouseOut={e=>e.currentTarget.style.background='#f3e5f5'}><span role="img" aria-label="Clear">🧹</span></button>
          <button onClick={handleSave} title="Save" style={{background:'#e3f2fd',border:'2px solid #1976d2',borderRadius:'8px',fontWeight:'bold',color:'#1976d2',fontSize:'1.15rem',padding:'4px 18px',marginLeft:'8px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#bbdefb'} onMouseOut={e=>e.currentTarget.style.background='#e3f2fd'}><span style={{fontWeight:'bold'}}><span role="img" aria-label="Save">💾</span> SAVE</span></button>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'16px',minWidth:0,flexWrap:'wrap'}}>
          <span style={{fontSize:'1.08rem',color:'#888',marginRight:'8px',whiteSpace:'nowrap'}}>Export Report to</span>
          <span
            title="Export to Excel"
            style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:'40px',height:'40px',borderRadius:'50%',background:'#e8f5e9',boxShadow:'0 2px 8px rgba(76,175,80,0.10)',cursor:'pointer',border:'2px solid #43a047',marginRight:'6px',transition:'background 0.2s'}}
            onClick={()=>handleExport('Excel')}
            onMouseOver={e=>e.currentTarget.style.background='#c8e6c9'}
            onMouseOut={e=>e.currentTarget.style.background='#e8f5e9'}
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#43a047"/>
              <text x="16" y="21" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#fff">X</text>
              <text x="24" y="21" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#fff">L</text>
            </svg>
          </span>
          <span
            title="Export to PDF"
            style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:'40px',height:'40px',borderRadius:'50%',background:'#ffebee',boxShadow:'0 2px 8px rgba(229,57,53,0.10)',cursor:'pointer',border:'2px solid #e53935',marginRight:'6px',transition:'background 0.2s'}}
            onClick={()=>handleExport('PDF')}
            onMouseOver={e=>e.currentTarget.style.background='#ffcdd2'}
            onMouseOut={e=>e.currentTarget.style.background='#ffebee'}
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#e53935"/>
              <text x="16" y="21" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff">PDF</text>
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
          padding: '20px 30px',
          borderRadius: '8px',
          border: '2px solid #c3e6cb',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          fontSize: '1.1rem',
          fontWeight: 'bold'
        }}>
          ✅ Print Format saved successfully!
        </div>
      )}

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

      {/* Form Section - matching PropertyCode pattern */}
      <form ref={formRef} className="propertycode-form" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 32px',padding:'32px 32px 0 32px'}} autoComplete="off">
        
        {/* Left column */}
        <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
          {/* Property Code */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Property Code</label>
            <div style={{width:'80%'}}>
              <select
                value={form.property_code}
                onChange={e => handleInputChange('property_code', e.target.value)}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.property_code ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }}
                required
              >
                <option value="">Select Property Code</option>
                <option value="PROP001">PROP001 - Hotel ABC</option>
                <option value="PROP002">PROP002 - Restaurant XYZ</option>
                <option value="PROP003">PROP003 - Cafe 123</option>
              </select>
              {fieldErrors.property_code && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.property_code}
                </div>
              )}
            </div>
          </div>

          {/* Format Name */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Format Name</label>
            <div style={{width:'80%'}}>
              <input
                type="text"
                value={form.format_name}
                onChange={e => handleInputChange('format_name', e.target.value)}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.format_name ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
                placeholder="Enter format name"
                maxLength="50"
                required
              />
              {fieldErrors.format_name && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.format_name}
                </div>
              )}
            </div>
          </div>

          {/* Format Type */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Format Type</label>
            <div style={{width:'80%'}}>
              <select
                value={form.format_type}
                onChange={e => handleInputChange('format_type', e.target.value)}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.format_type ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }}
                required
              >
                <option value="">Select Format Type</option>
                <option value="kitchen-token">Kitchen Token</option>
                <option value="bill-format">Bill Format</option>
                <option value="customized-format">Customized Format</option>
                <option value="receipt">Receipt</option>
                <option value="invoice">Invoice</option>
              </select>
              {fieldErrors.format_type && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.format_type}
                </div>
              )}
            </div>
          </div>

          {/* Paper Size */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Paper Size</label>
            <div style={{width:'80%'}}>
              <select
                value={form.paper_size}
                onChange={e => handleInputChange('paper_size', e.target.value)}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.paper_size ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }}
                required
              >
                <option value="">Select Paper Size</option>
                <option value="A4">A4 (210 x 297 mm)</option>
                <option value="A5">A5 (148 x 210 mm)</option>
                <option value="Letter">Letter (8.5 x 11 inch)</option>
                <option value="Thermal58">Thermal 58mm</option>
                <option value="Thermal80">Thermal 80mm</option>
                <option value="Custom">Custom Size</option>
              </select>
              {fieldErrors.paper_size && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.paper_size}
                </div>
              )}
            </div>
          </div>

          {/* Orientation */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Orientation</label>
            <div style={{width:'80%'}}>
              <select
                value={form.orientation}
                onChange={e => handleInputChange('orientation', e.target.value)}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.orientation ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }}
                required
              >
                <option value="">Select Orientation</option>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
              {fieldErrors.orientation && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.orientation}
                </div>
              )}
            </div>
          </div>

          {/* Font Size */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Font Size</label>
            <div style={{width:'80%'}}>
              <input
                type="number"
                value={form.font_size}
                onChange={e => handleInputChange('font_size', e.target.value)}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.font_size ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
                placeholder="Font size (6-72)"
                min="6"
                max="72"
              />
              {fieldErrors.font_size && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.font_size}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right column */}
        <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
          {/* Margin Top */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Margin Top (mm)</label>
            <div style={{width:'80%'}}>
              <input
                type="number"
                value={form.margin_top}
                onChange={e => handleInputChange('margin_top', e.target.value)}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.margin_top ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
                placeholder="Top margin in mm"
                min="0"
              />
              {fieldErrors.margin_top && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.margin_top}
                </div>
              )}
            </div>
          </div>

          {/* Margin Bottom */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Margin Bottom (mm)</label>
            <div style={{width:'80%'}}>
              <input
                type="number"
                value={form.margin_bottom}
                onChange={e => handleInputChange('margin_bottom', e.target.value)}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.margin_bottom ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
                placeholder="Bottom margin in mm"
                min="0"
              />
              {fieldErrors.margin_bottom && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.margin_bottom}
                </div>
              )}
            </div>
          </div>

          {/* Margin Left */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Margin Left (mm)</label>
            <div style={{width:'80%'}}>
              <input
                type="number"
                value={form.margin_left}
                onChange={e => handleInputChange('margin_left', e.target.value)}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.margin_left ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
                placeholder="Left margin in mm"
                min="0"
              />
              {fieldErrors.margin_left && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.margin_left}
                </div>
              )}
            </div>
          </div>

          {/* Margin Right */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Margin Right (mm)</label>
            <div style={{width:'80%'}}>
              <input
                type="number"
                value={form.margin_right}
                onChange={e => handleInputChange('margin_right', e.target.value)}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.margin_right ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
                placeholder="Right margin in mm"
                min="0"
              />
              {fieldErrors.margin_right && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.margin_right}
                </div>
              )}
            </div>
          </div>

          {/* Header Text */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Header Text</label>
            <div style={{width:'80%'}}>
              <textarea
                value={form.header_text}
                onChange={e => handleInputChange('header_text', e.target.value)}
                style={{
                  width:'100%',
                  height:'60px',
                  fontSize:'1.08rem',
                  border:'2px solid #bbb',
                  borderRadius:'6px',
                  padding:'8px',
                  resize:'vertical'
                }}
                placeholder="Enter header text (optional)"
                maxLength="200"
              />
            </div>
          </div>

          {/* Footer Text */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Footer Text</label>
            <div style={{width:'80%'}}>
              <textarea
                value={form.footer_text}
                onChange={e => handleInputChange('footer_text', e.target.value)}
                style={{
                  width:'100%',
                  height:'60px',
                  fontSize:'1.08rem',
                  border:'2px solid #bbb',
                  borderRadius:'6px',
                  padding:'8px',
                  resize:'vertical'
                }}
                placeholder="Enter footer text (optional)"
                maxLength="200"
              />
            </div>
          </div>

          {/* Inactive Status */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Status</label>
            <div style={{width:'80%'}}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.inactive}
                  onChange={e => handleInputChange('inactive', e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
                <span style={{ fontWeight: 'bold', color: '#222' }}>Inactive</span>
              </label>
              <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                Check to mark this print format as inactive
              </small>
            </div>
          </div>
        </div>

      </form>

      {/* Report Section - Three evenly aligned tables */}
      <div style={{ 
        padding: '32px 32px 20px 32px',
        borderTop: '2px solid #e0e0e0',
        marginTop: '20px'
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '24px',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#333'
        }}>
          Print Format Reports
        </h2>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '20px',
          flexWrap: 'wrap'
        }}>
          {renderReportTable(sampleKitchenTokenData, 'Kitchen Token')}
          {renderReportTable(sampleBillFormatData, 'Bill Format')}
          {renderReportTable(sampleCustomizedFormatData, 'Customized Format')}
        </div>
      </div>

      {/* Records Table */}
      {records && records.length > 0 && (
        <div style={{ padding: '20px 32px' }}>
          <h3 style={{ marginBottom: '16px', color: '#333' }}>Existing Print Formats</h3>
          <div style={{ overflowX: 'auto', border: '2px solid #ddd', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Property</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Format Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Paper Size</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Orientation</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr 
                    key={index} 
                    style={{ 
                      background: selectedRecordIdx === index ? '#e3f2fd' : '#fff',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedRecordIdx(index)}
                  >
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{record.property_code}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{record.format_name}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{record.format_type}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{record.paper_size}</td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>{record.orientation}</td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.8rem',
                        background: record.inactive ? '#ffebee' : '#e8f5e8',
                        color: record.inactive ? '#c62828' : '#2e7d32'
                      }}>
                        {record.inactive ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default PrintFormats;