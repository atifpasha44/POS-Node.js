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
  const [showRecordSelect, setShowRecordSelect] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [records, setRecords] = useState([]);

  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load master data
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [outletsRes, deptsRes, catsRes, taxRes, printersRes, printGroupsRes, modifierGroupsRes, unitsRes] = await Promise.all([
          axios.get('/api/outlets'),
          axios.get('/api/departments'),
          axios.get('/api/categories'),
          axios.get('/api/tax-codes'),
          axios.get('/api/printers'),
          axios.get('/api/print-groups'),
          axios.get('/api/modifier-groups'),
          axios.get('/api/units')
        ]);

        setOutlets(outletsRes.data || []);
        setDepartments(deptsRes.data || []);
        setCategories(catsRes.data || []);
        setTaxCodes(taxRes.data || []);
        setPrinters(printersRes.data || []);
        setPrintGroups(printGroupsRes.data || []);
        setModifierGroups(modifierGroupsRes.data || []);
        setUnits(unitsRes.data || []);
      } catch (error) {
        console.error('Error loading master data:', error);
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
    // Add your submit logic here
  };

  const handleSave = async () => {
    // Add your save logic here
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
    <div style={{
      background: '#fff',
      border: '1px solid #ddd',
      borderRadius: '8px',
      margin: '20px',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '1px solid #eee'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
          <h2 style={{margin: 0, fontSize: '24px', fontWeight: 'bold'}}>Item Master</h2>
          
          <select 
            value={action} 
            onChange={handleActionChange}
            style={{
              padding: '6px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="Add">Add</option>
            <option value="Edit">Edit</option>
            <option value="Delete">Delete</option>
            <option value="Search">Search</option>
          </select>

          {/* Action Buttons */}
          <div style={{display: 'flex', gap: '8px'}}>
            <button 
              onClick={handleAdd}
              style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                border: '2px solid #4CAF50',
                backgroundColor: '#E8F5E8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Add"
            >
              ➕
            </button>
            <button 
              onClick={handleEdit}
              style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                border: '2px solid #2196F3',
                backgroundColor: '#E3F2FD',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Edit"
            >
              ✏️
            </button>
            <button 
              onClick={handleDelete}
              style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                border: '2px solid #F44336',
                backgroundColor: '#FFEBEE',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Delete"
            >
              🗑️
            </button>
            <button 
              onClick={handleSearch}
              style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                border: '2px solid #FF9800',
                backgroundColor: '#FFF3E0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Search"
            >
              🔍
            </button>
            <button 
              onClick={handleClear}
              style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                border: '2px solid #9C27B0',
                backgroundColor: '#F3E5F5',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Clear"
            >
              ❌
            </button>
          </div>
        </div>

        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <button 
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            💾 SAVE
          </button>

          <span style={{fontSize: '14px', color: '#666', marginLeft: '20px'}}>Download Master Data</span>
          <button 
            onClick={handleExportExcel}
            style={{
              width: '35px',
              height: '35px',
              borderRadius: '50%',
              border: '2px solid #4CAF50',
              backgroundColor: '#E8F5E8',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
            title="Export to Excel"
          >
            XL
          </button>
          <button 
            onClick={handleExportPDF}
            style={{
              width: '35px',
              height: '35px',
              borderRadius: '50%',
              border: '2px solid #F44336',
              backgroundColor: '#FFEBEE',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: 'bold'
            }}
            title="Export to PDF"
          >
            PDF
          </button>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit}>
        {/* FIRST HORIZONTAL SECTION (TOP SECTION) */}
        <div style={{display: 'flex', gap: '20px', marginBottom: '25px'}}>
          {/* Left Box (32%) - Outlet Code, Item Code, Item Name, Short Name, Item Department */}
          <div style={{
            flex: '0 0 32%',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <label style={{width: '130px', fontSize: '14px', fontWeight: 'bold'}}>Outlet Code</label>
              <select 
                name="select_outlets"
                value={form.select_outlets[0] || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm(prev => ({...prev, select_outlets: value ? [value] : []}));
                  setIsDirty(true);
                }}
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
                <option value="">Select Outlet</option>
                {outlets.map(outlet => (
                  <option key={outlet.id} value={outlet.code}>
                    {outlet.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{display: 'flex', alignItems: 'center'}}>
              <label style={{width: '130px', fontSize: '14px', fontWeight: 'bold'}}>Item Code</label>
              <input 
                type="text"
                name="item_code"
                value={form.item_code}
                onChange={handleChange}
                style={{
                  width: '200px',
                  height: '28px',
                  padding: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  textTransform: 'uppercase'
                }}
                disabled={isItemCodeLocked || isFormReadOnly}
              />
            </div>

            <div style={{display: 'flex', alignItems: 'center'}}>
              <label style={{width: '130px', fontSize: '14px', fontWeight: 'bold'}}>Item Name</label>
              <input 
                type="text"
                name="item_name"
                value={form.item_name}
                onChange={handleChange}
                maxLength={50}
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
              <label style={{width: '130px', fontSize: '14px', fontWeight: 'bold'}}>Short Name</label>
              <input 
                type="text"
                name="short_name"
                value={form.short_name}
                onChange={handleChange}
                maxLength={20}
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
              <label style={{width: '130px', fontSize: '14px', fontWeight: 'bold'}}>Item Department</label>
              <select 
                name="item_department"
                value={form.item_department}
                onChange={handleChange}
                style={{
                  width: '214px',
                  height: '30px',
                  padding: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
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

          {/* Middle Box (32%) - Applicable From, Inventory Code, Alternate Name, Tax Code, Item Category */}
          <div style={{
            flex: '0 0 32%',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <label style={{width: '130px', fontSize: '14px', fontWeight: 'bold'}}>Applicable From</label>
              <input 
                type="date"
                name="applicable_from"
                value={form.applicable_from}
                onChange={handleChange}
                min={action === 'Add' ? new Date().toISOString().split('T')[0] : ''}
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
              <label style={{width: '130px', fontSize: '14px', fontWeight: 'bold'}}>Inventory Code</label>
              <input 
                type="text"
                name="inventory_code"
                value={form.inventory_code}
                onChange={handleChange}
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
              <label style={{width: '130px', fontSize: '14px', fontWeight: 'bold'}}>Alternate Name</label>
              <input 
                type="text"
                name="alternate_name"
                value={form.alternate_name}
                onChange={handleChange}
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
              <label style={{width: '130px', fontSize: '14px', fontWeight: 'bold'}}>Tax Code</label>
              <select 
                name="tax_code"
                value={form.tax_code}
                onChange={handleChange}
                style={{
                  width: '214px',
                  height: '30px',
                  padding: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
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
              <label style={{width: '130px', fontSize: '14px', fontWeight: 'bold'}}>Item Category</label>
              <select 
                name="item_category"
                value={form.item_category}
                onChange={handleChange}
                style={{
                  width: '214px',
                  height: '30px',
                  padding: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
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

          {/* Right Box (32%) - Item Image */}
          <div style={{
            flex: '0 0 32%',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '6px',
              padding: '15px',
              backgroundColor: '#f9f9f9',
              width: '250px'
            }}>
              <h4 style={{margin: '0 0 15px 0', fontSize: '14px', fontWeight: 'bold', textAlign: 'center'}}>Item Image</h4>
              
              {/* Image Display Area */}
              <div style={{
                border: '2px dashed #ccc',
                borderRadius: '6px',
                padding: '20px',
                textAlign: 'center',
                minHeight: '140px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fff',
                marginBottom: '15px'
              }}>
                {form.item_logo_url ? (
                  <img 
                    src={form.item_logo_url} 
                    alt="Item Logo" 
                    style={{
                      maxWidth: '100%',
                      maxHeight: '120px',
                      objectFit: 'contain'
                    }}
                  />
                ) : (
                  <div style={{color: '#888', fontSize: '12px'}}>
                    <div style={{fontSize: '40px', marginBottom: '10px'}}>📷</div>
                    <div>No image selected</div>
                  </div>
                )}
              </div>
              
              {/* File Upload Controls */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  name="item_logo" 
                  onChange={handleChange} 
                  accept="image/*"
                  style={{
                    fontSize: '12px',
                    padding: '5px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
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
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    📁 Choose Image
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECOND HORIZONTAL SECTION (MIDDLE SECTION) */}
        <div style={{display: 'flex', gap: '20px', marginBottom: '25px'}}>
          {/* Left Box (50%) - Item Price Level */}
          <div style={{flex: '1'}}>
            <div style={{
              border: '1px solid #ccc',
              borderRadius: '6px',
              padding: '15px'
            }}>
              <h4 style={{margin: '0 0 15px 0', fontSize: '14px', fontWeight: 'bold'}}>Item Price Level</h4>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <label style={{width: '60px', fontSize: '14px', fontWeight: 'bold'}}>Price 1</label>
                  <input 
                    type="number"
                    name="item_price_1"
                    value={form.item_price_1}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    style={{
                      width: '160px',
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
                  <label style={{width: '60px', fontSize: '14px', fontWeight: 'bold'}}>Price 2</label>
                  <input 
                    type="number"
                    name="item_price_2"
                    value={form.item_price_2}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    style={{
                      width: '160px',
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
                  <label style={{width: '60px', fontSize: '14px', fontWeight: 'bold'}}>Price 3</label>
                  <input 
                    type="number"
                    name="item_price_3"
                    value={form.item_price_3}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    style={{
                      width: '160px',
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
                  <label style={{width: '60px', fontSize: '14px', fontWeight: 'bold'}}>Price 4</label>
                  <input 
                    type="number"
                    name="item_price_4"
                    value={form.item_price_4}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    style={{
                      width: '160px',
                      height: '28px',
                      padding: '5px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px'
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
              border: '1px solid #ccc',
              borderRadius: '6px',
              padding: '15px'
            }}>
              <h4 style={{margin: '0 0 15px 0', fontSize: '14px', fontWeight: 'bold'}}>Item Printers</h4>
              <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <label style={{width: '80px', fontSize: '14px', fontWeight: 'bold'}}>Printer 1</label>
                  <select 
                    name="item_printer_1"
                    value={form.item_printer_1}
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
                    <option value="">Select Printer</option>
                    {printers.map(printer => (
                      <option key={printer.id} value={printer.code}>
                        {printer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <label style={{width: '80px', fontSize: '14px', fontWeight: 'bold'}}>Printer 2</label>
                  <select 
                    name="item_printer_2"
                    value={form.item_printer_2}
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
                    <option value="">Select Printer</option>
                    {printers.map(printer => (
                      <option key={printer.id} value={printer.code}>
                        {printer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <label style={{width: '80px', fontSize: '14px', fontWeight: 'bold'}}>Printer 3</label>
                  <select 
                    name="item_printer_3"
                    value={form.item_printer_3}
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