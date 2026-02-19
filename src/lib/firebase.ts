// Import the functions you need from the SDKs you need
// @ts-ignore - Firebase types are included in the package
import { initializeApp } from "firebase/app";
// @ts-ignore - Firebase types are included in the package
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCTQp1yARfcwaFI3whw2caK07dONIawPzk",
  authDomain: "paso-a-paso-shoes.firebaseapp.com",
  projectId: "paso-a-paso-shoes",
  storageBucket: "paso-a-paso-shoes.firebasestorage.app",
  messagingSenderId: "677933443616",
  appId: "1:677933443616:web:627139aa5417ab58626a45",
  measurementId: "G-W2XP8LKXFT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
