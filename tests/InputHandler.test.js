import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import InputHandler from '../src/lib/InputHandler.js';

describe('InputHandler', () => {
  const testDir = path.join(process.cwd(), 'tests', 'fixtures', 'input');

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

  describe('constructor', () => {
    it('should create instance with file path', () => {
      const handler = new InputHandler('/path/to/file.json');
      expect(handler.filePath).toBe('/path/to/file.json');
      expect(handler.phoneNumbers).toEqual([]);
    });

    it('should create instance without file path', () => {
      const handler = new InputHandler();
      expect(handler.filePath).toBeUndefined();
      expect(handler.phoneNumbers).toEqual([]);
    });
  });

  describe('load - JSON format', () => {
    it('should load valid JSON array of phone numbers', () => {
      const phones = ['+525612588136', '+525612588137', '+525612588138'];
      const filePath = path.join(testDir, 'phones.json');
      fs.writeFileSync(filePath, JSON.stringify(phones));

      const handler = new InputHandler(filePath);
      const loaded = handler.load();

      expect(loaded).toEqual(phones);
      expect(loaded.length).toBe(3);
    });

    it('should trim whitespace from phone numbers in JSON', () => {
      const phones = ['  +525612588136  ', '+525612588137', '  +525612588138'];
      const filePath = path.join(testDir, 'phones-whitespace.json');
      fs.writeFileSync(filePath, JSON.stringify(phones));

      const handler = new InputHandler(filePath);
      const loaded = handler.load();

      expect(loaded).toEqual(['+525612588136', '+525612588137', '+525612588138']);
    });

    it('should filter out empty strings in JSON array', () => {
      const phones = ['+525612588136', '', '+525612588137', '   ', '+525612588138'];
      const filePath = path.join(testDir, 'phones-empty.json');
      fs.writeFileSync(filePath, JSON.stringify(phones));

      const handler = new InputHandler(filePath);
      const loaded = handler.load();

      expect(loaded).toEqual(['+525612588136', '+525612588137', '+525612588138']);
    });

    it('should throw error for non-array JSON', () => {
      const filePath = path.join(testDir, 'not-array.json');
      fs.writeFileSync(filePath, JSON.stringify({ phone: '+525612588136' }));

      const handler = new InputHandler(filePath);
      expect(() => handler.load()).toThrow('JSON file must contain an array of phone numbers');
    });

    it('should throw error for non-string items in JSON array', () => {
      const phones = ['+525612588136', 123456, '+525612588137'];
      const filePath = path.join(testDir, 'non-string.json');
      fs.writeFileSync(filePath, JSON.stringify(phones));

      const handler = new InputHandler(filePath);
      expect(() => handler.load()).toThrow('All phone numbers must be strings');
    });

    it('should throw error for invalid JSON syntax', () => {
      const filePath = path.join(testDir, 'invalid.json');
      fs.writeFileSync(filePath, '{ invalid json }');

      const handler = new InputHandler(filePath);
      expect(() => handler.load()).toThrow('Invalid JSON in input file');
    });
  });

  describe('load - CSV format', () => {
    it('should load phone numbers from CSV file', () => {
      const filePath = path.join(testDir, 'phones.csv');
      fs.writeFileSync(filePath, '+525612588136\n+525612588137\n+525612588138');

      const handler = new InputHandler(filePath);
      const loaded = handler.load();

      expect(loaded).toEqual(['+525612588136', '+525612588137', '+525612588138']);
    });

    it('should handle empty lines in CSV', () => {
      const filePath = path.join(testDir, 'phones-empty.csv');
      fs.writeFileSync(filePath, '+525612588136\n\n+525612588137\n\n\n+525612588138\n');

      const handler = new InputHandler(filePath);
      const loaded = handler.load();

      expect(loaded).toEqual(['+525612588136', '+525612588137', '+525612588138']);
    });

    it('should trim whitespace from lines in CSV', () => {
      const filePath = path.join(testDir, 'phones-whitespace.csv');
      fs.writeFileSync(filePath, '  +525612588136  \n+525612588137\n  +525612588138');

      const handler = new InputHandler(filePath);
      const loaded = handler.load();

      expect(loaded).toEqual(['+525612588136', '+525612588137', '+525612588138']);
    });

    it('should ignore comment lines starting with #', () => {
      const filePath = path.join(testDir, 'phones-comments.csv');
      fs.writeFileSync(filePath, '# This is a comment\n+525612588136\n# Another comment\n+525612588137');

      const handler = new InputHandler(filePath);
      const loaded = handler.load();

      expect(loaded).toEqual(['+525612588136', '+525612588137']);
    });
  });

  describe('load - TXT format', () => {
    it('should load phone numbers from TXT file', () => {
      const filePath = path.join(testDir, 'phones.txt');
      fs.writeFileSync(filePath, '+525612588136\n+525612588137\n+525612588138');

      const handler = new InputHandler(filePath);
      const loaded = handler.load();

      expect(loaded).toEqual(['+525612588136', '+525612588137', '+525612588138']);
    });

    it('should handle Windows line endings (CRLF)', () => {
      const filePath = path.join(testDir, 'phones-crlf.txt');
      fs.writeFileSync(filePath, '+525612588136\r\n+525612588137\r\n+525612588138');

      const handler = new InputHandler(filePath);
      const loaded = handler.load();

      expect(loaded).toEqual(['+525612588136', '+525612588137', '+525612588138']);
    });
  });

  describe('load - error handling', () => {
    it('should throw error when no file path provided', () => {
      const handler = new InputHandler();
      expect(() => handler.load()).toThrow('File path is required');
    });

    it('should throw error for non-existent file', () => {
      const handler = new InputHandler('/non/existent/file.json');
      expect(() => handler.load()).toThrow('Input file not found');
    });

    it('should throw error for unsupported file format', () => {
      const filePath = path.join(testDir, 'phones.xml');
      fs.writeFileSync(filePath, '<phones></phones>');

      const handler = new InputHandler(filePath);
      expect(() => handler.load()).toThrow('Unsupported file format: .xml');
    });
  });

  describe('validate', () => {
    it('should validate correct E.164 phone numbers', () => {
      const phones = ['+525612588136', '+14155552671', '+442071838750'];
      const filePath = path.join(testDir, 'valid-phones.json');
      fs.writeFileSync(filePath, JSON.stringify(phones));

      const handler = new InputHandler(filePath);
      expect(() => handler.load()).not.toThrow();
    });

    it('should reject phone numbers without + prefix', () => {
      const phones = ['525612588136'];
      const filePath = path.join(testDir, 'no-plus.json');
      fs.writeFileSync(filePath, JSON.stringify(phones));

      const handler = new InputHandler(filePath);
      expect(() => handler.load()).toThrow('Invalid phone number format: 525612588136');
    });

    it('should reject phone numbers starting with +0', () => {
      const phones = ['+0525612588136'];
      const filePath = path.join(testDir, 'zero-start.json');
      fs.writeFileSync(filePath, JSON.stringify(phones));

      const handler = new InputHandler(filePath);
      expect(() => handler.load()).toThrow('Invalid phone number format: +0525612588136');
    });

    it('should reject phone numbers with letters', () => {
      const phones = ['+52561258ABC6'];
      const filePath = path.join(testDir, 'with-letters.json');
      fs.writeFileSync(filePath, JSON.stringify(phones));

      const handler = new InputHandler(filePath);
      expect(() => handler.load()).toThrow('Invalid phone number format: +52561258ABC6');
    });

    it('should reject phone numbers with special characters', () => {
      const phones = ['+525-612-588-136'];
      const filePath = path.join(testDir, 'with-dashes.json');
      fs.writeFileSync(filePath, JSON.stringify(phones));

      const handler = new InputHandler(filePath);
      expect(() => handler.load()).toThrow('Invalid phone number format: +525-612-588-136');
    });

    it('should reject phone numbers that are too short', () => {
      const phones = ['+1'];
      const filePath = path.join(testDir, 'too-short.json');
      fs.writeFileSync(filePath, JSON.stringify(phones));

      const handler = new InputHandler(filePath);
      expect(() => handler.load()).toThrow('Invalid phone number format: +1');
    });

    it('should reject phone numbers that are too long (>15 digits)', () => {
      const phones = ['+1234567890123456'];
      const filePath = path.join(testDir, 'too-long.json');
      fs.writeFileSync(filePath, JSON.stringify(phones));

      const handler = new InputHandler(filePath);
      expect(() => handler.load()).toThrow('Invalid phone number format: +1234567890123456');
    });

    it('should throw error for empty phone number list', () => {
      const filePath = path.join(testDir, 'empty.json');
      fs.writeFileSync(filePath, JSON.stringify([]));

      const handler = new InputHandler(filePath);
      expect(() => handler.load()).toThrow('No phone numbers found in input file');
    });

    it('should throw error for file with only empty lines', () => {
      const filePath = path.join(testDir, 'only-empty.txt');
      fs.writeFileSync(filePath, '\n\n\n');

      const handler = new InputHandler(filePath);
      expect(() => handler.load()).toThrow('No phone numbers found in input file');
    });
  });

  describe('getPhoneNumbers', () => {
    it('should return loaded phone numbers', () => {
      const phones = ['+525612588136', '+525612588137'];
      const filePath = path.join(testDir, 'phones.json');
      fs.writeFileSync(filePath, JSON.stringify(phones));

      const handler = new InputHandler(filePath);
      handler.load();
      const result = handler.getPhoneNumbers();

      expect(result).toEqual(phones);
    });

    it('should return a copy of phone numbers array', () => {
      const phones = ['+525612588136', '+525612588137'];
      const filePath = path.join(testDir, 'phones.json');
      fs.writeFileSync(filePath, JSON.stringify(phones));

      const handler = new InputHandler(filePath);
      handler.load();
      const result1 = handler.getPhoneNumbers();
      const result2 = handler.getPhoneNumbers();

      expect(result1).toEqual(result2);
      expect(result1).not.toBe(result2); // Different array instances

      // Modifying returned array should not affect internal state
      result1.push('+999999999');
      expect(handler.getPhoneNumbers()).toEqual(phones);
    });

    it('should throw error if phone numbers not loaded', () => {
      const handler = new InputHandler('/some/path.json');
      expect(() => handler.getPhoneNumbers()).toThrow('No phone numbers loaded. Call load() first.');
    });
  });

  describe('edge cases', () => {
    it('should handle single phone number', () => {
      const phones = ['+525612588136'];
      const filePath = path.join(testDir, 'single.json');
      fs.writeFileSync(filePath, JSON.stringify(phones));

      const handler = new InputHandler(filePath);
      const loaded = handler.load();

      expect(loaded).toEqual(phones);
      expect(loaded.length).toBe(1);
    });

    it('should handle maximum valid E.164 length (15 digits)', () => {
      const phones = ['+123456789012345']; // 15 digits
      const filePath = path.join(testDir, 'max-length.json');
      fs.writeFileSync(filePath, JSON.stringify(phones));

      const handler = new InputHandler(filePath);
      const loaded = handler.load();

      expect(loaded).toEqual(phones);
    });

    it('should handle minimum valid E.164 length', () => {
      const phones = ['+123']; // Minimum: country code + at least 1 digit
      const filePath = path.join(testDir, 'min-length.json');
      fs.writeFileSync(filePath, JSON.stringify(phones));

      const handler = new InputHandler(filePath);
      const loaded = handler.load();

      expect(loaded).toEqual(phones);
    });

    it('should handle large number of phone numbers', () => {
      const phones = Array.from({ length: 1000 }, (_, i) => `+52561258${String(i).padStart(4, '0')}`);
      const filePath = path.join(testDir, 'large.json');
      fs.writeFileSync(filePath, JSON.stringify(phones));

      const handler = new InputHandler(filePath);
      const loaded = handler.load();

      expect(loaded.length).toBe(1000);
      expect(loaded[0]).toBe('+525612580000');
      expect(loaded[999]).toBe('+525612580999');
    });
  });
});
