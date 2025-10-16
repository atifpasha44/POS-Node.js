import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const initialState = {
  set_menu_code: '',
  set_menu_name: '',
  description: '',
  items_included: [], // Array of {item_code, item_name, item_price, quantity}
  selling_price: '',
  is_active: true,
  effective_from: '',
  effective_to: ''
};

const initialItemEntry = {
  item_code: '',
  item_name: '',
  item_price: 0,
  quantity: 1
};

const SetMenu = ({ setParentDirty, records, setRecords, itemMasterRecords }) => {
  const [isDirty, setIsDirty] = useState(false);
  const [form, setForm] = useState(initialState);
  const [action, setAction] = useState('Add');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedRecordIdx, setSelectedRecordIdx] = useState(null);
  const [selectModalMessage, setSelectModalMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [lastAction, setLastAction] = useState('Add');
  const [showItemModal, setShowItemModal] = useState(false);
  const [currentItemEntry, setCurrentItemEntry] = useState(initialItemEntry);
  const [editingItemIndex, setEditingItemIndex] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('set_menu_name');
  const [sortAsc, setSortAsc] = useState(true);
  const formRef = useRef(null);

  // Validation function
  const validateForm = () => {
    const errors = {};
    if (!form.set_menu_code.trim()) {
      errors.set_menu_code = 'Set Menu Code is required';
    } else if (form.set_menu_code.length > 15) {
      errors.set_menu_code = 'Set Menu Code must not exceed 15 characters';
    } else {
      // Check for duplicate codes
      const isDuplicate = records && records.some((record, index) => {
        if (index === selectedRecordIdx) return false;
        return record.set_menu_code.toLowerCase() === form.set_menu_code.toLowerCase();
      });
      if (isDuplicate) {
        errors.set_menu_code = 'Set Menu Code already exists';
      }
    }
    if (!form.set_menu_name.trim()) {
      errors.set_menu_name = 'Set Menu Name is required';
    } else if (form.set_menu_name.length > 100) {
      errors.set_menu_name = 'Set Menu Name must not exceed 100 characters';
    }
    if (!form.selling_price || isNaN(parseFloat(form.selling_price)) || parseFloat(form.selling_price) < 0) {
      errors.selling_price = 'Selling Price must be a valid non-negative number';
    }
    if (!form.items_included || form.items_included.length === 0) {
      errors.items_included = 'At least one item must be included';
    }
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

  // Validate item entry
  const validateItemEntry = () => {
    const errors = {};
    if (!currentItemEntry.item_code.trim()) {
      errors.item_code = 'Item Code is required';
    } else {
      // Check for duplicate item code
      const exists = form.items_included.some((item, idx) => {
        if (idx === editingItemIndex) return false;
        return item.item_code === currentItemEntry.item_code;
      });
      if (exists) {
        errors.item_code = 'Item already included in this menu';
      }
    }
    if (!currentItemEntry.quantity || isNaN(currentItemEntry.quantity) || parseInt(currentItemEntry.quantity) < 1) {
      errors.quantity = 'Quantity must be a positive number';
    }
    return errors;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = value;
    if (name === 'set_menu_code') {
      newValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    } else if (name === 'selling_price') {
      if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
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

  // Handle item entry changes
  const handleItemEntryChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'quantity') {
      newValue = value.replace(/[^0-9]/g, '');
    }
    setCurrentItemEntry(prev => ({ ...prev, [name]: newValue }));
  };

  // Add or update item in menu
  const handleAddItem = () => {
    const validationErrors = validateItemEntry();
    if (Object.keys(validationErrors).length > 0) {
      alert(Object.values(validationErrors).join('\n'));
      return;
    }
    const item = itemMasterRecords.find(i => i.item_code === currentItemEntry.item_code);
    const newItem = {
      item_code: currentItemEntry.item_code,
      item_name: item ? item.item_name : currentItemEntry.item_name,
      item_price: item ? item.item_price : currentItemEntry.item_price,
      quantity: parseInt(currentItemEntry.quantity)
    };
    let updatedItems;
    if (editingItemIndex >= 0) {
      updatedItems = [...form.items_included];
      updatedItems[editingItemIndex] = newItem;
    } else {
      updatedItems = [...form.items_included, newItem];
    }
    setForm(prev => ({ ...prev, items_included: updatedItems }));
    setCurrentItemEntry(initialItemEntry);
    setEditingItemIndex(-1);
    setShowItemModal(false);
    if (!isDirty) {
      setIsDirty(true);
      setParentDirty(true);
    }
  };

  // Remove item from menu
  const handleRemoveItem = (index) => {
    const updatedItems = form.items_included.filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, items_included: updatedItems }));
    if (!isDirty) {
      setIsDirty(true);
      setParentDirty(true);
    }
  };

  // Edit item in menu
  const handleEditItem = (index) => {
    const item = form.items_included[index];
    setCurrentItemEntry({
      item_code: item.item_code,
      item_name: item.item_name,
      item_price: item.item_price,
      quantity: item.quantity
    });
    setEditingItemIndex(index);
    setShowItemModal(true);
  };

  // Open add item modal
  const handleOpenItemModal = () => {
    setCurrentItemEntry(initialItemEntry);
    setEditingItemIndex(-1);
    setShowItemModal(true);
  };

  // Calculate total price from items
  const calculateTotalPrice = () => {
    return form.items_included.reduce((sum, item) => sum + (item.item_price * item.quantity), 0).toFixed(2);
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
      set_menu_code: selectedRecord.set_menu_code || '',
      set_menu_name: selectedRecord.set_menu_name || '',
      description: selectedRecord.description || '',
      items_included: selectedRecord.items_included || [],
      selling_price: selectedRecord.selling_price || '',
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
    const confirmMessage = `Are you sure you want to delete "${selectedRecord.set_menu_name}" (${selectedRecord.set_menu_code})?`;
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
        console.error('Error deleting set menu:', error);
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
      set_menu_code: '',
      set_menu_name: selectedRecord.set_menu_name + ' (Copy)',
      is_active: true
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
      set_menu_code: selectedRecord.set_menu_code || '',
      set_menu_name: selectedRecord.set_menu_name || '',
      description: selectedRecord.description || '',
      items_included: selectedRecord.items_included || [],
      selling_price: selectedRecord.selling_price || '',
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
        set_menu_code: form.set_menu_code.trim(),
        set_menu_name: form.set_menu_name.trim(),
        description: form.description.trim(),
        items_included: form.items_included,
        selling_price: parseFloat(form.selling_price),
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
      updatedRecords.sort((a, b) => a.set_menu_code.localeCompare(b.set_menu_code));
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
      console.error('Error saving set menu:', error);
    }
  };

  // Export handlers
  const exportToExcel = async () => {
    if (!records || records.length === 0) {
      alert('No data to export');
      return;
    }

    try {
      // Create a new workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Set Menu Export', {
        pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
      });
      
      // Add report title
      const titleRow = worksheet.addRow(['Set Menu Export Report']);
      titleRow.getCell(1).font = { size: 16, bold: true, color: { argb: 'FF366092' } };
      titleRow.getCell(1).alignment = { horizontal: 'center' };
      worksheet.mergeCells('A1:J1');
      
      // Add date/time
      const now = new Date();
      const dateTimeString = now.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const dateRow = worksheet.addRow([`Generated on: ${dateTimeString}`]);
      dateRow.getCell(1).font = { size: 10, italic: true };
      dateRow.getCell(1).alignment = { horizontal: 'center' };
      worksheet.mergeCells('A2:J2');
      
      // Add empty row
      worksheet.addRow([]);
      
      // Define headers
      const headers = [
        'ID', 'Set Menu Code', 'Set Menu Name', 'Description', 'Items Included', 
        'Selling Price', 'Status', 'Effective From', 'Effective To', 'Created Date'
      ];
      
      // Add header row with styling
      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 11 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });
      
      // Add data rows
      records.forEach((record, index) => {
        const rowData = [
          record.id || '',
          record.set_menu_code || '',
          record.set_menu_name || '',
          record.description || '',
          record.items_included ? record.items_included.map(item => `${item.item_name} (${item.quantity})`).join('; ') : '',
          record.selling_price || '',
          record.is_active ? 'Active' : 'Inactive',
          record.effective_from || '',
          record.effective_to || '',
          record.created_at ? new Date(record.created_at).toLocaleDateString() : ''
        ];
        
        const dataRow = worksheet.addRow(rowData);
        
        // Apply styling to data rows
        dataRow.eachCell((cell, colNumber) => {
          cell.font = { name: 'Calibri', size: 10 };
          cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
          };
          
          // Alternating row colors
          if (index % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
          }
        });
      });
      
      // Auto-size columns
      worksheet.columns.forEach((column, index) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: false }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(Math.max(maxLength + 2, 12), 50);
      });
      
      // Get current user for footer
      const currentUser = localStorage.getItem('currentUser') || 
                         sessionStorage.getItem('currentUser') || 
                         'System Administrator';
      
      // Add user footer
      const footerRowIndex = worksheet.rowCount + 2;
      const footerRow = worksheet.addRow([`Generated by: ${currentUser}`]);
      footerRow.getCell(1).font = { size: 9, italic: true, color: { argb: 'FF666666' } };
      worksheet.mergeCells(`A${footerRowIndex}:J${footerRowIndex}`);
      
      // Generate filename with timestamp
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      const filename = `Set_Menu_Export_${year}${month}${day}_${hours}${minutes}${seconds}.xlsx`;
      
      // Save the file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      saveAs(blob, filename);
      
      console.log('✅ Set Menu Excel file exported successfully:', filename);
      alert(`✅ Professional Set Menu Excel Report exported successfully!\n\nFilename: ${filename}\n\nFeatures included:\n• Professional report title and timestamp\n• Blue styled headers with white text\n• Alternating row colors for better readability\n• Auto-sized columns with proper formatting\n• Borders and professional styling\n• User footer (Generated by: ${currentUser})\n• Landscape orientation optimized for printing`);
      
    } catch (error) {
      console.error('Set Menu Excel export error:', error);
      alert('❌ Error exporting Set Menu to Excel. Please try again.\n\nError: ' + error.message);
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
      doc.text('Set Menu Export Report', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
      
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
        { header: 'Set Menu Code', dataKey: 'set_menu_code' },
        { header: 'Set Menu Name', dataKey: 'set_menu_name' },
        { header: 'Description', dataKey: 'description' },
        { header: 'Items Included', dataKey: 'items_included' },
        { header: 'Selling Price', dataKey: 'selling_price' },
        { header: 'Status', dataKey: 'status' },
        { header: 'Effective From', dataKey: 'effective_from' },
        { header: 'Effective To', dataKey: 'effective_to' }
      ];
      
      // Prepare data rows
      const rows = records.map(rec => ({
        id: rec.id || '',
        set_menu_code: rec.set_menu_code || '',
        set_menu_name: rec.set_menu_name || '',
        description: rec.description || '',
        items_included: rec.items_included ? rec.items_included.map(item => `${item.item_name} (${item.quantity})`).join('; ') : '',
        selling_price: rec.selling_price || '',
        status: rec.is_active ? 'Active' : 'Inactive',
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
          fontSize: 6,
          cellPadding: 2,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          overflow: 'linebreak',
          halign: 'left'
        },
        headStyles: {
          fillColor: [54, 96, 146], // Blue background matching Excel
          textColor: [255, 255, 255], // White text
          fontSize: 7,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          cellPadding: 3
        },
        bodyStyles: {
          textColor: [0, 0, 0],
          fontSize: 6,
          cellPadding: 2,
          valign: 'top'
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250] // Light gray for alternating rows
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 15 }, // ID
          1: { halign: 'center', cellWidth: 25 }, // Set Menu Code
          2: { halign: 'left', cellWidth: 35 },   // Set Menu Name
          3: { halign: 'left', cellWidth: 40 },   // Description
          4: { halign: 'left', cellWidth: 50 },   // Items Included
          5: { halign: 'right', cellWidth: 20 },  // Selling Price
          6: { halign: 'center', cellWidth: 20 }, // Status
          7: { halign: 'center', cellWidth: 25 }, // Effective From
          8: { halign: 'center', cellWidth: 25 }  // Effective To
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
      
      const filename = `Set_Menu_Export_${year}${month}${day}_${hours}${minutes}${seconds}.pdf`;
      
      // Save the PDF
      doc.save(filename);
      
      console.log('✅ Set Menu PDF file exported successfully:', filename);
      alert(`✅ Professional Set Menu PDF Report exported successfully!\n\nFilename: ${filename}\n\nFeatures included:\n• Landscape orientation with auto-fit columns\n• Report heading and timestamp\n• Professional blue headers\n• Alternating row colors\n• Page numbers and user footer\n• Smart table layout that prevents content cutoff\n• Text wrapping for long content\n• User footer (Generated by: ${currentUser})`);
      
    } catch (error) {
      console.error('Set Menu PDF export error:', error);
      alert('❌ Error exporting Set Menu to PDF. Please try again.\n\nError: ' + error.message);
    }
  };

  // Filtered and sorted records
  const filteredRecords = records ? records.filter(record => {
    if (!searchTerm) return true;
    return (
      record.set_menu_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.set_menu_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) : [];
  const sortedRecords = filteredRecords.sort((a, b) => {
    if (sortAsc) {
      return a[sortField].localeCompare(b[sortField]);
    } else {
      return b[sortField].localeCompare(a[sortField]);
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
            Set Menu Options
          </span>
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
          ✅ {lastAction === 'Add' ? 'Set Menu added successfully!' : 
               lastAction === 'Edit' ? 'Set Menu updated successfully!' : 
               lastAction === 'Delete' ? 'Set Menu deleted successfully!' : 
               lastAction === 'Copy' ? 'Set Menu copied successfully!' :
               'Set Menu saved successfully!'}
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
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Menu Name</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Items</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Status</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRecords.map((record, idx) => (
                      <tr key={idx} style={{ background: selectedRecordIdx === idx ? '#e3f2fd' : '#fff' }}>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.set_menu_code}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.set_menu_name}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{record.items_included.length}</td>
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

      {/* Item Entry Modal */}
      {showItemModal && (
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
              {editingItemIndex >= 0 ? 'Edit Item in Menu' : 'Add Item to Menu'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Item Code Dropdown */}
              <div>
                <label style={{ fontWeight: 'bold', fontSize: '1rem', color: '#222', display: 'block', marginBottom: '4px' }}>
                  Item Code *
                </label>
                <select
                  name="item_code"
                  value={currentItemEntry.item_code}
                  onChange={handleItemEntryChange}
                  style={{
                    width: '100%',
                    height: '36px',
                    fontSize: '1rem',
                    border: '2px solid #bbb',
                    borderRadius: '6px',
                    padding: '0 8px'
                  }}
                >
                  <option value="">Select Item</option>
                  {itemMasterRecords && itemMasterRecords
                    .filter(item => item.is_active)
                    .map((item, index) => (
                    <option key={index} value={item.item_code}>
                      {item.item_code} - {item.item_name} (${item.item_price})
                    </option>
                  ))}
                </select>
              </div>
              {/* Quantity */}
              <div>
                <label style={{ fontWeight: 'bold', fontSize: '1rem', color: '#222', display: 'block', marginBottom: '4px' }}>
                  Quantity *
                </label>
                <input
                  type="text"
                  name="quantity"
                  value={currentItemEntry.quantity}
                  onChange={handleItemEntryChange}
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
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button
                onClick={() => setShowItemModal(false)}
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
                onClick={handleAddItem}
                style={{
                  background: '#1976d2',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {editingItemIndex >= 0 ? 'Update' : 'Add'}
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
            {/* Set Menu Code */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Set Menu Code *</label>
              <input 
                type="text" 
                name="set_menu_code" 
                value={form.set_menu_code} 
                onChange={handleChange} 
                style={{
                  width:'75%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.set_menu_code ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff',
                  textTransform:'uppercase'
                }} 
                maxLength="15"
                placeholder="e.g., LUNCHCOMBO01"
              />
              {fieldErrors.set_menu_code && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.set_menu_code}</span>}
            </div>
            {/* Set Menu Name */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Set Menu Name *</label>
              <input 
                type="text" 
                name="set_menu_name" 
                value={form.set_menu_name} 
                onChange={handleChange} 
                style={{
                  width:'75%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.set_menu_name ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }} 
                maxLength="100"
                placeholder="e.g., Lunch Combo"
              />
              {fieldErrors.set_menu_name && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.set_menu_name}</span>}
            </div>
            {/* Description */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Description</label>
              <input 
                type="text" 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                style={{
                  width:'75%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.description ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }} 
                maxLength="200"
                placeholder="e.g., Includes soup, main course, dessert"
              />
              {fieldErrors.description && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.description}</span>}
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
            {/* Selling Price */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Selling Price *</label>
              <input 
                type="text" 
                name="selling_price" 
                value={form.selling_price} 
                onChange={handleChange} 
                style={{
                  width:'75%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.selling_price ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }} 
                placeholder="e.g., 299.00"
              />
              {fieldErrors.selling_price && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.selling_price}</span>}
              <span style={{marginLeft:'16px',fontSize:'0.98rem',color:'#888'}}>Auto: ₹{calculateTotalPrice()}</span>
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
        {/* Items Included Section */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#222', margin: 0 }}>
              Items Included ({form.items_included.length})
            </h3>
            <button
              onClick={handleOpenItemModal}
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
              <span>➕</span> Add Item
            </button>
          </div>
          {fieldErrors.items_included && (
            <div style={{ color: 'red', fontSize: '0.98rem', marginBottom: '16px' }}>
              {fieldErrors.items_included}
            </div>
          )}
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Item Code</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Item Name</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Price</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Quantity</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Total</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {form.items_included.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ border: '1px solid #ddd', padding: '20px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
                      No items added to this menu. Click "Add Item" to include items.
                    </td>
                  </tr>
                ) : (
                  form.items_included.map((item, index) => (
                    <tr key={index} style={{ background: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                      <td style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold', color: '#1976d2' }}>{item.item_code}</td>
                      <td style={{ border: '1px solid #ddd', padding: '12px' }}>{item.item_name}</td>
                      <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#2e7d32' }}>₹{item.item_price}</td>
                      <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#00838f' }}>₹{(item.item_price * item.quantity).toFixed(2)}</td>
                      <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleEditItem(index)}
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
                          onClick={() => handleRemoveItem(index)}
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
        {/* Search, Sort, Filter Bar */}
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
            style={{ fontSize: '1rem', border: '2px solid #bbb', borderRadius: '6px', padding: '0 8px' }}
          >
            <option value="set_menu_name">Sort by Name</option>
            <option value="set_menu_code">Sort by Code</option>
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            style={{ fontSize: '1rem', border: '2px solid #bbb', borderRadius: '6px', padding: '0 18px', background: '#e3f2fd', color: '#1976d2', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {sortAsc ? 'Asc' : 'Desc'}
          </button>
        </div>
        {/* Records Table */}
        <div style={{flex:1,display:'flex',flexDirection:'column',minHeight:0}}>
          <div style={{fontWeight:'bold',fontSize:'1.5rem',color:'#222',marginBottom:'16px'}}>
            Set Menus ({sortedRecords ? sortedRecords.length : 0})
          </div>
          <div style={{flex:1,overflowY:'auto',overflowX:'auto',border:'1px solid #ddd',borderRadius:'8px'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.9rem',minWidth:'1200px'}}>
              <thead>
                <tr style={{background:'#f5f5f5',position:'sticky',top:0,zIndex:1}}>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'60px'}}>S.No</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'120px'}}>Menu Code</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'200px'}}>Menu Name</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'250px'}}>Description</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center',fontWeight:'bold',background:'#f5f5f5',minWidth:'100px'}}>Items Count</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center',fontWeight:'bold',background:'#f5f5f5',minWidth:'100px'}}>Price</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center',fontWeight:'bold',background:'#f5f5f5',minWidth:'100px'}}>Status</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center',fontWeight:'bold',background:'#f5f5f5',minWidth:'120px'}}>Effective From</th>
                </tr>
              </thead>
              <tbody>
                {sortedRecords && sortedRecords.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{border:'1px solid #ddd',padding:'20px',textAlign:'center',color:'#888',fontStyle:'italic',background:'#fff'}}>No set menus found</td>
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
                      <td style={{border:'1px solid #ddd',padding:'12px 8px',fontWeight:'bold',color:'#1976d2'}}>{record.set_menu_code}</td>
                      <td style={{border:'1px solid #ddd',padding:'12px 8px'}}>{record.set_menu_name}</td>
                      <td style={{border:'1px solid #ddd',padding:'12px 8px'}}>{record.description}</td>
                      <td style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center',fontWeight:'bold',color:'#2e7d32'}}>{record.items_included.length}</td>
                      <td style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center',fontWeight:'bold',color:'#00838f'}}>₹{record.selling_price}</td>
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

export default SetMenu;
