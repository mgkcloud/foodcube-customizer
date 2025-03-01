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

// Enable compact mode to further reduce log output
let compactMode = true;
// Enable ultra-compact mode for machine-readable outputs
let ultraCompactMode = true;

// Abbreviations dictionary for common terms
const abbr: Record<string, string> = {
  "INFO": "I",
  "ERROR": "E",
  "WARNING": "W",
  "DEBUG": "D",
  "TRACE": "T",
  "Configuration": "Cfg",
  "Requirements": "Reqs",
  "Detected": "Det",
  "Analysis": "Anlys",
  "Previous": "Prev",
  "Direction": "Dir",
  "Endpoint": "EP",
  "Connection": "Conn",
  "Natural": "Nat",
  "Standard": "Std",
  "Potential": "Pot",
  "Straight": "Str",
  "Through": "Thru",
  "Connector": "Conn",
  "Valid": "V",
  "Invalid": "Inv",
  "North": "N",
  "South": "S",
  "East": "E",
  "West": "W",
  "Special": "Spcl",
  "Visualization": "VIZ",
  "assigned": "→",
  "detected": "!",
  "Analyzing": ">>",
  "analysis": ">>",
  "subgrid": "sg",
  "calculating": "calc",
  "left": "L",
  "right": "R",
  "side": "S",
  "panel": "p",
  "edge": "e",
  "found": "✓",
  "Cell": "C",
  "State": "St",
  "blocks": "blk",
  "connected": "→",
  "total": "Σ",
  "calculated": "=",
  "package": "pkg",
  "counts": "n",
  "flow": "→",
  "cube": "□",
  "first": "1st",
  "last": "lst"
};

// Allow setting the log level
export const setLogLevel = (level: LogLevel) => {
  currentLogLevel = level;
  console.log(`Log level: ${LogLevel[level]}`);
};

// Set compact mode on/off
export const setCompactMode = (compact: boolean) => {
  compactMode = compact;
  console.log(`Compact mode: ${compact}`);
};

// Set ultra-compact mode on/off
export const setUltraCompactMode = (ultra: boolean) => {
  ultraCompactMode = ultra;
  console.log(`Ultra-compact mode: ${ultra}`);
};

// Get current log level
export const getLogLevel = (): LogLevel => currentLogLevel;

/**
 * Compacts message by replacing common terms with abbreviations
 */
const compactify = (message: string): string => {
  if (!compactMode && !ultraCompactMode) return message;
  
  let result = message;
  for (const [term, short] of Object.entries(abbr)) {
    result = result.replace(new RegExp(term, 'g'), short);
  }
  
  if (ultraCompactMode) {
    // Additional machine-readable formatting
    result = result
      .replace(/Edge ([NSEW]) subgrid analysis:/g, 'E$1:')
      .replace(/Edge ([NSEW]) has (.*) red blocks, assigning ([A-Z]+) panel/g, 'E$1:$2→$3')
      .replace(/VISUALIZATION: Panel \[(\d+),(\d+):([NSEW])\]:/g, 'VIZ[$1,$2:$3]')
      .replace(/VISUALIZATION: All panels for cube \[(\d+),(\d+)\]:/g, 'PANELS[$1,$2]')
      .replace(/CladdingVisualizer \[(\d+),(\d+)\]/g, 'CLAD[$1,$2]')
      .replace(/(?:Flow Configuration:|Cell State:)/g, '')
      .replace(/\{.+hasCube.+\}/g, '{...}') // Condense detailed cell state objects
      .replace(/\{.+entry.+exit.+\}/g, '{...}') // Condense flow configuration objects
      .replace(/"(\w+)": /g, '$1:') // Remove quotes from JSON keys
      .replace(/console\.(log|warn|error)/g, 'log') // Shorten console calls
      .replace(/PANEL COUNT DEBUG:/g, 'PANELS:')
      .replace(/- Raw panel counts/g, '- Raw')
      .replace(/- Package counts/g, '- Pkg')
      .replace(/- Panels contributed by/g, '- From')
      .replace(/- Total calculated/g, '- Σ')
      .replace(/Grid State Update/g, 'GRID_UPD')
      .replace(/===== DEBUG MODE ENABLED =====/g, '===DEBUG===')
      .replace(/Current Requirements:/g, 'REQS:');
  }
  
  return result;
};

/**
 * Format a value for compact logging
 */
const formatValue = (value: any): string => {
  if (!value) return '';
  
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return `[${value.length}]`;
    }
    
    if (ultraCompactMode) {
      const keys = Object.keys(value);
      if (keys.length <= 3) {
        return `{${keys.map(k => `${k}:${formatValue(value[k])}`).join(',')}}`;
      }
      return `{${keys.length}}`;
    }
  }
  
  return String(value);
};

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
        `[${obj.length}]`;
    }
    
    return [
      ...obj.slice(0, 2).map(item => truncate(item, maxItems, maxDepth, currentDepth + 1)),
      `+${obj.length - 2}`
    ];
  }
  
  // Handle objects - limit properties
  if (currentDepth >= maxDepth) {
    return `{${Object.keys(obj).length}}`;
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
  keys.slice(0, 2).forEach(key => {
    result[key] = truncate(obj[key], maxItems, maxDepth, currentDepth + 1);
  });
  result[`+${keys.length - 2}`] = '...';
  
  return result;
};

/**
 * Optimized logging functions that reduce token usage
 */
export const debug = {
  // Essential error logging - always show
  error: (message: string, data?: any) => {
    if (currentLogLevel >= LogLevel.ERROR) {
      console.error(`E:${compactify(message)}`, data ? truncate(data) : '');
    }
  },
  
  // Warning logs - show details only at higher levels
  warn: (message: string, data?: any) => {
    if (currentLogLevel >= LogLevel.WARN) {
      console.warn(`W:${compactify(message)}`, data ? truncate(data) : '');
    }
  },
  
  // Information logs - summary data only
  info: (message: string, data?: any) => {
    if (currentLogLevel >= LogLevel.INFO) {
      console.log(`${compactify(message)}`, data ? truncate(data, 2, 1) : '');
    }
  },
  
  // Debug logs - more detailed but still compact
  debug: (message: string, data?: any) => {
    if (currentLogLevel >= LogLevel.DEBUG) {
      console.log(`D:${compactify(message)}`, data ? truncate(data, 3, 1) : '');
    }
  },
  
  // Trace logs - most detailed
  trace: (message: string, data?: any) => {
    if (currentLogLevel >= LogLevel.TRACE) {
      console.log(`T:${compactify(message)}`, data ? truncate(data, 1, 1): '');
    }
  },
  
  // Specialized flow path logging
  flowPath: (message: string, path: any[]) => {
    if (currentLogLevel >= LogLevel.INFO) {
      // For flow paths, show total count and first 2 items
      const pathCount = path.length;
      console.log(`FLOW:${compactify(message)} ${pathCount}i`, truncate(path, 2, 1));
    }
  },
  
  // Grid visualization with minimal token usage
  grid: (grid: any[][]) => {
    if (currentLogLevel >= LogLevel.DEBUG) {
      console.log(`GRID:${grid.length}x${grid[0].length}`);
    }
  },
  
  // Cube position shorthand - reduces [row,col] format
  pos: (row: number, col: number, extraInfo: string = ''): string => {
    return `${row},${col}${extraInfo ? ':'+extraInfo : ''}`;
  },
  
  // Connection info shorthand
  conn: (from: [number, number], to: [number, number], type: string = ''): string => {
    return `${from[0]},${from[1]}→${to[0]},${to[1]}${type ? ':'+type : ''}`;
  }
};

// Enable or disable specific features with flags
export const debugFlags = {
  SHOW_FLOW_PATHS: true,
  SHOW_CORNER_DETECTION: true,
  SHOW_REQUIREMENTS_CALC: true,
  SHOW_GRID_VISUALIZATION: false,  // Turn off verbose grid visualization
  AUTO_FIX_FLOW_MISMATCHES: false  // By default, don't auto-fix flow mismatches
}; 