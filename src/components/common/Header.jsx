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
  LogOut,
  HardDrive,
  Database,
  AlertCircle,
  Menu
} from 'lucide-react';

export const Header = ({ onSearchFocus, currentTab, setCurrentTab, onOpenDrawer }) => {
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
  const { logout, isAuthenticated } = useAuth();

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
              padding: '4px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--status-available-bg)',
              color: 'var(--status-available-text)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid var(--status-available-border)',
              flexShrink: 0
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
              padding: '4px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(234, 179, 8, 0.15)',
              color: '#eab308',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              flexShrink: 0
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
            padding: '4px 8px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--status-danger-bg)',
            color: 'var(--status-danger-text)',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: '1px solid var(--status-danger-border)',
            flexShrink: 0
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
          padding: '4px 8px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--bg-subtle)',
          color: 'var(--text-secondary)',
          fontSize: '0.75rem',
          fontWeight: 600,
          cursor: 'pointer',
          border: '1px solid var(--border-subtle)',
          flexShrink: 0
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
      className="hide-mobile"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 24px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        gap: '12px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Mobile Menu & Branding (Visible on Mobile) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={onOpenDrawer}
          className="btn btn-secondary btn-icon hide-desktop"
          style={{ width: '38px', height: '38px', padding: 0, flexShrink: 0 }}
          title="Open Menu"
        >
          <Menu size={20} />
        </button>

        <div className="hide-desktop" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
          <img
            src="/logo.svg"
            alt="Logo"
            style={{ width: '28px', height: '28px', borderRadius: '6px' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 800,
              fontSize: '0.9rem',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              maxWidth: 'clamp(60px, 18vw, 120px)',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {settings.storeName || 'Rathore Mobiles'}
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ flex: 1, minWidth: '100px', maxWidth: '420px', position: 'relative' }}>
        <Search
          size={15}
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none'
          }}
        />
        <input
          type="text"
          placeholder="Search inventory..."
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
            paddingLeft: '32px',
            paddingRight: '8px',
            height: '38px',
            fontSize: '0.8125rem',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)'
          }}
        />
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {/* Backend Connection Indicator Pill */}
        {renderConnectionPill()}

        {/* Refresh button */}
        <button
          className="btn btn-secondary btn-icon"
          onClick={() => fetchInventory(true)}
          title="Refresh Inventory"
          style={{ width: '36px', height: '36px', flexShrink: 0 }}
        >
          <RotateCw size={15} className={refreshing ? 'animate-spin' : ''} />
        </button>

        {/* Theme Toggle (Desktop Only or compact) */}
        <button
          className="btn btn-secondary btn-icon hide-mobile"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{ width: '36px', height: '36px', flexShrink: 0 }}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Firebase Logout (Desktop Only - mobile has it in drawer) */}
        {isAuthenticated && (
          <button
            className="btn btn-secondary btn-icon hide-mobile"
            onClick={logout}
            title="Log Out"
            style={{ width: '36px', height: '36px', color: 'var(--text-secondary)', flexShrink: 0 }}
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </header>
  );
};
