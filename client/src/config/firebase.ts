// client/src/config/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";

// REEMPLAZA CON TUS DATOS DE FIREBASE CONSOLE:
const firebaseConfig = {
  apiKey: "AIzaSyD0bdTsBnh2jPfjPPmDw3EMm2OZEn6gTyk",
  authDomain: "ingeniaq-d4786.firebaseapp.com",
  projectId: "ingeniaq-d4786",
  storageBucket: "ingeniaq-d4786.firebasestorage.app",
  messagingSenderId: "976121050175",
  appId: "1:976121050175:web:299c3b0fb51e2f09c4f48a",
  measurementId: "G-J4PDJKVB9K"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();