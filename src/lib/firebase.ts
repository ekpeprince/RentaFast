// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAol1fmKfMZ9M0AyYw9LBfJNkPcTOWKY5Q",
  authDomain: "rentfast-v2.firebaseapp.com",
  projectId: "rentfast-v2",
  storageBucket: "rentfast-v2.firebasestorage.app",
  messagingSenderId: "685830534650",
  appId: "1:685830534650:web:f409ed48c9638c2972e043"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Example of exporting a service (e.g., Firestore)
// import { getFirestore } from "firebase/firestore";
// export const db = getFirestore(app);
