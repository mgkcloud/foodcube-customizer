import { CompassDirection, GridCell } from '@/components/types';
import { hasAdjacentCube } from '../shared/gridUtils';
import { VALID_TURNS, STRAIGHT_PATHS } from '../core/irrigationRules';
import { debug } from '../shared/debugUtils';

// Define Path Cube type
export interface PathCube {
  row: number;
  col: number;
  entry: CompassDirection | null;
  exit: CompassDirection | null;
  [key: string]: any;
}

/**
 * Gets the opposite direction of a given CompassDirection
 */
export const getOppositeDirection = (direction: CompassDirection): CompassDirection => {
  switch (direction) {
    case 'N': return 'S';
    case 'S': return 'N';
    case 'E': return 'W';
    case 'W': return 'E';
  }
};

/**
 * Counts the number of flow connections for a cube
 */
export const countFlowConnections = (grid: GridCell[][], row: number, col: number): number => {
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
 * Checks if a cube has a corner connection (entry and exit form a corner)
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
 * Counts corner connectors by analyzing adjacent cubes in the path
 * A corner connector is needed when a cube's exit direction doesn't match
 * the natural direction to the next cube
 */
export const countCornerConnectors = (path: PathCube[]): number => {
  console.log("Analyzing path for corner connectors:", path);
  
  let cornerCount = 0;
  
  // We need at least 2 cubes to have any connections
  if (path.length < 2) {
    return 0;
  }
  
  // Examine each cube except the last one
  for (let i = 0; i < path.length - 1; i++) {
    const currentCube = path[i];
    const nextCube = path[i + 1];
    
    // Determine natural direction from current to next cube
    let naturalDirection: CompassDirection | null = null;
    if (nextCube.row < currentCube.row) naturalDirection = 'N';
    else if (nextCube.row > currentCube.row) naturalDirection = 'S';
    else if (nextCube.col < currentCube.col) naturalDirection = 'W';
    else if (nextCube.col > currentCube.col) naturalDirection = 'E';
    
    const exitDirection = currentCube.exit;
    
    console.log(`Analyzing cubes [${currentCube.row},${currentCube.col}] -> [${nextCube.row},${nextCube.col}]`);
    console.log(`Natural direction: ${naturalDirection}, Exit direction: ${exitDirection}`);
    
    // A corner is needed when exit direction doesn't match natural direction
    if (exitDirection !== naturalDirection) {
      console.log(`CORNER DETECTED: Exit ${exitDirection} doesn't match natural direction ${naturalDirection}`);
      cornerCount++;
    } else {
      console.log(`Straight connection: Exit ${exitDirection} matches natural direction ${naturalDirection}`);
    }
  }
  
  console.log(`Total corner connectors: ${cornerCount}`);
  return cornerCount;
};

/**
 * Counts straight connectors by analyzing adjacent cubes in the path
 * A straight connector is needed when a cube's exit direction matches
 * the natural direction to the next cube
 */
export const countStraightConnectors = (path: PathCube[]): number => {
  console.log("Analyzing path for straight connectors:", path);
  
  let straightCount = 0;
  
  // We need at least 2 cubes to have any connections
  if (path.length < 2) {
    return 0;
  }
  
  // Examine each cube except the last one
  for (let i = 0; i < path.length - 1; i++) {
    const currentCube = path[i];
    const nextCube = path[i + 1];
    
    // Determine natural direction from current to next cube
    let naturalDirection: CompassDirection | null = null;
    if (nextCube.row < currentCube.row) naturalDirection = 'N';
    else if (nextCube.row > currentCube.row) naturalDirection = 'S';
    else if (nextCube.col < currentCube.col) naturalDirection = 'W';
    else if (nextCube.col > currentCube.col) naturalDirection = 'E';
    
    const exitDirection = currentCube.exit;
    
    // A straight connector is needed when exit direction matches natural direction
    if (exitDirection === naturalDirection) {
      console.log(`Straight connector between [${currentCube.row},${currentCube.col}] and [${nextCube.row},${nextCube.col}]`);
      straightCount++;
    }
  }
  
  console.log(`Total straight connectors: ${straightCount}`);
  return straightCount;
};



