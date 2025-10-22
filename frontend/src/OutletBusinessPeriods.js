import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const initialState = {
  applicable_from: new Date().toISOString().split('T')[0],
  outlet_code: '',
  period_code: '',
  period_name: '',
  short_name: '',
  start_time: '06:00',
  end_time: '10:59',
  active_days: {
    sunday: false,
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false
  },
  is_active: true
};

const OutletBusinessPeriods = ({ setParentDirty, records, setRecords, outletRecords }) => {
  const [isDirty, setIsDirty] = useState(false);
  const [form, setForm] = useState(initialState);
  const [action, setAction] = useState('Add');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedRecordIdx, setSelectedRecordIdx] = useState(null);
  const [selectModalMessage, setSelectModalMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [lastAction, setLastAction] = useState('Add');
  const [gridRows, setGridRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  // Load business periods from database when component mounts
  useEffect(() => {
    loadBusinessPeriodsFromDatabase();
  }, []);

  const loadBusinessPeriodsFromDatabase = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading business periods from database...');
      const response = await axios.get('http://localhost:3001/api/business-periods');
      
      if (response.data.success && response.data.data) {
        console.log('✅ Loaded business periods from database:', response.data.data.length, 'records');
        setRecords(response.data.data);
      } else {
        console.log('📊 No business periods found in database');
        setRecords([]);
      }
    } catch (error) {
      console.error('❌ Error loading business periods from database:', error);
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        console.log('⚠️ Backend not available, using existing records...');
      } else {
        setRecords([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Validation function
  const validateForm = () => {
    const errors = {};
    
    if (!form.applicable_from.trim()) {
      errors.applicable_from = 'Applicable From date is required';
    }
    
    if (!form.outlet_code.trim()) {
      errors.outlet_code = 'Outlet Name is required';
    }
    
    if (!form.period_code.trim()) {
      errors.period_code = 'Period Code is required';
    } else if (form.period_code.length > 10) {
      errors.period_code = 'Period Code must not exceed 10 characters';
    }
    
    if (!form.period_name.trim()) {
      errors.period_name = 'Period Name is required';
    } else if (form.period_name.length > 50) {
      errors.period_name = 'Period Name must not exceed 50 characters';
    }
    
    if (form.short_name && form.short_name.length > 10) {
      errors.short_name = 'Short Name must not exceed 10 characters';
    }
    
    if (!form.start_time) {
      errors.start_time = 'Start Time is required';
    }
    
    if (!form.end_time) {
      errors.end_time = 'End Time is required';
    }
    
    // Validate time range
    if (form.start_time && form.end_time) {
      const startTime = new Date(`2000-01-01T${form.start_time}:00`);
      const endTime = new Date(`2000-01-01T${form.end_time}:00`);
      
      if (startTime >= endTime) {
        errors.end_time = 'End Time must be after Start Time';
      }
    }
    
    // Check if at least one day is selected
    const selectedDays = Object.values(form.active_days).some(day => day);
    if (!selectedDays) {
      errors.active_days = 'At least one day must be selected';
    }
    
    // Check for overlapping time periods for the same outlet
    const overlapping = records.some((record, index) => {
      if (index === selectedRecordIdx) return false;
      if (record.outlet_code !== form.outlet_code) return false;
      
      // Check if periods overlap in time and days
      const recordStart = new Date(`2000-01-01T${record.start_time}:00`);
      const recordEnd = new Date(`2000-01-01T${record.end_time}:00`);
      const formStart = new Date(`2000-01-01T${form.start_time}:00`);
      const formEnd = new Date(`2000-01-01T${form.end_time}:00`);
      
      // Check time overlap
      const timeOverlap = (formStart < recordEnd) && (recordStart < formEnd);
      
      // Check day overlap
      const dayOverlap = Object.keys(form.active_days).some(day => 
        form.active_days[day] && record.active_days && record.active_days[day]
      );
      
      return timeOverlap && dayOverlap;
    });
    
    if (overlapping) {
      errors.time_overlap = 'Time period overlaps with existing period for this outlet';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('day_')) {
      const dayName = name.replace('day_', '');
      setForm(prev => ({
        ...prev,
        active_days: {
          ...prev.active_days,
          [dayName]: checked
        }
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

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

  // Get outlet name by code
  const getOutletName = (outletCode) => {
    const outlet = outletRecords?.find(o => o.outlet_code === outletCode);
    return outlet ? outlet.outlet_name : outletCode;
  };

  // Format active days for display
  const formatActiveDays = (activeDays) => {
    if (!activeDays) return '';
    const days = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    dayKeys.forEach((key, index) => {
      if (activeDays[key]) {
        days.push(dayNames[index].substring(0, 3));
      }
    });
    
    return days.join(', ');
  };

  // Handlers
  const handleAdd = () => {
    setAction('Add');
    setForm(initialState);
    setSelectedRecordIdx(null);
    setFieldErrors({});
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
    setGridRows([]);
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
      applicable_from: selectedRecord.applicable_from || '',
      outlet_code: selectedRecord.outlet_code || '',
      period_code: selectedRecord.period_code || '',
      period_name: selectedRecord.period_name || '',
      short_name: selectedRecord.short_name || '',
      start_time: selectedRecord.start_time || '06:00',
      end_time: selectedRecord.end_time || '10:59',
      active_days: selectedRecord.active_days || {
        sunday: false, monday: false, tuesday: false, wednesday: false,
        thursday: false, friday: false, saturday: false
      },
      is_active: selectedRecord.is_active !== undefined ? selectedRecord.is_active : true
    });
    setFieldErrors({});
    setIsDirty(true);
    if (setParentDirty) setParentDirty(true);
  };

  const handleDelete = async () => {
    if (selectedRecordIdx === null || !records || selectedRecordIdx >= records.length) {
      setSelectModalMessage('Please select a record to delete.');
      setShowSelectModal(true);
      return;
    }
    
    const selectedRecord = records[selectedRecordIdx];
    const confirmMessage = `Are you sure you want to delete ${selectedRecord.period_name} for ${getOutletName(selectedRecord.outlet_code)}?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        setLoading(true);
        
        // Delete record via API
        const recordId = selectedRecord.id;
        await axios.delete(`http://localhost:3001/api/business-periods/${recordId}`);
        console.log('✅ Business period deleted successfully');
        
        // Reload data from database to ensure consistency
        await loadBusinessPeriodsFromDatabase();
        
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
        console.error('❌ Error deleting business period:', error);
        let errorMessage = 'Failed to delete business period';
        
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        alert(`❌ ${errorMessage}`);
      } finally {
        setLoading(false);
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
      applicable_from: selectedRecord.applicable_from || '',
      outlet_code: selectedRecord.outlet_code || '',
      period_code: selectedRecord.period_code || '',
      period_name: selectedRecord.period_name || '',
      short_name: selectedRecord.short_name || '',
      start_time: selectedRecord.start_time || '06:00',
      end_time: selectedRecord.end_time || '10:59',
      active_days: selectedRecord.active_days || {
        sunday: false, monday: false, tuesday: false, wednesday: false,
        thursday: false, friday: false, saturday: false
      },
      is_active: selectedRecord.is_active !== undefined ? selectedRecord.is_active : true
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
    setGridRows([]);
  };

  const handleAddToGrid = () => {
    if (!validateForm()) {
      return;
    }

    const newRow = {
      ...form,
      outlet_name: getOutletName(form.outlet_code),
      id: Date.now() + Math.random() // Temporary ID for grid
    };

    setGridRows([...gridRows, newRow]);
    setForm({ ...initialState, outlet_code: form.outlet_code }); // Keep outlet selected
    setFieldErrors({});
  };

  const removeFromGrid = (index) => {
    const updatedRows = gridRows.filter((_, i) => i !== index);
    setGridRows(updatedRows);
  };

  const handleSave = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      setLoading(true);

      // Prepare data for API call - match backend schema exactly
      const businessPeriodData = {
        applicable_from: form.applicable_from,
        outlet_code: form.outlet_code,
        period_code: form.period_code,
        period_name: form.period_name,
        short_name: form.short_name,
        start_time: form.start_time + ':00', // Add seconds for TIME format
        end_time: form.end_time + ':00',     // Add seconds for TIME format
        active_days: form.active_days,
        is_active: form.is_active
      };

      let response;
      if (action === 'Edit' && selectedRecordIdx !== null && records[selectedRecordIdx]) {
        // Update existing record via API
        const recordId = records[selectedRecordIdx].id;
        response = await axios.put(`http://localhost:3001/api/business-periods/${recordId}`, businessPeriodData);
        console.log('✅ Business period updated successfully:', response.data);
      } else {
        // Create new record via API
        response = await axios.post('http://localhost:3001/api/business-periods', businessPeriodData);
        console.log('✅ Business period created successfully:', response.data);
      }

      // Reload data from database to ensure consistency
      await loadBusinessPeriodsFromDatabase();

      // Clear form after successful save
      setForm(initialState);
      setSelectedRecordIdx(null);
      setAction('Add');
      setFieldErrors({});
      setGridRows([]);

      setLastAction(action);
      setShowSavePopup(true);
      setIsDirty(false);
      if (setParentDirty) setParentDirty(false);
      
      setTimeout(() => {
        setShowSavePopup(false);
      }, 2000);

    } catch (error) {
      console.error('❌ Error saving business period:', error);
      let errorMessage = 'Failed to save business period';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
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
      const worksheet = workbook.addWorksheet('Outlet Business Periods Export', {
        pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
      });
      
      // Add report title
      const titleRow = worksheet.addRow(['Outlet Business Periods Export Report']);
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
        'ID', 'Applicable From', 'Outlet Code', 'Outlet Name', 'Period Code', 
        'Period Name', 'Short Name', 'Start Time', 'End Time', 'Active Days', 'Status'
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
          record.applicable_from || '',
          record.outlet_code || '',
          getOutletName(record.outlet_code) || '',
          record.period_code || '',
          record.period_name || '',
          record.short_name || '',
          record.start_time || '',
          record.end_time || '',
          formatActiveDays(record.active_days) || '',
          record.is_active ? 'Active' : 'Inactive'
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
      worksheet.mergeCells(`A${footerRowIndex}:K${footerRowIndex}`);
      
      // Generate filename with timestamp
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      const filename = `Outlet_Business_Periods_Export_${year}${month}${day}_${hours}${minutes}${seconds}.xlsx`;
      
      // Save the file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      saveAs(blob, filename);
      
      console.log('✅ Outlet Business Periods Excel file exported successfully:', filename);
      alert(`✅ Professional Outlet Business Periods Excel Report exported successfully!\n\nFilename: ${filename}\n\nFeatures included:\n• Professional report title and timestamp\n• Blue styled headers with white text\n• Alternating row colors for better readability\n• Auto-sized columns with proper formatting\n• Borders and professional styling\n• User footer (Generated by: ${currentUser})\n• Landscape orientation optimized for printing`);
      
    } catch (error) {
      console.error('Outlet Business Periods Excel export error:', error);
      alert('❌ Error exporting Outlet Business Periods to Excel. Please try again.\n\nError: ' + error.message);
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
      doc.text('Outlet Business Periods Export Report', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
      
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
        { header: 'Applicable From', dataKey: 'applicable_from' },
        { header: 'Outlet Code', dataKey: 'outlet_code' },
        { header: 'Outlet Name', dataKey: 'outlet_name' },
        { header: 'Period Code', dataKey: 'period_code' },
        { header: 'Period Name', dataKey: 'period_name' },
        { header: 'Start Time', dataKey: 'start_time' },
        { header: 'End Time', dataKey: 'end_time' },
        { header: 'Active Days', dataKey: 'active_days' },
        { header: 'Status', dataKey: 'status' }
      ];
      
      // Prepare data rows
      const rows = records.map(rec => ({
        id: rec.id || '',
        applicable_from: rec.applicable_from || '',
        outlet_code: rec.outlet_code || '',
        outlet_name: getOutletName(rec.outlet_code) || '',
        period_code: rec.period_code || '',
        period_name: rec.period_name || '',
        start_time: rec.start_time || '',
        end_time: rec.end_time || '',
        active_days: formatActiveDays(rec.active_days) || '',
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
          1: { halign: 'center', cellWidth: 25 }, // Applicable From
          2: { halign: 'center', cellWidth: 20 }, // Outlet Code
          3: { halign: 'left', cellWidth: 30 },   // Outlet Name
          4: { halign: 'center', cellWidth: 20 }, // Period Code
          5: { halign: 'left', cellWidth: 25 },   // Period Name
          6: { halign: 'center', cellWidth: 20 }, // Start Time
          7: { halign: 'center', cellWidth: 20 }, // End Time
          8: { halign: 'left', cellWidth: 35 },   // Active Days
          9: { halign: 'center', cellWidth: 20 }  // Status
        },
        margin: margins,
        pageBreak: 'auto',
        showHead: 'everyPage',
        tableWidth: 'auto',
        horizontalPageBreak: true,
        horizontalPageBreakRepeat: [0, 1, 2, 3] // Always repeat ID, Date, Code, Name columns
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
      
      const filename = `Outlet_Business_Periods_Export_${year}${month}${day}_${hours}${minutes}${seconds}.pdf`;
      
      // Save the PDF
      doc.save(filename);
      
      console.log('✅ Outlet Business Periods PDF file exported successfully:', filename);
      alert(`✅ Professional Outlet Business Periods PDF Report exported successfully!\n\nFilename: ${filename}\n\nFeatures included:\n• Landscape orientation with auto-fit columns\n• Report heading and timestamp\n• Professional blue headers\n• Alternating row colors\n• Page numbers and user footer\n• Smart table layout that prevents content cutoff\n• Text wrapping for long content\n• User footer (Generated by: ${currentUser})`);
      
    } catch (error) {
      console.error('Outlet Business Periods PDF export error:', error);
      alert('❌ Error exporting Outlet Business Periods to PDF. Please try again.\n\nError: ' + error.message);
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
            Outlet Business Periods
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
          ✅ {lastAction === 'Add' ? 'Business Period added successfully!' : 
               lastAction === 'Edit' ? 'Business Period updated successfully!' : 
               lastAction === 'Delete' ? 'Business Period deleted successfully!' : 
               'Business Period saved successfully!'}
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
            minWidth: '600px',
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
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Outlet</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Period</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Time Range</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Days</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, idx) => (
                      <tr key={idx} style={{ background: selectedRecordIdx === idx ? '#e3f2fd' : '#fff' }}>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{getOutletName(record.outlet_code)}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.period_name}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.start_time} - {record.end_time}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatActiveDays(record.active_days)}</td>
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
            {/* Applicable From */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Applicable From *</label>
              <input 
                type="date" 
                name="applicable_from" 
                value={form.applicable_from} 
                onChange={handleChange} 
                style={{
                  width:'75%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.applicable_from ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }} 
              />
              {fieldErrors.applicable_from && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.applicable_from}</span>}
            </div>

            {/* Outlet Name */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Outlet Name *</label>
              <select 
                name="outlet_code" 
                value={form.outlet_code} 
                onChange={handleChange} 
                style={{
                  width:'75%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.outlet_code ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }}
              >
                <option value="">Select Outlet</option>
                {outletRecords && outletRecords.map((outlet, index) => (
                  <option key={index} value={outlet.outlet_code}>
                    {outlet.outlet_code} - {outlet.outlet_name}
                  </option>
                ))}
              </select>
              {fieldErrors.outlet_code && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.outlet_code}</span>}
            </div>

            {/* Period Code */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Period Code *</label>
              <input 
                type="text" 
                name="period_code" 
                value={form.period_code} 
                onChange={handleChange} 
                style={{
                  width:'75%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.period_code ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }} 
                maxLength="10"
                placeholder="e.g., BRK, LUN, DIN"
              />
              {fieldErrors.period_code && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.period_code}</span>}
            </div>

            {/* Period Name */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Period Name *</label>
              <input 
                type="text" 
                name="period_name" 
                value={form.period_name} 
                onChange={handleChange} 
                style={{
                  width:'75%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.period_name ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }} 
                maxLength="50"
                placeholder="e.g., Breakfast, Lunch, Dinner"
              />
              {fieldErrors.period_name && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.period_name}</span>}
            </div>

            {/* Short Name */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Short Name</label>
              <input 
                type="text" 
                name="short_name" 
                value={form.short_name} 
                onChange={handleChange} 
                style={{
                  width:'75%',
                  height:'36px',
                  fontSize:'1.08rem',
                  border: fieldErrors.short_name ? '2px solid #f44336' : '2px solid #bbb',
                  borderRadius:'6px',
                  padding:'0 8px',
                  background:'#fff'
                }} 
                maxLength="10"
                placeholder="Optional short name"
              />
              {fieldErrors.short_name && <span style={{color:'red',fontSize:'0.98rem',marginLeft:'12px'}}>{fieldErrors.short_name}</span>}
            </div>
          </div>

          {/* Right Column */}
          <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
            {/* Time Range */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Time Range *</label>
              <div style={{width:'75%',display:'flex',alignItems:'center',gap:'8px'}}>
                <input 
                  type="time" 
                  name="start_time" 
                  value={form.start_time} 
                  onChange={handleChange} 
                  style={{
                    flex:1,
                    height:'36px',
                    fontSize:'1.08rem',
                    border: fieldErrors.start_time ? '2px solid #f44336' : '2px solid #bbb',
                    borderRadius:'6px',
                    padding:'0 8px',
                    background:'#fff'
                  }} 
                />
                <span style={{fontSize:'1.15rem',fontWeight:'bold',color:'#666'}}>to</span>
                <input 
                  type="time" 
                  name="end_time" 
                  value={form.end_time} 
                  onChange={handleChange} 
                  style={{
                    flex:1,
                    height:'36px',
                    fontSize:'1.08rem',
                    border: fieldErrors.end_time ? '2px solid #f44336' : '2px solid #bbb',
                    borderRadius:'6px',
                    padding:'0 8px',
                    background:'#fff'
                  }} 
                />
              </div>
              {(fieldErrors.start_time || fieldErrors.end_time) && (
                <div style={{marginLeft:'12px'}}>
                  {fieldErrors.start_time && <div style={{color:'red',fontSize:'0.98rem'}}>{fieldErrors.start_time}</div>}
                  {fieldErrors.end_time && <div style={{color:'red',fontSize:'0.98rem'}}>{fieldErrors.end_time}</div>}
                </div>
              )}
            </div>

            {/* Active Days */}
            <div style={{display:'flex',alignItems:'flex-start'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222',paddingTop:'8px'}}>Active Days *</label>
              <div style={{width:'75%'}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:'12px'}}>
                  {[
                    {key: 'sunday', label: 'Sunday'},
                    {key: 'monday', label: 'Monday'},
                    {key: 'tuesday', label: 'Tuesday'},
                    {key: 'wednesday', label: 'Wednesday'},
                    {key: 'thursday', label: 'Thursday'},
                    {key: 'friday', label: 'Friday'},
                    {key: 'saturday', label: 'Saturday'}
                  ].map((day, index) => (
                    <label key={index} style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer'}}>
                      <input
                        type="checkbox"
                        name={`day_${day.key}`}
                        checked={form.active_days[day.key] || false}
                        onChange={handleChange}
                        style={{width:'18px',height:'18px'}}
                      />
                      <span style={{fontSize:'1rem',color:'#333'}}>{day.label}</span>
                    </label>
                  ))}
                </div>
                {fieldErrors.active_days && <div style={{color:'red',fontSize:'0.98rem',marginTop:'8px'}}>{fieldErrors.active_days}</div>}
              </div>
            </div>

            {/* Active Status */}
            <div style={{display:'flex',alignItems:'center'}}>
              <label style={{width:'200px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Active Status</label>
              <div style={{display:'flex',alignItems:'center',marginLeft:'8px'}}>
                <input 
                  type="checkbox" 
                  name="is_active" 
                  checked={form.is_active} 
                  onChange={handleChange} 
                  style={{width:'24px',height:'24px'}} 
                />
                <span style={{marginLeft:'8px',fontSize:'1rem',color:'#666'}}>Period is active</span>
              </div>
            </div>

            {/* Add to Grid Button */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end'}}>
              <button
                type="button"
                onClick={handleAddToGrid}
                style={{
                  background:'#4caf50',
                  color:'white',
                  border:'none',
                  padding:'10px 20px',
                  borderRadius:'6px',
                  fontSize:'1rem',
                  fontWeight:'bold',
                  cursor:'pointer',
                  transition:'background 0.2s'
                }}
                onMouseOver={e=>e.currentTarget.style.background='#45a049'}
                onMouseOut={e=>e.currentTarget.style.background='#4caf50'}
              >
                ➕ Add to Grid
              </button>
            </div>

            {/* Time Overlap Error */}
            {fieldErrors.time_overlap && (
              <div style={{
                background:'#ffebee',
                border:'1px solid #f44336',
                borderRadius:'6px',
                padding:'12px',
                color:'#d32f2f'
              }}>
                ⚠️ {fieldErrors.time_overlap}
              </div>
            )}
          </div>
        </form>

        {/* Grid Section */}
        {gridRows.length > 0 && (
          <div style={{marginBottom:'24px'}}>
            <h3 style={{marginBottom:'16px',color:'#333',fontSize:'1.3rem'}}>Periods to Save</h3>
            <div style={{overflowX:'auto',border:'2px solid #ddd',borderRadius:'8px'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'#f5f5f5'}}>
                    <th style={{border:'1px solid #ddd',padding:'12px',textAlign:'left'}}>Outlet</th>
                    <th style={{border:'1px solid #ddd',padding:'12px',textAlign:'left'}}>Period</th>
                    <th style={{border:'1px solid #ddd',padding:'12px',textAlign:'center'}}>Start Time</th>
                    <th style={{border:'1px solid #ddd',padding:'12px',textAlign:'center'}}>End Time</th>
                    <th style={{border:'1px solid #ddd',padding:'12px',textAlign:'left'}}>Active Days</th>
                    <th style={{border:'1px solid #ddd',padding:'12px',textAlign:'center'}}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {gridRows.map((row, index) => (
                    <tr key={index} style={{background:'#fff'}}>
                      <td style={{border:'1px solid #ddd',padding:'10px'}}>{getOutletName(row.outlet_code)}</td>
                      <td style={{border:'1px solid #ddd',padding:'10px'}}>{row.period_name}</td>
                      <td style={{border:'1px solid #ddd',padding:'10px',textAlign:'center'}}>{row.start_time}</td>
                      <td style={{border:'1px solid #ddd',padding:'10px',textAlign:'center'}}>{row.end_time}</td>
                      <td style={{border:'1px solid #ddd',padding:'10px'}}>{formatActiveDays(row.active_days)}</td>
                      <td style={{border:'1px solid #ddd',padding:'10px',textAlign:'center'}}>
                        <button
                          onClick={() => removeFromGrid(index)}
                          style={{
                            background:'#f44336',
                            color:'white',
                            border:'none',
                            padding:'4px 8px',
                            borderRadius:'4px',
                            cursor:'pointer',
                            fontSize:'0.9rem'
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Records Table */}
        <div style={{flex:1,display:'flex',flexDirection:'column',minHeight:0}}>
          <div style={{fontWeight:'bold',fontSize:'1.5rem',color:'#222',marginBottom:'16px'}}>
            Business Periods ({records ? records.length : 0})
          </div>
          <div style={{flex:1,overflowY:'auto',overflowX:'auto',border:'1px solid #ddd',borderRadius:'8px'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.9rem',minWidth:'1000px'}}>
              <thead>
                <tr style={{background:'#f5f5f5',position:'sticky',top:0,zIndex:1}}>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'60px'}}>S.No</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'120px'}}>Outlet</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'100px'}}>Period Code</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'150px'}}>Period Name</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center',fontWeight:'bold',background:'#f5f5f5',minWidth:'100px'}}>Start Time</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center',fontWeight:'bold',background:'#f5f5f5',minWidth:'100px'}}>End Time</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'left',fontWeight:'bold',background:'#f5f5f5',minWidth:'200px'}}>Active Days</th>
                  <th style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center',fontWeight:'bold',background:'#f5f5f5',minWidth:'80px'}}>Status</th>
                </tr>
              </thead>
              <tbody>
                {records && records.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{border:'1px solid #ddd',padding:'20px',textAlign:'center',color:'#888',fontStyle:'italic',background:'#fff'}}>No business periods found</td>
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
                      <td style={{border:'1px solid #ddd',padding:'12px 8px'}}>{getOutletName(record.outlet_code)}</td>
                      <td style={{border:'1px solid #ddd',padding:'12px 8px'}}>{record.period_code}</td>
                      <td style={{border:'1px solid #ddd',padding:'12px 8px'}}>{record.period_name}</td>
                      <td style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center'}}>{record.start_time}</td>
                      <td style={{border:'1px solid #ddd',padding:'12px 8px',textAlign:'center'}}>{record.end_time}</td>
                      <td style={{border:'1px solid #ddd',padding:'12px 8px'}}>{formatActiveDays(record.active_days)}</td>
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
    </div>
  );
};

export default OutletBusinessPeriods;