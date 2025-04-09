// src/components/layout/Layout.jsx
import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileBottomNav from './mobile/MobileBottomNav';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
 
  // Detect mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false); // Close sidebar on mobile
      }
    };
   
    // Check on initial load
    checkIfMobile();
   
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
   
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - only show on desktop */}
      {!isMobile && <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />}
     
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isMobile ? 'ml-0' : (sidebarOpen ? 'md:ml-64' : 'md:ml-20')}`}>
        {/* Header */}
        <Header toggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} isMobile={isMobile} />
       
        {/* Main Content - scrollable with adjusted padding/margin */}
        <main className={`flex-1 p-2 md:p-6 overflow-auto ${
          isMobile ? 'pt-16 pb-16' : 'mt-16'
        }`}>
          <div className="container mx-auto">
            {children}
          </div>
        </main>
       
        {/* Mobile Bottom Navigation - only show on mobile */}
        {isMobile && <MobileBottomNav />}
      </div>
    </div>
  );
};

export default Layout;