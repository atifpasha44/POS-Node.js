

import React, { useState } from 'react';

function SidebarMenu({ menuItems, onSubmenuClick, onMainMenuClick, activeMainMenu, activeSubmenu }) {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (idx, label) => {
    setOpenIndex(openIndex === idx ? null : idx);
    if (onMainMenuClick) onMainMenuClick(label);
  };

  const handleSubmenuClick = (sub) => {
    if (onSubmenuClick) onSubmenuClick(sub);
  };

  return (
    <nav className="sidebar-menu">
      {menuItems.map((item, idx) => (
        <div key={item.label} className={`sidebar-menu-item${activeMainMenu === item.label ? ' active' : ''}`}>
          <div
            className={`sidebar-menu-main${activeMainMenu === item.label ? ' active' : ''}`}
            onClick={() => handleToggle(idx, item.label)}
            style={{cursor:'pointer'}}
          >
            <span className="sidebar-menu-icon">{item.icon}</span>
            <span className="sidebar-menu-label">{item.label}</span>
            {item.submenu && (
              <span style={{marginLeft:'auto',fontWeight:'bold',fontSize:'1.1em'}}>{openIndex === idx ? '▲' : '▼'}</span>
            )}
          </div>
          {item.submenu && openIndex === idx && (
            <div className="sidebar-submenu">
              {item.submenu.map((sub) => (
                <div
                  key={sub}
                  className={`sidebar-submenu-item${activeSubmenu === sub ? ' active' : ''}`}
                  onClick={() => handleSubmenuClick(sub)}
                  style={{cursor:'pointer'}}
                >
                  {sub}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}

export default SidebarMenu;
