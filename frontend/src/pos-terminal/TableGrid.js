import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import GuestCountModal from './GuestCountModal';
import OrderEntry from './OrderEntry';

const TABLES_PER_PAGE = 12;

export default function TableGrid({ user, onLogout }) {
  const [outlet, setOutlet] = useState(null);
  const [tables, setTables] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pendingTable, setPendingTable] = useState(null); // table object awaiting guest count
  const [orderTable, setOrderTable] = useState(null); // { table, guestCount } currently in order-entry
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Phase 1 simplification: no user-to-outlet mapping exists yet in the schema,
  // so default to the first active outlet. Revisit once multi-outlet operators are needed.
  useEffect(() => {
    axios.get('/api/outlet-setup').then(res => {
      if (res.data.success && res.data.data.length > 0) {
        const active = res.data.data.find(o => !o.inactive) || res.data.data[0];
        setOutlet(active);
      }
    }).catch(err => console.error('Error loading outlet:', err));
  }, []);

  const loadTables = useCallback(() => {
    if (!outlet) return;
    axios.get('/api/table-status', { params: { outlet_code: outlet.outlet_code } })
      .then(res => {
        if (res.data.success) setTables(res.data.data || []);
      })
      .catch(err => console.error('Error loading table status:', err));
  }, [outlet]);

  useEffect(() => {
    loadTables();
    const interval = setInterval(loadTables, 5000);
    return () => clearInterval(interval);
  }, [loadTables]);

  const filteredTables = tables.filter(t =>
    !search || t.table_code.toLowerCase().includes(search.toLowerCase()) ||
    (t.table_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const pageCount = Math.max(1, Math.ceil(filteredTables.length / TABLES_PER_PAGE));
  const pagedTables = filteredTables.slice(page * TABLES_PER_PAGE, (page + 1) * TABLES_PER_PAGE);

  const handleTileClick = (table) => {
    if (table.status === 'VACANT') {
      setPendingTable(table);
    }
  };

  const handleGuestCountConfirm = async (guestCount) => {
    try {
      await axios.post(`/api/table-status/${outlet.outlet_code}/${pendingTable.table_code}/open`, { guest_count: guestCount });
      setOrderTable({ table: pendingTable, guestCount });
      setPendingTable(null);
      loadTables();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not open table');
    }
  };

  const handleSendCheck = (table, e) => {
    e.stopPropagation();
    setOrderTable({ table, guestCount: table.guest_count });
  };

  const handleExitOrderEntry = () => {
    setOrderTable(null);
    loadTables();
  };

  if (orderTable && outlet) {
    return (
      <OrderEntry
        outlet={outlet}
        table={orderTable.table}
        guestCount={orderTable.guestCount}
        user={user}
        onExit={handleExitOrderEntry}
      />
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#e0e0e0', fontFamily: 'Arial, sans-serif' }}>
      {/* Top bar */}
      <div style={{ background: '#1976d2', color: '#fff', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>ithots</span>
          <input
            type="text" placeholder="Search table" value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            style={{ height: '30px', borderRadius: '4px', border: 'none', padding: '0 10px', width: '160px' }}
          />
        </div>
        <div style={{ fontSize: '0.95rem' }}>Operator : {user.user_name || user.user_code}</div>
        <button onClick={onLogout} style={{ background: 'transparent', border: '1px solid #fff', color: '#fff', borderRadius: '4px', padding: '6px 14px', cursor: 'pointer' }}>Exit</button>
      </div>
      <div style={{ background: '#e3eafc', padding: '6px 18px', fontWeight: 'bold', color: '#1976d2' }}>
        {outlet ? outlet.outlet_name : 'Loading outlet...'}
      </div>

      {/* Table grid */}
      <div style={{ flex: 1, padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', alignContent: 'start' }}>
        {pagedTables.map(table => {
          const occupied = table.status === 'OCCUPIED';
          return (
            <div
              key={table.table_code}
              onClick={() => handleTileClick(table)}
              style={{
                background: '#fff', border: occupied ? '2px solid #1976d2' : '1px solid #ccc',
                borderRadius: '8px', padding: '14px', cursor: 'pointer', minHeight: '110px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
              }}
            >
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: occupied ? '#1976d2' : '#999' }}>
                {table.table_code}
              </div>
              {occupied ? (
                <>
                  <div style={{ fontSize: '0.9rem', color: '#333' }}>
                    👤 {table.guest_count} &nbsp; 🕐 {table.opened_at ? new Date(table.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                  <button
                    onClick={(e) => handleSendCheck(table, e)}
                    style={{ marginTop: '6px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 0', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    Send Check
                  </button>
                </>
              ) : (
                <div style={{ fontSize: '0.9rem', color: '#999' }}>Vacant</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom admin bar */}
      <div style={{ background: '#1976d2', color: '#fff', padding: '8px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Admin</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? 0.4 : 1 }}>◀</button>
          <span style={{ fontSize: '0.85rem' }}>{now.toLocaleTimeString()}</span>
          <button onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: page >= pageCount - 1 ? 'default' : 'pointer', opacity: page >= pageCount - 1 ? 0.4 : 1 }}>▶</button>
        </div>
        <span style={{ fontSize: '0.85rem' }}>{now.toLocaleDateString('en-GB')}</span>
      </div>

      {pendingTable && (
        <GuestCountModal
          tableCode={pendingTable.table_code}
          maxGuests={pendingTable.seats}
          onCancel={() => setPendingTable(null)}
          onConfirm={handleGuestCountConfirm}
        />
      )}
    </div>
  );
}
