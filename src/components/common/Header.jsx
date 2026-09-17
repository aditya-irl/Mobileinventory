import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Sun,
  Moon,
  RotateCw,
  Lock,
  HardDrive,
  Database,
  AlertCircle
} from 'lucide-react';

export const Header = ({ onSearchFocus, currentTab, setCurrentTab }) => {
  const {
    searchQuery,
    setSearchQuery,
    fetchInventory,
    refreshing,
    storageMode,
    connectionStatus,
    settings
  } = useInventory();
  const { isDark, toggleTheme } = useTheme();
  const { logout, isPinRequired } = useAuth();

  // Dynamic status rendering for pill
  const renderConnectionPill = () => {
    if (storageMode === 'google') {
      if (connectionStatus?.state === 'connected') {
        return (
          <div
            onClick={() => setCurrentTab('settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--status-available-bg)',
              color: 'var(--status-available-text)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid var(--status-available-border)'
            }}
            title="Google Sheets + Drive Database Active (Click to open Settings)"
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
            <Database size={13} />
            <span className="hide-mobile">Google Cloud</span>
          </div>
        );
      }

      if (connectionStatus?.state === 'checking') {
        return (
          <div
            onClick={() => setCurrentTab('settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(234, 179, 8, 0.15)',
              color: '#eab308',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid rgba(234, 179, 8, 0.3)'
            }}
            title="Connecting to Google Cloud..."
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#eab308', display: 'inline-block' }} />
            <RotateCw size={13} className="animate-spin" />
            <span className="hide-mobile">Connecting...</span>
          </div>
        );
      }

      // Failed state
      return (
        <div
          onClick={() => setCurrentTab('settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--status-danger-bg)',
            color: 'var(--status-danger-text)',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: '1px solid var(--status-danger-border)'
          }}
          title={`Google Cloud Connection Failed: ${connectionStatus?.error || 'Click to view Settings'}`}
        >
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }} />
          <AlertCircle size={13} />
          <span className="hide-mobile">Connection Failed</span>
        </div>
      );
    }

    // Local Storage Mode
    return (
      <div
        onClick={() => setCurrentTab('settings')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--bg-subtle)',
          color: 'var(--text-secondary)',
          fontSize: '0.75rem',
          fontWeight: 600,
          cursor: 'pointer',
          border: '1px solid var(--border-subtle)'
        }}
        title="Local Storage Database Active (Click to configure Google Cloud)"
      >
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--text-muted)', display: 'inline-block' }} />
        <HardDrive size={13} />
        <span className="hide-mobile">Local Storage</span>
      </div>
    );
  };

  return (
    <header
      className="card-glass"
      style={{
        height: 'var(--header-height)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid var(--border-subtle)'
      }}
    >
      {/* Search Input */}
      <div style={{ flex: 1, maxWidth: '420px', position: 'relative' }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none'
          }}
        />
        <input
          type="text"
          placeholder="Search by IMEI, Model, ID, Supplier..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (currentTab !== 'inventory' && e.target.value.trim().length > 0) {
              setCurrentTab('inventory');
            }
          }}
          onFocus={onSearchFocus}
          className="input"
          style={{
            paddingLeft: '36px',
            paddingRight: '12px',
            height: '38px',
            fontSize: '0.8125rem',
            backgroundColor: 'var(--bg-subtle)'
          }}
        />
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Backend Connection Indicator Pill */}
        {renderConnectionPill()}

        {/* Refresh button */}
        <button
          className="btn btn-secondary btn-icon"
          onClick={() => fetchInventory(true)}
          title="Refresh Inventory"
          style={{ width: '36px', height: '36px' }}
        >
          <RotateCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>

        {/* Theme Toggle */}
        <button
          className="btn btn-secondary btn-icon"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{ width: '36px', height: '36px' }}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Lock Store / Logout */}
        {isPinRequired && (
          <button
            className="btn btn-secondary btn-icon"
            onClick={logout}
            title="Lock Store / Log Out"
            style={{ width: '36px', height: '36px' }}
          >
            <Lock size={16} />
          </button>
        )}
      </div>
    </header>
  );
};
