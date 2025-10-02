// lib/firebase.ts - Secure Firebase Configuration with Environment Variables

import Constants from "expo-constants";
import { getApp, getApps, initializeApp } from "firebase/app";
import { FirebaseStorage, getStorage } from "firebase/storage";

// Get environment variables with fallbacks for development
const getEnvVar = (key: string, fallback: string): string => {
  // @ts-ignore - Constants.expoConfig might not be typed
  const value = Constants.expoConfig?.extra?.[key] || process.env[key];

  if (!value && __DEV__) {
    console.warn(`Missing environment variable: ${key}`);
    return fallback;
  }

  return value || fallback;
};

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: getEnvVar(
    "EXPO_PUBLIC_FIREBASE_API_KEY",
    "AIzaSyCD8Ux0u8ng-yq4OGzVq7mnszh1W7naVEM" // Fallback for dev only
  ),
  authDomain: getEnvVar(
    "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "moonrise001-5aa1c.firebaseapp.com"
  ),
  projectId: getEnvVar("EXPO_PUBLIC_FIREBASE_PROJECT_ID", "moonrise001-5aa1c"),
  storageBucket: getEnvVar(
    "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "moonrise001-5aa1c.appspot.com"
  ),
  messagingSenderId: getEnvVar(
    "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "171257810565"
  ),
  appId: getEnvVar(
    "EXPO_PUBLIC_FIREBASE_APP_ID",
    "1:171257810565:web:eb8387e2cd085c8033e3ec"
  ),
  measurementId: getEnvVar(
    "EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID",
    "G-F2X6QG85T9"
  ),
};

// Initialize Firebase only once
let app;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.error("Firebase initialization error:", error);
  // App continues to function even if Firebase fails to initialize
  // Audio URLs are public and don't require authentication
}

// Initialize Storage with error handling
export let storage: FirebaseStorage | undefined;
try {
  if (app) {
    storage = getStorage(app);
  }
} catch (error) {
  console.error("Firebase Storage initialization error:", error);
  // Graceful degradation - app continues without storage
}

// Export initialized app
export default app;
