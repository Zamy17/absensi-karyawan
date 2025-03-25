// src/App.jsx
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

// Guard components
import GuardDashboard from './components/guard/Dashboard';
import CheckInAttendance from './components/guard/CheckInAttendance';
import CheckOutAttendance from './components/guard/CheckOutAttendance';
import DailyReport from './components/guard/DailyReport';

function App() {
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
          
          {/* Guard routes */}
          <Route element={<ProtectedRoute requiredRole="guard" />}>
            <Route path="/guard/dashboard" element={<GuardDashboard />} />
            <Route path="/guard/check-in" element={<CheckInAttendance />} />
            <Route path="/guard/check-out" element={<CheckOutAttendance />} />
            <Route path="/guard/daily-report" element={<DailyReport />} />
          </Route>
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;