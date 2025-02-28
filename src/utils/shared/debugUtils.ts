/**
 * Debug utilities for optimized console logging
 * Reduces token usage while preserving essential information
 */

// Log levels - set this to control verbosity
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5
}

// Default to INFO level unless overridden
let currentLogLevel = LogLevel.INFO;

// Allow setting the log level
export const setLogLevel = (level: LogLevel) => {
  currentLogLevel = level;
  console.log(`Log level set to: ${LogLevel[level]}`);
};

// Get current log level
export const getLogLevel = (): LogLevel => currentLogLevel;

/**
 * Truncate objects for logging to reduce token usage
 */
export const truncate = (obj: any, maxItems: number = 3, maxDepth: number = 1, currentDepth: number = 0): any => {
  // Handle primitive types directly
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  
  // Handle arrays - show limited items
  if (Array.isArray(obj)) {
    if (obj.length <= maxItems || currentDepth >= maxDepth) {
      return obj.length <= maxItems ? 
        obj.map(item => currentDepth < maxDepth ? truncate(item, maxItems, maxDepth, currentDepth + 1) : item) : 
        `[Array(${obj.length})]`;
    }
    
    return [
      ...obj.slice(0, maxItems - 1).map(item => truncate(item, maxItems, maxDepth, currentDepth + 1)),
      `... +${obj.length - (maxItems - 1)} more`
    ];
  }
  
  // Handle objects - limit properties
  if (currentDepth >= maxDepth) {
    return `{Object with ${Object.keys(obj).length} properties}`;
  }
  
  const result: Record<string, any> = {};
  const keys = Object.keys(obj);
  
  if (keys.length <= maxItems) {
    keys.forEach(key => {
      result[key] = truncate(obj[key], maxItems, maxDepth, currentDepth + 1);
    });
    return result;
  }
  
  // For larger objects, show only a subset of properties
  keys.slice(0, maxItems - 1).forEach(key => {
    result[key] = truncate(obj[key], maxItems, maxDepth, currentDepth + 1);
  });
  result[`... +${keys.length - (maxItems - 1)} more`] = '...';
  
  return result;
};

/**
 * Optimized logging functions that reduce token usage
 */
export const debug = {
  // Essential error logging - always show
  error: (message: string, data?: any) => {
    if (currentLogLevel >= LogLevel.ERROR) {
      console.error(`ERROR: ${message}`, data ? truncate(data) : '');
    }
  },
  
  // Warning logs - show details only at higher levels
  warn: (message: string, data?: any) => {
    if (currentLogLevel >= LogLevel.WARN) {
      console.warn(`WARN: ${message}`, data ? truncate(data) : '');
    }
  },
  
  // Information logs - summary data only
  info: (message: string, data?: any) => {
    if (currentLogLevel >= LogLevel.INFO) {
      console.log(`INFO: ${message}`, data ? truncate(data, 3, 1) : '');
    }
  },
  
  // Debug logs - more detailed but still compact
  debug: (message: string, data?: any) => {
    if (currentLogLevel >= LogLevel.DEBUG) {
      console.log(`DEBUG: ${message}`, data ? truncate(data, 5, 2) : '');
    }
  },
  
  // Trace logs - most detailed
  trace: (message: string, data?: any) => {
    if (currentLogLevel >= LogLevel.TRACE) {
      console.log(`TRACE: ${message}`, data);
    }
  },
  
  // Specialized flow path logging
  flowPath: (message: string, path: any[]) => {
    if (currentLogLevel >= LogLevel.INFO) {
      // For flow paths, show total count and first 2-3 items
      const pathCount = path.length;
      const truncatedPath = path.slice(0, 3);
      console.log(`FLOW: ${message} - ${pathCount} items`, truncatedPath);
      
      if (pathCount > 3 && currentLogLevel >= LogLevel.DEBUG) {
        console.log(`FLOW: ... and ${pathCount - 3} more items`);
      }
    }
  },
  
  // Grid visualization with minimal token usage
  grid: (grid: any[][]) => {
    if (currentLogLevel >= LogLevel.DEBUG) {
      if (grid.length <= 6 && grid[0].length <= 6) {
        console.log('GRID:');
        // Simplified grid visualization - single characters
        console.log(grid.map(row => row.map(cell => 
          cell === null ? '.' : 
          typeof cell === 'boolean' ? (cell ? 'T' : 'F') : 
          typeof cell === 'object' ? 'O' : 
          String(cell).charAt(0)
        ).join('')).join('\n'));
      } else {
        console.log(`GRID: ${grid.length}x${grid[0].length} (too large to display)`);
      }
    }
  }
};

// Enable or disable specific features with flags
export const debugFlags = {
  SHOW_FLOW_PATHS: true,
  SHOW_CORNER_DETECTION: true,
  SHOW_REQUIREMENTS_CALC: true,
  SHOW_GRID_VISUALIZATION: true
}; 