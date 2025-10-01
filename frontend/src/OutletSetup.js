import React, { useState, useEffect, useRef } from 'react';
import './Dashboard.css';

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


export default function OutletSetup({ setParentDirty }) {
  const [form, setForm] = useState(initialState);
  const [action, setAction] = useState('Add');
  const [isDirty, setIsDirty] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedRecordIdx, setSelectedRecordIdx] = useState(null);
  const [showNoChangePopup, setShowNoChangePopup] = useState(false);
  const [selectModalMessage, setSelectModalMessage] = useState('');
  const [records, setRecords] = useState([]);
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

  // Handlers
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name in form.options) {
      setForm(f => ({ ...f, options: { ...f.options, [name]: checked } }));
    } else if (type === 'checkbox' && name === 'inactive') {
      setForm(f => ({ ...f, inactive: checked }));
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
  const handleSave = () => {
    setRecords(prev => {
      if (action === 'Edit' && selectedRecordIdx !== null) {
        const updated = [...prev];
        updated[selectedRecordIdx] = { ...form };
        setShowSavePopup(true);
        setTimeout(() => setShowSavePopup(false), 1800);
        setIsDirty(false);
        if (setParentDirty) setParentDirty(false);
        setSelectedRecordIdx(null);
        setForm(initialState);
        return updated;
      }
      if (action === 'Delete' && selectedRecordIdx !== null) {
        const updated = prev.filter((_, i) => i !== selectedRecordIdx);
        setShowSavePopup(true);
        setTimeout(() => setShowSavePopup(false), 1800);
        setForm(initialState);
        setSelectedRecordIdx(null);
        setIsDirty(false);
        setAction('Add');
        if (setParentDirty) setParentDirty(false);
        return updated;
      }
      // Add mode: check for duplicate outlet_code
      if (prev.some(rec => rec.outlet_code === form.outlet_code)) {
        alert('Outlet Code must be unique.');
        return prev;
      }
      setShowSavePopup(true);
      setTimeout(() => setShowSavePopup(false), 1800);
      setIsDirty(false);
      if (setParentDirty) setParentDirty(false);
      setSelectedRecordIdx(null);
      setForm(initialState);
      return [...prev, { ...form }];
    });
  };
  const handleSearch = () => {
    setAction('Search');
    setShowSelectModal(true);
    setSelectModalMessage('Please select a record to view.');
  };
  const handleAdd = () => {
    setAction('Add');
    setForm(initialState);
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
    setSelectedRecordIdx(null);
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
  const handleExport = type => {
    // Prepare data for export (all records)
    const exportData = records.length ? records : [form];
    if (type === 'Excel') {
      alert('Export to Excel (implement XLSX logic)');
    } else if (type === 'PDF') {
      alert('Export to PDF (implement jsPDF logic)');
    }
  };
  const handleSelectRecord = idx => {
    setForm(records[idx]);
    setSelectedRecordIdx(idx);
    setShowSelectModal(false);
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
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
            <div style={{fontWeight:'bold',fontSize:'1.2rem',marginBottom:'18px',color:'#1976d2'}}>{selectModalMessage || 'Select a record to edit/delete'}</div>
            {records.length === 0 ? (
              <div style={{color:'#888',fontSize:'1.05rem'}}>No records found.</div>
            ) : (
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
                  {records.map((rec, idx) => (
                    <tr key={idx} style={{background: idx%2 ? '#f7f7f7' : '#fff'}}>
                      <td style={{padding:'6px 8px'}}>{rec.outlet_code}</td>
                      <td style={{padding:'6px 8px'}}>{rec.outlet_name}</td>
                      <td style={{padding:'6px 8px'}}>{rec.property}</td>
                      <td style={{padding:'6px 8px'}}>
                        <button type="button" style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:'6px',padding:'4px 12px',fontWeight:'bold',cursor:'pointer'}} onClick={()=>handleSelectRecord(idx)}>Select</button>
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
      {/* Form Section - two columns, bold labels */}
      <form ref={formRef} className="propertycode-form" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 32px',padding:'32px 32px 0 32px'}}>
        {/* Left column */}
        <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Property</label>
            <input type="text" name="property" value={form.property} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px'}} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Outlet Code</label>
            <input type="text" name="outlet_code" value={form.outlet_code} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px'}} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Short Name</label>
            <input type="text" name="short_name" value={form.short_name} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px'}} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Item Price Level</label>
            <input type="text" name="item_price_level" value={form.item_price_level} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px'}} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Check Format</label>
            <input type="text" name="check_format" value={form.check_format} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px'}} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Kitchen Format</label>
            <input type="text" name="kitchen_format" value={form.kitchen_format} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px'}} />
          </div>
        </div>
        {/* Right column */}
        <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Applicable From</label>
            <input type="date" name="applicable_from" value={form.applicable_from} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px'}} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Outlet Name</label>
            <input type="text" name="outlet_name" value={form.outlet_name} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px'}} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Outlet Type</label>
            <input type="text" name="outlet_type" value={form.outlet_type} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px'}} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Check Prefix</label>
            <input type="text" name="check_prefix" value={form.check_prefix} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px'}} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Receipt Format</label>
            <input type="text" name="receipt_format" value={form.receipt_format} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px'}} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>In Active</label>
            <input type="checkbox" name="inactive" checked={form.inactive} onChange={handleChange} style={{width:'24px',height:'24px',marginLeft:'8px'}} />
          </div>
        </div>
      </form>
      {/* Options Section - checkboxes */}
      <div style={{display:'flex',flexWrap:'wrap',gap:'32px',padding:'24px 32px 0 32px'}}>
        <div style={{display:'flex',gap:'24px',flexWrap:'wrap'}}>
          <label style={{fontWeight:'bold'}}><input type="checkbox" name="cash" checked={form.options.cash} onChange={handleChange} style={{marginRight:'6px'}} />Cash</label>
          <label style={{fontWeight:'bold'}}><input type="checkbox" name="card" checked={form.options.card} onChange={handleChange} style={{marginRight:'6px'}} />Card</label>
          <label style={{fontWeight:'bold'}}><input type="checkbox" name="company" checked={form.options.company} onChange={handleChange} style={{marginRight:'6px'}} />Company</label>
          <label style={{fontWeight:'bold'}}><input type="checkbox" name="room_guest" checked={form.options.room_guest} onChange={handleChange} style={{marginRight:'6px'}} />Room Guest</label>
          <label style={{fontWeight:'bold'}}><input type="checkbox" name="staff" checked={form.options.staff} onChange={handleChange} style={{marginRight:'6px'}} />Staff</label>
          <label style={{fontWeight:'bold'}}><input type="checkbox" name="bill_on_hold" checked={form.options.bill_on_hold} onChange={handleChange} style={{marginRight:'6px'}} />Bill on Hold</label>
          <label style={{fontWeight:'bold'}}><input type="checkbox" name="credit" checked={form.options.credit} onChange={handleChange} style={{marginRight:'6px'}} />Credit</label>
          <label style={{fontWeight:'bold'}}><input type="checkbox" name="void" checked={form.options.void} onChange={handleChange} style={{marginRight:'6px'}} />Void</label>
        </div>
      </div>
    </div>
  );
}
