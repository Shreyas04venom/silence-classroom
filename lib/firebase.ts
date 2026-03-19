import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getAuth, GoogleAuthProvider } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

let app;
let firestore: any = null;
let storage: any = null;
let auth: any = null;
let googleProvider: any = null;

if (firebaseConfig.apiKey) {
  try {
    // Initialize Firebase
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
    firestore = getFirestore(app)
    storage = getStorage(app)
    auth = getAuth(app)
    googleProvider = new GoogleAuthProvider()
  } catch (error) {
    console.error("Firebase initialization failed:", error)
  }
} else {
  console.warn("Firebase configuration is missing or incomplete in .env.local. Authentication features will not work.")
}

export { app, firestore, storage, auth, googleProvider }
export default app


