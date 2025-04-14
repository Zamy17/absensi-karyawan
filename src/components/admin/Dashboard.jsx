// src/components/admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getCurrentDate, getCurrentTime } from '../../utils/dateUtils';
import Layout from '../layout/Layout';

const Dashboard = () => {
  // State untuk menyimpan data
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [processedRecords, setProcessedRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [stats, setStats] = useState({
    total: 0,
    onTime: 0,
    late: 0,
    veryLate: 0,
    absent: 0
  });
  
  // Mengambil data saat komponen dimuat atau tanggal berubah
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Ambil semua data karyawan
        const employeesCollection = collection(db, "employees");
        const employeesSnapshot = await getDocs(employeesCollection);
        const employeesList = [];
        
        employeesSnapshot.forEach((doc) => {
          employeesList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setEmployees(employeesList);
        
        // 2. Ambil data absensi untuk tanggal yang dipilih
        const attendanceQuery = query(
          collection(db, "attendance"),
          where("date", "==", selectedDate)
        );
        
        const attendanceSnapshot = await getDocs(attendanceQuery);
        const attendanceList = [];
        
        attendanceSnapshot.forEach((doc) => {
          attendanceList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setAttendanceRecords(attendanceList);
        
        // 3. Proses data untuk menambahkan karyawan yang tidak hadir
        processAttendanceData(employeesList, attendanceList, selectedDate);
        
      } catch (error) {
        console.error("Error saat mengambil data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedDate]);
  
  // Proses data absensi untuk menyertakan karyawan yang tidak hadir
  const processAttendanceData = (employeesList, attendanceList, date) => {
    // Buat map dari data absensi yang sudah ada berdasarkan ID karyawan
    const attendanceMap = {};
    
    attendanceList.forEach(record => {
      if (record.employeeId) {
        attendanceMap[record.employeeId] = record;
      }
    });
    
    // Buat daftar absensi lengkap dengan karyawan yang tidak hadir
    const completeAttendance = [];
    
    // Penghitung untuk statistik
    let onTimeCount = 0;
    let lateCount = 0;
    let veryLateCount = 0;
    let absentCount = 0;
    
    // Proses setiap karyawan
    employeesList.forEach(employee => {
      if (attendanceMap[employee.id]) {
        // Karyawan memiliki data absensi untuk hari ini
        const record = attendanceMap[employee.id];
        
        // Hitung berdasarkan status
        if (record.status === "Tepat Waktu") onTimeCount++;
        else if (record.status === "Terlambat") lateCount++;
        else if (record.status === "Sangat Terlambat") veryLateCount++;
        
        completeAttendance.push(record);
      } else {
        // Karyawan tidak memiliki data absensi - tandai sebagai tidak hadir
        absentCount++;
        
        const absentRecord = {
          employeeId: employee.id,
          employeeName: employee.name || "Tidak Diketahui",
          position: employee.position || "Tidak Diketahui",
          date: date,
          status: "Tidak Hadir"
        };
        
        completeAttendance.push(absentRecord);
      }
    });
    
    // Perbarui state dengan data yang sudah diproses dan statistik
    setProcessedRecords(completeAttendance);
    
    setStats({
      total: completeAttendance.length,
      onTime: onTimeCount,
      late: lateCount,
      veryLate: veryLateCount,
      absent: absentCount
    });
  };
  
  // Komponen kartu statistik
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
            Dashboard Admin
          </h1>
          <p className="mt-1 text-gray-500">
            Ringkasan informasi absensi
          </p>
        </div>
        
        {/* Tambahkan input tanggal */}
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal
            </label>
            <input
              type="date"
              id="date"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="flex items-end text-sm text-gray-500">
            {selectedDate} - {getCurrentTime()}
          </div>
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
                value={employees.length}
                color="border-blue-500"
              />
              <StatsCard
                title="Tepat Waktu"
                value={stats.onTime}
                color="border-green-500"
              />
              <StatsCard
                title="Terlambat"
                value={stats.late}
                color="border-yellow-500"
              />
              <StatsCard
                title="Sangat Terlambat"
                value={stats.veryLate}
                color="border-orange-500"
              />
              <StatsCard
                title="Tidak Hadir"
                value={stats.absent}
                color="border-red-500"
              />
            </div>
            
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Absensi Tanggal: {selectedDate}
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
                    {processedRecords.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                          Belum ada data absensi untuk tanggal {selectedDate}
                        </td>
                      </tr>
                    ) : (
                      processedRecords.map((record, index) => (
                        <tr key={record.id || index}>
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
