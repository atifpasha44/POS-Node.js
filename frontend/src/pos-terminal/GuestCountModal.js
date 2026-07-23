import React, { useState } from 'react';

const KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '←'];

export default function GuestCountModal({ tableCode, maxGuests, onCancel, onConfirm }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleKey = (key) => {
    setError('');
    if (key === '←') {
      setValue(v => v.slice(0, -1));
    } else if (key === '.') {
      // guest count is a whole number - ignore decimal point
    } else {
      setValue(v => (v + key).slice(0, 3));
    }
  };

  const handleEnter = () => {
    const count = parseInt(value, 10);
    if (!count || count < 1) return;
    if (maxGuests && count > maxGuests) {
      setError(`Only ${maxGuests} pax allowed for this table.`);
      return;
    }
    onConfirm(count);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 3000
    }}>
      <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', minWidth: '380px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '4px', color: '#1976d2' }}>WELCOME</div>
        <div style={{ borderBottom: '1px solid #ddd', marginBottom: '16px' }} />
        <div style={{ marginBottom: '12px', fontSize: '0.95rem' }}>
          Please input the no. of guest for table {tableCode}{maxGuests ? ` (max ${maxGuests} pax)` : ''}:
        </div>
        <input
          type="text" value={value} readOnly
          style={{ width: '100%', height: '40px', fontSize: '1.2rem', textAlign: 'center', border: '1.5px solid #bbb', borderRadius: '6px', marginBottom: '6px' }}
        />
        {error && (
          <div style={{ color: '#e53935', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '10px' }}>{error}</div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px', marginBottom: '18px' }}>
          {KEYS.map(key => (
            <button key={key} type="button" onClick={() => handleKey(key)} style={{
              height: '48px', fontSize: '1.2rem', fontWeight: 'bold', border: '1px solid #ccc',
              borderRadius: '6px', background: '#f5f5f5', cursor: 'pointer'
            }}>{key}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={{
            background: '#888', color: '#fff', border: 'none', borderRadius: '6px',
            padding: '10px 22px', fontSize: '1rem', cursor: 'pointer'
          }}>Cancel</button>
          <button type="button" onClick={handleEnter} style={{
            background: '#1976d2', color: '#fff', border: 'none', borderRadius: '6px',
            padding: '10px 22px', fontSize: '1rem', cursor: 'pointer'
          }}>Enter</button>
        </div>
      </div>
    </div>
  );
}
