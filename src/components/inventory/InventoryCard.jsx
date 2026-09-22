import React from 'react';
import { Badge } from '../common/Badge';
import { formatCurrency, maskIMEI, calculateProfitMargin, getSafeImageUrl } from '../../utils/formatters';
import { useInventory } from '../../context/InventoryContext';
import { Smartphone, ChevronRight, DollarSign, BatteryCharging, Eye, Edit3 } from 'lucide-react';

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
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        cursor: 'pointer',
        position: 'relative',
        minWidth: 0
      }}
    >
      {/* Top row: Image & Info */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', minWidth: 0 }}>
        <div
          style={{
            width: '64px',
            height: '64px',
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
            <Smartphone size={22} color="var(--text-muted)" />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
            <div
              style={{
                fontSize: '0.92rem',
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
              gap: '4px',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            <span style={{ fontWeight: 600 }}>{item.storage || '—'}</span>
            {item.color && <span>• {item.color}</span>}
            {item.condition && <span>• {item.condition}</span>}
          </div>

          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              marginTop: '4px',
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '4px'
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              IMEI: {item.imei_1 ? maskIMEI(item.imei_1) : item.inventory_id}
            </span>
            {item.battery_health && (
              <span style={{ color: item.battery_health >= 90 ? '#10b981' : '#f59e0b', fontWeight: 700, flexShrink: 0 }}>
                {item.battery_health}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Pricing & Action bar */}
      <div
        style={{
          paddingTop: '8px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
            <span>{formatCurrency(item.purchase_price, settings.currency)}</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>→</span>
            <span style={{ color: 'var(--primary-600)' }}>{formatCurrency(item.selling_price, settings.currency)}</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>
            +{formatCurrency((Number(item.selling_price) || 0) - (Number(item.purchase_price) || 0), settings.currency)} ({margin}% margin)
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onViewDetails(item)}
            style={{ padding: '6px 10px', minHeight: '36px', fontSize: '0.75rem', fontWeight: 600 }}
            title="View Details"
          >
            <Eye size={13} /> View
          </button>
          {onEdit && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onEdit(item)}
              style={{ padding: '6px 10px', minHeight: '36px', fontSize: '0.75rem', fontWeight: 600 }}
              title="Edit Device"
            >
              <Edit3 size={13} /> Edit
            </button>
          )}
          {item.status !== 'Sold' && onMarkSold && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onMarkSold(item)}
              style={{ padding: '6px 10px', minHeight: '36px', fontSize: '0.75rem', fontWeight: 700 }}
              title="Record Sale"
            >
              <DollarSign size={13} /> Sell
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
