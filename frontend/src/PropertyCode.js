import React from 'react';
import './Dashboard.css';

const exportIcons = [
  { alt: 'Excel', src: 'https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/excel.svg' },
  { alt: 'Word', src: 'https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/word.svg' },
  { alt: 'PDF', src: 'https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/pdf.svg' }
];

export default function PropertyCode() {
  return (
    <div className="propertycode-panel" style={{background:'#fff',border:'2.5px solid #bdbdbd',borderRadius:'12px',boxShadow:'0 2px 12px rgba(0,0,0,0.10)',maxWidth:'980px',margin:'32px auto',padding:'0 0 18px 0'}}>
      {/* Top Section */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'2px solid #e0e0e0',padding:'12px 18px 8px 18px'}}>
        <div style={{display:'flex',alignItems:'center'}}>
          <span style={{fontWeight:'bold',fontSize:'1.25rem',color:'#222',marginRight:'18px'}}>Property Code</span>
          <button style={{background:'#e3f2fd',border:'1.5px solid #90caf9',borderRadius:'5px',padding:'4px 12px',fontWeight:'bold',color:'#1976d2',marginRight:'8px'}}>Actions</button>
          <span style={{marginRight:'8px',fontSize:'1.15rem',color:'#1976d2'}}>+</span>
          <span style={{marginRight:'8px',fontSize:'1.15rem',color:'#1976d2'}}>&#128465;</span>
          <span style={{marginRight:'8px',fontSize:'1.15rem',color:'#1976d2'}}>&#128269;</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <span style={{fontSize:'0.98rem',color:'#888',marginRight:'8px'}}>Export report to:</span>
          {exportIcons.map(icon => (
            <img key={icon.alt} src={icon.src} alt={icon.alt} style={{width:'28px',height:'28px',marginRight:'4px',verticalAlign:'middle',cursor:'pointer'}} />
          ))}
        </div>
      </div>
      {/* Form Section */}
      <form className="propertycode-form" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'18px 32px',padding:'24px 32px 0 32px'}}>
        {/* Left Side Fields */}
        <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
          <label>Applicable From<input type="date" /></label>
          <label>Property Code<input type="text" /></label>
          <label>Property Name<input type="text" /></label>
          <label>Nick Name<input type="text" /></label>
          <label>Owner Name<input type="text" /></label>
          <label>Address Name<input type="text" /></label>
          <label>GST Number<input type="text" /></label>
          <label>PAN Number<input type="text" /></label>
        </div>
        {/* Right Side Fields */}
        <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
          <label>Group Name<input type="text" /></label>
          <label>Local Currency<input type="text" /></label>
          <label>Currency Format<input type="text" /></label>
          <label>Symbol<input type="text" /></label>
          <label>Decimal<input type="number" min="0" max="4" /></label>
          <label>Date Format<input type="text" /></label>
          <label>Round Off<input type="text" /></label>
          <label>Property Logo<input type="file" style={{marginRight:'8px'}} /><button type="button" style={{background:'#90caf9',color:'#fff',border:'none',borderRadius:'4px',padding:'4px 12px',marginLeft:'8px'}}>Upload</button></label>
        </div>
      </form>
      {/* Bottom Section (Action Icons) */}
      <div style={{display:'flex',justifyContent:'center',gap:'48px',marginTop:'32px'}}>
        <button title="Save" style={{background:'none',border:'none',cursor:'pointer'}}><span style={{fontSize:'2.2rem',color:'#4caf50'}}>&#10004;</span></button>
        <button title="Edit" style={{background:'none',border:'none',cursor:'pointer'}}><span style={{fontSize:'2.2rem',color:'#1976d2'}}>&#9998;</span></button>
        <button title="Delete" style={{background:'none',border:'none',cursor:'pointer'}}><span style={{fontSize:'2.2rem',color:'#e53935'}}>&#128465;</span></button>
        <button title="Close" style={{background:'none',border:'none',cursor:'pointer'}}><span style={{fontSize:'2.2rem',color:'#e53935'}}>&#10006;</span></button>
      </div>
    </div>
  );
}
