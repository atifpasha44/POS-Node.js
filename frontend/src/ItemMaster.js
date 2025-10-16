import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const { autoTable } = require('jspdf-autotable');

export default function ItemMaster({ setParentDirty }) {
  const initialState = {
    select_outlets: [],
    item_code: '',
    item_name: '',
    short_name: '',
    item_department: '',
    applicable_from: new Date().toISOString().split('T')[0],
    inventory_code: '',
    alternate_name: '',
    tax_code: '',
    item_category: '',
    item_price_1: '',
    item_price_2: '',
    item_price_3: '',
    item_price_4: '',
    item_printer_1: '',
    item_printer_2: '',
    item_printer_3: '',
    set_menu: '',
    item_modifier_group: '',
    unit: '',
    print_group: '',
    cost: '',
    in_active: false,
    item_logo: '',
    item_logo_url: ''
  };

  const [form, setForm] = useState(initialState);
  const [action, setAction] = useState('Add');
  const [isDirty, setIsDirty] = useState(false);
  const [outlets, setOutlets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [taxCodes, setTaxCodes] = useState([]);
  const [printers, setPrinters] = useState([]);
  const [printGroups, setPrintGroups] = useState([]);
  const [modifierGroups, setModifierGroups] = useState([]);
  const [units, setUnits] = useState([]);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [showRecordSelect, setShowRecordSelect] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [records, setRecords] = useState([]);

  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load master data from backend API with localStorage fallback
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        console.log('🔄 Loading Item Master dropdown data from backend API...');
        
        // Load Outlets from backend API
        try {
          const outletResponse = await axios.get('/api/outlet-setup');
          if (outletResponse.data.success) {
            const formattedOutlets = outletResponse.data.data
              .filter(outlet => !outlet.inactive) // Only active outlets
              .map(outlet => ({
                id: outlet.id || outlet.outlet_code,
                code: outlet.outlet_code,
                name: outlet.outlet_name
              }));
            setOutlets(formattedOutlets);
            console.log('✅ Loaded outlets from API:', formattedOutlets.length, 'items');
          }
        } catch (error) {
          console.warn('⚠️ Using localStorage for outlets:', error.message);
          // Fallback to localStorage if API fails
          const savedOutletRecords = localStorage.getItem('outletRecords');
          const outletData = savedOutletRecords ? JSON.parse(savedOutletRecords) : [];
          const formattedOutlets = outletData.map(outlet => ({
            id: outlet.id || outlet.outlet_code,
            code: outlet.outlet_code,
            name: outlet.outlet_name || outlet.name
          }));
          setOutlets(formattedOutlets);
        }

        // Load Item Departments from backend API
        try {
          const departmentResponse = await axios.get('/api/item-departments');
          if (departmentResponse.data.success) {
            const formattedDepartments = departmentResponse.data.data
              .filter(dept => !dept.inactive) // Only active departments
              .map(dept => ({
                id: dept.id || dept.department_code,
                code: dept.department_code,
                name: dept.name
              }));
            setDepartments(formattedDepartments);
            console.log('✅ Loaded departments from API:', formattedDepartments.length, 'items');
          }
        } catch (error) {
          console.warn('⚠️ Using localStorage for departments:', error.message);
          // Fallback to localStorage if API fails
          const savedDepartments = localStorage.getItem('itemDepartmentRecords');
          const departmentData = savedDepartments ? JSON.parse(savedDepartments) : [];
          const formattedDepartments = departmentData
            .filter(dept => !dept.inactive)
            .map(dept => ({
              id: dept.id || dept.department_code,
              code: dept.department_code,
              name: dept.name
            }));
          setDepartments(formattedDepartments);
        }

        // Load Item Categories from backend API
        try {
          const categoryResponse = await axios.get('/api/item-categories');
          if (categoryResponse.data.success) {
            const formattedCategories = categoryResponse.data.data
              .filter(cat => !cat.inactive) // Only active categories
              .map(cat => ({
                id: cat.id || cat.category_code,
                code: cat.category_code,
                name: cat.name
              }));
            setCategories(formattedCategories);
            console.log('✅ Loaded categories from API:', formattedCategories.length, 'items');
          }
        } catch (error) {
          console.warn('⚠️ Using localStorage for categories:', error.message);
          // Fallback to localStorage if API fails
          const savedCategories = localStorage.getItem('itemCategoryRecords');
          const categoryData = savedCategories ? JSON.parse(savedCategories) : [];
          console.log('🔍 Raw category data:', categoryData);
          const formattedCategories = categoryData
            .filter(cat => !cat.inactive)
            .map(cat => ({
              id: cat.id || cat.category_code,
              code: cat.category_code,
              name: cat.name
            }));
          setCategories(formattedCategories);
        }

        // Load Tax Codes from backend API
        try {
          const taxResponse = await axios.get('/api/tax-codes');
          if (taxResponse.data.success) {
            const formattedTaxCodes = taxResponse.data.data
              .filter(tax => tax.is_active) // Only active tax codes
              .map(tax => ({
                id: tax.id || tax.tax_code,
                code: tax.tax_code,
                name: tax.tax_name
              }));
            setTaxCodes(formattedTaxCodes);
            console.log('✅ Loaded tax codes from API:', formattedTaxCodes.length, 'items');
          }
        } catch (error) {
          console.warn('⚠️ Using localStorage for tax codes:', error.message);
          // Fallback to localStorage if API fails
          const savedTaxStructure = localStorage.getItem('taxStructureRecords');
          const taxData = savedTaxStructure ? JSON.parse(savedTaxStructure) : [];
          const formattedTaxCodes = taxData
            .filter(tax => tax.is_active)
            .map(tax => ({
              id: tax.id || tax.tax_structure_code,
              code: tax.tax_structure_code,
              name: tax.tax_structure_name
            }));
          setTaxCodes(formattedTaxCodes);
        }

        // Load UOM data from backend API
        try {
          const uomResponse = await axios.get('/api/uom');
          if (uomResponse.data.success) {
            const formattedUnits = uomResponse.data.data
              .filter(uom => uom.is_active) // Only active units
              .map(uom => ({
                id: uom.id || uom.uom_code,
                code: uom.uom_code,
                name: uom.uom_name
              }));
            setUnits(formattedUnits);
            console.log('✅ Loaded units from API:', formattedUnits.length, 'items');
          }
        } catch (error) {
          console.warn('⚠️ Using localStorage for UOM:', error.message);
          // Fallback to localStorage if API fails
          const savedUOM = localStorage.getItem('uomRecords');
          const uomData = savedUOM ? JSON.parse(savedUOM) : [];
          const formattedUnits = uomData
            .filter(uom => uom.is_active)
            .map(uom => ({
              id: uom.id || uom.uom_code,
              code: uom.uom_code,
              name: uom.uom_name
            }));
          setUnits(formattedUnits);
        }

        // For now, set empty arrays for printer-related data (can be implemented later)
        setPrinters([]);
        setPrintGroups([]);
        setModifierGroups([]);

        console.log('🎉 Item Master dropdown data loading complete!');
        
      } catch (error) {
        console.error('❌ Error loading Item Master dropdown data:', error);
      }
    };

    loadMasterData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file' && files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setForm(prev => ({
          ...prev,
          [name]: file,
          item_logo_url: reader.result
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    setIsDirty(true);
    if (setParentDirty) setParentDirty(true);
  };

  const handleActionChange = (e) => {
    const newAction = e.target.value;
    setAction(newAction);
    
    if (newAction === 'Edit' || newAction === 'Delete' || newAction === 'Search') {
      setShowRecordSelect(true);
    }
  };

  const handleAdd = () => {
    setAction('Add');
    const today = new Date().toISOString().split('T')[0];
    setForm({...initialState, applicable_from: today});
    setFieldErrors({});
  };

  const handleEdit = () => {
    setAction('Edit');
    setShowRecordSelect(true);
  };

  const handleDelete = () => {
    setAction('Delete');
    setShowRecordSelect(true);
  };

  const handleSearch = () => {
    setAction('Search');
    setShowRecordSelect(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 Form submission started...');
    
    // Basic validation
    if (!form.item_code || form.item_code.trim() === '') {
      alert('Item Code is required');
      return;
    }
    
    if (!form.item_name || form.item_name.trim() === '') {
      alert('Item Name is required');
      return;
    }
    
    if (!form.select_outlets || form.select_outlets.length === 0) {
      alert('Outlet selection is required');
      return;
    }
    
    try {
      // Load existing item master records
      const existingRecords = JSON.parse(localStorage.getItem('itemMasterRecords') || '[]');
      
      // Create new record
      const newRecord = {
        id: Date.now(), // Simple ID generation
        item_code: form.item_code,
        item_name: form.item_name,
        short_name: form.short_name,
        item_department: form.item_department,
        applicable_from: form.applicable_from,
        inventory_code: form.inventory_code,
        alternate_name: form.alternate_name,
        tax_code: form.tax_code,
        item_category: form.item_category,
        item_price_1: parseFloat(form.item_price_1) || 0,
        item_price_2: parseFloat(form.item_price_2) || 0,
        item_price_3: parseFloat(form.item_price_3) || 0,
        item_price_4: parseFloat(form.item_price_4) || 0,
        item_printer_1: form.item_printer_1,
        item_printer_2: form.item_printer_2,
        item_printer_3: form.item_printer_3,
        set_menu: form.set_menu,
        item_modifier_group: form.item_modifier_group,
        unit: form.unit,
        print_group: form.print_group,
        cost: parseFloat(form.cost) || 0,
        in_active: form.in_active,
        item_logo: form.item_logo,
        item_logo_url: form.item_logo_url,
        select_outlets: form.select_outlets,
        created_by: 'admin', // TODO: Get from user session
        created_date: new Date().toISOString(),
        modified_by: 'admin',
        modified_date: new Date().toISOString()
      };
      
      // Check for duplicate item codes
      const existingItem = existingRecords.find(record => 
        record.item_code === form.item_code && record.id !== (selectedRecordId || null)
      );
      
      if (existingItem && action === 'Add') {
        alert('Item Code already exists. Please use a different code.');
        return;
      }
      
      let updatedRecords;
      
      if (action === 'Add') {
        // Add new record
        updatedRecords = [...existingRecords, newRecord];
        console.log('✅ Adding new item:', newRecord);
      } else if (action === 'Edit' && selectedRecordId) {
        // Update existing record
        updatedRecords = existingRecords.map(record => 
          record.id === selectedRecordId ? { ...newRecord, id: selectedRecordId } : record
        );
        console.log('✅ Updating existing item:', newRecord);
      } else {
        alert('Invalid action or no record selected for editing');
        return;
      }
      
      // Save to localStorage
      localStorage.setItem('itemMasterRecords', JSON.stringify(updatedRecords));
      
      // Show success message
      setShowSavePopup(true);
      setTimeout(() => setShowSavePopup(false), 1800);
      
      // Reset form for Add action
      if (action === 'Add') {
        handleClear();
      }
      
      console.log('💾 Item saved successfully!');
      
    } catch (error) {
      console.error('❌ Error saving item:', error);
      alert('Error saving item. Please try again.');
    }
  };

  const handleSave = () => {
    console.log('💾 Save button clicked!');
    console.log('📋 Current form data:', form);
    console.log('📦 Available categories:', categories);
    console.log('🏪 Available outlets:', outlets);
    console.log('📂 Available departments:', departments);
    console.log('💰 Available tax codes:', taxCodes);
    
    if (formRef.current) {
      formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  const handleExportExcel = () => {
    // Add your Excel export logic here
  };

  const handleExportPDF = () => {
    // Add your PDF export logic here
  };

  const handleClear = () => {
    const today = new Date().toISOString().split('T')[0];
    const resetForm = action === 'Add' ? {...initialState, applicable_from: today} : initialState;
    setForm(resetForm);
    setFieldErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isFormReadOnly = action === 'Search';
  const isItemCodeLocked = action === 'Edit';

  return (
    <div className="itemmaster-panel" style={{
      background: '#fff',
      border: '2.5px solid #222',
      borderRadius: '16px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
      width: '100%',
      maxWidth: '1200px',
      margin: '32px auto',
      padding: '0 0 18px 0',
      height: 'calc(100vh - 120px)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      position: 'relative',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header - Sticky */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '2px solid #e0e0e0',
        padding: '12px 18px 8px 18px',
        minWidth: 0,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexWrap: 'wrap'}}>
          <span style={{fontWeight: 'bold', fontSize: '2rem', color: '#222', marginRight: '18px'}}>
            Item Master
          </span>
          
          <select 
            value={action} 
            onChange={handleActionChange}
            style={{
              fontWeight: 'bold',
              fontSize: '1rem',
              padding: '4px 12px',
              borderRadius: '6px',
              border: '1.5px solid #bbb',
              marginRight: '8px'
            }}
          >
            <option value="Add">Action</option>
            <option value="Add">Add</option>
            <option value="Edit">Edit</option>
            <option value="Delete">Delete</option>
            <option value="Search">Search</option>
          </select>

          {/* Action Buttons */}
          <button 
            onClick={handleAdd}
            title="Add"
            style={{
              background: '#e3fcec',
              border: '2px solid #43a047',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: '#43a047',
              marginRight: '4px',
              cursor: 'pointer',
              transition: '0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#c8e6c9'}
            onMouseOut={e => e.currentTarget.style.background = '#e3fcec'}
          >
            <span role="img" aria-label="Add">➕</span>
          </button>
          <button 
            onClick={handleEdit}
            title="Modify/Edit"
            style={{
              background: '#e3eafc',
              border: '2px solid #1976d2',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: '#1976d2',
              marginRight: '4px',
              cursor: 'pointer',
              transition: '0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#bbdefb'}
            onMouseOut={e => e.currentTarget.style.background = '#e3eafc'}
          >
            <span role="img" aria-label="Edit">✏️</span>
          </button>
          <button 
            onClick={handleDelete}
            title="Delete"
            style={{
              background: '#ffebee',
              border: '2px solid #e53935',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: '#e53935',
              marginRight: '4px',
              cursor: 'pointer',
              transition: '0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#ffcdd2'}
            onMouseOut={e => e.currentTarget.style.background = '#ffebee'}
          >
            <span role="img" aria-label="Delete">🗑️</span>
          </button>
          <button 
            onClick={handleSearch}
            title="Search"
            style={{
              background: '#fffde7',
              border: '2px solid #fbc02d',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: '#fbc02d',
              marginRight: '4px',
              cursor: 'pointer',
              transition: '0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#fff9c4'}
            onMouseOut={e => e.currentTarget.style.background = '#fffde7'}
          >
            <span role="img" aria-label="Search">🔍</span>
          </button>
          <button 
            onClick={handleClear}
            title="Clear"
            style={{
              background: '#f3e5f5',
              border: '2px solid #8e24aa',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: '#8e24aa',
              marginRight: '4px',
              cursor: 'pointer',
              transition: '0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#e1bee7'}
            onMouseOut={e => e.currentTarget.style.background = '#f3e5f5'}
          >
            <span role="img" aria-label="Clear">🧹</span>
          </button>
          <button 
            onClick={handleSave}
            title="Save"
            style={{
              background: '#e3f2fd',
              border: '2px solid #1976d2',
              borderRadius: '8px',
              fontWeight: 'bold',
              color: '#1976d2',
              fontSize: '1.15rem',
              padding: '4px 18px',
              marginLeft: '8px',
              cursor: 'pointer',
              transition: '0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#bbdefb'}
            onMouseOut={e => e.currentTarget.style.background = '#e3f2fd'}
          >
            <span style={{fontWeight: 'bold'}}>
              <span role="img" aria-label="Save">💾</span> SAVE
            </span>
          </button>
        </div>

        <div style={{display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flexWrap: 'wrap'}}>
          <span style={{fontSize: '1.08rem', color: '#888', marginRight: '8px', whiteSpace: 'nowrap'}}>Export Report to</span>
          <span
            title="Export to Excel"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#e8f5e9',
              boxShadow: '0 2px 8px rgba(76,175,80,0.10)',
              cursor: 'pointer',
              border: '2px solid #43a047',
              marginRight: '6px',
              transition: 'background 0.2s'
            }}
            onClick={handleExportExcel}
            onMouseOver={e => e.currentTarget.style.background = '#c8e6c9'}
            onMouseOut={e => e.currentTarget.style.background = '#e8f5e9'}
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#43a047"/>
              <text x="16" y="21" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#fff">X</text>
              <text x="24" y="21" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#fff">L</text>
            </svg>
          </span>
          
          <span
            title="Export to PDF"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#ffebee',
              boxShadow: '0 2px 8px rgba(229,57,53,0.10)',
              cursor: 'pointer',
              border: '2px solid #e53935',
              marginRight: '6px',
              transition: 'background 0.2s'
            }}
            onClick={handleExportPDF}
            onMouseOver={e => e.currentTarget.style.background = '#ffcdd2'}
            onMouseOut={e => e.currentTarget.style.background = '#ffebee'}
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#e53935"/>
              <text x="10" y="21" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fff">P</text>
              <text x="16" y="21" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fff">D</text>
              <text x="22" y="21" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fff">F</text>
            </svg>
          </span>
        </div>
      </div>

      {/* Scrollable Form Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '32px 32px 0 32px'
      }}>
        <form ref={formRef} onSubmit={handleSubmit} className="itemmaster-form">
        {/* FIRST HORIZONTAL SECTION (TOP SECTION) */}
        <div style={{display: 'flex', gap: '20px', marginBottom: '25px', alignItems: 'flex-start'}}>
          {/* Left Column - Form Fields */}
          <div style={{
            flex: '0 0 32%',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <label style={{width: '120px', fontSize: '14px', fontWeight: 'bold', color: '#666'}}>Outlet Code</label>
              <select 
                name="select_outlets"
                value={form.select_outlets[0] || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm(prev => ({...prev, select_outlets: value ? [value] : []}));
                  setIsDirty(true);
                }}
                style={{
                  width: '250px',
                  height: '32px',
                  padding: '5px 10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
                disabled={isFormReadOnly}
              >
                <option value="">Select Outlet</option>
                {outlets.map(outlet => (
                  <option key={outlet.id} value={outlet.code}>
                    {outlet.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{display: 'flex', alignItems: 'center'}}>
              <label style={{width: '120px', fontSize: '14px', fontWeight: 'bold', color: '#666'}}>Item Code</label>
              <input 
                type="text"
                name="item_code"
                value={form.item_code}
                onChange={handleChange}
                style={{
                  width: '235px',
                  height: '30px',
                  padding: '5px 10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
                disabled={isItemCodeLocked || isFormReadOnly}
              />
            </div>

            <div style={{display: 'flex', alignItems: 'center'}}>
              <label style={{width: '120px', fontSize: '14px', fontWeight: 'bold', color: '#666'}}>Item Name</label>
              <input 
                type="text"
                name="item_name"
                value={form.item_name}
                onChange={handleChange}
                maxLength={50}
                style={{
                  width: '235px',
                  height: '30px',
                  padding: '5px 10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
                disabled={isFormReadOnly}
              />
            </div>

            <div style={{display: 'flex', alignItems: 'center'}}>
              <label style={{width: '120px', fontSize: '14px', fontWeight: 'bold', color: '#666'}}>Short Name</label>
              <input 
                type="text"
                name="short_name"
                value={form.short_name}
                onChange={handleChange}
                maxLength={20}
                style={{
                  width: '235px',
                  height: '30px',
                  padding: '5px 10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
                disabled={isFormReadOnly}
              />
            </div>

            <div style={{display: 'flex', alignItems: 'center'}}>
              <label style={{width: '120px', fontSize: '14px', fontWeight: 'bold', color: '#666'}}>Item Department</label>
              <select 
                name="item_department"
                value={form.item_department}
                onChange={handleChange}
                style={{
                  width: '250px',
                  height: '32px',
                  padding: '5px 10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
                disabled={isFormReadOnly}
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.code}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Middle Column - Additional Fields */}
          <div style={{
            flex: '0 0 32%',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <label style={{width: '130px', fontSize: '14px', fontWeight: 'bold', color: '#666'}}>Applicable From</label>
              <input 
                type="date"
                name="applicable_from"
                value={form.applicable_from}
                onChange={handleChange}
                min={action === 'Add' ? new Date().toISOString().split('T')[0] : ''}
                style={{
                  width: '200px',
                  height: '30px',
                  padding: '5px 10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
                disabled={isFormReadOnly}
              />
            </div>

            <div style={{display: 'flex', alignItems: 'center'}}>
              <label style={{width: '130px', fontSize: '14px', fontWeight: 'bold', color: '#666'}}>Inventory Code</label>
              <input 
                type="text"
                name="inventory_code"
                value={form.inventory_code}
                onChange={handleChange}
                style={{
                  width: '200px',
                  height: '30px',
                  padding: '5px 10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
                disabled={isFormReadOnly}
              />
            </div>

            <div style={{display: 'flex', alignItems: 'center'}}>
              <label style={{width: '130px', fontSize: '14px', fontWeight: 'bold', color: '#666'}}>Alternate Name</label>
              <input 
                type="text"
                name="alternate_name"
                value={form.alternate_name}
                onChange={handleChange}
                style={{
                  width: '200px',
                  height: '30px',
                  padding: '5px 10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
                disabled={isFormReadOnly}
              />
            </div>

            <div style={{display: 'flex', alignItems: 'center'}}>
              <label style={{width: '130px', fontSize: '14px', fontWeight: 'bold', color: '#666'}}>Tax Code</label>
              <select 
                name="tax_code"
                value={form.tax_code}
                onChange={handleChange}
                style={{
                  width: '215px',
                  height: '32px',
                  padding: '5px 10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
                disabled={isFormReadOnly}
              >
                <option value="">Select Tax Code</option>
                {taxCodes.map(tax => (
                  <option key={tax.id} value={tax.code}>
                    {tax.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{display: 'flex', alignItems: 'center'}}>
              <label style={{width: '130px', fontSize: '14px', fontWeight: 'bold', color: '#666'}}>Item Category</label>
              <select 
                name="item_category"
                value={form.item_category}
                onChange={handleChange}
                style={{
                  width: '215px',
                  height: '32px',
                  padding: '5px 10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
                disabled={isFormReadOnly}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.code}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Column - Item Image */}
          <div style={{
            flex: '0 0 32%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '10px'
            }}>
              <label style={{fontSize: '14px', fontWeight: 'bold', color: '#666'}}>Item Image</label>
            </div>
            
            {/* Image Display Area */}
            <div style={{
              border: '2px dashed #ccc',
              borderRadius: '6px',
              width: '144px',
              height: '144px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f9f9f9',
              marginBottom: '15px'
            }}>
              {form.item_logo_url ? (
                <img 
                  src={form.item_logo_url} 
                  alt="Item Logo" 
                  style={{
                    maxWidth: '130px',
                    maxHeight: '130px',
                    objectFit: 'contain'
                  }}
                />
              ) : (
                <div style={{color: '#999', fontSize: '12px', textAlign: 'center'}}>
                  <div style={{fontSize: '24px', marginBottom: '5px'}}>📷</div>
                  <div>No image selected</div>
                </div>
              )}
            </div>
            
            {/* File Upload Controls */}
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '144px'}}>
              <input 
                ref={fileInputRef}
                type="file" 
                name="item_logo" 
                onChange={handleChange} 
                accept="image/*"
                style={{
                  width: '100%',
                  fontSize: '12px',
                  padding: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: '#fff'
                }} 
                disabled={isFormReadOnly} 
              />
              {!isFormReadOnly && (
                <button
                  type="button"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                  style={{
                    backgroundColor: '#007BFF',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 20px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  UPLOAD
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SECOND HORIZONTAL SECTION (MIDDLE SECTION) */}
        <div style={{display: 'flex', gap: '20px', marginBottom: '25px'}}>
          {/* Left Box (50%) - Item Price Level */}
          <div style={{flex: '1'}}>
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '15px',
              backgroundColor: '#f9f9f9'
            }}>
              <h4 style={{margin: '0 0 15px 0', fontSize: '14px', fontWeight: 'bold', color: '#333'}}>Item Price Level</h4>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <label style={{width: '70px', fontSize: '14px', fontWeight: 'bold', color: '#666'}}>Price 1</label>
                  <input 
                    type="number"
                    name="item_price_1"
                    value={form.item_price_1}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    style={{
                      width: '130px',
                      height: '32px',
                      padding: '5px 8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: '#fff'
                    }}
                    disabled={isFormReadOnly}
                  />
                </div>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <label style={{width: '70px', fontSize: '14px', fontWeight: 'bold', color: '#666'}}>Price 2</label>
                  <input 
                    type="number"
                    name="item_price_2"
                    value={form.item_price_2}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    style={{
                      width: '130px',
                      height: '32px',
                      padding: '5px 8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: '#fff'
                    }}
                    disabled={isFormReadOnly}
                  />
                </div>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <label style={{width: '70px', fontSize: '14px', fontWeight: 'bold', color: '#666'}}>Price 3</label>
                  <input 
                    type="number"
                    name="item_price_3"
                    value={form.item_price_3}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    style={{
                      width: '130px',
                      height: '32px',
                      padding: '5px 8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: '#fff'
                    }}
                    disabled={isFormReadOnly}
                  />
                </div>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <label style={{width: '70px', fontSize: '14px', fontWeight: 'bold', color: '#666'}}>Price 4</label>
                  <input 
                    type="number"
                    name="item_price_4"
                    value={form.item_price_4}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    style={{
                      width: '130px',
                      height: '32px',
                      padding: '5px 8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: '#fff'
                    }}
                    disabled={isFormReadOnly}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Box (50%) - Item Printers */}
          <div style={{flex: '1'}}>
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '15px',
              backgroundColor: '#f9f9f9'
            }}>
              <h4 style={{margin: '0 0 15px 0', fontSize: '14px', fontWeight: 'bold', color: '#333'}}>Item Printers</h4>
              <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <label style={{width: '80px', fontSize: '14px', fontWeight: 'bold', color: '#666'}}>Printer 1</label>
                  <select 
                    name="item_printer_1"
                    value={form.item_printer_1}
                    onChange={handleChange}
                    style={{
                      width: '200px',
                      height: '32px',
                      padding: '5px 8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: '#fff'
                    }}
                    disabled={isFormReadOnly}
                  >
                    <option value="">Select Printer</option>
                    {printers.map(printer => (
                      <option key={printer.id} value={printer.code}>
                        {printer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <label style={{width: '80px', fontSize: '14px', fontWeight: 'bold', color: '#666'}}>Printer 2</label>
                  <select 
                    name="item_printer_2"
                    value={form.item_printer_2}
                    onChange={handleChange}
                    style={{
                      width: '200px',
                      height: '32px',
                      padding: '5px 8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: '#fff'
                    }}
                    disabled={isFormReadOnly}
                  >
                    <option value="">Select Printer</option>
                    {printers.map(printer => (
                      <option key={printer.id} value={printer.code}>
                        {printer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <label style={{width: '80px', fontSize: '14px', fontWeight: 'bold', color: '#666'}}>Printer 3</label>
                  <select 
                    name="item_printer_3"
                    value={form.item_printer_3}
                    onChange={handleChange}
                    style={{
                      width: '200px',
                      height: '32px',
                      padding: '5px 8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: '#fff'
                    }}
                    disabled={isFormReadOnly}
                  >
                    <option value="">Select Printer</option>
                    {printers.map(printer => (
                      <option key={printer.id} value={printer.code}>
                        {printer.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* THIRD HORIZONTAL SECTION (BOTTOM SECTION) */}
        <div style={{display: 'flex', gap: '20px', marginBottom: '25px'}}>
          {/* Left Box (50%) - Set Menu, Item Modifier Group, Unit */}
          <div style={{
            flex: '1',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <label style={{width: '150px', fontSize: '14px', fontWeight: 'bold'}}>Set Menu</label>
              <select 
                name="set_menu"
                value={form.set_menu}
                onChange={handleChange}
                style={{
                  width: '200px',
                  height: '30px',
                  padding: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                disabled={isFormReadOnly}
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div style={{display: 'flex', alignItems: 'center'}}>
              <label style={{width: '150px', fontSize: '14px', fontWeight: 'bold'}}>Item Modifier Group</label>
              <select 
                name="item_modifier_group"
                value={form.item_modifier_group}
                onChange={handleChange}
                style={{
                  width: '200px',
                  height: '30px',
                  padding: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                disabled={isFormReadOnly}
              >
                <option value="">Select Modifier Group</option>
                {modifierGroups.map(group => (
                  <option key={group.id} value={group.code}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{display: 'flex', alignItems: 'center'}}>
              <label style={{width: '150px', fontSize: '14px', fontWeight: 'bold'}}>Unit</label>
              <select 
                name="unit"
                value={form.unit}
                onChange={handleChange}
                style={{
                  width: '200px',
                  height: '30px',
                  padding: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                disabled={isFormReadOnly}
              >
                <option value="">Select Unit</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.code}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Box (50%) - Print Group, Cost, Inactive */}
          <div style={{
            flex: '1',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <label style={{width: '120px', fontSize: '14px', fontWeight: 'bold'}}>Print Group</label>
              <select 
                name="print_group"
                value={form.print_group}
                onChange={handleChange}
                style={{
                  width: '200px',
                  height: '30px',
                  padding: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                disabled={isFormReadOnly}
              >
                <option value="">Select Print Group</option>
                {printGroups.map(group => (
                  <option key={group.id} value={group.code}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{display: 'flex', alignItems: 'center'}}>
              <label style={{width: '120px', fontSize: '14px', fontWeight: 'bold'}}>Cost</label>
              <input 
                type="number"
                name="cost"
                value={form.cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                style={{
                  width: '200px',
                  height: '28px',
                  padding: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                disabled={isFormReadOnly}
              />
            </div>

            <div style={{display: 'flex', alignItems: 'center'}}>
              <label style={{width: '120px', fontSize: '14px', fontWeight: 'bold'}}>Inactive</label>
              <input 
                type="checkbox"
                name="in_active"
                checked={form.in_active}
                onChange={handleChange}
                style={{
                  width: '20px',
                  height: '20px',
                  marginLeft: '5px'
                }}
                disabled={isFormReadOnly}
              />
            </div>
          </div>
        </div>
        </form>
      </div>

      {/* Modals and Popups */}
      {showSavePopup && (
        <div style={{position:'fixed',top:'30%',left:'50%',transform:'translate(-50%,-50%)',background:'#fff',border:'2px solid #43a047',borderRadius:'8px',padding:'20px 30px',zIndex:1000,boxShadow:'0 4px 20px rgba(0,0,0,0.15)',fontSize:'16px',color:'#43a047',fontWeight:'bold'}}>
          {action === 'Delete' ? 'Record has been successfully deleted.' : 'Data has been saved successfully.'}
        </div>
      )}

      {showDeleteConfirm && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.3)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:'8px',padding:'25px',minWidth:'350px',boxShadow:'0 4px 20px rgba(0,0,0,0.15)'}}>
            <div style={{fontWeight:'bold',fontSize:'18px',marginBottom:'15px',color:'#e53935'}}>Confirm Delete</div>
            <div style={{marginBottom:'20px',fontSize:'14px'}}>Are you sure you want to delete this item?</div>
            <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{background:'#e53935',color:'#fff',border:'none',borderRadius:'4px',padding:'8px 16px',fontSize:'14px',cursor:'pointer'}}>Delete</button>
              <button onClick={() => setShowDeleteConfirm(false)} style={{background:'#bbb',color:'#222',border:'none',borderRadius:'4px',padding:'8px 16px',fontSize:'14px',cursor:'pointer'}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showRecordSelect && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.3)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:'8px',padding:'25px',minWidth:'500px',maxHeight:'70vh',overflow:'auto',boxShadow:'0 4px 20px rgba(0,0,0,0.15)'}}>
            <div style={{fontWeight:'bold',fontSize:'18px',marginBottom:'15px'}}>Select Record</div>
            <div style={{marginBottom:'20px',maxHeight:'400px',overflow:'auto',border:'1px solid #ddd',borderRadius:'4px'}}>
              {records.map((record, index) => (
                <div key={index} style={{padding:'10px',borderBottom:'1px solid #eee',cursor:'pointer'}} onClick={() => {
                  setForm(record);
                  setShowRecordSelect(false);
                }}>
                  <div style={{fontWeight:'bold'}}>{record.item_code} - {record.item_name}</div>
                  <div style={{fontSize:'12px',color:'#666'}}>{record.department} | {record.category}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
              <button onClick={() => setShowRecordSelect(false)} style={{background:'#bbb',color:'#222',border:'none',borderRadius:'4px',padding:'8px 16px',fontSize:'14px',cursor:'pointer'}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}