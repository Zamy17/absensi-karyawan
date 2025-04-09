// src/components/layout/mobile/MobileBottomNav.jsx
import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { addEmployee } from '../../../firebase/firestore';

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    email: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Toggle the more menu
  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  // Toggle the add employee modal
  const toggleAddModal = () => {
    setShowAddModal(!showAddModal);
    setShowMenu(false); // Close the menu when opening modal
    setError('');
    setSuccessMessage('');
    // Reset form data when opening modal
    if (!showAddModal) {
      setFormData({
        name: '',
        position: '',
        email: '',
        phone: ''
      });
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      
      // Add new employee
      await addEmployee(formData);
      
      setSuccessMessage('Karyawan baru berhasil ditambahkan!');
      
      // Clear form and close modal after success
      setTimeout(() => {
        setShowAddModal(false);
        setSuccessMessage('');
        setFormData({
          name: '',
          position: '',
          email: '',
          phone: ''
        });
      }, 1500);
      
    } catch (error) {
      console.error("Error menyimpan karyawan:", error);
      setError('Terjadi kesalahan saat menyimpan data karyawan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Navigate to employee management
  const goToEmployeeManagement = () => {
    navigate('/guard/employees');
    setShowMenu(false);
  };

  // Active link style
  const getActiveClassName = (path) => {
    return location.pathname.includes(path) ? "text-blue-600" : "text-gray-500";
  };
  
  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-1 z-50">
        <div className="flex justify-around items-center">
          <NavLink to="/guard/dashboard" className="flex flex-col items-center p-2">
            {({ isActive }) => (
              <>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                  />
                </svg>
                <span className={`text-xs ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>Dashboard</span>
              </>
            )}
          </NavLink>
          
          <NavLink to="/guard/check-in" className="flex flex-col items-center p-2">
            {({ isActive }) => (
              <>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" 
                  />
                </svg>
                <span className={`text-xs ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>Masuk</span>
              </>
            )}
          </NavLink>
          
          <NavLink to="/guard/check-out" className="flex flex-col items-center p-2">
            {({ isActive }) => (
              <>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                  />
                </svg>
                <span className={`text-xs ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>Pulang</span>
              </>
            )}
          </NavLink>
          
          <NavLink to="/guard/daily-report" className="flex flex-col items-center p-2">
            {({ isActive }) => (
              <>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  />
                </svg>
                <span className={`text-xs ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>Laporan</span>
              </>
            )}
          </NavLink>
          
          {/* More menu button */}
          <button 
            onClick={toggleMenu}
            className="flex flex-col items-center p-2 text-gray-500 focus:outline-none"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" 
              />
            </svg>
            <span className="text-xs">Lainnya</span>
          </button>
        </div>
      </div>
      
      {/* More menu dropdown */}
      {showMenu && (
        <div className="fixed bottom-16 right-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="py-1">
            <button
              onClick={toggleAddModal}
              className="w-full text-left px-4 py-3 flex items-center text-gray-700 hover:bg-gray-100"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2 text-green-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                />
              </svg>
              Tambah Karyawan
            </button>
            
            <button
              onClick={goToEmployeeManagement}
              className="w-full text-left px-4 py-3 flex items-center text-gray-700 hover:bg-gray-100"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2 text-blue-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" 
                />
              </svg>
              Kelola Karyawan
            </button>
          </div>
        </div>
      )}
      
      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-lg font-medium">Tambah Karyawan Baru</h3>
              <button 
                onClick={toggleAddModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              {successMessage && (
                <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4">
                  <p>{successMessage}</p>
                </div>
              )}
              
              {error && (
                <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                  <p>{error}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nama Karyawan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                    Jabatan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.position}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    No. Telepon
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    onClick={toggleAddModal}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                    disabled={loading}
                  >
                    {loading ? 'Menyimpan...' : 'Tambah Karyawan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileBottomNav;