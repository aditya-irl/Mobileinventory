import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { Lock, Delete, ArrowRight, ShieldCheck } from 'lucide-react';


export const Login = () => {
  const { login } = useAuth();
  const { settings } = useInventory();

  const [enteredPin, setEnteredPin] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleDigitClick = (digit) => {
    if (enteredPin.length < 6) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      setError('');
      if (nextPin.length >= 4) {
        attemptLogin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin(prev => prev.slice(0, -1));
    setError('');
  };

  const attemptLogin = (pinToTest) => {
    const res = login(pinToTest);
    if (!res.success) {
      setIsShaking(true);
      setError(res.error || 'Incorrect PIN');
      setTimeout(() => {
        setIsShaking(false);
        setEnteredPin('');
      }, 500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key >= '0' && e.key <= '9') {
      handleDigitClick(e.key);
    } else if (e.key === 'Backspace') {
      handleDelete();
    } else if (e.key === 'Enter') {
      attemptLogin(enteredPin);
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        padding: '20px',
        outline: 'none'
      }}
    >
      <div
        className={`card ${isShaking ? 'animate-shake' : 'animate-scale-in'}`}
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '36px 28px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-xl)'
        }}
      >
        {/* App Logo */}
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
          <img
            src="/logo.svg"
            alt="PhoneVault"
            style={{ width: '64px', height: '64px', borderRadius: '16px' }}
          />
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {settings.storeName || 'PhoneVault Pro'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '4px', marginBottom: '24px' }}>
          Enter your 4-digit Passcode to access inventory.
        </p>

        {/* PIN Dots Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '24px' }}>
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: enteredPin.length > idx ? 'var(--primary-600)' : 'var(--bg-subtle)',
                border: '2px solid',
                borderColor: enteredPin.length > idx ? 'var(--primary-600)' : 'var(--border-strong)',
                transition: 'all var(--transition-fast)'
              }}
            />
          ))}
        </div>

        {error && (
          <div
            style={{
              color: '#ef4444',
              fontSize: '0.8125rem',
              fontWeight: 600,
              marginBottom: '16px'
            }}
          >
            {error}
          </div>
        )}

        {/* Touch Numpad */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            maxWidth: '260px',
            margin: '0 auto'
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigitClick(num)}
              className="btn btn-secondary"
              style={{
                height: '56px',
                fontSize: '1.25rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-lg)'
              }}
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigitClick('0')}
            className="btn btn-secondary"
            style={{
              height: '56px',
              fontSize: '1.25rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-lg)'
            }}
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="btn btn-subtle"
            style={{
              height: '56px',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text-muted)'
            }}
            title="Delete"
          >
            <Delete size={20} />
          </button>
        </div>

        <div style={{ marginTop: '24px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Default PIN is <strong style={{ color: 'var(--text-secondary)' }}>1234</strong>
        </div>
      </div>
    </div>
  );
};
