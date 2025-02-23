import { Requirements, CompassDirection } from '@/components/types';
import { PathCube } from './flowAnalyzer';
import { STRAIGHT_PATHS, VALID_TURNS } from '../core/irrigationRules';
import { isCorner, isStraightFlow, isUShapedConfiguration, isLShapedConfiguration, getAngleBetweenDirections } from './configurationDetector';

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
  fourPackRegular: 2,
  fourPackExtraTall: 0,
  twoPackRegular: 2,
  twoPackExtraTall: 0,
  sidePanels: 8,
  leftPanels: 2,
  rightPanels: 2,
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

  // Early return for known configurations
  if (isUShapedConfiguration({ cubes })) {
    return getUShapeRequirements();
  }

  if (isLShapedConfiguration({ cubes })) {
    return getLShapeRequirements();
  }

  if (cubes.length === 3 && !isLShapedConfiguration({ cubes })) {
    return getStraightLineRequirements();
  }

  // Count corners and straights
  let cornerCount = 0;
  let straightCount = 0;
  let sidePanelCount = 0;
  let leftPanelCount = 0;
  let rightPanelCount = 0;

  const opposites = { N: 'S', S: 'N', E: 'W', W: 'E' } as const;

  // First pass: Count connections and find endpoints
  for (let i = 0; i < cubes.length; i++) {
    const cube = cubes[i];
    if (!cube.entry && !cube.exit) continue;

    // Entry point gets left panel, exit point gets right panel
    if (cube.entry) {
      leftPanelCount++;
    }
    if (cube.exit) {
      rightPanelCount++;
    }

    // All other edges are side panels
    const totalEdges = 4;
    const entryExitCount = (cube.entry ? 1 : 0) + (cube.exit ? 1 : 0);
    sidePanelCount += totalEdges - entryExitCount;

    // Count corners and straights
    if (i < cubes.length - 1) {
      const next = cubes[i + 1];
      if (!next.entry) continue;

      if (next.entry === opposites[cube.exit as keyof typeof opposites]) {
        straightCount++;
      } else {
        cornerCount++;
      }
    }
  }

  // Calculate packs based on total panels needed
  const totalSidePanels = sidePanelCount;
  const fourPackPanels = 4; // 2 side + 1 left + 1 right
  const remainingSidePanels = Math.max(0, totalSidePanels - 2); // Subtract the 2 side panels from four-pack
  const twoPackCount = Math.ceil(remainingSidePanels / 2);

  // Return calculated requirements
  return {
    fourPackRegular: 1,
    fourPackExtraTall: 0,
    twoPackRegular: twoPackCount,
    twoPackExtraTall: 0,
    sidePanels: totalSidePanels,
    leftPanels: leftPanelCount,
    rightPanels: rightPanelCount,
    straightCouplings: straightCount,
    cornerConnectors: cornerCount
  };
};
