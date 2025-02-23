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
 * Checks if a configuration forms a U-shape by analyzing grid distances
 */
const isUShape = (grid: GridCell[][], startRow: number, startCol: number): boolean => {
  const visited = new Set<string>();
  const connectedCubes: [number, number][] = [];
  const queue: [number, number][] = [[startRow, startCol]];

  // Simple BFS to find connected cubes
  while (queue.length > 0) {
    const [row, col] = queue.shift()!;
    const key = `${row},${col}`;
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    if (grid[row][col]?.hasCube) {
      connectedCubes.push([row, col]);
      
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
        
        if (nextRow >= 0 && nextRow < grid.length &&
            nextCol >= 0 && nextCol < grid[0].length &&
            grid[nextRow][nextCol]?.hasCube) {
          queue.push([nextRow, nextCol]);
        }
      });
    }
  }

  // Check if any cube is more than 1 step away (indicating a U-shape)
  return connectedCubes.length >= 3 && 
    connectedCubes.some(([r, c]) => 
      Math.abs(r - startRow) > 1 || Math.abs(c - startCol) > 1
    );
};

/**
 * Finds all cubes connected to the starting cube
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
        
        if (nextRow >= 0 && nextRow < grid.length &&
            nextCol >= 0 && nextCol < grid[0].length &&
            grid[nextRow][nextCol]?.hasCube) {
          queue.push([nextRow, nextCol]);
        }
      });
    }
  }

  // Now that we have all connected cubes, set their connections
  connected.forEach(([row, col]) => {
    setCubeConnections(grid, row, col, visited, connected);
  });
  
  return connected;
}

/**
 * Sets the entry and exit connections for a cube based on its position in the flow
 */
const setCubeConnections = (
  grid: GridCell[][],
  row: number,
  col: number,
  visited: Set<string>,
  connectedCubes: [number, number][]
) => {
  const directions: CompassDirection[] = ['N', 'S', 'E', 'W'];

  // Get connected directions
  const connections = directions.filter(dir => {
    let newRow = row, newCol = col;
    switch (dir) {
      case 'N': newRow--; break;
      case 'S': newRow++; break;
      case 'E': newCol++; break;
      case 'W': newCol--; break;
    }
    return newRow >= 0 && newRow < grid.length &&
           newCol >= 0 && newCol < grid[0].length &&
           grid[newRow][newCol].hasCube;
  });

  // Helper to find the leftmost cube in a straight line
  const findLeftmostCube = () => {
    return connectedCubes.reduce((leftmost, [r, c]) => 
      c < leftmost[1] ? [r, c] : leftmost
    , connectedCubes[0]);
  };

  // Helper to find the topmost cube in a straight line
  const findTopmostCube = () => {
    return connectedCubes.reduce((topmost, [r, c]) => 
      r < topmost[0] ? [r, c] : topmost
    , connectedCubes[0]);
  };

  // Helper to determine if this is a corner piece
  const isCornerPiece = () => {
    return connections.length === 2 && 
      !((connections[0] === 'N' && connections[1] === 'S') ||
        (connections[0] === 'S' && connections[1] === 'N') ||
        (connections[0] === 'E' && connections[1] === 'W') ||
        (connections[0] === 'W' && connections[1] === 'E'));
  };

  // Helper to determine if this is the start of an L-shape
  const isStartOfL = () => {
    if (!isCornerPiece()) return false;
    const [leftmostRow, leftmostCol] = findLeftmostCube();
    const [topmostRow, topmostCol] = findTopmostCube();
    return row === leftmostRow && col === leftmostCol;
  };

  // Set entry and exit based on flow direction
  if (connections.length === 1) {
    // Endpoint - set entry and exit based on position
    const dir = connections[0];
    const [leftmostRow, leftmostCol] = findLeftmostCube();
    const [topmostRow, topmostCol] = findTopmostCube();

    // For L-shape, ensure consistent flow from left to right, then down
    if (isStartOfL()) {
      grid[row][col].connections = {
        entry: 'W',
        exit: 'E'
      };
    } else {
      // For straight lines, always flow from left to right or top to bottom
      if (dir === 'N' || dir === 'S') {
        // Vertical line
        const isTop = row === topmostRow;
        grid[row][col].connections = {
          entry: isTop ? 'N' : 'S',
          exit: isTop ? 'S' : 'N'
        };
      } else {
        // Horizontal line
        const isLeft = col === leftmostCol;
        grid[row][col].connections = {
          entry: isLeft ? 'W' : 'E',
          exit: isLeft ? 'E' : 'W'
        };
      }
    }
  } else if (connections.length === 2) {
    const [dir1, dir2] = connections;
    const opposites = { N: 'S', S: 'N', E: 'W', W: 'E' } as const;
    const isOpposite = (d1: CompassDirection, d2: CompassDirection) => 
      opposites[d1] === d2;

    if (isOpposite(dir1, dir2)) {
      // For straight sections, ensure consistent flow direction
      const [leftmostRow, leftmostCol] = findLeftmostCube();
      const [topmostRow, topmostCol] = findTopmostCube();

      if (dir1 === 'N' || dir1 === 'S') {
        // Vertical straight section - flow top to bottom
        grid[row][col].connections = {
          entry: row === topmostRow ? 'N' : 'S',
          exit: row === topmostRow ? 'S' : 'N'
        };
      } else {
        // Horizontal straight section - flow left to right
        grid[row][col].connections = {
          entry: col === leftmostCol ? 'W' : 'E',
          exit: col === leftmostCol ? 'E' : 'W'
        };
      }
    } else {
      // For L-shape corners, ensure consistent flow
      const [leftmostRow, leftmostCol] = findLeftmostCube();
      const [topmostRow, topmostCol] = findTopmostCube();
      
      if (isStartOfL()) {
        // Start of L-shape - flow from left to right
        grid[row][col].connections = {
          entry: 'W',
          exit: 'E'
        };
      } else if (row === topmostRow) {
        // Top of L-shape - flow from left to right
        grid[row][col].connections = {
          entry: 'W',
          exit: 'E'
        };
      } else {
        // Vertical part of L-shape - flow top to bottom
        grid[row][col].connections = {
          entry: 'N',
          exit: 'S'
        };
      }
    }
  }
};

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

