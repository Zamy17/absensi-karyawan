// src/firebase/auth.js
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getAuth
} from "firebase/auth";
import { auth, db } from "./config";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Sign in with email and password
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Sign in error details:", error.code, error.message);
    throw new Error(error.message);
  }
};

// Sign out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return true;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Determine role based on email pattern
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

// Get user role from Firestore with fallback strategy
export const getUserRole = async (uid) => {
  console.log("Getting role for user:", uid);
  
  try {
    // First, verify the user is authenticated
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("No authenticated user found when getting role");
      return "user";
    }
    
    console.log("Auth state:", currentUser.uid === uid ? "UIDs match" : "UID mismatch");
    
    // Get email-based role as fallback
    const emailBasedRole = getRoleFromEmail(currentUser.email);
    console.log("Email-based role fallback:", emailBasedRole);
    
    // Try to get the user document
    const docRef = doc(db, "users", uid);
    console.log("Attempting to fetch document from:", `users/${uid}`);
    
    try {
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        console.log("User document exists, role:", docSnap.data().role);
        return docSnap.data().role;
      } else {
        console.warn("User document not found for uid:", uid);
        
        // Try to create a user document based on email role
        try {
          await setDoc(docRef, {
            role: emailBasedRole,
            email: currentUser.email,
            createdAt: new Date()
          });
          console.log("Created user document with role:", emailBasedRole);
        } catch (writeError) {
          console.error("Failed to create user document:", writeError);
        }
        
        return emailBasedRole;
      }
    } catch (docError) {
      console.error("Document fetch error:", docError.code, docError.message);
      
      // If it's a permissions error, use email-based role
      if (docError.code === "permission-denied") {
        console.warn("Permission denied when reading user document. Using email-based role.");
        return emailBasedRole;
      }
      
      throw docError;
    }
  } catch (error) {
    console.error("Error in getUserRole:", error.code, error.message);
    
    // Try to determine role from email as last resort
    if (auth.currentUser && auth.currentUser.email) {
      return getRoleFromEmail(auth.currentUser.email);
    }
    
    // Default fallback
    return "user";
  }
};

// Check if user is authenticated
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      (error) => {
        reject(error);
      }
    );
  });
};