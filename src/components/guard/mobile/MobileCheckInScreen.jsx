// src/components/guard/mobile/MobileCheckInScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getEmployees, recordCheckIn } from '../../../firebase/firestore';
import { getCurrentDate, getCurrentTime, isWithinCheckInHours } from '../../../utils/dateUtils';
import { canCheckIn } from '../../../utils/attendanceHelpers';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase/config';

// Mobile optimized component for check-in
const MobileCheckInScreen = () => {
  const { currentUser } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [confirmingCheckIn, setConfirmingCheckIn] = useState(false);
  const [confirmationStatus, setConfirmationStatus] = useState('');
  const [statusType, setStatusType] = useState('');
  const [currentDateString, setCurrentDateString] = useState(getCurrentDate());
  
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
      setConfirmingCheckIn(true);
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
        setConfirmingCheckIn(false);
        return;
      }
      
      setConfirmationStatus('loading');
      
      // Record check-in
      const result = await recordCheckIn(selectedEmployee.id, currentUser.uid);
      
      setConfirmationStatus('success');
      setStatusType(result.status);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setConfirmingCheckIn(false);
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

  // Render confirmation modal
  const renderConfirmationModal = () => {
    if (!confirmingCheckIn) return null;
    
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-full max-w-sm overflow-hidden shadow-xl">
          {confirmationStatus === 'loading' ? (
            <div className="p-6 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-700">Memproses absensi...</p>
            </div>
          ) : confirmationStatus === 'success' ? (
            <div className="p-6 flex flex-col items-center justify-center">
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Konfirmasi Absensi Masuk</h3>
              
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
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  onClick={() => setConfirmingCheckIn(false)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={handleConfirmCheckIn}
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
        <h1 className="text-xl font-bold">Konfirmasi Absensi Masuk</h1>
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
                Saat ini di luar jam absensi masuk (05:00 - 11:00).
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
                const hasCheckedInToday = hasCheckedIn(employee.id);
                
                return (
                  <div 
                    key={employee.id}
                    className={`bg-white rounded-lg shadow p-4 ${hasCheckedInToday ? 'border-l-4 border-green-500' : ''}`}
                    onClick={() => !hasCheckedInToday && handleSelectEmployee(employee)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">{employee.name}</h3>
                        <p className="text-sm text-gray-500">{employee.position}</p>
                      </div>
                      <div>
                        {hasCheckedInToday ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Sudah Absen
                          </span>
                        ) : (
                          <button
                            className={`px-3 py-2 rounded-lg text-sm font-medium ${canRecordAttendance ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500'}`}
                            disabled={!canRecordAttendance}
                          >
                            Konfirmasi
                          </button>
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

export default MobileCheckInScreen;