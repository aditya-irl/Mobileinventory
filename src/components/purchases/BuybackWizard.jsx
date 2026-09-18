import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useToast } from '../../context/ToastContext';
import { BarcodeScannerModal } from '../inventory/BarcodeScannerModal';
import { compressMultipleImages, compressImage } from '../../services/imageCompression';
import { printBuybackReceipt } from '../../services/exportService';
import { formatCurrency, calculateProfitMargin, getSafeImageUrl } from '../../utils/formatters';
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
  User,
  ShieldCheck,
  Camera,
  Smartphone,
  ShieldAlert,
  DollarSign,
  FileCheck,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  X,
  Printer,
  Sparkles,
  AlertTriangle,
  Info,
  FileText,
  RotateCw,
  Eye
} from 'lucide-react';

export const BuybackWizard = ({ onComplete }) => {
  const { inventory, addPurchaseTransaction, settings } = useInventory();
  const { showError, showSuccess, showWarning } = useToast();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [scannerField, setScannerField] = useState(null);
  const [completedRecord, setCompletedRecord] = useState(null);

  // Separated Photos State (No Artificial Limit)
  const [documentPhotos, setDocumentPhotos] = useState([]);
  const [devicePhotos, setDevicePhotos] = useState([]);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [uploadingDevices, setUploadingDevices] = useState(false);

  // Full-size lightbox modal state
  const [viewerState, setViewerState] = useState({
    isOpen: false,
    photos: [],
    initialIndex: 0,
    category: 'Document Photo'
  });

  // Form State
  const [formData, setFormData] = useState({
    // Seller Info
    seller_name: '',
    seller_phone: '',
    seller_address: '',
    id_type: "Driver's License",
    id_number_ref: '',
    id_verification_status: 'Verified',

    // Phone Specs
    brand: 'Apple',
    model: '',
    variant: '',
    color: '',
    storage: '128 GB',
    ram: '8 GB',
    imei_1: '',
    imei_2: '',
    serial_number: '',
    battery_health: 95,
    condition: 'Like New',

    // Financials
    purchase_price: '',
    target_selling_price: '',
    payment_method: 'UPI / Instant Transfer',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_time: new Date().toTimeString().substring(0, 5),

    // Legal Declaration
    seller_declaration_ownership: false,
    seller_declaration_wiped: false,
    seller_declaration_lawful: false,
    notes: '',
    operator_name: 'Store Manager'
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Upload Document Photos (Aadhaar, PAN, ID proof, address proof, purchase documents)
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

  // Upload Device Photos (Front, back, sides, display, condition, IMEI label, accessories)
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

  // Duplicate IMEI check in current inventory
  const duplicateImeiCheck = () => {
    if (!formData.imei_1 && !formData.imei_2) return null;
    const clean1 = String(formData.imei_1 || '').trim();
    const clean2 = String(formData.imei_2 || '').trim();

    for (const item of inventory) {
      if (clean1 && (clean1 === item.imei_1 || clean1 === item.imei_2)) {
        return { duplicate: true, item };
      }
      if (clean2 && (clean2 === item.imei_1 || clean2 === item.imei_2)) {
        return { duplicate: true, item };
      }
    }
    return null;
  };

  const imeiDuplicate = duplicateImeiCheck();

  // Navigation validations
  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (!formData.seller_name.trim()) {
        showError('Please enter seller full name.');
        return false;
      }
      if (!formData.seller_phone.trim()) {
        showError('Please enter seller mobile number.');
        return false;
      }
    }

    if (currentStep === 2) {
      if (!formData.id_type) {
        showError('Please select ID verification type.');
        return false;
      }
      if (!formData.id_number_ref.trim()) {
        showError('Please enter ID document reference / masked number.');
        return false;
      }
    }

    if (currentStep === 4) {
      if (!formData.brand.trim() || !formData.model.trim()) {
        showError('Brand and Model are required.');
        return false;
      }
    }

    if (currentStep === 5) {
      if (!formData.imei_1.trim()) {
        showError('Primary IMEI (IMEI 1) is required for buyback verification.');
        return false;
      }
      if (formData.imei_1.length < 14) {
        showError('IMEI must be at least 14-15 digits.');
        return false;
      }
    }

    if (currentStep === 6) {
      if (!formData.purchase_price || Number(formData.purchase_price) <= 0) {
        showError('Please enter a valid purchase price.');
        return false;
      }
    }

    if (currentStep === 7) {
      if (!formData.seller_declaration_ownership || !formData.seller_declaration_wiped || !formData.seller_declaration_lawful) {
        showError('All 3 seller declaration checkboxes must be acknowledged.');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 8));
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(7)) return;

    setSubmitting(true);
    const result = await addPurchaseTransaction({
      ...formData,
      document_photos: documentPhotos,
      device_photos: devicePhotos,
      photo_urls: devicePhotos,
      seller_photo_url: documentPhotos[0] || '',
      document_photo_url: JSON.stringify(documentPhotos),
      seller_photo_base64: documentPhotos[0] || '',
      document_photo_base64: documentPhotos[1] || documentPhotos[0] || '',
      seller_declaration: true
    });
    setSubmitting(false);

    if (result.success) {
      setCompletedRecord(result.data || {
        ...formData,
        document_photos: documentPhotos,
        device_photos: devicePhotos,
        purchase_id: result.purchase_id,
        inventory_id: result.inventory_id
      });
      setStep(8);
    }
  };

  const estimatedProfit = (Number(formData.target_selling_price) || Math.round((Number(formData.purchase_price) || 0) * 1.15)) - (Number(formData.purchase_price) || 0);

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      {/* Progress Steps Header */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          backgroundColor: 'var(--bg-surface)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--primary-600)' }}>
            Used Phone Buyback Wizard
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Step {step} of 8: {
              step === 1 ? 'Seller Details' :
              step === 2 ? 'ID Verification' :
              step === 3 ? 'KYC Documents' :
              step === 4 ? 'Device Specs' :
              step === 5 ? 'IMEI & Security' :
              step === 6 ? 'Commercials' :
              step === 7 ? 'Seller Declaration' :
              'Purchase Completed'
            }
          </div>
        </div>

        {/* Step Progress Bar */}
        <div style={{ height: '6px', backgroundColor: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${(step / 8) * 100}%`,
              backgroundColor: step === 8 ? '#10b981' : 'var(--primary-600)',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>

      {/* Prominent Legal Disclaimer Header */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--status-reserved-bg)',
          border: '1px solid var(--status-reserved-border)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.8125rem',
          color: 'var(--status-reserved-text)'
        }}
      >
        <AlertTriangle size={18} style={{ flexShrink: 0 }} />
        <div>
          <strong>Mandatory Verification Notice:</strong> Verify IMEI and seller details before purchasing the device. Note: Internal duplicate checks are based on internal records and do not replace official police/carrier blacklists.
        </div>
      </div>

      {/* Step Content */}
      <div className="card" style={{ padding: '18px 20px', marginBottom: '20px' }}>
        
        {/* STEP 1: Seller Details */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="var(--primary-600)" />
              1. Customer / Seller Information
            </h3>

            <div className="form-grid-responsive">
              <div className="form-group">
                <label className="form-label">Seller Full Legal Name <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="e.g. Vikramaditya Rao"
                  value={formData.seller_name}
                  onChange={(e) => handleChange('seller_name', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Seller Contact Mobile <span className="required">*</span></label>
                <input
                  type="tel"
                  inputMode="tel"
                  required
                  className="input"
                  placeholder="e.g. +91 98450 12345"
                  value={formData.seller_phone}
                  onChange={(e) => handleChange('seller_phone', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Residential Address</label>
                <textarea
                  rows={2}
                  className="textarea"
                  placeholder="House/flat no, street, locality, city, pincode"
                  value={formData.seller_address}
                  onChange={(e) => handleChange('seller_address', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Identity Verification */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="var(--primary-600)" />
              2. Government Identity Verification
            </h3>

            <div className="form-grid-responsive">
              <div className="form-group">
                <label className="form-label">ID Verification Document Type <span className="required">*</span></label>
                <select
                  className="select"
                  value={formData.id_type}
                  onChange={(e) => handleChange('id_type', e.target.value)}
                >
                  {ID_TYPE_PRESETS.map(id => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">ID Number / Reference (Masked) <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="e.g. DL-04201800912 or P8920194"
                  value={formData.id_number_ref}
                  onChange={(e) => handleChange('id_number_ref', e.target.value)}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Record legally permissible reference without storing unencrypted raw national identifiers.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Verification Status</label>
                <select
                  className="select"
                  value={formData.id_verification_status}
                  onChange={(e) => handleChange('id_verification_status', e.target.value)}
                >
                  <option value="Verified">✓ Physically Inspected & Verified</option>
                  <option value="Pending Verification">⏳ Pending Further Verification</option>
                  <option value="Manual Review">⚠️ Flagged for Manual Review</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Photos & Proofs (Separated Document Photos & Device Photos) */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Camera size={18} color="var(--primary-600)" />
              3. Buyback Photos & Verification Proofs
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Upload all verification documents and physical device condition photos. There is no limit on photo count.
            </p>

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
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
                        title="Remove Document Photo"
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
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
                        title="Remove Device Photo"
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
        )}

        {/* STEP 4: Device Specs */}
        {step === 4 && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={18} color="var(--primary-600)" />
              4. Purchased Phone Specifications
            </h3>

            <div className="form-grid-responsive">
              <div className="form-group">
                <label className="form-label">Brand <span className="required">*</span></label>
                <select
                  className="select"
                  value={formData.brand}
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
                  placeholder="e.g. iPhone 15 Pro, Galaxy S23"
                  value={formData.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Variant / Model No.</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. A3102"
                  value={formData.variant}
                  onChange={(e) => handleChange('variant', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Color / Finish</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Natural Titanium"
                  value={formData.color}
                  onChange={(e) => handleChange('color', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Storage Capacity</label>
                <select
                  className="select"
                  value={formData.storage}
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
                  value={formData.ram}
                  onChange={(e) => handleChange('ram', e.target.value)}
                >
                  {RAM_PRESETS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Physical Condition Grade</label>
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
                <label className="form-label">Battery Health (%)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="100"
                  className="input"
                  value={formData.battery_health}
                  onChange={(e) => handleChange('battery_health', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: IMEI & Security Verification */}
        {step === 5 && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color="var(--primary-600)" />
              5. IMEI Verification & Internal Risk Check
            </h3>

            {imeiDuplicate && (
              <div
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--status-danger-bg)',
                  border: '1px solid var(--status-danger-border)',
                  color: 'var(--status-danger-text)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}
              >
                <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                    Duplicate IMEI Detected in Internal Records
                  </div>
                  <div style={{ fontSize: '0.8125rem', marginTop: '2px' }}>
                    This IMEI matches device <strong>{imeiDuplicate.item.inventory_id}</strong> ({imeiDuplicate.item.brand} {imeiDuplicate.item.model}) currently in your inventory database. Please verify prior ownership records.
                  </div>
                </div>
              </div>
            )}

            <div className="form-grid-responsive">
              <div className="form-group">
                <label className="form-label">
                  <span>Primary IMEI (IMEI 1) <span className="required">*</span></span>
                  <button
                    type="button"
                    onClick={() => setScannerField('imei_1')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-600)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Camera size={13} /> Scan / Gen
                  </button>
                </label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  inputMode="numeric"
                  className="input"
                  placeholder="15-digit primary IMEI"
                  value={formData.imei_1}
                  onChange={(e) => handleChange('imei_1', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Secondary IMEI (IMEI 2)</span>
                  <button
                    type="button"
                    onClick={() => setScannerField('imei_2')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-600)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Camera size={13} /> Scan
                  </button>
                </label>
                <input
                  type="text"
                  maxLength={16}
                  inputMode="numeric"
                  className="input"
                  placeholder="15-digit secondary IMEI / eSIM"
                  value={formData.imei_2}
                  onChange={(e) => handleChange('imei_2', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hardware Serial Number</label>
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
        )}

        {/* STEP 6: Commercials & Pricing */}
        {step === 6 && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} color="var(--primary-600)" />
              6. Purchase Price & Payment Disbursement
            </h3>

            <div className="form-grid-responsive">
              <div className="form-group">
                <label className="form-label">
                  <span>Agreed Purchase Price ({settings.currency}) <span className="required">*</span></span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  required
                  min="0"
                  className="input"
                  placeholder="e.g. 75000"
                  value={formData.purchase_price}
                  onChange={(e) => handleChange('purchase_price', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Target Selling Price for Stock ({settings.currency})</span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  className="input"
                  placeholder="e.g. 88000"
                  value={formData.target_selling_price}
                  onChange={(e) => handleChange('target_selling_price', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method Disbursed <span className="required">*</span></label>
                <select
                  className="select"
                  value={formData.payment_method}
                  onChange={(e) => handleChange('payment_method', e.target.value)}
                >
                  {PAYMENT_METHOD_PRESETS.map(pm => (
                    <option key={pm} value={pm}>{pm}</option>
                  ))}
                </select>
              </div>
            </div>

            {formData.purchase_price && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--status-available-bg)',
                  border: '1px solid var(--status-available-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Target Gross Profit Margin:
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>
                    +{formatCurrency(estimatedProfit, settings.currency)} ({calculateProfitMargin(formData.purchase_price, formData.target_selling_price || Math.round(formData.purchase_price * 1.15))}%)
                  </div>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Payable via: <strong>{formData.payment_method}</strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 7: Legal Declaration & Customer Consent */}
        {step === 7 && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCheck size={18} color="var(--primary-600)" />
              7. Legal Declaration & Customer Affirmation
            </h3>

            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.84rem' }}>
                <input
                  type="checkbox"
                  checked={formData.seller_declaration_ownership}
                  onChange={(e) => handleChange('seller_declaration_ownership', e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', flexShrink: 0 }}
                />
                <span>
                  <strong>Sole Ownership:</strong> I certify that I am the rightful, lawful owner of this smartphone ({formData.brand} {formData.model}, IMEI: {formData.imei_1}) and have the full legal right to sell/trade it.
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.84rem' }}>
                <input
                  type="checkbox"
                  checked={formData.seller_declaration_wiped}
                  onChange={(e) => handleChange('seller_declaration_wiped', e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', flexShrink: 0 }}
                />
                <span>
                  <strong>Accounts & Security Removed:</strong> I confirm that all personal iCloud, Google, Mi Account, Samsung Cloud, screen lock PINs, and biometrics have been completely signed out and removed.
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.84rem' }}>
                <input
                  type="checkbox"
                  checked={formData.seller_declaration_lawful}
                  onChange={(e) => handleChange('seller_declaration_lawful', e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', flexShrink: 0 }}
                />
                <span>
                  <strong>Lawful Origin:</strong> This device is free from liens, unpaid financing loans, police reports, or any claims of theft. I agree to indemnify {settings.storeName || 'the store'} against any false declarations.
                </span>
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Operator / Store Attendant Notes</label>
              <input
                type="text"
                className="input"
                placeholder="Inspected by staff, condition observations..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* STEP 8: Completed Confirmation */}
        {step === 8 && completedRecord && (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--status-available-bg)',
                color: 'var(--status-available-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <CheckCircle size={36} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px' }}>
              Buyback Transaction Completed!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '20px' }}>
              The device has been authenticated, added to active inventory, and assigned audit IDs.
            </p>

            <div
              className="form-grid-responsive"
              style={{
                textAlign: 'left',
                backgroundColor: 'var(--bg-subtle)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '24px'
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Purchase Record ID</span>
                <div style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '0.9rem' }}>
                  {completedRecord.purchase_id}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Assigned Stock ID</span>
                <div style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--primary-600)' }}>
                  {completedRecord.inventory_id}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Customer</span>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  {completedRecord.seller_name} ({completedRecord.seller_phone})
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Disbursed Amount</span>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#10b981' }}>
                  {formatCurrency(completedRecord.purchase_price, settings.currency)}
                </div>
              </div>
            </div>

            {/* Photos Summary in Completion Step */}
            {(documentPhotos.length > 0 || devicePhotos.length > 0) && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
                  gap: '14px',
                  marginBottom: '24px',
                  textAlign: 'left'
                }}
              >
                {/* Document Photos Confirmation Preview */}
                <div
                  className="card"
                  style={{
                    padding: '14px',
                    backgroundColor: 'rgba(5, 150, 105, 0.04)',
                    border: '1px solid rgba(5, 150, 105, 0.25)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#059669', fontWeight: 800, fontSize: '0.85rem' }}>
                    <FileText size={16} />
                    Document Photos ({documentPhotos.length})
                  </div>
                  {documentPhotos.length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No documents attached</div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {documentPhotos.map((url, i) => (
                        <div
                          key={i}
                          onClick={() => openViewer(documentPhotos, i, 'Document Photo')}
                          style={{
                            width: '54px',
                            height: '54px',
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: '1px solid var(--border-subtle)',
                            backgroundColor: 'var(--bg-subtle)'
                          }}
                        >
                          <img
                            src={getSafeImageUrl(url)}
                            alt={`Doc ${i + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80'; }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Device Photos Confirmation Preview */}
                <div
                  className="card"
                  style={{
                    padding: '14px',
                    backgroundColor: 'rgba(99, 102, 241, 0.04)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--primary-600)', fontWeight: 800, fontSize: '0.85rem' }}>
                    <Smartphone size={16} />
                    Device Photos ({devicePhotos.length})
                  </div>
                  {devicePhotos.length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No device photos attached</div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {devicePhotos.map((url, i) => (
                        <div
                          key={i}
                          onClick={() => openViewer(devicePhotos, i, 'Device Photo')}
                          style={{
                            width: '54px',
                            height: '54px',
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: '1px solid var(--border-subtle)',
                            backgroundColor: 'var(--bg-subtle)'
                          }}
                        >
                          <img
                            src={getSafeImageUrl(url)}
                            alt={`Device ${i + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&auto=format&fit=crop&q=80'; }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => printBuybackReceipt(completedRecord, settings.storeName, settings.currency)}
                style={{ flex: 1, minWidth: '200px' }}
              >
                <Printer size={18} /> Print Buyback Certificate
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-lg"
                onClick={onComplete}
                style={{ flex: 1, minWidth: '160px' }}
              >
                View Purchase Ledger
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Navigation Buttons (Steps 1 to 7) */}
      {step < 8 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleBack}
            disabled={step === 1 || submitting}
            style={{ flex: 1, minWidth: '100px', height: '44px' }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          {step < 7 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
              style={{ flex: 1, minWidth: '140px', height: '44px' }}
            >
              Next Step <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ backgroundColor: '#059669', flex: 2, minWidth: '180px', height: '44px' }}
            >
              <CheckCircle size={18} />
              {submitting ? 'Creating Records...' : 'Complete Buyback Transaction'}
            </button>
          )}
        </div>
      )}

      {/* Barcode / IMEI Scanner Modal */}
      <BarcodeScannerModal
        isOpen={Boolean(scannerField)}
        onClose={() => setScannerField(null)}
        onScanComplete={(scannedVal) => {
          if (scannerField) {
            handleChange(scannerField, scannedVal);
          }
        }}
      />

      {/* Full-size Photo Lightbox Viewer */}
      <PhotoViewerModal
        isOpen={viewerState.isOpen}
        photos={viewerState.photos}
        initialIndex={viewerState.initialIndex}
        category={viewerState.category}
        onClose={() => setViewerState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
