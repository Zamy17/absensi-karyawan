// src/components/admin/TopEmployees.jsx
import React, { useState, useEffect } from 'react';
import { getTopEmployees } from '../../firebase/firestore';
import { getMonthName } from '../../utils/dateUtils';
import { exportTopEmployeesToExcel } from '../../utils/excelExport';
import Layout from '../layout/Layout';
import Button from '../shared/Button';
import DataTable from '../shared/DataTable';

const TopEmployees = () => {
  const [topEmployees, setTopEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [isExporting, setIsExporting] = useState(false);
  
  // Get current month and year
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  
  // Generate year options (current year and 2 years back)
  const yearOptions = [];
  for (let y = currentYear - 2; y <= currentYear; y++) {
    yearOptions.push(y);
  }
  
  // Generate month options
  const monthOptions = [];
  for (let m = 1; m <= 12; m++) {
    monthOptions.push({
      value: m,
      label: getMonthName(m)
    });
  }
  
  // Fetch top employees data
  useEffect(() => {
    const fetchTopEmployees = async () => {
      try {
        setLoading(true);
        const data = await getTopEmployees(year, month);
        setTopEmployees(data);
      } catch (error) {
        console.error("Error fetching top employees:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTopEmployees();
  }, [year, month]);
  
  // Handle export to Excel
  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const monthName = getMonthName(month);
      await exportTopEmployeesToExcel(
        topEmployees,
        month,
        year,
        `top-employees-${monthName}-${year}`
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Table columns
  const columns = [
    {
      key: 'rank',
      title: 'Peringkat',
      render: (_, index) => index + 1
    },
    {
      key: 'name',
      title: 'Nama Karyawan'
    },
    {
      key: 'position',
      title: 'Jabatan'
    },
    {
      key: 'onTime',
      title: 'Tepat Waktu'
    },
    {
      key: 'late',
      title: 'Terlambat'
    },
    {
      key: 'veryLate',
      title: 'Sangat Terlambat'
    },
    {
      key: 'absent',
      title: 'Tidak Hadir'
    },
    {
      key: 'score',
      title: 'Skor',
      render: (row) => row.score.toFixed(2)
    }
  ];
  
  // Table actions
  const tableActions = (
    <div className="flex flex-col md:flex-row gap-4">
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
      
      <div className="flex items-end">
        <Button
          onClick={handleExport}
          disabled={isExporting || topEmployees.length === 0}
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
            Top Karyawan Terbaik
          </h1>
          <p className="mt-1 text-gray-500">
            Daftar karyawan terbaik berdasarkan kehadiran dan ketepatan waktu
          </p>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Top Karyawan - {getMonthName(month)} {year}
            </h2>
          </div>
          
          <DataTable
            columns={columns}
            data={topEmployees}
            loading={loading}
            actions={tableActions}
            pagination={false}
            emptyMessage="Tidak ada data untuk periode yang dipilih"
          />
        </div>
      </div>
    </Layout>
  );
};

export default TopEmployees;