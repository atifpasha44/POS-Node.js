import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';

const initialState = {
  property_code: '',
  outlet_code: '',
  item_code: '',
  item_name: '',
  original_stock_count: '',
  current_stock_count: '',
  reset_stock_daily_close: ''
};

export default function ItemStock({ setParentDirty, records, setRecords }) {
  const [isDirty, setIsDirty] = useState(false);
  const [form, setForm] = useState(initialState);
  const [action, setAction] = useState('Add');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedRecordIdx, setSelectedRecordIdx] = useState(null);
  const [showNoChangePopup, setShowNoChangePopup] = useState(false);
  const [selectModalMessage, setSelectModalMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Mock data for dropdowns - replace with actual API calls
  const [propertyCodes, setPropertyCodes] = useState([
    { code: 'PROP001', name: 'Hotel ABC' },
    { code: 'PROP002', name: 'Resort XYZ' }
  ]);
  const [outletCodes, setOutletCodes] = useState([]);
  const [itemCodes, setItemCodes] = useState([]);
  
  const formRef = useRef(null);

  // Reset message when modal closes
  useEffect(() => {
    if (!showSelectModal) setSelectModalMessage('');
  }, [showSelectModal]);

  // Load outlets when property changes
  useEffect(() => {
    if (form.property_code) {
      // Mock outlet data - replace with actual API call
      setOutletCodes([
        { code: 'OUT001', name: 'Main Restaurant' },
        { code: 'OUT002', name: 'Pool Bar' },
        { code: 'OUT003', name: 'Coffee Shop' }
      ]);
    } else {
      setOutletCodes([]);
      setForm(f => ({ ...f, outlet_code: '', item_code: '', item_name: '' }));
    }
  }, [form.property_code]);

  // Load items when outlet changes
  useEffect(() => {
    if (form.outlet_code) {
      // Mock item data - replace with actual API call
      setItemCodes([
        { code: 'ITEM001', name: 'Grilled Chicken', stock: 25 },
        { code: 'ITEM002', name: 'Caesar Salad', stock: 15 },
        { code: 'ITEM003', name: 'Margherita Pizza', stock: 30 },
        { code: 'ITEM004', name: 'Chocolate Cake', stock: 12 },
        { code: 'ITEM005', name: 'Burger', stock: 50 },
        { code: 'ITEM006', name: 'Fish & Chips', stock: 20 }
      ]);
    } else {
      setItemCodes([]);
      setForm(f => ({ ...f, item_code: '', item_name: '', original_stock_count: '', current_stock_count: '' }));
    }
  }, [form.outlet_code]);

  // Auto-populate item name and stock when item code changes
  useEffect(() => {
    if (form.item_code) {
      const selectedItem = itemCodes.find(item => item.code === form.item_code);
      if (selectedItem) {
        setForm(f => ({ 
          ...f, 
          item_name: selectedItem.name,
          original_stock_count: selectedItem.stock.toString(),
          current_stock_count: selectedItem.stock.toString()
        }));
      }
    } else {
      setForm(f => ({ ...f, item_name: '', original_stock_count: '', current_stock_count: '' }));
    }
  }, [form.item_code, itemCodes]);

  // Handlers
  const isFormReadOnly = action === 'Search' && selectedRecordIdx !== null;
  const isDeleteLocked = action === 'Delete' && selectedRecordIdx !== null;

  const handleChange = e => {
    const { name, value } = e.target;
    
    // Prevent editing in Search mode
    if (isFormReadOnly) return;
    
    // Validate numeric fields
    if ((name === 'original_stock_count' || name === 'current_stock_count') && value !== '') {
      if (!/^\d+$/.test(value) || parseInt(value) < 0) {
        setFieldErrors(errors => ({ ...errors, [name]: 'Must be a valid positive number' }));
        return;
      } else {
        setFieldErrors(errors => ({ ...errors, [name]: '' }));
      }
    }
    
    setForm(f => ({ ...f, [name]: value }));
    setIsDirty(true);
    if (setParentDirty) setParentDirty(true);
    setFieldErrors(errors => ({ ...errors, [name]: '' }));
  };

  const handleClear = () => {
    setForm(initialState);
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
    setSelectedRecordIdx(null);
    setFieldErrors({});
  };

  const handleSave = async () => {
    // Validate required fields
    const requiredFields = [
      { key: 'property_code', label: 'Property Code' },
      { key: 'outlet_code', label: 'Outlet Code' },
      { key: 'item_code', label: 'Item Code' },
      { key: 'original_stock_count', label: 'Original Stock Count' },
      { key: 'current_stock_count', label: 'Current Stock Count' },
      { key: 'reset_stock_daily_close', label: 'Reset Stock Quantity at Daily Close' }
    ];

    for (const field of requiredFields) {
      if (!form[field.key] || (typeof form[field.key] === 'string' && form[field.key].trim() === '')) {
        alert(`Please enter/select ${field.label}.`);
        return;
      }
    }

    // Validate stock counts are positive numbers
    if (parseInt(form.original_stock_count) < 0) {
      alert('Original Stock Count must be a positive number.');
      return;
    }

    if (parseInt(form.current_stock_count) < 0) {
      alert('Current Stock Count must be a positive number.');
      return;
    }

    // Check for duplicate records
    const isDuplicate = records.some((rec, idx) => 
      rec && 
      rec.property_code === form.property_code && 
      rec.outlet_code === form.outlet_code &&
      rec.item_code === form.item_code &&
      idx !== selectedRecordIdx
    );

    if (isDuplicate) {
      alert('This combination of Property Code, Outlet Code, and Item Code already exists.');
      return;
    }

    try {
      if (action === 'Add') {
        const newRecord = { ...form, id: Date.now() };
        setRecords(prev => [...prev, newRecord]);
      } else if (action === 'Edit' && selectedRecordIdx !== null) {
        setRecords(prev => prev.map((rec, idx) => 
          idx === selectedRecordIdx ? { ...form } : rec
        ));
      }
      
      setShowSavePopup(true);
      setTimeout(() => setShowSavePopup(false), 2000);
      handleClear();
      
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving record. Please try again.');
    }
  };

  const handleAdd = () => {
    setAction('Add');
    handleClear();
  };

  const handleEdit = () => {
    setAction('Edit');
    setSelectedRecordIdx(null);
    setShowSelectModal(true);
    setSelectModalMessage('Please select a record to edit.');
  };

  const handleDelete = () => {
    setAction('Delete');
    setSelectedRecordIdx(null);
    setShowSelectModal(true);
    setSelectModalMessage('Please select a record to delete.');
  };

  const handleSearch = () => {
    setAction('Search');
    setSelectedRecordIdx(null);
    setShowSelectModal(true);
    setSelectModalMessage('Please select a record to view.');
  };

  const handleSelectRecord = (idx) => {
    const record = records[idx];
    setForm(record);
    setSelectedRecordIdx(idx);
    setShowSelectModal(false);
    
    if (action === 'Delete') {
      if (window.confirm('Are you sure you want to delete this record?')) {
        setRecords(prev => prev.filter((_, i) => i !== idx));
        handleClear();
      }
    }
  };

  const handleExport = (format) => {
    if (records.length === 0) {
      alert('No data to export.');
      return;
    }

    if (format === 'Excel') {
      const exportData = records.map(rec => ({
        'Property Code': rec.property_code,
        'Outlet Code': rec.outlet_code,
        'Item Code': rec.item_code,
        'Item Name': rec.item_name,
        'Original Stock Count': rec.original_stock_count,
        'Current Stock Count': rec.current_stock_count,
        'Reset Stock Daily Close': rec.reset_stock_daily_close
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'ItemStock');
      XLSX.writeFile(wb, 'ItemStock.xlsx');
    } else if (format === 'PDF') {
      const doc = new jsPDF();
      doc.text('Item Stock Report', 20, 20);
      const columns = ['Property Code', 'Outlet Code', 'Item Code', 'Item Name', 'Original Stock', 'Current Stock', 'Reset Daily'];
      const rows = records.map(rec => [
        rec.property_code, rec.outlet_code, rec.item_code, rec.item_name, 
        rec.original_stock_count, rec.current_stock_count, rec.reset_stock_daily_close
      ]);
      autoTable(doc, { head: [columns], body: rows, startY: 30 });
      doc.save('ItemStock.pdf');
    }
  };

  return (
    <div className="propertycode-panel" style={{
      background: '#fff',
      border: '2.5px solid #222',
      borderRadius: '16px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
      width: '100%',
      maxWidth: '1200px',
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
            Item Stock
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
                setSelectModalMessage('Search for Item Stock and click "View" to see full details in read-only mode.');
              }
            }}
            style={{ fontWeight: 'bold', fontSize: '1rem', padding: '4px 12px', borderRadius: '6px', border: '1.5px solid #bbb', marginRight: '8px' }}
            disabled={isDeleteLocked}
          >
            <option value="Add">Action</option>
            <option value="Add">Add</option>
            <option value="Edit">Edit</option>
            <option value="Delete">Delete</option>
            <option value="Search">Search</option>
          </select>
          <button onClick={handleAdd} title="Add" style={{ background: '#e3fcec', border: '2px solid #43a047', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#43a047', marginRight: '4px', cursor: 'pointer', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#c8e6c9'} onMouseOut={e => e.currentTarget.style.background = '#e3fcec'} disabled={isDeleteLocked}><span role="img" aria-label="Add">➕</span></button>
          <button onClick={handleEdit} title="Modify/Edit" style={{ background: '#e3eafc', border: '2px solid #1976d2', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#1976d2', marginRight: '4px', cursor: 'pointer', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#bbdefb'} onMouseOut={e => e.currentTarget.style.background = '#e3eafc'} disabled={isDeleteLocked}><span role="img" aria-label="Edit">✏️</span></button>
          <button onClick={handleDelete} title="Delete" style={{ background: '#ffebee', border: '2px solid #e53935', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#e53935', marginRight: '4px', cursor: isDeleteLocked ? 'not-allowed' : 'pointer', transition: '0.2s', opacity: isDeleteLocked ? 0.5 : 1 }} onMouseOver={e => !isDeleteLocked && (e.currentTarget.style.background = '#ffcdd2')} onMouseOut={e => !isDeleteLocked && (e.currentTarget.style.background = '#ffebee')} disabled={isDeleteLocked}><span role="img" aria-label="Delete">🗑️</span></button>
          <button onClick={handleSearch} title="Search" style={{ background: '#fffde7', border: '2px solid #fbc02d', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#fbc02d', marginRight: '4px', cursor: 'pointer', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#fff9c4'} onMouseOut={e => e.currentTarget.style.background = '#fffde7'} disabled={isDeleteLocked}><span role="img" aria-label="Search">🔍</span></button>
          <button
            type="button"
            onClick={handleClear}
            title="Clear"
            style={{ background: '#f3e5f5', border: '2px solid #8e24aa', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#8e24aa', marginRight: '4px', cursor: 'pointer', transition: '0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = '#e1bee7'}
            onMouseOut={e => e.currentTarget.style.background = '#f3e5f5'}
            disabled={false}
          >
            <span role="img" aria-label="Clear">🧹</span>
          </button>
          <button onClick={handleSave} title="Save" style={{ background: '#e3f2fd', border: '2px solid #1976d2', borderRadius: '8px', fontWeight: 'bold', color: '#1976d2', fontSize: '1.15rem', padding: '4px 18px', marginLeft: '8px', cursor: 'pointer', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#bbdefb'} onMouseOut={e => e.currentTarget.style.background = '#e3f2fd'}><span style={{ fontWeight: 'bold' }}><span role="img" aria-label="Save">💾</span> SAVE</span></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.08rem', color: '#888', marginRight: '8px', whiteSpace: 'nowrap' }}>Export Report to</span>
          <span
            title="Export to Excel"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: '#e8f5e9', boxShadow: '0 2px 8px rgba(76,175,80,0.10)', cursor: isDeleteLocked ? 'not-allowed' : 'pointer', border: '2px solid #43a047', marginRight: '6px', transition: 'background 0.2s', opacity: isDeleteLocked ? 0.5 : 1 }}
            onClick={() => !isDeleteLocked && handleExport('Excel')}
            onMouseOver={e => !isDeleteLocked && (e.currentTarget.style.background = '#c8e6c9')}
            onMouseOut={e => !isDeleteLocked && (e.currentTarget.style.background = '#e8f5e9')}
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#43a047"/>
              <text x="16" y="21" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#fff">X</text>
              <text x="24" y="21" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#fff">L</text>
            </svg>
          </span>
          <span
            title="Export to PDF"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: '#ffebee', boxShadow: '0 2px 8px rgba(229,57,53,0.10)', cursor: isDeleteLocked ? 'not-allowed' : 'pointer', border: '2px solid #e53935', marginRight: '6px', transition: 'background 0.2s', opacity: isDeleteLocked ? 0.5 : 1 }}
            onClick={() => !isDeleteLocked && handleExport('PDF')}
            onMouseOver={e => !isDeleteLocked && (e.currentTarget.style.background = '#ffcdd2')}
            onMouseOut={e => !isDeleteLocked && (e.currentTarget.style.background = '#ffebee')}
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
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0 32px',
        padding: '32px 32px 0 32px'
      }}>
        
        {/* Save confirmation popup */}
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
            Record saved successfully!
          </div>
        )}

        {/* No change popup */}
        {showNoChangePopup && (
          <div style={{
            position: 'fixed',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            background: '#fff',
            border: '2px solid #e53935',
            borderRadius: '12px',
            padding: '32px 48px',
            zIndex: 1000,
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            fontSize: '1.25rem',
            color: '#e53935',
            fontWeight: 'bold'
          }}>
            No data has been modified.
          </div>
        )}

        {/* Record selection modal */}
        {showSelectModal && (
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
              minWidth: '640px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <div style={{
                fontWeight: 'bold',
                fontSize: '1.2rem',
                marginBottom: '18px',
                color: '#1976d2'
              }}>
                {selectModalMessage || 'Select a record'}
              </div>
              
              {records.length === 0 ? (
                <div style={{ color: '#888', fontSize: '1.05rem' }}>No records found.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                  <thead>
                    <tr style={{ background: '#e3e3e3' }}>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Property</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Outlet</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Item</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Original</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Current</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Reset</th>
                      <th style={{ padding: '6px 8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((rec, idx) => (
                      <tr key={idx} style={{ background: idx % 2 ? '#f7f7f7' : '#fff' }}>
                        <td style={{ padding: '6px 8px', fontSize: '0.9rem' }}>{rec.property_code}</td>
                        <td style={{ padding: '6px 8px', fontSize: '0.9rem' }}>{rec.outlet_code}</td>
                        <td style={{ padding: '6px 8px', fontSize: '0.9rem' }}>{rec.item_code}</td>
                        <td style={{ padding: '6px 8px', fontSize: '0.9rem' }}>{rec.original_stock_count}</td>
                        <td style={{ padding: '6px 8px', fontSize: '0.9rem' }}>{rec.current_stock_count}</td>
                        <td style={{ padding: '6px 8px', fontSize: '0.9rem' }}>{rec.reset_stock_daily_close}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <button
                            type="button"
                            style={{
                              background: '#1976d2',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '4px 12px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              fontSize: '0.85rem'
                            }}
                            onClick={() => handleSelectRecord(idx)}
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              
              <button
                type="button"
                style={{
                  background: '#e53935',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 22px',
                  fontWeight: 'bold',
                  fontSize: '1.08rem',
                  marginTop: '8px',
                  cursor: 'pointer'
                }}
                onClick={() => setShowSelectModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label style={{ width: '180px', fontWeight: 'bold', fontSize: '1.15rem', color: '#222' }}>
              Property Code
            </label>
            <select
              name="property_code"
              value={form.property_code}
              onChange={handleChange}
              style={{
                width: '80%',
                height: '36px',
                fontSize: '1.08rem',
                border: '2px solid #bbb',
                borderRadius: '6px',
                padding: '0 8px',
                background: isFormReadOnly ? '#eee' : '#fff'
              }}
              disabled={isFormReadOnly}
              required
            >
              <option value="">Select Property</option>
              {propertyCodes.map(prop => (
                <option key={prop.code} value={prop.code}>
                  {prop.code} - {prop.name}
                </option>
              ))}
            </select>
            {fieldErrors.property_code && (
              <span style={{ color: 'red', fontSize: '0.98rem', marginLeft: '12px' }}>
                {fieldErrors.property_code}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label style={{ width: '180px', fontWeight: 'bold', fontSize: '1.15rem', color: '#222' }}>
              Outlet Code
            </label>
            <select
              name="outlet_code"
              value={form.outlet_code}
              onChange={handleChange}
              style={{
                width: '80%',
                height: '36px',
                fontSize: '1.08rem',
                border: '2px solid #bbb',
                borderRadius: '6px',
                padding: '0 8px',
                background: isFormReadOnly ? '#eee' : '#fff'
              }}
              disabled={isFormReadOnly || !form.property_code}
              required
            >
              <option value="">Select Outlet</option>
              {outletCodes.map(outlet => (
                <option key={outlet.code} value={outlet.code}>
                  {outlet.code} - {outlet.name}
                </option>
              ))}
            </select>
            {fieldErrors.outlet_code && (
              <span style={{ color: 'red', fontSize: '0.98rem', marginLeft: '12px' }}>
                {fieldErrors.outlet_code}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label style={{ width: '180px', fontWeight: 'bold', fontSize: '1.15rem', color: '#222' }}>
              Item Code
            </label>
            <select
              name="item_code"
              value={form.item_code}
              onChange={handleChange}
              style={{
                width: '80%',
                height: '36px',
                fontSize: '1.08rem',
                border: '2px solid #bbb',
                borderRadius: '6px',
                padding: '0 8px',
                background: isFormReadOnly ? '#eee' : '#fff'
              }}
              disabled={isFormReadOnly || !form.outlet_code}
              required
            >
              <option value="">Select Item</option>
              {itemCodes.map(item => (
                <option key={item.code} value={item.code}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
            {fieldErrors.item_code && (
              <span style={{ color: 'red', fontSize: '0.98rem', marginLeft: '12px' }}>
                {fieldErrors.item_code}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label style={{ width: '180px', fontWeight: 'bold', fontSize: '1.15rem', color: '#222' }}>
              Item Name
            </label>
            <input
              type="text"
              name="item_name"
              value={form.item_name}
              style={{
                width: '80%',
                height: '36px',
                fontSize: '1.08rem',
                border: '2px solid #bbb',
                borderRadius: '6px',
                padding: '0 8px',
                background: '#eee'
              }}
              disabled={true}
              readOnly
            />
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label style={{ width: '180px', fontWeight: 'bold', fontSize: '1.15rem', color: '#222' }}>
              Original Stock Count
            </label>
            <input
              type="number"
              name="original_stock_count"
              value={form.original_stock_count}
              onChange={handleChange}
              min="0"
              style={{
                width: '80%',
                height: '36px',
                fontSize: '1.08rem',
                border: '2px solid #bbb',
                borderRadius: '6px',
                padding: '0 8px',
                background: isFormReadOnly ? '#eee' : '#fff'
              }}
              disabled={isFormReadOnly}
              required
            />
            {fieldErrors.original_stock_count && (
              <span style={{ color: 'red', fontSize: '0.98rem', marginLeft: '12px' }}>
                {fieldErrors.original_stock_count}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label style={{ width: '180px', fontWeight: 'bold', fontSize: '1.15rem', color: '#222' }}>
              Current Stock Count
            </label>
            <input
              type="number"
              name="current_stock_count"
              value={form.current_stock_count}
              onChange={handleChange}
              min="0"
              style={{
                width: '80%',
                height: '36px',
                fontSize: '1.08rem',
                border: '2px solid #bbb',
                borderRadius: '6px',
                padding: '0 8px',
                background: isFormReadOnly ? '#eee' : '#fff'
              }}
              disabled={isFormReadOnly}
              required
            />
            {fieldErrors.current_stock_count && (
              <span style={{ color: 'red', fontSize: '0.98rem', marginLeft: '12px' }}>
                {fieldErrors.current_stock_count}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label style={{ width: '180px', fontWeight: 'bold', fontSize: '1.15rem', color: '#222' }}>
              Reset Stock Quantity at Daily Close
            </label>
            <select
              name="reset_stock_daily_close"
              value={form.reset_stock_daily_close}
              onChange={handleChange}
              style={{
                width: '80%',
                height: '36px',
                fontSize: '1.08rem',
                border: '2px solid #bbb',
                borderRadius: '6px',
                padding: '0 8px',
                background: isFormReadOnly ? '#eee' : '#fff'
              }}
              disabled={isFormReadOnly}
              required
            >
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            {fieldErrors.reset_stock_daily_close && (
              <span style={{ color: 'red', fontSize: '0.98rem', marginLeft: '12px' }}>
                {fieldErrors.reset_stock_daily_close}
              </span>
            )}
          </div>

          {/* Information Panel */}
          <div style={{
            background: '#f8f9fa',
            border: '2px solid #dee2e6',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '16px'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#495057', fontSize: '1.1rem' }}>
              Reset Stock Quantity Explanation:
            </h4>
            <div style={{ fontSize: '0.95rem', color: '#6c757d', lineHeight: '1.4' }}>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Yes:</strong> Stock automatically resets to original count at daily close. Item available next day.
              </p>
              <p style={{ margin: '0' }}>
                <strong>No:</strong> Stock does not reset. If item reaches zero, it won't be available next day until manually restocked.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}