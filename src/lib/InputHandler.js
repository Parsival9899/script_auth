import fs from 'fs';
import path from 'path';

/**
 * InputHandler - Reads and validates phone numbers from input file
 * Supports JSON array, CSV, and TXT formats
 */
class InputHandler {
  constructor(filePath) {
    this.filePath = filePath;
    this.phoneNumbers = [];
  }

  /**
   * Load phone numbers from file
   * @returns {string[]} Array of validated phone numbers
   */
  load() {
    if (!this.filePath) {
      throw new Error('File path is required');
    }

    // Check if file exists
    if (!fs.existsSync(this.filePath)) {
      throw new Error(`Input file not found: ${this.filePath}`);
    }

    // Read file content
    const content = fs.readFileSync(this.filePath, 'utf-8');
    const ext = path.extname(this.filePath).toLowerCase();

    // Parse based on file extension
    if (ext === '.json') {
      this.phoneNumbers = this._parseJSON(content);
    } else if (ext === '.csv' || ext === '.txt') {
      this.phoneNumbers = this._parseLines(content);
    } else {
      throw new Error(`Unsupported file format: ${ext}. Supported formats: .json, .csv, .txt`);
    }

    // Validate all phone numbers
    this.validate();

    return this.phoneNumbers;
  }

  /**
   * Parse JSON array format
   * @private
   */
  _parseJSON(content) {
    try {
      const data = JSON.parse(content);
      
      if (!Array.isArray(data)) {
        throw new Error('JSON file must contain an array of phone numbers');
      }

      return data.map(item => {
        if (typeof item !== 'string') {
          throw new Error('All phone numbers must be strings');
        }
        return item.trim();
      }).filter(phone => phone.length > 0);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in input file: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Parse CSV/TXT format (one phone per line)
   * @private
   */
  _parseLines(content) {
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#')); // Filter empty lines and comments
  }

  /**
   * Validate phone numbers in E.164 format
   * @throws {Error} If validation fails
   */
  validate() {
    if (this.phoneNumbers.length === 0) {
      throw new Error('No phone numbers found in input file');
    }

    const e164Regex = /^\+[1-9]\d{1,14}$/;

    for (const phone of this.phoneNumbers) {
      if (!e164Regex.test(phone)) {
        throw new Error(`Invalid phone number format: ${phone}. Must be in E.164 format (e.g., +525612588136)`);
      }
    }
  }

  /**
   * Get loaded phone numbers
   * @returns {string[]} Array of phone numbers
   */
  getPhoneNumbers() {
    if (this.phoneNumbers.length === 0) {
      throw new Error('No phone numbers loaded. Call load() first.');
    }
    return [...this.phoneNumbers];
  }
}

export default InputHandler;
