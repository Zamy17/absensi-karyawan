// src/components/guard/DailyReport.jsx
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
  
  // Fetch attendance data based on selected date
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        
        const data = await getAttendanceByGuard(currentUser.uid, selectedDate);
        setAttendanceData(data);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttendanceData();
  }, [currentUser, selectedDate]);
  
  // Table columns
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
  
  // Table actions
  const tableActions = (
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
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Laporan Harian
          </h1>
          <p className="mt-1 text-gray-500">
            Laporan absensi yang Anda konfirmasi
          </p>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <DataTable
            columns={columns}
            data={attendanceData}
            loading={loading}
            actions={tableActions}
            pagination={false}
            emptyMessage="Tidak ada data absensi yang Anda konfirmasi pada tanggal tersebut"
          />
        </div>
      </div>
    </Layout>
  );
};

export default DailyReport;