import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { DeviceDetailsModal } from '../components/inventory/DeviceDetailsModal';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency, formatDate, calculateProfitMargin } from '../utils/formatters';
import { exportSalesReportToCSV } from '../services/exportService';

import {
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Download,
  Calendar,
  User,
  Search,
  Eye,
  Filter
} from 'lucide-react';

export const SoldItems = () => {
  const { soldItems, settings } = useInventory();

  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);

  // Compute filtered sold items
  const filteredSold = useMemo(() => {
    return soldItems.filter(item => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches =
          (item.inventory_id && item.inventory_id.toLowerCase().includes(q)) ||
          (item.brand && item.brand.toLowerCase().includes(q)) ||
          (item.model && item.model.toLowerCase().includes(q)) ||
          (item.customer && item.customer.toLowerCase().includes(q)) ||
          (item.imei_1 && String(item.imei_1).includes(q));
        if (!matches) return false;
      }

      if (selectedBrand !== 'All' && item.brand !== selectedBrand) {
        return false;
      }

      if (dateFilter && item.selling_date && !item.selling_date.startsWith(dateFilter)) {
        return false;
      }

      return true;
    });
  }, [soldItems, search, selectedBrand, dateFilter]);

  // Aggregate Sales Metrics
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    filteredSold.forEach(item => {
      const s = Number(item.selling_price) || 0;
      const p = Number(item.purchase_price) || 0;
      totalRevenue += s;
      totalCost += p;
      totalProfit += (s - p);
    });

    const avgMargin = totalCost > 0 ? (((totalRevenue - totalCost) / totalCost) * 100).toFixed(1) : 0;

    return {
      units: filteredSold.length,
      totalRevenue,
      totalCost,
      totalProfit,
      avgMargin
    };
  }, [filteredSold]);

  // Unique Brands in Sold items
  const availableBrands = useMemo(() => {
    const set = new Set(soldItems.map(i => i.brand).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [soldItems]);

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
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800 }}>Sold Devices & Sales Ledger</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
            Track closed sales, customer invoices, and realized profit margins.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => exportSalesReportToCSV(filteredSold)}
          disabled={!filteredSold.length}
        >
          <Download size={15} />
          Export Sales CSV
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid-stats" style={{ marginBottom: '20px' }}>
        <StatCard
          title="Units Sold"
          value={`${metrics.units} Phones`}
          subtitle="Total transactions"
          icon={ShoppingBag}
          color="blue"
        />
        <StatCard
          title="Total Sales Revenue"
          value={formatCurrency(metrics.totalRevenue, settings.currency)}
          subtitle="Gross collections"
          icon={DollarSign}
          color="primary"
        />
        <StatCard
          title="Net Realized Profit"
          value={formatCurrency(metrics.totalProfit, settings.currency)}
          subtitle="Realized gain"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Avg Profit Margin"
          value={`+${metrics.avgMargin}%`}
          subtitle="Overall markup"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Filters Toolbar */}
      <div
        className="card"
        style={{
          padding: '14px 16px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', flex: '1 1 280px', width: '100%' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 0 }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search buyer, model, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: '32px', height: '38px', fontSize: '0.8125rem', width: '100%' }}
            />
          </div>

          <select
            className="select"
            style={{ width: 'auto', flex: '1 1 120px', padding: '6px 12px', height: '38px', fontSize: '0.8125rem' }}
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
          >
            {availableBrands.map(b => (
              <option key={b} value={b}>{b === 'All' ? 'All Brands' : b}</option>
            ))}
          </select>

          <input
            type="month"
            className="input"
            style={{ width: 'auto', flex: '1 1 120px', padding: '6px 10px', height: '38px', fontSize: '0.8125rem' }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            title="Filter by Sale Month"
          />

          {(search || selectedBrand !== 'All' || dateFilter) && (
            <button
              className="btn btn-subtle btn-sm"
              onClick={() => {
                setSearch('');
                setSelectedBrand('All');
                setDateFilter('');
              }}
              style={{ color: '#ef4444', height: '38px' }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Sold Items Table & Mobile Cards */}
      {filteredSold.length === 0 ? (
        <EmptyState
          title="No sold devices found"
          description={
            soldItems.length === 0
              ? 'No sales recorded yet. Mark phones as sold from the Inventory page to build your sales history.'
              : 'No sold records matched your filter criteria.'
          }
          icon={ShoppingBag}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="table-container hide-mobile">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Device</th>
                  <th>Buyer / Customer</th>
                  <th>Purchase Cost</th>
                  <th>Selling Price</th>
                  <th>Realized Profit</th>
                  <th>Sale Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSold.map((item) => {
                  const profit = (Number(item.selling_price) || 0) - (Number(item.purchase_price) || 0);
                  const margin = calculateProfitMargin(item.purchase_price, item.selling_price);

                  return (
                    <tr
                      key={item.inventory_id}
                      onClick={() => setSelectedDevice(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-600)' }}>
                        {item.inventory_id}
                      </td>

                      <td>
                        <div style={{ fontWeight: 700 }}>
                          {item.brand} {item.model}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {item.storage || '—'} • {item.color || ''}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                          <User size={13} color="var(--text-muted)" />
                          <span>{item.customer || 'Direct Customer'}</span>
                        </div>
                      </td>

                      <td style={{ fontWeight: 500 }}>
                        {formatCurrency(item.purchase_price, settings.currency)}
                      </td>

                      <td style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
                        {formatCurrency(item.selling_price, settings.currency)}
                      </td>

                      <td>
                        <div style={{ fontWeight: 800, color: '#10b981' }}>
                          +{formatCurrency(profit, settings.currency)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                          +{margin}% margin
                        </div>
                      </td>

                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Calendar size={13} />
                          <span>{formatDate(item.selling_date || item.updated_at)}</span>
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-subtle btn-icon btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDevice(item);
                          }}
                          title="View Sale Record"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div
            className="hide-desktop"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '12px'
            }}
          >
            {filteredSold.map((item) => {
              const profit = (Number(item.selling_price) || 0) - (Number(item.purchase_price) || 0);
              const margin = calculateProfitMargin(item.purchase_price, item.selling_price);

              return (
                <div
                  key={item.inventory_id}
                  className="card animate-fade-in"
                  onClick={() => setSelectedDevice(item)}
                  style={{
                    padding: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {item.brand} {item.model}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        ID: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.inventory_id}</span>
                        {item.storage ? ` • ${item.storage}` : ''}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                        {formatCurrency(item.selling_price, settings.currency)}
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                        +{formatCurrency(profit, settings.currency)} ({margin}%)
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      padding: '8px 10px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.78rem'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Buyer</div>
                      <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.customer || 'Direct Customer'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sale Date</div>
                      <div style={{ fontWeight: 600 }}>{formatDate(item.selling_date || item.updated_at)}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Cost: {formatCurrency(item.purchase_price, settings.currency)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDevice(item);
                      }}
                      style={{ width: '100%', minHeight: '40px', fontSize: '0.8125rem', fontWeight: 600, justifyContent: 'center' }}
                    >
                      <Eye size={14} /> View Sale Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Device Details Modal */}
      <DeviceDetailsModal
        item={selectedDevice}
        isOpen={Boolean(selectedDevice)}
        onClose={() => setSelectedDevice(null)}
        onEdit={() => {}}
        onOpenMarkSold={() => {}}
      />
    </div>
  );
};

export default SoldItems;
