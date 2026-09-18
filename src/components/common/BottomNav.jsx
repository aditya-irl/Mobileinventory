import React from 'react';
import {
  LayoutDashboard,
  Smartphone,
  Plus,
  ShieldCheck,
  ShoppingBag,
  BarChart3
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export const BottomNav = ({ currentTab, setCurrentTab }) => {
  const { statistics, purchases } = useInventory();

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'inventory', label: 'Stock', icon: Smartphone, badge: statistics.available },
    { id: 'purchases', label: 'Buyback', icon: ShieldCheck, badge: purchases.length },
    { id: 'add', label: 'Add', icon: Plus, isAction: true },
    { id: 'sold', label: 'Sold', icon: ShoppingBag, badge: statistics.sold }
  ];

  return (
    <nav
      className="hide-desktop"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))',
        backgroundColor: 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderTop: '1px solid var(--border-subtle)',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
        userSelect: 'none'
      }}
    >
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        if (tab.isAction) {
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-600)',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px var(--primary-glow)',
                cursor: 'pointer',
                transform: 'translateY(-8px)',
                transition: 'transform var(--transition-fast)'
              }}
              title="Add Phone"
            >
              <Icon size={24} strokeWidth={2.5} />
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              color: isActive ? 'var(--primary-600)' : 'var(--text-muted)',
              cursor: 'pointer',
              position: 'relative',
              padding: '6px 0',
              gap: '3px'
            }}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
              {tab.badge !== undefined && tab.badge !== null && tab.badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-8px',
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    backgroundColor: isActive ? 'var(--primary-600)' : 'var(--text-secondary)',
                    color: '#ffffff',
                    padding: '1px 4px',
                    borderRadius: '999px',
                    minWidth: '14px',
                    textAlign: 'center'
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: isActive ? 700 : 500
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
