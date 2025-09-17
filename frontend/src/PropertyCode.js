import React from 'react';
import './Dashboard.css';

const exportIcons = [
  { alt: 'Excel', src: 'https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/excel.svg' },
  { alt: 'Word', src: 'https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/word.svg' },
  { alt: 'PDF', src: 'https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/pdf.svg' }
];

export default function PropertyCode() {
  return (
  <div className="propertycode-panel" style={{background:'#fff',border:'2.5px solid #bdbdbd',borderRadius:'12px',boxShadow:'0 2px 12px rgba(0,0,0,0.10)',width:'100%',maxWidth:'1200px',margin:'32px auto',padding:'0 0 18px 0',minHeight:'calc(100vh - 140px)'}}>
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
      {/* Form Section - perfectly aligned grid */}
      <form className="propertycode-form" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 32px',padding:'24px 32px 0 32px'}}>
        {/* Left and Right Fields in grid rows */}
        {[
          ['Applicable From', <input type="date" style={{width:'100%',height:'32px',fontSize:'1.08rem',border:'1.5px solid #bbb',borderRadius:'4px',padding:'0 8px'}} />],
          ['Property Code', <input type="text" style={{width:'100%',height:'32px',fontSize:'1.08rem',border:'1.5px solid #bbb',borderRadius:'4px',padding:'0 8px'}} />],
          ['Property Name', <input type="text" style={{width:'100%',height:'32px',fontSize:'1.08rem',border:'1.5px solid #bbb',borderRadius:'4px',padding:'0 8px'}} />],
          ['Nick Name', <input type="text" style={{width:'100%',height:'32px',fontSize:'1.08rem',border:'1.5px solid #bbb',borderRadius:'4px',padding:'0 8px'}} />],
          ['Owner Name', <input type="text" style={{width:'100%',height:'32px',fontSize:'1.08rem',border:'1.5px solid #bbb',borderRadius:'4px',padding:'0 8px'}} />],
          ['Address Name', <input type="text" style={{width:'100%',height:'32px',fontSize:'1.08rem',border:'1.5px solid #bbb',borderRadius:'4px',padding:'0 8px'}} />],
          ['GST Number', <input type="text" style={{width:'100%',height:'32px',fontSize:'1.08rem',border:'1.5px solid #bbb',borderRadius:'4px',padding:'0 8px'}} />],
          ['PAN Number', <input type="text" style={{width:'100%',height:'32px',fontSize:'1.08rem',border:'1.5px solid #bbb',borderRadius:'4px',padding:'0 8px'}} />]
        ].map(([label, input], i) => (
          <div key={label} style={{display:'flex',alignItems:'center',marginBottom:'18px'}}>
            <label style={{width:'160px',fontWeight:'500',color:'#222',fontSize:'1.08rem',marginRight:'12px'}}>{label}</label>
            {input}
          </div>
        ))}
        {[
          ['Group Name', <input type="text" style={{width:'100%',height:'32px',fontSize:'1.08rem',border:'1.5px solid #bbb',borderRadius:'4px',padding:'0 8px'}} />],
          ['Local Currency', <input type="text" style={{width:'100%',height:'32px',fontSize:'1.08rem',border:'1.5px solid #bbb',borderRadius:'4px',padding:'0 8px'}} />],
          ['Currency Format', <input type="text" style={{width:'100%',height:'32px',fontSize:'1.08rem',border:'1.5px solid #bbb',borderRadius:'4px',padding:'0 8px'}} />],
          ['Symbol', <input type="text" style={{width:'100%',height:'32px',fontSize:'1.08rem',border:'1.5px solid #bbb',borderRadius:'4px',padding:'0 8px'}} />],
          ['Decimal', <input type="number" min="0" max="4" style={{width:'100%',height:'32px',fontSize:'1.08rem',border:'1.5px solid #bbb',borderRadius:'4px',padding:'0 8px'}} />],
          ['Date Format', <input type="text" style={{width:'100%',height:'32px',fontSize:'1.08rem',border:'1.5px solid #bbb',borderRadius:'4px',padding:'0 8px'}} />],
          ['Round Off', <input type="text" style={{width:'100%',height:'32px',fontSize:'1.08rem',border:'1.5px solid #bbb',borderRadius:'4px',padding:'0 8px'}} />],
          ['Property Logo', <span><input type="file" style={{marginRight:'8px'}} /><button type="button" style={{background:'#90caf9',color:'#fff',border:'none',borderRadius:'4px',padding:'4px 12px',marginLeft:'8px'}}>Upload</button></span>]
        ].map(([label, input], i) => (
          <div key={label} style={{display:'flex',alignItems:'center',marginBottom:'18px'}}>
            <label style={{width:'160px',fontWeight:'500',color:'#222',fontSize:'1.08rem',marginRight:'12px'}}>{label}</label>
            {input}
          </div>
        ))}
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
