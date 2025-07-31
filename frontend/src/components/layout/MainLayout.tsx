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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
        <div className="text-2xl font-bold text-primary mb-2">MarketSense</div>
        <div className="text-gray-600">Loading financial insights...</div>
      </div>
    </div>
  );
}
  
return (
  <div className="min-h-screen bg-main-bg text-main-text">
    <Header />
    <div className="flex relative">
      {/* Sidebar positioned on the left */}
      <div className="w-64 flex-shrink-0">
        <AnimatedSidebar />
      </div>
      
      {/* Main content area - CENTERED with max width */}
      <motion.main
        className="flex-1 p-4 md:p-6 w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </motion.main>
    </div>
  </div>
);
};

export default MainLayout;