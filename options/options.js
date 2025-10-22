// KeyVault Pro Options Page Script

class OptionsPage {
  constructor() {
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById('save-btn').addEventListener('click', () => this.saveSettings());
    document.getElementById('export-btn').addEventListener('click', () => this.exportVault());
    document.getElementById('import-btn').addEventListener('click', () => this.importVault());
    document.getElementById('audit-log-btn').addEventListener('click', () => this.viewAuditLog());
  }

  async loadSettings() {
    const response = await this.sendMessage({ action: 'getSettings' });
    
    if (response) {
      document.getElementById('auto-lock').value = response.autoLockMinutes || 15;
      document.getElementById('clipboard-clear').value = response.clipboardClearSeconds || 30;
      document.getElementById('mask-keys').checked = response.maskKeys !== false;
      document.getElementById('enable-audit').checked = response.enableAuditLog !== false;
      document.getElementById('enable-autofill').checked = response.enableAutoFill !== false;
      document.getElementById('show-stats').checked = response.showUsageStats !== false;
      document.getElementById('show-warnings').checked = response.showExpirationWarnings !== false;
      document.getElementById('warning-days').value = response.expirationWarningDays || 7;
      document.getElementById('theme').value = response.theme || 'dark';
    }
  }

  async saveSettings() {
    const settings = {
      autoLockMinutes: parseInt(document.getElementById('auto-lock').value),
      clipboardClearSeconds: parseInt(document.getElementById('clipboard-clear').value),
      maskKeys: document.getElementById('mask-keys').checked,
      enableAuditLog: document.getElementById('enable-audit').checked,
      enableAutoFill: document.getElementById('enable-autofill').checked,
      showUsageStats: document.getElementById('show-stats').checked,
      showExpirationWarnings: document.getElementById('show-warnings').checked,
      expirationWarningDays: parseInt(document.getElementById('warning-days').value),
      theme: document.getElementById('theme').value
    };

    const response = await this.sendMessage({
      action: 'updateSettings',
      data: { settings }
    });

    if (response && response.success) {
      this.showStatus('Settings saved successfully!');
    } else {
      this.showStatus('Failed to save settings', true);
    }
  }

  async exportVault() {
    const password = prompt('Enter master password to export vault:');
    if (!password) return;

    const response = await this.sendMessage({
      action: 'exportVault',
      data: { masterPassword: password }
    });

    if (response && response.success) {
      const blob = new Blob([response.data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keyvault-backup-${Date.now()}.kvp`;
      a.click();
      URL.revokeObjectURL(url);
      this.showStatus('Vault exported successfully!');
    } else {
      this.showStatus('Failed to export vault', true);
    }
  }

  async importVault() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.kvp';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const password = prompt('Enter master password to decrypt vault:');
      if (!password) return;

      const text = await file.text();

      const response = await this.sendMessage({
        action: 'importVault',
        data: { encryptedData: text, masterPassword: password }
      });

      if (response && response.success) {
        this.showStatus('Vault imported successfully!');
      } else {
        this.showStatus('Failed to import vault', true);
      }
    };

    input.click();
  }

  async viewAuditLog() {
    const response = await this.sendMessage({ action: 'getAuditLog' });

    if (response && response.length > 0) {
      const logs = response.map(log =>
        `${new Date(log.timestamp).toLocaleString()}: ${log.action}`
      ).join('\n');

      alert('Audit Log:\n\n' + logs);
    } else {
      alert('No audit log entries found.');
    }
  }

  showStatus(message, isError = false) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = isError ? 'status error' : 'status';

    setTimeout(() => {
      status.textContent = '';
    }, 3000);
  }

  async sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        resolve(response);
      });
    });
  }
}

// Initialize options page
const optionsPage = new OptionsPage();

