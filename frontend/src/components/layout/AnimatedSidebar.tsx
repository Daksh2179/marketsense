import React from 'react';
import { motion } from 'framer-motion';
import ThemeToggle from '../common/ThemeToggle';
import Navigation from './Navigation';

const AnimatedSidebar: React.FC = () => {
  return (
    <div className="fixed top-16 left-0 bottom-0 z-10 w-64">
      <motion.aside
        className="bg-sidebar-bg text-sidebar-text h-full border-r border-card-border w-full"
        initial={{ x: -300 }}
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
      </motion.aside>
    </div>
  );
};

export default AnimatedSidebar;