import React from 'react';

// Deterministic color rotation per category so the grid reads as distinct tiles,
// matching the legacy UI's per-category coloring without needing per-name hardcoding.
const PALETTE = [
  '#1976d2', '#00acc1', '#43a047', '#e53935', '#827717',
  '#283593', '#fb8c00', '#8e24aa', '#616161', '#c62828',
  '#ad1457', '#f9a825', '#00838f', '#5e35b1', '#6d4c41'
];

export default function CategoryGrid({ categories, onSelect }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', padding: '16px' }}>
      {categories.map((cat, idx) => (
        <button
          key={cat.category_code}
          onClick={() => onSelect(cat)}
          style={{
            background: PALETTE[idx % PALETTE.length], color: '#fff', border: 'none',
            borderRadius: '4px', padding: '18px 10px', fontWeight: 'bold', fontSize: '1rem',
            cursor: 'pointer', minHeight: '54px'
          }}
        >
          {cat.name}
        </button>
      ))}
      {categories.length === 0 && (
        <div style={{ gridColumn: '1 / -1', color: '#888', padding: '20px' }}>No categories in this department yet.</div>
      )}
    </div>
  );
}
