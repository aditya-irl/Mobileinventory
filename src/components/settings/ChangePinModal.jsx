import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, Lock, Eye, EyeOff, RotateCw, AlertCircle, X, ShieldCheck } from 'lucide-react';

export const ChangePinModal = ({ isOpen, onClose, onSuccess }) => {
  const { changePin } = useAuth();

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (loading) return;
    // Reset all state on close
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setShowCurrentPin(false);
    setShowNewPin(false);
    setShowConfirmPin(false);
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    setError('');

    // Validation 1: Current PIN is required
    if (!currentPin || !currentPin.trim()) {
      setError('Current PIN is required.');
      return;
    }

    // Validation 2: New PIN is required
    if (!newPin || !newPin.trim()) {
      setError('New PIN is required.');
      return;
    }

    const trimmedCurrent = currentPin.trim();
    const trimmedNew = newPin.trim();
    const trimmedConfirm = confirmPin.trim();

    // Validation 3: New PIN should be 4-6 digits
    const pinDigitsRegex = /^\d{4,6}$/;
    if (!pinDigitsRegex.test(trimmedNew)) {
      setError('New PIN must be 4 to 6 digits (numbers only).');
      return;
    }

    // Validation 4: Confirmation must match
    if (!trimmedConfirm) {
      setError('Please confirm your new PIN.');
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      setError('New PIN and confirmation PIN do not match.');
      return;
    }

    // Validation 5: Do not allow new PIN to be the same as current PIN
    if (trimmedNew === trimmedCurrent) {
      setError('New PIN cannot be the same as current PIN.');
      return;
    }

    setLoading(true);

    try {
      const result = await changePin(trimmedCurrent, trimmedNew);

      if (result.success) {
        setLoading(false);
        handleClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setLoading(false);
        setError(result.error || 'Failed to change PIN. Please try again.');
      }
    } catch (err) {
      setLoading(false);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div
        className="modal-content animate-scale-in"
        style={{ maxWidth: '440px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-50)',
                color: 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <KeyRound size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                Change Security PIN
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
                Update your Firebase authentication passcode
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: 'var(--text-muted)',
              padding: '4px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Error Message Alert */}
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
                  alignItems: 'flex-start',
                  gap: '8px',
                  lineHeight: 1.4
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            {/* Current PIN */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ marginBottom: '6px' }}>
                <span>Current PIN</span>
                <span className="required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrentPin ? 'text' : 'password'}
                  inputMode="numeric"
                  autoComplete="current-password"
                  placeholder="Enter current PIN"
                  value={currentPin}
                  onChange={(e) => {
                    setCurrentPin(e.target.value);
                    setError('');
                  }}
                  disabled={loading}
                  className="input"
                  style={{
                    height: '44px',
                    fontSize: '1rem',
                    letterSpacing: showCurrentPin ? 'normal' : '0.15em',
                    paddingLeft: '38px',
                    paddingRight: '40px',
                    fontWeight: 600
                  }}
                  autoFocus
                />
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  <Lock size={16} />
                </div>
                <button
                  type="button"
                  onClick={() => setShowCurrentPin(!showCurrentPin)}
                  tabIndex={-1}
                  title={showCurrentPin ? 'Hide PIN' : 'Show PIN'}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showCurrentPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New PIN */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ marginBottom: '6px' }}>
                <span>New PIN (4–6 digits)</span>
                <span className="required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPin ? 'text' : 'password'}
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={6}
                  placeholder="Enter new 4–6 digit PIN"
                  value={newPin}
                  onChange={(e) => {
                    setNewPin(e.target.value);
                    setError('');
                  }}
                  disabled={loading}
                  className="input"
                  style={{
                    height: '44px',
                    fontSize: '1rem',
                    letterSpacing: showNewPin ? 'normal' : '0.15em',
                    paddingLeft: '38px',
                    paddingRight: '40px',
                    fontWeight: 600
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  <KeyRound size={16} />
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewPin(!showNewPin)}
                  tabIndex={-1}
                  title={showNewPin ? 'Hide PIN' : 'Show PIN'}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showNewPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New PIN */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ marginBottom: '6px' }}>
                <span>Confirm New PIN</span>
                <span className="required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPin ? 'text' : 'password'}
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={6}
                  placeholder="Re-enter new PIN"
                  value={confirmPin}
                  onChange={(e) => {
                    setConfirmPin(e.target.value);
                    setError('');
                  }}
                  disabled={loading}
                  className="input"
                  style={{
                    height: '44px',
                    fontSize: '1rem',
                    letterSpacing: showConfirmPin ? 'normal' : '0.15em',
                    paddingLeft: '38px',
                    paddingRight: '40px',
                    fontWeight: 600
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  <ShieldCheck size={16} />
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmPin(!showConfirmPin)}
                  tabIndex={-1}
                  title={showConfirmPin ? 'Hide PIN' : 'Show PIN'}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showConfirmPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !currentPin || !newPin || !confirmPin}
              style={{ minWidth: '120px' }}
            >
              {loading ? (
                <>
                  <RotateCw size={15} className="animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <KeyRound size={15} />
                  <span>Change PIN</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePinModal;
