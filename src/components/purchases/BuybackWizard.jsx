import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useToast } from '../../context/ToastContext';
import { BarcodeScannerModal } from '../inventory/BarcodeScannerModal';
import { compressImage } from '../../services/imageCompression';
import { printBuybackReceipt } from '../../services/exportService';
import { formatCurrency, calculateProfitMargin } from '../../utils/formatters';
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
  Info
} from 'lucide-react';

export const BuybackWizard = ({ onComplete }) => {
  const { inventory, addPurchaseTransaction, settings } = useInventory();
  const { showError, showSuccess } = useToast();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [scannerField, setScannerField] = useState(null);
  const [completedRecord, setCompletedRecord] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    // Seller Info
    seller_name: '',
    seller_phone: '',
    seller_address: '',
    id_type: "Driver's License",
    id_number_ref: '',
    id_verification_status: 'Verified',
    seller_photo_url: '',
    document_photo_url: '',

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

  const [sellerPhotoPreview, setSellerPhotoPreview] = useState(null);
  const [documentPhotoPreview, setDocumentPhotoPreview] = useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Image Upload Handlers
  const handlePhotoUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 1200, 1200, 0.8);
      if (type === 'seller') {
        setSellerPhotoPreview(compressed.dataUrl);
        handleChange('seller_photo_url', compressed.dataUrl);
      } else {
        setDocumentPhotoPreview(compressed.dataUrl);
        handleChange('document_photo_url', compressed.dataUrl);
      }
    } catch (err) {
      showError('Failed to process photo: ' + err.message);
    }
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
      seller_photo_base64: formData.seller_photo_url,
      document_photo_base64: formData.document_photo_url,
      seller_declaration: true
    });
    setSubmitting(false);

    if (result.success) {
      setCompletedRecord(result.data || {
        ...formData,
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
      <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
        
        {/* STEP 1: Seller Details */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="var(--primary-600)" />
              1. Customer / Seller Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
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
                  required
                  className="input"
                  placeholder="e.g. +91 98450 12345"
                  value={formData.seller_phone}
                  onChange={(e) => handleChange('seller_phone', e.target.value)}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
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
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="var(--primary-600)" />
              2. Government Identity Verification
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
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

        {/* STEP 3: KYC Documents / Photos */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Camera size={18} color="var(--primary-600)" />
              3. Seller Photograph & Document Capture
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              {/* Seller Face Photo */}
              <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '8px' }}>
                  Seller Face Photograph
                </div>
                
                {sellerPhotoPreview ? (
                  <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                    <img src={sellerPhotoPreview} alt="Seller" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => setSellerPhotoPreview(null)}
                      style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <label
                    style={{
                      width: '160px',
                      height: '160px',
                      margin: '0 auto',
                      borderRadius: 'var(--radius-md)',
                      border: '2px dashed var(--border-strong)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      gap: '6px',
                      fontSize: '0.75rem',
                      backgroundColor: 'var(--bg-subtle)'
                    }}
                  >
                    <Camera size={24} color="var(--primary-600)" />
                    <span>Upload / Snap Seller</span>
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'seller')} style={{ display: 'none' }} />
                  </label>
                )}
              </div>

              {/* ID Document Photo */}
              <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '8px' }}>
                  ID Proof Document Copy
                </div>

                {documentPhotoPreview ? (
                  <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                    <img src={documentPhotoPreview} alt="ID Document" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => setDocumentPhotoPreview(null)}
                      style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <label
                    style={{
                      width: '160px',
                      height: '160px',
                      margin: '0 auto',
                      borderRadius: 'var(--radius-md)',
                      border: '2px dashed var(--border-strong)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      gap: '6px',
                      fontSize: '0.75rem',
                      backgroundColor: 'var(--bg-subtle)'
                    }}
                  >
                    <Upload size={24} color="var(--primary-600)" />
                    <span>Upload ID Copy</span>
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'doc')} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Device Specs */}
        {step === 4 && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={18} color="var(--primary-600)" />
              4. Purchased Phone Specifications
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
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
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
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
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} color="var(--primary-600)" />
              6. Purchase Price & Payment Disbursement
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">
                  <span>Agreed Purchase Price ({settings.currency}) <span className="required">*</span></span>
                </label>
                <input
                  type="number"
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
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Estimated Inventory Margin:
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                    +{formatCurrency(estimatedProfit, settings.currency)}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--status-available-text)', fontSize: '0.875rem' }}>
                  +{calculateProfitMargin(formData.purchase_price, formData.target_selling_price || Math.round(Number(formData.purchase_price) * 1.15))}% Margin
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 7: Seller Declaration & Legal Terms */}
        {step === 7 && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCheck size={18} color="var(--primary-600)" />
              7. Seller Ownership & Legal Declaration
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.seller_declaration_ownership}
                  onChange={(e) => handleChange('seller_declaration_ownership', e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  <strong>Lawful Ownership:</strong> The seller affirms that they are the rightful, legal owner of this device with full power to sell and transfer absolute title.
                </span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.seller_declaration_wiped}
                  onChange={(e) => handleChange('seller_declaration_wiped', e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  <strong>Data & Account Removal:</strong> All personal data, Google/iCloud accounts, and lock screen PINs have been permanently wiped prior to sale.
                </span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.seller_declaration_lawful}
                  onChange={(e) => handleChange('seller_declaration_lawful', e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  <strong>Non-Encumbrance & Lawful Origin:</strong> The device is not blacklisted, financed with pending dues, or obtained through illegal or stolen means.
                </span>
              </label>

              <div className="form-group" style={{ marginTop: '8px' }}>
                <label className="form-label">Inspection & Additional Notes</label>
                <textarea
                  rows={2}
                  className="textarea"
                  placeholder="Remarks on physical condition, box included, charger, or trade-in rationale..."
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: Completed Summary */}
        {step === 8 && completedRecord && (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: '20px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--status-available-bg)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}
            >
              <CheckCircle size={36} />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Buyback Completed & Recorded!
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px', marginBottom: '24px' }}>
              Transaction saved to Purchases ledger and phone cataloged into Available inventory.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '14px',
                textAlign: 'left',
                backgroundColor: 'var(--bg-subtle)',
                padding: '18px',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '24px'
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Purchase ID</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-600)', fontFamily: 'monospace' }}>
                  {completedRecord.purchase_id}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Linked Inventory ID</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981', fontFamily: 'monospace' }}>
                  {completedRecord.inventory_id}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Seller Name</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                  {completedRecord.seller_name}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Disbursed Amount</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                  {formatCurrency(completedRecord.purchase_price, settings.currency)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => printBuybackReceipt(completedRecord, settings.storeName, settings.currency)}
              >
                <Printer size={18} /> Print Buyback Invoice & Certificate
              </button>

              <button
                className="btn btn-secondary btn-lg"
                onClick={onComplete}
              >
                View Purchase Ledger
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Navigation Buttons (Steps 1 to 7) */}
      {step < 8 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleBack}
            disabled={step === 1 || submitting}
          >
            <ArrowLeft size={16} /> Back
          </button>

          {step < 7 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
            >
              Next Step <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ backgroundColor: '#059669' }}
            >
              <CheckCircle size={18} />
              {submitting ? 'Creating Purchase Records...' : 'Complete Buyback Transaction'}
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
    </div>
  );
};
