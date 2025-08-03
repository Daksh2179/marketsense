import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThemeToggle from '../common/ThemeToggle';
import SmartCompanySearch from '../common/SmartCompanySearch';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleCompanySelect = (company: { ticker: string; name: string; sector?: string }) => {
    console.log(`Header: Selecting company ${company.ticker}, current path: ${location.pathname}`);
    
    const newPath = `/dashboard/${company.ticker}`;
    
    // Force navigation by using replace when already on dashboard
    if (location.pathname.startsWith('/dashboard/')) {
      console.log(`Header: Force navigating from ${location.pathname} to ${newPath}`);
      // Use replace to force a route change
      navigate(newPath, { replace: true });
      
      // Also trigger a page refresh after navigation to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      console.log(`Header: Normal navigation to ${newPath}`);
      navigate(newPath);
    }
  };

  return (
    <motion.header 
      className="bg-card-bg shadow-sm border-b border-card-border sticky top-0 z-30"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Hidden on mobile to make room for hamburger */}
          <div className="hidden sm:flex items-center">
            <div className="flex-shrink-0">
              <motion.h1 
                className="text-2xl font-bold text-main-header cursor-pointer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                onClick={() => navigate('/')}
              >
                MarketSense
              </motion.h1>
            </div>
          </div>

          {/* Mobile Logo - Smaller */}
          <div className="sm:hidden">
            <motion.h1 
              className="text-lg font-bold text-main-header cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              onClick={() => navigate('/')}
            >
              MS
            </motion.h1>
          </div>

          {/* Universal Search Bar - Responsive */}
          <div className="flex-1 max-w-md mx-4 lg:mx-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <SmartCompanySearch
                onSelect={handleCompanySelect}
                placeholder="Search companies..."
                className="w-full"
                maxResults={6}
              />
            </motion.div>
          </div>

          {/* Right Side Actions - Responsive */}
          <div className="flex items-center space-x-2 lg:space-x-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="hidden sm:block"
            >
              <ThemeToggle />
            </motion.div>
            
            <motion.button 
              className="px-3 lg:px-4 py-2 rounded-md text-xs lg:text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 shadow-sm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/watchlist')}
            >
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden">Start</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;