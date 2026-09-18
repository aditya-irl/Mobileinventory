import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PERMANENT_GOOGLE_APPS_SCRIPT_URL, DEFAULT_GOOGLE_APPS_SCRIPT_URL } from '../services/api';
import { ChangePinModal } from '../components/settings/ChangePinModal';

import {
  Settings as SettingsIcon,
  Database,
  Cloud,
  Lock,
  LogOut,
  Store,
  DollarSign,
  Shield,
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  ExternalLink,
  HelpCircle,
  Copy,
  Check,
  KeyRound
} from 'lucide-react';

export const Settings = () => {
  const {
    settings,
    updateSettings,
    storageMode,
    connectionStatus,
    switchToLocalStorage,
    retryConnection,
    testConnection,
    inventory,
    resetToSampleData
  } = useInventory();
  const { currentUser, logout, authEmail } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [apiUrl] = useState(PERMANENT_GOOGLE_APPS_SCRIPT_URL);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [storeName, setStoreName] = useState(settings.storeName || 'PhoneVault Pro');
  const [currency, setCurrency] = useState(settings.currency || '₹');

  const [testingConnection, setTestingConnection] = useState(false);
  const [localTestResult, setLocalTestResult] = useState(null);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);

  // Copy API URL to clipboard
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(PERMANENT_GOOGLE_APPS_SCRIPT_URL);
      setCopiedUrl(true);
      showSuccess('Google Apps Script Web App URL copied to clipboard!', 'Copied');
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch (e) {
      showError('Failed to copy to clipboard.');
    }
  };

  // Test connection to permanent Google Apps Script
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setLocalTestResult(null);

    try {
      const res = await testConnection(PERMANENT_GOOGLE_APPS_SCRIPT_URL);
      if (res.success) {
        const msg = res.message || 'Google Sheets + Drive Database Active';
        setLocalTestResult({
          success: true,
          mode: 'google',
          message: `Google Cloud Connected — ${msg}`
        });
        showSuccess('Google Cloud Connected successfully!', 'Connected');
      } else {
        const errMsg = res.error || 'Connection failed. Please check permissions.';
        setLocalTestResult({
          success: false,
          mode: 'google',
          error: `Connection Failed: ${errMsg}`
        });
        showError(errMsg, 'Connection Failed');
      }
    } catch (err) {
      const errMsg = err.message || 'Connection failed';
      setLocalTestResult({
        success: false,
        mode: 'google',
        error: `Connection Failed: ${errMsg}`
      });
      showError(errMsg, 'Connection Failed');
    } finally {
      setTestingConnection(false);
    }
  };

  // Save general settings
  const handleSaveSettings = (e) => {
    if (e) e.preventDefault();
    setLocalTestResult(null);

    updateSettings({
      apiUrl: PERMANENT_GOOGLE_APPS_SCRIPT_URL,
      storageMode: 'google',
      storeName: storeName.trim(),
      currency: currency.trim()
    });

    showSuccess('Configuration saved! Synchronizing with Google Cloud...', 'Settings Saved');
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
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

            {/* Top Right Mode / Connection Badge */}
            {storageMode === 'google' ? (
              connectionStatus?.state === 'connected' ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--status-available-bg)',
                    color: 'var(--status-available-text)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: '1px solid var(--status-available-border)'
                  }}
                >
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
                  <span>Google Cloud Connected</span>
                </div>
              ) : connectionStatus?.state === 'checking' ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(234, 179, 8, 0.15)',
                    color: '#eab308',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: '1px solid rgba(234, 179, 8, 0.3)'
                  }}
                >
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#eab308', display: 'inline-block' }} />
                  <RotateCw size={12} className="animate-spin" />
                  <span>Connecting...</span>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--status-danger-bg)',
                    color: 'var(--status-danger-text)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: '1px solid var(--status-danger-border)'
                  }}
                >
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }} />
                  <span>Connection Failed</span>
                </div>
              )
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--text-muted)', display: 'inline-block' }} />
                <span>Local Storage Mode</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Google Apps Script Web App Deployment URL</span>
                <span
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  <Lock size={10} /> Locked & Connected
                </span>
              </label>

              <button
                type="button"
                onClick={handleCopyUrl}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-600)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {copiedUrl ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                <span>{copiedUrl ? 'Copied URL!' : 'Copy URL'}</span>
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                readOnly
                className="input"
                value={PERMANENT_GOOGLE_APPS_SCRIPT_URL}
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-secondary)',
                  cursor: 'default',
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  paddingRight: '36px'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
                title="Endpoint permanently locked"
              >
                <Lock size={14} />
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              This Google Cloud Apps Script API endpoint is permanent and locked for PhoneVault Pro.
            </div>
          </div>

          {/* Test Connection Result Banner (when Test button clicked) */}
          {localTestResult && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: localTestResult.success ? 'var(--status-available-bg)' : 'var(--status-danger-bg)',
                border: `1px solid ${localTestResult.success ? 'var(--status-available-border)' : 'var(--status-danger-border)'}`,
                color: localTestResult.success ? 'var(--status-available-text)' : 'var(--status-danger-text)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                marginTop: '12px'
              }}
            >
              {localTestResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{localTestResult.message || localTestResult.error}</span>
            </div>
          )}

          {/* Live Backend Connection Status Banner (when not overriding with test result) */}
          {!localTestResult && (
            <div style={{ marginTop: '12px' }}>
              {storageMode === 'google' ? (
                connectionStatus?.state === 'connected' ? (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--status-available-bg)',
                      border: '1px solid var(--status-available-border)',
                      color: 'var(--status-available-text)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.8125rem',
                      fontWeight: 600
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Google Sheets + Drive Database Active</span>
                  </div>
                ) : connectionStatus?.state === 'checking' ? (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(234, 179, 8, 0.1)',
                      border: '1px solid rgba(234, 179, 8, 0.3)',
                      color: '#eab308',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.8125rem',
                      fontWeight: 600
                    }}
                  >
                    <RotateCw size={16} className="animate-spin" />
                    <span>Connecting to Google Cloud backend...</span>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--status-danger-bg)',
                      border: '1px solid var(--status-danger-border)',
                      color: 'var(--status-danger-text)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      fontSize: '0.8125rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                      <AlertCircle size={16} />
                      <span>Google Cloud Connection Failed</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', opacity: 0.9, lineHeight: 1.4 }}>
                      {connectionStatus?.error || 'Unable to connect to Google Sheets backend. Verify that the URL is correct and deployed with access set to Anyone.'}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={retryConnection}
                        style={{ fontSize: '0.75rem', height: '30px', padding: '0 10px' }}
                      >
                        <RotateCw size={13} /> Retry Connection
                      </button>
                      <button
                        type="button"
                        className="btn btn-subtle btn-sm"
                        onClick={switchToLocalStorage}
                        style={{ fontSize: '0.75rem', height: '30px', padding: '0 10px' }}
                      >
                        Continue in Local Storage Mode
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8125rem',
                    fontWeight: 600
                  }}
                >
                  <HardDrive size={16} />
                  <span>Local Storage Database Active</span>
                </div>
              )}
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

        {/* Security / Firebase Authentication Section */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
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
                <ShieldCheck size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Security</h3>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      color: 'var(--primary-600)',
                      border: '1px solid rgba(99, 102, 241, 0.2)'
                    }}
                  >
                    Firebase Authentication
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Manage PIN credentials and secure inventory access.
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--status-available-bg)',
                border: '1px solid var(--status-available-border)',
                color: 'var(--status-available-text)',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              <CheckCircle2 size={13} />
              <span>Session Active & Verified</span>
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Account
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace', marginTop: '2px' }}>
                  {currentUser?.email || authEmail || 'rathoremobiles07@gmail.com'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsChangePinOpen(true)}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <KeyRound size={15} />
                <span>Change PIN</span>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Firebase Project: <strong style={{ color: 'var(--text-primary)' }}>rathore-mobiles-45ca8</strong>
              </div>

              <button
                type="button"
                onClick={logout}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
              >
                <LogOut size={14} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
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

      {/* Change PIN Modal Dialog */}
      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
        onSuccess={() => {
          showSuccess('PIN changed successfully.', 'PIN Updated');
        }}
      />
    </div>
  );
};
