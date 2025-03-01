import { GridCell, Requirements } from '../../components/types';
import { findConnectedCubes } from './flowValidator';
import { countCornerConnectors } from '../calculation/configurationDetector';
import { CONFIGURATION_RULES } from '../core/rules';
import { debug, debugFlags } from '../shared/debugUtils';

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
  if (!debugFlags.SHOW_REQUIREMENTS_CALC) return;

  debug.info('Configuration Debug:');
  
  // Log grid dimensions instead of full grid
  debug.info(`Grid: ${grid.length}x${grid[0].length} with ${countCubes(grid)} cubes`);
  
  // Log key requirements instead of full object
  debug.info('Requirements:', {
    fourPacks: requirements.fourPackRegular,
    twoPacks: requirements.twoPackRegular,
    leftPanels: requirements.leftPanels,
    rightPanels: requirements.rightPanels,
    cornerConnectors: requirements.cornerConnectors,
    straightCouplings: requirements.straightCouplings
  });
  
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
      // Log the path length and first few elements
      debug.debug(`Connected Path: ${path.length} cubes`, {
        startPosition: path[0],
        samplePath: path.slice(0, 3)
      });
      
      // Configuration detection
      const configType = detectConfigurationType(requirements);
      debug.info(`Detected type: ${configType || 'unknown'}`);
      
      // Validate against expected
      if (configType) {
        const isValid = validateConfiguration(requirements, configType);
        debug.info(`Valid against PRD: ${isValid}`);
        if (!isValid) {
          // Only log expected requirements if validation fails
          debug.debug(`Expected requirements for ${configType}:`, CONFIGURATION_RULES[configType]);
        }
      }
    } else {
      debug.info('No cubes found in grid');
    }
  } catch (error) {
    debug.error('Error debugging configuration:', error);
  }
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

// Helper function to count cubes in grid
const countCubes = (grid: GridCell[][]): number => {
  let count = 0;
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col].hasCube) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Log configuration debug information in ultra-compact format
 */
export const logConfigurationDebug = (
  grid: GridCell[][] | null,
  requirements: Requirements | null,
  configurationType: string = 'unknown'
) => {
  if (!grid || !requirements) {
    console.log(`CFG:NO_DATA`);
    return;
  }

  // Count cubes in grid
  let cubeCount = 0;
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      if (grid[row][col].hasCube) {
        cubeCount++;
      }
    }
  }

  // Ultra-compact grid info
  console.log(`GRID:${grid.length}×${grid[0].length}|${cubeCount}□`);
  
  // Ultra-compact requirements
  const { fourPackRegular, twoPackRegular, leftPanels, rightPanels, sidePanels, 
          straightCouplings, cornerConnectors } = requirements;
  
  console.log(`REQS:4p=${fourPackRegular} 2p=${twoPackRegular} L=${leftPanels} R=${rightPanels} S=${sidePanels} ⊥=${straightCouplings} ∟=${cornerConnectors}`);
  
  // Configuration type
  console.log(`CFG:${configurationType}`);

  // Show more detailed debug for the panel calculations if enabled
  if (debugFlags.SHOW_REQUIREMENTS_CALC) {
    // Calculate total panels from packages
    const sidePanelsFromFourPack = fourPackRegular * 2;
    const leftPanelsFromFourPack = fourPackRegular;
    const rightPanelsFromFourPack = fourPackRegular;
    const sidePanelsFromTwoPack = twoPackRegular * 2;

    const totalSidePanels = sidePanels + sidePanelsFromFourPack + sidePanelsFromTwoPack;
    const totalLeftPanels = leftPanels + leftPanelsFromFourPack;
    const totalRightPanels = rightPanels + rightPanelsFromFourPack;

    console.log(`PKG_PANEL:4p→${sidePanelsFromFourPack}S+${leftPanelsFromFourPack}L+${rightPanelsFromFourPack}R 2p→${sidePanelsFromTwoPack}S`);
    console.log(`TOTAL:${totalSidePanels}S+${totalLeftPanels}L+${totalRightPanels}R`);
  }
}; 