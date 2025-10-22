/**
 * Rate Limit Monitor
 * Tracks API usage and monitors rate limits
 */

export class RateLimitMonitor {
  constructor() {
    this.usageData = new Map(); // keyId -> usage records
    this.rateLimits = this.getKnownRateLimits();
  }

  /**
   * Known rate limits for popular APIs
   */
  getKnownRateLimits() {
    return {
      'OpenAI': {
        'gpt-4': { requests: 10000, period: 'day', tokens: 300000 },
        'gpt-3.5-turbo': { requests: 10000, period: 'day', tokens: 2000000 },
        'default': { requests: 3500, period: 'minute' }
      },
      'Anthropic': {
        'default': { requests: 1000, period: 'minute', tokens: 100000 }
      },
      'Stripe': {
        'default': { requests: 100, period: 'second' }
      },
      'GitHub': {
        'default': { requests: 5000, period: 'hour' }
      },
      'Google Maps': {
        'default': { requests: 25000, period: 'day' }
      },
      'AWS': {
        'default': { requests: 10, period: 'second' }
      },
      'Twilio': {
        'default': { requests: 60, period: 'minute' }
      }
    };
  }

  /**
   * Record an API usage
   */
  recordUsage(keyId, serviceName, endpoint = 'default', tokens = 0) {
    if (!this.usageData.has(keyId)) {
      this.usageData.set(keyId, []);
    }

    const usage = {
      timestamp: Date.now(),
      serviceName,
      endpoint,
      tokens
    };

    this.usageData.get(keyId).push(usage);

    // Clean up old records (keep last 7 days)
    this.cleanupOldRecords(keyId);

    return usage;
  }

  /**
   * Clean up usage records older than 7 days
   */
  cleanupOldRecords(keyId) {
    const records = this.usageData.get(keyId);
    if (!records) return;

    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const filtered = records.filter(r => r.timestamp > sevenDaysAgo);
    
    this.usageData.set(keyId, filtered);
  }

  /**
   * Get usage statistics for a key
   */
  getUsageStats(keyId, period = 'day') {
    const records = this.usageData.get(keyId) || [];
    const now = Date.now();
    
    const periodMs = {
      'second': 1000,
      'minute': 60 * 1000,
      'hour': 60 * 60 * 1000,
      'day': 24 * 60 * 60 * 1000,
      'week': 7 * 24 * 60 * 60 * 1000,
      'month': 30 * 24 * 60 * 60 * 1000
    };

    const cutoff = now - periodMs[period];
    const recentRecords = records.filter(r => r.timestamp > cutoff);

    const totalRequests = recentRecords.length;
    const totalTokens = recentRecords.reduce((sum, r) => sum + (r.tokens || 0), 0);

    // Group by endpoint
    const byEndpoint = {};
    recentRecords.forEach(r => {
      byEndpoint[r.endpoint] = (byEndpoint[r.endpoint] || 0) + 1;
    });

    // Calculate requests per time unit
    const timeSpan = Math.min(now - (records[0]?.timestamp || now), periodMs[period]);
    const requestsPerSecond = totalRequests / (timeSpan / 1000);
    const requestsPerMinute = requestsPerSecond * 60;
    const requestsPerHour = requestsPerMinute * 60;

    return {
      period,
      totalRequests,
      totalTokens,
      byEndpoint,
      requestsPerSecond,
      requestsPerMinute,
      requestsPerHour,
      timeSpan
    };
  }

  /**
   * Check if usage is approaching rate limit
   */
  checkRateLimit(keyId, serviceName, customLimit = null) {
    const limit = customLimit || this.rateLimits[serviceName]?.default;
    
    if (!limit) {
      return {
        hasLimit: false,
        message: 'No rate limit information available'
      };
    }

    const stats = this.getUsageStats(keyId, limit.period);
    const usage = stats.totalRequests;
    const maxRequests = limit.requests;
    const percentage = (usage / maxRequests) * 100;

    let status = 'safe';
    let message = `${usage}/${maxRequests} requests used (${percentage.toFixed(1)}%)`;

    if (percentage >= 90) {
      status = 'critical';
      message = `⚠️ CRITICAL: ${percentage.toFixed(1)}% of rate limit used!`;
    } else if (percentage >= 75) {
      status = 'warning';
      message = `⚠️ WARNING: ${percentage.toFixed(1)}% of rate limit used`;
    } else if (percentage >= 50) {
      status = 'caution';
      message = `${percentage.toFixed(1)}% of rate limit used`;
    }

    // Token limit check
    let tokenStatus = null;
    if (limit.tokens && stats.totalTokens > 0) {
      const tokenPercentage = (stats.totalTokens / limit.tokens) * 100;
      tokenStatus = {
        used: stats.totalTokens,
        max: limit.tokens,
        percentage: tokenPercentage,
        status: tokenPercentage >= 90 ? 'critical' : tokenPercentage >= 75 ? 'warning' : 'safe'
      };
    }

    return {
      hasLimit: true,
      status,
      message,
      usage,
      maxRequests,
      percentage,
      limit,
      tokenStatus,
      estimatedTimeToReset: this.estimateResetTime(limit.period)
    };
  }

  /**
   * Estimate time until rate limit resets
   */
  estimateResetTime(period) {
    const now = new Date();
    let resetTime;

    switch (period) {
      case 'second':
        resetTime = new Date(now.getTime() + 1000);
        break;
      case 'minute':
        resetTime = new Date(now.getTime() + (60 * 1000));
        break;
      case 'hour':
        resetTime = new Date(now);
        resetTime.setHours(resetTime.getHours() + 1, 0, 0, 0);
        break;
      case 'day':
        resetTime = new Date(now);
        resetTime.setDate(resetTime.getDate() + 1);
        resetTime.setHours(0, 0, 0, 0);
        break;
      default:
        resetTime = new Date(now.getTime() + (60 * 60 * 1000));
    }

    const msUntilReset = resetTime - now;
    return {
      resetTime,
      msUntilReset,
      humanReadable: this.formatDuration(msUntilReset)
    };
  }

  /**
   * Format duration in human-readable format
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Get usage trends over time
   */
  getUsageTrends(keyId, days = 7) {
    const records = this.usageData.get(keyId) || [];
    const now = Date.now();
    const cutoff = now - (days * 24 * 60 * 60 * 1000);
    const recentRecords = records.filter(r => r.timestamp > cutoff);

    // Group by day
    const byDay = {};
    recentRecords.forEach(r => {
      const date = new Date(r.timestamp).toISOString().split('T')[0];
      byDay[date] = (byDay[date] || 0) + 1;
    });

    // Calculate trend
    const dates = Object.keys(byDay).sort();
    const values = dates.map(d => byDay[d]);
    
    let trend = 'stable';
    if (values.length >= 2) {
      const recent = values.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, values.length);
      const older = values.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(1, values.length - 3);
      
      if (recent > older * 1.2) trend = 'increasing';
      else if (recent < older * 0.8) trend = 'decreasing';
    }

    return {
      byDay,
      dates,
      values,
      trend,
      totalRequests: recentRecords.length,
      averagePerDay: recentRecords.length / days
    };
  }

  /**
   * Predict when rate limit will be hit
   */
  predictRateLimitHit(keyId, serviceName) {
    const limit = this.rateLimits[serviceName]?.default;
    if (!limit) return null;

    const trends = this.getUsageTrends(keyId, 7);
    const avgPerDay = trends.averagePerDay;
    
    if (avgPerDay === 0) return null;

    const dailyLimit = this.convertToDailyLimit(limit);
    if (!dailyLimit) return null;

    if (avgPerDay >= dailyLimit) {
      return {
        willHit: true,
        timeframe: 'today',
        message: 'Current usage rate will hit limit today',
        recommendation: 'Reduce usage or upgrade plan'
      };
    }

    const daysUntilHit = dailyLimit / avgPerDay;
    
    return {
      willHit: daysUntilHit <= 30,
      daysUntilHit,
      message: `At current rate, limit will be hit in ${Math.floor(daysUntilHit)} days`,
      recommendation: daysUntilHit <= 7 ? 'Consider upgrading or optimizing usage' : 'Usage is sustainable'
    };
  }

  /**
   * Convert rate limit to daily equivalent
   */
  convertToDailyLimit(limit) {
    const multipliers = {
      'second': 86400,
      'minute': 1440,
      'hour': 24,
      'day': 1,
      'week': 1/7,
      'month': 1/30
    };

    const multiplier = multipliers[limit.period];
    return multiplier ? limit.requests * multiplier : null;
  }

  /**
   * Get cost estimation based on usage
   */
  estimateCost(keyId, serviceName, pricingTier = 'standard') {
    const pricing = {
      'OpenAI': {
        'gpt-4': { input: 0.03, output: 0.06, unit: 1000 }, // per 1K tokens
        'gpt-3.5-turbo': { input: 0.0015, output: 0.002, unit: 1000 }
      },
      'Anthropic': {
        'claude-3-opus': { input: 0.015, output: 0.075, unit: 1000 },
        'claude-3-sonnet': { input: 0.003, output: 0.015, unit: 1000 }
      },
      'AWS': {
        's3': { storage: 0.023, requests: 0.0004, unit: 1000 }
      }
    };

    const stats = this.getUsageStats(keyId, 'month');
    const servicePricing = pricing[serviceName];

    if (!servicePricing) {
      return {
        available: false,
        message: 'Pricing information not available for this service'
      };
    }

    // Simplified cost calculation
    const estimatedCost = (stats.totalRequests / 1000) * 0.01; // Placeholder

    return {
      available: true,
      period: 'month',
      totalRequests: stats.totalRequests,
      totalTokens: stats.totalTokens,
      estimatedCost,
      currency: 'USD',
      breakdown: {
        requests: stats.totalRequests,
        tokens: stats.totalTokens
      }
    };
  }

  /**
   * Export usage data for analysis
   */
  exportUsageData(keyId) {
    const records = this.usageData.get(keyId) || [];
    return {
      keyId,
      totalRecords: records.length,
      records: records.map(r => ({
        timestamp: new Date(r.timestamp).toISOString(),
        serviceName: r.serviceName,
        endpoint: r.endpoint,
        tokens: r.tokens
      })),
      stats: {
        day: this.getUsageStats(keyId, 'day'),
        week: this.getUsageStats(keyId, 'week'),
        month: this.getUsageStats(keyId, 'month')
      }
    };
  }
}

