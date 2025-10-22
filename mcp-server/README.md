# KeyVault MCP Server

**Model Context Protocol server for KeyVault Pro** - Enables AI coding agents to securely access API keys without exposing them in prompts or code.

## What is This?

This MCP server allows AI assistants (like Claude, GPT-4, or other MCP-compatible agents) to retrieve API keys from your KeyVault during development. Instead of pasting API keys into prompts or hardcoding them, the AI can securely fetch them when needed.

## Features

- 🔐 **Secure Access**: Keys are encrypted and require master password
- 🤖 **AI Integration**: Works with any MCP-compatible AI assistant
- 📊 **Usage Tracking**: Records when AI agents access keys
- 🔍 **Smart Discovery**: AI can search and list available keys
- 🌍 **Environment Aware**: Separate production/development keys
- ⚡ **Session Management**: Unlock once, use for 1 hour

## Installation

### Prerequisites

- Node.js 18 or higher
- KeyVault Pro browser extension or CLI (to manage keys)

### Setup

1. Install the MCP server:

```bash
cd mcp-server
npm install
```

2. Configure your AI assistant to use the server (see Configuration below)

## Configuration

### For Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "keyvault": {
      "command": "node",
      "args": ["/path/to/keyvault-pro/mcp-server/index.js"]
    }
  }
}
```

### For Other MCP Clients

Configure according to your client's MCP server setup. The server uses stdio transport.

## Usage

### 1. Unlock the Vault

Before the AI can access keys, unlock the vault:

```
Please unlock my KeyVault with password: [your-password]
```

The AI will use the `unlock_vault` tool.

### 2. List Available Keys

```
What API keys do I have available?
```

The AI will use the `list_api_keys` tool to show all keys (without exposing values).

### 3. Get a Specific Key

```
I need my OpenAI API key for development
```

The AI will use the `get_api_key` tool with:
- `service_name`: "OpenAI"
- `environment`: "development"

### 4. Search for Keys

```
Find all my AWS-related keys
```

The AI will use the `search_api_keys` tool.

## Available Tools

### `unlock_vault`
Unlock the vault with master password.

**Parameters:**
- `password` (required): Master password

**Example:**
```json
{
  "password": "your-master-password"
}
```

### `list_api_keys`
List all available API keys (metadata only, no actual key values).

**Parameters:**
- `environment` (optional): Filter by environment
- `tags` (optional): Filter by tags

**Example:**
```json
{
  "environment": "development",
  "tags": ["ai", "gpt"]
}
```

### `search_api_keys`
Search for keys by service name or tags.

**Parameters:**
- `query` (required): Search query

**Example:**
```json
{
  "query": "openai"
}
```

### `get_api_key`
Retrieve the actual API key value.

**Parameters:**
- `service_name` (required): Name of the service
- `environment` (optional): Environment (defaults to "development" for safety)

**Example:**
```json
{
  "service_name": "OpenAI",
  "environment": "development"
}
```

### `get_key_info`
Get detailed information about a key (without exposing the value).

**Parameters:**
- `service_name` (required): Name of the service

**Example:**
```json
{
  "service_name": "OpenAI"
}
```

### `vault_status`
Check vault status and statistics.

**Parameters:** None

## Example Conversations

### Example 1: Setting up an OpenAI project

**User:** "Create a Python script that uses OpenAI's API to generate text"

**AI:** "I'll create a script for you. First, let me get your OpenAI API key from KeyVault."

*AI calls `get_api_key` with `service_name: "OpenAI"`, `environment: "development"`*

**AI:** "Here's your script:"

```python
import openai

# API key retrieved from KeyVault
openai.api_key = "sk-proj-..."

response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)
```

### Example 2: Multi-service application

**User:** "Build a web app that uses Stripe for payments and sends notifications via Twilio"

**AI:** "I'll need API keys for both services. Let me check what you have available."

*AI calls `list_api_keys`*

**AI:** "I found your Stripe and Twilio keys. I'll use the development versions for safety."

*AI calls `get_api_key` for both services*

**AI:** "Here's your application with the keys configured..."

## Security Best Practices

### ✅ Do's

- **Use development keys by default**: The MCP server defaults to development environment
- **Unlock only when needed**: Session expires after 1 hour
- **Review usage logs**: Check which keys were accessed and when
- **Separate environments**: Keep production keys separate
- **Lock after use**: The vault auto-locks after session timeout

### ❌ Don'ts

- **Don't share your master password**: Never tell the AI to save or remember it
- **Don't use production keys for testing**: Always specify environment
- **Don't commit generated code with keys**: Use environment variables in production
- **Don't leave vault unlocked**: Lock when done with development session

## How It Works

1. **Vault Storage**: Keys are stored encrypted in `~/.keyvault/vault.json`
2. **Session Management**: After unlocking, a session is saved for 1 hour
3. **Encryption**: Keys are encrypted with AES-256 using your master password
4. **MCP Protocol**: The server exposes tools via Model Context Protocol
5. **AI Integration**: AI assistants can call these tools to retrieve keys

## Troubleshooting

### "Vault not found"

You need to initialize KeyVault first using:
- Browser extension (recommended)
- CLI tool: `keyvault init`

### "Vault is locked"

Unlock the vault:
```
Please unlock my KeyVault
```

The AI will prompt you for the password.

### "Invalid password"

Make sure you're using the correct master password that you set up in KeyVault.

### "Key not found"

The key doesn't exist in your vault. Add it using:
- Browser extension
- CLI tool: `keyvault add "Service Name" "api-key-value"`

### Session expired

Sessions last 1 hour. Simply unlock again:
```
Please unlock my KeyVault again
```

## Development

### Running Locally

```bash
node index.js
```

The server communicates via stdio (standard input/output).

### Testing

You can test the server manually using MCP inspector tools or by configuring it in an MCP client.

## Integration with KeyVault Pro

This MCP server works seamlessly with:
- **Browser Extension**: Manage keys visually
- **CLI Tool**: Manage keys from terminal
- **Shared Vault**: All tools use the same encrypted vault file

## Privacy & Security

- ✅ All keys encrypted at rest
- ✅ Master password never stored
- ✅ Session-based access (1 hour timeout)
- ✅ Usage tracking for audit
- ✅ No external API calls
- ✅ Works completely offline

## Use Cases

### For Developers

- Quickly prototype with real API keys
- Switch between development and production keys
- Share code without exposing keys
- Track API key usage

### For AI Pair Programming

- AI can access keys without you pasting them
- Safer than hardcoding keys in prompts
- AI can discover available services
- Automatic environment separation

### For Teams

- Consistent key management across team
- Audit trail of key access
- Environment-based key separation
- Secure key sharing (via encrypted vault export)

## Roadmap

- [ ] Web-based MCP server (HTTP transport)
- [ ] Key rotation automation
- [ ] Rate limit enforcement
- [ ] Multi-user support
- [ ] Cloud sync (encrypted)
- [ ] Biometric unlock
- [ ] Key approval workflows

## Contributing

This is open-source software. Contributions welcome!

## License

MIT License - See LICENSE file

---

**Made with ❤️ for AI-powered development**

For more information, visit the main KeyVault Pro repository.

