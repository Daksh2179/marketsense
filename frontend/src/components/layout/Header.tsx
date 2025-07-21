import React from 'react';
import { motion } from 'framer-motion';
import ThemeToggle from '../common/ThemeToggle';

const Header: React.FC = () => {
  return (
    <motion.header 
      className="bg-card-bg shadow-sm border-b border-card-border"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <motion.h1 
                className="text-2xl font-bold text-main-header"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                MarketSense
              </motion.h1>
            </div>
          </div>
          <div className="flex items-center">
            <div className="mr-4">
              <ThemeToggle />
            </div>
            <button className="px-4 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;