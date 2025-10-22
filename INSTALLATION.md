# Installation Guide - KeyVault Pro

This guide will walk you through installing KeyVault Pro on different browsers.

## Table of Contents
- [Chrome Installation](#chrome-installation)
- [Edge Installation](#edge-installation)
- [Brave Installation](#brave-installation)
- [Firefox Installation](#firefox-installation)
- [Troubleshooting](#troubleshooting)

## Chrome Installation

### Step 1: Download the Extension
1. Download or clone the KeyVault Pro repository
2. Extract the files to a folder on your computer (e.g., `Documents/KeyVaultPro`)

### Step 2: Enable Developer Mode
1. Open Google Chrome
2. Navigate to `chrome://extensions/` (or click the three dots menu → More tools → Extensions)
3. In the top-right corner, toggle **"Developer mode"** to ON

### Step 3: Load the Extension
1. Click the **"Load unpacked"** button
2. Browse to the folder where you extracted KeyVault Pro
3. Select the `api-key-manager-extension` folder
4. Click **"Select Folder"**

### Step 4: Pin the Extension (Optional)
1. Click the puzzle piece icon in the Chrome toolbar
2. Find "KeyVault Pro - API Key Manager"
3. Click the pin icon to keep it visible in your toolbar

### Step 5: First Launch
1. Click the KeyVault Pro icon in your toolbar
2. Create your master password
3. Start adding your API keys!

## Edge Installation

### Step 1: Download the Extension
1. Download or clone the KeyVault Pro repository
2. Extract the files to a folder on your computer

### Step 2: Enable Developer Mode
1. Open Microsoft Edge
2. Navigate to `edge://extensions/` (or click the three dots menu → Extensions)
3. In the left sidebar, toggle **"Developer mode"** to ON

### Step 3: Load the Extension
1. Click the **"Load unpacked"** button
2. Browse to the folder where you extracted KeyVault Pro
3. Select the `api-key-manager-extension` folder
4. Click **"Select Folder"**

### Step 4: Pin the Extension (Optional)
1. Click the puzzle piece icon in the Edge toolbar
2. Find "KeyVault Pro - API Key Manager"
3. Click the eye icon to show it in the toolbar

### Step 5: First Launch
1. Click the KeyVault Pro icon in your toolbar
2. Create your master password
3. Start adding your API keys!

## Brave Installation

### Step 1: Download the Extension
1. Download or clone the KeyVault Pro repository
2. Extract the files to a folder on your computer

### Step 2: Enable Developer Mode
1. Open Brave Browser
2. Navigate to `brave://extensions/` (or click the three lines menu → Extensions)
3. In the top-right corner, toggle **"Developer mode"** to ON

### Step 3: Load the Extension
1. Click the **"Load unpacked"** button
2. Browse to the folder where you extracted KeyVault Pro
3. Select the `api-key-manager-extension` folder
4. Click **"Select Folder"**

### Step 4: Pin the Extension (Optional)
1. Click the puzzle piece icon in the Brave toolbar
2. Find "KeyVault Pro - API Key Manager"
3. Click the pin icon to keep it visible

### Step 5: First Launch
1. Click the KeyVault Pro icon in your toolbar
2. Create your master password
3. Start adding your API keys!

## Firefox Installation

**Note**: Firefox requires Manifest V2 format. The current version uses Manifest V3 (Chrome/Edge/Brave). For Firefox, you'll need to load it as a temporary add-on.

### Step 1: Download the Extension
1. Download or clone the KeyVault Pro repository
2. Extract the files to a folder on your computer

### Step 2: Load Temporary Add-on
1. Open Firefox
2. Navigate to `about:debugging#/runtime/this-firefox`
3. Click **"Load Temporary Add-on..."**
4. Browse to the extension folder
5. Select the `manifest.json` file
6. Click **"Open"**

### Important Notes for Firefox
- The extension will be removed when you close Firefox
- You'll need to reload it each time you restart the browser
- For permanent installation, the extension would need to be:
  - Converted to Manifest V2 format, OR
  - Signed by Mozilla and published to their add-on store

### Step 3: First Launch
1. Click the KeyVault Pro icon in your toolbar
2. Create your master password
3. Start adding your API keys!

## Troubleshooting

### Extension Won't Load

**Problem**: Error message when loading the extension

**Solutions**:
1. Make sure you selected the correct folder (should contain `manifest.json`)
2. Check that all files are properly extracted (not corrupted)
3. Try restarting your browser and loading again
4. Check browser console for specific error messages

### Extension Icon Not Showing

**Problem**: Can't find the extension icon in toolbar

**Solutions**:
1. Click the puzzle piece icon (extensions menu)
2. Look for "KeyVault Pro" in the list
3. Click the pin/eye icon to make it visible
4. Refresh the extensions page and check if it's enabled

### "Developer Mode" Option Missing

**Problem**: Can't find the Developer Mode toggle

**Solutions**:
1. Make sure you're on the extensions page (chrome://extensions/)
2. Look in the top-right corner for Chrome/Brave
3. Look in the left sidebar for Edge
4. Update your browser to the latest version

### Extension Keeps Disappearing (Firefox)

**Problem**: Extension is gone after restarting Firefox

**Solution**: This is expected behavior for temporary add-ons. You need to reload it each time, or wait for a signed version.

### Permissions Warning

**Problem**: Browser shows warning about permissions

**Solution**: This is normal. The extension needs these permissions to:
- Store your encrypted keys locally
- Detect API key fields on websites
- Add context menu options
- Set up auto-lock timers

All processing happens locally on your device.

### Can't Create Master Password

**Problem**: Unlock screen not accepting password

**Solutions**:
1. Make sure the password field is not empty
2. Try a different password (avoid special characters if having issues)
3. Check browser console for errors
4. Try reloading the extension

## Updating the Extension

### For All Browsers

1. Download the latest version
2. Extract to the same folder (or a new one)
3. Go to your browser's extensions page
4. Click the refresh/reload icon on the KeyVault Pro extension
5. Your data will be preserved (stored separately from extension files)

## Uninstalling

### Chrome/Edge/Brave
1. Go to your browser's extensions page
2. Find "KeyVault Pro - API Key Manager"
3. Click **"Remove"**
4. Confirm the removal

**Note**: This will delete all your stored keys. Make sure to export your vault first if you want to keep your data!

### Firefox
1. Go to `about:addons`
2. Find "KeyVault Pro"
3. Click the three dots menu
4. Select **"Remove"**

## Data Backup Before Uninstalling

**Important**: Always backup your data before uninstalling!

1. Open KeyVault Pro
2. Unlock your vault
3. Click the settings icon (⚙️)
4. Click **"Export Vault"**
5. Enter your master password
6. Save the `.kvp` file to a secure location
7. Now you can safely uninstall

## Need Help?

If you're still having issues:
1. Check the main README.md for detailed documentation
2. Look for error messages in the browser console (F12 → Console tab)
3. Try in a different browser to isolate the issue
4. Open an issue on the repository with details about your problem

---

**Happy key managing! 🔑**

