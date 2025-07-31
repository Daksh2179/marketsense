import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThemeToggle from '../common/ThemeToggle';
import SmartCompanySearch from '../common/SmartCompanySearch';

const Header: React.FC = () => {
  const navigate = useNavigate();

  const handleCompanySelect = (company: { ticker: string; name: string; sector?: string }) => {
    // Navigate to company dashboard
    navigate(`/dashboard/${company.ticker}`);
  };

  return (
    <motion.header 
      className="bg-card-bg shadow-sm border-b border-card-border sticky top-0 z-40"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
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

          {/* Universal Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <SmartCompanySearch
                onSelect={handleCompanySelect}
                placeholder="Search any company... (AAPL, Tesla, Google)"
                className="w-full"
                maxResults={6}
              />
            </motion.div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <ThemeToggle />
            </motion.div>
            
            <motion.button 
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 shadow-sm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/watchlist')}
            >
              Get Started
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;