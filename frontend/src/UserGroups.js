import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const initialState = {
  property_code: '',
  group_name: '',
  designation_id: '',
  designation_name: '',
  description: '',
  assigned_users: [],
  is_active: true
};

const UserGroups = ({ setParentDirty, propertyCodes, userDesignationsRecords, userSetupRecords, records, setRecords }) => {
  const [isDirty, setIsDirty] = useState(false);
  const [form, setForm] = useState(initialState);
  const [action, setAction] = useState('Add');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [showUserAssignModal, setShowUserAssignModal] = useState(false);
  const [selectedRecordIdx, setSelectedRecordIdx] = useState(null);
  const [selectModalMessage, setSelectModalMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const formRef = useRef(null);

  // Validation function
  const validateForm = () => {
    const errors = {};
    
    if (!form.property_code.trim()) {
      errors.property_code = 'Property Code is required';
    }
    
    if (!form.group_name.trim()) {
      errors.group_name = 'Group Name is required';
    } else if (form.group_name.length > 50) {
      errors.group_name = 'Group Name must not exceed 50 characters';
    }
    
    if (!form.designation_id.trim()) {
      errors.designation_id = 'Designation is required';
    }
    
    if (form.description && form.description.length > 200) {
      errors.description = 'Description must not exceed 200 characters';
    }
    
    return errors;
  };

  // Check for duplicate group name
  const isDuplicateGroupName = () => {
    return records.some((record, index) => 
      record && 
      record.group_name.toLowerCase() === form.group_name.toLowerCase() && 
      index !== selectedRecordIdx
    );
  };

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (setParentDirty) setParentDirty(true);
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDesignationChange = (designationId) => {
    const selectedDesignation = getActiveDesignations().find(d => d.code === designationId);
    setForm(prev => ({ 
      ...prev, 
      designation_id: designationId,
      designation_name: selectedDesignation ? selectedDesignation.name : ''
    }));
    setIsDirty(true);
    if (setParentDirty) setParentDirty(true);
    
    // Clear field error
    if (fieldErrors.designation_id) {
      setFieldErrors(prev => ({ ...prev, designation_id: '' }));
    }
  };

  const handleUserAssignment = (userId, assigned) => {
    let newAssignedUsers;
    if (assigned) {
      newAssignedUsers = [...form.assigned_users, userId];
    } else {
      newAssignedUsers = form.assigned_users.filter(id => id !== userId);
    }
    
    setForm(prev => ({ ...prev, assigned_users: newAssignedUsers }));
    setIsDirty(true);
    if (setParentDirty) setParentDirty(true);
  };

  const handleAdd = () => {
    setAction('Add');
    setForm(initialState);
    setSelectedRecordIdx(null);
    setFieldErrors({});
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
  };

  const handleEdit = () => {
    if (records.length === 0) {
      setSelectModalMessage('No records available to edit.');
      setShowSelectModal(true);
      return;
    }
    setAction('Edit');
    setSelectModalMessage('Select a record to edit:');
    setShowSelectModal(true);
  };

  const handleDelete = () => {
    if (records.length === 0) {
      setSelectModalMessage('No records available to delete.');
      setShowSelectModal(true);
      return;
    }
    setAction('Delete');
    setSelectModalMessage('Select a record to delete:');
    setShowSelectModal(true);
  };

  const handleSearch = () => {
    if (records.length === 0) {
      setSelectModalMessage('No records available to search.');
      setShowSelectModal(true);
      return;
    }
    setAction('Search');
    setSelectModalMessage('Select a record to view:');
    setShowSelectModal(true);
  };

  const handleClear = () => {
    setForm(initialState);
    setSelectedRecordIdx(null);
    setFieldErrors({});
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
  };

  const handleSave = () => {
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    if (isDuplicateGroupName()) {
      setFieldErrors({ group_name: 'Group Name already exists' });
      return;
    }

    let newRecords;
    if (action === 'Add') {
      const newRecord = {
        ...form,
        group_id: Date.now().toString(), // Generate unique ID
        created_date: new Date().toISOString().split('T')[0]
      };
      newRecords = [...records, newRecord];
    } else if (action === 'Edit' && selectedRecordIdx !== null) {
      newRecords = records.map((record, index) => 
        index === selectedRecordIdx ? { ...record, ...form, modified_date: new Date().toISOString().split('T')[0] } : record
      );
    } else if (action === 'Delete' && selectedRecordIdx !== null) {
      newRecords = records.filter((_, index) => index !== selectedRecordIdx);
    } else {
      return;
    }

    setRecords(newRecords);
    setShowSavePopup(true);
    setTimeout(() => setShowSavePopup(false), 2000);
    
    if (action === 'Add' || action === 'Delete') {
      handleClear();
    }
    
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
  };

  const handleSelectRecord = (index) => {
    const record = records[index];
    setForm({ ...record });
    setSelectedRecordIdx(index);
    setShowSelectModal(false);
    setFieldErrors({});
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
  };

  const handleExport = async (format) => {
    if (records.length === 0) {
      alert('No data to export');
      return;
    }

    const exportData = records.map(record => ({
      id: record.id || '',
      property_code: record.property_code || '',
      group_name: record.group_name || '',
      designation_name: record.designation_name || '',
      description: record.description || '',
      assigned_users: Array.isArray(record.assigned_users) ? record.assigned_users.length : 0,
      status: record.is_active ? 'Active' : 'Inactive',
      created_date: record.created_date || ''
    }));

    if (format === 'Excel') {
      try {
        // Create a new workbook using ExcelJS
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('User Groups Export');
        
        // Add report title
        worksheet.addRow(['User Groups Export Report']);
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
          'Property Code', 
          'Group Name',
          'Designation',
          'Description',
          'Assigned Users',
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
        exportData.forEach((record, index) => {
          const row = [
            record.id,
            record.property_code,
            record.group_name,
            record.designation_name,
            record.description,
            record.assigned_users,
            record.status,
            record.created_date
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
        const currentRowNumber = worksheet.rowCount + 2;
        
        // Get current user
        const currentUser = localStorage.getItem('currentUser') || 
                           sessionStorage.getItem('currentUser') || 
                           'System Administrator';
        
        // Add footer separator
        worksheet.addRow([]);
        
        // Add user footer
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
        
        const filename = `User_Groups_Export_${year}${month}${day}_${hours}${minutes}${seconds}.xlsx`;
        
        // Generate buffer and save file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        saveAs(blob, filename);
        
        console.log('✅ User Groups Excel file exported successfully:', filename);
        alert(`✅ Formatted User Groups Excel Report exported successfully!\n\nFilename: ${filename}\n\nFeatures included:\n• Report heading at top\n• Professional blue headers\n• Alternating row colors\n• Complete table formatting\n• Auto-sized columns\n• User footer (Generated by: ${currentUser})`);
        
      } catch (error) {
        console.error('User Groups Excel export error:', error);
        alert('❌ Error exporting User Groups to Excel. Please try again.\n\nError: ' + error.message);
      }
      
    } else if (format === 'PDF') {
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
        doc.text('User Groups Export Report', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
        
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
          { header: 'Property Code', dataKey: 'property_code' },
          { header: 'Group Name', dataKey: 'group_name' },
          { header: 'Designation', dataKey: 'designation_name' },
          { header: 'Description', dataKey: 'description' },
          { header: 'Users', dataKey: 'assigned_users' },
          { header: 'Status', dataKey: 'status' },
          { header: 'Created Date', dataKey: 'created_date' }
        ];
        
        // Calculate available width for the table
        const pageWidth = doc.internal.pageSize.getWidth();
        const margins = { left: 10, right: 10 };
        
        // Create the table with professional styling and auto-fit columns
        autoTable(doc, {
          columns: columns,
          body: exportData,
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
            1: { halign: 'center' }, // Property Code
            2: { halign: 'left' },   // Group Name
            3: { halign: 'left' },   // Designation
            4: { halign: 'left' },   // Description
            5: { halign: 'center' }, // Users
            6: { halign: 'center' }, // Status
            7: { halign: 'center' }  // Created Date
          },
          margin: margins,
          pageBreak: 'auto',
          showHead: 'everyPage',
          tableWidth: 'auto',
          horizontalPageBreak: true,
          horizontalPageBreakRepeat: [0, 1, 2] // Always repeat ID, Property Code, Group Name columns
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
        
        const filename = `User_Groups_Export_${year}${month}${day}_${hours}${minutes}${seconds}.pdf`;
        
        // Save the PDF
        doc.save(filename);
        
        console.log('✅ User Groups PDF file exported successfully:', filename);
        alert(`✅ Professional User Groups PDF Report exported successfully!\n\nFilename: ${filename}\n\nFeatures included:\n• Landscape orientation with auto-fit columns\n• Report heading and timestamp\n• Professional blue headers\n• Alternating row colors\n• Page numbers and user footer\n• Smart table layout that prevents content cutoff\n• Text wrapping for long content\n• User footer (Generated by: ${currentUser})`);
        
      } catch (error) {
        console.error('User Groups PDF export error:', error);
        alert('❌ Error exporting User Groups to PDF. Please try again.\n\nError: ' + error.message);
      }
    }
  };

  // Get applicable property codes
  const getApplicablePropertyCodes = () => {
    if (!propertyCodes || propertyCodes.length === 0) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const groupedByCodes = propertyCodes.reduce((acc, pc) => {
      const code = pc.property_code || pc.code;
      if (!acc[code]) acc[code] = [];
      acc[code].push(pc);
      return acc;
    }, {});
    
    const applicableCodes = [];
    
    Object.keys(groupedByCodes).forEach(code => {
      const records = groupedByCodes[code];
      
      const applicableRecords = records.filter(record => {
        const applicableDate = new Date(record.applicable_from);
        applicableDate.setHours(0, 0, 0, 0);
        return applicableDate <= today;
      });
      
      if (applicableRecords.length > 0) {
        applicableRecords.sort((a, b) => new Date(b.applicable_from) - new Date(a.applicable_from));
        applicableCodes.push(applicableRecords[0]);
      }
    });
    
    return applicableCodes;
  };

  // Get active designations from User Designations records
  const getActiveDesignations = () => {
    if (!userDesignationsRecords || userDesignationsRecords.length === 0) return [];
    
    return userDesignationsRecords
      .filter(designation => designation && !designation.inactive && designation.designation_name)
      .map(designation => ({
        code: designation.designation_code,
        name: designation.designation_name,
        department: designation.department
      }));
  };

  // Get available users (mock data structure - adjust based on actual UserSetup structure)
  const getAvailableUsers = () => {
    // Mock users - replace with actual userSetupRecords when available
    const mockUsers = [
      { id: '1', name: 'John Doe', email: 'john@example.com', designation: 'Manager' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', designation: 'Supervisor' },
      { id: '3', name: 'Mike Johnson', email: 'mike@example.com', designation: 'Staff' },
      { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com', designation: 'Assistant' }
    ];

    // If userSetupRecords is available, use it instead
    if (userSetupRecords && userSetupRecords.length > 0) {
      return userSetupRecords.map(user => ({
        id: user.id || user.email,
        name: user.name,
        email: user.email,
        designation: user.role || user.designation || 'N/A'
      }));
    }

    return mockUsers;
  };

  return (
    <div className="propertycode-panel" style={{background:'#fff',border:'2.5px solid #222',borderRadius:'16px',boxShadow:'0 2px 12px rgba(0,0,0,0.10)',width:'100%',maxWidth:'1200px',margin:'32px auto',padding:'0 0 18px 0',height:'calc(100vh - 120px)',display:'flex',flexDirection:'column',overflowY:'auto',position:'relative'}}>
      {/* Top Control Bar */}
      <div style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        borderBottom:'2px solid #e0e0e0',padding:'12px 18px 8px 18px',minWidth:0,
        position:'sticky',top:0,zIndex:10,background:'#fff',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',minWidth:0,flexWrap:'wrap'}}>
          <span style={{fontWeight:'bold',fontSize:'2rem',color:'#222',marginRight:'18px'}}>User Groups</span>
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
          <button onClick={() => setShowUserAssignModal(true)} title="Assign Users" style={{background:'#fff3e0',border:'2px solid #ff9800',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#ff9800',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#ffe0b2'} onMouseOut={e=>e.currentTarget.style.background='#fff3e0'}><span role="img" aria-label="Assign Users">👥</span></button>
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

      {/* Save confirmation popup */}
      {showSavePopup && (
        <div style={{position:'fixed',top:'30%',left:'50%',transform:'translate(-50%,-50%)',background:'#fff',border:'2px solid #43a047',borderRadius:'12px',padding:'32px 48px',zIndex:1000,boxShadow:'0 4px 24px rgba(0,0,0,0.18)',fontSize:'1.25rem',color:'#43a047',fontWeight:'bold'}}>
          {action === 'Delete' ? 'Record has been successfully deleted.' : 'Data has been saved successfully.'}
        </div>
      )}

      {/* Record selection modal */}
      {showSelectModal && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.18)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:'14px',padding:'32px 24px',minWidth:'700px',boxShadow:'0 4px 24px rgba(0,0,0,0.18)',maxHeight:'80vh',overflowY:'auto'}}>
            <div style={{fontWeight:'bold',fontSize:'1.2rem',marginBottom:'18px',color:'#1976d2'}}>{selectModalMessage}</div>
            {records.length === 0 ? (
              <div style={{color:'#888',fontSize:'1.05rem'}}>No records found.</div>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse',marginBottom:'12px'}}>
                <thead>
                  <tr style={{background:'#e3e3e3'}}>
                    <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Group Name</th>
                    <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Designation</th>
                    <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Users</th>
                    <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Status</th>
                    <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, index) => (
                    <tr key={index} style={{background: index%2 ? '#f7f7f7' : '#fff'}}>
                      <td style={{padding:'6px 8px'}}>{record.group_name}</td>
                      <td style={{padding:'6px 8px'}}>{record.designation_name}</td>
                      <td style={{padding:'6px 8px'}}>{Array.isArray(record.assigned_users) ? record.assigned_users.length : 0}</td>
                      <td style={{padding:'6px 8px'}}>
                        <span style={{
                          padding:'2px 6px',
                          borderRadius:'4px',
                          fontSize:'0.8rem',
                          fontWeight:'bold',
                          background: record.is_active ? '#e8f5e9' : '#ffebee',
                          color: record.is_active ? '#43a047' : '#e53935'
                        }}>
                          {record.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{padding:'6px 8px'}}>
                        <button type="button" style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:'6px',padding:'4px 12px',fontWeight:'bold',cursor:'pointer'}} onClick={()=>handleSelectRecord(index)}>Select</button>
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

      {/* User Assignment Modal */}
      {showUserAssignModal && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.18)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:'14px',padding:'32px 24px',minWidth:'600px',maxWidth:'800px',boxShadow:'0 4px 24px rgba(0,0,0,0.18)',maxHeight:'80vh',overflowY:'auto'}}>
            <div style={{fontWeight:'bold',fontSize:'1.2rem',marginBottom:'18px',color:'#1976d2'}}>
              Assign Users to Group: {form.group_name || 'New Group'}
            </div>
            <div style={{marginBottom:'16px',color:'#666',fontSize:'0.95rem'}}>
              Select users to assign to this group. Users will inherit permissions based on the group's designation.
            </div>
            <div style={{border:'1px solid #ddd',borderRadius:'8px',padding:'16px',maxHeight:'300px',overflowY:'auto'}}>
              {getAvailableUsers().map(user => (
                <div key={user.id} style={{display:'flex',alignItems:'center',marginBottom:'8px',padding:'8px',background:'#f9f9f9',borderRadius:'4px'}}>
                  <input
                    type="checkbox"
                    id={`user_${user.id}`}
                    checked={form.assigned_users.includes(user.id)}
                    onChange={e => handleUserAssignment(user.id, e.target.checked)}
                    style={{marginRight:'12px',transform:'scale(1.2)'}}
                  />
                  <div style={{flex:1}}>
                    <div style={{fontWeight:'bold',fontSize:'1rem'}}>{user.name}</div>
                    <div style={{color:'#666',fontSize:'0.875rem'}}>{user.email} • {user.designation}</div>
                  </div>
                </div>
              ))}
              {getAvailableUsers().length === 0 && (
                <div style={{color:'#888',fontSize:'0.95rem',fontStyle:'italic',textAlign:'center',padding:'20px'}}>
                  No users available for assignment.
                </div>
              )}
            </div>
            <div style={{marginTop:'16px',display:'flex',gap:'12px',justifyContent:'flex-end'}}>
              <button 
                type="button" 
                style={{background:'#e53935',color:'#fff',border:'none',borderRadius:'6px',padding:'8px 22px',fontWeight:'bold',fontSize:'1.08rem',cursor:'pointer'}} 
                onClick={()=>setShowUserAssignModal(false)}
              >
                Close
              </button>
              <button 
                type="button" 
                style={{background:'#43a047',color:'#fff',border:'none',borderRadius:'6px',padding:'8px 22px',fontWeight:'bold',fontSize:'1.08rem',cursor:'pointer'}} 
                onClick={()=>{
                  setShowUserAssignModal(false);
                  setIsDirty(true);
                  if (setParentDirty) setParentDirty(true);
                }}
              >
                Apply Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Section */}
      <form ref={formRef} className="propertycode-form" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 32px',padding:'32px 32px 0 32px'}} autoComplete="off">
        {/* Left column */}
        <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
          {/* Property Code */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Property Code</label>
            <div style={{width:'80%'}}>
              <select
                value={form.property_code}
                onChange={e => handleInputChange('property_code', e.target.value)}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.property_code ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }}
                required
              >
                <option value="">Select Property Code</option>
                {getApplicablePropertyCodes().map(pc => (
                  <option key={pc.property_code || pc.code} value={pc.property_code || pc.code}>
                    {(pc.property_code || pc.code) + (pc.property_name ? ' - ' + pc.property_name : (pc.name ? ' - ' + pc.name : ''))}
                  </option>
                ))}
              </select>
              {fieldErrors.property_code && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.property_code}
                </div>
              )}
            </div>
          </div>

          {/* Group Name */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Group Name</label>
            <div style={{width:'80%'}}>
              <input
                type="text"
                value={form.group_name}
                onChange={e => handleInputChange('group_name', e.target.value)}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.group_name ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px'
                }}
                placeholder="Enter unique group name"
                maxLength="50"
                required
              />
              {fieldErrors.group_name && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.group_name}
                </div>
              )}
            </div>
          </div>

          {/* Designation Association */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Designation</label>
            <div style={{width:'80%'}}>
              <select
                value={form.designation_id}
                onChange={e => handleDesignationChange(e.target.value)}
                style={{
                  width:'100%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.designation_id ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }}
                required
              >
                <option value="">Select Designation</option>
                {getActiveDesignations().map(designation => (
                  <option key={designation.code} value={designation.code}>
                    {designation.code} - {designation.name} ({designation.department})
                  </option>
                ))}
              </select>
              {fieldErrors.designation_id && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.designation_id}
                </div>
              )}
              {getActiveDesignations().length === 0 && (
                <div style={{ color: '#888', fontSize: '0.875rem', marginTop: '4px', fontStyle: 'italic' }}>
                  No active designations available. Please create designations first.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
          {/* Description */}
          <div style={{display:'flex',alignItems:'flex-start'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222',marginTop:'8px'}}>Description</label>
            <div style={{width:'80%'}}>
              <textarea
                value={form.description}
                onChange={e => handleInputChange('description', e.target.value)}
                style={{
                  width:'100%',
                  height:'80px',
                  fontSize:'1.08rem',
                  border: fieldErrors.description ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'8px',
                  resize:'vertical',
                  minHeight:'60px'
                }}
                placeholder="Enter group description (optional)"
                maxLength="200"
              />
              {fieldErrors.description && (
                <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '4px' }}>
                  {fieldErrors.description}
                </div>
              )}
            </div>
          </div>

          {/* Assigned Users Count */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Assigned Users</label>
            <div style={{width:'80%',display:'flex',alignItems:'center',gap:'12px'}}>
              <div style={{
                padding:'8px 16px',
                background:'#e3f2fd',
                border:'2px solid #1976d2',
                borderRadius:'6px',
                fontWeight:'bold',
                color:'#1976d2'
              }}>
                {form.assigned_users.length} user{form.assigned_users.length !== 1 ? 's' : ''} assigned
              </div>
              <button
                type="button"
                onClick={() => setShowUserAssignModal(true)}
                style={{
                  background:'#ff9800',
                  color:'#fff',
                  border:'none',
                  borderRadius:'6px',
                  padding:'8px 16px',
                  fontWeight:'bold',
                  cursor:'pointer'
                }}
              >
                Manage Users
              </button>
            </div>
          </div>

          {/* Status */}
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Status</label>
            <div style={{width:'80%',display:'flex',alignItems:'center'}}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => handleInputChange('is_active', e.target.checked)}
                style={{marginRight:'8px',transform:'scale(1.2)'}}
              />
              <span style={{ 
                fontWeight: 'bold', 
                color: form.is_active ? '#43a047' : '#e53935' 
              }}>
                {form.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </form>

      {/* Records Table */}
      <div style={{padding:'32px',paddingTop:'24px'}}>
        <div style={{fontWeight:'bold',fontSize:'1.25rem',color:'#222',marginBottom:'16px'}}>User Groups Records</div>
        <div style={{border:'2px solid #bbb',borderRadius:'8px',overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'#f5f5f5'}}>
                <th style={{padding:'12px',borderBottom:'1px solid #eee',fontWeight:'bold',textAlign:'left'}}>Group Name</th>
                <th style={{padding:'12px',borderBottom:'1px solid #eee',fontWeight:'bold',textAlign:'left'}}>Designation</th>
                <th style={{padding:'12px',borderBottom:'1px solid #eee',fontWeight:'bold',textAlign:'left'}}>Description</th>
                <th style={{padding:'12px',borderBottom:'1px solid #eee',fontWeight:'bold',textAlign:'left'}}>Users</th>
                <th style={{padding:'12px',borderBottom:'1px solid #eee',fontWeight:'bold',textAlign:'left'}}>Status</th>
                <th style={{padding:'12px',borderBottom:'1px solid #eee',fontWeight:'bold',textAlign:'left'}}>Created</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{padding:'24px',textAlign:'center',color:'#888',fontStyle:'italic'}}>
                    No records found. Click Add to create your first user group.
                  </td>
                </tr>
              ) : (
                records.map((record, index) => (
                  <tr key={index} style={{background: index % 2 === 0 ? '#fff' : '#f9f9f9'}}>
                    <td style={{padding:'12px',borderBottom:'1px solid #eee',fontWeight:'bold'}}>{record.group_name}</td>
                    <td style={{padding:'12px',borderBottom:'1px solid #eee'}}>{record.designation_name}</td>
                    <td style={{padding:'12px',borderBottom:'1px solid #eee',maxWidth:'200px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={record.description}>
                      {record.description || '-'}
                    </td>
                    <td style={{padding:'12px',borderBottom:'1px solid #eee'}}>
                      <span style={{
                        padding:'4px 8px',
                        background:'#e3f2fd',
                        borderRadius:'4px',
                        fontSize:'0.875rem',
                        fontWeight:'bold',
                        color:'#1976d2'
                      }}>
                        {Array.isArray(record.assigned_users) ? record.assigned_users.length : 0}
                      </span>
                    </td>
                    <td style={{padding:'12px',borderBottom:'1px solid #eee'}}>
                      <span style={{
                        padding:'4px 8px',
                        borderRadius:'4px',
                        fontSize:'0.875rem',
                        fontWeight:'bold',
                        background: record.is_active ? '#e8f5e9' : '#ffebee',
                        color: record.is_active ? '#43a047' : '#e53935'
                      }}>
                        {record.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{padding:'12px',borderBottom:'1px solid #eee',fontSize:'0.875rem',color:'#666'}}>
                      {record.created_date || '-'}
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
};

export default UserGroups;
