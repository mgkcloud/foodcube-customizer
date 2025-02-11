import { GridCell, CompassDirection } from '../core/types';

/**
 * Gets the next position in the grid based on a direction
 */
export const getNextPosition = (row: number, col: number, dir: CompassDirection): [number, number] => {
  const positions: Record<CompassDirection, [number, number]> = {
    N: [row - 1, col],
    S: [row + 1, col],
    E: [row, col + 1],
    W: [row, col - 1],
  };
  return positions[dir];
};

/**
 * Checks if a position is valid within the grid
 */
export const isValidPosition = (grid: GridCell[][], row: number, col: number): boolean => {
  return row >= 0 && row < grid.length && col >= 0 && col < grid[0].length;
};

/**
 * Checks if a cube exists at a given position
 */
export const hasCubeAt = (grid: GridCell[][], row: number, col: number): boolean => {
  return isValidPosition(grid, row, col) && grid[row][col].hasCube;
};

/**
 * Checks if there is an adjacent cube in the specified direction
 */
export const hasAdjacentCube = (grid: GridCell[][], row: number, col: number, direction: CompassDirection): boolean => {
  const [nextRow, nextCol] = getNextPosition(row, col, direction);
  return hasCubeAt(grid, nextRow, nextCol);
};

/**
 * Gets the opposite direction
 */
export const getOppositeDirection = (dir: CompassDirection): CompassDirection => {
  const opposites: Record<CompassDirection, CompassDirection> = {
    N: 'S',
    S: 'N',
    E: 'W',
    W: 'E'
  };
  return opposites[dir];
};
