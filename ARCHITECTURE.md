# API Key Manager Extension - Architecture & Features

## Project Name: KeyVault Pro

## Core Features

### 1. Intelligent API Key Storage
- **Encrypted Local Storage**: AES-256 encryption for all stored keys
- **Master Password Protection**: Single password unlocks the vault
- **Categorization System**: Organize keys by service, environment (prod/dev/test), and custom tags
- **Key Metadata**: Store service name, creation date, last used, usage count, expiration date, notes

### 2. Smart Auto-Fill System
- **Context-Aware Detection**: Detects API key input fields using multiple heuristics:
  - Input field names (api_key, apiKey, token, authorization, etc.)
  - Label text analysis
  - Placeholder text patterns
  - URL domain matching
- **Intelligent Suggestions**: Suggests keys based on:
  - Current website domain
  - Previously used keys on this site
  - Service name matching
  - Frequency of use
- **Multiple Fill Methods**:
  - Click extension icon to select key
  - Right-click context menu on input fields
  - Keyboard shortcut (Ctrl+Shift+K)
  - Auto-suggest dropdown overlay

### 3. Security Features
- **Auto-Lock**: Automatically lock vault after configurable idle time
- **Clipboard Security**: Auto-clear clipboard after copying keys (configurable timeout)
- **Key Masking**: Display keys as masked by default (show on hover/click)
- **Export/Import with Encryption**: Backup keys in encrypted format
- **Security Audit Log**: Track all key access and modifications
- **Breach Detection**: Check if keys match known compromised patterns
- **Secure Key Generator**: Generate cryptographically secure API keys

### 4. Usage Analytics & Monitoring
- **Usage Tracking**: Count how many times each key is used
- **Last Used Timestamp**: Track when each key was last accessed
- **Usage History**: Detailed log of where and when keys were used
- **Expiration Alerts**: Notify users when keys are about to expire
- **Unused Key Detection**: Flag keys that haven't been used in X days
- **Domain Whitelist**: Track which domains each key is used on

### 5. Advanced Management
- **Quick Search**: Fuzzy search across all keys, services, and tags
- **Bulk Operations**: Edit, delete, or export multiple keys at once
- **Key Rotation Reminders**: Set custom rotation schedules
- **Notes & Documentation**: Add notes, API docs links, rate limits per key
- **Color Coding**: Visual indicators for different key types/environments
- **Favorites/Pinning**: Pin frequently used keys to the top

### 6. Unique Differentiators
- **API Usage Cost Tracker**: Estimate costs based on usage (for major APIs)
- **Rate Limit Monitor**: Track and warn about approaching rate limits
- **Multi-Key Support**: Store multiple keys for the same service
- **Team Sharing (Optional)**: Export key references for team members
- **Dark/Light Theme**: Customizable UI themes
- **Cross-Browser Sync**: Optional encrypted cloud sync across browsers

## Technical Architecture

### Technology Stack
- **Manifest Version**: V3 (Chrome/Edge) with V2 fallback (Firefox)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla ES6+)
- **Encryption**: Web Crypto API (AES-GCM)
- **Storage**: chrome.storage.local (encrypted)
- **UI Framework**: Custom lightweight components

### File Structure
```
api-key-manager-extension/
├── manifest.json
├── background/
│   ├── service-worker.js
│   ├── storage-manager.js
│   └── encryption.js
├── content/
│   ├── content-script.js
│   ├── field-detector.js
│   └── auto-fill.js
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── options/
│   ├── options.html
│   ├── options.js
│   └── options.css
├── lib/
│   ├── crypto-utils.js
│   ├── key-validator.js
│   └── analytics.js
├── assets/
│   ├── icons/
│   └── styles/
└── README.md
```

### Security Model
1. **Master Password**: Derives encryption key using PBKDF2
2. **Encryption**: All keys encrypted at rest with AES-256-GCM
3. **Memory Safety**: Keys decrypted only when needed, cleared after use
4. **No External Calls**: All processing happens locally (except optional sync)
5. **Permissions**: Minimal required permissions

### Data Schema
```json
{
  "keys": [
    {
      "id": "uuid",
      "serviceName": "OpenAI",
      "keyValue": "encrypted_key",
      "environment": "production",
      "tags": ["ai", "gpt"],
      "createdAt": "timestamp",
      "lastUsed": "timestamp",
      "usageCount": 0,
      "expiresAt": "timestamp",
      "notes": "API key for production app",
      "domains": ["app.example.com"],
      "color": "#00A67E",
      "favorite": false,
      "rateLimit": "60 req/min",
      "estimatedCost": 0
    }
  ],
  "settings": {
    "autoLockMinutes": 15,
    "clipboardClearSeconds": 30,
    "theme": "dark",
    "showUsageStats": true,
    "enableAutoFill": true
  },
  "auditLog": []
}
```

## Browser Compatibility
- Chrome/Chromium (primary)
- Edge
- Firefox (with manifest adjustments)
- Brave
- Opera

