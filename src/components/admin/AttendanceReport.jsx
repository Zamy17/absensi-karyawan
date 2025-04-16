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
  // New state for monthly view
  const [viewMode, setViewMode] = useState('dateRange'); // 'dateRange' or 'monthly'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // Current month (1-12)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Current year

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
  
  // Get the first day of a month
  const getFirstDayOfMonth = (year, month) => {
    return `${year}-${month.toString().padStart(2, '0')}-01`;
  };
  
  // Get the last day of a month
  const getLastDayOfMonth = (year, month) => {
    // The trick: month is 1-based, but Date expects 0-based (January = 0)
    // When we pass month as-is to new Date(year, month, 0), it gives us the last day of the month
    const lastDay = new Date(year, month, 0).getDate();
    return `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
  };
  
  // Handle month changes
  const handleMonthChange = (e) => {
    const month = parseInt(e.target.value, 10);
    setSelectedMonth(month);
    
    // Update start and end dates when month changes (if in monthly view)
    if (viewMode === 'monthly') {
      setStartDate(getFirstDayOfMonth(selectedYear, month));
      setEndDate(getLastDayOfMonth(selectedYear, month));
    }
  };
  
  // Handle year changes
  const handleYearChange = (e) => {
    const year = parseInt(e.target.value, 10);
    setSelectedYear(year);
    
    // Update start and end dates when year changes (if in monthly view)
    if (viewMode === 'monthly') {
      setStartDate(getFirstDayOfMonth(year, selectedMonth));
      setEndDate(getLastDayOfMonth(year, selectedMonth));
    }
  };
  
  // Handle view mode changes
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    
    if (mode === 'monthly') {
      // If switching to monthly, update the date range to the selected month
      setStartDate(getFirstDayOfMonth(selectedYear, selectedMonth));
      setEndDate(getLastDayOfMonth(selectedYear, selectedMonth));
    }
    // When switching to date range, keep the current dates
  };
  
  // Apply filters (date range and employee)
  const applyFilters = async () => {
    try {
      setLoading(true);
      console.log("Applying filters:", { startDate, endDate, selectedEmployee, viewMode });
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
          if (viewMode === 'monthly') {
            const monthName = getMonthName(selectedMonth);
            setNoDataMessage(`Belum ada data absensi untuk karyawan "${employeeName}" pada bulan ${monthName} ${selectedYear}`);
          } else {
            setNoDataMessage(`Belum ada data absensi untuk karyawan "${employeeName}" pada periode yang dipilih`);
          }
        } else {
          if (viewMode === 'monthly') {
            const monthName = getMonthName(selectedMonth);
            setNoDataMessage(`Tidak ada data absensi untuk bulan ${monthName} ${selectedYear}`);
          } else {
            setNoDataMessage(`Tidak ada data absensi untuk periode ${startDate} hingga ${endDate}`);
          }
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
  
  // Get month name from month number (1-12)
  const getMonthName = (monthNumber) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[monthNumber - 1];
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
      
      if (viewMode === 'monthly') {
        const monthName = getMonthName(selectedMonth);
        filename += `-${monthName}-${selectedYear}`;
      } else if (startDate === endDate) {
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
  
  // Generate year options for dropdown (5 years back, 5 years forward)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
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
            {/* View Mode Toggle */}
            <div className="mb-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => handleViewModeChange('dateRange')}
                  className={`px-4 py-2 text-sm rounded-md ${
                    viewMode === 'dateRange' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  } transition-colors duration-200 ease-in-out hover:bg-opacity-90`}
                >
                  Rentang Tanggal
                </button>
                <button
                  onClick={() => handleViewModeChange('monthly')}
                  className={`px-4 py-2 text-sm rounded-md ${
                    viewMode === 'monthly' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  } transition-colors duration-200 ease-in-out hover:bg-opacity-90`}
                >
                  Bulanan
                </button>
              </div>
            </div>
            
            {/* Filter section - responsively designed */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Date filters - conditional based on view mode */}
              {viewMode === 'dateRange' ? (
                // Date Range View
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
              ) : (
                // Monthly View
                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Bulan
                    </label>
                    <select
                      id="month-select"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={selectedMonth}
                      onChange={handleMonthChange}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                        <option key={month} value={month}>
                          {getMonthName(month)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Tahun
                    </label>
                    <select
                      id="year-select"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={selectedYear}
                      onChange={handleYearChange}
                    >
                      {generateYearOptions().map(year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              
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
                  className={`px-2 py-1 text-xs rounded-full transition-all duration-200 
                    ${activeColumns.includes(col.key) 
                      ? 'bg-blue-100 text-blue-800 border border-blue-300 shadow-sm' 
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'}`}
                >
                  {col.title}
                  {activeColumns.includes(col.key) && (
                    <span className="ml-1">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Report Summary - IMPROVED DESIGN */}
          {viewMode === 'monthly' && filteredData.length > 0 && (
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {selectedEmployee === 'all' 
                  ? `Laporan Absensi Bulan ${getMonthName(selectedMonth)} ${selectedYear}` 
                  : `Laporan Absensi ${employees.find(emp => emp.id === selectedEmployee)?.name || ''} - ${getMonthName(selectedMonth)} ${selectedYear}`}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Total Kehadiran */}
                <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
                  <div className="flex items-center">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="p-4 flex-1">
                      <p className="text-sm font-medium text-gray-500">Total Kehadiran</p>
                      <p className="text-3xl font-bold text-gray-800">{filteredData.length}</p>
                    </div>
                  </div>
                </div>
                
                {/* Tepat Waktu */}
                <div className="bg-white rounded-xl shadow-sm border border-green-100 overflow-hidden transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
                  <div className="flex items-center">
                    <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="p-4 flex-1">
                      <p className="text-sm font-medium text-gray-500">Tepat Waktu</p>
                      <p className="text-3xl font-bold text-green-600">
                        {filteredData.filter(item => item.status === "Tepat Waktu").length}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Terlambat */}
                <div className="bg-white rounded-xl shadow-sm border border-yellow-100 overflow-hidden transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
                  <div className="flex items-center">
                    <div className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="p-4 flex-1">
                      <p className="text-sm font-medium text-gray-500">Terlambat</p>
                      <p className="text-3xl font-bold text-yellow-600">
                        {filteredData.filter(item => item.status === "Terlambat").length}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Sangat Terlambat */}
                <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
                  <div className="flex items-center">
                    <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="p-4 flex-1">
                      <p className="text-sm font-medium text-gray-500">Sangat Terlambat</p>
                      <p className="text-3xl font-bold text-red-600">
                        {filteredData.filter(item => item.status === "Sangat Terlambat").length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Optional: Summary Percentage Bar */}
              {filteredData.length > 0 && (
                <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-700 mb-2">Distribusi Kehadiran</p>
                  <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div 
                        className="bg-green-500 transition-all duration-500" 
                        style={{ 
                          width: `${(filteredData.filter(item => item.status === "Tepat Waktu").length / filteredData.length) * 100}%` 
                        }}
                      ></div>
                      <div 
                        className="bg-yellow-500 transition-all duration-500" 
                        style={{ 
                          width: `${(filteredData.filter(item => item.status === "Terlambat").length / filteredData.length) * 100}%` 
                        }}
                      ></div>
                      <div 
                        className="bg-red-500 transition-all duration-500" 
                        style={{ 
                          width: `${(filteredData.filter(item => item.status === "Sangat Terlambat").length / filteredData.length) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-600">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                      <span>Tepat Waktu</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
                      <span>Terlambat</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                      <span>Sangat Terlambat</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
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
