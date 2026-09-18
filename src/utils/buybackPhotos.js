import { getSafeImageUrl } from './formatters';

/**
 * Robust helper to extract and normalize DOCUMENT PHOTOS from a purchase record.
 * Handles arrays, JSON-encoded array strings, comma-separated URLs, and legacy fields.
 */
export const extractPurchaseDocumentPhotos = (purchase) => {
  if (!purchase) return [];
  const list = [];

  const addUrl = (url) => {
    if (!url || typeof url !== 'string') return;
    const clean = url.trim();
    if (clean && !clean.includes('[Ljava.lang.Object') && !list.includes(clean)) {
      list.push(clean);
    }
  };

  // 1. Direct document_photos array
  if (Array.isArray(purchase.document_photos)) {
    purchase.document_photos.forEach(addUrl);
  }

  // 2. document_photo_url field (can be single URL, array, or JSON string)
  if (purchase.document_photo_url) {
    if (Array.isArray(purchase.document_photo_url)) {
      purchase.document_photo_url.forEach(addUrl);
    } else if (typeof purchase.document_photo_url === 'string') {
      const raw = purchase.document_photo_url.trim();
      if (raw.startsWith('[') && raw.endsWith(']')) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach(addUrl);
          }
        } catch (e) {
          addUrl(raw);
        }
      } else if (raw.includes(',')) {
        raw.split(',').forEach(part => addUrl(part.trim()));
      } else {
        addUrl(raw);
      }
    }
  }

  // 3. seller_photo_url (seller face KYC photo is also part of document/KYC proof)
  if (purchase.seller_photo_url && typeof purchase.seller_photo_url === 'string') {
    addUrl(purchase.seller_photo_url);
  }

  return list;
};

/**
 * Robust helper to extract and normalize DEVICE PHOTOS from a purchase record and linked inventory.
 */
export const extractPurchaseDevicePhotos = (purchase, inventoryList = []) => {
  if (!purchase) return [];
  const list = [];

  const addUrl = (url) => {
    if (!url || typeof url !== 'string') return;
    const clean = url.trim();
    if (clean && !clean.includes('[Ljava.lang.Object') && !list.includes(clean)) {
      list.push(clean);
    }
  };

  // 1. Direct device_photos array
  if (Array.isArray(purchase.device_photos)) {
    purchase.device_photos.forEach(addUrl);
  }

  // 2. photo_urls on purchase record
  if (Array.isArray(purchase.photo_urls)) {
    purchase.photo_urls.forEach(addUrl);
  } else if (typeof purchase.photo_urls === 'string') {
    const raw = purchase.photo_urls.trim();
    if (raw.startsWith('[') && raw.endsWith(']')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) parsed.forEach(addUrl);
      } catch (e) {
        addUrl(raw);
      }
    } else {
      addUrl(raw);
    }
  }

  // 3. Linked inventory item's photo_urls
  if (purchase.inventory_id && Array.isArray(inventoryList)) {
    const linkedItem = inventoryList.find(i => i.inventory_id === purchase.inventory_id);
    if (linkedItem && Array.isArray(linkedItem.photo_urls)) {
      linkedItem.photo_urls.forEach(addUrl);
    }
  }

  return list;
};
