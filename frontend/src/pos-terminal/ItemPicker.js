import React from 'react';

export default function ItemPicker({ category, items, priceField, onSelectItem, onClose }) {
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, background: '#fff',
      borderTop: '2px solid #ccc', boxShadow: '0 -4px 16px rgba(0,0,0,0.15)',
      maxHeight: '65%', overflowY: 'auto', padding: '14px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{category.name}</div>
        <button onClick={onClose} style={{ background: '#eee', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
        {items.map(item => (
          <div
            key={item.item_code}
            onClick={() => onSelectItem(item)}
            style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '8px', textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}
          >
            <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
              {item.item_logo_url ? (
                <img src={item.item_logo_url} alt={item.item_name} style={{ maxHeight: '60px', maxWidth: '100%' }} />
              ) : (
                <span style={{ fontSize: '1.8rem' }}>🍽️</span>
              )}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#333' }}>{item.short_name || item.item_name}</div>
            <div style={{ fontSize: '0.8rem', color: '#1976d2', fontWeight: 'bold' }}>
              {parseFloat(item[priceField] || 0).toFixed(2)}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ gridColumn: '1 / -1', color: '#888', padding: '10px' }}>No items in this category yet.</div>
        )}
      </div>
    </div>
  );
}
