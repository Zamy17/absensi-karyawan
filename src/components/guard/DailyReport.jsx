// src/components/guard/DailyReport.jsx (Optimized for mobile)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAttendanceByGuard } from '../../firebase/firestore';
import { getCurrentDate } from '../../utils/dateUtils';
import Layout from '../layout/Layout';
import DataTable from '../shared/DataTable';

const DailyReport = () => {
  const { currentUser } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [stats, setStats] = useState({
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
  
  // Table columns for desktop
  const columns = [
    {
      key: 'employeeName',
      title: 'Nama Karyawan'
    },
    {
      key: 'position',
      title: 'Jabatan'
    },
    {
      key: 'checkInTime',
      title: 'Jam Masuk',
      render: (row) => row.checkInGuardId === currentUser.uid ? row.checkInTime : '-'
    },
    {
      key: 'checkOutTime',
      title: 'Jam Pulang',
      render: (row) => row.checkOutGuardId === currentUser.uid ? row.checkOutTime : '-'
    },
    {
      key: 'status',
      title: 'Status',
      render: (row) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
            ${row.status === "Tepat Waktu" ? "bg-green-100 text-green-800" : 
            row.status === "Terlambat" ? "bg-yellow-100 text-yellow-800" : 
            row.status === "Sangat Terlambat" ? "bg-red-100 text-red-800" : 
            "bg-gray-100 text-gray-800"}`}
        >
          {row.status || "Tidak Hadir"}
        </span>
      )
    }
  ];
  
  // Mobile stats cards
  const renderMobileStatsCards = () => (
    <div className="grid grid-cols-3 gap-2 my-4">
      <div className="bg-white rounded-lg shadow p-3 text-center">
        <div className="text-xs font-medium text-gray-500">Total</div>
        <div className="text-xl font-semibold">{stats.total}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-3 text-center">
        <div className="text-xs font-medium text-gray-500">Masuk</div>
        <div className="text-xl font-semibold text-green-600">{stats.checkIn}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-3 text-center">
        <div className="text-xs font-medium text-gray-500">Pulang</div>
        <div className="text-xl font-semibold text-purple-600">{stats.checkOut}</div>
      </div>
    </div>
  );
  
  // Mobile attendance list
  const renderMobileAttendanceList = () => {
    if (attendanceData.length === 0) {
      return (
        <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
          Tidak ada data absensi yang Anda konfirmasi pada tanggal tersebut
        </div>
      );
    }
    
    return (
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
                <h3 className="font-medium">{record.employeeName}</h3>
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
    );
  };
  
  // Table actions
  const tableActions = (
    <div className={isMobile ? "" : "flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4"}>
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
    </div>
  );

  return (
    <Layout>
      <div className={`space-y-4 ${isMobile ? 'pb-safe' : ''}`}>
        {!isMobile && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Laporan Harian
            </h1>
            <p className="mt-1 text-gray-500">
              Laporan absensi yang Anda konfirmasi
            </p>
          </div>
        )}
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            {tableActions}
          </div>
          
          {isMobile && (
            <>
              {renderMobileStatsCards()}
              <div className="p-4">
                {loading ? (
                  <div className="flex justify-center my-6">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  renderMobileAttendanceList()
                )}
              </div>
            </>
          )}
          
          {!isMobile && (
            <DataTable
              columns={columns}
              data={attendanceData}
              loading={loading}
              pagination={false}
              emptyMessage="Tidak ada data absensi yang Anda konfirmasi pada tanggal tersebut"
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DailyReport;