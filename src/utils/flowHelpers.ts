import { CompassDirection } from '@/utils/core/types';
import { GridCell } from '@/components/types';

export interface VisualConnections {
  visualEntry: CompassDirection | null;
  visualExit: CompassDirection | null;
  verticalLinePosition: 'west' | 'east';  // Which side vertical lines should be placed on
}

// Helper to get opposite direction
const getOppositeDirection = (direction: CompassDirection): CompassDirection => {
  switch (direction) {
    case 'N': return 'S';
    case 'S': return 'N';
    case 'E': return 'W';
    case 'W': return 'E';
  }
};

export function getVisualConnections(
  grid: GridCell[][],
  row: number,
  col: number,
  cell: GridCell
): VisualConnections {
  // Start with the cell's own connections
  let entry = cell.connections?.entry || null;
  let exit = cell.connections?.exit || null;

  // If we have both entry and exit, and they're not the same, we're done
  if (entry && exit && entry !== exit) {
    return {
      visualEntry: entry,
      visualExit: exit,
      verticalLinePosition: determineVerticalLinePosition(grid, row, col, entry, exit)
    };
  }

  // Find all connected neighbors
  const connections: CompassDirection[] = [];
  if (row > 0 && grid[row - 1][col].hasCube) connections.push('N');
  if (row < grid.length - 1 && grid[row + 1][col].hasCube) connections.push('S');
  if (col > 0 && grid[row][col - 1].hasCube) connections.push('W');
  if (col < grid[0].length - 1 && grid[row][col + 1].hasCube) connections.push('E');

  // If we have exactly two connections, use those
  if (connections.length === 2) {
    // For a corner piece, the order matters
    // We want to ensure the flow goes from the first connection to the second
    if (entry) {
      // If we have an entry point, use it and set exit to the other connection
      exit = connections.find(dir => dir !== entry) || null;
    } else if (exit) {
      // If we have an exit point, use it and set entry to the other connection
      entry = connections.find(dir => dir !== exit) || null;
    } else {
      // If we have neither, determine based on position in the grid
      // For corners, we want the flow to go clockwise
      const [first, second] = connections;
      if (isClockwiseCorner(first, second)) {
        entry = first;
        exit = second;
      } else {
        entry = second;
        exit = first;
      }
    }
  } else if (connections.length === 1) {
    // For end pieces, set entry and exit to opposite directions
    const connection = connections[0];
    
    // If we have an entry point, use it and set exit to the opposite
    if (entry) {
      exit = getOppositeDirection(entry);
    }
    // If we have an exit point, use it and set entry to the opposite
    else if (exit) {
      entry = getOppositeDirection(exit);
    }
    // If we have neither, use the connection and its opposite
    else {
      // For vertical connections (N/S), we want flow to go N->S
      // For horizontal connections (E/W), we want flow to go W->E
      if (connection === 'N' || connection === 'W') {
        entry = connection;
        exit = getOppositeDirection(connection);
      } else {
        exit = connection;
        entry = getOppositeDirection(connection);
      }
    }
  }

  // Determine vertical line position
  const verticalLinePosition = determineVerticalLinePosition(grid, row, col, entry, exit);

  return { visualEntry: entry, visualExit: exit, verticalLinePosition };
}

function isClockwiseCorner(dir1: CompassDirection, dir2: CompassDirection): boolean {
  const clockwisePairs = [
    ['W', 'N'],
    ['N', 'E'],
    ['E', 'S'],
    ['S', 'W']
  ];
  return clockwisePairs.some(([d1, d2]) => dir1 === d1 && dir2 === d2);
}

function determineVerticalLinePosition(
  grid: GridCell[][],
  row: number,
  col: number,
  entry: CompassDirection | null,
  exit: CompassDirection | null
): 'west' | 'east' {
  // Default to west side
  let position: 'west' | 'east' = 'west';

  // For U-shapes, place vertical lines on the inner side
  const isUShape = () => {
    // Find all connected cubes
    const connectedCubes: [number, number][] = [];
    const visited = new Set<string>();
    const queue: [number, number][] = [[row, col]];

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (grid[r][c].hasCube) {
        connectedCubes.push([r, c]);
        // Check neighbors
        if (r > 0 && grid[r - 1][c].hasCube) queue.push([r - 1, c]);
        if (r < grid.length - 1 && grid[r + 1][c].hasCube) queue.push([r + 1, c]);
        if (c > 0 && grid[r][c - 1].hasCube) queue.push([r, c - 1]);
        if (c < grid[0].length - 1 && grid[r][c + 1].hasCube) queue.push([r, c + 1]);
      }
    }

    // Check if any cube is more than 1 step away (indicating a U-shape)
    return connectedCubes.length >= 3 && 
      connectedCubes.some(([r, c]) => Math.abs(r - row) > 1 || Math.abs(c - col) > 1);
  };

  if (isUShape()) {
    // For vertical pieces in U-shape
    if (entry === 'N' || entry === 'S' || exit === 'N' || exit === 'S') {
      const isLeftSide = col <= Math.floor(grid[0].length / 2);
      position = isLeftSide ? 'east' : 'west';
    }
    // For horizontal pieces (bottom of U)
    else {
      const isLeftHalf = col < Math.floor(grid[0].length / 2);
      position = isLeftHalf ? 'east' : 'west';
    }
  }
  // For corners connecting to east, keep line on east side
  else if (entry === 'E' || exit === 'E') {
    position = 'east';
  }
  // For corners connecting to west, keep line on west side
  else if (entry === 'W' || exit === 'W') {
    position = 'west';
  }
  // For vertical straight sections
  else if ((entry === 'N' && exit === 'S') || (entry === 'S' && exit === 'N')) {
    // Check adjacent cubes for their connections
    if (col > 0 && grid[row][col - 1].hasCube) {
      const westCube = grid[row][col - 1];
      if (westCube.connections?.exit === 'E' || westCube.connections?.entry === 'E') {
        position = 'east';
      }
    }
    if (col < grid[0].length - 1 && grid[row][col + 1].hasCube) {
      const eastCube = grid[row][col + 1];
      if (eastCube.connections?.exit === 'W' || eastCube.connections?.entry === 'W') {
        position = 'west';
      }
    }
  }

  return position;
} 