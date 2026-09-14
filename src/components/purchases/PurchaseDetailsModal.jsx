import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { formatCurrency, formatDate, getSafeImageUrl } from '../../utils/formatters';
import { printBuybackReceipt } from '../../services/exportService';
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
  Image as ImageIcon
} from 'lucide-react';

export const PurchaseDetailsModal = ({ purchase, isOpen, onClose, onArchive }) => {
  const { settings } = useInventory();

  if (!isOpen || !purchase) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '720px' }}
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
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

            {/* KYC Documents Showcase */}
            {(purchase.seller_photo_url || purchase.document_photo_url) && (
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {purchase.seller_photo_url && (
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>Seller Face Photo</div>
                    <div style={{ width: '120px', height: '120px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                      <img
                        src={getSafeImageUrl(purchase.seller_photo_url)}
                        alt="Seller Face"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  </div>
                )}

                {purchase.document_photo_url && (
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>ID Document Copy</div>
                    <div style={{ width: '120px', height: '120px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                      <img
                        src={getSafeImageUrl(purchase.document_photo_url)}
                        alt="ID Document"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Purchased Device Information */}
          <div className="card" style={{ padding: '18px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Smartphone size={16} color="var(--primary-600)" />
              Device Hardware Telemetry
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
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

          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
