import { GridCell, CompassDirection } from '../core/types';
import { STRAIGHT_PATHS, VALID_TURNS } from '../core/irrigationRules';
import { isValidPosition, getOppositeDirection } from '../shared/gridUtils';
import { findConnectedCubes } from './flowValidator';

/**
 * Validates if a cell has valid entry/exit points
 */
export const hasValidConnections = (cell: GridCell): boolean => {
  return cell.hasCube && 
         cell.connections?.entry != null && 
         cell.connections?.exit != null;
};

/**
 * Validates if a flow direction is valid
 */
export const hasValidFlow = (entry: CompassDirection, exit: CompassDirection): boolean => {
  const flow = `${entry}→${exit}`;
  return STRAIGHT_PATHS.has(flow) || VALID_TURNS.has(flow);
};

/**
 * Validates if two flows are continuous
 */
export const isContinuousFlow = (prevExit: CompassDirection, nextEntry: CompassDirection): boolean => {
  return getOppositeDirection(prevExit) === nextEntry;
};

/**
 * Counts incoming connections to a position
 */
export const countIncomingConnections = (grid: GridCell[][], row: number, col: number): number => {
  let count = 0;
  ['N', 'S', 'E', 'W'].forEach((dir) => {
    const direction = dir as CompassDirection;
    const opposite = getOppositeDirection(direction);
    const [nextRow, nextCol] = [
      row + (direction === 'S' ? -1 : direction === 'N' ? 1 : 0),
      col + (direction === 'W' ? 1 : direction === 'E' ? -1 : 0)
    ];
    
    if (isValidPosition(grid, nextRow, nextCol)) {
      const neighbor = grid[nextRow][nextCol];
      if (neighbor.hasCube && neighbor.connections?.exit === opposite) {
        count++;
      }
    }
  });
  return count;
};

/**
 * Validates an entire configuration path
 */
export const isValidConfiguration = (grid: GridCell[][]): boolean => {
  // Find all cubes in the grid
  const allCubes: Array<[number, number]> = [];
  grid.forEach((row, i) => {
    row.forEach((cell, j) => {
      if (cell.hasCube) {
        allCubes.push([i, j]);
      }
    });
  });

  if (allCubes.length === 0) return true;

  // Start from the first cube and find all connected cubes
  const [startRow, startCol] = allCubes[0];
  const connectedCubes = findConnectedCubes(grid, startRow, startCol);

  // All cubes should be connected
  return connectedCubes.length === allCubes.length;
};
