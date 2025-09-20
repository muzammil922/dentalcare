import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

// Your Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDhLAdZkCDebQdEVXNlGijcc-cjlzw7yw4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dentalcare-pro.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dentalcare-pro",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dentalcare-pro.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "611470299813",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:611470299813:web:0d4b498eefca6eff89b34c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-T434FS6WX0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app)

// Connect to emulators in development (only if explicitly enabled)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099')
    connectFirestoreEmulator(db, 'localhost', 8080)
    connectStorageEmulator(storage, 'localhost', 9199)
    connectFunctionsEmulator(functions, 'localhost', 5001)
    console.log('Connected to Firebase emulators')
  } catch (error) {
    console.log('Emulators already connected or not available')
  }
}

export default app
