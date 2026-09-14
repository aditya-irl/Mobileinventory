import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, RefreshCw, Check, Sparkles } from 'lucide-react';

export const BarcodeScannerModal = ({ isOpen, onClose, onScanComplete }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const videoRef = useRef(null);

  useEffect(() => {
    let stream = null;

    if (isOpen && cameraActive) {
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch((err) => {
          console.warn('Camera access not granted or not available:', err);
          setCameraActive(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, cameraActive]);

  if (!isOpen) return null;

  const handleGenerateRandomIMEI = () => {
    // Generate a valid 15-digit TAC + SNR
    const prefix = '35' + Math.floor(100000 + Math.random() * 900000);
    const suffix = Math.floor(1000000 + Math.random() * 9000000);
    const mockImei = prefix + suffix;
    onScanComplete(mockImei);
    onClose();
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScanComplete(manualInput.trim());
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '440px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={18} color="var(--primary-600)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Scan IMEI / Barcode</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {cameraActive ? (
            <div
              style={{
                width: '100%',
                height: '220px',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                position: 'relative',
                backgroundColor: '#000'
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: '20px',
                  border: '2px dashed #10b981',
                  borderRadius: 'var(--radius-md)',
                  pointerEvents: 'none'
                }}
              />
            </div>
          ) : (
            <div
              style={{
                padding: '24px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center'
              }}
            >
              <Camera size={36} color="var(--primary-600)" style={{ margin: '0 auto 10px auto' }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Camera Scan Ready</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Point your phone camera at the device box barcode or IMEI sticker.
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setCameraActive(true)}
                style={{ marginTop: '14px' }}
              >
                Start Camera
              </button>
            </div>
          )}

          {/* Quick Simulation / Helper */}
          <div
            style={{
              padding: '12px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-surface)'
            }}
          >
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Quick Test Helper</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Generate random 15-digit IMEI</div>
            </div>
            <button
              className="btn btn-subtle btn-sm"
              onClick={handleGenerateRandomIMEI}
            >
              <Sparkles size={14} color="#6366f1" /> Auto-Fill
            </button>
          </div>

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSubmit}>
            <div className="form-group">
              <label className="form-label">Or Type / Paste IMEI</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  maxLength={16}
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="e.g. 354892091823912"
                  className="input"
                />
                <button type="submit" className="btn btn-primary">
                  <Check size={16} />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
