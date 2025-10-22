// KeyVault Pro Popup Script

class KeyVaultPopup {
  constructor() {
    this.currentScreen = 'unlock';
    this.keys = [];
    this.filteredKeys = [];
    this.currentFilter = 'all';
    this.editingKeyId = null;
    this.settings = {};
    
    this.init();
  }

  async init() {
    // Check if vault is unlocked
    const response = await this.sendMessage({ action: 'isVaultUnlocked' });
    
    if (response) {
      await this.showMainScreen();
    } else {
      this.showUnlockScreen();
    }

    this.setupEventListeners();
    await this.loadSettings();
    this.applyTheme();
  }

  setupEventListeners() {
    // Unlock screen
    document.getElementById('unlock-btn').addEventListener('click', () => this.unlockVault());
    document.getElementById('master-password').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.unlockVault();
    });

    // Main screen
    document.getElementById('lock-btn').addEventListener('click', () => this.lockVault());
    document.getElementById('settings-btn').addEventListener('click', () => this.showSettingsScreen());
    document.getElementById('add-key-btn').addEventListener('click', () => this.showKeyForm());
    document.getElementById('add-first-key-btn').addEventListener('click', () => this.showKeyForm());
    document.getElementById('search-input').addEventListener('input', (e) => this.searchKeys(e.target.value));

    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
    });

    // Key form
    document.getElementById('back-btn').addEventListener('click', () => this.showMainScreen());
    document.getElementById('cancel-form-btn').addEventListener('click', () => this.showMainScreen());
    document.getElementById('key-form').addEventListener('submit', (e) => this.saveKey(e));
    document.getElementById('toggle-key-visibility').addEventListener('click', () => this.toggleKeyVisibility());
    document.getElementById('generate-key-btn').addEventListener('click', () => this.generateRandomKey());

    // Settings
    document.getElementById('settings-back-btn').addEventListener('click', () => this.showMainScreen());
    document.getElementById('save-settings-btn').addEventListener('click', () => this.saveSettings());
    document.getElementById('export-vault-btn').addEventListener('click', () => this.exportVault());
    document.getElementById('import-vault-btn').addEventListener('click', () => this.importVault());
    document.getElementById('view-audit-log-btn').addEventListener('click', () => this.viewAuditLog());
  }

  async sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        resolve(response);
      });
    });
  }

  showUnlockScreen() {
    this.hideAllScreens();
    document.getElementById('unlock-screen').style.display = 'flex';
    document.getElementById('master-password').focus();
  }

  async showMainScreen() {
    this.hideAllScreens();
    document.getElementById('main-screen').style.display = 'flex';
    await this.loadKeys();
  }

  showKeyForm(keyId = null) {
    this.hideAllScreens();
    document.getElementById('key-form-screen').style.display = 'flex';
    
    if (keyId) {
      this.editingKeyId = keyId;
      document.getElementById('form-title').textContent = 'Edit Key';
      this.loadKeyIntoForm(keyId);
    } else {
      this.editingKeyId = null;
      document.getElementById('form-title').textContent = 'Add New Key';
      document.getElementById('key-form').reset();
    }
  }

  showSettingsScreen() {
    this.hideAllScreens();
    document.getElementById('settings-screen').style.display = 'flex';
    this.loadSettingsIntoForm();
  }

  hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.style.display = 'none';
    });
  }

  async unlockVault() {
    const password = document.getElementById('master-password').value;
    const errorDiv = document.getElementById('unlock-error');
    
    if (!password) {
      errorDiv.textContent = 'Please enter a password';
      errorDiv.style.display = 'block';
      return;
    }

    const response = await this.sendMessage({
      action: 'unlockVault',
      data: { masterPassword: password }
    });

    if (response.success) {
      errorDiv.style.display = 'none';
      document.getElementById('master-password').value = '';
      await this.showMainScreen();
    } else {
      errorDiv.textContent = response.error || 'Failed to unlock vault';
      errorDiv.style.display = 'block';
    }
  }

  async lockVault() {
    await this.sendMessage({ action: 'lockVault' });
    this.keys = [];
    this.showUnlockScreen();
  }

  async loadKeys() {
    const response = await this.sendMessage({ action: 'getKeys' });
    
    if (response.success) {
      this.keys = response.keys;
      this.applyFilter();
    }
  }

  applyFilter() {
    switch (this.currentFilter) {
      case 'favorites':
        this.filteredKeys = this.keys.filter(k => k.favorite);
        break;
      case 'recent':
        this.filteredKeys = [...this.keys].sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0)).slice(0, 10);
        break;
      default:
        this.filteredKeys = this.keys;
    }
    
    this.renderKeys();
  }

  setFilter(filter) {
    this.currentFilter = filter;
    
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.filter === filter);
    });
    
    this.applyFilter();
  }

  searchKeys(query) {
    if (!query) {
      this.filteredKeys = this.keys;
    } else {
      const lowerQuery = query.toLowerCase();
      this.filteredKeys = this.keys.filter(key =>
        key.serviceName.toLowerCase().includes(lowerQuery) ||
        key.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        key.environment.toLowerCase().includes(lowerQuery) ||
        key.notes.toLowerCase().includes(lowerQuery)
      );
    }
    
    this.renderKeys();
  }

  renderKeys() {
    const keysList = document.getElementById('keys-list');
    const emptyState = document.getElementById('empty-state');
    
    if (this.filteredKeys.length === 0) {
      keysList.innerHTML = '';
      emptyState.style.display = 'flex';
      return;
    }
    
    emptyState.style.display = 'none';
    keysList.innerHTML = '';
    
    this.filteredKeys.forEach(key => {
      const keyItem = this.createKeyItem(key);
      keysList.appendChild(keyItem);
    });
  }

  createKeyItem(key) {
    const div = document.createElement('div');
    div.className = 'key-item';
    
    const maskedValue = this.settings.maskKeys ? '••••••••••••' : key.keyValue.substring(0, 20) + '...';
    
    const expirationWarning = this.getExpirationWarning(key);
    
    div.innerHTML = `
      <div class="key-item-header">
        <div class="key-color-indicator" style="background: ${key.color}"></div>
        <div class="key-info">
          <div class="key-name">
            ${this.escapeHtml(key.serviceName)}
            ${key.favorite ? ' ⭐' : ''}
          </div>
          <div class="key-meta">
            <span>${key.environment}</span>
            ${this.settings.showUsageStats ? `<span>Used ${key.usageCount || 0} times</span>` : ''}
            ${key.lastUsed ? `<span>Last: ${this.formatDate(key.lastUsed)}</span>` : ''}
          </div>
        </div>
      </div>
      
      ${key.tags.length > 0 ? `
        <div class="key-tags">
          ${key.tags.map(tag => `<span class="key-tag">${this.escapeHtml(tag)}</span>`).join('')}
        </div>
      ` : ''}
      
      <div class="key-value-preview">${maskedValue}</div>
      
      ${expirationWarning ? `<div class="expiration-warning">${expirationWarning}</div>` : ''}
      
      <div class="key-actions">
        <button class="key-action-btn" data-action="copy">Copy</button>
        <button class="key-action-btn" data-action="edit">Edit</button>
        <button class="key-action-btn" data-action="delete">Delete</button>
      </div>
    `;
    
    // Add event listeners
    div.querySelector('[data-action="copy"]').addEventListener('click', (e) => {
      e.stopPropagation();
      this.copyKey(key);
    });
    
    div.querySelector('[data-action="edit"]').addEventListener('click', (e) => {
      e.stopPropagation();
      this.showKeyForm(key.id);
    });
    
    div.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteKey(key.id);
    });
    
    return div;
  }

  getExpirationWarning(key) {
    if (!key.expiresAt || !this.settings.showExpirationWarnings) {
      return null;
    }
    
    const now = Date.now();
    const expiresAt = new Date(key.expiresAt).getTime();
    const daysUntilExpiration = Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration < 0) {
      return '⚠️ Expired';
    } else if (daysUntilExpiration <= this.settings.expirationWarningDays) {
      return `⚠️ Expires in ${daysUntilExpiration} days`;
    }
    
    return null;
  }

  async copyKey(key) {
    try {
      await navigator.clipboard.writeText(key.keyValue);
      this.showNotification('Key copied to clipboard');
      
      // Clear clipboard after timeout
      if (this.settings.clipboardClearSeconds > 0) {
        setTimeout(async () => {
          const current = await navigator.clipboard.readText();
          if (current === key.keyValue) {
            await navigator.clipboard.writeText('');
          }
        }, this.settings.clipboardClearSeconds * 1000);
      }
      
      // Record usage
      await this.sendMessage({
        action: 'recordKeyUsage',
        data: { id: key.id, domain: '' }
      });
    } catch (error) {
      this.showNotification('Failed to copy key', 'error');
    }
  }

  async deleteKey(keyId) {
    if (!confirm('Are you sure you want to delete this key?')) {
      return;
    }
    
    const response = await this.sendMessage({
      action: 'deleteKey',
      data: { id: keyId }
    });
    
    if (response.success) {
      this.showNotification('Key deleted');
      await this.loadKeys();
    } else {
      this.showNotification('Failed to delete key', 'error');
    }
  }

  async loadKeyIntoForm(keyId) {
    const response = await this.sendMessage({
      action: 'getKeyById',
      data: { id: keyId }
    });
    
    if (response.success) {
      const key = response.key;
      document.getElementById('service-name').value = key.serviceName;
      document.getElementById('api-key-value').value = key.keyValue;
      document.getElementById('environment').value = key.environment;
      document.getElementById('tags').value = key.tags.join(', ');
      document.getElementById('domains').value = key.domains.join(', ');
      document.getElementById('rate-limit').value = key.rateLimit || '';
      document.getElementById('notes').value = key.notes || '';
      document.getElementById('favorite').checked = key.favorite;
      
      if (key.expiresAt) {
        const date = new Date(key.expiresAt);
        document.getElementById('expires-at').value = date.toISOString().split('T')[0];
      }
    }
  }

  async saveKey(e) {
    e.preventDefault();
    
    const keyData = {
      serviceName: document.getElementById('service-name').value,
      keyValue: document.getElementById('api-key-value').value,
      environment: document.getElementById('environment').value,
      tags: document.getElementById('tags').value.split(',').map(t => t.trim()).filter(t => t),
      domains: document.getElementById('domains').value.split(',').map(d => d.trim()).filter(d => d),
      rateLimit: document.getElementById('rate-limit').value,
      notes: document.getElementById('notes').value,
      favorite: document.getElementById('favorite').checked
    };
    
    const expiresAt = document.getElementById('expires-at').value;
    if (expiresAt) {
      keyData.expiresAt = new Date(expiresAt).getTime();
    }
    
    let response;
    if (this.editingKeyId) {
      response = await this.sendMessage({
        action: 'updateKey',
        data: { id: this.editingKeyId, updates: keyData }
      });
    } else {
      response = await this.sendMessage({
        action: 'addKey',
        data: { key: keyData }
      });
    }
    
    if (response.success) {
      this.showNotification(this.editingKeyId ? 'Key updated' : 'Key added');
      await this.showMainScreen();
    } else {
      this.showNotification('Failed to save key', 'error');
    }
  }

  toggleKeyVisibility() {
    const input = document.getElementById('api-key-value');
    const btn = document.getElementById('toggle-key-visibility');
    
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = '🙈';
    } else {
      input.type = 'password';
      btn.textContent = '👁️';
    }
  }

  async generateRandomKey() {
    const response = await this.sendMessage({
      action: 'generateKey',
      data: { length: 32 }
    });
    
    if (response.success) {
      document.getElementById('api-key-value').value = response.key;
      this.showNotification('Random key generated');
    }
  }

  async loadSettings() {
    const response = await this.sendMessage({ action: 'getSettings' });
    if (response) {
      this.settings = response;
    }
  }

  loadSettingsIntoForm() {
    document.getElementById('auto-lock-minutes').value = this.settings.autoLockMinutes || 15;
    document.getElementById('clipboard-clear-seconds').value = this.settings.clipboardClearSeconds || 30;
    document.getElementById('mask-keys').checked = this.settings.maskKeys !== false;
    document.getElementById('enable-audit-log').checked = this.settings.enableAuditLog !== false;
    document.getElementById('enable-auto-fill').checked = this.settings.enableAutoFill !== false;
    document.getElementById('show-usage-stats').checked = this.settings.showUsageStats !== false;
    document.getElementById('show-expiration-warnings').checked = this.settings.showExpirationWarnings !== false;
    document.getElementById('expiration-warning-days').value = this.settings.expirationWarningDays || 7;
    document.getElementById('theme').value = this.settings.theme || 'dark';
  }

  async saveSettings() {
    const newSettings = {
      autoLockMinutes: parseInt(document.getElementById('auto-lock-minutes').value),
      clipboardClearSeconds: parseInt(document.getElementById('clipboard-clear-seconds').value),
      maskKeys: document.getElementById('mask-keys').checked,
      enableAuditLog: document.getElementById('enable-audit-log').checked,
      enableAutoFill: document.getElementById('enable-auto-fill').checked,
      showUsageStats: document.getElementById('show-usage-stats').checked,
      showExpirationWarnings: document.getElementById('show-expiration-warnings').checked,
      expirationWarningDays: parseInt(document.getElementById('expiration-warning-days').value),
      theme: document.getElementById('theme').value
    };
    
    const response = await this.sendMessage({
      action: 'updateSettings',
      data: { settings: newSettings }
    });
    
    if (response.success) {
      this.settings = newSettings;
      this.applyTheme();
      this.showNotification('Settings saved');
      await this.showMainScreen();
    } else {
      this.showNotification('Failed to save settings', 'error');
    }
  }

  applyTheme() {
    const theme = this.settings.theme || 'dark';
    
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else if (theme === 'light') {
      document.body.classList.remove('dark-theme');
    } else if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.classList.toggle('dark-theme', prefersDark);
    }
  }

  async exportVault() {
    const password = prompt('Enter master password to export vault:');
    if (!password) return;
    
    const response = await this.sendMessage({
      action: 'exportVault',
      data: { masterPassword: password }
    });
    
    if (response.success) {
      const blob = new Blob([response.data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keyvault-backup-${Date.now()}.kvp`;
      a.click();
      URL.revokeObjectURL(url);
      this.showNotification('Vault exported');
    } else {
      this.showNotification('Failed to export vault', 'error');
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
      
      if (response.success) {
        this.showNotification('Vault imported');
        await this.loadKeys();
      } else {
        this.showNotification('Failed to import vault', 'error');
      }
    };
    
    input.click();
  }

  async viewAuditLog() {
    const response = await this.sendMessage({ action: 'getAuditLog' });
    
    if (response) {
      const logs = response.map(log => 
        `${new Date(log.timestamp).toLocaleString()}: ${log.action}`
      ).join('\n');
      
      alert('Audit Log:\n\n' + logs);
    }
  }

  showNotification(message, type = 'success') {
    // Simple notification - could be enhanced
    console.log(`[${type}] ${message}`);
  }

  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize popup
const popup = new KeyVaultPopup();

