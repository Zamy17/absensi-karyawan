// src/contexts/AttendanceContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAttendanceByDate,
  getAttendanceByDateRange,
  getAttendanceByEmployee,
  getEmployees
} from '../firebase/firestore';
import { 
  getCurrentDate,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  isWorkday 
} from '../utils/dateUtils';
import { prepareAttendanceData } from '../utils/attendanceHelpers';

const AttendanceContext = createContext();

export const useAttendance = () => {
  return useContext(AttendanceContext);
};

export const AttendanceProvider = ({ children }) => {
  // Shared state for attendance data
  const [attendanceData, setAttendanceData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getLastDayOfMonth());
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [error, setError] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({
    total: 0,
    onTime: 0,
    late: 0,
    veryLate: 0,
    absent: 0
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
        setError("Failed to fetch employees data");
      }
    };
    
    fetchEmployees();
  }, []);

  // Fetch today's attendance data
  useEffect(() => {
    const fetchTodayAttendance = async () => {
      try {
        setLoading(true);
        
        // Get today's date
        const today = getCurrentDate();
        
        // Get today's attendance
        const data = await getAttendanceByDate(today);
        
        // Create complete attendance list with absent employees
        if (isWorkday()) {
          const completeAttendance = await prepareAttendanceData(data, today);
          setTodayAttendance(completeAttendance);
          
          // Count statistics
          const stats = {
            total: completeAttendance.length,
            onTime: completeAttendance.filter(r => r.status === "Tepat Waktu").length,
            late: completeAttendance.filter(r => r.status === "Terlambat").length,
            veryLate: completeAttendance.filter(r => r.status === "Sangat Terlambat").length,
            absent: completeAttendance.filter(r => r.status === "Tidak Hadir").length
          };
          
          setAttendanceStats(stats);
        } else {
          setTodayAttendance(data);
        }
      } catch (error) {
        console.error("Error fetching today's attendance:", error);
        setError("Failed to fetch today's attendance data");
      } finally {
        setLoading(false);
      }
    };
    
    if (employees.length > 0) {
      fetchTodayAttendance();
    }
  }, [employees]);

  // Fetch attendance data based on filters
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let data = [];
        
        if (selectedEmployee === 'all') {
          // Get attendance for all employees
          if (startDate === endDate) {
            // Single day
            const fetchedData = await getAttendanceByDate(startDate);
            
            // Prepare complete data with absent employees
            if (isWorkday(new Date(startDate))) {
              data = await prepareAttendanceData(fetchedData, startDate);
            } else {
              data = fetchedData;
            }
          } else {
            // Date range
            data = await getAttendanceByDateRange(startDate, endDate);
          }
        } else {
          // Get attendance for specific employee
          data = await getAttendanceByEmployee(selectedEmployee, startDate, endDate);
        }
        
        setAttendanceData(data);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
        setError("Failed to fetch attendance data");
      } finally {
        setLoading(false);
      }
    };
    
    if (employees.length > 0) {
      fetchAttendanceData();
    }
  }, [startDate, endDate, selectedEmployee, employees]);

  // Refresh dashboard data
  const refreshData = async () => {
    setLoading(true);
    try {
      const today = getCurrentDate();
      const data = await getAttendanceByDate(today);
      
      if (isWorkday()) {
        const completeAttendance = await prepareAttendanceData(data, today);
        setTodayAttendance(completeAttendance);
        
        // Count statistics
        const stats = {
          total: completeAttendance.length,
          onTime: completeAttendance.filter(r => r.status === "Tepat Waktu").length,
          late: completeAttendance.filter(r => r.status === "Terlambat").length,
          veryLate: completeAttendance.filter(r => r.status === "Sangat Terlambat").length,
          absent: completeAttendance.filter(r => r.status === "Tidak Hadir").length
        };
        
        setAttendanceStats(stats);
      } else {
        setTodayAttendance(data);
      }
      
      setError(null);
    } catch (error) {
      console.error("Error refreshing data:", error);
      setError("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  const value = {
    attendanceData,
    employees,
    todayAttendance,
    loading,
    startDate,
    endDate,
    selectedEmployee,
    error,
    attendanceStats,
    setStartDate,
    setEndDate,
    setSelectedEmployee,
    refreshData
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
};

export default AttendanceContext;