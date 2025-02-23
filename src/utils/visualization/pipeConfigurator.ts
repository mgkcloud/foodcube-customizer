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
  connectedCubes: [number, number][]
): 'east' | 'west' => {
  // For U-shape, place vertical lines on the inner side
  const isUShape = connectedCubes.length >= 3 && 
    connectedCubes.some(([r, c]) => Math.abs(r - row) > 1 || Math.abs(c - col) > 1);
  
  if (isUShape) {
    const isLeftSide = col < Math.floor(grid[0].length / 2);
    return isLeftSide ? 'east' : 'west';
  }

  // For regular vertical lines, check adjacent cubes
  let shouldSwitchSide = false;
  
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

const configureCornerPipe = (entry: CompassDirection, exit: CompassDirection): SubgridState => {
  const subgrid = createEmptySubgrid();

  // Corner configurations
  if (entry === 'W' && exit === 'N') {
    subgrid[1][0] = true; // Horizontal part
    subgrid[0][0] = true; // Vertical part
  } else if (entry === 'W' && exit === 'S') {
    subgrid[1][0] = true; // Horizontal part
    subgrid[1][1] = true; // Vertical part
  } else if (entry === 'E' && exit === 'N') {
    subgrid[1][1] = true; // Horizontal part
    subgrid[0][1] = true; // Vertical part
  } else if (entry === 'E' && exit === 'S') {
    subgrid[1][1] = true; // Horizontal part
    subgrid[1][0] = true; // Vertical part
  } else if (entry === 'N' && exit === 'E') {
    subgrid[0][1] = true; // Vertical part
    subgrid[1][1] = true; // Horizontal part
  } else if (entry === 'N' && exit === 'W') {
    subgrid[0][0] = true; // Vertical part
    subgrid[1][0] = true; // Horizontal part
  } else if (entry === 'S' && exit === 'E') {
    subgrid[1][0] = true; // Vertical part
    subgrid[1][1] = true; // Horizontal part
  } else if (entry === 'S' && exit === 'W') {
    subgrid[1][1] = true; // Vertical part
    subgrid[1][0] = true; // Horizontal part
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
  const verticalLinePosition = calculateVerticalLinePosition(grid, row, col, connectedCubes);
  let subgrid = createEmptySubgrid();

  if (entry && exit) {
    if (entry === exit || 
       (isHorizontalDirection(entry) && isHorizontalDirection(exit)) ||
       (isVerticalDirection(entry) && isVerticalDirection(exit))) {
      subgrid = configureStraightPipe(entry, exit, verticalLinePosition);
    } else {
      subgrid = configureCornerPipe(entry, exit);
    }
  }

  return {
    subgrid,
    entry,
    exit,
    verticalLinePosition
  };
}; 