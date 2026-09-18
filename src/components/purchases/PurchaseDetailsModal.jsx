import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { formatCurrency, formatDate, getSafeImageUrl } from '../../utils/formatters';
import { printBuybackReceipt } from '../../services/exportService';
import { extractPurchaseDocumentPhotos, extractPurchaseDevicePhotos } from '../../utils/buybackPhotos';
import { PhotoViewerModal } from '../common/PhotoViewerModal';
import {
  X,
  Printer,
  ShieldCheck,
  User,
  Phone,
  MapPin,
  FileText,
  Smartphone,
  DollarSign,
  Calendar,
  Archive,
  Edit3,
  Image as ImageIcon
} from 'lucide-react';

export const PurchaseDetailsModal = ({ purchase, isOpen, onClose, onArchive, onEdit }) => {
  const { inventory, settings } = useInventory();
  
  const [viewerState, setViewerState] = useState({
    isOpen: false,
    photos: [],
    initialIndex: 0,
    category: 'Document Photo'
  });

  if (!isOpen || !purchase) return null;

  const documentPhotos = extractPurchaseDocumentPhotos(purchase);
  const devicePhotos = extractPurchaseDevicePhotos(purchase, inventory);

  const openViewer = (photos, index, category) => {
    setViewerState({
      isOpen: true,
      photos,
      initialIndex: index,
      category
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '780px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Purchase Record {purchase.purchase_id}</h3>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--status-available-bg)',
                  color: 'var(--status-available-text)'
                }}
              >
                {purchase.status || 'Completed'}
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Linked Stock Item: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-600)' }}>{purchase.inventory_id}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onEdit && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  onClose();
                  onEdit(purchase);
                }}
                title="Edit Buyback and Photos"
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Edit3 size={14} />
                <span>Edit</span>
              </button>
            )}
            <button
              className="btn btn-secondary btn-icon"
              onClick={() => printBuybackReceipt(purchase, settings.storeName, settings.currency)}
              title="Print Buyback Invoice & Certificate"
            >
              <Printer size={16} />
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* KYC & Identity Section */}
          <div className="card" style={{ padding: '18px', backgroundColor: 'var(--bg-subtle)' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#059669' }}>
              <ShieldCheck size={16} />
              Seller Verification Record (Sensitive KYC)
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Seller Full Name</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '2px' }}>{purchase.seller_name}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Contact Mobile</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '2px' }}>{purchase.seller_phone}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>ID Verification Proof</div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '2px' }}>{purchase.id_type}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>Ref: {purchase.id_number_ref || 'Recorded'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Verification Status</div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', marginTop: '2px', color: '#059669' }}>
                  ✓ {purchase.id_verification_status || 'Verified'}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Residential Address</div>
                <div style={{ fontSize: '0.875rem', marginTop: '2px', color: 'var(--text-secondary)' }}>{purchase.seller_address || 'Not Provided'}</div>
              </div>
            </div>
          </div>

          {/* SEPARATED PHOTO CATEGORIES VIEW (Document Photos vs Device Photos) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '16px' }}>
            
            {/* 1. DOCUMENT PHOTOS */}
            <div
              className="card"
              style={{
                padding: '16px',
                backgroundColor: 'rgba(5, 150, 105, 0.03)',
                border: '1.5px solid rgba(5, 150, 105, 0.22)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} color="#059669" />
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#059669' }}>
                    Document Photos ({documentPhotos.length})
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Aadhaar, PAN, ID proof, address proof, purchase documents, etc.
              </p>

              {documentPhotos.length === 0 ? (
                <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  No document photos attached
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {documentPhotos.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => openViewer(documentPhotos, idx, 'Document Photo')}
                      style={{
                        width: '84px',
                        height: '84px',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-subtle)',
                        position: 'relative',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.04)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      title={`Click to view full size (${idx + 1}/${documentPhotos.length})`}
                    >
                      <img
                        src={getSafeImageUrl(url)}
                        alt={`Document photo ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80'; }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. DEVICE PHOTOS */}
            <div
              className="card"
              style={{
                padding: '16px',
                backgroundColor: 'rgba(99, 102, 241, 0.03)',
                border: '1.5px solid rgba(99, 102, 241, 0.22)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Smartphone size={16} color="var(--primary-600)" />
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--primary-600)' }}>
                    Device Photos ({devicePhotos.length})
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Front, back, sides, display, condition, IMEI label, accessories, etc.
              </p>

              {devicePhotos.length === 0 ? (
                <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  No device photos attached
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {devicePhotos.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => openViewer(devicePhotos, idx, 'Device Photo')}
                      style={{
                        width: '84px',
                        height: '84px',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-subtle)',
                        position: 'relative',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.04)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      title={`Click to view full size (${idx + 1}/${devicePhotos.length})`}
                    >
                      <img
                        src={getSafeImageUrl(url)}
                        alt={`Device photo ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&auto=format&fit=crop&q=80'; }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Purchased Device Information */}
          <div className="card" style={{ padding: '18px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Smartphone size={16} color="var(--primary-600)" />
              Device Hardware Telemetry
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Brand & Model</div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{purchase.brand} {purchase.model}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Specs & Color</div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{purchase.storage || '—'} / {purchase.ram || '—'} • {purchase.color || ''}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Primary IMEI</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8125rem' }}>{purchase.imei_1 || '—'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Secondary IMEI / Serial</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8125rem' }}>{purchase.imei_2 || purchase.serial_number || '—'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Condition Grade</div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{purchase.condition}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Purchase Date & Time</div>
                <div style={{ fontSize: '0.8125rem' }}>{formatDate(purchase.purchase_date)} {purchase.purchase_time || ''}</div>
              </div>
            </div>
          </div>

          {/* Financials & Legal Declaration */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div className="card" style={{ padding: '16px', backgroundColor: 'var(--status-available-bg)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--status-available-text)', textTransform: 'uppercase' }}>
                Disbursed Buyback Amount
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                {formatCurrency(purchase.purchase_price, settings.currency)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Payment Method: <strong>{purchase.payment_method || 'Cash'}</strong>
              </div>
            </div>

            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Seller Declaration Status
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#059669', marginTop: '4px' }}>
                ✓ Legal Ownership Affirmed
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Recorded by: {purchase.operator_name || 'Store Manager'}
              </div>
            </div>
          </div>

          {/* Inspection Remarks */}
          {purchase.notes && (
            <div className="card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Inspection Notes
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                {purchase.notes}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          {purchase.status !== 'Archived' ? (
            <button
              className="btn btn-subtle btn-sm"
              onClick={() => onArchive(purchase.purchase_id)}
            >
              <Archive size={14} /> Archive Record
            </button>
          ) : <div />}

          <div style={{ display: 'flex', gap: '8px' }}>
            {onEdit && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onClose();
                  onEdit(purchase);
                }}
              >
                <Edit3 size={14} /> Edit Buyback
              </button>
            )}
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Full-size Photo Lightbox Viewer */}
      <PhotoViewerModal
        isOpen={viewerState.isOpen}
        photos={viewerState.photos}
        initialIndex={viewerState.initialIndex}
        category={viewerState.category}
        onClose={() => setViewerState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
