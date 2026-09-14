import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  BRAND_PRESETS,
  STATUS_PRESETS,
  CONDITION_PRESETS,
  STORAGE_PRESETS
} from '../../data/sampleInventory';
import { Filter, X, ArrowUpDown } from 'lucide-react';

export const FilterBar = () => {
  const {
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
    searchQuery,
    setSearchQuery
  } = useInventory();

  const hasActiveFilters =
    selectedBrand !== 'All' ||
    selectedStatus !== 'All' ||
    selectedCondition !== 'All' ||
    selectedStorage !== 'All' ||
    searchQuery.trim() !== '';

  const clearAllFilters = () => {
    setSelectedBrand('All');
    setSelectedStatus('All');
    setSelectedCondition('All');
    setSelectedStorage('All');
    setSearchQuery('');
  };

  return (
    <div
      className="card"
      style={{
        padding: '14px 16px',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-surface)'
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          <Filter size={15} />
          <span>Filters:</span>
        </div>

        {/* Status Dropdown */}
        <select
          className="select"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8125rem' }}
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="All">All Statuses</option>
          {STATUS_PRESETS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Brand Dropdown */}
        <select
          className="select"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8125rem' }}
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
        >
          <option value="All">All Brands</option>
          {BRAND_PRESETS.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {/* Condition Dropdown */}
        <select
          className="select"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8125rem' }}
          value={selectedCondition}
          onChange={(e) => setSelectedCondition(e.target.value)}
        >
          <option value="All">All Conditions</option>
          {CONDITION_PRESETS.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Storage Dropdown */}
        <select
          className="select"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8125rem' }}
          value={selectedStorage}
          onChange={(e) => setSelectedStorage(e.target.value)}
        >
          <option value="All">All Storage</option>
          {STORAGE_PRESETS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            className="btn btn-subtle btn-sm"
            onClick={clearAllFilters}
            style={{ color: '#ef4444', fontWeight: 600 }}
          >
            <X size={14} /> Clear All
          </button>
        )}
      </div>

      {/* Sorting Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ArrowUpDown size={15} color="var(--text-muted)" />
        <select
          className="select"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8125rem' }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="newest">Newest Added</option>
          <option value="oldest">Oldest Added</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="profit_high">Highest Profit Margin</option>
          <option value="battery_high">Battery Health: High to Low</option>
        </select>
      </div>
    </div>
  );
};
