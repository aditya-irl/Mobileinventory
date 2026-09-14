import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
const AUTH_STORAGE_KEY = 'phonevault_auth_session';
const PIN_STORAGE_KEY = 'phonevault_custom_pin';

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true';
  });

  const [pin, setPin] = useState(() => {
    return localStorage.getItem(PIN_STORAGE_KEY) || import.meta.env.VITE_DEFAULT_AUTH_PIN || '1234';
  });

  const [isPinRequired, setIsPinRequired] = useState(() => {
    const saved = localStorage.getItem('phonevault_pin_required');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem(PIN_STORAGE_KEY, pin);
  }, [pin]);

  useEffect(() => {
    localStorage.setItem('phonevault_pin_required', String(isPinRequired));
  }, [isPinRequired]);

  const login = (enteredPin) => {
    if (!isPinRequired || enteredPin === pin) {
      setIsAuthenticated(true);
      sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
      return { success: true };
    }
    return { success: false, error: 'Incorrect Passcode / PIN. Please try again.' };
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const updatePin = (oldPin, newPin) => {
    if (oldPin !== pin) {
      return { success: false, error: 'Current PIN does not match.' };
    }
    if (!newPin || newPin.length < 4) {
      return { success: false, error: 'New PIN must be at least 4 digits.' };
    }
    setPin(newPin);
    return { success: true, message: 'PIN updated successfully.' };
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !isPinRequired || isAuthenticated,
        isPinRequired,
        setIsPinRequired,
        login,
        logout,
        updatePin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
