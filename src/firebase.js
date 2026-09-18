import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

/**
 * Firebase Modular Configuration for Rathore Mobiles
 * Project ID: rathore-mobiles-45ca8
 * Auth Domain: rathore-mobiles-45ca8.firebaseapp.com
 */
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCNRtTnG2yLjKG37pSjBona9IHsdd5ma2I',
  authDomain: 'rathore-mobiles-45ca8.firebaseapp.com',
  projectId: 'rathore-mobiles-45ca8',
  storageBucket: 'rathore-mobiles-45ca8.firebasestorage.app',
  messagingSenderId: '106437299554',
  appId: '1:106437299554:web:96e2beee3426b38daeb659'
};

const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey || '').trim();
const authDomain = (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain || '').trim();
const projectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId || '').trim();
const storageBucket = (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket || '').trim();
const messagingSenderId = (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId || '').trim();
const appId = (import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId || '').trim();
const measurementId = (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '').trim();

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  ...(measurementId ? { measurementId } : {})
};

let app = null;
let auth = null;
let initError = null;

try {
  if (apiKey) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
  } else {
    initError = 'Firebase Web API Key is missing.';
  }
} catch (e) {
  console.warn('[Firebase Auth] Safe initialization notice:', e.message);
  initError = e.message;
}

export { app, auth, initError, firebaseConfig };
export const FIREBASE_AUTH_EMAIL = 'rathoremobiles07@gmail.com';
export default app;
