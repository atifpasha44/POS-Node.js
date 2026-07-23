import React from 'react';

const ACTION_ROWS = [
  ['Pantry Message', 'Partial Send Check', 'Send Check'],
  ['Cancel', 'Guest Preview', 'Print Check'],
  ['Add/Edit Check Info', 'Comments', 'Payment']
];

export default function CartPanel({ table, guestCount, cart, onQtyChange, onCancel }) {
  const totalQty = cart.reduce((sum, line) => sum + line.qty, 0);
  const totalValue = cart.reduce((sum, line) => sum + line.qty * line.unit_price, 0);

  const handleAction = (label) => {
    if (label === 'Cancel') {
      onCancel();
      return;
    }
    // Send Check / Partial Send Check / Payment / KOT etc. land in Phase 3-4 (real checks + payments).
    alert(`"${label}" is coming in a later phase - not wired up yet.`);
  };

  return (
    <div style={{ width: '340px', display: 'flex', flexDirection: 'column', borderLeft: '2px solid #ccc', background: '#fff' }}>
      <div style={{ background: '#1976d2', color: '#fff', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
        <span>Table : {table.table_code}</span>
        <span>Cover : {guestCount}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '8px 12px', fontWeight: 'bold', borderBottom: '1px solid #ddd', fontSize: '0.85rem', color: '#555' }}>
        <span>Item</span><span style={{ textAlign: 'center' }}>Qty</span><span style={{ textAlign: 'right' }}>Value</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px' }}>
        {cart.map(line => (
          <div key={line.item_code} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontSize: '0.9rem' }}>{line.item_name}</span>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <button onClick={() => onQtyChange(line.item_code, -1)} style={{ width: '22px', height: '22px', border: '1px solid #ccc', borderRadius: '4px', background: '#f5f5f5', cursor: 'pointer' }}>−</button>
              <span>{line.qty}</span>
              <button onClick={() => onQtyChange(line.item_code, 1)} style={{ width: '22px', height: '22px', border: '1px solid #ccc', borderRadius: '4px', background: '#f5f5f5', cursor: 'pointer' }}>+</button>
            </span>
            <span style={{ textAlign: 'right', fontSize: '0.9rem' }}>{(line.qty * line.unit_price).toFixed(2)}</span>
          </div>
        ))}
        {cart.length === 0 && <div style={{ color: '#999', padding: '16px 0', textAlign: 'center' }}>No items added yet</div>}
      </div>
      <div style={{ padding: '8px 12px', borderTop: '1px solid #ddd', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
        <span>{totalQty}({cart.length})</span>
        <span>{totalValue.toFixed(2)}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', padding: '8px' }}>
        {ACTION_ROWS.flat().map(label => (
          <button
            key={label}
            onClick={() => handleAction(label)}
            style={{
              background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px',
              padding: '10px 4px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
