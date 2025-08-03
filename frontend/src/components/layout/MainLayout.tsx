import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useParams } from 'react-router-dom';
import Header from './Header';
import AnimatedSidebar from './AnimatedSidebar';
import FloatingChatbot from '../common/FloatingChatbot';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const params = useParams();
  
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar');
      const hamburger = document.getElementById('hamburger-button');
      
      if (isSidebarOpen && sidebar && hamburger && 
          !sidebar.contains(event.target as Node) && 
          !hamburger.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSidebarOpen]);
  
  // Build context for chatbot
  const getChatContext = () => {
    const pathSegments = location.pathname.split('/');
    const currentPage = pathSegments[1] || 'home';
    const currentStock = params.symbol || pathSegments[2];
    
    return {
      currentPage,
      currentStock,
      portfolioSummary: currentPage === 'watchlist' ? 'User viewing portfolio' : undefined
    };
  };
  
  // Loading state
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
      
      {/* Mobile Hamburger Button */}
      <button
        id="hamburger-button"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 w-12 h-12 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        <motion.div
          animate={{ rotate: isSidebarOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isSidebarOpen ? (
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </motion.div>
      </button>

      <div className="flex relative">
        {/* Desktop Sidebar - Always visible on lg+ screens */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <AnimatedSidebar />
        </div>
        
        {/* Mobile Sidebar - Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setIsSidebarOpen(false)}
              />
              
              {/* Mobile Sidebar */}
              <motion.div
                id="mobile-sidebar"
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="lg:hidden fixed top-16 left-0 bottom-0 w-64 z-50"
              >
                <AnimatedSidebar />
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        {/* Main Content Area - Responsive padding */}
        <motion.main
          className="flex-1 min-w-0 overflow-x-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* RESPONSIVE CONTAINER - Better spacing */}
          <div className="w-full px-4 lg:px-8 xl:px-12 py-6 lg:py-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </motion.main>
      </div>
      
      {/* Universal AI Chatbot */}
      <FloatingChatbot context={getChatContext()} />
    </div>
  );
};

export default MainLayout;