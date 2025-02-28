// Re-export the debugLogger from shared utilities
import { debugLogger } from '../shared/debugLogger';

// Set default log level to compact to reduce token usage
debugLogger.setLogLevel('compact');

export { debugLogger }; 