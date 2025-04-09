// src/components/guard/EmployeeManagement.jsx
import React, { useState, useEffect } from 'react';
import { getEmployees, addEmployee, updateEmployee, deleteEmployee } from '../../firebase/firestore';
import Layout from '../layout/Layout';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import DataTable from '../shared/DataTable';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    email: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check on initial load
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Fetch employees data
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getEmployees();
        setEmployees(data);
        setFilteredEmployees(data);
      } catch (error) {
        console.error("Error mengambil data karyawan:", error);
        setError('Terjadi kesalahan saat mengambil data karyawan. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployees();
  }, []);
  
  // Filter employees based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(
        employee => 
          employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (employee.phone && employee.phone.includes(searchTerm))
      );
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, employees]);
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // Open modal for adding new employee
  const handleAddEmployee = () => {
    setCurrentEmployee(null);
    setFormData({
      name: '',
      position: '',
      email: '',
      phone: ''
    });
    setIsModalOpen(true);
    setError('');
    setSuccessMessage('');
  };
  
  // Open modal for editing employee
  const handleEditEmployee = (employee) => {
    setCurrentEmployee(employee);
    setFormData({
      name: employee.name,
      position: employee.position,
      email: employee.email || '',
      phone: employee.phone || ''
    });
    setIsModalOpen(true);
    setError('');
    setSuccessMessage('');
  };
  
  // Open modal for confirming delete
  const handleDeleteClick = (employee) => {
    setCurrentEmployee(employee);
    setIsDeleteModalOpen(true);
    setError('');
    setSuccessMessage('');
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccessMessage('');
      
      if (currentEmployee) {
        // Update existing employee
        const updatedEmployee = await updateEmployee(currentEmployee.id, formData);
        setEmployees(employees.map(emp => 
          emp.id === updatedEmployee.id ? updatedEmployee : emp
        ));
        setSuccessMessage('Karyawan berhasil diperbarui!');
      } else {
        // Add new employee
        const newEmployee = await addEmployee(formData);
        setEmployees([...employees, newEmployee]);
        setSuccessMessage('Karyawan baru berhasil ditambahkan!');
      }
      
      // Tutup modal setelah 1 detik
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMessage('');
      }, 1000);
      
    } catch (error) {
      console.error("Error menyimpan karyawan:", error);
      setError('Terjadi kesalahan saat menyimpan data karyawan. Silakan coba lagi.');
    }
  };
  
  // Handle employee deletion
  const handleDeleteEmployee = async () => {
    try {
      setError('');
      setSuccessMessage('');
      
      await deleteEmployee(currentEmployee.id);
      setEmployees(employees.filter(emp => emp.id !== currentEmployee.id));
      setSuccessMessage('Karyawan berhasil dihapus!');
      
      // Tutup modal setelah 1 detik
      setTimeout(() => {
        setIsDeleteModalOpen(false);
        setSuccessMessage('');
      }, 1000);
    } catch (error) {
      console.error("Error menghapus karyawan:", error);
      setError('Terjadi kesalahan saat menghapus karyawan. Silakan coba lagi.');
    }
  };
  
  // Table columns
  const columns = [
    {
      key: 'name',
      title: 'Nama Karyawan'
    },
    {
      key: 'position',
      title: 'Jabatan'
    },
    {
      key: 'email',
      title: 'Email',
      render: (row) => row.email || '-'
    },
    {
      key: 'phone',
      title: 'No. Telepon',
      render: (row) => row.phone || '-'
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (row) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditEmployee(row);
            }}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(row);
            }}
          >
            Hapus
          </Button>
        </div>
      )
    }
  ];
  
  // Render mobile employee card list
  const renderEmployeeCards = () => {
    if (filteredEmployees.length === 0) {
      return (
        <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
          {searchTerm 
            ? "Tidak ditemukan karyawan yang sesuai dengan pencarian" 
            : "Belum ada data karyawan"}
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4">
              <h3 className="font-medium text-gray-900">{employee.name}</h3>
              <p className="text-sm text-gray-500 mb-2">{employee.position}</p>
              
              {employee.email && (
                <div className="flex items-center text-xs text-gray-500 mb-1">
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {employee.email}
                </div>
              )}
              
              {employee.phone && (
                <div className="flex items-center text-xs text-gray-500">
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {employee.phone}
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex justify-end space-x-2">
              <button
                className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => handleEditEmployee(employee)}
              >
                Edit
              </button>
              <button
                className="px-3 py-1 bg-red-600 border border-red-600 rounded-md text-sm text-white hover:bg-red-700"
                onClick={() => handleDeleteClick(employee)}
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className={`space-y-6 ${isMobile ? 'px-4 pb-16' : ''}`}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Data Karyawan
          </h1>
          <p className="mt-1 text-gray-500">
            Kelola data karyawan dalam sistem
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
            <p>{error}</p>
          </div>
        )}
        
        {/* Search and Add Button */}
        <div className={`${isMobile ? 'flex flex-col space-y-3' : 'flex justify-between items-center'}`}>
          <div className={`${isMobile ? 'w-full' : 'w-1/3'}`}>
            <div className="relative">
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Cari karyawan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          <div>
            <Button onClick={handleAddEmployee}>
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Tambah Karyawan
              </div>
            </Button>
          </div>
        </div>
        
        {/* Employee Data Display - Responsive */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : isMobile ? (
            <div className="p-4">
              {renderEmployeeCards()}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredEmployees}
              loading={loading}
              pagination={true}
              itemsPerPage={10}
              emptyMessage="Belum ada data karyawan"
            />
          )}
        </div>
        
        {/* Add/Edit Employee Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={currentEmployee ? "Edit Karyawan" : "Tambah Karyawan Baru"}
          size={isMobile ? "full" : "md"}
        >
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
              <Button
                type="button"
                variant="light"
                onClick={() => setIsModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit">
                {currentEmployee ? "Simpan Perubahan" : "Tambah Karyawan"}
              </Button>
            </div>
          </form>
        </Modal>
        
        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Konfirmasi Hapus"
          size={isMobile ? "full" : "sm"}
        >
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
          
          <div className="space-y-4">
            <p className="text-gray-700">
              Apakah Anda yakin ingin menghapus karyawan <strong>{currentEmployee?.name}</strong>?
            </p>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="light"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDeleteEmployee}
              >
                Hapus
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default EmployeeManagement;