import React from 'react';

const ACTION_ROWS = [
  ['Pantry Message', 'Partial Send Check', 'Send Check'],
  ['Cancel', 'Guest Preview', 'Print Check'],
  ['Add/Edit Check Info', 'Comments', 'Payment']
];

export default function CartPanel({
  table, guestCount, cart, onQtyChange, onUpdateNote, onCancel,
  onSendCheck, kotHistory, onReprintKot, onPrintCheck, onEditCheckInfo
}) {
  const totalQty = cart.reduce((sum, line) => sum + line.qty, 0);
  const totalValue = cart.reduce((sum, line) => sum + line.qty * line.unit_price, 0);

  const handleAction = (label) => {
    if (label === 'Cancel') {
      onCancel();
      return;
    }
    if (label === 'Print Check') {
      onPrintCheck();
      return;
    }
    if (label === 'Send Check' || label === 'Partial Send Check') {
      // Both send whatever hasn't already gone to the kitchen yet - once some
      // items are sent, sending again is naturally a "partial" send of the rest.
      onSendCheck();
      return;
    }
    if (label === 'Add/Edit Check Info') {
      onEditCheckInfo();
      return;
    }
    // Pantry Message / Guest Preview / Comments / Payment land in a later phase
    // (real checks + payments).
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
          <div key={line.lineId} style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', opacity: line.sent ? 0.55 : 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem' }}>
                {line.item_name} {line.sent && <span style={{ fontSize: '0.7rem', color: '#43a047' }}>✓ sent</span>}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <button onClick={() => onQtyChange(line.lineId, -1)} style={{ width: '22px', height: '22px', border: '1px solid #ccc', borderRadius: '4px', background: '#f5f5f5', cursor: 'pointer' }}>−</button>
                <span>{line.qty}</span>
                <button onClick={() => onQtyChange(line.lineId, 1)} style={{ width: '22px', height: '22px', border: '1px solid #ccc', borderRadius: '4px', background: '#f5f5f5', cursor: 'pointer' }}>+</button>
              </span>
              <span style={{ textAlign: 'right', fontSize: '0.9rem' }}>{(line.qty * line.unit_price).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
              <span style={{ fontSize: '0.75rem', color: '#888', fontStyle: 'italic' }}>{line.notes || ''}</span>
              <button onClick={() => onUpdateNote(line.lineId)} style={{ background: 'none', border: 'none', color: '#1976d2', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>
                {line.notes ? 'Edit note' : '+ Note'}
              </button>
            </div>
          </div>
        ))}
        {cart.length === 0 && <div style={{ color: '#999', padding: '16px 0', textAlign: 'center' }}>No items added yet</div>}
      </div>
      <div style={{ padding: '8px 12px', borderTop: '1px solid #ddd', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
        <span>{totalQty}({cart.length})</span>
        <span>{totalValue.toFixed(2)}</span>
      </div>

      {kotHistory && kotHistory.length > 0 && (
        <div style={{ borderTop: '1px solid #ddd', padding: '6px 12px', maxHeight: '90px', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#555', marginBottom: '4px' }}>Sent to Kitchen</div>
          {kotHistory.map(batch => (
            <div key={`${batch.kotNo}-${batch.printer}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', marginBottom: '2px' }}>
              <span>KOT #{String(batch.kotNo).padStart(3, '0')} - {batch.printer}</span>
              <button onClick={() => onReprintKot(batch)} style={{ background: 'none', border: '1px solid #fb8c00', color: '#fb8c00', borderRadius: '4px', fontSize: '0.7rem', padding: '2px 6px', cursor: 'pointer' }}>Reprint</button>
            </div>
          ))}
        </div>
      )}

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
