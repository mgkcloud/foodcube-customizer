import { GridCell, Requirements } from '@/components/types';
import { PathCube } from '../calculation/flowAnalyzer';
import { findConnectedCubes } from './flowValidator';
import { countCornerConnectors } from '../calculation/configurationDetector';
import { CONFIGURATION_RULES } from '../core/rules';

/**
 * Validate a configuration against expected results from PRD
 */
export const validateConfiguration = (requirements: Requirements, expectedType: 'SINGLE_CUBE' | 'THREE_LINE' | 'L_SHAPE' | 'U_SHAPE'): boolean => {
  // Get expected requirements for this configuration type
  const expected = CONFIGURATION_RULES[expectedType];
  
  // Compare each property
  return (
    requirements.fourPackRegular === expected.fourPackRegular &&
    requirements.fourPackExtraTall === expected.fourPackExtraTall &&
    requirements.twoPackRegular === expected.twoPackRegular &&
    requirements.twoPackExtraTall === expected.twoPackExtraTall &&
    requirements.leftPanels === expected.leftPanels &&
    requirements.rightPanels === expected.rightPanels &&
    requirements.sidePanels === expected.sidePanels &&
    requirements.cornerConnectors === expected.cornerConnectors &&
    requirements.straightCouplings === expected.straightCouplings
  );
};

/**
 * Debug a configuration and output detailed information
 */
export const debugConfiguration = (grid: GridCell[][], requirements: Requirements): void => {
  console.group('Configuration Debugger');
  console.log('Grid:', grid);
  console.log('Requirements:', requirements);
  
  // Find connected cubes path
  try {
    // Find starting position (first cube in grid)
    let startRow = -1, startCol = -1;
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (grid[row][col].hasCube) {
          startRow = row;
          startCol = col;
          break;
        }
      }
      if (startRow !== -1) break;
    }
    
    if (startRow !== -1 && startCol !== -1) {
      const path = findConnectedCubes(grid, startRow, startCol);
      console.log('Connected Path:', path);
      
      // Configuration detection
      const configType = detectConfigurationType(requirements);
      console.log('Detected configuration type:', configType);
      
      // Validate against expected
      if (configType) {
        const isValid = validateConfiguration(requirements, configType);
        console.log('Valid against PRD requirements:', isValid);
      }
    } else {
      console.log('No cubes found in grid');
    }
  } catch (error) {
    console.error('Error debugging configuration:', error);
  }
  
  console.groupEnd();
};

/**
 * Detect the configuration type based on requirements
 */
const detectConfigurationType = (requirements: Requirements): 'SINGLE_CUBE' | 'THREE_LINE' | 'L_SHAPE' | 'U_SHAPE' | null => {
  // Check if it matches predefined configurations
  
  // Single cube (4 edges)
  if (
    requirements.fourPackRegular === 1 &&
    requirements.twoPackRegular === 0 &&
    requirements.cornerConnectors === 0 &&
    requirements.straightCouplings === 0
  ) {
    return 'SINGLE_CUBE';
  }
  
  // Three cubes in line (8 edges)
  if (
    requirements.fourPackRegular === 1 &&
    requirements.twoPackRegular === 2 &&
    requirements.cornerConnectors === 0 &&
    requirements.straightCouplings === 2
  ) {
    return 'THREE_LINE';
  }
  
  // L-shape (8 edges)
  if (
    requirements.fourPackRegular === 1 &&
    requirements.twoPackRegular === 1 &&
    requirements.leftPanels === 1 &&
    requirements.cornerConnectors === 1 &&
    requirements.straightCouplings === 1
  ) {
    return 'L_SHAPE';
  }
  
  // U-shape (12 edges)
  if (
    requirements.fourPackRegular === 1 &&
    requirements.twoPackRegular === 2 &&
    requirements.cornerConnectors === 2 &&
    requirements.straightCouplings === 2
  ) {
    return 'U_SHAPE';
  }
  
  return null;
}; 