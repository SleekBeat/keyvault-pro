/**
 * Breach Detection Service
 * Checks API keys against known patterns and breach databases
 */

export class BreachDetector {
  constructor() {
    // Common patterns for compromised keys
    this.suspiciousPatterns = [
      /^(sk-|pk-)?test_/i,  // Test keys in production
      /^demo/i,              // Demo keys
      /^sample/i,            // Sample keys
      /^example/i,           // Example keys
      /1234567890/,          // Sequential numbers
      /password/i,           // Contains "password"
      /^(abc|xyz|foo|bar)/i  // Common placeholder text
    ];

    // Known compromised key prefixes (would be updated from breach databases)
    this.knownBreachedPrefixes = new Set();
  }

  /**
   * Check if a key appears to be compromised or suspicious
   */
  async checkKey(keyValue, serviceName) {
    const results = {
      isSuspicious: false,
      isBreached: false,
      warnings: [],
      severity: 'safe' // safe, warning, danger
    };

    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(keyValue)) {
        results.isSuspicious = true;
        results.warnings.push(`Key matches suspicious pattern: ${pattern.source}`);
        results.severity = 'warning';
      }
    }

    // Check for test keys in production environment
    if (keyValue.toLowerCase().includes('test') || keyValue.toLowerCase().includes('demo')) {
      results.warnings.push('This appears to be a test/demo key');
      results.severity = 'warning';
    }

    // Check key length (too short = suspicious)
    if (keyValue.length < 16) {
      results.isSuspicious = true;
      results.warnings.push('Key is suspiciously short (< 16 characters)');
      results.severity = 'warning';
    }

    // Check for common weak keys
    if (this.isWeakKey(keyValue)) {
      results.isSuspicious = true;
      results.warnings.push('Key appears to be weak or commonly used');
      results.severity = 'danger';
    }

    // Check against known breached prefixes
    const prefix = keyValue.substring(0, 10);
    if (this.knownBreachedPrefixes.has(prefix)) {
      results.isBreached = true;
      results.warnings.push('⚠️ CRITICAL: This key prefix matches a known breach!');
      results.severity = 'danger';
    }

    // Check entropy (randomness)
    const entropy = this.calculateEntropy(keyValue);
    if (entropy < 3.5) {
      results.isSuspicious = true;
      results.warnings.push('Key has low entropy (not random enough)');
      results.severity = 'warning';
    }

    return results;
  }

  /**
   * Check if key is weak or commonly used
   */
  isWeakKey(keyValue) {
    const weakKeys = [
      'password', '12345678', 'qwerty', 'admin', 'letmein',
      'welcome', 'monkey', '1234567890', 'abc123', 'password123'
    ];

    const lowerKey = keyValue.toLowerCase();
    return weakKeys.some(weak => lowerKey.includes(weak));
  }

  /**
   * Calculate Shannon entropy of the key
   * Higher entropy = more random = better
   */
  calculateEntropy(str) {
    const len = str.length;
    const frequencies = {};
    
    for (let i = 0; i < len; i++) {
      const char = str[i];
      frequencies[char] = (frequencies[char] || 0) + 1;
    }

    let entropy = 0;
    for (const char in frequencies) {
      const p = frequencies[char] / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  /**
   * Validate key format for specific services
   */
  validateKeyFormat(keyValue, serviceName) {
    const formats = {
      'OpenAI': /^sk-[a-zA-Z0-9]{48}$/,
      'Stripe': /^(sk|pk)_(test|live)_[a-zA-Z0-9]{24,}$/,
      'AWS': /^AKIA[0-9A-Z]{16}$/,
      'GitHub': /^gh[ps]_[a-zA-Z0-9]{36,}$/,
      'Google': /^AIza[0-9A-Za-z\-_]{35}$/,
      'Anthropic': /^sk-ant-[a-zA-Z0-9\-_]{95}$/
    };

    const format = formats[serviceName];
    if (format) {
      const isValid = format.test(keyValue);
      return {
        isValid,
        message: isValid ? 'Key format is valid' : `Key format doesn't match expected pattern for ${serviceName}`
      };
    }

    return {
      isValid: null,
      message: 'No format validation available for this service'
    };
  }

  /**
   * Check if key has been exposed in public repositories (simulation)
   * In production, this would query services like GitGuardian or GitHub's secret scanning
   */
  async checkPublicExposure(keyValue) {
    // Simulate API call to breach database
    // In production, integrate with:
    // - Have I Been Pwned API
    // - GitGuardian API
    // - GitHub Secret Scanning API
    
    return {
      isExposed: false,
      sources: [],
      message: 'No public exposure detected (simulated check)'
    };
  }

  /**
   * Get security score for a key (0-100)
   */
  getSecurityScore(keyValue, serviceName) {
    let score = 100;

    // Length check
    if (keyValue.length < 16) score -= 20;
    else if (keyValue.length < 24) score -= 10;
    else if (keyValue.length < 32) score -= 5;

    // Entropy check
    const entropy = this.calculateEntropy(keyValue);
    if (entropy < 3.0) score -= 30;
    else if (entropy < 3.5) score -= 15;
    else if (entropy < 4.0) score -= 5;

    // Pattern check
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(keyValue)) {
        score -= 15;
      }
    }

    // Weak key check
    if (this.isWeakKey(keyValue)) {
      score -= 40;
    }

    // Format validation
    const formatCheck = this.validateKeyFormat(keyValue, serviceName);
    if (formatCheck.isValid === false) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get recommendations for improving key security
   */
  getSecurityRecommendations(keyValue, serviceName, environment) {
    const recommendations = [];

    // Check length
    if (keyValue.length < 32) {
      recommendations.push({
        type: 'length',
        severity: 'medium',
        message: 'Consider using longer keys (32+ characters) for better security'
      });
    }

    // Check entropy
    const entropy = this.calculateEntropy(keyValue);
    if (entropy < 4.0) {
      recommendations.push({
        type: 'entropy',
        severity: 'medium',
        message: 'Key has low randomness. Use cryptographically secure random generation'
      });
    }

    // Check for test keys in production
    if (environment === 'production' && (keyValue.includes('test') || keyValue.includes('demo'))) {
      recommendations.push({
        type: 'environment',
        severity: 'high',
        message: '⚠️ Test/demo key detected in production environment!'
      });
    }

    // Check format
    const formatCheck = this.validateKeyFormat(keyValue, serviceName);
    if (formatCheck.isValid === false) {
      recommendations.push({
        type: 'format',
        severity: 'low',
        message: formatCheck.message
      });
    }

    // General recommendations
    recommendations.push({
      type: 'rotation',
      severity: 'low',
      message: 'Rotate this key every 90 days for best security practices'
    });

    recommendations.push({
      type: 'monitoring',
      severity: 'low',
      message: 'Enable rate limiting and monitoring for this API key'
    });

    return recommendations;
  }

  /**
   * Add a known breached prefix to the database
   */
  addBreachedPrefix(prefix) {
    this.knownBreachedPrefixes.add(prefix);
  }

  /**
   * Bulk check multiple keys
   */
  async checkMultipleKeys(keys) {
    const results = [];
    
    for (const key of keys) {
      const check = await this.checkKey(key.keyValue, key.serviceName);
      results.push({
        id: key.id,
        serviceName: key.serviceName,
        ...check
      });
    }

    return results;
  }
}

