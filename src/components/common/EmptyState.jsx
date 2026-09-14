import React from 'react';
import { Smartphone, Plus } from 'lucide-react';

export const EmptyState = ({
  title = 'No phones found',
  description = 'Add your first phone to start managing your inventory records.',
  actionText = 'Add Inventory',
  onAction,
  icon: Icon = Smartphone
}) => {
  return (
    <div
      className="card"
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '20px 0'
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-50)',
          color: 'var(--primary-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}
      >
        <Icon size={32} />
      </div>

      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '8px' }}>
        {title}
      </h3>

      <p style={{ color: 'var(--text-secondary)', maxWidth: '380px', marginBottom: '24px', fontSize: '0.875rem' }}>
        {description}
      </p>

      {onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          <Plus size={16} />
          {actionText}
        </button>
      )}
    </div>
  );
};
