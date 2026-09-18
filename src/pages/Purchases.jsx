import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { BuybackWizard } from '../components/purchases/BuybackWizard';
import { PurchaseDetailsModal } from '../components/purchases/PurchaseDetailsModal';
import { EditPurchaseModal } from '../components/purchases/EditPurchaseModal';
import { IMEITraceView } from '../components/purchases/IMEITraceView';
import { EmptyState } from '../components/common/EmptyState';
import { exportPurchasesToCSV } from '../services/exportService';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  ShieldCheck,
  PlusCircle,
  FileSpreadsheet,
  Search,
  Download,
  Eye,
  User,
  Smartphone,
  Calendar,
  Lock,
  Clock,
  Sparkles,
  Edit3
} from 'lucide-react';

export const Purchases = () => {
  const { purchases, archivePurchase, settings } = useInventory();

  const [activeTab, setActiveTab] = useState('ledger'); // 'wizard' | 'ledger' | 'trace'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [editingPurchase, setEditingPurchase] = useState(null);

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
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
  }, [purchases, searchQuery]);

  // Quick statistics
  const totalDisbursed = useMemo(() => {
    return purchases.reduce((acc, p) => acc + (Number(p.purchase_price) || 0), 0);
  }, [purchases]);

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '20px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800 }}>Used Phone Buyback & Seller Verification</h1>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--status-available-bg)',
                color: 'var(--status-available-text)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Lock size={11} /> Isolated KYC
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
            Record customer buybacks, verify government identity, and maintain audit-compliant IMEI records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-primary"
            onClick={() => setActiveTab('wizard')}
          >
            <PlusCircle size={16} />
            New Buyback
          </button>
        </div>
      </div>

      {/* Sub-Tabs Bar */}
      <div
        className="horizontal-scroll-chips"
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '8px'
        }}
      >
        <button
          onClick={() => setActiveTab('ledger')}
          className={`btn ${activeTab === 'ledger' ? 'btn-primary' : 'btn-subtle'}`}
          style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          <FileSpreadsheet size={15} />
          Purchase Ledger ({purchases.length})
        </button>

        <button
          onClick={() => setActiveTab('wizard')}
          className={`btn ${activeTab === 'wizard' ? 'btn-primary' : 'btn-subtle'}`}
          style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          <PlusCircle size={15} />
          New Buyback Wizard
        </button>

        <button
          onClick={() => setActiveTab('trace')}
          className={`btn ${activeTab === 'trace' ? 'btn-primary' : 'btn-subtle'}`}
          style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          <ShieldCheck size={15} />
          IMEI Traceability & Audit
        </button>
      </div>

      {/* TAB 1: NEW BUYBACK WIZARD */}
      {activeTab === 'wizard' && (
        <BuybackWizard onComplete={() => setActiveTab('ledger')} />
      )}

      {/* TAB 2: PURCHASE LEDGER */}
      {activeTab === 'ledger' && (
        <div>
          {/* Top Filter & Export Bar */}
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
                placeholder="Search seller, mobile, IMEI, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input"
                style={{ paddingLeft: '32px', height: '38px', fontSize: '0.8125rem', width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', width: '100%', maxWidth: 'max-content' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Total Outlay: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(totalDisbursed, settings.currency)}</strong>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => exportPurchasesToCSV(filteredPurchases)}
                disabled={!filteredPurchases.length}
                style={{ minHeight: '36px' }}
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          {/* Purchases Table & Mobile Cards */}
          {filteredPurchases.length === 0 ? (
            <EmptyState
              title="No buyback records found"
              description={
                purchases.length === 0
                  ? 'No used phones bought back yet. Click "New Buyback" to record your first customer phone intake.'
                  : 'No purchase records matched your search query.'
              }
              actionText="Start First Buyback"
              onAction={() => setActiveTab('wizard')}
              icon={ShieldCheck}
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
                      <th>ID Verification Type</th>
                      <th>Device & IMEI</th>
                      <th>Disbursed Price</th>
                      <th>Payment Mode</th>
                      <th>Intake Date</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPurchases.map((purchase) => (
                      <tr
                        key={purchase.purchase_id}
                        onClick={() => setSelectedPurchase(purchase)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>
                          {purchase.purchase_id}
                        </td>

                        <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-600)' }}>
                          {purchase.inventory_id}
                        </td>

                        <td>
                          <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={13} color="var(--text-muted)" />
                            <span>{purchase.seller_name}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {purchase.seller_phone}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                            {purchase.id_type}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                            ✓ {purchase.id_verification_status || 'Verified'}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontWeight: 700 }}>
                            {purchase.brand} {purchase.model}
                          </div>
                          <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                            IMEI: {purchase.imei_1 || '—'}
                          </div>
                        </td>

                        <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                          {formatCurrency(purchase.purchase_price, settings.currency)}
                        </td>

                        <td>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-subtle)' }}>
                            {purchase.payment_method || 'Cash'}
                          </span>
                        </td>

                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {formatDate(purchase.purchase_date)} {purchase.purchase_time ? `• ${purchase.purchase_time}` : ''}
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '4px' }}>
                            <button
                              className="btn btn-subtle btn-icon btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPurchase(purchase);
                              }}
                              title="Edit Buyback Record & Photos"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              className="btn btn-subtle btn-icon btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPurchase(purchase);
                              }}
                              title="View KYC & Details"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div
                className="hide-desktop"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '12px'
                }}
              >
                {filteredPurchases.map((purchase) => (
                  <div
                    key={purchase.purchase_id}
                    className="card animate-fade-in"
                    onClick={() => setSelectedPurchase(purchase)}
                    style={{
                      padding: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {purchase.brand} {purchase.model}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Linked: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-600)' }}>{purchase.inventory_id}</span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#059669' }}>
                          {formatCurrency(purchase.purchase_price, settings.currency)}
                        </div>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'var(--status-available-bg)',
                            color: 'var(--status-available-text)',
                            display: 'inline-block',
                            marginTop: '2px'
                          }}
                        >
                          ✓ {purchase.id_verification_status || 'Verified'}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        padding: '8px 10px',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.78rem'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Seller</div>
                        <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {purchase.seller_name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{purchase.seller_phone}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>ID Proof / Date</div>
                        <div style={{ fontWeight: 600 }}>{purchase.id_type}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatDate(purchase.purchase_date)}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {purchase.purchase_id}
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPurchase(purchase);
                          }}
                          style={{ height: '34px', fontSize: '0.75rem', padding: '0 10px' }}
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPurchase(purchase);
                          }}
                          style={{ height: '34px', fontSize: '0.75rem', padding: '0 10px' }}
                        >
                          <Eye size={13} /> View KYC
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: IMEI TRACEABILITY & AUDIT */}
      {activeTab === 'trace' && (
        <IMEITraceView
          onSelectPurchase={(pur) => setSelectedPurchase(pur)}
        />
      )}

      {/* Purchase Details Modal */}
      <PurchaseDetailsModal
        purchase={selectedPurchase}
        isOpen={Boolean(selectedPurchase)}
        onClose={() => setSelectedPurchase(null)}
        onArchive={async (purId) => {
          await archivePurchase(purId);
          setSelectedPurchase(null);
        }}
        onEdit={(pur) => setEditingPurchase(pur)}
      />

      {/* Edit Purchase Modal */}
      <EditPurchaseModal
        purchase={editingPurchase}
        isOpen={Boolean(editingPurchase)}
        onClose={() => setEditingPurchase(null)}
      />
    </div>
  );
};
