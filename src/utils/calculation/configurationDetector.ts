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
 * Counts the number of corner connectors needed for the path.
 * A corner connector is needed when a cube changes flow direction.
 */
export const countCornerConnectors = (path: PathCube[]): number => {
  console.log(`Analyzing path for corner connectors: ${path.map(cube => 
    `[${cube.row},${cube.col}]${cube.entry}→${cube.exit}`).join(', ')}`);
  
  if (path.length <= 1) {
    return 0;
  }
  
  // Count corner connectors based on flow direction changes
  let cornerCount = 0;
  
  // Check each cube for direction changes (turns)
  for (const cube of path) {
    // Straight-through connections don't require corner connectors
    if (!isFlowStraightThrough(cube.entry, cube.exit)) {
      cornerCount++;
      console.log(`Corner connector detected at [${cube.row},${cube.col}] with ${cube.entry}→${cube.exit} turn`);
    }
  }
  
  // For backward compatibility, provide descriptive logging
  if (isUShape(path)) {
    console.log(`U-shape detected - ${cornerCount} corner connectors`);
  } else if (isLShape(path)) {
    console.log(`L-shape detected - ${cornerCount} corner connectors`);
  } else if (isStraightLine(path)) {
    console.log(`Straight line detected - ${cornerCount} corner connectors`);
  } else {
    console.log(`Custom configuration - ${cornerCount} corner connectors`);
  }
  
  return cornerCount;
};

/**
 * Determines if the flow goes straight through the cube (N-S or E-W)
 */
function isFlowStraightThrough(entry: CompassDirection | null, exit: CompassDirection | null): boolean {
  if (!entry || !exit) return false;
  
  return (
    (entry === 'N' && exit === 'S') || 
    (entry === 'S' && exit === 'N') || 
    (entry === 'E' && exit === 'W') || 
    (entry === 'W' && exit === 'E')
  );
}

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
  // Check for both the 5-cube and 3-cube variants of L-shape
  // The preset defined in useGridState.ts uses a 5-cube L-shape
  // While tests and some validation logic use a 3-cube L-shape
  
  // If we have fewer than 3 cubes, it cannot be an L-shape
  if (path.length < 3) return false;
  
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
  
  // Special case for the 5-cube L-shape as defined in the preset
  if (path.length >= 5) {
    // Extract the rows and columns to analyze the shape
    const rows = path.map(cube => cube.row);
    const cols = path.map(cube => cube.col);
    
    // Check if there's a continuous vertical section and a continuous horizontal section
    // which is the characteristic of an L-shape
    const uniqueRows = [...new Set(rows)];
    const uniqueCols = [...new Set(cols)];
    
    // Get counts of cubes in each row and column
    const rowCounts = uniqueRows.map(row => 
      rows.filter(r => r === row).length
    );
    
    const colCounts = uniqueCols.map(col => 
      cols.filter(c => c === col).length
    );
    
    // For a 5-cube L-shape preset, we expect to see:
    // - One column with 3 cubes (the vertical part)
    // - One row with 3 cubes (the horizontal part)
    const hasVerticalSection = colCounts.some(count => count >= 3);
    const hasHorizontalSection = rowCounts.some(count => count >= 3);
    
    console.log(`L-shape analysis (preset): vertical section=${hasVerticalSection}, horizontal section=${hasHorizontalSection}`);
    
    if (hasVerticalSection && hasHorizontalSection) {
      return true;
    }
  }
  
  // Standard check for the 3-cube L-shape
  // An L-shape should have both row and column changes and a direction change
  return hasRowChange && hasColChange && (hasDirectionChange || path.length <= 3);
}

/**
 * Determines if the path forms a straight line
 */
function isStraightLine(path: PathCube[]): boolean {
  if (path.length < 2) return false;
  
  // Check if all flows are straight through
  for (const cube of path) {
    if (!isFlowStraightThrough(cube.entry, cube.exit)) {
      return false;
    }
  }
  
  // Additional check: all cubes must be in a single row or a single column
  const allSameRow = path.every(cube => cube.row === path[0].row);
  const allSameCol = path.every(cube => cube.col === path[0].col);
  
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

/**
 * Checks if the cubes form an L-shaped configuration
 * Supports both 3-cube L-shapes used in tests and 5-cube L-shapes from presets
 */
export const isLShapedConfiguration = (path: { cubes: PathCube[] }): boolean => {
  if (path.cubes.length < 3) return false;
  
  // First check for preset-defined 5-cube L-shape
  if (path.cubes.length >= 5) {
    // Extract the rows and columns to analyze the shape
    const rows = path.cubes.map(cube => cube.row);
    const cols = path.cubes.map(cube => cube.col);
    
    // Check if there's a continuous vertical section and a continuous horizontal section
    // which is the characteristic of an L-shape
    const uniqueRows = [...new Set(rows)];
    const uniqueCols = [...new Set(cols)];
    
    // Get counts of cubes in each row and column
    const rowCounts = uniqueRows.map(row => 
      rows.filter(r => r === row).length
    );
    
    const colCounts = uniqueCols.map(col => 
      cols.filter(c => c === col).length
    );
    
    // For a 5-cube L-shape preset, we expect to see:
    // - One column with 3 cubes (the vertical part)
    // - One row with 3 cubes (the horizontal part)
    const hasVerticalSection = colCounts.some(count => count >= 3);
    const hasHorizontalSection = rowCounts.some(count => count >= 3);
    
    console.log(`L-shape analysis (preset): vertical section=${hasVerticalSection}, horizontal section=${hasHorizontalSection}`);
    
    if (hasVerticalSection && hasHorizontalSection) {
      console.log("Detected 5-cube L-shape from preset");
      return true;
    }
  }
  
  // Standard 3-cube L-shape check
  // Count corner turns
  let cornerCount = countCornerConnectors(path.cubes);
  console.log(`Standard L-shape check: cornerCount=${cornerCount}`);
  
  // L-shape must have exactly 1 corner
  if (cornerCount !== 1) return false;
  
  // Validate L-shape geometry
  const startCube = path.cubes[0];
  const endCube = path.cubes[path.cubes.length - 1];
  
  // Start and end cubes should be perpendicular (not in same row/col)
  return (startCube.row !== endCube.row && startCube.col !== endCube.col);
};

/**
 * Helper to get angle between directions (similar to PipelineVisualizer)
 */



