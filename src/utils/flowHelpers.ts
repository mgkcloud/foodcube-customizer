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
  const isUShape = row > 0 && row < grid.length - 1 &&
    grid[row - 1][col].hasCube && grid[row + 1][col].hasCube;
  
  if (isUShape) {
    const isLeftSide = col < Math.floor(grid[0].length / 2);
    position = isLeftSide ? 'east' : 'west';
  }
  // For corners connecting to east, keep line on east side
  else if (entry === 'E' || exit === 'E') {
    position = 'east';
  }
  // For corners connecting to west, keep line on west side
  else if (entry === 'W' || exit === 'W') {
    position = 'west';
  }
  // Check adjacent cubes for their connections
  else if (col > 0 && grid[row][col - 1].hasCube) {
    const westCube = grid[row][col - 1];
    if (westCube.connections?.exit === 'E' || westCube.connections?.entry === 'E') {
      position = 'east';
    }
  }

  return position;
} 