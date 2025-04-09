// src/firebase/auth.js
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from "firebase/auth";
import { auth } from "./config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./config";

// Fungsi helper untuk menentukan peran berdasarkan email
const getRoleFromEmail = (email) => {
  if (!email) return null;
  
  const emailLower = email.toLowerCase();
  if (emailLower.includes('admin')) {
    return 'admin';
  } else if (emailLower.includes('guard') || emailLower.includes('satpam')) {
    return 'guard';
  }
  return null;
};

// Login dengan email dan password
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Coba dapatkan peran dari Firestore
    try {
      const role = await getUserRole(user.uid);
      return { user, role };
    } catch (err) {
      // Jika Firestore gagal, gunakan peran berbasis email sebagai fallback
      console.log("Menggunakan peran berbasis email karena:", err.message);
      const emailRole = getRoleFromEmail(email);
      
      // Jika ini login pertama, coba buat dokumen pengguna dengan peran berbasis email
      try {
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          role: emailRole,
          name: email.split('@')[0], // Nama dasar dari email
          createdAt: new Date()
        }, { merge: true });
        
        console.log("Berhasil membuat/memperbarui dokumen pengguna dengan peran berbasis email");
      } catch (docErr) {
        console.warn("Tidak dapat membuat/memperbarui dokumen pengguna:", docErr.message);
      }
      
      return { user, role: emailRole };
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

// Sign out / Logout
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return true;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Mendapatkan peran pengguna dari Firestore
export const getUserRole = async (uid) => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().role;
    } else {
      // Jika dokumen pengguna tidak ditemukan, periksa apakah email pengguna saat ini menunjukkan peran
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === uid) {
        const emailRole = getRoleFromEmail(currentUser.email);
        if (emailRole) {
          console.log("Dokumen pengguna tidak ditemukan. Menggunakan peran berbasis email:", emailRole);
          return emailRole;
        }
      }
      
      throw new Error("Pengguna tidak ditemukan dalam database");
    }
  } catch (error) {
    console.error("Error mendapatkan peran pengguna:", error.message);
    
    // Fallback ke peran berbasis email jika tidak dapat mengakses Firestore
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid === uid) {
      const emailRole = getRoleFromEmail(currentUser.email);
      if (emailRole) {
        console.log("Akses ditolak saat membaca dokumen pengguna. Menggunakan peran berbasis email.");
        return emailRole;
      }
    }
    
    throw new Error(error.message);
  }
};

// Memeriksa apakah pengguna terautentikasi
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