import { PanelRequirements, CompassDirection, TotalRequirements } from './types';
import { getOppositeDirection } from '../shared/gridUtils';

// Valid turns and their coupling types
export const VALID_TURNS = new Map<string, 'corner-left' | 'corner-right'>([
  ['N→E', 'corner-right'],
  ['E→S', 'corner-right'],
  ['S→W', 'corner-right'],
  ['W→N', 'corner-right'],
  ['N→W', 'corner-left'],
  ['W→S', 'corner-left'],
  ['S→E', 'corner-left'],
  ['E→N', 'corner-left'],
]);

export const STRAIGHT_PATHS = new Set(['N→S', 'S→N', 'E→W', 'W→E']);

// Raw panel counts for different configurations
export const RAW_PANEL_COUNTS = {
  // For a single cube with all edges(4 edges) cladded
  SINGLE_CUBE: {
    sidePanels: 2,
    leftPanels: 1,
    rightPanels: 1,
    straightCouplings: 0,
    cornerConnectors: 0
  },
  // For three cubes in a line(8 edges)
  THREE_LINE: {
    sidePanels: 6,
    leftPanels: 1,
    rightPanels: 1,
    straightCouplings: 2,
    cornerConnectors: 0
  },
  // For L-shaped configuration(8 edges)
  L_SHAPE: {
    sidePanels: 5,
    leftPanels: 2,
    rightPanels: 1,
    straightCouplings: 1,
    cornerConnectors: 1
  },
  // For U-shaped (12 edges) configurations
  U_SHAPE: {
    sidePanels: 8,
    leftPanels: 2,
    rightPanels: 2,
    straightCouplings: 2,
    cornerConnectors: 2
  }
};

// Ground truth configuration rules - final packed panels
export const CONFIGURATION_RULES = {
  // For a single cube with all edges(4 edges) cladded, we should get:
  // 1 four-pack (2 side + 1 left + 1 right)
  SINGLE_CUBE: {
    fourPackRegular: 1,
    fourPackExtraTall: 0,
    twoPackRegular: 0,
    twoPackExtraTall: 0,
    leftPanels: 0,
    rightPanels: 0,
    sidePanels: 0,
    straightCouplings: 0,
    cornerConnectors: 0
  },
  // For three cubes in a line(8 edges), we should get:
  // 1 four-pack (2 side + 1 left + 1 right)
  // 2 two-packs (2 sides each)
  // 2 straight couplings
  THREE_LINE: {
    fourPackRegular: 1,
    fourPackExtraTall: 0,
    twoPackRegular: 2,
    twoPackExtraTall: 0,
    leftPanels: 0,
    rightPanels: 0,
    sidePanels: 0,
    straightCouplings: 2,
    cornerConnectors: 0
  },
  // For L-shaped configuration(8 edges), we should get:
  // 1 four-pack (2 side + 1 right + 1 left)
  // 1 left panel (1 side)
  // 1 two-pack (2 sides)
  // 1 corner connector
  // 1 straight coupling
  L_SHAPE: {
    fourPackRegular: 1,
    fourPackExtraTall: 0,
    twoPackRegular: 1,
    twoPackExtraTall: 0,
    leftPanels: 1,
    rightPanels: 0,
    sidePanels: 0,
    straightCouplings: 1,
    cornerConnectors: 1
  },
  // For U-shaped (12 edges) configurations:
  // 1 four-pack (2 side + 1 right + 1 left)
  // 2 two-packs (2 sides each)
  // 2 corner connectors
  // 2 straight couplings
  U_SHAPE: {
    fourPackRegular: 1,
    fourPackExtraTall: 0,
    twoPackRegular: 2,
    twoPackExtraTall: 0,
    leftPanels: 0,
    rightPanels: 0,
    sidePanels: 0,
    straightCouplings: 2,
    cornerConnectors: 2
  }
} as const;

/**
 * Determine the panel type (side, left, right) for a given edge based on
 * irrigation flow through the cube.
 * Uses ultra-compact logging to reduce verbosity.
 */
export const getPanelType = (
  edge: CompassDirection,
  entry: CompassDirection | null,
  exit: CompassDirection | null,
  subgrid?: boolean[][]
): 'side' | 'left' | 'right' => {
  // For a single cube (no entry or exit), assign specific panels based on known configuration
  if (!entry && !exit) {
    // Use the single cube panel assignment from ground truth
    // In a single cube, N and S are side panels, W is left, E is right
    if (edge === 'N' || edge === 'S') {
      return 'side';
    } else if (edge === 'W') {
      return 'left';
    } else if (edge === 'E') {
      return 'right';
    }
  }
  
  // If we have subgrid data, use it for more accurate panel type determination
  if (subgrid) {
    return determineTypeBySugrid(edge, subgrid);
  }
  
  // Ultra-compact version of determining panel types for connected cubes
  // The irrigation pathway creates a virtual subgrid that determines the panel type
  const isLeftPanel = (edge === entry && ['N', 'E'].includes(exit!)) ||
                     (edge === exit && ['S', 'W'].includes(entry!));
  
  const isRightPanel = (edge === entry && ['S', 'W'].includes(exit!)) ||
                      (edge === exit && ['N', 'E'].includes(entry!));
  
  // Ultra-compact logging
  if (edge === entry || edge === exit) {
    console.log(`P[${edge}:${entry}→${exit}]:${isLeftPanel ? 'L' : isRightPanel ? 'R' : 'S'}`);
  }
  
  if (isLeftPanel) return 'left';
  if (isRightPanel) return 'right';
  return 'side';
};

/**
 * Helper function to determine panel type based on subgrid
 */
function determineTypeBySugrid(edge: CompassDirection, subgrid: boolean[][]): 'side' | 'left' | 'right' {
  // Determine left and right cells for this edge's subgrid
  let leftCell = false;
  let rightCell = false;
  
  switch (edge) {
    case 'N':
      leftCell = subgrid[0][0];
      rightCell = subgrid[0][1];
      break;
    case 'E':
      leftCell = subgrid[0][1];
      rightCell = subgrid[1][1];
      break;
    case 'S':
      leftCell = subgrid[1][1];
      rightCell = subgrid[1][0];
      break;
    case 'W':
      leftCell = subgrid[1][0];
      rightCell = subgrid[0][0];
      break;
  }
  
  if (leftCell && rightCell) return 'side';
  if (leftCell) return 'right';
  if (rightCell) return 'left';
  return 'side';
}

/**
 * Determines the type of connector needed between two cubes based on flow direction
 * 
 * @param fromDirection The direction flow exits the first cube
 * @param toDirection The direction flow enters the second cube
 * @returns The type of connector needed ('straight' or 'corner')
 */
export function getConnectorType(
  fromDirection: CompassDirection,
  toDirection: CompassDirection
): 'straight' | 'corner-left' | 'corner-right' {
  const flowPath = `${fromDirection}→${getOppositeDirection(toDirection)}`;
  
  if (STRAIGHT_PATHS.has(flowPath)) {
    return 'straight';
  }
  
  const turnType = VALID_TURNS.get(flowPath);
  if (!turnType) {
    console.warn(`Invalid flow path: ${flowPath}`);
    return 'straight'; // Default to straight if invalid
  }
  
  return turnType;
}

/**
 * Optimizes panel packing based on flow-based rules
 * 
 * The packing rules are:
 * 1. Four-packs contain 2 side panels, 1 left panel, and 1 right panel
 * 2. Two-packs contain 2 side panels
 * 3. Prioritize using four-packs first, then two-packs
 * 4. Any remaining panels are kept as individual panels
 */
export function optimizePanelPacking(
  sidePanels: number,
  leftPanels: number,
  rightPanels: number
): {
  fourPackRegular: number;
  twoPackRegular: number;
  leftPanels: number;
  rightPanels: number;
  sidePanels: number;
} {
  let remainingSide = sidePanels;
  let remainingLeft = leftPanels;
  let remainingRight = rightPanels;
  
  // Calculate how many four-packs we can make (limited by the minimum of left/right panels)
  const maxFourPacks = Math.min(remainingLeft, remainingRight);
  const fourPacks = Math.min(maxFourPacks, Math.floor(remainingSide / 2));
  
  // Update remaining panels after four-packs
  remainingSide -= fourPacks * 2;
  remainingLeft -= fourPacks;
  remainingRight -= fourPacks;
  
  // Calculate how many two-packs we can make with remaining side panels
  const twoPacks = Math.floor(remainingSide / 2);
  remainingSide -= twoPacks * 2;
  
  return {
    fourPackRegular: fourPacks,
    twoPackRegular: twoPacks,
    leftPanels: remainingLeft,
    rightPanels: remainingRight,
    sidePanels: remainingSide
  };
}

/**
 * Validates a packed panel configuration against known ground truths
 */
export function validatePackedConfiguration(
  packedPanels: TotalRequirements,
  configType: 'SINGLE_CUBE' | 'THREE_LINE' | 'L_SHAPE' | 'U_SHAPE'
): boolean {
  const expectedConfig = CONFIGURATION_RULES[configType];
  
  return (
    packedPanels.fourPackRegular === expectedConfig.fourPackRegular &&
    packedPanels.fourPackExtraTall === expectedConfig.fourPackExtraTall &&
    packedPanels.twoPackRegular === expectedConfig.twoPackRegular &&
    packedPanels.twoPackExtraTall === expectedConfig.twoPackExtraTall &&
    packedPanels.leftPanels === expectedConfig.leftPanels &&
    packedPanels.rightPanels === expectedConfig.rightPanels &&
    packedPanels.sidePanels === expectedConfig.sidePanels &&
    packedPanels.straightCouplings === expectedConfig.straightCouplings &&
    packedPanels.cornerConnectors === expectedConfig.cornerConnectors
  );
}
