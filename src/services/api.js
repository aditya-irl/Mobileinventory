/**
 * API Service for PhoneVault Pro / Rathore Mobiles
 * Central API Service communicating directly with Google Apps Script Web App Backend & Google Sheets.
 */

import { INITIAL_SAMPLE_INVENTORY } from '../data/sampleInventory';
import { INITIAL_SAMPLE_PURCHASES } from '../data/samplePurchases';

const LOCAL_STORAGE_KEY = 'phonevault_inventory_db_v1';
const PURCHASES_STORAGE_KEY = 'phonevault_purchases_db_v1';
const SETTINGS_KEY = 'phonevault_settings_v1';

// Default Google Apps Script URL if not overridden
const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxr5SUZ9XsY4UXgOxiC4GDYlkI3ghuvOhYtfxggzITI1udU7gSEhg7rdXcKhkeEo_i2-w/exec';

// Get current API URL (from localStorage override or vite env or fallback default)
export const getApiUrl = () => {
  try {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      if (parsed.apiUrl && parsed.apiUrl.trim()) return parsed.apiUrl.trim();
    }
  } catch (e) {
    // ignore
  }
  return (import.meta.env.VITE_API_URL || DEFAULT_APPS_SCRIPT_URL).trim();
};

/**
 * Local Storage Database Helpers (Resilience Cache)
 */
const getLocalInventory = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading localStorage inventory', e);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_INVENTORY));
  return INITIAL_SAMPLE_INVENTORY;
};

const saveLocalInventory = (items) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
};

const getLocalPurchases = () => {
  try {
    const data = localStorage.getItem(PURCHASES_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading localStorage purchases', e);
  }
  localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_PURCHASES));
  return INITIAL_SAMPLE_PURCHASES;
};

const saveLocalPurchases = (items) => {
  localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(items));
};

/**
 * Main Central API Service
 */
export const api = {
  /**
   * Health check / Connection Test
   * Calls ?action=testConnection or ?action=list
   */
  testConnection: async (customUrl = null) => {
    const url = (customUrl || getApiUrl()).trim();
    if (!url) {
      return { success: true, mode: 'local', message: 'Running in Local Storage / Demo Mode' };
    }

    try {
      const sep = url.includes('?') ? '&' : '?';
      // 1. Try action=testConnection
      let res = await fetch(`${url}${sep}action=testConnection`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      let data = await res.json();

      if (data && data.success) {
        return {
          success: true,
          mode: 'google',
          message: data.message || 'Google Sheets connection successful',
          data
        };
      }

      // 2. If the deployed Apps Script returns "Unknown action" (pending version update), test action=list
      if (data && (data.error === 'Unknown action' || !data.success)) {
        try {
          const fallbackRes = await fetch(`${url}${sep}action=list`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          });
          const fallbackData = await fallbackRes.json();
          if (fallbackData && fallbackData.success) {
            return {
              success: true,
              mode: 'google',
              message: 'Google Sheets connection successful',
              data: fallbackData
            };
          }
        } catch (e) {
          // ignore fallback error
        }
      }

      return {
        success: false,
        mode: 'google',
        error: data?.error || 'Failed to connect to Google Sheets'
      };
    } catch (err) {
      return {
        success: false,
        mode: 'google',
        error: 'Network connection failed: ' + (err.message || 'Check your internet connection and Apps Script permissions.')
      };
    }
  },

  /**
   * Ping (alias for testConnection)
   */
  ping: async (customUrl = null) => {
    return api.testConnection(customUrl);
  },

  /**
   * Fetch All Inventory
   * Calls ?action=list
   */
  getInventory: async () => {
    const url = getApiUrl();

    if (!url) {
      const data = getLocalInventory();
      return { success: true, data, total: data.length, mode: 'local' };
    }

    try {
      const sep = url.includes('?') ? '&' : '?';
      const res = await fetch(`${url}${sep}action=list`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const json = await res.json();

      if (json && json.success && Array.isArray(json.data)) {
        // Normalize inventory items preserving all 26 columns
        const normalized = json.data.map(item => {
          let batteryHealth = item.battery_health;
          if (batteryHealth !== null && batteryHealth !== undefined && batteryHealth !== '') {
            const bhNum = Number(batteryHealth);
            if (bhNum > 0 && bhNum <= 1) {
              batteryHealth = bhNum === 1 ? 100 : Math.round(bhNum * 100);
            } else {
              batteryHealth = bhNum;
            }
          } else {
            batteryHealth = null;
          }

          let photos = [];
          if (item.photo_urls) {
            if (Array.isArray(item.photo_urls)) {
              photos = item.photo_urls;
            } else if (typeof item.photo_urls === 'string') {
              if (item.photo_urls.startsWith('[')) {
                try { photos = JSON.parse(item.photo_urls); } catch (e) { photos = [item.photo_urls]; }
              } else if (item.photo_urls.trim()) {
                photos = [item.photo_urls.trim()];
              }
            }
          }

          const purchasePrice = Number(item.purchase_price) || 0;
          const sellingPrice = Number(item.selling_price) || 0;
          const profit = item.profit !== undefined && item.profit !== null && item.profit !== '' 
            ? Number(item.profit) 
            : (sellingPrice - purchasePrice);

          return {
            inventory_id: String(item.inventory_id || ''),
            brand: String(item.brand || ''),
            model: String(item.model || ''),
            variant: String(item.variant || ''),
            color: String(item.color || ''),
            storage: String(item.storage || ''),
            ram: String(item.ram || ''),
            imei_1: String(item.imei_1 || ''),
            imei_2: String(item.imei_2 || ''),
            serial_number: String(item.serial_number || ''),
            battery_health: batteryHealth,
            condition: String(item.condition || 'Like New'),
            purchase_price: purchasePrice,
            selling_price: sellingPrice,
            profit: profit,
            purchase_date: item.purchase_date ? String(item.purchase_date).split('T')[0] : '',
            selling_date: item.selling_date ? String(item.selling_date).split('T')[0] : '',
            supplier: String(item.supplier || ''),
            customer: String(item.customer || ''),
            status: String(item.status || 'Available'),
            accessories: String(item.accessories || ''),
            warranty: String(item.warranty || ''),
            notes: String(item.notes || ''),
            photo_urls: photos,
            created_at: String(item.created_at || ''),
            updated_at: String(item.updated_at || '')
          };
        });

        // Mirror locally for offline caching
        saveLocalInventory(normalized);
        return { success: true, data: normalized, total: normalized.length, mode: 'google' };
      }

      throw new Error(json?.error || 'Failed to fetch inventory from Google Sheets');
    } catch (err) {
      console.warn('Google Apps Script getInventory error:', err);
      const cached = getLocalInventory();
      return { success: true, data: cached, total: cached.length, mode: 'google', cached: true, error: err.message };
    }
  },

  /**
   * Fetch Dashboard Stats
   * Calls ?action=stats
   */
  getStats: async () => {
    const url = getApiUrl();
    if (!url) return { success: false, error: 'No URL configured' };

    try {
      const sep = url.includes('?') ? '&' : '?';
      const res = await fetch(`${url}${sep}action=stats`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Add New Inventory Item
   * Sends POST action=add
   */
  addInventory: async (itemData) => {
    const url = getApiUrl();

    // Clean and normalize photo_urls
    let cleanPhotos = [];
    if (itemData.photo_urls && Array.isArray(itemData.photo_urls)) {
      cleanPhotos = itemData.photo_urls.filter(u => u && typeof u === 'string' && !u.includes('[Ljava.lang.Object'));
    }

    const current = getLocalInventory();
    let maxNum = 0;
    current.forEach(item => {
      if (item.inventory_id && item.inventory_id.startsWith('INV-')) {
        const num = parseInt(item.inventory_id.replace('INV-', ''), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    const nextId = 'INV-' + ('0000' + (maxNum + 1)).slice(-4);
    const now = new Date().toISOString();

    const purchasePrice = Number(itemData.purchase_price) || 0;
    const sellingPrice = Number(itemData.selling_price) || 0;
    const profit = sellingPrice - purchasePrice;

    const newItem = {
      ...itemData,
      inventory_id: itemData.inventory_id || nextId,
      purchase_price: purchasePrice,
      selling_price: sellingPrice,
      profit: profit,
      status: itemData.status || 'Available',
      created_at: now,
      updated_at: now,
      photo_urls: cleanPhotos
    };

    if (!url) {
      const updated = [newItem, ...current];
      saveLocalInventory(updated);
      return { success: true, data: newItem, inventory_id: newItem.inventory_id, message: 'Device added to local inventory.' };
    }

    try {
      const payload = {
        action: 'add',
        data: {
          brand: itemData.brand || '',
          model: itemData.model || '',
          variant: itemData.variant || '',
          color: itemData.color || '',
          storage: itemData.storage || '',
          ram: itemData.ram || '',
          imei_1: itemData.imei_1 || '',
          imei_2: itemData.imei_2 || '',
          serial_number: itemData.serial_number || '',
          battery_health: itemData.battery_health !== undefined && itemData.battery_health !== null && itemData.battery_health !== '' ? Number(itemData.battery_health) : '',
          condition: itemData.condition || 'Brand New',
          purchase_price: Number(itemData.purchase_price) || 0,
          selling_price: Number(itemData.selling_price) || 0,
          profit: (Number(itemData.selling_price) || 0) - (Number(itemData.purchase_price) || 0),
          purchase_date: itemData.purchase_date || new Date().toISOString().split('T')[0],
          selling_date: itemData.selling_date || '',
          supplier: itemData.supplier || '',
          customer: itemData.customer || '',
          status: itemData.status || 'Available',
          accessories: itemData.accessories || '',
          warranty: itemData.warranty || '',
          notes: itemData.notes || '',
          photo_urls: cleanPhotos
        }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json && json.success) {
        const current = getLocalInventory();
        const createdItem = json.data || { ...newItem, inventory_id: json.inventory_id || newItem.inventory_id };
        saveLocalInventory([createdItem, ...current.filter(i => i.inventory_id !== createdItem.inventory_id)]);
        return json;
      }
      throw new Error(json?.error || 'Failed to save to Google Sheets');
    } catch (err) {
      console.warn('Google Apps Script addInventory fallback to local cache:', err);
      const current = getLocalInventory();
      saveLocalInventory([newItem, ...current.filter(i => i.inventory_id !== newItem.inventory_id)]);
      return { success: true, data: newItem, inventory_id: newItem.inventory_id, message: 'Saved to local cache.' };
    }
  },

  /**
   * Update Inventory Item
   * Sends POST action=update
   */
  updateInventory: async (itemData) => {
    if (!itemData || !itemData.inventory_id) {
      throw new Error('inventory_id is required to update device.');
    }

    const url = getApiUrl();
    const current = getLocalInventory();
    const index = current.findIndex(i => i.inventory_id === itemData.inventory_id);

    const purchasePrice = itemData.purchase_price !== undefined ? Number(itemData.purchase_price) : (index !== -1 ? Number(current[index].purchase_price || 0) : 0);
    const sellingPrice = itemData.selling_price !== undefined ? Number(itemData.selling_price) : (index !== -1 ? Number(current[index].selling_price || 0) : 0);
    const profit = sellingPrice - purchasePrice;

    let cleanPhotos = [];
    if (itemData.photo_urls && Array.isArray(itemData.photo_urls)) {
      cleanPhotos = itemData.photo_urls.filter(u => u && typeof u === 'string' && !u.includes('[Ljava.lang.Object'));
    } else if (index !== -1 && current[index].photo_urls) {
      cleanPhotos = (Array.isArray(current[index].photo_urls) ? current[index].photo_urls : [current[index].photo_urls]).filter(u => u && typeof u === 'string' && !u.includes('[Ljava.lang.Object'));
    }

    const updatedItem = {
      ...(index !== -1 ? current[index] : {}),
      ...itemData,
      inventory_id: itemData.inventory_id,
      purchase_price: purchasePrice,
      selling_price: sellingPrice,
      profit: profit,
      photo_urls: cleanPhotos,
      updated_at: new Date().toISOString()
    };

    // Save to local cache immediately
    if (index !== -1) {
      current[index] = updatedItem;
      saveLocalInventory(current);
    } else {
      saveLocalInventory([updatedItem, ...current]);
    }

    if (!url) {
      return { success: true, data: updatedItem, message: `Device ${itemData.inventory_id} updated.` };
    }

    try {
      const payloadData = {
        ...updatedItem,
        inventory_id: itemData.inventory_id,
        purchase_price: purchasePrice,
        selling_price: sellingPrice,
        profit: profit,
        photo_urls: cleanPhotos,
        updated_at: updatedItem.updated_at
      };

      const payload = {
        action: 'update',
        inventory_id: itemData.inventory_id,
        data: payloadData
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json && json.success) {
        return json;
      }
      return { success: true, data: updatedItem, message: json?.message || 'Device updated.' };
    } catch (err) {
      console.warn('Google Apps Script update error, preserved in local cache:', err);
      return {
        success: true,
        data: updatedItem,
        mode: 'google_cached',
        message: `Device ${itemData.inventory_id} updated.`
      };
    }
  },

  /**
   * Mark Item as Sold
   * Uses existing POST action=update endpoint with status="Sold" and selling_date
   */
  markAsSold: async (saleData) => {
    if (!saleData || !saleData.inventory_id) {
      throw new Error('inventory_id is required to record sale.');
    }

    const inventory_id = saleData.inventory_id;
    const nowISO = new Date().toISOString();
    const selling_date = saleData.selling_date || nowISO.split('T')[0];

    const updatePayload = {
      ...saleData,
      inventory_id,
      status: 'Sold',
      selling_date,
      selling_price: saleData.selling_price !== undefined ? Number(saleData.selling_price) : undefined,
      customer: saleData.customer ? String(saleData.customer).trim() : 'Direct Customer'
    };

    return api.updateInventory(updatePayload);
  },

  /**
   * Delete / Archive Device
   * Sends POST action=delete
   */
  deleteInventory: async (inventoryId) => {
    if (!inventoryId) {
      throw new Error('inventory_id is required for deletion.');
    }

    const url = getApiUrl();

    if (!url) {
      const current = getLocalInventory();
      const filtered = current.filter(i => i.inventory_id !== inventoryId);
      saveLocalInventory(filtered);
      return { success: true, message: `Device ${inventoryId} deleted.` };
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'delete',
          inventory_id: inventoryId,
          data: { inventory_id: inventoryId }
        })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to delete from Google Sheets');
      return json;
    } catch (err) {
      throw new Error(err.message || 'Unable to delete device from Google Sheets');
    }
  },

  /**
   * Upload Photo to Google Drive and update inventory row
   * Sends POST action=uploadPhoto
   */
  uploadPhoto: async ({ inventory_id, file, base64_data, file_name, mime_type }) => {
    const url = getApiUrl();

    // Clean / determine base64
    let cleanBase64 = base64_data || '';
    let detectedMime = mime_type || 'image/jpeg';

    if (cleanBase64.startsWith('data:')) {
      const parts = cleanBase64.split(',');
      const match = parts[0].match(/:(.*?);/);
      if (match && match[1]) detectedMime = match[1].toLowerCase();
      cleanBase64 = parts[1] || '';
    }

    // Client-side validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (detectedMime && !allowedTypes.includes(detectedMime.toLowerCase())) {
      throw new Error(`Unsupported image format (${detectedMime}). Only JPG, PNG, and WebP are supported.`);
    }

    if (!cleanBase64) {
      throw new Error('Please select an image.');
    }

    if (cleanBase64.length > 14000000) {
      throw new Error('Image size is too large. Maximum allowed size is 10 MB.');
    }

    const payload = {
      action: 'uploadPhoto',
      data: {
        inventory_id: inventory_id || 'UNASSIGNED',
        base64_data: cleanBase64,
        mime_type: detectedMime,
        file_name: file_name || (inventory_id ? `${inventory_id}_photo_${Date.now()}.jpg` : `photo_${Date.now()}.jpg`)
      }
    };

    if (!url) {
      // Local mode fallback simulation
      const dataUrl = `data:${detectedMime};base64,${cleanBase64}`;
      if (inventory_id && inventory_id !== 'UNASSIGNED') {
        const current = getLocalInventory();
        const index = current.findIndex(i => i.inventory_id === inventory_id);
        if (index !== -1) {
          const existingUrls = current[index].photo_urls || [];
          const updatedUrls = [...existingUrls, dataUrl];
          current[index] = { ...current[index], photo_urls: updatedUrls, updated_at: new Date().toISOString() };
          saveLocalInventory(current);
        }
      }
      return {
        success: true,
        message: 'Photo saved locally.',
        file_url: dataUrl,
        file_id: 'local_' + Date.now()
      };
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (parseErr) {
        if (text.includes('drive.google.com') || text.includes('Unable to open the file') || text.includes('<!DOCTYPE') || text.includes('Google Drive')) {
          throw new Error('Google Apps Script requires Drive permission approval or a new version deployment. In script.google.com: select authorizeAndSetupDrive, click Run, and deploy as a New Version.');
        }
        throw new Error('Invalid response from Google Apps Script Web App: ' + text.substring(0, 100));
      }

      if (!json || !json.success) {
        throw new Error(json?.error || 'Photo upload failed.');
      }
      return json;
    } catch (err) {
      throw new Error(err.message || 'Photo upload failed. Check connection.');
    }
  },

  /**
   * ====================================================================
   * PURCHASES / BUYBACK MODULE API METHODS
   * ====================================================================
   */

  /**
   * Fetch All Purchases
   */
  getPurchases: async () => {
    const url = getApiUrl();

    if (!url) {
      const data = getLocalPurchases();
      return { success: true, data, total: data.length, mode: 'local' };
    }

    try {
      const sep = url.includes('?') ? '&' : '?';
      const res = await fetch(`${url}${sep}action=getPurchases`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        saveLocalPurchases(json.data);
        return { ...json, mode: 'google' };
      }
      // If endpoint not on remote yet, return local purchases
      const local = getLocalPurchases();
      return { success: true, data: local, total: local.length, mode: 'google' };
    } catch (err) {
      const data = getLocalPurchases();
      return { success: true, data, total: data.length, mode: 'google', cached: true };
    }
  },

  /**
   * Add New Purchase (Buyback Transaction)
   */
  addPurchase: async (purchaseData) => {
    const url = getApiUrl();

    // Prepare sequential IDs and local fallback
    const purchases = getLocalPurchases();
    const inventory = getLocalInventory();

    let maxPurNum = 0;
    purchases.forEach(p => {
      if (p.purchase_id && p.purchase_id.startsWith('PUR-')) {
        const num = parseInt(p.purchase_id.replace('PUR-', ''), 10);
        if (!isNaN(num) && num > maxPurNum) maxPurNum = num;
      }
    });
    const nextPurId = 'PUR-' + ('0000' + (maxPurNum + 1)).slice(-4);

    let maxInvNum = 0;
    inventory.forEach(i => {
      if (i.inventory_id && i.inventory_id.startsWith('INV-')) {
        const num = parseInt(i.inventory_id.replace('INV-', ''), 10);
        if (!isNaN(num) && num > maxInvNum) maxInvNum = num;
      }
    });
    const nextInvId = 'INV-' + ('0000' + (maxInvNum + 1)).slice(-4);

    const now = new Date();
    const nowISO = now.toISOString();
    const purchaseDate = purchaseData.purchase_date || nowISO.split('T')[0];
    const purchaseTime = purchaseData.purchase_time || now.toTimeString().substring(0, 5);

    const purchasePrice = Number(purchaseData.purchase_price) || 0;
    const targetSellingPrice = Number(purchaseData.target_selling_price || purchaseData.selling_price) || Math.round(purchasePrice * 1.15);

    const newPurchase = {
      ...purchaseData,
      purchase_id: nextPurId,
      inventory_id: nextInvId,
      purchase_price: purchasePrice,
      purchase_date: purchaseDate,
      purchase_time: purchaseTime,
      status: 'Completed',
      created_at: nowISO,
      updated_at: nowISO
    };

    if (!url) {
      const newInventory = {
        inventory_id: nextInvId,
        brand: purchaseData.brand || '',
        model: purchaseData.model || '',
        variant: purchaseData.variant || '',
        color: purchaseData.color || '',
        storage: purchaseData.storage || '',
        ram: purchaseData.ram || '',
        imei_1: purchaseData.imei_1 || '',
        imei_2: purchaseData.imei_2 || '',
        serial_number: purchaseData.serial_number || '',
        battery_health: purchaseData.battery_health !== undefined ? purchaseData.battery_health : 100,
        condition: purchaseData.condition || 'Like New',
        purchase_price: purchasePrice,
        selling_price: targetSellingPrice,
        profit: targetSellingPrice - purchasePrice,
        purchase_date: purchaseDate,
        selling_date: '',
        supplier: `Buyback / ${nextPurId}`,
        customer: '',
        status: 'Available',
        accessories: purchaseData.accessories || 'Handset only',
        warranty: purchaseData.warranty || 'Store Warranty',
        notes: `Purchased from customer ${purchaseData.seller_name || ''} (Ref: ${nextPurId}). ${purchaseData.notes || ''}`,
        photo_urls: purchaseData.device_photos || [],
        created_at: nowISO,
        updated_at: nowISO
      };

      saveLocalPurchases([newPurchase, ...purchases]);
      saveLocalInventory([newInventory, ...inventory]);

      return {
        success: true,
        purchase_id: nextPurId,
        inventory_id: nextInvId,
        data: newPurchase
      };
    }

    try {
      // 1. Try addPurchase action on remote Apps Script
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'addPurchase', data: purchaseData })
      });
      const json = await res.json();

      if (json && json.success) {
        saveLocalPurchases([json.data || newPurchase, ...purchases]);
        return json;
      }

      // 2. If remote returns "Unknown action" (older deployment), fallback to saving inventory via action=add
      if (json && json.error === 'Unknown action') {
        const invRes = await api.addInventory({
          brand: purchaseData.brand,
          model: purchaseData.model,
          variant: purchaseData.variant,
          color: purchaseData.color,
          storage: purchaseData.storage,
          ram: purchaseData.ram,
          imei_1: purchaseData.imei_1,
          imei_2: purchaseData.imei_2,
          serial_number: purchaseData.serial_number,
          battery_health: purchaseData.battery_health,
          condition: purchaseData.condition,
          purchase_price: purchasePrice,
          selling_price: targetSellingPrice,
          purchase_date: purchaseDate,
          supplier: `Buyback / ${nextPurId} (${purchaseData.seller_name || ''})`,
          status: 'Available',
          accessories: purchaseData.accessories || 'Handset only',
          warranty: purchaseData.warranty || 'Store Warranty',
          notes: `Buyback from ${purchaseData.seller_name || ''}. ${purchaseData.notes || ''}`
        });

        const createdInvId = invRes.inventory_id || nextInvId;
        const recordedPurchase = {
          ...newPurchase,
          inventory_id: createdInvId
        };
        saveLocalPurchases([recordedPurchase, ...purchases]);

        return {
          success: true,
          purchase_id: nextPurId,
          inventory_id: createdInvId,
          data: recordedPurchase,
          message: 'Buyback recorded and phone added to Google Sheets Inventory.'
        };
      }

      throw new Error(json.error || 'Failed to record buyback transaction');
    } catch (err) {
      throw new Error(err.message || 'Unable to connect to Google Apps Script API');
    }
  },

  /**
   * Trace IMEI
   */
  traceIMEI: async (imei) => {
    const cleanImei = String(imei || '').trim();
    if (!cleanImei) return { success: false, found: false, purchases: [], inventory: [] };

    const url = getApiUrl();
    if (!url) {
      const purchases = getLocalPurchases();
      const inventory = getLocalInventory();

      const matchedPurchases = purchases.filter(p => p.imei_1 === cleanImei || p.imei_2 === cleanImei);
      const matchedInventory = inventory.filter(i => i.imei_1 === cleanImei || i.imei_2 === cleanImei);

      return {
        success: true,
        imei: cleanImei,
        found: matchedPurchases.length > 0 || matchedInventory.length > 0,
        purchases: matchedPurchases,
        inventory: matchedInventory
      };
    }

    try {
      const sep = url.includes('?') ? '&' : '?';
      const res = await fetch(`${url}${sep}action=traceIMEI&imei=${encodeURIComponent(cleanImei)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const json = await res.json();
      if (json && json.success) return json;

      // Fallback to local trace
      const purchases = getLocalPurchases();
      const inventory = getLocalInventory();
      const matchedPurchases = purchases.filter(p => p.imei_1 === cleanImei || p.imei_2 === cleanImei);
      const matchedInventory = inventory.filter(i => i.imei_1 === cleanImei || i.imei_2 === cleanImei);

      return {
        success: true,
        imei: cleanImei,
        found: matchedPurchases.length > 0 || matchedInventory.length > 0,
        purchases: matchedPurchases,
        inventory: matchedInventory
      };
    } catch (err) {
      const purchases = getLocalPurchases();
      const inventory = getLocalInventory();
      const matchedPurchases = purchases.filter(p => p.imei_1 === cleanImei || p.imei_2 === cleanImei);
      const matchedInventory = inventory.filter(i => i.imei_1 === cleanImei || i.imei_2 === cleanImei);

      return {
        success: true,
        imei: cleanImei,
        found: matchedPurchases.length > 0 || matchedInventory.length > 0,
        purchases: matchedPurchases,
        inventory: matchedInventory
      };
    }
  },

  /**
   * Archive Purchase Record
   */
  archivePurchase: async (purchaseId) => {
    const url = getApiUrl();
    if (!url) {
      const purchases = getLocalPurchases();
      const index = purchases.findIndex(p => p.purchase_id === purchaseId);
      if (index === -1) throw new Error(`Purchase ${purchaseId} not found.`);

      purchases[index] = {
        ...purchases[index],
        status: 'Archived',
        updated_at: new Date().toISOString()
      };
      saveLocalPurchases(purchases);
      return { success: true, message: `Purchase ${purchaseId} archived.` };
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'archivePurchase', purchase_id: purchaseId })
      });
      const json = await res.json();
      if (json && json.success) return json;

      // Fallback local archive
      const purchases = getLocalPurchases();
      const index = purchases.findIndex(p => p.purchase_id === purchaseId);
      if (index !== -1) {
        purchases[index].status = 'Archived';
        saveLocalPurchases(purchases);
      }
      return { success: true, message: `Purchase ${purchaseId} archived.` };
    } catch (err) {
      throw new Error(err.message || 'Unable to archive purchase record');
    }
  },

  /**
   * Reset sample data
   */
  resetSampleData: () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_INVENTORY));
    localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_PURCHASES));
    return {
      inventory: INITIAL_SAMPLE_INVENTORY,
      purchases: INITIAL_SAMPLE_PURCHASES
    };
  }
};
