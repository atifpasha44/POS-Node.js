import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const initialState = {
  property_code: '',
  user_dept_code: '',
  name: '',
  short_name: '',
  dept_email: '',
  outlet_codes: [],
  inactive: false
};

const UserDepartments = ({ setParentDirty, propertyCodes, outletRecords, records, setRecords }) => {
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
    
    if (!form.user_dept_code.trim()) {
      errors.user_dept_code = 'User Dept Code is required';
    } else if (form.user_dept_code.length > 10) {
      errors.user_dept_code = 'User Dept Code must not exceed 10 characters';
    }
    
    if (!form.name.trim()) {
      errors.name = 'Name is required';
    } else if (form.name.length > 100) {
      errors.name = 'Name must not exceed 100 characters';
    }
    
    if (form.short_name && form.short_name.length > 20) {
      errors.short_name = 'Short Name must not exceed 20 characters';
    }
    
    if (form.dept_email && form.dept_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.dept_email)) {
        errors.dept_email = 'Please enter a valid email address';
      }
    }
    
    if (form.outlet_codes.length === 0) {
      errors.outlet_codes = 'At least one outlet must be selected';
    }
    
    return errors;
  };

  // Check for duplicate user dept code
  const isDuplicateUserDeptCode = () => {
    return records.some((record, index) => 
      record && 
      record.user_dept_code === form.user_dept_code && 
      index !== selectedRecordIdx
    );
  };

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (setParentDirty) setParentDirty(true);
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleOutletSelection = (outletCode, checked) => {
    let newOutletCodes;
    if (checked) {
      newOutletCodes = [...form.outlet_codes, outletCode];
    } else {
      newOutletCodes = form.outlet_codes.filter(code => code !== outletCode);
    }
    
    setForm(prev => ({ ...prev, outlet_codes: newOutletCodes }));
    setIsDirty(true);
    if (setParentDirty) setParentDirty(true);
    
    // Clear outlet_codes error when user makes selection
    if (fieldErrors.outlet_codes) {
      setFieldErrors(prev => ({ ...prev, outlet_codes: '' }));
    }
  };

  const handleAdd = () => {
    setAction('Add');
    setForm(initialState);
    setSelectedRecordIdx(null);
    setFieldErrors({});
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
  };

  const handleEdit = () => {
    if (records.length === 0) {
      setSelectModalMessage('No records available to edit.');
      setShowSelectModal(true);
      return;
    }
    setAction('Edit');
    setSelectModalMessage('Select a record to edit:');
    setShowSelectModal(true);
  };

  const handleDelete = () => {
    if (records.length === 0) {
      setSelectModalMessage('No records available to delete.');
      setShowSelectModal(true);
      return;
    }
    setAction('Delete');
    setSelectModalMessage('Select a record to delete:');
    setShowSelectModal(true);
  };

  const handleSearch = () => {
    if (records.length === 0) {
      setSelectModalMessage('No records available to search.');
      setShowSelectModal(true);
      return;
    }
    setAction('Search');
    setSelectModalMessage('Select a record to view:');
    setShowSelectModal(true);
  };

  const handleClear = () => {
    setForm(initialState);
    setSelectedRecordIdx(null);
    setFieldErrors({});
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
  };

  const handleSave = () => {
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    if (isDuplicateUserDeptCode()) {
      setFieldErrors({ user_dept_code: 'User Dept Code already exists' });
      return;
    }

    let newRecords;
    if (action === 'Add') {
      newRecords = [...records, { ...form }];
    } else if (action === 'Edit' && selectedRecordIdx !== null) {
      newRecords = records.map((record, index) => 
        index === selectedRecordIdx ? { ...form } : record
      );
    } else if (action === 'Delete' && selectedRecordIdx !== null) {
      newRecords = records.filter((_, index) => index !== selectedRecordIdx);
    } else {
      return;
    }

    setRecords(newRecords);
    setShowSavePopup(true);
    setTimeout(() => setShowSavePopup(false), 2000);
    
    if (action === 'Add' || action === 'Delete') {
      handleClear();
    }
    
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
  };

  const handleSelectRecord = (index) => {
    const record = records[index];
    setForm({ ...record });
    setSelectedRecordIdx(index);
    setShowSelectModal(false);
    setFieldErrors({});
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
  };

  const handleExport = (format) => {
    if (records.length === 0) {
      alert('No data to export');
      return;
    }

    const exportData = records.map(record => ({
      'Property Code': record.property_code || '',
      'User Dept Code': record.user_dept_code || '',
      'Name': record.name || '',
      'Short Name': record.short_name || '',
      'Dept Email': record.dept_email || '',
      'Outlet Codes': Array.isArray(record.outlet_codes) ? record.outlet_codes.join(', ') : '',
      'Inactive': record.inactive ? 'Yes' : 'No'
    }));

    if (format === 'Excel') {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'User Departments');
      XLSX.writeFile(wb, 'user_departments.xlsx');
    } else if (format === 'PDF') {
      const doc = new jsPDF('l', 'mm', 'a4');
      doc.setFontSize(18);
      doc.text('User Departments Report', 14, 22);
      
      autoTable(doc, {
        head: [['Property Code', 'User Dept Code', 'Name', 'Short Name', 'Dept Email', 'Outlet Codes', 'Inactive']],
        body: exportData.map(row => [
          row['Property Code'],
          row['User Dept Code'],
          row['Name'],
          row['Short Name'],
          row['Dept Email'],
          row['Outlet Codes'],
          row['Inactive']
        ]),
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] }
      });
      
      doc.save('user_departments.pdf');
    }
  };

  // Get applicable property codes (same logic as OutletSetup)
  const getApplicablePropertyCodes = () => {
    if (!propertyCodes || propertyCodes.length === 0) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const groupedByCodes = propertyCodes.reduce((acc, pc) => {
      const code = pc.property_code || pc.code;
      if (!acc[code]) acc[code] = [];
      acc[code].push(pc);
      return acc;
    }, {});
    
    const applicableCodes = [];
    
    Object.keys(groupedByCodes).forEach(code => {
      const records = groupedByCodes[code];
      
      const applicableRecords = records.filter(record => {
        const applicableDate = new Date(record.applicable_from);
        applicableDate.setHours(0, 0, 0, 0);
        return applicableDate <= today;
      });
      
      if (applicableRecords.length > 0) {
        applicableRecords.sort((a, b) => new Date(b.applicable_from) - new Date(a.applicable_from));
        applicableCodes.push(applicableRecords[0]);
      }
    });
    
    return applicableCodes;
  };

  return (
    <div className="propertycode-panel" style={{background:'#fff',border:'2.5px solid #222',borderRadius:'16px',boxShadow:'0 2px 12px rgba(0,0,0,0.10)',width:'100%',maxWidth:'1200px',margin:'32px auto',padding:'0 0 18px 0',height:'calc(100vh - 120px)',display:'flex',flexDirection:'column',overflowY:'auto',position:'relative'}}>
      {/* Top Control Bar */}
      <div style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        borderBottom:'2px solid #e0e0e0',padding:'12px 18px 8px 18px',minWidth:0,
        position:'sticky',top:0,zIndex:10,background:'#fff',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',minWidth:0,flexWrap:'wrap'}}>
          <span style={{fontWeight:'bold',fontSize:'2rem',color:'#222',marginRight:'18px'}}>User Departments</span>
          <select
            value={action}
            onChange={e => {
              const val = e.target.value;
              if (val === 'Add') handleAdd();
              else if (val === 'Edit') handleEdit();
              else if (val === 'Delete') handleDelete();
              else if (val === 'Search') handleSearch();
            }}
            style={{fontWeight:'bold',fontSize:'1rem',padding:'4px 12px',borderRadius:'6px',border:'1.5px solid #bbb',marginRight:'8px'}}
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
            onMouseOver={e=>(e.currentTarget.style.background='#c8e6c9')}
            onMouseOut={e=>(e.currentTarget.style.background='#e8f5e9')}
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
            onMouseOver={e=>(e.currentTarget.style.background='#ffcdd2')}
            onMouseOut={e=>(e.currentTarget.style.background='#ffebee')}
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

      {/* Save confirmation popup */}
      {showSavePopup && (
        <div style={{position:'fixed',top:'30%',left:'50%',transform:'translate(-50%,-50%)',background:'#fff',border:'2px solid #43a047',borderRadius:'12px',padding:'32px 48px',zIndex:1000,boxShadow:'0 4px 24px rgba(0,0,0,0.18)',fontSize:'1.25rem',color:'#43a047',fontWeight:'bold'}}>
          {action === 'Delete' ? 'Record has been successfully deleted.' : 'Data has been saved successfully.'}
        </div>
      )}

      {/* Record selection modal */}
      {showSelectModal && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.18)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:'14px',padding:'32px 24px',minWidth:'600px',boxShadow:'0 4px 24px rgba(0,0,0,0.18)',maxHeight:'80vh',overflowY:'auto'}}>
            <div style={{fontWeight:'bold',fontSize:'1.2rem',marginBottom:'18px',color:'#1976d2'}}>{selectModalMessage}</div>
            {records.length === 0 ? (
              <div style={{color:'#888',fontSize:'1.05rem'}}>No records found.</div>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse',marginBottom:'12px'}}>
                <thead>
                  <tr style={{background:'#e3e3e3'}}>
                    <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>User Dept Code</th>
                    <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Name</th>
                    <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Property Code</th>
                    <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, index) => (
                    <tr key={index} style={{background: index%2 ? '#f7f7f7' : '#fff'}}>
                      <td style={{padding:'6px 8px'}}>{record.user_dept_code}</td>
                      <td style={{padding:'6px 8px'}}>{record.name}</td>
                      <td style={{padding:'6px 8px'}}>{record.property_code}</td>
                      <td style={{padding:'6px 8px'}}>
                        <button type="button" style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:'6px',padding:'4px 12px',fontWeight:'bold',cursor:'pointer'}} onClick={()=>handleSelectRecord(index)}>Select</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button type="button" style={{background:'#e53935',color:'#fff',border:'none',borderRadius:'6px',padding:'8px 22px',fontWeight:'bold',fontSize:'1.08rem',marginTop:'8px',cursor:'pointer'}} onClick={()=>setShowSelectModal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Form Section */}
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
                {getApplicablePropertyCodes().map(pc => (
                  <option key={pc.property_code || pc.code} value={pc.property_code || pc.code}>
                    {(pc.property_code || pc.code) + (pc.property_name ? ' - ' + pc.property_name : (pc.name ? ' - ' + pc.name : ''))}
                  </option>
                ))}
              </select>
              {fieldErrors.property_code && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.property_code}
                </div>
              )}
            </div>
          </div>

          {/* User Dept Code */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>User Dept Code</label>
            <div style={{width:'80%'}}>
              <input
                type="text"
                value={form.user_dept_code}
                onChange={e => handleInputChange('user_dept_code', e.target.value.toUpperCase())}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.user_dept_code ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
                placeholder="Enter department code"
                maxLength="10"
                required
              />
              {fieldErrors.user_dept_code && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.user_dept_code}
                </div>
              )}
            </div>
          </div>

          {/* Name */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Name</label>
            <div style={{width:'80%'}}>
              <input
                type="text"
                value={form.name}
                onChange={e => handleInputChange('name', e.target.value)}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.name ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
                placeholder="Enter department name"
                maxLength="100"
                required
              />
              {fieldErrors.name && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.name}
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
                onChange={e => handleInputChange('short_name', e.target.value)}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.short_name ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
                placeholder="Enter short name (optional)"
                maxLength="20"
              />
              {fieldErrors.short_name && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.short_name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
          {/* Dept Email */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Dept Email</label>
            <div style={{width:'80%'}}>
              <input
                type="email"
                value={form.dept_email}
                onChange={e => handleInputChange('dept_email', e.target.value)}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.dept_email ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
                placeholder="Enter department email (optional)"
              />
              {fieldErrors.dept_email && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.dept_email}
                </div>
              )}
            </div>
          </div>

          {/* Outlet Code Multi-select */}
          <div style={{display:'flex',alignItems:'flex-start'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222',marginTop:'8px'}}>Outlet Codes</label>
            <div style={{width:'80%'}}>
              <div style={{
                border: fieldErrors.outlet_codes ? '2px solid #f44336' : '2px solid #bbb',
                borderRadius:'6px',
                padding:'8px',
                maxHeight:'120px',
                overflowY:'auto',
                background:'#fff'
              }}>
                {outletRecords && outletRecords.length > 0 ? (
                  outletRecords
                    .filter(outlet => outlet && outlet.outlet_code)
                    .map((outlet, index) => (
                      <div key={index} style={{display:'flex',alignItems:'center',marginBottom:'4px'}}>
                        <input
                          type="checkbox"
                          id={`outlet_${index}`}
                          checked={form.outlet_codes.includes(outlet.outlet_code)}
                          onChange={e => handleOutletSelection(outlet.outlet_code, e.target.checked)}
                          style={{marginRight:'8px'}}
                        />
                        <label htmlFor={`outlet_${index}`} style={{fontSize:'0.95rem',cursor:'pointer'}}>
                          {outlet.outlet_code} - {outlet.outlet_name || 'Unnamed Outlet'}
                        </label>
                      </div>
                    ))
                ) : (
                  <div style={{color:'#888',fontSize:'0.95rem',fontStyle:'italic'}}>
                    No outlets available. Please create outlets first.
                  </div>
                )}
              </div>
              {fieldErrors.outlet_codes && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.outlet_codes}
                </div>
              )}
            </div>
          </div>

          {/* Inactive Checkbox */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Inactive</label>
            <div style={{width:'80%',display:'flex',alignItems:'center'}}>
              <input
                type="checkbox"
                checked={form.inactive}
                onChange={e => handleInputChange('inactive', e.target.checked)}
                style={{marginRight:'8px',transform:'scale(1.2)'}}
              />
              <span style={{ fontWeight: 'bold', color: '#222' }}>Mark as Inactive</span>
            </div>
          </div>
        </div>
      </form>

      {/* Records Table */}
      <div style={{padding:'32px',paddingTop:'24px'}}>
        <div style={{fontWeight:'bold',fontSize:'1.25rem',color:'#222',marginBottom:'16px'}}>User Departments Records</div>
        <div style={{border:'2px solid #bbb',borderRadius:'8px',overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'#f5f5f5'}}>
                <th style={{padding:'12px',borderBottom:'1px solid #eee',fontWeight:'bold',textAlign:'left'}}>Property Code</th>
                <th style={{padding:'12px',borderBottom:'1px solid #eee',fontWeight:'bold',textAlign:'left'}}>User Dept Code</th>
                <th style={{padding:'12px',borderBottom:'1px solid #eee',fontWeight:'bold',textAlign:'left'}}>Name</th>
                <th style={{padding:'12px',borderBottom:'1px solid #eee',fontWeight:'bold',textAlign:'left'}}>Short Name</th>
                <th style={{padding:'12px',borderBottom:'1px solid #eee',fontWeight:'bold',textAlign:'left'}}>Dept Email</th>
                <th style={{padding:'12px',borderBottom:'1px solid #eee',fontWeight:'bold',textAlign:'left'}}>Outlet Codes</th>
                <th style={{padding:'12px',borderBottom:'1px solid #eee',fontWeight:'bold',textAlign:'left'}}>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{padding:'24px',textAlign:'center',color:'#888',fontStyle:'italic'}}>
                    No records found. Click Add to create your first user department.
                  </td>
                </tr>
              ) : (
                records.map((record, index) => (
                  <tr key={index} style={{background: index % 2 === 0 ? '#fff' : '#f9f9f9'}}>
                    <td style={{padding:'12px',borderBottom:'1px solid #eee'}}>{record.property_code}</td>
                    <td style={{padding:'12px',borderBottom:'1px solid #eee'}}>{record.user_dept_code}</td>
                    <td style={{padding:'12px',borderBottom:'1px solid #eee'}}>{record.name}</td>
                    <td style={{padding:'12px',borderBottom:'1px solid #eee'}}>{record.short_name}</td>
                    <td style={{padding:'12px',borderBottom:'1px solid #eee'}}>{record.dept_email}</td>
                    <td style={{padding:'12px',borderBottom:'1px solid #eee'}}>
                      {Array.isArray(record.outlet_codes) ? record.outlet_codes.join(', ') : ''}
                    </td>
                    <td style={{padding:'12px',borderBottom:'1px solid #eee'}}>
                      <span style={{
                        padding:'4px 8px',
                        borderRadius:'4px',
                        fontSize:'0.875rem',
                        fontWeight:'bold',
                        background: record.inactive ? '#ffebee' : '#e8f5e9',
                        color: record.inactive ? '#e53935' : '#43a047'
                      }}>
                        {record.inactive ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserDepartments;