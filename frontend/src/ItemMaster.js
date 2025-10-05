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
    item_logo: null
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
  const [itemDepartments, setItemDepartments] = useState([]);
  const [itemCategories, setItemCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [setMenus, setSetMenus] = useState([]);
  const [modifierGroups, setModifierGroups] = useState([]);
  
  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  // Computed values
  const isItemCodeLocked = action === 'Edit' || action === 'Search';
  const isFormReadOnly = action === 'Search';
  const isDeleteLocked = false; // Can be controlled based on business rules

  // Load records and master data on component mount
  useEffect(() => {
    loadRecords();
    loadMasterData();
  }, []);

  const loadRecords = async () => {
    try {
      const response = await axios.get('/api/item-master');
      if (response.data.success) {
        setRecords(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading item master:', error);
    }
  };

  const loadMasterData = async () => {
    try {
      // Load all master data in parallel
      const [
        outletsRes,
        taxCodesRes,
        departmentsRes,
        categoriesRes
      ] = await Promise.all([
        axios.get('/api/outlets').catch(() => ({ data: { success: true, data: [] } })),
        axios.get('/api/tax-codes').catch(() => ({ data: { success: true, data: [] } })),
        axios.get('/api/item-departments'),
        axios.get('/api/item-categories')
      ]);

      if (outletsRes.data.success) setOutlets(outletsRes.data.data || []);
      if (taxCodesRes.data.success) setTaxCodes(taxCodesRes.data.data || []);
      if (departmentsRes.data.success) setItemDepartments(departmentsRes.data.data || []);
      if (categoriesRes.data.success) setItemCategories(categoriesRes.data.data || []);

      // Mock data for other masters (can be replaced with API calls)
      setPrinters([
        { id: 1, name: 'Kitchen Printer', code: 'KIT_PRT' },
        { id: 2, name: 'Bar Printer', code: 'BAR_PRT' },
        { id: 3, name: 'Bakery Printer', code: 'BAK_PRT' }
      ]);
      
      setPrintGroups([
        { id: 1, name: 'Starters', code: 'STARTER' },
        { id: 2, name: 'Main Course', code: 'MAIN' },
        { id: 3, name: 'Beverages', code: 'BEV' },
        { id: 4, name: 'Desserts', code: 'DESSERT' }
      ]);

      setUnits([
        { id: 1, name: 'Plate', code: 'PCS' },
        { id: 2, name: 'Bottle', code: 'BTL' },
        { id: 3, name: 'Glass', code: 'GLS' },
        { id: 4, name: 'Kilogram', code: 'KG' },
        { id: 5, name: 'Litre', code: 'LTR' }
      ]);

      setSetMenus([
        { id: 1, name: 'Lunch Special', code: 'LUNCH_SP' },
        { id: 2, name: 'Dinner Combo', code: 'DINNER_CB' },
        { id: 3, name: 'Family Pack', code: 'FAMILY_PK' }
      ]);

      setModifierGroups([
        { id: 1, name: 'Spice Level', code: 'SPICE' },
        { id: 2, name: 'Extra Toppings', code: 'TOPPING' },
        { id: 3, name: 'Size Options', code: 'SIZE' }
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
      setForm(prev => ({
        ...prev,
        [name]: files[0]
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
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!form.item_code || form.item_code.trim() === '') {
      errors.item_code = 'Item Code is required.';
    }
    
    if (!form.item_name || form.item_name.trim() === '') {
      errors.item_name = 'Item Name is required.';
    } else if (form.item_name.length > 50) {
      errors.item_name = 'Item Name cannot exceed 50 characters.';
    }
    
    if (form.short_name && form.short_name.length > 20) {
      errors.short_name = 'Short Name cannot exceed 20 characters.';
    }
    
    if (!form.applicable_from) {
      errors.applicable_from = 'Applicable From date is required.';
    }
    
    if (!form.item_department) {
      errors.item_department = 'Item Department is required.';
    }
    
    if (!form.item_category) {
      errors.item_category = 'Item Category is required.';
    }
    
    // Validate numeric fields
    ['item_price_1', 'item_price_2', 'item_price_3', 'item_price_4', 'cost'].forEach(field => {
      if (form[field] && (isNaN(form[field]) || form[field] < 0)) {
        errors[field] = `${field.replace('_', ' ')} must be a valid positive number.`;
      }
    });
    
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
      const formData = new FormData();
      
      // Append all form fields
      Object.keys(form).forEach(key => {
        if (key === 'select_outlets') {
          formData.append(key, JSON.stringify(form[key]));
        } else if (key === 'item_logo' && form[key]) {
          formData.append(key, form[key]);
        } else {
          formData.append(key, form[key] || '');
        }
      });
      
      formData.append('created_by', 'admin'); // TODO: Get from user session
      formData.append('modified_by', 'admin'); // TODO: Get from user session
      
      if (action === 'Add') {
        response = await axios.post('/api/item-master', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else if (action === 'Edit' && selectedRecordIdx !== null) {
        const recordId = records[selectedRecordIdx].id;
        response = await axios.put(`/api/item-master/${recordId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
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
      console.error('Error saving item master:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Error saving item master');
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
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      select_outlets: JSON.parse(record.select_outlets || '[]'),
      applicable_from: record.applicable_from || '',
      item_code: record.item_code || '',
      inventory_code: record.inventory_code || '',
      item_name: record.item_name || '',
      short_name: record.short_name || '',
      alternate_name: record.alternate_name || '',
      tax_code: record.tax_code || '',
      item_price_1: record.item_price_1?.toString() || '',
      item_price_2: record.item_price_2?.toString() || '',
      item_price_3: record.item_price_3?.toString() || '',
      item_price_4: record.item_price_4?.toString() || '',
      item_printer_1: record.item_printer_1 || '',
      item_printer_2: record.item_printer_2 || '',
      item_printer_3: record.item_printer_3 || '',
      print_group: record.print_group || '',
      item_department: record.item_department || '',
      item_category: record.item_category || '',
      cost: record.cost?.toString() || '',
      unit: record.unit || '',
      set_menu: record.set_menu || '',
      item_modifier_group: record.item_modifier_group || '',
      status: record.status || 'Active',
      item_logo: null // File will be handled separately
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
      const response = await axios.delete(`/api/item-master/${recordId}`);
      
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
      console.error('Error deleting item master:', error);
      alert('Error deleting item master');
    }
  };

  const handleExportExcel = () => {
    if (!records.length) {
      alert('No data to export');
      return;
    }

    const exportData = records.map(record => ({
      'Item Code': record.item_code,
      'Item Name': record.item_name,
      'Short Name': record.short_name || '',
      'Department': record.item_department,
      'Category': record.item_category,
      'Price 1': record.item_price_1 || '',
      'Price 2': record.item_price_2 || '',
      'Price 3': record.item_price_3 || '',
      'Price 4': record.item_price_4 || '',
      'Cost': record.cost || '',
      'Unit': record.unit || '',
      'Status': record.status,
      'Created By': record.created_by || '',
      'Created Date': record.created_at ? new Date(record.created_at).toLocaleDateString() : '',
      'Modified By': record.modified_by || '',
      'Modified Date': record.updated_at ? new Date(record.updated_at).toLocaleDateString() : ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Item Master');
    XLSX.writeFile(wb, 'Item_Master.xlsx');
  };

  const handleExportPDF = () => {
    if (!records.length) {
      alert('No data to export');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Item Master', 14, 20);

    const headers = [['Item Code', 'Item Name', 'Department', 'Category', 'Price 1', 'Status']];
    const data = records.map(record => [
      record.item_code,
      record.item_name,
      record.item_department,
      record.item_category,
      record.item_price_1 || '',
      record.status
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [255, 183, 0] }
    });

    doc.save('Item_Master.pdf');
  };

  const handleAdd = () => {
    setForm(initialState);
    setAction('Add');
    setSelectedRecordIdx(null);
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
    setFieldErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClear = () => {
    setForm(initialState);
    setSelectedRecordIdx(null);
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
    setFieldErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCancel = () => {
    handleClear();
  };

  const handleSave = () => {
    if (formRef.current) {
      formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  const handleExit = () => {
    // This could close the form or navigate away - implement based on your navigation needs
    if (window.confirm('Are you sure you want to exit? Any unsaved changes will be lost.')) {
      handleClear();
      // Add navigation logic here if needed
    }
  };

  return (
    <div className="itemmaster-panel" style={{background:'#fff',border:'2.5px solid #222',borderRadius:'16px',boxShadow:'0 2px 12px rgba(0,0,0,0.10)',width:'100%',maxWidth:'1400px',margin:'32px auto',padding:'0 0 18px 0',height:'calc(100vh - 120px)',display:'flex',flexDirection:'column',overflowY:'auto',position:'relative'}}>
      {/* Top Control Bar - now sticky */}
      <div style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        borderBottom:'2px solid #e0e0e0',padding:'12px 18px 8px 18px',minWidth:0,
        position:'sticky',top:0,zIndex:10,background:'#fff',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',minWidth:0,flexWrap:'wrap'}}>
          <span style={{fontWeight:'bold',fontSize:'2rem',color:'#222',marginRight:'18px'}}>
            Item Master
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
                setSelectModalMessage('Search for Item Master and click "View" to see full details in read-only mode.');
              }
            }}
            style={{fontWeight:'bold',fontSize:'1rem',padding:'4px 12px',borderRadius:'6px',border:'1.5px solid #bbb',marginRight:'8px'}}
            disabled={isDeleteLocked}
          >
            <option value="Add">Action</option>
            <option value="Add">Add</option>
            <option value="Edit">Modify</option>
            <option value="Delete">Delete</option>
            <option value="Search">Search</option>
          </select>
          <button onClick={handleAdd} title="Add" style={{background:'#e3fcec',border:'2px solid #43a047',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#43a047',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#c8e6c9'} onMouseOut={e=>e.currentTarget.style.background='#e3fcec'} disabled={isDeleteLocked}><span role="img" aria-label="Add">➕</span></button>
          <button onClick={handleEdit} title="Modify/Edit" style={{background:'#e3eafc',border:'2px solid #1976d2',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#1976d2',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#bbdefb'} onMouseOut={e=>e.currentTarget.style.background='#e3eafc'} disabled={isDeleteLocked}><span role="img" aria-label="Edit">✏️</span></button>
          <button onClick={handleDelete} title="Delete" style={{background:'#ffebee',border:'2px solid #e53935',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#e53935',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#ffcdd2'} onMouseOut={e=>e.currentTarget.style.background='#ffebee'} disabled={isDeleteLocked}><span role="img" aria-label="Delete">🗑️</span></button>
          <button onClick={handleSearch} title="Search" style={{background:'#fffde7',border:'2px solid #fbc02d',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#fbc02d',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#fff9c4'} onMouseOut={e=>e.currentTarget.style.background='#fffde7'} disabled={isDeleteLocked}><span role="img" aria-label="Search">🔍</span></button>
          <button
            type="button"
            onClick={handleCancel}
            title="Cancel"
            style={{background:'#f3e5f5',border:'2px solid #8e24aa',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#8e24aa',marginRight:'4px',cursor:'pointer',transition:'0.2s'}}
            onMouseOver={e=>e.currentTarget.style.background='#e1bee7'}
            onMouseOut={e=>e.currentTarget.style.background='#f3e5f5'}
            disabled={false}
          >
            <span role="img" aria-label="Cancel">❌</span>
          </button>
          <button onClick={handleSave} title="Save" style={{background:'#e3f2fd',border:'2px solid #1976d2',borderRadius:'8px',fontWeight:'bold',color:'#1976d2',fontSize:'1.15rem',padding:'4px 18px',marginLeft:'8px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#bbdefb'} onMouseOut={e=>e.currentTarget.style.background='#e3f2fd'}><span style={{fontWeight:'bold'}}><span role="img" aria-label="Save">💾</span> SAVE</span></button>
          <button
            type="button"
            onClick={handleExit}
            title="Exit"
            style={{background:'#ffebee',border:'2px solid #e53935',borderRadius:'8px',fontWeight:'bold',color:'#e53935',fontSize:'1.15rem',padding:'4px 18px',marginLeft:'8px',cursor:'pointer',transition:'0.2s'}}
            onMouseOver={e=>e.currentTarget.style.background='#ffcdd2'}
            onMouseOut={e=>e.currentTarget.style.background='#ffebee'}
          >
            <span style={{fontWeight:'bold'}}><span role="img" aria-label="Exit">🚪</span> EXIT</span>
          </button>
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
            style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:'40px',height:'40px',borderRadius:'50%',background:'#ffebee',boxShadow:'0 2px 8px rgba(229,57,53,0.10)',cursor: isDeleteLocked ? 'not-allowed' : 'pointer',border:'2px solid #e53935',marginRight:'6px',transition:'background 0.2s', opacity: isDeleteLocked ? 0.5 : 1}}
            onClick={()=>!isDeleteLocked && handleExportPDF()}
            onMouseOver={e=>!isDeleteLocked && (e.currentTarget.style.background='#ffcdd2')}
            onMouseOut={e=>!isDeleteLocked && (e.currentTarget.style.background='#ffebee')}
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#e53935"/>
              <text x="16" y="21" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#fff">P</text>
              <text x="24" y="21" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#fff">D</text>
              <text x="30" y="21" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#fff">F</text>
            </svg>
          </span>
        </div>
      </div>

      {/* Form Section */}
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

        {/* Form Fields in two columns */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'32px',maxWidth:'1200px'}}>
          {/* Left Column */}
          <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
            {/* Select Outlets */}
            <div style={{display:'flex',flexDirection:'column'}}>
              <label style={{fontWeight:'bold',fontSize:'1.15rem',color:'#222',marginBottom:'8px'}}>Select Outlets</label>
              <div style={{border:'2px solid #bbb',borderRadius:'6px',padding:'8px',minHeight:'60px',background: isFormReadOnly?'#eee':'#fff'}}>
                {outlets.length === 0 ? (
                  <div style={{color:'#888',fontSize:'0.9rem'}}>No outlets available</div>
                ) : (
                  outlets.map(outlet => (
                    <label key={outlet.id} style={{display:'block',marginBottom:'4px',fontSize:'1rem'}}>
                      <input
                        type="checkbox"
                        name="select_outlets"
                        value={outlet.code || outlet.id}
                        checked={form.select_outlets.includes(outlet.code || outlet.id.toString())}
                        onChange={handleChange}
                        disabled={isFormReadOnly}
                        style={{marginRight:'8px'}}
                      />
                      {outlet.name || outlet.outlet_name}
                    </label>
                  ))
                )}
              </div>
              {fieldErrors.select_outlets && <span style={{color:'red',fontSize:'0.98rem',marginTop:'4px'}}>{fieldErrors.select_outlets}</span>}
            </div>

            {/* Applicable From */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222',marginRight:'20px'}}>Applicable From</label>
              <input 
                type="date" 
                name="applicable_from" 
                value={form.applicable_from} 
                onChange={handleChange} 
                style={{width:'300px',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} 
                disabled={isFormReadOnly} 
              />
              {fieldErrors.applicable_from && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.applicable_from}</span>}
            </div>

            {/* Item Code */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222',marginRight:'20px'}}>Item Code</label>
              <input 
                type="text" 
                name="item_code" 
                value={form.item_code} 
                onChange={handleChange} 
                style={{width:'300px',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isItemCodeLocked || isFormReadOnly?'#eee':'#fff', textTransform: 'uppercase'}} 
                disabled={isItemCodeLocked || isFormReadOnly} 
              />
              {fieldErrors.item_code && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.item_code}</span>}
            </div>

            {/* Inventory Code */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222',marginRight:'20px'}}>Inventory Code</label>
              <input type="text" name="inventory_code" value={form.inventory_code} onChange={handleChange} style={{width:'300px',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly} />
              {fieldErrors.inventory_code && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.inventory_code}</span>}
            </div>

            {/* Item Name */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222',marginRight:'20px'}}>Item Name</label>
              <input type="text" name="item_name" value={form.item_name} onChange={handleChange} maxLength={50} style={{width:'300px',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly} />
              {fieldErrors.item_name && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.item_name}</span>}
            </div>

            {/* Short Name */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222',marginRight:'20px'}}>Short Name</label>
              <input type="text" name="short_name" value={form.short_name} onChange={handleChange} maxLength={20} style={{width:'300px',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly} />
              {fieldErrors.short_name && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.short_name}</span>}
            </div>

            {/* Alternate Name */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222',marginRight:'20px'}}>Alternate Name</label>
              <input type="text" name="alternate_name" value={form.alternate_name} onChange={handleChange} style={{width:'300px',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly} />
              {fieldErrors.alternate_name && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.alternate_name}</span>}
            </div>

            {/* Tax Code */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222',marginRight:'20px'}}>Tax Code</label>
              <select name="tax_code" value={form.tax_code} onChange={handleChange} style={{width:'300px',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly}>
                <option value="">Select Tax Code</option>
                {taxCodes.map(tax => (
                  <option key={tax.id || tax.code} value={tax.code}>
                    {tax.name} ({tax.rate}%)
                  </option>
                ))}
              </select>
              {fieldErrors.tax_code && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.tax_code}</span>}
            </div>

            {/* Item Prices */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
              <div style={{display:'flex',alignItems:'center'}}>
                <label style={{width:'120px',fontWeight:'bold',fontSize:'1rem',color:'#222',marginRight:'10px'}}>Price 1</label>
                <input type="number" name="item_price_1" value={form.item_price_1} onChange={handleChange} min="0" step="0.01" style={{width:'100px',height:'32px',fontSize:'1rem',border:'2px solid #bbb',borderRadius:'4px',padding:'0 6px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly} />
                {fieldErrors.item_price_1 && <span style={{color:'red',fontSize:'0.9rem',marginLeft:'8px'}}>{fieldErrors.item_price_1}</span>}
              </div>
              <div style={{display:'flex',alignItems:'center'}}>
                <label style={{width:'120px',fontWeight:'bold',fontSize:'1rem',color:'#222',marginRight:'10px'}}>Price 2</label>
                <input type="number" name="item_price_2" value={form.item_price_2} onChange={handleChange} min="0" step="0.01" style={{width:'100px',height:'32px',fontSize:'1rem',border:'2px solid #bbb',borderRadius:'4px',padding:'0 6px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly} />
                {fieldErrors.item_price_2 && <span style={{color:'red',fontSize:'0.9rem',marginLeft:'8px'}}>{fieldErrors.item_price_2}</span>}
              </div>
              <div style={{display:'flex',alignItems:'center'}}>
                <label style={{width:'120px',fontWeight:'bold',fontSize:'1rem',color:'#222',marginRight:'10px'}}>Price 3</label>
                <input type="number" name="item_price_3" value={form.item_price_3} onChange={handleChange} min="0" step="0.01" style={{width:'100px',height:'32px',fontSize:'1rem',border:'2px solid #bbb',borderRadius:'4px',padding:'0 6px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly} />
                {fieldErrors.item_price_3 && <span style={{color:'red',fontSize:'0.9rem',marginLeft:'8px'}}>{fieldErrors.item_price_3}</span>}
              </div>
              <div style={{display:'flex',alignItems:'center'}}>
                <label style={{width:'120px',fontWeight:'bold',fontSize:'1rem',color:'#222',marginRight:'10px'}}>Price 4</label>
                <input type="number" name="item_price_4" value={form.item_price_4} onChange={handleChange} min="0" step="0.01" style={{width:'100px',height:'32px',fontSize:'1rem',border:'2px solid #bbb',borderRadius:'4px',padding:'0 6px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly} />
                {fieldErrors.item_price_4 && <span style={{color:'red',fontSize:'0.9rem',marginLeft:'8px'}}>{fieldErrors.item_price_4}</span>}
              </div>
            </div>

            {/* Item Logo */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222',marginRight:'20px'}}>Item Logo</label>
              <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  name="item_logo" 
                  onChange={handleChange} 
                  accept="image/*"
                  style={{fontSize:'1rem'}} 
                  disabled={isFormReadOnly} 
                />
                {form.item_logo && (
                  <span style={{fontSize:'0.9rem',color:'#43a047'}}>File selected: {form.item_logo.name}</span>
                )}
              </div>
              {fieldErrors.item_logo && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.item_logo}</span>}
            </div>
          </div>

          {/* Right Column */}
          <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
            {/* Item Printers */}
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <label style={{fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Item Printers</label>
              <div style={{display:'flex',alignItems:'center'}}>
                <label style={{width:'120px',fontWeight:'bold',fontSize:'1rem',color:'#222',marginRight:'10px'}}>Printer 1</label>
                <select name="item_printer_1" value={form.item_printer_1} onChange={handleChange} style={{width:'200px',height:'32px',fontSize:'1rem',border:'2px solid #bbb',borderRadius:'4px',padding:'0 6px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly}>
                  <option value="">Select Printer</option>
                  {printers.map(printer => (
                    <option key={printer.id} value={printer.code}>
                      {printer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{display:'flex',alignItems:'center'}}>
                <label style={{width:'120px',fontWeight:'bold',fontSize:'1rem',color:'#222',marginRight:'10px'}}>Printer 2</label>
                <select name="item_printer_2" value={form.item_printer_2} onChange={handleChange} style={{width:'200px',height:'32px',fontSize:'1rem',border:'2px solid #bbb',borderRadius:'4px',padding:'0 6px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly}>
                  <option value="">Select Printer</option>
                  {printers.map(printer => (
                    <option key={printer.id} value={printer.code}>
                      {printer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{display:'flex',alignItems:'center'}}>
                <label style={{width:'120px',fontWeight:'bold',fontSize:'1rem',color:'#222',marginRight:'10px'}}>Printer 3</label>
                <select name="item_printer_3" value={form.item_printer_3} onChange={handleChange} style={{width:'200px',height:'32px',fontSize:'1rem',border:'2px solid #bbb',borderRadius:'4px',padding:'0 6px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly}>
                  <option value="">Select Printer</option>
                  {printers.map(printer => (
                    <option key={printer.id} value={printer.code}>
                      {printer.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Print Group */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222',marginRight:'20px'}}>Print Group</label>
              <select name="print_group" value={form.print_group} onChange={handleChange} style={{width:'300px',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly}>
                <option value="">Select Print Group</option>
                {printGroups.map(group => (
                  <option key={group.id} value={group.code}>
                    {group.name}
                  </option>
                ))}
              </select>
              {fieldErrors.print_group && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.print_group}</span>}
            </div>

            {/* Item Department */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222',marginRight:'20px'}}>Item Department</label>
              <select name="item_department" value={form.item_department} onChange={handleChange} style={{width:'300px',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly}>
                <option value="">Select Department</option>
                {itemDepartments.map(dept => (
                  <option key={dept.department_code} value={dept.department_code}>
                    {dept.name} ({dept.department_code})
                  </option>
                ))}
              </select>
              {fieldErrors.item_department && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.item_department}</span>}
            </div>

            {/* Item Category */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222',marginRight:'20px'}}>Item Category</label>
              <select name="item_category" value={form.item_category} onChange={handleChange} style={{width:'300px',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly}>
                <option value="">Select Category</option>
                {itemCategories.filter(cat => !form.item_department || cat.item_department_code === form.item_department).map(cat => (
                  <option key={cat.category_code} value={cat.category_code}>
                    {cat.name} ({cat.category_code})
                  </option>
                ))}
              </select>
              {fieldErrors.item_category && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.item_category}</span>}
            </div>

            {/* Cost */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222',marginRight:'20px'}}>Cost</label>
              <input type="number" name="cost" value={form.cost} onChange={handleChange} min="0" step="0.01" style={{width:'300px',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly} />
              {fieldErrors.cost && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.cost}</span>}
            </div>

            {/* Unit */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222',marginRight:'20px'}}>Unit</label>
              <select name="unit" value={form.unit} onChange={handleChange} style={{width:'300px',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly}>
                <option value="">Select Unit</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.code}>
                    {unit.name}
                  </option>
                ))}
              </select>
              {fieldErrors.unit && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.unit}</span>}
            </div>

            {/* Set Menu */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222',marginRight:'20px'}}>Set Menu</label>
              <select name="set_menu" value={form.set_menu} onChange={handleChange} style={{width:'300px',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly}>
                <option value="">Select Set Menu</option>
                {setMenus.map(menu => (
                  <option key={menu.id} value={menu.code}>
                    {menu.name}
                  </option>
                ))}
              </select>
              {fieldErrors.set_menu && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.set_menu}</span>}
            </div>

            {/* Item Modifier Group */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222',marginRight:'20px'}}>Item Modifier Group</label>
              <select name="item_modifier_group" value={form.item_modifier_group} onChange={handleChange} style={{width:'300px',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly}>
                <option value="">Select Modifier Group</option>
                {modifierGroups.map(group => (
                  <option key={group.id} value={group.code}>
                    {group.name}
                  </option>
                ))}
              </select>
              {fieldErrors.item_modifier_group && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.item_modifier_group}</span>}
            </div>

            {/* Status */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222',marginRight:'20px'}}>Status</label>
              <select name="status" value={form.status} onChange={handleChange} style={{width:'300px',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              {fieldErrors.status && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.status}</span>}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}