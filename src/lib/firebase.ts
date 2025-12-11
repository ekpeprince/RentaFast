// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAraBOYw5Qwv1cq-hPj8iXfjEnkcUyMUMs",
  authDomain: "studio-4318385703-9c3f4.firebaseapp.com",
  projectId: "studio-4318385703-9c3f4",
  storageBucket: "rentfast-v2.appspot.com",
  messagingSenderId: "820367460272",
  appId: "1:820367460272:web:a711fa8225ce560399f875"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Example of exporting a service (e.g., Firestore)
// import { getFirestore } from "firebase/firestore";
// export const db = getFirestore(app);
