// src/components/layout/Header.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCurrentDate, getCurrentTime } from '../../utils/dateUtils';

const Header = ({ toggleSidebar, isSidebarOpen, isMobile }) => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentTimeState, setCurrentTimeState] = useState(getCurrentTime());
  
  // Update time every minute
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeState(getCurrentTime());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Mobile header style changes
  const headerStyle = isMobile 
    ? "fixed top-0 right-0 left-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg"
    : "fixed top-0 right-0 left-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg transition-all duration-300";

  return (
    <header className={headerStyle} style={isMobile ? {} : { left: isSidebarOpen ? '16rem' : '5rem' }}>
      <div className="flex justify-between items-center h-16 px-4">
        {/* Left side with toggle and title */}
        <div className="flex items-center">
          {/* Only show sidebar toggle on desktop */}
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              className="text-white p-2 rounded-lg hover:bg-blue-700 focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isSidebarOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          )}
          
          {/* On mobile, show a back button or app title */}
          {isMobile ? (
            <div className="flex items-center">
              <button
                onClick={() => window.history.back()}
                className="text-white p-2 rounded-lg focus:outline-none mr-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-white">
                Sistem Absensi Karyawan
              </h1>
            </div>
          ) : (
            <h1 className="ml-4 text-xl font-bold text-white">
              Sistem Absensi Karyawan
            </h1>
          )}
        </div>
        
        {/* Right side with user info */}
        <div className="flex items-center">
          {/* User profile dropdown */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-1 text-white focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white font-bold">
                  {currentUser.email.charAt(0).toUpperCase()}
                </div>
                {!isMobile && (
                  <>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium truncate max-w-[150px]">{currentUser.email}</p>
                      <p className="text-xs text-blue-100 capitalize">{userRole}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </>
                )}
              </button>
              
              {/* Dropdown menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium text-gray-900 truncate">{currentUser.email}</p>
                    <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;