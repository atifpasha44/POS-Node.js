import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const initialState = {
  tax_structure_code: '',
  tax_structure_name: '',
  included_taxes: [], // Array of {tax_code, sequence, calculation_method}
  is_active: true,
  effective_from: '',
  effective_to: ''
};

const initialTaxEntry = {
  tax_code: '',
  sequence: 1,
  calculation_method: 'Addition'
};

const TaxStructure = ({ setParentDirty, records, setRecords, taxCodesRecords }) => {
  const [isDirty, setIsDirty] = useState(false);
  const [form, setForm] = useState(initialState);
  const [action, setAction] = useState('Add');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedRecordIdx, setSelectedRecordIdx] = useState(null);
  const [selectModalMessage, setSelectModalMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [lastAction, setLastAction] = useState('Add');
  const [currentTaxEntry, setCurrentTaxEntry] = useState(initialTaxEntry);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [editingTaxIndex, setEditingTaxIndex] = useState(-1);
  const formRef = useRef(null);

  // Calculation method options
  const calculationMethods = [
    'Addition',
    'Percentage',
    'Compound',
    'Sequential',
    'Parallel'
  ];

  // Get tax name by code
  const getTaxName = (taxCode) => {
    const tax = taxCodesRecords?.find(t => t.tax_code === taxCode);
    return tax ? tax.tax_name : taxCode;
  };

  // Get tax percentage by code
  const getTaxPercentage = (taxCode) => {
    const tax = taxCodesRecords?.find(t => t.tax_code === taxCode);
    return tax ? tax.tax_percentage : 0;
  };

  // Validation function
  const validateForm = () => {
    const errors = {};
    
    if (!form.tax_structure_code.trim()) {
      errors.tax_structure_code = 'Tax Structure Code is required';
    } else if (form.tax_structure_code.length > 15) {
      errors.tax_structure_code = 'Tax Structure Code must not exceed 15 characters';
    } else {
      // Check for duplicate tax structure codes (case insensitive)
      const isDuplicate = records && records.some((record, index) => {
        if (index === selectedRecordIdx) return false; // Skip current record during edit
        return record.tax_structure_code.toLowerCase() === form.tax_structure_code.toLowerCase();
      });
      if (isDuplicate) {
        errors.tax_structure_code = 'Tax Structure Code already exists';
      }
    }
    
    if (!form.tax_structure_name.trim()) {
      errors.tax_structure_name = 'Tax Structure Name is required';
    } else if (form.tax_structure_name.length > 100) {
      errors.tax_structure_name = 'Tax Structure Name must not exceed 100 characters';
    }
    
    if (!form.included_taxes || form.included_taxes.length === 0) {
      errors.included_taxes = 'At least one tax must be included in the structure';
    } else {
      // Check for duplicate tax codes in the structure
      const taxCodes = form.included_taxes.map(tax => tax.tax_code);
      const uniqueTaxCodes = [...new Set(taxCodes)];
      if (taxCodes.length !== uniqueTaxCodes.length) {
        errors.included_taxes = 'Duplicate tax codes are not allowed in the same structure';
      }
      
      // Check for duplicate sequences
      const sequences = form.included_taxes.map(tax => parseInt(tax.sequence));
      const uniqueSequences = [...new Set(sequences)];
      if (sequences.length !== uniqueSequences.length) {
        errors.included_taxes = 'Duplicate sequence numbers are not allowed';
      }
    }
    
    // Validate date range if provided
    if (form.effective_from && form.effective_to) {
      const fromDate = new Date(form.effective_from);
      const toDate = new Date(form.effective_to);
      
      if (fromDate >= toDate) {
        errors.effective_to = 'Effective To date must be after Effective From date';
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate tax entry
  const validateTaxEntry = () => {
    const errors = {};
    
    if (!currentTaxEntry.tax_code.trim()) {
      errors.tax_code = 'Tax Code is required';
    } else {
      // Check if tax code already exists in the structure (excluding current editing index)
      const existingTax = form.included_taxes.some((tax, index) => {
        if (index === editingTaxIndex) return false;
        return tax.tax_code === currentTaxEntry.tax_code;
      });
      if (existingTax) {
        errors.tax_code = 'Tax code already included in this structure';
      }
    }
    
    if (!currentTaxEntry.sequence || currentTaxEntry.sequence < 1) {
      errors.sequence = 'Sequence must be a positive number';
    } else {
      // Check if sequence already exists (excluding current editing index)
      const existingSequence = form.included_taxes.some((tax, index) => {
        if (index === editingTaxIndex) return false;
        return parseInt(tax.sequence) === parseInt(currentTaxEntry.sequence);
      });
      if (existingSequence) {
        errors.sequence = 'Sequence number already used';
      }
    }
    
    if (!currentTaxEntry.calculation_method.trim()) {
      errors.calculation_method = 'Calculation Method is required';
    }
    
    return errors;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let newValue = value;
    
    // Handle special formatting
    if (name === 'tax_structure_code') {
      newValue = value.toUpperCase().replace(/[^A-Z0-9]/g, ''); // Only alphanumeric, uppercase
    }
    
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : newValue
    }));

    // Clear field error when user starts typing
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

  // Handle tax entry changes
  const handleTaxEntryChange = (e) => {
    const { name, value } = e.target;
    
    let newValue = value;
    if (name === 'sequence') {
      newValue = value.replace(/[^0-9]/g, ''); // Only numbers
    }
    
    setCurrentTaxEntry(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  // Add or update tax in structure
  const handleAddTax = () => {
    const validationErrors = validateTaxEntry();
    if (Object.keys(validationErrors).length > 0) {
      // Show validation errors
      alert(Object.values(validationErrors).join('\n'));
      return;
    }

    const newTax = {
      tax_code: currentTaxEntry.tax_code,
      sequence: parseInt(currentTaxEntry.sequence),
      calculation_method: currentTaxEntry.calculation_method
    };

    let updatedTaxes;
    if (editingTaxIndex >= 0) {
      // Update existing tax
      updatedTaxes = [...form.included_taxes];
      updatedTaxes[editingTaxIndex] = newTax;
    } else {
      // Add new tax
      updatedTaxes = [...form.included_taxes, newTax];
    }

    // Sort by sequence
    updatedTaxes.sort((a, b) => a.sequence - b.sequence);

    setForm(prev => ({
      ...prev,
      included_taxes: updatedTaxes
    }));

    // Clear tax entry form and close modal
    setCurrentTaxEntry(initialTaxEntry);
    setEditingTaxIndex(-1);
    setShowTaxModal(false);

    if (!isDirty) {
      setIsDirty(true);
      setParentDirty(true);
    }
  };

  // Remove tax from structure
  const handleRemoveTax = (index) => {
    const updatedTaxes = form.included_taxes.filter((_, i) => i !== index);
    setForm(prev => ({
      ...prev,
      included_taxes: updatedTaxes
    }));

    if (!isDirty) {
      setIsDirty(true);
      setParentDirty(true);
    }
  };

  // Edit tax in structure
  const handleEditTax = (index) => {
    const tax = form.included_taxes[index];
    setCurrentTaxEntry({
      tax_code: tax.tax_code,
      sequence: tax.sequence,
      calculation_method: tax.calculation_method
    });
    setEditingTaxIndex(index);
    setShowTaxModal(true);
  };

  // Open add tax modal
  const handleOpenTaxModal = () => {
    setCurrentTaxEntry(initialTaxEntry);
    setEditingTaxIndex(-1);
    setShowTaxModal(true);
  };

  // Handlers
  const handleAdd = () => {
    setAction('Add');
    setForm(initialState);
    setSelectedRecordIdx(null);
    setFieldErrors({});
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
  };

  const handleEdit = () => {
    if (selectedRecordIdx === null || !records || selectedRecordIdx >= records.length) {
      setSelectModalMessage('Please select a record to edit.');
      setShowSelectModal(true);
      return;
    }
    setAction('Edit');
    const selectedRecord = records[selectedRecordIdx];
    setForm({
      tax_structure_code: selectedRecord.tax_structure_code || '',
      tax_structure_name: selectedRecord.tax_structure_name || '',
      included_taxes: selectedRecord.included_taxes || [],
      is_active: selectedRecord.is_active !== undefined ? selectedRecord.is_active : true,
      effective_from: selectedRecord.effective_from || '',
      effective_to: selectedRecord.effective_to || ''
    });
    setFieldErrors({});
    setIsDirty(true);
    if (setParentDirty) setParentDirty(true);
  };

  const handleDelete = () => {
    if (selectedRecordIdx === null || !records || selectedRecordIdx >= records.length) {
      setSelectModalMessage('Please select a record to delete.');
      setShowSelectModal(true);
      return;
    }
    
    const selectedRecord = records[selectedRecordIdx];
    const confirmMessage = `Are you sure you want to delete "${selectedRecord.tax_structure_name}" (${selectedRecord.tax_structure_code})?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        const updatedRecords = records.filter((_, index) => index !== selectedRecordIdx);
        setRecords(updatedRecords);
        
        setSelectedRecordIdx(null);
        setForm(initialState);
        setAction('Add');
        setFieldErrors({});
        
        setLastAction('Delete');
        setShowSavePopup(true);
        setIsDirty(false);
        if (setParentDirty) setParentDirty(false);
        
        setTimeout(() => {
          setShowSavePopup(false);
        }, 2000);
        
      } catch (error) {
        console.error('Error deleting tax structure:', error);
      }
    }
  };

  const handleSearch = () => {
    if (selectedRecordIdx === null || !records || selectedRecordIdx >= records.length) {
      setSelectModalMessage('Please select a record to search.');
      setShowSelectModal(true);
      return;
    }
    setAction('Search');
    const selectedRecord = records[selectedRecordIdx];
    setForm({
      tax_structure_code: selectedRecord.tax_structure_code || '',
      tax_structure_name: selectedRecord.tax_structure_name || '',
      included_taxes: selectedRecord.included_taxes || [],
      is_active: selectedRecord.is_active !== undefined ? selectedRecord.is_active : true,
      effective_from: selectedRecord.effective_from || '',
      effective_to: selectedRecord.effective_to || ''
    });
    setFieldErrors({});
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

    try {
      const newRecord = {
        tax_structure_code: form.tax_structure_code.trim(),
        tax_structure_name: form.tax_structure_name.trim(),
        included_taxes: form.included_taxes,
        is_active: form.is_active,
        effective_from: form.effective_from || null,
        effective_to: form.effective_to || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      let updatedRecords;
      if (action === 'Add') {
        updatedRecords = [...(records || []), newRecord];
      } else if (action === 'Edit' && selectedRecordIdx !== null && records && selectedRecordIdx < records.length) {
        updatedRecords = [...records];
        updatedRecords[selectedRecordIdx] = { 
          ...newRecord, 
          created_at: records[selectedRecordIdx].created_at || newRecord.created_at
        };
      } else {
        updatedRecords = records || [];
      }

      // Sort by tax structure code
      updatedRecords.sort((a, b) => a.tax_structure_code.localeCompare(b.tax_structure_code));
      
      setRecords(updatedRecords);

      // Clear form after successful save (except for Search action)
      if (action !== 'Search') {
        setForm(initialState);
        setSelectedRecordIdx(null);
        setAction('Add');
        setFieldErrors({});
      }

      setLastAction(action);
      setShowSavePopup(true);
      setIsDirty(false);
      if (setParentDirty) setParentDirty(false);
      
      setTimeout(() => {
        setShowSavePopup(false);
      }, 2000);

    } catch (error) {
      console.error('Error saving tax structure:', error);
    }
  };

  // Export handlers
  const exportToExcel = () => {
    const exportData = records && records.length > 0 ? records.map(record => ({
      'Structure Code': record.tax_structure_code,
      'Structure Name': record.tax_structure_name,
      'Included Taxes': record.included_taxes.map(tax => 
        `${tax.tax_code} (Seq: ${tax.sequence}, Method: ${tax.calculation_method})`
      ).join('; '),
      'Status': record.is_active ? 'Active' : 'Inactive',
      'Effective From': record.effective_from || '',
      'Effective To': record.effective_to || '',
      'Created Date': record.created_at ? new Date(record.created_at).toLocaleDateString() : ''
    })) : [form];

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TaxStructures');
    XLSX.writeFile(wb, 'TaxStructures.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    const tableColumn = ['Code', 'Structure Name', 'Taxes Count', 'Status', 'Effective From'];
    
    const tableRows = records ? records.map(record => [
      record.tax_structure_code,
      record.tax_structure_name,
      record.included_taxes.length,
      record.is_active ? 'Active' : 'Inactive',
      record.effective_from || ''
    ]) : [];

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [71, 129, 202] }
    });

    doc.text('Tax Structures Report', 14, 15);
    doc.save('TaxStructures.pdf');
  };

  return (
    <div className="propertycode-panel" style={{
      background:'#fff',
      border:'2.5px solid #222',
      borderRadius:'16px',
      boxShadow:'0 2px 12px rgba(0,0,0,0.10)',
      width:'100%',
      maxWidth:'1400px',
      margin:'32px auto',
      padding:'0',
      height:'calc(100vh - 120px)',
      display:'flex',
      flexDirection:'column',
      position:'relative',
      overflow:'hidden'
    }}>
      {/* Top Control Bar */}
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
            Tax Structure
          </span>
          <select
            value={action}
            onChange={e => {
              const val = e.target.value;
              if (val === 'Add') handleAdd();
              else if (val === 'Edit') handleEdit();
              else if (val === 'Delete') handleDelete();
              else if (val === 'Search') handleSearch();
            }}
            style={{
              fontWeight:'bold',
              fontSize:'1rem',
              padding:'4px 12px',
              borderRadius:'6px',
              border:'1.5px solid #bbb',
              marginRight:'8px'
            }}
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
            onClick={exportToExcel}
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
            onClick={exportToPDF}
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
          ✅ {lastAction === 'Add' ? 'Tax Structure added successfully!' : 
               lastAction === 'Edit' ? 'Tax Structure updated successfully!' : 
               lastAction === 'Delete' ? 'Tax Structure deleted successfully!' : 
               'Tax Structure saved successfully!'}
        </div>
      )}

      {/* Select Modal */}
      {showSelectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            minWidth: '800px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ marginBottom: '16px', color: '#1976d2' }}>{selectModalMessage}</h3>
            {records && records.length > 0 ? (
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Code</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Structure Name</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Taxes</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Status</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, idx) => (
                      <tr key={idx} style={{ background: selectedRecordIdx === idx ? '#e3f2fd' : '#fff' }}>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.tax_structure_code}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.tax_structure_name}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{record.included_taxes.length}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                          <span style={{
                            color: record.is_active ? '#2e7d32' : '#f57c00',
                            fontWeight: 'bold'
                          }}>
                            {record.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                          <button
                            onClick={() => {
                              setSelectedRecordIdx(idx);
                              setShowSelectModal(false);
                              if (action === 'Edit') {
                                handleEdit();
                              } else if (action === 'Delete') {
                                handleDelete();
                              } else if (action === 'Search') {
                                handleSearch();
                              }
                            }}
                            style={{
                              background: '#1976d2',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No records available.</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setShowSelectModal(false)}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Entry Modal */}
      {showTaxModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            minWidth: '500px',
            maxWidth: '90vw',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#1976d2' }}>
              {editingTaxIndex >= 0 ? 'Edit Tax in Structure' : 'Add Tax to Structure'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Tax Code */}
              <div>
                <label style={{ fontWeight: 'bold', fontSize: '1rem', color: '#222', display: 'block', marginBottom: '4px' }}>
                  Tax Code *
                </label>
                <select
                  name="tax_code"
                  value={currentTaxEntry.tax_code}
                  onChange={handleTaxEntryChange}
                  style={{
                    width: '100%',
                    height: '36px',
                    fontSize: '1rem',
                    border: '2px solid #bbb',
                    borderRadius: '6px',
                    padding: '0 8px'
                  }}
                >
                  <option value="">Select Tax Code</option>
                  {taxCodesRecords && taxCodesRecords
                    .filter(tax => tax.is_active)
                    .map((tax, index) => (
                    <option key={index} value={tax.tax_code}>
                      {tax.tax_code} - {tax.tax_name} ({tax.tax_percentage}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Sequence */}
              <div>
                <label style={{ fontWeight: 'bold', fontSize: '1rem', color: '#222', display: 'block', marginBottom: '4px' }}>
                  Sequence *
                </label>
                <input
                  type="text"
                  name="sequence"
                  value={currentTaxEntry.sequence}
                  onChange={handleTaxEntryChange}
                  style={{
                    width: '100%',
                    height: '36px',
                    fontSize: '1rem',
                    border: '2px solid #bbb',
                    borderRadius: '6px',
                    padding: '0 8px'
                  }}
                  placeholder="1, 2, 3..."
                />
              </div>

              {/* Calculation Method */}
              <div>
                <label style={{ fontWeight: 'bold', fontSize: '1rem', color: '#222', display: 'block', marginBottom: '4px' }}>
                  Calculation Method *
                </label>
                <select
                  name="calculation_method"
                  value={currentTaxEntry.calculation_method}
                  onChange={handleTaxEntryChange}
                  style={{
                    width: '100%',
                    height: '36px',
                    fontSize: '1rem',
                    border: '2px solid #bbb',
                    borderRadius: '6px',
                    padding: '0 8px'
                  }}
                >
                  {calculationMethods.map((method, index) => (
                    <option key={index} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button
                onClick={() => setShowTaxModal(false)}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddTax}
                style={{
                  background: '#1976d2',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {editingTaxIndex >= 0 ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        padding: '24px 32px'
      }}>
        {/* Form Section */}
        <form ref={formRef} style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px 32px',
          marginBottom: '32px'
        }}>
          {/* Left Column */}
          <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
            {/* Tax Structure Code */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Structure Code *</label>
              <input 
                type="text" 
                name="tax_structure_code" 
                value={form.tax_structure_code} 
                onChange={handleChange} 
                style={{
                  width:'75%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.tax_structure_code ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff',
                  textTransform:'uppercase'
                }} 
                maxLength="15"
                placeholder="e.g., TAXSTRUCT001"
              />
              {fieldErrors.tax_structure_code && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.tax_structure_code}</span>}
            </div>

            {/* Tax Structure Name */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Structure Name *</label>
              <input 
                type="text" 
                name="tax_structure_name" 
                value={form.tax_structure_name} 
                onChange={handleChange} 
                style={{
                  width:'75%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.tax_structure_name ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }} 
                maxLength="100"
                placeholder="e.g., Standard Hotel Tax Structure"
              />
              {fieldErrors.tax_structure_name && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.tax_structure_name}</span>}
            </div>

            {/* Status */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Status</label>
              <div style={{display:'flex',alignItems:'center',marginLeft:'8px'}}>
                <input 
                  type="checkbox" 
                  name="is_active" 
                  checked={form.is_active} 
                  onChange={handleChange} 
                  style={{width:'24px',height:'24px'}} 
                />
                <span style={{marginLeft:'8px',fontSize:'1rem',color:'#666'}}>Active</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
            {/* Effective From */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Effective From</label>
              <input 
                type="date" 
                name="effective_from" 
                value={form.effective_from} 
                onChange={handleChange} 
                style={{
                  width:'75%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.effective_from ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }} 
              />
              {fieldErrors.effective_from && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.effective_from}</span>}
            </div>

            {/* Effective To */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Effective To</label>
              <input 
                type="date" 
                name="effective_to" 
                value={form.effective_to} 
                onChange={handleChange} 
                style={{
                  width:'75%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.effective_to ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }} 
              />
              {fieldErrors.effective_to && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.effective_to}</span>}
            </div>
          </div>
        </form>

        {/* Taxes Included Section */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#222', margin: 0 }}>
              Taxes Included ({form.included_taxes.length})
            </h3>
            <button
              onClick={handleOpenTaxModal}
              style={{
                background: '#4caf50',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>➕</span> Add Tax
            </button>
          </div>
          
          {fieldErrors.included_taxes && (
            <div style={{ color: 'red', fontSize: '0.98rem', marginBottom: '16px' }}>
              {fieldErrors.included_taxes}
            </div>
          )}

          <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Sequence</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Tax Code</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Tax Name</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Rate (%)</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Calculation Method</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {form.included_taxes.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ border: '1px solid #ddd', padding: '20px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
                      No taxes added to this structure. Click "Add Tax" to include taxes.
                    </td>
                  </tr>
                ) : (
                  form.included_taxes.map((tax, index) => (
                    <tr key={index} style={{ background: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                      <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{tax.sequence}</td>
                      <td style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold', color: '#1976d2' }}>{tax.tax_code}</td>
                      <td style={{ border: '1px solid #ddd', padding: '12px' }}>{getTaxName(tax.tax_code)}</td>
                      <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#2e7d32' }}>{getTaxPercentage(tax.tax_code)}%</td>
                      <td style={{ border: '1px solid #ddd', padding: '12px' }}>{tax.calculation_method}</td>
                      <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleEditTax(index)}
                          style={{
                            background: '#1976d2',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginRight: '4px',
                            fontSize: '0.8rem'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemoveTax(index)}
                          style={{
                            background: '#f44336',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Records Table */}
        <div style={{flex:1,display:'flex',flexDirection:'column',minHeight:0}}>
          <div style={{fontWeight:'bold',fontSize:'1.5rem',color:'#222',marginBottom:'16px'}}>
            Tax Structures ({records ? records.length : 0})
          </div>
          <div style={{flex:1,overflowY:'auto',overflowX:'auto',border:'1px solid #ddd',borderRadius:'8px'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.9rem',minWidth:'1000px'}}>
              <thead>
                <tr style={{background:'#f5f5f5',position:'sticky',top:0,zIndex:1}}>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'60px'}}>S.No</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'120px'}}>Structure Code</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'200px'}}>Structure Name</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center',fontWeight:'bold',background:'#f5f5f5',minWidth:'100px'}}>Taxes Count</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'250px'}}>Included Taxes</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center',fontWeight:'bold',background:'#f5f5f5',minWidth:'100px'}}>Status</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center',fontWeight:'bold',background:'#f5f5f5',minWidth:'120px'}}>Effective From</th>
                </tr>
              </thead>
              <tbody>
                {records && records.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{border:'1px solid #ddd',padding:'20px',textAlign:'center',color:'#888',fontStyle:'italic',background:'#fff'}}>No tax structures found</td>
                  </tr>
                ) : (
                  records && records.map((record, index) => (
                    <tr 
                      key={index} 
                      style={{
                        background: index % 2 === 0 ? '#fff' : '#f9f9f9',
                        cursor: 'pointer',
                        transition:'background-color 0.2s'
                      }}
                      onMouseOver={e=>e.currentTarget.style.background='#e3f2fd'} 
                      onMouseOut={e=>e.currentTarget.style.background=index % 2 === 0 ? '#fff' : '#f9f9f9'}
                      onClick={() => setSelectedRecordIdx(index)}
                    >
                      <td style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center'}}>{index + 1}</td>
                      <td style={{border:'1px solid #ddd',padding:'12px 8px',fontWeight:'bold',color:'#1976d2'}}>{record.tax_structure_code}</td>
                      <td style={{border:'1px solid #ddd',padding:'12px 8px'}}>{record.tax_structure_name}</td>
                      <td style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center',fontWeight:'bold',color:'#2e7d32'}}>{record.included_taxes.length}</td>
                      <td style={{border:'1px solid #ddd',padding:'12px 8px',fontSize:'0.85rem'}}>
                        {record.included_taxes.slice(0, 3).map(tax => 
                          `${tax.tax_code}(${tax.sequence})`
                        ).join(', ')}
                        {record.included_taxes.length > 3 && ` +${record.included_taxes.length - 3} more`}
                      </td>
                      <td style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center'}}>
                        <span style={{
                          padding:'4px 8px',
                          borderRadius:'4px',
                          fontSize:'0.8rem',
                          fontWeight:'bold',
                          color: record.is_active ? '#2e7d32' : '#f57c00',
                          background: record.is_active ? '#e8f5e9' : '#fff3e0',
                          whiteSpace:'nowrap'
                        }}>
                          {record.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center',color:'#666'}}>
                        {record.effective_from ? new Date(record.effective_from).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxStructure;