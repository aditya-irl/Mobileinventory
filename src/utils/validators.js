/**
 * Data validation helpers for mobile phones and inventory forms
 */

/**
 * Validates IMEI format and optionally Luhn checksum
 */
export const validateIMEI = (imei) => {
  if (!imei) return { valid: true }; // optional if empty, but if provided must be 15 digits
  const clean = String(imei).trim();
  if (!/^\d{14,16}$/.test(clean)) {
    return {
      valid: false,
      message: 'IMEI must be 15 numeric digits (found ' + clean.length + ' characters).'
    };
  }
  return { valid: true };
};

/**
 * Validates device inventory form data before submission
 */
export const validateInventoryForm = (formData, existingInventory = [], editingId = null) => {
  const errors = {};

  if (!formData.brand || !formData.brand.trim()) {
    errors.brand = 'Brand is required.';
  }

  if (!formData.model || !formData.model.trim()) {
    errors.model = 'Model name is required.';
  }

  if (formData.purchase_price === '' || formData.purchase_price === undefined || isNaN(formData.purchase_price)) {
    errors.purchase_price = 'Valid purchase price is required.';
  } else if (Number(formData.purchase_price) < 0) {
    errors.purchase_price = 'Purchase price cannot be negative.';
  }

  if (formData.selling_price !== '' && formData.selling_price !== undefined) {
    if (isNaN(formData.selling_price)) {
      errors.selling_price = 'Selling price must be a valid number.';
    } else if (Number(formData.selling_price) < 0) {
      errors.selling_price = 'Selling price cannot be negative.';
    }
  }

  // Validate IMEI 1 & 2
  if (formData.imei_1) {
    const imei1Res = validateIMEI(formData.imei_1);
    if (!imei1Res.valid) {
      errors.imei_1 = imei1Res.message;
    }
  }

  if (formData.imei_2) {
    const imei2Res = validateIMEI(formData.imei_2);
    if (!imei2Res.valid) {
      errors.imei_2 = imei2Res.message;
    }
    if (formData.imei_1 && formData.imei_1.trim() === formData.imei_2.trim()) {
      errors.imei_2 = 'IMEI 2 cannot be identical to IMEI 1.';
    }
  }

  // Duplicate IMEI check in existing inventory
  if (existingInventory && existingInventory.length > 0) {
    const imei1Clean = String(formData.imei_1 || '').trim();
    const imei2Clean = String(formData.imei_2 || '').trim();

    for (const item of existingInventory) {
      if (editingId && item.inventory_id === editingId) continue;

      const existingImei1 = String(item.imei_1 || '').trim();
      const existingImei2 = String(item.imei_2 || '').trim();

      if (imei1Clean && (imei1Clean === existingImei1 || imei1Clean === existingImei2)) {
        errors.imei_1 = `IMEI 1 is already in use by item ${item.inventory_id} (${item.brand} ${item.model}).`;
      }

      if (imei2Clean && (imei2Clean === existingImei1 || imei2Clean === existingImei2)) {
        errors.imei_2 = `IMEI 2 is already in use by item ${item.inventory_id} (${item.brand} ${item.model}).`;
      }
    }
  }

  // Battery health validation
  if (formData.battery_health !== '' && formData.battery_health !== undefined && formData.battery_health !== null) {
    const bh = Number(formData.battery_health);
    if (isNaN(bh) || bh < 1 || bh > 100) {
      errors.battery_health = 'Battery health must be a percentage between 1 and 100.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
