// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { signIn, signOut, getCurrentUser, getUserRole } from '../firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

// Helper function to determine role from email
const getRoleFromEmail = (email) => {
  if (!email) return "user";
  
  email = email.toLowerCase();
  
  if (email.includes("admin")) {
    return "admin";
  } else if (email.includes("satpam") || email.includes("guard")) {
    return "guard";
  } else {
    return "user";
  }
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
            console.log("Getting role for current user:", user.uid);
            const role = await getUserRole(user.uid);
            console.log("User role determined:", role);
            setUserRole(role);
          } catch (roleError) {
            console.error("Error getting user role in AuthContext:", roleError);
            // Fall back to email-based role determination
            const fallbackRole = getRoleFromEmail(user.email);
            console.log("Using fallback role based on email:", fallbackRole);
            setUserRole(fallbackRole);
          }
        } else {
          setUserRole(null);
        }
      } catch (err) {
        console.error("Auth context error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const login = async (email, password) => {
    console.log("Login attempt for:", email);
    try {
      setError(null);
      const user = await signIn(email, password);
      console.log("User signed in:", user.uid);
      setCurrentUser(user);
      
      if (user) {
        try {
          console.log("Getting role after login for:", user.uid);
          const role = await getUserRole(user.uid);
          console.log("Role determined:", role);
          setUserRole(role);
          return { user, role };
        } catch (roleError) {
          console.error("Error getting user role after login:", roleError);
          
          // Use email-based role detection
          const fallbackRole = getRoleFromEmail(email);
          console.log("Using fallback role based on email:", fallbackRole);
          setUserRole(fallbackRole);
          return { user, role: fallbackRole };
        }
      }
    } catch (err) {
      console.error("Login error:", err);
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