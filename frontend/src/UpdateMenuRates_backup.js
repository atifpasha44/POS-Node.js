import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';

const initialState = {
  property_name: '',
  outlet_name: '',
  applicable_from: '',
  price_level: '',
  update_type: 'item_department', // 'item_department' or 'item_master'
  from_department: '',
  to_department: '',
  from_item: '',
  to_item: '',
  calculation_type: 'percentage', // 'percentage' or 'amount'
  rate_value: '',
  operation: 'increase' // 'increase' or 'decrease'
};

export default function UpdateMenuRates({ setParentDirty, records, setRecords }) {
  const [isDirty, setIsDirty] = useState(false);
  const [form, setForm] = useState(initialState);
  const [action, setAction] = useState('Add');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedRecordIdx, setSelectedRecordIdx] = useState(null);
  const [showNoChangePopup, setShowNoChangePopup] = useState(false);
  const [selectModalMessage, setSelectModalMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [itemsGrid, setItemsGrid] = useState([]);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [previewGenerated, setPreviewGenerated] = useState(false);
  
  // Mock data for dropdowns - replace with actual API calls
  const [properties, setProperties] = useState([
    { code: 'PROP001', name: 'Hotel ABC' },
    { code: 'PROP002', name: 'Resort XYZ' }
  ]);
  const [outlets, setOutlets] = useState([]);
  const [priceLevels, setPriceLevels] = useState([
    { code: 'PL001', name: 'Regular Price' },
    { code: 'PL002', name: 'Happy Hour Price' },
    { code: 'PL003', name: 'Member Price' },
    { code: 'PL004', name: 'VIP Price' }
  ]);
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  
  const formRef = useRef(null);

  // Reset message when modal closes
  useEffect(() => {
    if (!showSelectModal) setSelectModalMessage('');
  }, [showSelectModal]);

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    setForm(f => ({ ...f, applicable_from: tomorrowStr }));
  }, []);

  // Load outlets when property changes
  useEffect(() => {
    if (form.property_name) {
      // Mock outlet data - replace with actual API call
      setOutlets([
        { code: 'OUT001', name: 'Main Restaurant' },
        { code: 'OUT002', name: 'Pool Bar' },
        { code: 'OUT003', name: 'Coffee Shop' }
      ]);
    } else {
      setOutlets([]);
      setForm(f => ({ ...f, outlet_name: '' }));
    }
  }, [form.property_name]);

  // Load departments and items when outlet changes
  useEffect(() => {
    if (form.outlet_name) {
      // Mock department data
      setDepartments([
        { code: 'DEPT001', name: 'Appetizers' },
        { code: 'DEPT002', name: 'Main Course' },
        { code: 'DEPT003', name: 'Desserts' },
        { code: 'DEPT004', name: 'Beverages' }
      ]);
      
      // Mock item data
      setItems([
        { code: 'ITEM001', name: 'Grilled Chicken', dept: 'Main Course', price: 250 },
        { code: 'ITEM002', name: 'Caesar Salad', dept: 'Appetizers', price: 180 },
        { code: 'ITEM003', name: 'Margherita Pizza', dept: 'Main Course', price: 320 },
        { code: 'ITEM004', name: 'Chocolate Cake', dept: 'Desserts', price: 150 },
        { code: 'ITEM005', name: 'Coffee', dept: 'Beverages', price: 80 },
        { code: 'ITEM006', name: 'Fish & Chips', dept: 'Main Course', price: 280 }
      ]);
    } else {
      setDepartments([]);
      setItems([]);
    }
  }, [form.outlet_name]);

  // Generate items grid when criteria or rate value changes
  useEffect(() => {
    if (form.outlet_name && form.price_level && form.rate_value &&
        ((form.update_type === 'item_department' && form.from_department && form.to_department) ||
         (form.update_type === 'item_master' && form.from_item && form.to_item))) {
      generateItemsGrid();
      setPreviewGenerated(true);
    } else {
      setItemsGrid([]);
      setPreviewGenerated(false);
    }
  }, [form.outlet_name, form.price_level, form.update_type, form.from_department, form.to_department, form.from_item, form.to_item, form.rate_value, form.calculation_type, form.operation]);

  const generateItemsGrid = () => {
    let filteredItems = [];
    
    if (form.update_type === 'item_department') {
      const fromDeptName = departments.find(d => d.code === form.from_department)?.name;
      const toDeptName = departments.find(d => d.code === form.to_department)?.name;
      
      if (fromDeptName && toDeptName) {
        // Simple alphabetical range logic
        filteredItems = items.filter(item => 
          item.dept >= fromDeptName && item.dept <= toDeptName
        );
      }
    } else if (form.update_type === 'item_master') {
      const fromItemName = items.find(i => i.code === form.from_item)?.name;
      const toItemName = items.find(i => i.code === form.to_item)?.name;
      
      if (fromItemName && toItemName) {
        // Simple alphabetical range logic
        filteredItems = items.filter(item => 
          item.name >= fromItemName && item.name <= toItemName
        );
      }
    }

    const gridData = filteredItems.map(item => ({
      item_code: item.code,
      item_name: item.name,
      dept_name: item.dept,
      old_price: item.price,
      update_price: calculateNewPrice(item.price)
    }));

    setItemsGrid(gridData);
  };

  const calculateNewPrice = (oldPrice) => {
    if (!form.rate_value || !form.calculation_type) return oldPrice;
    
    const rateValue = parseFloat(form.rate_value);
    if (isNaN(rateValue)) return oldPrice;

    let newPrice = oldPrice;
    
    if (form.calculation_type === 'percentage') {
      const changeAmount = (oldPrice * rateValue) / 100;
      newPrice = form.operation === 'increase' 
        ? oldPrice + changeAmount 
        : oldPrice - changeAmount;
    } else if (form.calculation_type === 'amount') {
      newPrice = form.operation === 'increase' 
        ? oldPrice + rateValue 
        : oldPrice - rateValue;
    }

    return Math.max(0, Math.round(newPrice * 100) / 100); // Ensure non-negative and round to 2 decimals
  };

  // Recalculate grid when calculation parameters change
  useEffect(() => {
    if (itemsGrid.length > 0) {
      const updatedGrid = itemsGrid.map(item => ({
        ...item,
        update_price: calculateNewPrice(item.old_price)
      }));
      setItemsGrid(updatedGrid);
    }
  }, [form.calculation_type, form.rate_value, form.operation]);

  // Handlers
  const isFormReadOnly = action === 'Search' && selectedRecordIdx !== null;

  const handleChange = e => {
    const { name, value } = e.target;
    
    // Prevent editing in Search mode
    if (isFormReadOnly) return;
    
    // Date validation for Applicable From
    if (name === 'applicable_from' && value) {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate <= today) {
        setFieldErrors(errors => ({
          ...errors, 
          applicable_from: 'Applicable From date must be the next business day onwards. Cannot select current or past dates.'
        }));
        return;
      } else {
        setFieldErrors(errors => ({ ...errors, applicable_from: '' }));
      }
    }

    // Validate rate value is numeric
    if (name === 'rate_value' && value !== '') {
      if (!/^\d*\.?\d*$/.test(value) || parseFloat(value) < 0) {
        setFieldErrors(errors => ({ ...errors, rate_value: 'Must be a valid positive number' }));
        return;
      } else {
        setFieldErrors(errors => ({ ...errors, rate_value: '' }));
      }
    }
    
    setForm(f => ({ ...f, [name]: value }));
    setIsDirty(true);
    if (setParentDirty) setParentDirty(true);
    setFieldErrors(errors => ({ ...errors, [name]: '' }));
  };

  const handleClear = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    
    setForm({ ...initialState, applicable_from: tomorrowStr });
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
    setSelectedRecordIdx(null);
    setFieldErrors({});
    setItemsGrid([]);
    setPreviewGenerated(false);
  };

  const handleUpdate = () => {
    // Validate required fields
    const requiredFields = [
      { key: 'property_name', label: 'Property Name' },
      { key: 'outlet_name', label: 'Outlet Name' },
      { key: 'applicable_from', label: 'Applicable From' },
      { key: 'price_level', label: 'Price Level' },
      { key: 'rate_value', label: 'Rate Value' }
    ];

    for (const field of requiredFields) {
      if (!form[field.key] || (typeof form[field.key] === 'string' && form[field.key].trim() === '')) {
        alert(`Please enter/select ${field.label}.`);
        return;
      }
    }

    // Validate range fields based on update type
    if (form.update_type === 'item_department') {
      if (!form.from_department || !form.to_department) {
        alert('Please select both From and To Department.');
        return;
      }
    } else if (form.update_type === 'item_master') {
      if (!form.from_item || !form.to_item) {
        alert('Please select both From and To Item.');
        return;
      }
    }

    // Refresh the preview grid by regenerating it
    if (itemsGrid.length === 0) {
      generateItemsGrid();
    }
    
    // Update preview state
    setPreviewGenerated(true);
    
    // Show success message
    alert(`Preview generated successfully! Found ${itemsGrid.length} items to update.`);
  };

  const handleSave = () => {
    if (itemsGrid.length === 0) {
      alert('Please generate preview first by clicking Update.');
      return;
    }
    setShowUpdateConfirm(true);
  };

  const confirmSave = async () => {
    try {
      // Here you would make API calls to update the menu rates
      // For now, we'll simulate the update
      const updateRecord = {
        ...form,
        items_updated: itemsGrid.length,
        total_items: itemsGrid,
        updated_at: new Date().toISOString(),
        id: Date.now()
      };

      setRecords(prev => [...prev, updateRecord]);
      
      setShowUpdateConfirm(false);
      setShowSavePopup(true);
      setTimeout(() => setShowSavePopup(false), 3000);
      handleClear();
      
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving menu rates. Please try again.');
    }
  };

  // Standard action handlers to match pattern
  const handleAdd = () => {
    setAction('Add');
    setSelectedRecordIdx(null);
    setForm(initialState);
    setItemsGrid([]);
    setPreviewGenerated(false);
    setFieldErrors({});
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
    setSelectModalMessage('Search for Update Menu Rates and click "View" to see full details in read-only mode.');
  };

  const handleExport = (format) => {
    if (itemsGrid.length === 0) {
      alert('No data to export. Please generate the items grid first.');
      return;
    }

    if (format === 'Excel') {
      const exportData = itemsGrid.map(item => ({
        'Item Code': item.item_code,
        'Item Name': item.item_name,
        'Department': item.dept_name,
        'Old Price': item.old_price,
        'Updated Price': item.update_price,
        'Difference': (item.update_price - item.old_price).toFixed(2)
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'MenuRatesUpdate');
      XLSX.writeFile(wb, 'MenuRatesUpdate.xlsx');
    } else if (format === 'PDF') {
      const doc = new jsPDF();
      doc.text('Menu Rates Update Preview', 20, 20);
      const columns = ['Item Code', 'Item Name', 'Department', 'Old Price', 'Updated Price', 'Difference'];
      const rows = itemsGrid.map(item => [
        item.item_code, item.item_name, item.dept_name, 
        item.old_price.toString(), item.update_price.toString(), 
        (item.update_price - item.old_price).toFixed(2)
      ]);
      autoTable(doc, { head: [columns], body: rows, startY: 30 });
      doc.save('MenuRatesUpdate.pdf');
    }
  };

  return (
    <div className="propertycode-panel" style={{
      background: '#fff',
      border: '2.5px solid #222',
      borderRadius: '16px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
      width: '100%',
      maxWidth: '1400px',
      margin: '32px auto',
      padding: '0 0 18px 0',
      height: 'calc(100vh - 120px)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      position: 'relative'
    }}>
      
      {/* Top Control Bar - sticky */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '2px solid #e0e0e0',
        padding: '12px 18px 8px 18px',
        minWidth: 0,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 'bold', fontSize: '2rem', color: '#222', marginRight: '18px' }}>
            Update Menu Rates
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
          <button onClick={handleSave} title="Save" style={{ background: '#e3f2fd', border: '2px solid #1976d2', borderRadius: '8px', fontWeight: 'bold', color: '#1976d2', fontSize: '1.15rem', padding: '4px 18px', marginLeft: '8px', cursor: 'pointer', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#bbdefb'} onMouseOut={e => e.currentTarget.style.background = '#e3f2fd'}><span style={{ fontWeight: 'bold' }}><span role="img" aria-label="Save">?��</span> SAVE</span></button>
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

      {/* Form Section */}
      <form ref={formRef} className="propertycode-form" style={{
        padding: '32px 32px 0 32px'
      }}>
        
        {/* Update Success popup */}
        {showSavePopup && (
          <div style={{
            position: 'fixed',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            background: '#fff',
            border: '2px solid #43a047',
            borderRadius: '12px',
            padding: '32px 48px',
            zIndex: 1000,
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            fontSize: '1.25rem',
            color: '#43a047',
            fontWeight: 'bold'
          }}>
            Menu rates saved successfully!
          </div>
        )}

        {/* Update Confirmation Modal */}
        {showUpdateConfirm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.18)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '14px',
              padding: '32px 24px',
              minWidth: '400px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.18)'
            }}>
              <div style={{
                fontWeight: 'bold',
                fontSize: '1.3rem',
                marginBottom: '18px',
                color: '#28a745'
              }}>
                Confirm Save Changes
              </div>
              
              <div style={{ marginBottom: '20px', color: '#666' }}>
                <p>Are you sure you want to save rate changes for <strong>{itemsGrid.length}</strong> items?</p>
                <p>This action will commit the price updates effective from <strong>{form.applicable_from}</strong>.</p>
                <p>Calculation: <strong>{form.operation === 'increase' ? 'Increase' : 'Decrease'}</strong> by 
                   <strong> {form.rate_value}{form.calculation_type === 'percentage' ? '%' : ' amount'}</strong></p>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  style={{
                    background: '#e0e0e0',
                    color: '#666',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 22px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowUpdateConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  style={{
                    background: '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 22px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                  onClick={confirmSave}
                >
                  Confirm Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Basic Information Section - matching image layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label style={{ width: '140px', fontWeight: 'bold', fontSize: '1.1rem', color: '#222' }}>
              Property Code
            </label>
            <select
              name="property_name"
              value={form.property_name}
              onChange={handleChange}
              style={{
                width: '100%',
                height: '36px',
                fontSize: '1.08rem',
                border: '2px solid #bbb',
                borderRadius: '6px',
                padding: '0 8px',
                background: '#fff'
              }}
              required
            >
              <option value="">Select Property</option>
              {properties.map(prop => (
                <option key={prop.code} value={prop.name}>
                  {prop.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label style={{ width: '140px', fontWeight: 'bold', fontSize: '1.1rem', color: '#222' }}>
              Applicable From
            </label>
            <input
              type="date"
              name="applicable_from"
              value={form.applicable_from}
              onChange={handleChange}
              style={{
                width: '100%',
                height: '36px',
                fontSize: '1.08rem',
                border: '2px solid #bbb',
                borderRadius: '6px',
                padding: '0 8px',
                background: '#fff'
              }}
              required
            />
            {fieldErrors.applicable_from && (
              <span style={{ color: 'red', fontSize: '0.9rem', marginLeft: '8px', display: 'block' }}>
                {fieldErrors.applicable_from}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label style={{ width: '140px', fontWeight: 'bold', fontSize: '1.1rem', color: '#222' }}>
              Outlet Code
            </label>
            <select
              name="outlet_name"
              value={form.outlet_name}
              onChange={handleChange}
              style={{
                width: '100%',
                height: '36px',
                fontSize: '1.08rem',
                border: '2px solid #bbb',
                borderRadius: '6px',
                padding: '0 8px',
                background: '#fff'
              }}
              disabled={!form.property_name}
              required
            >
              <option value="">Select Outlet</option>
              {outlets.map(outlet => (
                <option key={outlet.code} value={outlet.name}>
                  {outlet.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label style={{ width: '140px', fontWeight: 'bold', fontSize: '1.1rem', color: '#222' }}>
              Price Level
            </label>
            <select
              name="price_level"
              value={form.price_level}
              onChange={handleChange}
              style={{
                width: '100%',
                height: '36px',
                fontSize: '1.08rem',
                border: '2px solid #bbb',
                borderRadius: '6px',
                padding: '0 8px',
                background: '#fff'
              }}
              required
            >
              <option value="">Select Price Level</option>
              {priceLevels.map(level => (
                <option key={level.code} value={level.name}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Rate Updates Configuration Section - matching image layout */}
        <div style={{
          background: '#f8f9fa',
          border: '2px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ margin: '0', color: '#495057', fontSize: '1.2rem' }}>
              Rate Updates Configuration
            </h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleUpdate}
                style={{
                  background: '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 20px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#0056b3'}
                onMouseOut={e => e.currentTarget.style.background = '#007bff'}
              >
                Update
              </button>
              
              {previewGenerated && (
                <button
                  onClick={handleSave}
                  style={{
                    background: '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 20px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: '0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#218838'}
                  onMouseOut={e => e.currentTarget.style.background = '#28a745'}
                >
                  Save
                </button>
              )}
            </div>
          </div>
          
          {/* Update Type Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#222', marginBottom: '10px', display: 'block' }}>
              Update Type
            </label>
            <div style={{ display: 'flex', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="update_type"
                  value="item_department"
                  checked={form.update_type === 'item_department'}
                  onChange={handleChange}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '1.05rem' }}>Item Department Wise</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="update_type"
                  value="item_master"
                  checked={form.update_type === 'item_master'}
                  onChange={handleChange}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '1.05rem' }}>Item Master Wise</span>
              </label>
            </div>
          </div>

          {/* Range Selection - single row layout matching image */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {form.update_type === 'item_department' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ width: '140px', fontWeight: 'bold', fontSize: '1.1rem', color: '#222' }}>
                    From Department
                  </label>
                  <select
                    name="from_department"
                    value={form.from_department}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      height: '36px',
                      fontSize: '1.08rem',
                      border: '2px solid #bbb',
                      borderRadius: '6px',
                      padding: '0 8px',
                      background: '#fff'
                    }}
                    disabled={!form.outlet_name}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.code} value={dept.code}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ width: '140px', fontWeight: 'bold', fontSize: '1.1rem', color: '#222' }}>
                    To Department
                  </label>
                  <select
                    name="to_department"
                    value={form.to_department}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      height: '36px',
                      fontSize: '1.08rem',
                      border: '2px solid #bbb',
                      borderRadius: '6px',
                      padding: '0 8px',
                      background: '#fff'
                    }}
                    disabled={!form.outlet_name}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.code} value={dept.code}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ width: '140px', fontWeight: 'bold', fontSize: '1.1rem', color: '#222' }}>
                    From Item
                  </label>
                  <select
                    name="from_item"
                    value={form.from_item}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      height: '36px',
                      fontSize: '1.08rem',
                      border: '2px solid #bbb',
                      borderRadius: '6px',
                      padding: '0 8px',
                      background: '#fff'
                    }}
                    disabled={!form.outlet_name}
                  >
                    <option value="">Select Item</option>
                    {items.map(item => (
                      <option key={item.code} value={item.code}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ width: '140px', fontWeight: 'bold', fontSize: '1.1rem', color: '#222' }}>
                    To Item
                  </label>
                  <select
                    name="to_item"
                    value={form.to_item}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      height: '36px',
                      fontSize: '1.08rem',
                      border: '2px solid #bbb',
                      borderRadius: '6px',
                      padding: '0 8px',
                      background: '#fff'
                    }}
                    disabled={!form.outlet_name}
                  >
                    <option value="">Select Item</option>
                    {items.map(item => (
                      <option key={item.code} value={item.code}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Calculation Configuration - matching image layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '140px', fontWeight: 'bold', fontSize: '1.1rem', color: '#222' }}>
                Calculation Type
              </label>
              <select
                name="calculation_type"
                value={form.calculation_type}
                onChange={handleChange}
                style={{
                  width: '100%',
                  height: '36px',
                  fontSize: '1.08rem',
                  border: '2px solid #bbb',
                  borderRadius: '6px',
                  padding: '0 8px',
                  background: '#fff'
                }}
              >
                <option value="percentage">Percentage</option>
                <option value="amount">Amount</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '100px', fontWeight: 'bold', fontSize: '1.1rem', color: '#222' }}>
                Operation
              </label>
              <select
                name="operation"
                value={form.operation}
                onChange={handleChange}
                style={{
                  width: '100%',
                  height: '36px',
                  fontSize: '1.08rem',
                  border: '2px solid #bbb',
                  borderRadius: '6px',
                  padding: '0 8px',
                  background: '#fff'
                }}
              >
                <option value="increase">Increase</option>
                <option value="decrease">Decrease</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '120px', fontWeight: 'bold', fontSize: '1.1rem', color: '#222' }}>
                {form.calculation_type === 'percentage' ? 'Percentage (%)' : 'Amount'}
              </label>
              <input
                type="number"
                name="rate_value"
                value={form.rate_value}
                onChange={handleChange}
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  height: '36px',
                  fontSize: '1.08rem',
                  border: '2px solid #bbb',
                  borderRadius: '6px',
                  padding: '0 8px',
                  background: '#fff'
                }}
                placeholder={form.calculation_type === 'percentage' ? 'Enter percentage' : 'Enter amount'}
              />
              {fieldErrors.rate_value && (
                <span style={{ color: 'red', fontSize: '0.9rem', marginLeft: '8px' }}>
                  {fieldErrors.rate_value}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Items Grid */}
        {itemsGrid.length > 0 && (
          <div style={{
            background: '#f8f9fa',
            border: '2px solid #dee2e6',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: '0', color: '#495057', fontSize: '1.2rem' }}>
                Items to be Updated ({itemsGrid.length} items)
              </h3>
              <div style={{ fontSize: '1rem', color: '#666' }}>
                {form.operation === 'increase' ? '↗️' : '↘️'} {form.rate_value}{form.calculation_type === 'percentage' ? '%' : ' amount'} {form.operation}
              </div>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '6px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                <thead style={{ background: '#e9ecef', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '12px 8px', fontWeight: 'bold', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>Item Code</th>
                    <th style={{ padding: '12px 8px', fontWeight: 'bold', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>Item Name</th>
                    <th style={{ padding: '12px 8px', fontWeight: 'bold', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>Department</th>
                    <th style={{ padding: '12px 8px', fontWeight: 'bold', borderBottom: '2px solid #dee2e6', textAlign: 'right' }}>Old Price</th>
                    <th style={{ padding: '12px 8px', fontWeight: 'bold', borderBottom: '2px solid #dee2e6', textAlign: 'right' }}>Updated Price</th>
                    <th style={{ padding: '12px 8px', fontWeight: 'bold', borderBottom: '2px solid #dee2e6', textAlign: 'right' }}>Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsGrid.map((item, idx) => (
                    <tr key={idx} style={{ background: idx % 2 ? '#f8f9fa' : '#fff' }}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #dee2e6' }}>{item.item_code}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #dee2e6' }}>{item.item_name}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #dee2e6' }}>{item.dept_name}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #dee2e6', textAlign: 'right' }}>₹{item.old_price.toFixed(2)}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold', color: item.update_price > item.old_price ? '#28a745' : '#dc3545' }}>
                        ₹{item.update_price.toFixed(2)}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold', color: item.update_price > item.old_price ? '#28a745' : '#dc3545' }}>
                        {item.update_price > item.old_price ? '+' : ''}₹{(item.update_price - item.old_price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Example Section */}
        <div style={{
          background: '#fff3cd',
          border: '2px solid #ffeaa7',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '20px'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#856404', fontSize: '1.1rem' }}>
            Calculation Examples:
          </h4>
          <div style={{ fontSize: '0.95rem', color: '#856404' }}>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>Percentage:</strong> Old Price = ₹100, 10% increase → New Price = ₹110
            </p>
            <p style={{ margin: '0' }}>
              <strong>Amount:</strong> Old Price = ₹100, ₹20 increase → New Price = ₹120
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
