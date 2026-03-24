
// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDbzgXszyLF7brnrIQkEyEH3AyFMxZ2KF0",
  authDomain: "mitraai-a79d8.firebaseapp.com",
  projectId: "mitraai-a79d8",
  storageBucket: "mitraai-a79d8.firebasestorage.app",
  messagingSenderId: "776637464869",
  appId: "1:776637464869:web:2ba683a76f4943d1d65acc",
  measurementId: "G-DFG4JYTGEZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
