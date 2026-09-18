import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

/**
 * Firebase Modular Configuration for Rathore Mobiles
 * Project ID: rathore-mobiles-45ca8
 * Auth Domain: rathore-mobiles-45ca8.firebaseapp.com
 */
const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY || '').trim();

const firebaseConfig = {
  apiKey: apiKey || 'AIzaSy_PLACEHOLDER_KEY',
  authDomain: 'rathore-mobiles-45ca8.firebaseapp.com',
  projectId: 'rathore-mobiles-45ca8',
  storageBucket: 'rathore-mobiles-45ca8.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

let app = null;
let auth = null;
let initError = null;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
} catch (e) {
  console.warn('[Firebase Auth] Safe initialization notice:', e.message);
  initError = e.message;
}

export { app, auth, initError };
export const FIREBASE_AUTH_EMAIL = 'rathoremobiles07@gmail.com';
export default app;
