// Debug logger utility to capture and expose logs
// Optimized for machine readability with 90% reduction in verbosity
class DebugLogger {
  private static instance: DebugLogger;
  private apiUrl = 'http://localhost:3001/api/debug-logs';
  private logLevel: 'verbose' | 'compact' | 'minimal' | 'ultra-minimal' = 'ultra-minimal'; // Default to ultra-minimal
  private sampleRate: number = 0.1; // Only log ~10% of messages

  private constructor() {}

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  setLogLevel(level: 'verbose' | 'compact' | 'minimal' | 'ultra-minimal'): void {
    this.logLevel = level;
  }

  getLogLevel(): string {
    return this.logLevel;
  }

  // Helper method to compress objects for machine-readable logging
  compressData(data: any, maxDepth = 1, currentDepth = 0): any {
    if (data === null || data === undefined) {
      return data;
    }

    // For non-objects or when max depth reached, return as is or truncated
    if (typeof data !== 'object' || currentDepth >= maxDepth) {
      if (typeof data === 'object') {
        return Array.isArray(data) 
          ? `[${data.length}]` 
          : `{${Object.keys(data).length}}`;
      }
      return data;
    }

    // For arrays, ultra-compress
    if (Array.isArray(data)) {
      if (this.logLevel === 'ultra-minimal') {
        return `[${data.length}]`;
      }
      
      if (data.length <= 2 || this.logLevel === 'verbose') {
        return data.map(item => this.compressData(item, maxDepth, currentDepth + 1));
      } else {
        // For longer arrays, only show first item
        return [
          this.compressData(data[0], maxDepth, currentDepth + 1),
          `+${data.length - 1}`
        ];
      }
    }

    // For objects, extremely compress in ultra-minimal mode
    if (this.logLevel === 'ultra-minimal') {
      // Special handling for common object types
      if (data.row !== undefined && data.col !== undefined) {
        return `{${data.row},${data.col}}`;
      }
      
      // Just return the object size
      return `{${Object.keys(data).length}}`;
    }
    
    // For objects in other modes, compress each property
    const result: Record<string, any> = {};
    let count = 0;
    const maxProps = this.logLevel === 'minimal' ? 2 : (this.logLevel === 'compact' ? 3 : 5);
    
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (count < maxProps) {
          result[key] = this.compressData(data[key], maxDepth, currentDepth + 1);
          count++;
        } else {
          result[`+${Object.keys(data).length - maxProps}`] = '...';
          break;
        }
      }
    }
    
    return result;
  }

  async log(message: string, data?: any) {
    // In ultra-minimal mode, only log a percentage of messages
    if (this.logLevel === 'ultra-minimal' && Math.random() > this.sampleRate) {
      return; // Skip this log message
    }
    
    // Process data based on log level
    let processedData = data;
    
    if (data && typeof data === 'object') {
      // Ultra-minimal compression
      if (this.logLevel === 'ultra-minimal') {
        // For larger objects, just use a hash signature
        if (Object.keys(data).length > 3 || (Array.isArray(data) && data.length > 3)) {
          const str = JSON.stringify(data);
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
          }
          processedData = `#${(hash >>> 0).toString(36).slice(0, 6)}`;
        } else {
          processedData = this.compressData(data, 0);
        }
      }
      // In minimal mode, only log essential data properties
      else if (this.logLevel === 'minimal') {
        processedData = this.compressData(data, 1);
      } 
      // In compact mode, compress objects but maintain most important structure
      else if (this.logLevel === 'compact') {
        processedData = this.compressData(data, 1);
      }
    }
    
    // Abbreviate message in ultra-minimal mode
    if (this.logLevel === 'ultra-minimal') {
      if (message.length > 40) {
        // Just keep first few words and add hash
        const words = message.split(' ').slice(0, 3).join(' ');
        message = `${words}#${message.length}`;
      } else {
        // Remove common words and punctuation
        message = message
          .replace(/^(Processing|Calculating|Analysis of|Detected|Found|Validation of)/i, '')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }

    // Send to API
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, data: processedData })
      });

      if (!response.ok) {
        console.error('Failed to send log to API:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending log to API:', error);
    }

    // Also output to console (in ultra-compact format)
    console.log(message, processedData);
  }

  async getLogs(limit?: number): Promise<Array<{timestamp: number; message: string; data?: any}>> {
    try {
      const url = limit ? `${this.apiUrl}?limit=${limit}` : this.apiUrl;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
  }

  async clearLogs(): Promise<void> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  }
}

export const debugLogger = DebugLogger.getInstance();
