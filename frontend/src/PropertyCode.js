import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Dashboard.css';

const initialState = {
  applicable_from: '', property_code: '', property_name: '', nick_name: '', owner_name: '', address_name: '', gst_number: '', pan_number: '',
  group_name: '', local_currency: '', currency_format: '', symbol: '', decimal: '', date_format: '', round_off: '', property_logo: null
};

export default function PropertyCode({ setParentDirty }) {
  const [isDirty, setIsDirty] = useState(false);
  const [form, setForm] = useState(initialState);
  const [logoPreview, setLogoPreview] = useState(null);
  const [action, setAction] = useState('Add');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [records, setRecords] = useState([]); // in-memory demo data
  const [selectedRecordIdx, setSelectedRecordIdx] = useState(null);
  const [showNoChangePopup, setShowNoChangePopup] = useState(false);
  const formRef = useRef(null);

  // Handlers
  // Helper: should fields be disabled (Delete mode, record selected)
  const isDeleteLocked = action === 'Delete' && selectedRecordIdx !== null;
  const handleChange = e => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setForm(f => ({ ...f, property_logo: files[0] }));
      setLogoPreview(files[0] ? URL.createObjectURL(files[0]) : null);
      setIsDirty(true);
      if (setParentDirty) setParentDirty(true);
    } else {
      setForm(f => ({ ...f, [name]: value }));
      setIsDirty(true);
      if (setParentDirty) setParentDirty(true);
    }
  };
  const handleClear = () => {
    setForm(initialState);
    setLogoPreview(null);
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
    setSelectedRecordIdx(null); // Unlock Delete state if in Delete mode
    setAction('Add'); // Optionally reset action to Add for a fresh start
  };
  const handleSave = () => {
    setRecords(prev => {
      const code = (form.property_code || '').trim();
      if (!code) return prev;
      if (action === 'Edit' && selectedRecordIdx !== null) {
        if (prev.some((rec, i) => i !== selectedRecordIdx && rec.property_code === code)) {
          alert('Property Code must be unique.');
          return prev;
        }
        // Check if any data has changed
        const original = prev[selectedRecordIdx];
        const changed = Object.keys(form).some(key => form[key] !== original[key]);
        if (!changed) {
          setShowNoChangePopup(true);
          setTimeout(() => setShowNoChangePopup(false), 1800);
          setForm(initialState);
          setLogoPreview(null);
          setSelectedRecordIdx(null);
          setIsDirty(false);
          if (setParentDirty) setParentDirty(false);
          return prev;
        }
        const updated = [...prev];
        updated[selectedRecordIdx] = { ...form };
        setShowSavePopup(true);
        setTimeout(() => setShowSavePopup(false), 1800);
        setIsDirty(false);
        if (setParentDirty) setParentDirty(false);
        setSelectedRecordIdx(null);
        setForm(initialState); setLogoPreview(null);
        return updated;
      }
      if (action === 'Delete' && selectedRecordIdx !== null) {
        // Only delete on Save in Delete mode
        const updated = prev.filter((_, i) => i !== selectedRecordIdx);
        setShowSavePopup(true);
        setTimeout(() => setShowSavePopup(false), 1800);
        setForm(initialState);
        setLogoPreview(null);
        setSelectedRecordIdx(null);
        setIsDirty(false);
        setAction('Add');
        if (setParentDirty) setParentDirty(false);
        return updated;
      }
      // Add mode: check for duplicate code
      if (prev.some(rec => rec.property_code === code)) {
        alert('Property Code must be unique.');
        return prev;
      }
      setShowSavePopup(true);
      setTimeout(() => setShowSavePopup(false), 1800);
      setIsDirty(false);
      if (setParentDirty) setParentDirty(false);
      setSelectedRecordIdx(null);
      setForm(initialState); setLogoPreview(null);
      return [...prev, { ...form }];
    });
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
  const handleSearch = () => { setShowSelectModal(true); };
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
    if (setParentDirty) setParentDirty(false);
    setSelectedRecordIdx(null);
  };
  const handleEdit = () => {
    setAction('Edit');
    setSelectedRecordIdx(null);
    setShowSelectModal(true);
  };
  const handleDelete = () => {
    setAction('Delete');
    setShowSelectModal(true);
  };

  // When a record is selected from modal
  const handleSelectRecord = idx => {
    setForm(records[idx]);
    setSelectedRecordIdx(idx);
    setShowSelectModal(false);
    setIsDirty(false);
    if (setParentDirty) setParentDirty(false);
    // For Delete, just show the data for review, require Save to confirm deletion
    // Do NOT delete here, only on Save
  };


  // Export handlers
  const handleExport = type => {
    // Prepare data for export (all records)
    const exportData = records.length ? records : [form];
    if (type === 'Excel') {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'PropertyCodes');
      XLSX.writeFile(wb, 'PropertyCodes.xlsx');
    } else if (type === 'PDF') {
      const doc = new jsPDF();
      const columns = [
        'Applicable From', 'Property Code', 'Property Name', 'Nick Name', 'Owner Name', 'Address Name', 'GST Number', 'PAN Number',
        'Group Name', 'Local Currency', 'Currency Format', 'Symbol', 'Decimal', 'Date Format', 'Round Off'
      ];
      const rows = exportData.map(rec => [
        rec.applicable_from, rec.property_code, rec.property_name, rec.nick_name, rec.owner_name, rec.address_name, rec.gst_number, rec.pan_number,
        rec.group_name, rec.local_currency, rec.currency_format, rec.symbol, rec.decimal, rec.date_format, rec.round_off
      ]);
  autoTable(doc, { head: [columns], body: rows });
      doc.save('PropertyCodes.pdf');
    }
  };

  return (
  <div className="propertycode-panel" style={{background:'#fff',border:'2.5px solid #222',borderRadius:'16px',boxShadow:'0 2px 12px rgba(0,0,0,0.10)',width:'100%',maxWidth:'1200px',margin:'32px auto',padding:'0 0 18px 0',height:'calc(100vh - 120px)',display:'flex',flexDirection:'column',overflowY:'auto',position:'relative'}}>
      {/* Top Control Bar */}
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'2px solid #e0e0e0',padding:'12px 18px 8px 18px',minWidth:0}}>
  <div style={{display:'flex',alignItems:'center',gap:'8px',minWidth:0,flexWrap:'wrap'}}>
          <span style={{fontWeight:'bold',fontSize:'2rem',color:'#222',marginRight:'18px'}}>Property Code</span>
          <select value={action} onChange={e=>setAction(e.target.value)} style={{fontWeight:'bold',fontSize:'1rem',padding:'4px 12px',borderRadius:'6px',border:'1.5px solid #bbb',marginRight:'8px'}} disabled={isDeleteLocked}>
            <option value="Add">Action</option>
            <option value="Add">Add</option>
            <option value="Edit">Edit</option>
            <option value="Delete">Delete</option>
            <option value="Search">Search</option>
          </select>
          <button onClick={handleAdd} title="Add" style={{background:'#e3fcec',border:'2px solid #43a047',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#43a047',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#c8e6c9'} onMouseOut={e=>e.currentTarget.style.background='#e3fcec'} disabled={isDeleteLocked}><span role="img" aria-label="Add">➕</span></button>
          <button onClick={handleEdit} title="Modify/Edit" style={{background:'#e3eafc',border:'2px solid #1976d2',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#1976d2',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#bbdefb'} onMouseOut={e=>e.currentTarget.style.background='#e3eafc'} disabled={isDeleteLocked}><span role="img" aria-label="Edit">✏️</span></button>
          <button onClick={handleDelete} title="Delete" style={{background:'#ffebee',border:'2px solid #e53935',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#e53935',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#ffcdd2'} onMouseOut={e=>e.currentTarget.style.background='#ffebee'} disabled={isDeleteLocked}><span role="img" aria-label="Delete">🗑️</span></button>
          <button onClick={handleSearch} title="Search" style={{background:'#fffde7',border:'2px solid #fbc02d',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#fbc02d',marginRight:'4px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#fff9c4'} onMouseOut={e=>e.currentTarget.style.background='#fffde7'} disabled={isDeleteLocked}><span role="img" aria-label="Search">🔍</span></button>
          <button
            type="button"
            onClick={handleClear}
            title="Clear"
            style={{background:'#f3e5f5',border:'2px solid #8e24aa',borderRadius:'50%',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',color:'#8e24aa',marginRight:'4px',cursor:'pointer',transition:'0.2s'}}
            onMouseOver={e=>e.currentTarget.style.background='#e1bee7'}
            onMouseOut={e=>e.currentTarget.style.background='#f3e5f5'}
            disabled={isDeleteLocked}
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
        {action === 'Delete' ? 'Records deleted successfully.' : 'Data has been saved successfully.'}
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
          <div style={{fontWeight:'bold',fontSize:'1.2rem',marginBottom:'18px',color:'#1976d2'}}>Select a record to edit/delete</div>
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
                  <th style={{padding:'6px 8px',fontWeight:'bold',fontSize:'1rem'}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec, idx) => (
                  <tr key={idx} style={{background: idx%2 ? '#f7f7f7' : '#fff'}}>
                    <td style={{padding:'6px 8px'}}>{rec.applicable_from}</td>
                    <td style={{padding:'6px 8px'}}>{rec.property_code}</td>
                    <td style={{padding:'6px 8px'}}>{rec.property_name}</td>
                    <td style={{padding:'6px 8px'}}>{rec.owner_name}</td>
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
        {/* Left column */}
        <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Applicable From</label>
            <input type="date" name="applicable_from" value={form.applicable_from} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: (action==='Edit'&&selectedRecordIdx!==null)||isDeleteLocked?'#eee':'#fff'}} disabled={(action==='Edit'&&selectedRecordIdx!==null)||isDeleteLocked} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Property Code</label>
            <input type="text" name="property_code" value={form.property_code} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: (action==='Edit'&&selectedRecordIdx!==null)||isDeleteLocked?'#eee':'#fff'}} disabled={(action==='Edit'&&selectedRecordIdx!==null)||isDeleteLocked} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Property Name</label>
            <input type="text" name="property_name" value={form.property_name} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isDeleteLocked?'#eee':'#fff'}} disabled={isDeleteLocked} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Nick Name</label>
            <input type="text" name="nick_name" value={form.nick_name} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isDeleteLocked?'#eee':'#fff'}} disabled={isDeleteLocked} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Owner Name</label>
            <input type="text" name="owner_name" value={form.owner_name} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isDeleteLocked?'#eee':'#fff'}} disabled={isDeleteLocked} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Address Name</label>
            <input type="text" name="address_name" value={form.address_name} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isDeleteLocked?'#eee':'#fff'}} disabled={isDeleteLocked} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>GST Number</label>
            <input type="text" name="gst_number" value={form.gst_number} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isDeleteLocked?'#eee':'#fff'}} disabled={isDeleteLocked} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>PAN Number</label>
            <input type="text" name="pan_number" value={form.pan_number} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isDeleteLocked?'#eee':'#fff'}} disabled={isDeleteLocked} />
          </div>
        </div>
        {/* Right column */}
        <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Group Name</label>
            <input type="text" name="group_name" value={form.group_name} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isDeleteLocked?'#eee':'#fff'}} disabled={isDeleteLocked} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Local Currency</label>
            <input type="text" name="local_currency" value={form.local_currency} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isDeleteLocked?'#eee':'#fff'}} disabled={isDeleteLocked} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Currency Format</label>
            <input type="text" name="currency_format" value={form.currency_format} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isDeleteLocked?'#eee':'#fff'}} disabled={isDeleteLocked} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Symbol</label>
            <input type="text" name="symbol" value={form.symbol} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isDeleteLocked?'#eee':'#fff'}} disabled={isDeleteLocked} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Decimal</label>
            <input type="number" name="decimal" value={form.decimal} onChange={handleChange} min="0" max="4" style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isDeleteLocked?'#eee':'#fff'}} disabled={isDeleteLocked} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Date Format</label>
            <input type="text" name="date_format" value={form.date_format} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isDeleteLocked?'#eee':'#fff'}} disabled={isDeleteLocked} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Round Off</label>
            <input type="text" name="round_off" value={form.round_off} onChange={handleChange} style={{width:'80%',height:'36px',fontSize:'1.08rem',border:'2px solid #bbb',borderRadius:'6px',padding:'0 8px',background: isDeleteLocked?'#eee':'#fff'}} disabled={isDeleteLocked} />
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            <label style={{width:'180px',fontWeight:'bold',fontSize:'1.15rem',color:'#222'}}>Property Logo</label>
            <input type="file" name="property_logo" onChange={handleChange} style={{marginRight:'8px',width:'80%'}} disabled={isDeleteLocked} />
            <button type="button" style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:'6px',padding:'8px 18px',marginLeft:'8px',fontWeight:'bold',fontSize:'1.08rem',cursor:'pointer'}} disabled={isDeleteLocked}>UPLOAD</button>
            {logoPreview && <img src={logoPreview} alt="Logo Preview" style={{height:'38px',marginLeft:'12px',borderRadius:'6px'}} />}
          </div>
        </div>
      </form>
    </div>
  );
}
