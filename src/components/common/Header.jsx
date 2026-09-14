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
  Database
} from 'lucide-react';


export const Header = ({ onSearchFocus, currentTab, setCurrentTab }) => {
  const {
    searchQuery,
    setSearchQuery,
    fetchInventory,
    refreshing,
    connectionMode,
    settings
  } = useInventory();
  const { isDark, toggleTheme } = useTheme();
  const { logout, isPinRequired } = useAuth();

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
        <div
          onClick={() => setCurrentTab('settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            backgroundColor:
              connectionMode === 'google'
                ? 'var(--status-available-bg)'
                : 'var(--bg-subtle)',
            color:
              connectionMode === 'google'
                ? 'var(--status-available-text)'
                : 'var(--text-secondary)',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: `1px solid ${
              connectionMode === 'google'
                ? 'var(--status-available-border)'
                : 'var(--border-subtle)'
            }`
          }}
          title={
            connectionMode === 'google'
              ? 'Connected to Google Sheets & Drive'
              : 'Running in Local Storage / Demo Mode (Click to configure Google Sheets)'
          }
        >
          {connectionMode === 'google' ? (
            <>
              <Database size={13} />
              <span className="hide-mobile">Google Cloud</span>
            </>
          ) : (
            <>
              <HardDrive size={13} />
              <span className="hide-mobile">Local Mode</span>
            </>
          )}
        </div>

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
