// src/components/admin/EmployeeManagement.jsx
import React, { useState, useEffect } from 'react';
import { getEmployees, addEmployee, updateEmployee, deleteEmployee } from '../../firebase/firestore';
import Layout from '../layout/Layout';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import DataTable from '../shared/DataTable';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
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
  
  // Fetch employees data
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const data = await getEmployees();
        setEmployees(data);
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployees();
  }, []);
  
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
  };
  
  // Open modal for confirming delete
  const handleDeleteClick = (employee) => {
    setCurrentEmployee(employee);
    setIsDeleteModalOpen(true);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (currentEmployee) {
        // Update existing employee
        const updatedEmployee = await updateEmployee(currentEmployee.id, formData);
        setEmployees(employees.map(emp => 
          emp.id === updatedEmployee.id ? updatedEmployee : emp
        ));
      } else {
        // Add new employee
        const newEmployee = await addEmployee(formData);
        setEmployees([...employees, newEmployee]);
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving employee:", error);
    }
  };
  
  // Handle employee deletion
  const handleDeleteEmployee = async () => {
    try {
      await deleteEmployee(currentEmployee.id);
      setEmployees(employees.filter(emp => emp.id !== currentEmployee.id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting employee:", error);
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
  
  // Table actions
  const tableActions = (
    <Button onClick={handleAddEmployee}>Tambah Karyawan</Button>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Data Karyawan
          </h1>
          <p className="mt-1 text-gray-500">
            Kelola data karyawan dalam sistem
          </p>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <DataTable
            columns={columns}
            data={employees}
            loading={loading}
            actions={tableActions}
            pagination={true}
            itemsPerPage={10}
            emptyMessage="Belum ada data karyawan"
          />
        </div>
        
        {/* Add/Edit Employee Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={currentEmployee ? "Edit Karyawan" : "Tambah Karyawan Baru"}
        >
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
          size="sm"
        >
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