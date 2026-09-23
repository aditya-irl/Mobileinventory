import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { PurchaseDetailsModal } from '../components/purchases/PurchaseDetailsModal';
import { EmptyState } from '../components/common/EmptyState';
import { exportPurchasesToCSV } from '../services/exportService';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  Archive,
  RotateCcw,
  Search,
  Download,
  Eye,
  User,
  Smartphone,
  Calendar,
  Lock,
  Clock,
  Trash2
} from 'lucide-react';
import { ConfirmationModal } from '../components/common/ConfirmationModal';

export const Archived = () => {
  const { purchases, unarchivePurchase, deletePurchase, settings } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [purchaseToUnarchive, setPurchaseToUnarchive] = useState(null);
  const [isUnarchiving, setIsUnarchiving] = useState(false);
  const [purchaseToRemove, setPurchaseToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Filter ONLY records whose status is 'Archived'
  const archivedPurchases = useMemo(() => {
    return purchases.filter(p => p && p.status === 'Archived');
  }, [purchases]);

  // Search filtered records
  const filteredArchived = useMemo(() => {
    return archivedPurchases.filter(p => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          (p.purchase_id && p.purchase_id.toLowerCase().includes(q)) ||
          (p.inventory_id && p.inventory_id.toLowerCase().includes(q)) ||
          (p.seller_name && p.seller_name.toLowerCase().includes(q)) ||
          (p.seller_phone && p.seller_phone.includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.model && p.model.toLowerCase().includes(q)) ||
          (p.imei_1 && String(p.imei_1).includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [archivedPurchases, searchQuery]);

  // Statistics for archived records
  const totalArchivedValue = useMemo(() => {
    return archivedPurchases.reduce((acc, p) => acc + (Number(p.purchase_price) || 0), 0);
  }, [archivedPurchases]);

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Top Header */}
      <div className="page-header-responsive">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Archived Buyback Records</h1>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(148, 163, 184, 0.15)',
                color: '#64748b',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Archive size={11} /> Archived Records
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
            Historical and archived customer buyback records. Archived records do not appear in active inventory.
          </p>
        </div>
      </div>

      {/* Filter & Export Bar */}
      <div
        className="card"
        style={{
          padding: '14px 16px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 0, width: '100%' }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            placeholder="Search archived buybacks by seller, model, IMEI, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
            style={{ paddingLeft: '32px', height: '38px', fontSize: '0.8125rem', width: '100%' }}
            id="archived-search-input"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', width: '100%', maxWidth: 'max-content' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Archived Outlay: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(totalArchivedValue, settings.currency)}</strong>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => exportPurchasesToCSV(filteredArchived)}
            disabled={!filteredArchived.length}
            style={{ minHeight: '36px' }}
            id="export-archived-csv-btn"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Content: Empty State vs Records */}
      {filteredArchived.length === 0 ? (
        <EmptyState
          title="No archived buybacks"
          description={
            archivedPurchases.length === 0
              ? 'No buyback records have been archived. When you archive records from Buyback Details, they will appear here.'
              : 'No archived records matched your search query.'
          }
          icon={Archive}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="table-container hide-mobile">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Purchase ID</th>
                  <th>Linked Stock</th>
                  <th>Seller Name & Mobile</th>
                  <th>Device & IMEI</th>
                  <th>Disbursed Price</th>
                  <th>Payment Mode</th>
                  <th>Archive / Intake Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredArchived.map((purchase) => (
                  <tr key={purchase.purchase_id} className="table-row-hover">
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-600)' }}>
                        {purchase.purchase_id}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {purchase.inventory_id || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{purchase.seller_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{purchase.seller_phone}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {purchase.brand} {purchase.model}
                      </div>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        IMEI: {purchase.imei_1 || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(purchase.purchase_price, settings.currency)}
                      </strong>
                    </td>
                    <td>
                      <span className="badge badge-subtle">{purchase.payment_mode || 'Cash'}</span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {formatDate(purchase.purchase_date || purchase.updated_at)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedPurchase(purchase)}
                          style={{ minHeight: '32px', padding: '4px 10px', fontSize: '0.78rem' }}
                          title="View KYC and Details"
                        >
                          <Eye size={13} />
                          <span>View Details</span>
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setPurchaseToUnarchive(purchase)}
                          style={{ minHeight: '32px', padding: '4px 10px', fontSize: '0.78rem' }}
                          title="Unarchive record"
                        >
                          <RotateCcw size={13} />
                          <span>Unarchive</span>
                        </button>
                        <button
                          className="btn btn-subtle btn-sm"
                          onClick={() => setPurchaseToRemove(purchase)}
                          style={{
                            color: '#ef4444',
                            minHeight: '32px',
                            padding: '4px 8px',
                            backgroundColor: 'rgba(239, 68, 68, 0.08)'
                          }}
                          title="Remove from App"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Cards */}
          <div className="mobile-cards-grid show-mobile-only">
            {filteredArchived.map((purchase) => (
              <div
                key={purchase.purchase_id}
                className="card animate-fade-in"
                style={{
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  borderLeft: '4px solid #64748b'
                }}
              >
                {/* Header row: Device Name & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      {purchase.brand} {purchase.model}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '3px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.78rem', color: 'var(--primary-600)' }}>
                        {purchase.purchase_id}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>•</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {purchase.inventory_id}
                      </span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(148, 163, 184, 0.15)',
                      color: '#64748b',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Archived
                  </span>
                </div>

                {/* Info Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    fontSize: '0.8rem',
                    backgroundColor: 'var(--bg-subtle, rgba(0,0,0,0.02))',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={11} /> Seller
                    </div>
                    <div style={{ fontWeight: 600, marginTop: '1px' }}>{purchase.seller_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{purchase.seller_phone}</div>
                  </div>

                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} /> Disbursed
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '1px' }}>
                      {formatCurrency(purchase.purchase_price, settings.currency)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{purchase.payment_mode || 'Cash'}</div>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Smartphone size={11} /> IMEI
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                      {purchase.imei_1 || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '4px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedPurchase(purchase)}
                    style={{ flex: '1 1 auto', minHeight: '38px', justifyContent: 'center' }}
                  >
                    <Eye size={14} />
                    View Details
                  </button>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setPurchaseToUnarchive(purchase)}
                    style={{ flex: '1 1 auto', minHeight: '38px', justifyContent: 'center' }}
                  >
                    <RotateCcw size={14} />
                    Unarchive
                  </button>

                  <button
                    className="btn btn-subtle btn-sm"
                    onClick={() => setPurchaseToRemove(purchase)}
                    style={{
                      color: '#ef4444',
                      minHeight: '38px',
                      padding: '0 12px',
                      backgroundColor: 'rgba(239, 68, 68, 0.08)'
                    }}
                    title="Remove from App"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Purchase Details Modal */}
      <PurchaseDetailsModal
        purchase={selectedPurchase}
        isOpen={Boolean(selectedPurchase)}
        onClose={() => setSelectedPurchase(null)}
        onUnarchive={async (purId) => {
          await unarchivePurchase(purId);
          setSelectedPurchase(null);
        }}
        onDelete={async (purId) => {
          await deletePurchase(purId);
          setSelectedPurchase(null);
        }}
      />

      {/* Direct Unarchive Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(purchaseToUnarchive)}
        onClose={() => !isUnarchiving && setPurchaseToUnarchive(null)}
        onConfirm={async () => {
          if (!purchaseToUnarchive || isUnarchiving) return;
          setIsUnarchiving(true);
          try {
            await unarchivePurchase(purchaseToUnarchive.purchase_id);
            setPurchaseToUnarchive(null);
            if (selectedPurchase?.purchase_id === purchaseToUnarchive.purchase_id) {
              setSelectedPurchase(null);
            }
          } finally {
            setIsUnarchiving(false);
          }
        }}
        title="Unarchive this buyback record?"
        message="This will restore the record to active Buybacks. If the device is unsold, it will be restored to available inventory."
        confirmText="Unarchive"
        cancelText="Cancel"
        danger={false}
        loading={isUnarchiving}
      />

      {/* Remove from App Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(purchaseToRemove)}
        onClose={() => !isRemoving && setPurchaseToRemove(null)}
        onConfirm={async () => {
          if (!purchaseToRemove || isRemoving) return;
          setIsRemoving(true);
          try {
            await deletePurchase(purchaseToRemove.purchase_id);
            setPurchaseToRemove(null);
            if (selectedPurchase?.purchase_id === purchaseToRemove.purchase_id) {
              setSelectedPurchase(null);
            }
          } finally {
            setIsRemoving(false);
          }
        }}
        title="Remove Customer Record"
        message="Remove this customer record from the app? Note: This removes the record from the app's local/visible data. Google Sheets and Google Drive data are not automatically deleted."
        confirmText="Remove"
        cancelText="Cancel"
        danger={true}
        loading={isRemoving}
      />
    </div>
  );
};

export default Archived;
