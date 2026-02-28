import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import Logger from '../src/lib/Logger.js';

describe('Logger', () => {
  const testLogDir = path.join(process.cwd(), 'tests', 'fixtures', 'logs');
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    // Create test log directory
    if (!fs.existsSync(testLogDir)) {
      fs.mkdirSync(testLogDir, { recursive: true });
    }

    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up test log directory after each test
    if (fs.existsSync(testLogDir)) {
      try {
        fs.rmSync(testLogDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should create logger with default log level', () => {
      const logger = new Logger('info', testLogDir);
      expect(logger.logLevel).toBe('info');
      expect(logger.outputDir).toBe(testLogDir);
    });

    it('should create output directory if it does not exist', () => {
      const newDir = path.join(testLogDir, 'new-logs');
      expect(fs.existsSync(newDir)).toBe(false);

      new Logger('info', newDir);
      expect(fs.existsSync(newDir)).toBe(true);
    });

    it('should create log file with timestamp', () => {
      const logger = new Logger('info', testLogDir);
      expect(logger.logFile).toContain('log-');
      expect(logger.logFile).toContain('.log');
    });
  });

  describe('log levels', () => {
    it('should log debug messages when level is debug', () => {
      const logger = new Logger('debug', testLogDir);
      logger.debug('Debug message');
      logger.flush();

      expect(consoleLogSpy).toHaveBeenCalled();
      const logContent = fs.readFileSync(logger.logFile, 'utf-8');
      expect(logContent).toContain('Debug message');
      expect(logContent).toContain('"level":"DEBUG"');
    });

    it('should log info messages when level is info', () => {
      const logger = new Logger('info', testLogDir);
      logger.info('Info message');
      logger.flush();

      expect(consoleLogSpy).toHaveBeenCalled();
      const logContent = fs.readFileSync(logger.logFile, 'utf-8');
      expect(logContent).toContain('Info message');
      expect(logContent).toContain('"level":"INFO"');
    });

    it('should log error messages when level is error', () => {
      const logger = new Logger('error', testLogDir);
      logger.error('Error message');
      logger.flush();

      expect(consoleErrorSpy).toHaveBeenCalled();
      const logContent = fs.readFileSync(logger.logFile, 'utf-8');
      expect(logContent).toContain('Error message');
      expect(logContent).toContain('"level":"ERROR"');
    });

    it('should not log debug when level is info', () => {
      const logger = new Logger('info', testLogDir);
      logger.debug('Debug message');
      logger.flush();

      // When no messages are logged at the current level, file may not be created
      // or will be empty
      if (fs.existsSync(logger.logFile)) {
        const logContent = fs.readFileSync(logger.logFile, 'utf-8');
        expect(logContent).not.toContain('Debug message');
      } else {
        // File not created is also acceptable when no logs match the level
        expect(true).toBe(true);
      }
    });

    it('should not log info when level is error', () => {
      const logger = new Logger('error', testLogDir);
      logger.info('Info message');
      logger.flush();

      // When no messages are logged at the current level, file may not be created
      // or will be empty
      if (fs.existsSync(logger.logFile)) {
        const logContent = fs.readFileSync(logger.logFile, 'utf-8');
        expect(logContent).not.toContain('Info message');
      } else {
        // File not created is also acceptable when no logs match the level
        expect(true).toBe(true);
      }
    });

    it('should log error when level is info', () => {
      const logger = new Logger('info', testLogDir);
      logger.error('Error message');
      logger.flush();

      const logContent = fs.readFileSync(logger.logFile, 'utf-8');
      expect(logContent).toContain('Error message');
    });
  });

  describe('log formatting', () => {
    it('should include timestamp in log entry', () => {
      const logger = new Logger('info', testLogDir);
      logger.info('Test message');
      logger.flush();

      const logContent = fs.readFileSync(logger.logFile, 'utf-8');
      const logEntry = JSON.parse(logContent.trim());
      
      expect(logEntry.timestamp).toBeDefined();
      expect(new Date(logEntry.timestamp).toISOString()).toBe(logEntry.timestamp);
    });

    it('should include context in log entry', () => {
      const logger = new Logger('info', testLogDir);
      const context = {
        workerId: 'worker-1',
        phoneNumber: '+525612588136',
        requestId: 'req-123'
      };
      
      logger.info('Test message', context);
      logger.flush();

      const logContent = fs.readFileSync(logger.logFile, 'utf-8');
      const logEntry = JSON.parse(logContent.trim());
      
      expect(logEntry.workerId).toBe('worker-1');
      expect(logEntry.phoneNumber).toBe('+525612588136');
      expect(logEntry.requestId).toBe('req-123');
    });

    it('should format log entry with all required fields', () => {
      const logger = new Logger('info', testLogDir);
      logger.info('Test message', { key: 'value' });
      logger.flush();

      const logContent = fs.readFileSync(logger.logFile, 'utf-8');
      const logEntry = JSON.parse(logContent.trim());
      
      expect(logEntry).toHaveProperty('timestamp');
      expect(logEntry).toHaveProperty('level');
      expect(logEntry).toHaveProperty('message');
      expect(logEntry.level).toBe('INFO');
      expect(logEntry.message).toBe('Test message');
      expect(logEntry.key).toBe('value');
    });
  });

  describe('logRequest', () => {
    it('should log HTTP request with required fields', () => {
      const logger = new Logger('info', testLogDir);
      const request = {
        workerId: 'worker-1',
        phoneNumber: '+525612588136',
        url: 'https://auth.openai.com/api/accounts/authorize/continue',
        method: 'POST',
        requestId: 'req-123'
      };
      
      logger.logRequest(request);
      logger.flush();

      const logContent = fs.readFileSync(logger.logFile, 'utf-8');
      const logEntry = JSON.parse(logContent.trim());
      
      expect(logEntry.message).toBe('Request sent');
      expect(logEntry.workerId).toBe('worker-1');
      expect(logEntry.phoneNumber).toBe('+525612588136');
      expect(logEntry.url).toBe('https://auth.openai.com/api/accounts/authorize/continue');
      expect(logEntry.method).toBe('POST');
      expect(logEntry.requestId).toBe('req-123');
      expect(logEntry.timestamp).toBeDefined();
    });

    it('should default to POST method if not specified', () => {
      const logger = new Logger('info', testLogDir);
      const request = {
        workerId: 'worker-1',
        phoneNumber: '+525612588136',
        url: 'https://example.com',
        requestId: 'req-123'
      };
      
      logger.logRequest(request);
      logger.flush();

      const logContent = fs.readFileSync(logger.logFile, 'utf-8');
      const logEntry = JSON.parse(logContent.trim());
      
      expect(logEntry.method).toBe('POST');
    });
  });

  describe('logResponse', () => {
    it('should log successful response as info', () => {
      const logger = new Logger('info', testLogDir);
      const response = {
        workerId: 'worker-1',
        phoneNumber: '+525612588136',
        statusCode: 200,
        duration: 1234,
        requestId: 'req-123'
      };
      
      logger.logResponse(response);
      logger.flush();

      const logContent = fs.readFileSync(logger.logFile, 'utf-8');
      const logEntry = JSON.parse(logContent.trim());
      
      expect(logEntry.level).toBe('INFO');
      expect(logEntry.message).toBe('Request completed');
      expect(logEntry.statusCode).toBe(200);
      expect(logEntry.duration).toBe(1234);
    });

    it('should log failed response as error', () => {
      const logger = new Logger('info', testLogDir);
      const response = {
        workerId: 'worker-1',
        phoneNumber: '+525612588136',
        statusCode: 500,
        duration: 1234,
        requestId: 'req-123'
      };
      
      logger.logResponse(response);
      logger.flush();

      const logContent = fs.readFileSync(logger.logFile, 'utf-8');
      const logEntry = JSON.parse(logContent.trim());
      
      expect(logEntry.level).toBe('ERROR');
      expect(logEntry.message).toBe('Request failed');
      expect(logEntry.statusCode).toBe(500);
    });

    it('should log 4xx responses as error', () => {
      const logger = new Logger('info', testLogDir);
      const response = {
        workerId: 'worker-1',
        phoneNumber: '+525612588136',
        statusCode: 404,
        duration: 500,
        requestId: 'req-123'
      };
      
      logger.logResponse(response);
      logger.flush();

      const logContent = fs.readFileSync(logger.logFile, 'utf-8');
      const logEntry = JSON.parse(logContent.trim());
      
      expect(logEntry.level).toBe('ERROR');
      expect(logEntry.message).toBe('Request failed');
    });
  });

  describe('file writing', () => {
    it('should write logs to file', () => {
      const logger = new Logger('info', testLogDir);
      logger.info('Test message 1');
      logger.info('Test message 2');
      logger.flush();

      expect(fs.existsSync(logger.logFile)).toBe(true);
      const logContent = fs.readFileSync(logger.logFile, 'utf-8');
      expect(logContent).toContain('Test message 1');
      expect(logContent).toContain('Test message 2');
    });

    it('should flush buffer when it reaches threshold', () => {
      const logger = new Logger('info', testLogDir);
      
      // Log 10 messages to trigger auto-flush
      for (let i = 0; i < 10; i++) {
        logger.info(`Message ${i}`);
      }

      // Should have flushed automatically
      const logContent = fs.readFileSync(logger.logFile, 'utf-8');
      expect(logContent).toContain('Message 0');
      expect(logContent).toContain('Message 9');
    });

    it('should flush immediately for error messages', () => {
      const logger = new Logger('info', testLogDir);
      logger.error('Error message');

      // Should flush immediately without calling flush()
      const logContent = fs.readFileSync(logger.logFile, 'utf-8');
      expect(logContent).toContain('Error message');
    });
  });

  describe('flush', () => {
    it('should write remaining buffered logs to file', () => {
      const logger = new Logger('info', testLogDir);
      logger.info('Message 1');
      logger.info('Message 2');

      // Before flush, buffer may not be written
      logger.flush();

      const logContent = fs.readFileSync(logger.logFile, 'utf-8');
      expect(logContent).toContain('Message 1');
      expect(logContent).toContain('Message 2');
    });

    it('should handle multiple flush calls', () => {
      const logger = new Logger('info', testLogDir);
      logger.info('Message');
      logger.flush();
      logger.flush(); // Second flush should not error

      const logContent = fs.readFileSync(logger.logFile, 'utf-8');
      const lines = logContent.trim().split('\n');
      expect(lines.length).toBe(1); // Only one message
    });

    it('should not error when flushing empty buffer', () => {
      const logger = new Logger('info', testLogDir);
      expect(() => logger.flush()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty context object', () => {
      const logger = new Logger('info', testLogDir);
      logger.info('Message', {});
      logger.flush();

      const logContent = fs.readFileSync(logger.logFile, 'utf-8');
      const logEntry = JSON.parse(logContent.trim());
      expect(logEntry.message).toBe('Message');
    });

    it('should handle undefined context', () => {
      const logger = new Logger('info', testLogDir);
      logger.info('Message');
      logger.flush();

      const logContent = fs.readFileSync(logger.logFile, 'utf-8');
      const logEntry = JSON.parse(logContent.trim());
      expect(logEntry.message).toBe('Message');
    });

    it('should handle special characters in messages', () => {
      const logger = new Logger('info', testLogDir);
      logger.info('Message with "quotes" and \\backslashes\\');
      logger.flush();

      const logContent = fs.readFileSync(logger.logFile, 'utf-8');
      expect(logContent).toContain('Message with');
    });

    it('should handle large context objects', () => {
      const logger = new Logger('info', testLogDir);
      const largeContext = {
        data: 'x'.repeat(1000),
        nested: { deep: { object: { with: { many: { levels: 'value' } } } } }
      };
      
      logger.info('Large context', largeContext);
      logger.flush();

      const logContent = fs.readFileSync(logger.logFile, 'utf-8');
      const logEntry = JSON.parse(logContent.trim());
      expect(logEntry.data.length).toBe(1000);
    });
  });
});
