import { EncryptionService } from './encryption.js';

export class StorageManager {
  constructor() {
    this.encryptionService = new EncryptionService();
    this.sessionKey = null;
    this.isUnlocked = false;
  }

  /**
   * Initialize vault with default settings
   */
  async initialize() {
    const data = await this.getStorageData();
    if (!data.initialized) {
      await this.setStorageData({
        initialized: true,
        keys: [],
        settings: this.getDefaultSettings(),
        auditLog: [],
        lastActivity: Date.now()
      });
    }
  }

  /**
   * Get default settings
   */
  getDefaultSettings() {
    return {
      autoLockMinutes: 15,
      clipboardClearSeconds: 30,
      theme: 'dark',
      showUsageStats: true,
      enableAutoFill: true,
      showExpirationWarnings: true,
      expirationWarningDays: 7,
      maskKeys: true,
      enableAuditLog: true
    };
  }

  /**
   * Unlock vault with master password
   */
  async unlockVault(masterPassword) {
    const isValid = await this.encryptionService.verifyMasterPassword(masterPassword);
    if (!isValid) {
      throw new Error('Invalid master password');
    }
    
    this.sessionKey = masterPassword;
    this.isUnlocked = true;
    await this.updateLastActivity();
    return true;
  }

  /**
   * Lock vault
   */
  async lockVault() {
    this.sessionKey = null;
    this.isUnlocked = false;
  }

  /**
   * Check if vault is unlocked
   */
  async isVaultUnlocked() {
    return this.isUnlocked;
  }

  /**
   * Get all keys (decrypted)
   */
  async getAllKeys() {
    if (!this.isUnlocked) {
      throw new Error('Vault is locked');
    }

    const data = await this.getStorageData();
    const keys = [];

    for (const key of data.keys || []) {
      try {
        const decryptedValue = await this.encryptionService.decryptData(
          key.keyValue,
          this.sessionKey
        );
        keys.push({
          ...key,
          keyValue: decryptedValue
        });
      } catch (error) {
        console.error(`Failed to decrypt key ${key.id}:`, error);
      }
    }

    // Sort by favorite, then by last used
    keys.sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return (b.lastUsed || 0) - (a.lastUsed || 0);
    });

    await this.updateLastActivity();
    return keys;
  }

  /**
   * Get single key by ID
   */
  async getKey(id) {
    if (!this.isUnlocked) {
      throw new Error('Vault is locked');
    }

    const data = await this.getStorageData();
    const key = data.keys.find(k => k.id === id);
    
    if (!key) {
      throw new Error('Key not found');
    }

    const decryptedValue = await this.encryptionService.decryptData(
      key.keyValue,
      this.sessionKey
    );

    await this.updateLastActivity();
    return {
      ...key,
      keyValue: decryptedValue
    };
  }

  /**
   * Add new key
   */
  async addKey(keyData) {
    if (!this.isUnlocked) {
      throw new Error('Vault is locked');
    }

    const encryptedValue = await this.encryptionService.encryptData(
      keyData.keyValue,
      this.sessionKey
    );

    const newKey = {
      id: this.generateId(),
      serviceName: keyData.serviceName,
      keyValue: encryptedValue,
      environment: keyData.environment || 'production',
      tags: keyData.tags || [],
      createdAt: Date.now(),
      lastUsed: null,
      usageCount: 0,
      expiresAt: keyData.expiresAt || null,
      notes: keyData.notes || '',
      domains: keyData.domains || [],
      color: keyData.color || this.getRandomColor(),
      favorite: keyData.favorite || false,
      rateLimit: keyData.rateLimit || '',
      estimatedCost: 0
    };

    const data = await this.getStorageData();
    if (!data.keys) {
      data.keys = [];
    }
    data.keys.push(newKey);
    await this.setStorageData(data);
    await this.updateLastActivity();

    return newKey.id;
  }

  /**
   * Update existing key
   */
  async updateKey(id, updates) {
    if (!this.isUnlocked) {
      throw new Error('Vault is locked');
    }

    const data = await this.getStorageData();
    const keyIndex = data.keys.findIndex(k => k.id === id);
    
    if (keyIndex === -1) {
      throw new Error('Key not found');
    }

    // If keyValue is being updated, encrypt it
    if (updates.keyValue) {
      updates.keyValue = await this.encryptionService.encryptData(
        updates.keyValue,
        this.sessionKey
      );
    }

    data.keys[keyIndex] = {
      ...data.keys[keyIndex],
      ...updates
    };

    await this.setStorageData(data);
    await this.updateLastActivity();
  }

  /**
   * Delete key
   */
  async deleteKey(id) {
    if (!this.isUnlocked) {
      throw new Error('Vault is locked');
    }

    const data = await this.getStorageData();
    data.keys = data.keys.filter(k => k.id !== id);
    await this.setStorageData(data);
    await this.updateLastActivity();
  }

  /**
   * Record key usage
   */
  async recordKeyUsage(id, domain) {
    if (!this.isUnlocked) {
      throw new Error('Vault is locked');
    }

    const data = await this.getStorageData();
    const key = data.keys.find(k => k.id === id);
    
    if (key) {
      key.lastUsed = Date.now();
      key.usageCount = (key.usageCount || 0) + 1;
      
      if (domain && !key.domains.includes(domain)) {
        key.domains.push(domain);
      }
      
      await this.setStorageData(data);
      await this.updateLastActivity();
    }
  }

  /**
   * Get settings
   */
  async getSettings() {
    const data = await this.getStorageData();
    return data.settings || this.getDefaultSettings();
  }

  /**
   * Update settings
   */
  async updateSettings(newSettings) {
    const data = await this.getStorageData();
    if (!data.settings) {
      data.settings = this.getDefaultSettings();
    }
    data.settings = {
      ...data.settings,
      ...newSettings
    };
    await this.setStorageData(data);
    return { success: true };
  }

  /**
   * Add audit log entry
   */
  async addAuditLog(action) {
    const data = await this.getStorageData();
    const settings = await this.getSettings();
    
    if (!settings.enableAuditLog) {
      return;
    }

    const entry = {
      id: this.generateId(),
      action,
      timestamp: Date.now()
    };

    data.auditLog = data.auditLog || [];
    data.auditLog.unshift(entry);
    
    // Keep only last 1000 entries
    if (data.auditLog.length > 1000) {
      data.auditLog = data.auditLog.slice(0, 1000);
    }

    await this.setStorageData(data);
  }

  /**
   * Get audit log
   */
  async getAuditLog(limit = 100) {
    const data = await this.getStorageData();
    return (data.auditLog || []).slice(0, limit);
  }

  /**
   * Export all data (encrypted)
   */
  async exportData() {
    if (!this.isUnlocked) {
      throw new Error('Vault is locked');
    }

    const data = await this.getStorageData();
    return {
      keys: data.keys,
      settings: data.settings,
      exportedAt: Date.now()
    };
  }

  /**
   * Import data
   */
  async importData(importedData) {
    if (!this.isUnlocked) {
      throw new Error('Vault is locked');
    }

    const data = await this.getStorageData();
    
    // Merge keys (avoid duplicates by service name)
    const existingServices = new Set(data.keys.map(k => k.serviceName));
    const newKeys = importedData.keys.filter(k => !existingServices.has(k.serviceName));
    
    data.keys = [...data.keys, ...newKeys];
    
    // Merge settings
    data.settings = {
      ...data.settings,
      ...importedData.settings
    };

    await this.setStorageData(data);
  }

  /**
   * Update last activity timestamp
   */
  async updateLastActivity() {
    const data = await this.getStorageData();
    data.lastActivity = Date.now();
    await this.setStorageData(data);
  }

  /**
   * Get last activity timestamp
   */
  async getLastActivity() {
    const data = await this.getStorageData();
    return data.lastActivity || Date.now();
  }

  /**
   * Get data from chrome storage
   */
  async getStorageData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['vaultData'], (result) => {
        resolve(result.vaultData || {});
      });
    });
  }

  /**
   * Set data to chrome storage
   */
  async setStorageData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ vaultData: data }, resolve);
    });
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get random color for key
   */
  getRandomColor() {
    const colors = [
      '#00A67E', '#0066FF', '#FF6B6B', '#FFA500', 
      '#9B59B6', '#1ABC9C', '#E74C3C', '#3498DB'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

