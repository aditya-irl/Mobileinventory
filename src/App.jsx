import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { InventoryProvider } from './context/InventoryContext';
import { AppLayout } from './layouts/AppLayout';
import { Login } from './pages/Login';
import { RotateCw } from 'lucide-react';

const MainApp = () => {
  const { isAuthenticated, loading } = useAuth();

  // Show a sleek splash/loading state while Firebase validates session persistence
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-app)',
          gap: '16px'
        }}
      >
        <img
          src="/logo.svg"
          alt="Rathore Mobiles Logo"
          style={{ width: '56px', height: '56px', borderRadius: '14px' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
          <RotateCw size={18} className="animate-spin" color="var(--primary-600)" />
          <span>Securing session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <AppLayout />;
};

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <InventoryProvider>
            <MainApp />
          </InventoryProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
