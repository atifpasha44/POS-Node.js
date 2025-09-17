
import React, { useState } from 'react';

function SidebarMenu({ menuItems, onSubmenuClick }) {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const handleSubmenuClick = (sub) => {
    if (onSubmenuClick) onSubmenuClick(sub);
  };

  return (
    <nav className="sidebar-menu">
      {menuItems.map((item, idx) => (
        <div key={item.label} className="sidebar-menu-item">
          <div className="sidebar-menu-main" onClick={() => handleToggle(idx)} style={{cursor:'pointer'}}>
            <span className="sidebar-menu-icon">{item.icon}</span>
            <span className="sidebar-menu-label">{item.label}</span>
            {item.submenu && (
              <span style={{marginLeft:'auto',fontWeight:'bold',fontSize:'1.1em'}}>{openIndex === idx ? '▲' : '▼'}</span>
            )}
          </div>
          {item.submenu && openIndex === idx && (
            <div className="sidebar-submenu">
              {item.submenu.map((sub) => (
                <div key={sub} className="sidebar-submenu-item" onClick={() => handleSubmenuClick(sub)} style={{cursor:'pointer'}}>{sub}</div>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}

export default SidebarMenu;
