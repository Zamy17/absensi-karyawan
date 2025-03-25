// src/components/admin/AttendanceReport.jsx
import React, { useState, useEffect } from 'react';
import { 
  getAttendanceByDate, 
  getAttendanceByDateRange, 
  getAttendanceByEmployee,
  getEmployees 
} from '../../firebase/firestore';
import { 
  getCurrentDate, 
  getFirstDayOfMonth, 
  getLastDayOfMonth,
  isWorkday
} from '../../utils/dateUtils';
import { exportAttendanceToExcel } from '../../utils/excelExport';
import { prepareAttendanceData } from '../../utils/attendanceHelpers';
import Layout from '../layout/Layout';
import Button from '../shared/Button';
import DataTable from '../shared/DataTable';

const AttendanceReport = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getLastDayOfMonth());
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  
  // Fetch employees data
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await getEmployees();
        setEmployees(data);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    
    fetchEmployees();
  }, []);
  
  // Fetch attendance data based on filters
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        
        let attendanceData = [];
        
        if (selectedEmployee === 'all') {
          // Get attendance for all employees
          if (startDate === endDate) {
            // Single day
            const data = await getAttendanceByDate(startDate);
            
            // Prepare complete data with absent employees
            if (isWorkday(new Date(startDate))) {
              attendanceData = await prepareAttendanceData(data, startDate);
            } else {
              attendanceData = data;
            }
          } else {
            // Date range
            attendanceData = await getAttendanceByDateRange(startDate, endDate);
          }
        } else {
          // Get attendance for specific employee
          attendanceData = await getAttendanceByEmployee(selectedEmployee, startDate, endDate);
        }
        
        setAttendanceData(attendanceData);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttendanceData();
  }, [startDate, endDate, selectedEmployee]);
  
  // Handle export to Excel
  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Create filename
      let filename = 'attendance-report';
      if (selectedEmployee !== 'all') {
        const employee = employees.find(emp => emp.id === selectedEmployee);
        if (employee) {
          filename += `-${employee.name}`;
        }
      }
      
      if (startDate === endDate) {
        filename += `-${startDate}`;
      } else {
        filename += `-${startDate}-to-${endDate}`;
      }
      
      await exportAttendanceToExcel(attendanceData, filename);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Table columns
  const columns = [
    {
      key: 'date',
      title: 'Tanggal'
    },
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
      render: (row) => row.checkInTime || '-'
    },
    {
      key: 'checkInGuardName',
      title: 'Satpam Konfirmasi Masuk',
      render: (row) => row.checkInGuardName || '-'
    },
    {
      key: 'checkOutTime',
      title: 'Jam Pulang',
      render: (row) => row.checkOutTime || '-'
    },
    {
      key: 'checkOutGuardName',
      title: 'Satpam Konfirmasi Pulang',
      render: (row) => row.checkOutGuardName || '-'
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
    <div className="flex flex-col md:flex-row gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
            Tanggal Awal
          </label>
          <input
            type="date"
            id="start-date"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (new Date(e.target.value) > new Date(endDate)) {
                setEndDate(e.target.value);
              }
            }}
          />
        </div>
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
            Tanggal Akhir
          </label>
          <input
            type="date"
            id="end-date"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-grow">
        <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-1">
          Karyawan
        </label>
        <select
          id="employee"
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
        >
          <option value="all">Semua Karyawan</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex items-end">
        <Button
          onClick={handleExport}
          disabled={isExporting || attendanceData.length === 0}
          className="whitespace-nowrap"
        >
          {isExporting ? 'Mengekspor...' : 'Export ke Excel'}
        </Button>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Laporan Absensi
          </h1>
          <p className="mt-1 text-gray-500">
            Lihat dan ekspor data absensi karyawan
          </p>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <DataTable
            columns={columns}
            data={attendanceData}
            loading={loading}
            actions={tableActions}
            pagination={true}
            itemsPerPage={10}
            emptyMessage="Tidak ada data absensi untuk kriteria yang dipilih"
          />
        </div>
      </div>
    </Layout>
  );
};

export default AttendanceReport;