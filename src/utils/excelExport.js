// src/utils/excelExport.js
import * as XLSX from 'xlsx';
import { formatDate } from './dateUtils';

// Export attendance data to Excel
export const exportAttendanceToExcel = (data, filename = 'attendance-report') => {
  try {
    // Prepare data for export
    const exportData = data.map(item => ({
      'Tanggal': item.date,
      'Nama Karyawan': item.employeeName,
      'Jabatan': item.position,
      'Jam Masuk': item.checkInTime || '-',
      'Satpam Konfirmasi Masuk': item.checkInGuardName || '-',
      'Jam Pulang': item.checkOutTime || '-',
      'Satpam Konfirmasi Pulang': item.checkOutGuardName || '-',
      'Status': item.status || 'Tidak Hadir'
    }));
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    
    // Auto-size columns
    const colWidths = [
      { wch: 12 }, // Tanggal
      { wch: 25 }, // Nama Karyawan
      { wch: 15 }, // Jabatan
      { wch: 10 }, // Jam Masuk
      { wch: 25 }, // Satpam Konfirmasi Masuk
      { wch: 10 }, // Jam Pulang
      { wch: 25 }, // Satpam Konfirmasi Pulang
      { wch: 15 }  // Status
    ];
    worksheet['!cols'] = colWidths;
    
    // Generate filename with current date
    const currentDate = formatDate(new Date());
    const fullFilename = `${filename}-${currentDate}.xlsx`;
    
    // Export workbook
    XLSX.writeFile(workbook, fullFilename);
    
    return fullFilename;
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    throw new Error(error.message);
  }
};

// Export top employees data to Excel
export const exportTopEmployeesToExcel = (data, month, year, filename = 'top-employees') => {
  try {
    // Prepare data for export
    const exportData = data.map((item, index) => ({
      'Peringkat': index + 1,
      'Nama Karyawan': item.name,
      'Jabatan': item.position,
      'Hadir Tepat Waktu': item.onTime,
      'Terlambat': item.late,
      'Sangat Terlambat': item.veryLate,
      'Tidak Hadir': item.absent,
      'Skor': item.score.toFixed(2)
    }));
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Top Employees ${month}-${year}`);
    
    // Auto-size columns
    const colWidths = [
      { wch: 10 }, // Peringkat
      { wch: 25 }, // Nama Karyawan
      { wch: 15 }, // Jabatan
      { wch: 15 }, // Hadir Tepat Waktu
      { wch: 10 }, // Terlambat
      { wch: 15 }, // Sangat Terlambat
      { wch: 10 }, // Tidak Hadir
      { wch: 10 }  // Skor
    ];
    worksheet['!cols'] = colWidths;
    
    // Generate filename with current date
    const fullFilename = `${filename}-${month}-${year}.xlsx`;
    
    // Export workbook
    XLSX.writeFile(workbook, fullFilename);
    
    return fullFilename;
  } catch (error) {
    console.error("Error exporting top employees to Excel:", error);
    throw new Error(error.message);
  }
};