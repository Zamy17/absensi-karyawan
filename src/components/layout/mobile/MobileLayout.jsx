// src/components/layout/mobile/MobileLayout.jsx
import React from 'react';
import MobileBottomNav from '../../guard/mobile/MobileBottomNav';

const MobileLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content Area */}
      <main className="pb-16">
        {children}
      </main>
      
      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default MobileLayout;