import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { api, getApiUrl, getStorageConfig, DEFAULT_GOOGLE_APPS_SCRIPT_URL } from '../services/api';
import { useToast } from './ToastContext';

// Dynamic confetti trigger to avoid bundling canvas-confetti into the critical initial chunk
const triggerCelebration = async (options) => {
  try {
    const confettiModule = await import('canvas-confetti');
    const confetti = confettiModule.default || confettiModule;
    confetti(options);
  } catch (e) {
    // Non-critical visual effect fallback
  }
};

const InventoryContext = createContext();

const SETTINGS_STORAGE_KEY = 'phonevault_settings_v1';

/**
 * Reconciles inventory stock with buyback purchase records.
 * Any non-archived, non-removed buyback phone that is not already in inventory
 * is synthesized as available stock so it is visible in the Inventory catalog.
 */
export const reconcileInventoryWithPurchases = (inventoryItems = [], purchaseRecords = []) => {
  if (!Array.isArray(inventoryItems)) inventoryItems = [];
  if (!Array.isArray(purchaseRecords)) return inventoryItems;

  let removedPurchaseIds = [];
  try {
    removedPurchaseIds = JSON.parse(localStorage.getItem('phonevault_removed_purchases_v1') || '[]');
  } catch (e) {}

  let removedInventoryIds = [];
  try {
    removedInventoryIds = JSON.parse(localStorage.getItem('phonevault_removed_inventory_v1') || '[]');
  } catch (e) {}

  // Filter out any inventory items that match explicitly removed IDs
  const activeInventory = inventoryItems.filter(item => {
    if (item.inventory_id && removedInventoryIds.includes(item.inventory_id)) {
      return false;
    }
    if (item.supplier) {
      for (const remId of removedPurchaseIds) {
        if (item.supplier.includes(remId)) return false;
      }
    }
    return true;
  });

  purchaseRecords.forEach(p => {
    // 1. Skip if purchase was removed from app by user
    if (!p || !p.purchase_id || removedPurchaseIds.includes(p.purchase_id)) return;

    // 2. Skip if archived (archived purchases are not active unsold stock)
    if (p.status === 'Archived') return;

    // 3. Check if phone is already represented in inventory
    const exists = activeInventory.some(inv => {
      // Linked via supplier tag (e.g. "Buyback / PUR-0004")
      if (inv.supplier && inv.supplier.includes(p.purchase_id)) return true;
      // Linked via notes tag (e.g. "Ref: PUR-0004")
      if (inv.notes && inv.notes.includes(p.purchase_id)) return true;
      // Linked via primary IMEI match
      if (p.imei_1 && (String(inv.imei_1).trim() === String(p.imei_1).trim() || String(inv.imei_2).trim() === String(p.imei_1).trim())) {
        return true;
      }
      // Linked via inventory_id if unique and not assigned to another purchase
      if (p.inventory_id && inv.inventory_id === p.inventory_id) {
        if (!inv.supplier || !inv.supplier.startsWith('Buyback / PUR-') || inv.supplier.includes(p.purchase_id)) {
          return true;
        }
      }
      return false;
    });

    if (!exists) {
      // Determine unique inventory_id
      let assignedInvId = p.inventory_id;
      if (!assignedInvId || activeInventory.some(inv => inv.inventory_id === assignedInvId)) {
        assignedInvId = `INV-${p.purchase_id.replace('PUR-', '')}`;
      }

      if (removedInventoryIds.includes(assignedInvId) || (p.inventory_id && removedInventoryIds.includes(p.inventory_id))) {
        return;
      }

      const purchasePrice = Number(p.purchase_price) || 0;
      const targetSellingPrice = Number(p.target_selling_price || p.selling_price) || Math.round(purchasePrice * 1.15);
      const profit = targetSellingPrice - purchasePrice;

      // Extract device photos from purchase
      let photos = [];
      if (Array.isArray(p.device_photos) && p.device_photos.length > 0) {
        photos = p.device_photos;
      } else if (Array.isArray(p.photo_urls) && p.photo_urls.length > 0) {
        photos = p.photo_urls;
      } else if (typeof p.photo_urls === 'string' && p.photo_urls.trim()) {
        try { photos = JSON.parse(p.photo_urls); } catch (e) { photos = [p.photo_urls.trim()]; }
      }

      activeInventory.push({
        inventory_id: assignedInvId,
        brand: p.brand || '',
        model: p.model || '',
        variant: p.variant || '',
        color: p.color || '',
        storage: p.storage || '',
        ram: p.ram || '',
        imei_1: p.imei_1 || '',
        imei_2: p.imei_2 || '',
        serial_number: p.serial_number || '',
        battery_health: p.battery_health !== undefined && p.battery_health !== null && p.battery_health !== '' ? Number(p.battery_health) : 100,
        condition: p.condition || 'Like New',
        purchase_price: purchasePrice,
        selling_price: targetSellingPrice,
        profit: profit,
        purchase_date: p.purchase_date || '',
        selling_date: '',
        supplier: `Buyback / ${p.purchase_id}`,
        customer: '',
        status: 'Available',
        accessories: p.accessories || 'Handset only',
        warranty: p.warranty || 'Store Warranty',
        notes: p.notes ? `Buyback from ${p.seller_name || ''} (Ref: ${p.purchase_id}). ${p.notes}` : `Buyback from ${p.seller_name || ''} (Ref: ${p.purchase_id})`,
        photo_urls: photos,
        created_at: p.created_at || '',
        updated_at: p.updated_at || '',
        _fromBuyback: true,
        purchase_id: p.purchase_id
      });
    }
  });

  return activeInventory;
};

export const InventoryProvider = ({ children }) => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const [inventory, setInventory] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize centralized storage configuration
  const initialConfig = getStorageConfig();
  const [storageMode, setStorageMode] = useState(initialConfig.mode);
  const [settings, setSettings] = useState({
    storeName: initialConfig.storeName,
    currency: initialConfig.currency,
    apiUrl: initialConfig.apiUrl,
    storageMode: initialConfig.mode,
    defaultStatus: initialConfig.defaultStatus || 'Available',
    lowStockThreshold: initialConfig.lowStockThreshold || 3
  });

  // Centralized live connection state
  const [connectionStatus, setConnectionStatus] = useState(() => {
    if (initialConfig.mode === 'local') {
      return {
        state: 'local',
        mode: 'local',
        message: 'Local Storage Database Active'
      };
    }
    return {
      state: 'checking',
      mode: 'google',
      message: 'Connecting to Google Cloud...'
    };
  });

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [selectedStorage, setSelectedStorage] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Fetch Inventory and Purchases
  const fetchAllData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    const config = getStorageConfig();
    const currentMode = config.mode;
    setStorageMode(currentMode);

    if (currentMode === 'local') {
      setConnectionStatus({
        state: 'local',
        mode: 'local',
        message: 'Local Storage Database Active'
      });

      try {
        const [invRes, purRes] = await Promise.all([
          api.getInventory(),
          api.getPurchases()
        ]);

        const rawPurchases = purRes.success && Array.isArray(purRes.data) ? purRes.data : [];
        const rawInventory = invRes.success && Array.isArray(invRes.data) ? invRes.data : [];
        const reconciled = reconcileInventoryWithPurchases(rawInventory, rawPurchases);

        setPurchases(rawPurchases);
        setInventory(reconciled);
      } catch (err) {
        showError(err.message || 'Error communicating with local database.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
      return;
    }

    // Google Cloud mode
    if (!isSilent) {
      setConnectionStatus({
        state: 'checking',
        mode: 'google',
        message: 'Connecting to Google Cloud...'
      });
    }

    try {
      const [invRes, purRes] = await Promise.all([
        api.getInventory(),
        api.getPurchases()
      ]);

      const rawPurchases = purRes.success && Array.isArray(purRes.data) ? purRes.data : [];
      const rawInventory = Array.isArray(invRes.data) ? invRes.data : [];
      const reconciled = reconcileInventoryWithPurchases(rawInventory, rawPurchases);

      setPurchases(rawPurchases);
      setInventory(reconciled);

      if (invRes.success) {
        setConnectionStatus({
          state: 'connected',
          mode: 'google',
          message: 'Google Sheets + Drive Database Active'
        });
      } else {
        const errMsg = invRes.error || 'Failed to connect to Google Sheets backend.';
        setConnectionStatus({
          state: 'failed',
          mode: 'google',
          message: 'Google Cloud Connection Failed',
          error: errMsg
        });
        if (invRes.data && Array.isArray(invRes.data)) {
          setInventory(invRes.data); // load cached data for resilience
        }
        if (!isSilent) {
          showError(errMsg, 'Google Cloud Error');
        }
      }
    } catch (err) {
      const errMsg = err.message || 'Error communicating with Google Cloud backend.';
      setConnectionStatus({
        state: 'failed',
        mode: 'google',
        message: 'Google Cloud Connection Failed',
        error: errMsg
      });
      if (!isSilent) {
        showError(errMsg, 'Google Cloud Error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showError]);

  // Save settings when modified
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => {
      const rawApiUrl = newSettings.apiUrl !== undefined ? newSettings.apiUrl.trim() : (prev.apiUrl || '').trim();
      const explicitMode = newSettings.storageMode || (rawApiUrl ? 'google' : 'local');

      const updated = {
        ...prev,
        ...newSettings,
        apiUrl: rawApiUrl,
        storageMode: explicitMode
      };

      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      setStorageMode(explicitMode);

      if (explicitMode === 'local') {
        setConnectionStatus({
          state: 'local',
          mode: 'local',
          message: 'Local Storage Database Active'
        });
      } else {
        setConnectionStatus({
          state: 'checking',
          mode: 'google',
          message: 'Connecting to Google Cloud...'
        });
      }

      return updated;
    });

    setTimeout(() => {
      fetchAllData(false);
    }, 50);
  }, [fetchAllData]);

  // Explicit helper to switch to local storage mode
  const switchToLocalStorage = useCallback(() => {
    updateSettings({
      apiUrl: '',
      storageMode: 'local'
    });
    showInfo('Switched to Local Storage Database Mode.');
  }, [updateSettings, showInfo]);

  // Explicit helper to test connection
  const testConnection = useCallback(async (customUrl = null) => {
    return await api.testConnection(customUrl);
  }, []);

  // Explicit helper to retry connection
  const retryConnection = useCallback(() => {
    return fetchAllData(false);
  }, [fetchAllData]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);


  // Add Item (General Inventory)
  const addInventoryItem = async (itemData) => {
    try {
      const result = await api.addInventory(itemData);
      if (result.success) {
        await fetchAllData(true);
        showSuccess(`Device ${result.inventory_id || ''} added successfully!`, 'Device Added');
        triggerCelebration({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
        return { success: true, data: result.data };
      }
      showError(result.error || 'Failed to add device.');
      return { success: false, error: result.error };
    } catch (err) {
      showError(err.message || 'Unable to save device.');
      return { success: false, error: err.message };
    }
  };

  // Add Purchase Transaction (Buyback)
  const addPurchaseTransaction = async (purchaseData) => {
    try {
      const result = await api.addPurchase(purchaseData);
      if (result.success) {
        await fetchAllData(true);
        showSuccess(
          `Buyback completed! Purchase ID: ${result.purchase_id} (Inventory ID: ${result.inventory_id})`,
          'Buyback Recorded'
        );
        triggerCelebration({ particleCount: 80, spread: 75, origin: { y: 0.65 } });
        return { success: true, purchase_id: result.purchase_id, inventory_id: result.inventory_id, data: result.data };
      }
      showError(result.error || 'Failed to record buyback transaction.');
      return { success: false, error: result.error };
    } catch (err) {
      showError(err.message || 'Unable to process buyback.');
      return { success: false, error: err.message };
    }
  };

  // Update Purchase Transaction
  const updatePurchaseTransaction = async (purchaseData) => {
    try {
      const result = await api.updatePurchase(purchaseData);
      if (result.success) {
        await fetchAllData(true);
        showSuccess(`Buyback record ${purchaseData.purchase_id} updated.`, 'Record Updated');
        return { success: true, data: result.data };
      }
      showError(result.error || 'Failed to update buyback record.');
      return { success: false, error: result.error };
    } catch (err) {
      showError(err.message || 'Unable to update buyback record.');
      return { success: false, error: err.message };
    }
  };

  // Trace IMEI
  const traceIMEI = async (imei) => {
    try {
      return await api.traceIMEI(imei);
    } catch (err) {
      showError(err.message || 'IMEI trace failed.');
      return { success: false, error: err.message };
    }
  };

  // Archive Purchase (Toggle Archive / Unarchive)
  const archivePurchase = async (purchaseId) => {
    try {
      const target = purchases.find(p => p.purchase_id === purchaseId);
      if (target && target.status === 'Archived') {
        const result = await api.updatePurchase({ purchase_id: purchaseId, status: 'Completed' });
        if (result.success) {
          await fetchAllData(true);
          showSuccess(`Purchase ${purchaseId} unarchived.`, 'Unarchived');
          return { success: true };
        }
        showError(result.error || 'Failed to unarchive purchase.');
        return { success: false };
      }

      const result = await api.archivePurchase(purchaseId);
      if (result.success) {
        await fetchAllData(true);
        showSuccess(`Purchase ${purchaseId} archived.`, 'Archived');
        return { success: true };
      }
      showError(result.error || 'Failed to archive purchase.');
      return { success: false };
    } catch (err) {
      showError(err.message || 'Unable to archive purchase.');
      return { success: false };
    }
  };

  // Remove Customer Record / Purchase (Frontend & Local Only)
  const deletePurchase = async (purchaseId) => {
    try {
      const result = await api.deletePurchase(purchaseId);
      if (result.success) {
        setPurchases(prev => prev.filter(p => p.purchase_id !== purchaseId));
        setInventory(prev => prev.filter(inv => !inv.supplier || !inv.supplier.includes(purchaseId)));
        showSuccess(`Customer record ${purchaseId} removed from app.`, 'Record Removed');
        return { success: true };
      }
      showError(result.error || 'Failed to remove customer record.');
      return { success: false };
    } catch (err) {
      showError(err.message || 'Unable to remove customer record.');
      return { success: false };
    }
  };

  // Update Item
  const updateInventoryItem = async (itemData) => {
    try {
      const result = await api.updateInventory(itemData);
      if (result.success) {
        await fetchAllData(true);
        showSuccess(`Device ${itemData.inventory_id} updated successfully!`, 'Device Updated');
        return { success: true };
      }
      showError(result.error || 'Failed to update device.');
      return { success: false, error: result.error };
    } catch (err) {
      showError(err.message || 'Unable to update device.');
      return { success: false, error: err.message };
    }
  };

  // Mark as Sold
  const markAsSold = async (saleData) => {
    try {
      const result = await api.markAsSold(saleData);
      if (result.success) {
        await fetchAllData(true);
        showSuccess(`Phone ${saleData.inventory_id || ''} marked as sold successfully`, 'Sale Recorded');
        triggerCelebration({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        return { success: true };
      }
      showError(result.error || 'Failed to record sale.');
      return { success: false, error: result.error };
    } catch (err) {
      showError(err.message || 'Unable to process sale.');
      return { success: false, error: err.message };
    }
  };


  // Delete Item
  const deleteInventoryItem = async (inventoryId) => {
    try {
      const result = await api.deleteInventory(inventoryId);
      if (result.success) {
        try {
          const removedInvKey = 'phonevault_removed_inventory_v1';
          const removed = JSON.parse(localStorage.getItem(removedInvKey) || '[]');
          if (!removed.includes(inventoryId)) {
            removed.push(inventoryId);
            localStorage.setItem(removedInvKey, JSON.stringify(removed));
          }
        } catch (e) {}

        await fetchAllData(true);
        showSuccess(`Device ${inventoryId} removed from inventory.`, 'Deleted');
        return { success: true };
      }
      showError(result.error || 'Failed to delete device.');
      return { success: false, error: result.error };
    } catch (err) {
      showError(err.message || 'Unable to delete device.');
      return { success: false, error: err.message };
    }
  };

  // Upload Device Photo
  const uploadDevicePhoto = async (uploadData) => {
    try {
      const result = await api.uploadPhoto(uploadData);
      if (result.success) {
        if (uploadData && uploadData.inventory_id && uploadData.inventory_id !== 'UNASSIGNED' && uploadData.inventory_id !== 'new') {
          await fetchAllData(true);
        }
        return result;
      }
      showError(result.error || 'Photo upload failed.');
      return { success: false, error: result.error };
    } catch (err) {
      showError(err.message || 'Unable to upload photo.');
      return { success: false, error: err.message };
    }
  };

  // Reset to initial sample data
  const resetToSampleData = () => {
    localStorage.removeItem('phonevault_removed_inventory_v1');
    localStorage.removeItem('phonevault_removed_purchases_v1');
    const data = api.resetSampleData();
    const reconciled = reconcileInventoryWithPurchases(data.inventory, data.purchases);
    setInventory(reconciled);
    setPurchases(data.purchases);
    showSuccess('Sample inventory and buyback records restored.');
  };

  // Computed / Filtered Inventory List
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          (item.inventory_id && item.inventory_id.toLowerCase().includes(q)) ||
          (item.brand && item.brand.toLowerCase().includes(q)) ||
          (item.model && item.model.toLowerCase().includes(q)) ||
          (item.imei_1 && String(item.imei_1).toLowerCase().includes(q)) ||
          (item.imei_2 && String(item.imei_2).toLowerCase().includes(q)) ||
          (item.serial_number && String(item.serial_number).toLowerCase().includes(q)) ||
          (item.supplier && item.supplier.toLowerCase().includes(q)) ||
          (item.customer && item.customer.toLowerCase().includes(q)) ||
          (item.color && item.color.toLowerCase().includes(q));

        if (!matches) return false;
      }

      if (selectedBrand !== 'All' && item.brand !== selectedBrand) return false;
      if (selectedStatus !== 'All' && item.status !== selectedStatus) return false;
      if (selectedCondition !== 'All' && item.condition !== selectedCondition) return false;
      if (selectedStorage !== 'All' && item.storage !== selectedStorage) return false;

      if (dateRange.start && item.purchase_date && item.purchase_date < dateRange.start) return false;
      if (dateRange.end && item.purchase_date && item.purchase_date > dateRange.end) return false;

      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at || b.purchase_date || 0) - new Date(a.created_at || a.purchase_date || 0);
        case 'oldest':
          return new Date(a.created_at || a.purchase_date || 0) - new Date(b.created_at || b.purchase_date || 0);
        case 'price_low':
          return (Number(a.selling_price) || 0) - (Number(b.selling_price) || 0);
        case 'price_high':
          return (Number(b.selling_price) || 0) - (Number(a.selling_price) || 0);
        case 'profit_high':
          return ((Number(b.selling_price) || 0) - (Number(b.purchase_price) || 0)) -
                 ((Number(a.selling_price) || 0) - (Number(a.purchase_price) || 0));
        case 'battery_high':
          return (Number(b.battery_health) || 0) - (Number(a.battery_health) || 0);
        default:
          return 0;
      }
    });
  }, [inventory, searchQuery, selectedBrand, selectedStatus, selectedCondition, selectedStorage, sortBy, dateRange]);

  // Sold items subset
  const soldItems = useMemo(() => {
    return inventory.filter(item => item.status === 'Sold').sort((a, b) => {
      return new Date(b.selling_date || b.updated_at || 0) - new Date(a.selling_date || a.updated_at || 0);
    });
  }, [inventory]);

  // Real-time Aggregated Statistics
  const statistics = useMemo(() => {
    let totalStock = inventory.length;
    let available = 0;
    let reserved = 0;
    let sold = 0;
    let underRepair = 0;

    let totalPurchaseValue = 0;
    let totalSellingValue = 0;
    let potentialProfit = 0;
    let realizedProfit = 0;

    const brandCounts = {};
    const statusCounts = { Available: 0, Reserved: 0, Sold: 0, 'Under Repair': 0 };

    inventory.forEach(item => {
      const status = item.status || 'Available';
      const p = Number(item.purchase_price) || 0;
      const s = Number(item.selling_price) || 0;

      if (status === 'Available') {
        available++;
        totalPurchaseValue += p;
        totalSellingValue += s;
        potentialProfit += (s - p);
      } else if (status === 'Reserved') {
        reserved++;
        totalPurchaseValue += p;
        totalSellingValue += s;
        potentialProfit += (s - p);
      } else if (status === 'Sold') {
        sold++;
        realizedProfit += (s - p);
      } else if (status === 'Under Repair') {
        underRepair++;
        totalPurchaseValue += p;
      }

      const brand = item.brand || 'Other';
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;

      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      }
    });

    return {
      totalStock,
      available,
      reserved,
      sold,
      underRepair,
      totalPurchaseValue,
      totalSellingValue,
      potentialProfit,
      realizedProfit,
      brandCounts,
      statusCounts,
      totalBuybacks: purchases.length
    };
  }, [inventory, purchases]);

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        purchases,
        filteredInventory,
        soldItems,
        statistics,
        loading,
        refreshing,
        storageMode,
        connectionMode: storageMode,
        connectionStatus,
        settings,
        updateSettings,
        switchToLocalStorage,
        testConnection,
        retryConnection,
        searchQuery,
        setSearchQuery,
        selectedBrand,
        setSelectedBrand,
        selectedStatus,
        setSelectedStatus,
        selectedCondition,
        setSelectedCondition,
        selectedStorage,
        setSelectedStorage,
        sortBy,
        setSortBy,
        dateRange,
        setDateRange,
        fetchInventory: fetchAllData,
        addInventoryItem,
        addPurchaseTransaction,
        updatePurchaseTransaction,
        uploadDevicePhoto,
        traceIMEI,
        archivePurchase,
        deletePurchase,
        updateInventoryItem,
        markAsSold,
        deleteInventoryItem,
        resetToSampleData
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => useContext(InventoryContext);
