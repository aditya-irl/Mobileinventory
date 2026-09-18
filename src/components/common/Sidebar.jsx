import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  LayoutDashboard,
  Smartphone,
  PlusCircle,
  ShoppingBag,
  BarChart3,
  Settings,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export const Sidebar = ({ currentTab, setCurrentTab }) => {
  const { inventory, purchases, statistics, settings } = useInventory();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Smartphone,
      badge: statistics.available
    },
    {
      id: 'purchases',
      label: 'Buyback / Purchases',
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
      label: 'Sold Items',
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
      label: 'Settings',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        transition: 'background-color var(--transition-normal)'
      }}
      className="hide-mobile"
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '20px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <img
          src="/logo.svg"
          alt="Rathore Mobiles Logo"
          style={{ width: '38px', height: '38px', borderRadius: '10px' }}
        />
        <div>
          <div
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 800,
              fontSize: '1.05rem',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              lineHeight: 1.2
            }}
          >
            {settings.storeName || 'Rathore Mobiles'}
          </div>
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Sparkles size={11} color="#6366f1" />
            Inventory & Buyback OS
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav
        style={{
          flex: 1,
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          overflowY: 'auto'
        }}
      >
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: isActive
                  ? 'var(--primary-50)'
                  : 'transparent',
                color: isActive
                  ? 'var(--primary-600)'
                  : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={18} color={isActive ? 'var(--primary-600)' : 'currentColor'} />
                <span>{item.label}</span>
              </div>

              {item.badge !== null && item.badge !== undefined && (
                <span
                  style={{
                    fontSize: '0.75rem',
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

      {/* Footer Info */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-subtle)',
          margin: '12px',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Available Stock
        </div>
        <div
          style={{
            fontSize: '1.15rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginTop: '2px'
          }}
        >
          {statistics.available} / {statistics.totalStock} Phones
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Buyback Records: <strong style={{ color: '#059669' }}>{purchases.length} units</strong>
        </div>
      </div>
    </aside>
  );
};
