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
// Enable ultra-compact mode for machine-readable outputs (reduced to 10% verbosity)
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
 * Ultra-compact mode reduces messages to ~10% of original size
 */
const compactify = (message: string): string => {
  if (!compactMode && !ultraCompactMode) return message;
  
  let result = message;
  for (const [term, short] of Object.entries(abbr)) {
    result = result.replace(new RegExp(term, 'g'), short);
  }
  
  if (ultraCompactMode) {
    // Additional machine-readable formatting for ultra-compact mode
    
    // If message is very long, hash it instead
    if (result.length > 80) {
      // Create a simple hash of the message
      let hash = 0;
      for (let i = 0; i < result.length; i++) {
        hash = ((hash << 5) - hash) + result.charCodeAt(i);
        hash |= 0;
      }
      
      // Extract the first few words as prefix for context
      const prefix = result.split(/\s+/).slice(0, 2).join(' ');
      return `${prefix}#${(hash >>> 0).toString(36).slice(0, 4)}`;
    }
    
    // Aggressively compress common patterns
    result = result
      // Remove all common prefixes
      .replace(/^(Calculating|Processing|Analyzing|Detecting|Validating|Checking|Evaluating)/i, '')
      // Compress edge references
      .replace(/Edge ([NSEW]) subgrid analysis:/g, 'E$1:')
      .replace(/Edge ([NSEW]) has (.*) red blocks, assigning ([A-Z]+) panel/g, 'E$1:$2→$3')
      // Compress visualization references
      .replace(/VISUALIZATION: Panel \[(\d+),(\d+):([NSEW])\]:/g, 'V[$1,$2:$3]')
      .replace(/VISUALIZATION: All panels for cube \[(\d+),(\d+)\]:/g, 'P[$1,$2]')
      .replace(/CladdingVisualizer \[(\d+),(\d+)\]/g, 'C[$1,$2]')
      // Remove common labels
      .replace(/(?:Flow Configuration:|Cell State:|Processing:|Found:|Result:|Value:|Status:)/g, '')
      // Condense JSON-like objects
      .replace(/\{[^{}]{30,}\}/g, '{...}') // Condense lengthy objects
      .replace(/"(\w+)": /g, '$1:') // Remove quotes from JSON keys
      // Compress common operations
      .replace(/console\.(log|warn|error)/g, 'l')
      .replace(/Detected configuration type:/g, 'CFG:')
      // Compress panel counts
      .replace(/PANEL COUNT DEBUG:/g, 'P:')
      .replace(/- Raw panel counts/g, 'R')
      .replace(/- Package counts/g, 'K')
      .replace(/- Panels contributed by/g, 'C')
      .replace(/- Total calculated/g, 'T')
      // Compress grid updates
      .replace(/Grid State Update/g, 'G↻')
      .replace(/Debug initialized with level:/g, 'D↑')
      .replace(/Debug flags:/g, 'DF:')
      .replace(/===== DEBUG MODE ENABLED =====/g, '↑D↑')
      .replace(/Current Requirements:/g, 'R:')
      // Remove spaces around operators and punctuation
      .replace(/\s*([=:→<>+\-*/])\s*/g, '$1')
      // Cut off long messages
      .replace(/^(.{60}).{10,}$/, '$1...');
      
    // Extreme compression for specific known messages
    if (result.includes('Detected configuration type:')) {
      result = result.replace(/Detected configuration type: ([a-zA-Z-]+)/, 'CFG:$1');
    }
    if (result.includes('Debug initialized with level')) {
      result = result.replace(/Debug initialized with level: (\w+)/, 'D↑$1');
    }
  }
  
  return result.trim();
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
 * Ultra-compact mode reduces output to approximately 10% of original size
 */
export const truncate = (obj: any, maxItems: number = 3, maxDepth: number = 1, currentDepth: number = 0): any => {
  // Handle primitive types directly
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  
  // In ultra-compact mode, use even more aggressive truncation
  if (ultraCompactMode) {
    maxItems = 1;
    maxDepth = 0;
  }
  
  // Handle arrays - show minimal items in ultra-compact mode
  if (Array.isArray(obj)) {
    // Just show array length for most arrays
    if (ultraCompactMode && obj.length > 1) {
      return `[${obj.length}]`;
    }
    
    if (obj.length <= maxItems || currentDepth >= maxDepth) {
      return obj.length <= maxItems ? 
        obj.map(item => currentDepth < maxDepth ? truncate(item, maxItems, maxDepth, currentDepth + 1) : item) : 
        `[${obj.length}]`;
    }
    
    return [
      ...obj.slice(0, 1).map(item => truncate(item, maxItems, maxDepth, currentDepth + 1)),
      `+${obj.length - 1}`
    ];
  }
  
  // Handle objects - limit properties
  if (currentDepth >= maxDepth) {
    return `{${Object.keys(obj).length}}`;
  }
  
  // In ultra-compact mode, just show object size
  if (ultraCompactMode) {
    const keys = Object.keys(obj);
    // Show a super-compact representation for common objects
    if (keys.includes('row') && keys.includes('col')) {
      return `{${obj.row},${obj.col}}`;
    }
    if (keys.includes('entry') && keys.includes('exit')) {
      return `{${obj.entry||'-'}→${obj.exit||'-'}}`;
    }
    return `{${keys.length}}`;
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
  keys.slice(0, 1).forEach(key => {
    result[key] = truncate(obj[key], maxItems, maxDepth, currentDepth + 1);
  });
  result[`+${keys.length - 1}`] = '...';
  
  return result;
};

/**
 * Ultra-optimized logging functions that reduce token usage by 90%
 */
export const debug = {
  // Essential error logging - always show
  error: (message: string, data?: any) => {
    if (currentLogLevel >= LogLevel.ERROR) {
      console.error(`E:${compactify(message)}`, data ? truncate(data) : '');
    }
  },
  
  // Warning logs - minimal detail
  warn: (message: string, data?: any) => {
    if (currentLogLevel >= LogLevel.WARN) {
      console.warn(`W:${compactify(message)}`, data ? truncate(data) : '');
    }
  },
  
  // Information logs - extremely condensed
  info: (message: string, data?: any) => {
    if (currentLogLevel >= LogLevel.INFO) {
      console.log(`${compactify(message)}`, data ? truncate(data, 1, 0) : '');
    }
  },
  
  // Debug logs - machine-readable format
  debug: (message: string, data?: any) => {
    if (currentLogLevel >= LogLevel.DEBUG) {
      // In ultra-compact mode, use hash values for non-critical logs
      if (ultraCompactMode) {
        // Object hashing function to create a compact signature
        const hash = (obj: any): string => {
          if (!obj) return '0';
          if (typeof obj !== 'object') return String(obj).slice(0, 4);
          const str = JSON.stringify(obj);
          let h = 0;
          for (let i = 0; i < str.length; i++) {
            h = ((h << 5) - h) + str.charCodeAt(i);
            h |= 0;
          }
          return (h & 0xFFFFFF).toString(16); // Last 6 hex digits
        };
        
        console.log(`D:${compactify(message)}#${hash(data)}`);
      } else {
        console.log(`D:${compactify(message)}`, data ? truncate(data, 2, 0) : '');
      }
    }
  },
  
  // Trace logs - only when absolutely needed
  trace: (message: string, data?: any) => {
    if (currentLogLevel >= LogLevel.TRACE) {
      if (ultraCompactMode) {
        // Skip most trace logs in ultra-compact mode
        if (Math.random() < 0.1) { // Only log ~10% of trace messages
          console.log(`T:${compactify(message)}`);
        }
      } else {
        console.log(`T:${compactify(message)}`, data ? truncate(data, 1, 0): '');
      }
    }
  },
  
  // Specialized flow path logging - essential for flow analysis
  flowPath: (message: string, path: any[]) => {
    if (currentLogLevel >= LogLevel.INFO) {
      const pathCount = path.length;
      if (ultraCompactMode) {
        // Just log the count and first/last positions for flows
        const first = path[0];
        const last = path[path.length - 1];
        console.log(`F:${compactify(message)}#${pathCount}`);
      } else {
        console.log(`FLOW:${compactify(message)} ${pathCount}i`, truncate(path, 2, 1));
      }
    }
  },
  
  // Grid visualization with minimal token usage
  grid: (grid: any[][]) => {
    if (currentLogLevel >= LogLevel.DEBUG && !ultraCompactMode) {
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