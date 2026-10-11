import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoConfigKeyForFoodyPay123456",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "foodypay-7b82b.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "foodypay-7b82b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "foodypay-7b82b.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "257275525909",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:257275525909:web:a68679c62471f6b384871c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-3Y30PQ3LYR"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const firestoreDb = getFirestore(app);

export const FIRESTORE_COLLECTIONS = {
  BUSINESS_USERS: 'Business_Users',
  USERS: 'users',
  ORDERS: 'orders',
  DISHES: 'dishes',
  PRODUCTS: 'products',
  TABLES: 'tables',
  CUSTOMERS: 'customers',
  DUES: 'customer_dues',
  COUPONS: 'coupons',
  SETTINGS: 'settings',
  QR_CODES: 'qr_codes',
  REVIEWS: 'reviews',
};

export {
  app,
  auth,
  googleProvider,
  firestoreDb,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
};

/**
 * Sign in existing user with Email & Password via Firebase Auth
 */
export async function loginWithFirebaseEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const token = await userCredential.user.getIdToken();
    return {
      user: userCredential.user,
      token,
    };
  } catch (error) {
    let message = error.message;
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      message = 'Incorrect password entered. Click "Forgot Password?" to reset via Firebase email link.';
    } else if (error.code === 'auth/user-not-found') {
      message = 'No account found with this email. Please register first.';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Invalid email address format.';
    }
    throw new Error(message);
  }
}

/**
 * Register new user with Email & Password via Firebase Auth + Send Email Verification Link
 */
export async function registerWithFirebaseEmail(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    // Send Gmail / Email Verification Link to registered user
    try {
      await sendEmailVerification(user);
    } catch (verErr) {
      console.warn('Firebase email verification send warning:', verErr);
    }

    const token = await user.getIdToken();
    return {
      user,
      token,
      verificationSent: true,
    };
  } catch (error) {
    let message = error.message;
    if (error.code === 'auth/email-already-in-use') {
      message = 'An account already exists with this email address. Please sign in instead.';
    } else if (error.code === 'auth/weak-password') {
      message = 'Password should be at least 6 characters long.';
    }
    throw new Error(message);
  }
}

/**
 * Send Gmail / Email Verification Link to user via Firebase Auth
 */
export async function sendFirebaseEmailVerification(user) {
  if (!user && auth.currentUser) {
    user = auth.currentUser;
  }
  if (!user) {
    throw new Error('No active user logged in to send verification email.');
  }
  await sendEmailVerification(user);
  return { success: true, message: 'Verification email sent successfully!' };
}

/**
 * Send Password Reset Email link via Firebase Auth directly to inbox
 */
export async function sendFirebasePasswordReset(email) {
  if (!email || !email.trim() || !email.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  const cleanEmail = email.trim().toLowerCase();

  try {
    await sendPasswordResetEmail(auth, cleanEmail);
    return { success: true, message: `Password reset email sent to ${cleanEmail}! Please check your inbox or spam folder.` };
  } catch (error) {
    let message = error.message;
    if (error.code === 'auth/user-not-found') {
      message = 'No registered user found with this email address.';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Invalid email address format.';
    }
    throw new Error(message);
  }
}

/**
 * One-Click Google Popup Sign-In / Sign-Up via Firebase Auth
 */
export async function loginWithFirebaseGoogle() {
  try {
    googleProvider.setCustomParameters({
      prompt: 'select_account',
    });
    const result = await signInWithPopup(auth, googleProvider);
    const token = await result.user.getIdToken();
    return {
      user: result.user,
      token,
    };
  } catch (error) {
    let message = error.message;
    if (error.code === 'auth/popup-closed-by-user') {
      message = 'Google sign-in popup was closed before completing.';
    } else if (error.code === 'auth/popup-blocked') {
      message = 'Pop-up blocked by browser. Please enable popups for this site.';
    } else if (error.code === 'auth/unauthorized-domain') {
      message = 'Domain not authorized! Add your current domain (localhost / foodypay.in) in Firebase Console -> Authentication -> Settings -> Authorized Domains.';
    }
    throw new Error(message);
  }
}

/**
 * Sign out from Firebase Auth
 */
export async function logoutFirebase() {
  try {
    await signOut(auth);
  } catch (e) {}
}
