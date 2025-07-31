import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems: NavigationItem[] = [
    { label: 'Home', icon: '🏠', id: 'home', path: '/' },
    { label: 'Dashboard', icon: '📊', id: 'dashboard', path: '/dashboard' },
    { label: 'Companies', icon: '🏢', id: 'companies', path: '/companies' },
    { label: 'Sectors', icon: '🔍', id: 'sectors', path: '/sectors' },
    { label: 'Watchlist', icon: '⭐', id: 'watchlist', path: '/watchlist' },
    { label: 'Settings', icon: '⚙️', id: 'settings', path: '/settings' }
  ];
  
  const handleMenuClick = (path: string) => {
    navigate(path);
  };
  
  const isActive = (path: string) => {
    // Check if the current path starts with the menu item path
    // This allows '/dashboard/AAPL' to still highlight the Dashboard item
    return location.pathname === path || 
      (path !== '/' && location.pathname.startsWith(path));
  };
  
  return (
    <nav className="p-4">
      <ul className="space-y-2">
        {menuItems.map((item, index) => (
          <motion.li 
            key={item.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 + index * 0.1 }}
          >
            <button
              onClick={() => handleMenuClick(item.path)}
              className={`w-full flex items-center p-3 text-base font-normal rounded-lg transition-colors duration-200 ${
                isActive(item.path)
                  ? "bg-sidebar-active text-white"
                  : "hover:bg-sidebar-hover"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          </motion.li>
        ))}
      </ul>
    </nav>
  );
};

export default Navigation;