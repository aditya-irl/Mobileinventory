/**
 * Export services for CSV, Excel-compatible sheets, and Printable device spec sheets & Buyback Invoices
 */

export const exportInventoryToCSV = (items, filename = 'PhoneVault_Inventory_Export.csv') => {
  if (!items || !items.length) {
    alert('No inventory items to export.');
    return;
  }

  const headers = [
    'Inventory ID',
    'Brand',
    'Model',
    'Variant',
    'Color',
    'Storage',
    'RAM',
    'IMEI 1',
    'IMEI 2',
    'Serial Number',
    'Battery Health (%)',
    'Condition',
    'Purchase Price',
    'Selling Price',
    'Profit',
    'Purchase Date',
    'Selling Date',
    'Supplier',
    'Customer',
    'Status',
    'Accessories',
    'Warranty',
    'Notes',
    'Created At'
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = items.map(item => [
    escapeCSV(item.inventory_id),
    escapeCSV(item.brand),
    escapeCSV(item.model),
    escapeCSV(item.variant),
    escapeCSV(item.color),
    escapeCSV(item.storage),
    escapeCSV(item.ram),
    escapeCSV(item.imei_1),
    escapeCSV(item.imei_2),
    escapeCSV(item.serial_number),
    escapeCSV(item.battery_health || ''),
    escapeCSV(item.condition),
    escapeCSV(item.purchase_price),
    escapeCSV(item.selling_price),
    escapeCSV(item.profit),
    escapeCSV(item.purchase_date),
    escapeCSV(item.selling_date),
    escapeCSV(item.supplier),
    escapeCSV(item.customer),
    escapeCSV(item.status),
    escapeCSV(item.accessories),
    escapeCSV(item.warranty),
    escapeCSV(item.notes),
    escapeCSV(item.created_at)
  ].join(','));

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportSalesReportToCSV = (soldItems, filename = 'PhoneVault_Sales_Report.csv') => {
  if (!soldItems || !soldItems.length) {
    alert('No sold items to export.');
    return;
  }

  const headers = [
    'Inventory ID',
    'Device Name',
    'IMEI',
    'Customer Name',
    'Purchase Price',
    'Selling Price',
    'Realized Profit',
    'Margin %',
    'Purchase Date',
    'Sold Date',
    'Supplier'
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = soldItems.map(item => {
    const margin = item.purchase_price ? (((item.selling_price - item.purchase_price) / item.purchase_price) * 100).toFixed(1) + '%' : '0%';
    return [
      escapeCSV(item.inventory_id),
      escapeCSV(`${item.brand} ${item.model} (${item.storage || ''})`),
      escapeCSV(item.imei_1),
      escapeCSV(item.customer || 'Direct Customer'),
      escapeCSV(item.purchase_price),
      escapeCSV(item.selling_price),
      escapeCSV(item.selling_price - item.purchase_price),
      escapeCSV(margin),
      escapeCSV(item.purchase_date),
      escapeCSV(item.selling_date),
      escapeCSV(item.supplier)
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportPurchasesToCSV = (purchases, filename = 'PhoneVault_Purchases_Ledger.csv') => {
  if (!purchases || !purchases.length) {
    alert('No purchase records to export.');
    return;
  }

  const headers = [
    'Purchase ID',
    'Linked Inventory ID',
    'Seller Name',
    'Seller Phone',
    'Seller Address',
    'ID Verification Type',
    'ID Reference Ref',
    'Verification Status',
    'Brand & Model',
    'IMEI 1',
    'IMEI 2',
    'Serial Number',
    'Condition',
    'Purchase Price',
    'Payment Method',
    'Purchase Date',
    'Purchase Time',
    'Operator',
    'Status'
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = purchases.map(p => [
    escapeCSV(p.purchase_id),
    escapeCSV(p.inventory_id),
    escapeCSV(p.seller_name),
    escapeCSV(p.seller_phone),
    escapeCSV(p.seller_address),
    escapeCSV(p.id_type),
    escapeCSV(p.id_number_ref),
    escapeCSV(p.id_verification_status),
    escapeCSV(`${p.brand} ${p.model} ${p.storage || ''}`),
    escapeCSV(p.imei_1),
    escapeCSV(p.imei_2),
    escapeCSV(p.serial_number),
    escapeCSV(p.condition),
    escapeCSV(p.purchase_price),
    escapeCSV(p.payment_method),
    escapeCSV(p.purchase_date),
    escapeCSV(p.purchase_time),
    escapeCSV(p.operator_name || 'Store Manager'),
    escapeCSV(p.status)
  ].join(','));

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const printDeviceSpecSheet = (item, storeName = 'Rathore Mobiles', currencySymbol = '₹') => {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${item.inventory_id} - ${item.brand} ${item.model}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
        .header { border-bottom: 2px solid #4f46e5; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
        .title { font-size: 24px; font-weight: bold; color: #0f172a; }
        .badge { background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 999px; font-weight: bold; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
        .field-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; margin-bottom: 2px; }
        .field-value { font-size: 15px; font-weight: 500; }
        .price-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; display: flex; justify-content: space-around; }
        .price-item { text-align: center; }
        .price-val { font-size: 20px; font-weight: bold; color: #4f46e5; }
        .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center; margin-top: 40px; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">${item.brand} ${item.model}</div>
          <div style="color: #64748b; margin-top: 4px;">ID: ${item.inventory_id} | ${item.color || ''} | ${item.storage || ''}</div>
        </div>
        <div class="badge">${item.status}</div>
      </div>

      <div class="grid">
        <div>
          <div class="field-label">Brand & Model</div>
          <div class="field-value">${item.brand} ${item.model} (${item.variant || 'Standard'})</div>
        </div>
        <div>
          <div class="field-label">Storage & RAM</div>
          <div class="field-value">${item.storage || '—'} / ${item.ram || '—'}</div>
        </div>
        <div>
          <div class="field-label">Primary IMEI</div>
          <div class="field-value" style="font-family: monospace;">${item.imei_1 || '—'}</div>
        </div>
        <div>
          <div class="field-label">Secondary IMEI</div>
          <div class="field-value" style="font-family: monospace;">${item.imei_2 || '—'}</div>
        </div>
        <div>
          <div class="field-label">Serial Number</div>
          <div class="field-value" style="font-family: monospace;">${item.serial_number || '—'}</div>
        </div>
        <div>
          <div class="field-label">Condition & Battery</div>
          <div class="field-value">${item.condition} ${item.battery_health ? `(${item.battery_health}% Health)` : ''}</div>
        </div>
        <div>
          <div class="field-label">Supplier / Source</div>
          <div class="field-value">${item.supplier || '—'}</div>
        </div>
        <div>
          <div class="field-label">Purchase Date</div>
          <div class="field-value">${item.purchase_date || '—'}</div>
        </div>
      </div>

      <div class="price-box">
        <div class="price-item">
          <div class="field-label">Selling Price</div>
          <div class="price-val">${currencySymbol}${Number(item.selling_price || 0).toLocaleString()}</div>
        </div>
        <div class="price-item">
          <div class="field-label">Warranty</div>
          <div class="field-value" style="margin-top: 4px;">${item.warranty || 'Store Warranty'}</div>
        </div>
      </div>

      <div>
        <div class="field-label">Included Accessories</div>
        <div class="field-value" style="margin-bottom: 16px;">${item.accessories || 'Handset only'}</div>
        
        <div class="field-label">Inspection & Technical Notes</div>
        <div class="field-value">${item.notes || 'Verified and inspected for optimal performance.'}</div>
      </div>

      <div class="footer">
        Generated by ${storeName} Inventory System on ${new Date().toLocaleDateString()}
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

export const printBuybackReceipt = (purchase, storeName = 'Rathore Mobiles', currencySymbol = '₹') => {
  const printWindow = window.open('', '_blank', 'width=850,height=950');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Buyback Receipt - ${purchase.purchase_id}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 36px; color: #0f172a; line-height: 1.4; }
        .receipt-header { border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
        .store-title { font-size: 22px; font-weight: 800; color: #0f172a; }
        .badge { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 13px; }
        .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #059669; margin: 18px 0 10px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .field-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; }
        .field-value { font-size: 14px; font-weight: 600; margin-top: 2px; }
        .amount-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; margin: 18px 0; display: flex; justify-content: space-between; align-items: center; }
        .declaration-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 11.5px; color: #334155; line-height: 1.5; margin: 18px 0; }
        .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 48px; }
        .sig-line { border-top: 1px solid #475569; padding-top: 6px; text-align: center; font-size: 12px; font-weight: 600; }
        .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 36px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
      </style>
    </head>
    <body>
      <div class="receipt-header">
        <div>
          <div class="store-title">${storeName}</div>
          <div style="color: #64748b; font-size: 13px; margin-top: 2px;">Used Phone Buyback & Seller Verification Certificate</div>
          <div style="font-size: 12px; color: #475569; margin-top: 4px;">
            Transaction Ref: <strong style="font-family: monospace;">${purchase.purchase_id}</strong> &nbsp;|&nbsp;
            Linked Inventory: <strong style="font-family: monospace;">${purchase.inventory_id}</strong>
          </div>
        </div>
        <div style="text-align: right;">
          <div class="badge">OFFICIAL PURCHASE RECORD</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 6px;">Date: ${purchase.purchase_date} ${purchase.purchase_time || ''}</div>
        </div>
      </div>

      <!-- Seller Details Section -->
      <div class="section-title">1. Seller Identification Record</div>
      <div class="grid">
        <div>
          <div class="field-label">Seller Full Name</div>
          <div class="field-value">${purchase.seller_name}</div>
        </div>
        <div>
          <div class="field-label">Contact Mobile</div>
          <div class="field-value">${purchase.seller_phone}</div>
        </div>
        <div>
          <div class="field-label">ID Verification Proof</div>
          <div class="field-value">${purchase.id_type} (${purchase.id_number_ref || 'Reference Recorded'})</div>
        </div>
        <div>
          <div class="field-label">Verification Status</div>
          <div class="field-value" style="color: #059669;">✓ ${purchase.id_verification_status || 'Verified'}</div>
        </div>
        <div style="grid-column: span 2;">
          <div class="field-label">Residential Address</div>
          <div class="field-value">${purchase.seller_address || 'Not Provided'}</div>
        </div>
      </div>

      <!-- Device Details Section -->
      <div class="section-title">2. Purchased Device Hardware Information</div>
      <div class="grid">
        <div>
          <div class="field-label">Brand & Model</div>
          <div class="field-value">${purchase.brand} ${purchase.model} ${purchase.variant ? `(${purchase.variant})` : ''}</div>
        </div>
        <div>
          <div class="field-label">Color / Finish & Specs</div>
          <div class="field-value">${purchase.color || 'Standard'} • ${purchase.storage || '—'} / ${purchase.ram || '—'}</div>
        </div>
        <div>
          <div class="field-label">Primary IMEI (IMEI 1)</div>
          <div class="field-value" style="font-family: monospace;">${purchase.imei_1 || '—'}</div>
        </div>
        <div>
          <div class="field-label">Secondary IMEI / Serial</div>
          <div class="field-value" style="font-family: monospace;">${purchase.imei_2 || purchase.serial_number || '—'}</div>
        </div>
        <div>
          <div class="field-label">Physical & Cosmetic Grade</div>
          <div class="field-value">${purchase.condition}</div>
        </div>
        <div>
          <div class="field-label">Inspection Remarks</div>
          <div class="field-value">${purchase.notes || 'Hardware inspection passed.'}</div>
        </div>
      </div>

      <!-- Financials Section -->
      <div class="amount-box">
        <div>
          <div style="font-size: 11px; text-transform: uppercase; color: #166534; font-weight: 700;">Disbursed Buyback Amount</div>
          <div style="font-size: 22px; font-weight: 800; color: #15803d; margin-top: 2px;">
            ${currencySymbol}${Number(purchase.purchase_price || 0).toLocaleString()}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; text-transform: uppercase; color: #166534; font-weight: 700;">Disbursement Method</div>
          <div style="font-size: 14px; font-weight: 700; color: #15803d; margin-top: 2px;">${purchase.payment_method || 'Cash'}</div>
        </div>
      </div>

      <!-- Legal Declaration -->
      <div class="declaration-box">
        <strong>SELLER LEGAL DECLARATION & AFFIDAVIT:</strong><br/>
        I, <strong>${purchase.seller_name}</strong>, hereby declare under penalty of law that I am the absolute legal owner of the handset described above and that I possess complete legal right to transfer title and ownership of this device to <em>${storeName}</em>. I affirm that the device is free from any liens, financial encumbrances, and has not been obtained through theft, fraud, or unlawful means. All personal data, accounts, and cryptographic locks (iCloud / Google FRP / Passcodes) have been removed by me prior to sale.
      </div>

      <!-- Signatures -->
      <div class="signatures">
        <div>
          <div style="height: 48px;"></div>
          <div class="sig-line">Seller Signature: ${purchase.seller_name}</div>
        </div>
        <div>
          <div style="height: 48px;"></div>
          <div class="sig-line">Authorized Store Representative (${purchase.operator_name || 'Store Manager'})</div>
        </div>
      </div>

      <div class="footer">
        This document serves as an official proof of transfer of personal property under local commercial buyback regulations.<br/>
        Generated securely by ${storeName} on ${new Date().toLocaleString()}.
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
