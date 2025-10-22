#!/usr/bin/env node

/**
 * KeyVault MCP Server
 * Model Context Protocol server that allows AI agents to securely access API keys
 * 
 * This enables AI coding assistants to automatically fill in API keys during development
 * without exposing them in prompts or code.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const VAULT_PATH = path.join(os.homedir(), '.keyvault', 'vault.json');
const SESSION_PATH = path.join(os.homedir(), '.keyvault', 'mcp-session.json');

class KeyVaultMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'keyvault-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.vault = null;
    this.sessionKey = null;
    this.setupHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_api_key',
          description: 'Retrieve an API key from KeyVault by service name. Returns the actual key value for use in code.',
          inputSchema: {
            type: 'object',
            properties: {
              service_name: {
                type: 'string',
                description: 'Name of the service (e.g., "OpenAI", "Stripe", "AWS")',
              },
              environment: {
                type: 'string',
                description: 'Environment (production, development, staging, testing). Defaults to development for safety.',
                enum: ['production', 'development', 'staging', 'testing'],
                default: 'development',
              },
            },
            required: ['service_name'],
          },
        },
        {
          name: 'list_api_keys',
          description: 'List all available API keys in the vault (without exposing actual key values). Useful for discovering what keys are available.',
          inputSchema: {
            type: 'object',
            properties: {
              environment: {
                type: 'string',
                description: 'Filter by environment (optional)',
                enum: ['production', 'development', 'staging', 'testing'],
              },
              tags: {
                type: 'array',
                description: 'Filter by tags (optional)',
                items: { type: 'string' },
              },
            },
          },
        },
        {
          name: 'search_api_keys',
          description: 'Search for API keys by service name or tags. Returns metadata only, not actual keys.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query (matches service name, tags, or notes)',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'get_key_info',
          description: 'Get detailed information about an API key (without exposing the actual key value). Useful for checking rate limits, expiration, etc.',
          inputSchema: {
            type: 'object',
            properties: {
              service_name: {
                type: 'string',
                description: 'Name of the service',
              },
            },
            required: ['service_name'],
          },
        },
        {
          name: 'unlock_vault',
          description: 'Unlock the KeyVault with master password. Required before accessing keys.',
          inputSchema: {
            type: 'object',
            properties: {
              password: {
                type: 'string',
                description: 'Master password for the vault',
              },
            },
            required: ['password'],
          },
        },
        {
          name: 'vault_status',
          description: 'Check if vault is unlocked and get basic statistics.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'keyvault://keys',
          name: 'API Keys List',
          description: 'List of all API keys in the vault',
          mimeType: 'application/json',
        },
        {
          uri: 'keyvault://status',
          name: 'Vault Status',
          description: 'Current status of the KeyVault',
          mimeType: 'application/json',
        },
      ],
    }));

    // Read resources
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;

      if (uri === 'keyvault://keys') {
        await this.loadVault();
        if (!this.vault) {
          throw new Error('Vault not found. Please initialize KeyVault first.');
        }

        const keysList = this.vault.keys.map(key => ({
          id: key.id,
          serviceName: key.serviceName,
          environment: key.environment,
          tags: key.tags,
          createdAt: key.createdAt,
          lastUsed: key.lastUsed,
          usageCount: key.usageCount,
        }));

        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(keysList, null, 2),
            },
          ],
        };
      }

      if (uri === 'keyvault://status') {
        const status = await this.getVaultStatus();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      throw new Error(`Unknown resource: ${uri}`);
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'unlock_vault':
            return await this.unlockVault(args.password);

          case 'vault_status':
            return await this.vaultStatus();

          case 'list_api_keys':
            return await this.listApiKeys(args.environment, args.tags);

          case 'search_api_keys':
            return await this.searchApiKeys(args.query);

          case 'get_api_key':
            return await this.getApiKey(args.service_name, args.environment);

          case 'get_key_info':
            return await this.getKeyInfo(args.service_name);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async loadVault() {
    try {
      const data = await fs.readFile(VAULT_PATH, 'utf8');
      this.vault = JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      this.vault = null;
    }
  }

  async loadSession() {
    try {
      const data = await fs.readFile(SESSION_PATH, 'utf8');
      const session = JSON.parse(data);
      
      // Check if session is still valid (1 hour)
      const sessionAge = Date.now() - new Date(session.timestamp).getTime();
      if (sessionAge < 3600000) {
        this.sessionKey = session.key;
        return true;
      }
    } catch (error) {
      // No session or invalid
    }
    return false;
  }

  async saveSession() {
    const session = {
      key: this.sessionKey,
      timestamp: new Date().toISOString(),
    };
    
    const sessionDir = path.dirname(SESSION_PATH);
    await fs.mkdir(sessionDir, { recursive: true });
    await fs.writeFile(SESSION_PATH, JSON.stringify(session));
  }

  async unlockVault(password) {
    await this.loadVault();

    if (!this.vault) {
      return {
        content: [
          {
            type: 'text',
            text: 'Vault not found. Please initialize KeyVault using the browser extension or CLI first.',
          },
        ],
      };
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    
    if (passwordHash !== this.vault.passwordHash) {
      return {
        content: [
          {
            type: 'text',
            text: 'Invalid password. Vault remains locked.',
          },
        ],
        isError: true,
      };
    }

    this.sessionKey = password;
    await this.saveSession();

    return {
      content: [
        {
          type: 'text',
          text: `✅ Vault unlocked successfully!\n\n📊 ${this.vault.keys.length} API keys available\n\nYou can now use get_api_key to retrieve keys for your code.`,
        },
      ],
    };
  }

  async vaultStatus() {
    await this.loadVault();
    await this.loadSession();

    const status = {
      vaultExists: !!this.vault,
      isUnlocked: !!this.sessionKey,
      totalKeys: this.vault?.keys.length || 0,
      vaultPath: VAULT_PATH,
    };

    if (this.vault) {
      const byEnv = {};
      this.vault.keys.forEach(key => {
        byEnv[key.environment] = (byEnv[key.environment] || 0) + 1;
      });
      status.keysByEnvironment = byEnv;
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(status, null, 2),
        },
      ],
    };
  }

  async getVaultStatus() {
    await this.loadVault();
    await this.loadSession();

    return {
      vaultExists: !!this.vault,
      isUnlocked: !!this.sessionKey,
      totalKeys: this.vault?.keys.length || 0,
      vaultPath: VAULT_PATH,
    };
  }

  async requireUnlocked() {
    await this.loadVault();
    await this.loadSession();

    if (!this.vault) {
      throw new Error('Vault not found. Please initialize KeyVault first.');
    }

    if (!this.sessionKey) {
      throw new Error('Vault is locked. Please unlock with your master password first using the unlock_vault tool.');
    }
  }

  async listApiKeys(environment, tags) {
    await this.requireUnlocked();

    let keys = this.vault.keys;

    if (environment) {
      keys = keys.filter(k => k.environment === environment);
    }

    if (tags && tags.length > 0) {
      keys = keys.filter(k => tags.some(tag => k.tags.includes(tag)));
    }

    const keysList = keys.map(key => ({
      serviceName: key.serviceName,
      environment: key.environment,
      tags: key.tags,
      hasExpiration: !!key.expiresAt,
      lastUsed: key.lastUsed,
      usageCount: key.usageCount,
    }));

    return {
      content: [
        {
          type: 'text',
          text: `Found ${keysList.length} API keys:\n\n${JSON.stringify(keysList, null, 2)}`,
        },
      ],
    };
  }

  async searchApiKeys(query) {
    await this.requireUnlocked();

    const lowerQuery = query.toLowerCase();
    const results = this.vault.keys.filter(key =>
      key.serviceName.toLowerCase().includes(lowerQuery) ||
      key.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      (key.notes && key.notes.toLowerCase().includes(lowerQuery))
    );

    const resultsList = results.map(key => ({
      serviceName: key.serviceName,
      environment: key.environment,
      tags: key.tags,
      notes: key.notes,
    }));

    return {
      content: [
        {
          type: 'text',
          text: `Found ${resultsList.length} matching keys:\n\n${JSON.stringify(resultsList, null, 2)}`,
        },
      ],
    };
  }

  async getApiKey(serviceName, environment = 'development') {
    await this.requireUnlocked();

    const key = this.vault.keys.find(k =>
      k.serviceName.toLowerCase() === serviceName.toLowerCase() &&
      k.environment === environment
    );

    if (!key) {
      // Try without environment filter
      const anyEnvKey = this.vault.keys.find(k =>
        k.serviceName.toLowerCase() === serviceName.toLowerCase()
      );

      if (anyEnvKey) {
        return {
          content: [
            {
              type: 'text',
              text: `Key found for "${serviceName}" but in "${anyEnvKey.environment}" environment, not "${environment}". Available environments: ${this.vault.keys.filter(k => k.serviceName.toLowerCase() === serviceName.toLowerCase()).map(k => k.environment).join(', ')}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `API key not found for service: ${serviceName}. Use list_api_keys or search_api_keys to find available keys.`,
          },
        ],
        isError: true,
      };
    }

    // Decrypt key
    const decrypted = this.decrypt(key.keyValue);

    // Update usage stats
    key.lastUsed = new Date().toISOString();
    key.usageCount = (key.usageCount || 0) + 1;
    await fs.writeFile(VAULT_PATH, JSON.stringify(this.vault, null, 2));

    return {
      content: [
        {
          type: 'text',
          text: `✅ Retrieved API key for ${serviceName} (${environment}):\n\n${decrypted}\n\n⚠️ This key has been recorded in usage statistics. Use responsibly.`,
        },
      ],
    };
  }

  async getKeyInfo(serviceName) {
    await this.requireUnlocked();

    const keys = this.vault.keys.filter(k =>
      k.serviceName.toLowerCase() === serviceName.toLowerCase()
    );

    if (keys.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No keys found for service: ${serviceName}`,
          },
        ],
        isError: true,
      };
    }

    const info = keys.map(key => ({
      serviceName: key.serviceName,
      environment: key.environment,
      tags: key.tags,
      createdAt: key.createdAt,
      lastUsed: key.lastUsed,
      usageCount: key.usageCount,
      expiresAt: key.expiresAt,
      rateLimit: key.rateLimit,
      notes: key.notes,
      domains: key.domains,
    }));

    return {
      content: [
        {
          type: 'text',
          text: `Key information for ${serviceName}:\n\n${JSON.stringify(info, null, 2)}`,
        },
      ],
    };
  }

  decrypt(encrypted) {
    const decipher = crypto.createDecipher('aes-256-cbc', this.sessionKey);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('KeyVault MCP Server running on stdio');
  }
}

// Start server
const server = new KeyVaultMCPServer();
server.run().catch(console.error);

