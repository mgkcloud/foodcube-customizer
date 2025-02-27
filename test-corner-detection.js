// Create a simple test script
const { execSync } = require('child_process');

try {
  const output = execSync('npx jest --config jest.config.cjs src/utils/__tests__/calculation/cornerDetection.test.ts', { 
    encoding: 'utf-8',
    stdio: 'inherit'
  });
  console.log(output);
} catch (error) {
  console.error('Test failed:', error.message);
  process.exit(1);
} 