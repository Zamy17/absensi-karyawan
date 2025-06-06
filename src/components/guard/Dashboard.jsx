// src/components/guard/Dashboard.jsx (Optimized for mobile)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAttendanceByGuard } from '../../firebase/firestore';
import { getCurrentDate, isWithinCheckInHours, isWithinCheckOutHours } from '../../utils/dateUtils';
import Layout from '../layout/Layout';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    total: 0,
    checkIn: 0,
    checkOut: 0
  });
  
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
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get today's date
        const today = getCurrentDate();
        
        // Get attendance records confirmed by this guard today
        const attendance = await getAttendanceByGuard(currentUser.uid, today);
        setTodayAttendance(attendance);
        
        // Count statistics
        const stats = {
          total: attendance.length,
          checkIn: attendance.filter(record => record.checkInGuardId === currentUser.uid).length,
          checkOut: attendance.filter(record => record.checkOutGuardId === currentUser.uid).length
        };
        
        setAttendanceStats(stats);
      } catch (error) {
        console.error("Error fetching guard dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);

  // Stats card component
  const StatsCard = ({ title, value, color }) => (
    <div className={`bg-white border-l-4 ${color} rounded-md shadow-md p-4`}>
      <div className="text-sm font-medium text-gray-500">{title}</div>
      <div className="mt-1 text-3xl font-semibold">{value}</div>
    </div>
  );
  
  // Mobile optimized stats cards
  const renderMobileStatsCards = () => (
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-white rounded-lg shadow p-3">
        <div className="text-xs font-medium text-gray-500">Total</div>
        <div className="mt-1 text-2xl font-semibold text-blue-600">{attendanceStats.total}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-3">
        <div className="text-xs font-medium text-gray-500">Masuk</div>
        <div className="mt-1 text-2xl font-semibold text-green-600">{attendanceStats.checkIn}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-3">
        <div className="text-xs font-medium text-gray-500">Pulang</div>
        <div className="mt-1 text-2xl font-semibold text-purple-600">{attendanceStats.checkOut}</div>
      </div>
    </div>
  );
  
  // Mobile optimized activity list
  const renderMobileActivityList = () => {
    // Create separate items for check-in and check-out
    const activityItems = [];
    
    todayAttendance.forEach((record) => {
      // Determine if this guard confirmed check-in, check-out, or both
      const confirmedCheckIn = record.checkInGuardId === currentUser.uid;
      const confirmedCheckOut = record.checkOutGuardId === currentUser.uid;
      
      if (confirmedCheckIn) {
        activityItems.push({
          id: `${record.id}-in`,
          employeeName: record.employeeName,
          position: record.position,
          time: record.checkInTime,
          type: 'Absen Masuk',
          status: record.status
        });
      }
      
      if (confirmedCheckOut) {
        activityItems.push({
          id: `${record.id}-out`,
          employeeName: record.employeeName,
          position: record.position,
          time: record.checkOutTime,
          type: 'Absen Pulang',
          status: 'Selesai'
        });
      }
    });
    
    // Sort by time (most recent first)
    activityItems.sort((a, b) => {
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      
      // Compare hours
      if (timeA[0] !== timeB[0]) return timeB[0] - timeA[0];
      // Compare minutes
      if (timeA[1] !== timeB[1]) return timeB[1] - timeA[1];
      // Compare seconds
      return timeB[2] - timeA[2];
    });
    
    if (activityItems.length === 0) {
      return (
        <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
          Belum ada aktivitas absensi hari ini
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {activityItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-3 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{item.employeeName}</h3>
                  <p className="text-xs text-gray-500">{item.position}</p>
                </div>
                <div className="text-right">
                  <p className="text-blue-600 font-medium">{item.time}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    item.type === 'Absen Masuk' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {item.type}
                  </span>
                </div>
              </div>
            </div>
            <div className="px-3 py-2 bg-gray-50 flex justify-between items-center">
              <span className="text-xs text-gray-500">Status:</span>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                item.status === "Tepat Waktu" ? "bg-green-100 text-green-800" : 
                item.status === "Terlambat" ? "bg-yellow-100 text-yellow-800" : 
                item.status === "Sangat Terlambat" ? "bg-red-100 text-red-800" : 
                item.status === "Selesai" ? "bg-blue-100 text-blue-800" :
                "bg-gray-100 text-gray-800"
              }`}>
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <Layout>
      <div className={`space-y-4 ${isMobile ? 'pb-safe' : ''}`}>
        {!isMobile && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard Satpam
            </h1>
            <p className="mt-1 text-gray-500">
              Ringkasan aktivitas absensi hari ini
            </p>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Stats cards */}
            {isMobile ? renderMobileStatsCards() : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard
                  title="Total Konfirmasi Hari Ini"
                  value={attendanceStats.total}
                  color="border-blue-500"
                />
                <StatsCard
                  title="Konfirmasi Masuk"
                  value={attendanceStats.checkIn}
                  color="border-green-500"
                />
                <StatsCard
                  title="Konfirmasi Pulang"
                  value={attendanceStats.checkOut}
                  color="border-purple-500"
                />
              </div>
            )}
            
            {/* Current shift status */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-base font-medium mb-3">Status Shift Saat Ini</h2>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Tanggal</span>
                  <span>{getCurrentDate()}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Status Hari</span>
                  <span>Hari Aktif</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Konfirmasi Masuk</span>
                  <span 
                    className={
                      isWithinCheckInHours() 
                        ? "text-green-500 font-medium" 
                        : "text-red-500 font-medium"
                    }
                  >
                    {isWithinCheckInHours() ? "Aktif (05:00 - 11:00)" : "Tidak Aktif"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Konfirmasi Pulang</span>
                  <span 
                    className={
                      isWithinCheckOutHours() 
                        ? "text-green-500 font-medium" 
                        : "text-red-500 font-medium"
                    }
                  >
                    {isWithinCheckOutHours() ? "Aktif (17:00 - 23:00)" : "Tidak Aktif"}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Recent activity */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="text-base font-medium text-gray-900">
                  Aktivitas Terbaru
                </h2>
              </div>
              
              {isMobile ? (
                <div className="p-4">
                  {renderMobileActivityList()}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Waktu
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nama Karyawan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jabatan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jenis Absensi
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
                            Belum ada aktivitas absensi hari ini
                          </td>
                        </tr>
                      ) : (
                        todayAttendance.map((record) => {
                          // Determine if this guard confirmed check-in, check-out, or both
                          const confirmedCheckIn = record.checkInGuardId === currentUser.uid;
                          const confirmedCheckOut = record.checkOutGuardId === currentUser.uid;
                          
                          // Create separate rows for check-in and check-out
                          const rows = [];
                          
                          if (confirmedCheckIn) {
                            rows.push(
                              <tr key={`${record.id}-in`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {record.checkInTime}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {record.employeeName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {record.position}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    Absen Masuk
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                      ${record.status === "Tepat Waktu" ? "bg-green-100 text-green-800" : 
                                      record.status === "Terlambat" ? "bg-yellow-100 text-yellow-800" : 
                                      "bg-red-100 text-red-800"}`}
                                  >
                                    {record.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          }
                          
                          if (confirmedCheckOut) {
                            rows.push(
                              <tr key={`${record.id}-out`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {record.checkOutTime}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {record.employeeName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {record.position}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                    Absen Pulang
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                    Selesai
                                  </span>
                                </td>
                              </tr>
                            );
                          }
                          
                          return rows;
                        }).flat()
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;