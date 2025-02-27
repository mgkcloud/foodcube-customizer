import { runFlowCalculatorTests } from './flowCalculatorTests';

/**
 * Main test runner function
 */
export function runAllTests() {
  console.log('Starting test suite...');
  
  // Run flow calculator tests
  runFlowCalculatorTests();
  
  console.log('All tests completed.');
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  (window as any).runTests = true;
  runAllTests();
} 