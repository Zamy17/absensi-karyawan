// src/components/guard/CheckOutAttendance.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getEmployees, getAttendanceByDate, recordCheckOut } from '../../firebase/firestore';
import { getCurrentDate, getCurrentTime, isWithinCheckOutHours, isWorkday } from '../../utils/dateUtils';
import { canCheckOut } from '../../utils/attendanceHelpers';
import Layout from '../layout/Layout';
import Button from '../shared/Button';
import Modal from '../shared/Modal';

const CheckOutAttendance = () => {
  const { currentUser } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [confirmationStatus, setConfirmationStatus] = useState('');
  
  // Check if today is a workday and within check-out hours
  const canRecordAttendance = isWorkday() && isWithinCheckOutHours();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get all employees
        const employeesData = await getEmployees();
        setEmployees(employeesData);
        setFilteredEmployees(employeesData);
        
        // Get today's attendance
        const today = getCurrentDate();
        const attendanceData = await getAttendanceByDate(today);
        setTodayAttendance(attendanceData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter employees based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(
        employee => employee.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, employees]);
  
  // Handle employee selection for check-out
  const handleSelectEmployee = (employee) => {
    if (!canRecordAttendance) return;
    
    const checkOutStatus = canCheckOut(employee, todayAttendance);
    
    if (checkOutStatus.canCheckOut) {
      const attendance = todayAttendance.find(
        record => record.employeeId === employee.id
      );
      
      setSelectedEmployee(employee);
      setSelectedAttendance(attendance);
      setConfirmationStatus('');
      setIsModalOpen(true);
    } else {
      alert(checkOutStatus.message);
    }
  };
  
  // Handle check-out confirmation
  const handleConfirmCheckOut = async () => {
    try {
      if (!selectedEmployee) return;
      
      setConfirmationStatus('loading');
      
      // Record check-out
      const result = await recordCheckOut(selectedEmployee.id, currentUser.uid);
      
      // Update today's attendance
      setTodayAttendance(
        todayAttendance.map(record => 
          record.id === result.id ? result : record
        )
      );
      
      setConfirmationStatus('success');
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setIsModalOpen(false);
        setSelectedEmployee(null);
        setSelectedAttendance(null);
      }, 2000);
    } catch (error) {
      console.error("Error confirming check-out:", error);
      setConfirmationStatus('error');
    }
  };
  
  // Get attendance status for an employee
  const getEmployeeAttendanceStatus = (employeeId) => {
    const record = todayAttendance.find(
      record => record.employeeId === employeeId
    );
    
    if (!record) {
      return "Belum Absen";
    } else if (record.checkInTime && record.checkOutTime) {
      return `Pulang: ${record.checkOutTime}`;
    } else if (record.checkInTime) {
      return `Masuk: ${record.checkInTime}`;
    } else {
      return "Belum Absen";
    }
  };
  
  // Check if employee has checked in but not checked out
  const canEmployeeCheckOut = (employeeId) => {
    const record = todayAttendance.find(
      record => record.employeeId === employeeId
    );
    
    return record && record.checkInTime && !record.checkOutTime;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Konfirmasi Absensi Pulang
          </h1>
          <p className="mt-1 text-gray-500">
            Konfirmasi absensi pulang karyawan (17:00 - 23:00)
          </p>
        </div>
        
        {/* Status warning */}
        {!canRecordAttendance && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {!isWorkday() 
                    ? "Hari ini adalah hari libur/akhir pekan. Tidak ada absensi hari ini." 
                    : "Saat ini di luar jam absensi pulang (17:00 - 23:00)."}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Search box */}
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
          <div className="relative flex-grow">
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
          <div className="text-right text-sm text-gray-500">
            {getCurrentDate()} - {getCurrentTime()}
          </div>
        </div>
        
        {/* Employee list */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Karyawan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jabatan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status Absensi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                        {searchTerm 
                          ? "Tidak ditemukan karyawan yang sesuai dengan pencarian" 
                          : "Belum ada data karyawan"}
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <tr key={employee.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {employee.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {employee.position}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getEmployeeAttendanceStatus(employee.id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button
                            variant={canEmployeeCheckOut(employee.id) ? "primary" : "light"}
                            size="sm"
                            onClick={() => handleSelectEmployee(employee)}
                            disabled={!canRecordAttendance || !canEmployeeCheckOut(employee.id)}
                          >
                            {canEmployeeCheckOut(employee.id) 
                              ? "Konfirmasi Pulang" 
                              : "Tidak Dapat Absen"}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Confirmation Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            if (confirmationStatus !== 'loading') {
              setIsModalOpen(false);
            }
          }}
          title="Konfirmasi Absensi Pulang"
          size="sm"
        >
          {confirmationStatus === 'loading' ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-700">Memproses absensi...</p>
            </div>
          ) : confirmationStatus === 'success' ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-700 font-medium">Absensi pulang berhasil dikonfirmasi!</p>
            </div>
          ) : confirmationStatus === 'error' ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-700 font-medium">Terjadi kesalahan!</p>
              <p className="text-gray-500 mt-1">
                Silakan coba lagi nanti.
              </p>
            </div>
          ) : (
            <div className="py-6">
              <p className="text-gray-700 mb-4">
                Konfirmasi absensi pulang untuk:
              </p>
              
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <p className="font-medium">{selectedEmployee?.name}</p>
                <p className="text-gray-500">{selectedEmployee?.position}</p>
              </div>
              
              <div className="flex justify-between text-sm text-gray-500 mb-4">
                <span>Tanggal</span>
                <span>{getCurrentDate()}</span>
              </div>
              
              <div className="flex justify-between text-sm text-gray-500 mb-4">
                <span>Jam Masuk</span>
                <span>{selectedAttendance?.checkInTime || "-"}</span>
              </div>
              
              <div className="flex justify-between text-sm text-gray-500 mb-4">
                <span>Jam Pulang</span>
                <span>{getCurrentTime()}</span>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="light"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmCheckOut}
                >
                  Konfirmasi
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default CheckOutAttendance;