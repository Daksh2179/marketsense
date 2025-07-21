import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from './Header';
import AnimatedSidebar from './AnimatedSidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate initial loading delay
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);
  
  // Loading animation (centered spinner)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-main-bg flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-main-header">MarketSense</h1>
          <p className="text-main-text">Loading financial insights...</p>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-main-bg text-main-text">
      <Header />
      <div className="flex relative">
        {/* Main content area with right padding for the sidebar */}
        <motion.main
          className="flex-1 p-4 md:p-6 pr-72" // Added right padding to make room for sidebar
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.main>
        
        {/* Sidebar positioned on the right */}
        <AnimatedSidebar />
      </div>
    </div>
  );
};

export default MainLayout;