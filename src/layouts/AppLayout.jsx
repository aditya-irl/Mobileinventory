import React, { useState, lazy, Suspense } from 'react';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { MobileDrawer } from '../components/common/MobileDrawer';
import { PageLoader } from '../components/common/PageLoader';

// Code-split pages on demand using dynamic imports & lazy loading
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Inventory = lazy(() => import('../pages/Inventory'));
const AddInventory = lazy(() => import('../pages/AddInventory'));
const Purchases = lazy(() => import('../pages/Purchases'));
const Archived = lazy(() => import('../pages/Archived'));
const SoldItems = lazy(() => import('../pages/SoldItems'));
const Reports = lazy(() => import('../pages/Reports'));
const Settings = lazy(() => import('../pages/Settings'));

export const AppLayout = () => {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [purchasesTab, setPurchasesTab] = useState('ledger');
  const [selectedDeviceFromDash, setSelectedDeviceFromDash] = useState(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const handleSelectDeviceFromDash = (device) => {
    setSelectedDeviceFromDash(device);
    setCurrentTab('inventory');
  };

  const handleNavigate = (tab) => {
    if (tab === 'purchases') {
      setPurchasesTab('ledger');
    }
    setCurrentTab(tab);
  };

  const handleNewBuyback = () => {
    setPurchasesTab('wizard');
    setCurrentTab('purchases');
  };

  return (
    <div className="app-container">
      {/* Desktop Collapsible Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={handleNavigate} />

      {/* Main Content Area */}
      <div className="main-content">
        <Header
          currentTab={currentTab}
          setCurrentTab={handleNavigate}
          onOpenDrawer={() => setIsMobileDrawerOpen(true)}
          onSearchFocus={() => {
            if (currentTab !== 'inventory') {
              setCurrentTab('inventory');
            }
          }}
        />

        <main style={{ flex: 1, minHeight: 0 }}>
          <Suspense fallback={<PageLoader />}>
            {currentTab === 'dashboard' && (
              <Dashboard
                setCurrentTab={handleNavigate}
                onSelectDevice={handleSelectDeviceFromDash}
              />
            )}

            {currentTab === 'inventory' && (
              <Inventory
                setCurrentTab={handleNavigate}
                selectedDeviceFromDash={selectedDeviceFromDash}
                onClearSelectedDevice={() => setSelectedDeviceFromDash(null)}
              />
            )}

            {currentTab === 'purchases' && (
              <Purchases initialTab={purchasesTab} />
            )}

            {currentTab === 'archived' && (
              <Archived />
            )}

            {currentTab === 'add' && (
              <AddInventory setCurrentTab={handleNavigate} />
            )}

            {currentTab === 'sold' && (
              <SoldItems />
            )}

            {currentTab === 'reports' && (
              <Reports />
            )}

            {currentTab === 'settings' && (
              <Settings />
            )}
          </Suspense>
        </main>
      </div>

      {/* Mobile Top-Right Navigation Drawer (replaces fixed BottomNav) */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        currentTab={currentTab}
        setCurrentTab={handleNavigate}
        onNewBuyback={handleNewBuyback}
      />
    </div>
  );
};

export default AppLayout;
