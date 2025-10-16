import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const initialState = {
  card_code: '',
  card_name: '',
  card_type: 'Credit',
  bank_issuer: '',
  is_active: true,
  transaction_fee: '',
  transaction_charges: '',
  effective_from: '',
  effective_to: ''
};

const CreditCardManager = ({ setParentDirty, records, setRecords }) => {
  const [isDirty, setIsDirty] = useState(false);
  const [form, setForm] = useState(initialState);
  const [action, setAction] = useState('Add');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedRecordIdx, setSelectedRecordIdx] = useState(null);
  const [selectModalMessage, setSelectModalMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [lastAction, setLastAction] = useState('Add');
  const formRef = useRef(null);

  // Card types
  const cardTypes = [
    'Credit',
    'Debit', 
    'Prepaid',
    'Gift Card',
    'Corporate',
    'Business'
  ];

  // Validation function
  const validateForm = () => {
    const errors = {};
    
    if (!form.card_code.trim()) {
      errors.card_code = 'Card Code is required';
    } else if (form.card_code.length > 10) {
      errors.card_code = 'Card Code must not exceed 10 characters';
    } else {
      // Check for duplicate card codes (case insensitive)
      const isDuplicate = records && records.some((record, index) => {
        if (index === selectedRecordIdx) return false; // Skip current record during edit
        return record.card_code.toLowerCase() === form.card_code.toLowerCase();
      });
      if (isDuplicate) {
        errors.card_code = 'Card Code already exists';
      }
    }
    
    if (!form.card_name.trim()) {
      errors.card_name = 'Card Name is required';
    } else if (form.card_name.length > 50) {
      errors.card_name = 'Card Name must not exceed 50 characters';
    }
    
    if (!form.card_type.trim()) {
      errors.card_type = 'Card Type is required';
    }
    
    if (!form.bank_issuer.trim()) {
      errors.bank_issuer = 'Bank/Issuer is required';
    } else if (form.bank_issuer.length > 100) {
      errors.bank_issuer = 'Bank/Issuer name must not exceed 100 characters';
    }
    
    // Validate transaction fee if provided
    if (form.transaction_fee && isNaN(parseFloat(form.transaction_fee))) {
      errors.transaction_fee = 'Transaction Fee must be a valid number';
    } else if (form.transaction_fee && parseFloat(form.transaction_fee) < 0) {
      errors.transaction_fee = 'Transaction Fee cannot be negative';
    }
    
    // Validate transaction charges if provided
    if (form.transaction_charges && isNaN(parseFloat(form.transaction_charges))) {
      errors.transaction_charges = 'Transaction Charges must be a valid number';
    } else if (form.transaction_charges && parseFloat(form.transaction_charges) < 0) {
      errors.transaction_charges = 'Transaction Charges cannot be negative';
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

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let newValue = value;
    
    // Handle special formatting
    if (name === 'card_code') {
      newValue = value.toUpperCase().replace(/[^A-Z0-9]/g, ''); // Only alphanumeric, uppercase
    } else if (name === 'transaction_fee' || name === 'transaction_charges') {
      // Allow decimal numbers with up to 2 decimal places
      if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
        newValue = value;
      } else {
        return; // Don't update if invalid format
      }
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
      card_code: selectedRecord.card_code || '',
      card_name: selectedRecord.card_name || '',
      card_type: selectedRecord.card_type || 'Credit',
      bank_issuer: selectedRecord.bank_issuer || '',
      is_active: selectedRecord.is_active !== undefined ? selectedRecord.is_active : true,
      transaction_fee: selectedRecord.transaction_fee || '',
      transaction_charges: selectedRecord.transaction_charges || '',
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
    const confirmMessage = `Are you sure you want to delete "${selectedRecord.card_name}" (${selectedRecord.card_code})?`;
    
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
        console.error('Error deleting credit card:', error);
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
      card_code: selectedRecord.card_code || '',
      card_name: selectedRecord.card_name || '',
      card_type: selectedRecord.card_type || 'Credit',
      bank_issuer: selectedRecord.bank_issuer || '',
      is_active: selectedRecord.is_active !== undefined ? selectedRecord.is_active : true,
      transaction_fee: selectedRecord.transaction_fee || '',
      transaction_charges: selectedRecord.transaction_charges || '',
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
        card_code: form.card_code.trim(),
        card_name: form.card_name.trim(),
        card_type: form.card_type,
        bank_issuer: form.bank_issuer.trim(),
        is_active: form.is_active,
        transaction_fee: form.transaction_fee ? parseFloat(form.transaction_fee) : null,
        transaction_charges: form.transaction_charges ? parseFloat(form.transaction_charges) : null,
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

      // Sort by card code
      updatedRecords.sort((a, b) => a.card_code.localeCompare(b.card_code));
      
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
      console.error('Error saving credit card:', error);
    }
  };

  // Export handlers
  const exportToExcel = async () => {
    if (!records || records.length === 0) {
      alert('No data to export');
      return;
    }

    try {
      // Create a new workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Credit Card Management Report', {
        pageSetup: {
          orientation: 'landscape',
          fitToPage: true,
          paperSize: 9 // A4
        }
      });
      
      // Add report title - merge cells across all columns
      const titleRange = 'A1:J1';
      worksheet.mergeCells(titleRange);
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'Credit Card Management Export Report';
      titleCell.font = {
        name: 'Calibri',
        size: 16,
        bold: true,
        color: { argb: '366092' }
      };
      titleCell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };
      
      // Add generation date/time
      const dateRange = 'A2:J2';
      worksheet.mergeCells(dateRange);
      const dateCell = worksheet.getCell('A2');
      const now = new Date();
      const dateTimeString = now.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      dateCell.value = `Generated on: ${dateTimeString}`;
      dateCell.font = {
        name: 'Calibri',
        size: 10,
        italic: true
      };
      dateCell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };
      
      // Add empty row
      worksheet.getRow(3).height = 10;
      
      // Define headers
      const headers = [
        'ID',
        'Card Code', 
        'Card Name',
        'Card Type',
        'Bank/Issuer',
        'Status',
        'Transaction Fee',
        'Transaction Charges',
        'Effective From',
        'Effective To'
      ];
      
      // Add headers to row 4
      const headerRow = worksheet.getRow(4);
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = {
          name: 'Calibri',
          size: 11,
          bold: true,
          color: { argb: 'FFFFFF' }
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '366092' }
        };
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle'
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      
      headerRow.height = 25;
      
      // Add data rows
      records.forEach((record, index) => {
        const rowNumber = index + 5; // Starting from row 5
        const row = worksheet.getRow(rowNumber);
        
        const rowData = [
          record.id || index + 1,
          record.card_code || '',
          record.card_name || '',
          record.card_type || '',
          record.bank_issuer || '',
          record.is_active ? 'Active' : 'Inactive',
          record.transaction_fee || '',
          record.transaction_charges || '',
          record.effective_from || '',
          record.effective_to || ''
        ];
        
        rowData.forEach((cellValue, colIndex) => {
          const cell = row.getCell(colIndex + 1);
          cell.value = cellValue;
          cell.font = {
            name: 'Calibri',
            size: 10
          };
          cell.alignment = {
            horizontal: colIndex === 0 || colIndex === 4 || colIndex === 5 ? 'center' : 'left',
            vertical: 'middle'
          };
          
          // Add borders
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          
          // Alternating row colors
          if (index % 2 === 1) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'F8F9FA' }
            };
          }
        });
        
        row.height = 20;
      });
      
      // Auto-fit columns
      worksheet.columns.forEach((column, index) => {
        let maxWidth = headers[index].length;
        
        records.forEach((record) => {
          const rowData = [
            record.id || '',
            record.card_code || '',
            record.card_name || '',
            record.card_type || '',
            record.bank_issuer || '',
            record.is_active ? 'Active' : 'Inactive',
            record.transaction_fee || '',
            record.transaction_charges || '',
            record.effective_from || '',
            record.effective_to || ''
          ];
          
          const cellValue = String(rowData[index]);
          if (cellValue.length > maxWidth) {
            maxWidth = cellValue.length;
          }
        });
        
        // Set column width (minimum 10, maximum 50)
        column.width = Math.min(Math.max(maxWidth + 2, 10), 50);
      });
      
      // Add user footer information
      const footerRowNum = records.length + 6;
      const footerRange = `A${footerRowNum}:J${footerRowNum}`;
      worksheet.mergeCells(footerRange);
      const footerCell = worksheet.getCell(`A${footerRowNum}`);
      
      const currentUser = localStorage.getItem('currentUser') || 
                         sessionStorage.getItem('currentUser') || 
                         'System Administrator';
      
      footerCell.value = `Generated by: ${currentUser} | Total Records: ${records.length}`;
      footerCell.font = {
        name: 'Calibri',
        size: 9,
        italic: true,
        color: { argb: '666666' }
      };
      footerCell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };
      
      // Generate the file
      const buffer = await workbook.xlsx.writeBuffer();
      
      // Generate filename with timestamp
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      const filename = `Credit_Card_Management_Export_${year}${month}${day}_${hours}${minutes}${seconds}.xlsx`;
      
      // Save the file
      saveAs(new Blob([buffer]), filename);
      
      console.log('✅ Credit Card Management Excel file exported successfully:', filename);
      alert(`✅ Professional Credit Card Management Excel Report exported successfully!\n\nFilename: ${filename}\n\nFeatures included:\n• Professional report title and timestamp\n• Blue headers with white text\n• Alternating row colors for readability\n• Auto-fitted columns\n• Landscape orientation\n• User footer (Generated by: ${currentUser})\n• ${records.length} records exported`);
      
    } catch (error) {
      console.error('Credit Card Management Excel export error:', error);
      alert('❌ Error exporting Credit Card Management to Excel. Please try again.\n\nError: ' + error.message);
    }
  };

  const exportToPDF = async () => {
    if (!records || records.length === 0) {
      alert('No data to export');
      return;
    }

    try {
      // Create PDF in landscape mode
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add report title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Credit Card Management Export Report', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
      
      // Add generation date/time
      const now = new Date();
      const dateTimeString = now.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${dateTimeString}`, doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });
      
      // Define columns with proper headers
      const columns = [
        { header: 'ID', dataKey: 'id' },
        { header: 'Card Code', dataKey: 'card_code' },
        { header: 'Card Name', dataKey: 'card_name' },
        { header: 'Card Type', dataKey: 'card_type' },
        { header: 'Bank/Issuer', dataKey: 'bank_issuer' },
        { header: 'Status', dataKey: 'status' },
        { header: 'Transaction Fee', dataKey: 'transaction_fee' },
        { header: 'Transaction Charges', dataKey: 'transaction_charges' },
        { header: 'Effective From', dataKey: 'effective_from' },
        { header: 'Effective To', dataKey: 'effective_to' }
      ];
      
      // Prepare data rows
      const rows = records.map(rec => ({
        id: rec.id || '',
        card_code: rec.card_code || '',
        card_name: rec.card_name || '',
        card_type: rec.card_type || '',
        bank_issuer: rec.bank_issuer || '',
        status: rec.is_active ? 'Active' : 'Inactive',
        transaction_fee: rec.transaction_fee || '',
        transaction_charges: rec.transaction_charges || '',
        effective_from: rec.effective_from || '',
        effective_to: rec.effective_to || ''
      }));
      
      // Calculate available width for the table
      const pageWidth = doc.internal.pageSize.getWidth();
      const margins = { left: 10, right: 10 };
      
      // Create the table with professional styling and auto-fit columns
      autoTable(doc, {
        columns: columns,
        body: rows,
        startY: 35,
        theme: 'grid',
        styles: {
          fontSize: 7,
          cellPadding: 2,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          overflow: 'linebreak',
          halign: 'left'
        },
        headStyles: {
          fillColor: [54, 96, 146], // Blue background matching Excel
          textColor: [255, 255, 255], // White text
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          cellPadding: 3
        },
        bodyStyles: {
          textColor: [0, 0, 0],
          fontSize: 7,
          cellPadding: 2,
          valign: 'top'
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250] // Light gray for alternating rows
        },
        columnStyles: {
          0: { halign: 'center' }, // ID
          1: { halign: 'center' }, // Card Code
          2: { halign: 'left' },   // Card Name
          3: { halign: 'center' }, // Card Type
          4: { halign: 'left' },   // Bank/Issuer
          5: { halign: 'center' }, // Status
          6: { halign: 'right' },  // Transaction Fee
          7: { halign: 'right' },  // Transaction Charges
          8: { halign: 'center' }, // Effective From
          9: { halign: 'center' }  // Effective To
        },
        margin: margins,
        pageBreak: 'auto',
        showHead: 'everyPage',
        tableWidth: 'auto',
        horizontalPageBreak: true,
        horizontalPageBreakRepeat: [0, 1, 2] // Always repeat ID, Code, Name columns
      });
      
      // Get current user for footer
      const currentUser = localStorage.getItem('currentUser') || 
                         sessionStorage.getItem('currentUser') || 
                         'System Administrator';
      
      // Add page numbers and user footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        // Add page numbers
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Page ${i} of ${totalPages}`,
          doc.internal.pageSize.getWidth() - 20,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'right' }
        );
        
        // Add user footer on left side
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(102, 102, 102); // Gray color
        doc.text(
          `Generated by: ${currentUser}`,
          20,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'left' }
        );
        
        // Reset text color for next page
        doc.setTextColor(0, 0, 0);
      }
      
      // Generate filename with timestamp
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      const filename = `Credit_Card_Management_Export_${year}${month}${day}_${hours}${minutes}${seconds}.pdf`;
      
      // Save the PDF
      doc.save(filename);
      
      console.log('✅ Credit Card Management PDF file exported successfully:', filename);
      alert(`✅ Professional Credit Card Management PDF Report exported successfully!\n\nFilename: ${filename}\n\nFeatures included:\n• Landscape orientation with auto-fit columns\n• Report heading and timestamp\n• Professional blue headers\n• Alternating row colors\n• Page numbers and user footer\n• Smart table layout that prevents content cutoff\n• Text wrapping for long content\n• User footer (Generated by: ${currentUser})`);
      
    } catch (error) {
      console.error('Credit Card Management PDF export error:', error);
      alert('❌ Error exporting Credit Card Management to PDF. Please try again.\n\nError: ' + error.message);
    }
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
            Credit Card Manager
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
          ✅ {lastAction === 'Add' ? 'Credit Card added successfully!' : 
               lastAction === 'Edit' ? 'Credit Card updated successfully!' : 
               lastAction === 'Delete' ? 'Credit Card deleted successfully!' : 
               'Credit Card saved successfully!'}
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
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Card Name</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Type</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Status</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, idx) => (
                      <tr key={idx} style={{ background: selectedRecordIdx === idx ? '#e3f2fd' : '#fff' }}>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.card_code}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.card_name}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.card_type}</td>
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
            {/* Card Code */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Card Code *</label>
              <input 
                type="text" 
                name="card_code" 
                value={form.card_code} 
                onChange={handleChange} 
                style={{
                  width:'75%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.card_code ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff',
                  textTransform:'uppercase'
                }} 
                maxLength="10"
                placeholder="e.g., VISA001"
              />
              {fieldErrors.card_code && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.card_code}</span>}
            </div>

            {/* Card Name */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Card Name *</label>
              <input 
                type="text" 
                name="card_name" 
                value={form.card_name} 
                onChange={handleChange} 
                style={{
                  width:'75%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.card_name ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }} 
                maxLength="50"
                placeholder="e.g., Visa Credit Card"
              />
              {fieldErrors.card_name && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.card_name}</span>}
            </div>

            {/* Card Type */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Card Type *</label>
              <select 
                name="card_type" 
                value={form.card_type} 
                onChange={handleChange} 
                style={{
                  width:'75%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.card_type ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }}
              >
                {cardTypes.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </select>
              {fieldErrors.card_type && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.card_type}</span>}
            </div>

            {/* Bank/Issuer */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Bank/Issuer *</label>
              <input 
                type="text" 
                name="bank_issuer" 
                value={form.bank_issuer} 
                onChange={handleChange} 
                style={{
                  width:'75%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.bank_issuer ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }} 
                maxLength="100"
                placeholder="e.g., Chase Bank"
              />
              {fieldErrors.bank_issuer && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.bank_issuer}</span>}
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
            {/* Transaction Fee */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Transaction Fee</label>
              <input 
                type="text" 
                name="transaction_fee" 
                value={form.transaction_fee} 
                onChange={handleChange} 
                style={{
                  width:'75%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.transaction_fee ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }} 
                placeholder="e.g., 2.50"
              />
              {fieldErrors.transaction_fee && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.transaction_fee}</span>}
            </div>

            {/* Transaction Charges */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Transaction Charges</label>
              <input 
                type="text" 
                name="transaction_charges" 
                value={form.transaction_charges} 
                onChange={handleChange} 
                style={{
                  width:'75%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.transaction_charges ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }} 
                placeholder="e.g., 1.25"
              />
              {fieldErrors.transaction_charges && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.transaction_charges}</span>}
            </div>

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

        {/* Records Table */}
        <div style={{flex:1,display:'flex',flexDirection:'column',minHeight:0}}>
          <div style={{fontWeight:'bold',fontSize:'1.5rem',color:'#222',marginBottom:'16px'}}>
            Credit Cards ({records ? records.length : 0})
          </div>
          <div style={{flex:1,overflowY:'auto',overflowX:'auto',border:'1px solid #ddd',borderRadius:'8px'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.9rem',minWidth:'1200px'}}>
              <thead>
                <tr style={{background:'#f5f5f5',position:'sticky',top:0,zIndex:1}}>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'60px'}}>S.No</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'100px'}}>Card Code</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'180px'}}>Card Name</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'100px'}}>Type</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'180px'}}>Bank/Issuer</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center',fontWeight:'bold',background:'#f5f5f5',minWidth:'100px'}}>Status</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center',fontWeight:'bold',background:'#f5f5f5',minWidth:'100px'}}>Fee</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center',fontWeight:'bold',background:'#f5f5f5',minWidth:'120px'}}>Effective From</th>
                </tr>
              </thead>
              <tbody>
                {records && records.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{border:'1px solid #ddd',padding:'20px',textAlign:'center',color:'#888',fontStyle:'italic',background:'#fff'}}>No credit cards found</td>
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
                      <td style={{border:'1px solid #ddd',padding:'12px 8px',fontWeight:'bold',color:'#1976d2'}}>{record.card_code}</td>
                      <td style={{border:'1px solid #ddd',padding:'12px 8px'}}>{record.card_name}</td>
                      <td style={{border:'1px solid #ddd',padding:'12px 8px'}}>{record.card_type}</td>
                      <td style={{border:'1px solid #ddd',padding:'12px 8px'}}>{record.bank_issuer}</td>
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
                      <td style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center',color:'#2e7d32',fontWeight:'bold'}}>
                        {record.transaction_fee ? `$${record.transaction_fee}` : '-'}
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

export default CreditCardManager;