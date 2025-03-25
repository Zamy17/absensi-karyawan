// src/utils/attendanceHelpers.js
import { getEmployees } from '../firebase/firestore';
import { isWorkday, formatDate } from './dateUtils';

// Prepare attendance data for a specific date
// marking employees who didn't check in as "Tidak Hadir"
export const prepareAttendanceData = async (attendanceRecords, date) => {
  try {
    // Get all employees
    const employees = await getEmployees();
    
    // Create a map of existing attendance records
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      attendanceMap[record.employeeId] = record;
    });
    
    // Create complete attendance list with absent employees
    const completeAttendance = [];
    
    employees.forEach(employee => {
      if (attendanceMap[employee.id]) {
        // Employee has an attendance record
        completeAttendance.push(attendanceMap[employee.id]);
      } else {
        // Employee doesn't have an attendance record - mark as absent
        completeAttendance.push({
          employeeId: employee.id,
          employeeName: employee.name,
          position: employee.position,
          date,
          status: "Tidak Hadir"
        });
      }
    });
    
    return completeAttendance;
  } catch (error) {
    console.error("Error preparing attendance data:", error);
    throw new Error(error.message);
  }
};

// Check if the employee can check in
export const canCheckIn = (employee, existingAttendance) => {
  // Check if today is a workday
  if (!isWorkday()) {
    return {
      canCheckIn: false,
      message: "Tidak dapat absen masuk pada akhir pekan atau hari libur."
    };
  }
  
  // Check if the employee already checked in today
  const today = formatDate(new Date());
  const todayAttendance = existingAttendance.find(
    record => record.employeeId === employee.id && record.date === today
  );
  
  if (todayAttendance && todayAttendance.checkInTime) {
    return {
      canCheckIn: false,
      message: `${employee.name} sudah absen masuk hari ini pada ${todayAttendance.checkInTime}.`
    };
  }
  
  return {
    canCheckIn: true,
    message: ""
  };
};

// Check if the employee can check out
export const canCheckOut = (employee, existingAttendance) => {
  // Check if today is a workday
  if (!isWorkday()) {
    return {
      canCheckOut: false,
      message: "Tidak dapat absen pulang pada akhir pekan atau hari libur."
    };
  }
  
  // Check if the employee has checked in today
  const today = formatDate(new Date());
  const todayAttendance = existingAttendance.find(
    record => record.employeeId === employee.id && record.date === today
  );
  
  if (!todayAttendance || !todayAttendance.checkInTime) {
    return {
      canCheckOut: false,
      message: `${employee.name} belum absen masuk hari ini.`
    };
  }
  
  // Check if the employee already checked out today
  if (todayAttendance.checkOutTime) {
    return {
      canCheckOut: false,
      message: `${employee.name} sudah absen pulang hari ini pada ${todayAttendance.checkOutTime}.`
    };
  }
  
  return {
    canCheckOut: true,
    message: ""
  };
};

// Count attendance statistics
export const countAttendanceStats = (attendanceData) => {
  const stats = {
    total: attendanceData.length,
    onTime: 0,
    late: 0,
    veryLate: 0,
    absent: 0
  };
  
  attendanceData.forEach(record => {
    switch (record.status) {
      case "Tepat Waktu":
        stats.onTime++;
        break;
      case "Terlambat":
        stats.late++;
        break;
      case "Sangat Terlambat":
        stats.veryLate++;
        break;
      case "Tidak Hadir":
        stats.absent++;
        break;
      default:
        break;
    }
  });
  
  return stats;
};

// Calculate attendance percentage for an employee
export const calculateAttendancePercentage = (employeeAttendance, totalWorkDays) => {
  const presentDays = employeeAttendance.filter(record => 
    record.status !== "Tidak Hadir"
  ).length;
  
  return (presentDays / totalWorkDays) * 100;
};

// Calculate on-time percentage for an employee
export const calculateOnTimePercentage = (employeeAttendance, totalWorkDays) => {
  const onTimeDays = employeeAttendance.filter(record => 
    record.status === "Tepat Waktu"
  ).length;
  
  return (onTimeDays / totalWorkDays) * 100;
};