// src/components/admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { getAttendanceByDate, getEmployees } from '../../firebase/firestore';
import { getCurrentDate, isWorkday } from '../../utils/dateUtils';
import { countAttendanceStats } from '../../utils/attendanceHelpers';
import Layout from '../layout/Layout';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    total: 0,
    onTime: 0,
    late: 0,
    veryLate: 0,
    absent: 0
  });
  const [totalEmployees, setTotalEmployees] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get today's date
        const today = getCurrentDate();
        
        // Get all employees
        const employees = await getEmployees();
        setTotalEmployees(employees.length);
        
        // Get today's attendance
        const attendance = await getAttendanceByDate(today);
        setTodayAttendance(attendance);
        
        // Count statistics
        if (isWorkday()) {
          // Create complete attendance list with absent employees
          const completeAttendance = [];
          
          employees.forEach(employee => {
            const employeeAttendance = attendance.find(
              record => record.employeeId === employee.id
            );
            
            if (employeeAttendance) {
              completeAttendance.push(employeeAttendance);
            } else {
              completeAttendance.push({
                employeeId: employee.id,
                employeeName: employee.name,
                position: employee.position,
                date: today,
                status: "Tidak Hadir"
              });
            }
          });
          
          const stats = countAttendanceStats(completeAttendance);
          setAttendanceStats(stats);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Stats card component
  const StatsCard = ({ title, value, color }) => (
    <div className={`bg-white border-l-4 ${color} rounded-md shadow-md p-4`}>
      <div className="text-sm font-medium text-gray-500">{title}</div>
      <div className="mt-1 text-3xl font-semibold">{value}</div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-gray-500">
            Overview of today's attendance information
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatsCard
                title="Total Karyawan"
                value={totalEmployees}
                color="border-blue-500"
              />
              <StatsCard
                title="Tepat Waktu"
                value={attendanceStats.onTime}
                color="border-green-500"
              />
              <StatsCard
                title="Terlambat"
                value={attendanceStats.late}
                color="border-yellow-500"
              />
              <StatsCard
                title="Sangat Terlambat"
                value={attendanceStats.veryLate}
                color="border-orange-500"
              />
              <StatsCard
                title="Tidak Hadir"
                value={attendanceStats.absent}
                color="border-red-500"
              />
            </div>
            
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Absensi Hari Ini ({getCurrentDate()})
                </h2>
              </div>
              
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
                        Jam Masuk
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jam Pulang
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {todayAttendance.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                          {isWorkday() 
                            ? "Belum ada data absensi hari ini" 
                            : "Hari ini adalah hari libur/akhir pekan, tidak ada absensi"}
                        </td>
                      </tr>
                    ) : (
                      todayAttendance.map((record) => (
                        <tr key={record.id || record.employeeId}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {record.employeeName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {record.position}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {record.checkInTime || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {record.checkOutTime || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${record.status === "Tepat Waktu" ? "bg-green-100 text-green-800" : 
                                record.status === "Terlambat" ? "bg-yellow-100 text-yellow-800" : 
                                record.status === "Sangat Terlambat" ? "bg-red-100 text-red-800" : 
                                "bg-gray-100 text-gray-800"}`}
                            >
                              {record.status || "Tidak Hadir"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;