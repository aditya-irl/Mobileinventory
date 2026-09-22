import React, { useState, lazy, Suspense } from 'react';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { BottomNav } from '../components/common/BottomNav';
import { MobileDrawer } from '../components/common/MobileDrawer';
import { PageLoader } from '../components/common/PageLoader';

// Code-split pages on demand using dynamic imports & lazy loading
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Inventory = lazy(() => import('../pages/Inventory'));
const AddInventory = lazy(() => import('../pages/AddInventory'));
const Purchases = lazy(() => import('../pages/Purchases'));
const SoldItems = lazy(() => import('../pages/SoldItems'));
const Reports = lazy(() => import('../pages/Reports'));
const Settings = lazy(() => import('../pages/Settings'));

export const AppLayout = () => {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedDeviceFromDash, setSelectedDeviceFromDash] = useState(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const handleSelectDeviceFromDash = (device) => {
    setSelectedDeviceFromDash(device);
    setCurrentTab('inventory');
  };

  return (
    <div className="app-container">
      {/* Desktop Collapsible Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="main-content">
        <Header
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
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
                setCurrentTab={setCurrentTab}
                onSelectDevice={handleSelectDeviceFromDash}
              />
            )}

            {currentTab === 'inventory' && (
              <Inventory
                setCurrentTab={setCurrentTab}
                selectedDeviceFromDash={selectedDeviceFromDash}
                onClearSelectedDevice={() => setSelectedDeviceFromDash(null)}
              />
            )}

            {currentTab === 'purchases' && (
              <Purchases />
            )}

            {currentTab === 'add' && (
              <AddInventory setCurrentTab={setCurrentTab} />
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

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenDrawer={() => setIsMobileDrawerOpen(true)}
      />

      {/* Mobile Navigation Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />
    </div>
  );
};

export default AppLayout;
