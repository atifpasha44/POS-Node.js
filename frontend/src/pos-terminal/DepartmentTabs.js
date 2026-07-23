import React, { useRef } from 'react';

export default function DepartmentTabs({ departments, activeDept, onSelect }) {
  const scrollRef = useRef(null);

  const scrollBy = (amount) => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', background: '#e0e0e0', padding: '6px 8px' }}>
      <button onClick={() => scrollBy(-160)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#555' }}>◀</button>
      <div ref={scrollRef} style={{ display: 'flex', gap: '24px', overflowX: 'auto', flex: 1, padding: '4px 12px', scrollbarWidth: 'none' }}>
        {departments.map(dept => (
          <button
            key={dept.department_code}
            onClick={() => onSelect(dept)}
            style={{
              background: 'none', border: 'none', whiteSpace: 'nowrap', cursor: 'pointer',
              fontSize: '1.15rem', fontWeight: 'bold',
              color: activeDept && activeDept.department_code === dept.department_code ? '#1976d2' : '#777'
            }}
          >
            {dept.name}
          </button>
        ))}
      </div>
      <button onClick={() => scrollBy(160)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#555' }}>▶</button>
    </div>
  );
}
