import React from 'react';

export const Skeleton = ({ width = '100%', height = '20px', borderRadius = 'var(--radius-sm)', className = '' }) => {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        display: 'inline-block'
      }}
    />
  );
};

export const TableSkeleton = ({ rows = 5, cols = 6 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Skeleton width="40px" height="40px" borderRadius="var(--radius-md)" />
          <Skeleton width="25%" height="20px" />
          <Skeleton width="20%" height="20px" />
          <Skeleton width="15%" height="20px" />
          <Skeleton width="15%" height="20px" />
          <Skeleton width="10%" height="20px" />
        </div>
      ))}
    </div>
  );
};
