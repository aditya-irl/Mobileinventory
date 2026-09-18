import React, { useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { StatCard } from '../components/common/StatCard';
import { formatCurrency } from '../utils/formatters';
import { exportInventoryToCSV } from '../services/exportService';

import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  Clock,
  Printer,
  Download,
  ShieldCheck
} from 'lucide-react';

export const Reports = () => {
  const { inventory, statistics, settings } = useInventory();

  // Brand Performance Matrix
  const brandMatrix = useMemo(() => {
    const map = {};
    inventory.forEach(item => {
      const b = item.brand || 'Other';
      if (!map[b]) {
        map[b] = {
          brand: b,
          totalUnits: 0,
          availableUnits: 0,
          soldUnits: 0,
          totalCost: 0,
          totalSelling: 0,
          realizedProfit: 0
        };
      }
      map[b].totalUnits++;
      const p = Number(item.purchase_price) || 0;
      const s = Number(item.selling_price) || 0;

      if (item.status === 'Available') {
        map[b].availableUnits++;
        map[b].totalCost += p;
        map[b].totalSelling += s;
      } else if (item.status === 'Sold') {
        map[b].soldUnits++;
        map[b].realizedProfit += (s - p);
      }
    });

    return Object.values(map).sort((a, b) => b.totalUnits - a.totalUnits);
  }, [inventory]);

  // Inventory Aging Analysis
  const agingReport = useMemo(() => {
    let fresh = 0;   // < 30 days
    let aging = 0;   // 30-60 days
    let stale = 0;   // > 60 days

    const now = new Date();

    inventory.forEach(item => {
      if (item.status === 'Available' || item.status === 'Reserved') {
        const d = new Date(item.purchase_date || item.created_at || now);
        const days = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        if (days <= 30) fresh++;
        else if (days <= 60) aging++;
        else stale++;
      }
    });

    return { fresh, aging, stale };
  }, [inventory]);

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
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800 }}>Business Reports & Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
            Comprehensive stock valuation, aging metrics, and brand profitability breakdown.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => window.print()}
            style={{ minHeight: '38px' }}
          >
            <Printer size={15} />
            <span className="hide-mobile">Print Report</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={() => exportInventoryToCSV(inventory, 'Rathore_Mobiles_Full_Report.csv')}
            style={{ minHeight: '38px' }}
          >
            <Download size={15} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid-stats" style={{ marginBottom: '24px' }}>
        <StatCard
          title="Active Stock Valuation"
          value={formatCurrency(statistics.totalSellingValue, settings.currency)}
          subtitle="At current retail prices"
          icon={TrendingUp}
          color="primary"
        />
        <StatCard
          title="Capital Invested"
          value={formatCurrency(statistics.totalPurchaseValue, settings.currency)}
          subtitle="Total procurement cost"
          icon={DollarSign}
          color="amber"
        />
        <StatCard
          title="Unrealized Margin"
          value={formatCurrency(statistics.potentialProfit, settings.currency)}
          subtitle="Potential gain in vault"
          icon={Package}
          color="emerald"
        />
        <StatCard
          title="Cumulative Profit"
          value={formatCurrency(statistics.realizedProfit, settings.currency)}
          subtitle="All-time closed sales"
          icon={ShieldCheck}
          color="blue"
        />
      </div>

      {/* Inventory Aging Section */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="var(--primary-600)" />
          Inventory Aging & Velocity Health
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px' }}>
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--status-available-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--status-available-border)'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--status-available-text)' }}>
              Fresh Stock (&lt; 30 Days)
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
              {agingReport.fresh} Phones
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              High velocity, newly procured
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--status-reserved-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--status-reserved-border)'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--status-reserved-text)' }}>
              Aging Stock (30–60 Days)
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
              {agingReport.aging} Phones
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Moderate holding duration
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--status-danger-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--status-danger-border)'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--status-danger-text)' }}>
              Stagnant Stock (&gt; 60 Days)
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
              {agingReport.stale} Phones
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Recommended for clearance or discount
            </div>
          </div>
        </div>
      </div>

      {/* Brand Performance Table */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="var(--primary-600)" />
          Brand Profitability & Stock Distribution
        </h3>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Total Units</th>
                <th>Available</th>
                <th>Units Sold</th>
                <th>Active Cost</th>
                <th>Active Value</th>
                <th>Realized Profit</th>
              </tr>
            </thead>
            <tbody>
              {brandMatrix.map((item) => (
                <tr key={item.brand}>
                  <td style={{ fontWeight: 700 }}>{item.brand}</td>
                  <td>{item.totalUnits}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>{item.availableUnits}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#3b82f6' }}>{item.soldUnits}</span>
                  </td>
                  <td>{formatCurrency(item.totalCost, settings.currency)}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
                    {formatCurrency(item.totalSelling, settings.currency)}
                  </td>
                  <td style={{ fontWeight: 800, color: '#10b981' }}>
                    +{formatCurrency(item.realizedProfit, settings.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
