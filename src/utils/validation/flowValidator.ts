import { GridCell, CompassDirection } from '../core/types';
import { debug, debugFlags } from '../shared/debugUtils';
import { STRAIGHT_PATHS, VALID_TURNS } from '../core/irrigationRules';
import { getOppositeDirection } from '../shared/gridUtils';

/**
 * Compact path logging to reduce verbosity
 */
const logPath = (pathCubes: any[], message: string = 'Path') => {
  if (!pathCubes || pathCubes.length === 0) return;
  
  // Extract row/col info based on whether we have simple [row,col] pairs or PathCube objects
  const formatCube = (cube: any) => {
    if (Array.isArray(cube)) return debug.pos(cube[0], cube[1]);
    if (typeof cube === 'object' && 'row' in cube && 'col' in cube) {
      let dirInfo = '';
      if (cube.entry || cube.exit) {
        dirInfo = `(${cube.entry || '-'}→${cube.exit || '-'})`;
      }
      return debug.pos(cube.row, cube.col, dirInfo);
    }
    return 'unknown';
  };
  
  // Show max 3 items with count
  const prefix = message.length > 0 ? `${message}: ` : '';
  const count = pathCubes.length;
  const truncated = pathCubes.slice(0, 3).map(formatCube).join('→');
  const suffix = count > 3 ? `...+${count-3}` : '';
  
  console.log(`${prefix}${truncated}${suffix}`);
};

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
 * Uses ultra-compact logging
 */
export const findConnectedCubes = (
  grid: GridCell[][],
  startRow: number,
  startCol: number
): [number, number][] => {
  if (!grid[startRow][startCol].hasCube) {
    return [];
  }

  // Check cache first
  const cacheKey = `${startRow},${startCol}`;
  if (connectedCubesCache.has(cacheKey)) {
    return connectedCubesCache.get(cacheKey)!;
  }

  // Ultra-compact logging of starting point
  console.log(`FC:${startRow},${startCol}`);

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
            queue.push([newRow, newCol]);
          }
        }
      }
    }
  }

  // Ultra-compact result logging
  console.log(`FC:${connectedCubes.length}□`);
  
  if (connectedCubes.length <= 5) {
    console.log(`FC:{${connectedCubes.map(([r,c]) => `${r},${c}`).join('|')}}`);
  } else {
    console.log(`FC:{${connectedCubes.slice(0,3).map(([r,c]) => `${r},${c}`).join('|')}...+${connectedCubes.length-3}}`);
  }
  
  // Cache the result
  connectedCubesCache.set(cacheKey, connectedCubes);
  
  return connectedCubes;
};

/**
 * Clears the connected cubes cache
 */
export const clearConnectedCubesCache = () => {
  connectedCubesCache.clear();
};

/**
 * Traces a path through connected cubes and sets entry/exit points with ultra-compact logging
 */
const tracePathAndSetConnections = (
  grid: GridCell[][],
  connectedCubes: [number, number][]
) => {
  if (connectedCubes.length <= 1) return connectedCubes;
  
  // Find endpoints (cubes with only one connection)
  const endpoints = findEndpointCubes(grid, connectedCubes);
  
  if (endpoints.length !== 2) {
    console.log(`EP:${endpoints.length}≠2`);
    return connectedCubes;
  }
  
  // Ultra-compact endpoint logging
  console.log(`EP:${endpoints.map(([r,c]) => `${r},${c}`).join('|')}`);
  
  // Check if connections are already defined for all cubes in this component
  const allConnectionsDefined = connectedCubes.every(([row, col]) => {
    const cube = grid[row][col];
    return cube.connections.entry !== null || cube.connections.exit !== null;
  });
  
  // If all connections are already defined, respect them and skip automatic tracing
  if (allConnectionsDefined) {
    console.log("Flow path already defined, respecting existing connections");
    
    // Validate the existing connections for consistency
    for (const [row, col] of connectedCubes) {
      const cube = grid[row][col];
      console.log(`Analyzing path cube: [${row}, ${col}] entry: ${cube.connections.entry}, exit: ${cube.connections.exit}`);
    }
    
    return connectedCubes;
  }
  
  // Find a path through all cubes
  const visited = new Set<string>();
  const path: [number, number][] = [];
  const queue: [number, number][] = [[endpoints[0][0], endpoints[0][1]]];
  
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
  
  // Ultra-compact path logging
  const pathStr = path.length <= 4 
    ? path.map(([r,c]) => `${r},${c}`).join('→')
    : `${path.length}□:${path[0][0]},${path[0][1]}→${path[1][0]},${path[1][1]}→...→${path[path.length-1][0]},${path[path.length-1][1]}`;
  console.log(`FLOW:${pathStr}`);
  
  // Detect if this is a U-shape configuration based on path analysis
  const isUShape = isLikelyUShape(path);
  if (isUShape) {
    console.log(`U-SHAPE DETECTED with ${path.length} cubes from [${path[0][0]},${path[0][1]}] to [${path[path.length-1][0]},${path[path.length-1][1]}]`);
  }
  
  // Create a mapping for each cube in the path to know its position within the path
  const positionMap = new Map<string, number>();
  path.forEach(([r, c], idx) => {
    positionMap.set(`${r},${c}`, idx);
  });
  
  // Set entry and exit points for each cube in the path - enforcing straight through flow
  for (let i = 0; i < path.length; i++) {
    const [row, col] = path[i];
    const cube = grid[row][col];
    
    if (i === 0) {
      // First cube (endpoint) - should have one connecting cube
      const [nextRow, nextCol] = path[i + 1];
      
      // Determine direction toward the next cube
      let exitDir: CompassDirection | null = null;
      
      if (nextRow < row) exitDir = 'N';
      else if (nextRow > row) exitDir = 'S';
      else if (nextCol < col) exitDir = 'W';
      else if (nextCol > col) exitDir = 'E';
      
      // For the first cube, we need to pick an entry that creates a straight-through flow
      // This means the entry should be opposite to the exit
      let entryDir = getOppositeDirection(exitDir);
      
      cube.connections = {
        entry: entryDir,
        exit: exitDir
      };
      
      console.log(`FIRST CUBE [${row},${col}]: Entry=${entryDir}, Exit=${exitDir} (Enforcing straight-through)`);
    } else if (i === path.length - 1) {
      // Last cube (endpoint) - should have one connecting cube
      const [prevRow, prevCol] = path[i - 1];
      
      // Determine entry direction from the previous cube
      let entryDir: CompassDirection | null = null;
      
      if (prevRow < row) entryDir = 'N';
      else if (prevRow > row) entryDir = 'S';
      else if (prevCol < col) entryDir = 'W';
      else if (prevCol > col) entryDir = 'E';
      
      // For the last cube, we need to pick an exit that creates a straight-through flow
      // This means the exit should be opposite to the entry
      let exitDir = getOppositeDirection(entryDir);
      
      cube.connections = {
        entry: entryDir,
        exit: exitDir
      };
      
      console.log(`LAST CUBE [${row},${col}]: Entry=${entryDir}, Exit=${exitDir} (Enforcing straight-through)`);
    } else {
      // Middle cube - must have exactly two connecting cubes
      const [prevRow, prevCol] = path[i - 1];
      const [nextRow, nextCol] = path[i + 1];
      
      // Determine entry direction from the previous cube
      let entryDir: CompassDirection | null = null;
      
      if (prevRow < row) entryDir = 'N';
      else if (prevRow > row) entryDir = 'S';
      else if (prevCol < col) entryDir = 'W';
      else if (prevCol > col) entryDir = 'E';
      
      // Determine exit direction to the next cube
      let exitDir: CompassDirection | null = null;
      
      if (nextRow < row) exitDir = 'N';
      else if (nextRow > row) exitDir = 'S';
      else if (nextCol < col) exitDir = 'W';
      else if (nextCol > col) exitDir = 'E';
      
      // Check if this is a turn (non-straight through flow)
      const isStraightThrough = (
        (entryDir === 'N' && exitDir === 'S') ||
        (entryDir === 'S' && exitDir === 'N') ||
        (entryDir === 'E' && exitDir === 'W') ||
        (entryDir === 'W' && exitDir === 'E')
      );
      
      // If it's not a straight through, we need to determine if this is a corner
      const isCorner = !isStraightThrough;
      
      if (isCorner) {
        console.log(`CORNER CUBE [${row},${col}]: Entry=${entryDir}, Exit=${exitDir}`);
      } else {
        console.log(`STRAIGHT CUBE [${row},${col}]: Entry=${entryDir}, Exit=${exitDir}`);
      }
      
      cube.connections = {
        entry: entryDir,
        exit: exitDir
      };
    }
  }
  
  // Debug output of entire path with connections
  if (debugFlags.SHOW_FLOW_PATHS) {
    const pathWithConnections = path.map(([r, c]) => ({
      row: r,
      col: c,
      entry: grid[r][c].connections?.entry,
      exit: grid[r][c].connections?.exit
    }));
    
    console.log(`Analyzing path:`, pathWithConnections);
    
    // Count corners for verification
    let cornerCount = 0;
    for (let i = 1; i < path.length - 1; i++) {
      const [row, col] = path[i];
      const cube = grid[row][col];
      const flow = `${cube.connections.entry}→${cube.connections.exit}`;
      if (!STRAIGHT_PATHS.has(flow)) {
        cornerCount++;
      }
    }
    
    // Report corner count for verification
    if (cornerCount > 0) {
      console.log(`CORNERS:${cornerCount}`);
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
 * Validates the irrigation path through the grid with ultra-compact logging
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
  
  // Find all connected components - ultra-compact logging
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
  
  // Allow multiple disconnected components as separate valid irrigation paths
  console.log(`PATH: ${components.length} irrigation path(s) found`);
  
  // Validate each cube has at most 2 connections
  for (const [row, col] of allCubes) {
    if (!hasValidConnectionCount(grid, row, col)) {
      console.log(`INV:${debug.pos(row,col)}>2conn`);
      return false;
    }
  }
  
  // Process each component separately
  for (const component of components) {
    // Trace the path and set entry/exit points for this component
    tracePathAndSetConnections(grid, component);
  }
  
  // Validate connections between cubes - ultra-compact validation
  let isValid = true;
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      if (grid[row][col].hasCube) {
        const cube = grid[row][col];
        
        // Debug: Check if this cube follows the straight-through flow constraint
        if (cube.connections.entry && cube.connections.exit) {
          const flow = `${cube.connections.entry}→${cube.connections.exit}`;
          const isStraightThrough = STRAIGHT_PATHS.has(flow);
          console.log(`FLOW CHECK [${row},${col}]: ${flow} - Straight Through: ${isStraightThrough}`);
          
          // Check adjacent cubes for flow continuity
          let nextRow = row;
          let nextCol = col;
          
          switch (cube.connections.exit) {
            case 'N': nextRow--; break;
            case 'S': nextRow++; break;
            case 'E': nextCol++; break;
            case 'W': nextCol--; break;
          }
          
          // If next position is within grid and has a cube
          if (nextRow >= 0 && nextRow < grid.length && 
              nextCol >= 0 && nextCol < grid[0].length && 
              grid[nextRow][nextCol].hasCube) {
            
            const nextCube = grid[nextRow][nextCol];
            const oppositeExit = getOppositeDirection(cube.connections.exit);
            
            console.log(`CONTINUITY CHECK: [${row},${col}]→[${nextRow},${nextCol}] | Exit: ${cube.connections.exit}, Next Entry: ${nextCube.connections.entry}`);
            
            if (nextCube.connections.entry !== oppositeExit) {
              console.log(`FLOW MISMATCH: [${row},${col}]→[${nextRow},${nextCol}] | Exit: ${cube.connections.exit}, Expected Entry: ${oppositeExit}, Actual: ${nextCube.connections.entry}`);
              
              // Automatically fix the flow mismatch
              if (debugFlags.AUTO_FIX_FLOW_MISMATCHES) {
                nextCube.connections.entry = oppositeExit;
                console.log(`AUTO-FIXED: Set [${nextRow},${nextCol}] entry to ${oppositeExit}`);
              } else {
                isValid = false;
              }
            }
          }
        }
        
        // Validate entry connection
        if (cube.connections.entry && !validateConnection(grid, row, col, cube.connections.entry)) {
          console.log(`INV:${debug.pos(row,col)}|entry:${cube.connections.entry}`);
          isValid = false;
        }
        
        // Validate exit connection
        if (cube.connections.exit && !validateConnection(grid, row, col, cube.connections.exit)) {
          console.log(`INV:${debug.pos(row,col)}|exit:${cube.connections.exit}`);
          isValid = false;
        }
      }
    }
  }
  
  return isValid;
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
        console.log(`Valid corner connection detected: ${adjacentExit} → ${oppositeDir}`);
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
        console.log(`Valid corner connection detected: ${direction} → ${adjacentEntry}`);
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Check if a path likely forms a U-shape based on path topology
 */
const isLikelyUShape = (path: [number, number][]): boolean => {
  // Need at least 5 cubes for a U-shape
  if (path.length < 5) {
    console.log(`U-SHAPE DETECTION: Path length ${path.length} < 5, not a U-shape`);
    return false;
  }
  
  // Get first and last cube (endpoints)
  const [startRow, startCol] = path[0];
  const [endRow, endCol] = path[path.length - 1];
  
  // Check if endpoints are in the same row or column
  const sameRow = startRow === endRow;
  const sameCol = startCol === endCol;
  
  // For a U-shape, endpoints should be in the same row or column
  // and separated by at least 2 units
  const rowDistance = Math.abs(startRow - endRow);
  const colDistance = Math.abs(startCol - endCol);
  
  // For a true U-shape, we need:
  // 1. Endpoints in same row or same column
  // 2. Sufficient distance between endpoints
  // 3. Path length should be at least 5 (to have enough cubes for a U)
  const endpointsSuggestUShape = 
    ((sameRow && colDistance >= 2) || (sameCol && rowDistance >= 2));
  
  // Additional check: For a U-shape, we should have exactly 2 turns (corners)
  // Count the number of direction changes in the path
  let directionChanges = 0;
  let prevDirection = '';
  
  for (let i = 1; i < path.length; i++) {
    const [prevRow, prevCol] = path[i-1];
    const [currRow, currCol] = path[i];
    
    let currentDirection = '';
    if (currRow < prevRow) currentDirection = 'N';
    else if (currRow > prevRow) currentDirection = 'S';
    else if (currCol < prevCol) currentDirection = 'W';
    else if (currCol > prevCol) currentDirection = 'E';
    
    if (prevDirection && currentDirection !== prevDirection) {
      directionChanges++;
    }
    
    prevDirection = currentDirection;
  }
  
  // A U-shape should have exactly 2 direction changes
  const hasCorrectTurns = directionChanges === 2;
  
  console.log(`U-SHAPE DETECTION: Endpoints at [${startRow},${startCol}] and [${endRow},${endCol}]`);
  console.log(`  Same row: ${sameRow}, Same column: ${sameCol}`);
  console.log(`  Row distance: ${rowDistance}, Column distance: ${colDistance}`);
  console.log(`  Direction changes: ${directionChanges}`);
  console.log(`  Endpoints suggest U-shape: ${endpointsSuggestUShape}`);
  console.log(`  Has correct turns: ${hasCorrectTurns}`);
  
  // Combine all criteria for final decision
  const isUShape = endpointsSuggestUShape && hasCorrectTurns;
  console.log(`  FINAL U-SHAPE DECISION: ${isUShape}`);
  
  return isUShape;
};
