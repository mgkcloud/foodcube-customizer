import { CompassDirection, GridCell } from '@/components/types';
import { PathCube } from './flowAnalyzer';
import { VALID_TURNS, STRAIGHT_PATHS } from '../core/rules';
import { hasAdjacentCube } from '../shared/gridUtils';

/**
 * Counts the number of flow connections for a cube
 */
const countFlowConnections = (grid: GridCell[][], row: number, col: number): number => {
  let count = 0;
  ['N', 'S', 'E', 'W'].forEach((dir) => {
    if (hasAdjacentCube(grid, row, col, dir as CompassDirection)) {
      count++;
    }
  });
  return count;
};

/**
 * Checks if a cube is an endpoint in the flow
 */
export const isEndpoint = (grid: GridCell[][], row: number, col: number): boolean => {
  return countFlowConnections(grid, row, col) === 1;
};

/**
 * Checks if a cube is a corner in the flow
 */
export const isCorner = (entry: CompassDirection | null, exit: CompassDirection | null): boolean => {
  if (!entry || !exit) return false;
  const turn = `${entry}→${exit}`;
  return VALID_TURNS.has(turn);
};

/**
 * Checks if a cube has straight flow
 */
export const isStraightFlow = (entry: CompassDirection | null, exit: CompassDirection | null): boolean => {
  if (!entry || !exit) return false;
  const path = `${entry}→${exit}`;
  return STRAIGHT_PATHS.has(path);
};

/**
 * Checks if a configuration is U-shaped
 */
export const isUShapedConfiguration = (path: { cubes: PathCube[] }): boolean => {
  if (path.cubes.length !== 5) return false;

  // Count corner turns
  let cornerCount = 0;
  for (let i = 1; i < path.cubes.length; i++) {
    if (isCorner(path.cubes[i-1].exit, path.cubes[i].entry)) {
      cornerCount++;
    }
  }

  // U-shape must have exactly 2 corners
  return cornerCount === 2;
};

/**
 * Checks if a configuration is L-shaped
 */
export const isLShapedConfiguration = (path: { cubes: PathCube[] }): boolean => {
  if (path.cubes.length !== 3) return false;

  // Count corner turns
  let cornerCount = 0;
  for (let i = 1; i < path.cubes.length; i++) {
    if (isCorner(path.cubes[i-1].exit, path.cubes[i].entry)) {
      cornerCount++;
    }
  }

  // L-shape must have exactly 1 corner
  return cornerCount === 1;
};

/**
 * Helper to get angle between directions (similar to PipelineVisualizer)
 */
export const getAngleBetweenDirections = (dir1: CompassDirection, dir2: CompassDirection): number => {
  const dirToAngle = { N: 0, E: 90, S: 180, W: 270 };
  const angle1 = dirToAngle[dir1];
  const angle2 = dirToAngle[dir2];
  return ((angle2 - angle1 + 360) % 360);
};
