# PROJECT_CONTEXT

## 1. PROJECT OVERVIEW
**Project Name:** PhoneVault Pro (Mobile Inventory App / Rathore Mobiles)
**Project Type:** Mobile-first Web App / PWA (Serverless SaaS)
**Main Purpose:** A specialized inventory and buyback management system for smartphone retailers. Handles stock tracking, buybacks (Purchases) with KYC isolation, and sales analytics.
**Target Users:** Retailers, Store Managers, Admin.
**Current Status:** Development / Production Ready
**Live Frontend URL:** Vercel (Not specified)
**Live Backend URL:** Google Apps Script Web App
**Repository:** N/A (Local workspace: `/Users/adityakumar/Desktop/Mobile inventory`)

## 2. TECH STACK
* **Frontend:** React 18, Vite, Javascript, PWA Support.
* **Styling/UI:** CSS/Tailwind (Lucide React for icons, Chart.js for analytics, canvas-confetti).
* **Backend:** Google Apps Script (Serverless API).
* **Database:** Google Sheets (Data storage for Inventory & Purchases).
* **File Storage:** Google Drive (Photos, KYC Docs).
* **Authentication:** Firebase Authentication.
* **Hosting:** Frontend on Vercel/GitHub Pages, Backend on Google Cloud (Apps Script).

## 3. PROJECT ARCHITECTURE

### Frontend
* **Entry Points:** `index.html` -> `src/main.jsx` -> `src/App.jsx`.
* **Routing:** Dynamic component rendering (Suspense/Lazy loading) within `AppLayout` (No `react-router-dom` used explicitly in `package.json`).
* **State Management:** React Context API (`AuthContext`, `ThemeContext`, `ToastContext`, `InventoryContext`).
* **API Layer:** `src/services/api.js` acts as the central API client. Includes local storage fallback for offline/demo mode.
* **Important Pages:**
  - `Login.jsx`: Firebase Auth and PIN-based entry.
  - `Dashboard.jsx`: Executive analytics and charts.
  - `Inventory.jsx`: Main stock list, filtering, search.
  - `Purchases.jsx`: Buyback wizard and KYC records.
  - `SoldItems.jsx`: Sales ledger and profit tracking.
  - `Reports.jsx` & `Settings.jsx`.
* **Important Services:** `api.js` (Google Apps Script integrations), `exportService.js` (CSV exports), `imageCompression.js` (File uploads).

### Backend (Google Apps Script)
* **Entry Point:** `google-apps-script/Code.gs` (deployed as Web App).
* **Functionality:** Handles JSON HTTP API requests, reads/writes to Google Sheets, and saves base64 image data to Google Drive.
* **CORS:** Apps Script natively handles CORS via JSONP or direct fetch with appropriate headers.

### Database (Google Sheets & Drive)
* **Type:** Serverless Spreadsheet Database.
* **Collections/Sheets:**
  - `Inventory`: Hardware specs, pricing, status, device photos.
  - `Purchases`: Strict KYC data isolation (Seller info, IDs, signatures).
* **Relationships:** `INV-XXXX` (Inventory ID) links to `PUR-XXXX` (Purchase Record).

## 4. CURRENT FUNCTIONALITY
**USER/ADMIN SIDE:**
* Secure PIN/Firebase login.
* Dashboard with KPI stats and Chart.js graphs.
* Add/Edit/Delete mobile inventory.
* Buyback Wizard (Purchases) with 8-step flow and KYC upload.
* Image uploads (device photos) direct to Google Drive.
* Mark items as Sold, track profits and sales ledger.
* Local storage fallback database if Google Apps Script is not connected.
* CSV Export for Inventory, Sales, and Purchases.

## 5. SECURITY AUDIT & CURRENT RISKS
* **Exposed API Keys:** `src/firebase.js` contains a hardcoded Firebase API Key (`AIzaSyCNRtTnG2yLjKG37pSjBona9IHsdd5ma2I`) and project details as a fallback.
* **Backend URL Hardcoded:** `src/services/api.js` contains a hardcoded `PERMANENT_GOOGLE_APPS_SCRIPT_URL`. While this makes setup easier, it ties the frontend directly to one Apps Script deployment.
* **Authentication Weaknesses:** There's a 4-digit PIN system (default `1234`) which might act as a superficial lock screen rather than robust auth. Need to evaluate Firebase Auth rules.
* **Data Privacy (KYC):** Since Google Sheets is used, whoever has access to the sheet has full access to sensitive KYC data (ID cards). The Apps Script acts as a proxy, so the Web App deployment permissions must be carefully managed (`Execute as: Me`, `Access: Anyone`).
* **Image Uploads:** Uploading large images directly as base64 to Apps Script can cause payload size limits or timeouts. The system uses a 10MB limit check in `api.js`.

## 6. IMPORTANT FILES
* **`package.json`**: Lists dependencies (`firebase`, `chart.js`, `lucide-react`, Capacitor for Android).
* **`src/App.jsx`**: Main application wrapper with context providers and Suspense loading.
* **`src/firebase.js`**: Firebase configuration and initialization.
* **`src/services/api.js`**: Core backend communication layer (CRUD operations and file uploads).
* **`src/context/InventoryContext.jsx`**: Manages global inventory state.
* **`google-apps-script/Code.gs`**: The entire backend source code.

## 7. DEPLOYMENT CONFIGURATION
* **Local Development:** `npm run dev` (Runs on Vite default or port 3000). API requests go to the Apps Script URL or fall back to `localStorage`.
* **Production Build:** `npm run build` -> deployed to Vercel (indicated by `vercel.json`).
* **Environment Variables:** Handled via `.env` (API URL, Firebase config). `.env.example` provided.
* **Mobile App:** Capacitor is configured (`capacitor.config.json` and `android/` folder) for potential Android APK generation.

---
*Project context understood. Ready for the next task.*
