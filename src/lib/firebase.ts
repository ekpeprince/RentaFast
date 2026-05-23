// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration - THIS WILL BE REPLACED BY THE BACKEND
const firebaseConfig = {
  apiKey: "AIzaSyAraBOYw5Qwv1cq-hPj8iXfjEnkcUyMUMs",
  authDomain: "studio-4318385703-9c3f4.firebaseapp.com",
  projectId: "studio-4318385703-9c3f4",
  storageBucket: "rentfast-v2.firebasestorage.app",
  messagingSenderId: "820367460272",
  appId: "1:820367460272:web:a711fa8225ce560399f875"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const firestore = getFirestore(app);

export { app };
