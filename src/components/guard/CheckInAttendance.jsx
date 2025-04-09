// src/components/guard/CheckInAttendance.jsx (Optimized for mobile)
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getEmployees, recordCheckIn } from '../../firebase/firestore';
import { getCurrentDate, getCurrentTime, isWithinCheckInHours } from '../../utils/dateUtils';
import { canCheckIn } from '../../utils/attendanceHelpers';
import Layout from '../layout/Layout';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

const CheckInAttendance = () => {
  const { currentUser } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [confirmationStatus, setConfirmationStatus] = useState('');
  const [statusType, setStatusType] = useState('');
  const [currentDateString, setCurrentDateString] = useState(getCurrentDate());
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
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
  
  // Store unsubscribe function in a ref
  const unsubscribeRef = useRef(null);
  
  // Check if within check-in hours
  const canRecordAttendance = isWithinCheckInHours();
  
  // Function to get current date in YYYY-MM-DD format
  const getUpdatedCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Setup real-time listener for attendance data
  useEffect(() => {
    const correctDate = getUpdatedCurrentDate();
    if (currentDateString !== correctDate) {
      setCurrentDateString(correctDate);
    }
    
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    
    setLoading(true);
    
    const attendanceQuery = query(
      collection(db, "attendance"),
      where("date", "==", currentDateString)
    );
    
    const unsubscribe = onSnapshot(attendanceQuery, (querySnapshot) => {
      const attendanceData = [];
      querySnapshot.forEach((doc) => {
        attendanceData.push({ id: doc.id, ...doc.data() });
      });
      
      setTodayAttendance(attendanceData);
      setLoading(false);
    }, (error) => {
      console.error("Error setting up real-time listener:", error);
      setLoading(false);
    });
    
    unsubscribeRef.current = unsubscribe;
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [currentUser, currentDateString]);
  
  // Fetch employees data
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!currentUser) return;
      
      try {
        const employeesData = await getEmployees();
        setEmployees(employeesData);
        setFilteredEmployees(employeesData);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    
    fetchEmployees();
  }, [currentUser]);
  
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
  
  // Handle employee selection for check-in
  const handleSelectEmployee = (employee) => {
    if (!canRecordAttendance) return;
    
    // Check if employee can check in
    const checkInStatus = canCheckIn(employee, todayAttendance);
    
    if (checkInStatus.canCheckIn) {
      setSelectedEmployee(employee);
      setConfirmationStatus('');
      setStatusType('');
      setIsModalOpen(true);
    } else {
      alert(checkInStatus.message);
    }
  };
  
  // Handle check-in confirmation
  const handleConfirmCheckIn = async () => {
    try {
      if (!selectedEmployee || !currentUser) return;
      
      // Do one final check before submitting
      const checkInStatus = canCheckIn(selectedEmployee, todayAttendance);
      if (!checkInStatus.canCheckIn) {
        alert(checkInStatus.message);
        setIsModalOpen(false);
        return;
      }
      
      setConfirmationStatus('loading');
      
      // Record check-in
      const result = await recordCheckIn(selectedEmployee.id, currentUser.uid);
      
      setConfirmationStatus('success');
      setStatusType(result.status);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setIsModalOpen(false);
        setSelectedEmployee(null);
      }, 2000);
      
    } catch (error) {
      console.error("Error confirming check-in:", error);
      setConfirmationStatus('error');
    }
  };
  
  // Check if employee has already checked in
  const hasCheckedIn = (employeeId) => {
    return todayAttendance.some(
      record => record.employeeId === employeeId && record.checkInTime
    );
  };
  
  // Get attendance status for an employee
  const getEmployeeAttendanceStatus = (employeeId) => {
    const record = todayAttendance.find(
      record => record.employeeId === employeeId
    );
    
    if (!record) {
      return "Belum Absen";
    } else if (record.checkInTime) {
      return `Masuk: ${record.checkInTime} (${record.status || 'Unknown'})`;
    } else {
      return "Belum Absen";
    }
  };
  
  // Mobile optimized employee list
  const renderMobileEmployeeList = () => {
    if (filteredEmployees.length === 0) {
      return (
        <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
          {searchTerm ? "Tidak ditemukan karyawan yang sesuai dengan pencarian" : "Belum ada data karyawan"}
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {filteredEmployees.map((employee) => {
          const checkedIn = hasCheckedIn(employee.id);
          const statusText = getEmployeeAttendanceStatus(employee.id);
          
          return (
            <div 
              key={employee.id}
              className={`bg-white rounded-lg shadow p-4 ${checkedIn ? 'border-l-4 border-green-500' : ''}`}
              onClick={() => !checkedIn && canRecordAttendance && handleSelectEmployee(employee)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{employee.name}</h3>
                  <p className="text-sm text-gray-500">{employee.position}</p>
                  {checkedIn && <p className="text-xs text-gray-500 mt-1">{statusText}</p>}
                </div>
                <div>
                  {checkedIn ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Sudah Absen
                    </span>
                  ) : (
                    <button
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${canRecordAttendance ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'}`}
                      disabled={!canRecordAttendance}
                    >
                      Konfirmasi
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Layout>
      <div className={`space-y-4 ${isMobile ? 'pb-safe' : ''}`}>
        {!isMobile && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Konfirmasi Absensi Masuk
            </h1>
            <p className="mt-1 text-gray-500">
              Konfirmasi absensi masuk karyawan (05:00 - 11:00)
            </p>
          </div>
        )}
        
        {/* Status warning */}
        {!canRecordAttendance && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Saat ini di luar jam absensi masuk (05:00 - 11:00).
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Date display */}
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium">
            Data absensi untuk tanggal: <span className="text-blue-600">{currentDateString}</span>
          </div>
        </div>
        
        {/* Search box */}
        <div className="relative">
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
        
        {/* Employee list */}
        <div className="bg-gray-50 rounded-lg p-4">
          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : isMobile ? (
            renderMobileEmployeeList()
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
                            variant={hasCheckedIn(employee.id) ? "light" : "primary"}
                            size="sm"
                            onClick={() => handleSelectEmployee(employee)}
                            disabled={!canRecordAttendance || hasCheckedIn(employee.id)}
                          >
                            {hasCheckedIn(employee.id) ? "Sudah Absen" : "Konfirmasi Masuk"}
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
          title="Konfirmasi Absensi Masuk"
          size={isMobile ? "full" : "sm"}
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
              <p className="text-green-700 font-medium">Absensi berhasil dikonfirmasi!</p>
              <p className="text-gray-500 mt-1">
                Status: {statusType}
              </p>
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
                Konfirmasi absensi masuk untuk:
              </p>
              
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <p className="font-medium">{selectedEmployee?.name}</p>
                <p className="text-gray-500">{selectedEmployee?.position}</p>
              </div>
              
              <div className="flex justify-between text-sm text-gray-500 mb-4">
                <span>Tanggal</span>
                <span>{currentDateString}</span>
              </div>
              
              <div className="flex justify-between text-sm text-gray-500 mb-4">
                <span>Jam Masuk</span>
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
                  onClick={handleConfirmCheckIn}
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

export default CheckInAttendance;