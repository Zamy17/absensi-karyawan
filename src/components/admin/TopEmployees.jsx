// src/components/admin/TopEmployees.jsx
import React, { useState, useEffect } from 'react';
import { getEmployees } from '../../firebase/firestore';
import { getCurrentDate } from '../../utils/dateUtils';
import { exportTopEmployeesToExcel } from '../../utils/excelExport';
import Layout from '../layout/Layout';
import Button from '../shared/Button';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

// Function to get Indonesian month names
const getIndonesianMonthName = (month) => {
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  return monthNames[month - 1]; // Adjusting for 1-based month index
};

const TopEmployees = () => {
  const [topEmployees, setTopEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [isExporting, setIsExporting] = useState(false);
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [totalWorkers, setTotalWorkers] = useState(0);
  const [showAllEmployees, setShowAllEmployees] = useState(false); // Tambahkan state untuk toggle semua karyawan
  
  // Get current month and year
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  
  // Generate year options (current year and 3 years back)
  const yearOptions = [];
  for (let y = currentYear - 3; y <= currentYear; y++) {
    yearOptions.push(y);
  }
  
  // Generate month options with Indonesian names
  const monthOptions = [];
  for (let m = 1; m <= 12; m++) {
    monthOptions.push({
      value: m,
      label: getIndonesianMonthName(m)
    });
  }
  
  // Helper function untuk menghitung hari kerja dalam bulan (termasuk Sabtu dan Minggu)
  const countWorkDays = (year, month) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    let count = 0;
    
    for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
      // Semua hari dihitung sebagai hari kerja (termasuk Sabtu dan Minggu)
      count++;
    }
    
    return count;
  };
  
  // Fetch top employees data with real-time updates
  useEffect(() => {
    let unsubscribe = null;
    
    const fetchTopEmployees = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Create date range for the specified month
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
        
        console.log(`Calculating employees for ${month}/${year} (${startDate} to ${endDate})`);
        
        // Get all employees
        const employees = await getEmployees();
        setTotalWorkers(employees.length);
        
        // Set up real-time listener for attendance collection
        const attendanceRef = collection(db, "attendance");
        
        // Use onSnapshot for real-time updates
        unsubscribe = onSnapshot(attendanceRef, (querySnapshot) => {
          // Filter records for the chosen month/year in JavaScript
          const monthAttendance = [];
          querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.date >= startDate && data.date <= endDate) {
              monthAttendance.push({ id: doc.id, ...data });
            }
          });
          
          console.log(`Real-time: Found ${monthAttendance.length} attendance records for the month`);
          
          // Initialize stats for each employee
          const employeeStats = {};
          employees.forEach(employee => {
            employeeStats[employee.id] = {
              id: employee.id,
              name: employee.name || "Tanpa Nama", // Pastikan nama selalu ada
              position: employee.position || "Tidak ada jabatan",
              totalWorkDays: 0,
              onTime: 0,
              late: 0,
              veryLate: 0,
              absent: 0,
              score: 0,
              percentage: 0,
              totalDaysPresent: 0 // Tambahkan properti untuk jumlah keseluruhan hari hadir
            };
          });
          
          // Count total work days (all days are work days now, including weekends)
          const totalWorkDays = countWorkDays(year, month);
          
          // Process attendance records
          monthAttendance.forEach(record => {
            if (employeeStats[record.employeeId]) {
              employeeStats[record.employeeId].totalWorkDays++;
              employeeStats[record.employeeId].totalDaysPresent++; // Increment total hadir
              
              if (record.status === "Tepat Waktu") {
                employeeStats[record.employeeId].onTime++;
              } else if (record.status === "Terlambat") {
                employeeStats[record.employeeId].late++;
              } else if (record.status === "Sangat Terlambat") {
                employeeStats[record.employeeId].veryLate++;
              }
            }
          });
          
          // Calculate absences and score for each employee - MODIFIED SCORING
          Object.values(employeeStats).forEach(stat => {
            // Pastikan semua nilai numerik valid
            stat.onTime = Number(stat.onTime) || 0;
            stat.late = Number(stat.late) || 0;
            stat.veryLate = Number(stat.veryLate) || 0;
            stat.totalDaysPresent = Number(stat.totalDaysPresent) || 0;
            
            stat.absent = totalWorkDays - stat.totalWorkDays;
            
            // Modified score calculation: NO PENALTY FOR ABSENCES
            // (onTime * 1.0) + (late * 0.5) + (veryLate * 0.25)
            stat.score = 
              (stat.onTime * 1.0) + 
              (stat.late * 0.5) + 
              (stat.veryLate * 0.25);
            
            // Handle potential NaN
            if (isNaN(stat.score)) {
              stat.score = 0;
            }
              
            // Calculate percentage of maximum possible score
            // Maximum possible = totalWorkDays * 1.0 (if all days were on time)
            if (totalWorkDays > 0) {
              stat.percentage = Math.round((stat.score / totalWorkDays) * 100);
              // Amankan dari NaN
              if (isNaN(stat.percentage)) {
                stat.percentage = 0;
              }
            } else {
              stat.percentage = 0;
            }
          });
          
          // Sort by score (highest first) - Do not slice, we'll show all or restrict in the display
          const result = Object.values(employeeStats)
            .sort((a, b) => {
              // Jika skor sama, urutkan berdasarkan persentase
              if (b.score === a.score) {
                return b.percentage - a.percentage;
              }
              return b.score - a.score;
            });
          
          setTopEmployees(result);
          setLoading(false);
        }, (error) => {
          console.error("Error in real-time listener:", error);
          setError("Terjadi kesalahan saat memantau data secara real-time. Silakan refresh halaman.");
          setLoading(false);
        });
        
      } catch (error) {
        console.error("Error setting up real-time tracking:", error);
        setError("Terjadi kesalahan saat mengambil data karyawan terbaik. Silakan coba lagi.");
        setLoading(false);
      }
    };
    
    fetchTopEmployees();
    
    // Clean up listener when component unmounts or dependencies change
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [year, month]);
  
  // Handle export to Excel
  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);
      
      const dataToExport = showAllEmployees ? topEmployees : topEmployees.slice(0, 10);
      const monthName = getIndonesianMonthName(month);
      await exportTopEmployeesToExcel(
        dataToExport,
        month,
        year,
        `top-employees-${monthName}-${year}`
      );
      
      // Show success message
      alert(`Data berhasil diekspor ke Excel: top-employees-${monthName}-${year}.xlsx`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setError("Terjadi kesalahan saat mengekspor data ke Excel. Silakan coba lagi.");
    } finally {
      setIsExporting(false);
    }
  };
  
  // Toggle score info
  const toggleScoreInfo = () => {
    setShowScoreInfo(!showScoreInfo);
  };

  // Toggle show all employees
  const toggleShowAllEmployees = () => {
    setShowAllEmployees(!showAllEmployees);
  };
  
  // Get color based on percentage
  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  // Fungsi untuk mendapatkan warna latar belakang peringkat berdasarkan posisi
  const getRankBackgroundColor = (rank) => {
    if (rank === 1) return 'bg-yellow-500'; // Emas untuk peringkat 1
    if (rank === 2) return 'bg-gray-400';   // Perak untuk peringkat 2
    if (rank === 3) return 'bg-amber-600';  // Perunggu untuk peringkat 3
    return 'bg-blue-100';                   // Default untuk peringkat lainnya
  };

  // Fungsi untuk mendapatkan warna teks peringkat berdasarkan posisi
  const getRankTextColor = (rank) => {
    if (rank <= 3) return 'text-white';      // Teks putih untuk 3 peringkat teratas
    return 'text-blue-800';                  // Default untuk peringkat lainnya
  };
  
  // Render employee card view
  const renderEmployeeCards = () => {
    // Gunakan filter untuk menampilkan 10 teratas atau semua karyawan
    const displayedEmployees = showAllEmployees ? topEmployees : topEmployees.slice(0, 10);
    
    if (displayedEmployees.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Tidak ada data untuk periode yang dipilih
        </div>
      );
    }
    
    // Prepare data with rankings for card view too
    const employeesWithRanking = displayedEmployees.map((employee, idx) => ({
      ...employee,
      rankIndex: idx + 1,
      // Pastikan semua nilai numerik valid
      onTime: employee.onTime || 0,
      late: employee.late || 0,
      veryLate: employee.veryLate || 0,
      absent: employee.absent || 0,
      score: employee.score || 0,
      percentage: employee.percentage || 0,
      totalDaysPresent: employee.totalDaysPresent || 0
    }));
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employeesWithRanking.map((employee, index) => (
          <div 
            key={employee.id} 
            className={`relative bg-white rounded-lg shadow-md overflow-hidden
              ${index < 3 ? 'border-2 border-blue-400' : ''}`}
          >
            {/* Ranking badge for all employees */}
            <div className={`absolute top-0 right-0 w-10 h-10 flex items-center justify-center 
                rounded-bl-lg font-bold text-xl ${getRankBackgroundColor(index + 1)} ${getRankTextColor(index + 1)}`}>
              {index + 1}
            </div>
            
            <div className="p-5">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl mr-3">
                  {employee.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{employee.name}</h3>
                  <p className="text-gray-600">{employee.position}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Skor:</span>
                  <span className="font-bold text-blue-600">{employee.score.toFixed(1)} poin</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${getPercentageColor(employee.percentage)}`} 
                    style={{ width: `${employee.percentage}%` }}>
                  </div>
                </div>
                <div className="text-sm text-right text-gray-600">{employee.percentage}% dari maksimal</div>

                {/* Tambahkan informasi total hari hadir */}
                <div className="flex justify-between bg-blue-50 p-2 rounded">
                  <span className="font-medium">Total Hadir:</span>
                  <span className="font-bold text-blue-800">{employee.totalDaysPresent} hari</span>
                </div>
                
                <div className="grid grid-cols-4 gap-1 text-xs text-center">
                  <div className="py-1 px-2 rounded bg-green-100 text-green-800">
                    <div className="font-bold">{employee.onTime}</div>
                    <div>Tepat</div>
                  </div>
                  <div className="py-1 px-2 rounded bg-yellow-100 text-yellow-800">
                    <div className="font-bold">{employee.late}</div>
                    <div>Terlambat</div>
                  </div>
                  <div className="py-1 px-2 rounded bg-red-100 text-red-800">
                    <div className="font-bold">{employee.veryLate}</div>
                    <div>Sgt. Terlambat</div>
                  </div>
                  <div className="py-1 px-2 rounded bg-gray-100 text-gray-800">
                    <div className="font-bold">{employee.absent}</div>
                    <div>Tidak Hadir</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Stats cards
  const renderStatCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">
        <div className="text-sm font-medium text-gray-500">Total Karyawan</div>
        <div className="mt-1 text-3xl font-semibold">{totalWorkers}</div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500">
        <div className="text-sm font-medium text-gray-500">Bulan</div>
        <div className="mt-1 text-3xl font-semibold">{getIndonesianMonthName(month)}</div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-yellow-500">
        <div className="text-sm font-medium text-gray-500">Tahun</div>
        <div className="mt-1 text-3xl font-semibold">{year}</div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-500">
        <div className="text-sm font-medium text-gray-500">Menampilkan</div>
        <div className="mt-1 text-3xl font-semibold">
          {showAllEmployees ? totalWorkers : Math.min(10, topEmployees.length)}
          <span className="text-sm font-normal text-gray-500 ml-1">
            dari {totalWorkers}
          </span>
        </div>
      </div>
    </div>
  );
  
  // Table actions (renamed to just "actions" since there's no table anymore)
  const actions = (
    <div className="flex flex-col md:flex-row gap-4 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
        <div>
          <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
            Bulan
          </label>
          <select
            id="month"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
            Tahun
          </label>
          <select
            id="year"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex items-end space-x-2 flex-wrap">
        <Button
          onClick={toggleShowAllEmployees}
          variant="light"
          className="whitespace-nowrap"
        >
          {showAllEmployees ? 'Top 10 Karyawan' : 'Semua Karyawan'}
        </Button>
        
        <Button
          onClick={toggleScoreInfo}
          variant="light"
          className="whitespace-nowrap"
        >
          {showScoreInfo ? 'Sembunyikan Info' : 'Info Perhitungan'}
        </Button>
        
        <Button
          onClick={handleExport}
          disabled={isExporting || topEmployees.length === 0}
          className="whitespace-nowrap"
          variant="success"
        >
          {isExporting ? 'Mengekspor...' : 'Export ke Excel'}
        </Button>
      </div>
    </div>
  );
  
  return (
    <Layout>
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h1 className="text-2xl font-bold text-gray-900">
            {showAllEmployees ? 'Peringkat Seluruh Karyawan' : 'Top Karyawan Terbaik'}
          </h1>
          <p className="mt-1 text-gray-500">
            Daftar karyawan berdasarkan kehadiran dan ketepatan waktu
          </p>
        </div>
        
        {renderStatCards()}
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
                <p className="mt-2 text-xs">
                  Catatan: Anda mungkin perlu membuat indeks di Firebase Console. 
                  <br />
                  Buka menu "Firestore Database" → "Indexes" → "Add Index" pada project Firebase Anda.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {showScoreInfo && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm p-6">
            <h3 className="font-bold mb-4 text-lg text-blue-800">Sistem Poin Karyawan Terbaik</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-semibold mb-3 text-blue-700 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
                  </svg>
                  Cara Perhitungan Poin
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-center bg-green-50 p-2 rounded-lg">
                    <span className="inline-block w-5 h-5 rounded-full bg-green-500 mr-2 flex-shrink-0"></span>
                    <span><span className="font-medium">Tepat Waktu:</span> +1.0 poin per hari</span>
                  </li>
                  <li className="flex items-center bg-yellow-50 p-2 rounded-lg">
                    <span className="inline-block w-5 h-5 rounded-full bg-yellow-500 mr-2 flex-shrink-0"></span>
                    <span><span className="font-medium">Terlambat:</span> +0.5 poin per hari</span>
                  </li>
                  <li className="flex items-center bg-red-50 p-2 rounded-lg">
                    <span className="inline-block w-5 h-5 rounded-full bg-red-500 mr-2 flex-shrink-0"></span>
                    <span><span className="font-medium">Sangat Terlambat:</span> +0.25 poin per hari</span>
                  </li>
                  <li className="flex items-center bg-gray-50 p-2 rounded-lg">
                    <span className="inline-block w-5 h-5 rounded-full bg-gray-300 mr-2 flex-shrink-0"></span>
                    <span><span className="font-medium">Tidak Hadir:</span> tidak mempengaruhi poin</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-semibold mb-3 text-blue-700 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                  </svg>
                  Tentang Sistem Poin
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    <span>Total poin dihitung berdasarkan seluruh hari dalam bulan (termasuk Sabtu dan Minggu)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    <span>Data absensi diperbarui secara realtime untuk melihat perubahan langsung</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    <span>Persentase menunjukkan pencapaian dibandingkan poin maksimal yang mungkin</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    <span>Poin maksimal adalah jika karyawan selalu tepat waktu setiap hari</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    <span>Semakin tinggi poin, semakin baik performa kehadiran karyawan</span>
                  </li>
                </ul>
                <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                  <p><span className="font-bold">Formula:</span></p>
                  <div className="font-mono text-xs mt-1 p-2 bg-white rounded">
                    (Tepat Waktu × 1.0) + (Terlambat × 0.5) + (Sangat Terlambat × 0.25)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {actions}
          
          <div className="p-4">
            {loading ? (
              <div className="flex justify-center my-12">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-gray-500">Memuat data karyawan...</p>
                </div>
              </div>
            ) : (
              renderEmployeeCards()
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TopEmployees;