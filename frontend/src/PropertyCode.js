import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';
import InfoTooltip from './InfoTooltip';

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
  group_name: '', local_currency: '', currency_format: '', symbol: '', decimal_places: '', date_format: '', round_off: '', property_logo: null
};

export default function PropertyCode() {
  // Database-first state management
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Load data from database on component mount
  useEffect(() => {
    const loadPropertyCodesFromDatabase = async () => {
      try {
        setLoading(true);
        console.log('🔄 Loading Property Codes from database...');
        
        try {
          const response = await axios.get('http://localhost:3001/api/property-codes');
          if (response.data && response.data.success && Array.isArray(response.data.data)) {
            const sortedRecords = response.data.data.sort((a, b) => {
              const dateA = new Date(a.applicable_from);
              const dateB = new Date(b.applicable_from);
              return dateB - dateA; // Most recent first
            });
            setRecords(sortedRecords);
            console.log('✅ Loaded property codes from database:', sortedRecords.length, 'records');
            return;
          }
        } catch (apiError) {
          console.log('⚠️ Backend not available, using fallback mock data...');
        }
        
        // Fallback mock data when backend is not available
        const mockData = [
          {
            id: 1,
            applicable_from: '2024-01-01',
            property_code: 'HOTEL001',
            property_name: 'ABC Hotel',
            nick_name: 'ABC Hotel',
            owner_name: 'Hotel Owner',
            address_name: '123 Main Street, City',
            gst_number: 'GST123456789',
            pan_number: 'ABCDE1234F',
            group_name: 'Hotel Group',
            local_currency: 'USD',
            currency_format: 'en-US',
            symbol: '$',
            decimal_places: 2,
            date_format: 'MM/DD/YYYY',
            round_off: '0.01',
            property_logo: ''
          },
          {
            id: 2,
            applicable_from: '2024-02-01',
            property_code: 'REST001',
            property_name: 'Downtown Restaurant',
            nick_name: 'Downtown Restaurant',
            owner_name: 'Restaurant Owner',
            address_name: '456 Food Street, Downtown',
            gst_number: 'GST987654321',
            pan_number: 'FGHIJ5678K',
            group_name: 'Restaurant Group',
            local_currency: 'USD',
            currency_format: 'en-US',
            symbol: '$',
            decimal_places: 2,
            date_format: 'MM/DD/YYYY',
            round_off: '0.01',
            property_logo: ''
          },
          {
            id: 3,
            applicable_from: '2024-03-01',
            property_code: 'CAFE001',
            property_name: 'City Cafe',
            nick_name: 'City Cafe',
            owner_name: 'Cafe Owner',
            address_name: '789 Coffee Lane, City Center',
            gst_number: 'GST456789123',
            pan_number: 'KLMNO9012P',
            group_name: 'Cafe Group',
            local_currency: 'USD',
            currency_format: 'en-US',
            symbol: '$',
            decimal_places: 2,
            date_format: 'MM/DD/YYYY',
            round_off: '0.01',
            property_logo: ''
          }
        ];
        
        setRecords(mockData);
        console.log('✅ Loaded fallback mock data:', mockData.length, 'records');
        
      } catch (error) {
        console.error('❌ Error loading property codes:', error);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    loadPropertyCodesFromDatabase();
  }, []); // Load once on mount

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
      setFieldErrors(errors => ({...errors, [name]: ''}));
    }
  };
  // Only clear the form and selection, never touch records array
  const handleClear = () => {
    setForm(initialState);
    setLogoPreview(null);
    setIsDirty(false);
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
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
        
        // Update existing record via API or fallback to local update
        try {
          const response = await axios.put(`http://localhost:3001/api/property-codes/${original.id}`, form);
          if (response.data.success) {
            setShowSavePopup(true);
            setTimeout(() => setShowSavePopup(false), 1800);
            // Refresh data from backend
            await fetchRecords();
            resetForm();
          }
        } catch (error) {
          console.log('⚠️ Backend not available, updating locally...');
          // Fallback: Update record locally
          setRecords(currentRecords => {
            const updatedRecords = [...currentRecords];
            updatedRecords[selectedRecordIdx] = { ...original, ...form };
            return updatedRecords;
          });
          setShowSavePopup(true);
          setTimeout(() => setShowSavePopup(false), 1800);
          resetForm();
        }
      } else if (action === 'Delete' && selectedRecordIdx !== null) {
        // Delete record via API or fallback to local delete
        const original = records[selectedRecordIdx];
        try {
          const response = await axios.delete(`http://localhost:3001/api/property-codes/${original.id}`);
          if (response.data.success) {
            setShowSavePopup(true);
            setTimeout(() => setShowSavePopup(false), 1800);
            // Refresh data from backend
            await fetchRecords();
            resetForm();
            setAction('Add');
          }
        } catch (error) {
          console.log('⚠️ Backend not available, deleting locally...');
          // Fallback: Remove record locally
          setRecords(currentRecords => currentRecords.filter((_, idx) => idx !== selectedRecordIdx));
          setShowSavePopup(true);
          setTimeout(() => setShowSavePopup(false), 1800);
          resetForm();
          setAction('Add');
        }
      } else {
        // Add new record via API or fallback to local add
        console.log('Adding new record:', form);
        try {
          const response = await axios.post('http://localhost:3001/api/property-codes', form);
          console.log('Add response:', response.data);
          if (response.data.success) {
            setShowSavePopup(true);
            setTimeout(() => setShowSavePopup(false), 1800);
            // Refresh data from backend
            await fetchRecords();
            resetForm();
          }
        } catch (apiError) {
          console.log('⚠️ Backend not available, adding locally...');
          // Fallback: Add record locally
          const newRecord = {
            id: Date.now(), // Simple ID generation for local storage
            ...form
          };
          setRecords(currentRecords => [newRecord, ...currentRecords]);
          setShowSavePopup(true);
          setTimeout(() => setShowSavePopup(false), 1800);
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
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFieldErrors({});
    setUploadStatus('');
    setAction('Add'); // Reset to Add mode after save
  };

  // Function to refresh records from database after operations
  const fetchRecords = async () => {
    try {
      console.log('🔄 Refreshing property codes from database...');
      try {
        const response = await axios.get('http://localhost:3001/api/property-codes');
        console.log('📊 Refreshed records:', response.data);
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          // Custom sorting: Current Date → Future Dates → Past Dates
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset time for accurate date comparison
          
          const sortedRecords = response.data.data.sort((a, b) => {
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
        console.log('✅ Property codes refreshed, count:', sortedRecords.length);
      } else {
        console.error('❌ Failed to refresh property codes:', response.data.message || 'Invalid response format');
        setRecords([]);
      }
    } catch (apiError) {
      console.log('⚠️ Backend not available during refresh, keeping current data...');
      // Don't change records if backend is not available
    }
  } catch (error) {
    console.error('❌ Error refreshing property codes:', error);
    // Don't show alert for refresh errors, just log them
    console.log('Refresh failed, keeping current data');
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
    setSelectedRecordIdx(null);
  };
  const handleEdit = async () => {
    setAction('Edit');
    setSelectedRecordIdx(null);
    
    // Fetch fresh data and apply sorting
    try {
      console.log('🔄 Fetching fresh records for edit modal...');
      const response = await axios.get('http://localhost:3001/api/property-codes');
      const freshData = response.data;
      
      console.log('📊 Fresh data received (count):', freshData.length);
      console.log('📊 Fresh data details:', freshData);
      
      // Debug: Show all dates in the dataset for verification
      console.log('🔍 All dates in dataset:');
      freshData.forEach((record, index) => {
        const localDate = getCurrentDateOnly(record.applicable_from);
        console.log(`  ${index}: ${record.applicable_from} -> Local: ${localDate.toLocaleDateString('en-GB')} (${record.property_name || record.property_code})`);
      });
      
      // Apply sorting logic: Latest Record → Future → Past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      console.log('📅 Today (for comparison):', today.toISOString(), '| Local:', today.toLocaleDateString('en-GB'));
      
      // CRITICAL FIX: Ensure we're working with local dates to avoid timezone issues
      const getCurrentDateOnly = (dateStr) => {
        const date = new Date(dateStr);
        // Create new date in local timezone to avoid timezone conversion issues
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      };
      
      // Find the maximum/latest date across all records using local date comparison
      const latestDate = freshData.reduce((latest, record) => {
        const recordDate = getCurrentDateOnly(record.applicable_from);
        console.log(`📊 Comparing: ${recordDate.toLocaleDateString('en-GB')} vs current max: ${latest.toLocaleDateString('en-GB')}`);
        return recordDate > latest ? recordDate : latest;
      }, new Date('1900-01-01'));
      
      console.log('📈 FINAL Latest/Maximum date in dataset:', latestDate.toISOString(), '| Local:', latestDate.toLocaleDateString('en-GB'));
      
      // Verify which record has this latest date
      const latestRecord = freshData.find(record => {
        const recordDate = getCurrentDateOnly(record.applicable_from);
        return recordDate.getTime() === latestDate.getTime();
      });
      console.log('🎯 Latest record details:', latestRecord ? `${latestRecord.applicable_from} (${latestRecord.property_name || latestRecord.property_code})` : 'Not found');
      
      // Enhanced sorting logic with detailed logging and proper date handling
      const sortedRecords = freshData.sort((a, b) => {
        // Use local date parsing to avoid timezone issues
        let dateA = getCurrentDateOnly(a.applicable_from);
        let dateB = getCurrentDateOnly(b.applicable_from);
        
        // Categorize dates using local date comparison
        const isLatestA = dateA.getTime() === latestDate.getTime();
        const isLatestB = dateB.getTime() === latestDate.getTime();
        const isCurrentA = dateA.getTime() === today.getTime();
        const isCurrentB = dateB.getTime() === today.getTime();
        const isFutureA = dateA > today;
        const isFutureB = dateB > today;
        const isPastA = dateA < today;
        const isPastB = dateB < today;
        
        console.log(`🔍 Record A: ${a.applicable_from} -> ${dateA.toLocaleDateString('en-GB')} (${a.property_name || a.property_code}) - Latest=${isLatestA}, Current=${isCurrentA}, Future=${isFutureA}, Past=${isPastA}`);
        console.log(`🔍 Record B: ${b.applicable_from} -> ${dateB.toLocaleDateString('en-GB')} (${b.property_name || b.property_code}) - Latest=${isLatestB}, Current=${isCurrentB}, Future=${isFutureB}, Past=${isPastB}`);
        
        // REQUIREMENT: Priority order based on user specification:
        // 1. Latest/Maximum date record (Select button enabled) - TOP
        // 2. Future-dated records (Select button enabled) 
        // 3. Current date records (Select button enabled)
        // 4. Past records (Read Only)
        const getPriority = (isLatest, isCurrent, isFuture, isPast) => {
          if (isLatest) return 0;   // Latest/Maximum date record always first
          if (isFuture && !isLatest) return 1;   // Future dates second (but not latest)
          if (isCurrent && !isLatest) return 2;  // Current date third (if not latest)
          if (isPast) return 3;     // Past dates last (Read Only)
          return 4;
        };
        
        const priorityA = getPriority(isLatestA, isCurrentA, isFutureA, isPastA);
        const priorityB = getPriority(isLatestB, isCurrentB, isFutureB, isPastB);
        
        console.log(`⚡ Priority A: ${priorityA}, Priority B: ${priorityB}`);
        
        // If different priorities, sort by priority
        if (priorityA !== priorityB) {
          const result = priorityA - priorityB;
          console.log(`📊 Different priorities, result: ${result} (${result < 0 ? 'A first' : 'B first'})`);
          return result;
        }
        
        // If same priority, sort within category
        let result = 0;
        if (priorityA === 0) {
          result = 0; // Latest records (should be unique, but just in case)
          console.log(`📊 Both latest records, result: ${result}`);
        } else if (priorityA === 1) {
          result = 0; // Current dates (should be unique, but just in case)
          console.log(`📊 Both current records, result: ${result}`);
        } else if (priorityA === 2) {
          result = dateA - dateB; // Future dates: nearest future first
          console.log(`📊 Both future records, result: ${result} (${result < 0 ? 'A first (nearer future)' : 'B first (nearer future)'})`);
        } else {
          result = dateB - dateA; // Past dates: most recent past first
          console.log(`📊 Both past records, result: ${result} (${result < 0 ? 'A first (more recent past)' : 'B first (more recent past)'})`);
        }
        
        return result;
      });
      
      console.log('✅ Final sorted records:');
      sortedRecords.forEach((record, index) => {
        const recordDate = getCurrentDateOnly(record.applicable_from);
        const isLatest = recordDate.getTime() === latestDate.getTime();
        const isCurrent = recordDate.getTime() === today.getTime();
        const isFuture = recordDate > today;
        const isPast = recordDate < today;
        
        console.log(`${index + 1}. ${record.applicable_from} (${record.property_name || record.property_code}) - ${isLatest ? 'LATEST' : isCurrent ? 'CURRENT' : isFuture ? 'FUTURE' : 'PAST'} | Local Date: ${recordDate.toLocaleDateString('en-GB')}`);
      });
      
      setRecords(sortedRecords);
    } catch (error) {
      console.error('❌ Error fetching records for edit:', error);
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

  // Records are now loaded directly on component mount via useEffect above


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
        
        const filename = `Property_Setup_Export_${year}${month}${day}_${hours}${minutes}${seconds}.xlsx`;
        
        // Generate buffer and save file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        saveAs(blob, filename);
        
        console.log('✅ Property Setup Excel file exported successfully:', filename);
        alert(`✅ Formatted Property Setup Excel Report exported successfully!\n\nFilename: ${filename}\n\nFeatures included:\n• Report heading at top\n• Professional blue headers\n• Alternating row colors\n• Complete table formatting\n• Auto-sized columns\n• User footer (Generated by: ${currentUser})`);
        
      } catch (error) {
        console.error('Property Setup Excel export error:', error);
        alert('❌ Error exporting Property Setup to Excel. Please try again.\n\nError: ' + error.message);
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
        doc.text('Property Setup Export Report', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
        
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
          { header: 'Property Code', dataKey: 'property_code' },
          { header: 'Property Name', dataKey: 'property_name' },
          { header: 'Nick Name', dataKey: 'nick_name' },
          { header: 'Owner Name', dataKey: 'owner_name' },
          { header: 'Address Name', dataKey: 'address_name' },
          { header: 'GST Number', dataKey: 'gst_number' },
          { header: 'PAN Number', dataKey: 'pan_number' },
          { header: 'Group Name', dataKey: 'group_name' },
          { header: 'Local Currency', dataKey: 'local_currency' },
          { header: 'Currency Format', dataKey: 'currency_format' },
          { header: 'Symbol', dataKey: 'symbol' },
          { header: 'Decimal', dataKey: 'decimal' },
          { header: 'Date Format', dataKey: 'date_format' },
          { header: 'Round Off', dataKey: 'round_off' }
        ];
        
        // Prepare data rows
        const rows = exportData.map(rec => ({
          id: rec.id || '',
          applicable_from: rec.applicable_from ? new Date(rec.applicable_from).toLocaleDateString('en-GB', { 
            day: '2-digit', month: '2-digit', year: 'numeric' 
          }) : '',
          property_code: rec.property_code || '',
          property_name: rec.property_name || '',
          nick_name: rec.nick_name || '',
          owner_name: rec.owner_name || '',
          address_name: rec.address_name || '',
          gst_number: rec.gst_number || '',
          pan_number: rec.pan_number || '',
          group_name: rec.group_name || '',
          local_currency: rec.local_currency || '',
          currency_format: rec.currency_format || '',
          symbol: rec.symbol || '',
          decimal: rec.decimal || '',
          date_format: rec.date_format || '',
          round_off: rec.round_off || ''
        }));
        
        // Calculate available width for the table
        const pageWidth = doc.internal.pageSize.getWidth();
        const margins = { left: 10, right: 10 };
        const availableWidth = pageWidth - margins.left - margins.right;
        
        // Create the table with professional styling and auto-fit columns
        autoTable(doc, {
          columns: columns,
          body: rows,
          startY: 35,
          theme: 'grid',
          styles: {
            fontSize: 7, // Reduced font size to fit more content
            cellPadding: 2,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            overflow: 'linebreak', // Allow text wrapping
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
            1: { halign: 'center' }, // Applicable From
            2: { halign: 'center' }, // Property Code
            3: { halign: 'left' },   // Property Name
            4: { halign: 'left' },   // Nick Name
            5: { halign: 'left' },   // Owner Name
            6: { halign: 'left' },   // Address Name
            7: { halign: 'center' }, // GST Number
            8: { halign: 'center' }, // PAN Number
            9: { halign: 'left' },   // Group Name
            10: { halign: 'center' }, // Local Currency
            11: { halign: 'center' }, // Currency Format
            12: { halign: 'center' }, // Symbol
            13: { halign: 'center' }, // Decimal
            14: { halign: 'center' }, // Date Format
            15: { halign: 'center' }  // Round Off
          },
          margin: margins,
          pageBreak: 'auto',
          showHead: 'everyPage',
          tableWidth: 'auto', // Auto-fit table to available width
          // Split table across pages if too wide
          horizontalPageBreak: true,
          horizontalPageBreakRepeat: [0, 1, 2] // Always repeat ID, Date, and Property Code columns
        });
        
        // Get current user for footer
        const currentUser = localStorage.getItem('currentUser') || 
                           sessionStorage.getItem('currentUser') || 
                           'System Administrator'; // Default fallback
        
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
        
        const filename = `Property_Setup_Export_${year}${month}${day}_${hours}${minutes}${seconds}.pdf`;
        
        // Save the PDF
        doc.save(filename);
        
        console.log('✅ Property Setup PDF file exported successfully:', filename);
        alert(`✅ Professional Property Setup PDF Report exported successfully!\n\nFilename: ${filename}\n\nFeatures included:\n• Landscape orientation with auto-fit columns\n• Report heading and timestamp\n• Professional blue headers\n• Alternating row colors\n• Page numbers and user footer\n• Smart table layout that prevents content cutoff\n• Text wrapping for long content\n• User footer (Generated by: ${currentUser})`);
        
      } catch (error) {
        console.error('Property Setup PDF export error:', error);
        alert('❌ Error exporting Property Setup to PDF. Please try again.\n\nError: ' + error.message);
      }
    }
  };

  // Show loading indicator while fetching data
  if (loading) {
    return (
      <div style={{
        background:'#fff',border:'2.5px solid #222',borderRadius:'16px',
        boxShadow:'0 2px 12px rgba(0,0,0,0.10)',width:'100%',maxWidth:'1200px',
        margin:'32px auto',padding:'40px',height:'calc(100vh - 120px)',
        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'
      }}>
        <div style={{fontSize:'24px',marginBottom:'16px'}}>🔄</div>
        <div style={{fontSize:'18px',fontWeight:'bold',color:'#666'}}>Loading Property Codes...</div>
        <div style={{fontSize:'14px',color:'#999',marginTop:'8px'}}>Fetching data from database</div>
      </div>
    );
  }

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
          {(() => {
            const softwareControlEnabled = localStorage.getItem('softwareControlEnabled');
            return JSON.parse(softwareControlEnabled || 'false') && (
              <InfoTooltip 
                formName="Property Code"
                mainTable="it_conf_property"
                linkedTables={[]}
              />
            );
          })()}
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
              Current Date: {new Date().toLocaleDateString('en-GB')} | Records sorted: Latest Record → Future → Past
            </div>
          </div>
          {action === 'Search' ? (
            <div style={{padding:'12px',background:'#e8f5e9',borderRadius:'8px',marginBottom:'16px',fontSize:'0.95rem',color:'#2e7d32'}}>
              📖 <strong>Search Mode:</strong> View all historical and future configurations for this Property Code. 
              Selected records will be displayed in read-only mode to prevent accidental changes.
            </div>
          ) : (
            <div style={{padding:'12px',background:'#e3f2fd',borderRadius:'8px',marginBottom:'16px',fontSize:'0.95rem',color:'#1976d2'}}>
              ✏️ <strong>Edit Mode:</strong> The latest/maximum date record shows "Select" button (top of list). 
              Future-dated records also show "Select" button. Other past records are "Read Only" (grayed out).
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
                  // Get today's date for comparison
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  // Helper function for local date parsing (matching the sort logic)
                  const getCurrentDateOnly = (dateStr) => {
                    const date = new Date(dateStr);
                    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
                  };
                  
                  // Find the maximum/latest date across all records using same logic as sort
                  const latestDate = records.reduce((latest, record) => {
                    const recordDate = getCurrentDateOnly(record.applicable_from);
                    return recordDate > latest ? recordDate : latest;
                  }, new Date('1900-01-01'));
                  
                  return records.map((rec, idx) => {
                    const formattedDate = rec.applicable_from ? 
                      new Date(rec.applicable_from).toLocaleDateString('en-GB', { 
                        day: '2-digit', month: '2-digit', year: 'numeric' 
                      }) : rec.applicable_from;
                    
                    // Parse the record date using same logic as sort function
                    let recDate;
                    if (rec.applicable_from) {
                      recDate = getCurrentDateOnly(rec.applicable_from);
                    } else {
                      recDate = today; // Default to today if no date
                    }
                    
                    // Date categorization based on requirements using local date comparison
                    const isCurrent = recDate.getTime() === today.getTime();
                    const isFuture = recDate > today;
                    const isPast = recDate < today;
                    const isLatestRecord = recDate.getTime() === latestDate.getTime();
                    
                    // REQUIREMENT: Select button should be enabled for:
                    // 1. The latest/maximum date record (top of list) - SELECT ENABLED
                    // 2. Future dated records (after latest) - SELECT ENABLED  
                    // 3. Current date records (if not latest) - SELECT ENABLED
                    // 4. Past records - READ ONLY
                    const showSelectButton = isLatestRecord || isFuture || (isCurrent && !isLatestRecord);
                    
                    console.log(`Record ${idx}: ${rec.applicable_from} -> Latest: ${isLatestRecord}, Current: ${isCurrent}, Future: ${isFuture}, Past: ${isPast}, ShowSelect: ${showSelectButton}`);
                  
                    // Determine row styling based on date category
                    const getRowStyle = () => {
                      let baseStyle = { padding: '6px 8px' };
                      if (isPast && !isLatestRecord) {
                        // Non-latest past records are grayed out (read-only)
                        return { 
                          ...baseStyle, 
                          background: idx % 2 ? '#f0f0f0' : '#f8f8f8', 
                          color: '#888', 
                          opacity: 0.7 
                        };
                      }
                      // Latest record, current and future records have normal styling
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
                            {isFuture && !isLatestRecord && (
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
                            {isLatestRecord && (
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
                                {isLatestRecord ? 'Latest' : isCurrent ? 'Current' : isFuture ? 'Future' : 'Past'}
                              </span>
                              <button type="button" style={{background:'#7b1fa2',color:'#fff',border:'none',borderRadius:'6px',padding:'4px 12px',fontWeight:'bold',cursor:'pointer'}} onClick={()=>handleSelectRecord(idx)}>View</button>
                            </>
                          ) : (
                            // Show Select button for latest record OR future records (as per updated requirement)
                            showSelectButton ? (
                              <button 
                                type="button" 
                                style={{
                                  background: isLatestRecord ? '#ff9800' : isCurrent ? '#4caf50' : '#2196f3',
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
            <input type="number" name="decimal_places" value={form.decimal_places} onChange={handleChange} min="0" max="4" style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isFormReadOnly?'#eee':'#fff'}} disabled={isFormReadOnly} />
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
