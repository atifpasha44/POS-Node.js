import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const initialState = {
  login_name: '',
  password: '',
  re_password: '',
  user_pin: '',
  re_user_pin: '',
  full_name: '',
  short_name: '',
  property_code: '',
  outlet_codes: [],
  user_no: '',
  role: 'General User',
  department_id: '',
  user_group_id: '',
  user_card_no: '',
  email: '',
  gender: '',
  is_active: true
};

const UserSetup = ({ setParentDirty, propertyCodes, outletRecords, userDepartmentsRecords, userGroupsRecords, records, setRecords }) => {
  const [isDirty, setIsDirty] = useState(false);
  const [form, setForm] = useState(initialState);
  const [action, setAction] = useState('Add');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedRecordIdx, setSelectedRecordIdx] = useState(null);
  const [selectModalMessage, setSelectModalMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showRePin, setShowRePin] = useState(false);
  const formRef = useRef(null);

  // Validation function
  const validateForm = () => {
    const errors = {};
    
    if (!form.login_name.trim()) {
      errors.login_name = 'Login Name is required';
    } else if (form.login_name.length > 50) {
      errors.login_name = 'Login Name must not exceed 50 characters';
    }
    
    if (!form.password.trim()) {
      errors.password = 'Password is required';
    } else if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (!form.re_password.trim()) {
      errors.re_password = 'Please confirm password';
    } else if (form.password !== form.re_password) {
      errors.re_password = 'Passwords do not match';
    }
    
    if (!form.user_pin.trim()) {
      errors.user_pin = 'User PIN is required';
    } else if (!/^\d{4,6}$/.test(form.user_pin)) {
      errors.user_pin = 'PIN must be 4-6 digits';
    }
    
    if (!form.re_user_pin.trim()) {
      errors.re_user_pin = 'Please confirm PIN';
    } else if (form.user_pin !== form.re_user_pin) {
      errors.re_user_pin = 'PINs do not match';
    }
    
    if (!form.full_name.trim()) {
      errors.full_name = 'Full Name is required';
    } else if (form.full_name.length > 100) {
      errors.full_name = 'Full Name must not exceed 100 characters';
    }
    
    if (form.short_name && form.short_name.length > 20) {
      errors.short_name = 'Short Name must not exceed 20 characters';
    }
    
    if (!form.property_code.trim()) {
      errors.property_code = 'Property Code is required';
    }
    
    if (!form.user_no.trim()) {
      errors.user_no = 'User No is required';
    } else if (form.user_no.length > 20) {
      errors.user_no = 'User No must not exceed 20 characters';
    }
    
    if (!form.role.trim()) {
      errors.role = 'Role is required';
    }
    
    if (!form.department_id.trim()) {
      errors.department_id = 'Department is required';
    }
    
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    return errors;
  };

  // Check for duplicates
  const checkDuplicates = (field, value, excludeIdx = null) => {
    return records.some((record, idx) => {
      if (excludeIdx !== null && idx === excludeIdx) return false;
      return record[field] && record[field].toLowerCase() === value.toLowerCase();
    });
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear specific field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    if (!isDirty) {
      setIsDirty(true);
      setParentDirty(true);
    }
  };

  // Handle outlet selection
  const handleOutletChange = (outletCode) => {
    setForm(prev => ({
      ...prev,
      outlet_codes: prev.outlet_codes.includes(outletCode)
        ? prev.outlet_codes.filter(code => code !== outletCode)
        : [...prev.outlet_codes, outletCode]
    }));

    if (!isDirty) {
      setIsDirty(true);
      setParentDirty(true);
    }
  };

  // Get available outlets for selected property
  const getAvailableOutlets = () => {
    if (!form.property_code || !outletRecords) return [];
    return outletRecords.filter(outlet => outlet.property_code === form.property_code);
  };

  // Get available departments for selected property
  const getAvailableDepartments = () => {
    if (!form.property_code || !userDepartmentsRecords) return [];
    return userDepartmentsRecords.filter(dept => 
      dept.property_code === form.property_code && !dept.inactive
    );
  };

  // Get available user groups for selected property
  const getAvailableUserGroups = () => {
    if (!form.property_code || !userGroupsRecords) return [];
    return userGroupsRecords.filter(group => 
      group.property_code === form.property_code && group.is_active
    );
  };

  // Save function
  const handleSave = () => {
    const errors = validateForm();
    
    // Check for duplicates
    if (form.login_name && checkDuplicates('login_name', form.login_name, action === 'Edit' ? selectedRecordIdx : null)) {
      errors.login_name = 'Login Name already exists';
    }
    
    if (form.user_no && checkDuplicates('user_no', form.user_no, action === 'Edit' ? selectedRecordIdx : null)) {
      errors.user_no = 'User No already exists';
    }
    
    if (form.email && checkDuplicates('email', form.email, action === 'Edit' ? selectedRecordIdx : null)) {
      errors.email = 'Email already exists';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    // Get department and user group names for display
    const selectedDept = getAvailableDepartments().find(dept => dept.user_dept_code === form.department_id);
    const selectedGroup = getAvailableUserGroups().find(group => group.group_name === form.user_group_id);

    const newRecord = {
      ...form,
      department_name: selectedDept ? selectedDept.name : '',
      user_group_name: selectedGroup ? selectedGroup.group_name : '',
      created_date: action === 'Add' ? new Date().toLocaleDateString() : (selectedRecordIdx !== null ? records[selectedRecordIdx].created_date : new Date().toLocaleDateString()),
      modified_date: new Date().toLocaleDateString()
    };

    if (action === 'Add') {
      setRecords([...records, newRecord]);
    } else if (action === 'Edit' && selectedRecordIdx !== null) {
      const updatedRecords = [...records];
      updatedRecords[selectedRecordIdx] = newRecord;
      setRecords(updatedRecords);
    }

    setForm(initialState);
    setAction('Add');
    setSelectedRecordIdx(null);
    setIsDirty(false);
    setParentDirty(false);
    setShowSavePopup(true);
  };

  // Load record for editing
  const handleEdit = (index) => {
    const record = records[index];
    setForm({
      login_name: record.login_name || '',
      password: record.password || '',
      re_password: record.password || '',
      user_pin: record.user_pin || '',
      re_user_pin: record.user_pin || '',
      full_name: record.full_name || '',
      short_name: record.short_name || '',
      property_code: record.property_code || '',
      outlet_codes: record.outlet_codes || [],
      user_no: record.user_no || '',
      role: record.role || 'General User',
      department_id: record.department_id || '',
      user_group_id: record.user_group_id || '',
      user_card_no: record.user_card_no || '',
      email: record.email || '',
      gender: record.gender || '',
      is_active: record.is_active !== undefined ? record.is_active : true
    });
    setAction('Edit');
    setSelectedRecordIdx(index);
    setFieldErrors({});
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Delete record
  const handleDelete = (index) => {
    setSelectedRecordIdx(index);
    setSelectModalMessage(`Are you sure you want to delete user "${records[index].full_name}"?`);
    setShowSelectModal(true);
  };

  const confirmDelete = () => {
    if (selectedRecordIdx !== null) {
      const updatedRecords = records.filter((_, index) => index !== selectedRecordIdx);
      setRecords(updatedRecords);
      setSelectedRecordIdx(null);
    }
    setShowSelectModal(false);
  };

  // Clear form
  const handleClear = () => {
    setForm(initialState);
    setAction('Add');
    setSelectedRecordIdx(null);
    setFieldErrors({});
    setIsDirty(false);
    setParentDirty(false);
  };

  // Export functions
  const exportToExcel = () => {
    const exportData = records.map(record => ({
      'Login Name': record.login_name,
      'Full Name': record.full_name,
      'Short Name': record.short_name,
      'Property Code': record.property_code,
      'Outlet Codes': Array.isArray(record.outlet_codes) ? record.outlet_codes.join(', ') : record.outlet_codes,
      'User No': record.user_no,
      'Role': record.role,
      'Department': record.department_name,
      'User Group': record.user_group_name,
      'User Card No': record.user_card_no,
      'Email': record.email,
      'Gender': record.gender,
      'Status': record.is_active ? 'Active' : 'Inactive',
      'Created Date': record.created_date,
      'Modified Date': record.modified_date
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'User Setup');
    XLSX.writeFile(wb, 'UserSetup.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    const tableColumn = [
      'Login Name', 'Full Name', 'Property Code', 'User No', 'Role', 
      'Department', 'Email', 'Gender', 'Status'
    ];
    
    const tableRows = records.map(record => [
      record.login_name,
      record.full_name,
      record.property_code,
      record.user_no,
      record.role,
      record.department_name,
      record.email,
      record.gender,
      record.is_active ? 'Active' : 'Inactive'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [71, 129, 202] }
    });

    doc.text('User Setup Report', 14, 15);
    doc.save('UserSetup.pdf');
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
          <span style={{fontWeight:'bold',fontSize:'2rem',color:'#222',marginRight:'18px'}}>User Setup</span>
          <button onClick={handleSave} title="Save" style={{background:'#e3f2fd',border:'2px solid #1976d2',borderRadius:'8px',fontWeight:'bold',color:'#1976d2',fontSize:'1.15rem',padding:'4px 18px',marginLeft:'8px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#bbdefb'} onMouseOut={e=>e.currentTarget.style.background='#e3f2fd'}><span style={{fontWeight:'bold'}}><span role="img" aria-label="Save">💾</span> {action === 'Add' ? 'SAVE' : 'UPDATE'}</span></button>
          <button onClick={handleClear} title="Clear" style={{background:'#f3e5f5',border:'2px solid #8e24aa',borderRadius:'8px',fontWeight:'bold',color:'#8e24aa',fontSize:'1.15rem',padding:'4px 18px',marginLeft:'8px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#e1bee7'} onMouseOut={e=>e.currentTarget.style.background='#f3e5f5'}><span style={{fontWeight:'bold'}}><span role="img" aria-label="Clear">🧹</span> CLEAR</span></button>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'16px',minWidth:0,flexWrap:'wrap'}}>
          <span style={{fontSize:'1.08rem',color:'#888',marginRight:'8px',whiteSpace:'nowrap'}}>Export Report to</span>
          <span
            title="Export to Excel"
            style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:'40px',height:'40px',borderRadius:'50%',background:'#e8f5e9',boxShadow:'0 2px 8px rgba(76,175,80,0.10)',cursor:'pointer',border:'2px solid #43a047',marginRight:'6px',transition:'background 0.2s'}}
            onClick={exportToExcel}
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
            onClick={exportToPDF}
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

      {/* Form Section */}
      <form ref={formRef} className="propertycode-form" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 32px',padding:'32px 32px 0 32px'}} autoComplete="off">
        {/* Left column */}
        <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
          {/* Login Name */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Login Name *</label>
            <div style={{width:'80%'}}>
              <input
                type="text"
                name="login_name"
                value={form.login_name}
                onChange={handleInputChange}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.login_name ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
                maxLength="50"
                required
              />
              {fieldErrors.login_name && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.login_name}
                </div>
              )}
            </div>
          </div>
            
          {/* User No */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>User No *</label>
            <div style={{width:'80%'}}>
              <input
                type="text"
                name="user_no"
                value={form.user_no}
                onChange={handleInputChange}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.user_no ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
                maxLength="20"
                required
              />
              {fieldErrors.user_no && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.user_no}
                </div>
              )}
            </div>
          </div>

          {/* New Password */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>New Password *</label>
            <div style={{width:'80%',position:'relative'}}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleInputChange}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.password ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 40px 0 8px'
                }}
                minLength="8"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position:'absolute',
                  right:'8px',
                  top:'50%',
                  transform:'translateY(-50%)',
                  background:'none',
                  border:'none',
                  cursor:'pointer',
                  padding:'4px',
                  fontSize:'16px',
                  color:'#666'
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
              {fieldErrors.password && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.password}
                </div>
              )}
            </div>
          </div>

          {/* Re-type New Password */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Re-type Password *</label>
            <div style={{width:'80%',position:'relative'}}>
              <input
                type={showRePassword ? "text" : "password"}
                name="re_password"
                value={form.re_password}
                onChange={handleInputChange}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.re_password ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 40px 0 8px'
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowRePassword(!showRePassword)}
                style={{
                  position:'absolute',
                  right:'8px',
                  top:'50%',
                  transform:'translateY(-50%)',
                  background:'none',
                  border:'none',
                  cursor:'pointer',
                  padding:'4px',
                  fontSize:'16px',
                  color:'#666'
                }}
              >
                {showRePassword ? '👁️' : '👁️‍🗨️'}
              </button>
              {fieldErrors.re_password && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.re_password}
                </div>
              )}
            </div>
          </div>

          {/* New PIN */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>New PIN *</label>
            <div style={{width:'80%',position:'relative'}}>
              <input
                type={showPin ? "text" : "password"}
                name="user_pin"
                value={form.user_pin}
                onChange={handleInputChange}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.user_pin ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 40px 0 8px'
                }}
                pattern="[0-9]{4,6}"
                maxLength="6"
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                style={{
                  position:'absolute',
                  right:'8px',
                  top:'50%',
                  transform:'translateY(-50%)',
                  background:'none',
                  border:'none',
                  cursor:'pointer',
                  padding:'4px',
                  fontSize:'16px',
                  color:'#666'
                }}
              >
                {showPin ? '👁️' : '👁️‍🗨️'}
              </button>
              {fieldErrors.user_pin && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.user_pin}
                </div>
              )}
            </div>
          </div>

          {/* Re-type New PIN */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Re-type PIN *</label>
            <div style={{width:'80%',position:'relative'}}>
              <input
                type={showRePin ? "text" : "password"}
                name="re_user_pin"
                value={form.re_user_pin}
                onChange={handleInputChange}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.re_user_pin ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 40px 0 8px'
                }}
                pattern="[0-9]{4,6}"
                maxLength="6"
                required
              />
              <button
                type="button"
                onClick={() => setShowRePin(!showRePin)}
                style={{
                  position:'absolute',
                  right:'8px',
                  top:'50%',
                  transform:'translateY(-50%)',
                  background:'none',
                  border:'none',
                  cursor:'pointer',
                  padding:'4px',
                  fontSize:'16px',
                  color:'#666'
                }}
              >
                {showRePin ? '👁️' : '👁️‍🗨️'}
              </button>
              {fieldErrors.re_user_pin && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.re_user_pin}
                </div>
              )}
            </div>
          </div>

          {/* Full Name */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Name of the User *</label>
            <div style={{width:'80%'}}>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleInputChange}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.full_name ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
                maxLength="100"
                required
              />
              {fieldErrors.full_name && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.full_name}
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
                name="short_name"
                value={form.short_name}
                onChange={handleInputChange}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.short_name ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
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
          {/* Property Code */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Property Code *</label>
            <div style={{width:'80%'}}>
              <select
                name="property_code"
                value={form.property_code}
                onChange={handleInputChange}
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
                {propertyCodes && propertyCodes.map((property, index) => (
                  <option key={index} value={property.property_code}>
                    {property.property_code} - {property.property_name}
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
            
          {/* Role */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Role *</label>
            <div style={{width:'80%'}}>
              <select
                name="role"
                value={form.role}
                onChange={handleInputChange}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.role ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }}
                required
              >
                <option value="General User">General User</option>
                <option value="System Administrator">System Administrator</option>
              </select>
              {fieldErrors.role && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.role}
                </div>
              )}
            </div>
          </div>

          {/* Department */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Department *</label>
            <div style={{width:'80%'}}>
              <select
                name="department_id"
                value={form.department_id}
                onChange={handleInputChange}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.department_id ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background: !form.property_code ? '#f3f3f3' : '#fff'
                }}
                disabled={!form.property_code}
                required
              >
                <option value="">Select Department</option>
                {getAvailableDepartments().map((dept, index) => (
                  <option key={index} value={dept.user_dept_code}>
                    {dept.user_dept_code} - {dept.name}
                  </option>
                ))}
              </select>
              {fieldErrors.department_id && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.department_id}
                </div>
              )}
            </div>
          </div>
            
          {/* User Group */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>User Group</label>
            <div style={{width:'80%'}}>
              <select
                name="user_group_id"
                value={form.user_group_id}
                onChange={handleInputChange}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border:'2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background: !form.property_code ? '#f3f3f3' : '#fff'
                }}
                disabled={!form.property_code}
              >
                <option value="">Select User Group</option>
                {getAvailableUserGroups().map((group, index) => (
                  <option key={index} value={group.group_name}>
                    {group.group_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* User Email */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>User Email</label>
            <div style={{width:'80%'}}>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleInputChange}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.email ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
              />
              {fieldErrors.email && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.email}
                </div>
              )}
            </div>
          </div>
            
          {/* Gender */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Gender</label>
            <div style={{width:'80%'}}>
              <select
                name="gender"
                value={form.gender}
                onChange={handleInputChange}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border:'2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* User Card No */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>User Card No</label>
            <div style={{width:'80%'}}>
              <input
                type="text"
                name="user_card_no"
                value={form.user_card_no}
                onChange={handleInputChange}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border:'2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
                maxLength="50"
              />
            </div>
          </div>

          {/* Active Status */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Active Status</label>
            <div style={{width:'80%'}}>
              <label style={{fontWeight:'normal',fontSize:'1.08rem',display:'flex',alignItems:'center'}}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleInputChange}
                  style={{width:'20px',height:'20px',marginRight:'8px'}}
                />
                Active User
              </label>
            </div>
          </div>
        </div>
      </form>

      {/* Outlet Selection Section */}
      {form.property_code && (
        <div style={{padding:'0 32px 24px 32px'}}>
          <div style={{marginBottom:'16px'}}>
            <label style={{fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Outlet Codes</label>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'12px'}}>
            {getAvailableOutlets().map((outlet, index) => (
              <label key={index} style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 12px',border:'1px solid #ddd',borderRadius:'4px',background:'#f9f9f9',fontSize:'0.95rem'}}>
                <input
                  type="checkbox"
                  checked={form.outlet_codes.includes(outlet.outlet_code)}
                  onChange={() => handleOutletChange(outlet.outlet_code)}
                  style={{width:'16px',height:'16px',margin:'0'}}
                />
                {outlet.outlet_code} - {outlet.outlet_name}
              </label>
            ))}
          </div>
        </div>
      )}
      {/* Records Table Section */}
      <div style={{padding:'24px 32px',flex:1,overflowY:'auto'}}>
        <h3 style={{fontSize:'1.5rem',color:'#222',marginBottom:'16px',fontWeight:'bold'}}>User Setup Records ({records.length})</h3>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',marginTop:'8px'}}>
            <thead>
              <tr style={{background:'#f5f5f5'}}>
                <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',fontSize:'0.95rem',color:'#333'}}>S.No</th>
                <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',fontSize:'0.95rem',color:'#333'}}>Login Name</th>
                <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',fontSize:'0.95rem',color:'#333'}}>Full Name</th>
                <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',fontSize:'0.95rem',color:'#333'}}>Property Code</th>
                <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',fontSize:'0.95rem',color:'#333'}}>User No</th>
                <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',fontSize:'0.95rem',color:'#333'}}>Role</th>
                <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',fontSize:'0.95rem',color:'#333'}}>Department</th>
                <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',fontSize:'0.95rem',color:'#333'}}>Email</th>
                <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',fontSize:'0.95rem',color:'#333'}}>Status</th>
                <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',fontSize:'0.95rem',color:'#333'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{textAlign:'center',color:'#888',fontStyle:'italic',padding:'20px',border:'1px solid #ddd'}}>No user records found</td>
                </tr>
              ) : (
                records.map((record, index) => (
                  <tr key={index} style={{background: index % 2 === 0 ? '#fff' : '#f9f9f9'}} onMouseOver={e => e.currentTarget.style.background = '#f0f0f0'} onMouseOut={e => e.currentTarget.style.background = index % 2 === 0 ? '#fff' : '#f9f9f9'}>
                    <td style={{border:'1px solid #ddd',padding:'10px 8px',fontSize:'0.9rem',color:'#555'}}>{index + 1}</td>
                    <td style={{border:'1px solid #ddd',padding:'10px 8px',fontSize:'0.9rem',color:'#555'}}>{record.login_name}</td>
                    <td style={{border:'1px solid #ddd',padding:'10px 8px',fontSize:'0.9rem',color:'#555'}}>{record.full_name}</td>
                    <td style={{border:'1px solid #ddd',padding:'10px 8px',fontSize:'0.9rem',color:'#555'}}>{record.property_code}</td>
                    <td style={{border:'1px solid #ddd',padding:'10px 8px',fontSize:'0.9rem',color:'#555'}}>{record.user_no}</td>
                    <td style={{border:'1px solid #ddd',padding:'10px 8px',fontSize:'0.9rem',color:'#555'}}>{record.role}</td>
                    <td style={{border:'1px solid #ddd',padding:'10px 8px',fontSize:'0.9rem',color:'#555'}}>{record.department_name}</td>
                    <td style={{border:'1px solid #ddd',padding:'10px 8px',fontSize:'0.9rem',color:'#555'}}>{record.email}</td>
                    <td style={{border:'1px solid #ddd',padding:'10px 8px',fontSize:'0.9rem',color:'#555'}}>{record.is_active ? 'Active' : 'Inactive'}</td>
                    <td style={{border:'1px solid #ddd',padding:'10px 8px',fontSize:'0.9rem',color:'#555'}}>
                      <button onClick={() => handleEdit(index)} title="Edit" style={{background:'#ff9800',color:'white',padding:'6px 12px',fontSize:'0.9rem',border:'none',borderRadius:'6px',fontWeight:'bold',cursor:'pointer',marginRight:'4px',transition:'background-color 0.2s'}} onMouseOver={e => e.currentTarget.style.background = '#e68900'} onMouseOut={e => e.currentTarget.style.background = '#ff9800'}>
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(index)} title="Delete" style={{background:'#f44336',color:'white',padding:'6px 12px',fontSize:'0.9rem',border:'none',borderRadius:'6px',fontWeight:'bold',cursor:'pointer',transition:'background-color 0.2s'}} onMouseOver={e => e.currentTarget.style.background = '#da190b'} onMouseOut={e => e.currentTarget.style.background = '#f44336'}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Success Popup */}
      {showSavePopup && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0, 0, 0, 0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'white',padding:'24px',borderRadius:'8px',boxShadow:'0 4px 20px rgba(0, 0, 0, 0.3)',maxWidth:'400px',width:'90%',textAlign:'center'}}>
            <h3 style={{margin:'0 0 16px 0',color:'#333'}}>Success</h3>
            <p style={{margin:'0 0 20px 0',color:'#666'}}>User {action === 'Add' ? 'added' : 'updated'} successfully!</p>
            <button onClick={() => setShowSavePopup(false)} style={{background:'#4caf50',color:'white',padding:'8px 16px',borderRadius:'4px',fontSize:'0.95rem',border:'none',fontWeight:'bold',cursor:'pointer',transition:'background-color 0.2s'}} onMouseOver={e => e.currentTarget.style.background = '#45a049'} onMouseOut={e => e.currentTarget.style.background = '#4caf50'}>OK</button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showSelectModal && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0, 0, 0, 0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'white',padding:'24px',borderRadius:'8px',boxShadow:'0 4px 20px rgba(0, 0, 0, 0.3)',maxWidth:'400px',width:'90%',textAlign:'center'}}>
            <h3 style={{margin:'0 0 16px 0',color:'#333'}}>Confirm Delete</h3>
            <p style={{margin:'0 0 20px 0',color:'#666'}}>{selectModalMessage}</p>
            <div style={{display:'flex',gap:'12px',justifyContent:'center'}}>
              <button onClick={confirmDelete} style={{background:'#f44336',color:'white',padding:'8px 16px',borderRadius:'4px',fontSize:'0.95rem',border:'none',fontWeight:'bold',cursor:'pointer',transition:'background-color 0.2s'}} onMouseOver={e => e.currentTarget.style.background = '#da190b'} onMouseOut={e => e.currentTarget.style.background = '#f44336'}>Yes, Delete</button>
              <button onClick={() => setShowSelectModal(false)} style={{background:'#9e9e9e',color:'white',padding:'8px 16px',borderRadius:'4px',fontSize:'0.95rem',border:'none',fontWeight:'bold',cursor:'pointer',transition:'background-color 0.2s'}} onMouseOver={e => e.currentTarget.style.background = '#757575'} onMouseOut={e => e.currentTarget.style.background = '#9e9e9e'}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSetup;
