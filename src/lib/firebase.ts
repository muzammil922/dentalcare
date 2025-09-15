import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhLAdZkCDebQdEVXNlGijcc-cjlzw7yw4",
  authDomain: "dentalcare-pro.firebaseapp.com",
  projectId: "dentalcare-pro",
  storageBucket: "dentalcare-pro.appspot.com",
  messagingSenderId: "611470299813",
  appId: "1:611470299813:web:0d4b498eefca6eff89b34c",
  measurementId: "G-T434FS6WX0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app)

// Connect to emulators in development
if (import.meta.env.DEV) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099')
    connectFirestoreEmulator(db, 'localhost', 8080)
    connectStorageEmulator(storage, 'localhost', 9199)
    connectFunctionsEmulator(functions, 'localhost', 5001)
  } catch (error) {
    console.log('Emulators already connected or not available')
  }
}

export default app
