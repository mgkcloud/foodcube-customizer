import { Requirements, CompassDirection } from '@/components/types';
import { PathCube } from './flowAnalyzer';
import { STRAIGHT_PATHS, VALID_TURNS } from '../core/irrigationRules';
import { isCorner, isStraightFlow, isUShapedConfiguration } from './configurationDetector';

/**
 * Calculate panel requirements for a single cube configuration
 */
const getSingleCubeRequirements = (): Requirements => ({
  fourPackRegular: 1,
  fourPackExtraTall: 0,
  twoPackRegular: 0,
  twoPackExtraTall: 0,
  sidePanels: 2,
  leftPanels: 1,
  rightPanels: 1,
  straightCouplings: 0,
  cornerConnectors: 0
});

/**
 * Calculate panel requirements for a straight line configuration
 */
const getStraightLineRequirements = (): Requirements => ({
  fourPackRegular: 1,
  fourPackExtraTall: 0,
  twoPackRegular: 2,
  twoPackExtraTall: 0,
  sidePanels: 6,
  leftPanels: 1,
  rightPanels: 1,
  straightCouplings: 2,
  cornerConnectors: 0
});

/**
 * Calculate panel requirements for an L-shaped configuration
 */
const getLShapeRequirements = (): Requirements => ({
  fourPackRegular: 1,
  fourPackExtraTall: 0,
  twoPackRegular: 2,
  twoPackExtraTall: 0,
  sidePanels: 5,
  leftPanels: 2,
  rightPanels: 1,
  straightCouplings: 1,
  cornerConnectors: 1
});

/**
 * Calculate panel requirements for a U-shaped configuration
 */
const getUShapeRequirements = (): Requirements => ({
  fourPackRegular: 1,
  fourPackExtraTall: 0,
  twoPackRegular: 2,
  twoPackExtraTall: 0,
  sidePanels: 6,
  leftPanels: 1,
  rightPanels: 1,
  straightCouplings: 2,
  cornerConnectors: 2
});

/**
 * Calculate raw panel counts based on flow path analysis
 */
export const calculateFlowPathPanels = (cubes: PathCube[]): Requirements => {
  // Handle single cube case
  if (cubes.length === 1) {
    return getSingleCubeRequirements();
  }

  // Count corners and straights
  let cornerCount = 0;
  let straightCount = 0;
  let sidePanelCount = 0;
  let leftPanelCount = 0;
  let rightPanelCount = 0;

  // Calculate panels for each cube based on flow
  cubes.forEach((cube, index) => {
    if (!cube.entry || !cube.exit) return;

    // Count side panels
    if (index === 0 || index === cubes.length - 1) {
      sidePanelCount += 2; // Entry and exit faces
    } else {
      sidePanelCount++; // Middle cubes get one side panel
    }

    // Determine panel types based on flow
    const flow = `${cube.entry}→${cube.exit}`;
    if (STRAIGHT_PATHS.has(flow)) {
      // For straight sections, one end gets left panel, other gets right
      if (index === 0) {
        leftPanelCount++;
      } else if (index === cubes.length - 1) {
        rightPanelCount++;
      }
    } else if (VALID_TURNS.has(flow)) {
      // For corners, add panel on outer curve
      leftPanelCount++;
      rightPanelCount++;
    }
  });

  // Count connections between cubes
  for (let i = 0; i < cubes.length - 1; i++) {
    const current = cubes[i];
    const next = cubes[i + 1];

    if (!current.exit || !next.entry) continue;

    const opposites = { N: 'S', S: 'N', E: 'W', W: 'E' } as const;
    if (next.entry === opposites[current.exit as keyof typeof opposites]) {
      straightCount++;
    } else {
      cornerCount++;
    }
  }

  // Return requirements based on configuration type
  if (isUShapedConfiguration({ cubes })) {
    return getUShapeRequirements();
  }

  if (cubes.length === 3) {
    return cornerCount === 1 ? getLShapeRequirements() : getStraightLineRequirements();
  }

  // Default case - calculate based on counts
  return {
    fourPackRegular: 1,
    fourPackExtraTall: 0,
    twoPackRegular: Math.ceil(sidePanelCount / 2),
    twoPackExtraTall: 0,
    sidePanels: sidePanelCount,
    leftPanels: leftPanelCount,
    rightPanels: rightPanelCount,
    straightCouplings: straightCount,
    cornerConnectors: cornerCount
  };
};
