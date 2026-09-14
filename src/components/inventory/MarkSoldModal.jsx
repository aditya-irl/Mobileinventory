import React, { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { formatCurrency } from '../../utils/formatters';
import { X, DollarSign, CheckCircle2, User, Calendar, Tag } from 'lucide-react';

export const MarkSoldModal = ({ item, isOpen, onClose }) => {
  const { markAsSold, settings } = useInventory();

  const [sellingPrice, setSellingPrice] = useState('');
  const [customer, setCustomer] = useState('');
  const [sellingDate, setSellingDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setSellingPrice(item.selling_price || '');
      setCustomer(item.customer || '');
      setSellingDate(new Date().toISOString().split('T')[0]);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const numericSellingPrice = Number(sellingPrice) || 0;
  const purchasePrice = Number(item.purchase_price) || 0;
  const realizedProfit = numericSellingPrice - purchasePrice;
  const marginPct = purchasePrice > 0 ? (((numericSellingPrice - purchasePrice) / purchasePrice) * 100).toFixed(1) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!item || !item.inventory_id) return;
    setSubmitting(true);

    const result = await markAsSold({
      ...item,
      inventory_id: item.inventory_id,
      selling_price: numericSellingPrice,
      customer: customer.trim() || 'Direct Customer',
      selling_date: sellingDate || new Date().toISOString().split('T')[0]
    });

    setSubmitting(false);
    if (result && result.success) {
      onClose();
    }
  };


  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '480px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Record Device Sale</h3>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {item.inventory_id} • {item.brand} {item.model}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Profit preview banner */}
            <div
              style={{
                backgroundColor: realizedProfit >= 0 ? 'var(--status-available-bg)' : 'var(--status-danger-bg)',
                border: `1px solid ${realizedProfit >= 0 ? 'var(--status-available-border)' : 'var(--status-danger-border)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Estimated Realized Profit:
                </div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: realizedProfit >= 0 ? '#10b981' : '#ef4444',
                    marginTop: '2px'
                  }}
                >
                  {formatCurrency(realizedProfit, settings.currency)}
                </div>
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: realizedProfit >= 0 ? 'var(--status-available-text)' : 'var(--status-danger-text)'
                }}
              >
                {marginPct}% Margin
              </div>
            </div>

            {/* Final Selling Price */}
            <div className="form-group">
              <label className="form-label">
                <span>Final Selling Price ({settings.currency}) <span className="required">*</span></span>
              </label>
              <div className="input-prefix-wrapper">
                <Tag size={16} className="input-prefix-icon" />
                <input
                  type="number"
                  required
                  min="0"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="input input-with-prefix"
                  placeholder="e.g. 85000"
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Purchase cost was {formatCurrency(item.purchase_price, settings.currency)}
              </span>
            </div>

            {/* Customer Name */}
            <div className="form-group">
              <label className="form-label">
                <span>Customer Name / Buyer</span>
              </label>
              <div className="input-prefix-wrapper">
                <User size={16} className="input-prefix-icon" />
                <input
                  type="text"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="input input-with-prefix"
                  placeholder="e.g. John Doe / Walk-in Buyer"
                />
              </div>
            </div>

            {/* Selling Date */}
            <div className="form-group">
              <label className="form-label">
                <span>Sale Date <span className="required">*</span></span>
              </label>
              <div className="input-prefix-wrapper">
                <Calendar size={16} className="input-prefix-icon" />
                <input
                  type="date"
                  required
                  value={sellingDate}
                  onChange={(e) => setSellingDate(e.target.value)}
                  className="input input-with-prefix"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <CheckCircle2 size={16} />
              {submitting ? 'Recording Sale...' : 'Confirm Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
