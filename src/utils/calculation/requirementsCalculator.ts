import { Requirements } from '@/components/types';
import { CONFIGURATION_RULES } from '../core/rules';
import { PathCube, analyzePath, isUShape, isLShape, isStraightLine } from './flowAnalyzer';

/**
 * Calculates panel and connector requirements based on analyzed path
 */
export const calculateRequirements = (path: PathCube[]): Requirements => {
  // Handle empty path
  if (!path.length) {
    return {
      fourPackRegular: 0,
      fourPackExtraTall: 0,
      twoPackRegular: 0,
      twoPackExtraTall: 0,
      sidePanels: 0,
      leftPanels: 0,
      rightPanels: 0,
      straightCouplings: 0,
      cornerConnectors: 0
    };
  }

  const analyzedPath = analyzePath(path);

  // Single cube
  if (analyzedPath.length === 1) {
    return CONFIGURATION_RULES.SINGLE_CUBE;
  }

  // L-shaped configuration
  if (isLShape(analyzedPath)) {
    return CONFIGURATION_RULES.L_SHAPE;
  }

  // Three cubes in a straight line
  if (isStraightLine(analyzedPath)) {
    return CONFIGURATION_RULES.THREE_LINE;
  }

  // U-shaped configuration
  if (isUShape(analyzedPath)) {
    return CONFIGURATION_RULES.U_SHAPE;
  }

  // Default to single cube if no valid configuration found
  return CONFIGURATION_RULES.SINGLE_CUBE;
};
