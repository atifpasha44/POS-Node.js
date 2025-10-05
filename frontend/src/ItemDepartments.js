import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';

const initialState = {
  department_code: '',
  name: '',
  alternate_name: '',
  inactive: false
};

export default function ItemDepartments({ setParentDirty, records, setRecords }) {
  const [isDirty, setIsDirty] = useState(false);
  const [form, setForm] = useState(initialState);
  const [action, setAction] = useState('Add');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedRecordIdx, setSelectedRecordIdx] = useState(null);
  const [showNoChangePopup, setShowNoChangePopup] = useState(false);
  const [selectModalMessage, setSelectModalMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAlternateNameField, setShowAlternateNameField] = useState(true); // TODO: Control via system settings
  const formRef = useRef(null);

  // Load records on component mount
  useEffect(() => {
    loadRecords();
  }, []);

  // Reset message when modal closes
  useEffect(() => {
    if (!showSelectModal) setSelectModalMessage('');
  }, [showSelectModal]);

  const loadRecords = async () => {
    try {
      const response = await axios.get('/api/item-departments');
      if (response.data.success) {
        const loadedRecords = response.data.data || [];
        setRecords(loadedRecords);
      }
    } catch (error) {
      console.error('Error loading item departments:', error);
    }
  };

  // Helper: should fields be disabled
  const isDeleteLocked = action === 'Delete' && selectedRecordIdx !== null;
  const isSearchLocked = action === 'Search' && selectedRecordIdx !== null;
  const isFormReadOnly = action === 'Search' && selectedRecordIdx !== null;
  const isDepartmentCodeLocked = (action === 'Edit' && selectedRecordIdx !== null) || isFormReadOnly;

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    
    let processedValue = value;
    
    // Handle specific field validations
    if (name === 'department_code') {
      // Department code: max 4 characters, alphanumeric
      processedValue = value.slice(0, 4).toUpperCase();
    } else if (name === 'name') {
      // Name: max 20 characters, only letters, numbers, and spaces
      processedValue = value.slice(0, 20).replace(/[^a-zA-Z0-9\s]/g, '');
    } else if (name === 'alternate_name') {
      // Alternate name: max 20 characters, only letters, numbers, and spaces
      processedValue = value.slice(0, 20).replace(/[^a-zA-Z0-9\s]/g, '');
    }
    
    setForm(f => ({ 
      ...f, 
      [name]: type === 'checkbox' ? checked : processedValue 
    }));
    setIsDirty(true);
    if (setParentDirty) setParentDirty(true);
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!form.department_code || form.department_code.trim() === '') {
      errors.department_code = 'Department Code is required.';
    } else if (form.department_code.length < 1 || form.department_code.length > 4) {
      errors.department_code = 'Department Code must be 1-4 characters.';
    }
    
    if (!form.name || form.name.trim() === '') {
      errors.name = 'Department Name is required.';
    } else if (form.name.length > 20) {
      errors.name = 'Department Name cannot exceed 20 characters.';
    }
    
    if (form.alternate_name && form.alternate_name.length > 20) {
      errors.alternate_name = 'Alternate Name cannot exceed 20 characters.';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!isDirty && action !== 'Add') {
      setShowNoChangePopup(true);
      setTimeout(() => setShowNoChangePopup(false), 1800);
      return;
    }
    
    try {
      let response;
      const departmentData = {
        department_code: form.department_code,
        name: form.name,
        alternate_name: form.alternate_name || null,
        inactive: form.inactive,
        created_by: 'admin', // TODO: Get from user session
        modified_by: 'admin' // TODO: Get from user session
      };
      
      if (action === 'Add') {
        response = await axios.post('/api/item-departments', departmentData);
      } else if (action === 'Edit' && selectedRecordIdx !== null) {
        const recordId = records[selectedRecordIdx].id;
        response = await axios.put(`/api/item-departments/${recordId}`, departmentData);
      }
      
      if (response.data.success) {
        setShowSavePopup(true);
        setTimeout(() => setShowSavePopup(false), 1800);
        await loadRecords(); // Reload records
        handleNew(); // Reset form
      } else {
        alert(response.data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving item department:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Error saving item department');
      }
    }
  };

  const handleNew = () => {
    setForm(initialState);
    setAction('Add');
    setSelectedRecordIdx(null);
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
    setFieldErrors({});
  };

  const handleEdit = () => {
    if (!records.length) {
      setSelectModalMessage('No records available to edit.');
      setShowSelectModal(true);
      return;
    }
    setAction('Edit');
    setSelectModalMessage('Please select a record to edit:');
    setShowSelectModal(true);
  };

  const handleDelete = () => {
    if (!records.length) {
      setSelectModalMessage('No records available to delete.');
      setShowSelectModal(true);
      return;
    }
    setAction('Delete');
    setSelectModalMessage('Please select a record to delete:');
    setShowSelectModal(true);
  };

  const handleSearch = () => {
    if (!records.length) {
      setSelectModalMessage('No records available to search.');
      setShowSelectModal(true);
      return;
    }
    setAction('Search');
    setSelectModalMessage('Please select a record to view:');
    setShowSelectModal(true);
  };

  const handleRecordSelect = (idx) => {
    const record = records[idx];
    setForm({
      department_code: record.department_code || '',
      name: record.name || '',
      alternate_name: record.alternate_name || '',
      inactive: Boolean(record.inactive)
    });
    setSelectedRecordIdx(idx);
    setShowSelectModal(false);
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
    
    if (action === 'Delete') {
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = async () => {
    if (selectedRecordIdx === null) return;
    
    try {
      const recordId = records[selectedRecordIdx].id;
      const response = await axios.delete(`/api/item-departments/${recordId}`);
      
      if (response.data.success) {
        await loadRecords(); // Reload records
        setShowDeleteConfirm(false);
        handleNew(); // Reset form
        setShowSavePopup(true);
        setTimeout(() => setShowSavePopup(false), 1800);
      } else {
        alert(response.data.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting item department:', error);
      alert('Error deleting item department');
    }
  };

  const handleExportExcel = () => {
    if (!records.length) {
      alert('No data to export');
      return;
    }

    const exportData = records.map(record => ({
      'Department Code': record.department_code,
      'Name': record.name,
      'Alternate Name': record.alternate_name || '',
      'Status': record.inactive ? 'Inactive' : 'Active',
      'Created By': record.created_by || '',
      'Created Date': record.created_at ? new Date(record.created_at).toLocaleDateString() : '',
      'Modified By': record.modified_by || '',
      'Modified Date': record.updated_at ? new Date(record.updated_at).toLocaleDateString() : ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Item Departments');
    XLSX.writeFile(wb, 'Item_Departments.xlsx');
  };

  const handleExportPDF = () => {
    if (!records.length) {
      alert('No data to export');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Item Departments', 14, 20);

    const headers = [['Department Code', 'Name', 'Alternate Name', 'Status', 'Created By', 'Created Date']];
    const data = records.map(record => [
      record.department_code,
      record.name,
      record.alternate_name || '',
      record.inactive ? 'Inactive' : 'Active',
      record.created_by || '',
      record.created_at ? new Date(record.created_at).toLocaleDateString() : ''
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 30,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [255, 183, 0] }
    });

    doc.save('Item_Departments.pdf');
  };

  const handleAdd = () => {
    setForm(initialState);
    setAction('Add');
    setSelectedRecordIdx(null);
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
    setFieldErrors({});
  };

  const handleClear = () => {
    setForm(initialState);
    setSelectedRecordIdx(null);
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
    setFieldErrors({});
  };

  const handleSave = () => {
    if (formRef.current) {
      formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  return (
    <div className="itemdepartments-panel" style={{background:'#fff',border:'2.5px solid #222',borderRadius:'16px',boxShadow:'0 2px 12px rgba(0,0,0,0.10)',width:'100%',maxWidth:'1200px',margin:'32px auto',padding:'0 0 18px 0',height:'calc(100vh - 120px)',display:'flex',flexDirection:'column',overflowY:'auto',position:'relative'}}>
      {/* Top Control Bar - now sticky */}
      <div style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        borderBottom:'2px solid #e0e0e0',padding:'12px 18px 8px 18px',minWidth:0,
        position:'sticky',top:0,zIndex:10,background:'#fff',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',minWidth:0,flexWrap:'wrap'}}>
          <span style={{fontWeight:'bold',fontSize:'2rem',color:'#222',marginRight:'18px'}}>
            Item Departments
          </span>
          <select
            value={action}
            onChange={e => {
              const val = e.target.value;
              if (val === 'Add') {
                handleAdd();
              } else if (val === 'Edit') {
                setAction('Edit');
                setShowSelectModal(true);
                setSelectModalMessage('Please select a record to edit.');
              } else if (val === 'Delete') {
                setAction('Delete');
                setShowSelectModal(true);
                setSelectModalMessage('Please select a record to delete.');
              } else if (val === 'Search') {
                setAction('Search');
                setShowSelectModal(true);
                setSelectModalMessage('Search for Item Department and click "View" to see full details in read-only mode.');
              }
            }}
            style={{fontWeight:'bold',fontSize:'1rem',padding:'4px 12px',borderRadius:'6px',border:'1.5px solid #bbb',marginRight:'8px'}}
            disabled={isDeleteLocked}
          >
            <option value="Add">Action</option>
            <option value="Add">Add</option>
            <option value="Edit">Edit</option>
            <option value="Delete">Delete</option>
            <option value="Search">Search</option>
          </select>
          <button onClick={handleAdd} title="Add" style={{background:'#e3fcec',border:'2px solid #43a047',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#43a047',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#c8e6c9'} onMouseOut={e=>e.currentTarget.style.background='#e3fcec'} disabled={isDeleteLocked}><span role="img" aria-label="Add">➕</span></button>
          <button onClick={handleEdit} title="Modify/Edit" style={{background:'#e3eafc',border:'2px solid #1976d2',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#1976d2',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#bbdefb'} onMouseOut={e=>e.currentTarget.style.background='#e3eafc'} disabled={isDeleteLocked}><span role="img" aria-label="Edit">✏️</span></button>
          <button onClick={handleDelete} title="Delete" style={{background:'#ffebee',border:'2px solid #e53935',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#e53935',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#ffcdd2'} onMouseOut={e=>e.currentTarget.style.background='#ffebee'} disabled={isDeleteLocked}><span role="img" aria-label="Delete">🗑️</span></button>
          <button onClick={handleSearch} title="Search" style={{background:'#fffde7',border:'2px solid #fbc02d',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#fbc02d',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#fff9c4'} onMouseOut={e=>e.currentTarget.style.background='#fffde7'} disabled={isDeleteLocked}><span role="img" aria-label="Search">🔍</span></button>
          <button
            type="button"
            onClick={handleClear}
            title="Clear"
            style={{background:'#f3e5f5',border:'2px solid #8e24aa',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#8e24aa',marginRight:'4px',cursor:'pointer',transition:'0.2s'}}
            onMouseOver={e=>e.currentTarget.style.background='#e1bee7'}
            onMouseOut={e=>e.currentTarget.style.background='#f3e5f5'}
            disabled={false}
          >
            <span role="img" aria-label="Clear">🧹</span>
          </button>
          <button onClick={handleSave} title="Save" style={{background:'#e3f2fd',border:'2px solid #1976d2',borderRadius:'8px',fontWeight:'bold',color:'#1976d2',fontSize:'1.15rem',padding:'4px 18px',marginLeft:'8px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#bbdefb'} onMouseOut={e=>e.currentTarget.style.background='#e3f2fd'}><span style={{fontWeight:'bold'}}><span role="img" aria-label="Save">💾</span> SAVE</span></button>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'16px',minWidth:0,flexWrap:'wrap'}}>
          <span style={{fontSize:'1.08rem',color:'#888',marginRight:'8px',whiteSpace:'nowrap'}}>Export Report to</span>
          <span
            title="Export to Excel"
            style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:'40px',height:'40px',borderRadius:'50%',background:'#e8f5e9',boxShadow:'0 2px 8px rgba(76,175,80,0.10)',cursor: isDeleteLocked ? 'not-allowed' : 'pointer',border:'2px solid #43a047',marginRight:'6px',transition:'background 0.2s', opacity: isDeleteLocked ? 0.5 : 1}}
            onClick={()=>!isDeleteLocked && handleExportExcel()}
            onMouseOver={e=>!isDeleteLocked && (e.currentTarget.style.background='#c8e6c9')}
            onMouseOut={e=>!isDeleteLocked && (e.currentTarget.style.background='#e8f5e9')}
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#43a047"/>
              <text x="16" y="21" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#fff">X</text>
              <text x="24" y="21" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#fff">L</text>
            </svg>
          </span>
          <span
            title="Export to PDF"
            style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:'40px',height:'40px',borderRadius:'50%',background:'#ffebee',boxShadow:'0 2px 8px rgba(229,57,53,0.10)',cursor: isDeleteLocked ? 'not-allowed' : 'pointer',border:'2px solid #e53935',marginRight:'6px',transition:'background 0.2s', opacity: isDeleteLocked ? 0.5 : 1}}
            onClick={()=>!isDeleteLocked && handleExportPDF()}
            onMouseOver={e=>!isDeleteLocked && (e.currentTarget.style.background='#ffcdd2')}
            onMouseOut={e=>!isDeleteLocked && (e.currentTarget.style.background='#ffebee')}
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

      
      {/* Form Section - single column layout with proper alignment */}
      <form ref={formRef} className="itemdepartments-form" onSubmit={handleSubmit} style={{padding:'32px 32px 0 32px'}}>
        {/* Save confirmation popup */}
        {showSavePopup && (
          <div style={{position:'fixed',top:'30%',left:'50%',transform:'translate(-50%,-50%)',background:'#fff',border:'2px solid #43a047',borderRadius:'12px',padding:'32px 48px',zIndex:1000,boxShadow:'0 4px 24px rgba(0,0,0,0.18)',fontSize:'1.25rem',color:'#43a047',fontWeight:'bold'}}>
            {action === 'Delete' ? 'Records have been successfully deleted.' : 'Data has been saved successfully.'}
          </div>
        )}
        {/* No change popup */}
        {showNoChangePopup && (
          <div style={{position:'fixed',top:'30%',left:'50%',transform:'translate(-50%,-50%)',background:'#fff',border:'2px solid #e53935',borderRadius:'12px',padding:'32px 48px',zIndex:1000,boxShadow:'0 4px 24px rgba(0,0,0,0.18)',fontSize:'1.25rem',color:'#e53935',fontWeight:'bold'}}>
            No data has been modified.
          </div>
        )}
        {/* Record selection modal for Edit/Delete/Search */}
        {showSelectModal && (
          <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.18)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{background:'#fff',borderRadius:'14px',padding:'32px 24px',minWidth:'520px',boxShadow:'0 4px 24px rgba(0,0,0,0.18)',maxHeight:'80vh',overflowY:'auto'}}>
              <div style={{fontWeight:'bold',fontSize:'1.2rem',marginBottom:'18px',color:'#1976d2'}}>{selectModalMessage || 'Select a record to edit/delete'}</div>
              {records.length === 0 ? (
                <div style={{color:'#888',fontSize:'1.05rem'}}>No records found.</div>
              ) : (
                <table style={{width:'100%',borderCollapse:'collapse',marginBottom:'12px'}}>
                  <thead>
                    <tr style={{background:'#e3e3e3'}}>
                      <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Department Code</th>
                      <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Name</th>
                      <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Alternate Name</th>
                      <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Status</th>
                      <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, idx) => (
                      <tr key={record.id} style={{background: idx%2 ? '#f7f7f7' : '#fff'}}>
                        <td style={{padding:'6px 8px'}}>{record.department_code}</td>
                        <td style={{padding:'6px 8px'}}>{record.name}</td>
                        <td style={{padding:'6px 8px'}}>{record.alternate_name || ''}</td>
                        <td style={{padding:'6px 8px'}}>{record.inactive ? 'Inactive' : 'Active'}</td>
                        <td style={{padding:'6px 8px'}}>
                          <button
                            type="button"
                            style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:'6px',padding:'4px 12px',fontWeight:'bold',cursor:'pointer'}}
                            onClick={() => handleRecordSelect(idx)}
                          >
                            {action === 'Search' ? 'View' : 'Select'}
                          </button>
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
        
        {/* Single column form layout */}
        <div style={{display:'flex',flexDirection:'column',gap:'20px',maxWidth:'800px'}}>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222',marginRight:'20px'}}>Department Code</label>
            <input 
              type="text" 
              name="department_code" 
              value={form.department_code} 
              onChange={handleChange} 
              maxLength={4}
              style={{width:'300px',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isDepartmentCodeLocked || isFormReadOnly?'#eee':'#fff', textTransform: 'uppercase'}} 
              disabled={isDepartmentCodeLocked || isFormReadOnly} 
            />
            {fieldErrors.department_code && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.department_code}</span>}
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222',marginRight:'20px'}}>Name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} maxLength={20} style={{width:'300px',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly} />
            {fieldErrors.name && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.name}</span>}
          </div>
          {showAlternateNameField && (
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222',marginRight:'20px'}}>Alternate Name</label>
              <input type="text" name="alternate_name" value={form.alternate_name} onChange={handleChange} maxLength={20} style={{width:'300px',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly} />
              {fieldErrors.alternate_name && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.alternate_name}</span>}
            </div>
          )}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222',marginRight:'20px'}}>Inactive</label>
            <input 
              type="checkbox" 
              name="inactive" 
              checked={form.inactive} 
              onChange={handleChange} 
              disabled={isFormReadOnly}
              style={{transform:'scale(1.5)',marginLeft:'8px'}} 
            />
          </div>
        </div>
      </form>

      
      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div style={{position:'fixed',top:'30%',left:'50%',transform:'translate(-50%,-50%)',background:'#fff',border:'2px solid #e53935',borderRadius:'12px',padding:'32px 48px',zIndex:2000,boxShadow:'0 4px 24px rgba(0,0,0,0.18)',fontSize:'1.25rem',color:'#e53935',fontWeight:'bold'}}>
          <div>Are you sure you want to delete this record?</div>
          <div style={{marginTop:'8px',fontSize:'1.1rem',color:'#333'}}>
            <strong>{form.department_code}</strong> - {form.name}
          </div>
          <div style={{marginTop:'18px',display:'flex',gap:'24px',justifyContent:'center'}}>
            <button onClick={confirmDelete} style={{background:'#e53935',color:'#fff',border:'none',borderRadius:'6px',padding:'8px 22px',fontWeight:'bold',fontSize:'1.08rem',cursor:'pointer'}}>Yes, Delete</button>
            <button onClick={() => {setShowDeleteConfirm(false); handleNew();}} style={{background:'#bbb',color:'#222',border:'none',borderRadius:'6px',padding:'8px 22px',fontWeight:'bold',fontSize:'1.08rem',cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      )}
      
      {/* Bottom section with record count */}
      <div style={{padding:'18px 32px 12px 32px',borderTop:'1px solid #e0e0e0',background:'#f9f9f9',marginTop:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:'1.08rem',color:'#666',fontWeight:'bold'}}>
            Total Records: {records.length}
          </span>
          <span style={{fontSize:'1.08rem',color:'#1976d2',fontWeight:'bold'}}>
            {action === 'Add' && 'Mode: Adding New Record'}
            {action === 'Edit' && selectedRecordIdx !== null && 'Mode: Editing Record'}  
            {action === 'Delete' && selectedRecordIdx !== null && 'Mode: Delete Record'}
            {action === 'Search' && selectedRecordIdx !== null && 'Mode: Viewing Record'}
            {!selectedRecordIdx && action !== 'Add' && 'Mode: Ready'}
          </span>
        </div>
      </div>
    </div>
  );
}