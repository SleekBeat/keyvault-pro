# KeyVault CLI

Command-line interface for KeyVault Pro API key management.

## Installation

```bash
npm install -g keyvault-cli
```

Or use directly:

```bash
node index.js <command>
```

## Quick Start

```bash
# Initialize vault
keyvault init

# Add a key
keyvault add "OpenAI" "sk-..." "production" "ai,gpt"

# List keys
keyvault list

# Copy key to clipboard
keyvault copy openai

# Search keys
keyvault search api
```

## Commands

See `keyvault help` for full command list.
