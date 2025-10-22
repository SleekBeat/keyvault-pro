#!/usr/bin/env node

/**
 * KeyVault CLI - Command-line interface for KeyVault Pro
 * Manage API keys from the terminal
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const VAULT_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.keyvault', 'vault.json');
const CONFIG_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.keyvault', 'config.json');

class KeyVaultCLI {
  constructor() {
    this.vault = null;
    this.config = null;
    this.sessionKey = null;
  }

  async run() {
    const args = process.argv.slice(2);
    const command = args[0];

    // Ensure vault directory exists
    this.ensureVaultDir();

    // Load config
    this.loadConfig();

    const commands = {
      'init': () => this.initVault(),
      'unlock': () => this.unlockVault(),
      'lock': () => this.lockVault(),
      'add': () => this.addKey(args.slice(1)),
      'list': () => this.listKeys(args.slice(1)),
      'get': () => this.getKey(args[1]),
      'copy': () => this.copyKey(args[1]),
      'delete': () => this.deleteKey(args[1]),
      'search': () => this.searchKeys(args[1]),
      'export': () => this.exportVault(args[1]),
      'import': () => this.importVault(args[1]),
      'status': () => this.showStatus(),
      'help': () => this.showHelp(),
      '--version': () => this.showVersion(),
      '-v': () => this.showVersion()
    };

    if (!command || !commands[command]) {
      this.showHelp();
      return;
    }

    try {
      await commands[command]();
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  }

  ensureVaultDir() {
    const vaultDir = path.dirname(VAULT_PATH);
    if (!fs.existsSync(vaultDir)) {
      fs.mkdirSync(vaultDir, { recursive: true });
    }
  }

  loadConfig() {
    if (fs.existsSync(CONFIG_PATH)) {
      this.config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } else {
      this.config = {
        created: new Date().toISOString(),
        lastAccess: null
      };
      this.saveConfig();
    }
  }

  saveConfig() {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.config, null, 2));
  }

  loadVault() {
    if (fs.existsSync(VAULT_PATH)) {
      this.vault = JSON.parse(fs.readFileSync(VAULT_PATH, 'utf8'));
    }
  }

  saveVault() {
    fs.writeFileSync(VAULT_PATH, JSON.stringify(this.vault, null, 2));
  }

  async initVault() {
    if (fs.existsSync(VAULT_PATH)) {
      console.log('⚠️  Vault already exists at:', VAULT_PATH);
      const overwrite = await this.prompt('Overwrite existing vault? (yes/no): ');
      if (overwrite.toLowerCase() !== 'yes') {
        console.log('Cancelled.');
        return;
      }
    }

    console.log('🔐 Initialize KeyVault');
    const password = await this.promptPassword('Create master password: ');
    const confirmPassword = await this.promptPassword('Confirm master password: ');

    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    const passwordHash = this.hashPassword(password);

    this.vault = {
      version: '1.0.0',
      created: new Date().toISOString(),
      passwordHash,
      keys: []
    };

    this.saveVault();
    console.log('✅ Vault initialized successfully');
    console.log('📁 Location:', VAULT_PATH);
  }

  async unlockVault() {
    this.loadVault();
    
    if (!this.vault) {
      throw new Error('Vault not found. Run "keyvault init" first.');
    }

    const password = await this.promptPassword('Master password: ');
    
    if (!this.verifyPassword(password, this.vault.passwordHash)) {
      throw new Error('Invalid password');
    }

    this.sessionKey = password;
    this.config.lastAccess = new Date().toISOString();
    this.saveConfig();

    console.log('✅ Vault unlocked');
    console.log(`📊 ${this.vault.keys.length} keys in vault`);
  }

  lockVault() {
    this.sessionKey = null;
    console.log('🔒 Vault locked');
  }

  async addKey(args) {
    await this.requireUnlocked();

    console.log('➕ Add new API key');
    
    const serviceName = args[0] || await this.prompt('Service name: ');
    const keyValue = args[1] || await this.promptPassword('API key: ');
    const environment = args[2] || await this.prompt('Environment (production/development/staging/testing): ') || 'production';
    const tags = args[3] || await this.prompt('Tags (comma-separated): ');

    const key = {
      id: this.generateId(),
      serviceName,
      keyValue: this.encrypt(keyValue),
      environment,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      createdAt: new Date().toISOString(),
      lastUsed: null,
      usageCount: 0
    };

    this.vault.keys.push(key);
    this.saveVault();

    console.log('✅ Key added successfully');
    console.log(`🔑 ${serviceName} (${environment})`);
  }

  async listKeys(args) {
    await this.requireUnlocked();

    const filter = args[0]; // environment filter
    let keys = this.vault.keys;

    if (filter) {
      keys = keys.filter(k => k.environment === filter);
    }

    if (keys.length === 0) {
      console.log('📭 No keys found');
      return;
    }

    console.log(`\n🔑 API Keys (${keys.length}):\n`);
    console.log('ID'.padEnd(15), 'Service'.padEnd(25), 'Environment'.padEnd(15), 'Tags');
    console.log('─'.repeat(80));

    keys.forEach(key => {
      const id = key.id.substring(0, 12);
      const tags = key.tags.join(', ') || '-';
      console.log(
        id.padEnd(15),
        key.serviceName.padEnd(25),
        key.environment.padEnd(15),
        tags
      );
    });

    console.log('');
  }

  async getKey(keyId) {
    await this.requireUnlocked();

    const key = this.findKey(keyId);
    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }

    const decrypted = this.decrypt(key.keyValue);

    console.log('\n🔑 Key Details:\n');
    console.log('Service:', key.serviceName);
    console.log('Environment:', key.environment);
    console.log('Tags:', key.tags.join(', ') || 'None');
    console.log('Created:', new Date(key.createdAt).toLocaleString());
    console.log('Last Used:', key.lastUsed ? new Date(key.lastUsed).toLocaleString() : 'Never');
    console.log('Usage Count:', key.usageCount);
    console.log('\nAPI Key:', decrypted);
    console.log('');
  }

  async copyKey(keyId) {
    await this.requireUnlocked();

    const key = this.findKey(keyId);
    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }

    const decrypted = this.decrypt(key.keyValue);

    // Try to copy to clipboard (platform-specific)
    try {
      const { execSync } = require('child_process');
      
      if (process.platform === 'darwin') {
        execSync('pbcopy', { input: decrypted });
      } else if (process.platform === 'linux') {
        execSync('xclip -selection clipboard', { input: decrypted });
      } else if (process.platform === 'win32') {
        execSync('clip', { input: decrypted });
      }

      // Update usage stats
      key.lastUsed = new Date().toISOString();
      key.usageCount++;
      this.saveVault();

      console.log('✅ Key copied to clipboard');
      console.log(`🔑 ${key.serviceName}`);
    } catch (error) {
      console.log('⚠️  Could not copy to clipboard automatically');
      console.log('Key:', decrypted);
    }
  }

  async deleteKey(keyId) {
    await this.requireUnlocked();

    const key = this.findKey(keyId);
    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }

    console.log(`⚠️  Delete key: ${key.serviceName}`);
    const confirm = await this.prompt('Are you sure? (yes/no): ');

    if (confirm.toLowerCase() !== 'yes') {
      console.log('Cancelled.');
      return;
    }

    this.vault.keys = this.vault.keys.filter(k => k.id !== key.id);
    this.saveVault();

    console.log('✅ Key deleted');
  }

  async searchKeys(query) {
    await this.requireUnlocked();

    const lowerQuery = query.toLowerCase();
    const results = this.vault.keys.filter(key =>
      key.serviceName.toLowerCase().includes(lowerQuery) ||
      key.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      key.environment.toLowerCase().includes(lowerQuery)
    );

    if (results.length === 0) {
      console.log(`📭 No keys found matching: ${query}`);
      return;
    }

    console.log(`\n🔍 Search results for "${query}" (${results.length}):\n`);
    console.log('ID'.padEnd(15), 'Service'.padEnd(25), 'Environment');
    console.log('─'.repeat(60));

    results.forEach(key => {
      const id = key.id.substring(0, 12);
      console.log(
        id.padEnd(15),
        key.serviceName.padEnd(25),
        key.environment
      );
    });

    console.log('');
  }

  async exportVault(outputPath) {
    await this.requireUnlocked();

    const output = outputPath || `keyvault-export-${Date.now()}.json`;

    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      keys: this.vault.keys.map(key => ({
        ...key,
        keyValue: this.decrypt(key.keyValue) // Decrypt for export
      }))
    };

    fs.writeFileSync(output, JSON.stringify(exportData, null, 2));
    console.log('✅ Vault exported');
    console.log('📁 File:', output);
    console.log('⚠️  Warning: This file contains unencrypted keys. Store securely!');
  }

  async importVault(inputPath) {
    await this.requireUnlocked();

    if (!fs.existsSync(inputPath)) {
      throw new Error(`File not found: ${inputPath}`);
    }

    const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    
    if (!data.keys || !Array.isArray(data.keys)) {
      throw new Error('Invalid export file format');
    }

    console.log(`📥 Importing ${data.keys.length} keys...`);

    let imported = 0;
    data.keys.forEach(key => {
      // Check for duplicates
      const exists = this.vault.keys.find(k => k.serviceName === key.serviceName);
      if (exists) {
        console.log(`⚠️  Skipping duplicate: ${key.serviceName}`);
        return;
      }

      // Re-encrypt and add
      this.vault.keys.push({
        ...key,
        id: this.generateId(),
        keyValue: this.encrypt(key.keyValue),
        createdAt: new Date().toISOString()
      });
      imported++;
    });

    this.saveVault();
    console.log(`✅ Imported ${imported} keys`);
  }

  showStatus() {
    this.loadVault();

    if (!this.vault) {
      console.log('❌ Vault not initialized');
      console.log('Run "keyvault init" to create a vault');
      return;
    }

    console.log('\n📊 KeyVault Status:\n');
    console.log('Vault Location:', VAULT_PATH);
    console.log('Created:', new Date(this.vault.created).toLocaleString());
    console.log('Last Access:', this.config.lastAccess ? new Date(this.config.lastAccess).toLocaleString() : 'Never');
    console.log('Total Keys:', this.vault.keys.length);
    console.log('Locked:', this.sessionKey ? 'No ✅' : 'Yes 🔒');

    if (this.vault.keys.length > 0) {
      const byEnv = {};
      this.vault.keys.forEach(key => {
        byEnv[key.environment] = (byEnv[key.environment] || 0) + 1;
      });

      console.log('\nKeys by Environment:');
      Object.entries(byEnv).forEach(([env, count]) => {
        console.log(`  ${env}: ${count}`);
      });
    }

    console.log('');
  }

  showHelp() {
    console.log(`
🔑 KeyVault CLI - Secure API Key Management

USAGE:
  keyvault <command> [options]

COMMANDS:
  init                 Initialize a new vault
  unlock               Unlock the vault
  lock                 Lock the vault
  add [name] [key]     Add a new API key
  list [env]           List all keys (optionally filter by environment)
  get <id>             Get key details
  copy <id>            Copy key to clipboard
  delete <id>          Delete a key
  search <query>       Search keys
  export [file]        Export vault to JSON
  import <file>        Import keys from JSON
  status               Show vault status
  help                 Show this help message
  --version, -v        Show version

EXAMPLES:
  keyvault init
  keyvault add "OpenAI" "sk-..." "production" "ai,gpt"
  keyvault list production
  keyvault search openai
  keyvault copy abc123
  keyvault export backup.json

For more information, visit: https://github.com/keyvault-pro
    `);
  }

  showVersion() {
    console.log('KeyVault CLI v1.0.0');
  }

  // Helper methods

  async requireUnlocked() {
    this.loadVault();
    
    if (!this.vault) {
      throw new Error('Vault not found. Run "keyvault init" first.');
    }

    if (!this.sessionKey) {
      await this.unlockVault();
    }
  }

  findKey(idOrName) {
    return this.vault.keys.find(k => 
      k.id.startsWith(idOrName) || 
      k.serviceName.toLowerCase() === idOrName.toLowerCase()
    );
  }

  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  verifyPassword(password, hash) {
    return this.hashPassword(password) === hash;
  }

  encrypt(text) {
    const cipher = crypto.createCipher('aes-256-cbc', this.sessionKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  decrypt(encrypted) {
    const decipher = crypto.createDecipher('aes-256-cbc', this.sessionKey);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  prompt(question) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise(resolve => {
      rl.question(question, answer => {
        rl.close();
        resolve(answer);
      });
    });
  }

  promptPassword(question) {
    return new Promise(resolve => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question(question, answer => {
        rl.close();
        resolve(answer);
      });

      // Hide password input
      rl._writeToOutput = () => {};
    });
  }
}

// Run CLI
const cli = new KeyVaultCLI();
cli.run().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});

