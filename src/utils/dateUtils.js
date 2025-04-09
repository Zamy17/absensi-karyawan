// src/utils/dateUtils.js

// Format date as YYYY-MM-DD using local timezone instead of UTC
export const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format time as HH:MM
export const formatTime = (date) => {
  const d = new Date(date);
  return d.toTimeString().split(' ')[0].substring(0, 5);
};

// Get current date formatted as YYYY-MM-DD
export const getCurrentDate = () => {
  return formatDate(new Date());
};

// Get current time formatted as HH:MM:SS
export const getCurrentTime = () => {
  return new Date().toTimeString().split(' ')[0];
};

// Get current time formatted for display (HH:MM)
export const getFormattedCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Check if the current time is within check-in hours (05:00 - 11:00)
export const isWithinCheckInHours = () => {
  const now = new Date();
  const hours = now.getHours();
  return hours >= 5 && hours < 11;
};

// Check if the current time is within check-out hours (17:00 - 23:00)
export const isWithinCheckOutHours = () => {
  const now = new Date();
  const hours = now.getHours();
  return hours >= 17 && hours < 23;
};

// Check if today is a workday (not weekend)
export const isWorkday = (date = new Date()) => {
  const day = date.getDay(); // 0 is Sunday, 6 is Saturday
  return day !== 0 && day !== 6;
};

// Get first day of current month
export const getFirstDayOfMonth = () => {
  const now = new Date();
  return formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
};

// Get last day of current month
export const getLastDayOfMonth = () => {
  const now = new Date();
  return formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
};

// Get first day of previous month
export const getPreviousMonthFirstDay = () => {
  const now = new Date();
  return formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
};

// Get month name from month number (1-12)
export const getMonthName = (monthNumber) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNumber - 1];
};

// Get number of working days in a month (exclude weekends)
export const getWorkingDaysInMonth = (year, month) => {
  // month is 1-12
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  let count = 0;
  
  for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
    const dayOfWeek = day.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 is Sunday, 6 is Saturday
      count++;
    }
  }
  
  return count;
};

// Check if a date is in the past
export const isPastDate = (dateString) => {
  const inputDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate < today;
};

// Check if a date is today
export const isToday = (dateString) => {
  const inputDate = new Date(dateString);
  const today = new Date();
  
  return (
    inputDate.getDate() === today.getDate() &&
    inputDate.getMonth() === today.getMonth() &&
    inputDate.getFullYear() === today.getFullYear()
  );
};

// Calculate attendance status based on check-in time
export const calculateAttendanceStatus = (checkInTime) => {
  if (!checkInTime) return "Tidak Hadir";
  
  const [hours, minutes] = checkInTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  
  // 08:10 in minutes = 480 minutes
  // 08:30 in minutes = 510 minutes
  if (totalMinutes <= 480) {
    return "Tepat Waktu";
  } else if (totalMinutes <= 510) {
    return "Terlambat";
  } else {
    return "Sangat Terlambat";
  }
};