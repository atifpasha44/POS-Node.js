import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';

// Standard currency symbols dropdown options
const CURRENCY_SYMBOLS = [
  { value: '$', label: '$ - US Dollar' },
  { value: '€', label: '€ - Euro' },
  { value: '£', label: '£ - British Pound' },
  { value: '¥', label: '¥ - Japanese Yen' },
  { value: '₹', label: '₹ - Indian Rupee' },
  { value: '₽', label: '₽ - Russian Ruble' },
  { value: '¢', label: '¢ - Cent' },
  { value: 'C$', label: 'C$ - Canadian Dollar' },
  { value: 'A$', label: 'A$ - Australian Dollar' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: '₩', label: '₩ - South Korean Won' },
  { value: '₨', label: '₨ - Pakistani Rupee' },
  { value: 'R$', label: 'R$ - Brazilian Real' },
  { value: 'MX$', label: 'MX$ - Mexican Peso' },
  { value: 'S$', label: 'S$ - Singapore Dollar' },
  { value: 'HK$', label: 'HK$ - Hong Kong Dollar' },
  { value: 'NZ$', label: 'NZ$ - New Zealand Dollar' },
  { value: '₪', label: '₪ - Israeli Shekel' },
  { value: '₦', label: '₦ - Nigerian Naira' },
  { value: '₡', label: '₡ - Costa Rican Colón' },
  { value: '₵', label: '₵ - Ghanaian Cedi' }
];

const initialState = {
  applicable_from: '', property_code: '', property_name: '', nick_name: '', owner_name: '', address_name: '', gst_number: '', pan_number: '',
  group_name: '', local_currency: '', currency_format: '', symbol: '', decimal: '', date_format: '', round_off: '', property_logo: null
};

export default function PropertyCode({ setParentDirty, records, setRecords }) {
  const [isDirty, setIsDirty] = useState(false);
  const [form, setForm] = useState(initialState);
  const [logoPreview, setLogoPreview] = useState(null);
  const [action, setAction] = useState('Add');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedRecordIdx, setSelectedRecordIdx] = useState(null);
  const [showNoChangePopup, setShowNoChangePopup] = useState(false);
  const [selectModalMessage, setSelectModalMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [uploadStatus, setUploadStatus] = useState('');
  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  // Reset message when modal closes
  useEffect(() => {
    if (!showSelectModal) setSelectModalMessage('');
  }, [showSelectModal]);

  // Handlers
  // Helper: should fields be disabled (Delete mode, record selected)
  const isDeleteLocked = action === 'Delete' && selectedRecordIdx !== null;
  const isSearchLocked = action === 'Search' && selectedRecordIdx !== null;
  // Property Code lock: after save, always locked except in Add mode
  // All fields read-only in Search mode
  const isFormReadOnly = action === 'Search' && selectedRecordIdx !== null;
  // Property Code should be locked in Edit mode (after selecting a record) or in Search mode
  const isPropertyCodeLocked = (action === 'Edit' && selectedRecordIdx !== null) || isFormReadOnly;
  // 'Applicable From' should be read-only in Edit mode with a selected record or in Search mode
  const isApplicableFromReadOnly = (action === 'Edit' && selectedRecordIdx !== null) || isFormReadOnly;
  const handleChange = e => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setForm(f => ({ ...f, property_logo: files[0] }));
      setLogoPreview(files[0] ? URL.createObjectURL(files[0]) : null);
      setIsDirty(true);
      if (setParentDirty) setParentDirty(true);
      setUploadStatus('');
    } else {
      // Prevent Property Code modification in Edit or Search mode
      if (name === 'property_code' && isPropertyCodeLocked) {
        setFieldErrors(errors => ({...errors, property_code: 'Property Code cannot be modified after selecting a record.'}));
        return;
      }
      // Prevent Applicable From modification in Edit or Search mode
      if (name === 'applicable_from' && isApplicableFromReadOnly) {
        setFieldErrors(errors => ({...errors, applicable_from: 'Applicable From cannot be modified after selecting a record.'}));
        return;
      }
      // Date validation for Applicable From in Add mode
      if (name === 'applicable_from' && action === 'Add' && value) {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
        
        if (selectedDate < today) {
          setFieldErrors(errors => ({...errors, applicable_from: 'Cannot select a past date. Please select today or a future date.'}));
          return;
        } else {
          setFieldErrors(errors => ({...errors, applicable_from: ''}));
        }
      }
      // Prevent any editing in Search mode
      if (isFormReadOnly) return;
      setForm(f => ({ ...f, [name]: value }));
      setIsDirty(true);
      if (setParentDirty) setParentDirty(true);
      setFieldErrors(errors => ({...errors, [name]: ''}));
    }
  };
  // Only clear the form and selection, never touch records array
  const handleClear = () => {
    setForm(initialState);
    setLogoPreview(null);
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
    setSelectedRecordIdx(null); // Unlock Delete state if in Delete mode
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFieldErrors({});
    setUploadStatus('');
    // Do not reset action to 'Add' if in the middle of Edit/Delete/Search, just clear selection
  };
  const handleSave = async () => {
    // Clear upload message after save
    setUploadStatus('');
    // Validate required fields
    const requiredFields = [
      { key: 'applicable_from', label: 'Applicable From' },
      { key: 'property_code', label: 'Property Code' },
      { key: 'property_name', label: 'Property Name' },
      { key: 'nick_name', label: 'Nickname' },
      { key: 'owner_name', label: 'Owner Name' },
      { key: 'address_name', label: 'Address' },
      { key: 'group_name', label: 'Group Name' },
      { key: 'date_format', label: 'Date Format' }
    ];
    let errors = {};
    requiredFields.forEach(f => {
      if (!form[f.key] || (typeof form[f.key] === 'string' && form[f.key].trim() === '')) {
        errors[f.key] = 'This field is required.';
      }
    });
    
    // Additional date validation for Add mode
    if (action === 'Add' && form.applicable_from) {
      const selectedDate = new Date(form.applicable_from);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.applicable_from = 'Cannot select a past date. Please select today or a future date.';
      }
    }
    
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      if (action === 'Edit' && selectedRecordIdx !== null) {
        // Check if any data has changed
        const original = records[selectedRecordIdx];
        const changed = Object.keys(form).some(key => form[key] !== original[key]);
        if (!changed) {
          setShowNoChangePopup(true);
          setTimeout(() => setShowNoChangePopup(false), 1800);
          setForm(initialState);
          setLogoPreview(null);
          setSelectedRecordIdx(null);
          setIsDirty(false);
          if (setParentDirty) setParentDirty(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
        
        // Update existing record via API
        const response = await axios.put(`/api/property-codes/${original.id}`, form);
        if (response.data.success) {
          setShowSavePopup(true);
          setTimeout(() => setShowSavePopup(false), 1800);
          // Refresh data from backend
          await fetchRecords();
          resetForm();
        }
      } else if (action === 'Delete' && selectedRecordIdx !== null) {
        // Delete record via API
        const original = records[selectedRecordIdx];
        const response = await axios.delete(`/api/property-codes/${original.id}`);
        if (response.data.success) {
          setShowSavePopup(true);
          setTimeout(() => setShowSavePopup(false), 1800);
          // Refresh data from backend
          await fetchRecords();
          resetForm();
          setAction('Add');
        }
      } else {
        // Add new record via API
        console.log('Adding new record:', form);
        const response = await axios.post('/api/property-codes', form);
        console.log('Add response:', response.data);
        if (response.data.success) {
          setShowSavePopup(true);
          setTimeout(() => setShowSavePopup(false), 1800);
          // Refresh data from backend
          await fetchRecords();
          resetForm();
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      if (error.response && error.response.data && error.response.data.message) {
        console.log('Error response:', error.response.data);
        if (error.response.data.message.includes('unique') || error.response.data.message.includes('exists')) {
          setFieldErrors(errors => ({...errors, property_code: error.response.data.message}));
        } else {
          alert('Error: ' + error.response.data.message);
        }
      } else {
        alert('Error saving data. Please try again.');
      }
    }
  };

  // Helper function to reset form
  const resetForm = () => {
    setForm(initialState);
    setLogoPreview(null);
    setSelectedRecordIdx(null);
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFieldErrors({});
    setUploadStatus('');
    setAction('Add'); // Reset to Add mode after save
  };

  // Function to fetch records from backend
  const fetchRecords = async () => {
    try {
      console.log('Fetching records from backend...');
      const response = await axios.get('/api/property-codes');
      console.log('Fetched records:', response.data);
      if (setRecords) {
        // Custom sorting: Current Date → Future Dates → Past Dates
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time for accurate date comparison
        
        const sortedRecords = response.data.sort((a, b) => {
          // More robust date parsing
          let dateA = new Date(a.applicable_from);
          let dateB = new Date(b.applicable_from);
          
          // Validate dates
          if (isNaN(dateA.getTime())) {
            console.error('Invalid date A:', a.applicable_from);
            dateA = new Date();
          }
          if (isNaN(dateB.getTime())) {
            console.error('Invalid date B:', b.applicable_from);
            dateB = new Date();
          }
          
          dateA.setHours(0, 0, 0, 0);
          dateB.setHours(0, 0, 0, 0);
          
          // Categorize dates
          const isCurrentA = dateA.getTime() === today.getTime();
          const isCurrentB = dateB.getTime() === today.getTime();
          const isFutureA = dateA > today;
          const isFutureB = dateB > today;
          const isPastA = dateA < today;
          const isPastB = dateB < today;
          
          // Priority order: Current (0) → Future (1) → Past (2)
          const getPriority = (isCurrent, isFuture, isPast) => {
            if (isCurrent) return 0;
            if (isFuture) return 1;
            if (isPast) return 2;
            return 3;
          };
          
          const priorityA = getPriority(isCurrentA, isFutureA, isPastA);
          const priorityB = getPriority(isCurrentB, isFutureB, isPastB);
          
          // If different priorities, sort by priority
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }
          
          // If same priority, sort within category
          if (priorityA === 0) {
            // Current dates: no sub-sorting needed (should be unique)
            return 0;
          } else if (priorityA === 1) {
            // Future dates: nearest future first
            return dateA - dateB;
          } else {
            // Past dates: most recent past first
            return dateB - dateA;
          }
        });
        
        setRecords(sortedRecords);
        console.log('Records sorted by Current→Future→Past, count:', sortedRecords.length);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };
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
  const handleSearch = () => { 
    setAction('Search');
    setShowSelectModal(true); 
  };
  const handleAdd = () => {
    setAction('Add');
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    setForm(f => ({ ...initialState, applicable_from: todayStr }));
    setLogoPreview(null);
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
    setSelectedRecordIdx(null);
  };
  const handleEdit = async () => {
    setAction('Edit');
    setSelectedRecordIdx(null);
    
    // Fetch fresh data and apply sorting
    try {
      console.log('Fetching fresh records for edit modal...');
      const response = await axios.get('/api/property-codes');
      const freshData = response.data;
      
      console.log('Fresh data received:', freshData);
      
      // Apply sorting logic
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      console.log('Today (for comparison):', today.toISOString());
      
      // First find the latest date across all records
      const latestDate = freshData.reduce((latest, record) => {
        const recordDate = new Date(record.applicable_from);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate > latest ? recordDate : latest;
      }, new Date('1900-01-01'));
      
      console.log('Latest date in dataset:', latestDate.toISOString());
      
      const sortedRecords = freshData.sort((a, b) => {
        let dateA = new Date(a.applicable_from);
        let dateB = new Date(b.applicable_from);
        
        dateA.setHours(0, 0, 0, 0);
        dateB.setHours(0, 0, 0, 0);
        
        // Check if records are the latest record
        const isLatestA = dateA.getTime() === latestDate.getTime();
        const isLatestB = dateB.getTime() === latestDate.getTime();
        const isFutureA = dateA > today;
        const isFutureB = dateB > today;
        const isPastA = dateA < today;
        const isPastB = dateB < today;
        
        console.log(`${a.applicable_from}: Latest=${isLatestA}, Future=${isFutureA}, Past=${isPastA}`);
        
        // Priority order: Latest (0) → Future (1) → Past (2)
        const getPriority = (isLatest, isFuture, isPast) => {
          if (isLatest) return 0;  // Latest record always first
          if (isFuture) return 1;  // Future dates second
          if (isPast) return 2;    // Past dates last
          return 3;
        };
        
        const priorityA = getPriority(isLatestA, isFutureA, isPastA);
        const priorityB = getPriority(isLatestB, isFutureB, isPastB);
        
        // If different priorities, sort by priority
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        // If same priority, sort within category
        if (priorityA === 0) {
          return 0; // Latest dates (should be unique)
        } else if (priorityA === 1) {
          return dateA - dateB; // Future dates: nearest future first
        } else {
          return dateB - dateA; // Past dates: most recent past first
        }
      });
      
      console.log('Sorted records:', sortedRecords);
      setRecords(sortedRecords);
    } catch (error) {
      console.error('Error fetching records for edit:', error);
    }
    
    setShowSelectModal(true);
  };
  // Prevent deletion of Property Code records after save
  const handleDelete = () => {
    // Show error and do not allow delete
    alert('Property Code records cannot be deleted after saving. This is a unique identifier linked to related data.');
    return;
  };



  // When a record is selected from modal
  const handleSelectRecord = idx => {
    const selectedRecord = records[idx];
    
    // Format the applicable_from date to YYYY-MM-DD for date input
    // Using timezone-safe formatting to avoid date shifting issues
    let formattedDate = selectedRecord.applicable_from;
    if (selectedRecord.applicable_from) {
      const date = new Date(selectedRecord.applicable_from);
      // Use local date components to avoid timezone shifts
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      formattedDate = `${year}-${month}-${day}`;
      
      console.log(`Original date: ${selectedRecord.applicable_from}, Formatted for form: ${formattedDate}`);
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
    setFieldErrors({});
    setUploadStatus('');
    // For Delete, just show the data for review, require Save to confirm deletion
    // Do NOT delete here, only on Save
  };

  // --- Backend API integration ---
  // Fetch all property codes on mount
  useEffect(() => {
    fetchRecords();
  }, []); // Only run once when component mounts

  // Ensure we have fresh data when setRecords function changes
  useEffect(() => {
    if (setRecords && records.length === 0) {
      fetchRecords();
    }
  }, [setRecords]);


  // Export handlers
  const handleExport = async (type) => {
    // Prepare data for export (all records)
    const exportData = records.length ? records : [form];
    
    if (type === 'Excel') {
      try {
        // Create a new workbook using ExcelJS
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Property Setup Data');
        
        // Add report title
        const titleRow = worksheet.addRow(['Property Setup Export Report']);
        worksheet.mergeCells('A1:O1'); // Merge across all columns
        
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
          'Property Name',
          'Nick Name',
          'Owner Name',
          'Address Name',
          'GST Number',
          'PAN Number',
          'Group Name',
          'Local Currency',
          'Currency Format',
          'Symbol',
          'Decimal',
          'Date Format',
          'Round Off'
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
            fgColor: { argb: 'FF366092' }
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
            record.property_code || '',
            record.property_name || '',
            record.nick_name || '',
            record.owner_name || '',
            record.address_name || '',
            record.gst_number || '',
            record.pan_number || '',
            record.group_name || '',
            record.local_currency || '',
            record.currency_format || '',
            record.symbol || '',
            record.decimal || '',
            record.date_format || '',
            record.round_off || ''
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
        
        const filename = `Property_Setup_Export_${year}${month}${day}_${hours}${minutes}${seconds}.xlsx`;
        
        // Generate buffer and save file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        saveAs(blob, filename);
        
        console.log('✅ Property Setup Excel file exported successfully:', filename);
        alert(`✅ Formatted Property Setup Excel Report exported successfully!\n\nFilename: ${filename}\n\nFeatures included:\n• Report heading at top\n• Professional blue headers\n• Alternating row colors\n• Complete table formatting\n• Auto-sized columns`);
        
      } catch (error) {
        console.error('Property Setup Excel export error:', error);
        alert('❌ Error exporting Property Setup to Excel. Please try again.\n\nError: ' + error.message);
      }
      
    } else if (type === 'PDF') {
      const doc = new jsPDF();
      const columns = [
        'Applicable From', 'Property Code', 'Property Name', 'Nick Name', 'Owner Name', 'Address Name', 'GST Number', 'PAN Number',
        'Group Name', 'Local Currency', 'Currency Format', 'Symbol', 'Decimal', 'Date Format', 'Round Off'
      ];
      const rows = exportData.map(rec => [
        rec.applicable_from, rec.property_code, rec.property_name, rec.nick_name, rec.owner_name, rec.address_name, rec.gst_number, rec.pan_number,
        rec.group_name, rec.local_currency, rec.currency_format, rec.symbol, rec.decimal, rec.date_format, rec.round_off
      ]);
      autoTable(doc, { head: [columns], body: rows });
      doc.save('PropertyCodes.pdf');
    }
  };

  return (
  <div className="propertycode-panel" style={{background:'#fff',border:'2.5px solid #222',borderRadius:'16px',boxShadow:'0 2px 12px rgba(0,0,0,0.10)',width:'100%',maxWidth:'1200px',margin:'32px auto',padding:'0 0 18px 0',height:'calc(100vh - 120px)',display:'flex',flexDirection:'column',overflowY:'auto',position:'relative'}}>
      {/* Top Control Bar - now sticky */}
  <div style={{
    display:'flex',alignItems:'center',justifyContent:'space-between',
    borderBottom:'2px solid #e0e0e0',padding:'12px 18px 8px 18px',minWidth:0,
    position:'sticky',top:0,zIndex:10,background:'#fff',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'
  }}>
  <div style={{display:'flex',alignItems:'center',gap:'8px',minWidth:0,flexWrap:'wrap'}}>
          <span style={{fontWeight:'bold',fontSize:'2rem',color:'#222',marginRight:'18px'}}>
            Property Code
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
                setSelectModalMessage('Search for Property Code and click "View" to see full details in read-only mode.');
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
          <button onClick={handleDelete} title="Delete" style={{background:'#ffebee',border:'2px solid #e53935',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#e53935',marginRight:'4px',cursor:'not-allowed',transition:'0.2s',opacity:0.5}} disabled={true}><span role="img" aria-label="Delete">🗑️</span></button>
          <button onClick={handleSearch} title="Search" style={{background:'#fffde7',border:'2px solid #fbc02d',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#fbc02d',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#fff9c4'} onMouseOut={e=>e.currentTarget.style.background='#fffde7'} disabled={isDeleteLocked}><span role="img" aria-label="Search">🔍</span></button>
          <button
            type="button"
            onClick={handleClear}
            title="Clear"
            style={{background:'#f3e5f5',border:'2px solid #8e24aa',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#8e24aa',marginRight:'4px',cursor:'pointer',transition:'0.2s'}}
            onMouseOver={e=>e.currentTarget.style.background='#e1bee7'}
            onMouseOut={e=>e.currentTarget.style.background='#f3e5f5'}
            // Always allow Clear button to work, even in Delete mode
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
            onClick={()=>!isDeleteLocked && handleExport('Excel')}
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
            onClick={()=>!isDeleteLocked && handleExport('PDF')}
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
      
      
      {/* Form Section - two columns, bold labels */}
  <form ref={formRef} className="propertycode-form" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 32px',padding:'32px 32px 0 32px'}}>
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
        <div style={{background:'#fff',borderRadius:'14px',padding:'32px 24px',minWidth:'720px',boxShadow:'0 4px 24px rgba(0,0,0,0.18)',maxHeight:'80vh',overflowY:'auto'}}>
          <div style={{fontWeight:'bold',fontSize:'1.2rem',marginBottom:'18px',color:'#1976d2'}}>
            {action === 'Search' ? 'All Property Code Records - Select to View Details' : (selectModalMessage || 'Select a record to edit/delete')}
            <div style={{fontSize:'0.8rem',color:'#666',marginTop:'4px'}}>
              Current Date: {new Date().toLocaleDateString('en-GB')} | Records sorted: Current → Future → Past
            </div>
          </div>
          {action === 'Search' && (
            <div style={{padding:'12px',background:'#e8f5e9',borderRadius:'8px',marginBottom:'16px',fontSize:'0.95rem',color:'#2e7d32'}}>
              📖 <strong>Search Mode:</strong> View all historical and future configurations for this Property Code. 
              Selected records will be displayed in read-only mode to prevent accidental changes.
            </div>
          )}
          {records.length === 0 ? (
            <div style={{color:'#888',fontSize:'1.05rem'}}>No records found.</div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse',marginBottom:'12px'}}>
              <thead>
                <tr style={{background:'#e3e3e3'}}>
                  <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Applicable From</th>
                  <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Property Code</th>
                  <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Property Name</th>
                  <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Owner</th>
                  <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>
                    {action === 'Search' ? 'Status' : 'Action'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // First pass: Find the latest date in all records
                  const latestDate = records.reduce((latest, record) => {
                    const recordDate = new Date(record.applicable_from);
                    recordDate.setHours(0, 0, 0, 0);
                    return recordDate > latest ? recordDate : latest;
                  }, new Date('1900-01-01'));
                  
                  return records.map((rec, idx) => {
                    const formattedDate = rec.applicable_from ? 
                      new Date(rec.applicable_from).toLocaleDateString('en-GB', { 
                        day: '2-digit', month: '2-digit', year: 'numeric' 
                      }) : rec.applicable_from;
                    
                    // Enhanced date categorization
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    // Parse the date
                    let recDate;
                    if (rec.applicable_from) {
                      recDate = new Date(rec.applicable_from);
                      recDate.setHours(0, 0, 0, 0);
                    } else {
                      recDate = new Date();
                    }
                    
                    const isCurrent = recDate.getTime() === today.getTime();
                    const isFuture = recDate > today;
                    const isPast = recDate < today;
                    const isLatestRecord = recDate.getTime() === latestDate.getTime();
                    
                    // Determine if this record should have a Select button
                    const showSelectButton = isLatestRecord || isFuture;
                    
                    console.log(`Record ${idx}: ${rec.applicable_from} -> Latest: ${isLatestRecord}, Future: ${isFuture}, ShowSelect: ${showSelectButton}`);
                  
                    // Determine row styling based on date category and selectability
                    const getRowStyle = () => {
                      let baseStyle = { padding: '6px 8px' };
                      if (isPast && !isLatestRecord) {
                        // Non-latest past records are grayed out
                        return { 
                          ...baseStyle, 
                          background: idx % 2 ? '#f0f0f0' : '#f8f8f8', 
                          color: '#888', 
                          opacity: 0.7 
                        };
                      }
                      return { ...baseStyle, background: idx % 2 ? '#f7f7f7' : '#fff' };
                    };
                    
                    const rowCellStyle = getRowStyle();
                    
                    return (
                      <tr key={idx} style={{ background: rowCellStyle.background, opacity: rowCellStyle.opacity || 1 }}>
                        <td style={rowCellStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {formattedDate}
                            {isCurrent && (
                              <span style={{
                                background: '#4caf50',
                                color: '#fff',
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                fontWeight: 'bold'
                              }}>
                                TODAY
                              </span>
                            )}
                            {isFuture && (
                              <span style={{
                                background: '#2196f3',
                                color: '#fff',
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                fontWeight: 'bold'
                              }}>
                                FUTURE
                              </span>
                            )}
                            {isLatestRecord && isPast && (
                              <span style={{
                                background: '#ff9800',
                                color: '#fff',
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                fontWeight: 'bold'
                              }}>
                                LATEST
                              </span>
                            )}
                            {isPast && !isLatestRecord && (
                              <span style={{
                                background: '#757575',
                                color: '#fff',
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                fontWeight: 'bold'
                              }}>
                                PAST
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={rowCellStyle}>{rec.property_code}</td>
                        <td style={rowCellStyle}>{rec.property_name}</td>
                        <td style={rowCellStyle}>{rec.owner_name}</td>
                        <td style={{...rowCellStyle, display:'flex', alignItems:'center', gap:'6px'}}>
                          {action === 'Search' ? (
                            <>
                              <span style={{
                                padding:'2px 6px',
                                borderRadius:'3px',
                                fontSize:'0.8rem',
                                fontWeight:'bold',
                                color: isLatestRecord ? '#ff9800' : isCurrent ? '#2e7d32' : isFuture ? '#1976d2' : '#757575',
                                background: isLatestRecord ? '#fff3e0' : isCurrent ? '#e8f5e9' : isFuture ? '#e3f2fd' : '#f5f5f5'
                              }}>
                                {isLatestRecord && isPast ? 'Latest' : isCurrent ? 'Current' : isFuture ? 'Future' : 'Past'}
                              </span>
                              <button type="button" style={{background:'#7b1fa2',color:'#fff',border:'none',borderRadius:'6px',padding:'4px 12px',fontWeight:'bold',cursor:'pointer'}} onClick={()=>handleSelectRecord(idx)}>View</button>
                            </>
                          ) : (
                            // Show Select button for latest record OR future records
                            showSelectButton ? (
                              <button 
                                type="button" 
                                style={{
                                  background: isLatestRecord && isPast ? '#ff9800' : isCurrent ? '#4caf50' : '#2196f3',
                                  color:'#fff',
                                  border:'none',
                                  borderRadius:'6px',
                                  padding:'4px 12px',
                                  fontWeight:'bold',
                                  cursor:'pointer'
                                }} 
                                onClick={()=>handleSelectRecord(idx)}
                              >
                                Select
                              </button>
                            ) : (
                              <span style={{
                                padding:'2px 6px',
                                borderRadius:'3px',
                                fontSize:'0.8rem',
                                fontWeight:'bold',
                                color: '#999',
                                background: '#f0f0f0',
                                fontStyle: 'italic',
                                cursor: 'not-allowed'
                              }}>
                                Read Only
                              </span>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          )}
          <button type="button" style={{background:'#e53935',color:'#fff',border:'none',borderRadius:'6px',padding:'8px 22px',fontWeight:'bold',fontSize:'1.08rem',marginTop:'8px',cursor:'pointer'}} onClick={()=>setShowSelectModal(false)}>Close</button>
        </div>
      </div>
    )}
        {/* Left column */}
        <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Applicable From</label>
            <input 
              type="date" 
              name="applicable_from" 
              value={form.applicable_from} 
              onChange={handleChange} 
              min={action === 'Add' ? (() => {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              })() : undefined}
              style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isApplicableFromReadOnly?'#eee':'#fff'}} 
              disabled={isApplicableFromReadOnly} 
            />
            {fieldErrors.applicable_from && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.applicable_from}</span>}
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Property Code</label>
            <input type="text" name="property_code" value={form.property_code} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isPropertyCodeLocked?'#eee':'#fff'}} disabled={isPropertyCodeLocked} />
            {fieldErrors.property_code && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.property_code}</span>}
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Property Name</label>
            <input type="text" name="property_name" value={form.property_name} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly} />
            {fieldErrors.property_name && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.property_name}</span>}
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Nick Name</label>
            <input type="text" name="nick_name" value={form.nick_name} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly} />
            {fieldErrors.nick_name && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.nick_name}</span>}
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Owner Name</label>
            <input type="text" name="owner_name" value={form.owner_name} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly} />
            {fieldErrors.owner_name && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.owner_name}</span>}
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Address Name</label>
            <input type="text" name="address_name" value={form.address_name} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly} />
            {fieldErrors.address_name && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.address_name}</span>}
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>GST Number</label>
            <input type="text" name="gst_number" value={form.gst_number} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>PAN Number</label>
            <input type="text" name="pan_number" value={form.pan_number} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly} />
          </div>
        </div>
        {/* Right column */}
        <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Group Name</label>
            <input type="text" name="group_name" value={form.group_name} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly} />
            {fieldErrors.group_name && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.group_name}</span>}
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Local Currency</label>
            <input type="text" name="local_currency" value={form.local_currency} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Currency Format</label>
            <input type="text" name="currency_format" value={form.currency_format} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Symbol</label>
            <select 
              name="symbol" 
              value={form.symbol} 
              onChange={handleChange} 
              style={{
                width:'80%',
                height:'36px',
                fontSize:'1.08rem',
                border:'2px solid #bbb',
                borderRadius:'6px',
                padding:'0 8px',
                background: isFormReadOnly?'#eee':'#fff',
                cursor: isFormReadOnly ? 'not-allowed' : 'pointer'
              }} 
              disabled={isFormReadOnly}
            >
              <option value="">Select Currency Symbol</option>
              {CURRENCY_SYMBOLS.map((currency, index) => (
                <option key={index} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Decimal</label>
            <input type="number" name="decimal" value={form.decimal} onChange={handleChange} min="0" max="4" style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Date Format</label>
            <input type="text" name="date_format" value={form.date_format} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly} />
            {fieldErrors.date_format && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.date_format}</span>}
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Round Off</label>
            <input type="text" name="round_off" value={form.round_off} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Property Logo</label>
            <input ref={fileInputRef} type="file" name="property_logo" onChange={handleChange} style={{marginRight:'8px',width:'80%'}} disabled={isFormReadOnly} />
            <button type="button" style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:'6px',padding:'8px 18px',marginLeft:'8px',fontWeight:'bold',fontSize:'1.08rem',cursor:'pointer'}} disabled={isFormReadOnly}
              onClick={() => {
                if (isFormReadOnly) return;
                if (!form.property_logo) {
                  setUploadStatus('Please select a file before uploading.');
                  return;
                }
                // Simulate upload
                setTimeout(() => {
                  if (form.property_logo) {
                    setUploadStatus('File uploaded successfully.');
                  } else {
                    setUploadStatus('Upload failed. Please try again.');
                  }
                }, 800);
              }}
            >UPLOAD</button>
            {logoPreview && <img src={logoPreview} alt="Logo Preview" style={{height:'38px',marginLeft:'12px',borderRadius:'6px'}} />}
            {uploadStatus && <span style={{marginLeft:'12px',color:uploadStatus.includes('success')?'green':'red',fontWeight:'bold'}}>{uploadStatus}</span>}
          </div>
        </div>
      </form>
    </div>
  );
}
