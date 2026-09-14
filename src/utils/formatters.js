/**
 * Utility functions for formatting currencies, dates, IMEIs, and percentages.
 */

export const formatCurrency = (amount, currencySymbol = '₹') => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${currencySymbol}0`;
  }
  const formatted = Math.abs(Number(amount)).toLocaleString('en-IN', {
    maximumFractionDigits: 0
  });
  return amount < 0 ? `-${currencySymbol}${formatted}` : `${currencySymbol}${formatted}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return String(dateString);
  }
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return formatDate(dateString);
  } catch (e) {
    return '';
  }
};

export const maskIMEI = (imei) => {
  if (!imei || imei.length < 8) return imei || '—';
  const str = String(imei).trim();
  return `${str.substring(0, 4)}••••${str.substring(str.length - 4)}`;
};

export const calculateProfitMargin = (purchasePrice, sellingPrice) => {
  const p = Number(purchasePrice) || 0;
  const s = Number(sellingPrice) || 0;
  if (p === 0) return 0;
  return (((s - p) / p) * 100).toFixed(1);
};

export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Available':
      return 'badge-available';
    case 'Reserved':
      return 'badge-reserved';
    case 'Sold':
      return 'badge-sold';
    case 'Under Repair':
      return 'badge-repair';
    default:
      return 'badge-subtle';
  }
};

export const getSafeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const clean = url.trim();
  if (!clean || clean.includes('[Ljava.lang.Object')) return '';

  // Normalize Google Drive links to robust CDN thumbnail endpoint
  if (clean.includes('drive.google.com') || clean.includes('googleusercontent.com')) {
    let fileId = '';
    const idMatch = clean.match(/id=([a-zA-Z0-9_-]+)/) || clean.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      fileId = idMatch[1];
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
    }
  }

  return clean;
};

