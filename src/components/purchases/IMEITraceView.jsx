import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { formatCurrency, formatDate, maskIMEI } from '../../utils/formatters';
import {
  Search,
  ShieldCheck,
  Smartphone,
  ArrowDown,
  User,
  ShoppingBag,
  Clock,
  Printer,
  FileCheck,
  AlertCircle
} from 'lucide-react';

export const IMEITraceView = ({ onSelectPurchase, onSelectInventory }) => {
  const { traceIMEI, settings } = useInventory();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [traceResult, setTraceResult] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setSearched(true);
    const result = await traceIMEI(query.trim());
    setTraceResult(result);
    setSearching(false);
  };

  const handlePrintAudit = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      {/* Search Header Box */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>IMEI Traceability & Lawful Audit Trail</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Trace complete ownership history: Seller Buyback → Inventory Vault → Customer Sale.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 220px', position: 'relative', minWidth: 0 }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type="text"
                placeholder="Enter 15-digit IMEI / Serial..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="input"
                style={{ paddingLeft: '38px', height: '44px', fontFamily: 'monospace', width: '100%' }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={searching}
              style={{ minHeight: '44px', flex: '0 0 auto' }}
            >
              {searching ? 'Tracing...' : 'Trace Device'}
            </button>
          </div>
        </form>
      </div>

      {/* Results Timeline */}
      {searched && (
        <div>
          {!traceResult || (!traceResult.purchases?.length && !traceResult.inventory?.length) ? (
            <div className="card" style={{ padding: '36px', textAlign: 'center' }}>
              <AlertCircle size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No Records Found for IMEI</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                No buyback or inventory entry was found matching <code style={{ fontFamily: 'monospace' }}>{query}</code>.
              </p>
            </div>
          ) : (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                  Audit Trail for IMEI: <span style={{ fontFamily: 'monospace', color: 'var(--primary-600)' }}>{traceResult.imei}</span>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={handlePrintAudit}>
                  <Printer size={14} /> Print Audit Record
                </button>
              </div>

              {/* TIMELINE CARD 1: Purchase / Seller Origin */}
              {traceResult.purchases && traceResult.purchases.length > 0 ? (
                traceResult.purchases.map((pur) => (
                  <div key={pur.purchase_id} className="card" style={{ padding: '20px', borderLeft: '4px solid #059669' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                          1
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Purchase & Seller Intake</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Purchase ID: <strong style={{ fontFamily: 'monospace' }}>{pur.purchase_id}</strong></div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {formatDate(pur.purchase_date)} {pur.purchase_time || ''}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px', marginTop: '12px', padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Seller Legal Name</div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{pur.seller_name}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Contact Phone</div>
                        <div style={{ fontSize: '0.875rem' }}>{pur.seller_phone}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>ID Verification</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{pur.id_type} ({pur.id_number_ref || 'Verified'})</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Purchase Price Disbursed</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#059669' }}>{formatCurrency(pur.purchase_price, settings.currency)}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card" style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No initial buyback intake record found (Device may have been directly procured from distributor).
                </div>
              )}

              {/* TIMELINE CARD 2: Current Inventory Record */}
              {traceResult.inventory && traceResult.inventory.length > 0 && traceResult.inventory.map((inv) => (
                <div key={inv.inventory_id} className="card" style={{ padding: '20px', borderLeft: '4px solid #6366f1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                        2
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Cataloged in Inventory</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Inventory ID: <strong style={{ fontFamily: 'monospace' }}>{inv.inventory_id}</strong></div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '999px', backgroundColor: inv.status === 'Sold' ? '#eff6ff' : '#ecfdf5', color: inv.status === 'Sold' ? '#1d4ed8' : '#059669' }}>
                        {inv.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px', marginTop: '12px', padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Device Specifications</div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{inv.brand} {inv.model} ({inv.storage || ''})</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Condition & Battery</div>
                      <div style={{ fontSize: '0.875rem' }}>{inv.condition} {inv.battery_health ? `(${inv.battery_health}%)` : ''}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Procurement Cost</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{formatCurrency(inv.purchase_price, settings.currency)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Target Retail Price</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-600)' }}>{formatCurrency(inv.selling_price, settings.currency)}</div>
                    </div>
                  </div>

                  {/* TIMELINE CARD 3: Sale Outcome (If Sold) */}
                  {inv.status === 'Sold' && (
                    <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem' }}>
                          3
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1d4ed8' }}>
                          Sale Outcome & Transfer to Buyer
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', padding: '12px', backgroundColor: 'var(--status-sold-bg)', borderRadius: 'var(--radius-md)' }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Buyer Full Name</div>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{inv.customer || 'Direct Customer'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Date Sold</div>
                          <div style={{ fontSize: '0.875rem' }}>{formatDate(inv.selling_date || inv.updated_at)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Final Sale Price</div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1d4ed8' }}>{formatCurrency(inv.selling_price, settings.currency)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Net Realized Profit</div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#10b981' }}>
                            +{formatCurrency((Number(inv.selling_price) || 0) - (Number(inv.purchase_price) || 0), settings.currency)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
