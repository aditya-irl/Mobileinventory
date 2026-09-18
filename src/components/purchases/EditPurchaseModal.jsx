import React, { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useToast } from '../../context/ToastContext';
import { compressMultipleImages } from '../../services/imageCompression';
import { getSafeImageUrl } from '../../utils/formatters';
import { extractPurchaseDocumentPhotos, extractPurchaseDevicePhotos } from '../../utils/buybackPhotos';
import { PhotoViewerModal } from '../common/PhotoViewerModal';
import {
  BRAND_PRESETS,
  STORAGE_PRESETS,
  RAM_PRESETS,
  CONDITION_PRESETS
} from '../../data/sampleInventory';
import {
  ID_TYPE_PRESETS,
  PAYMENT_METHOD_PRESETS
} from '../../data/samplePurchases';
import {
  X,
  Save,
  Upload,
  Camera,
  FileText,
  Smartphone,
  ShieldCheck,
  DollarSign,
  User,
  RotateCw,
  Eye,
  Trash2
} from 'lucide-react';

export const EditPurchaseModal = ({ purchase, isOpen, onClose, onUpdated }) => {
  const { inventory, updatePurchaseTransaction, settings } = useInventory();
  const { showError, showSuccess, showWarning } = useToast();

  const [formData, setFormData] = useState({});
  const [documentPhotos, setDocumentPhotos] = useState([]);
  const [devicePhotos, setDevicePhotos] = useState([]);

  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [uploadingDevices, setUploadingDevices] = useState(false);
  const [saving, setSaving] = useState(false);

  // Photo viewer modal state
  const [viewerState, setViewerState] = useState({
    isOpen: false,
    photos: [],
    initialIndex: 0,
    category: 'Document Photo'
  });

  useEffect(() => {
    if (purchase) {
      setFormData({
        purchase_id: purchase.purchase_id || '',
        inventory_id: purchase.inventory_id || '',
        seller_name: purchase.seller_name || '',
        seller_phone: purchase.seller_phone || '',
        seller_address: purchase.seller_address || '',
        id_type: purchase.id_type || "Driver's License",
        id_number_ref: purchase.id_number_ref || '',
        id_verification_status: purchase.id_verification_status || 'Verified',
        brand: purchase.brand || '',
        model: purchase.model || '',
        variant: purchase.variant || '',
        color: purchase.color || '',
        storage: purchase.storage || '',
        ram: purchase.ram || '',
        imei_1: purchase.imei_1 || '',
        imei_2: purchase.imei_2 || '',
        serial_number: purchase.serial_number || '',
        condition: purchase.condition || 'Like New',
        battery_health: purchase.battery_health !== undefined && purchase.battery_health !== null ? purchase.battery_health : 95,
        purchase_price: purchase.purchase_price !== undefined ? purchase.purchase_price : '',
        target_selling_price: purchase.target_selling_price || purchase.selling_price || '',
        payment_method: purchase.payment_method || 'Cash',
        purchase_date: purchase.purchase_date || '',
        purchase_time: purchase.purchase_time || '',
        notes: purchase.notes || '',
        operator_name: purchase.operator_name || 'Store Manager',
        status: purchase.status || 'Completed'
      });

      // Extract existing categorized photos safely
      const existingDocPhotos = extractPurchaseDocumentPhotos(purchase);
      const existingDevPhotos = extractPurchaseDevicePhotos(purchase, inventory);

      setDocumentPhotos(existingDocPhotos);
      setDevicePhotos(existingDevPhotos);
    }
  }, [purchase, inventory]);

  if (!isOpen || !purchase) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Upload Document Photos (No Artificial Limit)
  const handleDocumentPhotosUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingDocs(true);
    try {
      const { results, errors } = await compressMultipleImages(files);
      if (errors.length > 0) {
        showWarning(`Some files could not be processed: ${errors.join(', ')}`);
      }

      if (results.length > 0) {
        const newUrls = results.map(r => r.dataUrl);
        setDocumentPhotos(prev => [...prev, ...newUrls]);
        showSuccess(`Added ${results.length} document photo(s).`);
      }
    } catch (err) {
      showError('Failed to process document photos: ' + err.message);
    } finally {
      setUploadingDocs(false);
      e.target.value = '';
    }
  };

  // Upload Device Photos (No Artificial Limit)
  const handleDevicePhotosUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingDevices(true);
    try {
      const { results, errors } = await compressMultipleImages(files);
      if (errors.length > 0) {
        showWarning(`Some files could not be processed: ${errors.join(', ')}`);
      }

      if (results.length > 0) {
        const newUrls = results.map(r => r.dataUrl);
        setDevicePhotos(prev => [...prev, ...newUrls]);
        showSuccess(`Added ${results.length} device photo(s).`);
      }
    } catch (err) {
      showError('Failed to process device photos: ' + err.message);
    } finally {
      setUploadingDevices(false);
      e.target.value = '';
    }
  };

  const removeDocumentPhoto = (index) => {
    setDocumentPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeDevicePhoto = (index) => {
    setDevicePhotos(prev => prev.filter((_, i) => i !== index));
  };

  const openViewer = (photos, index, category) => {
    setViewerState({
      isOpen: true,
      photos,
      initialIndex: index,
      category
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.seller_name || !String(formData.seller_name).trim()) {
      showError('Please enter seller full legal name.');
      return;
    }

    if (!formData.seller_phone || !String(formData.seller_phone).trim()) {
      showError('Please enter seller contact mobile number.');
      return;
    }

    if (!formData.brand || !String(formData.brand).trim() || !formData.model || !String(formData.model).trim()) {
      showError('Brand and Model are required.');
      return;
    }

    if (formData.purchase_price === undefined || formData.purchase_price === '' || Number(formData.purchase_price) <= 0) {
      showError('Please enter a valid purchase price.');
      return;
    }

    setSaving(true);
    try {
      const updatedPayload = {
        ...formData,
        purchase_id: purchase.purchase_id,
        inventory_id: purchase.inventory_id,
        document_photos: documentPhotos,
        device_photos: devicePhotos,
        photo_urls: devicePhotos,
        seller_photo_url: documentPhotos[0] || '',
        document_photo_url: JSON.stringify(documentPhotos),
        updated_at: new Date().toISOString()
      };

      const result = await updatePurchaseTransaction(updatedPayload);
      if (result && result.success) {
        showSuccess(`Buyback record ${purchase.purchase_id} updated successfully.`, 'Updated');
        if (onUpdated) {
          onUpdated(result.data || updatedPayload);
        }
        onClose();
      } else {
        showError(result?.error || 'Failed to update buyback record.');
      }
    } catch (err) {
      showError('Failed to save buyback updates: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div
          className="modal-content"
          style={{ maxWidth: '840px' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Edit Buyback Record</h3>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#059669', fontSize: '0.85rem' }}>
                  {purchase.purchase_id}
                </span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Linked Inventory ID: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-600)' }}>{purchase.inventory_id}</span>
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
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

              {/* SECTION: DOCUMENT & DEVICE PHOTOS (COMPLETELY SEPARATED) */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={18} color="var(--primary-600)" />
                  Buyback Photos & Proofs
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '16px' }}>
                  
                  {/* Category A: DOCUMENT PHOTOS */}
                  <div
                    className="card"
                    style={{
                      padding: '16px',
                      backgroundColor: 'rgba(5, 150, 105, 0.03)',
                      border: '1.5px solid rgba(5, 150, 105, 0.25)',
                      borderRadius: 'var(--radius-lg)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={18} color="#059669" />
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#059669' }}>
                          Document Photos ({documentPhotos.length})
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      Aadhaar, PAN, ID proof, address proof, purchase documents, etc.
                    </p>

                    {/* Document Thumbnails Grid */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', minHeight: '84px' }}>
                      {documentPhotos.map((url, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            position: 'relative',
                            border: '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                            backgroundColor: 'var(--bg-subtle)'
                          }}
                          onClick={() => openViewer(documentPhotos, idx, 'Document Photo')}
                        >
                          <img
                            src={getSafeImageUrl(url)}
                            alt={`Document ${idx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80'; }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeDocumentPhoto(idx);
                            }}
                            style={{
                              position: 'absolute',
                              top: '3px',
                              right: '3px',
                              background: 'rgba(239, 68, 68, 0.95)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '50%',
                              width: '22px',
                              height: '22px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}
                            title="Remove Photo"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}

                      {/* Add Document Photo Upload Button */}
                      <label
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: 'var(--radius-md)',
                          border: '2px dashed #059669',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: uploadingDocs ? 'not-allowed' : 'pointer',
                          color: '#059669',
                          gap: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(5, 150, 105, 0.08)'
                        }}
                      >
                        {uploadingDocs ? (
                          <RotateCw size={18} className="animate-spin" />
                        ) : (
                          <>
                            <Upload size={18} />
                            <span>+ Add</span>
                          </>
                        )}
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          disabled={uploadingDocs}
                          onChange={handleDocumentPhotosUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Category B: DEVICE PHOTOS */}
                  <div
                    className="card"
                    style={{
                      padding: '16px',
                      backgroundColor: 'rgba(99, 102, 241, 0.03)',
                      border: '1.5px solid rgba(99, 102, 241, 0.25)',
                      borderRadius: 'var(--radius-lg)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Smartphone size={18} color="var(--primary-600)" />
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary-600)' }}>
                          Device Photos ({devicePhotos.length})
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      Front, back, sides, display, condition, IMEI label, accessories, etc.
                    </p>

                    {/* Device Thumbnails Grid */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', minHeight: '84px' }}>
                      {devicePhotos.map((url, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            position: 'relative',
                            border: '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                            backgroundColor: 'var(--bg-subtle)'
                          }}
                          onClick={() => openViewer(devicePhotos, idx, 'Device Photo')}
                        >
                          <img
                            src={getSafeImageUrl(url)}
                            alt={`Device ${idx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&auto=format&fit=crop&q=80'; }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeDevicePhoto(idx);
                            }}
                            style={{
                              position: 'absolute',
                              top: '3px',
                              right: '3px',
                              background: 'rgba(239, 68, 68, 0.95)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '50%',
                              width: '22px',
                              height: '22px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}
                            title="Remove Photo"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}

                      {/* Add Device Photo Upload Button */}
                      <label
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: 'var(--radius-md)',
                          border: '2px dashed var(--primary-600)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: uploadingDevices ? 'not-allowed' : 'pointer',
                          color: 'var(--primary-600)',
                          gap: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(99, 102, 241, 0.08)'
                        }}
                      >
                        {uploadingDevices ? (
                          <RotateCw size={18} className="animate-spin" />
                        ) : (
                          <>
                            <Upload size={18} />
                            <span>+ Add</span>
                          </>
                        )}
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          disabled={uploadingDevices}
                          onChange={handleDevicePhotosUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  </div>

                </div>
              </div>

              {/* SECTION: SELLER & IDENTITY */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={16} color="#059669" />
                  Seller & KYC Information
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Seller Full Name <span className="required">*</span></label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={formData.seller_name || ''}
                      onChange={(e) => handleChange('seller_name', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Mobile <span className="required">*</span></label>
                    <input
                      type="tel"
                      inputMode="tel"
                      required
                      className="input"
                      value={formData.seller_phone || ''}
                      onChange={(e) => handleChange('seller_phone', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">ID Verification Type</label>
                    <select
                      className="select"
                      value={formData.id_type || ''}
                      onChange={(e) => handleChange('id_type', e.target.value)}
                    >
                      {ID_TYPE_PRESETS.map(id => (
                        <option key={id} value={id}>{id}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">ID Number / Reference</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.id_number_ref || ''}
                      onChange={(e) => handleChange('id_number_ref', e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Residential Address</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.seller_address || ''}
                      onChange={(e) => handleChange('seller_address', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: DEVICE HARDWARE */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Smartphone size={16} color="var(--primary-600)" />
                  Device Specifications & Hardware
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Brand <span className="required">*</span></label>
                    <select
                      className="select"
                      value={formData.brand || ''}
                      onChange={(e) => handleChange('brand', e.target.value)}
                    >
                      {BRAND_PRESETS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Model <span className="required">*</span></label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={formData.model || ''}
                      onChange={(e) => handleChange('model', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Storage</label>
                    <select
                      className="select"
                      value={formData.storage || ''}
                      onChange={(e) => handleChange('storage', e.target.value)}
                    >
                      {STORAGE_PRESETS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">RAM</label>
                    <select
                      className="select"
                      value={formData.ram || ''}
                      onChange={(e) => handleChange('ram', e.target.value)}
                    >
                      {RAM_PRESETS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Color / Finish</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.color || ''}
                      onChange={(e) => handleChange('color', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Primary IMEI 1</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="input"
                      value={formData.imei_1 || ''}
                      onChange={(e) => handleChange('imei_1', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Secondary IMEI 2</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="input"
                      value={formData.imei_2 || ''}
                      onChange={(e) => handleChange('imei_2', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Condition</label>
                    <select
                      className="select"
                      value={formData.condition || ''}
                      onChange={(e) => handleChange('condition', e.target.value)}
                    >
                      {CONDITION_PRESETS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION: FINANCIALS & NOTES */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DollarSign size={16} color="var(--primary-600)" />
                  Commercials & Inspection
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Purchase Price ({settings.currency}) <span className="required">*</span></label>
                    <input
                      type="number"
                      inputMode="numeric"
                      required
                      min="0"
                      className="input"
                      value={formData.purchase_price}
                      onChange={(e) => handleChange('purchase_price', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select
                      className="select"
                      value={formData.payment_method || ''}
                      onChange={(e) => handleChange('payment_method', e.target.value)}
                    >
                      {PAYMENT_METHOD_PRESETS.map(pm => (
                        <option key={pm} value={pm}>{pm}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Inspection & Attendant Notes</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.notes || ''}
                      onChange={(e) => handleChange('notes', e.target.value)}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || uploadingDocs || uploadingDevices}
              >
                <Save size={16} />
                {saving ? 'Updating...' : 'Update Buyback'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Full-Size Photo Viewer */}
      <PhotoViewerModal
        isOpen={viewerState.isOpen}
        onClose={() => setViewerState(prev => ({ ...prev, isOpen: false }))}
        photos={viewerState.photos}
        initialIndex={viewerState.initialIndex}
        category={viewerState.category}
        title={`${formData.brand} ${formData.model}`}
      />
    </>
  );
};
