// src/firebase/firestore.js
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp, 
  serverTimestamp,
  setDoc 
} from "firebase/firestore";
import { db } from "./config";
import { getCurrentDate } from "../utils/dateUtils";

// ===== Employee Operations =====
export const getEmployees = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "employees"));
    const employees = [];
    querySnapshot.forEach((doc) => {
      employees.push({ id: doc.id, ...doc.data() });
    });
    return employees;
  } catch (error) {
    console.error("Error getting employees:", error);
    throw new Error(error.message);
  }
};

export const addEmployee = async (employeeData) => {
  try {
    const docRef = await addDoc(collection(db, "employees"), {
      ...employeeData,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...employeeData };
  } catch (error) {
    console.error("Error adding employee:", error);
    throw new Error(error.message);
  }
};

export const updateEmployee = async (id, employeeData) => {
  try {
    const employeeRef = doc(db, "employees", id);
    await updateDoc(employeeRef, {
      ...employeeData,
      updatedAt: serverTimestamp()
    });
    return { id, ...employeeData };
  } catch (error) {
    console.error("Error updating employee:", error);
    throw new Error(error.message);
  }
};

export const deleteEmployee = async (id) => {
  try {
    await deleteDoc(doc(db, "employees", id));
    return id;
  } catch (error) {
    console.error("Error deleting employee:", error);
    throw new Error(error.message);
  }
};

export const getEmployeeById = async (id) => {
  try {
    const docRef = doc(db, "employees", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error("Employee not found");
    }
  } catch (error) {
    console.error("Error getting employee:", error);
    throw new Error(error.message);
  }
};

// ===== Guard Operations =====
export const getGuards = async () => {
  try {
    const q = query(
      collection(db, "users"),
      where("role", "==", "guard")
    );
    const querySnapshot = await getDocs(q);
    const guards = [];
    querySnapshot.forEach((doc) => {
      guards.push({ id: doc.id, ...doc.data() });
    });
    return guards;
  } catch (error) {
    console.error("Error getting guards:", error);
    throw new Error(error.message);
  }
};

export const addGuard = async (guardData, uid) => {
  try {
    // If uid is provided, it means the user was created in Authentication
    if (uid) {
      await setDoc(doc(db, "users", uid), {
        ...guardData,
        role: "guard",
        createdAt: serverTimestamp()
      });
      return { id: uid, ...guardData, role: "guard" };
    } else {
      // For testing purposes, we allow adding without auth
      const docRef = await addDoc(collection(db, "users"), {
        ...guardData,
        role: "guard",
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, ...guardData, role: "guard" };
    }
  } catch (error) {
    console.error("Error adding guard:", error);
    throw new Error(error.message);
  }
};

export const updateGuard = async (id, guardData) => {
  try {
    const guardRef = doc(db, "users", id);
    await updateDoc(guardRef, {
      ...guardData,
      updatedAt: serverTimestamp()
    });
    return { id, ...guardData };
  } catch (error) {
    console.error("Error updating guard:", error);
    throw new Error(error.message);
  }
};

export const deleteGuard = async (id) => {
  try {
    await deleteDoc(doc(db, "users", id));
    return id;
  } catch (error) {
    console.error("Error deleting guard:", error);
    throw new Error(error.message);
  }
};

// ===== Attendance Operations =====
export const recordCheckIn = async (employeeId, guardId) => {
  try {
    console.log(`Recording check-in for employee ${employeeId} by guard ${guardId}`);
    
    // Get the employee data
    const employee = await getEmployeeById(employeeId);
    
    // Get the guard data
    const guardRef = doc(db, "users", guardId);
    const guardSnap = await getDoc(guardRef);
    if (!guardSnap.exists()) {
      throw new Error("Guard not found");
    }
    const guard = { id: guardSnap.id, ...guardSnap.data() };
    
    // Get the current date
    const now = new Date();
    const checkInTime = now.toTimeString().split(' ')[0].substring(0, 8); // Format as HH:MM:SS
    
    // Format date as YYYY-MM-DD using getCurrentDate to ensure consistency
    const dateFormatted = getCurrentDate();
    console.log(`Date formatted for check-in: ${dateFormatted}`);
    
    // Determine status based on check-in time
    let status = "Tepat Waktu";
    const checkInHour = now.getHours();
    const checkInMinute = now.getMinutes();
    const totalMinutes = checkInHour * 60 + checkInMinute;
    
    if (totalMinutes > 8 * 60 + 10 && totalMinutes <= 8 * 60 + 30) {
      status = "Terlambat";
    } else if (totalMinutes > 8 * 60 + 30) {
      status = "Sangat Terlambat";
    }
    
    // Check if attendance record already exists for this employee on this date
    const q = query(
      collection(db, "attendance"),
      where("employeeId", "==", employeeId),
      where("date", "==", dateFormatted)
    );
    const querySnapshot = await getDocs(q);
    
    console.log(`Found ${querySnapshot.size} existing records for employee on ${dateFormatted}`);
    
    let attendanceRecord;
    
    if (!querySnapshot.empty) {
      // Attendance record already exists
      const existingDoc = querySnapshot.docs[0];
      const existingData = existingDoc.data();
      
      // Check if already checked in
      if (existingData.checkInTime) {
        console.log(`Employee already checked in at ${existingData.checkInTime}`);
        return {
          id: existingDoc.id,
          ...existingData,
          message: `Already checked in at ${existingData.checkInTime}`
        };
      }
      
      // Update the existing record with check-in data
      await updateDoc(doc(db, "attendance", existingDoc.id), {
        checkInTime,
        checkInGuardId: guardId,
        checkInGuardName: guard.name,
        status,
        updatedAt: serverTimestamp()
      });
      
      attendanceRecord = {
        id: existingDoc.id,
        ...existingData,
        employeeId,
        employeeName: employee.name,
        position: employee.position,
        date: dateFormatted,
        checkInTime,
        checkInGuardId: guardId,
        checkInGuardName: guard.name,
        status
      };
      
      console.log("Updated existing attendance record:", attendanceRecord);
    } else {
      // Create a new attendance record
      const attendanceData = {
        employeeId,
        employeeName: employee.name,
        position: employee.position,
        date: dateFormatted,
        checkInTime,
        checkInGuardId: guardId,
        checkInGuardName: guard.name,
        status,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, "attendance"), attendanceData);
      attendanceRecord = { id: docRef.id, ...attendanceData };
      console.log("Created new attendance record:", attendanceRecord);
    }
    
    return attendanceRecord;
  } catch (error) {
    console.error("Error recording check-in:", error);
    throw new Error(`Failed to record check-in: ${error.message}`);
  }
};

export const recordCheckOut = async (employeeId, guardId) => {
  try {
    console.log(`Recording check-out for employee ${employeeId} by guard ${guardId}`);
    
    // Get the guard data
    const guardRef = doc(db, "users", guardId);
    const guardSnap = await getDoc(guardRef);
    if (!guardSnap.exists()) {
      throw new Error("Guard not found");
    }
    const guard = { id: guardSnap.id, ...guardSnap.data() };
    
    // Get the current date
    const now = new Date();
    const checkOutTime = now.toTimeString().split(' ')[0].substring(0, 8); // Format as HH:MM:SS
    
    // Format date as YYYY-MM-DD using getCurrentDate to ensure consistency
    const dateFormatted = getCurrentDate();
    console.log(`Date formatted for check-out: ${dateFormatted}`);
    
    // Check if attendance record already exists for this employee on this date
    const q = query(
      collection(db, "attendance"),
      where("employeeId", "==", employeeId),
      where("date", "==", dateFormatted)
    );
    const querySnapshot = await getDocs(q);
    
    console.log(`Found ${querySnapshot.size} existing records for employee on ${dateFormatted}`);
    
    if (!querySnapshot.empty) {
      // Attendance record exists, update with check-out info
      const existingDoc = querySnapshot.docs[0];
      const existingData = existingDoc.data();
      
      // Check if already checked out
      if (existingData.checkOutTime) {
        console.log(`Employee already checked out at ${existingData.checkOutTime}`);
        return {
          id: existingDoc.id,
          ...existingData,
          message: `Already checked out at ${existingData.checkOutTime}`
        };
      }
      
      // Check if has checked in
      if (!existingData.checkInTime) {
        throw new Error("No check-in record found for today");
      }
      
      await updateDoc(doc(db, "attendance", existingDoc.id), {
        checkOutTime,
        checkOutGuardId: guardId,
        checkOutGuardName: guard.name,
        updatedAt: serverTimestamp()
      });
      
      const updatedData = {
        ...existingData,
        checkOutTime,
        checkOutGuardId: guardId,
        checkOutGuardName: guard.name
      };
      
      console.log("Updated attendance record with check-out:", updatedData);
      return { id: existingDoc.id, ...updatedData };
    } else {
      throw new Error("No check-in record found for today");
    }
  } catch (error) {
    console.error("Error recording check-out:", error);
    throw new Error(`Failed to record check-out: ${error.message}`);
  }
};

// === FUNGSI YANG DITINGKATKAN UNTUK QUERY ATTENDANCE ===

export const getAttendanceByDate = async (date) => {
  try {
    console.log(`Querying attendance for date: ${date}`);
    
    const q = query(
      collection(db, "attendance"),
      where("date", "==", date),
      orderBy("employeeName")
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} attendance records for ${date}`);
    
    const attendance = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`Record found: ${data.employeeName} with status ${data.status}`);
      attendance.push({ id: doc.id, ...data });
    });
    
    return attendance;
  } catch (error) {
    console.error("Error getting attendance:", error);
    throw new Error(`Failed to get attendance by date: ${error.message}`);
  }
};

export const getAttendanceByDateRange = async (startDate, endDate) => {
  try {
    console.log(`Querying attendance from ${startDate} to ${endDate}`);
    
    // Create compound query for date range
    // Note: Firestore doesn't support multiple range operators on different fields
    // So we use >= and <= on the same field (date)
    const q = query(
      collection(db, "attendance"),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date"),
      orderBy("employeeName")
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} attendance records in date range`);
    
    const attendance = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`Record found: ${data.employeeName} on ${data.date} with status ${data.status}`);
      attendance.push({ id: doc.id, ...data });
    });
    
    return attendance;
  } catch (error) {
    console.error("Error getting attendance by date range:", error);
    throw new Error(`Failed to get attendance by date range: ${error.message}`);
  }
};

export const getAttendanceByEmployee = async (employeeId, startDate, endDate) => {
  try {
    console.log(`Querying attendance for employee ${employeeId} from ${startDate} to ${endDate}`);
    
    const q = query(
      collection(db, "attendance"),
      where("employeeId", "==", employeeId),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date")
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} attendance records for employee ${employeeId}`);
    
    const attendance = [];
    querySnapshot.forEach((doc) => {
      attendance.push({ id: doc.id, ...doc.data() });
    });
    
    return attendance;
  } catch (error) {
    console.error("Error getting attendance by employee:", error);
    throw new Error(`Failed to get attendance by employee: ${error.message}`);
  }
};

export const getAttendanceByGuard = async (guardId, date) => {
  try {
    console.log(`Querying attendance confirmed by guard ${guardId} on ${date}`);
    
    // Get all attendance records for the specified date where the guard confirmed either check-in or check-out
    const q = query(
      collection(db, "attendance"),
      where("date", "==", date)
    );
    
    const querySnapshot = await getDocs(q);
    const attendance = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.checkInGuardId === guardId || data.checkOutGuardId === guardId) {
        attendance.push({ id: doc.id, ...data });
      }
    });
    
    console.log(`Found ${attendance.length} attendance records confirmed by guard ${guardId}`);
    return attendance;
  } catch (error) {
    console.error("Error getting attendance by guard:", error);
    throw new Error(`Failed to get attendance by guard: ${error.message}`);
  }
};

// Get top employees for a specific month
export const getTopEmployees = async (year, month) => {
  try {
    console.log(`Fetching top employees for ${month}/${year}`);
    
    // Create date range for the specified month
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
    
    console.log(`Date range: ${startDate} to ${endDate}`);
    
    // Get all attendance records for the month
    const allAttendance = await getAttendanceByDateRange(startDate, endDate);
    console.log(`Found ${allAttendance.length} attendance records for the month`);
    
    // Get all employees
    const employees = await getEmployees();
    console.log(`Found ${employees.length} employees`);
    
    // Calculate statistics for each employee
    const employeeStats = {};
    
    employees.forEach(employee => {
      employeeStats[employee.id] = {
        id: employee.id,
        name: employee.name,
        position: employee.position,
        totalWorkDays: 0,
        onTime: 0,
        late: 0,
        veryLate: 0,
        absent: 0,
        score: 0
      };
    });
    
    // Count working days (excluding weekends) in the month
    const totalWorkDays = countWorkDays(year, month);
    console.log(`Total working days in ${month}/${year}: ${totalWorkDays}`);
    
    // Process attendance records
    allAttendance.forEach(record => {
      if (employeeStats[record.employeeId]) {
        employeeStats[record.employeeId].totalWorkDays++;
        
        if (record.status === "Tepat Waktu") {
          employeeStats[record.employeeId].onTime++;
        } else if (record.status === "Terlambat") {
          employeeStats[record.employeeId].late++;
        } else if (record.status === "Sangat Terlambat") {
          employeeStats[record.employeeId].veryLate++;
        }
      }
    });
    
    // Calculate absences and score for each employee
    Object.values(employeeStats).forEach(stat => {
      stat.absent = totalWorkDays - stat.totalWorkDays;
      
      // Calculate score: 
      // (onTime * 1.0) + (late * 0.5) + (veryLate * 0.25) - (absent * 1.0)
      stat.score = 
        (stat.onTime * 1.0) + 
        (stat.late * 0.5) + 
        (stat.veryLate * 0.25) - 
        (stat.absent * 1.0);
    });
    
    // Convert to array and sort by score (highest first)
    const result = Object.values(employeeStats)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Get top 10
    
    console.log(`Calculated top ${result.length} employees`);
    return result;
  } catch (error) {
    console.error("Error getting top employees:", error);
    throw new Error(`Failed to calculate top employees: ${error.message}`);
  }
};

// Helper function to count working days in a month (excluding weekends)
function countWorkDays(year, month) {
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
}