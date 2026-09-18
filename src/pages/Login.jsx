import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { Lock, Eye, EyeOff, RotateCw, AlertCircle, Sparkles, Delete, KeyRound } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const { settings } = useInventory();

  const [enteredPin, setEnteredPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const inputRef = useRef(null);

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleDigitClick = (digit) => {
    if (loading) return;
    setError('');
    setEnteredPin(prev => {
      const next = prev + digit;
      return next;
    });
  };

  const handleDelete = () => {
    if (loading) return;
    setEnteredPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    if (loading) return;
    setEnteredPin('');
    setError('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    if (!enteredPin || !enteredPin.trim()) {
      setError('Please enter your PIN.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    setLoading(true);
    setError('');

    const res = await login(enteredPin);
    setLoading(false);

    if (!res.success) {
      setIsShaking(true);
      setError(res.error || 'Incorrect PIN / Passcode.');
      setTimeout(() => {
        setIsShaking(false);
        if (inputRef.current) inputRef.current.focus();
      }, 500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const storeTitle = settings?.storeName || 'Rathore Mobiles';

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        padding: 'max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Subtle Background Glow */}
      <div
        style={{
          position: 'absolute',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--primary-glow) 0%, rgba(99, 102, 241, 0) 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Main Login Card */}
      <div
        className={`card ${isShaking ? 'animate-shake' : 'animate-scale-in'}`}
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: 'clamp(20px, 5vw, 32px) clamp(16px, 4vw, 24px)',
          textAlign: 'center',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
          zIndex: 1,
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        {/* App Branding Header */}
        <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '20px',
              backgroundColor: 'var(--primary-50)',
              border: '1px solid var(--primary-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <img
              src="/logo.svg"
              alt="Rathore Mobiles Logo"
              style={{ width: '46px', height: '46px', borderRadius: '12px' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>

        <h1
          style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            margin: '0 0 4px 0'
          }}
        >
          {storeTitle}
        </h1>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.84rem',
            fontWeight: 600,
            marginTop: '0',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px'
          }}
        >
          <Sparkles size={13} color="var(--primary-600)" />
          <span>Secure Inventory Access</span>
        </p>



        {/* Error Alert Message */}
        {error && (
          <div
            className="animate-fade-in"
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--status-danger-bg)',
              border: '1px solid var(--status-danger-border)',
              color: 'var(--status-danger-text)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '20px',
              textAlign: 'left'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Password / PIN Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
          <div className="form-group" style={{ marginBottom: '16px', position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <input
                ref={inputRef}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                autoComplete="current-password"
                placeholder="Enter PIN"
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value);
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="input"
                style={{
                  height: '52px',
                  fontSize: '1.2rem',
                  letterSpacing: showPin ? 'normal' : '0.25em',
                  textAlign: 'center',
                  paddingLeft: '44px',
                  paddingRight: '44px',
                  fontWeight: 700,
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  border: error ? '1.5px solid var(--status-danger-border)' : '1px solid var(--border-strong)'
                }}
              />

              {/* Left Key Icon */}
              <div
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none'
                }}
              >
                <KeyRound size={18} />
              </div>

              {/* Show / Hide Toggle Button */}
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                tabIndex={-1}
                title={showPin ? 'Hide PIN' : 'Show PIN'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Unlock Submit Button */}
          <button
            type="submit"
            disabled={loading || !enteredPin}
            className="btn btn-primary"
            style={{
              width: '100%',
              height: '48px',
              fontSize: '0.95rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-md)',
              opacity: loading || !enteredPin ? 0.75 : 1,
              cursor: loading || !enteredPin ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (
              <>
                <RotateCw size={18} className="animate-spin" />
                <span>Unlocking...</span>
              </>
            ) : (
              <>
                <Lock size={17} />
                <span>Unlock</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Touch Numpad for Mobile / Touchscreens */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            maxWidth: '280px',
            margin: '0 auto',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              disabled={loading}
              onClick={() => handleDigitClick(num)}
              className="btn btn-secondary"
              style={{
                height: '46px',
                fontSize: '1.15rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-subtle)'
              }}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            disabled={loading || !enteredPin}
            onClick={handleClear}
            className="btn btn-subtle"
            style={{
              height: '46px',
              fontSize: '0.72rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)'
            }}
          >
            Clear
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleDigitClick('0')}
            className="btn btn-secondary"
            style={{
              height: '46px',
              fontSize: '1.15rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-subtle)'
            }}
          >
            0
          </button>
          <button
            type="button"
            disabled={loading || !enteredPin}
            onClick={handleDelete}
            className="btn btn-subtle"
            style={{
              height: '46px',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Backspace"
          >
            <Delete size={18} />
          </button>
        </div>

        {/* Security Footer Note */}
        <div
          style={{
            marginTop: '20px',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <Lock size={11} />
          <span>Protected with Firebase Authentication</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
