# Google Apps Script Deployment Guide — Rathore Mobiles / PhoneVault Pro

This guide explains how to deploy the serverless Google Apps Script backend connected to your Google Sheet database.

### 📋 Google Sheet Details:
- **Spreadsheet Name**: `Mobile inventory database`
- **Spreadsheet ID**: `1uGLCOlWm6CZ6fRl5_SZahKw1-eL37Yvg2RY1dcaa4Yw`
- **Main Sheet/Tab Name**: `Inventory`
- **Buyback Sheet/Tab Name**: `Purchases`

---

### Step 1: Open Google Apps Script
1. Open your Apps Script editor: [https://script.google.com/](https://script.google.com/).
2. Open your project (e.g. `Mobile inventory backend` or `PhoneVault Backend API`).

### Step 2: Paste the Updated Backend Code
1. Replace all code in `Code.gs` with the entire contents of [google-apps-script/Code.gs](file:///Users/adityakumar/Desktop/Mobile%20inventory%20/google-apps-script/Code.gs).
2. Save the project (`Cmd+S` or `Ctrl+S`).

### Step 3: Deploy as a New Version
1. Click the blue **Deploy** button (top-right) > **Manage deployments**.
2. Click the **Edit (Pencil Icon)** next to your active Web App deployment.
3. In the **Version** dropdown, select **New version**.
4. Ensure:
   - **Execute as**: `Me (your_email@gmail.com)`
   - **Who has access**: `Anyone`
5. Click **Deploy**.
6. Copy the Web App URL (e.g., `https://script.google.com/macros/s/AKfycb.../exec`).

---

### Supported API Endpoints:

#### GET Requests:
- `?action=testConnection`: Health & Google Sheets connection check. Verifies that spreadsheet `1uGLCOlWm6CZ6fRl5_SZahKw1-eL37Yvg2RY1dcaa4Yw` and tab `Inventory` are accessible. Returns `{ "success": true, "message": "Google Sheets connection successful" }`.
- `?action=list` / `?action=getInventory`: Returns full list of inventory items.
- `?action=stats` / `?action=getStats`: Returns real-time aggregate statistics.
- `?action=getPurchases`: Returns used phone buyback & seller verification records.
- `?action=traceIMEI&imei=XXXXXXXX`: Traces complete lifecycle history for a given IMEI.

#### POST Requests:
- `POST action=add` / `action=addInventory`: Adds a new phone to inventory.
- `POST action=update` / `action=updateInventory`: Updates an existing inventory item.
- `POST action=delete` / `action=deleteInventory`: Deletes an inventory item.
- `POST action=markSold`: Atomically marks an item as sold and updates sales history.
- `POST action=addPurchase`: Records a buyback transaction and creates linked inventory item.
- `POST action=archivePurchase`: Soft-archives a buyback record.
- `POST action=uploadImages`: Uploads base64 photos to Google Drive.
