import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { validateInventoryForm } from '../utils/validators';
import { compressImage, compressMultipleImages, validateImageFile } from '../services/imageCompression';
import { BarcodeScannerModal } from '../components/inventory/BarcodeScannerModal';
import { formatCurrency, calculateProfitMargin, getSafeImageUrl } from '../utils/formatters';
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
  CheckCircle2,
  PlusCircle,
  Sparkles,
  RotateCw,
  AlertCircle,
  Info
} from 'lucide-react';

export const AddInventory = ({ setCurrentTab }) => {
  const { inventory, addInventoryItem, uploadDevicePhoto, storageMode, settings } = useInventory();
  const { showError, showWarning, showSuccess } = useToast();

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
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [photoItems, setPhotoItems] = useState([]); // [{ id, previewUrl, base64, mimeType, fileName, status: 'uploading' | 'uploaded' | 'error', driveUrl, error }]
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scannerTargetField, setScannerTargetField] = useState(null); // 'imei_1' | 'imei_2' | 'serial_number'

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Upload single photo helper
  const processAndUploadPhoto = async (file) => {
    const photoId = 'photo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const previewUrl = URL.createObjectURL(file);

    // Initial placeholder item
    const newItem = {
      id: photoId,
      previewUrl,
      fileName: file.name,
      status: 'uploading',
      driveUrl: null,
      error: null,
      base64: '',
      mimeType: file.type || 'image/jpeg'
    };

    setPhotoItems(prev => [...prev, newItem]);

    try {
      const compressed = await compressImage(file, 1200, 1200, 0.8);
      newItem.base64 = compressed.base64;
      newItem.mimeType = compressed.mimeType;
      newItem.fileName = compressed.name;

      if (storageMode === 'google') {
        const uploadRes = await uploadDevicePhoto({
          inventory_id: 'UNASSIGNED',
          base64_data: compressed.base64,
          mime_type: compressed.mimeType,
          file_name: compressed.name
        });

        if (uploadRes && uploadRes.success && (uploadRes.thumbnail_url || uploadRes.file_url || uploadRes.url)) {
          const driveUrl = uploadRes.thumbnail_url || uploadRes.file_url || uploadRes.url;
          setPhotoItems(prev => prev.map(p => p.id === photoId ? {
            ...p,
            status: 'uploaded',
            driveUrl: driveUrl,
            error: null
          } : p));
          showSuccess(`Photo "${file.name}" uploaded to Google Drive!`, 'Photo Uploaded');
        } else {
          throw new Error(uploadRes?.error || 'Google Drive upload failed');
        }
      } else {
        // Local storage mode
        setPhotoItems(prev => prev.map(p => p.id === photoId ? {
          ...p,
          status: 'uploaded',
          driveUrl: compressed.dataUrl,
          error: null
        } : p));
      }
    } catch (err) {
      console.error('[Photo Upload] Error processing upload:', err);
      setPhotoItems(prev => prev.map(p => p.id === photoId ? {
        ...p,
        status: 'error',
        error: err.message || 'Upload failed'
      } : p));
      showError(`Failed to upload "${file.name}": ${err.message}`, 'Upload Error');
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setCompressing(true);
    for (const file of files) {
      await processAndUploadPhoto(file);
    }
    setCompressing(false);
    e.target.value = '';
  };

  const removePhoto = (id) => {
    setPhotoItems(prev => {
      const target = prev.find(p => p.id === id);
      if (target && target.previewUrl && target.previewUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(target.previewUrl); } catch (e) {}
      }
      return prev.filter(p => p.id !== id);
    });
  };

  const retryUploadPhoto = async (photoItem) => {
    if (!photoItem.base64 && photoItem.file) {
      await processAndUploadPhoto(photoItem.file);
      return;
    }

    setPhotoItems(prev => prev.map(p => p.id === photoItem.id ? { ...p, status: 'uploading', error: null } : p));

    try {
      if (storageMode === 'google') {
        const uploadRes = await uploadDevicePhoto({
          inventory_id: 'UNASSIGNED',
          base64_data: photoItem.base64,
          mime_type: photoItem.mimeType,
          file_name: photoItem.fileName
        });

        if (uploadRes && uploadRes.success && (uploadRes.thumbnail_url || uploadRes.file_url || uploadRes.url)) {
          const driveUrl = uploadRes.thumbnail_url || uploadRes.file_url || uploadRes.url;
          setPhotoItems(prev => prev.map(p => p.id === photoItem.id ? {
            ...p,
            status: 'uploaded',
            driveUrl: driveUrl,
            error: null
          } : p));
          showSuccess(`Photo uploaded to Google Drive!`, 'Photo Uploaded');
        } else {
          throw new Error(uploadRes?.error || 'Google Drive upload failed');
        }
      }
    } catch (err) {
      setPhotoItems(prev => prev.map(p => p.id === photoItem.id ? {
        ...p,
        status: 'error',
        error: err.message
      } : p));
      showError(`Retry failed: ${err.message}`, 'Upload Failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if any photo is still uploading
    const stillUploading = photoItems.some(p => p.status === 'uploading');
    if (stillUploading) {
      showWarning('Please wait for photos to finish uploading to Google Drive.', 'Upload in Progress');
      return;
    }

    // Check if any photo failed
    const failedPhotos = photoItems.filter(p => p.status === 'error');
    if (failedPhotos.length > 0) {
      showWarning('Some photos failed to upload to Google Drive. Please retry or remove them before saving.', 'Failed Photos');
      return;
    }

    const validation = validateInventoryForm(formData, inventory);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Collect ONLY permanent URLs (never blob: URLs!)
    const finalPhotoUrls = photoItems
      .filter(p => p.status === 'uploaded' && p.driveUrl && !p.driveUrl.startsWith('blob:'))
      .map(p => p.driveUrl);

    const submissionPayload = {
      ...formData,
      photo_urls: finalPhotoUrls
    };

    setSubmitting(true);
    const result = await addInventoryItem(submissionPayload);
    setSubmitting(false);

    if (result.success) {
      // Clean up object URLs
      photoItems.forEach(p => {
        if (p.previewUrl && p.previewUrl.startsWith('blob:')) {
          try { URL.revokeObjectURL(p.previewUrl); } catch (e) {}
        }
      });

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
        notes: ''
      });
      setPhotoItems([]);
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
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>
              Quick Select Brand:
            </div>
            <div className="horizontal-scroll-chips">
              {['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Nothing', 'Motorola', 'Vivo', 'Realme'].map(b => (
                <button
                  type="button"
                  key={b}
                  onClick={() => handleChange('brand', b)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid',
                    borderColor: formData.brand === b ? 'var(--primary-600)' : 'var(--border-subtle)',
                    backgroundColor: formData.brand === b ? 'var(--primary-50)' : 'var(--bg-surface)',
                    color: formData.brand === b ? 'var(--primary-600)' : 'var(--text-secondary)',
                    fontWeight: formData.brand === b ? 700 : 600,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: Device Details */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={18} color="var(--primary-600)" />
              Device Specifications
            </h3>

            <div className="form-grid-responsive">
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
          <div className="card" style={{ padding: '18px 20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} color="var(--primary-600)" />
              Device Identification (IMEI & Serial)
            </h3>

            <div className="form-grid-responsive">
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
                  inputMode="numeric"
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
                  inputMode="numeric"
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
          <div className="card" style={{ padding: '18px 20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} color="var(--primary-600)" />
              Financials & Pricing
            </h3>

            <div className="form-grid-responsive">
              {/* Purchase Price */}
              <div className="form-group">
                <label className="form-label">
                  <span>Purchase Price ({settings.currency}) <span className="required">*</span></span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
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
                  inputMode="numeric"
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
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: estimatedProfit >= 0 ? 'var(--status-available-bg)' : 'var(--status-danger-bg)',
                  border: `1px solid ${estimatedProfit >= 0 ? 'var(--status-available-border)' : 'var(--status-danger-border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Calculated Potential Profit:
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: estimatedProfit >= 0 ? '#10b981' : '#ef4444' }}>
                    {formatCurrency(estimatedProfit, settings.currency)}
                  </div>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: estimatedProfit >= 0 ? 'var(--status-available-text)' : 'var(--status-danger-text)' }}>
                  +{profitMargin}% Margin
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Condition, Battery & Warranty */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--primary-600)" />
              Condition & Inspection
            </h3>

            <div className="form-grid-responsive">
              {/* Battery Health */}
              <div className="form-group">
                <label className="form-label">Battery Health (%)</label>
                <input
                  type="number"
                  inputMode="numeric"
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
            <div className="form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
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
          <div className="card" style={{ padding: '18px 20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={18} color="var(--primary-600)" />
              Product Photos & Storage
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {storageMode === 'google'
                ? 'Photos are compressed and uploaded directly to Google Drive.'
                : 'Running in Local Storage Mode. Photos will be stored locally.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: '10px', marginBottom: '16px' }}>
              {photoItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    aspectRatio: '1/1',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    position: 'relative',
                    border: `1px solid ${
                      item.status === 'error'
                        ? 'var(--status-danger-border)'
                        : item.status === 'uploaded'
                        ? 'var(--status-available-border)'
                        : 'var(--border-subtle)'
                    }`,
                    backgroundColor: 'var(--bg-subtle)'
                  }}
                >
                  <img
                    src={item.previewUrl || item.driveUrl}
                    alt={item.fileName || 'Product Photo'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Uploading Overlay */}
                  {item.status === 'uploading' && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.65)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        color: '#fff',
                        fontSize: '0.62rem',
                        fontWeight: 600,
                        padding: '4px',
                        textAlign: 'center'
                      }}
                    >
                      <RotateCw size={16} className="animate-spin" color="#38bdf8" />
                      <span>Uploading...</span>
                    </div>
                  )}

                  {/* Success Badge */}
                  {item.status === 'uploaded' && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '3px',
                        left: '3px',
                        right: '3px',
                        backgroundColor: 'rgba(16, 185, 129, 0.9)',
                        color: '#fff',
                        fontSize: '0.58rem',
                        fontWeight: 700,
                        padding: '2px',
                        borderRadius: 'var(--radius-xs)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px'
                      }}
                      title="Stored in Drive"
                    >
                      <CheckCircle2 size={9} />
                      <span>{storageMode === 'google' ? 'Drive' : 'Saved'}</span>
                    </div>
                  )}

                  {/* Error Overlay */}
                  {item.status === 'error' && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(239, 68, 68, 0.85)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px',
                        color: '#fff',
                        fontSize: '0.62rem',
                        padding: '4px',
                        textAlign: 'center'
                      }}
                    >
                      <AlertCircle size={14} />
                      <span>Failed</span>
                      <button
                        type="button"
                        onClick={() => retryUploadPhoto(item)}
                        style={{
                          marginTop: '2px',
                          padding: '2px 5px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: '#fff',
                          color: '#ef4444',
                          border: 'none',
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removePhoto(item.id)}
                    title="Remove Photo"
                    style={{
                      position: 'absolute',
                      top: '3px',
                      right: '3px',
                      background: 'rgba(0, 0, 0, 0.65)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '22px',
                      height: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {/* Add Photo Button */}
              <label
                style={{
                  aspectRatio: '1/1',
                  borderRadius: 'var(--radius-md)',
                  border: '2px dashed var(--border-strong)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: compressing || submitting ? 'not-allowed' : 'pointer',
                  color: 'var(--text-muted)',
                  gap: '4px',
                  fontSize: '0.72rem',
                  backgroundColor: 'var(--bg-subtle)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {compressing ? <RotateCw size={18} className="animate-spin" /> : <Upload size={18} />}
                <span>{compressing ? 'Compressing...' : '+ Add Photo'}</span>
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
            <div className="form-group" style={{ marginBottom: 0 }}>
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={() => setCurrentTab('inventory')}
              disabled={submitting}
              style={{ flex: 1, minWidth: '120px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
              style={{ flex: 2, minWidth: '180px' }}
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

export default AddInventory;
