// src/components/guard/mobile/MobileCheckOutScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getEmployees, recordCheckOut } from '../../../firebase/firestore';
import { getCurrentDate, getCurrentTime, isWithinCheckOutHours } from '../../../utils/dateUtils';
import { canCheckOut } from '../../../utils/attendanceHelpers';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase/config';

// Mobile optimized component for check-out
const MobileCheckOutScreen = () => {
  const { currentUser } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [confirmingCheckOut, setConfirmingCheckOut] = useState(false);
  const [confirmationStatus, setConfirmationStatus] = useState('');
  const [currentDateString, setCurrentDateString] = useState(getCurrentDate());
  
  // Store unsubscribe function in a ref
  const unsubscribeRef = useRef(null);
  
  // Check if within check-out hours
  const canRecordAttendance = isWithinCheckOutHours();
  
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
  
  // Handle employee selection for check-out
  const handleSelectEmployee = (employee) => {
    if (!canRecordAttendance) return;
    
    // Check if employee can check out
    const checkOutStatus = canCheckOut(employee, todayAttendance);
    
    if (checkOutStatus.canCheckOut) {
      const attendance = todayAttendance.find(
        record => record.employeeId === employee.id
      );
      
      setSelectedEmployee(employee);
      setSelectedAttendance(attendance);
      setConfirmationStatus('');
      setConfirmingCheckOut(true);
    } else {
      alert(checkOutStatus.message);
    }
  };
  
  // Handle check-out confirmation
  const handleConfirmCheckOut = async () => {
    try {
      if (!selectedEmployee || !currentUser) return;
      
      // Do one final check before submitting
      const checkOutStatus = canCheckOut(selectedEmployee, todayAttendance);
      if (!checkOutStatus.canCheckOut) {
        alert(checkOutStatus.message);
        setConfirmingCheckOut(false);
        return;
      }
      
      setConfirmationStatus('loading');
      
      // Record check-out
      await recordCheckOut(selectedEmployee.id, currentUser.uid);
      
      setConfirmationStatus('success');
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setConfirmingCheckOut(false);
        setSelectedEmployee(null);
        setSelectedAttendance(null);
      }, 2000);
      
    } catch (error) {
      console.error("Error confirming check-out:", error);
      setConfirmationStatus('error');
    }
  };
  
  // Check if employee has checked in but not checked out
  const canEmployeeCheckOut = (employeeId) => {
    const record = todayAttendance.find(
      record => record.employeeId === employeeId
    );
    
    return record && record.checkInTime && !record.checkOutTime;
  };
  
  // Get attendance status text for display
  const getAttendanceStatusText = (employee) => {
    const record = todayAttendance.find(
      record => record.employeeId === employee.id
    );
    
    if (!record) {
      return "Belum Absen";
    } else if (record.checkInTime && record.checkOutTime) {
      return `Sudah Absen Pulang (${record.checkOutTime})`;
    } else if (record.checkInTime) {
      return `Masuk: ${record.checkInTime}`;
    } else {
      return "Belum Absen";
    }
  };

  // Render confirmation modal
  const renderConfirmationModal = () => {
    if (!confirmingCheckOut) return null;
    
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-full max-w-sm overflow-hidden shadow-xl">
          {confirmationStatus === 'loading' ? (
            <div className="p-6 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-700">Memproses absensi pulang...</p>
            </div>
          ) : confirmationStatus === 'success' ? (
            <div className="p-6 flex flex-col items-center justify-center">
              <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-700 font-medium">Absensi pulang berhasil dikonfirmasi!</p>
            </div>
          ) : confirmationStatus === 'error' ? (
            <div className="p-6 flex flex-col items-center justify-center">
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
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Konfirmasi Absensi Pulang</h3>
              
              <p className="text-gray-700 mb-4">
                Konfirmasi absensi pulang untuk:
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
                <span>{selectedAttendance?.checkInTime || "-"}</span>
              </div>
              
              <div className="flex justify-between text-sm text-gray-500 mb-4">
                <span>Jam Pulang</span>
                <span>{getCurrentTime()}</span>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  onClick={() => setConfirmingCheckOut(false)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={handleConfirmCheckOut}
                >
                  Konfirmasi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="pb-20">
      {/* Mobile header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 mb-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold">Konfirmasi Absensi Pulang</h1>
        <p className="text-sm opacity-80">
          {currentDateString} - {getCurrentTime()}
        </p>
      </div>
      
      {/* Status bar */}
      {!canRecordAttendance && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 mx-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Saat ini di luar jam absensi pulang (17:00 - 23:00).
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Search box */}
      <div className="px-4 mb-4">
        <div className="relative">
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
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
      
      {/* Employee list */}
      <div className="px-4">
        {loading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEmployees.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
                {searchTerm 
                  ? "Tidak ditemukan karyawan yang sesuai dengan pencarian" 
                  : "Belum ada data karyawan"}
              </div>
            ) : (
              filteredEmployees.map((employee) => {
                const canCheckOutToday = canEmployeeCheckOut(employee.id);
                const statusText = getAttendanceStatusText(employee);
                const hasCheckedOut = statusText.includes("Sudah Absen Pulang");
                
                return (
                  <div 
                    key={employee.id}
                    className={`bg-white rounded-lg shadow p-4 ${
                      hasCheckedOut 
                        ? 'border-l-4 border-purple-500' 
                        : canCheckOutToday 
                          ? 'border-l-4 border-yellow-500' 
                          : ''
                    }`}
                    onClick={() => canCheckOutToday && handleSelectEmployee(employee)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">{employee.name}</h3>
                        <p className="text-sm text-gray-500">{employee.position}</p>
                        <p className="text-xs text-gray-500 mt-1">{statusText}</p>
                      </div>
                      <div>
                        {hasCheckedOut ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Sudah Pulang
                          </span>
                        ) : canCheckOutToday ? (
                          <button
                            className={`px-3 py-2 rounded-lg text-sm font-medium ${canRecordAttendance ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500'}`}
                            disabled={!canRecordAttendance}
                          >
                            Konfirmasi Pulang
                          </button>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            Belum Absen Masuk
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      
      {/* Render confirmation modal */}
      {renderConfirmationModal()}
    </div>
  );
};

export default MobileCheckOutScreen;