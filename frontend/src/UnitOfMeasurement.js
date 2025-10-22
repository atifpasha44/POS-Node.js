import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import InfoTooltip from './InfoTooltip';

const initialState = {
  uom_code: '',
  uom_name: '',
  conversion_factor: '',
  is_active: true,
  display_sequence: ''
};

const UnitOfMeasurement = ({ setParentDirty, records, setRecords }) => {
  const [isDirty, setIsDirty] = useState(false);
  const [form, setForm] = useState(initialState);
  const [action, setAction] = useState('Add');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedRecordIdx, setSelectedRecordIdx] = useState(null);
  const [selectModalMessage, setSelectModalMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [lastAction, setLastAction] = useState('Add');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('display_sequence');
  const [sortAsc, setSortAsc] = useState(true);
  const formRef = useRef(null);

  // Validation function
  const validateForm = () => {
    const errors = {};
    
    if (!form.uom_code.trim()) {
      errors.uom_code = 'UOM Code is required';
    } else if (form.uom_code.length > 6) {
      errors.uom_code = 'UOM Code must not exceed 6 characters';
    } else {
      // Check for duplicate codes
      const isDuplicate = records && records.some((record, index) => {
        if (index === selectedRecordIdx) return false;
        return record.uom_code.toLowerCase() === form.uom_code.toLowerCase();
      });
      if (isDuplicate) {
        errors.uom_code = 'UOM Code already exists';
      }
    }
    
    if (!form.uom_name.trim()) {
      errors.uom_name = 'UOM Name is required';
    } else if (form.uom_name.length > 26) {
      errors.uom_name = 'UOM Name must not exceed 26 characters';
    }
    
    if (form.conversion_factor && (isNaN(parseFloat(form.conversion_factor)) || parseFloat(form.conversion_factor) <= 0)) {
      errors.conversion_factor = 'Conversion Factor must be a positive number';
    }
    
    if (!form.display_sequence || isNaN(parseInt(form.display_sequence)) || parseInt(form.display_sequence) < 1) {
      errors.display_sequence = 'Display Sequence must be a positive number';
    } else {
      // Check for duplicate sequence
      const duplicateSequence = records && records.some((record, index) => {
        if (index === selectedRecordIdx) return false;
        return record.display_sequence === parseInt(form.display_sequence);
      });
      if (duplicateSequence) {
        errors.display_sequence = 'Display Sequence already exists';
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = value;
    
    if (name === 'uom_code') {
      newValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    } else if (name === 'display_sequence') {
      newValue = value.replace(/[^0-9]/g, '');
    } else if (name === 'conversion_factor') {
      if (value === '' || /^\d*\.?\d{0,4}$/.test(value)) {
        newValue = value;
      } else {
        return;
      }
    }
    
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : newValue }));
    
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
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
      uom_code: selectedRecord.uom_code || '',
      uom_name: selectedRecord.uom_name || '',
      conversion_factor: selectedRecord.conversion_factor || '',
      is_active: selectedRecord.is_active !== undefined ? selectedRecord.is_active : true,
      display_sequence: selectedRecord.display_sequence || ''
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
    const confirmMessage = `Are you sure you want to delete "${selectedRecord.uom_name}" (${selectedRecord.uom_code})?`;
    
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
        console.error('Error deleting UOM:', error);
      }
    }
  };

  const handleCopy = () => {
    if (selectedRecordIdx === null || !records || selectedRecordIdx >= records.length) {
      setSelectModalMessage('Please select a record to copy.');
      setShowSelectModal(true);
      return;
    }
    
    const selectedRecord = records[selectedRecordIdx];
    setAction('Add');
    setForm({
      ...selectedRecord,
      uom_code: '',
      uom_name: selectedRecord.uom_name + ' (Copy)',
      display_sequence: ''
    });
    setFieldErrors({});
    setIsDirty(true);
    if (setParentDirty) setParentDirty(true);
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
      uom_code: selectedRecord.uom_code || '',
      uom_name: selectedRecord.uom_name || '',
      conversion_factor: selectedRecord.conversion_factor || '',
      is_active: selectedRecord.is_active !== undefined ? selectedRecord.is_active : true,
      display_sequence: selectedRecord.display_sequence || ''
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
        uom_code: form.uom_code.trim(),
        uom_name: form.uom_name.trim(),
        conversion_factor: form.conversion_factor ? parseFloat(form.conversion_factor) : null,
        is_active: form.is_active,
        display_sequence: parseInt(form.display_sequence),
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
      
      // Sort by display sequence
      updatedRecords.sort((a, b) => a.display_sequence - b.display_sequence);
      
      setRecords(updatedRecords);
      
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
      console.error('Error saving UOM:', error);
    }
  };

  // Export handlers
  const exportToExcel = async () => {
    const exportData = records && records.length > 0 ? records : [form];
    
    if (exportData.length === 0) {
      alert('No data to export');
      return;
    }

    try {
      // Create a new workbook using ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Unit of Measurement Export');
      
      // Add report title
      worksheet.addRow(['Unit of Measurement Export Report']);
      worksheet.getCell('A1').font = {
        bold: true,
        color: { argb: 'FF366092' },
        size: 16,
        name: 'Calibri'
      };
      worksheet.getCell('A1').alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };
      
      // Add generation date
      const now = new Date();
      const dateTimeString = now.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      worksheet.addRow([`Generated on: ${dateTimeString}`]);
      worksheet.getCell('A2').font = {
        color: { argb: 'FF666666' },
        size: 11,
        name: 'Calibri'
      };
      worksheet.getCell('A2').alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };
      
      // Add empty row for spacing
      worksheet.addRow([]);
      
      // Define headers
      const headers = [
        'ID',
        'UOM Code',
        'UOM Name',
        'Conversion Factor',
        'Status',
        'Display Sequence',
        'Created Date'
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
          record.uom_code || '',
          record.uom_name || '',
          record.conversion_factor || 'N/A',
          record.is_active ? 'Active' : 'Inactive',
          record.display_sequence || '',
          record.created_at ? new Date(record.created_at).toLocaleDateString('en-GB') : ''
        ];
        
        const dataRow = worksheet.addRow(row);
        
        // Style data rows with alternating colors
        const isEvenRow = (index + 4) % 2 === 0; // +4 because title(1) + date(1) + empty(1) + header(1)
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
            horizontal: colNumber <= 2 ? 'center' : 'left',
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
      
      // Add footer with user information
      const currentUser = localStorage.getItem('currentUser') || 
                         sessionStorage.getItem('currentUser') || 
                         'System Administrator';
      
      worksheet.addRow([]);
      const footerRow = worksheet.addRow(['Report generated by:', currentUser]);
      
      // Style footer
      footerRow.getCell(1).font = {
        bold: true,
        color: { argb: 'FF333333' },
        size: 10,
        name: 'Calibri'
      };
      footerRow.getCell(1).alignment = {
        horizontal: 'right',
        vertical: 'middle'
      };
      
      footerRow.getCell(2).font = {
        bold: true,
        color: { argb: 'FF0066CC' },
        size: 10,
        name: 'Calibri'
      };
      footerRow.getCell(2).alignment = {
        horizontal: 'left',
        vertical: 'middle'
      };

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
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      const filename = `Unit_Of_Measurement_Export_${year}${month}${day}_${hours}${minutes}${seconds}.xlsx`;
      
      // Generate buffer and save file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      saveAs(blob, filename);
      
      console.log('✅ Unit of Measurement Excel file exported successfully:', filename);
      alert(`✅ Formatted Unit of Measurement Excel Report exported successfully!\n\nFilename: ${filename}\n\nFeatures included:\n• Report heading at top\n• Professional blue headers\n• Alternating row colors\n• Complete table formatting\n• Auto-sized columns\n• User footer (Generated by: ${currentUser})`);
      
    } catch (error) {
      console.error('Unit of Measurement Excel export error:', error);
      alert('❌ Error exporting Unit of Measurement to Excel. Please try again.\n\nError: ' + error.message);
    }
  };

  const exportToPDF = async () => {
    const exportData = records && records.length > 0 ? records : [form];
    
    if (exportData.length === 0) {
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
      doc.text('Unit of Measurement Export Report', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
      
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
        { header: 'UOM Code', dataKey: 'uom_code' },
        { header: 'UOM Name', dataKey: 'uom_name' },
        { header: 'Conversion Factor', dataKey: 'conversion_factor' },
        { header: 'Status', dataKey: 'status' },
        { header: 'Display Sequence', dataKey: 'display_sequence' },
        { header: 'Created Date', dataKey: 'created_date' }
      ];
      
      // Prepare data rows
      const rows = exportData.map(rec => ({
        id: rec.id || '',
        uom_code: rec.uom_code || '',
        uom_name: rec.uom_name || '',
        conversion_factor: rec.conversion_factor || 'N/A',
        status: rec.is_active ? 'Active' : 'Inactive',
        display_sequence: rec.display_sequence || '',
        created_date: rec.created_at ? new Date(rec.created_at).toLocaleDateString('en-GB') : ''
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
          1: { halign: 'center' }, // UOM Code
          2: { halign: 'left' },   // UOM Name
          3: { halign: 'center' }, // Conversion Factor
          4: { halign: 'center' }, // Status
          5: { halign: 'center' }, // Display Sequence
          6: { halign: 'center' }  // Created Date
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
      
      const filename = `Unit_Of_Measurement_Export_${year}${month}${day}_${hours}${minutes}${seconds}.pdf`;
      
      // Save the PDF
      doc.save(filename);
      
      console.log('✅ Unit of Measurement PDF file exported successfully:', filename);
      alert(`✅ Professional Unit of Measurement PDF Report exported successfully!\n\nFilename: ${filename}\n\nFeatures included:\n• Landscape orientation with auto-fit columns\n• Report heading and timestamp\n• Professional blue headers\n• Alternating row colors\n• Page numbers and user footer\n• Smart table layout that prevents content cutoff\n• Text wrapping for long content\n• User footer (Generated by: ${currentUser})`);
      
    } catch (error) {
      console.error('Unit of Measurement PDF export error:', error);
      alert('❌ Error exporting Unit of Measurement to PDF. Please try again.\n\nError: ' + error.message);
    }
  };

  // Filtered and sorted records
  const filteredRecords = records ? records.filter(record => {
    if (!searchTerm) return true;
    return (
      record.uom_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.uom_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) : [];

  const sortedRecords = filteredRecords.sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (sortAsc) {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });

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
            Unit Of Measurement
          </span>
          {(() => {
            const softwareControlEnabled = localStorage.getItem('softwareControlEnabled');
            return JSON.parse(softwareControlEnabled || 'false') && (
              <InfoTooltip 
                formName="Unit Of Measurement"
                mainTable="it_conf_uom"
                linkedTables={[]}
              />
            );
          })()}
          <select
            value={action}
            onChange={e => {
              const val = e.target.value;
              if (val === 'Add') handleAdd();
              else if (val === 'Edit') handleEdit();
              else if (val === 'Delete') handleDelete();
              else if (val === 'Search') handleSearch();
              else if (val === 'Copy') handleCopy();
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
            <option value="Copy">Copy</option>
          </select>
          <button onClick={handleAdd} title="Add" style={{background:'#e3fcec',border:'2px solid #43a047',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#43a047',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#c8e6c9'} onMouseOut={e=>e.currentTarget.style.background='#e3fcec'}><span role="img" aria-label="Add">➕</span></button>
          <button onClick={handleEdit} title="Modify/Edit" style={{background:'#e3eafc',border:'2px solid #1976d2',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#1976d2',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#bbdefb'} onMouseOut={e=>e.currentTarget.style.background='#e3eafc'}><span role="img" aria-label="Edit">✏️</span></button>
          <button onClick={handleDelete} title="Delete" style={{background:'#ffebee',border:'2px solid #e53935',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#e53935',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#ffcdd2'} onMouseOut={e=>e.currentTarget.style.background='#ffebee'}><span role="img" aria-label="Delete">🗑️</span></button>
          <button onClick={handleSearch} title="Search" style={{background:'#fffde7',border:'2px solid #fbc02d',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#fbc02d',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#fff9c4'} onMouseOut={e=>e.currentTarget.style.background='#fffde7'}><span role="img" aria-label="Search">🔍</span></button>
          <button onClick={handleCopy} title="Copy" style={{background:'#e0f7fa',border:'2px solid #00838f',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#00838f',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#b2ebf2'} onMouseOut={e=>e.currentTarget.style.background='#e0f7fa'}><span role="img" aria-label="Copy">📋</span></button>
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
          ✅ {lastAction === 'Add' ? 'UOM added successfully!' : 
               lastAction === 'Edit' ? 'UOM updated successfully!' : 
               lastAction === 'Delete' ? 'UOM deleted successfully!' : 
               lastAction === 'Copy' ? 'UOM copied successfully!' :
               'UOM saved successfully!'}
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
            {sortedRecords && sortedRecords.length > 0 ? (
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Code</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Name</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Conversion</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Status</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRecords.map((record, idx) => (
                      <tr key={idx} style={{ background: selectedRecordIdx === idx ? '#e3f2fd' : '#fff' }}>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.uom_code}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.uom_name}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{record.conversion_factor || 'N/A'}</td>
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
                              } else if (action === 'Copy') {
                                handleCopy();
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
            {/* UOM Code */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>UOM Code *</label>
              <input 
                type="text" 
                name="uom_code" 
                value={form.uom_code} 
                onChange={handleChange} 
                style={{
                  width:'75%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.uom_code ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff',
                  textTransform:'uppercase'
                }} 
                maxLength="6"
                placeholder="e.g., PCS, LTR, KG"
              />
              {fieldErrors.uom_code && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.uom_code}</span>}
            </div>
            
            {/* UOM Name */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>UOM Name *</label>
              <input 
                type="text" 
                name="uom_name" 
                value={form.uom_name} 
                onChange={handleChange} 
                style={{
                  width:'75%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.uom_name ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }} 
                maxLength="26"
                placeholder="e.g., Pieces, Litres, Kilograms"
              />
              {fieldErrors.uom_name && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.uom_name}</span>}
            </div>
          </div>
          
          {/* Right Column */}
          <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
            {/* Conversion Factor */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Conversion Factor</label>
              <input 
                type="text" 
                name="conversion_factor" 
                value={form.conversion_factor} 
                onChange={handleChange} 
                style={{
                  width:'75%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.conversion_factor ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }} 
                placeholder="e.g., 1000 (1 LTR = 1000 ML)"
              />
              {fieldErrors.conversion_factor && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.conversion_factor}</span>}
            </div>
            
            {/* Display Sequence */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Display Sequence *</label>
              <input 
                type="text" 
                name="display_sequence" 
                value={form.display_sequence} 
                onChange={handleChange} 
                style={{
                  width:'75%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.display_sequence ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }} 
                placeholder="e.g., 1, 2, 3..."
              />
              {fieldErrors.display_sequence && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.display_sequence}</span>}
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
        </form>
        
        {/* Search, Sort Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '18px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by code or name..."
            style={{ width: '320px', height: '36px', fontSize: '1rem', border: '2px solid #bbb', borderRadius: '6px', padding: '0 8px' }}
          />
          
          <select
            value={sortField}
            onChange={e => setSortField(e.target.value)}
            style={{ fontSize: '1rem', border: '2px solid #bbb', borderRadius: '6px', padding: '0 8px', height: '36px' }}
          >
            <option value="display_sequence">Sort by Sequence</option>
            <option value="uom_code">Sort by Code</option>
            <option value="uom_name">Sort by Name</option>
          </select>
          
          <button
            onClick={() => setSortAsc(!sortAsc)}
            style={{ fontSize: '1rem', border: '2px solid #bbb', borderRadius: '6px', padding: '0 18px', background: '#e3f2fd', color: '#1976d2', fontWeight: 'bold', cursor: 'pointer', height: '36px' }}
          >
            {sortAsc ? 'Asc' : 'Desc'}
          </button>
        </div>
        
        {/* Records Table */}
        <div style={{flex:1,display:'flex',flexDirection:'column',minHeight:0}}>
          <div style={{fontWeight:'bold',fontSize:'1.5rem',color:'#222',marginBottom:'16px'}}>
            Units of Measurement ({sortedRecords ? sortedRecords.length : 0})
          </div>
          <div style={{flex:1,overflowY:'auto',overflowX:'auto',border:'1px solid #ddd',borderRadius:'8px'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.9rem',minWidth:'1000px'}}>
              <thead>
                <tr style={{background:'#f5f5f5',position:'sticky',top:0,zIndex:1}}>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'60px'}}>S.No</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'100px'}}>Code</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'250px'}}>Name/Description</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center',fontWeight:'bold',background:'#f5f5f5',minWidth:'150px'}}>Conversion Factor</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center',fontWeight:'bold',background:'#f5f5f5',minWidth:'100px'}}>Sequence</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center',fontWeight:'bold',background:'#f5f5f5',minWidth:'100px'}}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedRecords && sortedRecords.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{border:'1px solid #ddd',padding:'20px',textAlign:'center',color:'#888',fontStyle:'italic',background:'#fff'}}>No UOM records found</td>
                  </tr>
                ) : (
                  sortedRecords && sortedRecords.map((record, index) => (
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
                      <td style={{border:'1px solid #ddd',padding:'12px 8px',fontWeight:'bold',color:'#1976d2'}}>{record.uom_code}</td>
                      <td style={{border:'1px solid #ddd',padding:'12px 8px'}}>{record.uom_name}</td>
                      <td style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center',fontWeight:'bold',color:'#2e7d32'}}>
                        {record.conversion_factor || (
                          <span style={{color:'#888',fontStyle:'italic'}}>N/A</span>
                        )}
                      </td>
                      <td style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center',fontWeight:'bold',color:'#ff6f00'}}>{record.display_sequence}</td>
                      <td style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center'}}>
                        <span style={{
                          padding:'4px 8px',
                          borderRadius:'4px',
                          fontSize:'0.8rem',
                          fontWeight:'bold',
                          color: record.is_active ? '#2e7d32' : '#f57c00',
                          background: record.is_active ? '#e8f5e9' : '#fff3e0'
                        }}>
                          {record.is_active ? 'Active' : 'Inactive'}
                        </span>
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

export default UnitOfMeasurement;