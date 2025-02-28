// Debug logger utility to capture and expose logs
class DebugLogger {
  private static instance: DebugLogger;
  private apiUrl = 'http://localhost:3001/api/debug-logs';
  private logLevel: 'verbose' | 'compact' | 'minimal' = 'compact'; // Default to compact logging

  private constructor() {}

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  setLogLevel(level: 'verbose' | 'compact' | 'minimal'): void {
    this.logLevel = level;
  }

  getLogLevel(): string {
    return this.logLevel;
  }

  // Helper method to compress objects for logging
  compressData(data: any, maxDepth = 2, currentDepth = 0): any {
    if (data === null || data === undefined) {
      return data;
    }

    // For non-objects or when max depth reached, return as is or truncated
    if (typeof data !== 'object' || currentDepth >= maxDepth) {
      if (typeof data === 'object') {
        return Array.isArray(data) 
          ? `[Array(${data.length})]` 
          : `{Object}`;
      }
      return data;
    }

    // For arrays, compress each element
    if (Array.isArray(data)) {
      if (data.length <= 3 || this.logLevel === 'verbose') {
        return data.map(item => this.compressData(item, maxDepth, currentDepth + 1));
      } else {
        // For longer arrays, only show limited items
        return [
          ...data.slice(0, 2).map(item => this.compressData(item, maxDepth, currentDepth + 1)),
          `...and ${data.length - 2} more items`
        ];
      }
    }

    // For objects, compress each property
    const result: Record<string, any> = {};
    let count = 0;
    const maxProps = this.logLevel === 'minimal' ? 3 : (this.logLevel === 'compact' ? 5 : 20);
    
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (count < maxProps) {
          result[key] = this.compressData(data[key], maxDepth, currentDepth + 1);
          count++;
        } else {
          result[`...and ${Object.keys(data).length - maxProps} more properties`] = '...';
          break;
        }
      }
    }
    
    return result;
  }

  async log(message: string, data?: any) {
    // Process data based on log level
    let processedData = data;
    
    if (data && typeof data === 'object') {
      // In minimal mode, only log essential data properties
      if (this.logLevel === 'minimal') {
        processedData = this.compressData(data, 1);
      } 
      // In compact mode, compress objects but maintain most important structure
      else if (this.logLevel === 'compact') {
        processedData = this.compressData(data, 2);
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

    // Also output to console for development (in compact format)
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
