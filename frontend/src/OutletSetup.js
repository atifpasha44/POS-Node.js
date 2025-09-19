import React, { useState, useEffect } from 'react';
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

  // Handlers
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name in form.options) {
      setForm(f => ({ ...f, options: { ...f.options, [name]: checked } }));
      setIsDirty(true);
      if (setParentDirty) setParentDirty(true);
    } else if (type === 'checkbox' && name === 'inactive') {
      setForm(f => ({ ...f, inactive: checked }));
      setIsDirty(true);
      if (setParentDirty) setParentDirty(true);
    } else {
      setForm(f => ({ ...f, [name]: value }));
      setIsDirty(true);
      if (setParentDirty) setParentDirty(true);
    }
  };
  const handleClear = () => { setForm(initialState); setIsDirty(false); if (setParentDirty) setParentDirty(false); };
  const handleSave = () => { /* TODO: POST to backend */ alert('Saved!'); setIsDirty(false); if (setParentDirty) setParentDirty(false); };
  const handleSearch = () => { alert('Search modal would open.'); };
  const handleDelete = () => { alert('Deleted!'); };
  const handleAdd = () => { setAction('Add'); handleClear(); };
  const handleEdit = () => { setAction('Edit'); };
  const handleExport = type => { alert('Export to ' + type); };

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

  return (
    <div className="propertycode-panel" style={{background:'#fff',border:'2.5px solid #222',borderRadius:'16px',boxShadow:'0 2px 12px rgba(0,0,0,0.10)',width:'100%',maxWidth:'1200px',margin:'32px auto',padding:'0 0 18px 0',height:'calc(100vh - 120px)',display:'flex',flexDirection:'column',overflowY:'auto'}}>
      {/* Top Control Bar */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'2px solid #e0e0e0',padding:'12px 18px 8px 18px',minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',minWidth:0,flexWrap:'wrap'}}>
          <span style={{fontWeight:'bold',fontSize:'2rem',color:'#222',marginRight:'18px'}}>Outlet Setup</span>
          <select value={action} onChange={e=>setAction(e.target.value)} style={{fontWeight:'bold',fontSize:'1rem',padding:'4px 12px',borderRadius:'6px',border:'1.5px solid #bbb',marginRight:'8px'}}>
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
          <button onClick={handleSave} title="Save" style={{background:'#e3f2fd',border:'2px solid #1976d2',borderRadius:'8px',fontWeight:'bold',color:'#1976d2',fontSize:'1.15rem',padding:'4px 18px',marginLeft:'8px',cursor:'pointer',transition:'0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#bbdefb'} onMouseOut={e=>e.currentTarget.style.background='#e3f2fd'}><span style={{fontWeight:'bold'}}><span role="img" aria-label="Save">💾</span> SAVE</span></button>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'8px',minWidth:0,flexWrap:'wrap'}}>
          <span style={{fontSize:'1.08rem',color:'#888',marginRight:'8px',whiteSpace:'nowrap'}}>Export Report to</span>
          <img src="https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/excel.svg" alt="Excel" style={{width:'28px',height:'28px',marginRight:'2px',cursor:'pointer',verticalAlign:'middle'}} onClick={()=>handleExport('Excel')} />
          <img src="https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/pdf.svg" alt="PDF" style={{width:'28px',height:'28px',marginRight:'2px',cursor:'pointer',verticalAlign:'middle'}} onClick={()=>handleExport('PDF')} />
        </div>
      </div>
      {/* Form Section - two columns, bold labels */}
      <form className="propertycode-form" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 32px',padding:'32px 32px 0 32px'}}>
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
