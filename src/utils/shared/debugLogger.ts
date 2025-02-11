// Debug logger utility to capture and expose logs
class DebugLogger {
  private static instance: DebugLogger;
  private apiUrl = 'http://localhost:3001/api/debug-logs';

  private constructor() {}

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  async log(message: string, data?: any) {
    // Send to API
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, data })
      });

      if (!response.ok) {
        console.error('Failed to send log to API:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending log to API:', error);
    }

    // Also output to console for development
    console.log(message, data);
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
