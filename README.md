# 🔑 KeyVault Pro

<div align="center">

**Secure API Key Management for Developers**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/keyvault-pro)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

*A comprehensive browser extension, CLI tool, and MCP server for managing API keys with military-grade encryption, intelligent auto-fill, and AI agent integration.*

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [MCP Integration](#mcp-integration) • [Contributing](#contributing)

</div>

---

## 🌟 Why KeyVault Pro?

Managing API keys is a pain. You need them everywhere, but they're sensitive and easy to expose. KeyVault Pro solves this with:

- 🔐 **Military-grade encryption** (AES-256-GCM)
- 🎯 **Intelligent auto-fill** on any website
- 🤖 **AI agent integration** via MCP server
- 📊 **Usage tracking** and analytics
- 🔍 **Smart organization** with tags and environments
- 💻 **CLI tool** for terminal workflows
- 🌐 **Multi-browser support** (Chrome, Edge, Brave, Firefox)

## 📦 What's Included

### 1. Browser Extension
Full-featured extension for Chrome, Edge, Brave, and Firefox with:
- Visual auto-fill on detected API key fields
- Encrypted local storage
- Beautiful dark/light themes
- Usage analytics and expiration tracking

### 2. CLI Tool
Command-line interface for terminal-based workflows:
```bash
keyvault add "OpenAI" "sk-..." "production"
keyvault list
keyvault copy openai
```

### 3. MCP Server
Model Context Protocol server for AI coding agents:
- Enables AI assistants to securely access your API keys
- No more pasting keys into prompts
- Works with Claude, GPT-4, and other MCP-compatible agents

### 4. Advanced Libraries
- **Breach Detection**: Check keys against known patterns
- **Rate Limit Monitoring**: Track API usage and costs
- **Import/Export**: Compatible with 1Password, LastPass, Bitwarden
- **Key Validation**: Format checking for major APIs

## ✨ Features

### Security
- ✅ AES-256-GCM encryption for all keys
- ✅ PBKDF2 key derivation (100,000 iterations)
- ✅ Master password protection (no recovery by design)
- ✅ Auto-lock after configurable idle time
- ✅ Clipboard auto-clear
- ✅ Complete audit logging
- ✅ Breach detection and security scoring

### Auto-Fill
- ✅ Smart field detection using multiple heuristics
- ✅ Visual 🔑 icon on detected fields
- ✅ Keyboard shortcuts (`Ctrl+Shift+K`)
- ✅ Right-click context menu
- ✅ Domain-based suggestions
- ✅ Beautiful modal key selector

### Organization
- ✅ Categorize by service, environment, and tags
- ✅ Color-coded keys
- ✅ Favorites system
- ✅ Fuzzy search
- ✅ Filter by environment
- ✅ Notes and documentation per key

### Analytics
- ✅ Usage tracking per key
- ✅ Domain tracking
- ✅ Last used timestamps
- ✅ Expiration alerts
- ✅ Rate limit monitoring
- ✅ Cost estimation (for major APIs)

### Integration
- ✅ Import from 1Password, LastPass, Bitwarden
- ✅ Export to CSV, JSON, .env files
- ✅ MCP server for AI agents
- ✅ CLI for terminal workflows
- ✅ Browser extension for visual management

## 🚀 Quick Start

### Browser Extension

1. **Download** the latest release or clone this repo
2. **Open** `chrome://extensions/` (or your browser's extension page)
3. **Enable** Developer mode
4. **Load unpacked** and select the `api-key-manager-extension` folder
5. **Click** the KeyVault icon and create your master password
6. **Add** your first API key!

[Detailed installation guide →](INSTALLATION.md)

### CLI Tool

```bash
cd cli
npm install -g .

# Initialize vault
keyvault init

# Add a key
keyvault add "OpenAI" "sk-..." "development" "ai,gpt"

# List keys
keyvault list

# Get help
keyvault help
```

### MCP Server (for AI Agents)

```bash
cd mcp-server
npm install

# Configure in your AI assistant (e.g., Claude Desktop)
# Add to claude_desktop_config.json:
{
  "mcpServers": {
    "keyvault": {
      "command": "node",
      "args": ["/path/to/mcp-server/index.js"]
    }
  }
}
```

[MCP integration guide →](mcp-server/README.md)

## 📖 Usage Examples

### Browser Extension

**Auto-fill on any website:**
1. Navigate to a site with an API key field
2. Look for the 🔑 icon
3. Click it and select your key
4. Done!

**Or use keyboard shortcut:**
- Focus the field
- Press `Ctrl+Shift+K` (or `Cmd+Shift+K` on Mac)
- Select your key

### CLI Tool

```bash
# Add keys
keyvault add "Stripe" "sk_test_..." "testing" "payment"
keyvault add "AWS" "AKIA..." "production" "cloud,aws"

# List all keys
keyvault list

# List production keys only
keyvault list production

# Search for keys
keyvault search stripe

# Copy key to clipboard
keyvault copy stripe

# Export vault
keyvault export backup.json

# Import keys
keyvault import backup.json
```

### MCP Server (AI Integration)

**In your AI conversation:**

```
User: "Create a Python script that uses OpenAI's API"

AI: "I'll get your OpenAI API key from KeyVault..."
[AI calls get_api_key tool]

AI: "Here's your script with the key configured:

import openai
openai.api_key = "sk-proj-..."  # Retrieved from KeyVault

# Your code here...
```

**The AI can:**
- List available keys
- Search for specific keys
- Retrieve keys by service name
- Check key information
- Respect environment separation (dev/prod)

## 🎯 Use Cases

### For Developers
- Store all your API keys in one secure place
- Quick access during development
- Auto-fill on documentation sites
- Track which keys you're using where

### For DevOps
- Manage cloud provider credentials
- Separate prod/dev/staging keys
- Track key usage and expiration
- Export keys for team sharing

### For AI-Powered Development
- Let AI access keys without exposing them
- No more pasting keys into prompts
- Automatic environment separation
- Usage tracking for AI-accessed keys

### For Teams
- Consistent key management
- Audit trail of access
- Encrypted vault sharing
- Environment-based organization

## 🔐 Security

### What We Do
- ✅ AES-256-GCM encryption at rest
- ✅ PBKDF2 with 100,000 iterations
- ✅ Constant-time password comparison
- ✅ No external API calls
- ✅ All processing happens locally
- ✅ No telemetry or tracking
- ✅ Open-source for transparency

### What You Should Do
- ✅ Use a strong, unique master password
- ✅ Enable auto-lock (15-30 minutes)
- ✅ Export vault regularly for backup
- ✅ Rotate keys periodically
- ✅ Use different keys per environment
- ✅ Review audit logs

### What We Don't Do
- ❌ Store your master password
- ❌ Send data to external servers
- ❌ Track your usage
- ❌ Access your keys without permission
- ❌ Provide password recovery (by design)

## 📊 Browser Compatibility

| Browser | Extension | Status |
|---------|-----------|--------|
| Chrome | ✅ | Full support |
| Edge | ✅ | Full support |
| Brave | ✅ | Full support |
| Opera | ✅ | Full support |
| Firefox | ⚠️ | Temporary add-on only |

## 🛠️ Development

### Prerequisites
- Node.js 14+ (for CLI)
- Node.js 18+ (for MCP server)
- Modern browser with extension support

### Project Structure
```
keyvault-pro/
├── background/          # Extension background scripts
├── content/            # Content scripts
├── popup/              # Extension popup UI
├── options/            # Settings page
├── lib/                # Shared libraries
│   ├── breach-detector.js
│   ├── rate-limit-monitor.js
│   └── import-export.js
├── cli/                # Command-line tool
├── mcp-server/         # MCP server for AI
├── assets/             # Icons and images
└── docs/               # Documentation
```

### Building

```bash
# Package extension
zip -r keyvault-pro.zip . -x "*.git*" "*node_modules*"

# Install CLI globally
cd cli && npm install -g .

# Run MCP server
cd mcp-server && node index.js
```

## 📚 Documentation

- [Installation Guide](INSTALLATION.md) - Step-by-step installation
- [Quick Start Guide](QUICKSTART.md) - Get started in 5 minutes
- [Feature List](FEATURES.md) - Complete feature documentation
- [Architecture](ARCHITECTURE.md) - Technical design details
- [MCP Server Guide](mcp-server/README.md) - AI integration
- [CLI Documentation](cli/README.md) - Command-line usage
- [Contributing Guide](CONTRIBUTING.md) - How to contribute

## 🗺️ Roadmap

### v1.1 (Next Release)
- [ ] Firefox Manifest V2 support
- [ ] Automated tests
- [ ] Bulk operations UI
- [ ] Keyboard navigation
- [ ] Drag-and-drop organization

### v2.0 (Future)
- [ ] Browser sync (encrypted)
- [ ] Team sharing features
- [ ] Biometric unlock
- [ ] Mobile companion app
- [ ] Key rotation automation
- [ ] Advanced breach detection

### Community Requests
- [ ] Custom field types
- [ ] Key templates
- [ ] Advanced search syntax
- [ ] Key versioning
- [ ] Internationalization (i18n)

[Vote on features →](https://github.com/yourusername/keyvault-pro/issues)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Ways to Contribute
- 🐛 Report bugs
- 💡 Suggest features
- 📝 Improve documentation
- 🔧 Submit pull requests
- ⭐ Star the repository
- 📢 Spread the word

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with security and developer experience in mind
- Inspired by the need for better API key management
- Thanks to all contributors and users

## 📞 Support

- 📖 [Documentation](README.md)
- 🐛 [Issue Tracker](https://github.com/yourusername/keyvault-pro/issues)
- 💬 [Discussions](https://github.com/yourusername/keyvault-pro/discussions)
- 📧 Email: support@keyvault.pro (placeholder)

## ⭐ Star History

If you find KeyVault Pro useful, please consider starring the repository!

---

<div align="center">

**Made with ❤️ for developers who value security and productivity**

[Website](https://keyvault.pro) • [Documentation](README.md) • [GitHub](https://github.com/yourusername/keyvault-pro)

</div>

