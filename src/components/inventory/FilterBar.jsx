import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  BRAND_PRESETS,
  STATUS_PRESETS,
  CONDITION_PRESETS,
  STORAGE_PRESETS
} from '../../data/sampleInventory';
import { Filter, X, ArrowUpDown, Search, RotateCw } from 'lucide-react';

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
    setSearchQuery,
    fetchInventory,
    refreshing
  } = useInventory();

  const [showMobileFilters, setShowMobileFilters] = React.useState(false);

  const activeFilterCount = [
    selectedBrand !== 'All',
    selectedStatus !== 'All',
    selectedCondition !== 'All',
    selectedStorage !== 'All'
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0 || searchQuery.trim() !== '';

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
        padding: '12px 14px',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        backgroundColor: 'var(--bg-surface)'
      }}
    >
      {/* Row 1: Search Bar, Mobile Filter Toggle & Refresh */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            placeholder="Search phones, brand, model, IMEI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
            style={{
              paddingLeft: '32px',
              paddingRight: '8px',
              height: '38px',
              fontSize: '0.8125rem',
              width: '100%',
              backgroundColor: 'var(--bg-subtle)'
            }}
          />
        </div>

        {/* Mobile Toggle Filters Button */}
        <button
          type="button"
          className={`btn ${showMobileFilters ? 'btn-primary' : 'btn-secondary'} hide-desktop`}
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          style={{ height: '38px', padding: '0 10px', fontSize: '0.78rem', flexShrink: 0, gap: '4px' }}
          title="Toggle Filters"
          aria-expanded={showMobileFilters}
        >
          <Filter size={14} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span
              style={{
                backgroundColor: showMobileFilters ? 'rgba(255,255,255,0.25)' : 'var(--primary-600)',
                color: '#fff',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '10px'
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-icon"
          onClick={() => fetchInventory(true)}
          title="Refresh Inventory"
          style={{ width: '38px', height: '38px', flexShrink: 0 }}
        >
          <RotateCw size={15} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Row 2: Filter Selectors & Sorting */}
      <div
        className={`filterbar-selectors ${showMobileFilters ? 'filterbar-mobile-open' : ''}`}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'center',
            flex: 1,
            minWidth: '200px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <Filter size={14} />
            <span>Filter:</span>
          </div>

        {/* Status Dropdown */}
        <select
          className="select"
          style={{ width: 'auto', minWidth: '115px', padding: '6px 10px', fontSize: '0.8125rem' }}
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
          style={{ width: 'auto', minWidth: '105px', padding: '6px 10px', fontSize: '0.8125rem' }}
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
          style={{ width: 'auto', minWidth: '115px', padding: '6px 10px', fontSize: '0.8125rem' }}
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
          style={{ width: 'auto', minWidth: '105px', padding: '6px 10px', fontSize: '0.8125rem' }}
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
            type="button"
            className="btn btn-subtle btn-sm"
            onClick={clearAllFilters}
            style={{ color: '#ef4444', fontWeight: 600, padding: '4px 8px', height: '34px' }}
          >
            <X size={14} /> Clear All
          </button>
        )}
      </div>

      {/* Sorting Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '150px' }}>
        <ArrowUpDown size={15} color="var(--text-muted)" />
        <select
          className="select"
          style={{ width: '100%', minWidth: '140px', padding: '6px 10px', fontSize: '0.8125rem' }}
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
  </div>
);
};
