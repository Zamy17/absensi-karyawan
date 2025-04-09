// src/components/admin/AttendanceReport.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { exportAttendanceToExcel } from '../../utils/excelExport';
import Layout from '../layout/Layout';
import Button from '../shared/Button';
import DataTable from '../shared/DataTable';

const AttendanceReport = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2025-12-31');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [noDataMessage, setNoDataMessage] = useState("Tidak ada data absensi untuk kriteria yang dipilih");
  const [activeColumns, setActiveColumns] = useState([
    'date', 
    'employeeName', 
    'checkInTime',
    'checkInGuardName',
    'status'
  ]);

  // Fetch initial data when component mounts
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch employees first
        const employeesSnapshot = await getDocs(collection(db, "employees"));
        const employeesList = [];
        employeesSnapshot.forEach((doc) => {
          employeesList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setEmployees(employeesList);
        
        // Then fetch attendance data
        const attendanceSnapshot = await getDocs(collection(db, "attendance"));
        
        if (attendanceSnapshot.empty) {
          setAttendanceData([]);
          setFilteredData([]);
          setNoDataMessage("Belum ada data absensi dalam sistem");
          return;
        }
        
        const allAttendance = [];
        attendanceSnapshot.forEach((doc) => {
          allAttendance.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setAttendanceData(allAttendance);
        setFilteredData(allAttendance);
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setNoDataMessage("Terjadi kesalahan saat mengambil data");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);
  
  // Apply filters (date range and employee)
  const applyFilters = async () => {
    try {
      setLoading(true);
      console.log("Applying filters:", { startDate, endDate, selectedEmployee });
      setSearchTerm(''); // Reset search term when applying filters
      
      // Get attendance data filtered by date
      const attendanceRef = collection(db, "attendance");
      let snapshot;
      
      if (startDate === endDate) {
        // If start and end dates are the same, use exact date filter
        const q = query(
          attendanceRef,
          where("date", "==", startDate)
        );
        snapshot = await getDocs(q);
      } else {
        // If date range, use range filter
        const q = query(
          attendanceRef,
          where("date", ">=", startDate),
          where("date", "<=", endDate),
          orderBy("date")
        );
        snapshot = await getDocs(q);
      }
      
      // Convert query results to array
      let tempFilteredData = [];
      snapshot.forEach((doc) => {
        tempFilteredData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Further filter by employee if selected
      if (selectedEmployee !== 'all') {
        // First try by ID
        let employeeData = tempFilteredData.filter(item => item.employeeId === selectedEmployee);
        
        // If not found by ID, try by name
        if (employeeData.length === 0) {
          // Find the employee object first to get the correct name case
          const selectedEmployeeObj = employees.find(emp => 
            emp.id === selectedEmployee || emp.name.toLowerCase() === selectedEmployee.toLowerCase()
          );
          
          if (selectedEmployeeObj) {
            employeeData = tempFilteredData.filter(item => 
              item.employeeName && 
              item.employeeName.toLowerCase() === selectedEmployeeObj.name.toLowerCase()
            );
          }
        }
        
        tempFilteredData = employeeData;
      }
      
      // Update message based on filter results
      if (tempFilteredData.length === 0) {
        if (selectedEmployee !== 'all') {
          const employeeName = employees.find(emp => emp.id === selectedEmployee)?.name || selectedEmployee;
          setNoDataMessage(`Belum ada data absensi untuk karyawan "${employeeName}" pada periode yang dipilih`);
        } else {
          setNoDataMessage(`Tidak ada data absensi untuk periode ${startDate} hingga ${endDate}`);
        }
      } else {
        setNoDataMessage("Tidak ada data absensi untuk kriteria yang dipilih");
      }
      
      setAttendanceData(tempFilteredData);
      setFilteredData(tempFilteredData);
    } catch (err) {
      console.error("Error applying filters:", err);
      setNoDataMessage("Terjadi kesalahan saat memfilter data");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle search by employee name
  const handleSearch = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setSearchTerm(searchValue);
    
    if (searchValue.trim() === '') {
      // If search is cleared, show all data (based on current filters)
      setFilteredData(attendanceData);
      return;
    }
    
    // Filter by employee name
    const filtered = attendanceData.filter(
      item => item.employeeName && item.employeeName.toLowerCase().includes(searchValue)
    );
    
    setFilteredData(filtered);
    
    // Update message if no results found
    if (filtered.length === 0) {
      setNoDataMessage(`Tidak ditemukan karyawan dengan nama "${searchValue}"`);
    } else {
      setNoDataMessage("Tidak ada data absensi untuk kriteria yang dipilih");
    }
  };
  
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
        } else {
          filename += `-${selectedEmployee}`;
        }
      }
      
      if (startDate === endDate) {
        filename += `-${startDate}`;
      } else {
        filename += `-${startDate}-to-${endDate}`;
      }
      
      if (searchTerm) {
        filename += `-search-${searchTerm}`;
      }
      
      // Export the filtered data
      await exportAttendanceToExcel(filteredData, filename);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Toggle column visibility
  const toggleColumn = (key) => {
    setActiveColumns(prev => {
      if (prev.includes(key)) {
        return prev.filter(col => col !== key);
      } else {
        return [...prev, key];
      }
    });
  };
  
  // All available columns
  const allColumns = [
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

  // Active columns based on selection
  const columns = allColumns.filter(col => activeColumns.includes(col.key));

  return (
    <Layout>
      <div className="space-y-6 max-w-full overflow-hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Laporan Absensi
          </h1>
          <p className="mt-1 text-gray-500">
            Lihat dan ekspor data absensi karyawan
          </p>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            {/* Filter section - responsively designed */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Date filters - take 6 columns on large screens */}
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              
              {/* Employee dropdown - takes 3 columns on large screens */}
              <div className="lg:col-span-3">
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
              
              {/* Buttons - takes 3 columns on large screens */}
              <div className="lg:col-span-3 flex items-end space-x-2">
                <Button
                  onClick={applyFilters}
                  className="whitespace-nowrap flex-grow"
                >
                  Terapkan Filter
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={isExporting || filteredData.length === 0}
                  className="whitespace-nowrap flex-grow"
                  variant="success"
                >
                  {isExporting ? 'Mengekspor...' : 'Export ke Excel'}
                </Button>
              </div>
            </div>
            
            {/* Search section - full width */}
            <div className="mt-4 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Cari berdasarkan nama karyawan..."
                value={searchTerm}
                onChange={handleSearch}
              />
              {searchTerm && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => {
                      setSearchTerm('');
                      setFilteredData(attendanceData);
                    }}
                  >
                    <span className="sr-only">Clear search</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l1.293 1.293a1 1 0 101.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Column visibility toggles */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700">Tampilkan kolom:</span>
              {allColumns.map(col => (
                <button
                  key={col.key}
                  onClick={() => toggleColumn(col.key)}
                  className={`px-2 py-1 text-xs rounded-full 
                    ${activeColumns.includes(col.key) 
                      ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                      : 'bg-gray-100 text-gray-600 border border-gray-200'}`}
                >
                  {col.title}
                  {activeColumns.includes(col.key) && (
                    <span className="ml-1">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Table with controlled width and optional horizontal scrolling */}
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={filteredData}
              loading={loading}
              pagination={true}
              itemsPerPage={10}
              emptyMessage={noDataMessage}
              className="w-full table-fixed"
              responsive={true}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AttendanceReport;