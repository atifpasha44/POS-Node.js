import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const initialState = {
  property_code: '',
  discount_code: '',
  discount_name: '',
  short_name: '',
  display_sequence: '',
  discount_type: '',
  apply_to: '',
  discount_calc: '',
  discount_rate: '',
  max_limit_amount: '',
  discount_approval: false,
  inactive: false
};

const DiscountType = ({ setParentDirty, records, setRecords }) => {
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
    
    if (!form.discount_code.trim()) {
      errors.discount_code = 'Discount Code is required';
    } else if (!/^\d{4}$/.test(form.discount_code)) {
      errors.discount_code = 'Discount Code must be exactly 4 digits';
    }
    
    if (!form.discount_name.trim()) {
      errors.discount_name = 'Discount Name is required';
    } else if (!/^[A-Za-z\s]+$/.test(form.discount_name)) {
      errors.discount_name = 'Discount Name must contain only alphabetic characters';
    } else if (form.discount_name.length > 25) {
      errors.discount_name = 'Discount Name must not exceed 25 characters';
    }
    
    if (!form.short_name.trim()) {
      errors.short_name = 'Short Name is required';
    } else if (!/^[A-Za-z\s]+$/.test(form.short_name)) {
      errors.short_name = 'Short Name must contain only alphabetic characters';
    } else if (form.short_name.length > 12) {
      errors.short_name = 'Short Name must not exceed 12 characters';
    }
    
    if (!form.display_sequence.trim()) {
      errors.display_sequence = 'Display Sequence is required';
    } else if (!/^\d+$/.test(form.display_sequence)) {
      errors.display_sequence = 'Display Sequence must be numeric';
    }
    
    if (!form.discount_type) {
      errors.discount_type = 'Discount Type is required';
    }
    
    if (!form.apply_to) {
      errors.apply_to = 'Apply To is required';
    }
    
    if (!form.discount_calc) {
      errors.discount_calc = 'Discount Calculation is required';
    }
    
    if (!form.discount_rate.trim()) {
      errors.discount_rate = 'Discount Rate is required';
    } else if (!/^\d+(\.\d{1,2})?$/.test(form.discount_rate)) {
      errors.discount_rate = 'Discount Rate must be a valid number';
    }
    
    if (form.max_limit_amount && !/^\d+(\.\d{1,2})?$/.test(form.max_limit_amount)) {
      errors.max_limit_amount = 'Max Limit Amount must be a valid number';
    }
    
    // Check for duplicate discount codes
    if (records && records.length > 0) {
      const isDuplicate = records.some((record, index) => 
        index !== selectedRecordIdx && 
        record.property_code === form.property_code &&
        record.discount_code === form.discount_code
      );
      if (isDuplicate) {
        errors.discount_code = 'Discount Code already exists for this property';
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

  // Export handlers (matching Property Setup pattern)
  const handleExport = type => {
    // Prepare data for export (all records or current form data)
    const exportData = records && records.length > 0 ? records : [form];
    
    if (type === 'Excel') {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'DiscountTypes');
      XLSX.writeFile(wb, 'DiscountTypes.xlsx');
    } else if (type === 'PDF') {
      const doc = new jsPDF();
      const columns = [
        'Property Code', 'Discount Code', 'Discount Name', 'Short Name', 'Display Sequence',
        'Discount Type', 'Apply To', 'Discount Calc', 'Discount Rate', 'Max Limit', 'Approval Required', 'Status'
      ];
      const rows = exportData.map(rec => [
        rec.property_code || '',
        rec.discount_code || '',
        rec.discount_name || '',
        rec.short_name || '',
        rec.display_sequence || '',
        rec.discount_type || '',
        rec.apply_to || '',
        rec.discount_calc || '',
        rec.discount_rate || '',
        rec.max_limit_amount || '',
        rec.discount_approval ? 'Required' : 'Not Required',
        rec.inactive ? 'Inactive' : 'Active'
      ]);
      autoTable(doc, { head: [columns], body: rows });
      doc.save('DiscountTypes.pdf');
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
            Discount Type
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
          ✅ Discount Type saved successfully!
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

          {/* Discount Code */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Discount Code</label>
            <div style={{width:'80%'}}>
              <input
                type="text"
                value={form.discount_code}
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  handleInputChange('discount_code', value);
                }}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.discount_code ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
                placeholder="0001-9999"
                maxLength="4"
                required
              />
              {fieldErrors.discount_code && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.discount_code}
                </div>
              )}
            </div>
          </div>

          {/* Discount Name */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Discount Name</label>
            <div style={{width:'80%'}}>
              <input
                type="text"
                value={form.discount_name}
                onChange={e => {
                  const value = e.target.value.replace(/[^A-Za-z\s]/g, '').slice(0, 25);
                  handleInputChange('discount_name', value);
                }}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.discount_name ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
                placeholder="Max 25 alphabetic characters"
                maxLength="25"
                required
              />
              {fieldErrors.discount_name && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.discount_name}
                </div>
              )}
            </div>
          </div>

          {/* Short Name */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Short Name</label>
            <div style={{width:'80%'}}>
              <input
                type="text"
                value={form.short_name}
                onChange={e => {
                  const value = e.target.value.replace(/[^A-Za-z\s]/g, '').slice(0, 12);
                  handleInputChange('short_name', value);
                }}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.short_name ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
                placeholder="Max 12 alphabetic characters"
                maxLength="12"
                required
              />
              {fieldErrors.short_name && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.short_name}
                </div>
              )}
            </div>
          </div>

          {/* Display Sequence */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Display Sequence</label>
            <div style={{width:'80%'}}>
              <input
                type="text"
                value={form.display_sequence}
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, '');
                  handleInputChange('display_sequence', value);
                }}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.display_sequence ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
                placeholder="Numeric sequence"
                required
              />
              {fieldErrors.display_sequence && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.display_sequence}
                </div>
              )}
            </div>
          </div>

          {/* Discount Type */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Discount Type</label>
            <div style={{width:'80%'}}>
              <select
                value={form.discount_type}
                onChange={e => handleInputChange('discount_type', e.target.value)}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.discount_type ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }}
                required
              >
                <option value="">Select Discount Type</option>
                <option value="pre-discount">Pre-Discount</option>
                <option value="mid-discount">Mid-Discount</option>
                <option value="post-discount">Post-Discount</option>
              </select>
              {fieldErrors.discount_type && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.discount_type}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right column */}
        <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
          {/* Apply To */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Apply To</label>
            <div style={{width:'80%'}}>
              <select
                value={form.apply_to}
                onChange={e => handleInputChange('apply_to', e.target.value)}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.apply_to ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }}
                required
              >
                <option value="">Select Apply To</option>
                <option value="check-discount">Check Discount</option>
                <option value="item-discount">Item Discount</option>
              </select>
              {fieldErrors.apply_to && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.apply_to}
                </div>
              )}
            </div>
          </div>

          {/* Discount Calc */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Discount Calc</label>
            <div style={{width:'80%'}}>
              <select
                value={form.discount_calc}
                onChange={e => handleInputChange('discount_calc', e.target.value)}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.discount_calc ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }}
                required
              >
                <option value="">Select Calculation Type</option>
                <option value="percentage">Percentage</option>
                <option value="amount">Amount</option>
              </select>
              {fieldErrors.discount_calc && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.discount_calc}
                </div>
              )}
            </div>
          </div>

          {/* Discount Rate */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Discount Rate</label>
            <div style={{width:'80%'}}>
              <input
                type="text"
                value={form.discount_rate}
                onChange={e => {
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  handleInputChange('discount_rate', value);
                }}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.discount_rate ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
                placeholder="Enter rate (e.g., 10.50)"
                required
              />
              {fieldErrors.discount_rate && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.discount_rate}
                </div>
              )}
            </div>
          </div>

          {/* Max Limit Amount */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Max Limit Amount</label>
            <div style={{width:'80%'}}>
              <input
                type="text"
                value={form.max_limit_amount}
                onChange={e => {
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  handleInputChange('max_limit_amount', value);
                }}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.max_limit_amount ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
                placeholder="Enter maximum limit (optional)"
              />
              {fieldErrors.max_limit_amount && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.max_limit_amount}
                </div>
              )}
            </div>
          </div>

          {/* Discount Approval */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Discount Approval</label>
            <div style={{width:'80%'}}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.discount_approval}
                  onChange={e => handleInputChange('discount_approval', e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
                <span style={{ fontWeight: 'bold', color: '#222' }}>Requires Approval</span>
              </label>
              <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                Check if discount requires manager approval
              </small>
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
                Check to mark this discount type as inactive
              </small>
            </div>
          </div>
        </div>

      </form>

      {/* Records Table */}
      {records && records.length > 0 && (
        <div style={{ padding: '20px 32px' }}>
          <h3 style={{ marginBottom: '16px', color: '#333' }}>Existing Discount Types</h3>
          <div style={{ overflowX: 'auto', border: '2px solid #ddd', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Property</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Code</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Apply To</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Rate</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Approval</th>
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
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{record.discount_code}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{record.discount_name}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{record.discount_type}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{record.apply_to}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      {record.discount_rate} {record.discount_calc === 'percentage' ? '%' : ''}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                      {record.discount_approval ? '✅' : '❌'}
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

export default DiscountType;