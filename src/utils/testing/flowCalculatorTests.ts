import { PathCube } from '../calculation/flowAnalyzer';
import { calculateRequirements } from '../calculation/requirementsCalculator';
import { CONFIGURATION_RULES } from '../core/rules';

/**
 * Test utility to create a path cube with specified entry and exit directions
 */
function createPathCube(row: number, col: number, entry: string | null, exit: string | null): PathCube {
  // Determine flow direction based on entry/exit
  let flowDirection: 'horizontal' | 'vertical' = 'horizontal';
  if (
    (entry === 'N' && exit === 'S') || 
    (entry === 'S' && exit === 'N') ||
    (entry === null && exit === 'N') ||
    (entry === null && exit === 'S') ||
    (entry === 'N' && exit === null) ||
    (entry === 'S' && exit === null)
  ) {
    flowDirection = 'vertical';
  }
  
  return {
    row,
    col,
    subgrid: [{ subgridRow: 0, subgridCol: 0 }],
    entry: entry as any,
    exit: exit as any,
    flowDirection,
    rotation: 0
  };
}

/**
 * Tests for the flow-based calculation approach
 */
export function runFlowCalculatorTests() {
  console.log('Running flow calculator tests...');
  
  // Test 1: Single cube
  testSingleCube();
  
  // Test 2: Three cubes in a line
  testThreeCubesLine();
  
  // Test 3: L-shaped configuration
  testLShape();
  
  // Test 4: U-shaped configuration
  testUShape();
  
  // Log test results
  const passedTests = document.querySelectorAll('.test-passed').length;
  const totalTests = 4;
  console.log(`\nTest Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests < totalTests) {
    console.error(`${totalTests - passedTests} tests failed. Please check the implementation.`);
  }
}

/**
 * Test for a single cube configuration
 */
function testSingleCube() {
  console.log('\nTesting single cube configuration...');
  
  // Create a single cube with N->S flow
  const path: PathCube[] = [
    createPathCube(0, 0, null, 'S')
  ];
  
  // Calculate requirements
  const requirements = calculateRequirements(path);
  
  // Compare with expected results
  const expected = CONFIGURATION_RULES.SINGLE_CUBE;
  
  console.log('Single cube requirements:', requirements);
  console.log('Expected:', expected);
  
  // Verify results
  const isValid = 
    requirements.fourPackRegular === expected.fourPackRegular &&
    requirements.twoPackRegular === expected.twoPackRegular &&
    requirements.leftPanels === expected.leftPanels &&
    requirements.rightPanels === expected.rightPanels &&
    requirements.sidePanels === expected.sidePanels &&
    requirements.straightCouplings === expected.straightCouplings &&
    requirements.cornerConnectors === expected.cornerConnectors;
  
  console.log(`Single cube test ${isValid ? 'PASSED' : 'FAILED'}`);
  
  if (!isValid) {
    console.error('Test failed: Single cube requirements do not match expected values');
  }
}

/**
 * Test for three cubes in a line configuration
 */
function testThreeCubesLine() {
  console.log('\nTesting three cubes in a line configuration...');
  
  // Create three cubes in a line with flow from left to right
  const path: PathCube[] = [
    createPathCube(0, 0, null, 'E'),
    createPathCube(0, 1, 'W', 'E'),
    createPathCube(0, 2, 'W', null)
  ];
  
  // Calculate requirements
  const requirements = calculateRequirements(path);
  
  // Compare with expected results
  const expected = CONFIGURATION_RULES.THREE_LINE;
  
  console.log('Three cubes line requirements:', requirements);
  console.log('Expected:', expected);
  
  // Verify results
  const isValid = 
    requirements.fourPackRegular === expected.fourPackRegular &&
    requirements.twoPackRegular === expected.twoPackRegular &&
    requirements.leftPanels === expected.leftPanels &&
    requirements.rightPanels === expected.rightPanels &&
    requirements.sidePanels === expected.sidePanels &&
    requirements.straightCouplings === expected.straightCouplings &&
    requirements.cornerConnectors === expected.cornerConnectors;
  
  console.log(`Three cubes line test ${isValid ? 'PASSED' : 'FAILED'}`);
  
  if (!isValid) {
    console.error('Test failed: Three cubes line requirements do not match expected values');
  }
}

/**
 * Test for L-shaped configuration
 */
function testLShape() {
  console.log('\nTesting L-shaped configuration...');
  
  // Create an L-shaped configuration with flow from top to right
  const path: PathCube[] = [
    createPathCube(0, 0, null, 'S'),
    createPathCube(1, 0, 'N', 'E'),
    createPathCube(1, 1, 'W', null)
  ];
  
  // Calculate requirements
  const requirements = calculateRequirements(path);
  
  // Compare with expected results
  const expected = CONFIGURATION_RULES.L_SHAPE;
  
  console.log('L-shape requirements:', requirements);
  console.log('Expected:', expected);
  
  // Verify results
  const isValid = 
    requirements.fourPackRegular === expected.fourPackRegular &&
    requirements.twoPackRegular === expected.twoPackRegular &&
    requirements.leftPanels === expected.leftPanels &&
    requirements.rightPanels === expected.rightPanels &&
    requirements.sidePanels === expected.sidePanels &&
    requirements.straightCouplings === expected.straightCouplings &&
    requirements.cornerConnectors === expected.cornerConnectors;
  
  console.log(`L-shape test ${isValid ? 'PASSED' : 'FAILED'}`);
  
  if (!isValid) {
    console.error('Test failed: L-shape requirements do not match expected values');
  }
}

/**
 * Test for U-shaped configuration
 */
function testUShape() {
  console.log('\nTesting U-shaped configuration...');
  
  // Create a U-shaped configuration
  const path: PathCube[] = [
    createPathCube(0, 0, null, 'E'),
    createPathCube(0, 1, 'W', 'E'),
    createPathCube(0, 2, 'W', 'S'),
    createPathCube(1, 2, 'N', 'W'),
    createPathCube(1, 1, 'E', 'W'),
    createPathCube(1, 0, 'E', null)
  ];
  
  // Calculate requirements
  const requirements = calculateRequirements(path);
  
  // Compare with expected results
  const expected = CONFIGURATION_RULES.U_SHAPE;
  
  console.log('U-shape requirements:', requirements);
  console.log('Expected:', expected);
  
  // Verify results
  const isValid = 
    requirements.fourPackRegular === expected.fourPackRegular &&
    requirements.twoPackRegular === expected.twoPackRegular &&
    requirements.leftPanels === expected.leftPanels &&
    requirements.rightPanels === expected.rightPanels &&
    requirements.sidePanels === expected.sidePanels &&
    requirements.straightCouplings === expected.straightCouplings &&
    requirements.cornerConnectors === expected.cornerConnectors;
  
  console.log(`U-shape test ${isValid ? 'PASSED' : 'FAILED'}`);
  
  if (!isValid) {
    console.error('Test failed: U-shape requirements do not match expected values');
  }
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined' && (window as any).runTests) {
  runFlowCalculatorTests();
} 