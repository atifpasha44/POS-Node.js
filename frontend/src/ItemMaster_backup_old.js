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
        item_logo_url: URL.createObjectURL(file)
      }));
    } else if (name === 'applicable_from' && action === 'Add') {
      const today = new Date().toISOString().split('T')[0];
      if (value < today) {
        alert('Backdated entries are not allowed. Please select today\'s date or a future date.');
        return;
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

  const handleActionChange = (e) => {
    const selectedAction = e.target.value;
    if (selectedAction === 'Add') {
      handleAdd();
    } else if (selectedAction === 'Edit') {
      handleEdit();
    } else if (selectedAction === 'Delete') {
      handleDelete();
    } else if (selectedAction === 'Search') {
      handleSearch();
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
      in_active: record.status === 'Inactive',
      item_logo: null,
      item_logo_url: record.item_logo_path ? `http://localhost:5000/${record.item_logo_path}` : ''
    });
    setShowSelectModal(false);
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
  };

  const handleAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    setForm({...initialState, applicable_from: today});
    setAction('Add');
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

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit? Any unsaved changes will be lost.')) {
      // This could close the form or navigate away
      window.location.reload(); // or implement navigation logic
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

  const handleClear = () => {
    const today = new Date().toISOString().split('T')[0];
    const resetForm = action === 'Add' ? {...initialState, applicable_from: today} : initialState;
    setForm(resetForm);
    setFieldErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isFormReadOnly = action === 'Search';
  const isItemCodeLocked = action === 'Edit';

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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '1px solid #eee'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
          <h2 style={{margin: 0, fontSize: '24px', fontWeight: 'bold'}}>Item Master</h2>
          
          <select 
            value={action} 
            onChange={handleActionChange}
            style={{
              padding: '6px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="Add">Add</option>
            <option value="Edit">Edit</option>
            <option value="Delete">Delete</option>
            <option value="Search">Search</option>
          </select>

          {/* Action Buttons */}
          <div style={{display: 'flex', gap: '8px'}}>
            <button 
              onClick={handleAdd}
              style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                border: '2px solid #4CAF50',
                backgroundColor: '#E8F5E8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Add"
            >
              ➕
            </button>
            <button 
              onClick={handleEdit}
              style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                border: '2px solid #2196F3',
                backgroundColor: '#E3F2FD',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Edit"
            >
              ✏️
            </button>
            <button 
              onClick={handleDelete}
              style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                border: '2px solid #F44336',
                backgroundColor: '#FFEBEE',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Delete"
            >
              🗑️
            </button>
            <button 
              onClick={handleSearch}
              style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                border: '2px solid #FF9800',
                backgroundColor: '#FFF3E0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Search"
            >
              🔍
            </button>
            <button 
              onClick={handleClear}
              style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                border: '2px solid #9C27B0',
                backgroundColor: '#F3E5F5',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Clear"
            >
              ❌
            </button>
          </div>
        </div>

        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <button 
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            💾 SAVE
          </button>

          <span style={{fontSize: '14px', color: '#666', marginLeft: '20px'}}>Download Master Data</span>
          <button 
            onClick={handleExportExcel}
            style={{
              width: '35px',
              height: '35px',
              borderRadius: '50%',
              border: '2px solid #4CAF50',
              backgroundColor: '#E8F5E8',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
            title="Export to Excel"
          >
            XL
          </button>
          <button 
            onClick={handleExportPDF}
            style={{
              width: '35px',
              height: '35px',
              borderRadius: '50%',
              border: '2px solid #F44336',
              backgroundColor: '#FFEBEE',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: 'bold'
            }}
            title="Export to PDF"
          >
            PDF
          </button>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit}>
        {/* FIRST HORIZONTAL SECTION (TOP SECTION) */}
        <div style={{display: 'flex', gap: '20px', marginBottom: '25px'}}>
          {/* Left Box (65%) - Outlet Code, Item Code, Item Name, Short Name, Item Department */}
          <div style={{
            flex: '0 0 32%',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            {/* Row 1 - Outlet Code and Applicable From */}
            <div style={{display: 'flex', gap: '40px', marginBottom: '15px'}}>
              <div style={{display: 'flex', alignItems: 'center', width: '450px'}}>
                <label style={{width: '130px', fontWeight: 'bold', fontSize: '14px'}}>Outlet Code</label>
                <select 
                  name="select_outlets"
                  value={form.select_outlets[0] || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm(prev => ({...prev, select_outlets: value ? [value] : []}));
                    setIsDirty(true);
                  }}
                  style={{
                    width: '300px',
                    height: '30px',
                    padding: '5px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  disabled={isFormReadOnly}
                >
                  <option value="">Select Outlet</option>
                  {outlets.map(outlet => (
                    <option key={outlet.id} value={outlet.code}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{display: 'flex', alignItems: 'center'}}>
                <label style={{width: '130px', fontWeight: 'bold', fontSize: '14px'}}>Applicable From</label>
                <input 
                  type="date"
                  name="applicable_from"
                  value={form.applicable_from}
                  onChange={handleChange}
                  min={action === 'Add' ? new Date().toISOString().split('T')[0] : ''}
                  style={{
                    width: '180px',
                    height: '28px',
                    padding: '5px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  disabled={isFormReadOnly}
                />
              </div>
            </div>

            {/* Row 2 - Item Code and Inventory Code */}
            <div style={{display: 'flex', gap: '40px', marginBottom: '15px'}}>
              <div style={{display: 'flex', alignItems: 'center', width: '450px'}}>
                <label style={{width: '130px', fontWeight: 'bold', fontSize: '14px'}}>Item Code</label>
                <input 
                  type="text"
                  name="item_code"
                  value={form.item_code}
                  onChange={handleChange}
                  style={{
                    width: '300px',
                    height: '28px',
                    padding: '5px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    textTransform: 'uppercase'
                  }}
                  disabled={isItemCodeLocked || isFormReadOnly}
                />
              </div>
              
              <div style={{display: 'flex', alignItems: 'center'}}>
                <label style={{width: '130px', fontWeight: 'bold', fontSize: '14px'}}>Inventory Code</label>
                <input 
                  type="text"
                  name="inventory_code"
                  value={form.inventory_code}
                  onChange={handleChange}
                  style={{
                    width: '180px',
                    height: '28px',
                    padding: '5px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  disabled={isFormReadOnly}
                />
              </div>
            </div>

            {/* Row 3 - Item Name and Alternate Name */}
            <div style={{display: 'flex', gap: '40px', marginBottom: '15px'}}>
              <div style={{display: 'flex', alignItems: 'center', width: '450px'}}>
                <label style={{width: '130px', fontWeight: 'bold', fontSize: '14px'}}>Item Name</label>
                <input 
                  type="text"
                  name="item_name"
                  value={form.item_name}
                  onChange={handleChange}
                  maxLength={50}
                  style={{
                    width: '300px',
                    height: '28px',
                    padding: '5px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  disabled={isFormReadOnly}
                />
              </div>
              
              <div style={{display: 'flex', alignItems: 'center'}}>
                <label style={{width: '130px', fontWeight: 'bold', fontSize: '14px'}}>Alternate Name</label>
                <input 
                  type="text"
                  name="alternate_name"
                  value={form.alternate_name}
                  onChange={handleChange}
                  style={{
                    width: '180px',
                    height: '28px',
                    padding: '5px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  disabled={isFormReadOnly}
                />
              </div>
            </div>

            {/* Row 4 - Short Name and Tax Code */}
            <div style={{display: 'flex', gap: '40px', marginBottom: '15px'}}>
              <div style={{display: 'flex', alignItems: 'center', width: '450px'}}>
                <label style={{width: '130px', fontWeight: 'bold', fontSize: '14px'}}>Short Name</label>
                <input 
                  type="text"
                  name="short_name"
                  value={form.short_name}
                  onChange={handleChange}
                  maxLength={20}
                  style={{
                    width: '300px',
                    height: '28px',
                    padding: '5px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  disabled={isFormReadOnly}
                />
              </div>
              
              <div style={{display: 'flex', alignItems: 'center'}}>
                <label style={{width: '130px', fontWeight: 'bold', fontSize: '14px'}}>Tax Code</label>
                <select 
                  name="tax_code"
                  value={form.tax_code}
                  onChange={handleChange}
                  style={{
                    width: '194px',
                    height: '30px',
                    padding: '5px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  disabled={isFormReadOnly}
                >
                  <option value="">Select Tax Code</option>
                  {taxCodes.map(tax => (
                    <option key={tax.id} value={tax.code}>
                      {tax.name} ({tax.rate}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 5 - Item Department and Item Category */}
            <div style={{display: 'flex', gap: '40px', marginBottom: '20px'}}>
              <div style={{display: 'flex', alignItems: 'center', width: '450px'}}>
                <label style={{width: '130px', fontWeight: 'bold', fontSize: '14px'}}>Item Department</label>
                <select 
                  name="item_department"
                  value={form.item_department}
                  onChange={handleChange}
                  style={{
                    width: '314px',
                    height: '30px',
                    padding: '5px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
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
              
              <div style={{display: 'flex', alignItems: 'center'}}>
                <label style={{width: '130px', fontWeight: 'bold', fontSize: '14px'}}>Item Category</label>
                <select 
                  name="item_category"
                  value={form.item_category}
                  onChange={handleChange}
                  style={{
                    width: '194px',
                    height: '30px',
                    padding: '5px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
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

            {/* Bordered Sections Row */}
            <div style={{display: 'flex', gap: '20px', marginBottom: '20px'}}>
              {/* Item Price Level Section */}
              <div style={{
                border: '1px solid #ccc',
                borderRadius: '6px',
                padding: '15px',
                flex: '1'
              }}>
                <h4 style={{margin: '0 0 15px 0', fontSize: '14px', fontWeight: 'bold'}}>Item Price Level</h4>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                  <div style={{display: 'flex', alignItems: 'center'}}>
                    <label style={{width: '60px', fontSize: '14px', fontWeight: 'bold'}}>Price 1</label>
                    <input 
                      type="number"
                      name="item_price_1"
                      value={form.item_price_1}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      style={{
                        width: '120px',
                        height: '28px',
                        padding: '5px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                      disabled={isFormReadOnly}
                    />
                  </div>
                  <div style={{display: 'flex', alignItems: 'center'}}>
                    <label style={{width: '60px', fontSize: '14px', fontWeight: 'bold'}}>Price 2</label>
                    <input 
                      type="number"
                      name="item_price_2"
                      value={form.item_price_2}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      style={{
                        width: '120px',
                        height: '28px',
                        padding: '5px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                      disabled={isFormReadOnly}
                    />
                  </div>
                  <div style={{display: 'flex', alignItems: 'center'}}>
                    <label style={{width: '60px', fontSize: '14px', fontWeight: 'bold'}}>Price 3</label>
                    <input 
                      type="number"
                      name="item_price_3"
                      value={form.item_price_3}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      style={{
                        width: '120px',
                        height: '28px',
                        padding: '5px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                      disabled={isFormReadOnly}
                    />
                  </div>
                  <div style={{display: 'flex', alignItems: 'center'}}>
                    <label style={{width: '60px', fontSize: '14px', fontWeight: 'bold'}}>Price 4</label>
                    <input 
                      type="number"
                      name="item_price_4"
                      value={form.item_price_4}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      style={{
                        width: '120px',
                        height: '28px',
                        padding: '5px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                      disabled={isFormReadOnly}
                    />
                  </div>
                </div>
              </div>

              {/* Item Printers Section with Image on the right */}
              <div style={{display: 'flex', gap: '15px', flex: '1'}}>
                {/* Item Printers */}
                <div style={{
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  padding: '15px',
                  flex: '1'
                }}>
                  <h4 style={{margin: '0 0 15px 0', fontSize: '14px', fontWeight: 'bold'}}>Item Printers</h4>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                      <label style={{width: '70px', fontSize: '14px', fontWeight: 'bold'}}>Printer 1</label>
                      <select 
                        name="item_printer_1"
                        value={form.item_printer_1}
                        onChange={handleChange}
                        style={{
                          width: '120px',
                          height: '30px',
                          padding: '5px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
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
                    <div style={{display: 'flex', alignItems: 'center'}}>
                      <label style={{width: '70px', fontSize: '14px', fontWeight: 'bold'}}>Printer 2</label>
                      <select 
                        name="item_printer_2"
                        value={form.item_printer_2}
                        onChange={handleChange}
                        style={{
                          width: '120px',
                          height: '30px',
                          padding: '5px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
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
                    <div style={{display: 'flex', alignItems: 'center'}}>
                      <label style={{width: '70px', fontSize: '14px', fontWeight: 'bold'}}>Printer 3</label>
                      <select 
                        name="item_printer_3"
                        value={form.item_printer_3}
                        onChange={handleChange}
                        style={{
                          width: '120px',
                          height: '30px',
                          padding: '5px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
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

                {/* Item Image Section */}
                <div style={{
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  padding: '15px',
                  backgroundColor: '#f9f9f9',
                  width: '200px'
                }}>
                  <h4 style={{margin: '0 0 15px 0', fontSize: '14px', fontWeight: 'bold'}}>Item Image</h4>
                  
                  {/* Image Display Area */}
                  <div style={{
                    border: '2px dashed #ccc',
                    borderRadius: '6px',
                    padding: '15px',
                    textAlign: 'center',
                    minHeight: '100px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fff',
                    marginBottom: '10px'
                  }}>
                    {form.item_logo_url ? (
                      <img 
                        src={form.item_logo_url} 
                        alt="Item Logo" 
                        style={{
                          maxWidth: '100%',
                          maxHeight: '90px',
                          objectFit: 'contain'
                        }}
                      />
                    ) : (
                      <div style={{color: '#888', fontSize: '11px'}}>
                        <div style={{fontSize: '30px', marginBottom: '5px'}}>📷</div>
                        <div>No image</div>
                      </div>
                    )}
                  </div>
                  
                  {/* File Upload Controls */}
                  <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      name="item_logo" 
                      onChange={handleChange} 
                      accept="image/*"
                      style={{
                        fontSize: '10px',
                        padding: '3px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }} 
                      disabled={isFormReadOnly} 
                    />
                    {!isFormReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.click();
                          }
                        }}
                        style={{
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 8px',
                          fontSize: '10px',
                          cursor: 'pointer'
                        }}
                      >
                        📁 Choose Image
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Fields below Item Printers - properly aligned */}
            <div style={{display: 'flex', gap: '20px', marginBottom: '15px', alignItems: 'center'}}>
              <div style={{display: 'flex', width: '450px', alignItems: 'center'}}>
                <label style={{width: '130px', fontSize: '14px', fontWeight: 'bold'}}>Print Group</label>
                <select 
                  name="print_group"
                  value={form.print_group}
                  onChange={handleChange}
                  style={{
                    width: '300px',
                    height: '30px',
                    padding: '5px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
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
            </div>

            <div style={{display: 'flex', gap: '20px', marginBottom: '15px', alignItems: 'center'}}>
              <div style={{display: 'flex', width: '450px', alignItems: 'center'}}>
                <label style={{width: '130px', fontSize: '14px', fontWeight: 'bold'}}>Cost</label>
                <input 
                  type="number"
                  name="cost"
                  value={form.cost}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  style={{
                    width: '300px',
                    height: '28px',
                    padding: '5px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  disabled={isFormReadOnly}
                />
              </div>

              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <label style={{width: '60px', fontSize: '14px', fontWeight: 'bold'}}>Inactive</label>
                <input 
                  type="checkbox"
                  name="in_active"
                  checked={form.in_active}
                  onChange={handleChange}
                  style={{
                    width: '20px',
                    height: '20px'
                  }}
                  disabled={isFormReadOnly}
                />
              </div>
            </div>

            <div style={{display: 'flex', gap: '20px', marginBottom: '15px', alignItems: 'center'}}>
              {/* Additional fields in a consistent layout */}
              <div style={{display: 'flex', width: '450px', alignItems: 'center', gap: '20px'}}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <label style={{width: '80px', fontSize: '14px', fontWeight: 'bold'}}>Set Menu</label>
                  <select 
                    name="set_menu"
                    value={form.set_menu}
                    onChange={handleChange}
                    style={{
                      width: '120px',
                      height: '30px',
                      padding: '5px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    disabled={isFormReadOnly}
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div style={{display: 'flex', alignItems: 'center'}}>
                  <label style={{width: '50px', fontSize: '14px', fontWeight: 'bold'}}>Unit</label>
                  <select 
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    style={{
                      width: '120px',
                      height: '30px',
                      padding: '5px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
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
            </div>

            <div style={{display: 'flex', gap: '20px', marginBottom: '15px', alignItems: 'center'}}>
              <div style={{display: 'flex', width: '450px', alignItems: 'center'}}>
                <label style={{width: '130px', fontSize: '14px', fontWeight: 'bold'}}>Item Modifier Group</label>
                <select 
                  name="item_modifier_group"
                  value={form.item_modifier_group}
                  onChange={handleChange}
                  style={{
                    width: '300px',
                    height: '30px',
                    padding: '5px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
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
      </form>

      {/* Modals and Popups */}
      {showSavePopup && (
        <div style={{position:'fixed',top:'30%',left:'50%',transform:'translate(-50%,-50%)',background:'#fff',border:'2px solid #43a047',borderRadius:'8px',padding:'20px 30px',zIndex:1000,boxShadow:'0 4px 20px rgba(0,0,0,0.15)',fontSize:'16px',color:'#43a047',fontWeight:'bold'}}>
          {action === 'Delete' ? 'Record has been successfully deleted.' : 'Data has been saved successfully.'}
        </div>
      )}

      {showDeleteConfirm && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.3)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:'8px',padding:'25px',minWidth:'350px',boxShadow:'0 4px 20px rgba(0,0,0,0.15)'}}>
            <div style={{fontWeight:'bold',fontSize:'18px',marginBottom:'15px',color:'#e53935'}}>Confirm Delete</div>
            <div style={{marginBottom:'20px',fontSize:'14px'}}>Are you sure you want to delete this item?</div>
            <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
              <button onClick={confirmDelete} style={{background:'#e53935',color:'#fff',border:'none',borderRadius:'4px',padding:'8px 16px',fontSize:'14px',cursor:'pointer'}}>Delete</button>
              <button onClick={() => setShowDeleteConfirm(false)} style={{background:'#bbb',color:'#222',border:'none',borderRadius:'4px',padding:'8px 16px',fontSize:'14px',cursor:'pointer'}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showSelectModal && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.3)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:'8px',padding:'25px',minWidth:'500px',boxShadow:'0 4px 20px rgba(0,0,0,0.15)',maxHeight:'70vh',overflowY:'auto'}}>
            <div style={{fontWeight:'bold',fontSize:'18px',marginBottom:'15px',color:'#1976d2'}}>{selectModalMessage || 'Select a record'}</div>
            {records.length === 0 ? (
              <div style={{color:'#888',fontSize:'14px'}}>No records found.</div>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse',marginBottom:'15px'}}>
                <thead>
                  <tr style={{background:'#f5f5f5'}}>
                    <th style={{padding:'8px',fontSize:'14px',fontWeight:'bold'}}>Item Code</th>
                    <th style={{padding:'8px',fontSize:'14px',fontWeight:'bold'}}>Item Name</th>
                    <th style={{padding:'8px',fontSize:'14px',fontWeight:'bold'}}>Status</th>
                    <th style={{padding:'8px',fontSize:'14px',fontWeight:'bold'}}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, idx) => (
                    <tr key={record.id} style={{background: idx%2 ? '#f9f9f9' : '#fff'}}>
                      <td style={{padding:'8px',fontSize:'14px'}}>{record.item_code}</td>
                      <td style={{padding:'8px',fontSize:'14px'}}>{record.item_name}</td>
                      <td style={{padding:'8px',fontSize:'14px'}}>{record.status}</td>
                      <td style={{padding:'8px'}}>
                        <button
                          type="button"
                          style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:'4px',padding:'4px 8px',fontSize:'12px',cursor:'pointer'}}
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
            <button type="button" style={{background:'#e53935',color:'#fff',border:'none',borderRadius:'4px',padding:'8px 16px',fontSize:'14px',cursor:'pointer'}} onClick={()=>setShowSelectModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}