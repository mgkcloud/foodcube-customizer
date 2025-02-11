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
  // 1 four-pack (2 side + 1 right + 1 left)
  // 1 2 pack (2 sides)
  // 1 2 pack (2 sides)
  // 2 corner connector
  // 2 straight coupling
  U_SHAPE: {
    fourPackRegular: 1,
    fourPackExtraTall: 0,
    twoPackRegular: 2,
    twoPackExtraTall: 0,
    sidePanels: 6,
    leftPanels: 1,
    rightPanels: 1,
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
  if (!entry || !exit) {
    return 'side'; // Default to side panel if no flow
  }

  // The flow path creates a direction vector from entry to exit
  // Edges that the flow passes through are side panels (entry/exit faces)
  // Edges parallel to the flow are left/right panels based on their position relative to the flow

  // If this edge is the entry or exit point, it's a side panel
  if (edge === entry || edge === exit) {
    return 'side';
  }

  // For any other edge, we need to determine if it's left or right of the flow
  // This is determined by following the flow path and checking which side the edge is on
  const flowPath = `${entry}→${exit}`;
  
  // Map each flow path to its left and right edges
  // Due to offset coupling connections, the left/right panel determination
  // is based on the physical offset of the coupling from the cube center
  const FLOW_SIDES = new Map<string, { left: CompassDirection; right: CompassDirection }>([
    // Straight flows - coupling offset means opposite sides from visual center
    ['N→S', { left: 'E', right: 'W' }], // Flow down, coupling offset right
    ['S→N', { left: 'W', right: 'E' }], // Flow up, coupling offset left
    ['E→W', { left: 'S', right: 'N' }], // Flow left, coupling offset down
    ['W→E', { left: 'N', right: 'S' }], // Flow right, coupling offset up
    // Corner flows - coupling offset affects which side is left/right
    ['N→E', { left: 'S', right: 'W' }],
    ['E→S', { left: 'W', right: 'N' }],
    ['S→W', { left: 'N', right: 'E' }],
    ['W→N', { left: 'E', right: 'S' }],
    ['N→W', { left: 'E', right: 'S' }],
    ['W→S', { left: 'N', right: 'E' }],
    ['S→E', { left: 'W', right: 'N' }],
    ['E→N', { left: 'S', right: 'W' }],
  ]);

  const flowSides = FLOW_SIDES.get(flowPath);
  if (!flowSides) {
    return 'side'; // Invalid flow path, default to side
  }

  if (edge === flowSides.left) return 'left';
  if (edge === flowSides.right) return 'right';
  
  return 'side'; // Default case
}
