import { StorageManager } from './storage-manager.js';
import { EncryptionService } from './encryption.js';

const storageManager = new StorageManager();
const encryptionService = new EncryptionService();

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('KeyVault Pro installed');
    await initializeExtension();
  } else if (details.reason === 'update') {
    console.log('KeyVault Pro updated');
  }
});

async function initializeExtension() {
  // Create context menu
  chrome.contextMenus.create({
    id: 'fill-api-key',
    title: 'Fill API Key',
    contexts: ['editable']
  });

  // Set up auto-lock alarm
  chrome.alarms.create('check-auto-lock', { periodInMinutes: 1 });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'fill-api-key') {
    const isUnlocked = await storageManager.isVaultUnlocked();
    if (!isUnlocked) {
      // Open popup to unlock
      chrome.action.openPopup();
    } else {
      // Send message to content script to show key selector
      chrome.tabs.sendMessage(tab.id, {
        action: 'showKeySelector',
        position: { x: info.pageX, y: info.pageY }
      });
    }
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'fill-api-key') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const isUnlocked = await storageManager.isVaultUnlocked();
    
    if (!isUnlocked) {
      chrome.action.openPopup();
    } else {
      chrome.tabs.sendMessage(tab.id, { action: 'fillFocusedField' });
    }
  } else if (command === 'open-vault') {
    chrome.action.openPopup();
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender).then(sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(request, sender) {
  const { action, data } = request;

  switch (action) {
    case 'unlockVault':
      return await unlockVault(data.masterPassword);
    
    case 'lockVault':
      return await lockVault();
    
    case 'isVaultUnlocked':
      return await storageManager.isVaultUnlocked();
    
    case 'getKeys':
      return await getKeys(data?.filter);
    
    case 'getKeyById':
      return await getKeyById(data.id);
    
    case 'addKey':
      return await addKey(data.key);
    
    case 'updateKey':
      return await updateKey(data.id, data.updates);
    
    case 'deleteKey':
      return await deleteKey(data.id);
    
    case 'recordKeyUsage':
      return await recordKeyUsage(data.id, data.domain);
    
    case 'searchKeys':
      return await searchKeys(data.query);
    
    case 'getSettings':
      return await storageManager.getSettings();
    
    case 'updateSettings':
      return await storageManager.updateSettings(data.settings);
    
    case 'exportVault':
      return await exportVault(data.masterPassword);
    
    case 'importVault':
      return await importVault(data.encryptedData, data.masterPassword);
    
    case 'getAuditLog':
      return await storageManager.getAuditLog();
    
    case 'generateKey':
      return generateSecureKey(data.length || 32);
    
    default:
      return { success: false, error: 'Unknown action' };
  }
}

async function unlockVault(masterPassword) {
  try {
    const isValid = await encryptionService.verifyMasterPassword(masterPassword);
    if (!isValid) {
      return { success: false, error: 'Invalid master password' };
    }
    
    await storageManager.unlockVault(masterPassword);
    await storageManager.addAuditLog('Vault unlocked');
    
    // Set up auto-lock
    const settings = await storageManager.getSettings();
    if (settings.autoLockMinutes > 0) {
      chrome.alarms.create('auto-lock', { delayInMinutes: settings.autoLockMinutes });
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function lockVault() {
  await storageManager.lockVault();
  await storageManager.addAuditLog('Vault locked');
  chrome.alarms.clear('auto-lock');
  return { success: true };
}

async function getKeys(filter) {
  try {
    const keys = await storageManager.getAllKeys();
    let filteredKeys = keys;
    
    if (filter) {
      if (filter.domain) {
        filteredKeys = keys.filter(key => 
          key.domains && key.domains.includes(filter.domain)
        );
      }
      if (filter.favorite) {
        filteredKeys = filteredKeys.filter(key => key.favorite);
      }
      if (filter.environment) {
        filteredKeys = filteredKeys.filter(key => key.environment === filter.environment);
      }
    }
    
    return { success: true, keys: filteredKeys };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getKeyById(id) {
  try {
    const key = await storageManager.getKey(id);
    return { success: true, key };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function addKey(keyData) {
  try {
    const id = await storageManager.addKey(keyData);
    await storageManager.addAuditLog(`Key added: ${keyData.serviceName}`);
    return { success: true, id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function updateKey(id, updates) {
  try {
    await storageManager.updateKey(id, updates);
    await storageManager.addAuditLog(`Key updated: ${id}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function deleteKey(id) {
  try {
    const key = await storageManager.getKey(id);
    await storageManager.deleteKey(id);
    await storageManager.addAuditLog(`Key deleted: ${key.serviceName}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function recordKeyUsage(id, domain) {
  try {
    await storageManager.recordKeyUsage(id, domain);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function searchKeys(query) {
  try {
    const keys = await storageManager.getAllKeys();
    const lowerQuery = query.toLowerCase();
    
    const results = keys.filter(key => 
      key.serviceName.toLowerCase().includes(lowerQuery) ||
      key.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      key.notes.toLowerCase().includes(lowerQuery) ||
      key.environment.toLowerCase().includes(lowerQuery)
    );
    
    return { success: true, keys: results };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function exportVault(masterPassword) {
  try {
    const data = await storageManager.exportData();
    const encrypted = await encryptionService.encryptData(JSON.stringify(data), masterPassword);
    await storageManager.addAuditLog('Vault exported');
    return { success: true, data: encrypted };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function importVault(encryptedData, masterPassword) {
  try {
    const decrypted = await encryptionService.decryptData(encryptedData, masterPassword);
    const data = JSON.parse(decrypted);
    await storageManager.importData(data);
    await storageManager.addAuditLog('Vault imported');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function generateSecureKey(length) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  let key = '';
  for (let i = 0; i < length; i++) {
    key += charset[array[i] % charset.length];
  }
  
  return { success: true, key };
}

// Handle auto-lock alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'auto-lock') {
    await lockVault();
  } else if (alarm.name === 'check-auto-lock') {
    const isUnlocked = await storageManager.isVaultUnlocked();
    if (isUnlocked) {
      const lastActivity = await storageManager.getLastActivity();
      const settings = await storageManager.getSettings();
      const now = Date.now();
      
      if (now - lastActivity > settings.autoLockMinutes * 60 * 1000) {
        await lockVault();
      }
    }
  }
});

// Initialize on startup
initializeExtension();

