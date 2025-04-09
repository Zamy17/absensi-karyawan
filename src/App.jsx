// src/App.jsx - dengan import alternatif
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Auth components
import Login from './components/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Admin components
import AdminDashboard from './components/admin/Dashboard';
import EmployeeManagement from './components/admin/EmployeeManagement';
import GuardManagement from './components/admin/GuardManagement';
import AttendanceReport from './components/admin/AttendanceReport';
import TopEmployees from './components/admin/TopEmployees';

// Guard components - Desktop
import GuardDashboard from './components/guard/Dashboard';
import CheckInAttendance from './components/guard/CheckInAttendance';
import CheckOutAttendance from './components/guard/CheckOutAttendance';
import DailyReport from './components/guard/DailyReport';
import GuardEmployeeManagement from './components/guard/EmployeeManagement';

// ===== OPSI 1: Gunakan deteksi perangkat sederhana tanpa file terpisah =====
function App() {
  // Deteksi mobile sederhana
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    // Fungsi untuk mendeteksi perangkat mobile
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Cek pertama kali
    checkIfMobile();
    
    // Tambahkan event listener untuk resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Admin routes */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/employees" element={<EmployeeManagement />} />
            <Route path="/admin/guards" element={<GuardManagement />} />
            <Route path="/admin/attendance" element={<AttendanceReport />} />
            <Route path="/admin/top-employees" element={<TopEmployees />} />
          </Route>
          
          {/* Guard routes - gunakan layout yang dimodifikasi untuk mobile */}
          <Route element={<ProtectedRoute requiredRole="guard" />}>
            <Route path="/guard/dashboard" element={
              isMobile ? <MobileGuardDashboard /> : <GuardDashboard />
            } />
            <Route path="/guard/check-in" element={
              isMobile ? <MobileCheckIn /> : <CheckInAttendance />
            } />
            <Route path="/guard/check-out" element={
              isMobile ? <MobileCheckOut /> : <CheckOutAttendance />
            } />
            <Route path="/guard/daily-report" element={
              isMobile ? <MobileDailyReport /> : <DailyReport />
            } />
            <Route path="/guard/employees" element={<GuardEmployeeManagement />} />
          </Route>
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

// Komponen Mobile sederhana yang bisa digunakan tanpa import
const MobileBottomNav = ({ currentPath }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-30">
      <div className="flex justify-around items-center">
        {/* Dashboard */}
        <a href="/guard/dashboard" className={`flex flex-col items-center p-2 ${currentPath === '/guard/dashboard' ? 'text-blue-600' : 'text-gray-500'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs mt-1">Dashboard</span>
        </a>
        
        {/* Check In */}
        <a href="/guard/check-in" className={`flex flex-col items-center p-2 ${currentPath === '/guard/check-in' ? 'text-blue-600' : 'text-gray-500'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          <span className="text-xs mt-1">Masuk</span>
        </a>
        
        {/* Check Out */}
        <a href="/guard/check-out" className={`flex flex-col items-center p-2 ${currentPath === '/guard/check-out' ? 'text-blue-600' : 'text-gray-500'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-xs mt-1">Pulang</span>
        </a>
        
        {/* Daily Report */}
        <a href="/guard/daily-report" className={`flex flex-col items-center p-2 ${currentPath === '/guard/daily-report' ? 'text-blue-600' : 'text-gray-500'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs mt-1">Laporan</span>
        </a>
      </div>
    </div>
  );
};

// Wrapper sederhana untuk mobile layout
const MobileLayout = ({ children, currentPath }) => {
  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      {children}
      <MobileBottomNav currentPath={currentPath} />
    </div>
  );
};

// Komponen-komponen mobile sederhana tanpa perlu import
const MobileGuardDashboard = () => {
  return (
    <MobileLayout currentPath="/guard/dashboard">
      <GuardDashboard />
    </MobileLayout>
  );
};

const MobileCheckIn = () => {
  return (
    <MobileLayout currentPath="/guard/check-in">
      <div className="pb-20">
        {/* Mobile header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 mb-4 sticky top-0 z-10">
          <h1 className="text-xl font-bold">Konfirmasi Absensi Masuk</h1>
          <p className="text-sm opacity-80">
            {new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}
          </p>
        </div>
        
        {/* Gunakan komponen CheckInAttendance yang sudah ada */}
        <CheckInAttendance />
      </div>
    </MobileLayout>
  );
};

const MobileCheckOut = () => {
  return (
    <MobileLayout currentPath="/guard/check-out">
      <div className="pb-20">
        {/* Mobile header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 mb-4 sticky top-0 z-10">
          <h1 className="text-xl font-bold">Konfirmasi Absensi Pulang</h1>
          <p className="text-sm opacity-80">
            {new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}
          </p>
        </div>
        
        {/* Gunakan komponen CheckOutAttendance yang sudah ada */}
        <CheckOutAttendance />
      </div>
    </MobileLayout>
  );
};

const MobileDailyReport = () => {
  return (
    <MobileLayout currentPath="/guard/daily-report">
      <div className="pb-20">
        {/* Mobile header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 mb-4 sticky top-0 z-10">
          <h1 className="text-xl font-bold">Laporan Harian</h1>
          <p className="text-sm opacity-80">
            Laporan absensi yang Anda konfirmasi
          </p>
        </div>
        
        {/* Gunakan komponen DailyReport yang sudah ada */}
        <DailyReport />
      </div>
    </MobileLayout>
  );
};

export default App;