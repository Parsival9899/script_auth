import fs from 'fs';
import path from 'path';

/**
 * Logger - Structured logging with multiple levels
 * Logs to console and file with timestamps
 */
class Logger {
  constructor(logLevel = 'info', outputDir = './logs') {
    this.logLevel = logLevel;
    this.outputDir = outputDir;
    this.logLevels = {
      debug: 0,
      info: 1,
      error: 2
    };
    this.logBuffer = [];
    this.logFile = null;

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Create log file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(this.outputDir, `log-${timestamp}.log`);
  }

  /**
   * Check if a log level should be logged
   * @private
   */
  _shouldLog(level) {
    return this.logLevels[level] >= this.logLevels[this.logLevel];
  }

  /**
   * Format log entry
   * @private
   */
  _formatEntry(level, message, context = {}) {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...context
    };
  }

  /**
   * Write log entry to file and console
   * @private
   */
  _write(entry) {
    const logLine = JSON.stringify(entry);
    
    // Write to console
    if (entry.level === 'ERROR') {
      console.error(logLine);
    } else {
      console.log(logLine);
    }

    // Buffer for file writing (store both string and object)
    this.logBuffer.push(entry);

    // Write to file immediately for errors, batch for others
    if (entry.level === 'ERROR' || this.logBuffer.length >= 10) {
      this._flushBuffer();
    }
  }

  /**
   * Flush log buffer to file
   * @private
   */
  _flushBuffer() {
    if (this.logBuffer.length === 0) {
      return;
    }

    const content = this.logBuffer.map(entry => JSON.stringify(entry)).join('\n') + '\n';
    fs.appendFileSync(this.logFile, content);
    this.logBuffer = [];
  }

  /**
   * Log debug message
   */
  debug(message, context = {}) {
    if (this._shouldLog('debug')) {
      const entry = this._formatEntry('debug', message, context);
      this._write(entry);
    }
  }

  /**
   * Log info message
   */
  info(message, context = {}) {
    if (this._shouldLog('info')) {
      const entry = this._formatEntry('info', message, context);
      this._write(entry);
    }
  }

  /**
   * Log error message
   */
  error(message, context = {}) {
    if (this._shouldLog('error')) {
      const entry = this._formatEntry('error', message, context);
      this._write(entry);
    }
  }

  /**
   * Log HTTP request
   */
  logRequest(request) {
    const context = {
      workerId: request.workerId,
      phoneNumber: request.phoneNumber,
      url: request.url,
      method: request.method || 'POST',
      requestId: request.requestId
    };
    this.info('Request sent', context);
  }

  /**
   * Log HTTP response
   */
  logResponse(response) {
    const context = {
      workerId: response.workerId,
      phoneNumber: response.phoneNumber,
      statusCode: response.statusCode,
      duration: response.duration,
      requestId: response.requestId
    };
    
    if (response.statusCode >= 400) {
      this.error('Request failed', context);
    } else {
      this.info('Request completed', context);
    }
  }

  /**
   * Flush remaining logs to file
   */
  flush() {
    this._flushBuffer();
  }
}

export default Logger;
