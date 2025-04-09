// src/components/guard/mobile/MobileDailyReportScreen.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getAttendanceByGuard } from '../../../firebase/firestore';
import { getCurrentDate } from '../../../utils/dateUtils';

// Mobile optimized component for daily report
const MobileDailyReportScreen = () => {
  const { currentUser } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [stats, setStats] = useState({
    total: 0,
    checkIn: 0,
    checkOut: 0
  });
  
  // Fetch attendance data based on selected date
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        
        const data = await getAttendanceByGuard(currentUser.uid, selectedDate);
        setAttendanceData(data);
        
        // Calculate statistics
        const statsData = {
          total: data.length,
          checkIn: data.filter(record => record.checkInGuardId === currentUser.uid).length,
          checkOut: data.filter(record => record.checkOutGuardId === currentUser.uid).length
        };
        
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttendanceData();
  }, [currentUser, selectedDate]);

  return (
    <div className="pb-20">
      {/* Mobile header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 mb-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold">Laporan Harian</h1>
        <p className="text-sm opacity-80">
          Laporan absensi yang Anda konfirmasi
        </p>
      </div>
      
      {/* Date picker */}
      <div className="px-4 mb-4">
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
          Pilih Tanggal
        </label>
        <input
          type="date"
          id="date"
          className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-2 px-4 mb-4">
        <div className="bg-white rounded-lg shadow p-3 text-center">
          <div className="text-sm font-medium text-gray-500">Total</div>
          <div className="mt-1 text-2xl font-semibold">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-3 text-center">
          <div className="text-sm font-medium text-gray-500">Masuk</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">{stats.checkIn}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-3 text-center">
          <div className="text-sm font-medium text-gray-500">Pulang</div>
          <div className="mt-1 text-2xl font-semibold text-purple-600">{stats.checkOut}</div>
        </div>
      </div>
      
      {/* Attendance list */}
      <div className="px-4">
        {loading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div>
            {attendanceData.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
                Tidak ada data absensi yang Anda konfirmasi pada tanggal tersebut
              </div>
            ) : (
              <div className="space-y-3">
                {attendanceData.map((record) => {
                  // Determine if this guard confirmed check-in, check-out, or both
                  const confirmedCheckIn = record.checkInGuardId === currentUser.uid;
                  const confirmedCheckOut = record.checkOutGuardId === currentUser.uid;
                  
                  if (!confirmedCheckIn && !confirmedCheckOut) return null;
                  
                  return (
                    <div key={record.id} className="bg-white rounded-lg shadow overflow-hidden">
                      {/* Employee info */}
                      <div className="p-4 border-b">
                        <h3 className="font-medium text-gray-900">{record.employeeName}</h3>
                        <p className="text-sm text-gray-500">{record.position}</p>
                      </div>
                      
                      {/* Attendance details */}
                      <div className="px-4 py-3">
                        {confirmedCheckIn && (
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-500">Jam Masuk:</span>
                            <div className="flex items-center">
                              <span className="text-sm mr-2">{record.checkInTime}</span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Anda
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {confirmedCheckOut && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-500">Jam Pulang:</span>
                            <div className="flex items-center">
                              <span className="text-sm mr-2">{record.checkOutTime}</span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Anda
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Status */}
                      <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500">Status:</span>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === "Tepat Waktu" ? "bg-green-100 text-green-800" : 
                          record.status === "Terlambat" ? "bg-yellow-100 text-yellow-800" : 
                          record.status === "Sangat Terlambat" ? "bg-red-100 text-red-800" : 
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {record.status || "Tidak Hadir"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileDailyReportScreen;