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
    serverTimestamp 
  } from "firebase/firestore";
  import { db } from "./config";
  
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
      // Get the employee data
      const employee = await getEmployeeById(employeeId);
      
      // Get the guard data
      const guardRef = doc(db, "users", guardId);
      const guardSnap = await getDoc(guardRef);
      const guard = { id: guardSnap.id, ...guardSnap.data() };
      
      // Get the current date
      const now = new Date();
      const checkInTime = now.toTimeString().split(' ')[0];
      
      // Format date as YYYY-MM-DD
      const dateFormatted = now.toISOString().split('T')[0];
      
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
      
      if (!querySnapshot.empty) {
        // Attendance record already exists
        const existingDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "attendance", existingDoc.id), {
          checkInTime,
          checkInGuardId: guardId,
          checkInGuardName: guard.name,
          status,
          updatedAt: serverTimestamp()
        });
        
        return {
          id: existingDoc.id,
          employeeId,
          employeeName: employee.name,
          position: employee.position,
          date: dateFormatted,
          checkInTime,
          checkInGuardId: guardId,
          checkInGuardName: guard.name,
          status
        };
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
        return { id: docRef.id, ...attendanceData };
      }
    } catch (error) {
      console.error("Error recording check-in:", error);
      throw new Error(error.message);
    }
  };
  
  export const recordCheckOut = async (employeeId, guardId) => {
    try {
      // Get the guard data
      const guardRef = doc(db, "users", guardId);
      const guardSnap = await getDoc(guardRef);
      const guard = { id: guardSnap.id, ...guardSnap.data() };
      
      // Get the current date
      const now = new Date();
      const checkOutTime = now.toTimeString().split(' ')[0];
      
      // Format date as YYYY-MM-DD
      const dateFormatted = now.toISOString().split('T')[0];
      
      // Check if attendance record already exists for this employee on this date
      const q = query(
        collection(db, "attendance"),
        where("employeeId", "==", employeeId),
        where("date", "==", dateFormatted)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Attendance record exists, update with check-out info
        const existingDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "attendance", existingDoc.id), {
          checkOutTime,
          checkOutGuardId: guardId,
          checkOutGuardName: guard.name,
          updatedAt: serverTimestamp()
        });
        
        const updatedData = {
          ...existingDoc.data(),
          checkOutTime,
          checkOutGuardId: guardId,
          checkOutGuardName: guard.name
        };
        
        return { id: existingDoc.id, ...updatedData };
      } else {
        throw new Error("No check-in record found for today");
      }
    } catch (error) {
      console.error("Error recording check-out:", error);
      throw new Error(error.message);
    }
  };
  
  export const getAttendanceByDate = async (date) => {
    try {
      const q = query(
        collection(db, "attendance"),
        where("date", "==", date),
        orderBy("employeeName")
      );
      const querySnapshot = await getDocs(q);
      const attendance = [];
      querySnapshot.forEach((doc) => {
        attendance.push({ id: doc.id, ...doc.data() });
      });
      return attendance;
    } catch (error) {
      console.error("Error getting attendance:", error);
      throw new Error(error.message);
    }
  };
  
  export const getAttendanceByDateRange = async (startDate, endDate) => {
    try {
      const q = query(
        collection(db, "attendance"),
        where("date", ">=", startDate),
        where("date", "<=", endDate),
        orderBy("date"),
        orderBy("employeeName")
      );
      const querySnapshot = await getDocs(q);
      const attendance = [];
      querySnapshot.forEach((doc) => {
        attendance.push({ id: doc.id, ...doc.data() });
      });
      return attendance;
    } catch (error) {
      console.error("Error getting attendance:", error);
      throw new Error(error.message);
    }
  };
  
  export const getAttendanceByEmployee = async (employeeId, startDate, endDate) => {
    try {
      const q = query(
        collection(db, "attendance"),
        where("employeeId", "==", employeeId),
        where("date", ">=", startDate),
        where("date", "<=", endDate),
        orderBy("date")
      );
      const querySnapshot = await getDocs(q);
      const attendance = [];
      querySnapshot.forEach((doc) => {
        attendance.push({ id: doc.id, ...doc.data() });
      });
      return attendance;
    } catch (error) {
      console.error("Error getting attendance:", error);
      throw new Error(error.message);
    }
  };
  
  export const getAttendanceByGuard = async (guardId, date) => {
    try {
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
      
      return attendance;
    } catch (error) {
      console.error("Error getting attendance by guard:", error);
      throw new Error(error.message);
    }
  };
  
  // Get top employees for a specific month
  export const getTopEmployees = async (year, month) => {
    try {
      // Create date range for the specified month
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
      
      // Get all attendance records for the month
      const allAttendance = await getAttendanceByDateRange(startDate, endDate);
      
      // Get all employees
      const employees = await getEmployees();
      
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
      
      return result;
    } catch (error) {
      console.error("Error getting top employees:", error);
      throw new Error(error.message);
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