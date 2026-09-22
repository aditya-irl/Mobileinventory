import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { InventoryTable } from '../components/inventory/InventoryTable';
import { InventoryCard } from '../components/inventory/InventoryCard';
import { FilterBar } from '../components/inventory/FilterBar';
import { DeviceDetailsModal } from '../components/inventory/DeviceDetailsModal';
import { EditInventoryModal } from '../components/inventory/EditInventoryModal';
import { MarkSoldModal } from '../components/inventory/MarkSoldModal';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { EmptyState } from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { exportInventoryToCSV } from '../services/exportService';

import {
  Smartphone,
  PlusCircle,
  Download,
  LayoutGrid,
  List,
  Sparkles
} from 'lucide-react';

export const Inventory = ({ setCurrentTab, selectedDeviceFromDash, onClearSelectedDevice }) => {
  const {
    filteredInventory,
    loading,
    deleteInventoryItem,
    searchQuery,
    settings
  } = useInventory();

  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [selectedDevice, setSelectedDevice] = useState(selectedDeviceFromDash || null);
  const [editingDevice, setEditingDevice] = useState(null);
  const [soldTargetDevice, setSoldTargetDevice] = useState(null);
  const [deleteTargetDevice, setDeleteTargetDevice] = useState(null);

  const handleDeleteConfirm = async () => {
    if (deleteTargetDevice) {
      await deleteInventoryItem(deleteTargetDevice.inventory_id);
      setDeleteTargetDevice(null);
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '20px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800 }}>Mobile Inventory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
            Showing {filteredInventory.length} {filteredInventory.length === 1 ? 'phone' : 'phones'} in catalog.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* View Mode Toggle (Table / Card) */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-subtle)',
              padding: '3px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <button
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? 'var(--bg-surface)' : 'transparent',
                border: 'none',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                color: viewMode === 'table' ? 'var(--primary-600)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                boxShadow: viewMode === 'table' ? 'var(--shadow-xs)' : 'none'
              }}
              title="Table View"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                background: viewMode === 'cards' ? 'var(--bg-surface)' : 'transparent',
                border: 'none',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                color: viewMode === 'cards' ? 'var(--primary-600)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                boxShadow: viewMode === 'cards' ? 'var(--shadow-xs)' : 'none'
              }}
              title="Card View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          {/* Export to CSV */}
          <button
            className="btn btn-secondary"
            onClick={() => exportInventoryToCSV(filteredInventory)}
            disabled={!filteredInventory.length}
          >
            <Download size={15} />
            <span className="hide-mobile">Export CSV</span>
          </button>

          {/* Add Phone CTA */}
          <button
            className="btn btn-primary"
            onClick={() => setCurrentTab('add')}
          >
            <PlusCircle size={16} />
            Add Phone
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar />

      {/* Content Rendering */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : filteredInventory.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'No matching phones found' : 'No phones in inventory'}
          description={
            searchQuery
              ? `No devices matched "${searchQuery}". Try clearing search or adjusting your filters.`
              : 'Your inventory catalog is currently empty. Add your first phone to get started!'
          }
          actionText="+ Add First Phone"
          onAction={() => setCurrentTab('add')}
        />
      ) : viewMode === 'table' ? (
        <>
          {/* Desktop Table View */}
          <div className="hide-mobile">
            <InventoryTable
              items={filteredInventory}
              onViewDetails={(item) => setSelectedDevice(item)}
              onEdit={(item) => setEditingDevice(item)}
              onMarkSold={(item) => setSoldTargetDevice(item)}
              onDelete={(item) => setDeleteTargetDevice(item)}
            />
          </div>

          {/* Fallback to Cards on Mobile View */}
          <div
            className="hide-desktop"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '12px'
            }}
          >
            {filteredInventory.map((item) => (
              <InventoryCard
                key={item.inventory_id}
                item={item}
                onViewDetails={(dev) => setSelectedDevice(dev)}
                onEdit={(dev) => setEditingDevice(dev)}
                onMarkSold={(dev) => setSoldTargetDevice(dev)}
              />
            ))}
          </div>
        </>
      ) : (
        /* Card Grid View */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: '16px'
          }}
        >
          {filteredInventory.map((item) => (
            <InventoryCard
              key={item.inventory_id}
              item={item}
              onViewDetails={(dev) => setSelectedDevice(dev)}
              onEdit={(dev) => setEditingDevice(dev)}
              onMarkSold={(dev) => setSoldTargetDevice(dev)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <DeviceDetailsModal
        item={selectedDevice}
        isOpen={Boolean(selectedDevice)}
        onClose={() => {
          setSelectedDevice(null);
          if (onClearSelectedDevice) onClearSelectedDevice();
        }}
        onEdit={(dev) => setEditingDevice(dev)}
        onOpenMarkSold={(dev) => setSoldTargetDevice(dev)}
      />

      <EditInventoryModal
        item={editingDevice}
        isOpen={Boolean(editingDevice)}
        onClose={() => setEditingDevice(null)}
      />

      <MarkSoldModal
        item={soldTargetDevice}
        isOpen={Boolean(soldTargetDevice)}
        onClose={() => setSoldTargetDevice(null)}
      />

      <ConfirmationModal
        isOpen={Boolean(deleteTargetDevice)}
        onClose={() => setDeleteTargetDevice(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Device from Inventory?"
        message={`Are you sure you want to delete ${deleteTargetDevice?.brand} ${deleteTargetDevice?.model} (${deleteTargetDevice?.inventory_id})? This cannot be undone.`}
        confirmText="Yes, Delete"
      />
    </div>
  );
};

export default Inventory;
