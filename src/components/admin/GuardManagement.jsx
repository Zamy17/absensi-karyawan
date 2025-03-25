// src/components/admin/GuardManagement.jsx
import React, { useState, useEffect } from 'react';
import { getGuards, addGuard, updateGuard, deleteGuard } from '../../firebase/firestore';
import Layout from '../layout/Layout';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import DataTable from '../shared/DataTable';

const GuardManagement = () => {
  const [guards, setGuards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentGuard, setCurrentGuard] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '' // Only for new guards
  });
  
  // Fetch guards data
  useEffect(() => {
    const fetchGuards = async () => {
      try {
        setLoading(true);
        const data = await getGuards();
        setGuards(data);
      } catch (error) {
        console.error("Error fetching guards:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGuards();
  }, []);
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // Open modal for adding new guard
  const handleAddGuard = () => {
    setCurrentGuard(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: ''
    });
    setIsModalOpen(true);
  };
  
  // Open modal for editing guard
  const handleEditGuard = (guard) => {
    setCurrentGuard(guard);
    setFormData({
      name: guard.name,
      email: guard.email || '',
      phone: guard.phone || '',
      password: '' // Not showing existing password
    });
    setIsModalOpen(true);
  };
  
  // Open modal for confirming delete
  const handleDeleteClick = (guard) => {
    setCurrentGuard(guard);
    setIsDeleteModalOpen(true);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (currentGuard) {
        // Update existing guard - exclude password if empty
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        
        const updatedGuard = await updateGuard(currentGuard.id, updateData);
        setGuards(guards.map(guard => 
          guard.id === updatedGuard.id ? { ...guard, ...updatedGuard } : guard
        ));
      } else {
        // Add new guard
        const newGuard = await addGuard(formData);
        setGuards([...guards, newGuard]);
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving guard:", error);
    }
  };
  
  // Handle guard deletion
  const handleDeleteGuard = async () => {
    try {
      await deleteGuard(currentGuard.id);
      setGuards(guards.filter(guard => guard.id !== currentGuard.id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting guard:", error);
    }
  };
  
  // Table columns
  const columns = [
    {
      key: 'name',
      title: 'Nama Satpam'
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
              handleEditGuard(row);
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
    <Button onClick={handleAddGuard}>Tambah Satpam</Button>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Data Satpam
          </h1>
          <p className="mt-1 text-gray-500">
            Kelola data satpam dalam sistem
          </p>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <DataTable
            columns={columns}
            data={guards}
            loading={loading}
            actions={tableActions}
            pagination={true}
            itemsPerPage={10}
            emptyMessage="Belum ada data satpam"
          />
        </div>
        
        {/* Add/Edit Guard Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={currentGuard ? "Edit Satpam" : "Tambah Satpam Baru"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nama Satpam <span className="text-red-500">*</span>
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
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
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password {!currentGuard && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required={!currentGuard}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={currentGuard ? "Kosongkan jika tidak ingin mengubah" : ""}
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
                {currentGuard ? "Simpan Perubahan" : "Tambah Satpam"}
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
              Apakah Anda yakin ingin menghapus satpam <strong>{currentGuard?.name}</strong>?
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
                onClick={handleDeleteGuard}
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

export default GuardManagement;