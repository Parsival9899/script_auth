import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import InputHandler from '../src/lib/InputHandler.js';

describe('InputHandler - Property-Based Tests', () => {
  const testDir = path.join(process.cwd(), 'tests', 'fixtures', 'input-property');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  /**
   * Generator for valid E.164 phone numbers
   * E.164 format: + followed by 1-15 digits total
   * Country code: 1-3 digits
   * Subscriber number: remaining digits to make total <= 15
   */
  const phoneNumberArbitrary = fc.integer({ min: 1, max: 999 }).chain(countryCode => {
    const countryCodeLength = countryCode.toString().length;
    const maxSubscriberLength = 15 - countryCodeLength;
    const minSubscriberLength = Math.max(1, 15 - countryCodeLength - 11); // At least 4 digits total
    
    // Generate subscriber number with appropriate length
    const minValue = Math.pow(10, minSubscriberLength - 1);
    const maxValue = Math.pow(10, maxSubscriberLength) - 1;
    
    return fc.integer({ min: minValue, max: maxValue }).map(subscriber => 
      `+${countryCode}${subscriber}`
    );
  });

  /**
   * Property 1: Input Format Flexibility
   * For any valid input format (JSON array, CSV, or TXT file) containing phone numbers,
   * the system SHALL successfully parse and load all phone numbers into the task queue.
   * 
   * **Validates: Requirements 2.1.1, 2.5.1**
   */
  describe('Property 1: Input Format Flexibility', () => {
    it('should parse JSON format with any valid phone numbers', () => {
      fc.assert(
        fc.property(
          fc.array(phoneNumberArbitrary, { minLength: 1, maxLength: 20 }),
          (phoneNumbers) => {
            // Create JSON file
            const filePath = path.join(testDir, 'test.json');
            fs.writeFileSync(filePath, JSON.stringify(phoneNumbers));

            // Load and verify
            const handler = new InputHandler(filePath);
            const loaded = handler.load();

            expect(loaded).toEqual(phoneNumbers);
            expect(loaded.length).toBe(phoneNumbers.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should parse CSV format with any valid phone numbers', () => {
      fc.assert(
        fc.property(
          fc.array(phoneNumberArbitrary, { minLength: 1, maxLength: 20 }),
          (phoneNumbers) => {
            // Create CSV file (one phone per line)
            const filePath = path.join(testDir, 'test.csv');
            fs.writeFileSync(filePath, phoneNumbers.join('\n'));

            // Load and verify
            const handler = new InputHandler(filePath);
            const loaded = handler.load();

            expect(loaded).toEqual(phoneNumbers);
            expect(loaded.length).toBe(phoneNumbers.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should parse TXT format with any valid phone numbers', () => {
      fc.assert(
        fc.property(
          fc.array(phoneNumberArbitrary, { minLength: 1, maxLength: 20 }),
          (phoneNumbers) => {
            // Create TXT file (one phone per line)
            const filePath = path.join(testDir, 'test.txt');
            fs.writeFileSync(filePath, phoneNumbers.join('\n'));

            // Load and verify
            const handler = new InputHandler(filePath);
            const loaded = handler.load();

            expect(loaded).toEqual(phoneNumbers);
            expect(loaded.length).toBe(phoneNumbers.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle whitespace and empty lines in CSV/TXT formats', () => {
      fc.assert(
        fc.property(
          fc.array(phoneNumberArbitrary, { minLength: 1, maxLength: 20 }),
          fc.array(fc.constantFrom('', '  ', '\t'), { maxLength: 5 }),
          (phoneNumbers, emptyLines) => {
            // Intersperse phone numbers with empty lines
            const lines = [];
            phoneNumbers.forEach((phone, i) => {
              lines.push(phone);
              if (i < emptyLines.length) {
                lines.push(emptyLines[i]);
              }
            });

            const filePath = path.join(testDir, 'test-whitespace.txt');
            fs.writeFileSync(filePath, lines.join('\n'));

            // Load and verify - should only get phone numbers, not empty lines
            const handler = new InputHandler(filePath);
            const loaded = handler.load();

            expect(loaded).toEqual(phoneNumbers);
            expect(loaded.length).toBe(phoneNumbers.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should successfully load all phone numbers regardless of format', () => {
      fc.assert(
        fc.property(
          fc.array(phoneNumberArbitrary, { minLength: 1, maxLength: 20 }),
          fc.constantFrom('.json', '.csv', '.txt'),
          (phoneNumbers, extension) => {
            const filePath = path.join(testDir, `test${extension}`);
            
            // Write file in appropriate format
            if (extension === '.json') {
              fs.writeFileSync(filePath, JSON.stringify(phoneNumbers));
            } else {
              fs.writeFileSync(filePath, phoneNumbers.join('\n'));
            }

            // Load and verify
            const handler = new InputHandler(filePath);
            const loaded = handler.load();

            // All phone numbers should be loaded
            expect(loaded.length).toBe(phoneNumbers.length);
            expect(loaded).toEqual(phoneNumbers);
            
            // Verify each phone number is present
            phoneNumbers.forEach(phone => {
              expect(loaded).toContain(phone);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
