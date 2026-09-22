import React, { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { InventoryProvider } from './context/InventoryContext';

const Login = lazy(() => import('./pages/Login'));
const AppLayout = lazy(() => import('./layouts/AppLayout'));

const LoadingSplash = ({ message = 'Securing session...' }) => (
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
      width="56"
      height="56"
      style={{ width: '56px', height: '56px', borderRadius: '14px' }}
      fetchPriority="high"
    />
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--text-muted)',
        fontSize: '0.875rem',
        fontWeight: 600
      }}
    >
      <div
        style={{
          width: '16px',
          height: '16px',
          border: '2px solid var(--border-subtle)',
          borderTopColor: 'var(--primary-600)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite'
        }}
      />
      <span>{message}</span>
    </div>
  </div>
);

const MainApp = () => {
  const { isAuthenticated, loading } = useAuth();

  // Show a sleek splash/loading state while Firebase validates session persistence
  if (loading) {
    return <LoadingSplash message="Securing session..." />;
  }

  return (
    <Suspense fallback={<LoadingSplash message="Loading PhoneVault..." />}>
      {!isAuthenticated ? <Login /> : <AppLayout />}
    </Suspense>
  );
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
