import React from 'react';
import { motion } from 'framer-motion';
import ThemeToggle from '../common/ThemeToggle';
import Navigation from './Navigation';

const AnimatedSidebar: React.FC = () => {
  return (
    <div className="h-full">
      <motion.aside
        className="bg-sidebar-bg text-sidebar-text h-full border-r border-card-border w-full shadow-lg lg:shadow-none"
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ 
          duration: 0.8, 
          type: 'spring',
          bounce: 0.1
        }}
      >
        <motion.div 
          className="p-4 flex justify-between items-center border-b border-card-border bg-slate-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.h1 
            className="text-xl font-bold text-gray-800"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            MarketSense
          </motion.h1>
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <ThemeToggle />
          </motion.div>
        </motion.div>
        <Navigation />
        
        {/* Mobile-only footer */}
        <div className="lg:hidden absolute bottom-0 left-0 right-0 p-4 border-t border-card-border bg-slate-50">
          <div className="text-center">
            <p className="text-xs text-gray-500">MarketSense v1.0</p>
            <p className="text-xs text-gray-400">Professional Analytics</p>
          </div>
        </div>
      </motion.aside>
    </div>
  );
};

export default AnimatedSidebar;