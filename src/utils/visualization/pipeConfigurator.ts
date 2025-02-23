import { CompassDirection } from '@/utils/core/types';
import { GridCell } from '@/components/types';

export type SubgridState = boolean[][];

interface PipeConfiguration {
  subgrid: SubgridState;
  entry: CompassDirection | null;
  exit: CompassDirection | null;
  verticalLinePosition: 'east' | 'west';
}

// Helper functions to determine flow type
const isHorizontalDirection = (dir: CompassDirection | null) => dir === 'W' || dir === 'E';
const isVerticalDirection = (dir: CompassDirection | null) => dir === 'N' || dir === 'S';

const createEmptySubgrid = (): SubgridState => [
  [false, false],
  [false, false]
];

const calculateVerticalLinePosition = (
  grid: GridCell[][],
  row: number,
  col: number,
  connectedCubes: [number, number][],
  cell: GridCell
): 'east' | 'west' => {
  // For U-shape, place vertical lines on the inner side
  const isUShape = connectedCubes.length >= 3 && 
    connectedCubes.some(([r, c]) => Math.abs(r - row) > 1 || Math.abs(c - col) > 1);
  
  if (isUShape) {
    // Find the center column of the U-shape
    const cols = connectedCubes.map(([_, c]) => c);
    const centerCol = Math.floor((Math.min(...cols) + Math.max(...cols)) / 2);
    
    // For vertical pieces (entry === 'N' || entry === 'S'), position based on side of U
    if (cell.connections?.entry === 'N' || cell.connections?.entry === 'S' ||
        cell.connections?.exit === 'N' || cell.connections?.exit === 'S') {
      return col <= centerCol ? 'east' : 'west';
    }
    
    // For horizontal pieces, check if we're at the bottom of the U
    const isBottom = row === Math.max(...connectedCubes.map(([r]) => r));
    if (isBottom) {
      // For bottom pieces, vertical line should be on the opposite side of the nearest vertical piece
      return col < centerCol ? 'east' : 'west';
    }
  }

  // For regular vertical lines, check adjacent cubes
  let shouldSwitchSide = false;
  
  // Check if the current cube is turning from N to S or S to N
  if ((cell.connections?.entry === 'N' && cell.connections?.exit === 'S') ||
      (cell.connections?.entry === 'S' && cell.connections?.exit === 'N')) {
    shouldSwitchSide = true;
  }
  
  // Check vertical neighbors
  if (row > 0 && grid[row - 1][col].hasCube) {
    const aboveCube = grid[row - 1][col];
    if (aboveCube.connections?.entry === 'E' || aboveCube.connections?.exit === 'E') {
      shouldSwitchSide = true;
    }
  }
  if (row < grid.length - 1 && grid[row + 1][col].hasCube) {
    const belowCube = grid[row + 1][col];
    if (belowCube.connections?.entry === 'E' || belowCube.connections?.exit === 'E') {
      shouldSwitchSide = true;
    }
  }

  // Check horizontal neighbors for corner turns
  if (col > 0 && grid[row][col - 1].hasCube) {
    const westCube = grid[row][col - 1];
    // If west neighbor is turning from S to E or E to S, we should be on east side
    if ((westCube.connections?.entry === 'S' && westCube.connections?.exit === 'E') ||
        (westCube.connections?.entry === 'E' && westCube.connections?.exit === 'S')) {
      shouldSwitchSide = true;
    }
    // If west neighbor is turning from N to E or E to N, we should be on east side
    if ((westCube.connections?.entry === 'N' && westCube.connections?.exit === 'E') ||
        (westCube.connections?.entry === 'E' && westCube.connections?.exit === 'N')) {
      shouldSwitchSide = true;
    }
  }
  if (col < grid[0].length - 1 && grid[row][col + 1].hasCube) {
    const eastCube = grid[row][col + 1];
    // If east neighbor is turning from S to W or W to S, we should be on east side
    if ((eastCube.connections?.entry === 'S' && eastCube.connections?.exit === 'W') ||
        (eastCube.connections?.entry === 'W' && eastCube.connections?.exit === 'S')) {
      shouldSwitchSide = true;
    }
    // If east neighbor is turning from N to W or W to N, we should be on east side
    if ((eastCube.connections?.entry === 'N' && eastCube.connections?.exit === 'W') ||
        (eastCube.connections?.entry === 'W' && eastCube.connections?.exit === 'N')) {
      shouldSwitchSide = true;
    }
  }
  
  return shouldSwitchSide ? 'east' : 'west';
};

const configureStraightPipe = (
  entry: CompassDirection,
  exit: CompassDirection,
  verticalLinePosition: 'east' | 'west'
): SubgridState => {
  const subgrid = createEmptySubgrid();
  
  if ((entry === 'N' && exit === 'S') || (entry === 'S' && exit === 'N')) {
    // Vertical line
    const col = verticalLinePosition === 'east' ? 1 : 0;
    subgrid[0][col] = true;
    subgrid[1][col] = true;
  } else if ((entry === 'E' && exit === 'W') || (entry === 'W' && exit === 'E')) {
    // Horizontal line - always use bottom row
    subgrid[1][0] = true;
    subgrid[1][1] = true;
  }
  
  return subgrid;
};

const configureCornerPipe = (
  entry: CompassDirection, 
  exit: CompassDirection,
  verticalLinePosition: 'east' | 'west'
): SubgridState => {
  const subgrid = createEmptySubgrid();
  const verticalCol = verticalLinePosition === 'east' ? 1 : 0;

  // Corner configurations
  if (entry === 'W' && exit === 'N') {
    subgrid[1][0] = true; // Horizontal part (always from west)
    subgrid[0][verticalCol] = true; // Vertical part (position based on parameter)
  } else if (entry === 'W' && exit === 'S') {
    subgrid[1][0] = true; // Horizontal part (always from west)
    subgrid[1][verticalCol] = true; // Vertical part (position based on parameter)
  } else if (entry === 'E' && exit === 'N') {
    subgrid[1][1] = true; // Horizontal part (always from east)
    subgrid[0][verticalCol] = true; // Vertical part (position based on parameter)
  } else if (entry === 'E' && exit === 'S') {
    subgrid[1][1] = true; // Horizontal part (always from east)
    subgrid[1][verticalCol] = true; // Vertical part (position based on parameter)
  } else if (entry === 'N' && exit === 'E') {
    subgrid[0][verticalCol] = true; // Vertical part (position based on parameter)
    subgrid[1][1] = true; // Horizontal part (always to east)
  } else if (entry === 'N' && exit === 'W') {
    subgrid[0][verticalCol] = true; // Vertical part (position based on parameter)
    subgrid[1][0] = true; // Horizontal part (always to west)
  } else if (entry === 'S' && exit === 'E') {
    subgrid[1][verticalCol] = true; // Vertical part (position based on parameter)
    subgrid[1][1] = true; // Horizontal part (always to east)
  } else if (entry === 'S' && exit === 'W') {
    subgrid[1][verticalCol] = true; // Vertical part (position based on parameter)
    subgrid[1][0] = true; // Horizontal part (always to west)
  }

  return subgrid;
};

export const calculatePipeConfiguration = (
  grid: GridCell[][],
  row: number,
  col: number,
  cell: GridCell,
  connectedCubes: [number, number][],
  entry: CompassDirection | null,
  exit: CompassDirection | null
): PipeConfiguration => {
  const verticalLinePosition = calculateVerticalLinePosition(grid, row, col, connectedCubes, cell);
  let subgrid = createEmptySubgrid();

  if (entry && exit) {
    if ((isHorizontalDirection(entry) && isHorizontalDirection(exit)) ||
        (isVerticalDirection(entry) && isVerticalDirection(exit) && entry !== exit)) {
      subgrid = configureStraightPipe(entry, exit, verticalLinePosition);
    } else {
      subgrid = configureCornerPipe(entry, exit, verticalLinePosition);
    }
  }

  return {
    subgrid,
    entry,
    exit,
    verticalLinePosition
  };
}; 