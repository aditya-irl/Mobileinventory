import React, { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useToast } from '../../context/ToastContext';
import { validateInventoryForm } from '../../utils/validators';
import { compressImage, compressMultipleImages, validateImageFile } from '../../services/imageCompression';
import { getSafeImageUrl } from '../../utils/formatters';
import {
  BRAND_PRESETS,
  STORAGE_PRESETS,
  RAM_PRESETS,
  CONDITION_PRESETS,
  STATUS_PRESETS
} from '../../data/sampleInventory';
import { X, Save, Upload, Trash2, Smartphone, DollarSign, Shield, Info, RotateCw } from 'lucide-react';

export const EditInventoryModal = ({ item, isOpen, onClose }) => {
  const { inventory, updateInventoryItem, uploadDevicePhoto, storageMode, settings } = useInventory();
  const { showError, showWarning, showSuccess } = useToast();

  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        inventory_id: item.inventory_id || '',
        brand: item.brand || '',
        model: item.model || '',
        variant: item.variant || '',
        color: item.color || '',
        storage: item.storage || '',
        ram: item.ram || '',
        imei_1: item.imei_1 || '',
        imei_2: item.imei_2 || '',
        serial_number: item.serial_number || '',
        battery_health: item.battery_health !== null && item.battery_health !== undefined ? item.battery_health : '',
        condition: item.condition || 'Brand New',
        purchase_price: item.purchase_price !== undefined ? item.purchase_price : '',
        selling_price: item.selling_price !== undefined ? item.selling_price : '',
        purchase_date: item.purchase_date || '',
        selling_date: item.selling_date || '',
        supplier: item.supplier || '',
        customer: item.customer || '',
        status: item.status || 'Available',
        accessories: item.accessories || '',
        warranty: item.warranty || '',
        notes: item.notes || '',
        photo_urls: item.photo_urls || []
      });
      setPhotoPreviews(item.photo_urls || []);
      setErrors({});
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadingPhoto(true);
    try {
      let currentPhotos = [...(formData.photo_urls || [])];

      for (const file of files) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          showWarning(validation.error, 'Invalid Image');
          continue;
        }

        const compressed = await compressImage(file, 1200, 1200, 0.8);

        if (storageMode === 'google') {
          const uploadRes = await uploadDevicePhoto({
            inventory_id: item.inventory_id,
            base64_data: compressed.base64,
            mime_type: compressed.mimeType,
            file_name: `${item.inventory_id}_${Date.now()}.jpg`
          });

          if (uploadRes && uploadRes.success && (uploadRes.thumbnail_url || uploadRes.file_url || uploadRes.url)) {
            const driveUrl = uploadRes.thumbnail_url || uploadRes.file_url || uploadRes.url;
            if (!currentPhotos.includes(driveUrl)) {
              currentPhotos.push(driveUrl);
            }
            showSuccess(`Photo "${file.name}" uploaded to Google Drive!`, 'Photo Uploaded');
          } else {
            throw new Error(uploadRes?.error || 'Photo upload to Google Drive failed.');
          }
        } else {
          // Local storage mode
          if (!currentPhotos.includes(compressed.dataUrl)) {
            currentPhotos.push(compressed.dataUrl);
          }
        }
      }

      setPhotoPreviews(currentPhotos);
      setFormData(prev => ({ ...prev, photo_urls: currentPhotos }));
    } catch (err) {
      console.error('Error processing photo upload:', err);
      showError(err.message || 'Failed to process image file.', 'Upload Error');
    } finally {
      setUploadingPhoto(false);
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

    if (uploadingPhoto) {
      showWarning('Please wait for photo upload to finish.', 'Uploading Photo');
      return;
    }

    const validation = validateInventoryForm(formData, inventory, item.inventory_id);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Filter out any blob: URLs
    const cleanPhotos = (formData.photo_urls || []).filter(u => u && !u.startsWith('blob:'));
    const finalPayload = {
      ...formData,
      photo_urls: cleanPhotos
    };

    setSaving(true);
    const result = await updateInventoryItem(finalPayload);
    setSaving(false);

    if (result.success) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '780px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Edit Device Record</h3>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              ID: {item.inventory_id}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Section 1: Device Specs */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Smartphone size={16} color="var(--primary-600)" />
                Device Information
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
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

                <div className="form-group">
                  <label className="form-label">Model <span className="required">*</span></label>
                  <input
                    type="text"
                    required
                    className={`input ${errors.model ? 'input-error' : ''}`}
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    placeholder="e.g. iPhone 15 Pro"
                  />
                  {errors.model && <div className="input-error-msg">{errors.model}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Color / Finish</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    placeholder="e.g. Natural Titanium"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Storage</label>
                  <select
                    className="select"
                    value={formData.storage}
                    onChange={(e) => handleChange('storage', e.target.value)}
                  >
                    <option value="">Select Storage</option>
                    {STORAGE_PRESETS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

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

                <div className="form-group">
                  <label className="form-label">Status</label>
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
              </div>
            </div>

            {/* Section 2: Identification */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={16} color="var(--primary-600)" />
                Identification & Hardware
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">IMEI 1</label>
                  <input
                    type="text"
                    maxLength={16}
                    className={`input ${errors.imei_1 ? 'input-error' : ''}`}
                    value={formData.imei_1}
                    onChange={(e) => handleChange('imei_1', e.target.value)}
                    placeholder="15-digit IMEI"
                  />
                  {errors.imei_1 && <div className="input-error-msg">{errors.imei_1}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">IMEI 2</label>
                  <input
                    type="text"
                    maxLength={16}
                    className={`input ${errors.imei_2 ? 'input-error' : ''}`}
                    value={formData.imei_2}
                    onChange={(e) => handleChange('imei_2', e.target.value)}
                    placeholder="15-digit secondary IMEI"
                  />
                  {errors.imei_2 && <div className="input-error-msg">{errors.imei_2}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Serial Number</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.serial_number}
                    onChange={(e) => handleChange('serial_number', e.target.value)}
                    placeholder="Device Serial"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Battery Health (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className={`input ${errors.battery_health ? 'input-error' : ''}`}
                    value={formData.battery_health}
                    onChange={(e) => handleChange('battery_health', e.target.value)}
                    placeholder="e.g. 98"
                  />
                  {errors.battery_health && <div className="input-error-msg">{errors.battery_health}</div>}
                </div>

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

                <div className="form-group">
                  <label className="form-label">Warranty Details</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.warranty}
                    onChange={(e) => handleChange('warranty', e.target.value)}
                    placeholder="e.g. 6 Months Store Warranty"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Financials */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={16} color="var(--primary-600)" />
                Financial Information
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Purchase Price ({settings.currency}) <span className="required">*</span></label>
                  <input
                    type="number"
                    required
                    min="0"
                    className={`input ${errors.purchase_price ? 'input-error' : ''}`}
                    value={formData.purchase_price}
                    onChange={(e) => handleChange('purchase_price', e.target.value)}
                  />
                  {errors.purchase_price && <div className="input-error-msg">{errors.purchase_price}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Selling Price ({settings.currency})</label>
                  <input
                    type="number"
                    min="0"
                    className={`input ${errors.selling_price ? 'input-error' : ''}`}
                    value={formData.selling_price}
                    onChange={(e) => handleChange('selling_price', e.target.value)}
                  />
                  {errors.selling_price && <div className="input-error-msg">{errors.selling_price}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Supplier / Source</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.supplier}
                    onChange={(e) => handleChange('supplier', e.target.value)}
                    placeholder="Wholesaler or customer name"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Photos */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={16} color="var(--primary-600)" />
                Device Photos
              </h4>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                {photoPreviews.map((url, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '74px',
                      height: '74px',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      position: 'relative',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <img src={getSafeImageUrl(url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                <label
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: 'var(--radius-md)',
                    border: '2px dashed var(--border-strong)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                    color: 'var(--text-muted)',
                    gap: '4px',
                    fontSize: '0.7rem'
                  }}
                >
                  {uploadingPhoto ? (
                    <>
                      <RotateCw size={18} className="animate-spin" color="var(--primary-600)" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      <span>+ Photo</span>
                    </>
                  )}
                  <input
                    type="file"
                    multiple
                    disabled={uploadingPhoto}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            {/* Section 5: Accessories & Notes */}
            <div>
              <div className="form-group">
                <label className="form-label">Included Accessories</label>
                <input
                  type="text"
                  className="input"
                  value={formData.accessories}
                  onChange={(e) => handleChange('accessories', e.target.value)}
                  placeholder="e.g. Original Box, 65W Fast Charger, Clear Case"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  rows={3}
                  className="textarea"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Condition notes, history, customer feedback..."
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
