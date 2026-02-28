import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import Logger from '../src/lib/Logger.js';
import fs from 'fs';
import path from 'path';

describe('Logger - Property-Based Tests', () => {
  const testOutputDir = './test-logs';

  beforeEach(() => {
    // Clean up test logs directory before each test
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up test logs directory after each test
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  /**
   * Property 8: Request Logging Completeness
   * **Validates: Requirements 2.4.1**
   * 
   * For any HTTP request sent by the system, a corresponding log entry SHALL be created 
   * containing the request details, timestamp, and worker ID.
   */
  test('Property 8: Request Logging Completeness - all requests are logged with required fields', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            workerId: fc.string({ minLength: 1, maxLength: 20 }),
            phoneNumber: fc.string({ minLength: 10, maxLength: 15 }),
            method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
            url: fc.webUrl(),
            headers: fc.dictionary(fc.string(), fc.string())
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (requests) => {
          const logger = new Logger('debug', testOutputDir);
          
          // Log all requests
          requests.forEach(request => {
            logger.logRequest(request);
          });
          
          // Verify that each request has a corresponding log entry
          expect(logger.logBuffer.length).toBe(requests.length);
          
          // Verify each log entry contains required fields
          requests.forEach((request, index) => {
            const logEntry = logger.logBuffer[index];
            
            // Check that log entry exists
            expect(logEntry).toBeDefined();
            
            // Check required fields are present
            expect(logEntry.timestamp).toBeDefined();
            expect(logEntry.workerId).toBe(request.workerId);
            expect(logEntry.phoneNumber).toBe(request.phoneNumber);
            expect(logEntry.method).toBe(request.method);
            expect(logEntry.url).toBe(request.url);
            expect(logEntry.level).toBe('INFO');
            expect(logEntry.message).toBe('Request sent');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: Timestamp Presence
   * **Validates: Requirements 2.4.5**
   * 
   * For any log entry or result record, the timestamp field SHALL be present 
   * and contain a valid ISO 8601 formatted date-time string.
   */
  test('Property 11: Timestamp Presence - all log entries have valid ISO 8601 timestamps', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            level: fc.constantFrom('debug', 'info', 'error'),
            message: fc.string({ minLength: 1, maxLength: 100 }),
            context: fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer(), fc.boolean()))
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (logEntries) => {
          const logger = new Logger('debug', testOutputDir);
          
          // Create log entries using different log methods
          logEntries.forEach(entry => {
            switch (entry.level) {
              case 'debug':
                logger.debug(entry.message, entry.context);
                break;
              case 'info':
                logger.info(entry.message, entry.context);
                break;
              case 'error':
                logger.error(entry.message, entry.context);
                break;
            }
          });
          
          // Verify each log entry has a valid ISO 8601 timestamp
          logger.logBuffer.forEach(logEntry => {
            // Check timestamp exists
            expect(logEntry.timestamp).toBeDefined();
            expect(typeof logEntry.timestamp).toBe('string');
            
            // Validate ISO 8601 format
            const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
            expect(logEntry.timestamp).toMatch(iso8601Regex);
            
            // Verify it's a valid date
            const date = new Date(logEntry.timestamp);
            expect(date.toString()).not.toBe('Invalid Date');
            expect(date.toISOString()).toBe(logEntry.timestamp);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
