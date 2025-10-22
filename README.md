# 🔑 KeyVault Pro - Secure API Key Manager

**KeyVault Pro** is a comprehensive browser extension for securely managing API keys with intelligent auto-fill, advanced security features, usage tracking, and seamless integration across your web applications.

## ✨ Features

### 🔐 Security First
- **AES-256 Encryption**: All API keys are encrypted at rest using industry-standard encryption
- **Master Password Protection**: Single password unlocks your entire vault
- **Auto-Lock**: Automatically locks after configurable idle time
- **Clipboard Security**: Auto-clears copied keys after specified timeout
- **Audit Logging**: Track all access and modifications to your keys
- **Zero External Dependencies**: All processing happens locally on your device

### 🎯 Intelligent Auto-Fill
- **Smart Field Detection**: Automatically detects API key input fields using multiple heuristics
- **Context-Aware Suggestions**: Suggests keys based on current domain and usage history
- **Multiple Fill Methods**:
  - Click extension icon to select key
  - Right-click context menu on input fields
  - Keyboard shortcut (`Ctrl+Shift+K` / `Cmd+Shift+K`)
  - Visual key icon on detected fields

### 📊 Usage Analytics
- **Usage Tracking**: Count how many times each key is used
- **Last Used Timestamps**: Track when each key was last accessed
- **Domain Tracking**: Monitor which domains each key is used on
- **Expiration Alerts**: Get notified when keys are about to expire
- **Unused Key Detection**: Flag keys that haven't been used recently

### 🎨 Advanced Management
- **Quick Search**: Fuzzy search across all keys, services, and tags
- **Categorization**: Organize by service name, environment (prod/dev/staging), and custom tags
- **Color Coding**: Visual indicators for different key types
- **Favorites**: Pin frequently used keys to the top
- **Notes & Documentation**: Add notes, API docs links, and rate limits per key
- **Export/Import**: Backup and restore your vault with encryption

### 🌓 Customization
- **Dark/Light Theme**: Choose your preferred theme or auto-detect from system
- **Configurable Security**: Customize auto-lock timeout and clipboard behavior
- **Feature Toggles**: Enable/disable features based on your needs

## 🚀 Installation

### Chrome/Edge/Brave

1. Download or clone this repository
2. Open your browser and navigate to:
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`
   - **Brave**: `brave://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `api-key-manager-extension` folder
6. The extension icon should appear in your toolbar

### Firefox

1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Navigate to the extension folder and select `manifest.json`
5. The extension will be loaded temporarily (for permanent installation, the extension needs to be signed)

## 📖 Usage Guide

### First Time Setup

1. Click the KeyVault Pro icon in your browser toolbar
2. Enter a **strong master password** (this will be used to encrypt all your keys)
3. Click "Unlock Vault"
4. Your vault is now created and ready to use!

### Adding API Keys

1. Click the KeyVault Pro icon
2. Click "Add New Key"
3. Fill in the details:
   - **Service Name**: e.g., "OpenAI", "Stripe", "AWS"
   - **API Key**: Your actual API key
   - **Environment**: Production, Development, Staging, or Testing
   - **Tags**: Comma-separated tags for organization (e.g., "ai, gpt, production")
   - **Allowed Domains**: Domains where this key should be suggested
   - **Rate Limit**: Optional rate limit information
   - **Expiration Date**: Optional expiration date for reminders
   - **Notes**: Any additional information or documentation links
4. Click "Save Key"

### Using Auto-Fill

#### Method 1: Automatic Detection
1. Navigate to a website with an API key input field
2. Look for the 🔑 icon next to the field
3. Click the icon to select and fill your key

#### Method 2: Keyboard Shortcut
1. Focus on any input field
2. Press `Ctrl+Shift+K` (Windows/Linux) or `Cmd+Shift+K` (Mac)
3. Select the key from the popup

#### Method 3: Context Menu
1. Right-click on any input field
2. Select "Fill API Key" from the context menu
3. Choose your key from the list

#### Method 4: Manual Copy
1. Click the KeyVault Pro icon
2. Find your key in the list
3. Click "Copy" to copy it to clipboard
4. Paste it wherever needed (will auto-clear after configured timeout)

### Managing Keys

- **Edit**: Click "Edit" button on any key to modify its details
- **Delete**: Click "Delete" button and confirm to remove a key
- **Search**: Use the search bar to quickly find keys by name, tag, or environment
- **Filter**: Use tabs to filter by All, Favorites, or Recent keys
- **Favorite**: Mark keys as favorites for quick access

### Security Settings

1. Click the KeyVault Pro icon
2. Click the ⚙️ (settings) icon
3. Configure:
   - **Auto-lock timeout**: How long before vault locks automatically
   - **Clipboard clear timeout**: How long before copied keys are cleared
   - **Key masking**: Whether to show or hide keys by default
   - **Audit logging**: Enable/disable activity logging

### Export & Import

#### Export Vault
1. Go to Settings
2. Click "Export Vault"
3. Enter your master password
4. Save the `.kvp` file to a secure location

#### Import Vault
1. Go to Settings
2. Click "Import Vault"
3. Select your `.kvp` backup file
4. Enter the master password used to encrypt it
5. Your keys will be merged with existing keys

## 🔒 Security Best Practices

1. **Use a Strong Master Password**: Your master password is the key to all your API keys. Use a long, unique password with a mix of characters.

2. **Enable Auto-Lock**: Set a reasonable auto-lock timeout (15-30 minutes) to protect your keys when you step away.

3. **Regular Backups**: Export your vault regularly and store backups in a secure location.

4. **Rotate Keys Regularly**: Use the expiration date feature to remind yourself to rotate keys periodically.

5. **Use Environment Tags**: Separate production and development keys to avoid accidental misuse.

6. **Review Audit Logs**: Periodically check the audit log for any unexpected activity.

7. **Limit Domain Access**: Specify allowed domains for each key to prevent accidental use on wrong sites.

## 🎯 Keyboard Shortcuts

- `Ctrl+Shift+K` / `Cmd+Shift+K`: Fill API key in focused field
- `Ctrl+Shift+V` / `Cmd+Shift+V`: Open KeyVault Pro popup

You can customize these shortcuts in your browser's extension settings.

## 🛠️ Technical Details

### Architecture
- **Manifest Version**: V3 (Chrome/Edge) with V2 compatibility (Firefox)
- **Encryption**: AES-256-GCM with PBKDF2 key derivation (100,000 iterations)
- **Storage**: Chrome Storage API (encrypted)
- **Framework**: Vanilla JavaScript (no external dependencies)

### Permissions
- `storage`: Store encrypted keys locally
- `contextMenus`: Add right-click menu options
- `activeTab`: Interact with current page for auto-fill
- `alarms`: Handle auto-lock timers
- `host_permissions`: Detect API key fields on all websites

### File Structure
```
api-key-manager-extension/
├── manifest.json                 # Extension configuration
├── background/
│   ├── service-worker.js         # Background service worker
│   ├── storage-manager.js        # Key storage and management
│   └── encryption.js             # Encryption utilities
├── content/
│   ├── content-script.js         # Page interaction script
│   └── content-styles.css        # Content styles
├── popup/
│   ├── popup.html                # Popup interface
│   ├── popup.js                  # Popup logic
│   └── popup.css                 # Popup styles
├── options/
│   ├── options.html              # Options page
│   ├── options.js                # Options logic
│   └── options.css               # Options styles
├── assets/
│   └── icons/                    # Extension icons
└── README.md                     # This file
```

## 🐛 Troubleshooting

### Extension won't unlock
- Make sure you're entering the correct master password
- If you've forgotten your password, there's no recovery option (this is by design for security)
- You'll need to reinstall the extension and start fresh

### Auto-fill not working
- Make sure auto-fill is enabled in settings
- The extension may not detect all field types - use manual methods as fallback
- Check browser console for any errors

### Keys not saving
- Ensure you're unlocked before adding keys
- Check that all required fields are filled
- Try reloading the extension

### Performance issues
- If you have hundreds of keys, search/filter may be slower
- Consider organizing keys with tags and using search
- Export and clean up unused keys periodically

## 🔄 Updates & Changelog

### Version 1.0.0 (Current)
- Initial release
- Core features: encryption, auto-fill, usage tracking
- Support for Chrome, Edge, Brave, Firefox
- Dark/light theme support
- Export/import functionality
- Audit logging

## 🤝 Contributing

This is an open-source project. Contributions are welcome! Please feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📄 License

This project is provided as-is for personal and commercial use. Feel free to modify and distribute.

## ⚠️ Disclaimer

This extension stores API keys locally on your device with encryption. While we've implemented strong security measures, no system is 100% secure. Always follow your organization's security policies and best practices when handling API keys.

## 🙏 Acknowledgments

Built with security, usability, and developer experience in mind. Special thanks to the open-source community for inspiration and best practices.

---

**Made with ❤️ for developers who value security and productivity**

For questions, issues, or feature requests, please open an issue on the repository.

