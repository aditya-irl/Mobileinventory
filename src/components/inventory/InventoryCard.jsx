import React from 'react';
import { Badge } from '../common/Badge';
import { formatCurrency, maskIMEI, calculateProfitMargin, getSafeImageUrl } from '../../utils/formatters';
import { useInventory } from '../../context/InventoryContext';
import { Smartphone, ChevronRight, DollarSign, BatteryCharging } from 'lucide-react';

export const InventoryCard = ({
  item,
  onViewDetails,
  onEdit,
  onMarkSold
}) => {
  const { settings } = useInventory();
  const photo = item.photo_urls && item.photo_urls.length > 0 ? getSafeImageUrl(item.photo_urls[0]) : null;
  const margin = calculateProfitMargin(item.purchase_price, item.selling_price);

  return (
    <div
      className="card card-interactive"
      onClick={() => onViewDetails(item)}
      style={{
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        cursor: 'pointer',
        position: 'relative'
      }}
    >
      {/* Top row: Image & Info */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-subtle)',
            flexShrink: 0
          }}
        >
          {photo ? (
            <img
              src={photo}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <Smartphone size={24} color="var(--text-muted)" />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
            <div
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {item.brand} {item.model}
            </div>
            <Badge status={item.status} size="sm" />
          </div>

          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              marginTop: '2px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              alignItems: 'center'
            }}
          >
            <span style={{ fontWeight: 600 }}>{item.storage || '—'}</span>
            {item.color && <span>• {item.color}</span>}
            {item.condition && <span>• {item.condition}</span>}
          </div>

          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginTop: '4px',
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>IMEI: {item.imei_1 ? maskIMEI(item.imei_1) : item.inventory_id}</span>
            {item.battery_health && (
              <span style={{ color: item.battery_health >= 90 ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                {item.battery_health}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Pricing & Action bar */}
      <div
        style={{
          paddingTop: '10px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>{formatCurrency(item.purchase_price, settings.currency)}</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>→</span>
            <span style={{ color: 'var(--primary-600)' }}>{formatCurrency(item.selling_price, settings.currency)}</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>
            +{formatCurrency((Number(item.selling_price) || 0) - (Number(item.purchase_price) || 0), settings.currency)} ({margin}% margin)
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={e => e.stopPropagation()}>
          {item.status !== 'Sold' && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onMarkSold(item)}
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            >
              <DollarSign size={13} /> Sell
            </button>
          )}
          <button
            className="btn btn-subtle btn-sm btn-icon"
            onClick={() => onViewDetails(item)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
