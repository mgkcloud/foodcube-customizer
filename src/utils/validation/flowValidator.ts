import { GridCell, CompassDirection } from '../core/types';

/**
 * Checks if a cube has a valid number of connections (0, 1, or 2)
 * For a valid irrigation path, each cube should have at most 2 connections
 */
const hasValidConnectionCount = (grid: GridCell[][], row: number, col: number): boolean => {
  let count = 0;
  const directions: CompassDirection[] = ['N', 'S', 'E', 'W'];
  
  directions.forEach(dir => {
    let adjacentRow = row;
    let adjacentCol = col;
    
    switch (dir) {
      case 'N': adjacentRow--; break;
      case 'S': adjacentRow++; break;
      case 'E': adjacentCol++; break;
      case 'W': adjacentCol--; break;
    }
    
    if (adjacentRow >= 0 && adjacentRow < grid.length &&
        adjacentCol >= 0 && adjacentCol < grid[0].length &&
        grid[adjacentRow][adjacentCol].hasCube) {
      count++;
    }
  });
  
  return count <= 2;
}

// Cache for connected cubes to prevent recursive calls
const connectedCubesCache = new Map<string, [number, number][]>();

/**
 * Finds all cubes connected to the cube at the given position
 */
export const findConnectedCubes = (
  grid: GridCell[][], 
  startRow: number, 
  startCol: number,
  skipLogging: boolean = false
): [number, number][] => {
  // Check cache first
  const cacheKey = `${startRow},${startCol}`;
  if (connectedCubesCache.has(cacheKey)) {
    return connectedCubesCache.get(cacheKey)!;
  }
  
  if (!skipLogging) {
    console.log(`Finding connected cubes starting from [${startRow},${startCol}]`);
  }
  
  const visited = new Set<string>();
  const result: [number, number][] = [];
  const queue: [number, number][] = [[startRow, startCol]];
  
  while (queue.length > 0) {
    const [row, col] = queue.shift()!;
    const key = `${row},${col}`;
    
    if (visited.has(key)) continue;
    
    visited.add(key);
    result.push([row, col]);
    
    // Check all four directions
    const directions: CompassDirection[] = ['N', 'S', 'E', 'W'];
    
    for (const dir of directions) {
      let adjacentRow = row;
      let adjacentCol = col;
      
      switch (dir) {
        case 'N': adjacentRow--; break;
        case 'S': adjacentRow++; break;
        case 'E': adjacentCol++; break;
        case 'W': adjacentCol--; break;
      }
      
      // Check if the adjacent cell is valid and has a cube
      if (adjacentRow >= 0 && adjacentRow < grid.length &&
          adjacentCol >= 0 && adjacentCol < grid[0].length &&
          grid[adjacentRow][adjacentCol].hasCube) {
        queue.push([adjacentRow, adjacentCol]);
      }
    }
  }
  
  // Cache the result
  connectedCubesCache.set(cacheKey, result);
  
  if (!skipLogging) {
    console.log(`Found ${result.length} connected cubes`);
  }
  
  return result;
}

/**
 * Clears the connected cubes cache
 */
export const clearConnectedCubesCache = () => {
  connectedCubesCache.clear();
};

/**
 * Traces a path through connected cubes and sets entry/exit points
 */
const tracePathAndSetConnections = (
  grid: GridCell[][],
  startCube: [number, number],
  connectedCubes: [number, number][]
) => {
  if (connectedCubes.length <= 1) return;
  
  // Find endpoints (cubes with only one connection)
  const endpoints = findEndpointCubes(grid, connectedCubes);
  
  if (endpoints.length !== 2) {
    console.warn(`Expected 2 endpoints, found ${endpoints.length}`);
    return;
  }
  
  // Start from one endpoint
  const [startRow, startCol] = endpoints[0];
  
  // Find a path through all cubes
  const visited = new Set<string>();
  const path: [number, number][] = [];
  const queue: [number, number][] = [[startRow, startCol]];
  
  while (queue.length > 0) {
    const [row, col] = queue.shift()!;
    const key = `${row},${col}`;
    
    if (visited.has(key)) continue;
    
    visited.add(key);
    path.push([row, col]);
    
    // Check all four directions
    const directions: CompassDirection[] = ['N', 'S', 'E', 'W'];
    
    for (const dir of directions) {
      let adjacentRow = row;
      let adjacentCol = col;
      
      switch (dir) {
        case 'N': adjacentRow--; break;
        case 'S': adjacentRow++; break;
        case 'E': adjacentCol++; break;
        case 'W': adjacentCol--; break;
      }
      
      // Check if the adjacent cell is valid, has a cube, and is in our connected set
      if (adjacentRow >= 0 && adjacentRow < grid.length &&
          adjacentCol >= 0 && adjacentCol < grid[0].length &&
          grid[adjacentRow][adjacentCol].hasCube &&
          connectedCubes.some(([r, c]) => r === adjacentRow && c === adjacentCol)) {
        queue.push([adjacentRow, adjacentCol]);
      }
    }
  }
  
  // Set entry and exit points for each cube in the path
  for (let i = 0; i < path.length; i++) {
    const [row, col] = path[i];
    const cube = grid[row][col];
    
    if (i === 0) {
      // First cube - has only exit
      const [nextRow, nextCol] = path[i + 1];
      
      // Determine exit direction
      let exitDir: CompassDirection | null = null;
      
      if (nextRow < row) exitDir = 'N';
      else if (nextRow > row) exitDir = 'S';
      else if (nextCol < col) exitDir = 'W';
      else if (nextCol > col) exitDir = 'E';
      
      cube.connections = {
        entry: null,
        exit: exitDir
      };
    } else if (i === path.length - 1) {
      // Last cube - has only entry
      const [prevRow, prevCol] = path[i - 1];
      
      // Determine entry direction
      let entryDir: CompassDirection | null = null;
      
      if (prevRow < row) entryDir = 'N';
      else if (prevRow > row) entryDir = 'S';
      else if (prevCol < col) entryDir = 'W';
      else if (prevCol > col) entryDir = 'E';
      
      cube.connections = {
        entry: entryDir,
        exit: null
      };
    } else {
      // Middle cube - has both entry and exit
      const [prevRow, prevCol] = path[i - 1];
      const [nextRow, nextCol] = path[i + 1];
      
      // Determine entry direction
      let entryDir: CompassDirection | null = null;
      
      if (prevRow < row) entryDir = 'N';
      else if (prevRow > row) entryDir = 'S';
      else if (prevCol < col) entryDir = 'W';
      else if (prevCol > col) entryDir = 'E';
      
      // Determine exit direction
      let exitDir: CompassDirection | null = null;
      
      if (nextRow < row) exitDir = 'N';
      else if (nextRow > row) exitDir = 'S';
      else if (nextCol < col) exitDir = 'W';
      else if (nextCol > col) exitDir = 'E';
      
      cube.connections = {
        entry: entryDir,
        exit: exitDir
      };
    }
  }
};

/**
 * Gets available directions from a cube
 */
const getAvailableDirections = (grid: GridCell[][], row: number, col: number): CompassDirection[] => {
  const directions: CompassDirection[] = [];
  
  if (row > 0 && grid[row - 1][col].hasCube) directions.push('N');
  if (row < grid.length - 1 && grid[row + 1][col].hasCube) directions.push('S');
  if (col > 0 && grid[row][col - 1].hasCube) directions.push('W');
  if (col < grid[0].length - 1 && grid[row][col + 1].hasCube) directions.push('E');
  
  return directions;
};

/**
 * Finds endpoint cubes (cubes with only one connection)
 */
const findEndpointCubes = (grid: GridCell[][], cubes: [number, number][]): [number, number][] => {
  return cubes.filter(([row, col]) => getAvailableDirections(grid, row, col).length === 1);
};

/**
 * Gets the opposite direction
 */
const getOppositeDirection = (dir: CompassDirection | null): CompassDirection | null => {
  if (!dir) return null;
  
  switch (dir) {
    case 'N': return 'S';
    case 'S': return 'N';
    case 'E': return 'W';
    case 'W': return 'E';
  }
};

/**
 * Validates the irrigation path through the grid
 */
export const validateIrrigationPath = (grid: GridCell[][]): boolean => {
  // Clear the cache to ensure fresh validation
  clearConnectedCubesCache();
  
  // Find all cubes in the grid
  const allCubes: [number, number][] = [];
  
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      if (grid[row][col].hasCube) {
        allCubes.push([row, col]);
      }
    }
  }
  
  if (allCubes.length === 0) {
    return true; // Empty grid is valid
  }
  
  // Find all connected components
  const visited = new Set<string>();
  const components: [number, number][][] = [];
  
  for (const [row, col] of allCubes) {
    const key = `${row},${col}`;
    
    if (visited.has(key)) continue;
    
    const connectedCubes = findConnectedCubes(grid, row, col, true);
    components.push(connectedCubes);
    
    for (const [r, c] of connectedCubes) {
      visited.add(`${r},${c}`);
    }
  }
  
  // If there are multiple disconnected components, the path is invalid
  if (components.length > 1) {
    console.warn(`Invalid path: Found ${components.length} disconnected components`);
    return false;
  }
  
  // Validate each cube has at most 2 connections
  for (const [row, col] of allCubes) {
    if (!hasValidConnectionCount(grid, row, col)) {
      console.warn(`Invalid path: Cube at [${row},${col}] has more than 2 connections`);
      return false;
    }
  }
  
  // Trace the path and set entry/exit points
  tracePathAndSetConnections(grid, allCubes[0], allCubes);
  
  // Validate connections between cubes
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      if (grid[row][col].hasCube) {
        const cube = grid[row][col];
        
        // Validate entry connection
        if (cube.connections.entry && !validateConnection(grid, row, col, cube.connections.entry)) {
          console.warn(`Invalid path: Cube at [${row},${col}] has invalid entry connection: ${cube.connections.entry}`);
          return false;
        }
        
        // Validate exit connection
        if (cube.connections.exit && !validateConnection(grid, row, col, cube.connections.exit)) {
          console.warn(`Invalid path: Cube at [${row},${col}] has invalid exit connection: ${cube.connections.exit}`);
          return false;
        }
      }
    }
  }
  
  return true;
};

/**
 * Validates a connection between cubes
 */
const validateConnection = (grid: GridCell[][], row: number, col: number, direction: CompassDirection | null): boolean => {
  if (!direction) return true;
  
  let adjacentRow = row;
  let adjacentCol = col;
  
  switch (direction) {
    case 'N': adjacentRow--; break;
    case 'S': adjacentRow++; break;
    case 'E': adjacentCol++; break;
    case 'W': adjacentCol--; break;
  }
  
  // Check if the adjacent cell is valid and has a cube
  if (adjacentRow >= 0 && adjacentRow < grid.length &&
      adjacentCol >= 0 && adjacentCol < grid[0].length &&
      grid[adjacentRow][adjacentCol].hasCube) {
    
    // Check if the adjacent cube has a matching entry/exit
    const adjacentCube = grid[adjacentRow][adjacentCol];
    const oppositeDir = getOppositeDirection(direction);
    
    // The connection is valid if the adjacent cube has a matching entry or exit
    return adjacentCube.connections.entry === oppositeDir || adjacentCube.connections.exit === oppositeDir;
  }
  
  return false;
};
