// Console interceptor to capture all console logs
import { debugLogger } from './debugLogger';

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
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    debugLogger.log('console.log', { args: message });
    originalConsole.log.apply(console, args);
  };

  // Intercept console.error
  console.error = function(...args) {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    debugLogger.log('console.error', { args: message });
    originalConsole.error.apply(console, args);
  };

  // Intercept console.warn
  console.warn = function(...args) {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    debugLogger.log('console.warn', { args: message });
    originalConsole.warn.apply(console, args);
  };

  // Intercept console.info
  console.info = function(...args) {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    debugLogger.log('console.info', { args: message });
    originalConsole.info.apply(console, args);
  };

  // Intercept console.debug
  console.debug = function(...args) {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    debugLogger.log('console.debug', { args: message });
    originalConsole.debug.apply(console, args);
  };
}
