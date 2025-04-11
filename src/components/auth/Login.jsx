// src/components/auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase/config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState({ message: '', type: '' });
  const [resetLoading, setResetLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login, currentUser, userRole } = useAuth();

  // Check if user is already logged in
  useEffect(() => {
    if (currentUser && userRole) {
      redirectBasedOnRole(userRole);
    }
  }, [currentUser, userRole]);

  // Redirect based on role
  const redirectBasedOnRole = (role) => {
    console.log("Redirecting based on role:", role);
    
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else if (role === 'guard') {
      navigate('/guard/dashboard');
    } else {
      // Default fallback - could redirect to a basic user page
      console.warn("Unknown role:", role);
      navigate('/login');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Email dan password harus diisi.');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Automatically determine role from email for better UX
      let role = "user";
      const emailLower = email.toLowerCase();
      
      if (emailLower.includes("admin")) {
        role = "admin";
      } else if (emailLower.includes("satpam") || emailLower.includes("guard")) {
        role = "guard";
      }
      
      console.log("Pre-determined role based on email:", role);
      
      // Attempt to log in
      const result = await login(email, password);
      
      if (result && result.role) {
        redirectBasedOnRole(result.role);
      } else {
        // If no role is returned, use the pre-determined role
        redirectBasedOnRole(role);
      }
    } catch (err) {
      console.error("Login error:", err);
      
      // Provide more specific error messages
      if (err.code === 'auth/wrong-password') {
        setError('Password yang Anda masukkan salah.');
      } else if (err.code === 'auth/user-not-found') {
        setError('Tidak ada akun yang terkait dengan email ini.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Format email tidak valid.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Terlalu banyak percobaan login. Silakan coba lagi nanti.');
      } else {
        setError('Login gagal. Periksa email dan password Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      setResetStatus({ message: 'Silakan masukkan email Anda.', type: 'error' });
      return;
    }
    
    try {
      setResetStatus({ message: '', type: '' });
      setResetLoading(true);
      
      // Send password reset email
      await sendPasswordResetEmail(auth, resetEmail);
      
      setResetStatus({ 
        message: 'Email reset password telah dikirim. Silakan periksa inbox Anda.', 
        type: 'success' 
      });
      
      // Pre-fill the login form with the reset email
      setEmail(resetEmail);
      
      // Close modal after 3 seconds on success
      setTimeout(() => {
        setShowResetModal(false);
        setResetEmail('');
        setResetStatus({ message: '', type: '' });
      }, 3000);
      
    } catch (err) {
      console.error("Password reset error:", err);
      
      if (err.code === 'auth/user-not-found') {
        setResetStatus({ message: 'Tidak ada akun yang terkait dengan email ini.', type: 'error' });
      } else if (err.code === 'auth/invalid-email') {
        setResetStatus({ message: 'Format email tidak valid.', type: 'error' });
      } else {
        setResetStatus({ message: 'Gagal mengirim email reset password. Silakan coba lagi.', type: 'error' });
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-6 sm:p-10 rounded-xl shadow-md">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sistem Absensi Karyawan
          </h2>
          <h3 className="text-center text-xl font-bold text-blue-600 mt-1">
            PT. SUCOFINDO cabang Jambi
          </h3>
          
          <p className="mt-3 text-center text-sm text-gray-600">
            Silakan login dengan akun Anda
          </p>
        </div>
        
        {/* Error Alert */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg text-red-700 p-4 shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900"
                  placeholder="Masukkan email Anda"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900"
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
            
            {/* Forgot Password Link */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                className="font-medium text-sm text-blue-600 hover:text-blue-700"
                onClick={() => {
                  setShowResetModal(true);
                  setResetEmail(email);
                  setResetStatus({ message: '', type: '' });
                }}
              >
                Lupa password?
              </button>
            </div>
          </div>

          {/* Login Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 shadow-sm"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                  </svg>
                  Masuk
                </span>
              )}
            </button>
          </div>
        </form>
        
        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} PT. SUCOFINDO cabang Jambi. All rights reserved.
          </p>
        </div>
      </div>
      
      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Reset Password</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowResetModal(false)}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Masukkan alamat email Anda. Kami akan mengirimkan link untuk reset password.
            </p>
            
            {resetStatus.message && (
              <div className={`mb-4 p-3 rounded-lg ${
                resetStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
                'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {resetStatus.message}
              </div>
            )}
            
            <form onSubmit={handleForgotPassword}>
              <div className="mb-4">
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan email Anda"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  onClick={() => setShowResetModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70"
                  disabled={resetLoading}
                >
                  {resetLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memproses...
                    </span>
                  ) : "Kirim Link Reset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
