import { getApp, getApps, initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCD8Ux0u8ng-yq4OGzVq7mnszh1W7naVEM",
  authDomain: "moonrise001-5aa1c.firebaseapp.com",
  projectId: "moonrise001-5aa1c",
  storageBucket: "moonrise001-5aa1c.appspot.com", // 👈 FIXED HERE
  messagingSenderId: "171257810565",
  appId: "1:171257810565:web:eb8387e2cd085c8033e3ec",
  measurementId: "G-F2X6QG85T9",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Storage (explicit bucket, optional but safe)
export const storage = getStorage(app, "gs://moonrise001-5aa1c.appspot.com");
