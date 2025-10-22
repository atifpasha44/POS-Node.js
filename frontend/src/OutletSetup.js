import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Dashboard.css';
import InfoTooltip from './InfoTooltip';
import { usePropertyCodes, getApplicablePropertyCodes } from './propertyCodesUtils';

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

export default function OutletSetup({ setParentDirty, records, setRecords }) {
  // Database-first: Load property codes directly from database
  const { propertyCodes, loading: loadingPropertyCodes } = usePropertyCodes();

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

  // Function to filter Property Codes based on current date logic - now using utility
  const getApplicablePropertyCodesLocal = () => getApplicablePropertyCodes(propertyCodes);


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

  // Load existing outlets from database when component mounts
  useEffect(() => {
    const loadOutletsFromDatabase = async () => {
      try {
        console.log('🔄 Loading outlets from database...');
        const response = await axios.get('http://localhost:3001/api/outlet-setup');
        
        if (response.data.success && response.data.data.length > 0) {
          // Transform API response to match component format
          const formattedOutlets = response.data.data.map((outlet, index) => ({
            id: outlet.id || index + 1,
            property: outlet.property || 'DEFAULT',
            applicable_from: outlet.applicable_from || new Date().toISOString().split('T')[0],
            outlet_code: outlet.outlet_code,
            outlet_name: outlet.outlet_name,
            short_name: outlet.short_name,
            outlet_type: outlet.outlet_type || 'Restaurant',
            item_price_level: outlet.outlet_set || 'Price 1',
            check_prefix: outlet.check_prefix || '',
            check_format: outlet.check_format || '',
            receipt_format: outlet.receipt_format || '',
            kitchen_format: outlet.kitchen_format || '',
            inactive: outlet.is_active === 0,
            options: {
              cash: true,
              card: true,
              company: false,
              room_guest: false,
              staff: false,
              bill_on_hold: false,
              credit: false,
              void: false
            }
          }));
          
          setRecords(formattedOutlets);
          console.log('✅ Loaded outlets from database:', formattedOutlets.length, 'records');
        } else {
          console.log('ℹ️ No outlets found in database, using empty state');
        }
      } catch (error) {
        console.warn('⚠️ Failed to load outlets from database:', error.message);
        console.log('📊 Using existing records or empty state');
      }
    };

    loadOutletsFromDatabase();
  }, []); // Run once on mount

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

    try {
      // Prepare data for API call - match backend schema exactly
      const outletData = {
        property: form.property,                    // ✅ Required field
        applicable_from: form.applicable_from,
        outlet_code: form.outlet_code,
        outlet_name: form.outlet_name,
        short_name: form.short_name,
        outlet_type: form.outlet_type,
        item_price_level: form.item_price_level,    // ✅ Correct field name
        check_prefix: form.check_prefix,            // ✅ Correct field name
        check_format: form.check_format,            // ✅ Added missing field
        receipt_format: form.receipt_format,        // ✅ Added missing field
        kitchen_format: form.kitchen_format,        // ✅ Added missing field
        options: form.options,                      // ✅ Send as object, not JSON string
        inactive: form.inactive
      };

      let response;
      if (action === 'Edit' && selectedRecordIdx !== null) {
        // Update existing record via API
        const recordId = records[selectedRecordIdx]?.id || selectedRecordIdx + 1;
        response = await axios.put(`http://localhost:3001/api/outlet-setup/${recordId}`, outletData);
        console.log('✅ Outlet updated successfully:', response.data);
        
        // Update local state
        setRecords(prev => {
          const updated = [...prev];
          updated[selectedRecordIdx] = { ...form, id: recordId };
          return updated;
        });
      } else {
        // Create new record via API
        response = await axios.post('http://localhost:3001/api/outlet-setup', outletData);
        console.log('✅ Outlet created successfully:', response.data);
        
        // Update local state
        setRecords(prev => [...prev, { ...form, id: response.data.insertId }]);
      }

      // Show success message
      setShowSavePopup(true);
      setTimeout(() => setShowSavePopup(false), 1800);
      setIsDirty(false);
      if (setParentDirty) setParentDirty(false);
      setSelectedRecordIdx(null);
      setForm(initialState);
      
    } catch (error) {
      console.error('❌ Error saving outlet:', error);
      alert(`Failed to save outlet: ${error.response?.data?.message || error.message}`);
    }
  };

// Confirmed delete handler
const handleDeleteConfirmed = async () => {
  deletePendingRef.current = false;
  if (selectedRecordIdx === null) return;
  const record = records[selectedRecordIdx];
  
  try {
    // Call backend delete API with correct endpoint
    const recordId = record?.id || selectedRecordIdx + 1;
    await axios.delete(`/api/outlet-setup/${recordId}`);
    console.log('✅ Outlet deleted successfully');
    
    // Update local state
    setRecords(prev => prev.filter((_, i) => i !== selectedRecordIdx));
    setShowSavePopup(true);
    setTimeout(() => setShowSavePopup(false), 1800);
    setForm(initialState);
    setSelectedRecordIdx(null);
    setIsDirty(false);
    setAction('Add');
    if (setParentDirty) setParentDirty(false);
    setShowDeleteConfirm(false);
  } catch (err) {
    console.error('❌ Error deleting outlet:', err);
    alert(`Failed to delete record: ${err.response?.data?.message || err.message}`);
    setShowDeleteConfirm(false);
  }
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
        
        // Add footer with user information
        const currentRowNumber = worksheet.rowCount + 2; // Add some spacing
        
        // Get current user (this could be enhanced to get from authentication context)
        const currentUser = localStorage.getItem('currentUser') || 
                           sessionStorage.getItem('currentUser') || 
                           'System Administrator'; // Default fallback
        
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
        alert(`✅ Formatted Outlet Setup Excel Report exported successfully!\n\nFilename: ${filename}\n\nFeatures included:\n• Report heading at top\n• Professional blue headers\n• Alternating row colors\n• Complete table formatting\n• Auto-sized columns\n• User footer (Generated by: ${currentUser})`);
        
      } catch (error) {
        console.error('Excel export error:', error);
        alert('❌ Error exporting to Excel. Please try again.\n\nError: ' + error.message);
      }
      
    } else if (type === 'PDF') {
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
        doc.text('Outlet Setup Export Report', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
        
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
          { header: 'Property', dataKey: 'property' },
          { header: 'Applicable From', dataKey: 'applicable_from' },
          { header: 'Outlet Type', dataKey: 'outlet_type' },
          { header: 'Outlet Code', dataKey: 'outlet_code' },
          { header: 'Outlet Name', dataKey: 'outlet_name' },
          { header: 'Item Price Level', dataKey: 'item_price_level' },
          { header: 'CGST %', dataKey: 'cgst_percentage' },
          { header: 'SGST %', dataKey: 'sgst_percentage' },
          { header: 'Service Charge %', dataKey: 'service_charge_percentage' },
          { header: 'Address', dataKey: 'address' }
        ];
        
        // Prepare data rows
        const rows = exportData.map(rec => ({
          id: rec.id || '',
          property: rec.property || '',
          applicable_from: rec.applicable_from ? new Date(rec.applicable_from).toLocaleDateString('en-GB', { 
            day: '2-digit', month: '2-digit', year: 'numeric' 
          }) : '',
          outlet_type: rec.outlet_type || '',
          outlet_code: rec.outlet_code || '',
          outlet_name: rec.outlet_name || '',
          item_price_level: rec.item_price_level || '',
          cgst_percentage: rec.cgst_percentage || '',
          sgst_percentage: rec.sgst_percentage || '',
          service_charge_percentage: rec.service_charge_percentage || '',
          address: rec.address || ''
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
            1: { halign: 'left' },   // Property
            2: { halign: 'center' }, // Applicable From
            3: { halign: 'left' },   // Outlet Type
            4: { halign: 'center' }, // Outlet Code
            5: { halign: 'left' },   // Outlet Name
            6: { halign: 'center' }, // Item Price Level
            7: { halign: 'center' }, // CGST %
            8: { halign: 'center' }, // SGST %
            9: { halign: 'center' }, // Service Charge %
            10: { halign: 'left' }   // Address
          },
          margin: margins,
          pageBreak: 'auto',
          showHead: 'everyPage',
          tableWidth: 'auto',
          horizontalPageBreak: true,
          horizontalPageBreakRepeat: [0, 1, 2, 4] // Always repeat ID, Property, Date, and Outlet Code columns
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
        
        const filename = `Outlet_Setup_Export_${year}${month}${day}_${hours}${minutes}${seconds}.pdf`;
        
        // Save the PDF
        doc.save(filename);
        
        console.log('✅ Outlet Setup PDF file exported successfully:', filename);
        alert(`✅ Professional Outlet Setup PDF Report exported successfully!\n\nFilename: ${filename}\n\nFeatures included:\n• Landscape orientation with auto-fit columns\n• Report heading and timestamp\n• Professional blue headers\n• Alternating row colors\n• Page numbers and user footer\n• Smart table layout that prevents content cutoff\n• Text wrapping for long content\n• User footer (Generated by: ${currentUser})`);
        
      } catch (error) {
        console.error('Outlet Setup PDF export error:', error);
        alert('❌ Error exporting Outlet Setup to PDF. Please try again.\n\nError: ' + error.message);
      }
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
    
    // Fix property field mapping issue - handle DEFAULT and other invalid values
    let propertyValue = selectedRecord.property;
    
    // If property is DEFAULT or empty, try to get the first available property code
    if (!propertyValue || propertyValue === 'DEFAULT') {
      const applicableCodes = getApplicablePropertyCodesLocal();
      if (applicableCodes.length > 0) {
        propertyValue = applicableCodes[0].property_code || applicableCodes[0].code;
        console.log('⚠️ Property was DEFAULT/empty, auto-selecting first available:', propertyValue);
      } else {
        propertyValue = ''; // This will show "Select Property" which is better than DEFAULT
        console.log('⚠️ No property codes available, will show dropdown for selection');
      }
    }
    
    const formattedRecord = {
      ...selectedRecord,
      applicable_from: formattedDate,
      property: propertyValue
    };
    
    console.log('🔍 Selected record for editing:', {
      original: selectedRecord,
      formatted: formattedRecord,
      propertyMapped: `${selectedRecord.property || 'undefined'} -> ${formattedRecord.property}`,
      reason: selectedRecord.property === 'DEFAULT' ? 'Fixed DEFAULT value' : 'Direct mapping'
    });
    
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
          {(() => {
            const softwareControlEnabled = localStorage.getItem('softwareControlEnabled');
            return JSON.parse(softwareControlEnabled || 'false') && (
              <InfoTooltip 
                formName="Outlet Setup"
                mainTable="it_conf_outset"
                linkedTables={["it_conf_outses", "it_conf_outordtyp"]}
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
            <select name="property" value={form.property} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: (action === 'Edit' || action === 'Search') ? '#f3f3f3' : '#fff'}} disabled={action === 'Edit' || action === 'Search' || loadingPropertyCodes} required>
              <option value="">{loadingPropertyCodes ? 'Loading properties...' : 'Select Property'}</option>
              {(() => {
                if (loadingPropertyCodes) return null;
                const applicableCodes = getApplicablePropertyCodesLocal();
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
