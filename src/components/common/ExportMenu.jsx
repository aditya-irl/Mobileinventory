import React, { useState, useRef, useEffect } from 'react';
import { Download, FileJson, FileSpreadsheet, ChevronDown } from 'lucide-react';

export const ExportMenu = ({ onExportJSON, onExportCSV, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={menuRef}>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '38px' }}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Download size={15} />
        <span>Export Data</span>
        <ChevronDown
          size={14}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        />
      </button>

      {isOpen && (
        <div
          className="card animate-fade-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 100,
            minWidth: '200px',
            maxWidth: 'calc(100vw - 32px)',
            padding: '6px',
            boxShadow: 'var(--shadow-lg, 0 10px 25px -5px rgba(0, 0, 0, 0.25))',
            borderRadius: 'var(--radius-md, 10px)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)'
          }}
          role="menu"
        >
          <div
            style={{
              padding: '6px 10px 4px',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              letterSpacing: '0.04em'
            }}
          >
            Export Data
          </div>

          <button
            type="button"
            className="btn btn-subtle"
            onClick={() => {
              setIsOpen(false);
              if (onExportJSON) onExportJSON();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '10px',
              padding: '8px 12px',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-sm, 6px)',
              textAlign: 'left'
            }}
            role="menuitem"
          >
            <FileJson size={16} style={{ color: 'var(--primary-600, #4f46e5)' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600 }}>Export JSON</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Full system backup</span>
            </div>
          </button>

          <button
            type="button"
            className="btn btn-subtle"
            onClick={() => {
              setIsOpen(false);
              if (onExportCSV) onExportCSV();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '10px',
              padding: '8px 12px',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-sm, 6px)',
              textAlign: 'left',
              marginTop: '2px'
            }}
            role="menuitem"
          >
            <FileSpreadsheet size={16} style={{ color: '#059669' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600 }}>Export CSV</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Spreadsheet format (UTF-8)</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;
