// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { signIn, signOut, getCurrentUser, getUserRole } from '../firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        setLoading(true);
        const user = await getCurrentUser();
        setCurrentUser(user);
        
        if (user) {
          try {
            const role = await getUserRole(user.uid);
            console.log("Peran ditentukan:", role);
            setUserRole(role);
          } catch (roleError) {
            console.error("Error mendapatkan peran pengguna:", roleError);
            // Tetap lanjutkan dan tampilkan UI meskipun pengambilan peran gagal
            // Default ke null role yang akan mengarahkan ke halaman login
            setUserRole(null);
          }
        } else {
          setUserRole(null);
        }
      } catch (err) {
        console.error("Error konteks Auth:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      console.log("Upaya login untuk:", email);
      const { user, role } = await signIn(email, password);
      console.log("Pengguna berhasil masuk:", user.uid);
      console.log("Peran ditentukan:", role);
      
      setCurrentUser(user);
      setUserRole(role);
      return { user, role };
    } catch (err) {
      console.error("Error login:", err);
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut();
      setCurrentUser(null);
      setUserRole(null);
    } catch (err) {
      console.error("Error logout:", err);
      setError(err.message);
      throw err;
    }
  };

  const value = {
    currentUser,
    userRole,
    login,
    logout,
    error,
    loading,
    isAdmin: userRole === 'admin',
    isGuard: userRole === 'guard'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;