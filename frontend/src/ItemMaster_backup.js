import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const { autoTable } = require('jspdf-autotable');

export default function ItemMaster({ setParentDirty }) {
  const initialState = {
    select_outlets: [],
    applicable_from: '',
    item_code: '',
    inventory_code: '',
    item_name: '',
    short_name: '',
    alternate_name: '',
    tax_code: '',
    item_price_1: '',
    item_price_2: '',
    item_price_3: '',
    item_price_4: '',
    item_printer_1: '',
    item_printer_2: '',
    item_printer_3: '',
    print_group: '',
    item_department: '',
    item_category: '',
    cost: '',
    unit: '',
    set_menu: '',
    item_modifier_group: '',
    status: 'Active',
    in_active: false,
    item_logo: null,
    item_logo_url: ''
  };

  const [form, setForm] = useState(initialState);
  const [action, setAction] = useState('Add');
  const [isDirty, setIsDirty] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedRecordIdx, setSelectedRecordIdx] = useState(null);
  const [showNoChangePopup, setShowNoChangePopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectModalMessage, setSelectModalMessage] = useState('');
  const [records, setRecords] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Master data states
  const [outlets, setOutlets] = useState([]);
  const [taxCodes, setTaxCodes] = useState([]);
  const [printers, setPrinters] = useState([]);
  const [printGroups, setPrintGroups] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [modifierGroups, setModifierGroups] = useState([]);

  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  // Load master data on component mount
  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      // For now, set up some mock data since the API endpoints might not exist
      setOutlets([
        { id: 1, code: 'OUT001', name: 'Main Outlet' },
        { id: 2, code: 'OUT002', name: 'Branch Outlet' }
      ]);
      setTaxCodes([
        { id: 1, code: 'TAX001', name: 'GST', rate: 18 },
        { id: 2, code: 'TAX002', name: 'VAT', rate: 12 }
      ]);
      setPrinters([
        { id: 1, code: 'PRT001', name: 'Kitchen Printer' },
        { id: 2, code: 'PRT002', name: 'Bar Printer' }
      ]);
      setPrintGroups([
        { id: 1, code: 'PG001', name: 'Main Group' },
        { id: 2, code: 'PG002', name: 'Secondary Group' }
      ]);
      setDepartments([
        { id: 1, code: 'DEPT001', name: 'Food' },
        { id: 2, code: 'DEPT002', name: 'Beverage' }
      ]);
      setCategories([
        { id: 1, code: 'CAT001', name: 'Appetizer' },
        { id: 2, code: 'CAT002', name: 'Main Course' }
      ]);
      setUnits([
        { id: 1, code: 'UNIT001', name: 'Piece' },
        { id: 2, code: 'UNIT002', name: 'Kg' }
      ]);
      setModifierGroups([
        { id: 1, code: 'MOD001', name: 'Size Options' },
        { id: 2, code: 'MOD002', name: 'Add-ons' }
      ]);
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  };

  const handleChange = e => {
    const { name, type, checked, value, files } = e.target;
    
    if (name === 'select_outlets') {
      // Handle multi-select outlets
      const currentOutlets = form.select_outlets || [];
      if (checked) {
        setForm(prev => ({
          ...prev,
          [name]: [...currentOutlets, value]
        }));
      } else {
        setForm(prev => ({
          ...prev,
          [name]: currentOutlets.filter(outlet => outlet !== value)
        }));
      }
    } else if (name === 'item_logo' && files && files[0]) {
      const file = files[0];
      setForm(prev => ({
        ...prev,
        [name]: file,
        item_logo_url: URL.createObjectURL(file) // Create preview URL
      }));
    } else if (name === 'applicable_from' && action === 'Add') {
      // Prevent backdated entries when adding new items
      const today = new Date().toISOString().split('T')[0];
      if (value < today) {
        alert('Backdated entries are not allowed. Please select today\'s date or a future date.');
        return; // Don't update the form
      }
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    setIsDirty(true);
    if (setParentDirty) setParentDirty(true);
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!form.select_outlets || form.select_outlets.length === 0) {
      errors.select_outlets = 'Please select at least one outlet.';
    }
    if (!form.applicable_from) {
      errors.applicable_from = 'Applicable From date is required.';
    }
    if (!form.item_code.trim()) {
      errors.item_code = 'Item Code is required.';
    }
    if (!form.item_name.trim()) {
      errors.item_name = 'Item Name is required.';
    }
    if (!form.tax_code) {
      errors.tax_code = 'Tax Code is required.';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const formData = new FormData();
      
      // Append all form fields
      Object.keys(form).forEach(key => {
        if (key === 'select_outlets') {
          formData.append(key, JSON.stringify(form[key]));
        } else if (key === 'item_logo' && form[key]) {
          formData.append(key, form[key]);
        } else if (key !== 'item_logo_url') {
          formData.append(key, form[key] || '');
        }
      });

      let response;
      const baseURL = 'http://localhost:5000/api/item-master';
      
      if (action === 'Add') {
        response = await axios.post(baseURL, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else if (action === 'Edit') {
        const id = records[selectedRecordIdx]?.id;
        response = await axios.put(`${baseURL}/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else if (action === 'Delete') {
        const id = records[selectedRecordIdx]?.id;
        response = await axios.delete(`${baseURL}/${id}`);
      }

      if (response && response.status >= 200 && response.status < 300) {
        setShowSavePopup(true);
        setTimeout(() => setShowSavePopup(false), 1800);
        
        if (action === 'Add') {
          handleClear();
        }
        
        setIsDirty(false);
        if (setParentDirty) setParentDirty(false);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error saving data. Please try again.');
    }
  };

  const loadRecords = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/item-master');
      setRecords(response.data || []);
    } catch (error) {
      console.error('Error loading records:', error);
      setRecords([]);
    }
  };

  const handleRecordSelect = (idx) => {
    const record = records[idx];
    setSelectedRecordIdx(idx);
    setForm({
      select_outlets: record.select_outlets ? JSON.parse(record.select_outlets) : [],
      applicable_from: record.applicable_from || '',
      item_code: record.item_code || '',
      inventory_code: record.inventory_code || '',
      item_name: record.item_name || '',
      short_name: record.short_name || '',
      alternate_name: record.alternate_name || '',
      tax_code: record.tax_code || '',
      item_price_1: record.item_price_1 || '',
      item_price_2: record.item_price_2 || '',
      item_price_3: record.item_price_3 || '',
      item_price_4: record.item_price_4 || '',
      item_printer_1: record.item_printer_1 || '',
      item_printer_2: record.item_printer_2 || '',
      item_printer_3: record.item_printer_3 || '',
      print_group: record.print_group || '',
      item_department: record.item_department || '',
      item_category: record.item_category || '',
      cost: record.cost || '',
      unit: record.unit || '',
      set_menu: record.set_menu || '',
      item_modifier_group: record.item_modifier_group || '',
      status: record.status || 'Active',
      item_logo: null,
      item_logo_url: record.item_logo_path ? `http://localhost:5000/${record.item_logo_path}` : ''
    });
    setShowSelectModal(false);
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
  };

  const handleAdd = () => {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    setForm({...initialState, applicable_from: today});
    setAction('Add');
    setSelectedRecordIdx(null);
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
    setFieldErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClear = () => {
    const today = new Date().toISOString().split('T')[0];
    const resetForm = action === 'Add' ? {...initialState, applicable_from: today} : initialState;
    setForm(resetForm);
    setSelectedRecordIdx(null);
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
    setFieldErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = async () => {
    await loadRecords();
    if (records.length === 0) {
      alert('No records found to edit.');
      return;
    }
    setAction('Edit');
    setSelectModalMessage('Select a record to edit');
    setShowSelectModal(true);
  };

  const handleDelete = async () => {
    await loadRecords();
    if (records.length === 0) {
      alert('No records found to delete.');
      return;
    }
    setAction('Delete');
    setSelectModalMessage('Select a record to delete');
    setShowSelectModal(true);
  };

  const handleSearch = async () => {
    await loadRecords();
    if (records.length === 0) {
      alert('No records found.');
      return;
    }
    setAction('Search');
    setSelectModalMessage('Select a record to view');
    setShowSelectModal(true);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    if (formRef.current) {
      formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  const handleSave = () => {
    if (action === 'Delete') {
      setShowDeleteConfirm(true);
      return;
    }
    if (formRef.current) {
      formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  const handleExportExcel = () => {
    if (records.length === 0) {
      alert('No data to export');
      return;
    }
    
    const ws = XLSX.utils.json_to_sheet(records);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Item Master');
    XLSX.writeFile(wb, 'Item_Master.xlsx');
  };

  const handleExportPDF = () => {
    if (records.length === 0) {
      alert('No data to export');
      return;
    }
    
    const doc = new jsPDF();
    doc.text('Item Master Report', 20, 20);
    
    const tableColumn = ['Item Code', 'Item Name', 'Department', 'Category', 'Status'];
    const tableRows = records.map(record => [
      record.item_code || '',
      record.item_name || '',
      record.item_department || '',
      record.item_category || '',
      record.status || ''
    ]);
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });
    
    doc.save('Item_Master.pdf');
  };

  // Computed values
  const isFormReadOnly = action === 'Search';
  const isItemCodeLocked = action === 'Edit';
  const isDeleteLocked = records.length === 0;

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #ddd',
      borderRadius: '8px',
      margin: '20px',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{position:'sticky',top:0,zIndex:10,background:'#fff',borderBottom:'1px solid #ddd',padding:'16px 32px',borderRadius:'16px 16px 0 0'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h2 style={{margin:0,fontSize:'1.8rem',fontWeight:'bold',color:'#333',letterSpacing:'-0.5px'}}>Item Master</h2>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'16px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
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
            <span style={{fontSize:'1.08rem',color:'#888',marginRight:'8px',whiteSpace:'nowrap'}}>Download Master Data</span>
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
              style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:'40px',height:'40px',borderRadius:'50%',background:'#ffebee',boxShadow:'0 2px 8px rgba(244,67,54,0.10)',cursor: isDeleteLocked ? 'not-allowed' : 'pointer',border:'2px solid #e53935',transition:'background 0.2s', opacity: isDeleteLocked ? 0.5 : 1}}
              onClick={()=>!isDeleteLocked && handleExportPDF()}
              onMouseOver={e=>!isDeleteLocked && (e.currentTarget.style.background='#ffcdd2')}
              onMouseOut={e=>!isDeleteLocked && (e.currentTarget.style.background='#ffebee')}
            >
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="#e53935"/>
                <text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#fff">PDF</text>
              </svg>
            </span>
          </div>
        </div>
      </div>

      <form ref={formRef} className="itemmaster-form" onSubmit={handleSubmit} style={{padding:'32px 32px 0 32px'}}>
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
        {/* Delete confirmation popup */}
        {showDeleteConfirm && (
          <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.18)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{background:'#fff',borderRadius:'14px',padding:'32px 24px',minWidth:'420px',boxShadow:'0 4px 24px rgba(0,0,0,0.18)'}}>
              <div style={{fontWeight:'bold',fontSize:'1.2rem',marginBottom:'18px',color:'#e53935'}}>Confirm Delete</div>
              <div style={{marginBottom:'24px',fontSize:'1.05rem'}}>Are you sure you want to delete this item?</div>
              <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
                <button onClick={confirmDelete} style={{background:'#e53935',color:'#fff',border:'none',borderRadius:'6px',padding:'8px 22px',fontWeight:'bold',fontSize:'1.08rem',cursor:'pointer'}}>Delete</button>
                <button onClick={() => setShowDeleteConfirm(false)} style={{background:'#bbb',color:'#222',border:'none',borderRadius:'6px',padding:'8px 22px',fontWeight:'bold',fontSize:'1.08rem',cursor:'pointer'}}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        {/* Record selection modal for Edit/Delete/Search */}
        {showSelectModal && (
          <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.18)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{background:'#fff',borderRadius:'14px',padding:'32px 24px',minWidth:'600px',boxShadow:'0 4px 24px rgba(0,0,0,0.18)',maxHeight:'80vh',overflowY:'auto'}}>
              <div style={{fontWeight:'bold',fontSize:'1.2rem',marginBottom:'18px',color:'#1976d2'}}>{selectModalMessage || 'Select a record to edit/delete'}</div>
              {records.length === 0 ? (
                <div style={{color:'#888',fontSize:'1.05rem'}}>No records found.</div>
              ) : (
                <table style={{width:'100%',borderCollapse:'collapse',marginBottom:'12px'}}>
                  <thead>
                    <tr style={{background:'#e3e3e3'}}>
                      <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Item Code</th>
                      <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Item Name</th>
                      <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Department</th>
                      <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Status</th>
                      <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, idx) => (
                      <tr key={record.id} style={{background: idx%2 ? '#f7f7f7' : '#fff'}}>
                        <td style={{padding:'6px 8px'}}>{record.item_code}</td>
                        <td style={{padding:'6px 8px'}}>{record.item_name}</td>
                        <td style={{padding:'6px 8px'}}>{record.item_department}</td>
                        <td style={{padding:'6px 8px'}}>{record.status}</td>
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

        {/* Form Fields Layout */}
        <div style={{display:'flex',gap:'32px',maxWidth:'1400px'}}>
          {/* Left Column - Form Fields */}
          <div style={{flex:'2',display:'flex',flexDirection:'column',gap:'16px'}}>
            
            {/* Basic Information Section */}
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              {/* Outlet Code and Applicable From Row */}
              <div style={{display:'flex',alignItems:'center',gap:'32px'}}>
                <div style={{display:'flex',alignItems:'center'}}>
                  <label style={{width:'120px',fontWeight:'bold',fontSize:'1.08rem',color:'#222',marginRight:'12px'}}>Outlet Code</label>
                  <select 
                    name="select_outlets" 
                    value={form.select_outlets[0] || ''} 
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm(prev => ({...prev, select_outlets: value ? [value] : []}));
                      setIsDirty(true);
                    }}
                    style={{width:'200px',height:'34px',fontSize:'1rem',border:'1px solid #ccc',borderRadius:'4px',padding:'0 8px',background: isFormReadOnly?'#f5f5f5':'#fff'}} 
                    disabled={isFormReadOnly}
                  >
                    <option value="">Select Outlet</option>
                    {outlets.map(outlet => (
                      <option key={outlet.id} value={outlet.code || outlet.id}>
                        {outlet.name || outlet.outlet_name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.select_outlets && <span style={{color:'red',fontSize:'0.9rem',marginLeft:'8px'}}>{fieldErrors.select_outlets}</span>}
                </div>
                <div style={{display:'flex',alignItems:'center'}}>
                  <label style={{width:'120px',fontWeight:'bold',fontSize:'1.08rem',color:'#222',marginRight:'12px'}}>Applicable From</label>
                  <input 
                    type="date" 
                    name="applicable_from" 
                    value={form.applicable_from} 
                    onChange={handleChange}
                    min={action === 'Add' ? new Date().toISOString().split('T')[0] : ''}
                    style={{width:'160px',height:'34px',fontSize:'1rem',border:'1px solid #ccc',borderRadius:'4px',padding:'0 8px',background: isFormReadOnly?'#f5f5f5':'#fff'}} 
                    disabled={isFormReadOnly} 
                  />
                  {fieldErrors.applicable_from && <span style={{color:'red',fontSize:'0.9rem',marginLeft:'8px'}}>{fieldErrors.applicable_from}</span>}
                </div>
              </div>

              {/* Item Code and Inventory Code Row */}
              <div style={{display:'flex',alignItems:'center',gap:'32px'}}>
                <div style={{display:'flex',alignItems:'center'}}>
                  <label style={{width:'120px',fontWeight:'bold',fontSize:'1.08rem',color:'#222',marginRight:'12px'}}>Item Code</label>
                  <input 
                    type="text" 
                    name="item_code" 
                    value={form.item_code} 
                    onChange={handleChange} 
                    style={{width:'200px',height:'34px',fontSize:'1rem',border:'1px solid #ccc',borderRadius:'4px',padding:'0 8px',background: isItemCodeLocked || isFormReadOnly?'#f5f5f5':'#fff', textTransform: 'uppercase'}} 
                    disabled={isItemCodeLocked || isFormReadOnly} 
                  />
                  {fieldErrors.item_code && <span style={{color:'red',fontSize:'0.9rem',marginLeft:'8px'}}>{fieldErrors.item_code}</span>}
                </div>
                <div style={{display:'flex',alignItems:'center'}}>
                  <label style={{width:'120px',fontWeight:'bold',fontSize:'1.08rem',color:'#222',marginRight:'12px'}}>Inventory Code</label>
                  <input 
                    type="text" 
                    name="inventory_code" 
                    value={form.inventory_code} 
                    onChange={handleChange} 
                    style={{width:'160px',height:'34px',fontSize:'1rem',border:'1px solid #ccc',borderRadius:'4px',padding:'0 8px',background: isFormReadOnly?'#f5f5f5':'#fff'}} 
                    disabled={isFormReadOnly} 
                  />
                </div>
              </div>

              {/* Item Name and Short Name Row */}
              <div style={{display:'flex',alignItems:'center',gap:'32px'}}>
                <div style={{display:'flex',alignItems:'center'}}>
                  <label style={{width:'120px',fontWeight:'bold',fontSize:'1.08rem',color:'#222',marginRight:'12px'}}>Item Name</label>
                  <input 
                    type="text" 
                    name="item_name" 
                    value={form.item_name} 
                    onChange={handleChange} 
                    maxLength={50} 
                    style={{width:'200px',height:'34px',fontSize:'1rem',border:'1px solid #ccc',borderRadius:'4px',padding:'0 8px',background: isFormReadOnly?'#f5f5f5':'#fff'}} 
                    disabled={isFormReadOnly} 
                  />
                  {fieldErrors.item_name && <span style={{color:'red',fontSize:'0.9rem',marginLeft:'8px'}}>{fieldErrors.item_name}</span>}
                </div>
                <div style={{display:'flex',alignItems:'center'}}>
                  <label style={{width:'120px',fontWeight:'bold',fontSize:'1.08rem',color:'#222',marginRight:'12px'}}>Short Name</label>
                  <input 
                    type="text" 
                    name="short_name" 
                    value={form.short_name} 
                    onChange={handleChange} 
                    maxLength={20}
                    style={{width:'160px',height:'34px',fontSize:'1rem',border:'1px solid #ccc',borderRadius:'4px',padding:'0 8px',background: isFormReadOnly?'#f5f5f5':'#fff'}} 
                    disabled={isFormReadOnly} 
                  />
                </div>
              </div>

              {/* Alternate Name and Tax Code Row */}
              <div style={{display:'flex',alignItems:'center',gap:'32px'}}>
                <div style={{display:'flex',alignItems:'center'}}>
                  <label style={{width:'120px',fontWeight:'bold',fontSize:'1.08rem',color:'#222',marginRight:'12px'}}>Alternate Name</label>
                  <input 
                    type="text" 
                    name="alternate_name" 
                    value={form.alternate_name} 
                    onChange={handleChange} 
                    style={{width:'200px',height:'34px',fontSize:'1rem',border:'1px solid #ccc',borderRadius:'4px',padding:'0 8px',background: isFormReadOnly?'#f5f5f5':'#fff'}} 
                    disabled={isFormReadOnly} 
                  />
                </div>
                <div style={{display:'flex',alignItems:'center'}}>
                  <label style={{width:'120px',fontWeight:'bold',fontSize:'1.08rem',color:'#222',marginRight:'12px'}}>Tax Code</label>
                  <select 
                    name="tax_code" 
                    value={form.tax_code} 
                    onChange={handleChange} 
                    style={{width:'160px',height:'34px',fontSize:'1rem',border:'1px solid #ccc',borderRadius:'4px',padding:'0 8px',background: isFormReadOnly?'#f5f5f5':'#fff'}} 
                    disabled={isFormReadOnly}
                  >
                    <option value="">Select Tax Code</option>
                    {taxCodes.map(tax => (
                      <option key={tax.id || tax.code} value={tax.code}>
                        {tax.name} ({tax.rate}%)
                      </option>
                    ))}
                  </select>
                  {fieldErrors.tax_code && <span style={{color:'red',fontSize:'0.9rem',marginLeft:'8px'}}>{fieldErrors.tax_code}</span>}
                </div>
              </div>

              {/* Cost and Unit Row */}
              <div style={{display:'flex',alignItems:'center',gap:'32px'}}>
                <div style={{display:'flex',alignItems:'center'}}>
                  <label style={{width:'120px',fontWeight:'bold',fontSize:'1.08rem',color:'#222',marginRight:'12px'}}>Cost</label>
                  <input 
                    type="number" 
                    name="cost" 
                    value={form.cost} 
                    onChange={handleChange} 
                    min="0" 
                    step="0.01"
                    style={{width:'200px',height:'34px',fontSize:'1rem',border:'1px solid #ccc',borderRadius:'4px',padding:'0 8px',background: isFormReadOnly?'#f5f5f5':'#fff'}} 
                    disabled={isFormReadOnly} 
                  />
                </div>
                <div style={{display:'flex',alignItems:'center'}}>
                  <label style={{width:'120px',fontWeight:'bold',fontSize:'1.08rem',color:'#222',marginRight:'12px'}}>Unit</label>
                  <select 
                    name="unit" 
                    value={form.unit} 
                    onChange={handleChange} 
                    style={{width:'160px',height:'34px',fontSize:'1rem',border:'1px solid #ccc',borderRadius:'4px',padding:'0 8px',background: isFormReadOnly?'#f5f5f5':'#fff'}} 
                    disabled={isFormReadOnly}
                  >
                    <option value="">Select Unit</option>
                    {units.map(unit => (
                      <option key={unit.id} value={unit.code}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Department, Category, and Additional Fields Row */}
              <div style={{display:'flex',alignItems:'center',gap:'32px'}}>
                <div style={{display:'flex',alignItems:'center'}}>
                  <label style={{width:'120px',fontWeight:'bold',fontSize:'1.08rem',color:'#222',marginRight:'12px'}}>Department</label>
                  <select 
                    name="item_department" 
                    value={form.item_department} 
                    onChange={handleChange} 
                    style={{width:'200px',height:'34px',fontSize:'1rem',border:'1px solid #ccc',borderRadius:'4px',padding:'0 8px',background: isFormReadOnly?'#f5f5f5':'#fff'}} 
                    disabled={isFormReadOnly}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.code}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{display:'flex',alignItems:'center'}}>
                  <label style={{width:'120px',fontWeight:'bold',fontSize:'1.08rem',color:'#222',marginRight:'12px'}}>Category</label>
                  <select 
                    name="item_category" 
                    value={form.item_category} 
                    onChange={handleChange} 
                    style={{width:'160px',height:'34px',fontSize:'1rem',border:'1px solid #ccc',borderRadius:'4px',padding:'0 8px',background: isFormReadOnly?'#f5f5f5':'#fff'}} 
                    disabled={isFormReadOnly}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.code}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Item Price Level Section with Border */}
              <div style={{border:'1px solid #ddd',borderRadius:'8px',padding:'16px',marginTop:'16px'}}>
                <h3 style={{margin:'0 0 12px 0',fontSize:'1.1rem',fontWeight:'bold',color:'#333'}}>Item Price Level</h3>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                  <div style={{display:'flex',alignItems:'center'}}>
                    <label style={{width:'80px',fontWeight:'bold',fontSize:'1rem',color:'#222',marginRight:'12px'}}>Price 1</label>
                    <input 
                      type="number" 
                      name="item_price_1" 
                      value={form.item_price_1} 
                      onChange={handleChange} 
                      min="0" 
                      step="0.01" 
                      style={{width:'120px',height:'34px',fontSize:'1rem',border:'1px solid #ccc',borderRadius:'4px',padding:'0 8px',background: isFormReadOnly?'#f5f5f5':'#fff'}} 
                      disabled={isFormReadOnly} 
                    />
                  </div>
                  <div style={{display:'flex',alignItems:'center'}}>
                    <label style={{width:'80px',fontWeight:'bold',fontSize:'1rem',color:'#222',marginRight:'12px'}}>Price 2</label>
                    <input 
                      type="number" 
                      name="item_price_2" 
                      value={form.item_price_2} 
                      onChange={handleChange} 
                      min="0" 
                      step="0.01" 
                      style={{width:'120px',height:'34px',fontSize:'1rem',border:'1px solid #ccc',borderRadius:'4px',padding:'0 8px',background: isFormReadOnly?'#f5f5f5':'#fff'}} 
                      disabled={isFormReadOnly} 
                    />
                  </div>
                  <div style={{display:'flex',alignItems:'center'}}>
                    <label style={{width:'80px',fontWeight:'bold',fontSize:'1rem',color:'#222',marginRight:'12px'}}>Price 3</label>
                    <input 
                      type="number" 
                      name="item_price_3" 
                      value={form.item_price_3} 
                      onChange={handleChange} 
                      min="0" 
                      step="0.01" 
                      style={{width:'120px',height:'34px',fontSize:'1rem',border:'1px solid #ccc',borderRadius:'4px',padding:'0 8px',background: isFormReadOnly?'#f5f5f5':'#fff'}} 
                      disabled={isFormReadOnly} 
                    />
                  </div>
                  <div style={{display:'flex',alignItems:'center'}}>
                    <label style={{width:'80px',fontWeight:'bold',fontSize:'1rem',color:'#222',marginRight:'12px'}}>Price 4</label>
                    <input 
                      type="number" 
                      name="item_price_4" 
                      value={form.item_price_4} 
                      onChange={handleChange} 
                      min="0" 
                      step="0.01" 
                      style={{width:'120px',height:'34px',fontSize:'1rem',border:'1px solid #ccc',borderRadius:'4px',padding:'0 8px',background: isFormReadOnly?'#f5f5f5':'#fff'}} 
                      disabled={isFormReadOnly} 
                    />
                  </div>
                </div>
              </div>

              {/* Item Printers Section with Border */}
              <div style={{border:'1px solid #ddd',borderRadius:'8px',padding:'16px',marginTop:'16px'}}>
                <h3 style={{margin:'0 0 12px 0',fontSize:'1.1rem',fontWeight:'bold',color:'#333'}}>Item Printers</h3>
                <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                  <div style={{display:'flex',alignItems:'center'}}>
                    <label style={{width:'80px',fontWeight:'bold',fontSize:'1rem',color:'#222',marginRight:'12px'}}>Printer 1</label>
                    <select 
                      name="item_printer_1" 
                      value={form.item_printer_1} 
                      onChange={handleChange} 
                      style={{width:'200px',height:'34px',fontSize:'1rem',border:'1px solid #ccc',borderRadius:'4px',padding:'0 8px',background: isFormReadOnly?'#f5f5f5':'#fff'}} 
                      disabled={isFormReadOnly}
                    >
                      <option value="">Select Printer</option>
                      {printers.map(printer => (
                        <option key={printer.id} value={printer.code}>
                          {printer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{display:'flex',alignItems:'center'}}>
                    <label style={{width:'80px',fontWeight:'bold',fontSize:'1rem',color:'#222',marginRight:'12px'}}>Printer 2</label>
                    <select 
                      name="item_printer_2" 
                      value={form.item_printer_2} 
                      onChange={handleChange} 
                      style={{width:'200px',height:'34px',fontSize:'1rem',border:'1px solid #ccc',borderRadius:'4px',padding:'0 8px',background: isFormReadOnly?'#f5f5f5':'#fff'}} 
                      disabled={isFormReadOnly}
                    >
                      <option value="">Select Printer</option>
                      {printers.map(printer => (
                        <option key={printer.id} value={printer.code}>
                          {printer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{display:'flex',alignItems:'center'}}>
                    <label style={{width:'80px',fontWeight:'bold',fontSize:'1rem',color:'#222',marginRight:'12px'}}>Printer 3</label>
                    <select 
                      name="item_printer_3" 
                      value={form.item_printer_3} 
                      onChange={handleChange} 
                      style={{width:'200px',height:'34px',fontSize:'1rem',border:'1px solid #ccc',borderRadius:'4px',padding:'0 8px',background: isFormReadOnly?'#f5f5f5':'#fff'}} 
                      disabled={isFormReadOnly}
                    >
                      <option value="">Select Printer</option>
                      {printers.map(printer => (
                        <option key={printer.id} value={printer.code}>
                          {printer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Fields Row */}
              <div style={{display:'flex',alignItems:'center',gap:'32px',marginTop:'16px'}}>
                <div style={{display:'flex',alignItems:'center'}}>
                  <label style={{width:'120px',fontWeight:'bold',fontSize:'1.08rem',color:'#222',marginRight:'12px'}}>Print Group</label>
                  <select 
                    name="print_group" 
                    value={form.print_group} 
                    onChange={handleChange} 
                    style={{width:'200px',height:'34px',fontSize:'1rem',border:'1px solid #ccc',borderRadius:'4px',padding:'0 8px',background: isFormReadOnly?'#f5f5f5':'#fff'}} 
                    disabled={isFormReadOnly}
                  >
                    <option value="">Select Print Group</option>
                    {printGroups.map(group => (
                      <option key={group.id} value={group.code}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{display:'flex',alignItems:'center'}}>
                  <label style={{width:'120px',fontWeight:'bold',fontSize:'1.08rem',color:'#222',marginRight:'12px'}}>Status</label>
                  <select 
                    name="status" 
                    value={form.status} 
                    onChange={handleChange} 
                    style={{width:'160px',height:'34px',fontSize:'1rem',border:'1px solid #ccc',borderRadius:'4px',padding:'0 8px',background: isFormReadOnly?'#f5f5f5':'#fff'}} 
                    disabled={isFormReadOnly}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Additional fields for completeness */}
              <div style={{display:'flex',alignItems:'center',gap:'32px'}}>
                <div style={{display:'flex',alignItems:'center'}}>
                  <label style={{width:'120px',fontWeight:'bold',fontSize:'1.08rem',color:'#222',marginRight:'12px'}}>Set Menu</label>
                  <select 
                    name="set_menu" 
                    value={form.set_menu} 
                    onChange={handleChange} 
                    style={{width:'200px',height:'34px',fontSize:'1rem',border:'1px solid #ccc',borderRadius:'4px',padding:'0 8px',background: isFormReadOnly?'#f5f5f5':'#fff'}} 
                    disabled={isFormReadOnly}
                  >
                    <option value="">Select Set Menu</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div style={{display:'flex',alignItems:'center'}}>
                  <label style={{width:'120px',fontWeight:'bold',fontSize:'1.08rem',color:'#222',marginRight:'12px'}}>Modifier Group</label>
                  <select 
                    name="item_modifier_group" 
                    value={form.item_modifier_group} 
                    onChange={handleChange} 
                    style={{width:'160px',height:'34px',fontSize:'1rem',border:'1px solid #ccc',borderRadius:'4px',padding:'0 8px',background: isFormReadOnly?'#f5f5f5':'#fff'}} 
                    disabled={isFormReadOnly}
                  >
                    <option value="">Select Modifier Group</option>
                    {modifierGroups.map(group => (
                      <option key={group.id} value={group.code}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Image Section */}
          <div style={{flex:'1',display:'flex',flexDirection:'column',gap:'16px'}}>
            {/* Image Banner Section */}
            <div style={{border:'1px solid #ddd',borderRadius:'8px',padding:'16px',background:'#f9f9f9'}}>
              <h3 style={{margin:'0 0 12px 0',fontSize:'1.1rem',fontWeight:'bold',color:'#333'}}>Item Image</h3>
              
              {/* Image Display Area */}
              <div style={{
                border:'2px dashed #ccc',
                borderRadius:'8px',
                padding:'20px',
                textAlign:'center',
                minHeight:'200px',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                background:'#fff',
                marginBottom:'12px'
              }}>
                {form.item_logo_url ? (
                  <img 
                    src={form.item_logo_url} 
                    alt="Item Logo" 
                    style={{
                      maxWidth:'100%',
                      maxHeight:'180px',
                      objectFit:'contain',
                      borderRadius:'4px'
                    }}
                  />
                ) : (
                  <div style={{color:'#888',fontSize:'14px'}}>
                    <div style={{fontSize:'48px',marginBottom:'8px'}}>📷</div>
                    <div>No image selected</div>
                  </div>
                )}
              </div>
              
              {/* File Upload Controls */}
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  name="item_logo" 
                  onChange={handleChange} 
                  accept="image/*"
                  style={{
                    fontSize:'1rem',
                    padding:'8px',
                    border:'1px solid #ccc',
                    borderRadius:'4px',
                    background:'#fff'
                  }} 
                  disabled={isFormReadOnly} 
                />
                {form.item_logo && (
                  <div style={{fontSize:'0.9rem',color:'#43a047',textAlign:'center'}}>
                    File selected: {form.item_logo.name}
                  </div>
                )}
                {!isFormReadOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    style={{
                      background:'#1976d2',
                      color:'#fff',
                      border:'none',
                      borderRadius:'4px',
                      padding:'8px 16px',
                      fontSize:'1rem',
                      cursor:'pointer',
                      transition:'0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#1565c0'}
                    onMouseOut={e => e.currentTarget.style.background = '#1976d2'}
                  >
                    📁 Choose Image
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}