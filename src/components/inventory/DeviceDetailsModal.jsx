import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { Badge } from '../common/Badge';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { formatCurrency, formatDate, calculateProfitMargin, getSafeImageUrl } from '../../utils/formatters';
import { printDeviceSpecSheet } from '../../services/exportService';
import {
  X,
  Printer,
  Edit,
  Trash2,
  DollarSign,
  CheckCircle,
  Clock,
  Wrench,
  ShieldCheck,
  Smartphone,
  Cpu,
  Hash,
  BatteryCharging,
  Layers,
  FileText,
  User,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';

export const DeviceDetailsModal = ({
  item,
  isOpen,
  onClose,
  onEdit,
  onOpenMarkSold
}) => {
  const { updateInventoryItem, deleteInventoryItem, settings } = useInventory();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  if (!isOpen || !item) return null;

  const validPhotoUrls = (item.photo_urls && item.photo_urls.length > 0)
    ? item.photo_urls.map(getSafeImageUrl).filter(Boolean)
    : [];

  const photos = validPhotoUrls.length > 0
    ? validPhotoUrls
    : ['https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&auto=format&fit=crop&q=80'];

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'Sold') {
      onClose();
      onOpenMarkSold(item);
      return;
    }

    setUpdatingStatus(true);
    const res = await updateInventoryItem({
      ...item,
      inventory_id: item.inventory_id,
      status: newStatus
    });
    setUpdatingStatus(false);
    if (res && res.success) {
      onClose();
    }
  };


  const handleDeleteConfirm = async () => {
    await deleteInventoryItem(item.inventory_id);
    setShowDeleteModal(false);
    onClose();
  };

  const profitMargin = calculateProfitMargin(item.purchase_price, item.selling_price);

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div
          className="modal-content device-details-modal"
          style={{ maxWidth: '780px' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header details-modal-header">
            <div className="details-header-info">
              <div className="details-header-title-row">
                <h3 className="details-header-title">
                  {item.brand} {item.model}
                </h3>
                <Badge status={item.status} />
              </div>
              <div className="details-header-subtitle">
                ID: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.inventory_id}</span>
                {item.variant ? ` • ${item.variant}` : ''}
              </div>
            </div>

            <button
              onClick={onClose}
              className="details-header-close-btn"
              aria-label="Close modal"
              id="close-device-details-btn"
            >
              <X size={20} />
            </button>

            <div className="details-header-actions-group">
              <button
                className="btn btn-secondary details-header-action-btn"
                onClick={() => printDeviceSpecSheet(item, settings.storeName, settings.currency)}
                title="Print Device Spec Sheet"
                id="print-device-details-btn"
              >
                <Printer size={16} />
                <span className="details-action-btn-label">Print</span>
              </button>
              <button
                className="btn btn-secondary details-header-action-btn"
                onClick={() => {
                  onClose();
                  onEdit(item);
                }}
                title="Edit Device"
                id="edit-device-details-btn"
              >
                <Edit size={16} />
                <span className="details-action-btn-label">Edit</span>
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Top Media & Quick Financials Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* Photo Showcase */}
              <div>
                <div
                  style={{
                    width: '100%',
                    height: '240px',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    position: 'relative'
                  }}
                >
                  <img
                    src={photos[activePhotoIndex] || photos[0]}
                    alt={`${item.brand} ${item.model}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                  {photos.length > 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '10px',
                        background: 'rgba(0,0,0,0.65)',
                        color: '#fff',
                        fontSize: '0.75rem',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      {activePhotoIndex + 1} / {photos.length}
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {photos.length > 1 && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {photos.map((url, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActivePhotoIndex(idx)}
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: activePhotoIndex === idx ? '2px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                          opacity: activePhotoIndex === idx ? 1 : 0.65,
                          flexShrink: 0
                        }}
                      >
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Financial & Status Summary Card */}
              <div
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Financial Overview
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '8px' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Selling Price</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                      {formatCurrency(item.selling_price, settings.currency)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Purchase Price</span>
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatCurrency(item.purchase_price, settings.currency)}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.status === 'Sold' ? 'Realized Profit' : 'Potential Margin'}
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981' }}>
                        +{formatCurrency((Number(item.selling_price) || 0) - (Number(item.purchase_price) || 0), settings.currency)}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--status-available-bg)',
                        color: 'var(--status-available-text)',
                        fontWeight: 700,
                        fontSize: '0.8125rem'
                      }}
                    >
                      +{profitMargin}%
                    </div>
                  </div>
                </div>

                {/* Quick Status Action Controls */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Quick Status Switch:
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {item.status !== 'Sold' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleStatusChange('Sold')}
                        disabled={updatingStatus}
                      >
                        <DollarSign size={14} /> Mark as Sold
                      </button>
                    )}
                    {item.status !== 'Available' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStatusChange('Available')}
                        disabled={updatingStatus}
                      >
                        <CheckCircle size={14} /> Available
                      </button>
                    )}
                    {item.status !== 'Reserved' && item.status !== 'Sold' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStatusChange('Reserved')}
                        disabled={updatingStatus}
                      >
                        <Clock size={14} /> Reserve
                      </button>
                    )}
                    {item.status !== 'Under Repair' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStatusChange('Under Repair')}
                        disabled={updatingStatus}
                      >
                        <Wrench size={14} /> In Repair
                      </button>
                    )}

                  </div>
                </div>
              </div>
            </div>

            {/* Specifications Grid */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>
                Device Specifications & Telemetry
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))',
                  gap: '10px'
                }}
              >
                <div className="card" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Color & Finish
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '2px' }}>
                    {item.color || 'Standard'}
                  </div>
                </div>

                <div className="card" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Storage / RAM
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '2px' }}>
                    {item.storage || '—'} / {item.ram || '—'}
                  </div>
                </div>

                <div className="card" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Battery Health
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', marginTop: '2px', color: item.battery_health >= 90 ? '#10b981' : '#f59e0b' }}>
                    {item.battery_health ? `${item.battery_health}% Capacity` : 'Not Specified'}
                  </div>
                </div>

                <div className="card" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Physical Condition
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '2px' }}>
                    {item.condition || 'Brand New'}
                  </div>
                </div>

                <div className="card" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Primary IMEI (IMEI 1)
                  </div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8125rem', marginTop: '2px' }}>
                    {item.imei_1 || '—'}
                  </div>
                </div>

                <div className="card" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Secondary IMEI (IMEI 2)
                  </div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8125rem', marginTop: '2px' }}>
                    {item.imei_2 || '—'}
                  </div>
                </div>

                <div className="card" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Serial Number
                  </div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8125rem', marginTop: '2px' }}>
                    {item.serial_number || '—'}
                  </div>
                </div>

                <div className="card" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Warranty Status
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '2px' }}>
                    {item.warranty || 'None'}
                  </div>
                </div>
              </div>
            </div>

            {/* Business & Logistics Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div className="card" style={{ padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  <User size={14} /> Supplier & Customer
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.875rem' }}>
                  <div><strong>Supplier:</strong> {item.supplier || 'Direct Trade'}</div>
                  {item.customer && (
                    <div style={{ marginTop: '4px' }}><strong>Customer:</strong> {item.customer}</div>
                  )}
                </div>
              </div>

              <div className="card" style={{ padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  <Calendar size={14} /> Dates & Timeline
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.875rem' }}>
                  <div><strong>Purchased:</strong> {formatDate(item.purchase_date)}</div>
                  {item.selling_date && (
                    <div style={{ marginTop: '4px' }}><strong>Sold:</strong> {formatDate(item.selling_date)}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Accessories & Inspection Notes */}
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '6px' }}>
                Included Accessories
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                {item.accessories || 'Handset only (No additional accessories specified)'}
              </div>

              <div style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '6px' }}>
                Notes & Inspection History
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {item.notes || 'No special notes recorded.'}
              </div>
            </div>
          </div>

          {/* Footer with Delete Option */}
          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 size={14} /> Delete Device
            </button>

            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Device from Inventory?"
        message={`Are you sure you want to remove ${item.brand} ${item.model} (${item.inventory_id})? This will permanently remove its record from your database.`}
        confirmText="Yes, Delete Device"
      />
    </>
  );
};
