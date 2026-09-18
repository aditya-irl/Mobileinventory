import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';
import { auth, initError, FIREBASE_AUTH_EMAIL } from '../firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(initError || null);

  useEffect(() => {
    const rawApiKey = (import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCNRtTnG2yLjKG37pSjBona9IHsdd5ma2I').trim();

    // If no real API key is configured yet, complete loading immediately to show the login screen
    if (!rawApiKey || !auth) {
      setLoading(false);
      return;
    }

    try {
      setPersistence(auth, browserLocalPersistence).catch((err) => {
        console.warn('[Firebase Auth] Persistence setup error:', err);
      });
    } catch (e) {
      console.warn('[Firebase Auth] Persistence error:', e);
    }

    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          setCurrentUser(user);
          setLoading(false);
        },
        (error) => {
          console.warn('[Firebase Auth] onAuthStateChanged warning:', error);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('[Firebase Auth] State listener error:', err);
      setLoading(false);
    }

    // Failsafe timeout so loading NEVER gets stuck indefinitely
    const failsafe = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => {
      clearTimeout(failsafe);
      unsubscribe();
    };
  }, []);

  /**
   * Authenticate using Firebase Email/Password with the designated Rathore Mobiles user
   * Password/PIN is entered by user at runtime and never hard-coded.
   */
  const login = async (enteredPin) => {
    const rawApiKey = (import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCNRtTnG2yLjKG37pSjBona9IHsdd5ma2I').trim();

    if (!rawApiKey) {
      return {
        success: false,
        error: 'Firebase Web API Key is missing. Please add VITE_FIREBASE_API_KEY to your .env file.'
      };
    }

    if (!enteredPin || !enteredPin.trim()) {
      return { success: false, error: 'Please enter your Passcode / PIN.' };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        FIREBASE_AUTH_EMAIL,
        enteredPin.trim()
      );
      setCurrentUser(userCredential.user);
      return { success: true, user: userCredential.user };
    } catch (err) {
      console.error('[Firebase Auth] Sign in error:', err.code, err.message);

      let friendlyError = 'Authentication failed. Please check your PIN.';

      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/invalid-password':
          friendlyError = 'Incorrect PIN / Passcode. Please try again.';
          break;
        case 'auth/user-not-found':
          friendlyError = `User account (${FIREBASE_AUTH_EMAIL}) not found.`;
          break;
        case 'auth/too-many-requests':
          friendlyError = 'Access temporarily locked due to multiple failed attempts. Please wait a moment.';
          break;
        case 'auth/network-request-failed':
          friendlyError = 'Network error. Please check your internet connection.';
          break;
        case 'auth/invalid-api-key':
        case 'auth/api-key-not-valid.':
          friendlyError = 'Firebase API Key is invalid. Please verify VITE_FIREBASE_API_KEY in .env.';
          break;
        case 'auth/user-disabled':
          friendlyError = 'This user account has been disabled in Firebase.';
          break;
        default:
          friendlyError = err.message || 'Incorrect PIN / Passcode.';
          break;
      }

      return { success: false, error: friendlyError, code: err.code };
    }
  };

  /**
   * Change PIN/Password for currently authenticated Firebase user
   * Re-authenticates with currentPin before calling updatePassword
   */
  const changePin = async (currentPin, newPin) => {
    if (!auth || !auth.currentUser) {
      return {
        success: false,
        error: 'No active authenticated session found. Please log in again.'
      };
    }

    if (!currentPin || !currentPin.trim()) {
      return { success: false, error: 'Current PIN is required.' };
    }

    if (!newPin || !newPin.trim()) {
      return { success: false, error: 'New PIN is required.' };
    }

    const trimmedCurrent = currentPin.trim();
    const trimmedNew = newPin.trim();

    if (trimmedCurrent === trimmedNew) {
      return { success: false, error: 'New PIN cannot be the same as current PIN.' };
    }

    try {
      const email = auth.currentUser.email || FIREBASE_AUTH_EMAIL;
      // 1. Re-authenticate user with current PIN/password
      const credential = EmailAuthProvider.credential(email, trimmedCurrent);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // 2. Update to new PIN/password
      await updatePassword(auth.currentUser, trimmedNew);

      return { success: true };
    } catch (err) {
      // NOTE: Do not log PINs or sensitive data to console
      console.warn('[Firebase Auth] Change PIN notice: code =', err.code);

      let friendlyError = 'Failed to update PIN. Please try again.';

      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/invalid-password':
          friendlyError = 'Current PIN is incorrect.';
          break;
        case 'auth/weak-password':
          friendlyError = 'New PIN is too weak. Firebase requires at least 6 characters.';
          break;
        case 'auth/requires-recent-login':
          friendlyError = 'Security session expired. Please log out and sign in again.';
          break;
        case 'auth/too-many-requests':
          friendlyError = 'Too many failed attempts. Please wait a moment and try again.';
          break;
        case 'auth/network-request-failed':
          friendlyError = 'Network error. Please check your internet connection.';
          break;
        case 'auth/user-mismatch':
          friendlyError = 'Authenticated user mismatch.';
          break;
        default:
          friendlyError = err.message || 'Failed to update PIN.';
          break;
      }

      return { success: false, error: friendlyError, code: err.code };
    }
  };

  /**
   * Log out of Firebase session
   */
  const logout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('[Firebase Auth] Sign out error:', err);
      }
    }
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        loading,
        configError,
        login,
        logout,
        changePin,
        authEmail: FIREBASE_AUTH_EMAIL
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

