import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const initialState = {
  login_name: '',
  password: '',
  re_password: '',
  user_pin: '',
  re_user_pin: '',
  full_name: '',
  short_name: '',
  property_code: '',
  outlet_codes: [],
  user_no: '',
  role: 'General User',
  department_id: '',
  user_group_id: '',
  user_card_no: '',
  email: '',
  gender: '',
  is_active: true
};

export default function UserSetup({ setParentDirty, propertyCodes, outletRecords, userDepartmentsRecords, userGroupsRecords, records, setRecords }) {
  const [isDirty, setIsDirty] = useState(false);
  const [form, setForm] = useState(initialState);
  const [action, setAction] = useState('Add');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedRecordIdx, setSelectedRecordIdx] = useState(null);
  const [selectModalMessage, setSelectModalMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showRePin, setShowRePin] = useState(false);
  const formRef = useRef(null);

  // Validation function
  const validateForm = () => {
    const errors = {};
    
    if (!form.login_name.trim()) {
      errors.login_name = 'Login Name is required';
    } else if (form.login_name.length > 50) {
      errors.login_name = 'Login Name must not exceed 50 characters';
    }
    
    if (!form.password.trim()) {
      errors.password = 'Password is required';
    } else if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (!form.re_password.trim()) {
      errors.re_password = 'Please confirm password';
    } else if (form.password !== form.re_password) {
      errors.re_password = 'Passwords do not match';
    }
    
    if (!form.user_pin.trim()) {
      errors.user_pin = 'User PIN is required';
    } else if (!/^\d{4,6}$/.test(form.user_pin)) {
      errors.user_pin = 'PIN must be 4-6 digits';
    }
    
    if (!form.re_user_pin.trim()) {
      errors.re_user_pin = 'Please confirm PIN';
    } else if (form.user_pin !== form.re_user_pin) {
      errors.re_user_pin = 'PINs do not match';
    }
    
    if (!form.full_name.trim()) {
      errors.full_name = 'Full Name is required';
    } else if (form.full_name.length > 100) {
      errors.full_name = 'Full Name must not exceed 100 characters';
    }
    
    if (form.short_name && form.short_name.length > 20) {
      errors.short_name = 'Short Name must not exceed 20 characters';
    }
    
    if (!form.property_code.trim()) {
      errors.property_code = 'Property Code is required';
    }
    
    if (!form.user_no.trim()) {
      errors.user_no = 'User No is required';
    } else if (form.user_no.length > 20) {
      errors.user_no = 'User No must not exceed 20 characters';
    }
    
    if (!form.role.trim()) {
      errors.role = 'Role is required';
    }
    
    if (!form.department_id.trim()) {
      errors.department_id = 'Department is required';
    }
    
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    return errors;
  };

  // Check for duplicates
  const checkDuplicates = (field, value, excludeIdx = null) => {
    return records.some((record, idx) => {
      if (excludeIdx !== null && idx === excludeIdx) return false;
      return record[field] && record[field].toLowerCase() === value.toLowerCase();
    });
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear specific field error when user starts typing
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

  // Handle outlet selection
  const handleOutletChange = (outletCode) => {
    setForm(prev => ({
      ...prev,
      outlet_codes: prev.outlet_codes.includes(outletCode)
        ? prev.outlet_codes.filter(code => code !== outletCode)
        : [...prev.outlet_codes, outletCode]
    }));

    if (!isDirty) {
      setIsDirty(true);
      setParentDirty(true);
    }
  };

  // Get available outlets for selected property
  const getAvailableOutlets = () => {
    if (!form.property_code || !outletRecords) return [];
    return outletRecords.filter(outlet => outlet.property_code === form.property_code);
  };

  // Get available departments for selected property
  const getAvailableDepartments = () => {
    if (!form.property_code || !userDepartmentsRecords) return [];
    return userDepartmentsRecords.filter(dept => 
      dept.property_code === form.property_code && !dept.inactive
    );
  };

  // Get available user groups for selected property
  const getAvailableUserGroups = () => {
    if (!form.property_code || !userGroupsRecords) return [];
    return userGroupsRecords.filter(group => 
      group.property_code === form.property_code && group.is_active
    );
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
    setSelectModalMessage('Search for User and click "View" to see full details in read-only mode.');
  };

  const handleClear = () => {
    setForm(initialState);
    setAction('Add');
    setSelectedRecordIdx(null);
    setFieldErrors({});
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
  };

  const handleSave = () => {
    const errors = validateForm();
    
    // Check for duplicates
    if (form.login_name && checkDuplicates('login_name', form.login_name, action === 'Edit' ? selectedRecordIdx : null)) {
      errors.login_name = 'Login Name already exists';
    }
    
    if (form.user_no && checkDuplicates('user_no', form.user_no, action === 'Edit' ? selectedRecordIdx : null)) {
      errors.user_no = 'User No already exists';
    }
    
    if (form.email && checkDuplicates('email', form.email, action === 'Edit' ? selectedRecordIdx : null)) {
      errors.email = 'Email already exists';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    const selectedDept = getAvailableDepartments().find(dept => dept.user_dept_code === form.department_id);
    const selectedGroup = getAvailableUserGroups().find(group => group.group_name === form.user_group_id);

    const newRecord = {
      ...form,
      department_name: selectedDept ? selectedDept.name : '',
      user_group_name: selectedGroup ? selectedGroup.group_name : '',
      created_date: action === 'Add' ? new Date().toLocaleDateString() : (selectedRecordIdx !== null ? records[selectedRecordIdx].created_date : new Date().toLocaleDateString()),
      modified_date: new Date().toLocaleDateString()
    };

    if (action === 'Add') {
      setRecords([...records, newRecord]);
    } else if (action === 'Edit' && selectedRecordIdx !== null) {
      const updatedRecords = [...records];
      updatedRecords[selectedRecordIdx] = newRecord;
      setRecords(updatedRecords);
    }

    setForm(initialState);
    setAction('Add');
    setSelectedRecordIdx(null);
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
    setShowSavePopup(true);
    setTimeout(() => setShowSavePopup(false), 2000);
  };

  // Handle record selection from modal
  const handleSelectRecord = (index) => {
    const record = records[index];
    if (action === 'Edit') {
      setForm({
        login_name: record.login_name || '',
        password: record.password || '',
        re_password: record.password || '',
        user_pin: record.user_pin || '',
        re_user_pin: record.user_pin || '',
        full_name: record.full_name || '',
        short_name: record.short_name || '',
        property_code: record.property_code || '',
        outlet_codes: record.outlet_codes || [],
        user_no: record.user_no || '',
        role: record.role || 'General User',
        department_id: record.department_id || '',
        user_group_id: record.user_group_id || '',
        user_card_no: record.user_card_no || '',
        email: record.email || '',
        gender: record.gender || '',
        is_active: record.is_active !== undefined ? record.is_active : true
      });
      setSelectedRecordIdx(index);
      setFieldErrors({});
    } else if (action === 'Delete') {
      const updatedRecords = records.filter((_, idx) => idx !== index);
      setRecords(updatedRecords);
      setShowSavePopup(true);
      setTimeout(() => setShowSavePopup(false), 2000);
    }
    setShowSelectModal(false);
  };

  // Export functions
  const exportToExcel = async () => {
    if (records.length === 0) {
      alert('No data to export');
      return;
    }

    try {
      // Create a new workbook using ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('User Setup Export');
      
      // Add report title
      worksheet.addRow(['User Setup Export Report']);
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
        'Login Name',
        'Full Name',
        'Short Name',
        'Property Code',
        'Outlet Codes',
        'User No',
        'Role',
        'Department',
        'User Group',
        'User Card No',
        'Email',
        'Gender',
        'Status',
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
      records.forEach((record, index) => {
        const row = [
          record.id || '',
          record.login_name || '',
          record.full_name || '',
          record.short_name || '',
          record.property_code || '',
          Array.isArray(record.outlet_codes) ? record.outlet_codes.join(', ') : (record.outlet_codes || ''),
          record.user_no || '',
          record.role || '',
          record.department_name || '',
          record.user_group_name || '',
          record.user_card_no || '',
          record.email || '',
          record.gender || '',
          record.is_active ? 'Active' : 'Inactive',
          record.created_date || ''
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
            horizontal: colNumber <= 3 ? 'center' : 'left',
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
      
      const filename = `User_Setup_Export_${year}${month}${day}_${hours}${minutes}${seconds}.xlsx`;
      
      // Generate buffer and save file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      saveAs(blob, filename);
      
      console.log('✅ User Setup Excel file exported successfully:', filename);
      alert(`✅ Formatted User Setup Excel Report exported successfully!\n\nFilename: ${filename}\n\nFeatures included:\n• Report heading at top\n• Professional blue headers\n• Alternating row colors\n• Complete table formatting\n• Auto-sized columns\n• User footer (Generated by: ${currentUser})`);
      
    } catch (error) {
      console.error('User Setup Excel export error:', error);
      alert('❌ Error exporting User Setup to Excel. Please try again.\n\nError: ' + error.message);
    }
  };

  const exportToPDF = async () => {
    if (records.length === 0) {
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
      doc.text('User Setup Export Report', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
      
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
        { header: 'Login Name', dataKey: 'login_name' },
        { header: 'Full Name', dataKey: 'full_name' },
        { header: 'Property Code', dataKey: 'property_code' },
        { header: 'User No', dataKey: 'user_no' },
        { header: 'Role', dataKey: 'role' },
        { header: 'Department', dataKey: 'department_name' },
        { header: 'Email', dataKey: 'email' },
        { header: 'Gender', dataKey: 'gender' },
        { header: 'Status', dataKey: 'status' }
      ];
      
      // Prepare data rows
      const rows = records.map(rec => ({
        id: rec.id || '',
        login_name: rec.login_name || '',
        full_name: rec.full_name || '',
        property_code: rec.property_code || '',
        user_no: rec.user_no || '',
        role: rec.role || '',
        department_name: rec.department_name || '',
        email: rec.email || '',
        gender: rec.gender || '',
        status: rec.is_active ? 'Active' : 'Inactive'
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
          1: { halign: 'left' },   // Login Name
          2: { halign: 'left' },   // Full Name
          3: { halign: 'center' }, // Property Code
          4: { halign: 'center' }, // User No
          5: { halign: 'center' }, // Role
          6: { halign: 'left' },   // Department
          7: { halign: 'left' },   // Email
          8: { halign: 'center' }, // Gender
          9: { halign: 'center' }  // Status
        },
        margin: margins,
        pageBreak: 'auto',
        showHead: 'everyPage',
        tableWidth: 'auto',
        horizontalPageBreak: true,
        horizontalPageBreakRepeat: [0, 1, 2, 3] // Always repeat ID, Login, Name, Property columns
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
      
      const filename = `User_Setup_Export_${year}${month}${day}_${hours}${minutes}${seconds}.pdf`;
      
      // Save the PDF
      doc.save(filename);
      
      console.log('✅ User Setup PDF file exported successfully:', filename);
      alert(`✅ Professional User Setup PDF Report exported successfully!\n\nFilename: ${filename}\n\nFeatures included:\n• Landscape orientation with auto-fit columns\n• Report heading and timestamp\n• Professional blue headers\n• Alternating row colors\n• Page numbers and user footer\n• Smart table layout that prevents content cutoff\n• Text wrapping for long content\n• User footer (Generated by: ${currentUser})`);
      
    } catch (error) {
      console.error('User Setup PDF export error:', error);
      alert('❌ Error exporting User Setup to PDF. Please try again.\n\nError: ' + error.message);
    }
  };

  return (
    <div className="propertycode-panel" style={{background:'#fff',border:'2.5px solid #222',borderRadius:'16px',boxShadow:'0 2px 12px rgba(0,0,0,0.10)',width:'100%',maxWidth:'1200px',margin:'32px auto',padding:'0',height:'calc(100vh - 120px)',display:'flex',flexDirection:'column',position:'relative',overflow:'hidden'}}>
      {/* Top Control Bar - sticky */}
      <div style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        borderBottom:'2px solid #e0e0e0',padding:'12px 18px 8px 18px',minWidth:0,
        position:'sticky',top:0,zIndex:10,background:'#fff',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',minWidth:0,flexWrap:'wrap'}}>
          <span style={{fontWeight:'bold',fontSize:'2rem',color:'#222',marginRight:'18px'}}>User Setup</span>
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
              <text x="16" y="21" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#fff">P</text>
              <text x="24" y="21" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#fff">D</text>
              <text x="32" y="21" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#fff">F</text>
            </svg>
          </span>
        </div>
      </div>

      {/* Form Section - following PropertyCode pattern exactly */}
      <form ref={formRef} className="propertycode-form" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 32px',padding:'32px 32px 0 32px'}}>
        {/* Save confirmation popup */}
        {showSavePopup && (
          <div style={{position:'fixed',top:'30%',left:'50%',transform:'translate(-50%,-50%)',background:'#fff',border:'2px solid #43a047',borderRadius:'12px',padding:'32px 48px',zIndex:1000,boxShadow:'0 4px 24px rgba(0,0,0,0.18)',fontSize:'1.25rem',color:'#43a047',fontWeight:'bold'}}>
            {action === 'Delete' ? 'User has been successfully deleted.' : 'User data has been saved successfully.'}
          </div>
        )}

        {/* Record selection modal for Edit/Delete/Search */}
        {showSelectModal && (
          <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.18)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{background:'#fff',borderRadius:'14px',padding:'32px 24px',minWidth:'720px',boxShadow:'0 4px 24px rgba(0,0,0,0.18)',maxHeight:'80vh',overflowY:'auto'}}>
              <div style={{fontWeight:'bold',fontSize:'1.2rem',marginBottom:'18px',color:'#1976d2'}}>
                {action === 'Search' ? 'All User Records - Select to View Details' : (selectModalMessage || 'Select a record to edit/delete')}
              </div>
              {records.length === 0 ? (
                <div style={{color:'#888',fontSize:'1.05rem'}}>No records found.</div>
              ) : (
                <table style={{width:'100%',borderCollapse:'collapse',marginBottom:'12px'}}>
                  <thead>
                    <tr style={{background:'#e3e3e3'}}>
                      <th style={{border:'1px solid #ccc',padding:'8px',textAlign:'left'}}>Login Name</th>
                      <th style={{border:'1px solid #ccc',padding:'8px',textAlign:'left'}}>Full Name</th>
                      <th style={{border:'1px solid #ccc',padding:'8px',textAlign:'left'}}>Property Code</th>
                      <th style={{border:'1px solid #ccc',padding:'8px',textAlign:'left'}}>User No</th>
                      <th style={{border:'1px solid #ccc',padding:'8px',textAlign:'left'}}>Role</th>
                      <th style={{border:'1px solid #ccc',padding:'8px',textAlign:'left'}}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, idx) => (
                      <tr key={idx}>
                        <td style={{border:'1px solid #ccc',padding:'8px'}}>{record.login_name}</td>
                        <td style={{border:'1px solid #ccc',padding:'8px'}}>{record.full_name}</td>
                        <td style={{border:'1px solid #ccc',padding:'8px'}}>{record.property_code}</td>
                        <td style={{border:'1px solid #ccc',padding:'8px'}}>{record.user_no}</td>
                        <td style={{border:'1px solid #ccc',padding:'8px'}}>{record.role}</td>
                        <td style={{border:'1px solid #ccc',padding:'8px'}}>
                          <button type="button" style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:'6px',padding:'4px 12px',fontWeight:'bold',cursor:'pointer'}} onClick={()=>handleSelectRecord(idx)}>
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

        {/* Left column */}
        <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Login Name *</label>
            <input 
              type="text" 
              name="login_name" 
              value={form.login_name} 
              onChange={handleChange} 
              style={{width:'75%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background:'#fff'}} 
              maxLength="50"
            />
            {fieldErrors.login_name && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.login_name}</span>}
          </div>

          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Password *</label>
            <div style={{width:'75%',position:'relative',display:'flex',alignItems:'center'}}>
              <input 
                type={showPassword ? "text" : "password"}
                name="password" 
                value={form.password} 
                onChange={handleChange} 
                style={{width:'100%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 40px 0 8px',background:'#fff',boxSizing:'border-box'}} 
                minLength="8"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:'16px',color:'#666',zIndex:1}}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {fieldErrors.password && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.password}</span>}
          </div>

          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Re-type Password *</label>
            <div style={{width:'75%',position:'relative',display:'flex',alignItems:'center'}}>
              <input 
                type={showRePassword ? "text" : "password"}
                name="re_password" 
                value={form.re_password} 
                onChange={handleChange} 
                style={{width:'100%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 40px 0 8px',background:'#fff',boxSizing:'border-box'}} 
              />
              <button
                type="button"
                onClick={() => setShowRePassword(!showRePassword)}
                style={{position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:'16px',color:'#666',zIndex:1}}
              >
                {showRePassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {fieldErrors.re_password && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.re_password}</span>}
          </div>

          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>User PIN *</label>
            <div style={{width:'75%',position:'relative',display:'flex',alignItems:'center'}}>
              <input 
                type={showPin ? "text" : "password"}
                name="user_pin" 
                value={form.user_pin} 
                onChange={handleChange} 
                style={{width:'100%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 40px 0 8px',background:'#fff',boxSizing:'border-box'}} 
                pattern="[0-9]{4,6}"
                maxLength="6"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                style={{position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:'16px',color:'#666',zIndex:1}}
              >
                {showPin ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {fieldErrors.user_pin && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.user_pin}</span>}
          </div>

          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Re-type PIN *</label>
            <div style={{width:'75%',position:'relative',display:'flex',alignItems:'center'}}>
              <input 
                type={showRePin ? "text" : "password"}
                name="re_user_pin" 
                value={form.re_user_pin} 
                onChange={handleChange} 
                style={{width:'100%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 40px 0 8px',background:'#fff',boxSizing:'border-box'}} 
                pattern="[0-9]{4,6}"
                maxLength="6"
              />
              <button
                type="button"
                onClick={() => setShowRePin(!showRePin)}
                style={{position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:'16px',color:'#666',zIndex:1}}
              >
                {showRePin ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {fieldErrors.re_user_pin && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.re_user_pin}</span>}
          </div>

          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Full Name *</label>
            <input 
              type="text" 
              name="full_name" 
              value={form.full_name} 
              onChange={handleChange} 
              style={{width:'75%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background:'#fff'}} 
              maxLength="100"
            />
            {fieldErrors.full_name && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.full_name}</span>}
          </div>

          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Short Name</label>
            <input 
              type="text" 
              name="short_name" 
              value={form.short_name} 
              onChange={handleChange} 
              style={{width:'75%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background:'#fff'}} 
              maxLength="20"
            />
            {fieldErrors.short_name && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.short_name}</span>}
          </div>

          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Property Code *</label>
            <select 
              name="property_code" 
              value={form.property_code} 
              onChange={handleChange} 
              style={{width:'75%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background:'#fff'}}
            >
              <option value="">Select Property Code</option>
              {propertyCodes && propertyCodes.map((property, index) => (
                <option key={index} value={property.property_code}>
                  {property.property_code} - {property.property_name}
                </option>
              ))}
            </select>
            {fieldErrors.property_code && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.property_code}</span>}
          </div>

          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>User No *</label>
            <input 
              type="text" 
              name="user_no" 
              value={form.user_no} 
              onChange={handleChange} 
              style={{width:'75%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background:'#fff'}} 
              maxLength="20"
            />
            {fieldErrors.user_no && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.user_no}</span>}
          </div>
        </div>

        {/* Right column */}
        <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Role *</label>
            <select 
              name="role" 
              value={form.role} 
              onChange={handleChange} 
              style={{width:'75%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background:'#fff'}}
            >
              <option value="General User">General User</option>
              <option value="System Administrator">System Administrator</option>
            </select>
            {fieldErrors.role && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.role}</span>}
          </div>

          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Department *</label>
            <select 
              name="department_id" 
              value={form.department_id} 
              onChange={handleChange} 
              style={{width:'75%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background:'#fff'}}
              disabled={!form.property_code}
            >
              <option value="">Select Department</option>
              {getAvailableDepartments().map((dept, index) => (
                <option key={index} value={dept.user_dept_code}>
                  {dept.user_dept_code} - {dept.name}
                </option>
              ))}
            </select>
            {fieldErrors.department_id && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.department_id}</span>}
          </div>

          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>User Group</label>
            <select 
              name="user_group_id" 
              value={form.user_group_id} 
              onChange={handleChange} 
              style={{width:'75%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background:'#fff'}}
              disabled={!form.property_code}
            >
              <option value="">Select User Group</option>
              {getAvailableUserGroups().map((group, index) => (
                <option key={index} value={group.group_name}>
                  {group.group_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>User Email</label>
            <input 
              type="email" 
              name="email" 
              value={form.email} 
              onChange={handleChange} 
              style={{width:'75%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background:'#fff'}} 
            />
            {fieldErrors.email && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.email}</span>}
          </div>

          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Gender</label>
            <select 
              name="gender" 
              value={form.gender} 
              onChange={handleChange} 
              style={{width:'75%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background:'#fff'}}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>User Card No</label>
            <input 
              type="text" 
              name="user_card_no" 
              value={form.user_card_no} 
              onChange={handleChange} 
              style={{width:'75%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background:'#fff'}} 
              maxLength="50"
            />
          </div>

          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Active User</label>
            <div style={{display:'flex',alignItems:'center',marginLeft:'8px'}}>
              <input 
                type="checkbox" 
                name="is_active" 
                checked={form.is_active} 
                onChange={handleChange} 
                style={{width:'24px',height:'24px'}} 
              />
            </div>
          </div>

          {/* Add empty div to match left column height */}
          <div style={{height:'36px'}}></div>
          <div style={{height:'36px'}}></div>
        </div>
      </form>

      {/* Outlet Selection Section - only show if property is selected */}
      {form.property_code && (
        <div style={{padding:'24px 32px 0 32px'}}>
          <div style={{fontWeight:'bold',fontSize:'1.15rem',color:'#222',marginBottom:'16px'}}>Outlet Assignments</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'16px'}}>
            {getAvailableOutlets().map((outlet, index) => (
              <label key={index} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 16px',border:'1px solid #ddd',borderRadius:'6px',background:'#f9f9f9',cursor:'pointer'}}>
                <input
                  type="checkbox"
                  checked={form.outlet_codes.includes(outlet.outlet_code)}
                  onChange={() => handleOutletChange(outlet.outlet_code)}
                  style={{width:'16px',height:'16px'}}
                />
                <span style={{fontSize:'1rem',color:'#333'}}>{outlet.outlet_code} - {outlet.outlet_name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Records Table */}
      <div style={{padding:'24px 32px 18px 32px',flex:1,display:'flex',flexDirection:'column',minHeight:0}}>
        <div style={{fontWeight:'bold',fontSize:'1.5rem',color:'#222',marginBottom:'16px'}}>
          User Records ({records.length})
        </div>
        <div style={{flex:1,overflowY:'auto',overflowX:'auto',border:'1px solid #ddd',borderRadius:'8px'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.9rem',minWidth:'800px'}}>
            <thead>
              <tr style={{background:'#f5f5f5',position:'sticky',top:0,zIndex:1}}>
                <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'60px'}}>S.No</th>
                <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'120px'}}>Login Name</th>
                <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'150px'}}>Full Name</th>
                <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'120px'}}>Property Code</th>
                <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'100px'}}>User No</th>
                <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'120px'}}>Role</th>
                <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'120px'}}>Department</th>
                <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'180px'}}>Email</th>
                <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'80px'}}>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{border:'1px solid #ddd',padding:'20px',textAlign:'center',color:'#888',fontStyle:'italic',background:'#fff'}}>No user records found</td>
                </tr>
              ) : (
                records.map((record, index) => (
                  <tr key={index} style={{background: index % 2 === 0 ? '#fff' : '#f9f9f9',transition:'background-color 0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#e3f2fd'} onMouseOut={e=>e.currentTarget.style.background=index % 2 === 0 ? '#fff' : '#f9f9f9'}>
                    <td style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center'}}>{index + 1}</td>
                    <td style={{border:'1px solid #ddd',padding:'12px 8px',wordBreak:'break-word'}}>{record.login_name}</td>
                    <td style={{border:'1px solid #ddd',padding:'12px 8px',wordBreak:'break-word'}}>{record.full_name}</td>
                    <td style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center'}}>{record.property_code}</td>
                    <td style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center'}}>{record.user_no}</td>
                    <td style={{border:'1px solid #ddd',padding:'12px 8px',wordBreak:'break-word'}}>{record.role}</td>
                    <td style={{border:'1px solid #ddd',padding:'12px 8px',wordBreak:'break-word'}}>{record.department_name}</td>
                    <td style={{border:'1px solid #ddd',padding:'12px 8px',wordBreak:'break-all'}}>{record.email}</td>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}