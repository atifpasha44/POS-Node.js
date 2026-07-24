import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import DepartmentTabs from './DepartmentTabs';
import CategoryGrid from './CategoryGrid';
import ItemPicker from './ItemPicker';
import CartPanel from './CartPanel';
import { generateKotPdf } from './kotPrinter';
import { generateBillPdf } from './billPrinter';

const DEFAULT_KITCHEN = 'Main Kitchen';

const PRICE_LEVEL_TO_FIELD = {
  'Price 1': 'item_price_1',
  'Price 2': 'item_price_2',
  'Price 3': 'item_price_3',
  'Price 4': 'item_price_4'
};

export default function OrderEntry({ outlet, table, guestCount, user, onExit }) {
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeDept, setActiveDept] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [billHeader, setBillHeader] = useState(null);
  const [taxRateByCode, setTaxRateByCode] = useState({});
  const [kotHistory, setKotHistory] = useState([]);
  const [guestName, setGuestName] = useState('');
  const [ncDept, setNcDept] = useState('');
  const kotCounterRef = useRef(0);
  const billNoRef = useRef(null);

  const priceField = PRICE_LEVEL_TO_FIELD[outlet.item_price_level] || 'item_price_1';

  useEffect(() => {
    Promise.all([
      axios.get('/api/item-departments'),
      axios.get('/api/item-categories'),
      axios.get('/api/item-master')
    ]).then(([deptRes, catRes, itemRes]) => {
      const depts = (deptRes.data.data || []).filter(d => !d.inactive);
      setDepartments(depts);
      setCategories((catRes.data.data || []).filter(c => !c.inactive));
      setItems((itemRes.data.data || []).filter(i => !i.in_active));
      if (depts.length > 0) setActiveDept(depts[0]);
    }).catch(err => console.error('Error loading menu data:', err));

    axios.get(`/api/outlet-setup/${outlet.outlet_code}/bill-header`)
      .then(res => { if (res.data.success) setBillHeader(res.data.data); })
      .catch(err => console.error('Error loading bill header:', err));

    axios.get('/api/tax-codes')
      .then(res => {
        const rates = {};
        (res.data.data || []).forEach(t => { rates[t.tax_code] = parseFloat(t.tax_percentage) || 0; });
        setTaxRateByCode(rates);
      })
      .catch(err => console.error('Error loading tax codes:', err));
  }, [outlet.outlet_code]);

  const categoriesForDept = activeDept
    ? categories
        .filter(c => c.item_department_code === activeDept.department_code)
        .sort((a, b) => (a.display_sequence || 0) - (b.display_sequence || 0))
    : [];

  const itemsForCategory = activeCategory
    ? items.filter(i =>
        i.item_category === activeCategory.category_code &&
        (!i.select_outlets || i.select_outlets.length === 0 || i.select_outlets.includes(outlet.outlet_code))
      )
    : [];

  const handleSelectItem = (item) => {
    setCart(prev => {
      // Only merge into an existing line if it hasn't already been sent to the
      // kitchen - once sent, new quantity of the same item needs its own line
      // so it still gets sent on the next "Send Check".
      const existing = prev.find(l => l.item_code === item.item_code && !l.sent);
      if (existing) {
        return prev.map(l => l.lineId === existing.lineId ? { ...l, qty: l.qty + 1 } : l);
      }
      return [...prev, {
        lineId: `${item.item_code}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        item_code: item.item_code,
        item_name: item.short_name || item.item_name,
        categoryName: activeCategory ? activeCategory.name : '',
        tax_code: item.tax_code,
        printer: (item.item_printer_1 && item.item_printer_1.trim()) || DEFAULT_KITCHEN,
        notes: '',
        sent: false,
        qty: 1,
        unit_price: parseFloat(item[priceField] || 0)
      }];
    });
  };

  const handleQtyChange = (lineId, delta) => {
    setCart(prev => prev
      .map(l => l.lineId === lineId ? { ...l, qty: l.qty + delta } : l)
      .filter(l => l.qty > 0));
  };

  const handleUpdateNote = (lineId) => {
    const line = cart.find(l => l.lineId === lineId);
    const note = window.prompt('Special instructions for ' + line.item_name + ':', line.notes || '');
    if (note === null) return;
    setCart(prev => prev.map(l => l.lineId === lineId ? { ...l, notes: note.trim() } : l));
  };

  const handleEditCheckInfo = () => {
    const name = window.prompt('Guest Name:', guestName);
    if (name !== null) setGuestName(name.trim());
    const dept = window.prompt('NC Dept (leave blank unless this is a no-charge order):', ncDept);
    if (dept !== null) setNcDept(dept.trim());
  };

  const handleSendCheck = () => {
    const unsent = cart.filter(l => !l.sent);
    if (unsent.length === 0) {
      alert('No new items to send to the kitchen.');
      return;
    }

    const byPrinter = {};
    unsent.forEach(line => {
      if (!byPrinter[line.printer]) byPrinter[line.printer] = [];
      byPrinter[line.printer].push(line);
    });

    const newBatches = Object.entries(byPrinter).map(([printer, lines]) => {
      kotCounterRef.current += 1;
      const batch = {
        kotNo: kotCounterRef.current,
        printer,
        tableCode: table.table_code,
        steward: user.user_name || user.user_code,
        items: lines.map(l => ({ item_name: l.item_name, qty: l.qty, notes: l.notes })),
        timestamp: new Date()
      };
      generateKotPdf({
        outletName: outlet.outlet_name,
        kotNo: batch.kotNo,
        tableCode: batch.tableCode,
        steward: batch.steward,
        items: batch.items,
        isReprint: false
      });
      return batch;
    });

    setKotHistory(prev => [...prev, ...newBatches]);
    setCart(prev => prev.map(l => l.sent ? l : { ...l, sent: true }));
  };

  const handleReprintKot = (batch) => {
    generateKotPdf({
      outletName: outlet.outlet_name,
      kotNo: batch.kotNo,
      tableCode: batch.tableCode,
      steward: batch.steward,
      items: batch.items,
      isReprint: true
    });
  };

  const handlePrintCheck = () => {
    if (cart.length === 0) {
      alert('Add items to the check before printing.');
      return;
    }
    if (!billHeader) {
      alert('Still loading outlet details - try again in a moment.');
      return;
    }

    if (!billNoRef.current) {
      billNoRef.current = `${billHeader.check_prefix || outlet.outlet_code}1`;
    }

    const lineTax = cart.map(line => {
      const rate = taxRateByCode[line.tax_code] || 0;
      return {
        categoryName: line.categoryName,
        item_name: line.item_name,
        notes: line.notes,
        qty: line.qty,
        rate: line.unit_price,
        value: line.qty * line.unit_price,
        tax: (line.qty * line.unit_price * rate) / 100
      };
    });
    const subTotal = lineTax.reduce((sum, l) => sum + l.value, 0);
    const taxTotal = lineTax.reduce((sum, l) => sum + l.tax, 0);
    const billTotal = subTotal + taxTotal;
    const distinctRates = [...new Set(cart.map(l => taxRateByCode[l.tax_code] || 0).filter(r => r > 0))];
    const taxLabel = distinctRates.length === 1 ? `GST ${distinctRates[0]}%` : 'Tax';

    const now = new Date();
    generateBillPdf({
      groupName: billHeader.group_name,
      outletName: billHeader.outlet_name,
      addressName: billHeader.address_name,
      currencyCode: billHeader.local_currency,
      billNo: billNoRef.current,
      billDate: now.toLocaleDateString('en-GB'),
      billTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ncDept,
      tableCode: table.table_code,
      steward: user.user_name || user.user_code,
      pax: guestCount,
      guestName,
      items: lineTax,
      taxLabel,
      taxAmount: taxTotal,
      subTotal,
      billTotal,
      kotNumbers: kotHistory.map(b => b.kotNo)
    });
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif' }}>
      {/* Top bar */}
      <div style={{ background: '#1976d2', color: '#fff', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 'bold' }}>ithots</span>
        <span>Operator : {user.user_name || user.user_code}</span>
        <button onClick={onExit} style={{ background: 'transparent', border: '1px solid #fff', color: '#fff', borderRadius: '4px', padding: '6px 14px', cursor: 'pointer' }}>Exit</button>
      </div>
      <div style={{ background: '#e3eafc', color: '#1976d2', fontWeight: 'bold', padding: '6px 16px' }}>
        {outlet.outlet_name}
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left: departments / categories / item picker */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 0 }}>
          <DepartmentTabs
            departments={departments}
            activeDept={activeDept}
            onSelect={(dept) => { setActiveDept(dept); setActiveCategory(null); }}
          />
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <CategoryGrid categories={categoriesForDept} onSelect={setActiveCategory} />
          </div>
          {activeCategory && (
            <ItemPicker
              category={activeCategory}
              items={itemsForCategory}
              priceField={priceField}
              onSelectItem={handleSelectItem}
              onClose={() => setActiveCategory(null)}
            />
          )}
        </div>

        {/* Right: running check */}
        <CartPanel
          table={table}
          guestCount={guestCount}
          cart={cart}
          onQtyChange={handleQtyChange}
          onUpdateNote={handleUpdateNote}
          onCancel={onExit}
          onSendCheck={handleSendCheck}
          kotHistory={kotHistory}
          onReprintKot={handleReprintKot}
          onPrintCheck={handlePrintCheck}
          onEditCheckInfo={handleEditCheckInfo}
        />
      </div>
    </div>
  );
}
