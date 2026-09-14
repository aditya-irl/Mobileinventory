import React from 'react';
import { getStatusBadgeClass } from '../../utils/formatters';

export const Badge = ({ status, size = 'md', className = '' }) => {
  const badgeClass = getStatusBadgeClass(status);
  
  return (
    <span
      className={`badge ${badgeClass} ${size === 'sm' ? 'btn-sm' : ''} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: 600,
        letterSpacing: '0.01em'
      }}
    >
      <span className="badge-dot" />
      {status || 'Unknown'}
    </span>
  );
};
