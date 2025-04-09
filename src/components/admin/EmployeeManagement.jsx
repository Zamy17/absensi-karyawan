// src/components/admin/EmployeeManagement.jsx
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
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
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
  
  // Handle search
  useEffect(() => {
    const results = employees.filter((employee) =>
      employee.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEmployees(results);
  }, [searchQuery, employees]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
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
  
  const handleDeleteClick = (employee) => {
    setCurrentEmployee(employee);
    setIsDeleteModalOpen(true);
    setError('');
    setSuccessMessage('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccessMessage('');
      
      if (currentEmployee) {
        const updatedEmployee = await updateEmployee(currentEmployee.id, formData);
        const updatedList = employees.map(emp =>
          emp.id === updatedEmployee.id ? updatedEmployee : emp
        );
        setEmployees(updatedList);
        setFilteredEmployees(updatedList);
        setSuccessMessage('Karyawan berhasil diperbarui!');
      } else {
        const newEmployee = await addEmployee(formData);
        const newList = [...employees, newEmployee];
        setEmployees(newList);
        setFilteredEmployees(newList);
        setSuccessMessage('Karyawan baru berhasil ditambahkan!');
      }

      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMessage('');
      }, 1000);
    } catch (error) {
      console.error("Error menyimpan karyawan:", error);
      setError('Terjadi kesalahan saat menyimpan data karyawan. Silakan coba lagi.');
    }
  };
  
  const handleDeleteEmployee = async () => {
    try {
      setError('');
      setSuccessMessage('');
      
      await deleteEmployee(currentEmployee.id);
      const updatedList = employees.filter(emp => emp.id !== currentEmployee.id);
      setEmployees(updatedList);
      setFilteredEmployees(updatedList);
      setSuccessMessage('Karyawan berhasil dihapus!');
      
      setTimeout(() => {
        setIsDeleteModalOpen(false);
        setSuccessMessage('');
      }, 1000);
    } catch (error) {
      console.error("Error menghapus karyawan:", error);
      setError('Terjadi kesalahan saat menghapus karyawan. Silakan coba lagi.');
    }
  };

  const columns = [
    { key: 'name', title: 'Nama Karyawan' },
    { key: 'position', title: 'Jabatan' },
    { key: 'email', title: 'Email', render: (row) => row.email || '-' },
    { key: 'phone', title: 'No. Telepon', render: (row) => row.phone || '-' },
    {
      key: 'actions',
      title: 'Aksi',
      render: (row) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEditEmployee(row)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDeleteClick(row)}>
            Hapus
          </Button>
        </div>
      )
    }
  ];

  const tableActions = (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 md:space-x-4">
      <input
        type="text"
        placeholder="Cari nama karyawan..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="px-3 py-2 w-full md:w-72 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <Button onClick={handleAddEmployee}>Tambah Karyawan</Button>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Karyawan</h1>
          <p className="mt-1 text-gray-500">Kelola data karyawan dalam sistem</p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-sm">
            <p>{error}</p>
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredEmployees}
            loading={loading}
            actions={tableActions}
            pagination={true}
            itemsPerPage={10}
            emptyMessage="Belum ada data karyawan"
          />
        </div>

        {/* Modal Add/Edit */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={currentEmployee ? "Edit Karyawan" : "Tambah Karyawan Baru"}
        >
          {successMessage && (
            <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg">
              <p>{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {['name', 'position', 'email', 'phone'].map((field) => (
              <div key={field}>
                <label
                  htmlFor={field}
                  className="block text-sm font-medium text-gray-700"
                >
                  {field === 'name' && 'Nama Karyawan'}
                  {field === 'position' && 'Jabatan'}
                  {field === 'email' && 'Email'}
                  {field === 'phone' && 'No. Telepon'}
                  {(field === 'name' || field === 'position') && (
                    <span className="text-red-500"> *</span>
                  )}
                </label>
                <input
                  type={field === 'email' ? 'email' : 'text'}
                  id={field}
                  name={field}
                  required={field === 'name' || field === 'position'}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData[field]}
                  onChange={handleInputChange}
                />
              </div>
            ))}

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="light" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                {currentEmployee ? "Simpan Perubahan" : "Tambah Karyawan"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal Delete */}
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
              <Button type="button" variant="light" onClick={() => setIsDeleteModalOpen(false)}>
                Batal
              </Button>
              <Button type="button" variant="danger" onClick={handleDeleteEmployee}>
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
