import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { validateInventoryForm } from '../utils/validators';
import { compressMultipleImages } from '../services/imageCompression';
import { BarcodeScannerModal } from '../components/inventory/BarcodeScannerModal';
import { formatCurrency, calculateProfitMargin } from '../utils/formatters';
import {
  BRAND_PRESETS,
  STORAGE_PRESETS,
  RAM_PRESETS,
  CONDITION_PRESETS,
  STATUS_PRESETS
} from '../data/sampleInventory';

import {
  Smartphone,
  Shield,
  DollarSign,
  Camera,
  Upload,
  X,
  CheckCircle,
  PlusCircle,
  Sparkles,
  Info
} from 'lucide-react';

export const AddInventory = ({ setCurrentTab }) => {
  const { inventory, addInventoryItem, settings } = useInventory();
  const { showError, showWarning } = useToast();

  const [formData, setFormData] = useState({
    brand: 'Apple',
    model: '',
    variant: '',
    color: '',
    storage: '256 GB',
    ram: '8 GB',
    imei_1: '',
    imei_2: '',
    serial_number: '',
    battery_health: 100,
    condition: 'Brand New',
    purchase_price: '',
    selling_price: '',
    purchase_date: new Date().toISOString().split('T')[0],
    supplier: '',
    status: 'Available',
    accessories: 'Box, Original Cable, Adapter',
    warranty: '1 Year Store Warranty',
    notes: '',
    photo_urls: []
  });

  const [errors, setErrors] = useState({});
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scannerTargetField, setScannerTargetField] = useState(null); // 'imei_1' | 'imei_2' | 'serial_number'

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setCompressing(true);
    try {
      const { results, errors: compErrors } = await compressMultipleImages(files);

      if (compErrors && compErrors.length > 0) {
        showWarning(compErrors.join(' | '), 'Image Notice');
      }

      if (results && results.length > 0) {
        const newUrls = results.map(c => c.dataUrl);
        const updated = [...photoPreviews, ...newUrls];
        setPhotoPreviews(updated);
        setFormData(prev => ({ ...prev, photo_urls: updated }));
      }
    } catch (err) {
      console.error('Failed to compress images', err);
      showError(err.message || 'Failed to process images.', 'Image Error');
    } finally {
      setCompressing(false);
      // Reset input value to allow re-uploading the same file if needed
      e.target.value = '';
    }
  };

  const removePhoto = (index) => {
    const updated = photoPreviews.filter((_, i) => i !== index);
    setPhotoPreviews(updated);
    setFormData(prev => ({ ...prev, photo_urls: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateInventoryForm(formData, inventory);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    const result = await addInventoryItem(formData);
    setSubmitting(false);

    if (result.success) {
      // Reset form
      setFormData({
        brand: 'Apple',
        model: '',
        variant: '',
        color: '',
        storage: '256 GB',
        ram: '8 GB',
        imei_1: '',
        imei_2: '',
        serial_number: '',
        battery_health: 100,
        condition: 'Brand New',
        purchase_price: '',
        selling_price: '',
        purchase_date: new Date().toISOString().split('T')[0],
        supplier: '',
        status: 'Available',
        accessories: '',
        warranty: '1 Year Store Warranty',
        notes: '',
        photo_urls: []
      });
      setPhotoPreviews([]);
      setErrors({});
      setCurrentTab('inventory');
    }
  };

  const estimatedProfit = (Number(formData.selling_price) || 0) - (Number(formData.purchase_price) || 0);
  const profitMargin = calculateProfitMargin(formData.purchase_price, formData.selling_price);

  return (
    <div className="page-wrapper animate-fade-in" style={{ maxWidth: '960px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800 }}>Add Phone to Inventory</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
          Record hardware details, IMEI identification, pricing, and inspect condition.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Quick Brand Selector Chips */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-secondary)' }}>
              Quick Select Popular Brands:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Nothing', 'Motorola', 'Vivo', 'Realme'].map(b => (
                <button
                  type="button"
                  key={b}
                  onClick={() => handleChange('brand', b)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid',
                    borderColor: formData.brand === b ? 'var(--primary-600)' : 'var(--border-subtle)',
                    backgroundColor: formData.brand === b ? 'var(--primary-50)' : 'var(--bg-surface)',
                    color: formData.brand === b ? 'var(--primary-600)' : 'var(--text-secondary)',
                    fontWeight: formData.brand === b ? 700 : 500,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: Device Details */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={18} color="var(--primary-600)" />
              Device Specifications
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {/* Brand */}
              <div className="form-group">
                <label className="form-label">Brand <span className="required">*</span></label>
                <select
                  className={`select ${errors.brand ? 'input-error' : ''}`}
                  value={formData.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                >
                  {BRAND_PRESETS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                {errors.brand && <div className="input-error-msg">{errors.brand}</div>}
              </div>

              {/* Model */}
              <div className="form-group">
                <label className="form-label">Model <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  className={`input ${errors.model ? 'input-error' : ''}`}
                  placeholder="e.g. iPhone 15 Pro Max, Galaxy S24 Ultra"
                  value={formData.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                />
                {errors.model && <div className="input-error-msg">{errors.model}</div>}
              </div>

              {/* Variant / Model Number */}
              <div className="form-group">
                <label className="form-label">Model Number / Variant</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. A3102 / SM-S928B"
                  value={formData.variant}
                  onChange={(e) => handleChange('variant', e.target.value)}
                />
              </div>

              {/* Color */}
              <div className="form-group">
                <label className="form-label">Color / Finish</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Natural Titanium, Obsidian"
                  value={formData.color}
                  onChange={(e) => handleChange('color', e.target.value)}
                />
              </div>

              {/* Storage */}
              <div className="form-group">
                <label className="form-label">Storage Capacity</label>
                <select
                  className="select"
                  value={formData.storage}
                  onChange={(e) => handleChange('storage', e.target.value)}
                >
                  <option value="">Select Capacity</option>
                  {STORAGE_PRESETS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* RAM */}
              <div className="form-group">
                <label className="form-label">RAM</label>
                <select
                  className="select"
                  value={formData.ram}
                  onChange={(e) => handleChange('ram', e.target.value)}
                >
                  <option value="">Select RAM</option>
                  {RAM_PRESETS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Identification */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} color="var(--primary-600)" />
              Device Identification (IMEI & Serial)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {/* IMEI 1 */}
              <div className="form-group">
                <label className="form-label">
                  <span>IMEI 1 (Primary)</span>
                  <button
                    type="button"
                    onClick={() => setScannerTargetField('imei_1')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-600)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Camera size={13} /> Scan / Generate
                  </button>
                </label>
                <input
                  type="text"
                  maxLength={16}
                  className={`input ${errors.imei_1 ? 'input-error' : ''}`}
                  placeholder="15-digit primary IMEI"
                  value={formData.imei_1}
                  onChange={(e) => handleChange('imei_1', e.target.value)}
                />
                {errors.imei_1 && <div className="input-error-msg">{errors.imei_1}</div>}
              </div>

              {/* IMEI 2 */}
              <div className="form-group">
                <label className="form-label">
                  <span>IMEI 2 (Secondary / eSIM)</span>
                  <button
                    type="button"
                    onClick={() => setScannerTargetField('imei_2')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-600)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Camera size={13} /> Scan
                  </button>
                </label>
                <input
                  type="text"
                  maxLength={16}
                  className={`input ${errors.imei_2 ? 'input-error' : ''}`}
                  placeholder="15-digit secondary IMEI"
                  value={formData.imei_2}
                  onChange={(e) => handleChange('imei_2', e.target.value)}
                />
                {errors.imei_2 && <div className="input-error-msg">{errors.imei_2}</div>}
              </div>

              {/* Serial Number */}
              <div className="form-group">
                <label className="form-label">Serial Number</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. F2LL89V1N8"
                  value={formData.serial_number}
                  onChange={(e) => handleChange('serial_number', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Financials & Margin Preview */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} color="var(--primary-600)" />
              Financials & Pricing
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {/* Purchase Price */}
              <div className="form-group">
                <label className="form-label">
                  <span>Purchase Price ({settings.currency}) <span className="required">*</span></span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  className={`input ${errors.purchase_price ? 'input-error' : ''}`}
                  placeholder="e.g. 75000"
                  value={formData.purchase_price}
                  onChange={(e) => handleChange('purchase_price', e.target.value)}
                />
                {errors.purchase_price && <div className="input-error-msg">{errors.purchase_price}</div>}
              </div>

              {/* Selling Price */}
              <div className="form-group">
                <label className="form-label">
                  <span>Target Selling Price ({settings.currency})</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className={`input ${errors.selling_price ? 'input-error' : ''}`}
                  placeholder="e.g. 88000"
                  value={formData.selling_price}
                  onChange={(e) => handleChange('selling_price', e.target.value)}
                />
                {errors.selling_price && <div className="input-error-msg">{errors.selling_price}</div>}
              </div>

              {/* Purchase Date */}
              <div className="form-group">
                <label className="form-label">Purchase Date</label>
                <input
                  type="date"
                  className="input"
                  value={formData.purchase_date}
                  onChange={(e) => handleChange('purchase_date', e.target.value)}
                />
              </div>

              {/* Supplier */}
              <div className="form-group">
                <label className="form-label">Supplier / Source</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Wholesaler or trade-in customer"
                  value={formData.supplier}
                  onChange={(e) => handleChange('supplier', e.target.value)}
                />
              </div>
            </div>

            {/* Live Profit Calculation Banner */}
            {formData.purchase_price && formData.selling_price && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: estimatedProfit >= 0 ? 'var(--status-available-bg)' : 'var(--status-danger-bg)',
                  border: `1px solid ${estimatedProfit >= 0 ? 'var(--status-available-border)' : 'var(--status-danger-border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Calculated Potential Profit:
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: estimatedProfit >= 0 ? '#10b981' : '#ef4444' }}>
                    {formatCurrency(estimatedProfit, settings.currency)}
                  </div>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: estimatedProfit >= 0 ? 'var(--status-available-text)' : 'var(--status-danger-text)' }}>
                  +{profitMargin}% Margin
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Condition, Battery & Warranty */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--primary-600)" />
              Condition & Inspection
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {/* Battery Health */}
              <div className="form-group">
                <label className="form-label">Battery Health (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className={`input ${errors.battery_health ? 'input-error' : ''}`}
                  placeholder="e.g. 100"
                  value={formData.battery_health}
                  onChange={(e) => handleChange('battery_health', e.target.value)}
                />
                {errors.battery_health && <div className="input-error-msg">{errors.battery_health}</div>}
              </div>

              {/* Condition */}
              <div className="form-group">
                <label className="form-label">Physical Condition</label>
                <select
                  className="select"
                  value={formData.condition}
                  onChange={(e) => handleChange('condition', e.target.value)}
                >
                  {CONDITION_PRESETS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="form-group">
                <label className="form-label">Initial Status</label>
                <select
                  className="select"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  {STATUS_PRESETS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Warranty */}
              <div className="form-group">
                <label className="form-label">Warranty Details</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. 6 Months Store Warranty / AppleCare"
                  value={formData.warranty}
                  onChange={(e) => handleChange('warranty', e.target.value)}
                />
              </div>
            </div>

            {/* Accessories */}
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="form-label">Included Accessories</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Original Box, USB-C Cable, 67W Charger, Case"
                value={formData.accessories}
                onChange={(e) => handleChange('accessories', e.target.value)}
              />
            </div>
          </div>

          {/* Section 5: Photos & Notes */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={18} color="var(--primary-600)" />
              Product Photos & Drive Storage
            </h3>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              {photoPreviews.map((url, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '88px',
                    height: '88px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: 'rgba(239, 68, 68, 0.9)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '22px',
                      height: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}

              <label
                style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: 'var(--radius-md)',
                  border: '2px dashed var(--border-strong)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  gap: '4px',
                  fontSize: '0.75rem',
                  backgroundColor: 'var(--bg-subtle)'
                }}
              >
                <Upload size={20} />
                <span>{compressing ? 'Processing...' : 'Upload'}</span>
                <input
                  type="file"
                  multiple
                  disabled={compressing || submitting}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label">Inspection & Technical Notes</label>
              <textarea
                rows={3}
                className="textarea"
                placeholder="Details regarding screen scratch, repair history, trade-in comments..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </div>
          </div>

          {/* Submit Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={() => setCurrentTab('inventory')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
            >
              <CheckCircle size={18} />
              {submitting ? 'Saving to Vault...' : 'Save Phone to Inventory'}
            </button>
          </div>
        </div>
      </form>

      {/* Barcode / IMEI Scanner Modal */}
      <BarcodeScannerModal
        isOpen={Boolean(scannerTargetField)}
        onClose={() => setScannerTargetField(null)}
        onScanComplete={(scannedVal) => {
          if (scannerTargetField) {
            handleChange(scannerTargetField, scannedVal);
          }
        }}
      />
    </div>
  );
};
