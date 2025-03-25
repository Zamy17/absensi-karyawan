// src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const { isAdmin, isGuard } = useAuth();
  
  // Admin menu items
  const adminMenu = [
    { path: '/admin/dashboard', label: 'Dashboard' },
    { path: '/admin/employees', label: 'Data Karyawan' },
    { path: '/admin/guards', label: 'Data Satpam' },
    { path: '/admin/attendance', label: 'Laporan Absensi' },
    { path: '/admin/top-employees', label: 'Top Karyawan' }
  ];
  
  // Guard menu items
  const guardMenu = [
    { path: '/guard/dashboard', label: 'Dashboard' },
    { path: '/guard/check-in', label: 'Absensi Masuk' },
    { path: '/guard/check-out', label: 'Absensi Pulang' },
    { path: '/guard/daily-report', label: 'Laporan Harian' }
  ];
  
  // Select menu based on user role
  const menuItems = isAdmin ? adminMenu : isGuard ? guardMenu : [];

  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen p-4">
      <div className="flex items-center justify-center p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-center">
          {isAdmin ? 'Admin Panel' : isGuard ? 'Satpam Panel' : 'Menu'}
        </h2>
      </div>
      
      <nav className="mt-8">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `block py-2.5 px-4 rounded transition duration-200 ${
                    isActive
                      ? 'bg-blue-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;