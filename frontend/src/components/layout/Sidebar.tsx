import React, { useState } from 'react';

const Sidebar: React.FC = () => {
  const [activeItem, setActiveItem] = useState('Dashboard');
  
  const menuItems = [
    { label: 'Dashboard', icon: '📊', id: 'dashboard' },
    { label: 'Companies', icon: '🏢', id: 'companies' },
    { label: 'Sectors', icon: '🔍', id: 'sectors' },
    { label: 'Watchlist', icon: '⭐', id: 'watchlist' },
    { label: 'Settings', icon: '⚙️', id: 'settings' }
  ];
  
  return (
    <aside className="w-64 bg-white border-r border-neutral-light h-[calc(100vh-4rem)]">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveItem(item.label)}
                className={
                  activeItem === item.label 
                    ? "w-full flex items-center p-3 text-base font-normal rounded-lg bg-primary text-white"
                    : "w-full flex items-center p-3 text-base font-normal rounded-lg hover:bg-neutral-lightest hover:text-primary"
                }
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;