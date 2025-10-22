/**
 * Import/Export Compatibility
 * Support for major password managers and formats
 */

export class ImportExportManager {
  constructor() {
    this.supportedFormats = [
      '1password',
      'lastpass',
      'bitwarden',
      'dashlane',
      'keepass',
      'csv',
      'json',
      'env'
    ];
  }

  /**
   * Import from 1Password CSV format
   */
  import1Password(csvContent) {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const keys = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = this.parseCSVLine(lines[i]);
      const entry = {};
      
      headers.forEach((header, index) => {
        entry[header] = values[index] || '';
      });

      // Map 1Password fields to KeyVault format
      if (entry.password || entry.Password) {
        keys.push({
          serviceName: entry.title || entry.Title || 'Imported Key',
          keyValue: entry.password || entry.Password,
          environment: this.detectEnvironment(entry.title || entry.Title),
          tags: this.extractTags(entry.tags || entry.Tags || ''),
          notes: entry.notes || entry.Notes || '',
          domains: [],
          favorite: false
        });
      }
    }

    return {
      success: true,
      format: '1password',
      keysImported: keys.length,
      keys
    };
  }

  /**
   * Import from LastPass CSV format
   */
  importLastPass(csvContent) {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const keys = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = this.parseCSVLine(lines[i]);
      const entry = {};
      
      headers.forEach((header, index) => {
        entry[header] = values[index] || '';
      });

      // Map LastPass fields to KeyVault format
      if (entry.password) {
        keys.push({
          serviceName: entry.name || 'Imported Key',
          keyValue: entry.password,
          environment: this.detectEnvironment(entry.name),
          tags: this.extractTags(entry.grouping || ''),
          notes: entry.extra || '',
          domains: entry.url ? [this.extractDomain(entry.url)] : [],
          favorite: entry.fav === '1'
        });
      }
    }

    return {
      success: true,
      format: 'lastpass',
      keysImported: keys.length,
      keys
    };
  }

  /**
   * Import from Bitwarden JSON format
   */
  importBitwarden(jsonContent) {
    try {
      const data = JSON.parse(jsonContent);
      const keys = [];

      const items = data.items || [];
      items.forEach(item => {
        if (item.type === 1 && item.login) { // Type 1 = Login
          keys.push({
            serviceName: item.name || 'Imported Key',
            keyValue: item.login.password || '',
            environment: this.detectEnvironment(item.name),
            tags: item.fields ? item.fields.map(f => f.name).filter(Boolean) : [],
            notes: item.notes || '',
            domains: item.login.uris ? item.login.uris.map(u => this.extractDomain(u.uri)) : [],
            favorite: item.favorite || false
          });
        }
      });

      return {
        success: true,
        format: 'bitwarden',
        keysImported: keys.length,
        keys
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse Bitwarden JSON: ${error.message}`
      };
    }
  }

  /**
   * Import from generic CSV format
   */
  importCSV(csvContent) {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
    const keys = [];

    // Detect column mappings
    const mapping = this.detectCSVMapping(headers);

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = this.parseCSVLine(lines[i]);
      
      if (mapping.keyValue !== -1 && values[mapping.keyValue]) {
        keys.push({
          serviceName: mapping.serviceName !== -1 ? values[mapping.serviceName] : 'Imported Key',
          keyValue: values[mapping.keyValue],
          environment: mapping.environment !== -1 ? values[mapping.environment] : 'production',
          tags: mapping.tags !== -1 ? this.extractTags(values[mapping.tags]) : [],
          notes: mapping.notes !== -1 ? values[mapping.notes] : '',
          domains: [],
          favorite: false
        });
      }
    }

    return {
      success: true,
      format: 'csv',
      keysImported: keys.length,
      keys
    };
  }

  /**
   * Import from .env file format
   */
  importEnvFile(envContent) {
    const lines = envContent.split('\n');
    const keys = [];

    lines.forEach(line => {
      line = line.trim();
      
      // Skip comments and empty lines
      if (!line || line.startsWith('#')) return;

      // Parse KEY=VALUE format
      const match = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.+)$/);
      if (match) {
        const [, name, value] = match;
        
        // Remove quotes if present
        let cleanValue = value.trim();
        if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) ||
            (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
          cleanValue = cleanValue.slice(1, -1);
        }

        // Only import if it looks like an API key
        if (this.looksLikeAPIKey(name, cleanValue)) {
          keys.push({
            serviceName: this.formatEnvVarName(name),
            keyValue: cleanValue,
            environment: this.detectEnvironment(name),
            tags: ['env-import'],
            notes: `Imported from .env file: ${name}`,
            domains: [],
            favorite: false
          });
        }
      }
    });

    return {
      success: true,
      format: 'env',
      keysImported: keys.length,
      keys
    };
  }

  /**
   * Export to CSV format
   */
  exportToCSV(keys) {
    const headers = ['Service Name', 'API Key', 'Environment', 'Tags', 'Notes', 'Domains', 'Created At'];
    const rows = [headers.join(',')];

    keys.forEach(key => {
      const row = [
        this.escapeCSV(key.serviceName),
        this.escapeCSV(key.keyValue),
        this.escapeCSV(key.environment),
        this.escapeCSV(key.tags.join(', ')),
        this.escapeCSV(key.notes),
        this.escapeCSV(key.domains.join(', ')),
        new Date(key.createdAt).toISOString()
      ];
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  /**
   * Export to .env file format
   */
  exportToEnv(keys) {
    const lines = ['# KeyVault Pro Export', '# Generated: ' + new Date().toISOString(), ''];

    keys.forEach(key => {
      const varName = this.toEnvVarName(key.serviceName);
      lines.push(`# ${key.serviceName} (${key.environment})`);
      if (key.notes) {
        lines.push(`# ${key.notes}`);
      }
      lines.push(`${varName}="${key.keyValue}"`);
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Export to JSON format (generic)
   */
  exportToJSON(keys) {
    return JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      source: 'KeyVault Pro',
      keys: keys.map(key => ({
        serviceName: key.serviceName,
        keyValue: key.keyValue,
        environment: key.environment,
        tags: key.tags,
        notes: key.notes,
        domains: key.domains,
        createdAt: key.createdAt,
        favorite: key.favorite
      }))
    }, null, 2);
  }

  /**
   * Export to 1Password CSV format
   */
  exportTo1Password(keys) {
    const headers = ['Title', 'Password', 'Notes', 'Tags'];
    const rows = [headers.join(',')];

    keys.forEach(key => {
      const row = [
        this.escapeCSV(key.serviceName),
        this.escapeCSV(key.keyValue),
        this.escapeCSV(key.notes),
        this.escapeCSV(key.tags.join(','))
      ];
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  /**
   * Helper: Parse CSV line handling quoted values
   */
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values.map(v => v.replace(/^"|"$/g, ''));
  }

  /**
   * Helper: Escape CSV value
   */
  escapeCSV(value) {
    if (!value) return '""';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  }

  /**
   * Helper: Detect environment from name
   */
  detectEnvironment(name) {
    const lower = name.toLowerCase();
    if (lower.includes('prod')) return 'production';
    if (lower.includes('dev')) return 'development';
    if (lower.includes('test')) return 'testing';
    if (lower.includes('stag')) return 'staging';
    return 'production';
  }

  /**
   * Helper: Extract tags from string
   */
  extractTags(tagString) {
    if (!tagString) return [];
    return tagString.split(/[,;]/).map(t => t.trim()).filter(t => t);
  }

  /**
   * Helper: Extract domain from URL
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  }

  /**
   * Helper: Detect CSV column mapping
   */
  detectCSVMapping(headers) {
    const mapping = {
      serviceName: -1,
      keyValue: -1,
      environment: -1,
      tags: -1,
      notes: -1
    };

    headers.forEach((header, index) => {
      const h = header.toLowerCase();
      
      if (h.includes('service') || h.includes('name') || h.includes('title')) {
        mapping.serviceName = index;
      }
      if (h.includes('key') || h.includes('password') || h.includes('secret') || h.includes('token')) {
        mapping.keyValue = index;
      }
      if (h.includes('environment') || h.includes('env')) {
        mapping.environment = index;
      }
      if (h.includes('tag')) {
        mapping.tags = index;
      }
      if (h.includes('note') || h.includes('description')) {
        mapping.notes = index;
      }
    });

    return mapping;
  }

  /**
   * Helper: Check if value looks like an API key
   */
  looksLikeAPIKey(name, value) {
    const keyPatterns = ['key', 'token', 'secret', 'api', 'auth', 'password', 'credential'];
    const nameLower = name.toLowerCase();
    
    // Check if name suggests it's an API key
    const nameMatch = keyPatterns.some(pattern => nameLower.includes(pattern));
    
    // Check if value looks like a key (long, random-looking string)
    const valueLooksLikeKey = value.length >= 16 && /[a-zA-Z]/.test(value) && /[0-9]/.test(value);
    
    return nameMatch && valueLooksLikeKey;
  }

  /**
   * Helper: Format env var name to readable service name
   */
  formatEnvVarName(envVar) {
    return envVar
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/Api|Api Key/gi, 'API');
  }

  /**
   * Helper: Convert service name to env var name
   */
  toEnvVarName(serviceName) {
    return serviceName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') + '_API_KEY';
  }

  /**
   * Auto-detect import format
   */
  detectFormat(content) {
    // Try JSON first
    try {
      const json = JSON.parse(content);
      if (json.items) return 'bitwarden';
      if (json.keys) return 'json';
    } catch {}

    // Check for .env format
    if (content.match(/^[A-Z_][A-Z0-9_]*\s*=/m)) {
      return 'env';
    }

    // Check for CSV
    if (content.includes(',')) {
      const firstLine = content.split('\n')[0].toLowerCase();
      if (firstLine.includes('title') && firstLine.includes('password')) {
        return '1password';
      }
      if (firstLine.includes('name') && firstLine.includes('password')) {
        return 'lastpass';
      }
      return 'csv';
    }

    return 'unknown';
  }

  /**
   * Universal import function
   */
  async import(content, format = 'auto') {
    if (format === 'auto') {
      format = this.detectFormat(content);
    }

    switch (format) {
      case '1password':
        return this.import1Password(content);
      case 'lastpass':
        return this.importLastPass(content);
      case 'bitwarden':
        return this.importBitwarden(content);
      case 'csv':
        return this.importCSV(content);
      case 'env':
        return this.importEnvFile(content);
      case 'json':
        return this.importBitwarden(content); // Generic JSON
      default:
        return {
          success: false,
          error: `Unsupported format: ${format}`
        };
    }
  }
}

