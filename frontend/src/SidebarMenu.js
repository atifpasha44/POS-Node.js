
function SidebarMenu({ menuItems }) {
  return (
    <nav className="sidebar-menu">
      {menuItems.map((item) => (
        <div key={item.label} className="sidebar-menu-item">
          <div className="sidebar-menu-main">
            <span className="sidebar-menu-icon">{item.icon}</span>
            <span className="sidebar-menu-label">{item.label}</span>
          </div>
          {item.submenu && (
            <div className="sidebar-submenu always-open">
              {item.submenu.map((sub) => (
                <div key={sub} className="sidebar-submenu-item">{sub}</div>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}

export default SidebarMenu;
