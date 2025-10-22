# 🚀 Quick Start Guide - KeyVault Pro

Get up and running with KeyVault Pro in 5 minutes!

## Installation (2 minutes)

### Chrome/Edge/Brave
1. Extract the extension files to a folder
2. Open `chrome://extensions/` (or `edge://extensions/` or `brave://extensions/`)
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the `api-key-manager-extension` folder
6. Done! 🎉

## First Use (3 minutes)

### Step 1: Create Your Vault
1. Click the KeyVault Pro icon 🔑 in your browser toolbar
2. Enter a **strong master password** (you'll need this every time you unlock)
3. Click **Unlock Vault**

**Important**: There's no password recovery, so remember it or store it securely!

### Step 2: Add Your First API Key
1. Click **Add New Key**
2. Fill in:
   - **Service Name**: e.g., "OpenAI"
   - **API Key**: Your actual key (e.g., "sk-proj-...")
   - **Environment**: Choose Production, Development, etc.
   - **Tags** (optional): e.g., "ai, gpt"
3. Click **Save Key**

### Step 3: Use Auto-Fill
1. Open the test page: `file:///path/to/test-page.html` in your browser
2. Look for the 🔑 icon next to input fields
3. Click it and select your key
4. Watch it auto-fill! ✨

## Quick Tips

### Keyboard Shortcuts
- `Ctrl+Shift+K` (or `Cmd+Shift+K` on Mac): Fill key in focused field
- `Ctrl+Shift+V` (or `Cmd+Shift+V` on Mac): Open KeyVault Pro

### Copy Keys Quickly
1. Click the KeyVault Pro icon
2. Find your key
3. Click **Copy**
4. Paste anywhere (auto-clears after 30 seconds)

### Organize Your Keys
- Use **Tags** to categorize (e.g., "production", "testing", "ai")
- Mark important keys as **Favorites** ⭐
- Use **Search** to find keys instantly

### Security Best Practices
- ✅ Use a strong, unique master password
- ✅ Enable auto-lock (Settings → 15 minutes)
- ✅ Export your vault regularly (Settings → Export Vault)
- ✅ Use different keys for production vs development

## Common Use Cases

### For Developers
```
Service: OpenAI
Key: sk-proj-xxxxx
Environment: Development
Tags: ai, gpt, testing
```

### For API Testing
```
Service: Stripe Test
Key: sk_test_xxxxx
Environment: Testing
Tags: payment, stripe, test
Domains: localhost:3000
```

### For Production
```
Service: AWS Production
Key: AKIA...
Environment: Production
Tags: aws, cloud, prod
Notes: Rate limit: 1000 req/min
Expiration: 2025-12-31
```

## Troubleshooting

**Extension not detecting fields?**
- Use the 🔑 icon manually
- Or press `Ctrl+Shift+K` when focused on a field
- Or right-click → Fill API Key

**Forgot master password?**
- Unfortunately, there's no recovery (security by design)
- You'll need to reinstall and start fresh
- Always export your vault as backup!

**Extension disappeared?**
- Click the puzzle piece icon in toolbar
- Find KeyVault Pro and pin it

## Next Steps

- 📖 Read the full [README.md](README.md) for all features
- ⚙️ Explore Settings for customization
- 🔒 Set up auto-lock for security
- 💾 Export your vault as backup
- 🎨 Try dark/light themes

## Need Help?

- Check [INSTALLATION.md](INSTALLATION.md) for detailed install instructions
- Review [README.md](README.md) for comprehensive documentation
- Open an issue on the repository for bugs or feature requests

---

**You're all set! Start managing your API keys securely. 🔐**

