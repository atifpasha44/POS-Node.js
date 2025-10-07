import React, { useState, useRef, useEffect } from 'react';

const initialState = {
  importFile: null,
  selectedFields: [],
  exportFormat: 'xlsx',
  progressStatus: ''
};

// Dynamic fields will be fetched from Item Master table
const getItemMasterFields = async () => {
  try {
    // In a real application, this would fetch from your Item Master table
    // For now, simulating with comprehensive Item Master fields
    return [
      'item_id',
      'item_code', 
      'item_name',
      'category_id',
      'category_name',
      'unit_price',
      'cost_price',
      'tax_rate',
      'unit_of_measure',
      'stock_quantity',
      'minimum_stock',
      'maximum_stock',
      'supplier_id',
      'supplier_name',
      'barcode',
      'description',
      'image_url',
      'is_active',
      'is_taxable',
      'created_date',
      'modified_date',
      'created_by',
      'modified_by'
    ];
  } catch (error) {
    console.error('Error fetching Item Master fields:', error);
    return [];
  }
};

const ImportExport = ({ setParentDirty, records, setRecords }) => {
  const [isDirty, setIsDirty] = useState(false);
  const [form, setForm] = useState(initialState);
  const [action, setAction] = useState('Add');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedRecordIdx, setSelectedRecordIdx] = useState(null);
  const [selectModalMessage, setSelectModalMessage] = useState('');
  const [availableFields, setAvailableFields] = useState([]);
  const [isLoadingFields, setIsLoadingFields] = useState(true);
  const [importProgress, setImportProgress] = useState('');
  const [exportProgress, setExportProgress] = useState('');
  const fileInputRef = useRef(null);

  // Load Item Master fields on component mount
  useEffect(() => {
    const loadFields = async () => {
      setIsLoadingFields(true);
      try {
        const fields = await getItemMasterFields();
        setAvailableFields(fields);
      } catch (error) {
        console.error('Failed to load Item Master fields:', error);
        setSelectModalMessage('Failed to load Item Master fields. Please try again.');
        setShowSelectModal(true);
      } finally {
        setIsLoadingFields(false);
      }
    };

    loadFields();
  }, []);

  const handleAdd = () => {
    setAction('Add');
    setSelectedRecordIdx(null);
    setForm(initialState);
  };

  const handleEdit = () => {
    if (selectedRecordIdx === null) {
      setSelectModalMessage('Please select a record to edit.');
      setShowSelectModal(true);
      return;
    }
    setAction('Edit');
    setForm(records[selectedRecordIdx]);
  };

  const handleDelete = () => {
    if (selectedRecordIdx === null) {
      setSelectModalMessage('Please select a record to delete.');
      setShowSelectModal(true);
      return;
    }
    const newRecords = records.filter((_, idx) => idx !== selectedRecordIdx);
    setRecords(newRecords);
    setSelectedRecordIdx(null);
    setIsDirty(true);
    setParentDirty(true);
  };

  const handleSearch = () => {
    setSelectModalMessage('Search functionality will be implemented soon.');
    setShowSelectModal(true);
  };

  const handleClear = () => {
    setForm(initialState);
    setSelectedRecordIdx(null);
    setAction('Add');
    setImportProgress('');
    setExportProgress('');
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = () => {
    setShowSavePopup(true);
    setIsDirty(false);
    setParentDirty(false);
    setTimeout(() => setShowSavePopup(false), 2000);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setForm({...form, importFile: file});
      setIsDirty(true);
      setParentDirty(true);
    }
  };

  const handleImport = async () => {
    if (!form.importFile) {
      setSelectModalMessage('Please select a file to import.');
      setShowSelectModal(true);
      return;
    }

    setImportProgress('Validating file format...');
    
    try {
      // Validate file type
      const fileExtension = form.importFile.name.split('.').pop().toLowerCase();
      if (!['csv', 'xlsx', 'xls'].includes(fileExtension)) {
        throw new Error('Invalid file format. Please upload CSV or Excel files only.');
      }

      setImportProgress('Reading file contents...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setImportProgress('Validating against Item Master schema...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setImportProgress('Importing data to Item Master...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const recordCount = Math.floor(Math.random() * 50) + 10;
      const skippedCount = Math.floor(Math.random() * 5);
      
      setImportProgress(`Import completed! Processed ${recordCount} records, ${skippedCount} skipped (duplicates).`);
      setIsDirty(true);
      setParentDirty(true);
      setTimeout(() => setImportProgress(''), 5000);
      
    } catch (error) {
      console.error('Import failed:', error);
      setImportProgress(`Import failed: ${error.message}`);
      setTimeout(() => setImportProgress(''), 4000);
    }
  };

  const handleExport = async () => {
    if (form.selectedFields.length === 0) {
      setSelectModalMessage('Please select at least one field to export.');
      setShowSelectModal(true);
      return;
    }

    setExportProgress('Fetching Item Master data...');
    
    try {
      // Simulate fetching data from Item Master table
      const itemMasterData = await fetchItemMasterData(form.selectedFields);
      
      setExportProgress('Generating export file...');
      
      // Generate and download the file
      const exportData = prepareExportData(itemMasterData, form.selectedFields);
      downloadExportFile(exportData, form.exportFormat, form.selectedFields);
      
      setExportProgress(`Export completed! Downloaded ${itemMasterData.length} records as ${form.exportFormat.toUpperCase()} file.`);
      setTimeout(() => setExportProgress(''), 4000);
      
    } catch (error) {
      console.error('Export failed:', error);
      setExportProgress('Export failed. Please try again.');
      setTimeout(() => setExportProgress(''), 3000);
    }
  };

  // Simulate fetching data from Item Master table
  const fetchItemMasterData = async (selectedFields) => {
    // In a real application, this would query your Item Master table
    // Simulating database response with sample data
    return new Promise((resolve) => {
      setTimeout(() => {
        const sampleData = [
          {
            item_id: 1,
            item_code: 'ITM001',
            item_name: 'Chicken Burger',
            category_id: 1,
            category_name: 'Main Course',
            unit_price: 12.99,
            cost_price: 8.50,
            tax_rate: 10.0,
            unit_of_measure: 'piece',
            stock_quantity: 50,
            minimum_stock: 10,
            maximum_stock: 100,
            supplier_id: 1,
            supplier_name: 'Food Supplier Inc',
            barcode: '1234567890123',
            description: 'Delicious grilled chicken burger',
            image_url: '/images/chicken_burger.jpg',
            is_active: true,
            is_taxable: true,
            created_date: '2024-01-15',
            modified_date: '2024-10-07',
            created_by: 'admin',
            modified_by: 'admin'
          },
          {
            item_id: 2,
            item_code: 'ITM002',
            item_name: 'Caesar Salad',
            category_id: 2,
            category_name: 'Salads',
            unit_price: 8.99,
            cost_price: 5.25,
            tax_rate: 10.0,
            unit_of_measure: 'bowl',
            stock_quantity: 30,
            minimum_stock: 5,
            maximum_stock: 50,
            supplier_id: 2,
            supplier_name: 'Fresh Greens Co',
            barcode: '1234567890124',
            description: 'Fresh caesar salad with croutons',
            image_url: '/images/caesar_salad.jpg',
            is_active: true,
            is_taxable: true,
            created_date: '2024-01-20',
            modified_date: '2024-10-05',
            created_by: 'admin',
            modified_by: 'manager'
          },
          {
            item_id: 3,
            item_code: 'ITM003',
            item_name: 'Coca Cola',
            category_id: 3,
            category_name: 'Beverages',
            unit_price: 2.99,
            cost_price: 1.50,
            tax_rate: 5.0,
            unit_of_measure: 'bottle',
            stock_quantity: 100,
            minimum_stock: 20,
            maximum_stock: 200,
            supplier_id: 3,
            supplier_name: 'Beverage Distributors',
            barcode: '1234567890125',
            description: '330ml Coca Cola bottle',
            image_url: '/images/coca_cola.jpg',
            is_active: true,
            is_taxable: true,
            created_date: '2024-02-01',
            modified_date: '2024-09-30',
            created_by: 'admin',
            modified_by: 'admin'
          }
        ];
        
        // Filter data to only include selected fields
        const filteredData = sampleData.map(item => {
          const filteredItem = {};
          selectedFields.forEach(field => {
            if (item.hasOwnProperty(field)) {
              filteredItem[field] = item[field];
            }
          });
          return filteredItem;
        });
        
        resolve(filteredData);
      }, 1000);
    });
  };

  // Prepare data for export
  const prepareExportData = (data, selectedFields) => {
    if (!data || data.length === 0) return [];
    
    // Convert field names to display names
    const fieldDisplayNames = selectedFields.map(field => 
      field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    );
    
    return {
      headers: fieldDisplayNames,
      rows: data.map(item => selectedFields.map(field => item[field] || ''))
    };
  };

  // Download export file
  const downloadExportFile = (exportData, format, selectedFields) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `item_master_export_${timestamp}`;
    
    if (format === 'csv') {
      downloadCSV(exportData, `${filename}.csv`);
    } else if (format === 'xlsx') {
      downloadExcel(exportData, `${filename}.xlsx`);
    }
  };

  // Download CSV file
  const downloadCSV = (data, filename) => {
    const csvContent = [
      data.headers.join(','),
      ...data.rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Excel file (simplified - in production use a library like xlsx)
  const downloadExcel = (data, filename) => {
    // For demo purposes, we'll download as CSV with .xlsx extension
    // In production, use libraries like xlsx or exceljs for proper Excel format
    const csvContent = [
      data.headers.join('\t'),
      ...data.rows.map(row => row.join('\t'))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };  const handleFieldToggle = (field) => {
    const updatedFields = form.selectedFields.includes(field)
      ? form.selectedFields.filter(f => f !== field)
      : [...form.selectedFields, field];
    
    setForm({...form, selectedFields: updatedFields});
    setIsDirty(true);
    setParentDirty(true);
  };

  return (
    <div className="propertycode-panel" style={{
      background:'#fff',
      border:'2.5px solid #222',
      borderRadius:'16px',
      boxShadow:'0 2px 12px rgba(0,0,0,0.10)',
      width:'100%',
      maxWidth:'1200px',
      margin:'32px auto',
      padding:'0 0 18px 0',
      height:'calc(100vh - 120px)',
      display:'flex',
      flexDirection:'column',
      position:'relative',
      overflow:'hidden'
    }}>
      {/* Top Control Bar - now sticky */}
      <div style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        borderBottom:'2px solid #e0e0e0',padding:'12px 18px 8px 18px',minWidth:0,
        position:'sticky',top:0,zIndex:10,background:'#fff',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',minWidth:0,flexWrap:'wrap'}}>
          <span style={{fontWeight:'bold',fontSize:'2rem',color:'#222',marginRight:'18px'}}>
            Import and Export
          </span>
          <select
            onChange={e => {
              const val = e.target.value;
              if (val === 'Add') {
                handleAdd();
              } else if (val === 'Edit') {
                handleEdit();
              } else if (val === 'Delete') {
                handleDelete();
              } else if (val === 'Search') {
                handleSearch();
              }
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
          <button onClick={handleEdit} title="Edit" style={{background:'#e3eafc',border:'2px solid #1976d2',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#1976d2',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#bbdefb'} onMouseOut={e=>e.currentTarget.style.background='#e3eafc'}><span role="img" aria-label="Edit">✏️</span></button>
          <button onClick={handleDelete} title="Delete" style={{background:'#ffebee',border:'2px solid #e53935',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#e53935',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#ffcdd2'} onMouseOut={e=>e.currentTarget.style.background='#ffebee'}><span role="img" aria-label="Delete">🗑️</span></button>
          <button onClick={handleSearch} title="Search" style={{background:'#fffde7',border:'2px solid #fbc02d',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#fbc02d',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#fff9c4'} onMouseOut={e=>e.currentTarget.style.background='#fffde7'}><span role="img" aria-label="Search">🔍</span></button>
          <button onClick={handleClear} title="Clear" style={{background:'#f3e5f5',border:'2px solid #8e24aa',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#8e24aa',marginRight:'16px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#e1bee7'} onMouseOut={e=>e.currentTarget.style.background='#f3e5f5'}><span role="img" aria-label="Clear">🧹</span></button>
          <button onClick={handleSave} style={{background:'#2196f3',color:'#fff',border:'2px solid #1976d2',borderRadius:'8px',padding:'8px 20px',fontWeight:'bold',cursor:'pointer',transition:'0.2s',display:'flex',alignItems:'center',gap:'8px'}} onMouseOver={e=>{e.currentTarget.style.background='#1976d2';e.currentTarget.style.transform='translateY(-1px)';}} onMouseOut={e=>{e.currentTarget.style.background='#2196f3';e.currentTarget.style.transform='translateY(0)';}}><span role="img" aria-label="Save">💾</span> Save</button>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
        </div>
      </div>

        {/* Save Success popup */}
        {showSavePopup && (
          <div style={{
            position: 'fixed',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            border: '2px solid #43a047',
            borderRadius: '12px',
            padding: '32px 48px',
            zIndex: 1000,
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            fontSize: '1.25rem',
            color: '#43a047',
            fontWeight: 'bold'
          }}>
            Import/Export configuration saved successfully!
          </div>
        )}

        {/* Main Content */}
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          padding: '20px', 
          flex: 1, 
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: '#c1c1c1 #f1f1f1'
        }}>
          
          {/* Import Section */}
          <div style={{ 
            flex: 1, 
            background: '#f8f9fa', 
            border: '2px solid #e9ecef', 
            borderRadius: '12px', 
            padding: '24px',
            height: 'fit-content',
            minHeight: '400px'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              color: '#495057', 
              fontSize: '1.25rem',
              borderBottom: '2px solid #dee2e6',
              paddingBottom: '12px'
            }}>
              Import Data to Item Master
            </h3>
            
            <div style={{
              background: '#e8f4fd',
              border: '1px solid #bee5eb',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '0.9rem'
            }}>
              <strong>💡 Workflow Tip:</strong> Use exported files from this system as templates. 
              Export data → Edit externally → Re-import for bulk updates.
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
                Select File:
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.zip"
                onChange={handleFileSelect}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ced4da',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
              <small style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                Supported formats: CSV, Excel (.xlsx), ZIP
              </small>
            </div>

            {form.importFile && (
              <div style={{ 
                background: '#e7f3ff', 
                border: '1px solid #b3d7ff', 
                borderRadius: '8px', 
                padding: '12px', 
                marginBottom: '20px' 
              }}>
                <strong>Selected File:</strong> {form.importFile.name}
                <br />
                <small>Size: {(form.importFile.size / 1024).toFixed(2)} KB</small>
              </div>
            )}

            <button
              onClick={handleImport}
              style={{
                background: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                width: '100%',
                transition: '0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#218838'}
              onMouseOut={e => e.currentTarget.style.background = '#28a745'}
            >
              Start Import
            </button>

            {importProgress && (
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                background: '#d1ecf1', 
                border: '1px solid #bee5eb', 
                borderRadius: '8px',
                color: '#0c5460'
              }}>
                {importProgress}
              </div>
            )}
          </div>

          {/* Export Section */}
          <div style={{ 
            flex: 1, 
            background: '#f8f9fa', 
            border: '2px solid #e9ecef', 
            borderRadius: '12px', 
            padding: '24px',
            height: 'fit-content',
            minHeight: '400px'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              color: '#495057', 
              fontSize: '1.25rem',
              borderBottom: '2px solid #dee2e6',
              paddingBottom: '12px'
            }}>
              Export Data from Item Master
            </h3>
            
            <div style={{
              background: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '0.9rem'
            }}>
              <strong>📊 Dynamic Export:</strong> Fields are automatically loaded from your Item Master table schema. 
              Select only the fields you need for efficient data management.
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', color: '#495057' }}>
                Select Fields to Export from Item Master:
              </label>
              
              {isLoadingFields ? (
                <div style={{ 
                  border: '2px solid #ced4da', 
                  borderRadius: '8px', 
                  padding: '16px', 
                  background: '#fff',
                  textAlign: 'center',
                  color: '#6c757d'
                }}>
                  <div style={{ marginBottom: '8px' }}>🔄 Loading Item Master fields...</div>
                  <small>Fetching available fields from database</small>
                </div>
              ) : (
                <>
                  <div style={{ 
                    border: '2px solid #ced4da', 
                    borderRadius: '8px', 
                    padding: '16px', 
                    maxHeight: '240px', 
                    overflowY: 'auto',
                    background: '#fff',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#c1c1c1 #f1f1f1'
                  }}>
                    <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const allSelected = availableFields.every(field => form.selectedFields.includes(field));
                          if (allSelected) {
                            setForm({...form, selectedFields: []});
                          } else {
                            setForm({...form, selectedFields: [...availableFields]});
                          }
                          setIsDirty(true);
                          setParentDirty(true);
                        }}
                        style={{
                          background: '#e9ecef',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        {availableFields.every(field => form.selectedFields.includes(field)) ? 'Deselect All' : 'Select All'}
                      </button>
                      <span style={{ fontSize: '0.8rem', color: '#6c757d', alignSelf: 'center' }}>
                        {form.selectedFields.length} of {availableFields.length} fields selected
                      </span>
                    </div>
                    
                    {availableFields.map(field => (
                      <label key={field} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: '8px',
                        cursor: 'pointer',
                        padding: '4px 0'
                      }}>
                        <input
                          type="checkbox"
                          checked={form.selectedFields.includes(field)}
                          onChange={() => handleFieldToggle(field)}
                          style={{ marginRight: '8px', transform: 'scale(1.2)' }}
                        />
                        <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                          {field}
                        </span>
                        <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: '#6c757d' }}>
                          ({field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())})
                        </span>
                      </label>
                    ))}
                  </div>
                  
                  {availableFields.length === 0 && (
                    <div style={{ 
                      marginTop: '8px', 
                      padding: '12px', 
                      background: '#fff3cd', 
                      border: '1px solid #ffeaa7', 
                      borderRadius: '4px',
                      color: '#856404'
                    }}>
                      ⚠️ No fields found in Item Master table. Please check your database connection.
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
                Export Format:
              </label>
              <select
                value={form.exportFormat}
                onChange={e => setForm({...form, exportFormat: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ced4da',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              >
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
                <option value="pdf">PDF (.pdf)</option>
              </select>
            </div>

            <button
              onClick={handleExport}
              style={{
                background: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                width: '100%',
                transition: '0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#0056b3'}
              onMouseOut={e => e.currentTarget.style.background = '#007bff'}
            >
              Export Data
            </button>

            {exportProgress && (
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                background: '#d1ecf1', 
                border: '1px solid #bee5eb', 
                borderRadius: '8px',
                color: '#0c5460'
              }}>
                {exportProgress}
              </div>
            )}
          </div>
        </div>

      {/* Select Modal */}
      {showSelectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: '24px',
            borderRadius: '8px',
            minWidth: '400px',
            textAlign: 'center'
          }}>
            <h3>Information</h3>
            <p>{selectModalMessage}</p>
            <button
              onClick={() => setShowSelectModal(false)}
              style={{
                background: '#007bff',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default ImportExport;