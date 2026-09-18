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
        padding: '14px 16px',
        backgroundColor: scheme.bg,
        borderColor: scheme.border,
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        minWidth: 0
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            lineHeight: 1.3
          }}
        >
          {title}
        </span>
        {Icon && (
          <div
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: scheme.iconBg,
              color: scheme.iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Icon size={16} />
          </div>
        )}
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 'clamp(1.15rem, 3.8vw, 1.45rem)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {value}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginTop: '3px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};
