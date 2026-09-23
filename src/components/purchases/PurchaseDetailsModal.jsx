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
  RotateCcw,
  Edit3,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { ConfirmationModal } from '../common/ConfirmationModal';

export const PurchaseDetailsModal = ({ purchase, isOpen, onClose, onArchive, onUnarchive, onEdit, onDelete }) => {
  const { inventory, settings, deletePurchase, archivePurchase, unarchivePurchase } = useInventory();
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showUnarchiveConfirm, setShowUnarchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isUnarchiving, setIsUnarchiving] = useState(false);
  
  const [viewerState, setViewerState] = useState({
    isOpen: false,
    photos: [],
    initialIndex: 0,
    category: 'Document Photo'
  });

  if (!isOpen || !purchase) return null;

  const isArchived = purchase.status === 'Archived';

  const handleArchive = async () => {
    if (isArchiving) return;
    setIsArchiving(true);
    try {
      if (onArchive) {
        await onArchive(purchase.purchase_id);
      } else if (archivePurchase) {
        await archivePurchase(purchase.purchase_id);
      }
      setShowArchiveConfirm(false);
      onClose();
    } catch (err) {
      console.error('Error archiving purchase:', err);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleUnarchive = async () => {
    if (isUnarchiving) return;
    setIsUnarchiving(true);
    try {
      if (onUnarchive) {
        await onUnarchive(purchase.purchase_id);
      } else if (unarchivePurchase) {
        await unarchivePurchase(purchase.purchase_id);
      }
      setShowUnarchiveConfirm(false);
      onClose();
    } catch (err) {
      console.error('Error unarchiving purchase:', err);
    } finally {
      setIsUnarchiving(false);
    }
  };

  const formatPurchaseTime = (timeStr) => {
    if (!timeStr) return '';
    const str = String(timeStr).trim();
    if (str.includes('GMT') || str.includes('1899')) {
      const match = str.match(/(\d{2}:\d{2})/);
      if (match) return `• ${match[1]}`;
      return '';
    }
    return `• ${str}`;
  };

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
        className="modal-content purchase-details-modal"
        style={{ maxWidth: '780px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header details-modal-header">
          <div className="details-header-info">
            <div className="details-header-title-row">
              <h3 className="details-header-title">Purchase Record {purchase.purchase_id}</h3>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isArchived ? 'rgba(148, 163, 184, 0.15)' : 'var(--status-available-bg)',
                  color: isArchived ? '#64748b' : 'var(--status-available-text)'
                }}
              >
                {isArchived ? 'Archived' : (purchase.status || 'Completed')}
              </span>
            </div>
            <div className="details-header-subtitle">
              Linked Stock Item: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-600)' }}>{purchase.inventory_id}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="details-header-close-btn"
            aria-label="Close modal"
            id="close-purchase-details-btn"
          >
            <X size={20} />
          </button>

          <div className="details-header-actions-group">
            <button
              className="btn btn-secondary details-header-action-btn"
              onClick={() => printBuybackReceipt(purchase, settings.storeName, settings.currency)}
              title="Print Buyback Invoice & Certificate"
              id="print-purchase-details-btn"
            >
              <Printer size={16} />
              <span className="details-action-btn-label">Print Receipt</span>
            </button>
            {!isArchived && onEdit && (
              <button
                className="btn btn-secondary details-header-action-btn"
                onClick={() => {
                  onClose();
                  onEdit(purchase);
                }}
                title="Edit Buyback and Photos"
                id="edit-purchase-details-btn"
              >
                <Edit3 size={16} />
                <span className="details-action-btn-label">Edit</span>
              </button>
            )}
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
                <div style={{ fontSize: '0.8125rem' }}>{formatDate(purchase.purchase_date)} {formatPurchaseTime(purchase.purchase_time)}</div>
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
        <div className="modal-footer purchase-modal-footer">
          {/* Desktop Footer View (Preserved intact for >= 768px) */}
          <div className="purchase-footer-desktop">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {isArchived ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowUnarchiveConfirm(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', minHeight: '38px' }}
                  id="desktop-unarchive-buyback-btn"
                >
                  <RotateCcw size={14} />
                  Unarchive Record
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowArchiveConfirm(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', minHeight: '38px' }}
                  id="desktop-archive-buyback-btn"
                >
                  <Archive size={14} />
                  Archive Record
                </button>
              )}

              <button
                type="button"
                className="btn btn-subtle btn-sm"
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  minHeight: '38px',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)'
                }}
                title="Remove Customer Record from App"
                id="desktop-remove-buyback-btn"
              >
                <Trash2 size={14} /> Remove from App
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {!isArchived && onEdit && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    onClose();
                    onEdit(purchase);
                  }}
                  style={{ minHeight: '38px' }}
                  id="desktop-edit-buyback-btn"
                >
                  <Edit3 size={14} /> Edit Buyback
                </button>
              )}
              <button className="btn btn-secondary" onClick={onClose} style={{ minHeight: '38px' }} id="desktop-close-buyback-modal-btn">
                Close
              </button>
            </div>
          </div>

          {/* Mobile Footer View (< 768px: Compact & Intentional Hierarchy) */}
          <div className="purchase-footer-mobile">
            {isArchived ? (
              /* Archived Buyback: Unarchive (primary full) -> Remove (destructive full) -> Close (full) */
              <>
                <button
                  type="button"
                  className="btn btn-primary purchase-action-primary"
                  onClick={() => setShowUnarchiveConfirm(true)}
                  id="unarchive-buyback-btn"
                >
                  <RotateCcw size={16} />
                  <span>Unarchive Record</span>
                </button>

                <button
                  type="button"
                  className="btn purchase-action-danger purchase-action-full"
                  onClick={() => setShowDeleteConfirm(true)}
                  id="remove-buyback-btn"
                >
                  <Trash2 size={15} />
                  <span>Remove from App</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary purchase-action-close"
                  onClick={onClose}
                  id="close-buyback-modal-btn"
                >
                  Close
                </button>
              </>
            ) : (
              /* Active Buyback: Edit (primary full) -> [Archive | Remove] (2-col) -> Close (full) */
              <>
                {onEdit && (
                  <button
                    type="button"
                    className="btn btn-primary purchase-action-primary"
                    onClick={() => {
                      onClose();
                      onEdit(purchase);
                    }}
                    id="edit-buyback-btn"
                  >
                    <Edit3 size={16} />
                    <span>Edit Buyback</span>
                  </button>
                )}

                <div className="purchase-action-secondary-row">
                  <button
                    type="button"
                    className="btn btn-secondary purchase-action-secondary"
                    onClick={() => setShowArchiveConfirm(true)}
                    id="archive-buyback-btn"
                  >
                    <Archive size={15} />
                    <span>Archive Record</span>
                  </button>

                  <button
                    type="button"
                    className="btn purchase-action-danger"
                    onClick={() => setShowDeleteConfirm(true)}
                    id="remove-buyback-btn"
                  >
                    <Trash2 size={15} />
                    <span>Remove from App</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary purchase-action-close"
                  onClick={onClose}
                  id="close-buyback-modal-btn"
                >
                  Close
                </button>
              </>
            )}
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

      {/* Archive Confirmation Modal */}
      <ConfirmationModal
        isOpen={showArchiveConfirm}
        onClose={() => !isArchiving && setShowArchiveConfirm(false)}
        onConfirm={handleArchive}
        title="Archive this buyback record?"
        message="This will move the record out of active Buybacks and into Archived records."
        confirmText="Archive"
        cancelText="Cancel"
        danger={false}
        loading={isArchiving}
      />

      {/* Unarchive Confirmation Modal */}
      <ConfirmationModal
        isOpen={showUnarchiveConfirm}
        onClose={() => !isUnarchiving && setShowUnarchiveConfirm(false)}
        onConfirm={handleUnarchive}
        title="Unarchive this buyback record?"
        message="This will restore the record to active Buybacks. If the device is unsold, it will be restored to available inventory."
        confirmText="Unarchive"
        cancelText="Cancel"
        danger={false}
        loading={isUnarchiving}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => !isDeleting && setShowDeleteConfirm(false)}
        onConfirm={async () => {
          if (isDeleting) return;
          setIsDeleting(true);
          try {
            if (onDelete) {
              await onDelete(purchase.purchase_id);
            } else if (deletePurchase) {
              await deletePurchase(purchase.purchase_id);
            }
            setShowDeleteConfirm(false);
            onClose();
          } catch (err) {
            console.error(err);
          } finally {
            setIsDeleting(false);
          }
        }}
        title="Remove Customer Record"
        message="Remove this customer record from the app? Note: This removes the record from the app's local/visible data. Google Sheets and Google Drive data are not automatically deleted."
        confirmText="Remove"
        cancelText="Cancel"
        danger={true}
        loading={isDeleting}
      />
    </div>
  );
};
