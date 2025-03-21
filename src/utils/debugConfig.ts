/**
 * Debug configuration for the application
 * This initializes debug settings for the entire app
 * Optimized for machine-readable logs with ~90% reduction in verbosity
 */
import { setLogLevel, LogLevel, debugFlags, setUltraCompactMode } from './shared/debugUtils';

/**
 * Initialize debug settings
 * This is called during application startup
 */
export function initializeDebugSettings(options: {
  level?: 'none' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  flowPaths?: boolean;
  cornerDetection?: boolean;
  requirementsCalc?: boolean;
  gridVisualization?: boolean;
  ultraCompact?: boolean;
} = {}) {
  // Set default log level if not specified
  const level = options.level || 'info';
  
  // Map string level to enum
  const logLevelMap: Record<string, LogLevel> = {
    'none': LogLevel.NONE,
    'error': LogLevel.ERROR,
    'warn': LogLevel.WARN,
    'info': LogLevel.INFO,
    'debug': LogLevel.DEBUG,
    'trace': LogLevel.TRACE
  };
  
  // Set log level
  setLogLevel(logLevelMap[level]);
  
  // Set ultra-compact mode for machine-readable logs
  const ultraCompact = options.ultraCompact !== undefined ? options.ultraCompact : true;
  setUltraCompactMode(ultraCompact);
  
  // Set debug flags
  if (options.flowPaths !== undefined) debugFlags.SHOW_FLOW_PATHS = options.flowPaths;
  if (options.cornerDetection !== undefined) debugFlags.SHOW_CORNER_DETECTION = options.cornerDetection;
  if (options.requirementsCalc !== undefined) debugFlags.SHOW_REQUIREMENTS_CALC = options.requirementsCalc;
  if (options.gridVisualization !== undefined) debugFlags.SHOW_GRID_VISUALIZATION = options.gridVisualization;
  
  // Log initialization (ultra-compact)
  console.log(`D↑${level}`);
  console.log(`DF:${Object.keys(debugFlags).filter(k => debugFlags[k as keyof typeof debugFlags]).length}`);
}

// Default initialization with production-ready settings - ultra-compact mode enabled
initializeDebugSettings({
  level: process.env.NODE_ENV === 'production' ? 'error' : 'info',
  flowPaths: process.env.NODE_ENV !== 'production',
  cornerDetection: process.env.NODE_ENV !== 'production',
  requirementsCalc: true, // Always show requirements calculation
  gridVisualization: false, // Disable grid visualization to reduce log volume
  ultraCompact: true // Enable ultra-compact mode for machine-readable logs
}); 