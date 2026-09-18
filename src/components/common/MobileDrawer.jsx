import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Smartphone,
  PlusCircle,
  ShoppingBag,
  BarChart3,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
  Sun,
  Moon,
  LogOut,
  Database,
  HardDrive
} from 'lucide-react';

export const MobileDrawer = ({ isOpen, onClose, currentTab, setCurrentTab }) => {
  const { inventory, purchases, statistics, settings, storageMode } = useInventory();
  const { isDark, toggleTheme } = useTheme();
  const { currentUser, logout, isAuthenticated, authEmail } = useAuth();

  if (!isOpen) return null;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'inventory',
      label: 'Mobile Inventory',
      icon: Smartphone,
      badge: statistics.available
    },
    {
      id: 'purchases',
      label: 'Used Phone Buyback',
      icon: ShieldCheck,
      badge: purchases.length || null
    },
    {
      id: 'add',
      label: 'Add Inventory',
      icon: PlusCircle,
      badge: null,
      highlight: true
    },
    {
      id: 'sold',
      label: 'Sold Devices',
      icon: ShoppingBag,
      badge: statistics.sold
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
      badge: null
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: Settings,
      badge: null
    }
  ];

  const handleSelect = (tabId) => {
    setCurrentTab(tabId);
    onClose();
  };

  return (
    <div className="drawer-backdrop hide-desktop" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Header Branding & Close Button */}
        <div
          style={{
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/logo.svg"
              alt="Logo"
              style={{ width: '34px', height: '34px', borderRadius: '8px' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div>
              <div
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontWeight: 800,
                  fontSize: '1rem',
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  lineHeight: 1.2
                }}
              >
                {settings.storeName || 'PhoneVault Pro'}
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <Sparkles size={10} color="#6366f1" />
                Mobile Inventory OS
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation List */}
        <nav
          style={{
            flex: 1,
            padding: '14px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            overflowY: 'auto'
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: isActive
                    ? 'var(--primary-50)'
                    : item.highlight
                    ? 'rgba(99, 102, 241, 0.06)'
                    : 'transparent',
                  color: isActive
                    ? 'var(--primary-600)'
                    : item.highlight
                    ? 'var(--primary-600)'
                    : 'var(--text-primary)',
                  fontWeight: isActive || item.highlight ? 700 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  minHeight: '44px',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} color={isActive ? 'var(--primary-600)' : 'currentColor'} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== null && item.badge !== undefined && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: isActive
                        ? 'var(--primary-600)'
                        : 'var(--bg-subtle)',
                      color: isActive ? '#ffffff' : 'var(--text-secondary)'
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Drawer Footer Controls */}
        <div
          style={{
            padding: '14px 16px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {/* Quick theme toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Theme: {isDark ? 'Dark Mode' : 'Light Mode'}
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="btn btn-secondary btn-sm"
              style={{ padding: '4px 10px', height: '32px' }}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              <span>{isDark ? 'Light' : 'Dark'}</span>
            </button>
          </div>

          {/* User Account & Logout */}
          {isAuthenticated && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Firebase Account
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {currentUser?.email || authEmail || 'rathoremobiles07@gmail.com'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  logout();
                }}
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 10px', height: '34px', color: 'var(--status-danger-text)' }}
                title="Log Out"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileDrawer;
