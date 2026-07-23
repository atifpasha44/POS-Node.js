import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DepartmentTabs from './DepartmentTabs';
import CategoryGrid from './CategoryGrid';
import ItemPicker from './ItemPicker';
import CartPanel from './CartPanel';

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
  }, []);

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
      const existing = prev.find(l => l.item_code === item.item_code);
      if (existing) {
        return prev.map(l => l.item_code === item.item_code ? { ...l, qty: l.qty + 1 } : l);
      }
      return [...prev, {
        item_code: item.item_code,
        item_name: item.short_name || item.item_name,
        qty: 1,
        unit_price: parseFloat(item[priceField] || 0)
      }];
    });
  };

  const handleQtyChange = (item_code, delta) => {
    setCart(prev => prev
      .map(l => l.item_code === item_code ? { ...l, qty: l.qty + delta } : l)
      .filter(l => l.qty > 0));
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
          onCancel={onExit}
        />
      </div>
    </div>
  );
}
