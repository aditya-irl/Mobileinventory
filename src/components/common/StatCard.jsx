import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'primary', onClick }) => {
  const colorStyles = {
    primary: {
      bg: 'var(--bg-surface)',
      border: 'var(--border-subtle)',
      iconBg: 'var(--primary-50)',
      iconColor: 'var(--primary-600)'
    },
    emerald: {
      bg: 'var(--bg-surface)',
      border: 'var(--border-subtle)',
      iconBg: 'var(--status-available-bg)',
      iconColor: 'var(--status-available-text)'
    },
    amber: {
      bg: 'var(--bg-surface)',
      border: 'var(--border-subtle)',
      iconBg: 'var(--status-reserved-bg)',
      iconColor: 'var(--status-reserved-text)'
    },
    blue: {
      bg: 'var(--bg-surface)',
      border: 'var(--border-subtle)',
      iconBg: 'var(--status-sold-bg)',
      iconColor: 'var(--status-sold-text)'
    },
    pink: {
      bg: 'var(--bg-surface)',
      border: 'var(--border-subtle)',
      iconBg: 'var(--status-repair-bg)',
      iconColor: 'var(--status-repair-text)'
    }
  };

  const scheme = colorStyles[color] || colorStyles.primary;

  return (
    <div
      className="card card-interactive"
      onClick={onClick}
      style={{
        padding: '18px 20px',
        backgroundColor: scheme.bg,
        borderColor: scheme.border,
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {title}
        </span>
        {Icon && (
          <div
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: scheme.iconBg,
              color: scheme.iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      <div>
        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            lineHeight: 1.15
          }}
        >
          {value}
        </div>
        {subtitle && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};
