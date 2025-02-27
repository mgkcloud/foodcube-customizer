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
 * Count the number of corner connectors in a path
 */
export const countCornerConnectors = (path: PathCube[]): number => {
  let cornerCount = 0;
  
  // Corner is detected when a flow changes direction (not straight)
  for (let i = 0; i < path.length; i++) {
    const curr = path[i];
    if (curr.entry && curr.exit) {
      const flow = `${curr.entry}→${curr.exit}`;
      if (VALID_TURNS.has(flow)) {
        console.log(`Detected corner at cube [${curr.row},${curr.col}]: ${flow}`);
        cornerCount++;
      }
    }
  }
  
  console.log(`Total corners detected: ${cornerCount}`);
  return cornerCount;
};

/**
 * Checks if a configuration is U-shaped
 */
export const isUShapedConfiguration = (path: { cubes: PathCube[] }): boolean => {
  // U-shape must have at least 5 cubes
  if (path.cubes.length < 5) return false;

  // Count corner turns and validate flow direction
  let cornerCount = countCornerConnectors(path.cubes);

  // U-shape must have exactly 2 corners
  if (cornerCount !== 2) return false;

  // Validate U-shape geometry
  const startCube = path.cubes[0];
  const endCube = path.cubes[path.cubes.length - 1];

  // Start and end cubes should be parallel (same row or column)
  return (startCube.row === endCube.row && Math.abs(startCube.col - endCube.col) >= 2) ||
         (startCube.col === endCube.col && Math.abs(startCube.row - endCube.row) >= 2);
};

/**
 * Checks if a configuration is L-shaped
 */
export const isLShapedConfiguration = (path: { cubes: PathCube[] }): boolean => {
  if (path.cubes.length < 3) return false;

  // Count corner turns
  let cornerCount = countCornerConnectors(path.cubes);

  // L-shape must have exactly 1 corner
  if (cornerCount !== 1) return false;

  // Validate L-shape geometry
  const startCube = path.cubes[0];
  const endCube = path.cubes[path.cubes.length - 1];

  // Start and end cubes should be perpendicular
  return (startCube.row !== endCube.row && startCube.col !== endCube.col);
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
