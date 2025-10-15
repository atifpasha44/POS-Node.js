import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import './Dashboard.css';

const mockPriceLevels = [
  'Price 1',
  'Price 2',
  'Price 3',
  'Price 4',
];
const mockOutletTypes = [
  'Restaurant',
  'Bar',
  'Coffee Shop',
  'Bakery',
];

export default function OutletSetup({ setParentDirty, propertyCodes, records, setRecords }) {
const initialState = {
  property: '',
  applicable_from: '',
  outlet_code: '',
  outlet_name: '',
  short_name: '',
  outlet_type: '',
  item_price_level: '',
  check_prefix: '',
  check_format: '',
  receipt_format: '',
  kitchen_format: '',
  inactive: false,
  options: {
    cash: false,
    card: false,
    company: false,
    room_guest: false,
    staff: false,
    bill_on_hold: false,
    credit: false,
    void: false
  }
};

  // Function to filter Property Codes based on current date logic
  const getApplicablePropertyCodes = () => {
    if (!propertyCodes || propertyCodes.length === 0) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate date comparison
    
    // Group property codes by property_code to handle multiple dates
    const groupedByCodes = propertyCodes.reduce((acc, pc) => {
      const code = pc.property_code || pc.code;
      if (!acc[code]) acc[code] = [];
      acc[code].push(pc);
      return acc;
    }, {});
    
    const applicableCodes = [];
    
    // For each unique property code, find the most recent applicable record
    Object.keys(groupedByCodes).forEach(code => {
      const records = groupedByCodes[code];
      
      // Filter records that are applicable (applicable_from <= today)
      const applicableRecords = records.filter(record => {
        const applicableDate = new Date(record.applicable_from);
        applicableDate.setHours(0, 0, 0, 0);
        return applicableDate <= today;
      });
      
      if (applicableRecords.length > 0) {
        // Sort by applicable_from date (descending) to get the most recent applicable record
        applicableRecords.sort((a, b) => new Date(b.applicable_from) - new Date(a.applicable_from));
        
        // Add the most recent applicable record
        applicableCodes.push(applicableRecords[0]);
      }
    });
    
    return applicableCodes;
  };


  // Track if a delete is pending confirmation
  const deletePendingRef = useRef(false);
  const [form, setForm] = useState(initialState);
  const [action, setAction] = useState('Add');
  const [isDirty, setIsDirty] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedRecordIdx, setSelectedRecordIdx] = useState(null);
  const [showNoChangePopup, setShowNoChangePopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectModalMessage, setSelectModalMessage] = useState('');
  // Use records and setRecords from props (parent Dashboard)
  // const [records, setRecords] = useState([]);
  const [priceLevels, setPriceLevels] = useState(mockPriceLevels);
  const [outletTypes, setOutletTypes] = useState(mockOutletTypes);
  const formRef = useRef(null);

  // Reset message when modal closes
  useEffect(() => {
    if (!showSelectModal) setSelectModalMessage('');
  }, [showSelectModal]);

  // Navigation guard
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // Set default date for Applicable From on Add
  useEffect(() => {
    if (action === 'Add') {
      // Use timezone-safe date formatting
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      setForm(f => ({ ...f, applicable_from: todayStr }));
    }
  }, [action]);

  // Handlers
  const handleChange = e => {
    const { name, value, type, checked, maxLength } = e.target;
    if (type === 'checkbox' && name in form.options) {
      setForm(f => ({ ...f, options: { ...f.options, [name]: checked } }));
    } else if (type === 'checkbox' && name === 'inactive') {
      setForm(f => ({ ...f, inactive: checked }));
    } else if (name === 'outlet_code') {
      // Only allow 4 alphanumeric chars, uppercase, and block edit if not Add
      if (action !== 'Add') return;
      let val = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (val.length > 4) val = val.slice(0, 4);
      setForm(f => ({ ...f, outlet_code: val }));
    } else if (name === 'short_name') {
      setForm(f => ({ ...f, short_name: value.slice(0, 15) }));
    } else if (name === 'check_prefix') {
      setForm(f => ({ ...f, check_prefix: value.slice(0, 4) }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
    setIsDirty(true);
    if (setParentDirty) setParentDirty(true);
  };
  const handleClear = () => {
    setForm(initialState);
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
    setSelectedRecordIdx(null);
    setAction('Add');
  };
  const handleSave = async () => {
    // Validate all fields are filled/selected (all mandatory)
    const requiredFields = [
      { key: 'property', label: 'Property' },
      { key: 'applicable_from', label: 'Applicable From' },
      { key: 'outlet_code', label: 'Outlet Code' },
      { key: 'outlet_name', label: 'Outlet Name' },
      { key: 'short_name', label: 'Short Name' },
      { key: 'outlet_type', label: 'Outlet Type' },
      { key: 'item_price_level', label: 'Item Price Level' },
      { key: 'check_prefix', label: 'Check Prefix' },
      { key: 'check_format', label: 'Check Format' },
      { key: 'receipt_format', label: 'Receipt Format' },
      { key: 'kitchen_format', label: 'Kitchen Format' }
    ];
    for (const field of requiredFields) {
      if (!form[field.key] || (typeof form[field.key] === 'string' && form[field.key].trim() === '')) {
        alert(`Please enter/select ${field.label}.`);
        return;
      }
    }
    // All options checkboxes must be selected (true or false is fine, but must exist)
    if (!form.options || Object.keys(form.options).length !== 8) {
      alert('All options must be set.');
      return;
    }
    // Validation: outlet_code required, 4 chars, unique
    if (!form.outlet_code || form.outlet_code.length !== 4) {
      alert('Outlet Code must be exactly 4 alphanumeric characters.');
      return;
    }
    if (records.some((rec, idx) => rec && rec.outlet_code === form.outlet_code && idx !== selectedRecordIdx)) {
      alert('This Outlet Code already exists. Please enter a unique code.');
      return;
    }
    // Validation: short_name max 15 chars
    if (form.short_name && form.short_name.length > 15) {
      alert('Short Name must be 15 characters or less.');
      return;
    }
    // Validation: check_prefix max 4 chars
    if (form.check_prefix && form.check_prefix.length > 4) {
      alert('Check Prefix must be 4 characters or less.');
      return;
    }
    if (action === 'Delete' && selectedRecordIdx !== null) {
      setShowDeleteConfirm(true);
      deletePendingRef.current = true;
      return;
    }
    setRecords(prev => {
      // Filter out empty/invalid records before saving
      const filtered = prev.filter(r => r && r.outlet_code && r.options && typeof r.options.cash !== 'undefined');
      if (action === 'Edit' && selectedRecordIdx !== null) {
        const updated = [...filtered];
        updated[selectedRecordIdx] = { ...form };
        setShowSavePopup(true);
        setTimeout(() => setShowSavePopup(false), 1800);
        setIsDirty(false);
        if (setParentDirty) setParentDirty(false);
        setSelectedRecordIdx(null);
        setForm(initialState);
        return updated;
      }
      // Add mode: check for duplicate outlet_code
      if (filtered.some(rec => rec.outlet_code === form.outlet_code)) {
        alert('This Outlet Code already exists. Please enter a unique code.');
        return filtered;
      }
      setShowSavePopup(true);
      setTimeout(() => setShowSavePopup(false), 1800);
      setIsDirty(false);
      if (setParentDirty) setParentDirty(false);
      setSelectedRecordIdx(null);
      setForm(initialState);
      return [...filtered, { ...form }];
    });
  };

// Confirmed delete handler
const handleDeleteConfirmed = async () => {
  deletePendingRef.current = false;
    if (selectedRecordIdx === null) return;
    const record = records[selectedRecordIdx];
    try {
      // Call backend delete API (adjust endpoint as needed)
      await axios.delete(`/api/outlets/${record.outlet_code}`);
    } catch (err) {
      alert('Failed to delete record from backend.');
      setShowDeleteConfirm(false);
      return;
    }
    setRecords(prev => prev.filter((_, i) => i !== selectedRecordIdx));
    setShowSavePopup(true);
    setTimeout(() => setShowSavePopup(false), 1800);
    setForm(initialState);
    setSelectedRecordIdx(null);
    setIsDirty(false);
    setAction('Add');
    if (setParentDirty) setParentDirty(false);
    setShowDeleteConfirm(false);
};
// Cancel delete
const handleDeleteCancel = () => {
  setShowDeleteConfirm(false);
  deletePendingRef.current = false;
};
// Guard: On unmount or navigation, clear any pending delete
useEffect(() => {
  return () => {
    deletePendingRef.current = false;
  };
}, []);
  const handleSearch = () => {
    setAction('Search');
    setShowSelectModal(true);
    setSelectModalMessage('All Outlet Setup Records - Select to View Details');
  };
  const handleAdd = () => {
    setAction('Add');
    setForm(f => ({ ...initialState, applicable_from: new Date().toISOString().split('T')[0] }));
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
    setSelectedRecordIdx(null);
  };
  const handleEdit = async () => {
    setAction('Edit');
    setSelectedRecordIdx(null);
    setShowSelectModal(true);
    setSelectModalMessage('Please select a record to edit.');
  };
  const handleDelete = () => {
    setAction('Delete');
    setShowSelectModal(true);
    setSelectModalMessage('Please select a record to delete.');
  };
  const handleExport = async (type) => {
    // Prepare data for export (all records)
    const exportData = records.length ? records : [form];
    
    if (type === 'Excel') {
      try {
        // Create a new workbook using ExcelJS
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Outlet Setup Data');
        
        // Add report title
        const titleRow = worksheet.addRow(['Outlet Setup Export Report']);
        worksheet.mergeCells('A1:U1'); // Merge across all columns (21 columns)
        
        // Style the title
        titleRow.getCell(1).font = {
          bold: true,
          size: 16,
          color: { argb: 'FF000000' },
          name: 'Calibri'
        };
        titleRow.getCell(1).alignment = {
          horizontal: 'center',
          vertical: 'middle'
        };
        titleRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE7E6E6' }
        };
        titleRow.height = 25;
        
        // Add empty row for spacing
        worksheet.addRow([]);
        
        // Define headers
        const headers = [
          'ID',
          'Applicable From',
          'Property Code',
          'Outlet Code',
          'Outlet Name',
          'Outlet Type',
          'Short Name',
          'Item Price Level',
          'Check Prefix',
          'Check Format',
          'Kitchen Format',
          'Receipt Format',
          'In Active',
          'Cash',
          'Card',
          'Company',
          'Room Guest',
          'Staff',
          'Bill on Hold',
          'Credit',
          'Void'
        ];
        
        // Add header row
        const headerRow = worksheet.addRow(headers);
        
        // Style header row
        headerRow.eachCell((cell, colNumber) => {
          cell.font = {
            bold: true,
            color: { argb: 'FFFFFFFF' },
            size: 12,
            name: 'Calibri'
          };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
          };
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
          };
          cell.border = {
            top: { style: 'medium', color: { argb: 'FF000000' } },
            left: { style: 'medium', color: { argb: 'FF000000' } },
            bottom: { style: 'medium', color: { argb: 'FF000000' } },
            right: { style: 'medium', color: { argb: 'FF000000' } }
          };
        });
        
        // Add data rows
        exportData.forEach((record, index) => {
          const row = [
            record.id || '',
            record.applicable_from ? new Date(record.applicable_from).toLocaleDateString('en-GB', { 
              day: '2-digit', month: '2-digit', year: 'numeric' 
            }) : '',
            record.property || '',
            record.outlet_code || '',
            record.outlet_name || '',
            record.outlet_type || '',
            record.short_name || '',
            record.item_price_level || '',
            record.check_prefix || '',
            record.check_format || '',
            record.kitchen_format || '',
            record.receipt_format || '',
            record.inactive ? 'Yes' : 'No',
            record.options?.cash ? 'Yes' : 'No',
            record.options?.card ? 'Yes' : 'No',
            record.options?.company ? 'Yes' : 'No',
            record.options?.room_guest ? 'Yes' : 'No',
            record.options?.staff ? 'Yes' : 'No',
            record.options?.bill_on_hold ? 'Yes' : 'No',
            record.options?.credit ? 'Yes' : 'No',
            record.options?.void ? 'Yes' : 'No'
          ];
          
          const dataRow = worksheet.addRow(row);
          
          // Style data rows with alternating colors
          const isEvenRow = (index + 4) % 2 === 0; // +4 because title(1) + empty(1) + header(1) + first data row(1)
          const fillColor = isEvenRow ? 'FFF8F9FA' : 'FFFFFFFF';
          
          dataRow.eachCell((cell, colNumber) => {
            cell.font = {
              color: { argb: 'FF000000' },
              size: 10,
              name: 'Calibri'
            };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: fillColor }
            };
            cell.alignment = {
              horizontal: colNumber <= 4 ? 'center' : 'left',
              vertical: 'middle'
            };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
            };
          });
        });
        
        // Auto-fit columns
        worksheet.columns.forEach((column, index) => {
          let maxLength = 0;
          column.eachCell({ includeEmpty: true }, (cell) => {
            const cellValue = cell.value ? cell.value.toString() : '';
            maxLength = Math.max(maxLength, cellValue.length);
          });
          column.width = Math.min(Math.max(maxLength + 2, 12), 30);
        });
        
        // Generate filename with timestamp
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        const filename = `Outlet_Setup_Export_${year}${month}${day}_${hours}${minutes}${seconds}.xlsx`;
        
        // Generate buffer and save file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        saveAs(blob, filename);
        
        console.log('✅ Excel file exported successfully:', filename);
        alert(`✅ Formatted Outlet Setup Excel Report exported successfully!\n\nFilename: ${filename}\n\nFeatures included:\n• Report heading at top\n• Professional blue headers\n• Alternating row colors\n• Complete table formatting\n• Auto-sized columns`);
        
      } catch (error) {
        console.error('Excel export error:', error);
        alert('❌ Error exporting to Excel. Please try again.\n\nError: ' + error.message);
      }
      
    } else if (type === 'PDF') {
      alert('Export to PDF (implement jsPDF logic)');
    }
  };
  const handleSelectRecord = idx => {
    // Defensive: filter out empty/invalid records
    const filtered = records.filter(r => r && r.outlet_code && r.options && typeof r.options.cash !== 'undefined');
    const selectedRecord = filtered[idx];
    
    // Format the applicable_from date to YYYY-MM-DD for date input
    let formattedDate = selectedRecord.applicable_from;
    if (selectedRecord.applicable_from) {
      formattedDate = selectedRecord.applicable_from.split('T')[0];
    }
    
    const formattedRecord = {
      ...selectedRecord,
      applicable_from: formattedDate
    };
    
    setForm(formattedRecord);
    setSelectedRecordIdx(idx);
    setShowSelectModal(false);
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
    // Do NOT delete here; wait for explicit Save/Delete confirmation
  };

  // UI
  return (
    <div className="propertycode-panel" style={{background:'#fff',border:'2.5px solid #222',borderRadius:'16px',boxShadow:'0 2px 12px rgba(0,0,0,0.10)',width:'100%',maxWidth:'1200px',margin:'32px auto',padding:'0 0 18px 0',height:'calc(100vh - 120px)',display:'flex',flexDirection:'column',overflowY:'auto',position:'relative'}}>
      {/* Top Control Bar - sticky */}
      <div style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        borderBottom:'2px solid #e0e0e0',padding:'12px 18px 8px 18px',minWidth:0,
        position:'sticky',top:0,zIndex:10,background:'#fff',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',minWidth:0,flexWrap:'wrap'}}>
          <span style={{fontWeight:'bold',fontSize:'2rem',color:'#222',marginRight:'18px'}}>Outlet Setup</span>
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
      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div style={{position:'fixed',top:'30%',left:'50%',transform:'translate(-50%,-50%)',background:'#fff',border:'2px solid #e53935',borderRadius:'12px',padding:'32px 48px',zIndex:2000,boxShadow:'0 4px 24px rgba(0,0,0,0.18)',fontSize:'1.25rem',color:'#e53935',fontWeight:'bold'}}>
          <div>Are you sure you want to delete this record?</div>
          <div style={{marginTop:'18px',display:'flex',gap:'24px',justifyContent:'center'}}>
            <button onClick={handleDeleteConfirmed} style={{background:'#e53935',color:'#fff',border:'none',borderRadius:'6px',padding:'8px 22px',fontWeight:'bold',fontSize:'1.08rem',cursor:'pointer'}}>Yes, Delete</button>
            <button onClick={handleDeleteCancel} style={{background:'#bbb',color:'#222',border:'none',borderRadius:'6px',padding:'8px 22px',fontWeight:'bold',fontSize:'1.08rem',cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      )}
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
            <div style={{fontWeight:'bold',fontSize:'1.2rem',marginBottom:'18px',color:'#1976d2'}}>
              {action === 'Search' ? 'All Outlet Setup Records - Select to View Details' : (selectModalMessage || 'Select a record to edit/delete')}
              <div style={{fontSize:'0.8rem',color:'#666',marginTop:'4px'}}>
                Current Date: {new Date().toLocaleDateString('en-GB')} | Records sorted: Latest → Future → Past
              </div>
            </div>
            {action === 'Search' && (
              <div style={{padding:'12px',background:'#e8f5e9',borderRadius:'8px',marginBottom:'16px',fontSize:'0.95rem',color:'#2e7d32'}}>
                📖 <strong>Search Mode:</strong> View all historical and future configurations for this Outlet Setup. 
                Selected records will be displayed in read-only mode to prevent accidental changes.
              </div>
            )}
            {(() => {
              const filtered = records.filter(r => r && r.outlet_code && r.options && typeof r.options.cash !== 'undefined');
              if (filtered.length === 0) {
                return <div style={{color:'#888',fontSize:'1.05rem'}}>No records found.</div>;
              }
              
              return (
                <table style={{width:'100%',borderCollapse:'collapse',marginBottom:'12px'}}>
                  <thead>
                    <tr style={{background:'#e3e3e3'}}>
                      <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Outlet Code</th>
                      <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Outlet Name</th>
                      <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Property</th>
                      <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((rec, idx) => (
                      <tr key={idx} style={{background: idx % 2 ? '#f7f7f7' : '#fff'}}>
                        <td style={{padding:'6px 8px'}}>{rec.outlet_code}</td>
                        <td style={{padding:'6px 8px'}}>{rec.outlet_name}</td>
                        <td style={{padding:'6px 8px'}}>{rec.property}</td>
                        <td style={{padding:'6px 8px'}}>
                          <button type="button" style={{background:'#7b1fa2',color:'#fff',border:'none',borderRadius:'6px',padding:'4px 12px',fontWeight:'bold',cursor:'pointer'}} onClick={()=>handleSelectRecord(idx)}>Select</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
            <button type="button" style={{background:'#e53935',color:'#fff',border:'none',borderRadius:'6px',padding:'8px 22px',fontWeight:'bold',fontSize:'1.08rem',marginTop:'8px',cursor:'pointer'}} onClick={()=>setShowSelectModal(false)}>Close</button>
          </div>
        </div>
      )}
      {/* Form Section - two columns, bold labels */}
      <form ref={formRef} className="propertycode-form" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 32px',padding:'32px 32px 0 32px'}} autoComplete="off">
        {/* Left column */}
        <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Property</label>
            <select name="property" value={form.property} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: (action === 'Edit' || action === 'Search') ? '#f3f3f3' : '#fff'}} disabled={action === 'Edit' || action === 'Search'} required>
              <option value="">Select Property</option>
              {(() => {
                const applicableCodes = getApplicablePropertyCodes();
                return applicableCodes.map(pc => (
                  <option key={pc.property_code || pc.code} value={pc.property_code || pc.code}>
                    {(pc.property_code || pc.code) + (pc.property_name ? ' - ' + pc.property_name : (pc.name ? ' - ' + pc.name : ''))}
                  </option>
                ));
              })()}
            </select>
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Outlet Code</label>
            <input type="text" name="outlet_code" value={form.outlet_code} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: (action === 'Edit' || action === 'Search') ? '#f3f3f3' : '#fff'}} maxLength={4} disabled={action === 'Edit' || action === 'Search'} autoComplete="off" required />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Short Name</label>
            <input type="text" name="short_name" value={form.short_name} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: action === 'Search' ? '#f3f3f3' : '#fff'}} disabled={action === 'Search'} maxLength={15} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Item Price Level</label>
            <select name="item_price_level" value={form.item_price_level} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: action === 'Search' ? '#f3f3f3' : '#fff'}} disabled={action === 'Search'}>
              <option value="">Select Price Level</option>
              {priceLevels.map((pl, i) => <option key={i} value={pl}>{pl}</option>)}
            </select>
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Check Format</label>
            <input type="text" name="check_format" value={form.check_format} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: action === 'Search' ? '#f3f3f3' : '#fff'}} disabled={action === 'Search'} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Kitchen Format</label>
            <input type="text" name="kitchen_format" value={form.kitchen_format} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: action === 'Search' ? '#f3f3f3' : '#fff'}} disabled={action === 'Search'} />
          </div>
        </div>
        {/* Right column */}
        <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Applicable From</label>
            <input 
              type="date" 
              name="applicable_from" 
              value={form.applicable_from} 
              onChange={handleChange} 
              style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: (action === 'Edit' || action === 'Search') ? '#f3f3f3' : '#fff'}} 
              disabled={action === 'Edit' || action === 'Search'}
              required 
            />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Outlet Name</label>
            <input type="text" name="outlet_name" value={form.outlet_name} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: action === 'Search' ? '#f3f3f3' : '#fff'}} disabled={action === 'Search'} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Outlet Type</label>
            <select name="outlet_type" value={form.outlet_type} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: (action === 'Edit' || action === 'Search') ? '#f3f3f3' : '#fff'}} disabled={action === 'Edit' || action === 'Search'}>
              <option value="">Select Outlet Type</option>
              {outletTypes.map((ot, i) => <option key={i} value={ot}>{ot}</option>)}
            </select>
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Check Prefix</label>
            <input type="text" name="check_prefix" value={form.check_prefix} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: action === 'Search' ? '#f3f3f3' : '#fff'}} disabled={action === 'Search'} maxLength={4} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Receipt Format</label>
            <input type="text" name="receipt_format" value={form.receipt_format} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: action === 'Search' ? '#f3f3f3' : '#fff'}} disabled={action === 'Search'} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>In Active</label>
            <input type="checkbox" name="inactive" checked={form.inactive} onChange={handleChange} style={{width:'24px',height:'24px',marginLeft:'8px'}} disabled={action === 'Search'} />
          </div>
        </div>
      </form>
      {/* Options Section - checkboxes */}
      <div style={{display:'flex',flexWrap:'wrap',gap:'32px',padding:'24px 32px 0 32px'}}>
        <div style={{display:'flex',gap:'24px',flexWrap:'wrap'}}>
          <label style={{fontWeight:'bold'}}><input type="checkbox" name="cash" checked={form.options.cash} onChange={handleChange} style={{marginRight:'6px'}} disabled={action === 'Search'} />Cash</label>
          <label style={{fontWeight:'bold'}}><input type="checkbox" name="card" checked={form.options.card} onChange={handleChange} style={{marginRight:'6px'}} disabled={action === 'Search'} />Card</label>
          <label style={{fontWeight:'bold'}}><input type="checkbox" name="company" checked={form.options.company} onChange={handleChange} style={{marginRight:'6px'}} disabled={action === 'Search'} />Company</label>
          <label style={{fontWeight:'bold'}}><input type="checkbox" name="room_guest" checked={form.options.room_guest} onChange={handleChange} style={{marginRight:'6px'}} disabled={action === 'Search'} />Room Guest</label>
          <label style={{fontWeight:'bold'}}><input type="checkbox" name="staff" checked={form.options.staff} onChange={handleChange} style={{marginRight:'6px'}} disabled={action === 'Search'} />Staff</label>
          <label style={{fontWeight:'bold'}}><input type="checkbox" name="bill_on_hold" checked={form.options.bill_on_hold} onChange={handleChange} style={{marginRight:'6px'}} disabled={action === 'Search'} />Bill on Hold</label>
          <label style={{fontWeight:'bold'}}><input type="checkbox" name="credit" checked={form.options.credit} onChange={handleChange} style={{marginRight:'6px'}} disabled={action === 'Search'} />Credit</label>
          <label style={{fontWeight:'bold'}}><input type="checkbox" name="void" checked={form.options.void} onChange={handleChange} style={{marginRight:'6px'}} disabled={action === 'Search'} />Void</label>
        </div>
      </div>
    </div>
  );
}
