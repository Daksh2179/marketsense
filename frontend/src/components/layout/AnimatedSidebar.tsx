import React, { useState } from 'react';
import { motion } from 'framer-motion'; // Removed AnimatePresence since it's not being used
import ThemeToggle from '../common/ThemeToggle';

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
}

const AnimatedSidebar: React.FC = () => {
  const [activeItem, setActiveItem] = useState('home');
  // Removed the isFirstLoad state since it's not being used
  
  const menuItems: SidebarItem[] = [
    { label: 'Home', icon: '🏠', id: 'home' },
    { label: 'Companies', icon: '🏢', id: 'companies' },
    { label: 'Sectors', icon: '🔍', id: 'sectors' },
    { label: 'Watchlist', icon: '⭐', id: 'watchlist' },
    { label: 'Settings', icon: '⚙️', id: 'settings' }
  ];

  // Removed the useEffect for isFirstLoad since we're not using it
  
  const handleMenuClick = (itemId: string) => {
    setActiveItem(itemId);
    window.location.hash = `#${itemId}`;
  };
  
  return (
    <div className="fixed top-16 right-0 bottom-0 z-10">
      <motion.aside
        className="bg-sidebar-bg text-sidebar-text h-full border-l border-card-border w-64"
        initial={{ x: 300 }}
        animate={{ x: 0 }}
        transition={{ 
          duration: 0.8, 
          type: 'spring',
          bounce: 0.1
        }}
      >
        <motion.div 
          className="p-4 flex justify-between items-center border-b border-card-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.h1 
            className="text-xl font-bold"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            MarketSense
          </motion.h1>
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <ThemeToggle />
          </motion.div>
        </motion.div>
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <motion.li 
                key={item.id}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <button
                  onClick={() => handleMenuClick(item.id)}
                  className={`w-full flex items-center p-3 text-base font-normal rounded-lg transition-colors duration-200 ${
                    activeItem === item.id
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
      </motion.aside>
    </div>
  );
};

export default AnimatedSidebar;