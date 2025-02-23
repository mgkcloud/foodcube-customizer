import { PanelRequirements, CompassDirection } from './types';
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

// Ground truth configuration rules
export const CONFIGURATION_RULES = {
  // For a single cube with all edges(4 edges) cladded, we should get:
  // 1 four-pack (2 side + 1 left + 1 right)
  SINGLE_CUBE: {
    fourPackRegular: 1,
    fourPackExtraTall: 0,
    twoPackRegular: 0,
    twoPackExtraTall: 0,
    sidePanels: 2,
    leftPanels: 1,
    rightPanels: 1,
    straightCouplings: 0,
    cornerConnectors: 0
  },
  // For three cubes in a line(8 edges), we should get:
  // 1 four-pack (2 side + 1 left + 1 right)
  // 1 2 pack (2 sides)
  // 1 2 pack (2 sides)
  // 2 straight couplings
  THREE_LINE: {
    fourPackRegular: 1,
    fourPackExtraTall: 0,
    twoPackRegular: 2,
    twoPackExtraTall: 0,
    sidePanels: 6,
    leftPanels: 1,
    rightPanels: 1,
    straightCouplings: 2,
    cornerConnectors: 0
  },
  // For L-shaped configuration(8 edges), we should get:
  // 1 four-pack (2 side + 1 right + 1 left)
  // 1 left(1 side)
  // 1 2 pack (2 sides)
  // 1 2 pack (2 sides)
  // 1 corner connector
  // 1 straight coupling
  L_SHAPE: {
    fourPackRegular: 1,
    fourPackExtraTall: 0,
    twoPackRegular: 2,
    twoPackExtraTall: 0,
    sidePanels: 5,
    leftPanels: 2,
    rightPanels: 1,
    straightCouplings: 1,
    cornerConnectors: 1
  },
  // For U-shaped (12 edges) configurations:
  // 2 four-pack (4 side + 2 right + 2 left)
  // 1 2 pack (2 sides)
  // 1 2 pack (2 sides)
  // 2 corner connector
  // 2 straight coupling
  U_SHAPE: {
    fourPackRegular: 2,
    fourPackExtraTall: 0,
    twoPackRegular: 2,
    twoPackExtraTall: 0,
    sidePanels: 8,
    leftPanels: 2,
    rightPanels: 2,
    straightCouplings: 2,
    cornerConnectors: 2
  }
} as const;

// Panel type is determined by the edge's relationship to the irrigation flow
export function getPanelType(
  edge: CompassDirection,
  entry: CompassDirection | null,
  exit: CompassDirection | null
): 'side' | 'left' | 'right' {
  if (!entry && !exit) {
    return 'side'; // No flow, all panels are side panels
  }

  // Entry point gets left panel, exit point gets right panel
  if (edge === entry) {
    return 'left';
  }
  if (edge === exit) {
    return 'right';
  }

  // All other edges are side panels
  return 'side';
}
