// Content script for KeyVault Pro
// Detects API key fields and handles auto-fill

class KeyVaultContent {
  constructor() {
    this.detectedFields = [];
    this.currentDomain = window.location.hostname;
    this.keySelectorOverlay = null;
    this.focusedField = null;
    
    this.init();
  }

  init() {
    // Detect fields on page load
    this.detectApiKeyFields();
    
    // Monitor DOM changes
    this.observeDOMChanges();
    
    // Listen for focus events
    this.setupFieldListeners();
    
    // Listen for messages from background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true;
    });
    
    console.log('KeyVault Pro: Content script initialized');
  }

  /**
   * Detect API key input fields on the page
   */
  detectApiKeyFields() {
    const inputs = document.querySelectorAll('input[type="text"], input[type="password"], input:not([type]), textarea');
    this.detectedFields = [];

    inputs.forEach(input => {
      if (this.isApiKeyField(input)) {
        this.detectedFields.push(input);
        this.markField(input);
      }
    });

    console.log(`KeyVault Pro: Detected ${this.detectedFields.length} API key fields`);
  }

  /**
   * Check if input field is likely an API key field
   */
  isApiKeyField(input) {
    // Check input attributes
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    const placeholder = (input.placeholder || '').toLowerCase();
    const ariaLabel = (input.getAttribute('aria-label') || '').toLowerCase();
    
    // Common API key field patterns
    const patterns = [
      'api', 'key', 'token', 'secret', 'credential',
      'auth', 'bearer', 'access', 'client_id', 'client_secret',
      'apikey', 'api_key', 'api-key'
    ];

    const fieldText = `${name} ${id} ${placeholder} ${ariaLabel}`;
    
    if (patterns.some(pattern => fieldText.includes(pattern))) {
      return true;
    }

    // Check associated label
    const label = this.getFieldLabel(input);
    if (label && patterns.some(pattern => label.toLowerCase().includes(pattern))) {
      return true;
    }

    return false;
  }

  /**
   * Get label text for input field
   */
  getFieldLabel(input) {
    // Check for label with for attribute
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) return label.textContent;
    }

    // Check for parent label
    const parentLabel = input.closest('label');
    if (parentLabel) return parentLabel.textContent;

    // Check for previous sibling label
    const prevSibling = input.previousElementSibling;
    if (prevSibling && prevSibling.tagName === 'LABEL') {
      return prevSibling.textContent;
    }

    return null;
  }

  /**
   * Mark field as detected (add icon)
   */
  markField(input) {
    // Add data attribute
    input.setAttribute('data-keyvault-detected', 'true');
    
    // Add visual indicator (small icon)
    if (!input.nextElementSibling || !input.nextElementSibling.classList.contains('keyvault-icon')) {
      const icon = document.createElement('span');
      icon.className = 'keyvault-icon';
      icon.title = 'KeyVault Pro: Click to fill API key';
      icon.innerHTML = '🔑';
      icon.style.cssText = `
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        cursor: pointer;
        font-size: 16px;
        z-index: 10000;
        user-select: none;
      `;
      
      // Make parent position relative if needed
      const parent = input.parentElement;
      if (window.getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative';
      }
      
      icon.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showKeySelector(input);
      });
      
      input.parentElement.insertBefore(icon, input.nextSibling);
    }
  }

  /**
   * Setup field focus listeners
   */
  setupFieldListeners() {
    document.addEventListener('focusin', (e) => {
      if (e.target.matches('input, textarea')) {
        this.focusedField = e.target;
        
        if (this.isApiKeyField(e.target)) {
          // Could show inline suggestion here
        }
      }
    });

    document.addEventListener('focusout', (e) => {
      if (e.target === this.focusedField) {
        this.focusedField = null;
      }
    });
  }

  /**
   * Observe DOM changes for dynamically added fields
   */
  observeDOMChanges() {
    const observer = new MutationObserver((mutations) => {
      let shouldRedetect = false;
      
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldRedetect = true;
          break;
        }
      }
      
      if (shouldRedetect) {
        // Debounce redetection
        clearTimeout(this.redetectTimeout);
        this.redetectTimeout = setTimeout(() => {
          this.detectApiKeyFields();
        }, 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Show key selector overlay
   */
  async showKeySelector(targetField) {
    this.focusedField = targetField;
    
    // Check if vault is unlocked
    const response = await chrome.runtime.sendMessage({ action: 'isVaultUnlocked' });
    
    if (!response) {
      this.showNotification('Please unlock KeyVault Pro first', 'warning');
      chrome.runtime.sendMessage({ action: 'openPopup' });
      return;
    }

    // Get keys for current domain
    const keysResponse = await chrome.runtime.sendMessage({
      action: 'getKeys',
      data: { filter: { domain: this.currentDomain } }
    });

    if (!keysResponse.success) {
      this.showNotification('Failed to load keys', 'error');
      return;
    }

    let keys = keysResponse.keys;
    
    // If no domain-specific keys, get all keys
    if (keys.length === 0) {
      const allKeysResponse = await chrome.runtime.sendMessage({ action: 'getKeys' });
      keys = allKeysResponse.success ? allKeysResponse.keys : [];
    }

    if (keys.length === 0) {
      this.showNotification('No API keys found. Add keys in KeyVault Pro.', 'info');
      return;
    }

    this.displayKeySelector(keys, targetField);
  }

  /**
   * Display key selector overlay
   */
  displayKeySelector(keys, targetField) {
    // Remove existing overlay
    if (this.keySelectorOverlay) {
      this.keySelectorOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.className = 'keyvault-selector-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const selector = document.createElement('div');
    selector.className = 'keyvault-selector';
    selector.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 20px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    const title = document.createElement('h3');
    title.textContent = 'Select API Key';
    title.style.cssText = 'margin: 0 0 15px 0; color: #333;';

    const searchBox = document.createElement('input');
    searchBox.type = 'text';
    searchBox.placeholder = 'Search keys...';
    searchBox.style.cssText = `
      width: 100%;
      padding: 10px;
      margin-bottom: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
    `;

    const keyList = document.createElement('div');
    keyList.className = 'keyvault-key-list';

    const renderKeys = (filteredKeys) => {
      keyList.innerHTML = '';
      
      if (filteredKeys.length === 0) {
        keyList.innerHTML = '<p style="color: #666; text-align: center;">No keys found</p>';
        return;
      }

      filteredKeys.forEach(key => {
        const keyItem = document.createElement('div');
        keyItem.className = 'keyvault-key-item';
        keyItem.style.cssText = `
          padding: 12px;
          margin-bottom: 8px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
        `;
        
        keyItem.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 4px; height: 40px; background: ${key.color}; border-radius: 2px;"></div>
            <div style="flex: 1;">
              <div style="font-weight: 600; color: #333; margin-bottom: 4px;">
                ${this.escapeHtml(key.serviceName)}
                ${key.favorite ? ' ⭐' : ''}
              </div>
              <div style="font-size: 12px; color: #666;">
                ${key.environment} • Used ${key.usageCount || 0} times
              </div>
            </div>
          </div>
        `;

        keyItem.addEventListener('mouseenter', () => {
          keyItem.style.background = '#f5f5f5';
          keyItem.style.borderColor = key.color;
        });

        keyItem.addEventListener('mouseleave', () => {
          keyItem.style.background = 'white';
          keyItem.style.borderColor = '#e0e0e0';
        });

        keyItem.addEventListener('click', () => {
          this.fillKey(key, targetField);
          overlay.remove();
        });

        keyList.appendChild(keyItem);
      });
    };

    renderKeys(keys);

    searchBox.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = keys.filter(key => 
        key.serviceName.toLowerCase().includes(query) ||
        key.tags.some(tag => tag.toLowerCase().includes(query)) ||
        key.environment.toLowerCase().includes(query)
      );
      renderKeys(filtered);
    });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Cancel';
    closeBtn.style.cssText = `
      margin-top: 15px;
      padding: 10px 20px;
      background: #f0f0f0;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      width: 100%;
      font-size: 14px;
    `;
    closeBtn.addEventListener('click', () => overlay.remove());

    selector.appendChild(title);
    selector.appendChild(searchBox);
    selector.appendChild(keyList);
    selector.appendChild(closeBtn);
    overlay.appendChild(selector);

    document.body.appendChild(overlay);
    this.keySelectorOverlay = overlay;

    // Close on outside click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    // Focus search box
    searchBox.focus();
  }

  /**
   * Fill key into target field
   */
  async fillKey(key, targetField) {
    if (!targetField) return;

    // Set value
    targetField.value = key.keyValue;
    
    // Trigger input events
    targetField.dispatchEvent(new Event('input', { bubbles: true }));
    targetField.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Focus field
    targetField.focus();

    // Record usage
    await chrome.runtime.sendMessage({
      action: 'recordKeyUsage',
      data: { id: key.id, domain: this.currentDomain }
    });

    this.showNotification(`Filled: ${key.serviceName}`, 'success');
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'keyvault-notification';
    
    const colors = {
      success: '#00A67E',
      error: '#E74C3C',
      warning: '#FFA500',
      info: '#3498DB'
    };

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 15px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      z-index: 1000000;
      font-size: 14px;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Handle messages from background
   */
  async handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'showKeySelector':
        if (this.focusedField) {
          await this.showKeySelector(this.focusedField);
        }
        sendResponse({ success: true });
        break;

      case 'fillFocusedField':
        if (this.focusedField) {
          await this.showKeySelector(this.focusedField);
        }
        sendResponse({ success: true });
        break;

      case 'detectFields':
        this.detectApiKeyFields();
        sendResponse({ success: true, count: this.detectedFields.length });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize content script
const keyVaultContent = new KeyVaultContent();

