/**
 * ====================================================================
 * RATHORE MOBILES / PHONEVAULT PRO - GOOGLE APPS SCRIPT BACKEND API
 * ====================================================================
 * Production-ready serverless backend for Mobile Phone Inventory & Buyback System.
 * Connects directly to Google Sheets database and Google Drive storage.
 *
 * CONFIGURATION:
 * Spreadsheet Name: Mobile inventory database
 * Spreadsheet ID:   1uGLCOlWm6CZ6fRl5_SZahKw1-eL37Yvg2RY1dcaa4Yw
 * Sheet Name:       Inventory
 * Purchases Sheet:  Purchases
 *
 * HOW TO DEPLOY / UPDATE:
 * 1. Open your Apps Script editor (https://script.google.com).
 * 2. Replace all code in Code.gs with this file.
 * 3. Click 'Deploy' > 'Manage deployments' > Click Edit (pencil icon) > Select 'New version' > Click 'Deploy'.
 * 4. Paste the Web App URL into Settings > Google Apps Script Web App Deployment URL and click 'Test Connection'.
 * ====================================================================
 */

// Global Configuration
const CONFIG = {
  SPREADSHEET_ID: '1uGLCOlWm6CZ6fRl5_SZahKw1-eL37Yvg2RY1dcaa4Yw',
  SPREADSHEET_NAME: 'Mobile inventory database',
  SHEET_NAME: 'Inventory',
  PURCHASES_SHEET_NAME: 'Purchases',
  SOLD_SHEET_NAME: 'Sales_Archive',
  DRIVE_FOLDER_ID: '1gZZYxiI671_bsfm4d2bQg3JD-ZusROWF',
  DRIVE_ROOT_FOLDER: 'Rathore Mobiles',
  DRIVE_IMAGES_SUBFOLDER: 'Inventory Photos',
  DRIVE_PURCHASES_SUBFOLDER: 'Purchase Records',
  ID_PREFIX: 'INV-',
  PURCHASE_ID_PREFIX: 'PUR-',
  ID_PADDING: 4
};

// Inventory Sheet Columns (26 Columns)
const COLUMNS = [
  'inventory_id',    // 0
  'brand',           // 1
  'model',           // 2
  'variant',         // 3
  'color',           // 4
  'storage',         // 5
  'ram',             // 6
  'imei_1',          // 7
  'imei_2',          // 8
  'serial_number',   // 9
  'battery_health',  // 10
  'condition',       // 11
  'purchase_price',  // 12
  'selling_price',   // 13
  'profit',          // 14
  'purchase_date',   // 15
  'selling_date',    // 16
  'supplier',        // 17
  'customer',        // 18
  'status',          // 19
  'accessories',     // 20
  'warranty',        // 21
  'notes',           // 22
  'photo_urls',      // 23
  'created_at',      // 24
  'updated_at'       // 25
];

// Purchases Sheet Columns (28 Columns)
const PURCHASE_COLUMNS = [
  'purchase_id',            // 0
  'inventory_id',           // 1
  'seller_name',            // 2
  'seller_phone',           // 3
  'seller_address',         // 4
  'id_type',                // 5
  'id_number_ref',          // 6
  'id_verification_status', // 7
  'seller_photo_url',       // 8
  'document_photo_url',     // 9
  'brand',                  // 10
  'model',                  // 11
  'variant',                // 12
  'color',                  // 13
  'storage',                // 14
  'ram',                    // 15
  'imei_1',                 // 16
  'imei_2',                 // 17
  'serial_number',          // 18
  'condition',              // 19
  'purchase_price',         // 20
  'payment_method',         // 21
  'purchase_date',          // 22
  'purchase_time',          // 23
  'seller_declaration',     // 24
  'notes',                  // 25
  'operator_name',          // 26
  'status',                 // 27
  'created_at',             // 28
  'updated_at'              // 29
];

/**
 * Handles HTTP GET requests
 */
function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    const action = params.action || 'list';

    // 1. Connection Health Check
    if (action === 'testConnection' || action === 'ping') {
      try {
        const ss = getSpreadsheet();
        if (!ss) {
          return jsonResponse({
            success: false,
            error: 'Unable to open spreadsheet with ID: ' + CONFIG.SPREADSHEET_ID + '. Please verify Google Drive / Sheet permissions.'
          });
        }
        
        let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
        if (!sheet) {
          // Auto create if not exists
          sheet = ss.insertSheet(CONFIG.SHEET_NAME);
          sheet.appendRow(COLUMNS);
        }

        const lastRow = sheet.getLastRow();
        return jsonResponse({
          success: true,
          message: 'Google Sheets connection successful',
          spreadsheetId: ss.getId(),
          spreadsheetName: ss.getName(),
          sheetName: sheet.getName(),
          totalRows: lastRow
        });
      } catch (connErr) {
        return jsonResponse({
          success: false,
          error: connErr.toString()
        });
      }
    }

    // 2. List Inventory
    if (action === 'list' || action === 'getInventory') {
      return jsonResponse(fetchInventoryRecords(params));
    }

    // 3. Stats
    if (action === 'stats' || action === 'getStats') {
      return jsonResponse(getInventoryStats());
    }

    // 4. Purchases
    if (action === 'getPurchases' || action === 'purchases') {
      return jsonResponse(fetchPurchaseRecords(params));
    }

    // 5. IMEI Trace
    if (action === 'traceIMEI') {
      return jsonResponse(traceIMEIAudit(params.imei));
    }

    return jsonResponse({
      success: false,
      error: 'Invalid action specified: ' + action
    }, 400);

  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.toString(),
      stack: err.stack
    }, 500);
  }
}

/**
 * Handles HTTP POST requests
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action || (e && e.parameter && e.parameter.action) || 'add';

    if (action === 'setup') {
      return jsonResponse(setupDatabaseAndDrive());
    }

    if (action === 'add' || action === 'addInventory') {
      return jsonResponse(createInventoryItem(payload.data || payload));
    }

    if (action === 'update' || action === 'updateInventory') {
      return jsonResponse(updateInventoryItem(payload.data || payload));
    }

    if (action === 'delete' || action === 'deleteInventory') {
      return jsonResponse(deleteInventoryItem(payload.inventory_id || (payload.data && payload.data.inventory_id)));
    }

    if (action === 'markSold' || action === 'markAsSold') {
      return jsonResponse(markItemAsSold(payload.data || payload));
    }

    if (action === 'uploadPhoto' || action === 'uploadImages' || action === 'uploadImage') {
      return jsonResponse(handlePhotoUpload(payload.data || payload));
    }

    if (action === 'addPurchase') {
      return jsonResponse(createPurchaseTransaction(payload.data || payload));
    }

    if (action === 'archivePurchase') {
      return jsonResponse(archivePurchaseRecord(payload.purchase_id || (payload.data && payload.data.purchase_id)));
    }

    return jsonResponse({
      success: false,
      error: 'Invalid POST action: ' + action
    }, 400);

  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.toString(),
      stack: err.stack
    }, 500);
  }
}

/**
 * Helper to produce standard JSON output with CORS support
 */
function jsonResponse(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Gets or opens the configured Spreadsheet
 */
function getSpreadsheet() {
  let ss = null;

  // 1. Try configured ID
  if (CONFIG.SPREADSHEET_ID) {
    try {
      ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    } catch (e) {
      ss = null;
    }
  }

  // 2. Try User Properties ID if previously stored
  if (!ss) {
    const userProps = PropertiesService.getUserProperties();
    const ssId = userProps.getProperty('SPREADSHEET_ID');
    if (ssId) {
      try {
        ss = SpreadsheetApp.openById(ssId);
      } catch (e) {
        ss = null;
      }
    }
  }

  // 3. Try Active Spreadsheet (if script is bound to a Sheet)
  if (!ss) {
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch (e) {
      ss = null;
    }
  }

  // 4. Fallback: Create
  if (!ss) {
    ss = SpreadsheetApp.create(CONFIG.SPREADSHEET_NAME);
    PropertiesService.getUserProperties().setProperty('SPREADSHEET_ID', ss.getId());
  }

  return ss;
}

/**
 * Gets or initializes the Inventory Sheet
 */
function getInventorySheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.appendRow(COLUMNS);
    const headerRange = sheet.getRange(1, 1, 1, COLUMNS.length);
    headerRange.setBackground('#4F46E5')
               .setFontColor('#FFFFFF')
               .setFontWeight('bold')
               .setFontFamily('Arial');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, COLUMNS.length);
  }

  return sheet;
}

/**
 * Gets or initializes the Purchases Sheet
 */
function getPurchasesSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.PURCHASES_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.PURCHASES_SHEET_NAME);
    sheet.appendRow(PURCHASE_COLUMNS);
    const headerRange = sheet.getRange(1, 1, 1, PURCHASE_COLUMNS.length);
    headerRange.setBackground('#059669')
               .setFontColor('#FFFFFF')
               .setFontWeight('bold')
               .setFontFamily('Arial');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, PURCHASE_COLUMNS.length);
  }

  return sheet;
}

/**
 * Auto-creates or retrieves Google Drive folders
 */
function getDriveRootFolder() {
  if (CONFIG.DRIVE_FOLDER_ID && CONFIG.DRIVE_FOLDER_ID.trim()) {
    try {
      const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID.trim());
      if (folder) return folder;
    } catch (e) {
      console.warn('Could not open folder by DRIVE_FOLDER_ID: ' + CONFIG.DRIVE_FOLDER_ID, e);
    }
  }
  try {
    const rootFolders = DriveApp.getFoldersByName(CONFIG.DRIVE_ROOT_FOLDER);
    if (rootFolders.hasNext()) {
      return rootFolders.next();
    }
    return DriveApp.createFolder(CONFIG.DRIVE_ROOT_FOLDER);
  } catch (err) {
    console.warn('Fallback to Drive root folder:', err);
    return DriveApp.getRootFolder();
  }
}

function getDriveImageFolder(inventoryId) {
  const rootFolder = getDriveRootFolder();
  let imageFolder;

  try {
    if (rootFolder.getName() === CONFIG.DRIVE_IMAGES_SUBFOLDER) {
      imageFolder = rootFolder;
    } else {
      const imageFolders = rootFolder.getFoldersByName(CONFIG.DRIVE_IMAGES_SUBFOLDER);
      if (imageFolders.hasNext()) {
        imageFolder = imageFolders.next();
      } else {
        imageFolder = rootFolder.createFolder(CONFIG.DRIVE_IMAGES_SUBFOLDER);
      }
    }

    if (inventoryId) {
      const itemFolders = imageFolder.getFoldersByName(inventoryId);
      if (itemFolders.hasNext()) {
        return itemFolders.next();
      } else {
        return imageFolder.createFolder(inventoryId);
      }
    }
  } catch (err) {
    console.warn('Error creating subfolder, using root:', err);
    return rootFolder;
  }

  return imageFolder;
}

function getDrivePurchaseFolder(purchaseId) {
  const rootFolder = getDriveRootFolder();
  let purchaseFolder;

  try {
    const purchaseFolders = rootFolder.getFoldersByName(CONFIG.DRIVE_PURCHASES_SUBFOLDER);
    if (purchaseFolders.hasNext()) {
      purchaseFolder = purchaseFolders.next();
    } else {
      purchaseFolder = rootFolder.createFolder(CONFIG.DRIVE_PURCHASES_SUBFOLDER);
    }

    if (purchaseId) {
      const itemFolders = purchaseFolder.getFoldersByName(purchaseId);
      if (itemFolders.hasNext()) {
        return itemFolders.next();
      } else {
        return purchaseFolder.createFolder(purchaseId);
      }
    }
  } catch (err) {
    console.warn('Error creating purchase folder, using root:', err);
    return rootFolder;
  }

  return purchaseFolder;
}

/**
 * Setup function: initializes sheets, headers & Drive storage
 */
function setupDatabaseAndDrive() {
  const ss = getSpreadsheet();
  const inventorySheet = getInventorySheet();
  const purchasesSheet = getPurchasesSheet();
  const driveImageFolder = getDriveImageFolder();
  const drivePurchaseFolder = getDrivePurchaseFolder();

  return {
    success: true,
    message: 'Google Sheets Database & Google Drive folders successfully initialized.',
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    imageFolderUrl: driveImageFolder.getUrl(),
    purchaseFolderUrl: drivePurchaseFolder.getUrl()
  };
}

/**
 * Run this function ONCE in Google Apps Script editor (Select function > click 'Run')
 * to authorize Google Drive & Sheets permissions for your account.
 */
function authorizeAndSetupDrive() {
  Logger.log('Starting Google Drive & Sheets authorization check...');
  const res = setupDatabaseAndDrive();
  Logger.log('Success! Result: ' + JSON.stringify(res));
  return res;
}

/**
 * Fetch all inventory items
 */
function fetchInventoryRecords(params) {
  const sheet = getInventorySheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    return { success: true, data: [], total: 0 };
  }

  const values = sheet.getRange(2, 1, lastRow - 1, COLUMNS.length).getValues();
  const records = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    if (!row[0]) continue;

    let photoUrls = [];
    if (row[23]) {
      try {
        const raw = typeof row[23] === 'string' && row[23].startsWith('[') ? JSON.parse(row[23]) : [String(row[23])];
        if (Array.isArray(raw)) {
          photoUrls = raw.filter(u => u && typeof u === 'string' && !u.includes('[Ljava.lang.Object') && (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:image/')));
        }
      } catch (e) {
        const strVal = String(row[23]);
        if (strVal && (strVal.startsWith('http://') || strVal.startsWith('https://') || strVal.startsWith('data:image/')) && !strVal.includes('[Ljava.lang.Object')) {
          photoUrls = [strVal];
        }
      }
    }

    records.push({
      inventory_id: String(row[0]),
      brand: String(row[1] || ''),
      model: String(row[2] || ''),
      variant: String(row[3] || ''),
      color: String(row[4] || ''),
      storage: String(row[5] || ''),
      ram: String(row[6] || ''),
      imei_1: String(row[7] || ''),
      imei_2: String(row[8] || ''),
      serial_number: String(row[9] || ''),
      battery_health: row[10] !== '' && row[10] !== null ? Number(row[10]) : null,
      condition: String(row[11] || 'Like New'),
      purchase_price: Number(row[12]) || 0,
      selling_price: Number(row[13]) || 0,
      profit: Number(row[14]) || (Number(row[13]) - Number(row[12])),
      purchase_date: row[15] ? formatDate(row[15]) : '',
      selling_date: row[16] ? formatDate(row[16]) : '',
      supplier: String(row[17] || ''),
      customer: String(row[18] || ''),
      status: String(row[19] || 'Available'),
      accessories: String(row[20] || ''),
      warranty: String(row[21] || ''),
      notes: String(row[22] || ''),
      photo_urls: photoUrls,
      created_at: row[24] ? formatDate(row[24]) : '',
      updated_at: row[25] ? formatDate(row[25]) : ''
    });
  }

  return { success: true, data: records, total: records.length };
}

/**
 * Fetch all purchase records
 */
function fetchPurchaseRecords(params) {
  const sheet = getPurchasesSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return { success: true, data: [], total: 0 };
  }

  const values = sheet.getRange(2, 1, lastRow - 1, PURCHASE_COLUMNS.length).getValues();
  const records = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    if (!row[0]) continue;

    records.push({
      purchase_id: String(row[0]),
      inventory_id: String(row[1] || ''),
      seller_name: String(row[2] || ''),
      seller_phone: String(row[3] || ''),
      seller_address: String(row[4] || ''),
      id_type: String(row[5] || ''),
      id_number_ref: String(row[6] || ''),
      id_verification_status: String(row[7] || 'Verified'),
      seller_photo_url: String(row[8] || ''),
      document_photo_url: String(row[9] || ''),
      brand: String(row[10] || ''),
      model: String(row[11] || ''),
      variant: String(row[12] || ''),
      color: String(row[13] || ''),
      storage: String(row[14] || ''),
      ram: String(row[15] || ''),
      imei_1: String(row[16] || ''),
      imei_2: String(row[17] || ''),
      serial_number: String(row[18] || ''),
      condition: String(row[19] || 'Like New'),
      purchase_price: Number(row[20]) || 0,
      payment_method: String(row[21] || 'Cash'),
      purchase_date: row[22] ? formatDate(row[22]) : '',
      purchase_time: String(row[23] || ''),
      seller_declaration: Boolean(row[24]),
      notes: String(row[25] || ''),
      operator_name: String(row[26] || 'Store Manager'),
      status: String(row[27] || 'Completed'),
      created_at: row[28] ? formatDate(row[28]) : '',
      updated_at: row[29] ? formatDate(row[29]) : ''
    });
  }

  return { success: true, data: records, total: records.length };
}

/**
 * Generate Next Sequential IDs
 */
function generateNextId(sheet, prefix) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return prefix + '0001';
  }

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let maxNum = 0;

  for (let i = 0; i < ids.length; i++) {
    const id = String(ids[i][0]);
    if (id.startsWith(prefix)) {
      const numPart = parseInt(id.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }

  const nextNum = maxNum + 1;
  const padded = ('00000' + nextNum).slice(-CONFIG.ID_PADDING);
  return prefix + padded;
}

/**
 * Check if IMEI exists
 */
function checkDuplicateIMEI(sheet, imei1, imei2, excludeId) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return null;

  const data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
  const cleanImei1 = String(imei1 || '').trim();
  const cleanImei2 = String(imei2 || '').trim();

  for (let i = 0; i < data.length; i++) {
    const existingId = String(data[i][0]);
    if (excludeId && existingId === excludeId) continue;

    const rowImei1 = String(data[i][7] || '').trim();
    const rowImei2 = String(data[i][8] || '').trim();

    if (cleanImei1 && (cleanImei1 === rowImei1 || cleanImei1 === rowImei2)) {
      return { duplicate: true, field: 'IMEI 1', existingId: existingId };
    }
    if (cleanImei2 && (cleanImei2 === rowImei1 || cleanImei2 === rowImei2)) {
      return { duplicate: true, field: 'IMEI 2', existingId: existingId };
    }
  }

  return null;
}

/**
 * Create new Inventory Item
 */
function createInventoryItem(data) {
  const sheet = getInventorySheet();

  if (!data.brand || !data.model) {
    return { success: false, error: 'Brand and Model are required.' };
  }

  if (data.imei_1 || data.imei_2) {
    const dup = checkDuplicateIMEI(sheet, data.imei_1, data.imei_2);
    if (dup) {
      return {
        success: false,
        error: dup.field + ' already exists in inventory (Item: ' + dup.existingId + ').'
      };
    }
  }

  const inventoryId = generateNextId(sheet, CONFIG.ID_PREFIX);
  const now = new Date().toISOString();

  const purchasePrice = Number(data.purchase_price) || 0;
  const sellingPrice = Number(data.selling_price) || 0;
  const profit = sellingPrice - purchasePrice;

  // Process photo URLs: convert any base64 data to Google Drive files
  let rawPhotoUrls = data.photo_urls || [];
  if (typeof rawPhotoUrls === 'string') {
    try { rawPhotoUrls = JSON.parse(rawPhotoUrls); } catch(e) { rawPhotoUrls = [rawPhotoUrls]; }
  }
  if (!Array.isArray(rawPhotoUrls)) rawPhotoUrls = [rawPhotoUrls];

  if (data.images_base64 && Array.isArray(data.images_base64)) {
    rawPhotoUrls = rawPhotoUrls.concat(data.images_base64);
  }

  const processedPhotoUrls = [];
  for (let p = 0; p < rawPhotoUrls.length; p++) {
    const item = rawPhotoUrls[p];
    if (!item) continue;
    if (typeof item === 'string' && (item.startsWith('data:image/') || item.length > 500)) {
      try {
        const uploadRes = handlePhotoUpload({
          inventory_id: inventoryId,
          base64_data: item,
          file_name: inventoryId + '_photo_' + (p + 1) + '_' + Date.now() + '.jpg'
        });
        if (uploadRes.success && uploadRes.file_url) {
          processedPhotoUrls.push(uploadRes.file_url);
        }
      } catch (uploadErr) {
        console.warn('Failed to upload inline photo to Drive', uploadErr);
      }
    } else if (typeof item === 'string' && (item.startsWith('http://') || item.startsWith('https://')) && !item.includes('[Ljava.lang.Object')) {
      processedPhotoUrls.push(item);
    }
  }

  const newRow = [
    inventoryId,
    data.brand || '',
    data.model || '',
    data.variant || '',
    data.color || '',
    data.storage || '',
    data.ram || '',
    data.imei_1 || '',
    data.imei_2 || '',
    data.serial_number || '',
    data.battery_health !== undefined && data.battery_health !== null ? data.battery_health : '',
    data.condition || 'Brand New',
    purchasePrice,
    sellingPrice,
    profit,
    data.purchase_date || now.split('T')[0],
    data.selling_date || '',
    data.supplier || '',
    data.customer || '',
    data.status || 'Available',
    data.accessories || '',
    data.warranty || '',
    data.notes || '',
    JSON.stringify(processedPhotoUrls),
    now,
    now
  ];

  sheet.appendRow(newRow);

  return {
    success: true,
    message: 'Device added to inventory successfully.',
    inventory_id: inventoryId,
    data: Object.assign({}, data, {
      inventory_id: inventoryId,
      photo_urls: processedPhotoUrls,
      profit: profit,
      created_at: now,
      updated_at: now
    })
  };
}

/**
 * Update existing Inventory Item
 */
function updateInventoryItem(data) {
  if (!data.inventory_id) {
    return { success: false, error: 'inventory_id is required for update.' };
  }

  const sheet = getInventorySheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { success: false, error: 'Inventory is empty.' };
  }

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let targetRowIndex = -1;

  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(data.inventory_id)) {
      targetRowIndex = i + 2;
      break;
    }
  }

  if (targetRowIndex === -1) {
    return { success: false, error: 'Item with ID ' + data.inventory_id + ' not found.' };
  }

  if (data.imei_1 || data.imei_2) {
    const dup = checkDuplicateIMEI(sheet, data.imei_1, data.imei_2, data.inventory_id);
    if (dup) {
      return {
        success: false,
        error: dup.field + ' already exists in another device (Item: ' + dup.existingId + ').'
      };
    }
  }

  const existingRow = sheet.getRange(targetRowIndex, 1, 1, COLUMNS.length).getValues()[0];
  const now = new Date().toISOString();

  const purchasePrice = data.purchase_price !== undefined ? Number(data.purchase_price) : Number(existingRow[12]);
  const sellingPrice = data.selling_price !== undefined ? Number(data.selling_price) : Number(existingRow[13]);
  const profit = sellingPrice - purchasePrice;

  let photoUrls = existingRow[23];
  if (data.photo_urls !== undefined) {
    let rawPhotoUrls = data.photo_urls;
    if (typeof rawPhotoUrls === 'string') {
      try { rawPhotoUrls = JSON.parse(rawPhotoUrls); } catch(e) { rawPhotoUrls = [rawPhotoUrls]; }
    }
    if (!Array.isArray(rawPhotoUrls)) rawPhotoUrls = [rawPhotoUrls];

    const processedPhotoUrls = [];
    for (let p = 0; p < rawPhotoUrls.length; p++) {
      const item = rawPhotoUrls[p];
      if (!item) continue;
      if (typeof item === 'string' && (item.startsWith('data:image/') || item.length > 500)) {
        try {
          const uploadRes = handlePhotoUpload({
            inventory_id: data.inventory_id,
            base64_data: item,
            file_name: data.inventory_id + '_photo_' + (p + 1) + '_' + Date.now() + '.jpg'
          });
          if (uploadRes.success && uploadRes.file_url) {
            processedPhotoUrls.push(uploadRes.file_url);
          }
        } catch (uploadErr) {
          console.warn('Failed to upload inline photo during update', uploadErr);
        }
      } else if (typeof item === 'string' && (item.startsWith('http://') || item.startsWith('https://')) && !item.includes('[Ljava.lang.Object')) {
        processedPhotoUrls.push(item);
      }
    }
    photoUrls = JSON.stringify(processedPhotoUrls);
  }

  const updatedRow = [
    data.inventory_id,
    data.brand !== undefined ? data.brand : existingRow[1],
    data.model !== undefined ? data.model : existingRow[2],
    data.variant !== undefined ? data.variant : existingRow[3],
    data.color !== undefined ? data.color : existingRow[4],
    data.storage !== undefined ? data.storage : existingRow[5],
    data.ram !== undefined ? data.ram : existingRow[6],
    data.imei_1 !== undefined ? data.imei_1 : existingRow[7],
    data.imei_2 !== undefined ? data.imei_2 : existingRow[8],
    data.serial_number !== undefined ? data.serial_number : existingRow[9],
    data.battery_health !== undefined ? data.battery_health : existingRow[10],
    data.condition !== undefined ? data.condition : existingRow[11],
    purchasePrice,
    sellingPrice,
    profit,
    data.purchase_date !== undefined ? data.purchase_date : existingRow[15],
    data.selling_date !== undefined ? data.selling_date : existingRow[16],
    data.supplier !== undefined ? data.supplier : existingRow[17],
    data.customer !== undefined ? data.customer : existingRow[18],
    data.status !== undefined ? data.status : existingRow[19],
    data.accessories !== undefined ? data.accessories : existingRow[20],
    data.warranty !== undefined ? data.warranty : existingRow[21],
    data.notes !== undefined ? data.notes : existingRow[22],
    photoUrls,
    existingRow[24],
    now
  ];

  sheet.getRange(targetRowIndex, 1, 1, COLUMNS.length).setValues([updatedRow]);

  return {
    success: true,
    message: 'Device ' + data.inventory_id + ' updated successfully.'
  };
}

/**
 * Mark Item as Sold
 */
function markItemAsSold(data) {
  if (!data || !data.inventory_id) {
    return { success: false, error: 'inventory_id is required.' };
  }

  const sellingDate = data.selling_date || new Date().toISOString().split('T')[0];
  const updateData = Object.assign({}, data, {
    inventory_id: data.inventory_id,
    status: 'Sold',
    selling_date: sellingDate,
    customer: data.customer || 'Direct Customer',
    selling_price: data.selling_price !== undefined ? Number(data.selling_price) : data.selling_price
  });

  return updateInventoryItem(updateData);
}

/**
 * Delete Item
 */
function deleteInventoryItem(inventoryId) {
  if (!inventoryId) {
    return { success: false, error: 'inventory_id is required.' };
  }

  const sheet = getInventorySheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { success: false, error: 'Inventory is empty.' };
  }

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(inventoryId)) {
      sheet.deleteRow(i + 2);
      return {
        success: true,
        message: 'Device ' + inventoryId + ' deleted from inventory.'
      };
    }
  }

  return { success: false, error: 'Item ' + inventoryId + ' not found.' };
}

/**
 * Create Purchase Transaction (Buyback)
 */
function createPurchaseTransaction(data) {
  const purchasesSheet = getPurchasesSheet();
  const inventorySheet = getInventorySheet();

  if (!data.seller_name || !data.brand || !data.model) {
    return { success: false, error: 'Seller Name, Brand, and Model are required.' };
  }

  if (data.imei_1 || data.imei_2) {
    const dup = checkDuplicateIMEI(inventorySheet, data.imei_1, data.imei_2);
    if (dup) {
      return {
        success: false,
        error: dup.field + ' already exists in inventory (Device: ' + dup.existingId + '). Verify records.'
      };
    }
  }

  const purchaseId = generateNextId(purchasesSheet, CONFIG.PURCHASE_ID_PREFIX);
  const inventoryId = generateNextId(inventorySheet, CONFIG.ID_PREFIX);
  const now = new Date();
  const nowISO = now.toISOString();
  const purchaseDate = data.purchase_date || nowISO.split('T')[0];
  const purchaseTime = data.purchase_time || now.toTimeString().substring(0, 5);

  const purchasePrice = Number(data.purchase_price) || 0;
  const targetSellingPrice = Number(data.target_selling_price || data.selling_price) || Math.round(purchasePrice * 1.15);

  let sellerPhotoUrl = data.seller_photo_url || '';
  let documentPhotoUrl = data.document_photo_url || '';

  // 1. Process KYC Photos and Upload to Google Drive (Purchase Records folder)
  const sellerBase64 = data.seller_photo_base64 || (typeof sellerPhotoUrl === 'string' && (sellerPhotoUrl.startsWith('data:image/') || sellerPhotoUrl.length > 500) ? sellerPhotoUrl : null);
  const docBase64 = data.document_photo_base64 || (typeof documentPhotoUrl === 'string' && (documentPhotoUrl.startsWith('data:image/') || documentPhotoUrl.length > 500) ? documentPhotoUrl : null);

  if (sellerBase64 || docBase64) {
    try {
      const driveFolder = getDrivePurchaseFolder(purchaseId);

      if (sellerBase64) {
        try {
          const file = uploadBase64File(driveFolder, sellerBase64, purchaseId + '_seller_photo.jpg', 'image/jpeg');
          sellerPhotoUrl = 'https://drive.google.com/uc?export=view&id=' + file.getId();
        } catch (e) {
          console.warn('Seller photo upload failed', e);
        }
      }

      if (docBase64) {
        try {
          const file = uploadBase64File(driveFolder, docBase64, purchaseId + '_id_document.jpg', 'image/jpeg');
          documentPhotoUrl = 'https://drive.google.com/uc?export=view&id=' + file.getId();
        } catch (e) {
          console.warn('Document photo upload failed', e);
        }
      }
    } catch (folderErr) {
      console.warn('Error opening/creating purchase drive folder:', folderErr);
    }
  }

  // 2. Process Buyback Device Photos and Upload to Google Drive
  let rawDevicePhotos = data.device_photos || data.photo_urls || [];
  if (typeof rawDevicePhotos === 'string') {
    try { rawDevicePhotos = JSON.parse(rawDevicePhotos); } catch(e) { rawDevicePhotos = [rawDevicePhotos]; }
  }
  if (!Array.isArray(rawDevicePhotos)) rawDevicePhotos = [rawDevicePhotos];

  const processedDevicePhotos = [];
  for (let dp = 0; dp < rawDevicePhotos.length; dp++) {
    const item = rawDevicePhotos[dp];
    if (!item) continue;
    if (typeof item === 'string' && (item.startsWith('data:image/') || item.length > 500)) {
      try {
        const uploadRes = handlePhotoUpload({
          inventory_id: inventoryId,
          base64_data: item,
          file_name: inventoryId + '_photo_' + (dp + 1) + '_' + Date.now() + '.jpg'
        });
        if (uploadRes.success && uploadRes.file_url) {
          processedDevicePhotos.push(uploadRes.file_url);
        }
      } catch (uploadErr) {
        console.warn('Failed to upload buyback device photo to Drive', uploadErr);
      }
    } else if (typeof item === 'string' && (item.startsWith('http://') || item.startsWith('https://')) && !item.includes('[Ljava.lang.Object')) {
      processedDevicePhotos.push(item);
    }
  }

  const purchaseRow = [
    purchaseId,
    inventoryId,
    data.seller_name || '',
    data.seller_phone || '',
    data.seller_address || '',
    data.id_type || "Driver's License",
    data.id_number_ref || '',
    data.id_verification_status || 'Verified',
    sellerPhotoUrl,
    documentPhotoUrl,
    data.brand || '',
    data.model || '',
    data.variant || '',
    data.color || '',
    data.storage || '',
    data.ram || '',
    data.imei_1 || '',
    data.imei_2 || '',
    data.serial_number || '',
    data.condition || 'Like New',
    purchasePrice,
    data.payment_method || 'Cash',
    purchaseDate,
    purchaseTime,
    data.seller_declaration !== undefined ? data.seller_declaration : true,
    data.notes || '',
    data.operator_name || 'Store Manager',
    'Completed',
    nowISO,
    nowISO
  ];
  purchasesSheet.appendRow(purchaseRow);

  const profit = targetSellingPrice - purchasePrice;
  const inventoryRow = [
    inventoryId,
    data.brand || '',
    data.model || '',
    data.variant || '',
    data.color || '',
    data.storage || '',
    data.ram || '',
    data.imei_1 || '',
    data.imei_2 || '',
    data.serial_number || '',
    data.battery_health !== undefined && data.battery_health !== null ? data.battery_health : 100,
    data.condition || 'Like New',
    purchasePrice,
    targetSellingPrice,
    profit,
    purchaseDate,
    '',
    'Buyback / ' + purchaseId,
    '',
    'Available',
    data.accessories || 'Handset only',
    data.warranty || 'Store Warranty',
    'Purchased from customer ' + (data.seller_name || '') + ' (Ref: ' + purchaseId + '). ' + (data.notes || ''),
    JSON.stringify(processedDevicePhotos),
    nowISO,
    nowISO
  ];
  inventorySheet.appendRow(inventoryRow);

  return {
    success: true,
    message: 'Buyback completed successfully. Purchase and Inventory records created.',
    purchase_id: purchaseId,
    inventory_id: inventoryId,
    data: {
      purchase_id: purchaseId,
      inventory_id: inventoryId,
      seller_name: data.seller_name,
      purchase_price: purchasePrice,
      selling_price: targetSellingPrice,
      seller_photo_url: sellerPhotoUrl,
      document_photo_url: documentPhotoUrl,
      purchase_date: purchaseDate,
      purchase_time: purchaseTime
    }
  };
}

/**
 * Handle Single or Multi Photo Upload
 * Saves photo to Google Drive: Rathore Mobiles / Inventory Photos / [inventory_id] / [filename]
 * Updates photo_urls column in Google Sheets if inventory_id exists.
 */
function handlePhotoUpload(data) {
  if (!data) {
    return { success: false, error: 'No upload payload provided.' };
  }

  const inventoryId = data.inventory_id ? String(data.inventory_id).trim() : 'UNASSIGNED';
  const base64Data = data.base64_data || data.base64 || data.image_base64 || (typeof data.file === 'string' ? data.file : '');
  
  if (!base64Data) {
    return { success: false, error: 'Please select an image. No base64 image data received.' };
  }

  // Determine MIME type & clean base64
  let mimeType = data.mime_type || data.mimeType || 'image/jpeg';
  let cleanBase64 = base64Data;
  if (cleanBase64.startsWith('data:')) {
    const parts = cleanBase64.split(',');
    const match = parts[0].match(/:(.*?);/);
    if (match && match[1]) {
      mimeType = match[1].toLowerCase();
    }
    cleanBase64 = parts[1] || '';
  }

  // Validate allowed image types
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
    return {
      success: false,
      error: 'Unsupported image format (' + mimeType + '). Only JPG, PNG, and WebP images are allowed.'
    };
  }

  // Validate base64 file size (< 10MB)
  if (cleanBase64.length > 14000000) {
    return {
      success: false,
      error: 'Image size is too large. Maximum allowed photo size is 10 MB.'
    };
  }

  let extension = '.jpg';
  if (mimeType === 'image/png') extension = '.png';
  else if (mimeType === 'image/webp') extension = '.webp';

  const defaultFileName = inventoryId + '_photo_' + Date.now() + extension;
  const fileName = data.file_name || data.fileName || defaultFileName;

  let targetFolder;
  try {
    targetFolder = getDriveImageFolder(inventoryId !== 'UNASSIGNED' ? inventoryId : null);
  } catch (driveErr) {
    return {
      success: false,
      error: 'Google Drive permission denied or Drive folder not configured: ' + driveErr.toString()
    };
  }

  let file;
  try {
    const decodedBlob = Utilities.newBlob(Utilities.base64Decode(cleanBase64), mimeType, fileName);
    file = targetFolder.createFile(decodedBlob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (sharingErr) {
      console.warn('Could not set public sharing on file:', sharingErr);
    }
  } catch (fileErr) {
    return {
      success: false,
      error: 'Photo upload failed while writing to Google Drive: ' + fileErr.toString()
    };
  }

  const fileId = file.getId();
  const fileUrl = 'https://drive.google.com/uc?export=view&id=' + fileId;
  const thumbnailUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1000';

  let updatedPhotoUrls = [fileUrl];

  // If valid inventory_id is provided, try to update matching row in Inventory sheet if it exists
  if (inventoryId && inventoryId !== 'UNASSIGNED' && inventoryId !== 'new') {
    try {
      const sheet = getInventorySheet();
      const lastRow = sheet.getLastRow();
      let targetRowIndex = -1;

      if (lastRow > 1) {
        const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < ids.length; i++) {
          if (String(ids[i][0]).trim() === inventoryId) {
            targetRowIndex = i + 2;
            break;
          }
        }
      }

      // If the row exists, append photo URL to the cell; if not yet appended (e.g. during new item creation), continue gracefully
      if (targetRowIndex !== -1) {
        const currentCell = sheet.getRange(targetRowIndex, 24).getValue();
        let currentList = [];
        if (currentCell) {
          try {
            const parsed = typeof currentCell === 'string' && currentCell.startsWith('[') ? JSON.parse(currentCell) : [String(currentCell)];
            if (Array.isArray(parsed)) {
              currentList = parsed.filter(u => u && typeof u === 'string' && !u.includes('[Ljava.lang.Object') && (u.startsWith('http://') || u.startsWith('https://')));
            }
          } catch (e) {
            const strVal = String(currentCell);
            if (strVal && (strVal.startsWith('http://') || strVal.startsWith('https://')) && !strVal.includes('[Ljava.lang.Object')) {
              currentList = [strVal];
            }
          }
        }

        if (!currentList.includes(fileUrl)) {
          currentList.push(fileUrl);
        }
        updatedPhotoUrls = currentList;

        sheet.getRange(targetRowIndex, 24).setValue(JSON.stringify(currentList));
        sheet.getRange(targetRowIndex, 26).setValue(new Date().toISOString());
      }

    } catch (sheetErr) {
      console.warn('Could not update inventory row with photo URL:', sheetErr);
    }
  }

  return {
    success: true,
    message: 'Photo uploaded successfully',
    file_id: fileId,
    file_url: fileUrl,
    thumbnail_url: thumbnailUrl,
    photo_urls: updatedPhotoUrls
  };
}

/**
 * Upload Base64 Images helper
 */
function uploadProductImages(inventoryId, imageList) {
  if (!imageList || !imageList.length) {
    return { success: true, urls: [] };
  }

  const targetFolder = getDriveImageFolder(inventoryId);
  const uploadedUrls = [];

  for (let i = 0; i < imageList.length; i++) {
    const item = imageList[i];
    let base64Data = '';
    let mimeType = 'image/jpeg';
    let fileName = (inventoryId || 'PHONE') + '_photo_' + (i + 1) + '_' + Date.now() + '.jpg';

    if (typeof item === 'string') {
      if (item.startsWith('data:')) {
        const parts = item.split(',');
        mimeType = parts[0].match(/:(.*?);/)[1];
        base64Data = parts[1];
      } else {
        base64Data = item;
      }
    } else if (item.base64) {
      base64Data = item.base64;
      if (item.mimeType) mimeType = item.mimeType;
      if (item.fileName) fileName = item.fileName;
    }

    if (base64Data) {
      const decodedBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
      const file = targetFolder.createFile(decodedBlob);
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (sharingErr) {
        console.warn('Could not set public sharing on product image:', sharingErr);
      }
      const fileId = file.getId();
      const directUrl = 'https://drive.google.com/uc?export=view&id=' + fileId;
      uploadedUrls.push(directUrl);
    }
  }

  return { success: true, urls: uploadedUrls };
}

function uploadBase64File(folder, base64Str, fileName, mimeType) {
  let cleanBase64 = base64Str;
  if (cleanBase64.startsWith('data:')) {
    const parts = cleanBase64.split(',');
    mimeType = parts[0].match(/:(.*?);/)[1];
    cleanBase64 = parts[1];
  }
  const decodedBlob = Utilities.newBlob(Utilities.base64Decode(cleanBase64), mimeType, fileName);
  const file = folder.createFile(decodedBlob);
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (sharingErr) {
    console.warn('Could not set public sharing on base64 file:', sharingErr);
  }
  return file;
}

/**
 * Trace IMEI for audit & compliance
 */
function traceIMEIAudit(imei) {
  if (!imei) {
    return { success: false, error: 'IMEI query is required.' };
  }

  const cleanImei = String(imei).trim();
  const purchasesResult = fetchPurchaseRecords();
  const inventoryResult = fetchInventoryRecords();

  const matchedPurchases = purchasesResult.data.filter(p => p.imei_1 === cleanImei || p.imei_2 === cleanImei);
  const matchedInventory = inventoryResult.data.filter(i => i.imei_1 === cleanImei || i.imei_2 === cleanImei);

  return {
    success: true,
    imei: cleanImei,
    found: matchedPurchases.length > 0 || matchedInventory.length > 0,
    purchases: matchedPurchases,
    inventory: matchedInventory
  };
}

/**
 * Archive Purchase Record
 */
function archivePurchaseRecord(purchaseId) {
  if (!purchaseId) return { success: false, error: 'purchase_id is required.' };
  const sheet = getPurchasesSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, error: 'Purchases sheet is empty.' };

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(purchaseId)) {
      sheet.getRange(i + 2, 28).setValue('Archived');
      sheet.getRange(i + 2, 30).setValue(new Date().toISOString());
      return { success: true, message: 'Purchase record ' + purchaseId + ' archived.' };
    }
  }

  return { success: false, error: 'Purchase record ' + purchaseId + ' not found.' };
}

/**
 * Calculate Summary Statistics
 */
function getInventoryStats() {
  const result = fetchInventoryRecords();
  if (!result.success) return result;

  const records = result.data;
  let totalInventory = records.length;
  let available = 0;
  let reserved = 0;
  let sold = 0;
  let repair = 0;

  let purchaseValue = 0;
  let sellingValue = 0;
  let potentialProfit = 0;
  let realizedProfit = 0;

  const brandCounts = {};
  const statusCounts = { Available: 0, Reserved: 0, Sold: 0, 'Under Repair': 0 };

  for (let i = 0; i < records.length; i++) {
    const item = records[i];
    const status = item.status || 'Available';
    const p = item.purchase_price || 0;
    const s = item.selling_price || 0;

    if (status === 'Available') {
      available++;
      purchaseValue += p;
      sellingValue += s;
      potentialProfit += (s - p);
    } else if (status === 'Reserved') {
      reserved++;
      purchaseValue += p;
      sellingValue += s;
      potentialProfit += (s - p);
    } else if (status === 'Sold') {
      sold++;
      realizedProfit += (s - p);
    } else if (status === 'Under Repair') {
      repair++;
      purchaseValue += p;
    }

    const brand = item.brand || 'Other';
    brandCounts[brand] = (brandCounts[brand] || 0) + 1;

    if (statusCounts[status] !== undefined) {
      statusCounts[status]++;
    }
  }

  return {
    success: true,
    data: {
      totalInventory: totalInventory,
      available: available,
      reserved: reserved,
      sold: sold,
      repair: repair,
      purchaseValue: purchaseValue,
      sellingValue: sellingValue,
      potentialProfit: potentialProfit,
      realizedProfit: realizedProfit,
      brandCounts: brandCounts,
      statusCounts: statusCounts
    }
  };
}

/**
 * Date Formatter Utility
 */
function formatDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  return String(val);
}
