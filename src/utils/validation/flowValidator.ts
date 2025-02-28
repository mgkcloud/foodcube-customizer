import { GridCell, CompassDirection } from '../core/types';
import { debug, debugFlags } from '../shared/debugUtils';
import { STRAIGHT_PATHS, VALID_TURNS } from '../core/irrigationRules';
import { getOppositeDirection } from '../shared/gridUtils';

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
 * Finds all connected cubes in a path starting from a given cube
 */
export const findConnectedCubes = (
  grid: GridCell[][],
  startRow: number,
  startCol: number
): [number, number][] => {
  if (!grid[startRow][startCol].hasCube) {
    return [];
  }

  // Log the starting point
  console.log(`Finding connected cubes from starting point [${startRow},${startCol}]`);

  const connectedCubes: [number, number][] = [];
  const visited = new Set<string>();
  const queue: [number, number][] = [[startRow, startCol]];

  while (queue.length > 0) {
    const [row, col] = queue.shift()!;
    const key = `${row},${col}`;

    if (visited.has(key)) continue;
    visited.add(key);

    if (grid[row][col].hasCube) {
      connectedCubes.push([row, col]);
      console.log(`Found cube at [${row},${col}]`);

      // Check adjacent cells (N, S, E, W)
      const directions = [
        [-1, 0, 'N'], // North
        [1, 0, 'S'],  // South
        [0, 1, 'E'],  // East
        [0, -1, 'W']  // West
      ];

      for (const [dr, dc, dir] of directions) {
        const newRow = row + (dr as number);
        const newCol = col + (dc as number);

        // Skip if out of bounds
        if (
          newRow < 0 || 
          newRow >= grid.length || 
          newCol < 0 || 
          newCol >= grid[0].length
        ) {
          continue;
        }

        // Add to queue if it has a cube and hasn't been visited
        if (grid[newRow][newCol].hasCube) {
          const newKey = `${newRow},${newCol}`;
          if (!visited.has(newKey)) {
            console.log(`Adding adjacent cube at [${newRow},${newCol}] (${dir} of [${row},${col}]) to queue`);
            queue.push([newRow, newCol]);
          }
        }
      }
    }
  }

  console.log(`Found ${connectedCubes.length} connected cubes in total`);

  // Now trace the path through the connected cubes and set entry/exit points
  return tracePathAndSetConnections(grid, connectedCubes);
};

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
  connectedCubes: [number, number][]
) => {
  if (connectedCubes.length <= 1) return connectedCubes;
  
  // Find endpoints (cubes with only one connection)
  const endpoints = findEndpointCubes(grid, connectedCubes);
  
  if (endpoints.length !== 2) {
    debug.warn(`Expected 2 endpoints, found ${endpoints.length}`);
    return connectedCubes;
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
      
      // Check if the adjacent cell is valid, has a cube, is in our connected set, and hasn't been visited
      if (adjacentRow >= 0 && adjacentRow < grid.length &&
          adjacentCol >= 0 && adjacentCol < grid[0].length &&
          grid[adjacentRow][adjacentCol].hasCube &&
          connectedCubes.some(([r, c]) => r === adjacentRow && c === adjacentCol) &&
          !visited.has(`${adjacentRow},${adjacentCol}`)) {
        queue.push([adjacentRow, adjacentCol]);
      }
    }
  }
  
  debug.info(`FLOW PATH: Traced path through ${path.length} cubes: ${path.map(([r, c]) => `[${r},${c}]`).join(' → ')}`);
  
  // Set entry and exit points for each cube in the path
  for (let i = 0; i < path.length; i++) {
    const [row, col] = path[i];
    const cube = grid[row][col];
    
    if (i === 0) {
      // First cube (endpoint) - determine where the next cube is
      const [nextRow, nextCol] = path[i + 1];
      
      // Determine direction toward the next cube
      let naturalDir: CompassDirection | null = null;
      
      if (nextRow < row) naturalDir = 'N';
      else if (nextRow > row) naturalDir = 'S';
      else if (nextCol < col) naturalDir = 'W';
      else if (nextCol > col) naturalDir = 'E';
      
      // For the first endpoint, set entry to face outward where no cube exists
      const availableDirections = getAvailableDirections(grid, row, col);
      let entryDir: CompassDirection | null = null;
      
      // Find a direction with no cube - preferring the opposite of exit for straight through
      const oppositeDir = getOppositeDirection(naturalDir);
      
      // Check if the opposite direction has no cube (ideal for straight through)
      if (oppositeDir && !availableDirections.includes(oppositeDir)) {
        entryDir = oppositeDir;
      } else {
        // Find any direction with no cube
        ['N', 'S', 'E', 'W'].forEach(dir => {
          if (!availableDirections.includes(dir as CompassDirection) && dir !== naturalDir) {
            entryDir = dir as CompassDirection;
          }
        });
      }
      
      cube.connections = {
        entry: entryDir,
        exit: naturalDir
      };
      
      debug.info(`First cube [${row},${col}]: entry=${entryDir}, exit=${naturalDir} - flows towards [${nextRow},${nextCol}]`);
    } else if (i === path.length - 1) {
      // Last cube (endpoint) - determine where the previous cube is
      const [prevRow, prevCol] = path[i - 1];
      
      // Determine entry direction from the previous cube
      let entryDir: CompassDirection | null = null;
      
      if (prevRow < row) entryDir = 'N';
      else if (prevRow > row) entryDir = 'S';
      else if (prevCol < col) entryDir = 'W';
      else if (prevCol > col) entryDir = 'E';
      
      // For the last endpoint, set exit to face outward where no cube exists
      const availableDirections = getAvailableDirections(grid, row, col);
      let exitDir: CompassDirection | null = null;
      
      // For straight through flow, prefer the opposite of entry
      const oppositeDir = getOppositeDirection(entryDir);
      
      // Check if the opposite direction has no cube (ideal for straight through)
      if (oppositeDir && !availableDirections.includes(oppositeDir)) {
        exitDir = oppositeDir;
      } else {
        // Find any direction with no cube
        ['N', 'S', 'E', 'W'].forEach(dir => {
          if (!availableDirections.includes(dir as CompassDirection) && dir !== entryDir) {
            exitDir = dir as CompassDirection;
          }
        });
      }
      
      cube.connections = {
        entry: entryDir,
        exit: exitDir
      };
      
      debug.info(`Last cube [${row},${col}]: entry=${entryDir}, exit=${exitDir} - flows from [${prevRow},${prevCol}]`);
    } else {
      // Middle cube - has both entry and exit
      const [prevRow, prevCol] = path[i - 1];
      const [nextRow, nextCol] = path[i + 1];
      
      // Determine entry direction from previous cube
      let entryDir: CompassDirection | null = null;
      
      if (prevRow < row) entryDir = 'N';
      else if (prevRow > row) entryDir = 'S';
      else if (prevCol < col) entryDir = 'W';
      else if (prevCol > col) entryDir = 'E';
      
      // For straight-through flow, exit must be the opposite of entry
      let exitDir = getOppositeDirection(entryDir);
      
      // Calculate where the next cube is naturally positioned
      let naturalExitDir: CompassDirection | null = null;
      
      if (nextRow < row) naturalExitDir = 'N';
      else if (nextRow > row) naturalExitDir = 'S';
      else if (nextCol < col) naturalExitDir = 'W';
      else if (nextCol > col) naturalExitDir = 'E';
      
      debug.info(`MIDDLE CUBE ANALYSIS - Cube [${row},${col}]:`);
      debug.info(`  Previous cube: [${prevRow},${prevCol}], Next cube: [${nextRow},${nextCol}]`);
      debug.info(`  Entry direction (from prev): ${entryDir}, Straight-through exit: ${exitDir}`);
      debug.info(`  Natural direction to next cube: ${naturalExitDir}`);
      
      // Check if this forms a corner connector between cubes
      // This happens when the natural exit != forced straight exit
      if (naturalExitDir !== exitDir) {
        debug.info(`CORNER DETECTED between [${row},${col}] and [${nextRow},${nextCol}]:`);
        debug.info(`  Cube [${row},${col}] has straight-through exit ${exitDir}`);
        debug.info(`  But next cube [${nextRow},${nextCol}] is in direction ${naturalExitDir}`);
        debug.info(`  This requires a corner connector: ${exitDir} → ${naturalExitDir}`);
      } else {
        debug.info(`STRAIGHT CONNECTION between [${row},${col}] and [${nextRow},${nextCol}]`);
      }
      
      cube.connections = {
        entry: entryDir,
        exit: exitDir // Always use straight-through exit
      };
    }
  }
  
  // Debug output of entire path
  if (debugFlags.SHOW_FLOW_PATHS) {
    const pathWithConnections = path.map(([r, c]) => ({
      row: r,
      col: c,
      entry: grid[r][c].connections?.entry,
      exit: grid[r][c].connections?.exit
    }));
    debug.flowPath(`Analyzing path:`, pathWithConnections);
    
    // Add a summary of the detected corner connections
    const cornerConnections = [];
    for (let i = 0; i < path.length - 1; i++) {
      const [currentRow, currentCol] = path[i];
      const [nextRow, nextCol] = path[i + 1];
      const currentCube = grid[currentRow][currentCol];
      const nextCube = grid[nextRow][nextCol];
      
      if (!currentCube.connections.exit) continue;
      
      // Determine natural direction to next cube
      let naturalDir: CompassDirection | null = null;
      if (nextRow < currentRow) naturalDir = 'N';
      else if (nextRow > currentRow) naturalDir = 'S';
      else if (nextCol < currentCol) naturalDir = 'W';
      else if (nextCol > currentCol) naturalDir = 'E';
      
      if (currentCube.connections.exit !== naturalDir) {
        cornerConnections.push({
          from: `[${currentRow},${currentCol}]`,
          to: `[${nextRow},${nextCol}]`,
          exitDir: currentCube.connections.exit,
          naturalDir: naturalDir,
          entryDir: nextCube.connections.entry
        });
      }
    }
    
    if (cornerConnections.length > 0) {
      debug.info(`SUMMARY: ${cornerConnections.length} corner connections needed:`);
      cornerConnections.forEach((corner, idx) => {
        debug.info(`Corner #${idx + 1}: ${corner.from} (exit: ${corner.exitDir}) → ${corner.to} (entry: ${corner.entryDir}), natural direction: ${corner.naturalDir}`);
      });
    } else {
      debug.info(`SUMMARY: No corner connections detected in path`);
    }
  }
  
  return path;
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
    
    const connectedCubes = findConnectedCubes(grid, row, col);
    components.push(connectedCubes);
    
    for (const [r, c] of connectedCubes) {
      visited.add(`${r},${c}`);
    }
  }
  
  // If there are multiple disconnected components, the path is invalid
  if (components.length > 1) {
    debug.warn(`Invalid path: Found ${components.length} disconnected components`);
    return false;
  }
  
  // Validate each cube has at most 2 connections
  for (const [row, col] of allCubes) {
    if (!hasValidConnectionCount(grid, row, col)) {
      debug.warn(`Invalid path: Cube at [${row},${col}] has more than 2 connections`);
      return false;
    }
  }
  
  // Trace the path and set entry/exit points
  tracePathAndSetConnections(grid, allCubes);
  
  // Validate connections between cubes
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      if (grid[row][col].hasCube) {
        const cube = grid[row][col];
        
        // Validate entry connection
        if (cube.connections.entry && !validateConnection(grid, row, col, cube.connections.entry)) {
          debug.warn(`Invalid path: Cube at [${row},${col}] has invalid entry connection: ${cube.connections.entry}`);
          return false;
        }
        
        // Validate exit connection
        if (cube.connections.exit && !validateConnection(grid, row, col, cube.connections.exit)) {
          debug.warn(`Invalid path: Cube at [${row},${col}] has invalid exit connection: ${cube.connections.exit}`);
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
  
  // Check if the adjacent cell exists within grid bounds
  const isWithinGrid = (
    adjacentRow >= 0 && adjacentRow < grid.length &&
    adjacentCol >= 0 && adjacentCol < grid[0].length
  );
  
  // If direction points outside the grid, it's valid for an endpoint
  if (!isWithinGrid) {
    return true;
  }
  
  // If there's no cube in the adjacent cell, this is a valid external connection
  if (!grid[adjacentRow][adjacentCol].hasCube) {
    return true;
  }
  
  // If there is a cube, check if it has a matching connection
  const adjacentCube = grid[adjacentRow][adjacentCol];
  const oppositeDir = getOppositeDirection(direction);
  
  // The connection is valid if the adjacent cube has a matching entry or exit
  // For straight connections, the adjacent cube should have the opposite direction
  if (adjacentCube.connections.entry === oppositeDir || adjacentCube.connections.exit === oppositeDir) {
    return true;
  }
  
  // For corner connections, we need to check if this forms a valid corner
  // A corner connection is valid if:
  // 1. This cube has an exit in the direction of the adjacent cube
  // 2. The adjacent cube has an entry that forms a 90-degree turn with this exit
  const thisCube = grid[row][col];
  
  // If this is an entry point for the current cube, then we're checking if this
  // entry connects to the adjacent cube's exit through a corner
  if (thisCube.connections.entry === direction) {
    // Check if the adjacentCube has an exit (which should form a corner with this entry)
    const adjacentExit = adjacentCube.connections.exit;
    
    if (adjacentExit) {
      // Check if this forms a valid turn
      const turn = `${adjacentExit}→${oppositeDir}`; // The flow from adjacent to this cube
      if (VALID_TURNS.has(turn)) {
        debug.debug(`Valid corner connection detected: ${adjacentExit} → ${oppositeDir}`);
        return true;
      }
    }
  }
  
  // If this is an exit point for the current cube, then we're checking if this
  // exit connects to the adjacent cube's entry through a corner
  if (thisCube.connections.exit === direction) {
    // Check if the adjacentCube has an entry (which should form a corner with this exit)
    const adjacentEntry = adjacentCube.connections.entry;
    
    if (adjacentEntry) {
      // Check if this forms a valid turn
      const turn = `${direction}→${adjacentEntry}`; // The flow from this to adjacent cube
      if (VALID_TURNS.has(turn)) {
        debug.debug(`Valid corner connection detected: ${direction} → ${adjacentEntry}`);
        return true;
      }
    }
  }
  
  return false;
};
