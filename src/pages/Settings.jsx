import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

import {
  Settings as SettingsIcon,
  Database,
  Cloud,
  Lock,
  Store,
  DollarSign,
  Shield,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  HelpCircle
} from 'lucide-react';

export const Settings = () => {
  const { settings, updateSettings, inventory, resetToSampleData } = useInventory();
  const { isPinRequired, setIsPinRequired, updatePin } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [apiUrl, setApiUrl] = useState(settings.apiUrl || '');
  const [storeName, setStoreName] = useState(settings.storeName || 'PhoneVault Pro');
  const [currency, setCurrency] = useState(settings.currency || '₹');
  
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Test connection to Google Apps Script
  const handleTestConnection = async () => {
    if (!apiUrl.trim()) {
      showInfo('No URL provided. The system is operating in Local Storage / Offline Demo Mode.');
      setConnectionStatus({ success: true, mode: 'local', message: 'Local Storage Database Active' });
      return;
    }

    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const res = await api.testConnection(apiUrl.trim());
      if (res.success) {
        const msg = res.message || 'Google Sheets connection successful';
        setConnectionStatus({ success: true, mode: 'google', message: msg });
        showSuccess(msg);
      } else {
        const errMsg = res.error || 'Connection failed. Please check permissions.';
        setConnectionStatus({ success: false, error: errMsg });
        showError(errMsg);
      }
    } catch (err) {
      setConnectionStatus({ success: false, error: err.message });
      showError('Connection failed: ' + err.message);
    } finally {
      setTestingConnection(false);
    }
  };


  // Save general settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateSettings({
      apiUrl: apiUrl.trim(),
      storeName: storeName.trim(),
      currency: currency.trim()
    });
    showSuccess('Settings updated successfully!');
  };

  // Update PIN
  const handleUpdatePin = (e) => {
    e.preventDefault();
    if (newPin !== confirmPin) {
      showError('New PIN and confirmation PIN do not match.');
      return;
    }
    const res = updatePin(oldPin, newPin);
    if (res.success) {
      showSuccess(res.message);
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
    } else {
      showError(res.error);
    }
  };

  // Export JSON backup
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(inventory, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `phonevault_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showSuccess('Backup exported successfully.');
  };

  // Import JSON backup
  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          localStorage.setItem('phonevault_inventory_db_v1', JSON.stringify(imported));
          window.location.reload();
        } else {
          showError('Invalid JSON format: expected an array of devices.');
        }
      } catch (err) {
        showError('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="page-wrapper animate-fade-in" style={{ maxWidth: '960px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800 }}>System Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
          Configure Google Cloud integrations, store identity, and security access.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Google Apps Script & Sheets Integration */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary-50)',
                  color: 'var(--primary-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Database size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Google Cloud Database & Drive</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Serverless sync with Google Sheets (database) & Google Drive (photos)
                </p>
              </div>
            </div>

            <div
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: apiUrl ? 'var(--status-available-bg)' : 'var(--bg-subtle)',
                color: apiUrl ? 'var(--status-available-text)' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              {apiUrl ? 'Cloud Mode' : 'Local Storage Mode'}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <span>Google Apps Script Web App Deployment URL</span>
            </label>
            <input
              type="url"
              className="input"
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Leave blank to run in offline / local storage mode.
            </div>
          </div>

          {/* Connection Status Banner */}
          {connectionStatus && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: connectionStatus.success ? 'var(--status-available-bg)' : 'var(--status-danger-bg)',
                border: `1px solid ${connectionStatus.success ? 'var(--status-available-border)' : 'var(--status-danger-border)'}`,
                color: connectionStatus.success ? 'var(--status-available-text)' : 'var(--status-danger-text)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                marginTop: '12px'
              }}
            >
              {connectionStatus.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{connectionStatus.message || connectionStatus.error}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTestConnection}
              disabled={testingConnection}
            >
              <RefreshCw size={15} className={testingConnection ? 'animate-spin' : ''} />
              {testingConnection ? 'Testing API...' : 'Test Connection'}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveSettings}
            >
              Save Configuration
            </button>
          </div>

          {/* Setup Instructions Box */}
          <div
            style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8125rem'
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HelpCircle size={15} color="var(--primary-600)" />
              How to setup Google Sheets & Drive in 2 minutes:
            </div>
            <ol style={{ paddingLeft: '20px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              <li>Open <a href="https://script.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>script.google.com</a> and create a new project.</li>
              <li>Copy all code from <code style={{ fontFamily: 'monospace' }}>google-apps-script/Code.gs</code> and paste it.</li>
              <li>Click <strong>Deploy</strong> &gt; <strong>New deployment</strong> &gt; Select <strong>Web app</strong>.</li>
              <li>Set <em>Execute as:</em> <strong>Me</strong> and <em>Who has access:</em> <strong>Anyone</strong>.</li>
              <li>Click <strong>Deploy</strong> and paste the resulting Web App URL above!</li>
            </ol>
          </div>
        </div>

        {/* Store Profile & Currency */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-50)',
                color: 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Store size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Store Profile & Localization</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Customize your branding, business name, and currency denomination.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Store / Business Name</label>
                <input
                  type="text"
                  className="input"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. PhoneVault Pro"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Currency Symbol</label>
                <select
                  className="select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="₹">₹ — Indian Rupee (INR)</option>
                  <option value="$">$ — US Dollar (USD)</option>
                  <option value="€">€ — Euro (EUR)</option>
                  <option value="£">£ — British Pound (GBP)</option>
                  <option value="AED">AED — UAE Dirham</option>
                  <option value="C$">C$ — Canadian Dollar</option>
                  <option value="A$">A$ — Australian Dollar</option>
                  <option value="¥">¥ — Japanese Yen</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
              Save Profile
            </button>
          </form>
        </div>

        {/* Security & Access PIN */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-50)',
                color: 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Lock size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Security & PIN Lock</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Protect inventory records with a 4-digit Passcode lock.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Require PIN on Launch</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Locks store data whenever session restarts.
              </div>
            </div>
            <input
              type="checkbox"
              checked={isPinRequired}
              onChange={(e) => setIsPinRequired(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </div>

          {isPinRequired && (
            <form onSubmit={handleUpdatePin} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '12px' }}>
                Change 4-Digit Passcode (Default: 1234)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Current PIN</label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    className="input"
                    value={oldPin}
                    onChange={(e) => setOldPin(e.target.value)}
                    placeholder="Current PIN"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">New PIN</label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    className="input"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="New 4-digit PIN"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New PIN</label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    className="input"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="Repeat new PIN"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-secondary btn-sm" style={{ marginTop: '8px' }}>
                Update Passcode
              </button>
            </form>
          )}
        </div>

        {/* Local Data Management & Backup */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-50)',
                color: 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Shield size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Data Backup & Reset</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Export full JSON backups or restore default demo phones for testing.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handleExportJSON}>
              <Download size={15} /> Export JSON Backup
            </button>

            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              <Upload size={15} /> Import JSON Backup
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                style={{ display: 'none' }}
              />
            </label>

            <button
              className="btn btn-subtle"
              onClick={() => {
                if (window.confirm('Reset local inventory to initial sample smartphones?')) {
                  resetToSampleData();
                }
              }}
              style={{ color: '#ef4444' }}
            >
              Reset to Sample Data
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
