/**
 * Realistic sample purchase/buyback records for development & offline testing.
 * Strictly maintains seller KYC data isolated from standard inventory views.
 */

export const INITIAL_SAMPLE_PURCHASES = [
  {
    purchase_id: 'PUR-0001',
    inventory_id: 'INV-0001',
    seller_name: 'Vikramaditya Rao',
    seller_phone: '+91 98450 21984',
    seller_address: '42, Indiranagar 100ft Road, Bengaluru, Karnataka',
    id_type: "Driver's License",
    id_number_ref: 'DL-04201800912',
    id_verification_status: 'Verified',
    seller_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    document_photo_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    variant: 'A3102',
    color: 'Natural Titanium',
    storage: '256 GB',
    ram: '8 GB',
    imei_1: '354892091823912',
    imei_2: '354892091823913',
    serial_number: 'FX2L90P8N9',
    condition: 'Like New',
    purchase_price: 82000,
    payment_method: 'UPI / Instant Transfer',
    purchase_date: '2026-08-10',
    purchase_time: '11:20',
    seller_declaration: true,
    notes: 'Seller upgraded to iPhone 16 Pro. Original purchase invoice presented & verified.',
    operator_name: 'Store Manager',
    status: 'Completed',
    created_at: '2026-08-10T11:20:00Z',
    updated_at: '2026-08-10T11:20:00Z'
  },
  {
    purchase_id: 'PUR-0002',
    inventory_id: 'INV-0005',
    seller_name: 'Ananya Deshmukh',
    seller_phone: '+91 99201 84729',
    seller_address: 'Flat 302, Palm Heights, Bandra West, Mumbai, Maharashtra',
    id_type: 'Passport',
    id_number_ref: 'P8920194',
    id_verification_status: 'Verified',
    seller_photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80',
    document_photo_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
    brand: 'Apple',
    model: 'iPhone 14',
    variant: 'A2882',
    color: 'Midnight Blue',
    storage: '128 GB',
    ram: '6 GB',
    imei_1: '351982049102938',
    imei_2: '351982049102939',
    serial_number: 'N78X20PL91',
    condition: 'Good',
    purchase_price: 36000,
    payment_method: 'Bank Wire',
    purchase_date: '2026-08-20',
    purchase_time: '12:00',
    seller_declaration: true,
    notes: 'Trade-in handset. Slight glass scuffing, sent for buffing/service.',
    operator_name: 'Store Manager',
    status: 'Completed',
    created_at: '2026-08-20T12:00:00Z',
    updated_at: '2026-08-20T12:00:00Z'
  }
];

export const ID_TYPE_PRESETS = [
  "Driver's License",
  'Passport',
  'Voter Identity Card',
  'National Identity Card / Govt Photo ID',
  'State Issued Photo ID',
  'Other Valid Government ID'
];

export const PAYMENT_METHOD_PRESETS = [
  'UPI / Instant Transfer',
  'Cash',
  'Bank Wire / NEFT',
  'Store Credit / Exchange Voucher',
  'Cheque'
];
