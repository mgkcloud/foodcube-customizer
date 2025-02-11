import { GridCell, CompassDirection } from '../core/types';

/**
 * Checks if a cube has a valid number of connections (0, 1, or 2)
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

/**
 * Finds all cubes connected to the starting cube
 */
/**
 * Sets the entry and exit connections for a cube based on its position in the flow
 */
const setCubeConnections = (grid: GridCell[][], row: number, col: number, visited: Set<string>) => {
  const directions: CompassDirection[] = ['N', 'S', 'E', 'W'];
  const connections: CompassDirection[] = [];

  // Find all connected directions
  directions.forEach(dir => {
    let nextRow = row;
    let nextCol = col;
    
    switch (dir) {
      case 'N': nextRow--; break;
      case 'S': nextRow++; break;
      case 'E': nextCol++; break;
      case 'W': nextCol--; break;
    }
    
    if (nextRow >= 0 && nextRow < grid.length &&
        nextCol >= 0 && nextCol < grid[0].length &&
        grid[nextRow][nextCol].hasCube) {
      connections.push(dir);
    }
  });

  // Set entry and exit based on flow direction
  if (connections.length === 1) {
    // Endpoint - set based on position relative to the rest of the path
    const key = `${row},${col}`;
    if (!visited.has(key)) {
      // First endpoint - this is where flow enters
      grid[row][col].connections = {
        entry: connections[0],
        exit: connections[0]
      };
    } else {
      // Last endpoint - this is where flow exits
      grid[row][col].connections = {
        entry: connections[0],
        exit: connections[0]
      };
    }
  } else if (connections.length === 2) {
    // For middle cubes, we need to determine flow direction based on neighbors
    const [dir1, dir2] = connections;
    const key = `${row},${col}`;
    
    // Get positions of connected cubes
    let pos1Row = row, pos1Col = col;
    let pos2Row = row, pos2Col = col;
    
    switch (dir1) {
      case 'N': pos1Row--; break;
      case 'S': pos1Row++; break;
      case 'E': pos1Col++; break;
      case 'W': pos1Col--; break;
    }
    switch (dir2) {
      case 'N': pos2Row--; break;
      case 'S': pos2Row++; break;
      case 'E': pos2Col++; break;
      case 'W': pos2Col--; break;
    }

    // Check which neighbor is already visited to determine flow direction
    const pos1Key = `${pos1Row},${pos1Col}`;
    const pos2Key = `${pos2Row},${pos2Col}`;

    // Helper to check if two directions form a corner
    const isCornerTurn = (d1: CompassDirection, d2: CompassDirection) => {
      const opposites = { N: 'S', S: 'N', E: 'W', W: 'E' };
      return d1 !== opposites[d2];
    };

    // Helper to determine if a direction pair forms an L-shape
    const isLShape = (d1: CompassDirection, d2: CompassDirection) => {
      return (d1 === 'W' && d2 === 'S') || (d1 === 'N' && d2 === 'E');
    };

    if (visited.has(pos1Key)) {
      // Flow is from pos1 to pos2
      grid[row][col].connections = {
        entry: dir1,
        exit: dir2
      };
    } else if (visited.has(pos2Key)) {
      // Flow is from pos2 to pos1
      grid[row][col].connections = {
        entry: dir2,
        exit: dir1
      };
    } else {
      // Neither neighbor visited yet, determine flow based on configuration
      if (isLShape(dir1, dir2)) {
        // For L-shape, maintain the correct flow direction
        grid[row][col].connections = {
          entry: dir1,
          exit: dir2
        };
      } else if (isCornerTurn(dir1, dir2)) {
        // For other corners, maintain clockwise flow
        const clockwise = (dir1 === 'N' && dir2 === 'E') ||
                         (dir1 === 'E' && dir2 === 'S') ||
                         (dir1 === 'S' && dir2 === 'W') ||
                         (dir1 === 'W' && dir2 === 'N');
        grid[row][col].connections = clockwise ? {
          entry: dir1,
          exit: dir2
        } : {
          entry: dir2,
          exit: dir1
        };
      } else {
        // For straight sections, maintain consistent flow direction
        const straightFlow = (dir1 === 'W' && dir2 === 'E') ||
                            (dir1 === 'N' && dir2 === 'S');
        grid[row][col].connections = straightFlow ? {
          entry: dir1,
          exit: dir2
        } : {
          entry: dir2,
          exit: dir1
        };
      }
    }
  }
};

/**
 * Finds all cubes connected to the starting cube and sets their connections
 */
export const findConnectedCubes = (grid: GridCell[][], startRow: number, startCol: number): [number, number][] => {
  // Validate input parameters
  if (!grid || !Array.isArray(grid) || grid.length === 0 || !Array.isArray(grid[0])) {
    return [];
  }

  // Validate start position
  if (startRow < 0 || startRow >= grid.length || startCol < 0 || startCol >= grid[0].length) {
    return [];
  }

  // Validate that start position has a cube
  if (!grid[startRow][startCol]?.hasCube) {
    return [];
  }

  const visited = new Set<string>();
  const connected: [number, number][] = [];
  const queue: [number, number][] = [[startRow, startCol]];
  
  while (queue.length > 0) {
    const [row, col] = queue.shift()!;
    const key = `${row},${col}`;
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    if (grid[row][col]?.hasCube) {
      connected.push([row, col]);
      setCubeConnections(grid, row, col, visited);
      
      // Check all adjacent cells
      const directions: CompassDirection[] = ['N', 'S', 'E', 'W'];
      directions.forEach(dir => {
        let nextRow = row;
        let nextCol = col;
        
        switch (dir) {
          case 'N': nextRow--; break;
          case 'S': nextRow++; break;
          case 'E': nextCol++; break;
          case 'W': nextCol--; break;
        }
        
        // Validate next position is within bounds and has a cube
        if (nextRow >= 0 && nextRow < grid.length &&
            nextCol >= 0 && nextCol < grid[0].length &&
            grid[nextRow][nextCol]?.hasCube) {
          queue.push([nextRow, nextCol]);
        }
      });
    }
  }
  
  return connected;
}

/**
 * Validates that the irrigation path is valid:
 * - No T-shaped configurations
 * - All cubes have 0, 1, or 2 connections
 * - All cubes are connected in a valid path
 */
export const validateIrrigationPath = (grid: GridCell[][]): boolean => {
  // Find first cube
  let startCube: [number, number] | null = null;
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[0].length; j++) {
      if (grid[i][j].hasCube) {
        if (!hasValidConnectionCount(grid, i, j)) {
          return false; // Invalid connection count (T-shape)
        }
        if (!startCube) {
          startCube = [i, j];
        }
      }
    }
  }
  
  // If no cubes, configuration is valid
  if (!startCube) return true;
  
  // Get all connected cubes
  const connectedCubes = findConnectedCubes(grid, startCube[0], startCube[1]);
  
  // Count total cubes in grid
  let totalCubes = 0;
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[0].length; j++) {
      if (grid[i][j].hasCube) totalCubes++;
    }
  }
  
  // All cubes must be connected
  return connectedCubes.length === totalCubes;
}
