import React from 'react';
import { Badge } from '../common/Badge';
import { formatCurrency, formatDate, maskIMEI, calculateProfitMargin, getSafeImageUrl } from '../../utils/formatters';
import { useInventory } from '../../context/InventoryContext';
import { Eye, Edit, DollarSign, Trash2, Smartphone } from 'lucide-react';

export const InventoryTable = ({
  items,
  onViewDetails,
  onEdit,
  onMarkSold,
  onDelete
}) => {
  const { settings } = useInventory();

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '80px' }}>ID</th>
            <th style={{ width: '60px' }}>Photo</th>
            <th>Device & Model</th>
            <th>Storage / RAM</th>
            <th>IMEI 1</th>
            <th>Battery</th>
            <th>Purchase Price</th>
            <th>Selling Price</th>
            <th>Status</th>
            <th>Date</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const photo = item.photo_urls && item.photo_urls.length > 0 ? getSafeImageUrl(item.photo_urls[0]) : null;
            const margin = calculateProfitMargin(item.purchase_price, item.selling_price);

            return (
              <tr
                key={item.inventory_id}
                style={{ cursor: 'pointer' }}
                onClick={() => onViewDetails(item)}
              >
                {/* ID */}
                <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-600)' }}>
                  {item.inventory_id}
                </td>

                {/* Photo Thumbnail */}
                <td>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      backgroundColor: 'var(--bg-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border-subtle)'
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
                      <Smartphone size={18} color="var(--text-muted)" />
                    )}
                  </div>
                </td>

                {/* Brand & Model */}
                <td>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                    {item.brand} {item.model}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '6px' }}>
                    <span>{item.color || 'Standard'}</span>
                    {item.condition && (
                      <>
                        <span>•</span>
                        <span>{item.condition}</span>
                      </>
                    )}
                  </div>
                </td>

                {/* Specs */}
                <td>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    {item.storage || '—'}
                  </div>
                  {item.ram && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {item.ram} RAM
                    </div>
                  )}
                </td>

                {/* IMEI */}
                <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {item.imei_1 ? maskIMEI(item.imei_1) : '—'}
                </td>

                {/* Battery Health */}
                <td>
                  {item.battery_health ? (
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        color: item.battery_health >= 90 ? '#10b981' : item.battery_health >= 80 ? '#f59e0b' : '#ef4444'
                      }}
                    >
                      {item.battery_health}%
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                  )}
                </td>

                {/* Purchase Price */}
                <td style={{ fontWeight: 600 }}>
                  {formatCurrency(item.purchase_price, settings.currency)}
                </td>

                {/* Selling Price & Margin */}
                <td>
                  <div style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
                    {formatCurrency(item.selling_price, settings.currency)}
                  </div>
                  {item.selling_price && item.purchase_price ? (
                    <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                      +{margin}% margin
                    </div>
                  ) : null}
                </td>

                {/* Status */}
                <td>
                  <Badge status={item.status} size="sm" />
                </td>

                {/* Date */}
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {formatDate(item.purchase_date || item.created_at)}
                </td>

                {/* Actions */}
                <td style={{ textAlign: 'right' }}>
                  <div
                    style={{ display: 'inline-flex', gap: '4px' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="btn btn-subtle btn-icon btn-sm"
                      onClick={() => onViewDetails(item)}
                      title="View Details"
                    >
                      <Eye size={14} />
                    </button>
                    {item.status !== 'Sold' && (
                      <button
                        className="btn btn-subtle btn-icon btn-sm"
                        onClick={() => onMarkSold(item)}
                        title="Mark as Sold"
                        style={{ color: '#10b981' }}
                      >
                        <DollarSign size={14} />
                      </button>
                    )}
                    <button
                      className="btn btn-subtle btn-icon btn-sm"
                      onClick={() => onEdit(item)}
                      title="Edit"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      className="btn btn-subtle btn-icon btn-sm"
                      onClick={() => onDelete(item)}
                      title="Delete"
                      style={{ color: '#ef4444' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
