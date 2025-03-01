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
 * A corner connector is needed when there's a change in flow direction
 * L-shape has one corner, U-shape has two corners
 */
export const countCornerConnectors = (path: PathCube[]): number => {
  console.log("Analyzing path for corner connectors:", path.map(c => `[${c.row},${c.col}]${c.entry}→${c.exit}`).join(', '));
  
  // We need at least 2 cubes to have any connections
  if (path.length < 2) {
    console.log("Path too short for corner detection");
    return 0;
  }

  // For U-shape configurations, return 2 corners
  if (isUShape(path)) {
    console.log("U-shape detected - 2 corner connectors");
    return 2;
  }
  
  // Next check if it's an L-shape by looking for a 90-degree turn
  if (isLShape(path)) {
    console.log("L-shape detected - 1 corner connector");
    return 1;
  }
  
  // For straight line paths, there are no corners
  if (isAllStraightFlow(path)) {
    console.log("Straight line detected - no corners");
    return 0;
  }
  
  // For other configurations, count the actual direction changes
  let cornerCount = 0;
  let lastDirection: string | null = null;
  
  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i];
    const next = path[i + 1];
    
    let currentDirection: string;
    if (next.row < current.row) currentDirection = 'N';
    else if (next.row > current.row) currentDirection = 'S';
    else if (next.col < current.col) currentDirection = 'W';
    else if (next.col > current.col) currentDirection = 'E';
    else continue; // Skip if no direction change
    
    if (lastDirection && lastDirection !== currentDirection) {
      cornerCount++;
      console.log(`Corner detected between [${current.row},${current.col}] and [${next.row},${next.col}]`);
    }
    
    lastDirection = currentDirection;
  }
  
  console.log(`Default case - ${cornerCount} corner connectors`);
  return cornerCount;
};

/**
 * Checks if the path forms a U-shape
 */
function isUShape(path: PathCube[]): boolean {
  // U-shape needs at least 5 cubes
  if (path.length < 5) return false;
  
  // For U-shape configurations, the first and last cubes should be near each other
  // and the path should form a U-shape with two distinct corners
  const firstCube = path[0];
  const lastCube = path[path.length - 1];
  
  // Check if endpoints are in the same row or column
  const sameRowEndpoints = firstCube.row === lastCube.row;
  const sameColEndpoints = firstCube.col === lastCube.col;
  
  // In a U-shape, endpoints should be in the same row or column, but not both
  // (if both same row and column, it would be the same cube)
  const endpointAlignment = (sameRowEndpoints && !sameColEndpoints) || 
                           (!sameRowEndpoints && sameColEndpoints);
                           
  if (!endpointAlignment) return false;
  
  // Count the number of direction changes in the path
  let directionChanges = 0;
  let lastDirection: string | null = null;
  
  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i];
    const next = path[i + 1];
    
    let currentDirection: string;
    if (next.row < current.row) currentDirection = 'N';
    else if (next.row > current.row) currentDirection = 'S';
    else if (next.col < current.col) currentDirection = 'W';
    else if (next.col > current.col) currentDirection = 'E';
    else continue; // Skip if no direction change
    
    if (lastDirection && lastDirection !== currentDirection) {
      directionChanges++;
    }
    
    lastDirection = currentDirection;
  }
  
  // A U-shape should have exactly 2 major direction changes
  const hasCorrectTurns = directionChanges === 2;
  
  console.log(`U-shape check: endpoints aligned=${endpointAlignment}, direction changes=${directionChanges}`);
  
  // The path is a U-shape if endpoints are aligned and has exactly 2 direction changes
  return endpointAlignment && hasCorrectTurns;
}

/**
 * Checks if the path forms an L-shape
 */
function isLShape(path: PathCube[]): boolean {
  // L-shape needs to have at least one direction change
  let hasDirectionChange = false;
  
  // Also check if there's a row/col change in the path
  let hasRowChange = false;
  let hasColChange = false;
  
  for (let i = 0; i < path.length - 1; i++) {
    const cube = path[i];
    const nextCube = path[i + 1];
    
    // Check for row or column changes
    if (cube.row !== nextCube.row) hasRowChange = true;
    if (cube.col !== nextCube.col) hasColChange = true;
    
    // Check for direction changes
    if (cube.exit && nextCube.entry) {
      // For a direction change, exit direction should differ from what would naturally
      // be expected based on the relative positions of the cubes
      let naturalDir = '';
      if (nextCube.row < cube.row) naturalDir = 'N';
      else if (nextCube.row > cube.row) naturalDir = 'S';
      else if (nextCube.col < cube.col) naturalDir = 'W';
      else if (nextCube.col > cube.col) naturalDir = 'E';
      
      if (cube.exit !== naturalDir) {
        hasDirectionChange = true;
      }
    }
  }
  
  // An L-shape should have both row and column changes and a direction change
  return hasRowChange && hasColChange;
}

/**
 * Checks if all cubes in a path have straight flow
 */
function isAllStraightFlow(path: PathCube[]): boolean {
  // Check if all cubes are in the same row or all in the same column
  let allSameRow = true;
  let allSameCol = true;
  const firstRow = path[0].row;
  const firstCol = path[0].col;
  
  for (let i = 1; i < path.length; i++) {
    if (path[i].row !== firstRow) allSameRow = false;
    if (path[i].col !== firstCol) allSameCol = false;
  }
  
  // If all cubes are in the same row or column, it's a straight line
  return allSameRow || allSameCol;
}

/**
 * Check if two directions are opposite (N-S, E-W)
 */
function isOppositeDirection(dir1: CompassDirection, dir2: CompassDirection): boolean {
  return (
    (dir1 === 'N' && dir2 === 'S') ||
    (dir1 === 'S' && dir2 === 'N') ||
    (dir1 === 'E' && dir2 === 'W') ||
    (dir1 === 'W' && dir2 === 'E')
  );
}

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
  
  // The total number of straight connectors is always (n-1) 
  // where n is the number of cubes, minus the number of corners
  
  // First, count the total number of connections needed (always n-1)
  const totalConnections = path.length - 1;
  
  // Then, subtract the number of corner connections
  const cornerCount = countCornerConnectors(path);
  
  // The remaining connections must be straight
  straightCount = totalConnections - cornerCount;
  
  console.log(`Total connections: ${totalConnections}, Corner connectors: ${cornerCount}, Straight connectors: ${straightCount}`);
  return straightCount;
};



