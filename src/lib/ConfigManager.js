import fs from 'fs';
import path from 'path';

/**
 * ConfigManager - Loads and validates configuration from file
 * Merges user configuration with default values
 */
class ConfigManager {
  constructor(configPath = null) {
    this.configPath = configPath;
    this.config = null;
    this.defaults = {
      concurrency: 5,
      delayBetweenRequests: 1000,
      retryAttempts: 3,
      retryBackoff: 2,
      outputDir: './results',
      timeout: 30000,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      logLevel: 'info'
    };
  }

  /**
   * Load configuration from file and merge with defaults
   * @returns {Object} The loaded configuration
   */
  load() {
    let userConfig = {};

    // If config path provided, try to load it
    if (this.configPath) {
      try {
        const configContent = fs.readFileSync(this.configPath, 'utf-8');
        userConfig = JSON.parse(configContent);
      } catch (error) {
        if (error.code === 'ENOENT') {
          throw new Error(`Configuration file not found: ${this.configPath}`);
        }
        if (error instanceof SyntaxError) {
          throw new Error(`Invalid JSON in configuration file: ${error.message}`);
        }
        throw error;
      }
    }

    // Merge user config with defaults
    this.config = { ...this.defaults, ...userConfig };

    // Validate the merged configuration
    this.validate();

    return this.config;
  }

  /**
   * Validate configuration values
   * @throws {Error} If validation fails
   */
  validate() {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    const { concurrency, delayBetweenRequests, retryAttempts, retryBackoff, timeout, logLevel } = this.config;

    // Validate concurrency
    if (typeof concurrency !== 'number' || concurrency < 1 || !Number.isInteger(concurrency)) {
      throw new Error('concurrency must be a positive integer');
    }

    // Validate delayBetweenRequests
    if (typeof delayBetweenRequests !== 'number' || delayBetweenRequests < 0) {
      throw new Error('delayBetweenRequests must be a non-negative number');
    }

    // Validate retryAttempts
    if (typeof retryAttempts !== 'number' || retryAttempts < 0 || !Number.isInteger(retryAttempts)) {
      throw new Error('retryAttempts must be a non-negative integer');
    }

    // Validate retryBackoff
    if (typeof retryBackoff !== 'number' || retryBackoff < 1) {
      throw new Error('retryBackoff must be a number >= 1');
    }

    // Validate timeout
    if (typeof timeout !== 'number' || timeout < 0) {
      throw new Error('timeout must be a non-negative number');
    }

    // Validate logLevel
    const validLogLevels = ['debug', 'info', 'error'];
    if (!validLogLevels.includes(logLevel)) {
      throw new Error(`logLevel must be one of: ${validLogLevels.join(', ')}`);
    }

    // Validate outputDir is a string
    if (typeof this.config.outputDir !== 'string' || this.config.outputDir.trim() === '') {
      throw new Error('outputDir must be a non-empty string');
    }

    // Validate userAgent is a string
    if (typeof this.config.userAgent !== 'string' || this.config.userAgent.trim() === '') {
      throw new Error('userAgent must be a non-empty string');
    }
  }

  /**
   * Get a specific configuration value
   * @param {string} key - Configuration key
   * @returns {*} Configuration value
   */
  get(key) {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    return this.config[key];
  }

  /**
   * Get all configuration values
   * @returns {Object} All configuration
   */
  getAll() {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    return { ...this.config };
  }
}

export default ConfigManager;
