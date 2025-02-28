// Console interceptor to capture all console logs
import { debugLogger } from './debugLogger';

// Helper function to efficiently stringify objects
const efficientStringify = (arg: any): string => {
  if (arg === null || arg === undefined) {
    return String(arg);
  }
  
  if (typeof arg !== 'object') {
    return String(arg);
  }
  
  // For objects, use a compact representation
  try {
    if (Array.isArray(arg)) {
      if (arg.length <= 3) {
        return JSON.stringify(arg);
      }
      return `[Array(${arg.length}): ${JSON.stringify(arg.slice(0, 2))}...]`;
    }
    
    // For larger objects, limit properties
    const keys = Object.keys(arg);
    if (keys.length <= 3) {
      return JSON.stringify(arg);
    }
    
    const truncatedObj: Record<string, any> = {};
    keys.slice(0, 3).forEach(key => {
      truncatedObj[key] = arg[key];
    });
    return `{Object with ${keys.length} keys: ${JSON.stringify(truncatedObj)}...}`;
  } catch (e) {
    return '[Object]';
  }
};

export function interceptConsole() {
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug
  };

  // Intercept console.log
  console.log = function(...args) {
    // Skip JSON.stringify for large objects to reduce token usage
    const message = args.map(efficientStringify).join(' ');
    
    debugLogger.log('console.log', { args: message });
    originalConsole.log.apply(console, args);
  };

  // Intercept console.error
  console.error = function(...args) {
    const message = args.map(efficientStringify).join(' ');
    
    debugLogger.log('console.error', { args: message });
    originalConsole.error.apply(console, args);
  };

  // Intercept console.warn
  console.warn = function(...args) {
    const message = args.map(efficientStringify).join(' ');
    
    debugLogger.log('console.warn', { args: message });
    originalConsole.warn.apply(console, args);
  };

  // Intercept console.info
  console.info = function(...args) {
    const message = args.map(efficientStringify).join(' ');
    
    debugLogger.log('console.info', { args: message });
    originalConsole.info.apply(console, args);
  };

  // Intercept console.debug
  console.debug = function(...args) {
    const message = args.map(efficientStringify).join(' ');
    
    debugLogger.log('console.debug', { args: message });
    originalConsole.debug.apply(console, args);
  };
}
