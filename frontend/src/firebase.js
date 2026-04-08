// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyAH4xit6_noco0Jynve-oC2JW1ysqVhPd4",
  authDomain: "blockchain-local-economy-app.firebaseapp.com",
  projectId: "blockchain-local-economy-app",
  storageBucket: "blockchain-local-economy-app.firebasestorage.app",
  messagingSenderId: "396522366570",
  appId: "1:396522366570:web:7e131a9acdb7b5e5cf8c13",
  measurementId: "G-R9VD2LQK1C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);