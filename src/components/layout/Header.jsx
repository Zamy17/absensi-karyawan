// src/components/layout/Header.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCurrentDate } from '../../utils/dateUtils';

const Header = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900">
            Sistem Absensi Karyawan
          </h1>
          <span className="ml-4 text-sm text-gray-500">
            {getCurrentDate()}
          </span>
        </div>
        
        <div className="flex items-center">
          {currentUser && (
            <>
              <div className="mr-4 text-right">
                <p className="text-sm font-medium text-gray-900">{currentUser.email}</p>
                <p className="text-xs text-gray-500 capitalize">{userRole}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;



