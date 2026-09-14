# PhoneVault Pro — Production-Ready Mobile Phone Inventory & Buyback Management System

**PhoneVault Pro** is a modern, responsive, zero-cost serverless SaaS application engineered specifically for smartphone retailers, wholesalers, refurbishers, and personal tech collectors.

Built with **React 18 + Vite** on the frontend and **Google Apps Script + Google Sheets + Google Drive** as the zero-cost database and file storage layer. Deployable directly to **Vercel** and **GitHub**.

---

## 📱 Core Features

### 1. 💼 Used Phone Purchase / Buyback & Seller Verification Module
- **Strict KYC Data Isolation**: Seller personal information (Name, Mobile, Residential Address, Government ID proofs, Seller Face Photos) are strictly isolated in a dedicated `Purchases` sheet/dataset and never exposed in the general public inventory list.
- **8-Step Guided Buyback Wizard**:
  1. Seller Personal Information
  2. Government Identity Verification (Passport, Driver's License, Voter ID, National/State Govt Photo ID)
  3. Seller Face Photo & ID Document Upload
  4. Device Hardware Specs & Physical Grading
  5. IMEI Verification & Internal Risk Check (with prominent legal disclaimer)
  6. Purchase Commercials & Payment Method (Cash, UPI, Bank Wire, Store Credit)
  7. Seller Ownership & Legal Affidavit Checkboxes
  8. Automated Generation of `PUR-XXXX` (Purchase Record) & linked `INV-XXXX` (Stock Catalog Item).
- **Printable Buyback Invoices & Transfer Certificates**:
  - Official printable certificate with legal ownership declaration, transaction details, and signature blocks.

### 2. 🔍 Global IMEI Traceability & Lawful Audit Trail
- Trace any IMEI across its entire lifecycle:
  `Seller Intake (PUR-XXXX) ──► In-Stock Vault Testing (INV-XXXX) ──► Customer Sale Outcome (Buyer & Profit)`
- Generates instant chronological audit logs for regulatory compliance and lawful inquiries.

### 3. 📊 Executive Analytics Dashboard
- 8 real-time KPI statistic cards (Total Stock, Available, Reserved, Sold, Under Repair, Procurement Cost, Potential Profit, Realized Profit).
- 4 interactive charts: Stock by Brand (Doughnut), Lifecycle Status (Doughnut), Valuation Comparison (Bar), and 6-Month Sales & Profit Trend (Area Line).

### 4. 📦 Inventory Management & Hardware Telemetry
- Unique auto-incrementing ID: `INV-0001`, `INV-0002`, etc.
- Multi-criteria search (by IMEI 1 & 2, Model, Brand, Serial Number, Supplier, Customer).
- Fast filter chips (Brand, Status, Physical Condition, Storage Tier, Sorting).
- Dual responsive views: Desktop Table with hover thumbnails and Mobile Card view.
- 1-click printable technical specification sheet & customer invoice.

### 5. 💰 Sales Ledger & Profit Tracking
- Dedicated **Sold Items** section with realized profit metrics and buyer history.
- Real-time margin calculator and celebratory confetti upon closing sales.

### 6. 📈 Business Reports & Stock Aging
- Stock aging velocity breakdown (&lt;30 days fresh stock, 30–60 days aging, &gt;60 days stagnant stock).
- Brand profitability matrix.
- CSV export for inventory, sales, and buyback ledgers.

### 7. 🔒 Store Security & PWA
- Built-in 4-digit Passcode / PIN lock screen with digital numpad (Default PIN: `1234`).
- Dark/Light mode theme switchable with tailored HSL tokens.
- PWA manifest ready for installation on iPhone & Android home screens.

---

## 🏗️ System Architecture

```
User Device (Phone / Tablet / Desktop)
                 │
                 ▼
     Vercel Web Application (React 18 + Vite)
                 │
        JSON HTTP API Requests
                 │
                 ▼
   Google Apps Script Web App API (Code.gs)
                 ├──► Google Sheets
                 │       ├── Sheet: Inventory (Hardware Specs & Pricing)
                 │       └── Sheet: Purchases (Seller KYC & Legal Records)
                 │
                 └──► Google Drive
                         ├── Product_Images/INV-XXXX/
                         └── Purchase_Records/PUR-XXXX/
                                 ├── Seller_Photo/
                                 └── ID_Document/
```

---

## 🚀 Quick Start (Run Locally)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd "Mobile inventory"
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Leave `VITE_API_URL` empty to run in instant demo mode with pre-loaded smartphones and buyback records, or paste your Google Apps Script Web App URL)*

### 3. Run Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. (Default PIN: `1234`)

### 4. Build for Production
```bash
npm run build
```

---

## ☁️ Google Apps Script Setup (Zero-Cost Serverless Backend)

1. Open [script.google.com](https://script.google.com/) and create a new project named `PhoneVault Backend API`.
2. Copy the entire contents of [google-apps-script/Code.gs](file:///Users/adityakumar/Desktop/Mobile%20inventory%20/google-apps-script/Code.gs) and paste it into the editor.
3. In the toolbar function dropdown, select **`setupDatabaseAndDrive`** and click **Run** (authorizing requested permissions).
   - This automatically creates the `PhoneVault_Inventory_Database` Google Sheet (with both `Inventory` and `Purchases` sheets formatted) and Google Drive folder trees (`Product_Images` and `Purchase_Records`).
4. Click **Deploy** > **New deployment** > Select **Web app**.
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
5. Copy the **Web app URL** and paste it into `VITE_API_URL` in your `.env` or in the in-app **Settings** page.

---

## 📄 License
MIT License. Built for smartphone retailers, technicians, and buyback managers.
