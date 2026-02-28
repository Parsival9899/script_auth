import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import ConfigManager from '../src/lib/ConfigManager.js';

describe('ConfigManager', () => {
  const testConfigDir = path.join(process.cwd(), 'tests', 'fixtures');
  const validConfigPath = path.join(testConfigDir, 'valid-config.json');
  const invalidJsonPath = path.join(testConfigDir, 'invalid-config.json');
  const partialConfigPath = path.join(testConfigDir, 'partial-config.json');

  beforeEach(() => {
    // Create test fixtures directory
    if (!fs.existsSync(testConfigDir)) {
      fs.mkdirSync(testConfigDir, { recursive: true });
    }

    // Create valid config file
    fs.writeFileSync(validConfigPath, JSON.stringify({
      concurrency: 10,
      delayBetweenRequests: 2000,
      retryAttempts: 5,
      retryBackoff: 3,
      outputDir: './custom-results',
      timeout: 60000,
      userAgent: 'Custom User Agent',
      logLevel: 'debug'
    }));

    // Create invalid JSON file
    fs.writeFileSync(invalidJsonPath, '{ invalid json }');

    // Create partial config file (only some values)
    fs.writeFileSync(partialConfigPath, JSON.stringify({
      concurrency: 3,
      logLevel: 'error'
    }));
  });

  afterEach(() => {
    // Clean up test fixtures - use a small delay to ensure files are closed
    if (fs.existsSync(testConfigDir)) {
      try {
        fs.rmSync(testConfigDir, { recursive: true, force: true });
      } catch (error) {
        // Retry once after a small delay on Windows
        if (error.code === 'ENOTEMPTY' || error.code === 'EBUSY') {
          setTimeout(() => {
            try {
              fs.rmSync(testConfigDir, { recursive: true, force: true });
            } catch (e) {
              // Ignore cleanup errors in tests
            }
          }, 100);
        }
      }
    }
  });

  describe('constructor', () => {
    it('should create instance with config path', () => {
      const manager = new ConfigManager(validConfigPath);
      expect(manager.configPath).toBe(validConfigPath);
      expect(manager.config).toBeNull();
    });

    it('should create instance without config path', () => {
      const manager = new ConfigManager();
      expect(manager.configPath).toBeNull();
      expect(manager.config).toBeNull();
    });
  });

  describe('load', () => {
    it('should load valid configuration file', () => {
      const manager = new ConfigManager(validConfigPath);
      const config = manager.load();

      expect(config.concurrency).toBe(10);
      expect(config.delayBetweenRequests).toBe(2000);
      expect(config.retryAttempts).toBe(5);
      expect(config.retryBackoff).toBe(3);
      expect(config.outputDir).toBe('./custom-results');
      expect(config.timeout).toBe(60000);
      expect(config.userAgent).toBe('Custom User Agent');
      expect(config.logLevel).toBe('debug');
    });

    it('should use default values when no config file provided', () => {
      const manager = new ConfigManager();
      const config = manager.load();

      expect(config.concurrency).toBe(5);
      expect(config.delayBetweenRequests).toBe(1000);
      expect(config.retryAttempts).toBe(3);
      expect(config.retryBackoff).toBe(2);
      expect(config.outputDir).toBe('./results');
      expect(config.timeout).toBe(30000);
      expect(config.logLevel).toBe('info');
    });

    it('should merge partial config with defaults', () => {
      const manager = new ConfigManager(partialConfigPath);
      const config = manager.load();

      // User-provided values
      expect(config.concurrency).toBe(3);
      expect(config.logLevel).toBe('error');

      // Default values
      expect(config.delayBetweenRequests).toBe(1000);
      expect(config.retryAttempts).toBe(3);
      expect(config.outputDir).toBe('./results');
    });

    it('should throw error for non-existent config file', () => {
      const manager = new ConfigManager('/non/existent/config.json');
      expect(() => manager.load()).toThrow('Configuration file not found');
    });

    it('should throw error for invalid JSON', () => {
      const manager = new ConfigManager(invalidJsonPath);
      expect(() => manager.load()).toThrow('Invalid JSON in configuration file');
    });
  });

  describe('validate', () => {
    it('should throw error if config not loaded', () => {
      const manager = new ConfigManager();
      expect(() => manager.validate()).toThrow('Configuration not loaded');
    });

    it('should validate valid configuration', () => {
      const manager = new ConfigManager(validConfigPath);
      manager.load();
      expect(() => manager.validate()).not.toThrow();
    });

    it('should reject invalid concurrency (not a number)', () => {
      const manager = new ConfigManager();
      manager.config = { ...manager.defaults, concurrency: 'invalid' };
      expect(() => manager.validate()).toThrow('concurrency must be a positive integer');
    });

    it('should reject invalid concurrency (negative)', () => {
      const manager = new ConfigManager();
      manager.config = { ...manager.defaults, concurrency: -1 };
      expect(() => manager.validate()).toThrow('concurrency must be a positive integer');
    });

    it('should reject invalid concurrency (zero)', () => {
      const manager = new ConfigManager();
      manager.config = { ...manager.defaults, concurrency: 0 };
      expect(() => manager.validate()).toThrow('concurrency must be a positive integer');
    });

    it('should reject invalid concurrency (float)', () => {
      const manager = new ConfigManager();
      manager.config = { ...manager.defaults, concurrency: 5.5 };
      expect(() => manager.validate()).toThrow('concurrency must be a positive integer');
    });

    it('should reject invalid delayBetweenRequests (negative)', () => {
      const manager = new ConfigManager();
      manager.config = { ...manager.defaults, delayBetweenRequests: -100 };
      expect(() => manager.validate()).toThrow('delayBetweenRequests must be a non-negative number');
    });

    it('should accept zero delayBetweenRequests', () => {
      const manager = new ConfigManager();
      manager.config = { ...manager.defaults, delayBetweenRequests: 0 };
      expect(() => manager.validate()).not.toThrow();
    });

    it('should reject invalid retryAttempts (negative)', () => {
      const manager = new ConfigManager();
      manager.config = { ...manager.defaults, retryAttempts: -1 };
      expect(() => manager.validate()).toThrow('retryAttempts must be a non-negative integer');
    });

    it('should accept zero retryAttempts', () => {
      const manager = new ConfigManager();
      manager.config = { ...manager.defaults, retryAttempts: 0 };
      expect(() => manager.validate()).not.toThrow();
    });

    it('should reject invalid retryAttempts (float)', () => {
      const manager = new ConfigManager();
      manager.config = { ...manager.defaults, retryAttempts: 3.5 };
      expect(() => manager.validate()).toThrow('retryAttempts must be a non-negative integer');
    });

    it('should reject invalid retryBackoff (less than 1)', () => {
      const manager = new ConfigManager();
      manager.config = { ...manager.defaults, retryBackoff: 0.5 };
      expect(() => manager.validate()).toThrow('retryBackoff must be a number >= 1');
    });

    it('should accept retryBackoff equal to 1', () => {
      const manager = new ConfigManager();
      manager.config = { ...manager.defaults, retryBackoff: 1 };
      expect(() => manager.validate()).not.toThrow();
    });

    it('should reject invalid timeout (negative)', () => {
      const manager = new ConfigManager();
      manager.config = { ...manager.defaults, timeout: -1000 };
      expect(() => manager.validate()).toThrow('timeout must be a non-negative number');
    });

    it('should reject invalid logLevel', () => {
      const manager = new ConfigManager();
      manager.config = { ...manager.defaults, logLevel: 'invalid' };
      expect(() => manager.validate()).toThrow('logLevel must be one of: debug, info, error');
    });

    it('should accept valid logLevel values', () => {
      const manager = new ConfigManager();
      
      manager.config = { ...manager.defaults, logLevel: 'debug' };
      expect(() => manager.validate()).not.toThrow();

      manager.config = { ...manager.defaults, logLevel: 'info' };
      expect(() => manager.validate()).not.toThrow();

      manager.config = { ...manager.defaults, logLevel: 'error' };
      expect(() => manager.validate()).not.toThrow();
    });

    it('should reject empty outputDir', () => {
      const manager = new ConfigManager();
      manager.config = { ...manager.defaults, outputDir: '' };
      expect(() => manager.validate()).toThrow('outputDir must be a non-empty string');
    });

    it('should reject non-string outputDir', () => {
      const manager = new ConfigManager();
      manager.config = { ...manager.defaults, outputDir: 123 };
      expect(() => manager.validate()).toThrow('outputDir must be a non-empty string');
    });

    it('should reject empty userAgent', () => {
      const manager = new ConfigManager();
      manager.config = { ...manager.defaults, userAgent: '' };
      expect(() => manager.validate()).toThrow('userAgent must be a non-empty string');
    });

    it('should reject non-string userAgent', () => {
      const manager = new ConfigManager();
      manager.config = { ...manager.defaults, userAgent: 123 };
      expect(() => manager.validate()).toThrow('userAgent must be a non-empty string');
    });
  });

  describe('get', () => {
    it('should throw error if config not loaded', () => {
      const manager = new ConfigManager();
      expect(() => manager.get('concurrency')).toThrow('Configuration not loaded');
    });

    it('should return specific config value', () => {
      const manager = new ConfigManager(validConfigPath);
      manager.load();

      expect(manager.get('concurrency')).toBe(10);
      expect(manager.get('logLevel')).toBe('debug');
      expect(manager.get('outputDir')).toBe('./custom-results');
    });

    it('should return undefined for non-existent key', () => {
      const manager = new ConfigManager();
      manager.load();

      expect(manager.get('nonExistentKey')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should throw error if config not loaded', () => {
      const manager = new ConfigManager();
      expect(() => manager.getAll()).toThrow('Configuration not loaded');
    });

    it('should return all config values', () => {
      const manager = new ConfigManager(validConfigPath);
      manager.load();

      const allConfig = manager.getAll();
      expect(allConfig).toEqual({
        concurrency: 10,
        delayBetweenRequests: 2000,
        retryAttempts: 5,
        retryBackoff: 3,
        outputDir: './custom-results',
        timeout: 60000,
        userAgent: 'Custom User Agent',
        logLevel: 'debug'
      });
    });

    it('should return a copy of config (not reference)', () => {
      const manager = new ConfigManager();
      manager.load();

      const config1 = manager.getAll();
      const config2 = manager.getAll();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Different objects

      config1.concurrency = 999;
      expect(manager.get('concurrency')).toBe(5); // Original unchanged
    });
  });
});
