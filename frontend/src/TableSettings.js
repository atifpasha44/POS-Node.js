import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const initialState = {
  table_no: '',
  outlet_code: '',
  table_name: '',
  table_size: '',
  table_shape: 'rectangle',
  inactive: false
};

const TableSettings = ({ setParentDirty, records, setRecords, outletRecords }) => {
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
    
    if (!form.table_no.trim()) {
      errors.table_no = 'Table No is required';
    } else if (!/^\d+$/.test(form.table_no)) {
      errors.table_no = 'Table No must be numeric';
    }
    
    if (!form.outlet_code.trim()) {
      errors.outlet_code = 'Outlet Code is required';
    } else if (form.outlet_code.length > 10) {
      errors.outlet_code = 'Outlet Code must not exceed 10 characters';
    }
    
    if (!form.table_name.trim()) {
      errors.table_name = 'Table Name is required';
    } else if (form.table_name.length > 50) {
      errors.table_name = 'Table Name must not exceed 50 characters';
    }
    
    if (!form.table_size.trim()) {
      errors.table_size = 'Table Size is required';
    } else if (!/^\d+$/.test(form.table_size)) {
      errors.table_size = 'Table Size must be numeric';
    }
    
    if (!form.table_shape) {
      errors.table_shape = 'Table Shape is required';
    }
    
    // Check for duplicate table numbers within the same outlet
    if (records && records.length > 0) {
      const isDuplicate = records.some((record, index) => 
        index !== selectedRecordIdx && 
        record.outlet_code === form.outlet_code &&
        record.table_no === form.table_no
      );
      if (isDuplicate) {
        errors.table_no = 'Table No already exists for this outlet';
      }
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
      XLSX.utils.book_append_sheet(wb, ws, 'TableSettings');
      XLSX.writeFile(wb, 'TableSettings.xlsx');
    } else if (type === 'PDF') {
      const doc = new jsPDF();
      const columns = [
        'Table No', 'Outlet Code', 'Table Name', 'Table Size', 'Table Shape', 'Status'
      ];
      const rows = exportData.map(rec => [
        rec.table_no || '',
        rec.outlet_code || '',
        rec.table_name || '',
        rec.table_size || '',
        rec.table_shape || '',
        rec.inactive ? 'Inactive' : 'Active'
      ]);
      autoTable(doc, { head: [columns], body: rows });
      doc.save('TableSettings.pdf');
    }
  };

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
            Table Settings
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
          <button onClick={handleEdit} title="Modify/Edit" style={{background:'#e3eafc',border:'2px solid #1976d2',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#1976d2',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#bbdefb'} onMouseOut={e=>e.currentTarget.style.background='#e3eafc'}><span role="img" aria-label="Edit">✏️</span></button>
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
          ✅ Table Setting saved successfully!
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

      {/* Form Section - following OutletSetup pattern */}
      <form ref={formRef} className="propertycode-form" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 32px',padding:'32px 32px 0 32px'}} autoComplete="off">
        
        {/* Left column */}
        <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
          {/* Table No */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Table No</label>
            <div style={{width:'80%'}}>
              <input
                type="text"
                value={form.table_no}
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, '');
                  handleInputChange('table_no', value);
                }}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.table_no ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background: action !== 'Add' ? '#f3f3f3' : '#fff'
                }}
                placeholder="Enter table number"
                disabled={action !== 'Add'}
                required
              />
              {fieldErrors.table_no && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.table_no}
                </div>
              )}
            </div>
          </div>

          {/* Table Name */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Table Name</label>
            <div style={{width:'80%'}}>
              <input
                type="text"
                value={form.table_name}
                onChange={e => handleInputChange('table_name', e.target.value)}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.table_name ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
                placeholder="Enter table name"
                maxLength="50"
                required
              />
              {fieldErrors.table_name && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.table_name}
                </div>
              )}
            </div>
          </div>

          {/* Table Shape - Radio buttons in horizontal alignment */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Table Shape</label>
            <div style={{width:'80%'}}>
              <div style={{display:'flex',alignItems:'center',gap:'20px',flexWrap:'wrap'}}>
                <label style={{display:'flex',alignItems:'center',gap:'6px',cursor:'pointer'}}>
                  <input
                    type="radio"
                    name="table_shape"
                    value="rectangle"
                    checked={form.table_shape === 'rectangle'}
                    onChange={e => handleInputChange('table_shape', e.target.value)}
                    style={{transform:'scale(1.2)'}}
                  />
                  <span style={{fontSize:'1.05rem',fontWeight:'500',color:'#333'}}>Rectangle</span>
                </label>
                <label style={{display:'flex',alignItems:'center',gap:'6px',cursor:'pointer'}}>
                  <input
                    type="radio"
                    name="table_shape"
                    value="circle"
                    checked={form.table_shape === 'circle'}
                    onChange={e => handleInputChange('table_shape', e.target.value)}
                    style={{transform:'scale(1.2)'}}
                  />
                  <span style={{fontSize:'1.05rem',fontWeight:'500',color:'#333'}}>Circle</span>
                </label>
                <label style={{display:'flex',alignItems:'center',gap:'6px',cursor:'pointer'}}>
                  <input
                    type="radio"
                    name="table_shape"
                    value="rhombus"
                    checked={form.table_shape === 'rhombus'}
                    onChange={e => handleInputChange('table_shape', e.target.value)}
                    style={{transform:'scale(1.2)'}}
                  />
                  <span style={{fontSize:'1.05rem',fontWeight:'500',color:'#333'}}>Rhombus</span>
                </label>
              </div>
              {fieldErrors.table_shape && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.table_shape}
                </div>
              )}
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
                Check to mark this table as inactive
              </small>
            </div>
          </div>
        </div>
        
        {/* Right column */}
        <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
          {/* Outlet Code */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Outlet Code</label>
            <div style={{width:'80%'}}>
              <select
                value={form.outlet_code}
                onChange={e => handleInputChange('outlet_code', e.target.value)}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.outlet_code ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }}
                required
              >
                <option value="">Select Outlet Code</option>
                {outletRecords && outletRecords
                  .filter(outlet => outlet && outlet.outlet_code)
                  .map((outlet, index) => (
                    <option key={index} value={outlet.outlet_code}>
                      {outlet.outlet_code} - {outlet.outlet_name || 'Unnamed Outlet'}
                    </option>
                  ))
                }
              </select>
              {fieldErrors.outlet_code && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.outlet_code}
                </div>
              )}
            </div>
          </div>

          {/* Table Size */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Table Size</label>
            <div style={{width:'80%'}}>
              <input
                type="text"
                value={form.table_size}
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, '');
                  handleInputChange('table_size', value);
                }}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.table_size ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
                placeholder="Enter table size (number of seats)"
                required
              />
              {fieldErrors.table_size && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.table_size}
                </div>
              )}
              <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                Number of seats at this table
              </small>
            </div>
          </div>
        </div>

      </form>

      {/* Records Table */}
      {records && records.length > 0 && (
        <div style={{ padding: '20px 32px' }}>
          <h3 style={{ marginBottom: '16px', color: '#333' }}>Existing Table Settings</h3>
          <div style={{ overflowX: 'auto', border: '2px solid #ddd', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Table No</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Outlet Code</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Table Name</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Size</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Shape</th>
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
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{record.table_no}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{record.outlet_code}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{record.table_name}</td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>{record.table_size}</td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                      <span style={{ 
                        textTransform: 'capitalize',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        background: record.table_shape === 'rectangle' ? '#e3f2fd' : 
                                   record.table_shape === 'circle' ? '#f3e5f5' : '#fff3e0',
                        color: record.table_shape === 'rectangle' ? '#1976d2' : 
                               record.table_shape === 'circle' ? '#7b1fa2' : '#f57c00'
                      }}>
                        {record.table_shape}
                      </span>
                    </td>
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

export default TableSettings;